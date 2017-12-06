/*
 * #dependsFile client/zarafa/core/mapi/ObjectType.js
 * #dependsFile client/zarafa/core/data/Record.js
 * #dependsFile client/zarafa/core/data/RecordFactory.js
 * #dependsFile client/zarafa/hierarchy/data/IPFSubStore.js
 */
Ext.namespace('Zarafa.hierarchy.data');

/**
 * @class Zarafa.hierarchy.data.MAPIStoreRecordFields
 * Array of {@link Ext.data.Field field} configurations for the
 * {@link Zarafa.core.data.IPFRecord IPFRecord} object.
 */
Zarafa.hierarchy.data.MAPIStoreRecordFields = [
	{name: 'store_entryid'},
	{name: 'common_view_entryid'},
	{name: 'object_type', type: 'int', defaultValue: Zarafa.core.mapi.ObjectType.MAPI_STORE},
	{name: 'display_name'},
	{name: 'mdb_provider'},
	{name: 'subtree_entryid'},
	{name: 'store_support_mask', type: 'int'},
	{name: 'store_size', type: 'int', defaultValue: null},
	{name: 'quota_warning', type: 'int', defaultValue: null},
	{name: 'quota_soft', type: 'int', defaultValue: null},
	{name: 'quota_hard', type: 'int', defaultValue: null},
	{name: 'user_name'},
	{name: 'mailbox_owner_entryid'},
	{name: 'mailbox_owner_name'},
	{name: 'default_folder_inbox'},
	{name: 'default_folder_outbox'},
	{name: 'default_folder_sent'},
	{name: 'default_folder_wastebasket'},
	{name: 'default_folder_favorites'},
	{name: 'default_folder_publicfolders'},
	{name: 'default_folder_calendar'},
	{name: 'default_folder_contact'},
	{name: 'default_folder_drafts'},
	{name: 'default_folder_journal'},
	{name: 'default_folder_note'},
	{name: 'default_folder_task'},
	{name: 'default_folder_todolist'},
	{name: 'default_folder_junk'},
	{name: 'default_folder_syncissues'},
	{name: 'default_folder_conflicts'},
	{name: 'default_folder_localfailures'},
	{name: 'default_folder_serverfailures'},
	{name: 'shared_folder_all'},
	{name: 'shared_folder_inbox'},
	{name: 'shared_folder_calendar'},
	{name: 'shared_folder_contact'},
	{name: 'shared_folder_note'},
	{name: 'shared_folder_task'}
];

Zarafa.core.data.RecordFactory.addFieldToObjectType(Zarafa.core.mapi.ObjectType.MAPI_STORE, Zarafa.hierarchy.data.MAPIStoreRecordFields);
Zarafa.core.data.RecordFactory.setSubStoreToObjectType(Zarafa.core.mapi.ObjectType.MAPI_STORE, 'folders', Zarafa.hierarchy.data.IPFSubStore);
Zarafa.core.data.RecordFactory.setSubStoreToObjectType(Zarafa.core.mapi.ObjectType.MAPI_STORE, 'favorites', Zarafa.common.favorites.data.MAPIFavoritesSubStore);

Zarafa.core.data.RecordFactory.addListenerToObjectType(Zarafa.core.mapi.ObjectType.MAPI_STORE, 'createphantom', function(record) {
	// Phantom records must always be marked as opened (they contain the full set of data)
	record.afterOpen();
});

/**
 * @class Zarafa.hierarchy.data.MAPIStoreRecord
 * @extends Zarafa.core.data.IPFRecord
 *
 */
