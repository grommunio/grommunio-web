Ext.namespace('Zarafa.mail.data');

/**
 * @class Zarafa.mail.data.SearchFields
 * @singleton
 *
 * Search fields for search bar
 */
Zarafa.mail.data.SearchFields = [{
	name : _('All text fields'),
	value : 'subject sender_name sender_email_address sent_representing_name sent_representing_email_address body display_to display_cc'
}, {
	name : _('Subject'),
	value : 'subject'
}, {
	name : _('Sender'),
	value : 'sender_name sender_email_address sent_representing_name sent_representing_email_address'
}, {
	name : _('Body'),
	value : 'body'
}, {
	name : _('Subject or Sender'),
	value : 'subject sender_name sender_email_address sent_representing_name sent_representing_email_address'
}, {
	name : _('To or cc'),
	value : 'display_to display_cc'
}];
