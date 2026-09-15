/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.mail.attachitem');

/**
 * @class Grommunio.mail.attachitem.AttachMailRenderer
 * @extends Grommunio.common.attachment.dialogs.AttachItemBaseRenderer
 *
 * Renderer that can be used to get text data from {@link Grommunio.mail.MailRecord MailRecord}.
 */
Grommunio.mail.attachitem.AttachMailRenderer = Ext.extend(Grommunio.common.attachment.dialogs.AttachItemBaseRenderer, {
	/**
	 * Constructor will initialize default properties
	 * @param {Object} config configuration object
	 */
	constructor: function(config)
	{
		Grommunio.mail.attachitem.AttachMailRenderer.superclass.constructor.call(this, config);

		Ext.apply(this.labels, {
			'message_delivery_time': _('Sent')
		});
	},

	/**
	 * Function should be used to generate template which can be used by {@link #generateText} to add data into template and return the string that is generated.
	 * This will generate template for the html format only.
	 * @return {String} The HTML for the XTemplate to use
	 */
	generateHTMLTemplate: function()
	{
		var html = '';

		html += this.addHTMLRowGroup({
			'from': '{from:htmlEncode}',
			// # TRANSLATORS: See http://docs.sencha.com/extjs/3.4.0/#!/api/Date for the meaning of these formatting instructions
			'message_delivery_time': '{message_delivery_time:formatDefaultTimeString("' + _("l jS F Y {0}") + '")}',
			'display_to': '{display_to:htmlEncode}',
			'display_cc': '{display_cc:htmlEncode}',
			'display_bcc': '{display_bcc:htmlEncode}',
			'subject': '{subject:htmlEncode}',
			'attachment_names': '{attachment_names:htmlEncode}'
		});

		html += this.addHTMLRowGroup({
			'sensitivity': '{sensitivity:sensitivityString}',
			'importance': '{importance:importanceString}'
		});

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

		html += this.addPlainRowGroup({
			'from': '{from}',
			// # TRANSLATORS: See http://docs.sencha.com/extjs/3.4.0/#!/api/Date for the meaning of these formatting instructions
			'message_delivery_time': '{message_delivery_time:formatDefaultTimeString("' + _("l jS F Y {0}") + '")}',
			'display_to': '{display_to}',
			'display_cc': '{display_cc}',
			'display_bcc': '{display_bcc}',
			'subject': '{subject}',
			'attachment_names': '{attachment_names}'
		});

		html += this.addPlainRowGroup({
			'sensitivity': '{sensitivity:sensitivityString}',
			'importance': '{importance:importanceString}'
		});

		html += this.addPlainRow('categories', '{categories}');
		html += '{body}';

		return html;
	}
});
