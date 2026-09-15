/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.note.attachitem');

/**
 * @class Grommunio.note.attachitem.AttachNoteRenderer
 * @extends Grommunio.common.attachment.dialogs.AttachItemBaseRenderer
 *
 * Renderer that can be used to get text data from {@link Grommunio.note.NoteRecord NoteRecord}.
 */
Grommunio.note.attachitem.AttachNoteRenderer = Ext.extend(Grommunio.common.attachment.dialogs.AttachItemBaseRenderer, {
	/**
	 * Function should be used to generate template which can be used by {@link #generateText} to add data into template and return the string that is generated.
	 * This will generate template for the html format only.
	 * @return {String} The HTML for the XTemplate to use
	 */
	generateHTMLTemplate: function()
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
	generatePlainTemplate: function()
	{
		var html = '';

		html += this.addPlainRow('categories', '{categories}');
		html += '{body}';

		return html;
	}
});
