Ext.namespace('Zarafa.plugins.chat.settings');

/**
 * @class Zarafa.plugins.chat.settings.GeneralSettingsWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.plugins.chat.settings.generalsettingswidget
 */
Zarafa.plugins.chat.settings.GeneralSettingsWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			cls: 'chat-settings-panel zarafa-settings-widget',
			title: 'Chat',
			items: [{
				xtype: 'checkbox',
				ref: 'autostart',
				hideLabel: true,
				boxLabel: _('Open Chat at start', 'plugin_chat'),
				listeners: {
					check: this.onCheckAutoStart,
					scope: this
				}
			}]
		});

		Zarafa.plugins.chat.settings.GeneralSettingsWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler for the check event of the autostart checkbox.
	 *
	 * @param {Ext.form.Checkbox} checkbox The autostart checkbox
	 * @param {Boolean} checked True if the checkbox is checked, false otherwise
	 */
	onCheckAutoStart : function(checkbox, checked)
	{
		if ( !this.updating ){
			this.updateSettings(this.settingsModel);
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
		this.updating = true;
		this.settingsModel = settingsModel;

		var autostart = settingsModel.get('zarafa/v1/plugins/chat/autostart')===true;
		this.autostart.setValue(autostart);

		this.updating = false;
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategoryWidgetPanel widget panel}
	 * to update the settings from the UI into the {@link Zarafa.settings.SettingsModel settings model}.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to update
	 */
	updateSettings : function(settingsModel)
	{
		settingsModel.set('zarafa/v1/plugins/chat/autostart', this.autostart.getValue());
	}
});

Ext.reg('zarafa.plugins.chat.settings.generalsettingswidget', Zarafa.plugins.chat.settings.GeneralSettingsWidget);
