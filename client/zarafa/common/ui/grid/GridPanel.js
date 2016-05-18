Ext.namespace('Zarafa.common.ui.grid');

/**
 * @class Zarafa.common.ui.grid.GridPanel
 * @extends Ext.grid.GridPanel
 * @xtype zarafa.gridpanel
 *
 * WebApp specific GridPanel which contain extra features and bugfixes
 * which could not be resolved by plugins or directly in extjs.
 */
Zarafa.common.ui.grid.GridPanel = Ext.extend(Ext.grid.GridPanel, {
	/**
	 * @cfg {String} ddText
	 * @hide
	 */

	/**
	 * The entryid of the {@link Zarafa.core.data.MAPIFolder folder} which is currently being displayed
	 * inside this panel. This is used by {@link #getStateName} to obtain the correct {@link #getState state}.
	 *
	 * @property
	 * @type String
	 */
	currentEntryId : undefined,

	/**
	 * The store entryid of the {@link Zarafa.core.data.MAPIFolder folder} which is currently being displayed
	 * inside this panel. This is used by {@link #getStateName} to obtain the correct {@link #getState state}.
	 *
	 * @property
	 * @type String
	 */
	currentStoreEntryId : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		if(Ext.isEmpty(config.view)) {
			config.viewConfig = Ext.applyIf(config.viewConfig || {}, {
				autoFill : true
			});

			Ext.applyIf(config, {
				view : new Zarafa.common.ui.grid.GridView(config.viewConfig)
			});
		}

		Zarafa.common.ui.grid.GridPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Called when the GridPanel has been rendered.
	 * This activate the keymap on the element of this component after the normal operations of
	 * afterRender have been completed. It will activate by getting the xtype hierarchy from
	 * {@link #getXTypes} and format it into a string usable by the
	 * {@link Zarafa.core.KeyMapMgr KeyMapMgr}.
	 * @private
	 */
	afterRender: function()
	{
		Zarafa.common.ui.grid.GridPanel.superclass.afterRender.apply(this, arguments);
		var xtypes = this.getXTypes();

		// The first part leading up to zarafa.gridpanel will be stripped
		xtypes = xtypes.replace('component/box/container/panel/grid/zarafa.gridpanel','');

		// Then the "zarafa." will be stripped off from all the xtypes like "zarafa.somegrid".
		xtypes = xtypes.replace(/\/zarafa\./g,'.');

		// Finally we strip the string "grid" from all the xtypes. Otherwise each level will have
		// that "grid" mentioned in them. Also we add "grid" to the start as that sets
		// it apart from other components in the key mapping.
		xtypes = 'grid' + xtypes.replace(/grid/g, '');
		Zarafa.core.KeyMapMgr.activate(this, xtypes);
	},

	/**
	 * Initialize event handlers
	 * @private
	 */
	initEvents : function()
	{
		// First bind columnModel and then the store. The bindStore() function
		// will add some initialization which requires the model to be initialized.
		this.bindColumnModel(this.getColumnModel(), true);
		this.bindStore(this.getStore(), true);

		Zarafa.common.ui.grid.GridPanel.superclass.initEvents.call(this);

		// use our custom load mask
		if(this.loadMask) {
			// destroy loadmask created by superclass
			this.loadMask.destroy();
			this.loadMask = new Zarafa.common.ui.LoadMask(this.bwrap,
					Ext.apply( { store : this.store }, this.initialConfig.loadMask ) );
		}

		this.store.on('write', this.onWriteRecord, this);

		this.on('viewready', this.onViewReady, this);
	},

	/**
	 * Handler for 'write' event. If the action carried out with the write call was 'destroy' than we have to check
	 * a situation where the total loaded record is less than total page size and grid-scroll is not there.
	 * If the above mentioned situation is there than additional records needs to be fetched from server and
	 * synchronize {@link Zarafa.core.data.ListModuleStore store} with as many numbers of new {@link Zarafa.core.data.IPMRecords[] records} as deleted
	 * @param {Ext.data.Store} store The new {@link Ext.data.Store} object
	 * @param {String} action The name if action that was carried out for this write call.
	 * @param {Object} Result The data arrives from server side.
	 * @param {Object} response as it was received from server.
	 * @param {Array} recordSet Records that are deleted.
	 */
	onWriteRecord : function(store, action, result, response, recordSet)
	{
		if(action === 'destroy') {
			if (!store.syncStore) {
				var gridScroller = this.getView().scroller;
				if(Ext.isDefined(gridScroller) && !gridScroller.isScrollable()) {
					if (store.totalLoadedRecord < store.totalLength) {
						var options = {
							add : true,
							actionType : Zarafa.core.Actions['list']
						};

						// load store with as many new records as deleted before scrollbar has disappeared
						// For that sets start and limit base on remaining number of records.
						// For example if we have 11 remaining records left then start = 11 and limit = page_size - 11
						Ext.applyIf(options, store.lastOptions);
						var limit = container.getSettingsModel().get('zarafa/v1/main/page_size');
						options.params.restriction.limit = limit - store.getCount();
						options.params.restriction.start = store.getCount();
						store.syncStore = true;
						if (store.loadMask) {
							store.loadMask.hide();
							store.loadMask = undefined;
						}
						store.load(options);
					}
				}
			}
		}
	},

	/**
	 * Reconfigures the grid to use a different Store and Column Model and fires the 'reconfigure' event.
	 * The View will be bound to the new objects and refreshed.
	 * Be aware that upon reconfiguring a GridPanel, certain existing settings may become invalidated.
	 * For example the configured {@link #autoExpandColumn} may no longer exist in the new ColumnModel.
	 * Also, an existing {@link Ext.PagingToolbar PagingToolbar} will still be bound to the old Store,
	 * and will need rebinding. Any {@link #plugins} might also need reconfiguring with the new data
	 *
	 * @param {Ext.data.Store} store The new {@link Ext.data.Store} object
	 * @param {Ext.grid.ColumnModel} model The new {@link Ext.grid.ColumnModel} object
	 */
	reconfigure : function(store, colModel)
	{
		// First bind columnModel and then the store. The bindStore() function
		// will add some initialization which requires the model to be initialized.
		this.bindColumnModel(colModel);
		this.bindStore(store);

		Zarafa.common.ui.grid.GridPanel.superclass.reconfigure.call(this, store, colModel);
	},

	/**
	 * Bind a new column model to this gridpanel. This will hook to all
	 * important events with configuration changes which must be stored into the {@link #getState state}.
	 *
	 * @param {Ext.grid.ColumnModel} model The model which must be bound to the panel
	 * @param {Boolean} initialize True if this is called from the constructor to initialize
	 * the panel for the first time.
	 * @private
	 */
	bindColumnModel : function(model, initialize)
	{
		var oldModel = this.getColumnModel();

		if (initialize === true || oldModel !== model) {
			if (oldModel) {
				this.mun(oldModel, 'beforeconfigchange', this.onBeforeConfigChange, this);
				this.mun(oldModel, 'configchange', this.onConfigChange, this);
			}

			if (model) {
				this.mon(model, 'beforeconfigchange', this.onBeforeConfigChange, this);
				this.mon(model, 'configchange', this.onConfigChange, this);
			}
		}
	},

	/**
	 * Bind a new store to this gridpanel. This will hook to all
	 * important events with configuration changes which must be stored into the {@link #getState state}..
	 *
	 * @param {Ext.data.Store} store The store which must be bound to the panel
	 * @param {Boolean} initialize True if this is called from the constructor to initialize
	 * the panel for the first time.
	 * @private
	 */
	bindStore : function(store, initialize)
	{
		var oldStore = this.getStore();

		if (initialize === true || oldStore !== store) {
			if (oldStore) {
				this.mun(oldStore, 'beforeload', this.onStoreBeforeLoad, this);
				this.mun(oldStore, 'load', this.onStoreLoad, this);
			}

			if (store) {
				this.mon(store, 'beforeload', this.onStoreBeforeLoad, this);
				this.mon(store, 'load', this.onStoreLoad, this);
				// In case the store was already loaded, just call the
				// event handler directly.
				if (store.lastOptions) {
					this.onStoreBeforeLoad(store, store.lastOptions);
				}
			}
		}
	},

	/**
	 * Event handler for the {@link #viewready} event. The {@link Ext.grid.GridPanel Extjs GridPanel},
	 * or more accurately the {@link Zarafa.common.ui.LoadMask} do not handle the case nicely when the store
	 * is already busy loading when the grid is being rendered. Because we do like such an optimization,
	 * we have to check at this time if the store is loading, and display the loadmask.
	 * @private
	 */
	onViewReady : function()
	{
		var show = this.store && (this.store.isExecuting(Zarafa.core.Actions['list']) === true
			|| this.store.isExecuting(Zarafa.core.Actions['search']) === true);

		if (this.loadMask && show) {
			this.loadMask.show();
		}
	},

	/**
	 * Called right before the {@link #store} sends a {@link Ext.data.Store#load} request to the server,
	 * this will check which entryId is loaded from the server and will {@link #applyState apply the state}
	 * for the new folder onto the panel. The 'options' argument will be updated according to the sorting
	 * requirements from the {@link Ext.state.Manager#get state}.
	 * @param {Ext.data.Store} store The store which fired the event
	 * @param {Object} options The options used for loading the new data from the store
	 * @private
	 */
	onStoreBeforeLoad : function(store, options)
	{
		/*
		 * if action type is updatelist and grid has no dummy row with warped 
		 * loading mask, then show the loading mask on the grid row rather to 
		 * show load mask on whole grid.
		 */
		if(options && (options.actionType === Zarafa.core.Actions['updatelist'])) {
			if(!this.isLoading) {
				this.getView().showGridRowLoadMask(this.loadMask.msg);
				this.isLoading = true;
			}
			return;
		}
		// No need to reset the column model when we are searching
		// We must use the column model the user set for the folder
		// in which he is searching
		if ( !Ext.isEmpty(store) && store.hasSearchResults ===true ){
			return;
		}
		
		var model = this.getColumnModel();
		var folder = options.folder;
		var entryId;
		var storeEntryId;

		if (!Ext.isEmpty(folder)) {
			if (Ext.isArray(folder)) {
				entryId = folder[0].get('entryid');
				storeEntryId = folder[0].get('store_entryid');
			} else {
				entryId = folder.get('entryid');
				storeEntryId = folder.get('store_entryid');
			}
		}

		if (this.currentEntryId === entryId) {
			return;
		}

		this.currentEntryId = entryId;
		this.currentStoreEntryId = storeEntryId;

		model.setConfig(model.columns, false);
	},

	/**
	 * Called when {@link Ext.grid.GridPanel#store store} on the {@link #field} is
	 * loading new data. At this point we must check which folder entryid is being loaded.
	 *
	 * @param {Zarafa.core.data.MAPIStore} store The store which being loaded.
	 * @param {Ext.data.Record[]} records The records which have been loaded from the store
	 * @param {Object} options The loading options that were specified (see {@link Ext.data.Store#load load} for details)
	 * @private
	 */
	onStoreLoad : function(store, records, options)
	{
		/*
		 * if action type is updatelist and grid has dummy row which was warped
		 * with loading mask, then remove that dummy row from grid. also don't 
		 * show the loading mask on whole grid.
		 */
		if(options && (options.actionType === Zarafa.core.Actions['updatelist'])) {
			if(this.isLoading){
				this.getView().removeGridRowLoadMask();
				this.isLoading = false;
			}
			return;
		}
	},

	/**
	 * Event handler for the {@link #beforeconfigchange} event which is fired at the start of
	 * {@link Zarafa.common.ui.grid.ColumnModel#setConfig}.
	 *
	 * @param {Ext.gridColumnModel} columnModel The model which is being configured
	 * @param {Object} config The configuration object
	 * @private
	 */
	onBeforeConfigChange : Ext.emptyFn,

	/**
	 * Called when {@link Ext.grid.ColumnModel#setConfig} has completed the configuration changes.
	 *
	 * @param {Ext.gridColumnModel} columnModel The model which is being configured
	 * @private
	 */
	onConfigChange : Ext.emptyFn,

	/**
	 * Called to get grid's drag proxy text. Opposite to the superclass,
	 * this will not return {@link Ext.grid.GridPanel#ddText},
	 * but will use 'ngettext' to return a properly formatted plural sentence.
	 * @return {String} The text
	 */
	getDragDropText : function()
	{
		var count = this.selModel.getCount();
		return String.format(ngettext('{0} selected row', '{0} selected rows', count), count);
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
		var options = this.store.lastOptions;
		var folder;

		if (options && options.folder) {
			folder = options.folder;

			if (Ext.isArray(folder)) {
				folder = folder[0];
			}
		}

		return container.getHierarchyStore().getStateName(folder, 'list');
	},

	/**
	 * When {@link #stateful} the State object which should be saved into the
	 * {@link Ext.state.Manager}.
	 * @return {Object} The state object
	 * @protected
	 */
	getState : function()
	{
		var state = Zarafa.common.ui.grid.GridPanel.superclass.getState.call(this);

		// Sorting is handled by the ContextModel rather the by the grid,
		// hence we remove the sorting information from this location.
		var wrap = { sort : state.sort };
		delete state.sort;
		wrap[this.getColumnModel().name] = state;

		return wrap;
	},

	/**
	 * Apply the given state to this object activating the properties which were previously
	 * saved in {@link Ext.state.Manager}.
	 * @param {Object} state The state object
	 * @protected
	 */
	applyState : function(state)
	{
		if (state) {
			// Sorting is handled by the ContextModel rather then by the grid,
			// if the unwrap object contains 'sort' then this function would trigger
			// a reload of the store which is not what we need.
			var unwrap = { sort : state.sort };
			delete state.sort;
			Ext.apply(unwrap, state[this.getColumnModel().name]);

			Zarafa.common.ui.grid.GridPanel.superclass.applyState.call(this, unwrap);
		}
	}
});

Ext.reg('zarafa.gridpanel', Zarafa.common.ui.grid.GridPanel);
