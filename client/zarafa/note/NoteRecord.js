/*
 * #dependsFile client/zarafa/core/data/RecordFactory.js
 * #dependsFile client/zarafa/core/mapi/IconIndex.js
 */
Ext.namespace('Zarafa.note');

/**
 * @class Zarafa.note.NoteRecordFields
 * Array of {@link Ext.data.Field field} configurations for the
 * {@link Zarafa.core.data.IPMRecord IPMRecord} object.
 * These fields will be available in all 'IPM.StickyNote' type messages.
 */
Zarafa.note.NoteRecordFields = [
	{name: 'icon_index', type: 'int', defaultValue:Zarafa.core.mapi.IconIndex['note_yellow']},
	{name: 'color', type: 'int', defaultValue:Zarafa.core.mapi.NoteColor['note_yellow']}
];

Zarafa.core.data.RecordFactory.addFieldToMessageClass('IPM.StickyNote', Zarafa.note.NoteRecordFields);

/**
 * @class Zarafa.calendar.NoteRecord
 * @extends Zarafa.core.data.IPMRecord
 * 
 * An extension to the {@link Zarafa.core.data.IPMRecord IPMRecord} specific to Sticky Notes.
 */
Zarafa.note.NoteRecord = Ext.extend(Zarafa.core.data.IPMRecord, {
	/**
	 * Generate the subject from the first 28 characters of the notes body.
	 * if these 28 characters of note's body contains new line character than it should be truncated.
	 * truncation will be replaced with ellipsis ('...').
	 * @private
	 */
	generateSubject : function()
	{
		var text = this.get('body');

		// truncate body if it exceeds maximum subject length.
		if(text.length > 28) {
			text = Ext.util.Format.ellipsis(text, 28);
		}

		// we should break subject on new lines
		text = text.split(/\r\n|\r|\n/)[0];

		this.set('subject', text);

		return text;
	}
});
Zarafa.core.data.RecordFactory.setBaseClassToMessageClass('IPM.StickyNote', Zarafa.note.NoteRecord);