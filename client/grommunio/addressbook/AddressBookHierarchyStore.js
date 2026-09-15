/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * #dependsFile client/grommunio/addressbook/AddressBookHierarchyProxy.js
 */
Ext.namespace('Grommunio.addressbook');

/**
 * @class Grommunio.addressbook.AddressBookHierarchyStore
 * @extends Grommunio.core.data.ListModuleStore
 * @xtype grommunio.addressbookhierarchystore
 * this will contain all records {@link Grommunio.addressbook.AddressbookHierchyRecord}
 * fetched from the server side, stores all available addressbooks from all
 * available server side MAPI stores
 */
Grommunio.addressbook.AddressBookHierarchyStore = Ext.extend(Grommunio.core.data.ListModuleStore, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			preferredMessageClass: 'addressbook',
			standalone: true,
			proxy: new Grommunio.addressbook.AddressBookHierarchyProxy(),
			sortInfo: {
				field: 'display_name',
				direction: 'desc'
			}
		});

		Grommunio.addressbook.AddressBookHierarchyStore.superclass.constructor.call(this, config);
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
	 * Function which is use to load {@link Grommunio.addressbook.AddressBookHierarchyStore store}
	 */
	loadAddressBookHierarchy: function ()
	{
		Grommunio.addressbook.AddressBookHierarchyStore.load({
			actionType: Grommunio.core.Actions.list,
			params: {
				subActionType: Grommunio.core.Actions.hierarchy,
				gab: 'all'
			}
		});
	},

	/**
	 * Notification handler called by {@link #onNotify} when
	 * a {@link Grommunio.core.data.Notifications#objectModified objectModified}
	 * notification has been received.
	 *
	 * This will update the address book hierarchy store
	 *
	 * @param {Grommunio.core.data.Notifications} action The notification action
	 * @param {Ext.data.Record/Array} records The record or records which have been affected by the notification.
	 * @param {Object} data The data which has been received from the PHP-side which must be applied
	 * to the given records.
	 * @param {Number} timestamp The {@link Date#getTime timestamp} on which the notification was received
	 * @param {Boolean} success The success status, True if the notification was successfully received.
	 * @private
	 */
	onNotifyObjectmodified: function(action, records, data, timestamp, success)
	{
		this.loadAddressBookHierarchy();
	}
});

Ext.reg('grommunio.addressbookhierarchystore', Grommunio.addressbook.AddressBookHierarchyStore);

Grommunio.onUIReady(function(){
	// Make a singleton of the address book store and load it immediately
	// Note: The typeof check is necessary for the js tests
	if ( typeof Grommunio.addressbook.AddressBookHierarchyStore === 'function' ){
		Grommunio.addressbook.AddressBookHierarchyStore = new Grommunio.addressbook.AddressBookHierarchyStore();
		Grommunio.addressbook.AddressBookHierarchyStore.on('load', function(){
			// Filter out shared contact folders from delegate stores that are
			// no longer open in the hierarchy (e.g. auto-hooked stores that
			// the user has closed within this session). After a full reload
			// the stores reappear in the hierarchy, so they pass the filter.
			var hierarchyStore = container.getHierarchyStore();
			if (hierarchyStore) {
				var closedStoreRecords = [];
				Grommunio.addressbook.AddressBookHierarchyStore.each(function(record) {
					var storeEntryId = record.get('store_entryid');
					if (record.get('type') === 'sharedcontacts' &&
						record.get('depth') > 0 && storeEntryId) {
						var storeFound = false;
						hierarchyStore.each(function(mapiStore) {
							if (Grommunio.core.EntryId.compareEntryIds(
								mapiStore.get('store_entryid'), storeEntryId)) {
								storeFound = true;
								return false;
							}
						});
						if (!storeFound) {
							closedStoreRecords.push(record);
						}
					}
				});
				Ext.each(closedStoreRecords, function(record) {
					Grommunio.addressbook.AddressBookHierarchyStore.remove(record);
				});
			}

			// Add a property to identify group headers and remove group headers that don't
			// have any group members (e.g. All Address Lists)
			var removeRecords = [];
			var storeCount = Grommunio.addressbook.AddressBookHierarchyStore.getCount();
			Grommunio.addressbook.AddressBookHierarchyStore.each(function(record, index){
				// The GAB has index 0
				if ( index>0 && record.get('depth')===0 ){
					if (
						index === storeCount - 1 ||
						Grommunio.addressbook.AddressBookHierarchyStore.getAt(index+1).get('depth') === 0
					){
						removeRecords.push(record);
					} else {
						record.set('group_header', true);
					}
				} else {
					record.set('group_header', false);
				}
			});

			Ext.each(removeRecords, function(record){
				Grommunio.addressbook.AddressBookHierarchyStore.remove(record);
			});
		});

		Grommunio.addressbook.AddressBookHierarchyStore.loadAddressBookHierarchy();
	}
});
