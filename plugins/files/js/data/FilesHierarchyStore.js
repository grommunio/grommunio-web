Ext.namespace('Zarafa.plugins.files.data');

/**
 * @class Zarafa.plugins.files.data.FilesHierarchyStore
 * @extends Zarafa.core.data.IPFStore
 * @xtype filesplugin.hierarchystore
 *
 * {@link Zarafa.plugins.files.data.FilesHierarchyStore FilesHierarchyStore} holds
 * {@link Zarafa.plugins.files.data.FilesStoreRecord FilesStoreRecord} as records, which defines store information
 * of all opened stores.
 */
Zarafa.plugins.files.data.FilesHierarchyStore = Ext.extend(Zarafa.core.data.IPFStore, {
	/**
	 * @cfg {Boolean} stateful A flag which causes the store to create a {@link #state} object in which
	 * the state for the various {@link Zarafa.plugins.files.data.FilesFolderRecord folders} can be saved.
	 * This class will not automatically get/set the state, but assumes that other {@link Ext.Component components}
	 * or {@link Zarafa.core.data.StatefulObservable stateful objects} will {@link #getState get} or
	 * {@link #applyState apply} the state.
	 */
	stateful: true,

	/**
	 * When {@link #stateful} the interaction object in which the state can be saved or obtained from.
	 * Typically access to this object can be done through {@link #getState} and {@link #applyState}.
	 * @property
	 * @type Zarafa.hierarchy.data.HierarchyState
	 */
	state: undefined,

	/**
	 * True to indicate the {@link Zarafa.plugins.files.data.FilesHierarchyStore store} is currently loading.
	 * else false
	 * @property
	 * @type Boolean
	 */
	loading: false,

	/**
	 * @cfg {Zarafa.core.data.RecordCustomObjectType} customObjectType The custom object type
	 * which represents the {@link Ext.data.Record records} which should be created using
	 * {@link Zarafa.core.data.RecordFactory#createRecordObjectByCustomType}.
	 */
	customObjectType: Zarafa.core.data.RecordCustomObjectType.FILES_FOLDER_STORE,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function (config)
	{
		config = config || {};

		Ext.applyIf(config, {
			standalone: true,
			autoLoad: true,
			proxy: new Zarafa.plugins.files.data.FilesHierarchyProxy(),
			writer: new Zarafa.core.data.JsonWriter(),
			reader: new Zarafa.plugins.files.data.FilesJsonReader({
				customObjectType: Zarafa.core.data.RecordCustomObjectType.FILES_FOLDER_STORE
			})
		});

		this.addEvents(
			/**
			 * @event addFolder
			 * Fires when a folder has been created.
			 * @param {Zarafa.plugins.files.data.FilesHierarchyStore} store
			 * @param {Zarafa.plugins.files.data.FilesStoreRecord} storeRecord
			 * @param {Zarafa.hierarchy.data.IPFRecord/Zarafa.hierarchy.data.IPFRecord[]}
			 * folder record that is added to the hierarchy store.
			 */
			'addFolder',
			/**
			 * @event removeFolder
			 * Fires when a folder has been removed.
			 * @param {Zarafa.plugins.files.data.FilesHierarchyStore} store
			 * @param {Zarafa.plugins.files.data.FilesStoreRecord} storeRecord
			 * @param {Zarafa.hierarchy.data.IPFRecord}
			 * folder which is removed from the hierarchy store.
			 */
			'removeFolder',
			/**
			 * @event updateFolder
			 * Fires when a folder has been updated
			 * @param {Zarafa.plugins.files.data.FilesHierarchyStore} store
			 * @param {Zarafa.plugins.files.data.FilesStoreRecord} storeRecord
			 * @param {Zarafa.hierarchy.data.IPFRecord} record folder which is updated in the hierarchy store.
			 * @param {String} operation The update operation being performed. Value may be one of
			 * {@link Ext.data.Record#EDIT}, {@link Ext.data.Record#REJECT}, {@link Ext.data.Record#COMMIT}.
			 */
			'updateFolder'
		);

		Zarafa.plugins.files.data.FilesHierarchyStore.superclass.constructor.call(this, config);
		// Register store with the store manager
		this.on({
			'add' : this.onAdd,
			'beforeload': this.onBeforeLoad,
			'load' : this.onAfterLoad,
			'remove' : this.onRemove,
			scope: this
		});
	},

	/**
	 * Event handler which is fired when the Hierarchy has loaded,
	 * In all cases, all stores which are loaded will be hooked using
	 * {@link #hookStoreRecord}.
	 *
	 * @param {Ext.data.Store} store The store which fired the event
	 * @param {Ext.data.Record[]} records The records which were loaded
	 * @param {Object} options The options which were send with the load request
	 * @private
	 */
	onAfterLoad: function(store, records, options)
	{
		this.hookStoreRecord(records);
		this.loading = false;
	},

	/**
	 * Event handler triggered when {@link Ext.data.Store#beforeload} event fire.
	 * It will make the {@link #loading} to true.
	 */
	onBeforeLoad: function ()
	{
		this.loading = true;
	},

	/**
	 * @return {Boolean} true if store is loading else false.
	 */
	isLoading: function ()
	{
		return this.loading;
	},

	/**
	 * Event handler fired when a {@link Zarafa.plugins.files.data.FilesStoreRecord store}
	 * has been added to the hierarchy. This will call {@link #hookStoreRecord}.
	 *
	 * @param {Zarafa.plugins.files.data.FilesHierarchyStore} store This store
	 * @param {Zarafa.plugins.files.data.FilesStoreRecord[]} records The record which is added
	 * @param {Number} index The index from where the record was added
	 * @private
	 */
	onAdd: function(store, records, index)
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
	onRemove: function(store, record, index)
	{
		this.unhookStoreRecord(record);
	},

	/**
	 * This will hook the event handlers {@link #onFolderAdd}, {@link #onFolderRemove} and {@link #onFolderUpdate},
	 * to the {@link Ext.data.Store#add}, {@link Ext.data.Store#remove} and {@link Ext.data.Store#update} events
	 * for the 'folders' substore for each store which is inside the hierarchy. This allows us to fire
	 * the {@link #addFolder}, {@link #removeFolder}, {@link #updateFolder} events.
	 * @param {Zarafa.plugins.files.data.FilesStoreRecord[]} records The records which are hooked
	 * @private
	 */
	hookStoreRecord: function(records)
	{
		for (var i = 0, len = records.length; i < len; i++) {
			var folders = records[i].getSubStore('folders');
			folders.on({
				'add': this.onFolderAdd,
				'remove': this.onFolderRemove,
				'update': this.onFolderUpdate,
				scope: this
			});
		}
	},

	/**
	 * This will unhook the events from {@link #hookStoreRecord}.
	 * @param {Zarafa.plugins.files.data.FilesStoreRecord} record The record to unhook
	 * @private
	 */
	unhookStoreRecord: function(record)
	{
		var folders = record.getSubStore('folders');
		folders.un('add', this.onFolderAdd, this);
		folders.un('remove', this.onFolderRemove, this);
		folders.un('update', this.onFolderUpdate, this);
	},

	/**
	 * Event handler fired when a folder in one of the {@link Zarafa.plugins.files.data.FilesStoreRecord stores}
	 * in this store has been {@link Ext.data.Store#add added}. This will fire the
	 * {@link #addFolder} event.
	 *
	 * @param {Zarafa.plugins.files.data.FilesFoldersSubStore} substore
	 * @param {Zarafa.plugins.files.data.FilesFolderRecord} folder which is added to the hierarchy
	 * @param {Number} index The index in the substore from where the folder was added
	 * @private
	 */
	onFolderAdd: function(store, records, index)
	{
		this.fireEvent('addFolder', this, store.getParentRecord(), records, index);
	},

	/**
	 * Event handler fired when a folder in one of the {@link Zarafa.hierarchy.data.MAPIStoreRecord stores}
	 * in this store has been {@link Ext.data.Store#update updated}. This will fire the
	 * {@link #updateFolder} event.
	 *
	 * @param {Zarafa.plugins.files.data.FilesFoldersSubStore} store
	 * @param {Zarafa.plugins.files.data.FilesFolderRecord} record which is updated in the hierarchy.
	 * @param {String} operation The update operation being performed. Value may be one of
	 * {@link Ext.data.Record#EDIT}, {@link Ext.data.Record#REJECT}, {@link Ext.data.Record#COMMIT}.
	 * @private
	 */
	onFolderUpdate: function(store, record, operation)
	{
		this.fireEvent('updateFolder', this, store.getParentRecord(), record, operation);
	},

	/**
	 * Event handler fired when a folder in one of the {@link Zarafa.hierarchy.data.MAPIStoreRecord stores}
	 * in this store has been {@link Ext.data.Store#remove removed}. This will fire the
	 * {@link #removeFolder} event.
	 *
	 * @param {Zarafa.plugins.files.data.FilesFoldersSubStore} substore
	 * @param {Zarafa.plugins.files.data.FilesFolderRecord} folder which is removed from the hierarchy
	 * @param {Number} index The index in the substore from where the folder was removed
	 * @private
	 */
	onFolderRemove: function(store, record, index)
	{
		this.fireEvent('removeFolder', this, store.getParentRecord(), record, index);
	},

	/**
	 * Retrieves a folder by MAPI ID from list of stores
	 * @param {String} id MAPI ID of the folder to search for.
	 * @return {Zarafa.plugins.files.data.FilesFolderRecord} a folder matching the given ID, or undefined if not found.
	 */
	getFolder: function(id)
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
	 * Retrieves a folder by MAPI ID from list of stores
	 * @param {String} id MAPI ID of the folder to search for.
	 * @return {Zarafa.plugins.files.data.FilesFolderRecord} a folder matching the given ID, or undefined if not found.
	 */
	getFolderByFolderId: function(id)
	{
		for(var i = 0, len = this.getCount(); i < len; i++) {
			var folderStore = this.getAt(i).getFolderStore();

			if(folderStore) {
				var folderIndex = folderStore.findExact('folder_id', id);
				if(folderIndex > -1) {
					return folderStore.getAt(folderIndex);
				}
			}
		}
		return undefined;
	},

	/**
	 * <p>Loads the Record cache from the configured <tt>{@link #proxy}</tt> using the configured <tt>{@link #reader}</tt>.</p>
	 * <br> Function just adds 'list' as actionType in options and calls parent {@link Zarafa.core.data.IPFStore#load} method.
	 * <br> Check documentation of {@link Ext.data.Store#load} for more information.
	 */
	load: function(options)
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

		// Reload the files hierarchy panel.
		if (options.reload) {
			options.params = {
				reload: options.reload
			};
		}

		Ext.applyIf(options, {
			actionType: Zarafa.core.Actions['list']
		});

		return Zarafa.plugins.files.data.FilesHierarchyStore.superclass.load.call(this, options);
	}
});



Ext.reg('filesplugin.hierarchystore', Zarafa.plugins.files.data.FilesHierarchyStore);
