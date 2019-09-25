Ext.namespace('Zarafa.mail.attachitem');

/**
 * @class Zarafa.mail.attachitem.AttachMailRenderer
 * @extends Zarafa.common.attachment.dialogs.AttachItemBaseRenderer
 *
 * Renderer that can be used to get text data from {@link Zarafa.mail.MailRecord MailRecord}.
 */
Zarafa.mail.attachitem.AttachMailRenderer = Ext.extend(Zarafa.common.attachment.dialogs.AttachItemBaseRenderer, {
	/**
	 * Constructor will intialize default properties
	 * @param {Object} config configuration object
	 */
	constructor : function(config)
	{
		Zarafa.mail.attachitem.AttachMailRenderer.superclass.constructor.call(this, config);

		Ext.apply(this.labels, {
			'message_delivery_time' : _('Sent')
		});
	},

	/**
	 * Function should be used to generate template which can be used by {@link #generateText} to add data into template and return the string that is generated.
	 * This will generate template for the html format only.
	 * @return {String} The HTML for the XTemplate to use
	 */
	generateHTMLTemplate : function()
	{
		var html = '';

		html += this.addHTMLRowGroup({
			'from' : '{from:htmlEncode}',
			// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
			'message_delivery_time' : '{message_delivery_time:date("' + _("l jS F Y G:i") + '")}',
			'display_to' : '{display_to:htmlEncode}',
			'display_cc' : '{display_cc:htmlEncode}',
			'display_bcc' : '{display_bcc:htmlEncode}',
			'subject' : '{subject:htmlEncode}',
			'attachment_names' : '{attachment_names:htmlEncode}'
		});

		html += this.addHTMLRowGroup({
			'sensitivity' : '{sensitivity:sensitivityString}',
			'importance' : '{importance:importanceString}'
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
	generatePlainTemplate : function()
	{
		var html = '';

		html += this.addPlainRowGroup({
			'from' : '{from}',
			// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
			'message_delivery_time' : '{message_delivery_time:date("' + _("l jS F Y G:i") + '")}',
			'display_to' : '{display_to}',
			'display_cc' : '{display_cc}',
			'display_bcc' : '{display_bcc}',
			'subject' : '{subject}',
			'attachment_names' : '{attachment_names}'
		});

		html += this.addPlainRowGroup({
			'sensitivity' : '{sensitivity:sensitivityString}',
			'importance' : '{importance:importanceString}'
		});

		html += this.addPlainRow('categories', '{categories}');
		html += '{body}';

		return html;
	}
});