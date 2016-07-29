Ext.namespace('Zarafa.core');

/**
 * @class Zarafa.core.ContextModel
 * @extends Zarafa.core.data.StatefulObservable
 *
 * A context model is the main class containing
 * the data which is being used within a
 * {@link Zarafa.core.Context context}
 */
Zarafa.core.ContextModel = Ext.extend(Zarafa.core.data.StatefulObservable, {
	/**
	 * The currently active datamode, this is updated through {@link #setDataMode} and when
	 * this field changes, the {@link #datamodechange} event will be fired.
	 * When this context is {@link #stateful stateful}, this option will be
	 * saved in the settings.
	 * @property
	 * @type Mixed
	 */
	current_data_mode : undefined,

	/**
	 * @cfg {Zarafa.core.data.IPMStore} store The store
	 * which contains all {@link Zarafa.core.data.IPMRecord records}
	 * which must be shown within this {@link Zarafa.core.Context context},
	 */
	store: undefined,

	/**
	 * @cfg {Zarafa.hierarchy.data.MAPIFolderRecord[]} folders The folders
	 * which have been loaded by this context model.
	 */
	folders: undefined,

	/**
	 * The object containing all entryids to folders which are opened by the
	 * context. This object is used to save to the settings so it can be restored
	 * in a new session.
	 * When this context is {@link #stateful stateful}, this option will be
	 * saved in the settings.
	 * @property
	 * @type Object
	 */
	last_used_folders : undefined,

	/**
	 * @cfg {Zarafa.core.data.IPMRecord[]} selectedRecords The records
	 * which are currently selected within this {@link Zarafa.core.Context context}.
	 */
	selectedRecords : undefined,

	/**
	 * @cfg {Zarafa.hierarchy.data.MAPIFolderRecord[]} defaultFolder default folder for the contextModel.
	 */
	defaultFolder: undefined,

	/**
	 * @cfg {Boolean} statefulRecordSelection True if per-folder the last selected records
	 * must be stored ({@link #lastSelectedRecord} and {@link #lastPreviewedRecord}), which will be
	 * automatically selected when the given folder has been selected again.
	 */
	statefulRecordSelection : false,

	/**
	 * A key-value array of {@link Zarafa.hierarchy.data.MAPIFolderRecord Folder} and {@link Zarafa.core.data.IPMRecord Record} entryids.
	 * In this array we store the last record which is being {@link #setPreviewRecord previewed} in this Context.
	 * @property
	 * @type Object
	 */
	lastPreviewedRecord : {},

	/**
	 * A key-value array of {@link Zarafa.hierarchy.data.MAPIFolderRecord Folder} and {{@link Zarafa.core.data.IPMRecord Records} entryids.
	 * In this array we store the last record selection which was selected in thie Context.
	 * @property
	 * @type Object
	 */
	lastSelectedRecord : {},

	/**
	 * True if the model is currently busy in live scrolling. This is updated during
	 * {@link #startLiveScroll} and {@link #stopLiveScroll}.
	 * @property
	 * @type Boolean
	 * @private
	 */
	isBusyScrolling : false,

	/**
	 * True if the Model is currently {@link #enable enabled}.
	 * While true, calls to {@link #load} can operate (unless {@link #suspended suspended}.
	 * @property
	 * @type Boolean
	 */
	enabled : false,

	/**
	 * True if the Model is currently {@link #suspendLoading suspended} from loading.
	 * While true, calls to {@link #load} will not do anything.
	 * @property
	 * @type Boolean
	 */
	suspended : false,

	/**
	 * If {@link #suspendLoading suspended} then this indicates if {@link #load}
	 * has been called. This is used during {@link #resumeLoading resuming} to
	 * determine if a call to {@link #load} should be made. The options for the
	 * {@link #load} call will have been saved in {@link #suspendData}.
	 */
	suspendLoad : false,

	/**
	 * If {@link #suspendLoading suspended} then this object contains the properties
	 * which were last given to {@link #load}. When {@link #resumeLoading resuming}
	 * this object will be used as argument to {@link #load}.
	 * @property
	 * @type Object
	 */
	suspendData : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			stateful : true
		});

		this.addEvents(
			/**
			 * @event previewrecordchange
			 * Fires when a mail record is selected for preview.
			 * @param {Zarafa.core.ContextModel} model this model.
			 * @param {Zarafa.core.data.IPMRecord} record the record.
			 */
			'previewrecordchange',
			/**
			 * @event recordselectionchange
			 * Fires when the selected records within the context has been changed.
			 * @param {Zarafa.core.ContextModel} model this context model.
			 * @param {Zarafa.core.data.IPMRecord[]} records The selected records
			 */
			'recordselectionchange',
			/**
			 * @event folderchange
			 * Fires when the list of selected folders has changed.
			 * @param {Zarafa.core.ContextModel} model this context model.
			 * @param {Array} folders selected folders as an array of {Zarafa.hierarchy.data.MAPIFolderRecord Folder} objects. 
			 */
			'folderchange',
			/**
			 * @event modechange
			 * Fires when the view mode is changed.
			 * @param {Zarafa.core.ContextModel} model this model.
			 * @param {Number} mode new data mode (view modes are set by every context).
			 * @param {Number} oldMode previous data mode (view modes are set by every context).
			 */
			'datamodechange',
			/**
			 * @event beforelivescrollstart
			 * Fires before the live scroll is being {@link #startLiveScroll started}.
			 * @param {Zarafa.core.ContextModel} model The model which fired the event
			 * @param {Number} cursor the cursor contains the last index of record in grid.
			 * @return {Boolean} false to prevent the live scroll from being started
			 */
			'beforelivescrollstart',
			/**
			 * @event livescrollstart
			 * Fires when the live scroll is being {@link #startLiveScroll started}.
			 * @param {Zarafa.core.ContextModel} model The model which fired the event
			 * @param {Number} cursor the cursor contains the last index of record in grid.
			 */
			'livescrollstart',
			/**
			 * @event beforelivescrollstop
			 * Fired before the live scroll is being {@link #stopLiveScroll stopped}.
			 * @param {Zarafa.core.ContextModel} model The model which fired the event
			 * @return {Boolean} False to prevent the live scroll from being stopped
			 */
			'beforelivescrollstop',
			/**
			 * @event livescrollstop
			 * Fired when the live scroll is being {@link #stopLiveScroll stopped}.
			 * @param {Zarafa.core.ContextModel} model The model which fired the event
			 */
			'livescrollstop',
			/**
			 * @event beforesearchstart
			 * Fires before the Search is being {@link #startSearch started}.
			 * @param {Zarafa.core.ContextModel} model The model which fired the event
			 * @param {Object} restriction The restriction which should be applied for the search
			 * @param {Boolean} subfolders True if searching should also include the subfolders
			 * @return {Boolean} false to prevent the search from being started
			 */
			'beforesearchstart',
			/**
			 * @event searchstart
			 * Fires when the Search is being {@link #startSearch started}.
			 * @param {Zarafa.core.ContextModel} model The model which fired the event
			 * @param {Object} restriction The restriction which should be applied for the search
			 * @param {Boolean} subfolders True if searching should also include the subfolders
			 */
			'searchstart',
			/**
			 * @event searchupdate
			 * Fired when the Search results have been {@link #onSearchUpdate updated}.
			 * @param {Zarafa.core.ContextModel} model The model which fired the event
			 * @param {Ext.data.Store} store the Store in which the search takes place
			 * @param {Object} searchInfo The searchInfo sent by the server
			 */
			'searchupdate',
			/**
			 * @event beforesearchstop
			 * Fired before the search is being {@link #stopSearch stopped}.
			 * @param {Zarafa.core.ContextModel} model The model which fired the event
			 * @return {Boolean} False to prevent the search from being stopped
			 */
			'beforesearchstop',
			/**
			 * @event searchstop
			 * Fired when the search is being {@link #stopSearch stopped}.
			 * @param {Zarafa.core.ContextModel} model The model which fired the event
			 */
			'searchstop',
			/**
			 * @event searchfinish
			 * Fired when the search is finished, this could come shortly after the
			 * {@link #searchupdate} event.
			 * @param {Zarafa.core.ContextModel} model The model which fired the event
			 */
			'searchfinish',
			/**
			 * @event searchexception
			 * Fired when the server encountered an exception during the search
			 * @param {Zarafa.core.ContextModel} model The model which fired the event
			 * @param {Zarafa.core.data.IPMProxy} proxy object that received the error.
			 * @param {String} type 'request' if an invalid response from server recieved,
			 * 'remote' if valid response received from server but with succuessProperty === false.
			 * @param {String} action Name of the action {@link Ext.data.Api.actions}.
			 * @param {Object} options The options for the action that were specified in the request.
			 * @param {Object} response response received from server depends on type.
			 * @param {Mixed} args
			 */
			'searchexception'
		);
		
		Zarafa.core.ContextModel.superclass.constructor.call(this, config);

		if (this.statefulRecordSelection === true) {
			this.store.on('beforeload', this.onBeforeLoad, this);
			this.store.on('load', this.onLoad, this);
		}

		if (this.stateful) {
			this.initState();
		}

		// Hook an event handler to the 'load' event of the
		// hierarchyStore. Call the event handler directly
		// in case the hierarchy has already been loaded.
		var hierarchyStore = container.getHierarchyStore();
		hierarchyStore.on('load', this.onHierarchyLoad, this);
		this.onHierarchyLoad(hierarchyStore);

		Zarafa.core.data.IPFStoreMgr.on('afterrecordupdate', this.afterRecordUpdate, this);
	},

	/**
	 * Called during the {@link Zarafa.core.Context#enable enabling} of the {@link Zarafa.core.Context context}.
	 * Secondly it will {@link #setFolders set the} {@link #folders folder} to this object to {@link #load} the {@link #store}.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder MAPI folder to show.
	 * @param {Boolean} suspended True to enable the ContextModel {@link #suspendLoading suspended}
	 */
	enable : function(folder, suspended)
	{
		// Enable ContextModel
		this.enabled = true;

		// By default suspend loading, both setFolders() and setDataMode()
		// might trigger a call to load() and we want to defer that to a single
		// call only.
		this.suspendLoading(true);

		// apply the folder, don't reload, as setDataMode will do that for us.
		if (folder) {
			this.setFolders(folder);
		}
		this.setDataMode(this.getCurrentDataMode(), true);

		if (suspended !== true) {
			this.resumeLoading();
		}
	},

	/**
	 * Called during the {@link Zarafa.core.Context#disable disabling} of the {@link Zarafa.core.Context context}.
	 * This will {@link #stopSearch stop the search} and clear all data in the {@link #store}.
	 */
	disable : function()
	{
		// Disable ContextModel
		this.enabled = false;

		this.stopLiveScroll();
		this.store.cancelLoadRequests();
		this.store.removeAll(true);
	},

	/**
	 * When a {@link #store} is about to be {@link Ext.data.Store#load load},
	 * we remove the currently previewed record. This is required because
	 * during a store load, all records will be purged and thus the reference
	 * from the previewrecord to the store will be lost.
	 *
	 * @param {Zarafa.core.data.IPMStore} store the Store which is going to be loaded
	 * @param {Object} options The options object which is used for loading the store
	 * @private
	 */
	onBeforeLoad : function (store, options)
	{
		if (options && (options.actionType === Zarafa.core.Actions['updatesearch'] || options.actionType === Zarafa.core.Actions['updatelist'])) {
			// don't do anything here, as we are just updating the search results or updating list using infinite scrolling.
			// so selection shouldn't be changed
			return;
		}

		// When reloading, we don't want to reset the previewrecord,
		// as we already have the desired record loaded in the previewpanel.
		if (options.reload !== true) {
			this.setPreviewRecord(undefined, false);
		}
	},

	/**
	 * When a {@link #store} has completed a {@link Ext.data.Store#load load} action,
	 * we check if a record has been {@link #lastPreviewedRecord previewed} for this
	 * folder before. If so, we automatically select that record.
	 *
	 * @param {Zarafa.core.data.IPMStore} store The store which has loaded
	 * @param {Zarafa.core.data.IPMRecord/Array} records The records which have loaded
	 * @param {Object} options The options object used for loading the store.
	 * @private
	 */
	onLoad : function(store, records, options)
	{
		if(options && options.actionType === Zarafa.core.Actions['updatesearch']) {
			// don't do anything here, as we are just updating the search results
			// so selection shouldn't be changed
			return;
		}

		var previewRecord;
		var selectedRecords = [];

		if (!Ext.isEmpty(records)) {
			if (options && options.params) {
				var lastPreviewed = this.lastPreviewedRecord[options.params.entryid];
				if (lastPreviewed) {
					previewRecord = store.getById(lastPreviewed);
				}

				var lastSelected = this.lastSelectedRecord[options.params.entryid];
				if (lastSelected) {
					for (var i = 0, len = lastSelected.length; i < len; i++) {
						var record = store.getById(lastSelected[i]);
						if (record) {
							selectedRecords.push(record);
						}
					}
				}
			}

			/*
			 * We are already selecting record which was selected earlier
			 * so no need to save that in lastSelectedRecord.
			 */
			if (!Ext.isEmpty(selectedRecords)) {
				this.setSelectedRecords(selectedRecords, false);
			}

			/*
			 * We are already selecting record which was previewed earlier
			 * so no need to save that in lastPriviewedRecord.
			 */
			if (Ext.isDefined(previewRecord)) {
				this.setPreviewRecord(previewRecord, false);
			}
		}
	},

	/**
	 * Sets {@link #defaultFolder default folder} for the particular {@link Zarafa.core.Context context}.
	 * This will help while opening new item dialog from other contexts
	 * e.g. Create new Contact from Inbox, at this moment we need {@link #defaultFolder} to create the item.
	 *
	 * When the {@link Zarafa.core.Context context} was opened without any folders,
	 * this also means we can now {@link #addFolder load} the {@link #defaultFolder}.
	 *
	 * @param {Zarafa.core.hierarchyStore} store that holds hierarchy data.
	 * @private
	 */
	onHierarchyLoad : function(hierarchyStore)
	{
		// only continue when hierarchyStore has data
		if (hierarchyStore.getCount() === 0) {
			return;
		}

		// Check whether we have foldertype of the model and defaultFolders data or not.
		if (!Ext.isEmpty(this.store) && !Ext.isEmpty(this.store.preferredMessageClass)) {
			// assign default folder of this context model based on preffered message class from store, so getDefaultFolder can use this
			var folderType = Zarafa.core.MessageClass.getDefaultFolderTypeFromMessageClass(this.store.preferredMessageClass);
			this.defaultFolder = hierarchyStore.getDefaultFolder(folderType);

			// If we haven't any folders yet. We should obtain
			// the previously used folders or the default folder.
			if (Ext.isEmpty(this.folders)) {
				var openfolders = [];

				if (!Ext.isEmpty(this.last_used_folders)) {
					for (var key in this.last_used_folders) {
						var store = hierarchyStore.getById(key);
						if (store) {
							var folders = store.getSubStore('folders');
							var statefolders = this.last_used_folders[key];
							for (var i = 0; i < statefolders.length; i++) {
								var folder = folders.getById(statefolders[i]);
								if (folder) {
									openfolders.push(folder);
								}
							}
						}
					}
				}

				if (Ext.isEmpty(openfolders) && this.defaultFolder) {
					openfolders.push(this.defaultFolder);
				}

				this.setFolders(openfolders);
			}
		}
	},

	/**
	 * Event handler which is triggered when a {@link Zarafa.core.data.IPFRecord record} has been
	 * updated from the server. This function will check whehter action on the
	 * {@link Zarafa.core.data.IPFRecord record} does affect on the current context model i.e.
	 * {@link Zarafa.core.Actions.emptyFolder}, {@link Zarafa.core.Actions.readAllMsgs}, if it
	 * affects then we should reload current context model.
	 * 
	 * @param {Zarafa.core.data.IPFStore} IPFStore
	 * @param {Zarafa.core.data.IPFRecord} record The Record which has been updated
	 * @param {String} operation  The update operation being performed. 
	 * ({@link Ext.data.Record#EDIT}, {@link Ext.data.Record#REJECT}, {@link Ext.data.Record#COMMIT}).
	 * @private
	 */
	afterRecordUpdate : function(IPFStore, record, operation)
	{
		if(this.enabled) {
			var action = record.getMessageAction('action_type');
			if (operation == 'commit' && Ext.isString(action)) {
				switch (action.toLowerCase()) {
					case 'emptyfolder':
					case 'readflags':
						// Reload store
						Ext.each(this.getFolders(), function(folder) {
							// If any folder of the current context model is updated
							// then reload the context model.
							if (record.equals(folder)) {
								this.reload();
								return false;
							}
						}, this);
						break;
				}
			}
		}
	},

	/**
	 * Gets the store.
	 * @return {Zarafa.core.data.IPMStore} store object.
	 */
	getStore : function()
	{
		return this.store;
	},

	/**
	 * Adds a folder to the selected folder list.
	 * This function automatically causes the store to
	 * reload its contents. This method triggers the
	 * {@link #folderchange} event if the folder was not already in the
	 * selected folder list.
	 * 
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder folder to add.
	 * @return {Zarafa.hierarchy.data.MAPIFolderRecord} the folder if it was added,
	 * or undefined otherwise (i.e. it was already in the folder list).
	 */
	addFolder : function(folder)
	{
		var localFolder = this.getFolder(folder.get('entryid'));

		if (Ext.isDefined(localFolder)) {
			return undefined;
		}

		// Add the folder to the current folder list
		this.folders.push(folder);

		this.onFolderChange(this, this.folders);

		// Fire 'folderchange' event.
		this.fireEvent('folderchange', this, this.folders);

		this.load();

		return folder;
	},

	/**
	 * Removes a folder from the selected folder list.
	 * This function automatically causes the store to
	 * reload its contents. This method triggers the
	 * {@link #folderchange} event if the folder was previously in the list.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder folder to remove.
	 * @return {Zarafa.hierarchy.data.MAPIFolderRecord} the folder if it was removed,
	 * or undefined otherwise (i.e. it was not in the folder list).
	 */
	removeFolder : function(folder)
	{
		var localFolder = this.getFolder(folder.get('entryid'));

		if (!Ext.isDefined(localFolder)) {
			return undefined;
		}

		// Remove the folder from the list.
		this.folders.remove(localFolder);

		// A ContextModel must always have at least
		// 1 folder loaded. When the last folder is
		// being unloaded, loa the default one again.
		if (Ext.isEmpty(this.folders)) {
			this.folders.push(this.defaultFolder);
		}

		this.onFolderChange(this, this.folders);

		// Fire 'folderchange' event.
		this.fireEvent('folderchange', this, this.folders);

		this.load();

		return localFolder;
	},

	/**
	 * Sets the selected folder list directly.
	 * Fires the {@link #folderchange} event.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord[]} folders selected folders as an array of
	 * {@link Zarafa.hierarchy.data.MAPIFolderRecord MAPIFolder} objects.
	 */
	setFolders : function(folders)
	{
		var saveState = true;
		// Skip saving state when initial folders are set
		if (this.folders == folders || this.folders === undefined) {
			saveState = false;
		}

		if (Ext.isArray(folders)) {
			this.folders = folders.clone();
		} else if (Ext.isDefined(folders)) {
			this.folders = [ folders ];
		} else {
			this.folders = [];
		}

		this.onFolderChange(this, this.folders);

		// Fire 'folderchange' event.
		this.fireEvent('folderchange', this, this.folders, saveState);

		this.load();
	},

	/**
	 * Event handler which is executed right before the {@link #folderchange}
	 * event is fired. This allows subclasses to update the folders.
	 *
	 * @param {Zarafa.core.ContextModel} model The model which fired the event.
	 * @param {Array} folders selected folders as an array of {@link Zarafa.hierarchy.data.MAPIFolderRecord Folder} objects.
	 * @private
	 */
	onFolderChange : function(model, folders)
	{
		// Stop the search

		// Stop the live scroll.
		this.stopLiveScroll();

		// Load the sorting for the new folders
		if (this.stateful && !Ext.isEmpty(folders)) {
			var folder = folders[0];
			var state = container.getHierarchyStore().getState(folder, 'list');
			var sort = this.store.defaultSortInfo;

			if (state && state.sort) {
				sort = state.sort;
			}

			if (sort) {
				this.store.setDefaultSort(sort.field, sort.direction);
			}
		}	
	},

	/**
	 * Returns a list of currently selected folders.
	 * @return {Zarafa.hierarchy.data.MAPIFolderRecord[]} selected folders as an array of
	 * {@link Zarafa.hierarchy.data.MAPIFolderRecord MAPIFolder} objects. 
	 */
	getFolders : function()
	{
		return this.folders || [];
	},

	/**
	 * Returns the default {@link Zarafa.hierarchy.data.MAPIFolderRecord folder} which is
	 * used within the current selection of folders. If this {@link Zarafa.core.ContextModel ContextModel} is not enabled
	 * then this function will return default folder of this context, and if not enabled then it will return
	 * currently selected folder in the ContextModel.
	 * @return {Zarafa.hierarchy.data.MAPIFolderRecord} The default folder
	 */
	getDefaultFolder : function()
	{
		if(this.enabled) {
			// ContextModel is enabled return currently selected folder
			var folders = this.getFolders();

			// For ContextModel which doesn't handle multiple folder selection, folders will always be an array with one folder
			// so get that first folder
			if(!Ext.isEmpty(folders)) {
				return folders[0];
			}
		}

		// ContextModel is not enabled so return default folder
		return this.defaultFolder;
	},

	/**
	 * Gets a folder from the selected folder list.
	 * @param {String} id folder MAPI Id.
	 * @return {Zarafa.hierarchy.data.MAPIFolderRecord} a folder object if found, undefined otherwise.
	 * @private 
	 */
	getFolder : function(id)
	{
		var ret;
		Ext.each(this.getFolders(), function(folder) {
			if (Zarafa.core.EntryId.compareEntryIds(folder.get('entryid'), id)) {
				ret = folder;
				return false;
			}
		});
		return ret;
	},

	/**
	 * Checks if a folder exists in the selected folder list.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord/String} folder Either the MAPIFolder, or
	 * the id from the MAPIFolder to be used as id.
	 * @return {Boolean} true iff the given folder is selected.
	 */
	hasFolder : function(folder)
	{
		if (folder instanceof Zarafa.core.data.MAPIRecord) {
			folder = folder.get('entryid');
		}

		return Ext.isDefined(this.getFolder(folder));
	},

	/*
	 * Create a new {@link Zarafa.core.data.IPMRecord IPMRecord} record  which is associated to this context.
	 * this is a base function to create record. each context will overwrite this function to
	 * create record of that specific context.
	 * @param {Zarafa.core.IPMFolder} folder (optional) The target folder in which the new record must be
	 * created. If this is not provided the default folder will be used.
	 * @return {Zarafa.core.data.IPMRecord} IPMRecord which is associated to this context.
	 */
	createRecord : Ext.emptyFn,

	/**
	 * Set the {@link Zarafa.core.data.IPMRecord records} which have been
	 * selected within the {@link Zarafa.core.Context context}. Raise the
	 * {@link #recordselectionchange} to inform any listeners about the update.
	 *
	 * @param {Zarafa.core.data.IPMRecord[]} records The selected records 
	 * @param {Boolean} stateful (optinal) false to prevent the selected records to be saved
	 * in the {@link #lastSelectedRecords}.
	 */
	setSelectedRecords : function(records, stateful)
	{
		if (!this.selectedRecords || !records || !this.selectedRecords.equals(records)) {
			this.selectedRecords = records;

			if (this.statefulRecordSelection === true && stateful !== false && !Ext.isEmpty(records)) {
				this.lastSelectedRecord[records[0].get('parent_entryid')] = Ext.pluck(records, 'id');
			}

			this.fireEvent('recordselectionchange', this, records);
		}
	},

	/**
	 * Get the currently selected {@link Zarafa.core.data.IPMRecord records}
	 * from this {@link Zarafa.core.Context context}.
	 *
	 * @return {Zarafa.core.data.IPMRecord[]} The selected records
	 */
	getSelectedRecords : function()
	{
		return this.selectedRecords;
	},

	/**
	 * Suspend all calls to {@link #load}. This will prevent the {@link #store}
	 * to send load requests to the server until the model has been
	 * {@link #resumeLoading resumed} again.
	 *
	 * This can be used to configure multiple options in the ContextModel
	 * and defer the loading until all actions have been completed.
	 */
	suspendLoading : function()
	{
		this.suspended = true;
	},

	/**
	 * Resume the loading actions again if {@link #suspendLoading}.
	 * This will allow the {@link #load} function to use the {@link #store}
	 * again to send requests to the server. This will also call {@link #load}
	 * with the last options that were given to it while being suspended.
	 *
	 * @param {Boolean} discard Discard the calls to load while being suspended.
	 */
	resumeLoading : function(discard)
	{
		if (this.suspended === true) {
			this.suspended = false;
			if (discard !== false && this.suspendLoad === true) {
				this.load(this.suspendData);
			}
			delete this.suspendData;
		}
	},

	/**
	 * Load the store using the given (optional) restriction.
	 * @param {Object} data The data object to load the store with
	 * @private
	 */
	load : function(data)
	{
		if (!this.enabled) {
			return;
		}

		if (this.suspended) {
			this.suspendLoad = true;
			this.suspendData = data;
			return;
		}

		if (Ext.isEmpty(this.folders)) {
			// No folders can be loaded, empty the store
			this.setPreviewRecord(undefined, false);
			this.store.removeAll(true);
		} else {
			// Load a new set of folders from the store.
			data = Ext.applyIf(data || {}, {
				folder : this.folders
			});

			this.store.load(data);
		}
	},

	/**
	 * Reload the store using the previous configured options/folders.
	 * but it check that action type is {@link Zarafa.core.Actions#updatelist 'updatelist'} then 
	 * call {@link #stopLiveScroll}
	 */
	reload : function()
	{
		var lastOptions = this.store.lastOptions;

		// If live scroll is performed and search is not then stop the live scroll.
		if(!this.isSearching() && this.isBusyScrolling){
			this.stopLiveScroll();
		}

		if (this.suspended) {
			this.suspendLoad = true;
			this.suspendData = lastOptions;
		} else {
			this.store.reload();
		}
	},

	/**
	 * Update the current preview {@link Zarafa.core.data.IPMRecord}
	 * This will fire the event {@link #previewrecordchange}.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record which is set as preview
	 * @param {Boolean} stateful (optinal) false to prevent the previewrecord to be saved
	 * in the {@link #lastPreviewedRecord}.
	 */
	setPreviewRecord : function(record, stateful)
	{
		if (this.previewRecord !== record) {
			this.previewRecord = record;

			if (this.statefulRecordSelection === true && stateful !== false && Ext.isDefined(record)) {
				this.lastPreviewedRecord[record.get('parent_entryid')] = record.get('entryid');
			}

			this.fireEvent('previewrecordchange', this, record);
		}
	},

	/**
	 * Obtain the currently selected {@link Ext.data.Record} which is
	 * set as the preview record.
	 *
	 * @return {Zarafa.core.data.IPMRecord}
	 */
	getPreviewRecord : function()
	{
		return this.previewRecord;
	},

	/**
	 * Sets the current mode from the available data modes.
	 * 
	 * Fires the {@link #datamodechange} event.
	 * @param {Number} mode view mode (context should define modes and its numeric values).
	 * @param {Boolean} init (optional) True when this function is called during initialization
	 * and it should force the change of the data mode.
	 */
	setDataMode : function(mode, init)
	{
		if (init === true || this.current_data_mode !== mode) {
			var oldMode = this.current_data_mode;
			this.current_data_mode = mode;

			this.onDataModeChange(this, this.current_data_mode, oldMode);

			// fire mode change event
			this.fireEvent('datamodechange', this, this.current_data_mode, oldMode);
		}
	},

	/**
	 * Event handler which is executed right before the {@link #datamodechange}
	 * event is fired. This allows subclasses to initialize the {@link #store}.
	 *
	 * @param {Zarafa.core.ContextModel} model The model which fired the event.
	 * @param {Mixed} newMode The new selected DataMode.
	 * @param {Mixed} oldMode The previously selected DataMode.
	 * @private
	 */
	onDataModeChange : Ext.emptyFn,

	/**
	 * Returns the currently active {@link #current_data_mode datamode} as configured
	 * through {@link #setDataMode}.
	 * @return {Mixed} The datamode id of the currently active datamode.
	 */
	getCurrentDataMode : function()
	{
		return this.current_data_mode;
	},

	/**
	 * {@link Ext.data.Store#clearGrouping clear the grouping} on the
	 * {@link #store}.
	 */
	clearGrouping : function()
	{
		// Only clear grouping, when grouping was applied
		// in the first place.
		if (!Ext.isEmpty(this.store.groupField)) {
			this.store.clearGrouping();
		}
	},

	/**
	 * {@link Ext.data.Store#groupBy group the properties} on the
	 * {@link #store}.
	 */
	groupBy : function(property)
	{
		this.store.groupBy(property);
	},

	/**
	 * Check if the store is currently using searching.
	 * @return {Boolean} True if the store is currently searching
	 */
	isSearching : function()
	{
		if(Ext.isDefined(this.getStore()) && Ext.isDefined(this.getStore().isBusySearching) && this.getStore().isBusySearching) {
			return true;
		}
		return false;
	},

	/**
	 * Check if the {@link Zarafa.hierarchy.data.MAPIStoreRecord store}
	 * of the {@link #getDefaultFolder folder} in which we intend to search has support for
	 * {@link Zarafa.hierarchy.data.MAPIStoreRecord#hasSearchSupport Search folders}.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder (optional) If passed, this folder's store
	 * will be checked for search folder support instead of the default folder's
	 * @return {Boolean} True if search folders are supported
	 */
	supportsSearchFolder : function(folder)
	{
		folder = folder || this.getDefaultFolder();

		if (Ext.isEmpty(folder)) {
			return false;
		}

		var mapiStore = folder.getMAPIStore();
		if (!mapiStore) {
			return false;
		}

		return mapiStore.hasSearchSupport();
	},

	/**
	 * Check if the model is currently using live scroll.
	 * @return {Boolean} True if the model is currently searching
	 */
	isLiveScrolling : function()
	{
		return this.isBusyScrolling;
	},

	/**
	 * Fire the {@link #livescrollstart} event and set {@link #isBusyScrolling} to true.
	 * @param {Number} cursor the cursor contains the last index of record in grid.
	 */
	startLiveScroll : function(cursor)
	{
		/*
		 * don't do anything if live scroll is not enabled just simply return.
		 */
		var isEnableLiveScroll = container.getSettingsModel().get('zarafa/v1/contexts/mail/enable_live_scroll');
		if(!isEnableLiveScroll) {
			return;
		}

		if (this.fireEvent('beforelivescrollstart', this, cursor) !== false) {
			this.isBusyScrolling = true;
			this.store.on('exception', this.onLiveScrollException, this);
			if(this.fireEvent('livescrollstart', this, cursor) !== false) {
				var options = {
					restriction: {}
				};
				options.restriction['start'] = cursor;
				options.restriction['limit'] = container.getSettingsModel().get('zarafa/v1/main/page_size');
				this.store.liveScroll({
					folder : [this.getDefaultFolder()],
					params : options,
					add : true
				});
			}
		}
	},

	/**
	 * Stop {@link Zarafa.core.data.ListModuleStore#stopLiveScroll stopLiveScroll} in the {@link #store}
	 * and fire the {@link #livescrollstop} event.
	 */
	stopLiveScroll : function()
	{
		if (this.isBusyScrolling && this.fireEvent('beforelivescrollstop', this) !== false) {
			this.store.stopLiveScroll();

			this.store.un('exception', this.onLiveScrollException, this);
			this.isBusyScrolling = false;
			this.fireEvent('livescrollstop', this);
		}
	},

	/**
	 * Event handler for the {@link Zarafa.core.data.ListModuleStore#exception} event
	 * of the {@link #store} which is fired when the server failed to update the live scroll.
	 *
	 * @param {Zarafa.core.data.IPMProxy} proxy object that received the error
	 * and which fired exception event.
	 * @param {String} type 'request' if an invalid response from server recieved,
	 * 'remote' if valid response received from server but with succuessProperty === false.
	 * @param {String} action Name of the action {@link Ext.data.Api.actions}.
	 * @param {Object} options The options for the action that were specified in the request.
	 * @param {Object} response response received from server depends on type.
	 * @param {Mixed} args
	 * @private
	 */
	onLiveScrollException : function(proxy, type, action, options, response, args)
	{
		this.store.un('exception', this.onLiveScrollException, this);
		this.stopLiveScroll();
	},

	/**
	 * Fire the {@link #searchstart} event and start
	 * {@link Zarafa.core.data.ListModuleStore#search searching} in the {@link #store}.
	 * @param {Object} restriction The restriction which should be applied for the search
	 * @param {Boolean} subfolders True if searching should also include the subfolders
	 * this will only be used when searchfolders are supported
	 */
	startSearch : function(restriction, subfolders, options)
	{
		var useSearchFolder = this.supportsSearchFolder();

		// We don't support subfolders when searchfolders are disabled
		if (!useSearchFolder) {
			subfolders = false;
		}

		if (this.fireEvent('beforesearchstart', this, restriction, subfolders) !== false) {
			this.store.isBusySearching = true;
			this.fireEvent('searchstart', this, restriction, subfolders);

			this.store.on('exception', this.onSearchException, this);
			if (useSearchFolder) {
				// only required when using a search folder
				this.store.on('beforeupdatesearch', this.onSearchUpdate, this);
			} else {
				// if we are not using search folder then also after completion of search we need to fire 'searchfinished' event
				this.store.on('load', function() {
					this.fireEvent('searchfinished', this);
				}, this, {single : true});
			}

			// send request to store to start search
			this.store.search({
				// search in multiple folders not supported at the moment
				folder : options.folder,
				useSearchFolder : useSearchFolder,
				subfolders : subfolders,
				searchRestriction : restriction
			});
		}
	},

	/**
	 * Stop {@link Zarafa.core.data.ListModuleStore#stopSearch searching} in the {@link #store}
	 * and fire the {@link #searchstop} event.
	 */
	stopSearch : function()
	{
		if (this.isSearching() && this.fireEvent('beforesearchstop', this) !== false) {
			// send request to store to stop search
			this.store.stopSearch({});

			this.store.un('exception', this.onSearchException, this);
			this.store.un('beforeupdatesearch', this.onSearchUpdate, this);

			this.store.isBusySearching = false;
			this.isBusyScrolling = false;
			this.fireEvent('searchstop', this);
		}
	},

	/**
	 * Event handler for the {@link Zarafa.core.data.ListModuleStore#beforeupdatesearch} event
	 * of the {@link #store}. This will fire the {@link #searchupdate} event and will
	 * check if the {@link Zarafa.core.mapi.Search#isSearchRunning search is still running},
	 * otherwise the {@link #searchfinished} event will be fired.
	 * @param {Ext.data.Store} store the Store which fired the event
	 * @param {Object} searchInfo The searchInfo sent by the server
	 * @private
	 */
	onSearchUpdate : function(store, searchInfo)
	{
		this.fireEvent('searchupdate', this, store, searchInfo);

		if (!Zarafa.core.mapi.Search.isSearchRunning(searchInfo['searchState'])) {
			
			store.un('exception', this.onSearchException, this);
			store.un('beforeupdatesearch', this.onSearchUpdate, this);

			this.fireEvent('searchfinished', this);
		}
	},

	/**
	 * Event handler for the {@link Zarafa.core.data.ListModuleStore#exception} event
	 * of the {@link #store} which is fired when the server failed to update the search.
	 * This will fire the {@link #searchexception} event and stop the search.
	 *
	 * @param {Zarafa.core.data.IPMProxy} proxy object that received the error
	 * and which fired exception event.
	 * @param {String} type 'request' if an invalid response from server recieved,
	 * 'remote' if valid response received from server but with succuessProperty === false.
	 * @param {String} action Name of the action {@link Ext.data.Api.actions}.
	 * @param {Object} options The options for the action that were specified in the request.
	 * @param {Object} response response received from server depends on type.
	 * @param {Mixed} args
	 * @private
	 */
	onSearchException : function(proxy, type, action, options, response, args)
	{
		this.store.un('exception', this.onSearchException, this);
		this.store.un('beforeupdatesearch', this.onSearchUpdate, this);

		this.stopSearch();

		this.fireEvent('searchexception', this, proxy, type, action, options, response, args);
	},

	/**
	 * Obtain the path in which the {@link #getState state} must be saved.
	 * This option is only used when the {@link Zarafa.core.data.SettingsStateProvider SettingsStateProvider} is
	 * used in the {@link Ext.state.Manager}. This returns {@link #statefulName} if provided, or else generates
	 * a custom name.
	 * @return {String} The unique name for this component by which the {@link #getState state} must be saved. 
	 */
	getStateName : function()
	{
		var name = this.statefulName;
		if (!name) {
			if (this.store) {
				name = this.store.preferredMessageClass.match(/(?:IPM\.)?(.*)/)[1].toLowerCase();
			}
		}

		return 'models/' + name;
	},

	/**
	 * Register the {@link #stateEvents state events} to the {@link #saveFolderChangeState} and the
	 * {@link #saveDataModeState} callback functions.
	 * @protected
	 */
	initStateEvents : function()
	{
		Zarafa.core.ContextModel.superclass.initStateEvents.call(this);
		this.on('datamodechange', this.saveDataModeState, this, { delay : 100 });
		this.on('folderchange', this.saveFolderChangeState, this, { delay : 100 });
	},

	/**
	 * Handler for 'folderchange' event, which calls {@link #saveState} only
	 * when save is not false.
	 *
	 * @param {Zarafa.core.ContextModel} contextModel the contextModel which states needs to be saved.
	 * @param {Array} folders the folders which are changed.
	 * @param {Boolean} save determines if state should be saved.
	 */
	saveFolderChangeState : function(contextModel, folders, save)
	{
		if (save !== false) {
			this.saveState();
		}
	},

	/*
	 * Handler for 'datamodechange' event, which calls {@link #saveState} only
	 * when the datamode has been changed.
	 *
	 * @param {Zarafa.core.ContextModel} contextModel the contextModel which states needs to be saved.
	 * @param {Number} current_data_mode the current data mode.
	 * @param {Number} oldMode the old data mode.
	 */
	saveDataModeState : function(context, current_data_mode, oldMode)
	{
		if (current_data_mode != oldMode) {
			this.saveState();
		}
	},

	/**
	 * When {@link #stateful} the State object which should be saved into the
	 * {@link Ext.state.Manager}.
	 * @return {Object} The state object
	 * @protected
	 */
	getState : function()
	{
		var state = Zarafa.core.ContextModel.superclass.getState.call(this) || {};
		var searching = this.isSearching();

		// If a folders list exists, it should be used to update
		// the last_used_folders object. Otherwise we keep the value
		// as we don't want to override it with an empty object.
		if (this.folders) {
			this.last_used_folders = {};

			for (var i = 0, len = this.folders.length; i < len; i++) {
				var folder = this.folders[i];
				var storeentryid = folder.get('store_entryid');
				var entryid = folder.get('entryid');

				if (!Ext.isDefined(this.last_used_folders[storeentryid])) {
					this.last_used_folders[storeentryid] = [];
				}

				this.last_used_folders[storeentryid].push(entryid);
			}
		}

		return Ext.apply(state, searching ? {} : {
			current_data_mode : this.current_data_mode,
			last_used_folders : this.last_used_folders
		});
	}
});
