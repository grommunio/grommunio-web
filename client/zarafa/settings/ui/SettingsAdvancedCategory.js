Ext.namespace('Zarafa.settings.ui');

/**
 * @class Zarafa.settings.ui.SettingsAdvancedCategory
 * @extends Zarafa.settings.ui.SettingsCategory
 * @xtype zarafa.settingsadvancedcategory
 *
 * The default available category for users which will
 * load the {@link Zarafa.settings.ui.SettingsTreePanel Settings Tree}
 * to display all available settings which are available for the user.
 */
Zarafa.settings.ui.SettingsAdvancedCategory = Ext.extend(Zarafa.settings.ui.SettingsCategory, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title : _('Advanced'),
			categoryIndex : 9999,
			iconCls : 'zarafa-settings-category-advanced',
			layout : 'fit',
			// scrolling is supplied by the treepanel
			autoScroll: false,
			items : [{
				xtype : 'zarafa.settingswidget',
				title : _('Advanced settings'),
				layout : 'fit',
				items : [{
					xtype : 'zarafa.settingstreepanel',
					ref : '../treePanel'
				}]
			}]
		});

		Zarafa.settings.ui.SettingsAdvancedCategory.superclass.constructor.call(this, config);
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategoryWidgetPanel widget panel}
	 * to load the latest version of the settings from the
	 * {@link Zarafa.settings.SettingsModel} into the UI of this category.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to load
	 */
	update : function(settingsModel)
	{
		Zarafa.settings.ui.SettingsAdvancedCategory.superclass.update.apply(this, arguments);

		this.treePanel.bindModel(settingsModel);
	}
});

Ext.reg('zarafa.settingsadvancedcategory', Zarafa.settings.ui.SettingsAdvancedCategory);
