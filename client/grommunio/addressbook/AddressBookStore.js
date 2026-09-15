Ext.namespace('Grommunio.addressbook');

/**
 * @class Grommunio.addressbook.AddressBookStore
 * @extends Grommunio.core.data.ListModuleStore
 * @xtype grommunio.addressbookstore
 *
 * this will contain all records fetched from the server side code
 */
Grommunio.addressbook.AddressBookStore = Ext.extend(Grommunio.core.data.ListModuleStore, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		var recordType = Grommunio.core.data.RecordFactory.getRecordClassByObjectType(Grommunio.core.mapi.ObjectType.MAPI_MAILUSER);

		Ext.applyIf(config, {
			preferredMessageClass: 'addressbook',
			standalone: true,
			sortInfo: {
				field: 'full_name',
				direction: 'asc'
			},
			reader: new Grommunio.core.data.JsonReader({}, recordType)
		});

		Grommunio.addressbook.AddressBookStore.superclass.constructor.call(this, config);
	},

	/**
	 * Compare a {@link Ext.data.Record#id ids} to determine if they are equal.
	 * This will apply the {@link Grommunio.core.EntryId#compareABEntryIds compareABEntryIds} function
	 * on both ids, as all records in this store will have a Address Book EntryId as unique key.
	 * @param {String} a The first id to compare
	 * @param {String} b The second id to compare
	 * @protected
	 */
	idComparison: function(a, b)
	{
		return Grommunio.core.EntryId.compareABEntryIds(a, b);
	},

	/**
	 * For contacts with multiple email address, we show create multiple records for a single contact
	 * to show multiple entries with different email address for a single contact. But the entryid will
	 * be same for all these contacts so we can't use it as uniqueid, so we create uniqueid by appending
	 * email_index after entryid.
	 * @param {Ext.data.Record} o The record for which the key is requested
	 * @return {String} The key by which the record must be saved into the {@link Ext.util.MixedCollection}.
	 * @protected
	 */
	getRecordKey: function(o)
	{
		if (o.get('email_index') && o.get('email_index') !== -1) {
			return o.id + '_' + o.get('email_index');
		} else {
			return o.id;
		}
	}
});

Ext.reg('grommunio.addressbookstore', Grommunio.addressbook.AddressBookStore);
