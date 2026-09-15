/*
 * #dependsFile client/grommunio/core/data/RecordFactory.js
 * #dependsFile client/grommunio/core/mapi/IconIndex.js
 */
Ext.namespace('Grommunio.note');

/**
 * @class Grommunio.note.NoteRecordFields
 * Array of {@link Ext.data.Field field} configurations for the
 * {@link Grommunio.core.data.IPMRecord IPMRecord} object.
 * These fields will be available in all 'IPM.StickyNote' type messages.
 */
Grommunio.note.NoteRecordFields = [
	{name: 'icon_index', type: 'int', defaultValue:Grommunio.core.mapi.IconIndex['note_yellow']},
	{name: 'color', type: 'int', defaultValue:Grommunio.core.mapi.NoteColor['note_yellow']},
	// The mail this note annotates, empty when it is not linked to one.
	// See Grommunio.note.ui.LinkedNoteLinks.
	{name: 'note_link_id', type: 'string', defaultValue: ''},
	// kept together: a mail record is identified by all of its id properties
	{name: 'note_link_entryid'},
	{name: 'note_link_parent_entryid'},
	{name: 'note_link_subject', type: 'string', defaultValue: ''}
];

Grommunio.core.data.RecordFactory.addFieldToMessageClass('IPM.StickyNote', Grommunio.note.NoteRecordFields);

/**
 * @class Grommunio.calendar.NoteRecord
 * @extends Grommunio.core.data.IPMRecord
 *
 * An extension to the {@link Grommunio.core.data.IPMRecord IPMRecord} specific to Sticky Notes.
 */
Grommunio.note.NoteRecord = Ext.extend(Grommunio.core.data.IPMRecord, {
	/**
	 * Generate the subject from the first 28 characters of the notes body.
	 * if these 28 characters of note's body contains new line character than it should be truncated.
	 * truncation will be replaced with ellipsis ('...').
	 * @private
	 */
	generateSubject: function()
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
Grommunio.core.data.RecordFactory.setBaseClassToMessageClass('IPM.StickyNote', Grommunio.note.NoteRecord);
