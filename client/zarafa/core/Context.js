Ext.namespace('Zarafa.core');

/**
 * @class Zarafa.core.Context
 * @extends Zarafa.core.Plugin
 * 
 * A context is special plug-in that provides a set of standard components such
 * as a tool bar and content panel, and implements the bid() method. Contexts are
 * generally used to display a certain type of content such as mail, notes, 
 * appointments, etc.
 * <p>
 * A context implements the bid() method which is called when a folder is selected
 * from the hierarchy. Each registered Context is allowed to bid on the folder and
 * the context that bids the highest is allowed to display that folder.
 * <p>
 * Before a context is selected the enable() method is called, allowing the context
 * to set itself up. Usually this means initialising data stores and hooking them
 * to UI components. The disable() method is called before the context is switched
 * out again.
 * <p>
 * This class was meant to be overridden.
 */
Zarafa.core.Context = Ext.extend(Zarafa.core.Plugin, {
	/**
	 * The currently active view, this is updated through {@link #setView} and when
	 * this field changes, the {@link #viewchange} event will be fired.
	 * When this context is {@link #stateful stateful}, this option will be
	 * saved in the settings.
	 * @property
	 * @type Mixed
	 */
	current_view : undefined,

	/**
	 * The currently active viewmode, this is updated through {@link #setViewMode}
	 * and when this field changes, the {@link #viewmodechange} event will be fired.
	 * When this context is {@link #stateful stateful}, this option will be
	 * saved in the settings.
	 * @property
	 * @type Mixed
	 */
	current_view_mode : undefined,

	/**
	 * @cfg {Boolean} hasContentPanel Indicates if this context offers a content panel, this panel
	 * will be requested by {@link #createContentPanel} when the {@link main.content} insertion
	 * point is used.
	 */
	hasContentPanel : true,

	/**
	 * @cfg {Boolean} groupViewBtns True if the buttons as returned by {@link #getMainToolbarViewButtons}
	 * should be grouped together into a single {@link Ext.Button} using the {@link Ext.Button#menu} option.
	 * If false, the buttons will be placed side by side in the panel.
	 */
	groupViewBtns : true,

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

		this.addEvents([
			/**
			 * @event viewchange
			 * This event is fired when the user changes the active view inside the context,
			 * this change is done in the function {@link #setView}. Since the function
			 * itself not perform the switch itself, the listeners to this event must
			 * assure that the {@link Ext.Component component} they are managing is updated
			 * correctly.
			 * @param {Zarafa.core.Context} context The context which fired the event
			 * @param {Mixed} newView The new View id
			 * @param {Mixed} oldView The old View id
			 */
			'viewchange',
			/**
			 * @event viewmodechange
			 * This event is fired when the user switches the active viewmode inside the context,
			 * this change is done in the function  {@link #setViewMode}. Since the function
			 * itself does not perform the switch itself, the listeners to this event must
			 * assure that the {@link Ext.Component component} they are managing is updated
			 * correctly.
			 * @param {Zarafa.core.Context} context The context which fired the event
			 * @param {Mixed} newMode The new ViewMode
			 * @param {Mixed} oldMode The old ViewMode
			 */
			'viewmodechange'
		]);

		Zarafa.core.Context.superclass.constructor.call(this, config);

		if (this.hasContentPanel === true) {
			this.registerInsertionPoint('main.content', this.createContentPanel, this);
		}
	},

	/**
	 * Override this method to return a new instance Ext.Panel. 
	 * This instance will be placed at the center of the screen when the 
	 * context is active.
	 * <p>
	 * The default implementation of getComponents() calls this method to
	 * lazily construct the toolbar.  
	 * @return {Ext.Panel} a new panel instance 
	 */
	createContentPanel : function()
	{
		return undefined;
	},

	/**
	 * Override this method to define buttons in the dropdown list of the VIEW button in the main toolbar.
	 * 
	 * @return {Ext.Component[]} an array of components
	 */
	getMainToolbarViewButtons : function()
	{
		return [];
	},
	/**
	 * Override this method to define buttons in the dropdown list of the Print button in the main toolbar.
	 * 
	 * @return {Ext.Component[]} an array of components
	 */
	getMainToolbarPrintButtons : function()
	{
		return [];
	},

	/**
	 * Switches the {@link #current_view} and {@link #current_view_mode} at the same time.
	 * This delays the {@link #viewchange} and {@link #viewmodechange} events until both
	 * properties have been changed.
	 *
	 * @param {Mixed} viewId The view identification
	 * @param {Mixed} mode view mode (context should define modes and its numeric values).
	 * @param {Boolean} init (optional) True when this function is called during initialization
	 * and it should force the change of the view.          
	 */
	switchView : function(viewId, mode, init)
	{
		this.suspendEvents(true);
		this.setView(viewId, init);
		this.setViewMode(mode, init);
		this.resumeEvents();
	},

	/**
	 * Set the currently active view inside the {@link Zarafa.core.Context context}.
	 * This will fire the {@link #viewchange} event.
	 *
	 * When this is called together with {@link #setViewMode}, {@link #switchView} should
	 * be used instead.
	 *
	 * @param {Mixed} viewId The view identification
	 * @param {Boolean} init (optional) True when this function is called during initialization
	 * and it should force the change of the view.
	 */
	setView : function(viewId, init)
	{
		if (init === true || this.current_view !== viewId) {
			var oldView = this.current_view;
			this.current_view = viewId;

			this.onViewChange(this, this.current_view, oldView);

			// Fire the viewchange event
			this.fireEvent('viewchange', this, this.current_view, oldView);
		}
	},

	/**
	 * Event handler which is executed right before the {@link #viewchange}
	 * event is fired. This allows subclasses to initialize the view.
	 *
	 * @param {Zarafa.core.Context} context The context which fired the event.
	 * @param {Mixed} newView The selected View.
	 * @param {Mixed} oldView The previously selected View.
	 * @private
	 */
	onViewChange : Ext.emptyFn,

	/**
	 * Returns the currently active {@link #current_view view} as configured
	 * through {@link #setView}.
	 * @return {Mixed} The view id of the currently active view.
	 */
	getCurrentView : function()
	{
		return this.current_view;
	},

	/**
	 * Sets the current view mode from the available view modes.
	 * 
	 * When this is called together with {@link #setView}, {@link #switchView} should
	 * be used instead.
	 *
	 * Fires the {@link #viewmodechange} event.
	 * @param {Number} mode view mode (context should define modes and its numeric values).
	 * @param {Boolean} init (optional) True when this function is called during initialization
	 * and it should force the change of the view mode.          
	 */
	setViewMode : function(mode, init)
	{
		if (init === true || this.current_view_mode !== mode) {
			var oldMode = this.current_view_mode;
			this.current_view_mode = mode;

			this.onViewModeChange(this, this.current_view_mode, oldMode);

			// Fire the viewmodechange event
			this.fireEvent('viewmodechange', this, this.current_view_mode, oldMode);
		}
	},

	/**
	 * Event handler which is executed right before the {@link #viewmodechange}
	 * event is fired. This allows subclasses to initialize the view mode.
	 *
	 * @param {Zarafa.core.Context} context The context which fired the event.
	 * @param {Mixed} newViewMode The selected View Mode.
	 * @param {Mixed} oldViewMode The previously selected View Mode.
	 * @private
	 */
	onViewModeChange : Ext.emptyFn,

	/**
	 * Returns the currently active {@link #current_view_mode viewmode} as configured
	 * through {@link #setViewMode}.
	 * @return {Mixed} The viewmode id of the currently active viewmode.
	 */
	getCurrentViewMode : function()
	{
		return this.current_view_mode;
	},

	/**
	 * Obtain the {@link Zarafa.core.ContextModel mode} which is associated
	 * to this context.
	 * @return {Zarafa.core.ContextModel} The model associated to this context
	 */
	getModel : Ext.emptyFn,

	/**
	 * Called before the context is switched in.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder MAPI folder to show.
	 * @param {Boolean} suspended True to enable the ContextModel {@link Zarafa.core.ContextModel#suspendLoading suspended}
	 */
	enable : function(folder, suspended)
	{
		if (this.stateful) {
			this.initState();
		}

		// First enable the model, when we apply the new
		// view modes to the context, it might want to
		// access data on the model which must be fully
		// initialized by that time.
		var model = this.getModel();
		if (model) {
			model.enable(folder, suspended);
		}

		// Force the data we loaded from the settings
		// or was applied during configuration time
		// to be forwarded to all interested parties.
		this.switchView(this.getCurrentView(), this.getCurrentViewMode(), true);
	},
	
	/**
	 * Called before the context is switched out.
	 */
	disable : function()
	{
		var model = this.getModel();
		if (model) {
			model.disable();
		}
	},
	
	/**
	 * Produces a bid on a given folder. A negative bid (-1) indicates that this
	 * context cannot display the folder contents. A positive bid (1) indicates that it
	 * can, and a higher bid (>1) can be used to override default context plug-ins.
	 * The context that bids the highest is selected to display a given folder.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder to bid on.  
	 * @return {Number} a bid on the folder. 
	 */
	bid : function(folder)
	{
		return -1;
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
			name = this.getName();
		}

		return 'contexts/' + name;
	},

	/**
	 * Register the {@link #stateEvents state events} to the {@link #saveState} callback function.
	 * @protected
	 */
	initStateEvents : function()
	{
		Zarafa.core.Context.superclass.initStateEvents.call(this);
		this.on('viewchange', this.saveViewModeState, this, {delay: 100});
		this.on('viewmodechange', this.saveViewModeState, this, {delay: 100});
	},

	/**
	 * Event handler for 'viewchange' and 'viewmodechange', only saves
	 * state when the view mode has changed.
	 *
	 * @param {Zarafa.core.Context} context the current context
	 * @param {Number} current_view_mode the current view mode
	 * @param {Number} oldMode the old view mode.
	 */
	saveViewModeState : function(context, current_view_mode, oldMode)
	{
		if (current_view_mode != oldMode) {
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
		var state = Zarafa.core.Context.superclass.getState.call(this) || {};
		var model = this.getModel();
		var searching = model && model.isSearching();
		var scrolling = model && model.isLiveScrolling();

		/*
		 * True when live scroll is performed and and current view mode should not be 
		 * one of the main view mode (NO_PREVIEW, RIGHT_PREVIEW, BOTTOM_PREVIEW).
		 * it gets false when user search something, use live scroll and then close the search
		 */
		var isOnlyScrolling = (scrolling && !searching && !Zarafa.mail.data.ViewModes.isMainViewMode(this.current_view_mode));

		/* 
		 * True when live scroll and searching both are performed also 
		 * old view mode was one of the main view mode(NO_PREVIEW, RIGHT_PREVIEW, BOTTOM_PREVIEW).
		 * it will gets false when user close the search or switch the context, folder and view.
		 */
		var isSearchingAndScrolling = (scrolling && searching && Zarafa.mail.data.ViewModes.isMainViewMode(this.oldViewMode));

		return Ext.apply(state, isOnlyScrolling || isSearchingAndScrolling ?{
			current_view : this.oldView,
			current_view_mode : this.oldViewMode
		} : {
			current_view : this.current_view,
			current_view_mode : this.current_view_mode
		});
	}
});
