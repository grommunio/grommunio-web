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
		html += this.addRow(_('From'), '{sender_name:htmlEncode}');
		// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
		html += this.addRow(_('Sent'), '{message_delivery_time:date("' + _("l jS F Y G:i") + '")}');
		html += this.optionalRow(_('To'), 'display_to', '{display_to:htmlEncode}');
		html += this.optionalRow(_('Cc'), 'display_cc', '{display_cc:htmlEncode}');
		html += this.optionalRow(_('Bcc'), 'display_bcc', '{display_bcc:htmlEncode}');
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
	}
});
