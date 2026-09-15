/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * #dependsFile client/grommunio/core/data/RecordFactory.js
 * #dependsFile client/grommunio/core/data/RecordCustomObjectType.js
 */
Ext.namespace('Grommunio.common.restoreitem.data');

Grommunio.common.restoreitem.data.RestoreItemRecordFields = [
	{ name: 'entryid' },
	{ name: 'parent_entryid' },
	{ name: 'store_entryid' },
	{ name: 'icon_index' },
	{ name: 'display_name' },
	{ name: 'deleted_on', type: 'date', dateFormat: 'timestamp', defaultValue: null },
	{ name: 'content_count', type: 'int', defaultValue: 0 },
	{ name: 'sender_name' },
	{ name: 'subject' },
	{ name: 'message_size', type: 'int', defaultValue: 0 },
	{ name: 'message_class' },
	{ name: 'object_type' },
	{ name: 'message_delivery_time', type: 'date', dateFormat: 'timestamp', defaultValue: null },
	{ name: 'message_flags', type: 'int', defaultValue: Grommunio.core.mapi.MessageFlags.MSGFLAG_READ },
	{ name: 'hasattach', type: 'boolean', defaultValue: false }
];

/**
 * @class Grommunio.common.restoreitem.data.RestoreItemRecord
 * @extends Grommunio.core.data.MAPIRecord
 */
Grommunio.common.restoreitem.data.RestoreItemRecord = Ext.extend(Grommunio.core.data.MAPIRecord, {

	/**
	 * This method is actually required by {@link Grommunio.common.ui.IconClass IconClass}.
	 * Icon class checks that folder is a default folder or not, but we can't have default
	 * folders in restore item store, so its not necessary to check for default folder.
	 * This function will always return false to make sure that icon class will properly
	 * work with restore records.
	 */
	getDefaultFolderKey: function()
	{
		return undefined;
	},

	/**
	 * Returns a {@link Grommunio.hierarchy.data.MAPIStoreRecord MAPIStoreRecord}
	 * @return {Grommunio.hierarchy.data.MAPIStoreRecord} MAPIStoreRecord
	 */
	getMAPIStore: function()
	{
		var store = container.getHierarchyStore();
		return store.getById(this.get('store_entryid'));
	},

	/**
	 * This method is actually required by {@link Grommunio.common.ui.IconClass IconClass}
	 * but ipmsubtree can never be deleted nor restored, so we can safely returns false
	 * and make this record behave properly with the iconclass
	 * @return {Boolean} false by default.
	 */
	isIPMSubTree: function()
	{
		return false;
	},

	/**
	 * Convenience method for determining if the message has been read or not.
	 * @return {Boolean} True if this item has been read.
	 */
	isRead: function()
	{
		if (Ext.isDefined(this.get('message_flags'))) {
			return (this.get('message_flags') & Grommunio.core.mapi.MessageFlags.MSGFLAG_READ) > 0;
		} else {
			return true;
		}
	}
});

// Register a custom type to be used by the Record Factory
Grommunio.core.data.RecordCustomObjectType.addProperty('GROMMUNIO_RESTOREITEM');
Grommunio.core.data.RecordFactory.addFieldToCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_RESTOREITEM, Grommunio.common.restoreitem.data.RestoreItemRecordFields);
Grommunio.core.data.RecordFactory.setBaseClassToCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_RESTOREITEM, Grommunio.common.restoreitem.data.RestoreItemRecord);
