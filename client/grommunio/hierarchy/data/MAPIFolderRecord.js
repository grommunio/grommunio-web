/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * #dependsFile client/grommunio/core/mapi/ObjectType.js
 * #dependsFile client/grommunio/core/data/Record.js
 * #dependsFile client/grommunio/core/data/RecordFactory.js
 * #dependsFile client/grommunio/hierarchy/data/CounterTypes.js
 * #dependsFile client/grommunio/hierarchy/data/MAPIFolderPermissionsSubStore.js
 * #dependsFile client/grommunio/hierarchy/data/MAPIFolderSubStore.js
 */
Ext.namespace('Grommunio.hierarchy.data');

/**
 * @class Grommunio.hierarchy.data.MAPIFolderRecordFields
 * Array of {@link Ext.data.Field field} configurations for the
 * {@link Grommunio.hierarchy.data.MAPIFolderRecord MAPIFolderRecord} object.
 */
Grommunio.hierarchy.data.MAPIFolderRecordFields = [
	{name: 'entryid'},
	{name: 'parent_entryid'},
	{name: 'store_entryid'},
	{name: 'object_type', type: 'int', defaultValue: Grommunio.core.mapi.ObjectType.MAPI_FOLDER},
	{name: 'folder_type', type: 'int', defaultValue: Grommunio.core.mapi.MAPIFolderType.FOLDER_GENERIC},
	{name: 'folder_pathname'},
	{name: 'display_name'},
	{name: 'container_class', type: 'string', defaultValue: 'IPF.Note'},
	{name: 'content_count', type: 'int', defaultValue: 0},
	{name: 'content_unread', type: 'int', defaultValue: 0},
	{name: 'has_subfolder', type: 'boolean', defaultValue: false},
	{name: 'comment', type: 'string'},
	{name: 'creation_time', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'message_size', type: 'int'},
	{name: 'total_message_size', type: 'int'},
	{name: 'sendPermissions', type: 'int', useNull: true, defaultValue: null},
	{name: 'deleted_on', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'rights', type: 'int'},
	{name: 'access', type: 'int'},
	{name: 'extended_flags', type: 'int', defaultValue: 0},
	{name: 'assoc_content_count', type: 'int', defaultValue: 0},
	{name: 'is_unavailable', type: 'boolean', defaultValue: false},
	{name: 'isFavorites', type: 'boolean', defaultValue: false},
	{name: 'recursive', type: 'boolean', defaultValue: false}
];

Grommunio.core.data.RecordFactory.addFieldToObjectType(Grommunio.core.mapi.ObjectType.MAPI_FOLDER, Grommunio.hierarchy.data.MAPIFolderRecordFields);
Grommunio.core.data.RecordFactory.setSubStoreToObjectType(Grommunio.core.mapi.ObjectType.MAPI_FOLDER, 'permissions', Grommunio.hierarchy.data.MAPIFolderPermissionsSubStore);
Grommunio.core.data.RecordFactory.setSubStoreToObjectType(Grommunio.core.mapi.ObjectType.MAPI_FOLDER, 'folders', Grommunio.hierarchy.data.MAPIFolderSubStore);
Grommunio.core.data.RecordFactory.addListenerToObjectType(Grommunio.core.mapi.ObjectType.MAPI_FOLDER, 'createphantom', function(record) {
	// Phantom records must always be marked as opened (they contain the full set of data)
	record.afterOpen();
});

/**
 * @class Grommunio.hierarchy.data.MAPIFolderRecord
 * @extends Grommunio.core.data.IPFRecord
 *
 */
