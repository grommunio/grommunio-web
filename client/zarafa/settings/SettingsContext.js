Ext.namespace('Zarafa.settings');

/**
 * @class Zarafa.settings.SettingsContext
 * @extends Zarafa.core.Context
 */
Zarafa.settings.SettingsContext = Ext.extend(Zarafa.core.Context, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */ 
	constructor : function(config)
	{   
		config = config || {};

		Ext.applyIf(config, {
			stateful : false
		});

		Zarafa.settings.SettingsContext.superclass.constructor.call(this, config);

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
	},

	/**
	 * @return {Zarafa.settings.SettingsContextModel} the settings context model
	 */
	getModel : function()
	{
		if (!Ext.isDefined(this.model)) {
			this.model = new Zarafa.settings.SettingsContextModel();
		}
		return this.model;
	},

	/**
	 * Switch the currently active view inside the {@link Zarafa.core.Context context}.
	 * This will fire the {@link #viewchange} event.
	 *
	 * Before switching the view, this function will first check if there are
	 * any pending changes.
	 *
	 * @param {Mixed} viewId The view identification
	 */
	setView : function(viewId)
	{
		if (this.current_view != viewId) {
			var model = this.getModel();

			if (model.hasChanges()) {
				Ext.MessageBox.show({
					title: _('Kopano WebApp'),
					msg : _('Do you wish to apply the changes?'),
					icon: Ext.MessageBox.QUESTION,
					fn: this.applyChanges.createDelegate(this, [ viewId ], 1),
					buttons: Ext.MessageBox.YESNOCANCEL
				});
			} else {
				Zarafa.settings.SettingsContext.superclass.setView.call(this, viewId);
			}
		}
	},

	/**
	 * Sets the current view mode from the available view modes.
	 * 
	 * Compared to the {@link Zarafa.core.Context superclass} this function
	 * will always fire the viewmode change event regardless if the same value
	 * has been provided or not. 
	 *
	 * Fires the {@link #viewmodechange} event.
	 * @param {Number} mode view mode (context should define modes and its numeric values).
	 */
	setViewMode : function(mode)
	{
		var oldMode = this.current_view_mode;
		this.current_view_mode = mode;
		this.fireEvent('viewmodechange', this, this.current_view_mode, oldMode);
	},

	/**
	 * Event handler for {@link #setView}. This will check if the user
	 * wishes to cancel the {@link #setView} action, or wishes to either
	 * {@link Zarafa.settings.SettingsContextModel#applyChanges apply} or
	 * {@link Zarafa.settings.SettingsContextModel#discardChanges discard}
	 * all changes. 
	 * @param {String} btn The button which the user pressed
	 * @param {Mixed} viewId the viewId argument from {@link #setView}.
	 * @private
	 */
	applyChanges : function(btn, viewId)
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

		Zarafa.settings.SettingsContext.superclass.setView.call(this, viewId);
	},

	/**
	 * Called before the context is switched in.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder MAPI folder to show.
	 * @param {Boolean} suspended True to enable the ContextModel {@link Zarafa.core.ContextModel#suspendLoading suspended}
	 */
	enable : function(folder, suspended)
	{
		Zarafa.settings.SettingsContext.superclass.enable.apply(this, arguments);

		container.on('beforecontextswitch', this.onBeforeContextSwitch, this);
		this.getModel().getRealSettingsModel().on('save', this.onSaveSettings, this);
		container.getNavigationBar().collapse();
	},

	/**
	 * Called before the context is switched out.
	 */	
	disable : function()
	{
		container.getNavigationBar().expand();
		container.un('beforecontextswitch', this.onBeforeContextSwitch, this);

		Zarafa.settings.SettingsContext.superclass.disable.apply(this, arguments);
	},

	/**
	 * Event handler which shows the warning {@link Zarafa.common.dialogs.MessageBox.addCustomButtons messageBox}
	 * if updated settings required the webapp to reload.
	 * @param {Zarafa.settings.SettingsModel} model The model which fired the event.
	 * @param {Object} param The key-value object containing the action and the corresponding
	 * settings which were saved to the server.
	 */
	onSaveSettings : function(model, param)
	{
		if(param.requiresReload) {
			var message = _('In order for the changes to take effect, please reload WebApp.') +'<br>'+ _('NOTE: Any unsaved changes will be lost.');

			Zarafa.common.dialogs.MessageBox.addCustomButtons({
				title: _('Kopano WebApp'),
				msg : message,
				icon : Ext.MessageBox.QUESTION,
				fn : this.reloadWebapp,
				customButton : [{
					text : _('Reload'),
					name : 'reload'
				}, {
					text : _('Cancel'),
					name : 'cancel'
				}],
				scope : this
			});
		}
	},

	/**
	 * Event handler for {@link #onSaveSettings}. This will check if the user
	 * wishes to reload the webapp or not.
	 * @param {String} button The button which the user pressed
	 * @private
	 */
	reloadWebapp : function(button)
	{
		if(button === 'reload') {
			this.getModel().getRealSettingsModel().un('save', this.onSaveSettings, this);
			Zarafa.core.Util.reloadWebapp();
		}
		this.fireEvent('afterrequiredreload', this, button);
	},

	/**
	 * Bid for the type of shared component and the given record.
	 * @param {Zarafa.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Number} The bid for the shared component
	 */
	bidSharedComponent: function(type, record)
	{
		var bid = -1;

		if (Ext.isArray(record)) {
			record = record[0];  
		}

		switch (type) {
			case Zarafa.core.data.SharedComponentType['common.contextmenu']:
				if (record instanceof Zarafa.settings.ui.SettingsTreeNode) {
					bid = 1;
				}
				break;
		}

		return bid;
	},

	/**
	 * Will return the reference to the shared component.
	 * Based on the type of component requested a component is returned.
	 * @param {Zarafa.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Ext.Component} Component
	 */
	getSharedComponent: function(type, record)
	{
		var component;

		switch (type) {
			case Zarafa.core.data.SharedComponentType['common.contextmenu']:
				if (record instanceof Zarafa.settings.ui.SettingsTreeNode) {
					component = Zarafa.settings.ui.SettingsContextMenu;
				}
				break;
		}

		return component;
	},

	/**
	 * Obtain the {@link Zarafa.settings.ui.SettingsMainPanel SettingsMainPanel} object
	 *
	 * @return {Zarafa.settings.ui.SetingsMainPanel} The main panel which should
	 * be used within the {@link Zarafa.core.Context context}
	 */
	createContentPanel : function()
	{
		return {
			xtype : 'zarafa.settingsmainpanel',
			id: 'zarafa-mainpanel-contentpanel-settings',
			title : this.getDisplayName(),
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
	 * Create the 3 default {@link Zarafa.settings.ui.SettingsCategory Settings Categories}
	 * to the {@link Zarafa.settings.SettingsContext}. This will create new
	 * {@link Zarafa.settings.ui.SettingsCategoryTab tabs} for the
	 * {@link Zarafa.settings.ui.SettingsGeneralCategory General},
	 * {@link Zarafa.settings.ui.SettingsPluginsCategory Plugins},
	 * {@link Zarafa.settings.ui.SettingsAdvancedCategory Advanced setings} and
	 * {@link Zarafa.settings.ui.SettingsCopyrightCategory Copyright notice}
	 * in the {@link Zarafa.settings.ui.SettingsCategoryWidgetPanel Widget Panel}.
	 * @return {Array} configuration object for the categories to register
	 * @private
	 */
	createSettingCategories: function()
	{
		var categories = [{
			xtype : 'zarafa.settingsgeneralcategory',
			settingsContext : this
		}];

		// disable plugin settings if sysadmin wants it
		if (container.getServerConfig().isPluginsEnabled()) {
			categories.push({
				xtype : 'zarafa.settingspluginscategory',
				settingsContext : this
			});
		}

		// disable advanced settings if sysadmin wants it
		if (container.getServerConfig().isAdvancedSettingsEnabled()) {
			categories.push({
				xtype : 'zarafa.settingsadvancedcategory',
				settingsContext : this
			});
		}
		
		categories = categories.concat([
		{
			xtype : 'zarafa.settingskeyshortcutcategory',
			settingsContext : this
		},{
			xtype : 'zarafa.settingscopyrightcategory',
			settingsContext : this
		}]);

		return categories;
	},

	/**
	 * Event handler which is fired just before the {@link Zarafa.core.Container container}
	 * {@link Zarafa.core.Container#beforecontextswitch switches the context}. This will
	 * check if there are any pending changes which the user might wish to apply or discard.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder folder that is loaded for the new context
	 * @param {Zarafa.core.Context} oldContext context being switched out
	 * @param {Zarafa.core.Context} newContext new context being switched in
	 * @return {Boolean} False to prevent the context from being switched
	 * @private
	 */
	onBeforeContextSwitch : function(folder, oldContext, newContext)
	{
		if (this.getModel().hasChanges()) {
			Ext.MessageBox.show({
				title: _('Kopano WebApp'),
				msg : _('Do you wish to apply the changes?'),
				icon: Ext.MessageBox.QUESTION,
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
	 * {@link Zarafa.settings.SettingsContextModel#applyChanges apply} or
	 * {@link Zarafa.settings.SettingsContextModel#discardChanges discard}
	 * all changes. 
	 * @param {String} btn The button which the user pressed
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder to which to
	 * switch when the user is wishes to switch context.
	 * @param {Zarafa.core.Context} newContext The context to which to switch
	 * @private
	 */
	applyChangesContext : function(btn, folder, newContext)
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
			this.on('afterrequiredreload', this.onAfterRequiredReload.createDelegate(this, [ folder, newContext ],1), this, {single : true});
		} else {
			container.switchContext(newContext, folder);
		}
	},

	/**
	 * Function is used to switch the context if cancel button was pressed from 
	 * required reload message box.
	 * 
	 * @param {Zarafa.core.Context} currentContext The current context.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder to which to
	 * switch when the user is wishes to switch context.
	 * @param {Zarafa.core.Context} newContext The context to which to switch
	 * @param {String} button The button which the user pressed from required reload message box
	 * @private
	 */
	onAfterRequiredReload : function(currentContext, newContextFolder, newContext, button)
	{
		if(button === 'cancel') {
			container.switchContext(newContext, newContextFolder);
		}
	}
});

Zarafa.onReady(function() {
	container.registerContext(new Zarafa.core.ContextMetaData({
		name : 'settings',
		displayName : _('Settings'),
		allowUserVisible : false,
		pluginConstructor : Zarafa.settings.SettingsContext
	}));
});
