Ext.namespace('Zarafa.note');

/**
 * @class Zarafa.note.Actions
 * Common actions which can be used within {@link Ext.Button buttons}
 * or other {@link Ext.Component components} with action handlers.
 * @singleton
 */
Zarafa.note.Actions = {
	/**
	 * Open a Panel in which the {@link Zarafa.core.data.IPMRecord record}
	 * can be viewed, or further edited.
	 *
	 * @param {Zarafa.core.data.IPMRecord} records The records to open
	 * @param {Object} config (optional) Configuration object used to create
	 * the Content Panel.
	 */
	openNoteContent: function(records, config)
	{
		Ext.each(records, function(record) {
			Zarafa.core.data.UIFactory.openViewRecord(record, config);
		});
	},

	/**
	 * Open a Panel in which a new {@link Zarafa.core.data.IPMRecord record} can be
	 * further edited.
	 *
	 * @param {Zarafa.note.NoteContextModel} model Context Model object that will be used
	 * to {@link Zarafa.note.NoteContextModel#createRecord create} the Task.
	 * @param {Object} config (optional) Configuration object used to create
	 * the Content Panel.
	 */
	openCreateNoteContent: function(model, config)
	{
		var record = model.createRecord();
		Zarafa.core.data.UIFactory.openCreateRecord(record, config);
	},

	/**
	 * Open a Panel in which a new {@link Zarafa.core.data.IPMRecord note} can be
	 * edited, linked to the given mail.
	 *
	 * The note is created in the Notes folder of the store the mail lives in, not
	 * in the user's own, so that everyone with access to a shared mailbox sees it.
	 * The mail is not written to, the link is held by the note alone.
	 *
	 * @param {Zarafa.core.data.IPMRecord} mailRecord The mail to link the note to
	 * @param {Object} config (optional) Configuration object used to create
	 * the Content Panel.
	 */
	openCreateLinkedNote: function(mailRecord, config)
	{
		var folder = Zarafa.note.Actions.getLinkedNotesFolder(mailRecord);
		if (!folder) {
			return;
		}

		var record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.StickyNote', {
			store_entryid: folder.get('store_entryid'),
			parent_entryid: folder.get('entryid'),
			note_link_id: mailRecord.get('internet_message_id'),
			note_link_entryid: mailRecord.get('entryid'),
			note_link_parent_entryid: mailRecord.get('parent_entryid'),
			note_link_subject: mailRecord.get('subject')
		});

		Zarafa.core.data.UIFactory.openCreateRecord(record, config);
	},

	/**
	 * Opens the mail a note annotates.
	 *
	 * The note stores the mail's entryid when the link is made. Should the mail have
	 * been moved since, that entryid no longer resolves and the mail cannot be opened
	 * this way; the link from the mail to its notes still holds, since that runs off
	 * the message id, which moving does not change.
	 *
	 * @param {Zarafa.core.data.IPMRecord} noteRecord The note whose mail to open
	 */
	openLinkedMail: function(noteRecord)
	{
		var mail = Zarafa.note.Actions.getLinkedMailRecord(noteRecord);
		if (!mail) {
			return;
		}

		Zarafa.core.data.UIFactory.openViewRecord(mail);
	},

	/**
	 * Returns a record for the mail a note annotates, or undefined when the note is
	 * not linked to one or too little was recorded to identify it.
	 *
	 * An already existing record for that mail is preferred over building a second
	 * one: two record objects for the same mail are compared against each other while
	 * it opens, and a mail is identified by all of entryid, parent_entryid and
	 * store_entryid together, so a copy carrying fewer of them breaks that comparison
	 * and the mail then never finishes loading.
	 *
	 * @param {Zarafa.core.data.IPMRecord} noteRecord The note
	 * @return {Zarafa.core.data.IPMRecord} The mail record, or undefined
	 */
	getLinkedMailRecord: function(noteRecord)
	{
		var entryid = noteRecord.get('note_link_entryid');
		if (Ext.isEmpty(entryid)) {
			return undefined;
		}

		var existing = Zarafa.note.Actions.findLoadedMailRecord(entryid);
		if (existing) {
			return existing;
		}

		// Nothing loaded for it, so build one. Notes made before the parent entryid
		// was recorded cannot be opened this way; the note still names its mail.
		var parentEntryid = noteRecord.get('note_link_parent_entryid');
		if (Ext.isEmpty(parentEntryid)) {
			return undefined;
		}

		// The note always lives in the same store as the mail it annotates, so the
		// note's own store locates the mail.
		var mail = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Note', {
			entryid: entryid,
			parent_entryid: parentEntryid,
			store_entryid: noteRecord.get('store_entryid')
		}, entryid);

		mail.opened = false;

		return mail;
	},

	/**
	 * Finds a record for the given mail among those already loaded, so that a second
	 * record object for the same mail is not created.
	 *
	 * @param {String} entryid The mail's entryid
	 * @return {Zarafa.core.data.IPMRecord} The record, or undefined when none is loaded
	 */
	findLoadedMailRecord: function(entryid)
	{
		var stores = [ container.getShadowStore() ];

		var mailContext = container.getContextByName('mail');
		if (mailContext && mailContext.getModel() && mailContext.getModel().getStore()) {
			stores.push(mailContext.getModel().getStore());
		}

		var found;
		Ext.each(stores, function(store) {
			store.each(function(record) {
				if (record.isMessageClass('IPM.Note', true) &&
					Zarafa.core.EntryId.compareEntryIds(record.get('entryid'), entryid)) {
					found = record;
					return false;
				}
			});
			return !found;
		});

		return found;
	},

	/**
	 * Returns the Notes folder of the store the given mail lives in, which is where
	 * notes linked to that mail are kept.
	 *
	 * @param {Zarafa.core.data.IPMRecord} mailRecord The mail record
	 * @return {Zarafa.hierarchy.data.MAPIFolderRecord} The notes folder, or undefined
	 * when the store or its Notes folder is not available to this user.
	 */
	getLinkedNotesFolder: function(mailRecord)
	{
		var store = container.getHierarchyStore().getById(mailRecord.get('store_entryid'));

		return store ? store.getDefaultFolder('note') : undefined;
	},

	/**
	 * Opens the options dialog for a note record.
	 *
	 * @param {Zarafa.core.data.IPMRecord|Zarafa.core.data.IPMRecord[]} records
	 * The record(s) for which the options are requested.
	 * @param {Object} config (optional) Configuration object used to create the Content Panel.
	 */
	openOptionsContent: function(records, config)
	{
		if (Array.isArray(records)) {
			records = records[0];
		}

		if (!records) {
			return;
		}

		config = Ext.applyIf(config || {}, {
			modal: true
		});

		var componentType = Zarafa.core.data.SharedComponentType['note.dialog.options'];
		Zarafa.core.data.UIFactory.openLayerComponent(componentType, records, config);
	}
};
