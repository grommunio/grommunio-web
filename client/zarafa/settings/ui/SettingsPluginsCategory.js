Ext.namespace('Zarafa.settings.ui');

/**
 * @class Zarafa.settings.ui.SettingsPluginsCategory
 * @extends Zarafa.settings.ui.SettingsCategory
 * @xtype zarafa.settingspluginscategory
 *
 * The default available category for users which will
 * load the miscelaneous settings for the plugins. If plugins
 * don't wish to create a separate category, then they can
 * decide to only register a single widget to this common
 * Plugins category.
 */
Zarafa.settings.ui.SettingsPluginsCategory = Ext.extend(Zarafa.settings.ui.SettingsCategory, {
	// Insertion points for this class
	/**
	 * @insert context.settings.category.plugins
	 * Insertion point to register new {@link Zarafa.settings.ui.SettingsWidget widgets}
	 * for the {@link Zarafa.settings.ui.SettingsPluginsCategory Plugins Category}.
	 * @param {Zarafa.settings.ui.SettingsGeneralCategory} category The plugins
	 * category to which the widgets will be added.
	 */

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title : _('Plugins'),
			categoryIndex : 9998,
			iconCls : 'zarafa-settings-category-plugins',
			items : [{
				xtype : 'zarafa.settingspluginswidget',
				settingsContext : config.settingsContext
			}, container.populateInsertionPoint('context.settings.category.plugins', this)
			]
		});

		Zarafa.settings.ui.SettingsPluginsCategory.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.settingspluginscategory', Zarafa.settings.ui.SettingsPluginsCategory);
