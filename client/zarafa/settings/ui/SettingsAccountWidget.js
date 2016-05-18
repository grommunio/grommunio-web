Ext.namespace('Zarafa.settings.ui');

/**
 * @class Zarafa.settings.ui.SettingsAccountWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.settingsaccountwidget
 *
 * The Account Information widget
 */
Zarafa.settings.ui.SettingsAccountWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {
	/**
	 * The language which is currently active in the interface
	 * @property
	 * @type String
	 * @private
	 */
	origLanguage : '',
	
	/**
	 * The name that will be shown for the default theme (i.e. no theme selected)
	 * @property
	 * @type String
	 * @private
	 */
	defaultThemeName : _('Basic'),

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		var user = container.getUser();
		var languageStore = {
			xtype : 'jsonstore',
			autoDestroy : true,
			fields : ['lang', 'name'],
			data : container.getLanguages()
		};

		// Load the items from the maintabbar
		var items = container.populateInsertionPoint('main.maintabbar.left', this);
		items = Zarafa.core.Util.sortArray(items, 'ASC', 'tabOrderIndex');
		var startupStore = {
			xtype : 'jsonstore',
			autoDestroy : true,
			fields : ['context', 'text'],
			data : items
		};

		// Create a store with the available themes
		items = [[0, this.defaultThemeName, 'basic']];
		var plugins = container.getPlugins();
		for ( var i=0; i<plugins.length; i++ ){
			var plugin = plugins[i];
			if ( plugin instanceof Zarafa.core.ThemePlugin ){
				items.push([items.length, plugin.getDisplayName(), plugin.getName()]);
			}
		}
		var themeStore = new Ext.data.ArrayStore({
			fields: ['id', 'displayName', 'name'],
			idIndex: 0,
			data: items,
			sortInfo: {
				field: 'displayName',
				direction: 'ASC'
			}
		});

		Ext.applyIf(config, {
			title : String.format(_('Account information - {0}'), user.getDisplayName()),
			layout : 'form',
			items : [{
				xtype : 'displayfield',
				fieldLabel : _('Display Name'),
				value : user.getDisplayName(),
				htmlEncode : true
			},{
				xtype : 'displayfield',
				fieldLabel : _('E-mail'),
				value : user.getSMTPAddress(),
				htmlEncode : true
			},{
				xtype : 'zarafa.compositefield',
				fieldLabel : _('Language'),
				items : [{
					xtype : 'combo',
					name : 'zarafa/v1/main/language',
					ref : '../languageCombo',
					width : 200,
					store : languageStore,
					mode: 'local',
					triggerAction: 'all',
					displayField: 'name',
					valueField: 'lang',
					lazyInit: false,
					forceSelection: true,
					editable: false,
					autoSelect: true,
					listeners : {
						select : this.onLanguageSelect,
						scope : this
					}
				},{
					xtype : 'displayfield',
					cls : 'zarafa-settings-reload-warning',
					ref : '../languageWarning'
				}]
			},{
				xtype : 'combo',
				fieldLabel : _('Startup folder'),
				name : 'zarafa/v1/main/default_context',
				ref : 'startupCombo',
				width : 200,
				store : startupStore,
				mode: 'local',
				triggerAction: 'all',
				displayField: 'text',
				valueField: 'context',
				lazyInit: false,
				forceSelection: true,
				editable: false,
				autoSelect: true,
				listeners : {
					select : this.onStartupSelect,
					scope : this
				}
			}]
		});
		
		if ( themeStore.data.length > 1 ){
			// We have more than just the basic theme, so give the user the posibility to
			// change it.
			config.items.push({
				xtype: 'combo',
				width : 200,
				editable: false,
				forceSelection: true,
				triggerAction: 'all',
				store: themeStore,
				fieldLabel: _('Theme'),
				mode: 'local',
				valueField: 'name',
				displayField: 'displayName',
				ref: 'themeCombo',
				name : 'zarafa/v1/main/active_theme',
				listeners : {
					select : this.onThemeSelect,
					scope : this
				}
			});
		}

		Zarafa.settings.ui.SettingsAccountWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler which is fired when a language in the {@link Ext.form.ComboBox combobox} 
	 * has been selected. This will inform the user that this setting requires a reload of the
	 * webapp to become active.
	 * @param {Ext.form.ComboBox} combo The combobox which fired the event
	 * @param {Ext.data.Record} record The selected record in the combobox
	 * @param {Number} index The selected index in the store
	 * @private
	 */
	onLanguageSelect : function(combo, record, index)
	{
		var value = record.get(combo.valueField);

		if (this.origLanguage !== value) {
			this.model.requiresReload = true;
			this.languageWarning.setValue(_('This change requires a reload of the WebApp'));
		} else {
			this.languageWarning.reset();
		}

		if (this.model) {
			this.model.set(combo.name, value);
		}
	},

	/**
	 * Event handler which is fired when a Startup Context in the {@link Ext.form.ComboBox combobox}
	 * has been selected.
	 * @param {Ext.form.ComboBox} combo The combobox which fired the event
	 * @param {Ext.data.Record} record The selected record in the combobox
	 * @param {Number} index The selected index in the store
	 * @private
	 */
	onStartupSelect : function(combo, record, index)
	{
		var value = record.get(combo.valueField);
		if (this.model) {
			this.model.set(combo.name, value);
		}
	},

	/**
	 * Event handler which is fired when a language in the {@link Ext.form.ComboBox combobox} 
	 * has been selected. This will inform the user that this setting requires a reload of the
	 * webapp to become active.
	 * @param {Ext.form.ComboBox} combo The combobox which fired the event
	 * @param {Ext.data.Record} record The selected record in the combobox
	 * @param {Number} index The selected index in the store
	 * @private
	 */
	onThemeSelect : function(combo, record, index)
	{
		var value = record.get(combo.valueField);

		if (this.activeTheme !== value) {
			this.model.requiresReload = true;
		}

		if (this.model) {
			this.model.set(combo.name, value);
		}
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategoryWidgetPanel widget panel}
	 * to load the latest version of the settings from the
	 * {@link Zarafa.settings.SettingsModel} into the UI of this category.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to load
	 */
	update : function(settingsModel)
	{
		Zarafa.settings.ui.SettingsAccountWidget.superclass.update.apply(this, arguments);

		this.model = settingsModel;

		// Load the original language from the settings
		this.origLanguage = settingsModel.get(this.languageCombo.name);

		this.languageCombo.setValue(this.origLanguage);
		this.languageWarning.reset();

		this.startupCombo.setValue(settingsModel.get(this.startupCombo.name));

		// Set the currently active theme only when themes are available and the themecombo exists
		if ( Ext.isDefined(this.themeCombo) ){
			this.activeTheme = settingsModel.get(this.themeCombo.name);
			// Check if a theme was set and if this theme has not been removed by the admin
			if ( !this.activeTheme || this.themeCombo.store.find('name', this.activeTheme)===-1 ){
				this.activeTheme = container.getServerConfig().getActiveTheme() || this.defaultThemeName;
			}
			this.themeCombo.setValue(this.activeTheme);
		}
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategoryWidgetPanel widget panel}
	 * to update the settings from the UI into the {@link Zarafa.settings.SettingsModel settings model}.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to update
	 */
	updateSettings : function(settingsModel)
	{
		Zarafa.settings.ui.SettingsAccountWidget.superclass.updateSettings.apply(this, arguments);

		settingsModel.beginEdit();
		settingsModel.set(this.languageCombo.name, this.languageCombo.getValue());
		settingsModel.set(this.startupCombo.name, this.startupCombo.getValue());

		// Save the selected theme only when themes are available and the themecombo exists
		if ( Ext.isDefined(this.themeCombo) ){
			settingsModel.set(this.themeCombo.name, this.themeCombo.getValue());
		}
		settingsModel.endEdit();
	}
});

Ext.reg('zarafa.settingsaccountwidget', Zarafa.settings.ui.SettingsAccountWidget);
