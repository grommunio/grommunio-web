/*
 * #dependsFile client/zarafa/note/NoteStore.js
 * #dependsFile client/zarafa/note/Actions.js
 * #dependsFile client/zarafa/core/data/RestrictionFactory.js
 * #dependsFile client/zarafa/core/mapi/Restrictions.js
 * #dependsFile client/zarafa/core/mapi/NoteColor.js
 */
Ext.namespace('Zarafa.note.ui');

/**
 * @class Zarafa.note.ui.LinkedNoteLinks
 * @extends Ext.Container
 * @xtype zarafa.linkednotelinks
 *
 * Shows the notes which annotate the mail being previewed, inside the message
 * header. A note is linked by holding the mail's 'internet_message_id' in its
 * 'note_link_id'; the mail itself is never written to. The notes live in the
 * Notes folder of the store the mail is in, so everyone with access to a
 * shared mailbox sees the same notes.
 */
Zarafa.note.ui.LinkedNoteLinks = Ext.extend(Ext.Container, {
	/**
	 * The store the linked notes are loaded into. Private to this panel:
	 * loading into the note context model would replace what the Notes
	 * context is showing.
	 *
	 * @property
	 * @type Zarafa.note.NoteStore
	 * @private
	 */
	noteStore: undefined,

	/**
	 * The 'internet_message_id' {@link #noteStore} was last asked to load.
	 *
	 * @property
	 * @type String
	 * @private
	 */
	loadedMessageId: undefined,

	/**
	 * The 'internet_message_id' whose notes are currently rendered.
	 *
	 * @property
	 * @type String
	 * @private
	 */
	shownMessageId: undefined,

	/**
	 * @cfg {Ext.Template/String} linkedNotesTemplate The template applied to build the
	 * list of linked notes.
	 */
	linkedNotesTemplate:
			'<hr class="preview-title-hr">' +
			'<div class="preview-header-linkednotes-list">' +
				'<tpl for=".">' +
					'<div class="preview-header-linkednote {[this.colorName(values.color)]}" data-noteindex="{[xindex - 1]}">' +
						// The subject is the first line of the body, show one of them.
						'<tpl if="!Ext.isEmpty(values.body)">' +
							'{[this.noteBody(values.body)]}' +
						'</tpl>' +
						'<tpl if="Ext.isEmpty(values.body)">' +
							'{subject:htmlEncode}' +
						'</tpl>' +
					'</div>' +
				'</tpl>' +
			'</div>',

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor: function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		config = Ext.applyIf(config, {
			xtype: 'zarafa.linkednotelinks',
			cls: 'preview-header-linkednotes',
			hidden: true,
			forceLayout: true
		});

		Zarafa.note.ui.LinkedNoteLinks.superclass.constructor.call(this, config);

		if (Ext.isString(this.linkedNotesTemplate)) {
			this.linkedNotesTemplate = new Ext.XTemplate(this.linkedNotesTemplate, {
				compiled: true,

				/**
				 * Maps the note color onto its CSS class.
				 * @param {Number} color The {@link Zarafa.core.mapi.NoteColor} value
				 * @return {String} the CSS class for that color
				 */
				colorName: function(color)
				{
					return Zarafa.core.mapi.NoteColor.getName(color) || 'note_yellow';
				},

				/**
				 * Prepares a note body for display. Note bodies are plain text, the
				 * sticky note module forces it, so they must be encoded before being
				 * placed into the preview.
				 * @param {String} body The note body
				 * @return {String} the body, safe to insert
				 */
				noteBody: function(body)
				{
					return Ext.util.Format.nl2br(Ext.util.Format.htmlEncode(body));
				}
			});
		}

		this.noteStore = new Zarafa.note.NoteStore();
		this.mon(this.noteStore, {
			load: this.onNoteStoreLoad,
			// note edits and deletes arrive as store mutations, not as a load
			update: this.onNoteStoreChanged,
			remove: this.onNoteStoreChanged,
			exception: this.onNoteStoreException,
			scope: this
		});
	},

	/**
	 * Binds the click handler for opening a note.
	 * @private
	 */
	afterRender: function()
	{
		Zarafa.note.ui.LinkedNoteLinks.superclass.afterRender.apply(this, arguments);

		this.mon(this.el, 'click', this.onNoteClick, this, {
			delegate: '.preview-header-linkednote'
		});
	},

	/**
	 * Update the panel for the given {@link Zarafa.core.data.IPMRecord record}.
	 * Only a mail with an 'internet_message_id' can be annotated; anything
	 * else clears the panel.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record to show the notes of
	 * @param {Boolean} contentReset true if the record was reloaded rather than updated
	 */
	update: function(record, contentReset)
	{
		if (!this.el.dom) {
			return;
		}

		var messageId = record ? record.get('internet_message_id') : undefined;

		if (!record || !record.isMessageClass('IPM.Note', true) || Ext.isEmpty(messageId)) {
			this.reset();
			return;
		}

		// The updater plugin fires several times for one previewed mail
		// (setrecord, the open completing, tab activation): load only once.
		if (messageId === this.loadedMessageId) {
			return;
		}

		var folder = Zarafa.note.Actions.getLinkedNotesFolder(record);
		// A visible but unreadable Notes folder (shared mailbox) would turn
		// every previewed mail into an error toast, so do not ask at all.
		if (!folder || (folder.get('rights') & Zarafa.core.mapi.Rights.RIGHTS_READ_ANY) === 0) {
			this.reset();
			return;
		}

		this.loadedMessageId = messageId;
		// nothing of the previous mail may linger while the request runs
		this.hideNotes();

		this.noteStore.load({
			folder: folder,
			params: {
				restriction: {
					note: Zarafa.core.data.RestrictionFactory.dataResProperty(
						'note_link_id',
						Zarafa.core.mapi.Restrictions.RELOP_EQ,
						messageId
					)
				}
			}
		});
	},

	/**
	 * Renders the loaded notes. Issuing a load cancels the previous request
	 * and {@link #reset} cancels outright, so a response always belongs to
	 * {@link #loadedMessageId}.
	 * @private
	 */
	onNoteStoreLoad: function()
	{
		this.shownMessageId = this.loadedMessageId;
		this.renderNotes();
	},

	/**
	 * Re-renders after a note was changed or removed through another
	 * component (the note dialog, the Notes context, a notification), so the
	 * panel does not go stale and a click opens the note it shows.
	 * @private
	 */
	onNoteStoreChanged: function()
	{
		if (this.shownMessageId && this.shownMessageId === this.loadedMessageId) {
			this.renderNotes();
		}
	},

	/**
	 * Renders the current store contents. A mail with no notes shows nothing
	 * at all, so the header of an ordinary mail is left exactly as it was.
	 * @private
	 */
	renderNotes: function()
	{
		if (!this.el || !this.el.dom) {
			return;
		}

		var records = this.noteStore.getRange();

		if (Ext.isEmpty(records)) {
			this.hideNotes();
			return;
		}

		this.linkedNotesTemplate.overwrite(Ext.get(this.el.dom), Ext.pluck(records, 'data'));
		this.setVisible(true);
		this.doLayout();
	},

	/**
	 * Failing to read the notes folder is not worth interrupting the user
	 * over: the mail itself is unaffected, so the panel just stays hidden.
	 * {@link #loadedMessageId} is kept so the same mail is not retried on
	 * every update.
	 * @private
	 */
	onNoteStoreException: function()
	{
		this.hideNotes();
	},

	/**
	 * Opens the note which was clicked.
	 * @private
	 */
	onNoteClick: function(event, target)
	{
		var index = parseInt(Ext.get(target).getAttribute('data-noteindex'), 10);
		var record = this.noteStore.getAt(index);

		if (record) {
			Zarafa.note.Actions.openNoteContent([record]);
		}
	},

	/**
	 * Empties and hides the panel.
	 * @private
	 */
	hideNotes: function()
	{
		this.shownMessageId = undefined;
		this.el.dom.innerHTML = '';
		this.setVisible(false);
	},

	/**
	 * Hides the panel and drops any request still in flight, so a late
	 * response cannot render onto an unrelated record.
	 * @private
	 */
	reset: function()
	{
		this.loadedMessageId = undefined;
		this.noteStore.proxy.cancelRequests('list');
		this.hideNotes();
	},

	/**
	 * @private
	 */
	onDestroy: function()
	{
		if (this.noteStore) {
			this.noteStore.destroy();
			this.noteStore = undefined;
		}

		Zarafa.note.ui.LinkedNoteLinks.superclass.onDestroy.apply(this, arguments);
	}
});

Ext.reg('zarafa.linkednotelinks', Zarafa.note.ui.LinkedNoteLinks);
