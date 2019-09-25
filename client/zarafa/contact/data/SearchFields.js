Ext.namespace('Zarafa.contact.data');

/**
 * @class Zarafa.contact.data.SearchFields
 * Search fields for search bar
 * @singleton
 */
Zarafa.contact.data.SearchFields = [{
	name : _('All text fields'),
	value : 'display_name display_name_prefix categories generation fileas company_name email_address_1 email_address_2 email_address_3 home_address other_address business_address home_telephone_number cellular_telephone_number business_telephone_number business_fax_number assistant_telephone_number business2_telephone_number callback_telephone_number car_telephone_number company_telephone_number home2_telephone_number home_fax_number other_telephone_number pager_telephone_number primary_fax_number primary_telephone_number radio_telephone_number telex_telephone_number ttytdd_telephone_number'
}, {
	name : _('Name'),
	value : 'display_name display_name_prefix generation'
}, {
	name : _('File as'),
	value : 'fileas'
}, {
	name : _('Company'),
	value : 'company_name'
}, {
	name : _('Email address'),
	value : 'email_address_1 email_address_2 email_address_3'
}, {
	name : _('Phone number'),
	value : 'home_telephone_number cellular_telephone_number business_telephone_number business_fax_number assistant_telephone_number business2_telephone_number callback_telephone_number car_telephone_number company_telephone_number home2_telephone_number home_fax_number other_telephone_number pager_telephone_number primary_fax_number primary_telephone_number radio_telephone_number telex_telephone_number ttytdd_telephone_number'
}, {
	name : _('Address'),
	value : 'home_address other_address business_address'
}];
