/*
 * #dependsFile client/zarafa/core/mapi/ObjectType.js
 * #dependsFile client/zarafa/core/data/Record.js
 * #dependsFile client/zarafa/core/data/RecordFactory.js
 * #dependsFile client/zarafa/hierarchy/data/CounterTypes.js
 * #dependsFile client/zarafa/hierarchy/data/MAPIFolderPermissionsSubStore.js
 * #dependsFile client/zarafa/hierarchy/data/MAPIFolderSubStore.js
 */
Ext.namespace('Zarafa.hierarchy.data');

/**
 * @class Zarafa.hierarchy.data.MAPIFolderRecordFields
 * Array of {@link Ext.data.Field field} configurations for the
 * {@link Zarafa.hierarchy.data.MAPIFolderRecord MAPIFolderRecord} object.
 */
Zarafa.hierarchy.data.MAPIFolderRecordFields = [
	{name: 'entryid'},
	{name: 'parent_entryid'},
	{name: 'store_entryid'},
	{name: 'object_type', type: 'int', defaultValue: Zarafa.core.mapi.ObjectType.MAPI_FOLDER},
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
	{name: 'deleted_on', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'rights', type: 'int'},
	{name: 'access', type: 'int'},
	{name: 'extended_flags', type: 'int', defaultValue: 0},
	{name: 'assoc_content_count', type: 'int', defaultValue: 0},
	{name: 'is_unavailable', type: 'boolean', defaultValue: false},
	{name: 'isFavorites', type: 'boolean', defaultValue: false}
];

Zarafa.core.data.RecordFactory.addFieldToObjectType(Zarafa.core.mapi.ObjectType.MAPI_FOLDER, Zarafa.hierarchy.data.MAPIFolderRecordFields);
Zarafa.core.data.RecordFactory.setSubStoreToObjectType(Zarafa.core.mapi.ObjectType.MAPI_FOLDER, 'permissions', Zarafa.hierarchy.data.MAPIFolderPermissionsSubStore);
Zarafa.core.data.RecordFactory.setSubStoreToObjectType(Zarafa.core.mapi.ObjectType.MAPI_FOLDER, 'folders', Zarafa.hierarchy.data.MAPIFolderSubStore);
Zarafa.core.data.RecordFactory.addListenerToObjectType(Zarafa.core.mapi.ObjectType.MAPI_FOLDER, 'createphantom', function(record) {
	// Phantom records must always be marked as opened (they contain the full set of data)
	record.afterOpen();
});

/**
 * @class Zarafa.hierarchy.data.MAPIFolderRecord
 * @extends Zarafa.core.data.IPFRecord
 *
 */
