Ext.namespace('Zarafa.addressbook');

/**
 * @class Zarafa.addressbook.AddressBookEmailAddressesSubStore
 * @extends Zarafa.core.data.MAPISubStore
 */
Zarafa.addressbook.AddressBookEmailAddressesSubStore = Ext.extend(Zarafa.core.data.MAPISubStore, {
	
	/**
	 * @constructor
	 * @param config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		var recordType = Ext.data.Record.create([
			{ name: 'address', type: 'string' }
		]);

		Ext.applyIf(config, {
			// provide a default reader
			reader : new Zarafa.core.data.JsonReader({
				id : 'address',
				idProperty : 'address'
			}, recordType)
		});
		
		Zarafa.addressbook.AddressBookEmailAddressesSubStore.superclass.constructor.call(this, config);
	}
});
