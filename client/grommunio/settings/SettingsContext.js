Ext.namespace('Grommunio.settings');

/**
 * @class Grommunio.settings.SettingsContext
 * @extends Grommunio.core.Context
 */
Grommunio.settings.SettingsContext = Ext.extend(Grommunio.core.Context, {

	/**
	 * The context switch which waits for the user to answer the required reload
	 * message box, as a 'folder' and 'context' pair. Set by {@link #applyChangesContext}
	 * and consumed by {@link #onAfterRequiredReload}.
	 * @property
	 * @type Object
	 * @private
	 */
	pendingContextSwitch: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			stateful: false
		});

		Grommunio.settings.SettingsContext.superclass.constructor.call(this, config);

		// Register the settings tab in the MainTabBar
		this.registerInsertionPoint('main.maintabbar.right', this.createSettingsMainTab, this);
		// Register some default categories for the settings
		this.registerInsertionPoint('context.settings.categories', this.createSettingCategories, this);

		this.addEvents(
			/**
			 * Fires when the user press a button in required reload message box.
			 * @param {String} button The button which user pressed from
			 * required reload message box
			 */
			'afterrequiredreload'
		);

		// Add a listener to the contextswitch event to collapse the navigation panel
		// when we switch to the settings context
		container.on('contextswitch', this.onContextSwitch);

		// Watch the settings for the rest of the session rather than only while this
		// context is enabled. The server answers an apply at an unspecified time, which
		// can be well after the user has left the settings, yet the prompt to reload still
		// has to come up. This is the model which #getModel hands out as its real one.
		container.getSettingsModel().on('save', this.onSaveSettings, this);
	},

	/**
	 * @return {Grommunio.settings.SettingsContextModel} the settings context model
	 */
	getModel: function()
	{
		if (!Ext.isDefined(this.model)) {
			this.model = new Grommunio.settings.SettingsContextModel();
		}
		return this.model;
	},

	/**
	 * Switch the currently active view inside the {@link Grommunio.core.Context context}.
	 * This will fire the {@link #viewchange} event.
	 *
	 * Before switching the view, this function will first check if there are
	 * any pending changes.
	 *
	 * @param {Mixed} viewId The view identification
	 */
	setView: function(viewId)
	{
		if (this.current_view != viewId) {
			var model = this.getModel();

			if (model.hasChanges()) {
				Ext.MessageBox.show({
					title: _('Apply changes'),
					msg: _('Do you wish to apply the changes?'),
					fn: this.applyChanges.createDelegate(this, [ viewId ], 1),
					buttons: Ext.MessageBox.YESNOCANCEL
				});
			} else {
				Grommunio.settings.SettingsContext.superclass.setView.call(this, viewId);
			}
		}
	},

	/**
	 * Sets the current view mode from the available view modes.
	 *
	 * Compared to the {@link Grommunio.core.Context superclass} this function
	 * will always fire the viewmode change event regardless if the same value
	 * has been provided or not.
	 *
	 * Fires the {@link #viewmodechange} event.
	 * @param {Number} mode view mode (context should define modes and its numeric values).
	 */
	setViewMode: function(mode)
	{
		var oldMode = this.current_view_mode;
		this.current_view_mode = mode;
		this.fireEvent('viewmodechange', this, this.current_view_mode, oldMode);
	},

	/**
	 * Event handler for {@link #setView}. This will check if the user
	 * wishes to cancel the {@link #setView} action, or wishes to either
	 * {@link Grommunio.settings.SettingsContextModel#applyChanges apply} or
	 * {@link Grommunio.settings.SettingsContextModel#discardChanges discard}
	 * all changes.
	 * @param {String} btn The button which the user pressed
	 * @param {Mixed} viewId the viewId argument from {@link #setView}.
	 * @private
	 */
	applyChanges: function(btn, viewId)
	{
		// The user cancels the switch to a different category
		if (btn === 'cancel') {
			return;
		}

		// Check if the user wishes to save or discard all changes
		var model = this.getModel();
		if (btn === 'yes') {
			model.applyChanges();
		} else {
			model.discardChanges();
		}

		Grommunio.settings.SettingsContext.superclass.setView.call(this, viewId);
	},

	/**
	 * Called before the context is switched in.
	 * @param {Grommunio.hierarchy.data.MAPIFolderRecord} folder MAPI folder to show.
	 * @param {Boolean} suspended True to enable the ContextModel {@link Grommunio.core.ContextModel#suspendLoading suspended}
	 */
	enable: function(folder, suspended)
	{
		Grommunio.settings.SettingsContext.superclass.enable.apply(this, arguments);

		container.on('beforecontextswitch', this.onBeforeContextSwitch, this);
	},

	/**
	 * Called before the context is switched out.
	 */
	disable: function()
	{
		// Get the state of the navigation panel so we know if we must expand it again.
		// By default the navigation bar is expanded, but the state setting is not set (undefined).
		// Expand the navigation bar when the state is 1) undefined, 2) true and collapsed.
		// Ref KW-2961.
		var navState = Ext.state.Manager.get(container.getNavigationBar().stateId);
		if ((!Ext.isDefined(navState)) || (navState && !navState.collapsed)) {
			container.getNavigationBar().expand();
		}

		container.un('beforecontextswitch', this.onBeforeContextSwitch, this);

		Grommunio.settings.SettingsContext.superclass.disable.apply(this, arguments);
	},

	/**
	 * Event handler which shows the warning {@link Grommunio.common.dialogs.MessageBox.addCustomButtons messageBox}
	 * if updated settings required the webapp to reload.
	 * @param {Grommunio.settings.SettingsModel} model The model which fired the event.
	 * @param {Object} param The key-value object containing the action and the corresponding
	 * settings which were saved to the server.
	 */
	onSaveSettings: function(model, param)
	{
		if(param.requiresReload) {
			var message = _('You must reload grommunio Web for the changes to take effect. Unsaved changes will be lost.');

			Grommunio.common.dialogs.MessageBox.addCustomButtons({
				title: _('Reload grommunio Web'),
				msg: message,
				fn: this.reloadWebapp,
				customButton: [{
					text: _('Reload'),
					name: 'reload'
				}, {
					text: _('Cancel'),
					name: 'cancel'
				}],
				scope: this
			});
		}
	},

	/**
	 * Event handler for {@link #onSaveSettings}. This will check if the user
	 * wishes to reload the webapp or not.
	 * @param {String} button The button which the user pressed
	 * @private
	 */
	reloadWebapp: function(button)
	{
		if(button === 'reload') {
			container.getSettingsModel().un('save', this.onSaveSettings, this);
			Grommunio.core.Util.reloadWebapp();
		}
		this.fireEvent('afterrequiredreload', this, button);
	},

	/**
	 * Bid for the type of shared component and the given record.
	 * @param {Grommunio.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Number} The bid for the shared component
	 */
	bidSharedComponent: function(type, record)
	{
		var bid = -1;

		if (Array.isArray(record)) {
			record = record[0];
		}

		switch (type) {
			case Grommunio.core.data.SharedComponentType['common.contextmenu']:
				if (record instanceof Grommunio.settings.ui.SettingsTreeNode) {
					bid = 1;
				}
				break;
		}

		return bid;
	},

	/**
	 * Will return the reference to the shared component.
	 * Based on the type of component requested a component is returned.
	 * @param {Grommunio.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Ext.Component} Component
	 */
	getSharedComponent: function(type, record)
	{
		var component;

		switch (type) {
			case Grommunio.core.data.SharedComponentType['common.contextmenu']:
				if (record instanceof Grommunio.settings.ui.SettingsTreeNode) {
					component = Grommunio.settings.ui.SettingsContextMenu;
				}
				break;
		}

		return component;
	},

	/**
	 * Obtain the {@link Grommunio.settings.ui.SettingsMainPanel SettingsMainPanel} object
	 *
	 * @return {Grommunio.settings.ui.SetingsMainPanel} The main panel which should
	 * be used within the {@link Grommunio.core.Context context}
	 */
	createContentPanel: function()
	{
		return {
			xtype: 'grommunio.settingsmainpanel',
			id: 'grommunio-mainpanel-contentpanel-settings',
			title: this.getDisplayName(),
			context: this
		};
	},

	/**
	 * Adds a button to the top tab bar for the settings.
	 * @return {Object} The button for the top tabbar
	 * @private
	 */
	createSettingsMainTab: function()
	{
		return {
			text: this.getDisplayName(),
			tabOrderIndex: 1,
			context: this.getName(),
			id: 'mainmenu-button-settings'
		};
	},

	/**
	 * Create the 3 default {@link Grommunio.settings.ui.SettingsCategory Settings Categories}
	 * to the {@link Grommunio.settings.SettingsContext}. This will create new
	 * {@link Grommunio.settings.ui.SettingsCategoryTab tabs} for the
	 * {@link Grommunio.settings.ui.SettingsGeneralCategory General},
	 * {@link Grommunio.settings.ui.SettingsPluginsCategory Plugins},
	 * {@link Grommunio.settings.ui.SettingsAdvancedCategory Advanced settings} and
	 * {@link Grommunio.settings.ui.SettingsCopyrightCategory Copyright notice}
	 * in the {@link Grommunio.settings.ui.SettingsCategoryWidgetPanel Widget Panel}.
	 * @return {Array} configuration object for the categories to register
	 * @private
	 */
	createSettingCategories: function()
	{
		var categories = [{
			xtype: 'grommunio.settingsgeneralcategory',
			settingsContext: this
		}];

		// disable plugin settings if sysadmin wants it
		if (container.getServerConfig().isPluginsEnabled()) {
			categories.push({
				xtype: 'grommunio.settingspluginscategory',
				settingsContext: this
			});
		}

		// disable advanced settings if sysadmin wants it
		if (container.getServerConfig().isAdvancedSettingsEnabled()) {
			categories.push({
				xtype: 'grommunio.settingsadvancedcategory',
				settingsContext: this
			});
		}

		categories = categories.concat([
		{
			xtype: 'grommunio.settingskeyshortcutcategory',
			settingsContext: this
		},{
			xtype: 'grommunio.settingscopyrightcategory',
			settingsContext: this
		}]);

		return categories;
	},

	/**
	 * Event handler which is fired just before the {@link Grommunio.core.Container container}
	 * {@link Grommunio.core.Container#beforecontextswitch switches the context}. This will
	 * check if there are any pending changes which the user might wish to apply or discard.
	 * @param {Grommunio.hierarchy.data.MAPIFolderRecord} folder folder that is loaded for the new context
	 * @param {Grommunio.core.Context} oldContext context being switched out
	 * @param {Grommunio.core.Context} newContext new context being switched in
	 * @return {Boolean} False to prevent the context from being switched
	 * @private
	 */
	onBeforeContextSwitch: function(folder, oldContext, newContext)
	{
		if (this.getModel().hasChanges()) {
			Ext.MessageBox.show({
				title: _('Apply changes'),
				msg: _('Do you wish to apply the changes?'),
				fn: this.applyChangesContext.createDelegate(this, [ folder, newContext ], 1),
				buttons: Ext.MessageBox.YESNOCANCEL
			});

			// Always return false, we will manually switch context again
			// in the event handler for the message box.
			return false;
		}
	},

	/**
	 * Event handler for {@link #onBeforeContextSwitch}. This will check if the user
	 * wishes to cancel the {@link #setView} action, or wishes to either
	 * {@link Grommunio.settings.SettingsContextModel#applyChanges apply} or
	 * {@link Grommunio.settings.SettingsContextModel#discardChanges discard}
	 * all changes.
	 * @param {String} btn The button which the user pressed
	 * @param {Grommunio.hierarchy.data.MAPIFolderRecord} folder The folder to which to
	 * switch when the user is wishes to switch context.
	 * @param {Grommunio.core.Context} newContext The context to which to switch
	 * @private
	 */
	applyChangesContext: function(btn, folder, newContext)
	{
		// The user cancels the switch to a different category
		if (btn === 'cancel') {
			return;
		}

		// Check if the user wishes to save or discard all changes
		var model = this.getModel();
		if (btn === 'yes') {
			model.applyChanges();
		} else {
			model.discardChanges();
		}

		/*
		 * if requiresReload config was true then don't directly switch the context
		 * register the afterrequiredreload event and then switch the context based on the
		 * button pressed by the user from required reload message box.
		 */
		if(model.getRealSettingsModel().requiresReload) {
			this.pendingContextSwitch = { folder: folder, context: newContext };
			this.on('afterrequiredreload', this.onAfterRequiredReload, this, {single: true});
		} else {
			container.switchContext(newContext, folder);
		}
	},

	/**
	 * Event handler for the {@link Grommunio.core.Container.contextswitch contextswitch}
	 * event of the {@link Grommunio.core.Container Container} Will collapse the
	 * {@link Grommunio.core.ui.NavigationPanel NavigationPanel} when we switch
	 * to the SettingContext.
	 * @param {Grommunio.hierarchy.data.MAPIFolderRecord} folder folder that is loaded for the new context
	 * @param {Grommunio.core.Context} oldContext context that was switched out
	 * @param {Grommunio.core.Context} newContext new context that was switched
	 */
	onContextSwitch: function(folder, oldContext, newContext)
	{
		if ( newContext.getName() === 'settings' ) {
			container.getNavigationBar().collapse();
		}
	},

	/**
	 * Function is used to switch the context if cancel button was pressed from
	 * required reload message box.
	 *
	 * @param {Grommunio.core.Context} currentContext The current context.
	 * @param {String} button The button which the user pressed from required reload message box
	 * @private
	 */
	onAfterRequiredReload: function(currentContext, button)
	{
		var pending = this.pendingContextSwitch;
		delete this.pendingContextSwitch;

		if(button === 'cancel' && pending) {
			container.switchContext(pending.context, pending.folder);
		}
	}
});

Grommunio.onReady(function() {
	container.registerContext(new Grommunio.core.ContextMetaData({
		name: 'settings',
		displayName: _('Settings'),
		allowUserVisible: false,
		pluginConstructor: Grommunio.settings.SettingsContext
	}));
});
