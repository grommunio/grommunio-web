/**
 * @class Zarafa.core.Container
 * @extends Object
 *
 * Container class for lazy instantiation of globally used objects such as a Request instance, HierarchyStore instance, etc.
 * The Container is also used to register plugins and populate insertion points.
 * <p>
 * Don't instantiate the a new Container object yourself, just use the global <code>container</code> instance.
 */
Zarafa.core.Container = Ext.extend(Ext.util.Observable, {
	/**
	 * List of registered {@link Zarafa.core.Context context instances}.
	 * @property
	 * @private
	 * @type Array
	 */
	contexts : undefined,

	/**
	 * The Meta Data for all registered {@link #contexts}. This is an array
	 * of {@link Zarafa.core.ContextMetaData ContextMetaData instances}.
	 * @property
	 * @private
	 * @type Array
	 */
	contextsMetaData : undefined,

	/**
	 * List of registered {@link Zarafa.core.Plugin plugin instances}
	 * (also includes {@link #contexts}).
	 * @property
	 * @private
	 * @type Array
	 */
	plugins : undefined,

	/**
	 * The Meta Data for all registered {@link #plugins}. This is an array
	 * of {@link Zarafa.core.PluginMetaData PluginMetaData instances}.
	 * @property
	 * @private
	 * @type Array
	 */
	pluginsMetaData : undefined,

	/**
	 * The Meta Data for all registered {@link Zarafa.core.ui.widget.Widget widgets}. This is an array
	 * of {@link Zarafa.core.ui.widget.WidgetMetaData WidgetMetaData instances}.
	 * @property
	 * @private
	 * @type Array
	 */
	widgetsMetaData : undefined,

	/**
	 * @constructor
	 */
	constructor : function()
	{
		this.addEvents([
			/**
			 * @event contextswitch fired right before the context switch is made
			 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder folder that is loaded for the new context
			 * @param {Zarafa.core.Context} oldContext context being switched out
			 * @param {Zarafa.core.Context} newContext new context being switched in
			 * @return {Boolean} False to prevent the context from being switched
			 */
			'beforecontextswitch',
			/**
			 * @event contextswitch fired after a context switch has been performed
			 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder folder that is loaded for the new context
			 * @param {Zarafa.core.Context} oldContext context that was switched out
			 * @param {Zarafa.core.Context} newContext new context that was switched
			 */
			'contextswitch',
			/**
			 * @event contextswitch fired after a context switch has been performed and after the contextswitch has been fired.
			 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder folder that is loaded for the new context
			 * @param {Zarafa.core.Context} oldContext context that was switched out
			 * @param {Zarafa.core.Context} newContext new context that was switched
			 */
			'aftercontextswitch',
			/**
			 * Fires when the user selects a folder from the hierarchy.
			 * @event folderselect
			 * @param {Zarafa.hierarchy.data.MAPIFolderRecord[]} folder MAPI folder object.
			 */
			'folderselect',
			/**
			 * Fires when the webapp has loaded and the loading mask has been removed.
			 * @event webapploaded
			 */
			'webapploaded',
			/**
			 * Fires when the webapp will reload. Return false from an event handler to cancel the reload.
			 * @event beforewebappreload
			 */
			'beforewebappreload',
			/**
			 * Fires before the user logs out from the webapp. Return false from an event handler to stop the show.
			 * @event beforelogout
			 */
			'beforelogout',
			/**
			 * Fires when the user logs out from the webapp.
			 * @event logout
			 */
			'logout'
		]);

		Zarafa.core.Container.superclass.constructor.call(this);

		// initialize properties
		this.plugins = [];
		this.pluginsMetaData = [];
		this.contexts = [];
		this.contextsMetaData = [];
		this.widgetsMetaData = [];
	},

	/**
	 * Logout from the Webapp. this will fire the {@link #beforelogout} and
	 * {@link #logout} events before calling {@link #doLogout}.
	 * @param {Boolean} preserveUser True to preserve the username when he
	 * is forwarded to the logon page
	 * @param {Boolean} preserveSession True to preserve the existing session
	 * on the server and only redirect the user to the logon page.
	 */
	logout : function(preserveUser, preserveSession)
	{
		if (this.fireEvent('beforelogout') !== false) {
			this.fireEvent('logout');
			this.doLogout(preserveUser, preserveSession);
		}
	},

	/**
	 * Logout from the Webapp (this function is called by {@link #logout}.
	 * Override this to change the logout method.
	 * @param {Boolean} preserveUser True to preserve the username when he
	 * is forwarded to the logon page
	 * @param {Boolean} preserveSession True to preserve the existing session
	 * on the server and only redirect the user to the logon page.
	 * @protected
	 */
	doLogout : function(preserveUser, preserveSession)
	{
		var user = ((preserveUser === true) ? ('&user=' + this.getUser().getUserName())  : '');

		Zarafa.core.Util.disableLeaveRequester();
		// OIDC is enabled, signout via oidc-client.
		if (container.getServerConfig().getOIDCEnabled()) {
			userManager.signOut();
		} else {
			if (preserveSession !== true) {
				window.location = 'index.php?logout' + user;
			} else {
				window.location = 'index.php?load=logon' + user;
			}
		}
	},

	/**
	 * Obtain the server configuration data
	 * @return {Zarafa.core.data.ServerConfig} The server configuration data
	 */
	getServerConfig : function()
	{
		return this.serverConfigRecord;
	},

	/**
	 * Set the server configuration data
	 * @param {Object} serverData The server configuration data.
	 */
	setServerConfig : function(serverData)
	{
		this.serverConfigRecord = new Zarafa.core.data.ServerConfig(serverData);
	},

	/**
	 * Obtain the user data for the currently logged in user.
	 * @return {Zarafa.core.data.User} The user data of the currently logged in user.
	 */
	getUser : function()
	{
		return this.userRecord;
	},

	/**
	 * Set the user data for the currently logged in user.
	 * @param {Object} userData The user data of the currently logged in user.
	 */
	setUser : function(userData)
	{
		this.userRecord = new Zarafa.core.data.User(userData);
	},

	/**
	 * Obtain the versioning data for the WebApp environment
	 * @return {Zarafa.core.data.Version} The version data of the WebApp environment
	 */
	getVersion : function()
	{
		return this.versionRecord;
	},

	/**
	 * Set the version data for the WebApp environment
	 * @param {Object} versionData The version data of the WebApp environment
	 */
	setVersion : function(versionData)
	{
		this.versionRecord = new Zarafa.core.data.Version(versionData);
	},

	/**
	 * Obtain the array of all available languages. Each item in the array
	 * contains 2 keys. The first key is 'lang' which is the language code
	 * (e.g. en_GB), and the second key is 'name' which is the display name.
	 * @return {Array} The array of available languages
	 */
	getLanguages : function()
	{
		return this.languages;
	},

	/**
	 * Set the languages which are available to the user
	 * @param {Array} languages The available languages
	 */
	setLanguages : function(languages)
	{
		this.languages = languages;
	},

	/**
	 * Returns the currently active {@link Zarafa.core.Context context}.
	 * @return {Zarafa.core.Context} the currently active context.
	 */
	getCurrentContext : function()
	{
		return this.currentContext || this.getContextByName('default');
	},

	/**
	 * Returns the global {@link Zarafa.core.Request request} instance.
	 * All server requests should be lodged through this instance.
	 *
	 * @return {Zarafa.core.Request} the global {@link Zarafa.core.Request Request} instance.
	 */
	getRequest : function()
	{
		return this.request || (this.request = new Zarafa.core.Request({ url:"kopano.php" }));
	},

	/**
	 * Returns the global {@link Zarafa.core.ResponseRouter ResponseRouter} instance.
	 * All server responses are lodged through this instance.
	 *
	 * @return {Zarafa.core.ResponseRouter} the global {@link Zarafa.core.ResponseRouter ResponseRouter} instance.
	 */
	getResponseRouter : function()
	{
		return this.responseRouter || (this.responseRouter = new Zarafa.core.ResponseRouter());
	},

	/**
	 * Returns the global {@link Zarafa.core.data.NotificationResolver NotificationResolver} instance.
	 * All notifications are being resolved through this instance, the constructed
	 * {@link Zarafa.core.data.AbstractResponseHandler ResponseHandler} is then returned to the
	 * {@link Zarafa.core.ResponseRouter ResponseRouter} for further processing.
	 *
	 * @return {Zarafa.core.data.NotificationResolver} the global {@link Zarafa.core.data.NotificationResolver NotificationResolver} instance.
	 */
	getNotificationResolver : function()
	{
		return this.notificationResolver || (this.notificationResolver = new Zarafa.core.data.NotificationResolver());
	},

	/**
	 * Returns the global {@link Zarafa.hierarchy.data.HierarchyStore HierarchyStore} instance.
	 * @return {Zarafa.hierarchy.data.HierarchyStore} the global {@link Zarafa.hierarchy.data.HierarchyStore HierarchyStore} instance.
	 */
	getHierarchyStore : function()
	{
		return this.hierarchyStore || (this.hierarchyStore = new Zarafa.hierarchy.data.HierarchyStore());
	},

	/**
	 * Returns the global {@link Zarafa.common.outofoffice.data.OofStore OofStore} instance.
	 * @return {Zarafa.common.outofoffice.data.OofStore} the global {@link Zarafa.common.outofoffice.data.OofStore} instance.
	 */
	getOutOfOfficeStore : function()
	{
		return this.outOfOfficeStore || (this.outOfOfficeStore = new Zarafa.common.outofoffice.data.OofStore());
	},

	/**
	 * Returns the global {@link Zarafa.settings.SettingsModel SettingsModel} instance.
	 * @return {Zarafa.settings.SettingsModel} the global {@link Zarafa.settings.SettingsModel SettingsModel} instance.
	 */
	getSettingsModel : function()
	{
		return this.settingsModel || (this.settingsModel = new Zarafa.settings.SettingsModel());
	},

	/**
	 * Returns the global {@link Zarafa.settings.PersistentSettingsModel PersistentSettingsModel} instance.
	 * @return {Zarafa.settings.PersistentSettingsModel} the global
	 * {@link Zarafa.settings.PersistentSettingsModel PersistentSettingsModel} instance.
	 */
	getPersistentSettingsModel : function()
	{
		return this.persistentSettingsModel || (this.persistentSettingsModel = new Zarafa.settings.PersistentSettingsModel());
	},

	/**
	 * Returns the {@link Zarafa.core.data.ShadowStore ShadowStore} instance.
	 * @return {Zarafa.core.data.ShadowStore} the {@link Zarafa.core.data.ShadowStore ShadowStore} instance.
	 */
	getShadowStore : function()
	{
		return this.shadowStore || (this.shadowStore = new Zarafa.core.data.ShadowStore());
	},

	/**
	 * Returns the {@link Zarafa.core.ui.notifier.Notifier Notifier} instance which can be used
	 * for sending notifications to the user.
	 * @return {Zarafa.core.ui.notifier.Notifier} The notifier for User notifications
	 */
	getNotifier : function()
	{
		return this.notifier || (this.notifier = new Zarafa.core.ui.notifier.Notifier());
	},

	/**
	 * Returns the application main panel.
	 * @return {Zarafa.core.ui.MainViewport} the application main panel.
	 */
	getMainPanel : function()
	{
		return this.mainPanel || (this.mainPanel = new Zarafa.core.ui.MainViewport());
	},

	/**
	 * Resturns the applications main toolbar
	 * @return {Zarafa.core.ui.MainToolbar} then application main tool bar
	 */
	getMainToolbar : function()
	{
		return this.getMainPanel().mainToolbar;
	},

	/**
	 * Returns the application welcome panel.
	 * @return {Zarafa.core.ui.WelcomeViewport} the application welcome panel.
	 */
	getWelcomePanel : function()
	{
		return this.welcomePanel || (this.welcomePanel = new Zarafa.core.ui.WelcomeViewport());
	},

	/**
	 * Returns the application tab panel
	 * @return {Zarafa.core.ui.ContextContainer} The application tab panel
	 */
	getTabPanel : function()
	{
		return this.getMainPanel().getContentPanel();
	},

	/**
	 * Returns the application content panel
	 * @return {Zarafa.common.ui.ContextMainPanel} the application content panel.
	 */
	getContentPanel : function()
	{
		return this.getTabPanel().get(0).getActiveItem();
	},

	/**
	 * Returns the application navigation sidebar.
	 * @return {Zarafa.core.ui.NavigationPanel} the navigation sidebar
	 */
	getNavigationBar : function()
	{
		return this.getMainPanel().getNavigationPanel();
	},

	/**
	 * Returns the application widget sidebar.
	 * @return {Zarafa.core.ui.widget.WidgetPanel} the application widget sidebar.
	 */
	getWidgetSideBar : function()
	{
		return this.getMainPanel().getWidgetPanel();
	},

	/**
	 * Returns an array of all registered {@link Zarafa.core.Plugin plugins}.
	 * @return {Array} plugins
	 */
	getPlugins : function()
	{
		return this.plugins;
	},

	/**
	 * Returns the Meta Data for {@link #pluginsMetaData all registered} {@link Zarafa.core.Plugin plugins}.
	 * @return {Array} The plugins meta data
	 */
	getPluginsMetaData : function()
	{
		return this.pluginsMetaData;
	},

	/**
	 * Returns an array of all registered {@link Zarafa.core.Context contexts}.
	 * @return {Array} Contexts
	 */
	getContexts : function()
	{
		return this.contexts;
	},

	/**
	 * Returns the Meta Data for {@link #contextsMetaData all registered} {@link Zarafa.core.Context contexts}.
	 * @return {Array} The contexts meta data
	 */
	getContextsMetaData : function()
	{
		return this.contextsMetaData;
	},

	/**
	 * Returns the Meta Data for {@link #widgetsMetaData all registered} {@link Zarafa.core.ui.widget.Widget widgets}.
	 * @return {Array} The widgets meta data
	 */
	getWidgetsMetaData : function()
	{
		return this.widgetsMetaData;
	},

	/**
	 * Returns the context that matches the supplied name.
	 * @param {String} name The name of the context which is requested
	 * @return {Zarafa.core.Context} matching context or <code>undefined</code> if not found.
	 */
	getContextByName : function(name)
	{
		var contexts = this.getContexts();

		for (var index = 0, len = contexts.length; index < len; index++) {
			if (contexts[index].getName() === name) {
				return contexts[index];
			}
		}
	},

	/**
	 * Returns the Context Meta Data that matches the supplied name.
	 * @param {String} name The name of the context for which the meta data is requested
	 * @return {Zarafa.core.ContextMetaData} The Meta Data for the context or <code>undefined</code> if not found.
	 */
	getContextMetaDataByName : function(name)
	{
		var contexts = this.getContextsMetaData();

		for (var index = 0, len = contexts.length; index < len; index++) {
			if (contexts[index].getName() === name) {
				return contexts[index];
			}
		}
	},

	/**
	 * Returns the plug-in that matches the supplied name.
	 * @param {String} name The name of the plugin which is requested
	 * @return {Zarafa.core.Plugin} matching plug-in or <code>undefined</code> if not found.
	 */
	getPluginByName : function(name)
	{
		var plugins = this.getPlugins();

		for (var index = 0, len = plugins.length; index < len; index++) {
			if (plugins[index].getName() === name) {
				return plugins[index];
			}
		}
	},

	/**
	 * Returns the Plugin Meta Data that matches the supplied name.
	 * @param {String} name The name of the plugin for which the meta data is requested
	 * @return {Zarafa.core.PluginMetaData} The Meta Data for the plugin or <code>undefined</code> if not found.
	 */
	getPluginMetaDataByName : function(name)
	{
		var plugins = this.getPluginsMetaData();

		for (var index = 0, len = plugins.length; index < len; index++) {
			if (plugins[index].getName() === name) {
				return plugins[index];
			}
		}
	},

	/**
	 * Returns the Widget Meta Data that matches the supplied name.
	 * @param {String} name The name of the widget for which the meta data is requested
	 * @return {Zarafa.core.ui.widget.WidgetMetaData} The Meta Data for the widget or <code>undefined</code> if not found.
	 */
	getWidgetMetaDataByName : function(name)
	{
		var widgets = this.getWidgetsMetaData();

		for (var index = 0, len = widgets.length; index < len; index++) {
			if (widgets[index].getName() === name) {
				return widgets[index];
			}
		}
	},

	/**
	 * Queries registered plug-ins in for components and returns the gathered results.
	 * @param {String} insertionPoint name of the insertion point
	 * @param {Object} args (optional) optional arguments such as scope
	 * @return {Ext.Component[]} an array of components
	 */
	populateInsertionPoint : function(insertionPoint)
	{
		var plugins = this.getPlugins();
		var items = [];

		// convert arguments object to a real array
		var args = Ext.toArray(arguments);

		for (var i = 0, len = plugins.length; i < len; i++) {
			var plugin = plugins[i];

			var components = plugin.getComponents.apply(plugin, args);

			// FIXME: Why do we need to assign the plugin to the component?
			Ext.each(components, function(component) {
				component.plugin = plugin;
				items.push(component);
			});
		}

		// every plugin will give items in their own array so we need to merge all arrays
		// this will not interfere with objects
		return Ext.flatten(items);
	},

	/**
	 * Registers a Context Meta Data instance with the container.
	 * @param {Zarafa.core.ContextMetaData} info context to register
	 */
	registerContext : function(info)
	{
		this.getContextsMetaData().push(info);
		if (info.isEnabled()) {
			this.getContexts().push(info.getInstance());
		}

		// A Context is also a plugin, so register it
		// as such as well.
		this.registerPlugin(info);
	},

	/**
	 * Registers a Plugin Meta Data instance with the container.
	 * @param {Zarafa.core.PluginMetaData} info plugin info to register
	 */
	registerPlugin : function(info)
	{
		// Get the list of plugins that are always enabled
		var alwaysEnabledPlugins = this.getServerConfig().getAlwaysEnabledPluginsList().split(';');
		if ( alwaysEnabledPlugins.indexOf(info.name)>=0 ){
			info.allowUserDisable = false;
			info.enable = true;
		}

		this.getPluginsMetaData().push(info);
		if (info.isEnabled()) {
			this.getPlugins().push(info.getInstance());
		}
	},

	/**
	 * Registers a Widget Meta Data instance  with the container.
	 * @param {Zarafa.core.ui.widget.WidgetMetaData} info widget meta data to register
	 */
	registerWidget : function(info)
	{
		this.getWidgetsMetaData().push(info);
	},

	/**
	 * Performs a context switch by switching out the current context and switching in the new one.
	 * @param {Zarafa.core.Context} context context to switch to.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder folder that should be shown by the selected context.
	 * @param {Boolean} suspended True if the {@link Zarafa.core.ContextModel model} for the
	 * {@link Zarafa.core.Context context} should be enabled {@link Zarafa.core.ContextModel#suspendLoading suspended}.
	 * @private
	 */
	switchContext : function(context, folder, suspended)
	{
		var oldContext = this.getCurrentContext();

		if (oldContext !== context && this.fireEvent('beforecontextswitch', folder, oldContext, context) !== false) {
			if (oldContext) {
				oldContext.disable();

				var oldModel = oldContext.getModel();
				if (oldModel) {
					oldModel.un('folderchange', this.onContextFolderChange, this);
				}
			}

			context.enable(folder, suspended);
			var newModel = context.getModel();
			if (newModel) {
				newModel.on('folderchange', this.onContextFolderChange, this);
			}

			this.currentContext = context;

			this.fireEvent('folderselect', folder);
			this.fireEvent('contextswitch', folder, oldContext, context);

			// Nothing needs to be done between 'contextswitch' and 'aftercontextswitch',
			// the difference between the two events is that the first one can be used
			// internally for building up the UI, while the latter event is ideal for
			// plugins which want the UI components to be setup correctly.
			this.fireEvent('aftercontextswitch', folder, oldContext, context);
		}
	},

	/**
	 * The container will start a bidding round to determine which context should be chosen to
	 * display the given folder.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder folder for which we need to find corresponding context.
	 * @return {Zarafa.core.Context} context that should be used to load data from {@link Zarafa.hierarchy.data.MAPIFolderRecord MAPIFolder}.
	 */
	getContextByFolder : function(folder)
	{
		// walk over the context list and select the one that provides the highest bid
		var selectedContext;
		var highestBid;
		var contexts = this.getContexts();

		if (contexts) {
			for(var index = 0, len = contexts.length; index < len; index++) {
				var context = contexts[index];
				var bid = context.bid(folder);

				if (highestBid === undefined || bid > highestBid) {
					highestBid = bid;
					selectedContext = context;
				}
			}
		}

		return selectedContext;
	},

	/**
	 * Select a specific folder in the UI. The container will start a bidding round to determine which context should be chosen to
	 * display the given folder. The current context is then disabled and switched out, and the newly chosen context is enabled and
	 * switched in. Fires the 'folderselect' event.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder folder to select.
	 */
	selectFolder : function(folder)
	{
		var selectedContext = this.getContextByFolder(folder);

		// Check if a new context has been selected, if we can
		// stay with the current context, then simply update
		// the folders.
		if (this.getCurrentContext() !== selectedContext) {
			this.switchContext(selectedContext, folder);
		} else {
			var model = selectedContext.getModel();
			if (model) {
				model.setFolders(folder);
			}
		}
	},

	/**
	 * Helps in reloading a context. It checks if given changed folder is holded by current context
	 * then re-enables context all of its folders.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder which is changed
	 */
	reloadContext : function(folder)
	{
		var currentContext = this.getCurrentContext();
		var contextModel = currentContext.getModel();

		if (!Ext.isDefined(contextModel)) {
			return;
		}

		folder = contextModel.getFolder(folder.get('entryid'));
		if (Ext.isDefined(folder)) {
			var allFolders = contextModel.getFolders();
			currentContext.disable();
			currentContext.enable(allFolders);
		}
	},

	/**
	 * Event handler which is fired when the {@link #getCurrentContext current context}
	 * {@link Zarafa.core.ContextModel model} fires the {@link Zarafa.core.ContextModel#folderchange} event.
	 * This will redirect the event and fire the {@link #folderselect} event.
	 * @param {Zarafa.core.ContextModel} model The model which fired the event
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord[]} folders The folders which are
	 * currently selected
	 * @private
	 */
	onContextFolderChange : function(model, folders)
	{
		this.fireEvent('folderselect', folders);
	},

	/**
	 * Starts a bidding round to determine what plug-in should be chosen to
	 * deliver the component that is requested. The component of the highest
	 * bidder is returned. If the supplied type is undefined the function will
	 * return undefined as well.
	 * @param {Zarafa.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record (optional) Passed record.
	 * @return {Ext.Component} Component
	 *
	 */
	getSharedComponent: function(type, record)
	{
		// walk over the context list and select the one that provides the highest bid
		var selectedPlugin;
		var highestBid;
		var plugins = container.getPlugins();
		var component;

		if (type) {
			for (var i = 0, len = plugins.length; i < len; i++) {
				var plugin = plugins[i];
				var bid = plugin.bidSharedComponent(type, record);

				if (highestBid === undefined || bid > highestBid) {
					highestBid = bid;
					selectedPlugin = plugin;
				}
			}

			if (selectedPlugin && highestBid >= 0) {
				component = selectedPlugin.getSharedComponent(type, record);
			}
		}

		return component;
	},

	/**
	 * Returns the global {@link Zarafa.common.reminder.data.ReminderStore RemimderStore} instance.
	 * @return {Zarafa.common.reminder.data.ReminderStore} instance.
	 */
	getReminderStore : function()
	{
		return this.reminderStore || (this.reminderStore = new Zarafa.common.reminder.data.ReminderStore());
	},

	/**
	 * Returns base url of webapp without trailing slash, which can be used to request resources from server.
	 * @return {String} base url of webapp.
	 */
	getBaseURL : function()
	{
		var loc = window.location;
		var url = loc.protocol + '//' + loc.host + loc.pathname;

		// it's possible that webapp is loaded without index.php in url, so if it the case
		// then append index.php in url so that will make our base url complete
		if(url.indexOf('index.php') === -1) {
			url += 'index.php';
		}

		return url;
	},

	/**
	 * Returns base path of webapp with trailing slash, which can be used to request resources from server.
	 * @return {String} base path of webapp.
	 */
	getBasePath : function()
	{
		var baseURL = container.getBaseURL();

		return baseURL.substring(0, baseURL.lastIndexOf('index.php'));
	},

	/**
	 * Returns instance of factory registered with {@link Zarafa.common.data.AbstractRulesFactory} factory
	 * depending on factoryType given in the parameter.
	 *
	 * @param {Zarafa.common.data.RulesFactoryType} factoryType type of the required factory.
	 * @return {Object} factory instance based on factoryType.
	 */
	getRulesFactoryByType : function(factoryType)
	{
		return Zarafa.common.data.AbstractRulesFactory.getFactoryById(factoryType);
	}
});
