Ext.namespace('Zarafa.addressbook');

/**
 * @class Zarafa.addressbook.AddressBookStore
 * @extends Zarafa.core.data.ListModuleStore
 * @xtype zarafa.addressbookstore
 *
 * this will contain all records fetched from the server side code
 */
Zarafa.addressbook.AddressBookStore = Ext.extend(Zarafa.core.data.ListModuleStore, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		var recordType = Zarafa.core.data.RecordFactory.getRecordClassByObjectType(Zarafa.core.mapi.ObjectType.MAPI_MAILUSER);

		Ext.applyIf(config, {
			preferredMessageClass : 'addressbook',
			standalone:  true,
			sortInfo : {
				field : 'fileas',
				direction : 'asc'
			},
			reader : new Zarafa.core.data.JsonReader({}, recordType)
		});

		Zarafa.addressbook.AddressBookStore.superclass.constructor.call(this, config);
	},

	/**
	 * Compare a {@link Ext.data.Record#id ids} to determine if they are equal.
	 * This will apply the {@link Zarafa.core.EntryId#compareABEntryIds compareABEntryIds} function
	 * on both ids, as all records in this store will have a Address Book EntryId as unique key.
	 * @param {String} a The first id to compare
	 * @param {String} b The second id to compare
	 * @protected
	 */
	idComparison : function(a, b)
	{
		return Zarafa.core.EntryId.compareABEntryIds(a, b);
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
	getRecordKey : function(o)
	{
		if (o.get('email_index') && o.get('email_index') !== -1) {
			return o.id + '_' + o.get('email_index');
		} else {
			return o.id;
		}
	}
});

Ext.reg('zarafa.addressbookstore', Zarafa.addressbook.AddressBookStore);
