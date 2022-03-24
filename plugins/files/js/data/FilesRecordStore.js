Ext.namespace('Zarafa.plugins.files.data');

/**
 * @class Zarafa.plugins.files.data.FilesRecordStore
 * @extends Zarafa.core.data.ListModuleStore
 *
 * The FilesStore class provides a way to connect the 'filesbrowsermodule' in the server back-end to an
 * Ext.grid.GridPanel object. It provides a means to retrieve files listings asynchronously.
 * The store has to be initialised with a store Id, which corresponds (somewhat confusingly) to
 * a MAPI store id. The FilesStore object, once instantiated, will be able to retrieve and list
 * files from a single specific store only.
 *
 * @constructor
 */
Zarafa.plugins.files.data.FilesRecordStore = Ext.extend(Zarafa.core.data.ListModuleStore, {

	/**
	 * @cfg folderId The folderId of selected folder.
	 */
	folderId: undefined,

	/**
	 * @constructor
	 */
	constructor: function (config) {

		Ext.applyIf(config || {}, {
			remoteGroup: true,
			preferredMessageClass: 'IPM.Files',
			defaultSortInfo: {
				field: 'filename',
				direction: 'asc'
			},
			entryId:'#R#',
			// FIXME: try to remove folderId and id props from FilesFolderRecord.js
			folderId: "#R#",
			listeners: {
				load: this.onLoad,
				exception: this.onLoadException
			},
			proxy: new Zarafa.plugins.files.data.FilesProxy({
				listModuleName: 'filesbrowsermodule',
				itemModuleName: 'filesbrowsermodule'
			})
		});

		this.addEvents(
			/**
			 * @event createfolder
			 * Fires when a folder has been created.
			 * @param {Zarafa.plugins.files.data.FilesRecordStore} store store in which folder record was created.
			 * @param {String} parentFolderId The parentFolderId under which folder was created.
			 * @param {Object} data The data contains the information about newly created folder.
			 */
			'createfolder'
		);

		Zarafa.plugins.files.data.FilesRecordStore.superclass.constructor.call(this, config);
	},

	/**
	 * Initialize events which {@link Zarafa.plugins.files.data.FilesHierarchyStore FilesHierarchyStore} will listen to.
	 * @protected
	 */
	initEvents: function () {
		Zarafa.plugins.files.data.FilesRecordStore.superclass.initEvents.apply(this, arguments);

		if (Ext.isDefined(this.hierarchyStore)) {
			this.hierarchyStore.on('addFolder', this.onHierarchyAddFolder, this);
		}
	},

	/**
	 * Event handler triggers when folder was added in hierarchy. function was
	 * responsible to save the search criteria in settings.
	 *
	 * @param {Zarafa.plugins.files.data.FilesHierarchyStore} store The store which fired the event
	 * @param {Zarafa.plugins.files.data.FilesStoreRecord} mapiStore mapi store in which new folders are added.
	 * @param {Zarafa.plugins.files.data.FilesFolderRecord/Zarafa.plugins.files.data.FilesFolderRecord[]} record folder record(s) which are added in hierarchy.
	 * @private
	 */
	onHierarchyAddFolder: function(store, mapiStore, records)
	{
		var reloadStore = false;

		Ext.each(records, function(item, index, obj) {
			if (item.get('parent_entryid') === this.entryId) {
				reloadStore = true;
				return false;
			}
		}, this);

		if(reloadStore) {
			this.reload();
		}
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
	 * <li><b><tt>params</tt></b>: Object<div class="sub-desc"><p>An object containing properties to pass as HTTP
	 * parameters to a remote data source. <b>Note</b>: <code>params</code> will override any
	 * <code>{@link #baseParams}</code> of the same name.</p>
	 * <p>Parameters are encoded as standard HTTP parameters using {@link Ext#urlEncode}.</p></div></li>
	 * <li><b>callback</b>: Function<div class="sub-desc"><p>A function to be called after the Records
	 * have been loaded. The callback is called after the load event is fired, and is passed the following arguments:<ul>
	 * <li>r: Ext.data.Record[] An Array of Records loaded.</li>
	 * <li>options: Options object from the load call.</li>
	 * <li>success: Boolean success indicator.</li></ul></p></div></li>
	 * <li><b>scope</b>: Object<div class="sub-desc"><p>Scope with which to call the callback (defaults
	 * to the Store object)</p></div></li>
	 * <li><b>add</b>: Boolean<div class="sub-desc"><p>Indicator to append loaded records rather than
	 * replace the current cache.  <b>Note</b>: see note for <tt>{@link #loadData}</tt></p></div></li>
	 * </ul>
	 * @return {Boolean} If the <i>developer</i> provided <tt>{@link #beforeload}</tt> event handler returns
	 * <tt>false</tt>, the load call will abort and will return <tt>false</tt>; otherwise will return <tt>true</tt>.
	 */
	load: function(options)
	{
		if (!Ext.isObject(options)) {
			options = {};
		}

		if (!Ext.isObject(options.params)) {
			options.params = {};
		}

		if(!Ext.isEmpty(options.folder)) {
			// If a folder was provided in the options, we apply the folder
			this.setFolder(options.folder);
		} else if(Ext.isDefined(options.params.entryid) && Ext.isDefined(options.params.store_entryid)){
			// If the entryid was provided in the parameters we apply the params
			this.setEntryId(options.params.entryid, false);
			this.setStoreEntryId(options.params.store_entryid, false);

			if(Ext.isDefined(options.params.folderid)) {
				this.setFolderId(options.params.folderid, false);
			}
		}

		// Override the given entryid and store entryid.
		Ext.apply(options.params, {
			entryid: this.entryId,
			id: this.folderId,
			store_entryid: this.storeEntryId
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
			actionType: this.actionType
		});

		return Zarafa.plugins.files.data.FilesRecordStore.superclass.load.call(this, options);
	},


	/**
	 * Function will set folder entryid and store entryid.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord[]} mapiFolder mapi folder that should be used to load data.
	 */
	setFolder: function(mapiFolder)
	{
		Ext.each(mapiFolder, function(folder, index) {
			this.setEntryId(folder.get('entryid'), index !== 0);
			this.setStoreEntryId(folder.get('store_entryid'), index !== 0);
			this.setFolderId(folder.get('folder_id'), index !== 0);
		}, this);
	},

	setFolderId: function(folderId, add)
	{
		if(!Ext.isEmpty(add) && add) {
			// multiple entryids
			if(Ext.isEmpty(this.folderId)) {
				this.folderId = [];
			}

			if(!Ext.isEmpty(this.folderId) && !Array.isArray(this.folderId)) {
				this.folderId = [ this.folderId ];
			}

			this.folderId.push(folderId);
		} else {
			// single entryid
			this.folderId = folderId;
		}
	},

	/**
	 * Eventhandler that handles the beforeload event of the store.
	 * It will switch the viewmode if necessary.
	 *
	 * @param {Zarafa.plugins.files.data.FilesRecordStore} store
	 * @param {Zarafa.plugins.files.data.FilesRecord} records
	 * @param {Object} options
	 */
	onLoad: function (store, records, options)
	{
		// TODO: Move to files main panel.
		var path = options.params.id;
		var componentBox = Zarafa.plugins.files.data.ComponentBox;
		var viewPanel = componentBox.getViewPanel();
		var disabledSwitchViewButton = false;

		if (Ext.isEmpty(path) || path === "#R#" ) {
			// switch to the account overview!
			viewPanel.switchView('files-accountview');
			componentBox.getPreviewPanel().topToolbar.disable();
			disabledSwitchViewButton = true;
		} else if (componentBox.getItemsView() instanceof Zarafa.plugins.files.ui.FilesRecordAccountView) {
			switch (componentBox.getContext().getCurrentView()) {
				case Zarafa.plugins.files.data.Views.LIST:
					viewPanel.switchView('files-gridview');
					break;
				case Zarafa.plugins.files.data.Views.ICON:
					viewPanel.switchView('files-iconview');
					break;
			}
		}
		container.getMainPanel().filesSwitchViewButton.setDisabled(disabledSwitchViewButton);
	},

	/**
	 * Eventhandler that handles the exception event of the store.
	 *
	 * @param proxy
	 * @param type
	 * @param action
	 * @param options
	 * @param response
	 * @param arg
	 */
	onLoadException: function (proxy, type, action, options, response, arg) {
		// handle unauthorized messages of plugins that need fronten authorization (dropbox, google,...)
		if(response.error && response.error.info.code) {
			if(parseInt(response.error.info.code) == 401) {
				// recall the auth procedure

				// first we need to get the account
				var failedID = options.params.id;
				var accID = Zarafa.plugins.files.data.Utils.File.getAccountId(failedID);
				var accStore = container.getCurrentContext().getAccountsStore();
				// look up the account
				var account = accStore.getById(accID);
				if (Ext.isDefined(account) && account.supportsFeature(Zarafa.plugins.files.data.AccountRecordFeature.OAUTH)) {
					account.renewOauthToken();
				}
			}
		}
	},

	/**
	 * Reloads the Record cache from the configured Proxy. See the superclass {@link Zarafa.core.data.ListModuleStore#reload documentation}
	 * for more details.
	 * During reload we add an extra option into the {@link #load} argument which marks the action as a reload
	 * action.
	 *
	 * @param {Object} options
	 */
	reload: function (options) {
		var currentPath = this.getPath();

		// set the reload flag - then the backend will reload the cache!
		options = Ext.applyIf(options || {}, {
			params: {
				reload: true,
				id: currentPath
			},
			reload: true
		});

		Zarafa.plugins.files.data.FilesRecordStore.superclass.reload.call(this, options);
	},

	/**
	 * Returns the current root directory.
	 *
	 * @return {String} The current root directory.
	 */
	getPath: function () {
		return this.entryId;
	}
});
Ext.reg('filesplugin.filesrecordstore', Zarafa.plugins.files.data.FilesRecordStore);
