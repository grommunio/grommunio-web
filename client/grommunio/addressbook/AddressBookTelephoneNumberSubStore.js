Ext.namespace('Grommunio.addressbook');

/**
 * @class Grommunio.addressbook.AddressBookTelephoneNumberSubStore
 * @extends Grommunio.core.data.MAPISubStore
 */
Grommunio.addressbook.AddressBookTelephoneNumberSubStore = Ext.extend(Grommunio.core.data.MAPISubStore, {

	/**
	 * @constructor
	 * @param config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		var recordType = Ext.data.Record.create([
			{ name: 'number', type: 'string' }
		]);

		Ext.applyIf(config, {
			// provide a default reader
			reader: new Grommunio.core.data.JsonReader({
				root: 'item',
				id: 'number',
				idProperty: 'number'
			}, recordType)
		});

		Grommunio.addressbook.AddressBookTelephoneNumberSubStore.superclass.constructor.call(this, config);
	}
});
