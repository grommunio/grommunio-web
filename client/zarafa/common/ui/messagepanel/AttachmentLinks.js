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
	ellipsisStringStartLength : 20,

	/**
	 * @cfg {Number} maximum length of text allowed after truncations,
	 * truncation will be replaced with ellipsis ('...').
	 */
	ellipsisStringEndLength : 20,

	/**
	 * @cfg {Number} maxHeight The maximum height the element which holds all
	 * recipient is allowed to take before a scrollbar will be shown.
	 */
	maxHeight : 50,

	/**
	 * @cfg {String} fieldLabel The label which must be applied to template
	 * as a prefix to the list of attachments.
	 */
	/* # TRANSLATORS: This message is used as label for the field which indicates which attachments are inside the message */
	fieldLabel : pgettext('mail.previewpanel', 'Attachments'),

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			xtype: 'zarafa.attachmentlinks',
			plugins : [ 'zarafa.recordcomponentupdaterplugin' ],
			border : false,
			autoScroll:true,
			anchor : '100%',
			cls: 'preview-header-attachments',
			multiSelect : false,
			overClass: 'zarafa-attachment-link-over',
			itemSelector: 'span.zarafa-attachment-link',
			tpl : new Ext.XTemplate(
				'<div class="preview-header-attachmentbox">' +
					'<div class="preview-attachment-title">{this.fieldLabel}:</div>' +
					'<div class="preview-attachment-data" style="max-height: {this.maxHeight}px">' +
						'<tpl for=".">' +
							'<span class="zarafa-attachment-link x-zarafa-boxfield-item" viewIndex="{viewIndex}">' +
								'{values.name:htmlEncodeElide(this.ellipsisStringStartLength, this.ellipsisStringEndLength)} ' +
								'<tpl if="!Ext.isEmpty(values.size) && values.size &gt; 0">' +
									'({values.size:fileSize})' +
								'</tpl>' +
							'</span> ' +
						'</tpl>' +
					'</div>' +
				'</div>',
				{
					compiled : true,
					fieldLabel : config.fieldLabel || this.fieldLabel,
					maxHeight : config.maxHeight || this.maxHeight,
					ellipsisStringStartLength : config.ellipsisStringStartLength || this.ellipsisStringStartLength,
					ellipsisStringEndLength : config.ellipsisStringEndLength || this.ellipsisStringEndLength
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
	initComponent : function()
	{
		Zarafa.common.ui.messagepanel.AttachmentLinks.superclass.initComponent.call(this);

		this.on({
			'contextmenu' : this.onNodeContextMenu,
			'click' : this.onAttachmentClicked,
			scope : this
		});
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
	collectData : function(records, startIndex)
	{
		var r = [];
		for (var i = 0, len = records.length; i < len; i++) {
			var record = records[i];
			if (record.get('hidden') !== true) {
				r[r.length] = this.prepareData(record.data, record.get('attach_num'), record);
			}
		}
		return r;
	},

	/**
	 * Apply a record on the DataView. If the record is {@link Zarafa.core.data.IPMRecord#isOpened},
	 * then the {@link Zarafa.core.data.IPMRecord#getAttachmentStore attachment store} will be
	 * {@link #bindStore bound} to this view.
	 * @param {Zarafa.core.data.IPMRecord} record The record to apply
	 */
	setRecord : function(record)
	{
		if (record && record.get('hasattach') && record.hasVisibleAttachments()) {
			if (record.isOpened()) {
				this.bindStore(record.getAttachmentStore());
				this.setVisible(true);
			}
		} else {
			this.bindStore(null);
			this.setVisible(false);
		}
	},

	/**
	 * overriden to get the viewIndex from an HTML element's attribute
	 * by default the index is taken from the element's position within the group;
	 * however if there are more than one groups, the indexes are wrong
	 * @private
	 */
	updateIndexes : function(startIndex, endIndex)
	{
		var ns = this.all.elements;
		startIndex = startIndex || 0;
		endIndex = endIndex || ((endIndex === 0) ? 0 : (ns.length - 1));
		for(var i = startIndex; i <= endIndex; i++){
				ns[i].viewIndex = ns[i].getAttribute('viewIndex');
		}
	},

	/**
	 * overriden to provide the correct index to {@link Ext.DataView#getRecord}
	 * otherwise behaviour breaks when there is more than one group in the records (e.g. CC, BCC, etc.)
	 * @param {Zarafa.core.data.IPMRecipientRecord} data The recipient record to be prepared
	 * @param {Number} index
	 * @param {Ext.data.Record} record
	 * @return {Object} new object with index appended
	 * @private
	 */
	prepareData : function(data, index, record)
	{
		return Ext.apply({viewIndex: index}, data);
	},

	/**
	 * Gets an array of the records from an array of nodes
	 * @param {Array} nodes The nodes to evaluate
	 * @return {Array} records The {@link Ext.data.Record} objects
	 */
	getRecords : function(nodes)
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
	getRecord : function(node)
	{
		return this.store.getAt(this.store.findExact('attach_num', parseInt(node.viewIndex, 10)));
	},

	/**
	 * Update the components with the given record.
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The record to update in this component
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
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

		var attachment = dataview.getRecord(node);
		Zarafa.common.Actions.openAttachmentRecord(attachment);
	},
	/**
	 * Called when user right-clicks on an item in {@link Zarafa.common.ui.messagepanel.AttachmentLinks}
	 * invokes {@link Zarafa.core.data.UIFactory#openDefaultContextMenu} with the selected {@link Zarafa.core.data.IPMRecord}
	 * @param {Ext.DataView} dataView DataView from which the event comes
	 * @param {Number} index
	 * @param {HTMLElement} node HTML node from which the event originates
	 * @param {Ext.EventObject} evt Event object
	 * @private
	 */
	onNodeContextMenu : function(dataView, index, node, evt)
	{
		Zarafa.core.data.UIFactory.openDefaultContextMenu(dataView.getRecord(node), {
			position : evt.getXY(),
			model : this.model
		});
	}
});

Ext.reg('zarafa.attachmentlinks', Zarafa.common.ui.messagepanel.AttachmentLinks);
