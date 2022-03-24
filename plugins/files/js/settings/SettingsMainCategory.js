Ext.namespace('Zarafa.plugins.files.settings');

/**
 * @class Zarafa.plugins.files.settings.SettingsMainCategory
 * @extends Zarafa.settings.ui.SettingsCategory
 * @xtype filesplugin.settingsmaincategory
 *
 * The files category for users which will
 * allow the user to configure Files related settings
 */
Zarafa.plugins.files.settings.SettingsMainCategory = Ext.extend(Zarafa.settings.ui.SettingsCategory, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function (config) {
		config = config || {};

		Ext.applyIf(config, {
			title        : dgettext('plugin_files', 'Files'),
			categoryIndex: 1,
			iconCls      : 'icon_files_category',
			items        : [{
				xtype: 'filesplugin.settingsaccountswidget',
				model : config.model,
				store : config.store
			}, {
				xtype: 'filesplugin.settingsresetwidget'
			},
				container.populateInsertionPoint('context.settings.category.files', this)
			]
		});

		Zarafa.plugins.files.settings.SettingsMainCategory.superclass.constructor.call(this, config);
	}
});

Ext.reg('filesplugin.settingsmaincategory', Zarafa.plugins.files.settings.SettingsMainCategory);
