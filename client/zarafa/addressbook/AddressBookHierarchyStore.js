/*
 * #dependsFile client/zarafa/addressbook/AddressBookHierarchyProxy.js
 */
Ext.namespace('Zarafa.addressbook');

/**
 * @class Zarafa.addressbook.AddressBookHierarchyStore
 * @extends Zarafa.core.data.ListModuleStore
 * @xtype zarafa.addressbookhierarchystore
 * this will contain all records {@link Zarafa.addressbook.AddressbookHierchyRecord}
 * fetched from the server side, stores all available addressbooks from all
 * avilable server side MAPI stores
 */
Zarafa.addressbook.AddressBookHierarchyStore = Ext.extend(Zarafa.core.data.ListModuleStore, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			preferredMessageClass : 'addressbook',
			standalone: true,
			proxy : new Zarafa.addressbook.AddressBookHierarchyProxy(),
			sortInfo : {
				field : 'display_name',
				direction : 'desc'
			}
		});

		Zarafa.addressbook.AddressBookHierarchyStore.superclass.constructor.call(this, config);
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
	}
});

Ext.reg('zarafa.addressbookhierarchystore', Zarafa.addressbook.AddressBookHierarchyStore);
