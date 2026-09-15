Ext.namespace('Grommunio.addressbook');

/**
 * @class Grommunio.addressbook.AddressBookSubStore
 * @extends Grommunio.addressbook.AddressBookStore
 *
 * Special {@link Grommunio.addressbook.AddressBookStore} which can act as a substore
 * of other {@link Grommunio.addressbook.AddressBookRecord}.
 */
Grommunio.addressbook.AddressBookSubStore = Ext.extend(Grommunio.addressbook.AddressBookStore, {
	/**
	 * The {@link Grommunio.core.data.MAPIRecord MAPIRecord} that is the parent of this store.
	 * @property
	 * @type Grommunio.core.data.MAPIRecord
	 */
	parentRecord: null,

	constructor: function(config)
	{
		config = config || {};

		var recordType = Grommunio.core.data.RecordFactory.getRecordClassByObjectType(Grommunio.core.mapi.ObjectType.MAPI_MAILUSER);

		Ext.applyIf(config, {
			// provide a default reader
			reader: new Grommunio.core.data.JsonReader({
				root: 'item'
			}, recordType)
		});

		Grommunio.addressbook.AddressBookSubStore.superclass.constructor.call(this, config);
	},

	/**
	 * Get the {@link Grommunio.core.data.IPFRecord IPFRecord} that is the parent of this store.
	 * @return {Grommunio.core.data.IPFRecord} The parent IPFRecord.
	 */
	getParentRecord: function()
	{
		return this.parentRecord;
	},

	/**
	 * Set the {@link Grommunio.core.data.IPFRecord IPFRecord} that is the parent of this store.
	 * @param {Grommunio.core.data.IPFRecord} record The parent IPFRecord.
	 */
	setParentRecord: function(record)
	{
		this.parentRecord = record;
	}
});
