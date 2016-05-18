Ext.namespace('Zarafa.addressbook');

/**
 * @class Zarafa.addressbook.AddressBookSubStore
 * @extends Zarafa.addressbook.AddressBookStore
 *
 * Special {@link Zarafa.addressbook.AddressBookStore} which can act as a substore
 * of other {@link Zarafa.addressbook.AddressBookRecord}.
 */
Zarafa.addressbook.AddressBookSubStore = Ext.extend(Zarafa.addressbook.AddressBookStore, {
	/**
	 * The {@link Zarafa.core.data.MAPIRecord MAPIRecord} that is the parent of this store.
	 * @property
	 * @type Zarafa.core.data.MAPIRecord
	 */
	parentRecord: null,

	constructor : function(config)
	{
		config = config || {};

		var recordType = Zarafa.core.data.RecordFactory.getRecordClassByObjectType(Zarafa.core.mapi.ObjectType.MAPI_MAILUSER);

		Ext.applyIf(config, {
			// provide a default reader
			reader : new Zarafa.core.data.JsonReader({
				root : 'item'
			}, recordType)
		});

		Zarafa.addressbook.AddressBookSubStore.superclass.constructor.call(this, config);
	},

	/**
	 * Get the {@link Zarafa.core.data.IPFRecord IPFRecord} that is the parent of this store.
	 * @return {Zarafa.core.data.IPFRecord} The parent IPFRecord.
	 */
	getParentRecord : function()
	{   
		return this.parentRecord;
	},

	/**
	 * Set the {@link Zarafa.core.data.IPFRecord IPFRecord} that is the parent of this store.
	 * @param {Zarafa.core.data.IPFRecord} record The parent IPFRecord.
	 */
	setParentRecord : function(record)
	{
		this.parentRecord = record;
	}
});
