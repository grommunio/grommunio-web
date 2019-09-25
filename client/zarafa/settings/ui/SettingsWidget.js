Ext.namespace('Zarafa.settings.ui');

/**
 * @class Zarafa.settings.ui.SettingsWidget
 * @extends Ext.Panel
 * @xtype zarafa.settingswidget
 *
 * A widget which is placed in a {@link Zarafa.settings.ui.SettingsCategory Settings Category}
 * and will be rendered into the {@link Zarafa.settings.ui.SettingContentPanel}. Each
 * widget is a collection of settings which logically belong to eachother and allows the
 * user to edit them nicely.
 */
Zarafa.settings.ui.SettingsWidget = Ext.extend(Ext.Panel, {
	/**
	 * @cfg {Zarafa.settings.SettingsContext} settingsContext
	 */
	settingsContext : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			cls : 'zarafa-settings-widget',
			layout : 'form',
			labelWidth : 200
		});

		Zarafa.settings.ui.SettingsWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link zarafa.settings.ui.SettingsCategory#update}.
	 * This is used to load the latest version of the settings from the
	 * {@link Zarafa.settings.SettingsModel} into the UI of this category.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to load
	 */
	update : Ext.emptyFn,

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link zarafa.settings.ui.SettingsCategory#updateSettings}.
	 * This is used to update the settings from the UI into the {@link Zarafa.settings.SettingsModel settings model}.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to update
	 */
	updateSettings : Ext.emptyFn
});

Ext.reg('zarafa.settingswidget', Zarafa.settings.ui.SettingsWidget);
