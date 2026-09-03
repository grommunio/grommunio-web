Ext.namespace('Zarafa.common.ui.messagepanel');

/**
 * @class Zarafa.common.ui.messagepanel.AttachmentLinks
 * @extends Ext.DataView
 * @xtype zarafa.attachmentlinks
 *
 * If the {@link Zarafa.core.plugins.RecordComponentUpdaterPlugin} is installed
 * in the {@link #plugins} array of this component, this component will automatically
 * load the {@link Zarafa.core.data.MAPIRecord record} into the component.
 * Otherwise the user of this component needs to call {@link #setRecord}.
 */
Zarafa.common.ui.messagepanel.AttachmentLinks = Ext.extend(Ext.DataView, {
	/**
	 * @cfg {Number} maximum length of text allowed before truncations,
	 * truncation will be replaced with ellipsis ('...').
	 */
	ellipsisStringStartLength: 20,

	/**
	 * @cfg {Number} maximum length of text allowed after truncations,
	 * truncation will be replaced with ellipsis ('...').
	 */
	ellipsisStringEndLength: 20,

	/**
	 * @cfg {Number} maxHeight The maximum height the element which holds all
	 * recipient is allowed to take before a scrollbar will be shown.
	 */
	maxHeight: 72,

	/**
	 * The custom {@link DataTransfer} MIME type under which the attachment
	 * payload is exposed while dragging an attachment out of grommunio Web. A
	 * cooperating receiving web application reads this type on drop and
	 * reconstructs the file. The value is a JSON string of the form
	 * <tt>{name, type, size, data}</tt> where <tt>data</tt> is the base64
	 * encoded file content.
	 *
	 * Must match {@link Zarafa.common.attachment.AttachmentDragDrop#payloadType},
	 * which reads the payload when the drop lands in grommunio Web itself.
	 * @property {String}
	 * @private
	 */
	attachmentDragOutType: 'application/x-grommunio-attachment',

	/**
	 * Cache of base64 encoded attachment payloads, keyed by
	 * {@link #getAttachmentCacheKey}. Each entry is
	 * <tt>{payload: String|null, bytes: Number, oversize: Boolean, lru: Number}</tt>.
	 * Reset on {@link #bindStore}, so it only holds payloads of the displayed message.
	 * @property {Object}
	 * @private
	 */
	attachmentPayloadCache: undefined,

	/**
	 * @cfg {Number} maxConcurrentPrefetch Maximum number of attachment downloads
	 * {@link #prefetchAttachmentFile} may have in flight at once.
	 */
	maxConcurrentPrefetch: 3,

	/**
	 * @cfg {Number} payloadCacheBudgetFactor Multiple of the per-attachment embed
	 * limit ({@link #getDragOutMaxSize}) used as the total cache byte budget, so
	 * several attachments can stay ready without evicting each other.
	 */
	payloadCacheBudgetFactor: 4,

	/**
	 * @cfg {String} fieldLabel The label which must be applied to template
	 * as a prefix to the list of attachments.
	 */
	/* # TRANSLATORS: This message is used as label for the field which indicates which attachments are inside the message */
	fieldLabel: pgettext('mail.previewpanel', 'Attachments'),

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor: function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			xtype: 'zarafa.attachmentlinks',
			plugins: [ 'zarafa.recordcomponentupdaterplugin' ],
			border: false,
			autoScroll:true,
			anchor: '100%',
			iconCls: 'icon_paperclip',
			cls: 'preview-header-attachments',
			multiSelect: true,
			overClass: 'zarafa-attachment-link-over',
			itemSelector: 'span.zarafa-attachment-link',
			tpl: new Ext.XTemplate(
				'<div class="preview-header-attachmentbox">' +
					'<div class="preview-attachment-title icon_paperclip" aria-hidden="true"></div>' +
					'<div class="preview-attachment-data" style="max-height: {this.maxHeight}px">' +
						'<tpl for=".">' +
							'<span class="zarafa-attachment-link x-zarafa-boxfield-item" viewIndex="{viewIndex}" draggable="true">' +
								'{values.name:htmlEncodeElide(this.ellipsisStringStartLength, this.ellipsisStringEndLength)} ' +
								'<tpl if="!Ext.isEmpty(values.size) && values.size &gt; 0">' +
									'({values.size:fileSize})' +
								'</tpl>' +
							'</span> ' +
						'</tpl>' +
					'</div>' +
				'</div>',
				{
					compiled: true,
					maxHeight: config.maxHeight || this.maxHeight,
					ellipsisStringStartLength: config.ellipsisStringStartLength || this.ellipsisStringStartLength,
					ellipsisStringEndLength: config.ellipsisStringEndLength || this.ellipsisStringEndLength
				}
			)
		});

		// The fieldLabel should not be sent to the superclass
		this.fieldLabel = config.fieldLabel || this.fieldLabel;
		delete config.fieldLabel;

		Zarafa.common.ui.messagepanel.AttachmentLinks.superclass.constructor.call(this, config);
	},

	/**
	 * Initialize the component.
	 * This will register the {@link #onAttachmentClicked} event handler and the {@link #onNodeContextMenu} event handler.
	 * @private
	 */
	initComponent: function()
	{
		Zarafa.common.ui.messagepanel.AttachmentLinks.superclass.initComponent.call(this);

		// Drag-out prefetch state, initialised once so the cache is always an object.
		this.attachmentPayloadCache = {};
		this.activePrefetches = [];
		this.prefetchQueue = [];
		this.pendingPrefetchCount = 0;
		this.prefetchGeneration = 0;
		this.payloadCacheSeq = 0;

		this.on({
			'contextmenu': this.onNodeContextMenu,
			'click': this.onAttachmentClicked,
			'render': this.onRenderRegisterDragOut,
			'selectionchange': this.onSelectionChangePrefetch,
			scope: this
		});
	},

	/**
	 * Returns whether the attachment bytes may be embedded in the drag
	 * operation, which requires the server to allow it (see
	 * ENABLE_ATTACHMENT_DRAG_OUT in config.php) and the browser to support it
	 * (<tt>window.fetch</tt> and <tt>FileReader</tt>).
	 *
	 * This governs the {@link #attachmentDragOutType} payload only; it is not a
	 * switch for dragging attachments as such. Dragging an attachment to the
	 * operating system uses the <tt>DownloadURL</tt> type, needs no payload and
	 * is always available.
	 * @return {Boolean} True if attachment payloads may be embedded in a drag
	 * @private
	 */
	isDragOutEmbedEnabled: function()
	{
		var serverConfig = container.getServerConfig();
		if (serverConfig && Ext.isFunction(serverConfig.isAttachmentDragOutEnabled) && !serverConfig.isAttachmentDragOutEnabled()) {
			return false;
		}

		return Ext.isFunction(window.fetch) && typeof FileReader === 'function';
	},

	/**
	 * Returns the maximum attachment size (in bytes) whose content may be
	 * embedded in a drag operation (see ATTACHMENT_DRAG_OUT_MAX_SIZE in
	 * config.php). Defaults to 25 MiB.
	 * @return {Number} maximum embeddable attachment size in bytes
	 * @private
	 */
	getDragOutMaxSize: function()
	{
		var serverConfig = container.getServerConfig();
		if (serverConfig && Ext.isFunction(serverConfig.getAttachmentDragOutMaxSize)) {
			return serverConfig.getAttachmentDragOutMaxSize();
		}

		return 26214400;
	},

	/**
	 * Returns the total payload-cache byte budget: {@link #payloadCacheBudgetFactor}
	 * times the per-attachment embed limit ({@link #getDragOutMaxSize}).
	 * @return {Number} maximum retained payload bytes
	 * @private
	 */
	getPayloadCacheBudget: function()
	{
		return this.payloadCacheBudgetFactor * this.getDragOutMaxSize();
	},

	/**
	 * Event handler for the {@link #render} event. Registers the native
	 * <tt>dragstart</tt> (and, when {@link #isDragOutEmbedEnabled payloads may be
	 * embedded}, the priming listeners) on the view element so that attachments
	 * can be dragged out of grommunio Web. See {@link #onAttachmentDragStart}.
	 * @private
	 */
	onRenderRegisterDragOut: function()
	{
		this.mon(this.getEl(), 'dragstart', this.onAttachmentDragStart, this);

		if (this.isDragOutEmbedEnabled()) {
			// Prime the payload ahead of a drag. 'mousedown' also covers input
			// paths that do not fire 'mouseover' first (e.g. pen); a drag with no
			// primed payload falls back to the always-available DownloadURL.
			this.mon(this.getEl(), 'mouseover', this.onAttachmentPrimePayload, this);
			this.mon(this.getEl(), 'mousedown', this.onAttachmentPrimePayload, this);
		}
	},

	/**
	 * Returns a stable cache key for an attachment record: its download URL, which
	 * already scopes to the parent message and attachment number (and is the
	 * resource the payload is fetched from). Returns '' (caching disabled, rather
	 * than a colliding key) when the attachment is not part of a message-bound store.
	 * @param {Zarafa.core.data.IPMAttachmentRecord} record The attachment record
	 * @return {String} cache key, or '' when no stable key is available
	 * @private
	 */
	getAttachmentCacheKey: function(record)
	{
		var store = record.getStore();
		if (!store || !Ext.isFunction(store.getParentRecord) || !store.getParentRecord()) {
			return '';
		}

		return record.getAttachmentUrl() || '';
	},

	/**
	 * Native priming handler (bound to <tt>mouseover</tt> and <tt>mousedown</tt>).
	 * Kicks off a background prefetch of the targeted attachment so its payload is
	 * cached before the user starts dragging. See {@link #onAttachmentDragStart}.
	 * @param {Ext.EventObject} evt The native event wrapped by Ext.
	 * @private
	 */
	onAttachmentPrimePayload: function(evt)
	{
		if (!this.store) {
			return;
		}

		var node = evt.getTarget(this.itemSelector, this.getEl().dom);
		if (!node) {
			return;
		}

		var record = this.getRecord(node);
		if (record) {
			this.prefetchAttachmentFile(record);
		}
	},

	/**
	 * Stamps a cache entry as most-recently-used, so {@link #evictPayloadCache}
	 * keeps the payloads the user has most recently hovered or dragged.
	 * @param {Object} entry A {@link #attachmentPayloadCache} entry
	 * @private
	 */
	touchCacheEntry: function(entry)
	{
		if (entry) {
			entry.lru = ++this.payloadCacheSeq;
		}
	},

	/**
	 * Fetches the attachment content and caches it as a base64 encoded JSON payload,
	 * keyed by {@link #getAttachmentCacheKey}. Skips embedded messages, over-limit
	 * attachments (checked against the metadata size and again against the response),
	 * ones already cached/in-flight/known-too-large, and starts nothing once
	 * {@link #maxConcurrentPrefetch} fetches are in flight. The fetch is aborted on
	 * {@link #bindStore} or destroy. Callers must have checked
	 * {@link #isDragOutEmbedEnabled}; both call sites are gated on it.
	 * @param {Zarafa.core.data.IPMAttachmentRecord} record The attachment record
	 * @private
	 */
	prefetchAttachmentFile: function(record)
	{
		if (Ext.isFunction(record.isEmbeddedMessage) && record.isEmbeddedMessage()) {
			return;
		}

		var maxSize = this.getDragOutMaxSize();

		// A missing/zero size is unknown, not empty; the real size is enforced
		// against the response below.
		var size = record.get('size') || 0;
		if (size > maxSize) {
			return;
		}

		var key = this.getAttachmentCacheKey(record);
		if (Ext.isEmpty(key)) {
			return;
		}
		if (this.attachmentPayloadCache[key]) {
			// Already cached, in-flight or known too large: refresh recency only.
			this.touchCacheEntry(this.attachmentPayloadCache[key]);
			return;
		}

		if (this.pendingPrefetchCount >= this.maxConcurrentPrefetch) {
			// Queue instead of dropping it. A drag over a selection needs every
			// one of its payloads, and nothing would ever start the ones beyond
			// the concurrency limit again.
			this.queuePrefetch(record, key);
			return;
		}

		var url = record.getAttachmentUrl();
		if (Ext.isEmpty(url)) {
			return;
		}

		var name = record.get('name') || _('Untitled');
		var mimeType = record.get('filetype') || 'application/octet-stream';
		var entry = { payload: null, bytes: 0, oversize: false, lru: ++this.payloadCacheSeq };
		this.attachmentPayloadCache[key] = entry;

		var self = this;
		var generation = this.prefetchGeneration;
		var controller = (typeof AbortController === 'function') ? new AbortController() : null;
		if (controller) {
			this.activePrefetches.push(controller);
		}
		this.pendingPrefetchCount++;

		window.fetch(url, { credentials: 'include', signal: controller ? controller.signal : undefined }).then(function(response) {
			if (!response.ok) {
				throw new Error('HTTP ' + response.status);
			}
			// Enforce the limit against the real size (Content-Length, then bytes).
			var declared = parseInt(response.headers.get('Content-Length'), 10);
			if (!isNaN(declared) && declared > maxSize) {
				throw Ext.apply(new Error('oversize'), { oversize: true });
			}
			return response.blob();
		}).then(function(blob) {
			if (blob.size > maxSize) {
				throw Ext.apply(new Error('oversize'), { oversize: true });
			}
			return new Promise(function(resolve, reject) {
				var reader = new FileReader();
				reader.onload = function() {
					// readAsDataURL yields "data:<mime>;base64,<data>"; keep only
					// the base64 portion.
					var result = String(reader.result);
					var comma = result.indexOf(',');
					resolve({ base64: comma !== -1 ? result.substring(comma + 1) : '', size: blob.size });
				};
				reader.onerror = function() {
					reject(reader.error || new Error('FileReader failed'));
				};
				reader.readAsDataURL(blob);
			});
		}).then(function(data) {
			// Discard the result if the view was destroyed or the store rebound.
			if (self.isDestroyed || self.attachmentPayloadCache[key] !== entry) {
				return;
			}
			entry.payload = JSON.stringify({
				name: name,
				type: mimeType,
				size: data.size,
				data: data.base64
			});
			entry.bytes = data.size;
			entry.lru = ++self.payloadCacheSeq;

			self.evictPayloadCache();
		}).catch(function(err) {
			// Ignore results for an entry already reset/replaced (includes aborts).
			if (self.attachmentPayloadCache[key] !== entry) {
				return;
			}
			if (err && err.oversize) {
				// Keep a marker so later hovers/drags do not re-download it.
				entry.oversize = true;
				entry.payload = null;
				entry.bytes = 0;
			} else {
				// Transient failure: drop the entry so a later hover/drag can retry.
				delete self.attachmentPayloadCache[key];
			}
		}).then(function() {
			// Settle the in-flight bookkeeping once. A fetch abandoned by a rebind
			// (older generation) had its slot released already, so skip it here.
			if (generation !== self.prefetchGeneration) {
				return;
			}
			self.pendingPrefetchCount = Math.max(0, self.pendingPrefetchCount - 1);
			if (controller) {
				var idx = self.activePrefetches.indexOf(controller);
				if (idx !== -1) {
					self.activePrefetches.splice(idx, 1);
				}
			}

			self.drainPrefetchQueue();
		});
	},

	/**
	 * Remembers an attachment whose prefetch could not be started because
	 * {@link #maxConcurrentPrefetch} downloads are already in flight, so
	 * {@link #drainPrefetchQueue} can start it when a slot frees up. Ignores an
	 * attachment already waiting.
	 * @param {Zarafa.core.data.IPMAttachmentRecord} record The attachment record
	 * @param {String} key Its {@link #getAttachmentCacheKey cache key}
	 * @private
	 */
	queuePrefetch: function(record, key)
	{
		for (var i = 0; i < this.prefetchQueue.length; i++) {
			if (this.getAttachmentCacheKey(this.prefetchQueue[i]) === key) {
				return;
			}
		}

		this.prefetchQueue.push(record);
	},

	/**
	 * Starts queued prefetches while there is a free slot. The queue only ever
	 * shrinks here: entries are taken off it before being started, and one is
	 * queued again only from a state where every slot is busy.
	 * @private
	 */
	drainPrefetchQueue: function()
	{
		while (!Ext.isEmpty(this.prefetchQueue) && this.pendingPrefetchCount < this.maxConcurrentPrefetch) {
			this.prefetchAttachmentFile(this.prefetchQueue.shift());
		}
	},

	/**
	 * Event handler for {@link #selectionchange}. Starts fetching the payloads of
	 * a multiple selection, so that dragging it out finds them ready: the drag
	 * itself cannot wait for a download, and {@link #onAttachmentDragStart} hands
	 * over a selection only when every payload is present.
	 * @private
	 */
	onSelectionChangePrefetch: function()
	{
		if (!this.isDragOutEmbedEnabled() || this.getSelectionCount() < 2) {
			return;
		}

		var records = this.getSelectedRecords();
		for (var i = 0; i < records.length; i++) {
			if (this.isDraggableAttachment(records[i])) {
				this.prefetchAttachmentFile(records[i]);
			}
		}
	},

	/**
	 * Whether an attachment can take part in a drag out of grommunio Web.
	 * Embedded messages cannot: they are not backed by a single downloadable
	 * file, so they have neither a download URL nor a payload.
	 * @param {Zarafa.core.data.IPMAttachmentRecord} record The attachment record
	 * @return {Boolean} True if the attachment can be dragged out
	 * @private
	 */
	isDraggableAttachment: function(record)
	{
		return !!record && !(Ext.isFunction(record.isEmbeddedMessage) && record.isEmbeddedMessage());
	},

	/**
	 * Collects the cached payloads of the given attachments, all of them or none.
	 *
	 * A payload cannot be fetched from within <tt>dragstart</tt>, which is
	 * synchronous, so handing over the subset that happens to be ready would drop
	 * the rest of the selection without telling anyone — a drop that looks
	 * complete and is not. When one is missing its fetch is started instead, so a
	 * later drag of the same selection carries everything.
	 *
	 * @param {Zarafa.core.data.IPMAttachmentRecord[]} records The attachments to be dragged
	 * @return {String[]} The payloads as JSON strings, or null when incomplete
	 * @private
	 */
	collectDragPayloads: function(records)
	{
		var payloads = [];
		var complete = true;

		for (var i = 0; i < records.length; i++) {
			var entry = this.attachmentPayloadCache[this.getAttachmentCacheKey(records[i])];
			if (entry && entry.payload) {
				this.touchCacheEntry(entry);
				payloads.push(entry.payload);
			} else {
				complete = false;
				this.prefetchAttachmentFile(records[i]);
			}
		}

		return complete ? payloads : null;
	},

	/**
	 * Evicts least-recently-used {@link #attachmentPayloadCache} entries until the
	 * total attachment bytes are within {@link #getPayloadCacheBudget}. Sizes count
	 * attachment bytes (not the inflated base64), and in-flight entries (payload
	 * null, size unknown) are never discarded.
	 * @private
	 */
	evictPayloadCache: function()
	{
		var cache = this.attachmentPayloadCache;
		var budget = this.getPayloadCacheBudget();

		var keys = Object.keys(cache);
		var total = 0;
		var i;

		for (i = 0; i < keys.length; i++) {
			total += cache[keys[i]].bytes || 0;
		}

		if (total <= budget) {
			return;
		}

		// Evict completed payloads least-recently-used first, so the attachments
		// the user has most recently hovered or dragged are the ones kept.
		var evictable = keys.filter(function(k) {
			return cache[k].payload !== null;
		});
		evictable.sort(function(a, b) {
			return (cache[a].lru || 0) - (cache[b].lru || 0);
		});

		for (i = 0; i < evictable.length && total > budget; i++) {
			total -= cache[evictable[i]].bytes || 0;
			delete cache[evictable[i]];
		}
	},

	/**
	 * Native <tt>dragstart</tt> handler which enables dragging an attachment out
	 * of grommunio Web. It populates the drag {@link DataTransfer} with two
	 * complementary payloads so the same drag works for both drop targets:
	 *
	 * - The Chromium <tt>DownloadURL</tt> type
	 *   (<tt>mimeType:fileName:absoluteURL</tt>) so the attachment can be dropped
	 *   onto the operating system (file manager / Windows Explorer / desktop),
	 *   which then downloads the file to the drop location. (Chromium only;
	 *   Firefox and other browsers ignore this type.)
	 * - When the drag-out feature is enabled and the attachment content has been
	 *   {@link #prefetchAttachmentFile prefetched}, the payload is also exposed
	 *   under the custom {@link #attachmentDragOutType} MIME type as a JSON string
	 *   <tt>{name, type, size, data(base64)}</tt>, so a cooperating receiving web
	 *   application can reconstruct the file on drop. Several attachments travel
	 *   as an array of those objects, which the reader has always accepted.
	 *
	 * The two do not conflict: when a web page's drop handler calls
	 * <tt>preventDefault()</tt> (as a drop zone must), the browser hands over the
	 * custom payload and does NOT download. The <tt>DownloadURL</tt> download only
	 * happens when the drop target does not accept the drop, i.e. the operating
	 * system (Explorer/desktop) or a page area without a drop handler.
	 *
	 * 🛑 The two are not equally capable, and that governs what a multiple
	 * selection can do. A drag can hand the operating system at most ONE file:
	 * Chromium's drop data holds a single optional <tt>DownloadUrlMetadata</tt>
	 * (<tt>content/public/common/drop_data.h</tt>), and its multi-valued file list
	 * is the inbound direction, which is why dropping many files INTO the browser
	 * works and the reverse does not. The custom type has no such limit because
	 * the receiving page reconstructs the files itself. So a selection of several
	 * is offered to a cooperating web application and NOT to the operating
	 * system: writing the one attachment under the cursor would look like it had
	 * written them all. Several files reach the disk through the context menu's
	 * "Save selection to folder" instead.
	 *
	 * @param {Ext.EventObject} evt The native event wrapped by Ext.
	 * @private
	 */
	onAttachmentDragStart: function(evt)
	{
		if (!this.store) {
			return;
		}

		var node = evt.getTarget(this.itemSelector, this.getEl().dom);
		if (!node) {
			return;
		}

		// Embedded messages take no part in the drag. Dropping them out of a
		// mixed selection keeps the rest of it draggable, and a gesture that
		// covers nothing else stays a plain (in-app) drag.
		var gesture = this.getGestureRecords(node);
		var records = [];
		var i;
		for (i = 0; i < gesture.length; i++) {
			if (this.isDraggableAttachment(gesture[i])) {
				records.push(gesture[i]);
			}
		}

		if (Ext.isEmpty(records)) {
			return;
		}

		var browserEvent = evt.browserEvent || evt;
		var dataTransfer = browserEvent.dataTransfer;
		if (!dataTransfer || !Ext.isFunction(dataTransfer.setData)) {
			return;
		}

		var multiple = records.length > 1;

		// (1) Custom type for dropping into a cooperating web application. Only
		// available when the feature is enabled and every payload was prefetched.
		var haveCustomPayload = false;
		if (this.isDragOutEmbedEnabled()) {
			var payloads = this.collectDragPayloads(records);
			if (payloads) {
				try {
					// The cached payloads are JSON strings already, so the array
					// is assembled textually rather than by decoding and
					// re-encoding megabytes of base64 during dragstart.
					dataTransfer.setData(this.attachmentDragOutType,
						multiple ? '[' + payloads.join(',') + ']' : payloads[0]);
					haveCustomPayload = true;
				} catch (e) {
					// Browser rejected the custom type; ignore.
				}
			}
		}

		// (2) DownloadURL for dropping onto the operating system (file manager /
		// Windows Explorer / desktop). This coexists with the custom type: a web
		// drop zone that calls preventDefault() receives the custom payload and
		// no download is triggered; only the OS (which cannot honour the custom
		// type) uses the DownloadURL to save the file. Offered for a single
		// attachment only, see the note above.
		try {
			if (!multiple) {
				var record = records[0];
				var name = record.get('name') || _('Untitled');
				var mimeType = record.get('filetype') || 'application/octet-stream';

				// DownloadURL requires a fully qualified URL.
				var url = record.getAttachmentUrl();
				if (!Ext.isEmpty(url)) {
					url = new URL(url, window.location.href).href;

					// Name and MIME type are sender-controlled; ':' is the DownloadURL
					// field separator, so strip it from both or a crafted value could
					// hijack the URL (everything after the second ':' is the URL).
					var safeName = String(name).replace(/[\r\n]+/g, ' ').replace(/:/g, '_');
					var baseMime = String(mimeType).split(';')[0].trim();
					var safeMime = /^[\w.+-]+\/[\w.+-]+$/.test(baseMime) ? baseMime : 'application/octet-stream';
					dataTransfer.setData('DownloadURL', safeMime + ':' + safeName + ':' + url);
					dataTransfer.setData('text/uri-list', url);
				}

				// A human-readable label; useful when dropping onto a text field.
				dataTransfer.setData('text/plain', haveCustomPayload || Ext.isEmpty(url) ? name : url);
			} else {
				var names = [];
				for (i = 0; i < records.length; i++) {
					names.push(records[i].get('name') || _('Untitled'));
				}
				dataTransfer.setData('text/plain', names.join('\n'));
			}

			dataTransfer.effectAllowed = 'copyLink';
		} catch (e) {
			// Ignore browsers that reject one of the data types.
		}
	},

	/**
	 * <p>Function which can be overridden which returns the data object passed to this
	 * DataView's {@link #tpl template} to render the whole DataView.</p>
	 * <p>This is usually an Array of data objects, each element of which is processed by an
	 * {@link Ext.XTemplate XTemplate} which uses <tt>'&lt;tpl for="."&gt;'</tt> to iterate over its supplied
	 * data object as an Array. However, <i>named</i> properties may be placed into the data object to
	 * provide non-repeating data such as headings, totals etc.</p>
	 * @param {Array} records An Array of {@link Ext.data.Record}s to be rendered into the DataView.
	 * @param {Number} startIndex the index number of the Record being prepared for rendering.
	 * @return {Array} An Array of data objects to be processed by a repeating XTemplate. May also
	 * contain <i>named</i> properties.
	 */
	collectData: function(records, startIndex)
	{
		var r = [];
		for (var i = 0, len = records.length; i < len; i++) {
			var record = records[i];
			if (record.isEmbeddedInBody() !== true) {
				r[r.length] = this.prepareData(record.data, record.get('attach_num'), record);
			}
		}
		return r;
	},

	/**
	 * Overrides {@link Ext.DataView#bindStore} to discard the
	 * {@link #attachmentPayloadCache} (and abort any in-flight prefetch). This
	 * view is created once for the preview panel and reused for every message
	 * which is opened, so the cached payloads of the previous message must not
	 * survive into the next one.
	 * @param {Ext.data.Store} store The store to bind to this view
	 * @param {Boolean} initial True if this is the initial binding
	 * @override
	 */
	bindStore: function(store, initial)
	{
		// Resolve to the instance (as the superclass does) before comparing, so a
		// re-bind of the same store under a different reference keeps the cache.
		var resolved = store ? Ext.StoreMgr.lookup(store) : null;
		if (resolved !== this.store) {
			this.abortPrefetches();
			this.attachmentPayloadCache = {};
		}

		Zarafa.common.ui.messagepanel.AttachmentLinks.superclass.bindStore.apply(this, arguments);
	},

	/**
	 * Ext.DataView aliases setStore to the base bindStore, bypassing this class'
	 * override; route it back through {@link #bindStore}.
	 * @param {Ext.data.Store} store The store to bind to this view
	 * @param {Boolean} initial True if this is the initial binding
	 * @override
	 */
	setStore: function(store, initial)
	{
		return this.bindStore.apply(this, arguments);
	},

	/**
	 * Aborts any in-flight prefetch downloads. Called when the bound store
	 * changes or the component is destroyed, so a download started for one
	 * message is not left running (its result would be discarded anyway).
	 * @private
	 */
	abortPrefetches: function()
	{
		// Advance the generation and clear the slot count so the next message starts
		// fresh; fetches that settle afterwards skip their bookkeeping.
		this.prefetchGeneration = (this.prefetchGeneration || 0) + 1;
		this.pendingPrefetchCount = 0;
		this.prefetchQueue = [];

		if (this.activePrefetches) {
			for (var i = 0; i < this.activePrefetches.length; i++) {
				try {
					this.activePrefetches[i].abort();
				} catch (e) {
					// Ignore an AbortController that refuses to abort.
				}
			}
			this.activePrefetches = [];
		}
	},

	/**
	 * Called when the component is being destroyed. Cancels a pending deferred
	 * bind and aborts any in-flight prefetch, then lets the superclass run.
	 * @protected
	 */
	onDestroy: function()
	{
		if (this.bindStoreTask) {
			window.clearTimeout(this.bindStoreTask);
			this.bindStoreTask = null;
		}
		this.abortPrefetches();

		// The superclass ends in bindStore(null), which resets the cache.
		Zarafa.common.ui.messagepanel.AttachmentLinks.superclass.onDestroy.apply(this, arguments);
	},

	/**
	 * Apply a record on the DataView. If the record is {@link Zarafa.core.data.IPMRecord#isOpened},
	 * then the {@link Zarafa.core.data.IPMRecord#getAttachmentStore attachment store} will be
	 * {@link #bindStore bound} to this view.
	 * @param {Zarafa.core.data.IPMRecord} record The record to apply
	 */
	setRecord: function(record)
	{
		// Cancel a superseded deferred bind so a fast switch cannot bind the
		// previous message's store.
		if (this.bindStoreTask) {
			window.clearTimeout(this.bindStoreTask);
			this.bindStoreTask = null;
		}

		if (record && record.get('hasattach') && record.hasVisibleAttachments()) {
			if (record.isOpened()) {
				// Defer binding the attachment store so message text renders first.
				this.bindStoreTask = Ext.defer(function(){
					this.bindStoreTask = null;
					if (this.isDestroyed) {
						return;
					}
					this.bindStore(record.getAttachmentStore());
					this.setVisible(true);
				}, 100, this);
			}
		} else {
			this.bindStore(null);
			this.setVisible(false);
		}
	},

	/**
	 * overridden to get the viewIndex from an HTML element's attribute
	 * by default the index is taken from the element's position within the group;
	 * however if there are more than one groups, the indexes are wrong
	 * @private
	 */
	updateIndexes: function(startIndex, endIndex)
	{
		var ns = this.all.elements;
		startIndex = startIndex || 0;
		endIndex = endIndex || ((endIndex === 0) ? 0: (ns.length - 1));
		for(var i = startIndex; i <= endIndex; i++){
				ns[i].viewIndex = ns[i].getAttribute('viewIndex');
		}
	},

	/**
	 * overridden to provide the correct index to {@link Ext.DataView#getRecord}
	 * otherwise behaviour breaks when there is more than one group in the records (e.g. CC, BCC, etc.)
	 * @param {Zarafa.core.data.IPMRecipientRecord} data The recipient record to be prepared
	 * @param {Number} index
	 * @param {Ext.data.Record} record
	 * @return {Object} new object with index appended
	 * @private
	 */
	prepareData: function(data, index, record)
	{
		return Ext.apply({viewIndex: index}, data);
	},

	/**
	 * Gets an array of the records from an array of nodes
	 * @param {Array} nodes The nodes to evaluate
	 * @return {Array} records The {@link Ext.data.Record} objects
	 */
	getRecords: function(nodes)
	{
		var records = [];

		for(var i = 0, len = nodes.length; i < len; i++){
			records[records.length] = this.getRecord(nodes[i]);
		}
		return records;
	},

	/**
	 * Gets a record from a node
	 * @param {HTMLElement} node The node to evaluate
	 * @return {Record} record The {@link Ext.data.Record} object
	 * @override
	 */
	getRecord: function(node)
	{
		return this.store.getAt(this.store.findExact('attach_num', parseInt(node.viewIndex, 10)));
	},

	/**
	 * Update the components with the given record.
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The record to update in this component
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update: function(record, contentReset)
	{
		if ( !this.getEl().dom ) {
			return;
		}

		if (record && record instanceof Zarafa.core.data.MAPIRecord) {
			// In case the recordcomponentupdaterplugin is installed
			// we have a special action to update the component.
			if (contentReset && record.isOpened()) {
				this.setRecord(record);
			}
		} else {
			// The recordcomponentupdaterplugin is not installed and the
			// caller really wants to perform the update() function. Probably
			// a bad move, but lets not disappoint the caller.
			Zarafa.common.ui.messagepanel.AttachmentLinks.superclass.update.apply(this, arguments);
		}
	},

	/**
	 * Called when the {@link #click} event is fired. This will
	 * {@link Zarafa.core.data.UIFactory#openViewRecord open} the selected attachment
	 *
	 * A click carrying a modifier is a selection gesture and must not open
	 * anything: {@link Ext.DataView#doMultiSelection} has already extended or
	 * reduced the selection by the time this runs, and opening the attachment on
	 * top of that would make a selection impossible to build.
	 *
	 * @param {Ext.DataView} dataview Reference to this object
	 * @param {Number} index
	 * @param {HTMLElement} node The target HTML element
	 * @param {Object} evt Event object
	 * @private
	 */
	onAttachmentClicked: function(dataview, index, node, evt)
	{
		// We should actually never be called without a record set on
		// this container. So this is likely a bug...
		if (!this.store) {
			return;
		}

		if (evt && (evt.ctrlKey || evt.shiftKey || evt.metaKey)) {
			return;
		}

		var attachment = dataview.getRecord(node);
		Zarafa.common.Actions.openAttachmentRecord(attachment);
	},

	/**
	 * The records a gesture on <tt>node</tt> applies to: the whole selection when
	 * that node is part of a selection of several, and otherwise only the node
	 * itself, leaving any selection untouched.
	 *
	 * This is the behaviour of Explorer and Outlook, and it is what lets a drag
	 * or a context menu act on several attachments without a visible selection
	 * control: the user builds the selection with ctrl/shift and then starts the
	 * gesture on one of the selected items.
	 *
	 * @param {HTMLElement} node The node the gesture started on
	 * @return {Zarafa.core.data.IPMAttachmentRecord[]} The records, possibly empty
	 * @private
	 */
	getGestureRecords: function(node)
	{
		var record = this.getRecord(node);
		if (!record) {
			return [];
		}

		if (this.getSelectionCount() > 1 && this.isSelected(node)) {
			var selected = this.getSelectedRecords();
			if (!Ext.isEmpty(selected)) {
				return selected;
			}
		}

		return [record];
	},

	/**
	 * Called when user right-clicks on an item in {@link Zarafa.common.ui.messagepanel.AttachmentLinks}
	 * invokes {@link Zarafa.core.data.UIFactory#openDefaultContextMenu} with the selected {@link Zarafa.core.data.IPMRecord}
	 *
	 * 🛑 The selection is passed in the config, not as the first argument.
	 * {@link Zarafa.core.data.UIFactory#openContextMenu} first asks the plugins
	 * to bid for a component to show, and they bid on a single record: handing
	 * that call an array makes every bid fail, whereupon it returns silently and
	 * no menu opens at all. So the bid is given one record, exactly as before,
	 * and `records` rides in the config, which <tt>Ext.applyIf</tt> then leaves
	 * alone. Measured in the browser after a multiple selection opened nothing.
	 *
	 * @param {Ext.DataView} dataView DataView from which the event comes
	 * @param {Number} index
	 * @param {HTMLElement} node HTML node from which the event originates
	 * @param {Ext.EventObject} evt Event object
	 * @private
	 */
	onNodeContextMenu: function(dataView, index, node, evt)
	{
		var records = this.getGestureRecords(node);
		if (Ext.isEmpty(records)) {
			return;
		}

		Zarafa.core.data.UIFactory.openDefaultContextMenu(records[0], {
			records: records.length > 1 ? records : records[0],
			position: evt.getXY(),
			model: this.model
		});
	}
});

Ext.reg('zarafa.attachmentlinks', Zarafa.common.ui.messagepanel.AttachmentLinks);
