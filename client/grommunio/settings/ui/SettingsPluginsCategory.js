Ext.namespace('Grommunio.settings.ui');

/**
 * @class Grommunio.settings.ui.SettingsPluginsCategory
 * @extends Grommunio.settings.ui.SettingsCategory
 * @xtype grommunio.settingspluginscategory
 *
 * The default available category for users which will
 * load the miscellaneous settings for the plugins. If plugins
 * don't wish to create a separate category, then they can
 * decide to only register a single widget to this common
 * Plugins category.
 */
Grommunio.settings.ui.SettingsPluginsCategory = Ext.extend(Grommunio.settings.ui.SettingsCategory, {
	// Insertion points for this class
	/**
	 * @insert context.settings.category.plugins
	 * Insertion point to register new {@link Grommunio.settings.ui.SettingsWidget widgets}
	 * for the {@link Grommunio.settings.ui.SettingsPluginsCategory Plugins Category}.
	 * @param {Grommunio.settings.ui.SettingsGeneralCategory} category The plugins
	 * category to which the widgets will be added.
	 */

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title: _('Plugins'),
			categoryIndex: 9998,
			iconCls: 'grommunio-settings-category-plugins',
			autoScroll: false,
			layout: {
				type: 'vbox',
				align: 'stretch',
				pack: 'start'
			},
			items: [
				{
					xtype: 'grommunio.settingspluginswidget',
					settingsContext: config.settingsContext,
					flex: 1
				},
				container.populateInsertionPoint('context.settings.category.plugins', this)
			]
		});

		Grommunio.settings.ui.SettingsPluginsCategory.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.settingspluginscategory', Grommunio.settings.ui.SettingsPluginsCategory);
