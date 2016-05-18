Ext.namespace('Zarafa.contact.attachitem');

/**
 * @class Zarafa.contact.attachitem.AttachContactRenderer
 * @extends Zarafa.common.attachment.dialogs.AttachItemBaseRenderer
 *
 * Renderer that can be used to get text data from {@link Zarafa.contact.ContactRecord ContactRecord}.
 */
Zarafa.contact.attachitem.AttachContactRenderer = Ext.extend(Zarafa.common.attachment.dialogs.AttachItemBaseRenderer, {
	/**
	 * Constructor will intialize default properties
	 * @param {Object} config configuration object
	 */
	constructor : function(config)
	{
		Zarafa.contact.attachitem.AttachContactRenderer.superclass.constructor.call(this, config);

		Ext.apply(this.labels, {
			'display_name' : _('Full Name'),
			'last_name' : _('Last Name'),
			'first_name' : _('First Name'),
			'job_title' : _('Job Title'),
			'department_name' : _('Department Name'),
			'company_name' : _('Company Name'),
			'im' : _('IM Address'),
			'home_address' : _('Home Address'),
			'business_address' : _('Business Address'),
			'other_address' : _('Other Address'),
			'office_telephone_number' : _('Business Phone'),
			'business2_telephone_number' : _('Business 2 Phone'),
			'assistant_telephone_number' : _('Assistant Phone'),
			'company_telephone_number' : _('Company Main Phone'),
			'home_telephone_number' : _('Home Phone'),
			'home2_telephone_number' : _('Home 2 Phone'),
			'cellular_telephone_number' : _('Mobile'),
			'car_telephone_number' : _('Car Phone'),
			'radio_telephone_number' : _('Radio'),
			'pager_telephone_number' : _('Pager'),
			'callback_telephone_number' : _('Callback Phone'),
			'other_telephone_number' : _('Other Phone'),
			'primary_telephone_number' : _('Primary Phone'),
			'telex_telephone_number' : _('Telex'),
			'ttytdd_telephone_number' : _('TTY/TDD Phone'),
			'isdn_number' : _('ISDN'),
			'other_fax_number' : _('Other Fax'),
			'business_fax_number' : _('Business Fax'),
			'home_fax_number' : _('Home Fax'),
			'email_address_1' : _('Email'),
			'email_address_display_name_1' : _('Email Display As'),
			'email_address_2' : _('Email 2'),
			'email_address_display_name_2' : _('Email2 Display As'),
			'email_address_3' : _('Email 3'),
			'email_address_display_name_3' : _('Email3 Display As'),
			'birthday' : _('Birthday'),
			'wedding_anniversary' : _('Wedding Anniversary'),
			'spouse_name' : _('Spouse/Partner'),
			'profession' : _('Profession'),
			'assistant' : _('Assistant\'s Name'),
			'webpage' : _('Webpage')
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
			'display_name' : '{display_name:htmlEncode}',
			'last_name' : '{last_name:htmlEncode}',
			'first_name' : '{first_name:htmlEncode}',
			'job_title' : '{job_title:htmlEncode}',
			'department_name' : '{department_name:htmlEncode}',
			'company_name' : '{company_name:htmlEncode}'
		});

		html += this.addHTMLRowGroup({
			'business_address' : '{business_address:htmlEncode}',
			'home_address' : '{home_address:htmlEncode}',
			'other_address' : '{other_address:htmlEncode}',
			'im' : '{im:htmlEncode}'
		});

		html += this.addHTMLRowGroup({
			'office_telephone_number' : '{office_telephone_number:htmlEncode}',
			'business2_telephone_number' : '{business2_telephone_number:htmlEncode}',
			'assistant_telephone_number' : '{assistant_telephone_number:htmlEncode}',
			'company_telephone_number' : '{company_telephone_number:htmlEncode}',
			'home_telephone_number' : '{home_telephone_number:htmlEncode}',
			'home2_telephone_number' : '{home2_telephone_number:htmlEncode}',
			'cellular_telephone_number' : '{cellular_telephone_number:htmlEncode}',
			'car_telephone_number' : '{car_telephone_number:htmlEncode}',
			'radio_telephone_number' : '{radio_telephone_number:htmlEncode}',
			'pager_telephone_number' : '{pager_telephone_number:htmlEncode}',
			'callback_telephone_number' : '{callback_telephone_number:htmlEncode}',
			'other_telephone_number' : '{other_telephone_number:htmlEncode}',
			'primary_telephone_number' : '{primary_telephone_number:htmlEncode}',
			'telex_telephone_number' : '{telex_telephone_number:htmlEncode}',
			'ttytdd_telephone_number' : '{ttytdd_telephone_number:htmlEncode}',
			'isdn_number' : '{isdn_number:htmlEncode}',
			'other_fax_number' : '{other_fax_number:htmlEncode}',
			'business_fax_number' : '{business_fax_number:htmlEncode}',
			'home_fax_number' : '{business_fax_number:htmlEncode}'
		});

		html += this.addHTMLRowGroup({
			'email_address_1' : '{email_address_1:htmlEncode}',
			'email_address_display_name_1' : '{email_address_display_name_1:htmlEncode}',
			'email_address_2' : '{email_address_2:htmlEncode}',
			'email_address_display_name_2' : '{email_address_display_name_2:htmlEncode}',
			'email_address_3' : '{email_address_3:htmlEncode}',
			'email_address_display_name_3' : '{email_address_display_name_3:htmlEncode}'
		});

		html += this.addHTMLRowGroup({
			// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
			'birthday' : '{birthday:date("' + _("l jS F Y G:i") + '")}',
			// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
			'wedding_anniversary' : '{wedding_anniversary:date("' + _("l jS F Y G:i") + '")}',
			'spouse_name' : '{spouse_name:htmlEncode}',
			'profession' : '{profession:htmlEncode}',
			'assistant' : '{assistant:htmlEncode}',
			'webpage' : '{webpage:htmlEncode}'
		});

		html += this.addHTMLRowGroup({
			'sensitivity' : '{sensitivity:sensitivityString}',
			'categories' : '{categories:htmlEncode}',
			'attachment_names' : '{attachment_names:htmlEncode}'
		});

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
			'display_name' : '{display_name}',
			'last_name' : '{last_name}',
			'first_name' : '{first_name}',
			'job_title' : '{job_title}',
			'department_name' : '{department_name}',
			'company_name' : '{company_name}'
		});

		html += this.addPlainRowGroup({
			'business_address' : '{business_address}',
			'home_address' : '{home_address}',
			'other_address' : '{other_address}',
			'im' : '{im}'
		});

		html += this.addPlainRowGroup({
			'office_telephone_number' : '{office_telephone_number}',
			'business2_telephone_number' : '{business2_telephone_number}',
			'assistant_telephone_number' : '{assistant_telephone_number}',
			'company_telephone_number' : '{company_telephone_number}',
			'home_telephone_number' : '{home_telephone_number}',
			'home2_telephone_number' : '{home2_telephone_number}',
			'cellular_telephone_number' : '{cellular_telephone_number}',
			'car_telephone_number' : '{car_telephone_number}',
			'radio_telephone_number' : '{radio_telephone_number}',
			'pager_telephone_number' : '{pager_telephone_number}',
			'callback_telephone_number' : '{callback_telephone_number}',
			'other_telephone_number' : '{other_telephone_number}',
			'primary_telephone_number' : '{primary_telephone_number}',
			'telex_telephone_number' : '{telex_telephone_number}',
			'ttytdd_telephone_number' : '{ttytdd_telephone_number}',
			'isdn_number' : '{isdn_number}',
			'other_fax_number' : '{other_fax_number}',
			'business_fax_number' : '{business_fax_number}',
			'home_fax_number' : '{business_fax_number}'
		});

		html += this.addPlainRowGroup({
			'email_address_1' : '{email_address_1}',
			'email_address_display_name_1' : '{email_address_display_name_1}',
			'email_address_2' : '{email_address_2}',
			'email_address_display_name_2' : '{email_address_display_name_2}',
			'email_address_3' : '{email_address_3}',
			'email_address_display_name_3' : '{email_address_display_name_3}'
		});

		html += this.addPlainRowGroup({
			// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
			'birthday' : '{birthday:date("' + _("l jS F Y G:i") + '")}',
			// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
			'wedding_anniversary' : '{wedding_anniversary:date("' + _("l jS F Y G:i") + '")}',
			'spouse_name' : '{spouse_name}',
			'profession' : '{profession}',
			'assistant' : '{assistant}',
			'webpage' : '{webpage}'
		});

		html += this.addPlainRowGroup({
			'sensitivity' : '{sensitivity:sensitivityString}',
			'categories' : '{categories}',
			'attachment_names' : '{attachment_names}'
		});

		html += '{body}';

		return html;
	}
});