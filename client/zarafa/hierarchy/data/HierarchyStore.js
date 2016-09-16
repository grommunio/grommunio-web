/*
 * #dependsFile client/zarafa/hierarchy/data/HierarchyProxy.js
 */
Ext.namespace('Zarafa.hierarchy.data');

/**
 * @class Zarafa.hierarchy.data.HierarchyStore
 * @extends Zarafa.core.data.IPFStore
 * @xtype zarafa.hierarchystore
 *
 * {@link Zarafa.hierarchy.data.HierarchyStore HierarchyStore} holds
 * {@link Zarafa.hierarchy.data.MAPIStoreRecord MAPIStoreRecord} as records, which defines store information
 * of all opened stores(own, shared, public).
 */
Zarafa.hierarchy.data.HierarchyStore = Ext.extend(Zarafa.core.data.IPFStore, {
	/**
	 * @cfg {Boolean} stateful A flag which causes the store to create a {@link #state} object in which
	 * the state for the various {@link Zarafa.hierarchy.data.MAPIFolderRecord folders} can be saved.
	 * This class will not automatically get/set the state, but assumes that other {@link Ext.Component components}
	 * or {@link Zarafa.core.data.StatefulObservable stateful objects} will {@link #getState get} or
	 * {@link #applyState apply} the state.
	 */
	stateful : true,

	/**
	 * When {@link #stateful} the interaction object in which the state can be saved or obtained from.
	 * Typically access to this object can be done through {@link #getState} and {@link #applyState}.
	 * @property
	 * @type Zarafa.hierarchy.data.HierarchyState
	 */
	state : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function (config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// The HierarchyStore is special and doesn't need
			// to register itself to the IPFStoreMgr, this because
			// the contents of the hierarchyStore is a list
			// of more IPFStores which will register themselves.
			standalone : true,
			proxy: new Zarafa.hierarchy.data.HierarchyProxy(),
			writer : new Zarafa.core.data.JsonWriter(),
			reader: new Zarafa.core.data.JsonReader({
				id : 'store_entryid',
				idProperty : 'store_entryid'
			})
		});

		this.addEvents(
			/**
			 * @event addFolder
			 * Fires when a folder has been created.
			 * @param {Zarafa.hierarchy.data.HierarchyStore} store
			 * @param {Zarafa.hierarchy.data.MAPIStoreRecord} storeRecord
			 * @param {Zarafa.hierarchy.data.IPFRecord/Zarafa.hierarchy.data.IPFRecord[]}
			 * folder record that is added to the hierachy store.
			 */
			'addFolder',
			/**
			 * @event removeFolder
			 * Fires when a folder has been removed.
			 * @param {Zarafa.hierarchy.data.HierarchyStore} store
			 * @param {Zarafa.hierarchy.data.MAPIStoreRecord} storeRecord
			 * @param {Zarafa.hierarchy.data.IPFRecord}
			 * folder which is removed from the hierarchy store.
			 */
			'removeFolder',
			/**
			 * @event updateFolder
			 * Fires when a folder has been updated
			 * @param {Zarafa.hierarchy.data.HierarchyStore} store
			 * @param {Zarafa.hierarchy.data.MAPIStoreRecord} storeRecord
			 * @param {Zarafa.hierarchy.data.IPFRecord} record folder which is updated in the hierarchy store.
			 * @param {String} operation The update operation being performed. Value may be one of
			 * {@link Ext.data.Record#EDIT}, {@link Ext.data.Record#REJECT}, {@link Ext.data.Record#COMMIT}.
			 */
			'updateFolder'
		);

		Zarafa.hierarchy.data.HierarchyStore.superclass.constructor.call(this, config);

		if (this.stateful !== false) {
			this.initState();
		}

		this.on({
			'beforesave' : this.onBeforeSave,
			'load' : this.onAfterLoad,
			'add' : this.onAdd,
			'remove' : this.onRemove,
			scope : this
		});
	},

	/**
	 * Compare a {@link Ext.data.Record#id ids} to determine if they are equal.
	 * This will apply the {@link Zarafa.core.EntryId#compareStoreEntryIds compareStoreEntryIds} function
	 * on both ids, as all records in this store will have a StoreEntryId as unique key.
	 * @param {String} a The first id to compare
	 * @param {String} b The second id to compare
	 * @protected
	 */
	idComparison : function(a, b)
	{
		return Zarafa.core.EntryId.compareStoreEntryIds(a, b);
	},

	/**
	 * <p>Loads the Record cache from the configured <tt>{@link #proxy}</tt> using the configured <tt>{@link #reader}</tt>.</p>
	 * <br> Function just adds 'list' as actionType in options and calls parent {@link Zarafa.core.data.IPFStore#load} method.
	 * <br> Check documentation of {@link Ext.data.Store#load} for more information.
	 */
	load : function(options)
	{
		if (!Ext.isObject(options)) {
			options = {};
		}

		if (!Ext.isObject(options.params)) {
			options.params = {};
		}

		// Load should always cancel the previous actions.
		if (!Ext.isDefined(options.cancelPreviousRequest)) {
			options.cancelPreviousRequest = true;
		}

		/*
		 * This store will only be used to get whole hierarchy data, so it will have
		 * actionType as 'list' always.
		 */
		Ext.applyIf(options, {
			actionType : Zarafa.core.Actions['list']
		});

		return Zarafa.hierarchy.data.HierarchyStore.superclass.load.call(this, options);
	},

	/**
	 * Remove records from the Store and fire the {@link #remove} event.
	 * On a HierarchyStore it is not possible to remove the Private or Public Store,
	 * a special event will be send to the server when a Shared Store is removed
	 * from the Hierarchy.
	 * @param {Zarafa.hierarchy.data.MAPIStore} record The MAPIStore which must be
	 * removed from the HierarchyStore.
	 */
	remove : function(record)
	{
		if (Ext.isArray(record)) {
			Ext.each(record, this.remove, this);
			return;
		}

		// Only allow Shared Stores to be removed
		if (record.isSharedStore()) {
			// Remove all favorites marked folders which are
			// belongs to shared user because we are going to
			// close the shared user hierarchy store.
			var favoritesStore = record.getFavoritesStore();
			var records = favoritesStore.query('store_entryid',record.get('store_entryid'));
			favoritesStore.remove(records.getRange());

			Zarafa.hierarchy.data.HierarchyStore.superclass.remove.call(this, record);
		}
	},

	/**
	 * Open a Store in the Hierarchy. This will {@link #load} the hierarchy
	 * requesting the data for the given user store/folder. The returned data
	 * will be appended to the already loaded data.
	 * @param {String} username The name of the user for which the store will be opened
	 * @param {Zarafa.hierarchy.data.SharedFolderTypes} foldertype The foldertype which will be opened
	 * @param {Boolean} subfolders True if subfolders must be loaded (when foldertype is not 'all').
	 * @return {Boolean} False if the substore could not be opened
	 */
	open : function(username, foldertype, subfolders)
	{
		// The username must always be lowercase
		username = username.toLowerCase();

		// Check if the user is already present in the settings,
		// if that is the case we have to check if we can actually open
		// this new folder or not.
		var settings = container.getSettingsModel().get('zarafa/v1/contexts/hierarchy/shared_stores/' + username, true);
		if (settings && ((settings[foldertype] || settings['all']))) {
			return false;
		}

		var options = Ext.applyIf({ 
			params : {
				user_name : username,
				folder_type : foldertype,
				show_subfolders : subfolders
			},
			add : true,
			actionType : 'opensharedfolder',
			cancelPreviousRequest : false
		}, this.lastOptions);

		try {
			return this.execute('read', null, options); // <-- null represents rs. No rs for load actions.
		} catch (e) {
			this.handleException(e);
			return false;
		}
	},

	/**
	 * Called when the response from the server has been returned for the {@link #load} call.
	 * If the actionType indicates that a shared folder was opened for this call, this will check
	 * if the returned Store object is already present inside the store (this could happen when
	 * we already shared the 'Calendar' and are now adding the 'Contacts'). If that is the case
	 * the received {@link Zarafa.hierarchy.data.MAPIStoreRecord store} is
	 * {@link Zarafa.core.data.MAPIRecord#applyData merged} into the already existing
	 * {@link Zarafa.hierarchy.data.MAPIStoreRecord store}.
	 * @param {Object} o The cache of {@link Ext.data.Record records} as received by the server
	 * @param {Object} options The options used for loading the store
	 * @param {Boolean} success True if the records were successfully loaded from the store
	 * @private
	 */
	loadRecords : function(o, options, success)
	{
		if (this.isDestroyed) {
			return;
		}
		if (o && success === true && options && options.actionType === 'opensharedfolder') {
			var records = o.records;

			for (var i = 0, len = records.length; i < len; i++) {
				var record = records[i];
				var existingStore = this.getById(record.get('store_entryid'));

				// The store already existed previously, the server will have given
				// us the new folders only. So we obtain the previously loaded folders
				// and inject them into the response.
				if (existingStore) {
					// If we are opening full store of the user then close all the shared folder first.
					if(options.params.folder_type === 'all') {
						this.remove(existingStore);
						this.save(existingStore);
					} else {
						record.createSubStores();

						var existingFolderStore = existingStore.getSubStore('folders');
						var newFolderStore = record.getSubStore('folders');

						// Go over all existing folders, if it doesn't exist yet in the
						// store which we received from the server, copy it into there.
						existingFolderStore.each(function(folder) {
							var newFolder = newFolderStore.getById(newFolderStore.data.getKey(folder));
							if (!newFolder) {
								newFolderStore.add(folder.copy());
							}
						}, this);
					}
				}
			}
		}

		Zarafa.hierarchy.data.HierarchyStore.superclass.loadRecords.call(this, o, options, success);
	},

	/**
	 * This will hook the event handlers {@link #onFolderAdd}, {@link #onFolderRemove} and {@link #onFolderUpdate},
	 * to the {@link Ext.data.Store#add}, {@link Ext.data.Store#remove} and {@link Ext.data.Store#update} events
	 * for the 'folders' substore for each store which is inside the hierarchy. This allows us to fire
	 * the {@link #addFolder}, {@link #removeFolder}, {@link #updateFolder} events.
	 * @param {Zarafa.hierarchy.data.MAPIStoreRecord[]} records The records which are hooked
	 * @private
	 */
	hookStoreRecord : function(records)
	{
		for (var i = 0, len = records.length; i < len; i++) {
			var folders = records[i].getSubStore('folders');
			folders.on({
				'add' : this.onFolderAdd,
				'remove' : this.onFolderRemove,
				'update' : this.onFolderUpdate,
				scope : this
			});

			var favorites = records[i].getSubStore('favorites');
			if(Ext.isDefined(favorites)) {
				favorites.on({
					'add' : this.onFolderAdd,
					'remove' : this.onFolderRemove,
					'update' : this.onFolderUpdate,
					scope : this
				});
			}
		}
	},

	/**
	 * This will unhook the events from {@link #hookStoreRecord}.
	 * @param {Zarafa.hierarchy.data.MAPIStoreRecord} record The record to unhook
	 * @private
	 */
	unhookStoreRecord : function(record)
	{
		var folders = record.getSubStore('folders');
		folders.un('add', this.onFolderAdd, this);
		folders.un('remove', this.onFolderRemove, this);
		folders.un('update', this.onFolderUpdate, this);

		var favorites = record.getSubStore('favorites');
		if(Ext.isDefined(favorites)) {
			favorites.un('add', this.onFolderAdd, this);
			favorites.un('remove', this.onFolderRemove, this);
			favorites.un('update', this.onFolderUpdate, this);
		}
	},

	/**
	 * Event handler which is fired when the Hierarchy has loaded,
	 * this will check if this was called to open a Shared Store or not.
	 *
	 * If this has been called because a shared store has been opened,
	 * this will update the settings so the folder will be automatically
	 * loaded next time the user logs in.
	 *
	 * In all cases, all stores which are loaded will be hooked using
	 * {@link #hookStoreRecord}.
	 *
	 * @param {Ext.data.Store} store The store which fired the event
	 * @param {Ext.data.Record[]} records The records which were loaded
	 * @param {Object} options The options which were send with the load request
	 * @private
	 */
	onAfterLoad : function(store, records, options)
	{
		if (options.actionType === 'opensharedfolder') {
			var settings = container.getSettingsModel();
			var user_name = options['params']['user_name'].toLowerCase();
			var folder_type = options['params']['folder_type'] || 'all';
			var subfolders = options['params']['show_subfolders'] || false;

			var settingsBase = 'zarafa/v1/contexts/hierarchy/shared_stores/' + user_name;

			var shared = settings.get(settingsBase, true);
			if (shared && (shared[folder_type] || shared['all'])) {
				return;
			}

			settings.set(settingsBase + '/' + folder_type, {
				folder_type : folder_type,
				show_subfolders : subfolders
			});

			// when user tries to open shared folder, that particular folder will be opened immediately and context will be 
			// switched automatically. if context not having folder than by default shared 'inbox' will be opened.
			// if user tries to open 'entire inbox' than folder is opened as per current context, if current context not having 
			// folder than by default shared 'inbox' will be opened, and context will switched automatically.
			if(folder_type === 'all') {
				folder_type = container.getCurrentContext().getName();
				switch(folder_type){
					case 'calendar':
					case 'contacts':
					case 'tasks':
					case 'notes':
						break;
					default :
						folder_type = 'inbox';
						break;
				}
			}
			var folder = this.getFolder((records[0].get('default_folder_'+folder_type)));
			if (Ext.isDefined(folder) && folder_type!=='calendar') {
				Zarafa.hierarchy.Actions.openFolder(folder);
			}
			
		}

		// Add event handlers which are registered so we can listen for
		// the add, remove and update events for the folders.
		this.hookStoreRecord(records);
	},

	/**
	 * Saves all pending changes to the store.  If the commensurate Ext.data.Api.actions action is not configured, then
	 * the configured <code>{@link #url}</code> will be used.
	 * <pre>
	 * change            url
	 * ---------------   --------------------
	 * removed records   Ext.data.Api.actions.destroy
	 * phantom records   Ext.data.Api.actions.create
	 * {@link #getModifiedRecords modified records}  Ext.data.Api.actions.update
	 * </pre>
	 * @TODO:  Create extensions of Error class and send associated Record with thrown exceptions.
	 * e.g.:  Ext.data.DataReader.Error or Ext.data.Error or Ext.data.DataProxy.Error, etc.
	 * @return {Number} batch Returns a number to uniquely identify the "batch" of saves occurring. -1 will be returned
	 * if there are no items to save or the save was cancelled.
	 */
	save : function()
	{
		// If stores have been removed we have to provide a special
		// treatment, as stores can't be deleted, but only 'closed'.
		if (this.removed.length) {
			var stores = this.removed;

			var data = {
				'close' : stores
			};

			if (this.fireEvent('beforesave', this, data) !== false) {
				try {
					var batch = ++this.batchCounter;
					this.execute('destroy', data['close'], { actionType : 'closesharedfolder' }, batch);
				} catch (e) {
					this.handleException(e);
				}

				// Reset the removed list and
				// continue as planned.
				this.removed = [];
			}
		}

		Zarafa.hierarchy.data.HierarchyStore.superclass.save.apply(this, arguments);
	},

	/**
	 * Event handler which is fired when Hierarchy changes are about to be saved.
	 * This will check if a record is being destroyed, if that is a shared store,
	 * then the settings will be updated to save the state.
	 * @param {Ext.data.Store} store The store which fired the event.
	 * @param {Object} data The data object containing the various changes
	 * which will be send to the server
	 * @private
	 */
	onBeforeSave : function(store, data)	 
	{
		// The 'close' key is only used for shared stores/folders
		if (!Ext.isEmpty(data['close'])) {
			var settings = container.getSettingsModel();
			var stores = data['close'];

			settings.beginEdit();

			for (var i = 0, len = stores.length; i < len; i++) {
				var sharedstore = stores[i];
				var username = sharedstore.get('user_name').toLowerCase();

				// The entire store is being closed, this can be used
				// when we were sharing the entire store, or we were
				// sharing one or more different default folders.
				// Both cases should be correctly removed using this
				// function, so we just remove all shared_stores settings
				// for the user rather then only the 'all' folder type.
				settings.remove('zarafa/v1/contexts/hierarchy/shared_stores/' + username);

				sharedstore.addIdProp('user_name');
			}

			settings.endEdit();
		}
	},

	/**
	 * Event handler fired when a {@link Zarafa.hierarchy.data.MAPIStoreRecord store}
	 * has been added to the hierarchy. This will call {@link #hookStoreRecord}.
	 *
	 * @param {Zarafa.hierarchy.data.HierarchyStore} store This store
	 * @param {Zarafa.hierarchy.data.MAPIStoreRecord[]} records The record which is added
	 * @param {Number} index The index from where the record was added
	 * @private
	 */
	onAdd : function(store, records, index)
	{
		this.hookStoreRecord(records);
	},

	/**
	 * Event handler fired when a {@link Zarafa.hierarchy.data.MAPIStoreRecord store}
	 * has been added to the hierarchy. This will call {@link #unhookStoreRecord}.
	 *
	 * @param {Zarafa.hierarchy.data.HierarchyStore} store This store
	 * @param {Zarafa.hierarchy.data.MAPIStoreRecord} record The record which is removed
	 * @param {Number} index The index from where the record was removed
	 * @private
	 */
	onRemove : function(store, record, index)
	{
		this.unhookStoreRecord(record);
	},

	/**
	 * Event handler fired when a folder in one of the {@link Zarafa.hierarchy.data.MAPIStoreRecord stores}
	 * in this store has been {@link Ext.data.Store#add added}. This will fire the
	 * {@link #addFolder} event.
	 *
	 * @param {Zarafa.hierarchy.data.IPFSubStore} substore
	 * @param {Zarafa.hierarchy.data.IPFRecord} folder which is added to the hierarchy
	 * @param {Number} index The index in the substore from where the folder was added
	 * @private
	 */
	onFolderAdd : function(store, records, index)
	{
		this.fireEvent('addFolder', this, store.getParentRecord(), records, index);
	},

	/**
	 * Event handler fired when a folder in one of the {@link Zarafa.hierarchy.data.MAPIStoreRecord stores}
	 * in this store has been {@link Ext.data.Store#remove removed}. This will fire the
	 * {@link #removeFolder} event.
	 *
	 * @param {Zarafa.hierarchy.data.IPFSubStore} substore
	 * @param {Zarafa.hierarchy.data.IPFRecord} folder which is removed from the hierarchy
	 * @param {Number} index The index in the substore from where the folder was removed
	 * @private
	 */
	onFolderRemove : function(store, record, index)
	{
		// If the removed folder is a shared folder and not favorites marked then we have to check
		// if this is the last shared folder for the store. Because
		// that means we have to remove the entire store.
		if (record.isSharedFolder() && !record.isFavoritesFolder()) {
			var isEmpty = true;

			// Check if there are any shared folders left in the hierarchy...
			store.each(function(r) {
				if (r.isSharedFolder()) {
					isEmpty = false;
					return false;
				}
			}, this);

			// No shared folders remain, time to cleanup the entire store
			if (isEmpty) {
				// Reject all changes made to the IPFSubStore,
				// we are deleting the entire parent record, and thus
				// any changes made inside the SubStore are irrelevant.
				store.rejectChanges();

				// Remove the store from the Hierarchy
				var root = store.getParentRecord();
				this.remove(root);
				this.save(root);
				return;
			}
		}

		this.fireEvent('removeFolder', this, store.getParentRecord(), record, index);
	},

	/**
	 * Event handler fired when a folder in one of the {@link Zarafa.hierarchy.data.MAPIStoreRecord stores}
	 * in this store has been {@link Ext.data.Store#update updated}. This will fire the
	 * {@link #updateFolder} event.
	 * 
	 * @param {Zarafa.hierarchy.data.IPFSubStore} store
	 * @param {Zarafa.hierarchy.data.IPFRecord} record which is updated in the hierarchy.
	 * @param {String} operation The update operation being performed. Value may be one of
	 * {@link Ext.data.Record#EDIT}, {@link Ext.data.Record#REJECT}, {@link Ext.data.Record#COMMIT}.
	 * @private
	 */
	onFolderUpdate : function(store, record, operation)
	{
		this.fireEvent('updateFolder', this, store.getParentRecord(), record, operation);
	},

	/**
	 * @return {Array} list of all {@link Zarafa.hierarchy.data.MAPIStoreRecord Store}
	 */
	getStores : function()
	{
		return this.getRange();
	},

	/**
	 * @return {Zarafa.hierarchy.data.MAPIStoreRecord} default store
	 */
	getDefaultStore : function()
	{
		var index = this.findExact('mdb_provider', Zarafa.core.mapi.MDBProvider.ZARAFA_SERVICE_GUID);

		if (index !== -1) {
			return this.getAt(index);
		}

		return undefined;
	},

	/**
	 * @return {Zarafa.hierarchy.data.MAPIStoreRecord} public store
	 */
	getPublicStore : function()
	{
		var index = this.findExact('mdb_provider', Zarafa.core.mapi.MDBProvider.ZARAFA_STORE_PUBLIC_GUID);

		if (index !== -1) {
			return this.getAt(index);
		}

		return undefined;
	},

	/**
	 * Function is used get default {@link Zarafa.hierarchy.data.MAPIFolderRecord MAPIFolderRecord}
	 * from {@link Zarafa.hierarchy.data.MAPIStoreRecord MAPIStoreRecord},
	 * if {@link Zarafa.hierarchy.data.MAPIStoreRecord MAPIStoreRecord} is not passed then
	 * it will by default take default store.
	 * 
	 * @param {String} name name of the default folder (i.e. 'inbox' or 'contacts')
	 * @param {Zarafa.hierarchy.data.MAPIStoreRecord} mapiStoreRecord (optional) {@link Zarafa.hierarchy.data.MAPIStoreRecord MAPIStoreRecord}
	 * whose default folder we should return, if not passed then it will use default store.
	 * @return {Zarafa.hierarchy.data.MAPIFolderRecord} a folder if a default folder with the given name was found, or undefined otherwise.
	 */
	getDefaultFolder : function(name, mapiStoreRecord)
	{
		if(!mapiStoreRecord) {
			mapiStoreRecord = this.getDefaultStore();

			if(!mapiStoreRecord) {
				// hierarchy store is empty
				return;
			}
		}

		return mapiStoreRecord.getDefaultFolder(name);
	},

	/**
	 * Retrieves a {@link Zarafa.hierarchy.data.MAPIStoreRecord MAPIStoreRecord} by owner entryid.
	 * @param {String} ownerEntryId entry id of the owner of the store.
	 * @return {Zarafa.hierarchy.data.MAPIStoreRecord} store owned by user.
	 */
	getStoreByOwnerEntryId : function(ownerEntryId)
	{
		for(var i = 0; i < this.getCount(); i++) {
			var folderStore = this.getAt(i);

			if(Zarafa.core.EntryId.compareABEntryIds(folderStore.get('mailbox_owner_entryid'), ownerEntryId)) {
				return folderStore;
			}
		}

		return undefined;
	},

	/**
	 * Retrieves a folder by MAPI ID from list of stores
	 * @param {String} id MAPI ID of the folder to search for.
	 * @return {Zarafa.hierarchy.data.MAPIFolderRecord} a folder matching the given ID, or undefined if not found. 
	 */
	getFolder : function(id)
	{
		for(var i = 0, len = this.getCount(); i < len; i++) {
			var folderStore = this.getAt(i).getFolderStore();

			if(folderStore) {
				var folder = folderStore.getById(id);
				if(folder) {
					return folder;
				}
			}
		}

		return undefined;
	},

	/**
	 * Function will return default folder from the hierarchy
	 * for the supplied message_class to the function.
	 * 
	 * @param {String} messageClass The message_class of the mapi record.
	 * @return {Zarafa.hierarchy.data.MAPIFolderRecord} a folder 
	 * default folder for the supplied message_class
	 */
	getDefaultFolderFromMessageClass : function(messageClass)
	{
		var folderType = Zarafa.core.MessageClass.getDefaultFolderTypeFromMessageClass(messageClass);
		if (!Ext.isEmpty(folderType)) {
			return this.getDefaultStore().getDefaultFolder(folderType);
		}
	},

	/**
	 * Function will return default folder from the hierarchy
	 * for the supplied container_class to the function.
	 * 
	 * @param {String} containerClass The container_class of the mapi record.
	 * @return {Zarafa.hierarchy.data.MAPIFolderRecord} a folder 
	 * default folder for the supplied message_class
	 */
	getDefaultFolderFromContainerClass : function(containerClass)
	{
		var folderType = Zarafa.core.ContainerClass.getDefaultFolderTypeFromContainerClass(containerClass);
		if (!Ext.isEmpty(folderType)) {
			return this.getDefaultStore().getDefaultFolder(folderType);
		}
	},

	/**
	 * Helper method for getSortedFolders. 
	 * @private
	 */
	collectFolders : function(arr, match, scope, folder)
	{
		if (!Ext.isFunction(match) || match.call(scope || this, folder)) {
			arr.push(folder);
		}
		
		Ext.each(folder.getChildren(), function(childFolder) {
			this.collectFolders(arr, match, scope, childFolder);
		}, this);
	},
	
	/**
	 * Retrieves a sorted list of folders. The folders will appear in the same order as they do in the hierarchy tree on screen.
	 * This order is partially dictated by the order in which the folders are returned by the server, and the hierarchy of folders.
	 * @param {Function} match (optional) a function that can be used to filter out undesired folders. Will be called with a folder object
	 * as parameter and should return true if that folder should appear in the output.
	 * @return {Array} array of matched folders, in the same order as they appear on screen.
	 */
	getSortedFolders : function(match, scope)
	{
		var allFolders = [];

		var stores = this.getStores();
		for (var i = 0; i < stores.length; i++) {
			this.collectFolders(allFolders, match, scope, stores[i].getSubtreeFolder());
		}

		return allFolders;
	},

	/**
	 * Checks whether any of the stores that were included in the parameters during the last load, 
	 * matches the supplied entryid argument.
	 *
	 * Although the HierarchyStore can return true for all storeentryids (it contains the entire
	 * hierarchy after all), it will return false. This ensures that all IPFSubStores which are
	 * found within the HierarchyStore can check if they want to have the notification themself.
	 *
	 * @param {String|Array} entryidList Entryid of the folder
	 * @return {Boolean} Returns true when entryid matches, false when it does not.
	 */
	containsStoreInLastLoad: function(entryidList)
	{
		return false;
	},

	/**
	 * Notification handler called by {@link #onNotify} when
	 * a {@link Zarafa.core.data.Notifications#newMail newMail}
	 * notification has been recieved.
	 *
	 * This will update all stores in which the new mail was delivered.
	 *
	 * @param {Zarafa.core.data.Notifications} action The notification action
	 * @param {Ext.data.Record/Array} records The record or records which have been affected by the notification.
	 * @param {Object} data The data which has been recieved from the PHP-side which must be applied
	 * to the given records.
	 * @param {Number} timestamp The {@link Date#getTime timestamp} on which the notification was received
	 * @param {Boolean} success The success status, True if the notification was successfully recieved.
	 * @private
	 */
	onNotifyNewmail : function(action, records, data, timestamp, success)
	{
		if (!Ext.isArray(records)) {
			records = [ records ];
		}

		for (var i = 0, len = records.length; i < len; i++) {
			// If this notification came at the same time as we reloaded this folder,
			// we already obtained created item, and we don't need to reload.
			if (!timestamp || records[i].lastExecutionTime(Zarafa.core.Actions['list']) < timestamp) {
				/*
				 * If this notification come at the time while user live scorlling 
				 * then we have to reload the mail store with all mails(limit should 
				 * be total loaded mails in grid).
				 */
				if(records[i].lastOptions.actionType === Zarafa.core.Actions['updatelist']) {
					delete records[i].lastOptions.add;
					Ext.apply(records[i].lastOptions.params.restriction,{
						start : 0,
						limit : records[i].getCount()
					});
					records[i].reload(records[i].lastOptions);
				} else {
					records[i].reload();
				}
			}
		}

		//notify user about new mail
		if(!Ext.isEmpty(data)){
			Ext.each(data.item, function(folder){
				var notificationMessage = String.format(
					ngettext('There is {0} unread message in the folder {1}', 'There are {0} unread messages in the folder {1}', folder.content_unread),
					folder.content_unread, folder.display_name);
				container.getNotifier().notify('info.newmail', _('New Mail'),notificationMessage);			
				var folderStore = this.getFolder(folder.entryid);
				if (folderStore) {
					folderStore.set('content_unread', folder.content_unread);
					folderStore.set('content_count', folder.content_count);
				}
			}, this);
		}
	},

	/**
	 * Initialize the keepalive requests to the server. Listen to the aftersend event in the 
	 * {@link Zarafa.core.Request Request} object to reset the counter everytime the clients sends a 
	 * request to the server.
	 */
	startKeepAlive : function()
	{
		var interval = container.getSettingsModel().get('zarafa/v1/contexts/hierarchy/polling_interval');

		// add a listener event that will fire automatically after specified interval
		if (Ext.isNumber(interval) && interval > 0) {
			container.getRequest().on('aftersend', this.sendKeepAlive, this, { buffer : interval * 1000});
		}
	},

	/**
	 * Function will be used to send <b>keepalive</b> requests to the server so we will be always logged
	 * on server and don't need to relogin after some time even if user doesn't perform any action.
	 * function is created on a fingerprint of {@link #load} method, which performs a 'read' operation
	 * for {@link Zarafa.hierarchy.data.HierarchyStore HierarchyStore}.
	 * Reason to create this function was we don't have any operation type for keepalive requests
	 * other than CRUD so what we do is call {@link Zarafa.hierarchy.data.HierarchyProxy#request}
	 * method of {@link Zarafa.hierarchy.data.HierarchyProxy HierarchyProxy} with 'read' operation
	 * and 'keepalive' as {@link #actionType} in options, we also need to pass Ext.emptyFn as callback function
	 * and this way don't interfere with the working of {@link #load} and {@link #reload} functionalities.
	 * @private
	 */
	sendKeepAlive : function()
	{
		var options = {
			params : {},
			// indicate that this is a keepalive request
			actionType : Zarafa.core.Actions['keepalive']
		};

		// fire request
		this.proxy.request(Ext.data.Api.actions['read'], null, options.params, this.reader, Ext.emptyFn, this, options);
	},

	/**
	 * Function will be used to send {Zarafa.core.Actions#destroysession destroysession} requests to the server. This will be used when
	 * CLIENT_TIMEOUT has been set in the configuration and the user has been idle for this time.
	 * Function is created on a fingerprint of {@link #load} method, which performs a 'read' operation
	 * for {@link Zarafa.hierarchy.data.HierarchyStore HierarchyStore}.
	 * Reason to create this function was we don't have any operation type for destroysession requests
	 * other than CRUD so what we do is call {@link Zarafa.hierarchy.data.HierarchyProxy#request}
	 * method of {@link Zarafa.hierarchy.data.HierarchyProxy HierarchyProxy} with 'read' operation
	 * and {Zarafa.core.Actions#destroysession destroysession} as {@link #actionType} in options, 
	 * we also need to pass Ext.emptyFn as callback function and this way don't interfere with 
	 * the working of {@link #load} and {@link #reload} functionalities.
	 * @private
	 */
	sendDestroySession : function()
	{
		var options = {
			params : {},
			// indicate that this is a destroysession request
			actionType : Zarafa.core.Actions['destroysession']
		};

		// fire request
		this.proxy.request(Ext.data.Api.actions['read'], null, options.params, this.reader, Ext.emptyFn, this, options);
	},

	/**
	 * Intialialize the {@link #state state component}
	 * @private
	 */
	initState : function()
	{
		if (!this.state) {
			this.state = new Zarafa.hierarchy.data.HierarchyState();
		}
	},

	/**
	 * Obtain the path in which the {@link #getState state} must be saved.
	 * This option is only used when the {@link Zarafa.core.data.SettingsStateProvider SettingsStateProvider} is
	 * used in the {@link Ext.state.Manager}.
	 * This calls {@link Zarafa.hierarchy.data.HierarchyState#getStateNameForFolder getStateNameForFolder} on the {@link #state}.
	 *
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder for which the statename is requested
	 * @param {String} type The category for the folder for which the statename is requested (e.g. 'list' or 'tree').
	 * @return {String} The unique name for this component by which the {@link #getState state} must be saved. 
	 */
	getStateName : function(folder, type)
	{
		if (this.stateful !== false) {
			return this.state.getStateNameForFolder(folder, type);
		}
	},

	/**
	 * When {@link #stateful} the State object which should be saved into the
	 * {@link Ext.state.Manager}.
	 * This calls {@link Zarafa.hierarchy.data.HierarchyState#getStateForFolder getStateForFolder} on the {@link #state}.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder for which the state is requested
	 * @param {String} type The category for the folder for which the state is requested (e.g. 'list' or 'tree').
	 * @return {Object} The state object
	 */
	getState : function(folder, type)
	{
		if (this.stateful !== false) {
			return this.state.getStateForFolder(folder, type);
		}
	},

	/**
	 * Apply the given state to this object activating the properties which were previously
	 * saved in {@link Ext.state.Manager}.
	 * This calls {@link Zarafa.hierarchy.data.HierarchyState#applyStateForFolder applyStateForFolder} on the {@link #state}.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder for which the state is provided
	 * @param {String} type The category for the folder for which the state is provided (e.g. 'list' or 'tree').
	 * @param {Object} state The state object
	 */
	applyState : function(folder, type, state)
	{
		if (this.stateful !== false) {
			this.state.applyStateForFolder(folder, type, state);
		}
	},

	/**
	 * Notification handler called by {@link #onNotify} when
	 * a {@link Zarafa.core.data.Notifications#objectModified objectModified}
	 * notification has been recieved.
	 *
	 * This will update the mapistore's information in hierarhcyStore.
	 *
	 * @param {Zarafa.core.data.Notifications} action The notification action
	 * @param {Ext.data.Record/Array} records The record or records which have been affected by the notification.
	 * @param {Object} data The data which has been recieved from the PHP-side which must be applied
	 * to the given records.
	 * @param {Number} timestamp The {@link Date#getTime timestamp} on which the notification was received
	 * @param {Boolean} success The success status, True if the notification was successfully recieved.
	 * @private
	 */
	onNotifyObjectmodified : function(action, records, data, timestamp, success)
	{
		if (!Ext.isArray(records)) {
			records = [ records ];
		}

		// Temporarily disable event propagation, every store (which contains the provided records)
		// will receive this notification. So we have to disable event propagation to prevent
		// bouncing events around.
		for (var i = 0, len = records.length; i < len; i++) {
			var record = records[i];
			var singleData = (Ext.isArray(data)) ? data[i] : data;

			record.setEventPropagation(false);

			if (singleData instanceof Ext.data.Record) {
				// Merge the changes into the record without using the JSONReader. 
				record.applyData(singleData);
			} else {
				// Simply merge the record using the JsonReader, this will cause a 'update' event to be fired with
				// a COMMIT action. Because it is a commit, this store will not mark the record as dirty.
				this.reader.update(record, singleData);
			}

			record.setEventPropagation(true);
		}
	}
});

Ext.reg('zarafa.hierarchystore', Zarafa.hierarchy.data.HierarchyStore);
