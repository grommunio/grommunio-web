Ext.namespace('Zarafa.mail.data');

/**
 * @class Zarafa.mail.data.Templates
 * 
 * An enum that contains all possible template string that can be used when rendering body in
 * mail dialog.
 * 
 * @singleton
 */
Zarafa.mail.data.Templates =
{
	/**
	 * The template that will be used to show body in plain text format.
	 * @property
	 * @type String
	 */
	plaintextQuotedTemplate	: 
			'<tpl if="Ext.isEmpty(values.signatureData)">' +
			'\n\n' +
			'</tpl>' +
			'<tpl if="!Ext.isEmpty(values.signatureData)">' +
			'{signatureData}' +
			'\n\n\n' +
			'</tpl>' +
			'-----' + _('Original message') + '-----\n' +
			'<tpl if="!Ext.isEmpty(values.sent_representing_name)">' +
				'> ' + _('From') + ': {sent_representing_name:htmlEncode} ' +
				'<tpl if="!Ext.isEmpty(values.sent_representing_email_address)">' +
					'<{sent_representing_email_address:htmlEncode}>' + 
				'</tpl>' + '\n' +
			'</tpl>' +
			'<tpl if="Ext.isDate(values.message_delivery_time)">' +
				// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
				'> ' + _('Sent') + ': {message_delivery_time:date(_("l jS F Y G:i"))}\n' +
			'</tpl>' +
			'<tpl if="!Ext.isEmpty(values.display_to)">' +
				'> ' + _('To') + ': {display_to}\n' +
			'</tpl>' +
			'<tpl if="!Ext.isEmpty(values.display_cc)">' +
				'> ' + _('Cc') + ': {display_cc}\n' +
			'</tpl>' +
			'> ' + _('Subject') + ': {subject:htmlEncode}\n' +
			'> \n' +
			'{body}',

	/**
	 * The template that will be used to show body in html format.
	 * @property
	 * @type String
	 */
	htmlQuotedTemplate	: 
			'{signatureData}' +
			'<blockquote style=\'border-left: 2px solid #325FBA; padding-left: 5px; margin: 0px 5px;\'>' +
				'<span style="font-family:tahoma,arial,helvetica,sans-serif; font-size: 10pt;">' +
					'-----' + _('Original message') + '-----<br />' +
					'<tpl if="!Ext.isEmpty(values.sent_representing_name)">' +
						'<span>' +
						'<strong>' + _('From') + ':</strong> {sent_representing_name:htmlEncode}&nbsp;' +
						'<tpl if="!Ext.isEmpty(values.sent_representing_email_address)">' +
							'&lt;{sent_representing_email_address:htmlEncode}&gt;' + 
						'</tpl>' + '</span><br />' +
					'</tpl>' +
					'<tpl if="Ext.isDate(values.message_delivery_time)">' +
						'<span>' +
						// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
						'<strong>' + _('Sent') + ':</strong> {message_delivery_time:date(_("l jS F Y G:i"))}</span><br />' +
					'</tpl>' +
					'<tpl if="!Ext.isEmpty(values.display_to)">' +
						'<span>' +
						'<strong>' + _('To') + ':</strong> {display_to:htmlEncode}</span><br />' +
					'</tpl>' +
					'<tpl if="!Ext.isEmpty(values.display_cc)">' +
						'<span>' +
						'<strong>' + _('Cc') + ':</strong> {display_cc:htmlEncode}</span><br />' +
					'</tpl>' +
						'<span>' +
						'<strong>' + _('Subject') + ':</strong> {subject:htmlEncode}</span><br />' +
					'<br />' +
				'</span>' +
				'{body}' +
			'</blockquote>'
};
