Ext.namespace('Zarafa.note.attachitem');

/**
 * @class Zarafa.note.attachitem.AttachNoteRenderer
 * @extends Zarafa.common.attachment.dialogs.AttachItemBaseRenderer
 *
 * Renderer that can be used to get text data from {@link Zarafa.note.NoteRecord NoteRecord}.
 */
Zarafa.note.attachitem.AttachNoteRenderer = Ext.extend(Zarafa.common.attachment.dialogs.AttachItemBaseRenderer, {
	/**
	 * Function should be used to generate template which can be used by {@link #generateText} to add data into template and return the string that is generated.
	 * This will generate template for the html format only.
	 * @return {String} The HTML for the XTemplate to use
	 */
	generateHTMLTemplate : function()
	{
		var html = '';

		html += this.addHTMLRow('categories', '{categories:htmlEncode}');
		html += '{body}';

		return html;
	},

	/**
	 * Function should be used to generate template which can be used by {@link #generateText} to add data into template and return the string that is generated.
	 * This will generate template for the plain text format only.
	 * @return {String} The HTML for the XTemplate to use
	 */
	generatePlainTemplate : function()
	{
		var html = '';

		html += this.addPlainRow('categories', '{categories}');
		html += '{body}';

		return html;
	}
});