Grommunio.hierarchy.data.MAPIFolderRecord = Ext.extend(Grommunio.core.data.IPFRecord, {

	/**
	 * Usually called by the {@link Ext.data.Store} which owns the Record.
	 * Commits all changes made to the Record since either creation, or the last commit operation.
	 * <p>Developers should subscribe to the {@link Ext.data.Store#update} event
	 * to have their code notified of commit operations.</p>
	 * @param {Boolean} silent (optional) True to skip notification of the owning
	 * store of the change (defaults to false)
	 */
	commit: function()
	{
		// Check if the parent folder still is correct.
		if (this.cacheParentFolder) {
			if (!Grommunio.core.EntryId.compareEntryIds(this.get('parent_entryid'), this.cacheParentFolder.get('entryid'))) {
				delete this.cacheParentFolder;
			}
		}
		Grommunio.hierarchy.data.MAPIFolderRecord.superclass.commit.apply(this, arguments);
	},

	/**
	 * Returns a {@link Grommunio.hierarchy.data.MAPIStoreRecord MAPIStoreRecord} for the record
	 * @return {Grommunio.hierarchy.data.MAPIStoreRecord} MAPIStoreRecord or false if {@link Grommunio.core.data.IPFSubStore IPFSubStore}
	 * is not defined.
	 */
	getMAPIStore: function()
	{
		var store = this.getStore();
		if (store && store instanceof Grommunio.hierarchy.data.IPFSubStore) {
			return store.getParentRecord();
		} else {
			store = container.getHierarchyStore();
			return store.getById(this.get('store_entryid'));
		}
	},

	/**
	 * Returns the {@link Grommunio.hierarchy.data.IPFSubStore} which contains all folders
	 * of the store in which the current store is located. This is safer then using {@link #getStore},
	 * as this function will use {@link #getMAPIStore} to obtain the parent {@link Grommunio.hierarchy.data.MAPIStoreRecord}
	 * and is thus safe when the current record is located in the {@link Grommunio.core.data.ShadowStore}.
	 * @return {Grommunio.hierarchy.data.IPFSubStore} The substore containing all folders
	 */
	getMAPIFolderStore: function()
	{
		var store = this.getMAPIStore();
		if (store) {
			return store.getSubStore('folders');
		}

		return false;
	},

	/**
	 * @param {String} key key of the default folder entry (like inbox, contacts etc.)
	 * @return {Boolean} true if the folder has a type same as the passed argument type.
	 */
	isSpecialFolder: function(key)
	{
		return this.getDefaultFolderKey() === key;
	},

	/**
	 * @return {Boolean} true if folder is IPM_Subtree of own store
	 */
	isOwnRoot: function()
	{
		return (this.isIPMSubTree() && this.getMAPIStore().isDefaultStore());
	},

	/**
	 * Return {String} a shared folder key ('inbox', 'contacts', etc.) if the folder is a shared folder, or undefined otherwise.
	 */
	getSharedFolderKey: function()
	{
		var MAPIStore = this.getMAPIStore();
		if(MAPIStore) {
			return MAPIStore.getSharedFolderKey(this.get('entryid'));
		}
	},

	/**
	 * @return {Boolean} True iff the folder is a shared folder.
	 */
	isSharedFolder: function()
	{
		return !!Ext.isDefined(this.getSharedFolderKey());
	},

	/**
	 * @return {String} a default folder key ('inbox', 'contacts', etc.) if the folder is a default folder, or undefined if otherwise.
	 */
	getDefaultFolderKey: function()
	{
		var MAPIStore = this.getMAPIStore();
		if(MAPIStore) {
			return MAPIStore.getDefaultFolderKey(this.get('entryid'));
		}
	},

	/**
	 * This will check whether the selected folder is default folder or not.
	 * @return {Boolean} true if the folder is a default folder
	 */
	isDefaultFolder: function()
	{
		return !!Ext.isDefined(this.getDefaultFolderKey());
	},

	/**
	 * @return {Boolean} true if the folder is the subtree folder of its store else false.
	 */
	isIPMSubTree: function()
	{
		var MAPIStore = this.getMAPIStore();
		if(MAPIStore) {
			return Grommunio.core.EntryId.compareEntryIds(this.get('entryid'), MAPIStore.get('subtree_entryid'));
		}

		return false;
	},

	/**
	 * @return {Boolean} true if the folder is the to-do list search folder of the store, else false.
	 */
	isTodoListFolder: function()
	{
		var MAPIStore = container.getHierarchyStore().getDefaultStore();
		if (MAPIStore) {
			return Grommunio.core.EntryId.compareEntryIds(this.get('entryid'), MAPIStore.get('default_folder_todolist'));
		}
		return false;
	},

	/**
	 * @return {Boolean} true if the folder is the subtree folder of its store else false.
	 */
	isFavoritesRootFolder: function()
	{
		var MAPIStore = container.getHierarchyStore().getDefaultStore();
		if (MAPIStore) {
			return Grommunio.core.EntryId.compareEntryIds(this.get('entryid'), MAPIStore.get('common_view_entryid'));
		}
		return false;
	},

	/**
	 * Helper function which identify that folder is allow to drag and drop any item/folder.
	 * Special folders like search folder, favorites root folder and todo-list folder are not
	 * supported drag and drop items.
	 *
	 * @returns {boolean} return true if destination folder in normal or default folders else false.
	 */
	isDropTargetForItems: function()
	{
		return !(this.isSearchFolder() || this.isFavoritesRootFolder() || this.isTodoListFolder());
	},

	/**
	 * Helper function which identify that targeted folder is allow to drag-drop folder items or not.
	 *
	 * @returns {Boolean} return true if targeted folder allow to drag-drop any folder items else false.
	 */
	isDropTargetForFolders: function()
	{
		return this.isDropTargetForItems() && !this.isFavoritesFolder();
	},

	/**
	 * @returns {Boolean} true if the folder is the favorites folder else false.
	 */
	isFavoritesFolder: function()
	{
		return this.get('isFavorites');
	},

	/**
	 * @return {Boolean} true if the folder is the RSS feeds folder else false.
	 */
	isRSSFolder: function()
	{
		return Grommunio.core.ContainerClass.isClass(this.get('container_class'), 'IPF.Note.OutlookHomepage', true) && this.getParentFolder().isIPMSubTree();
	},

	/**
	 * @return {Boolean} true if the folder is the calendar folder else false.
	 */
	isCalendarFolder: function()
	{
		return Grommunio.core.ContainerClass.isClass(this.get('container_class'), 'IPF.Appointment', true);
	},

	/**
	 * @return {Boolean} true if the folder is the contact folder else false.
	 */
	isContactFolder: function()
	{
		return Grommunio.core.ContainerClass.isClass(this.get('container_class'), 'IPF.Contact', true);
	},

	/**
	 * @return {Boolean} true if the folder is search folder else false.
	 */
	isSearchFolder: function()
	{
		return this.get('folder_type') === Grommunio.core.mapi.MAPIFolderType.FOLDER_SEARCH;
	},

	/**
	 * Helper function to get display name of {@link Grommunio.hierarchy.data.MAPIFolderRecord MAPIFolderRecord},
	 * For a subtree folder it will get name of {@link Grommunio.hierarchy.data.MAPIStoreRecord MAPIStoreRecord},
	 * and for normal folders it will get it from display_name property.
	 * @return {String} name of the folder.
	 */
	getDisplayName: function()
	{
		if (this.isIPMSubTree()) {
			return this.getMAPIStore().get('display_name');
		} else if (this.isFavoritesRootFolder()){
			return _('Favorites');
		} else {
			return this.get('display_name');
		}
	},

	/**
	 * Helper function to obtain the fully qualified display name. For normal folders, this will return
	 * the same value as {@link #getDisplayName}, but for folders inside a shared store, this will return
	 * a string which includes the owner of the folder store. e.g.
	 * 'Calendar of John Doe' or 'Contacts in Public Folders'
	 * @return {String} name of the folder
	 */
	getFullyQualifiedDisplayName: function()
	{
		var store = this.getMAPIStore();

		if (this.isIPMSubTree()) {
			return this.getDisplayName();
		} else if (store.isPublicStore()) {
			/* # TRANSLATORS: Display name of a folder: "FOLDERNAME - STORENAME". */
			return String.format(_('{0} - {1}'), this.getDisplayName(), store.get('display_name'));
		} else if (store.isSharedStore()) {
			/* # TRANSLATORS: Displayed on top of a tree with folders: "FOLDERNAME - USERNAME". */
			return String.format(_('{0} - {1}'), this.getDisplayName(), store.get('mailbox_owner_name'));
		} else {
			return this.getDisplayName();
		}
	},

	/**
	 * Function will return parent {@link Grommunio.hierarchy.data.MAPIFolderRecord MAPIFolderRecord}
	 * of this {@link Grommunio.hierarchy.data.MAPIFolderRecord MAPIFolderRecord}.
	 * @return {Grommunio.hierarchy.data.MAPIFolderRecord} parent {@link Grommunio.hierarchy.data.MAPIFolderRecord MAPIFolderRecord} or
	 * false if parent folder doesn't exist.
	 */
	getParentFolder: function()
	{
		if (!this.cacheParentFolder) {
			// don't get parent folders above IPM_SUBTREE as we are not interested in it:)
			// and also in public store ipm_subtree['entryid'] === ipm_subtree['parent_entryid']
			var parentEntryid = this.get('parent_entryid');
			if (!this.isIPMSubTree() && !Ext.isEmpty(parentEntryid)) {
				this.cacheParentFolder = this.getMAPIFolderStore().getById(parentEntryid);
			}

			// Guarantee that the parent folder knows it has children...
			// Don't use record::set() as we don't want to trigger updates.
			if (this.cacheParentFolder) {
				this.cacheParentFolder.data.has_subfolder = true;
			}
		}

		return this.cacheParentFolder;
	},

	/**
	 * Function is used to check the {@link Grommunio.hierarchy.data.MAPIFolderRecord MAPIFolder}
	 * is a <b>descendant</b> folder of the default folders 'Deleted Items' or 'Junk Mails'.
	 * @return {Boolean} returns true if given folder belongs to 'Deleted Items' or 'Junk Mails' folder.
	 */
	isInDeletedItems: function()
	{
		var parentFolder = this.getParentFolder();
		if (!parentFolder || parentFolder.isIPMSubTree()) {
			// If there is no parent folder, or the parent is the subtree,
			// then the item is definitely not in the deleted items.
			return false;
		} else if (parentFolder.isSpecialFolder('wastebasket') || parentFolder.isSpecialFolder('junk')) {
			// The item is in the wastebasket or junk folder.
			// It is considered to be deleted.
			return true;
		} else {
			// Perhaps the parent is inside the deleted items?
			return parentFolder.isInDeletedItems();
		}
	},

	/**
	 * Function will return path of the {@link Grommunio.hierarchy.data.MAPIFolderRecord MAPIFolderRecord}
	 * in the form of \\Store name\parent\parent.
	 * @return {String} path of the {@link Grommunio.hierarchy.data.MAPIFolderRecord MAPIFolderRecord}
	 * related to ipm_subtree.
	 */
	getPath: function()
	{
		var path = '';
		var parentFolder = this.getParentFolder();

		while (parentFolder) {
			path = '\\' + parentFolder.getDisplayName() + path;

			if(parentFolder.isIPMSubTree()) {
				// Add extra slash to indicate the start of the path.
				path = '\\' + path;
			}

			parentFolder = parentFolder.getParentFolder();
		}

		return path;
	},

	/**
	 * @return {Boolean} True if the folder is a Favorite folder.
	 */
	isFavoriteFolder: function()
	{
		return this.isSpecialFolder('favorites');
	},

	/**
	 * Function is use to identify selected folder marks favorites.
	 *
	 * @return {Boolean} returns true if given record exists in {@link Grommunio.common.favorites.data.MAPIFavoritesSubStore favorites} store
	 * else return false;
	 */
	existsInFavorites: function()
	{
		var favoritesStore = this.getMAPIStore().getFavoritesStore();
		if(Ext.isDefined(favoritesStore)) {
			var recordIndex = favoritesStore.find('entryid', this.get('entryid'));
			return recordIndex !== -1;
		}
		return false;
	},

	/**
	 * Function is used to retrieve {@link Grommunio.common.favorites.data.FavoritesFolderRecord favorites} record
	 * from {@link Grommunio.common.favorites.data.MAPIFavoritesSubStore favorites} store.
	 * @return {Grommunio.common.favorites.data.FavoritesFolderRecord} return favorites folder record
	 */
	getFavoritesFolder: function()
	{
		return this.getMAPIStore().getFavoritesStore().getById(this.get('entryid'));
	},

	/**
	 * @return {Grommunio.hierarchy.data.MAPIFolderRecord} IPM_COMMON_VIEWS folder which is used as favorites root folder.
	 */
	getFavoritesRootFolder: function()
	{
		return this.getMAPIStore().getFavoritesRootFolder();
	},

	/**
	 * Add current {@link Grommunio.hierarchy.data.MAPIFolderRecord folder} to Favorites list
	 * it can be favorites/search folder.
	 *
	 * @param {String} searchStoreEntryId store entryId in which this search folder is belongs.
	 */
	addToFavorites: function(searchStoreEntryId)
	{
		this.addMessageAction('action_type', 'addtofavorites');
		var isSearchFolder = this.isSearchFolder();
		if (isSearchFolder) {
			this.addMessageAction('isSearchFolder', isSearchFolder);
			this.addMessageAction('search_store_entryid', searchStoreEntryId);
		}
	},

	/**
	 * Remove current {@link Grommunio.hierarchy.data.FavoritesFolderRecord folder} to Favorites list.
	 */
	removeFromFavorites: function()
	{
		this.addMessageAction('action_type', 'removefavorites');
		var isSearchFolder = this.isSearchFolder();
		if (isSearchFolder) {
			this.addMessageAction('isSearchFolder', isSearchFolder);
		}
	},

	/**
	 * Empty the {@link Grommunio.hierarchy.data.MAPIFolderRecord DeletedItems} folder
	 */
	emptyFolder: function()
	{
		//@TODO: fire event beforeemptyfolder

		this.addMessageAction('action_type', 'emptyfolder');
	},

	/**
	 * Mark all messages contained by this {@link Grommunio.hierarchy.data.MAPIFolderRecord folder}
	 */
	seadReadFlags: function()
	{
		this.addMessageAction('action_type', 'readflags');
	},

	/**
	 * Returns all child folders of given folder.
	 *
	 * @return {Array} array of child {@link Grommunio.hierarchy.data.MAPIFolderRecord folders}
	 */
	getChildren: function()
	{
		var rs = [];

		if (this.get('has_subfolder')) {
			this.getMAPIFolderStore().each(function(record) {
				if (this === record.getParentFolder()) {
					rs.push(record);
				}
			}, this);
		}

		return rs;
	},

	/**
	 * Get {@link Grommunio.hierarchy.data.CounterTypes CounterType} to be used to display unread/total items in a
	 * {@link Grommunio.hierarchy.data.MAPIFolderRecord MAPIFolderRecord}. Which will be added to {@link Grommunio.hierarchy.ui.FolderNode FolderNode}.
	 * Function will also check which counter should be shown based on extended_flags property, and it will also check
	 * if the counter value is greater then zero or not if it is not then not logical to return counter type as it will
	 * not be useful.
	 * @return {Grommunio.hierarchy.data.CounterTypes}	type of counter.
	 */
	getCounterType: function()
	{
		// Non-openable hierarchy elements should never show counters
		if (this.isIPMSubTree() || this.isFavoritesRootFolder()) {
			return Grommunio.hierarchy.data.CounterTypes.NONE;
		}

		var extendedFlags = this.get('extended_flags');

		if ((extendedFlags & Grommunio.core.mapi.FolderExtendedFlags.DEFAULT) === Grommunio.core.mapi.FolderExtendedFlags.DEFAULT) {
			// ExtendedFlags are either not set on folder or it should use default implementation
			// Drafts, Outbox, and Junk intentionally display total item count.
			var isSpecial = this.isSpecialFolder('drafts') || this.isSpecialFolder('outbox') || this.isSpecialFolder('junk');

			if (isSpecial && this.get('content_count') > 0) {
				return Grommunio.hierarchy.data.CounterTypes.TOTAL;
			} else if (!isSpecial && this.get('content_unread') > 0 && !this.isSearchFolder()) {
				return Grommunio.hierarchy.data.CounterTypes.UNREAD;
			}
		} else if ((extendedFlags & Grommunio.core.mapi.FolderExtendedFlags.USE_UNREAD_COUNT) === Grommunio.core.mapi.FolderExtendedFlags.USE_UNREAD_COUNT &&
				this.get('content_unread') > 0) {
			// ExtendedFlags says use unread count
			return Grommunio.hierarchy.data.CounterTypes.UNREAD;
		} else if ((extendedFlags & Grommunio.core.mapi.FolderExtendedFlags.USE_TOTAL_COUNT) === Grommunio.core.mapi.FolderExtendedFlags.USE_TOTAL_COUNT &&
				this.get('content_count') > 0) {
			// ExtendedFlags says use total count
			return Grommunio.hierarchy.data.CounterTypes.TOTAL;
		}

		return Grommunio.hierarchy.data.CounterTypes.NONE;
	},

	/**
	 * Function will return counter value that should be added to {@link Grommunio.hierarchy.ui.FolderNode FolderNode}.
	 * @param {Grommunio.hierarchy.data.CounterTypes} counterType (optional) counter type for which counter value will be returned.
	 * @return {Number} total/unread counter value or undefined.
	 */
	getCounterValue: function(counterType)
	{
		if(!counterType) {
			counterType = this.getCounterType();
		}

		switch(counterType) {
			case Grommunio.hierarchy.data.CounterTypes.TOTAL:
				return this.get('content_count');
			case Grommunio.hierarchy.data.CounterTypes.UNREAD:
				return this.get('content_unread');
			case Grommunio.hierarchy.data.CounterTypes.NONE:
			/* falls through */
			default:
				return undefined;
		}
	},

	/**
	 * Helper function which used to check folder has create rights.
	 *
	 * @returns {Boolean} return true if folder have create rights else false.
	 */
	hasCreateRights: function ()
	{
		return (this.get('rights') & Grommunio.core.mapi.Rights.RIGHTS_CREATE) > 0;
	},

	/**
	 * Helper function which used to check folder has delete rights.
	 *
	 * @returns {Boolean} return true if folder have delete rights else false.
	 */
	hasDeleteOwnRights: function ()
	{
		return (this.get('rights') & Grommunio.core.mapi.Rights.RIGHTS_DELETE_OWNED) > 0;
	},

	/**
	 * Owning the folder weighs the same as the delete-any right, which is how the
	 * store decides. RIGHTS_CREATE_FOLDER is that ownership bit (ecRightsFolderAccess).
	 *
	 * @returns {Boolean} true if the user may delete items that are not their own
	 */
	hasDeleteAnyRights: function ()
	{
		var rights = Grommunio.core.mapi.Rights;

		return (this.get('rights') & (rights.RIGHTS_DELETE_ANY | rights.RIGHTS_CREATE_FOLDER)) > 0;
	}
});

Grommunio.core.data.RecordFactory.setBaseClassToObjectType(Grommunio.core.mapi.ObjectType.MAPI_FOLDER, Grommunio.hierarchy.data.MAPIFolderRecord);