Zarafa.hierarchy.data.MAPIFolderRecord = Ext.extend(Zarafa.core.data.IPFRecord, {
	/**
	 * Usually called by the {@link Ext.data.Store} which owns the Record.
	 * Commits all changes made to the Record since either creation, or the last commit operation.
	 * <p>Developers should subscribe to the {@link Ext.data.Store#update} event
	 * to have their code notified of commit operations.</p>
	 * @param {Boolean} silent (optional) True to skip notification of the owning
	 * store of the change (defaults to false)
	 */
	commit : function()
	{
		// Check if the parent folder still is correct.
		if (this.cacheParentFolder) {
			if (!Zarafa.core.EntryId.compareEntryIds(this.get('parent_entryid'), this.cacheParentFolder.get('entryid'))) {
				delete this.cacheParentFolder;
			}
		}
		Zarafa.hierarchy.data.MAPIFolderRecord.superclass.commit.apply(this, arguments);
	},

	/**
	 * Returns a {@link Zarafa.hierarchy.data.MAPIStoreRecord MAPIStoreRecord} for the record
	 * @return {Zarafa.hierarchy.data.MAPIStoreRecord} MAPIStoreRecord or false if {@link Zarafa.core.data.IPFSubStore IPFSubStore}
	 * is not defined.
	 */
	getMAPIStore : function()
	{
		var store = this.getStore();
		if (store && store instanceof Zarafa.hierarchy.data.IPFSubStore) {
			return store.getParentRecord();
		} else {
			store = container.getHierarchyStore();
			return store.getById(this.get('store_entryid'));
		}
	},

	/**
	 * Returns the {@link Zarafa.hierarchy.data.IPFSubStore} which contains all folders
	 * of the store in which the current store is located. This is safer then using {@link #getStore},
	 * as this function will use {@link #getMAPIStore} to obtain the parent {@link Zarafa.hierarchy.data.MAPIStoreRecord}
	 * and is thus safe when the current record is located in the {@link Zarafa.core.data.ShadowStore}.
	 * @return {Zarafa.hierarchy.data.IPFSubStore} The substore containing all folders
	 */
	getMAPIFolderStore : function()
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
	isSpecialFolder : function(key)
	{
		return this.getDefaultFolderKey() === key;
	},

	/**
	 * @return {Boolean} true if folder is IPM_Subtree of own store
	 */
	isOwnRoot : function()
	{
		return (this.isIPMSubTree() && this.getMAPIStore().isDefaultStore());
	},

	/**
	 * Return {String} a shared folder key ('inbox', 'contacts', etc.) if the folder is a shared folder, or undefined otherwise.
	 */
	getSharedFolderKey : function()
	{
		return this.getMAPIStore().getSharedFolderKey(this.get('entryid'));
	},

	/**
	 * @return {Boolean} True iff the folder is a shared folder.
	 */
	isSharedFolder : function()
	{
		return Ext.isDefined(this.getSharedFolderKey()) ? true : false;
	},

	/**
	 * @return {String} a default folder key ('inbox', 'contacts', etc.) if the folder is a default folder, or undefined if otherwise.
	 */
	getDefaultFolderKey : function()
	{
		var MAPIStore = this.getMAPIStore();
		if(MAPIStore) {
			return MAPIStore.getDefaultFolderKey(this.get('entryid'));
		}

		return undefined;
	},

	/**
	 * This will check wheather the selected folder is default folder or not.
	 * @return {Boolean} true if the folder is a default folder
	 */
	isDefaultFolder : function()
	{
		return Ext.isDefined(this.getDefaultFolderKey()) ? true : false;
	},

	/**
	 * @return {Boolean} true if the folder is the subtree folder of its store else false.
	 */
	isIPMSubTree : function()
	{
		var MAPIStore = this.getMAPIStore();
		if(MAPIStore) {
			return Zarafa.core.EntryId.compareEntryIds(this.get('entryid'), MAPIStore.get('subtree_entryid'));
		}

		return false;
	},

	/**
	 * @return {Boolean} true if the folder is the subtree folder of its store else false.
	 */
	isFavoritesRootFolder : function()
	{
		var MAPIStore = container.getHierarchyStore().getDefaultStore();
		if (MAPIStore) {
			return Zarafa.core.EntryId.compareEntryIds(this.get('entryid'), MAPIStore.get('common_view_entryid'));
		}
		return false;
	},

	/**
	 * @returns {Boolean} true if the folder is the favorites folder else false.
	 */
	isFavoritesFolder : function()
	{
		return this.get('isFavorites');
	},

	/**
	 * @return {Boolean} true if the folder is the RSS feeds folder else false.
	 */
	isRSSFolder : function()
	{
		return Zarafa.core.ContainerClass.isClass(this.get('container_class'), 'IPF.Note.OutlookHomepage', true) && this.getParentFolder().isIPMSubTree();
	},

	/**
	 * @return {Boolean} true if the folder is the calendar folder else false.
	 */
	isCalendarFolder : function()
	{
		return Zarafa.core.ContainerClass.isClass(this.get('container_class'), 'IPF.Appointment', true);
	},

	/**
	 * Helper function to get display name of {@link Zarafa.hierachy.data.MAPIFolderRecord MAPIFolderRecord},
	 * For a subtree folder it will get name of {@link Zarafa.hierachy.data.MAPIStoreRecord MAPIStoreRecord},
	 * and for normal folders it will get it from display_name property.
	 * @return {String} name of the folder.
	 */
	getDisplayName : function()
	{
		if (this.isIPMSubTree()) {
			return this.getMAPIStore().get('display_name');
		}else if (this.isFavoritesRootFolder()){
			return _('Favorites');
		} else {
			return this.get('display_name');
		}
	},

	/**
	 * Helper function to obtain the fully qualified display name. For normal folders, this will return
	 * the same value as {@link #getDisplayName}, but for folders inside a shared store, this will return
	 * a string which includes the owner of the folder store. e.g.
	 * 'Calender of John Doe' or 'Contacts in Public Folders'
	 * @return {String} name of the folder
	 */
	getFullyQualifiedDisplayName : function()
	{
		var store = this.getMAPIStore();

		if (this.isIPMSubTree()) {
			return this.getDisplayName();
		} else if (store.isPublicStore()) {
			/* # TRANSLATORS: Display name of a folder: "FOLDERNAME in STORENAME". */
			return String.format(_('{0} in {1}'), this.getDisplayName(), store.get('display_name'));
		} else if (store.isSharedStore()) {
			/* # TRANSLATORS: Displayed on top of a tree with folders: "FOLDERNAME of USERNAME". */
			return String.format(_('{0} of {1}'), this.getDisplayName(), store.get('mailbox_owner_name'));
		} else {
			return this.getDisplayName();
		}
	},

	/**
	 * Function will return parent {@link Zarafa.hierarchy.data.MAPIFolderRecord MAPIFolderRecord}
	 * of this {@link Zarafa.hierarchy.data.MAPIFolderRecord MAPIFolderRecord}.
	 * @return {Zarafa.hierarchy.data.MAPIFolderRecord} parent {@link Zarafa.hierarchy.data.MAPIFolderRecord MAPIFolderRecord} or
	 * false if parent folder doesn't exist.
	 */
	getParentFolder : function()
	{
		if (!this.cacheParentFolder) {
			// don't get parent folders above IPM_SUBTREE as we are not interested in it :)
			// and also in public store ipm_subtree['entryid'] === ipm_subtree['parent_entryid']
			var parentEntryid = this.get('parent_entryid');
			if (!this.isIPMSubTree() && !Ext.isEmpty(parentEntryid)) {
				this.cacheParentFolder = this.getMAPIFolderStore().getById(parentEntryid);
			}

			// Guarentee that the parent folder knows it has children...
			// Don't use record::set() as we don't want to trigger updates.
			if (this.cacheParentFolder) {
				this.cacheParentFolder.data.has_subfolder = true;
			}
		}

		return this.cacheParentFolder;
	},

	/**
	 * Function is used to check the {@link Zarafa.hierarchy.data.MAPIFolderRecord MAPIFolder}
	 * is a <b>descendent</b> folder of the default folders 'Deleted Items' or 'Junk Mails'.
	 * @return {Boolean} returns true if given folder belongs to 'Deleted Items' or 'Junk Mails' folder.
	 */
	isInDeletedItems : function()
	{
		var mapiStore = this.getMAPIStore();
		if(mapiStore){
			if(mapiStore.isDefaultStore()) {
				var parentFolder = this.getParentFolder();
				if (!parentFolder || parentFolder.isIPMSubTree()) {
					// If there is no parent folder, or the parent is the subtree,
					// then the item is definately not in the deleted items.
					return false;
				} else if (parentFolder.isSpecialFolder('wastebasket') || parentFolder.isSpecialFolder('junk')) {
					// The item is in the wastebasker or junk folder.
					// It is considered to be deleted.
					return true;
				} else {
					// Perhaps the parent is inside the deleted items?
					return parentFolder.isInDeletedItems();
				}
			}
		}

		return false;
	},

	/**
	 * Function will return path of the {@link Zarafa.hierarchy.data.MAPIFolderRecord MAPIFolderRecord}
	 * in the form of \\Store name\parent\parent.
	 * @return {String} path of the {@link Zarafa.hierarchy.data.MAPIFolderRecord MAPIFolderRecord}
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
	isFavoriteFolder : function()
	{
		return this.isSpecialFolder('favorites');
	},

	/**
	 * Function is use to identify selected folder marks favorites.
	 *
	 * @return {Boolean} returns true if given record exists in {@link Zarafa.common.favorites.data.MAPIFavoritesSubStore favorites} store
	 * else return false;
	 */
	existsInFavorites : function()
	{
		var favoritesStore = this.getMAPIStore().getFavoritesStore();
		if(Ext.isDefined(favoritesStore)) {
			var recordIndex = favoritesStore.find('entryid', this.get('entryid'));
			return recordIndex !== -1;
		}
		return false;
	},

	/**
	 * Function is used to retrieve {@link Zarafa.common.favorites.data.FavoritesFolderRecord favorites} record
	 * from {@link Zarafa.common.favorites.data.MAPIFavoritesSubStore favorites} store.
	 * @return {Zarafa.common.favorites.data.FavoritesFolderRecord} return favorites folder record
	 */
	getFavoritesFolder : function()
	{
		return this.getMAPIStore().getFavoritesStore().getById(this.get('entryid'));
	},

	/**
	 * @return {Zarafa.hierarchy.data.MAPIFolderRecord} IPM_COMMON_VIEWS folder which is used as favorites root folder.
	 */
	getFavoritesRootFolder : function()
	{
		return this.getMAPIStore().getFavoritesRootFolder();
	},

	/**
	 * Add current {@link Zarafa.hierarchy.data.MAPIFolderRecord folder} to Favorites list
	 */
	addToFavorites : function()
	{
		this.addMessageAction('action_type', 'addtofavorites');
	},

	/**
	 * Remove current {@link Zarafa.hierarchy.data.FavoritesFolderRecord folder} to Favorites list
	 */
	removeFromFavorites : function()
	{
		this.addMessageAction('action_type', 'removefavorites');
	},

	/**
	 * Emtpy the {@link Zarafa.hierarchy.data.MAPIFolderRecord DeletedItems} folder
	 */
	emptyFolder : function()
	{
		//@TODO: fire event beforeemptyfolder

		this.addMessageAction('action_type', 'emptyfolder');
	},

	/**
	 * Mark all messages contained by this {@link Zarafa.hierarchy.data.MAPIFolderRecord folder}
	 */
	seadReadFlags : function()
	{
		this.addMessageAction('action_type', 'readflags');
	},

	/**
	 * Returns all child folders of given folder.
	 *
	 * @return {Array} array of child {@link Zarafa.hierarchy.data.MAPIFolderRecord folders}
	 */
	getChildren : function()
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
	 * Get {@link Zarafa.hierarchy.data.CounterTypes CounterType} to be used to display unread/total items in a
	 * {@link Zarafa.hierarchy.data.MAPIFolderRecord MAPIFolderRecord}. Which will be added to {@link Zarafa.hierarchy.ui.FolderNode FolderNode}.
	 * Function will also check which counter should be shown based on extended_flags property, and it will also check
	 * if the counter value is greater then zero or not if it is not then not logical to return counter type as it will
	 * not be usefull.
	 * @return {Zarafa.hierarchy.data.CounterTypes}	type of counter.
	 */
	getCounterType : function()
	{
		var extendedFlags = this.get('extended_flags');

		if ((extendedFlags & Zarafa.core.mapi.FolderExtendedFlags.DEFAULT) === Zarafa.core.mapi.FolderExtendedFlags.DEFAULT) {
			// ExtendedFlags are either not set on folder or it should use default implementation
			var isSpecial = this.isSpecialFolder('drafts') || this.isSpecialFolder('outbox') || this.isSpecialFolder('junk');

			if (isSpecial && this.get('content_count') > 0) {
				return Zarafa.hierarchy.data.CounterTypes.TOTAL;
			} else if (!isSpecial && this.get('content_unread') > 0) {
				// Is it also logical that unread count for 'Drafts', 'Outbox' or Junk Mails' should be displayed?
				return Zarafa.hierarchy.data.CounterTypes.UNREAD;
			}
		} else if ((extendedFlags & Zarafa.core.mapi.FolderExtendedFlags.USE_UNREAD_COUNT) === Zarafa.core.mapi.FolderExtendedFlags.USE_UNREAD_COUNT && 
				this.get('content_unread') > 0) {
			// ExtendedFlags says use unread count
			return Zarafa.hierarchy.data.CounterTypes.UNREAD;
		} else if ((extendedFlags & Zarafa.core.mapi.FolderExtendedFlags.USE_TOTAL_COUNT) === Zarafa.core.mapi.FolderExtendedFlags.USE_TOTAL_COUNT &&
				this.get('content_count') > 0) {
			// ExtendedFlags says use total count
			return Zarafa.hierarchy.data.CounterTypes.TOTAL;
		}

		return Zarafa.hierarchy.data.CounterTypes.NONE;
	},

	/**
	 * Function will return counter value that should be added to {@link Zarafa.hierarchy.ui.FolderNode FolderNode}.
	 * @param {Zarafa.hierarchy.data.CounterTypes} counterType (optional) counter type for which counter value will be returned.
	 * @return {Number} total/unread counter value or undefined.
	 */
	getCounterValue : function(counterType)
	{
		if(!counterType) {
			counterType = this.getCounterType();
		}

		switch(counterType) {
			case Zarafa.hierarchy.data.CounterTypes.TOTAL:
				return this.get('content_count');
			case Zarafa.hierarchy.data.CounterTypes.UNREAD:
				return this.get('content_unread');
			case Zarafa.hierarchy.data.CounterTypes.NONE:
			/* falls through */
			default:
				return undefined;
		}
	}
});

Zarafa.core.data.RecordFactory.setBaseClassToObjectType(Zarafa.core.mapi.ObjectType.MAPI_FOLDER, Zarafa.hierarchy.data.MAPIFolderRecord);
