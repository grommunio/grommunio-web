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
	openNoteContent : function(records, config)
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
	openCreateNoteContent : function(model, config)
	{
		var record = model.createRecord();
		Zarafa.core.data.UIFactory.openCreateRecord(record, config);
	}
};
