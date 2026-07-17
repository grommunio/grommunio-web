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
 * 'note_link_id'; the mail itself is never written to.
 *
 * The notes live in the Notes folder of the store the mail is in rather than in
 * the user's own, so everyone with access to a shared mailbox sees the same
 * notes. That is what makes this usable for coordinating on a shared mailbox.
 */
Zarafa.note.ui.LinkedNoteLinks = Ext.extend(Ext.Container, {
	/**
	 * The store the linked notes are loaded into. Private to this panel: the note
	 * {@link Zarafa.note.NoteContextModel context model} must not be used, because
	 * loading into it would replace what the Notes context is showing.
	 *
	 * @property
	 * @type Zarafa.note.NoteStore
	 * @private
	 */
	noteStore: undefined,

	/**
	 * The 'internet_message_id' {@link #noteStore} was last loaded for, used to skip
	 * reloading when {@link #update} fires again for the same mail.
	 *
	 * @property
	 * @type String
	 * @private
	 */
	loadedMessageId: undefined,

	/**
	 * @cfg {Ext.Template/String} linkedNotesTemplate The template applied to build the
	 * list of linked notes.
	 */
	linkedNotesTemplate:
			'<hr class="preview-title-hr">' +
			'<div class="preview-header-linkednotes-list">' +
				'<tpl for=".">' +
					'<div class="preview-header-linkednote {[this.colorName(values.color)]}" data-noteindex="{[xindex - 1]}">' +
						// A sticky note's subject is generated from the first line of
						// its body, so showing both would print the same text twice.
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
		this.mon(this.noteStore, 'load', this.onNoteStoreLoad, this);
		// A mailbox whose Notes folder cannot be read must not raise an error
		// dialog over the mail being previewed; it simply has no notes to show.
		this.mon(this.noteStore, 'exception', this.onNoteStoreException, this);
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
	 * Update the panel for the given {@link Zarafa.core.data.IPMRecord record}. Anything
	 * which is not a mail is ignored, as is a mail with no 'internet_message_id', which
	 * cannot be annotated because there is nothing to link a note to.
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
			this.clear();
			return;
		}

		// The updater plugin fires for every change to the record, reloading on each
		// would put a request behind things like marking the mail read.
		if (!contentReset && messageId === this.loadedMessageId) {
			return;
		}

		this.record = record;
		this.loadedMessageId = messageId;

		var folder = Zarafa.note.Actions.getLinkedNotesFolder(record);
		if (!folder) {
			this.clear();
			return;
		}

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
	 * Event handler for the {@link Zarafa.note.NoteStore#load load} event. Renders the
	 * notes which were found. A mail with no notes shows nothing at all, so the header
	 * of an ordinary mail is left exactly as it was.
	 * @private
	 */
	onNoteStoreLoad: function(store, records)
	{
		if (!this.el || !this.el.dom) {
			return;
		}

		if (Ext.isEmpty(records)) {
			this.clear();
			return;
		}

		this.linkedNotesTemplate.overwrite(Ext.get(this.el.dom), Ext.pluck(records, 'data'));
		this.setVisible(true);
		this.doLayout();
	},

	/**
	 * Event handler for the {@link Zarafa.note.NoteStore#exception exception} event.
	 * Failing to read the notes folder is not worth interrupting the user over: the
	 * mail itself is unaffected, so the panel just stays hidden.
	 * @private
	 */
	onNoteStoreException: function()
	{
		this.clear();
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
	clear: function()
	{
		this.el.dom.innerHTML = '';
		this.setVisible(false);
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
