// -*- coding: utf-8; indent-tabs-mode: nil -*-
Ext.namespace('Zarafa.contact.printer');

/**
 * @class Zarafa.contact.printer.ContactRenderer
 * @extends Zarafa.common.printer.renderers.RecordRenderer
 *
 * A printer for contacts in the same layout as for emails
 */
Zarafa.contact.printer.ContactRenderer = Ext.extend(Zarafa.common.printer.renderers.RecordRenderer, {

	/**
	 * Generate the XTemplate HTML text for printing a single contact or distlist.
	 * @param {Zarafa.core.data.MAPIRecord} record The task item to print
	 * @return {String} The HTML for the XTemplate to print
	 */
	generateBodyTemplate: function(record) {
		var html = '';
		html += '<b>{fullname:htmlEncode}</b>\n';
		html += '<hr>\n';
		html += '<table>\n';
		html += this.optionalRow(_('Full Name'), 'display_name', '{display_name:htmlEncode}');
		html += this.optionalRow(_('Last Name'), 'surname', '{surname:htmlEncode}');
		html += this.optionalRow(_('First Name'), 'given_name', '{given_name:htmlEncode}');
		html += this.optionalRow(_('Job Title'), 'title', '{title:htmlEncode}');
		html += this.optionalRow(_('Department'), 'department_name', '{department_name:htmlEncode}');
		html += this.optionalRow(_('Company'), 'company_name', '{company_name:htmlEncode}');
		html += this.addRow('', '');   // separator
		html += this.optionalRow(_('Business Address'), 'business_address',
			// american formatted address. translations can add more <br> and change sequence
			'{business_address_street:htmlEncode}<br>'
			+ '{business_address_city:htmlEncode} {business_address_state:htmlEncode} {business_address_postal_code:htmlEncode}<br>'
			+ '{business_address_country:htmlEncode}');
		html += this.optionalRow(_('IM Address'), 'im', '{im:htmlEncode}');
		html += this.addRow('', '');   // separator
		html += this.optionalRow(_('Home Address'), 'home_address',
			'{home_address_street:htmlEncode}<br>'
			+ '{home_address_city:htmlEncode} {home_address_state:htmlEncode} {home_address_postal_code:htmlEncode}<br>'
			+ '{home_address_country:htmlEncode}');
		html += this.addRow('', '');   // separator
		html += this.optionalRow(_('Business'), 'business_telephone_number', '{business_telephone_number:htmlEncode}');
		html += this.optionalRow(_('Home'), 'home_telephone_number', '{home_telephone_number:htmlEncode}');
		html += this.optionalRow(_('Mobile'), 'cellular_telephone_number', '{cellular_telephone_number:htmlEncode}');
		html += this.optionalRow(_('Business Fax'), 'business_fax_number', '{business_fax_number:htmlEncode}');
		html += this.addRow('', '');   // separator
		html += this.optionalRow(_('E-mail'), 'email_address_1', '{email_address_1:htmlEncode}');
		html += this.optionalRow(_('E-mail Display As'), 'email_address_display_name_1', '{email_address_display_name_1:htmlEncode}');
		html += this.optionalRow(_('E-mail 2'), 'email_address_2', '{email_address_2:htmlEncode}');
		html += this.optionalRow(_('E-mail 2 Display As'), 'email_address_display_name_2', '{email_address_display_name_2:htmlEncode}');
		html += this.optionalRow(_('E-mail 3'), 'email_address_3', '{email_address_3:htmlEncode}');
		html += this.optionalRow(_('E-mail 3 Display As'), 'email_address_display_name_3', '{email_address_display_name_3:htmlEncode}');
		html += this.addRow('', '');   // separator
		// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
		html += this.optionalRow(_('Birthday'), 'birthday', '{birthday:date("' + _("jS F Y") + '")}'); // 1st January 1912
		// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
		html += this.optionalRow(_('Anniversary'), 'wedding_anniversary', '{wedding_anniversary:date("' + _("jS F Y") + '")}');
		html += this.optionalRow(_('Spouse/Partner'), 'spouse_name', '{spouse_name:htmlEncode}');
		html += this.optionalRow(_('Profession'), 'profession', '{profession:htmlEncode}');
		html += this.optionalRow(_('Assistent'), 'assistent', '{assistent:htmlEncode}');
		html += this.addRow('', '');   // separator
		html += this.optionalRow(_('Categories'), 'categories', '{categories:htmlEncode}');
		html += this.optionalRow(_('Attachments'), 'attachment_names', '{attachment_names:htmlEncode}');
		html += '</table><br><p>\n';
		html += record.getBody(true);
		html += '</p>\n';
		return html;
	}
});

