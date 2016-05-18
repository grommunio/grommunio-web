Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.ListModuleStore
 * @extends Zarafa.core.data.IPMStore
 * @xtype zarafa.listmodulestore
 *
 * A store that communicates with a list module on the php side. It supports listing items,
 * pagination, etc.
 * <p>
 * Pagination is not properly supported since there is no way to pass the desired page size
 * to the server side. Therefore the page size has to be hard-coded to 50 items.
 */
Zarafa.core.data.ListModuleStore = Ext.extend(Zarafa.core.data.IPMStore, {
	/**
	 * Read-only. boolean to indicate store contains results of search.
	 * @property
	 * @type Boolean
	 */
	hasSearchResults  : false,

	/**
	 * used in search to indicate that we should use search folder or not.
	 * without search folder we can search by applying restriction to 'list' action.
	 * @property
	 * @type Boolean
	 */
	useSearchFolder : false,

	/**
	 * @cfg {String} actionType type of action that should be used to send request to server,
	 * valid action types are defined in {@link Zarafa.core.Actions Actions}, default value is 'list'.
	 */
	actionType : undefined,

	/**
	 * @cfg {Boolean} subfolders specifies subfolders should be included in search or not.
	 */
	subfolders : false,

	/**
	 * @cfg {HexString} entryId entry id of the folder.
	 */
	entryId : undefined,

	/**
	 * @cfg {HexString} storeEntryId entry id of store.
	 */
	storeEntryId : undefined,

	/**
	 * @cfg {Zarafa.hierarchy.data.MAPIFolderRecord} folder instead of passing entryId and storeEntryId,
	 * we can pass folder also from which this store will load data.
	 */
	folder : undefined,

	/**
	 * used in synchronizing {@link Zarafa.core.data.ListModuleStore store} which indicate true after deleting {@link Zarafa.core.data.IPMRecords[] records}
	 * from {@link Zarafa.core.data.ListModuleStore store}.
	 * @property
	 * @type Boolean
	 */
	syncStore : false,

	/**
	 * @cfg {Number} which is hold number of records loaded in {@link Zarafa.core.data.ListModuleStore store}
	 */
	totalLoadedRecord : undefined,

	/**
	 * The LoadMask object which will be shown when the {@link Zarafa.core.data.ListModuleStore store}
	 * is being delete records, and the dialog is waiting for the server to respond with the desired data.
	 * @property
	 * @type Zarafa.common.ui.LoadMask
	 */
	loadMask : undefined,

	/**
	 * @cfg {String} preferredMessageClass message class that will be used to derive module name
	 * that should be used when requesting data using {@link Zarafa.core.data.IPMProxy IPMProxy).
	 */
	preferredMessageClass : 'IPM.Note',

	/**
	 * @cfg {Object} defaultSortInfo When no sorting is explicitely provided by the user.
	 * See {@link #sortInfo}.
	 */
	defaultSortInfo : undefined,

	/**
	 * Timer function that will be used to update search results after specified interval.
	 * this property should be cleared when {#stopSearch} has been called so it will cancel further
	 * requests for updating search results.
	 * @property
	 * @type Function
	 */
	searchUpdateTimer : undefined,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		config.restriction = {};

		config.preferredMessageClass = config.preferredMessageClass || this.preferredMessageClass;

		// Get the desired module, if the module is not set, check if the preferredMessageClass came
		// from the config object, if so, we should retry to get the module based on this.preferredMessageClass.
		var module = Zarafa.core.ModuleNames.getModule(config.preferredMessageClass, true);
		if (Ext.isEmpty(module) && (config.preferredMessageClass != this.preferredMessageClass)) {
			module = Zarafa.core.ModuleNames.getModule(this.preferredMessageClass, true);
		}

		// Default recordtype
		// This will be the basic recordtype for the store, Store will support those fields
		// which are bind with the record type and allow sorting on those fields.
		var recordType = Zarafa.core.data.RecordFactory.getRecordClassByMessageClass(config.preferredMessageClass);

		// Apply default settings.
		Ext.applyIf(config, {
			remoteSort : true,

			actionType : Zarafa.core.Actions['list'],

			// default writer.
			writer : new Zarafa.core.data.JsonWriter(),

			// default reader
			reader : new Zarafa.core.data.JsonReader({}, recordType),

			// default proxy
			proxy : new Zarafa.core.data.IPMProxy({
				listModuleName : module.list,
				itemModuleName : module.item
			})
		});

		this.addEvents(
			/**
			 * @event search
			 * Fires when a search request has been issued to store and store starts search.
			 * @param {Zarafa.core.data.ListModuleStore} store store that started search.
			 * @param {Object} options options object that is passed to {@link #load} event.
			 */
			'search',
			/**
			 * @event beforeupdatesearch
			 * Fires updated status of search process is received from server. This event will be fired whenever
			 * updated status of search is received despite of search has finished or not. so this can be used to
			 * check search has been finished or not.
			 * @param {Zarafa.core.data.ListModuleStore} store store that started search.
			 * @param {Object} searchResponse object that is received as updated search status.
			 */
			'beforeupdatesearch',
			/**
			 * @event updatesearch
			 * Fires when server sends status of the search in the 'search' response. This event will
			 * be fired when {@link Zarafa.core.data.ListModuleStore store} needs to send an 'updatesearch'
			 * to get status of the search when search is still not finished.
			 * @param {Zarafa.core.data.ListModuleStore} store store that started search.
			 * @param {Object} options options object that is passed to {@link #load} event.
			 */
			'updatesearch',
			/**
			 * @event stopsearch
			 * Fires when a stop search request is issued.
			 * @param {Zarafa.core.data.ListModuleStore} store store that started search.
			 * @param {Object} options options object that is passed to {@link #load} event.
			 */
			'stopsearch'
		);

		this.totalLoadedRecord = container.getSettingsModel().get('zarafa/v1/main/page_size');

		Zarafa.core.data.ListModuleStore.superclass.constructor.call(this, config);

		if(!Ext.isEmpty(this.folder)) {
			// If a folder was provided in the config, we apply the folder
			this.setFolder(this.folder);
		}
	},

	/**
	 * Compare a {@link Ext.data.Record#id ids} to determine if they are equal.
	 * This will apply the {@link Zarafa.core.EntryId#compareEntryIds compareEntryIds} function
	 * on both ids, as all records in this store will have a EntryId as unique key.
	 * @param {String} a The first id to compare
	 * @param {String} b The second id to compare
	 * @protected
	 */
	idComparison : function(a, b)
	{
		return Zarafa.core.EntryId.compareEntryIds(a, b);
	},

	/**
	 * Function will set action type.
	 * @param {String} actionType action type that will be used for sending request to server,
	 * valid values are defined in {@link Zarafa.core.Actions Actions}.
	 */
	setActionType : function(actionType)
	{
		this.actionType = actionType;
	},

	/**
	 * Function will set folder entryid and store entryid.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord[]} mapiFolder mapi folder that should be used to load data.
	 */
	setFolder : function(mapiFolder)
	{
		Ext.each(mapiFolder, function(folder, index) {
			this.setEntryId(folder.get('entryid'), index !== 0);
			this.setStoreEntryId(folder.get('store_entryid'), index !== 0);
		}, this);
	},

	/**
	 * Function will set folder entryid.
	 * @param {HexString} entryId entry id of mapi folder.
	 * @param {Boolean} add append entryids instead of overwriting it.
	 */
	setEntryId : function(entryId, add)
	{
		if(!Ext.isEmpty(add) && add) {
			// multiple entryids
			if(Ext.isEmpty(this.entryId)) {
				this.entryId = [];
			}

			if(!Ext.isEmpty(this.entryId) && !Ext.isArray(this.entryId)) {
				this.entryId = [ this.entryId ];
			}

			this.entryId.push(entryId);
		} else {
			// single entryid
			this.entryId = entryId;
		}
	},

	/**
	 * Function will get the folder entryid
	 * @return {HexString[]} The entryid/entryids of the mapi folder.
	 */
	getEntryId : function()
	{
		return this.entryId;
	},

	/**
	 * Function will set entryid of mapi store.
	 * @param {HexString} storeEntryId entry id of mapi store.
 	 * @param {Boolean} add append store entryids instead of overwriting it.
	 */
	setStoreEntryId : function(storeEntryId, add)
	{
		if(!Ext.isEmpty(add) && add) {
			// multiple entryids
			if(Ext.isEmpty(this.storeEntryId)) {
				this.storeEntryId = [];
			}

			if(!Ext.isEmpty(this.storeEntryId) && !Ext.isArray(this.storeEntryId)) {
				this.storeEntryId = [ this.storeEntryId ];
			}

			this.storeEntryId.push(storeEntryId);
		} else {
			// single store entryid
			this.storeEntryId = storeEntryId;
		}
	},

	/**
	 * Function will get the entryid of mapi store.
	 * @return {HexString} The entryid of the mapi store
	 */
	getStoreEntryId : function()
	{
		return this.storeEntryId;
	},

	/**
	 * Function will set restriction that should be used in consecutive requests.
	 * @param {Object} restriction restriction object that will contain paging info.
	 */
	setRestriction : function(restriction)
	{
		this.restriction = restriction;
	},

	/**
	 * Function will set restriction to use in searching.
	 * @param {Object} searchRestriction restriction for search.
	 */
	setSearchRestriction : function(searchRestriction)
	{
		if(!Ext.isEmpty(searchRestriction)) {
			this.restriction = Ext.apply(this.restriction || {}, {
				search : searchRestriction
			});
		} else {
			// remove blank search restriction
			delete this.restriction.search;
		}
	},

	/**
	 * Function will set boolean to use subfolders in search or not.
	 * @param {Boolean} subfolders true if subfolders should be used else false.
	 */
	setSubfolders : function(subfolders)
	{
		this.subfolders = subfolders;
	},

	/**
	 * Function will set boolean to use search folders or not.
	 * @param {Boolean} useSearchFolder true if search folder should be used else false.
	 */
	setUseSearchFolder : function(useSearchFolder)
	{
		this.useSearchFolder = useSearchFolder;
	},

	/**
	 * <p>Loads the Record cache from the configured <tt>{@link #proxy}</tt> using the configured <tt>{@link #reader}</tt>.</p>
	 * <br><p>Notes:</p><div class="mdetail-params"><ul>
	 * <li><b><u>Important</u></b>: loading is asynchronous! This call will return before the new data has been
	 * loaded. To perform any post-processing where information from the load call is required, specify
	 * the <tt>callback</tt> function to be called, or use a {@link Ext.util.Observable#listeners a 'load' event handler}.</li>
	 * <li>If using {@link Ext.PagingToolbar remote paging}, the first load call must specify the <tt>start</tt> and <tt>limit</tt>
	 * properties in the <code>options.params</code> property to establish the initial position within the
	 * dataset, and the number of Records to cache on each read from the Proxy.</li>
	 * <li>If using {@link #remoteSort remote sorting}, the configured <code>{@link #sortInfo}</code>
	 * will be automatically included with the posted parameters according to the specified
	 * <code>{@link #paramNames}</code>.</li>
	 * </ul></div>
	 * @param {Object} options An object containing properties which control loading options:<ul>
	 * <li><b><tt>params</tt></b> :Object<div class="sub-desc"><p>An object containing properties to pass as HTTP
	 * parameters to a remote data source. <b>Note</b>: <code>params</code> will override any
	 * <code>{@link #baseParams}</code> of the same name.</p>
	 * <p>Parameters are encoded as standard HTTP parameters using {@link Ext#urlEncode}.</p></div></li>
	 * <li><b>callback</b> : Function<div class="sub-desc"><p>A function to be called after the Records
	 * have been loaded. The callback is called after the load event is fired, and is passed the following arguments:<ul>
	 * <li>r : Ext.data.Record[] An Array of Records loaded.</li>
	 * <li>options : Options object from the load call.</li>
	 * <li>success : Boolean success indicator.</li></ul></p></div></li>
	 * <li><b>scope</b> : Object<div class="sub-desc"><p>Scope with which to call the callback (defaults
	 * to the Store object)</p></div></li>
	 * <li><b>add</b> : Boolean<div class="sub-desc"><p>Indicator to append loaded records rather than
	 * replace the current cache.  <b>Note</b>: see note for <tt>{@link #loadData}</tt></p></div></li>
	 * </ul>
	 * @return {Boolean} If the <i>developer</i> provided <tt>{@link #beforeload}</tt> event handler returns
	 * <tt>false</tt>, the load call will abort and will return <tt>false</tt>; otherwise will return <tt>true</tt>.
	 */
	load : function(options)
	{
		if (!Ext.isObject(options)) {
			options = {};
		}

		if (!Ext.isObject(options.params)) {
			options.params = {};
		}

		// By default 'load' must cancel the previous request.
		if (!Ext.isDefined(options.cancelPreviousRequest)) {
			options.cancelPreviousRequest = true;
		}

		// If we are searching, don't update the active entryid
		if (!this.hasSearchResults ) {
			if(!Ext.isEmpty(options.folder)) {
				// If a folder was provided in the options, we apply the folder
				this.setFolder(options.folder);
			} else if(Ext.isDefined(options.params.entryid) && Ext.isDefined(options.params.store_entryid)){
				// If the entryid was provided in the parameters we apply the params
				this.setEntryId(options.params.entryid, false);
				this.setStoreEntryId(options.params.store_entryid, false);
			}
		}

		// Override the given entryid and store entryid.
		Ext.apply(options.params, {
			entryid : this.entryId,
			search_folder_entryid : this.searchFolderEntryId,
			store_entryid : this.storeEntryId
		});

		/*
		 * these options can be passed in arguments, or it can be set by setter methods of
		 * {@link Zarafa.core.data.ListModuleStore ListModuleStore}, like {@link #setRestriction}
		 * and {@link #setActionType}, advantage of using setter methods would be that
		 * all consecutive requestswill use that options if its not passed in arguments.
		 * but load method doesn't store these options automatically (like in case of entryids), so
		 * you have to call setter methods to actually set these options.
		 */
		Ext.applyIf(options, {
			actionType : this.actionType
		});

		Ext.applyIf(options.params, {
			restriction : this.restriction
		});

		// Apply the search restriction only when search is performed, remove otherwise, if any
		if(this.restriction.search) {
			if(!this.isAdvanceSearchStore()) {
				delete options.params.restriction.search;
			} else {
				options.params.restriction = Ext.apply(options.params.restriction || {}, {
					search : this.restriction.search
				});
			}
		}

		// search specific parameters
		if (options.actionType == Zarafa.core.Actions['search']) {
			/*
			 * below parameters are required for search so if its not passed in arguments
			 * then we have to add its default values
			 */
			Ext.applyIf(options.params, {
				use_searchfolder : this.useSearchFolder,
				subfolders : this.subfolders
			});
		}

		/**
		 * We don't required search restriction while navigate using page navigation tool bar in search result grid.
 		 */
		if(options.actionType == Zarafa.core.Actions['list'] && Ext.isArray(options.params.restriction.search) && Ext.isDefined(options.params.search_folder_entryid)) {
			delete options.params.restriction.search;
		}

		// remove options that are not needed, although sending it doesn't hurt
		if (options.actionType == Zarafa.core.Actions['updatesearch'] ||
			options.actionType == Zarafa.core.Actions['stopsearch']) {
				delete options.params.restriction;
		}

		// remove search restriction when we already have a search folder entryid, otherwise the Operation::getTable() function
		// will restrict the search folder which removes some search results.
		if (options.actionType == Zarafa.core.Actions['list'] && Ext.isArray(options.params.restriction.search) && Ext.isDefined(this.searchFolderEntryId) && this.useSearchFolder) {
			delete options.params.restriction.search;
		}

		return Zarafa.core.data.ListModuleStore.superclass.load.call(this, options);
	},

	/**
	 * <p>Reloads the Record cache from the configured Proxy using the configured
	 * {@link Ext.data.Reader Reader} and the options from the last load operation
	 * performed.</p>
	 * <p><b>Note</b>: see the Important note in {@link #load}.</p>
	 * @param {Object} options <p>(optional) An <tt>Object</tt> containing
	 * {@link #load loading options} which may override the {@link #lastOptions options}
	 * used in the last {@link #load} operation. See {@link #load} for details
	 * (defaults to <tt>null</tt>, in which case the {@link #lastOptions} are
	 * used).</p>
	 * <br><p>To add new params to the existing params:</p><pre><code>
lastOptions = myStore.lastOptions;
Ext.apply(lastOptions.params, {
    myNewParam: true
});
myStore.reload(lastOptions);
	 * </code></pre>
	 */
	reload : function(options)
	{
		if (this.hasSearchResults ) {
			// The superclass for reload will apply this.lastOptions,
			// but for updateSearch we have to do that here manually.
			this.updateSearch(Ext.applyIf(options||{}, this.lastOptions));
		} else {
			Zarafa.core.data.ListModuleStore.superclass.reload.apply(this, arguments);
		}
	},

	/**
	 * Helper function to detect if {@link #this} is the {@link Zarafa.advancesearch.AdvanceSearchStore AdvanceSearchStore} or not.
	 * @return {Boolean} True if this is refered to an instance of {@link Zarafa.advancesearch.AdvanceSearchStore AdvanceSearchStore}, false otherwise.
	 */
	isAdvanceSearchStore : function()
	{
		return this.preferredMessageClass === "IPM.Search";
	},

	/**
	 * Function will be used to issue a update list request to server to retrieve next batch of records,
	 * this will internally call {@link #load} method but with some different options.
	 * @param {Object} options options object that must contain restriction to apply for live scroll.
	 */
	liveScroll : function(options)
	{
		if (!Ext.isObject(options)) {
			options = {};
		}

		if (!Ext.isObject(options.params)) {
			options.params = {};
		}

		// cancel pending load request when live scroll is started.
		if (this.isExecuting('list')) {
			this.proxy.cancelRequests('list');
		}

		Ext.apply(options, {
			actionType : Zarafa.core.Actions['updatelist']
		});

		/*
		 * If the search was done using a search folder, we do not need to apply a restriction and
		 * therefore remove the search restriction. Otherwise this would cause an restriction on the
		 * search folder itself.
		 */
		if (Ext.isDefined(this.searchFolderEntryId) && this.useSearchFolder) {
			delete this.restriction.search;
		}

		this.load(options);
	},

	/**
	 * Function will be used to reset the {@Ext.data.store#lastOptions}.
	 */
	stopLiveScroll : function()
	{
		var restriction = this.lastOptions.params.restriction;

		// cancel all pending updatelist request
		if (this.isExecuting('updatelist')) {
			this.proxy.cancelRequests('updatelist');
		}

		// reset the action type in the last options, because 
		// consecutive requests should use list action type
		Ext.apply(this.lastOptions, {
			actionType : Zarafa.core.Actions['list']
		});

		Ext.apply(restriction, {
			start : 0
		});

		if(Ext.isDefined(restriction)){
			delete restriction.limit;
		}
		delete this.lastOptions.add;
	},

	/**
	 * Function will be used to issue a search request to server to start searching,
	 * this will internally call {@link #load} method but with some different options.
	 * @param {Object} options options object that must contain restriction to apply for search.
	 */
	search : function(options)
	{
		if (!Ext.isObject(options)) {
			options = {};
		}

		if (!Ext.isObject(options.params)) {
			options.params = {};
		}

		// can't continue without a restriction
		if (Ext.isEmpty(options.searchRestriction)) {
			return;
		}

		// set search restriction
		this.setSearchRestriction(options.searchRestriction);

		// cancel pending load request when search is started
		if (this.isExecuting('list')) {
			this.proxy.cancelRequests('list');
		}

		this.setUseSearchFolder(options.useSearchFolder);
		this.setSubfolders(options.subfolders);

		if(this.useSearchFolder) {
			Ext.apply(options, {
				actionType : Zarafa.core.Actions['search']
			});
		}

		this.load(options);

		// set the flag to indicate that store contains search results
		// this should be only used when using search folders
		if(this.useSearchFolder) {
			this.hasSearchResults  = true;
		}

		this.fireEvent('search', this, options);
	},

	/**
	 * Function will be used to issue a updatesearch request to server,
	 * this will internally call {@link #load} method but with some different options.
	 * @param {Object} options options object that must contain entryid of search folder.
	 */
	updateSearch : function(options)
	{
		// We are not searching...
		if (!this.hasSearchResults ) {
			return;
		}

		if(!Ext.isObject(options)) {
			options = {};
		}

		Ext.apply(options, {
			actionType : Zarafa.core.Actions['updatesearch']
		});

		this.load(options);

		this.fireEvent('updatesearch', this, options);

		// reset the action type in the last options, because updatesearch is not persistent action type
		// and consecutive requests should use search action type, if its not specifically done using updateSearch method
		Ext.apply(this.lastOptions, {
			actionType : Zarafa.core.Actions['search']
		});
	},

	/**
	 * Function will be used to issue a stopsearch request to server,
	 * this will internally call {@link #load} method but with some different options.
	 * @param {Object} options options object that must contain entryid of search folder.
	 */
	stopSearch : function(options)
	{
		// remove search restriction
		this.setSearchRestriction({});

		// We are not searching
		if (!this.hasSearchResults ) {
			return;
		}

		if(!Ext.isObject(options)) {
			options = {};
		}

		if (!Ext.isObject(options.params)) {
			options.params = {};
		}


		// cancel all pending updatesearch requests
		if (this.isExecuting(Zarafa.core.Actions['updatesearch']) || this.isExecuting(Zarafa.core.Actions['search'])) {
			this.proxy.cancelRequests(Zarafa.core.Actions['updatesearch']);
			this.proxy.cancelRequests(Zarafa.core.Actions['search']);
		}

		// stop firing updatesearch requests if it is queued
		if(this.searchUpdateTimer) {
			clearTimeout(this.searchUpdateTimer);
			delete this.searchUpdateTimer;
		}

		Ext.apply(options, {
			actionType : Zarafa.core.Actions['stopsearch']
		});

		Ext.apply(options.params, {
			store_entryid : this.storeEntryId,
			search_folder_entryid : this.searchFolderEntryId
		});

		// Send a destroy request -- we are destroying the search folder on the server
		this.proxy.request(Ext.data.Api.actions['destroy'], null, options.params, this.reader, Ext.emptyFn, this, options);

		// Clear the search data
		this.setSearchEntryId(undefined);
		this.hasSearchResults  = false;

		this.fireEvent('stopsearch', this, options);

		// reset the action type in the last options, because stopsearch is not persistent action type
		// and consecutive requests should use list action type, if its not specifically done using search method
		Ext.apply(this.lastOptions, {
			actionType : Zarafa.core.Actions['list']
		});
	},

	/**
	 * Function is used as a callback for 'read' action, we have overriden it to
	 * support search also using same 'read' action instead of creating new action.
	 * this will check that if action type is list then will do normal processing and
	 * add {@link Zarafa.core.data.IPMRecords[] records} to {@link Zarafa.core.data.ListModuleStore store}
	 * and if action type is search then it will call {@link #updateSearchInfo} as a callback function.
	 * @param {Object} data data that is returned by the proxy after processing it. will contain
	 * {@link Zarafa.core.data.IPMRecords records}.
	 * @param {Object} options options that are paased through {@link #load} event.
	 * @param {Boolean} success success status of request.
	 * @param {Object} metaData extra information that is received with response data.
	 */
	loadRecords : function(data, options, success, metaData)
	{
		if(success !== false) {
			var restriction;
			if (Ext.isDefined(options.params) && Ext.isDefined(options.params.restriction)) {
				restriction = options.params.restriction;
			}

			var pageSize = container.getSettingsModel().get('zarafa/v1/main/page_size');
			// update total loaded record
			if (restriction) {
				this.totalLoadedRecord = restriction.start ? restriction.start + restriction.limit : pageSize;

				// If store data is synchronized then update start and delete limit
				if (this.syncStore) {

					// Pagination and Infinite Scroll handle page information based on start and limit
					restriction.start = this.totalLoadedRecord - pageSize;
					delete restriction.limit;
					delete this.lastOptions.add;
					this.syncStore= false;
				}
			}
			if(metaData) {
				if(metaData.search_meta) {
					this.updateSearchInfo(metaData.search_meta, metaData.page);
				}

				// if paging information is provided then update total count
				if(metaData.page) {
					this.totalLength = metaData.page.totalrowcount;
				}

				// if folder information is provided, then update the folder
				if (metaData.folder && options.folder && options.folder.length === 1) {
					var folder = options.folder[0];

					if (Ext.isDefined(metaData.folder.content_unread)) {
						folder.set('content_unread', metaData.folder.content_unread);
					}
					if (Ext.isDefined(metaData.folder.content_count)) {
						folder.set('content_count', metaData.folder.content_count);
					}
				}
			}
		}

		Zarafa.core.data.ListModuleStore.superclass.loadRecords.apply(this, arguments);
	},

	/**
	 * Function will be called when search response is received by {@link Zarafa.core.data.IPMProxy proxy},
	 * This will check if search is running or not on server based on search status and call {@link #updateSearch}
	 * after timeout of 500ms.
	 * If search is active then search status will be SEARCH_RUNNING (0x1) and if search is locating its messages
	 * then it will return SEARCH_RUNNING | SEARCH_REBUILD (0x3), and if subfolder option is selected then
	 * these two values can be combined with SEARCH_RECURSIVE (0x4), if user has stopped search then search status
	 * will be empty.
	 * @param {Object} searchResponse Object will contain search folder's entryid and its status of search.
	 * @param {Object} page Object will contain information for pagination.
	 */
	updateSearchInfo : function(searchResponse, page)
	{

		// do some data conversion on received data
		var searchData = {
			entryId : searchResponse.searchfolder_entryid,
			searchState : parseInt(searchResponse.searchstate, 10),
			results : parseInt(searchResponse.results, 10)
		};

		// paging info is not always returned
		if(!Ext.isEmpty(page)) {
			Ext.apply(searchData, {
				page : {
					start : parseInt(page.start, 10),
					rowCount : parseInt(page.rowcount, 10),
					totalRowCount : parseInt(page.totalrowcount, 10)
				}
			});
		}

		this.fireEvent('beforeupdatesearch', this, searchData);

		this.setSearchEntryId(searchData.entryId);

		if(Zarafa.core.mapi.Search.isSearchRunning(searchData.searchState)) {
			this.searchUpdateTimer = this.updateSearch.defer(
				container.getSettingsModel().get('zarafa/v1/main/search/updatesearch_timeout'),
				this
			);
		} else {
			delete this.searchUpdateTimer;
		}
	},

	/**
	 * If {@link #loadMask} is not undefined, this function will display the {@link #loadMask}.
	 * @protected
	 */
	showLoadMask : function ()
	{
		if (!this.loadMask) {
			var contentPanel = container.getContentPanel();
			if (Ext.isFunction(contentPanel.getGridPanel)) {
				var grid = contentPanel.getGridPanel();
				this.loadMask = grid.loadMask;
				this.loadMask.show();
			}
		}
	}

});

Ext.reg('zarafa.listmodulestore', Zarafa.core.data.ListModuleStore);