Zarafa.hierarchy.data.MAPIStoreRecord = Ext.extend(Zarafa.core.data.IPFRecord, {
	/**
	 * The base array of ID properties which is copied to the {@link #idProperties}
	 * when the record is being created.
	 * @property
	 * @type Array
	 * @private
	 */
	baseIdProperties : [ 'store_entryid', 'user_name' ],

	/**
	 * Retrieves a folder by MAPI id.
	 * @param {String} entryid the MAPI entry id of the folder.
	 * @return {Zarafa.hierarchy.data.MAPIFolderRecord} folder object or undefined if not found.
	 */
	getFolder : function(entryid)
	{
		var store = this.getFolderStore();

		if (store) {
			return store.getById(entryid);
		}
	},

	/**
	 * @return {Boolean} True if this store supports search folders else false.
	 */
	hasSearchSupport : function()
	{
		if (this.get('store_support_mask')) {
			if(Zarafa.core.mapi.StoreSupportMask.hasSearchSupport(this.get('store_support_mask'))) {
				return true;
			}
		}

		return false;
	},

	/**
	 * @return {Boolean} True if this is the public {@link Zarafa.core.MAPIStore store}.
	 */
	isPublicStore : function()
	{
		return (this.get('mdb_provider') === Zarafa.core.mapi.MDBProvider.ZARAFA_STORE_PUBLIC_GUID);
	},

	/**
	 * @return {Boolean} True if this is the default {@link Zarafa.core.MAPIStore store}.
	 */
	isDefaultStore : function()
	{
		return (this.get('mdb_provider') === Zarafa.core.mapi.MDBProvider.ZARAFA_SERVICE_GUID);
	},

	/**
	 * @return {Boolean} returns true this is a shared store else false
	 */
	isSharedStore : function()
	{
		return (this.get('mdb_provider') === Zarafa.core.mapi.MDBProvider.ZARAFA_STORE_DELEGATE_GUID);
	},

	/**
	 * @return {Boolean} returns true if this is a archive store else false
	 */
	isArchiveStore : function()
	{
		return (this.get('mdb_provider') === Zarafa.core.mapi.MDBProvider.ZARAFA_STORE_ARCHIVER_GUID);
	},

	/**
	 * @param {String} entryid the MAPI entry id of the folder.
	 * @return {String} a default folder key ('inbox', 'contacts', etc.) if the folder is a default folder, or undefined if otherwise.
	 */
	getDefaultFolderKey : function(entryid)
	{
		for(var key in this.data) {
			if (key.indexOf('default_folder_') === 0 && this.get(key) == entryid) {
				return key.substring('default_folder_'.length);
			}
		}
	},

	/**
	 * Function will return default {@link Zarafa.hierarchy.data.MAPIFolderRecord MAPIFolderRecord}
	 * of this {@link Zarafa.hierarchy.data.MAPIStoreRecord MAPIStoreRecord}.
	 * @param {String} name name of the default folder (i.e. 'inbox' or 'contacts')
	 * @return {Zarafa.hierarchy.data.MAPIFolderRecord} folder if a default folder
	 * with the given name was found, or undefined otherwise.
	 */
	getDefaultFolder : function(name)
	{
		var defaultFolderID = this.get('default_folder_' + name);

		if(defaultFolderID) {
			return this.getFolder(defaultFolderID);
		}
	},

	/**
	 * @param {String} entryid the MAPI entry id of the folder.
	 * @return {String} a shared folder key ('inbox', 'contacts', etc.) if the folder is a shared folder, or undefined if otherwise.
	 */
	getSharedFolderKey : function(entryid)
	{
		for(var key in this.data) {
			if (key.indexOf('shared_folder_') === 0 && this.get(key) == entryid) {
				return key.substring('shared_folder_'.length);
			}
		}
	},

	/**
	 * Function will return shared {@link Zarafa.hierarchy.data.MAPIFolderRecord MAPIFolderRecord}
	 * of this {@link Zarafa.hierarchy.data.MAPIStoreRecord MAPIStoreRecord}.
	 * @param {String} name name of the shared folder (i.e. 'inbox' or 'contacts')
	 * @return {Zarafa.hierarchy.data.MAPIFolderRecord} folder if a shared folder
	 * with the given name was found, or undefined otherwise.
	 */
	getSharedFolder : function(name)
	{
		var sharedFolderID = this.get('shared_folder_' + name);

		if(sharedFolderID) {
			return this.getFolder(sharedFolderID);
		}
	},

	/**
	 * @return {Zarafa.hierarchy.data.MAPIFolderRecord} subtree folder.
	 */
	getSubtreeFolder : function()
	{
		return this.getFolder(this.get('subtree_entryid'));
	},

	/**
	 * Function is used to get the favorites root folder.
	 * @return {Zarafa.hierarchy.data.MAPIFolderRecord} favorites root folder.
	 */
	getFavoritesRootFolder : function ()
	{
		var defaultStore = container.getHierarchyStore().getDefaultStore();
		if(defaultStore) {
			return defaultStore.getFolder(this.get('common_view_entryid'));
		}
		return false;
	},

	/**
	 * Not to be implemented by {@link Zarafa.hierarchy.data.MAPIStoreRecord MAPIStoreRecord}
	 * Get the Message Action list for the {@link Zarafa.core.data.MAPIRecord record}.
	 * @return {Mixed} The Message Action list.
	 * @hide
	 */
	getMessageActions : Ext.emptyFn,

	/**
	 * Not to be implemented by {@link Zarafa.hierarchy.data.MAPIStoreRecord MAPIStoreRecord}
	 * Add action to Message Action list
	 * @param {String} name The action name to add to the list.
	 * @hide
	 */
	addMessageAction : Ext.emptyFn,

	/**
	 * Not to be implemented by {@link Zarafa.hierarchy.data.MAPIStoreRecord MAPIStoreRecord}
	 * Delete action from the Message Action list
	 * @param {String} name The action name to delete from the list.
	 * @hide
	 */
	deleteMessageAction : Ext.emptyFn,

	/**
	 * Not to be implemented bby {@link Zarafa.hierarchy.data.MAPIStoreRecord MAPIStoreRecord}
	 * Clear all Message Actions.
	 * @hide
	 */
	clearMessageActions : Ext.emptyFn,

	/**
	 * Not to be implemented by {@link Zarafa.hierarchy.data.MAPIStoreRecord MAPIStoreRecord}
	 * Copy the {@link Zarafa.hierarchy.data.MAPIFolderRecord MAPIFolderRecord} to a different {@link Zarafa.hierarchy.data.MAPIFolderRecord MAPIFolderRecord}.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder to copy the record to
	 * @hide
	 */
	copyTo : Ext.emptyFn,

	/**
	 * Not to be implemented by {@link Zarafa.hierarchy.data.MAPIStoreRecord MAPIStoreRecord}
	 * Move the {@link Zarafa.hierarchy.data.MAPIFolderRecord MAPIFolderRecord} to a different {@link Zarafa.hierarchy.data.MAPIFolderRecord MAPIFolderRecord}.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder to copy the record to
	 * @hide
	 */
	moveTo : Ext.emptyFn,

	/**
	 * Returns whether the MAPIStoreRecord supports the use of folders or not (See {@link #supportsSubStore}).
	 * @return {Boolean} True if folders are supported.
	 */
	supportsFolders: function()
	{
		return this.supportsSubStore('folders');
	},

	/**
	 * Creates a Folder store for the {@link Zarafa.hierarchy.data.IPFRecord IPFRecord} (See {@link #createSubStore}).
	 * @return {Zarafa.hierarchy.data.IPFSubStore} The new Folder store.
	 */
	createFolderStore : function()
	{
		return this.createSubStore('folders');
	},

	/**
	 * Set the Folder store for the {@link Zarafa.hierarchy.data.IPFRecord IPFRecord} (See {@link #setSubStore}).
	 * @param {Zarafa.hierarchy.data.IPFSubStore} folderStore The Folder store.
	 * @return {Zarafa.hierarchy.data.IPFSubStore} The Folder store.
	 */
	setFolderStore : function(folderStore)
	{
		return this.setSubStore('folders', folderStore);
	},

	/**
	 * Get the Folder store for the {@link Zarafa.core.data.IPFRecord IPFRecord} (See {@link #getSubStore}).
	 * @return {Zarafa.hierarchy.data.IPFSubStore} The Folder store.
	 */
	getFolderStore : function()
	{
		return this.getSubStore('folders');
	},

	/**
	 * Get the favorites store for the {@link Zarafa.core.data.IPFRecord IPFRecord}.
	 * @returns {Zarafa.hierarchy.data.IPFSubStore} The Favorites store.
	 */
	getFavoritesStore : function ()
	{
		var defaultStore = container.getHierarchyStore().getDefaultStore();
		if(defaultStore) {
			return defaultStore.getSubStore('favorites');
		}
		return false;
	}
});

Zarafa.core.data.RecordFactory.setBaseClassToObjectType(Zarafa.core.mapi.ObjectType.MAPI_STORE, Zarafa.hierarchy.data.MAPIStoreRecord);
