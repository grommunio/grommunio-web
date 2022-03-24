Ext.namespace('Zarafa.plugins.files.settings');

/**
 * @class Zarafa.files.settings.SettingsAccountsWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype filesplugin.settingsaccountswidget
 *
 * The {@link Zarafa.settings.ui.SettingsWidget widget} for configuring
 * the general files options in the {@link Zarafa.files.settings.SettingsFilesCategory files category}.
 */
Zarafa.plugins.files.settings.SettingsAccountsWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function (config) {
		config = config || {};

		Ext.applyIf(config, {
			title : dgettext('plugin_files', 'Manage Accounts'),
			xtype : 'filesplugin.settingsaccountswidget',
			height: 400,
			layout: 'fit',
			items : [{
				xtype: "filesplugin.accountpanel",
				model : config.model,
				store : config.store
			}]
		});

		Zarafa.plugins.files.settings.SettingsAccountsWidget.superclass.constructor.call(this, config);
	}
});

Ext.reg('filesplugin.settingsaccountswidget', Zarafa.plugins.files.settings.SettingsAccountsWidget);
