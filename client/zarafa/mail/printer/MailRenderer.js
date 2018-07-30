// -*- coding: utf-8; indent-tabs-mode: nil -*-
Ext.namespace('Zarafa.mail.printer');

/**
 * @class Zarafa.mail.printer.MailRenderer
 * @extends Zarafa.common.printer.renderers.RecordRenderer
 *
 * Prints a single email
 */
Zarafa.mail.printer.MailRenderer = Ext.extend(Zarafa.common.printer.renderers.RecordRenderer, {

	/**
	 * Generates a template on which prepareData() will be applied to create the HTML body.
	 * @param {zarafa.core.data.MAPIRecord} record the email to print
	 * @return {String} The HTML for the XTemplate to print
	 */
	generateBodyTemplate: function(record) {
		var html = '';
		html += '<b>{fullname:htmlEncode}</b>\n';
		html += '<hr>\n';
		html += '<table>\n';
		html += this.addRow(_('From'), '{formatted_from:htmlEncode}');
		// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
		html += this.addRow(_('Sent'), '{message_delivery_time:date("' + _("l jS F Y G:i") + '")}');
		html += this.optionalRow(_('To'), 'display_to', '{formatted_to:htmlEncode}');
		html += this.optionalRow(_('Cc'), 'display_cc', '{formatted_Cc:htmlEncode}');
		html += this.optionalRow(_('Bcc'), 'display_bcc', '{formatted_Bcc:htmlEncode}');
		html += this.addRow(_('Subject'), '{subject:htmlEncode}');
		html += this.addRow('', '');   // separator
		html += this.optionalRow(_('Sensitivity'), 'sensitivity', '{sensitivity:sensitivityString}');
		html += this.optionalRow(_('Importance'), 'importance', '{importance:importanceString}');
		html += '<tpl if="!Ext.isEmpty(values.sensitivity) || !Ext.isEmpty(values.importance)">';
		html += this.addRow('', '');   // separator
		html += '</tpl>';
		html += this.optionalRow(_('Attachments'), 'attachment_names', '{attachment_names:htmlEncode}');
		html += '</table><br><p>\n';
		// Strip tags such as {foo.bar}, otherwise they will be interpreted as XTemplate tag.
		// Strip line separator and paragraph separator, since they break JavaScript strings which breaks XTemplate's eval().
		html += record.getBody(true).replace(/{/g, '&#123;').replace(/}/g, '&#125;').replace(/\u2028/g, '').replace(/\u2029/g, '');
		html += '</p>\n';
		// Remove inline images when that are not downloaded.
		return record.isExternalContentBlocked() ? html.replace(/<img[^>]*>/g,"") : html;
	},

	/**
	 * Prepares data for any record for use in the XTemplate
	 * @param {Zarafa.core.data.MAPIRecord} record The mapi record to print
	 * @return {Array} Data suitable for use in the XTemplate
	 */
	prepareData: function(record) {
		var data = Zarafa.mail.printer.MailRenderer.superclass.prepareData(record);

		// add printer specific tags
		data['formatted_from'] = Ext.util.Format.htmlEncode(record.get('sender_name') +' <'+ record.get('sender_email_address') +'>;');
		var recipientStore = record.getSubStore('recipients');
		data['formatted_to'] = "";
		data['formatted_Cc'] = "";
		data['formatted_Bcc'] = "";
		recipientStore.each(function (recipient) {
			var name = recipient.get('display_name');
			var email = recipient.get('smtp_address');
			var formattedInfo = Ext.util.Format.htmlEncode(name + ' <' + email +'>; ');
			switch (recipient.get('recipient_type')) {
				case Zarafa.core.mapi.RecipientType.MAPI_CC:
					data['formatted_Cc'] += formattedInfo;
					break;
				case Zarafa.core.mapi.RecipientType.MAPI_BCC:
					data['formatted_Bcc'] += formattedInfo;
					break;
				case Zarafa.core.mapi.RecipientType.MAPI_TO:
				default:
					data['formatted_to'] += formattedInfo;
					break;
			}
		}, this);

		return data;
	}
});
