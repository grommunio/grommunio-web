Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.IPMRecipientResolveRecord
 * Contains a description of what the data that will be used to resolve an user looks like. It is 
 * used by the reader in the Zarafa.core.data.CheckNamesResponseHandler.
 */
Zarafa.core.data.IPMRecipientResolveRecordFields = [
	{name: 'user_name'},
	{name: 'display_name'},
	{name: 'address_type'},
	{name: 'smtp_address'},
	{name: 'email_address'},
	{name: 'entryid'},
	{name: 'search_key'},
	{name: 'object_type', type: 'int'},
	{name: 'display_type', type: 'int'},
	{name: 'display_type_ex', type: 'int'}

];
Zarafa.core.data.IPMRecipientResolveRecord = Ext.data.Record.create(Zarafa.core.data.IPMRecipientResolveRecordFields);
