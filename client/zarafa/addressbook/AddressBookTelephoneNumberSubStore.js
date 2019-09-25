Ext.namespace('Zarafa.addressbook');

/**
 * @class Zarafa.addressbook.AddressBookTelephoneNumberSubStore
 * @extends Zarafa.core.data.MAPISubStore
 */
Zarafa.addressbook.AddressBookTelephoneNumberSubStore = Ext.extend(Zarafa.core.data.MAPISubStore, {

	/**
	 * @constructor
	 * @param config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		var recordType = Ext.data.Record.create([
			{ name: 'number', type: 'string' }
		]);

		Ext.applyIf(config, {
			// provide a default reader
			reader : new Zarafa.core.data.JsonReader({
				root : 'item',
				id : 'number',
				idProperty : 'number'
			}, recordType)
		});
		
		Zarafa.addressbook.AddressBookTelephoneNumberSubStore.superclass.constructor.call(this, config);
	}
});
