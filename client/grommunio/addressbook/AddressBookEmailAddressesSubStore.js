Ext.namespace('Grommunio.addressbook');

/**
 * @class Grommunio.addressbook.AddressBookEmailAddressesSubStore
 * @extends Grommunio.core.data.MAPISubStore
 */
Grommunio.addressbook.AddressBookEmailAddressesSubStore = Ext.extend(Grommunio.core.data.MAPISubStore, {

	/**
	 * @constructor
	 * @param config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		var recordType = Ext.data.Record.create([
			{ name: 'address', type: 'string' }
		]);

		Ext.applyIf(config, {
			// provide a default reader
			reader: new Grommunio.core.data.JsonReader({
				id: 'address',
				idProperty: 'address'
			}, recordType)
		});

		Grommunio.addressbook.AddressBookEmailAddressesSubStore.superclass.constructor.call(this, config);
	}
});
