Ext.namespace('Grommunio.plugins.chat.settings');

/**
 * @class Grommunio.plugins.chat.settings.GeneralSettingsWidget
 * @extends Grommunio.settings.ui.SettingsWidget
 * @xtype grommunio.plugins.chat.settings.generalsettingswidget
 */
Grommunio.plugins.chat.settings.GeneralSettingsWidget = Ext.extend(Grommunio.settings.ui.SettingsWidget, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			cls: 'chat-settings-panel grommunio-settings-widget',
			title: _('Chat'),
			items: [{
				xtype: 'checkbox',
				ref: 'autostart',
				hideLabel: true,
				boxLabel: _('Open Chat at start'),
				listeners: {
					check: this.onCheckAutoStart,
					scope: this
				}
			}]
		});

		Grommunio.plugins.chat.settings.GeneralSettingsWidget.superclass.constructor.call(this, config);
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
	 * Called by the {@link Grommunio.settings.ui.SettingsCategoryWidgetPanel widget panel}
	 * to load the latest version of the settings from the
	 * {@link Grommunio.settings.SettingsModel} into the UI of this category.
	 * @param {Grommunio.settings.SettingsModel} settingsModel The settings to load
	 */
	update : function(settingsModel)
	{
		this.updating = true;
		this.settingsModel = settingsModel;

		var autostart = settingsModel.get('grommunio/v1/plugins/chat/autostart')===true;
		this.autostart.setValue(autostart);

		this.updating = false;
	},

	/**
	 * Called by the {@link Grommunio.settings.ui.SettingsCategoryWidgetPanel widget panel}
	 * to update the settings from the UI into the {@link Grommunio.settings.SettingsModel settings model}.
	 * @param {Grommunio.settings.SettingsModel} settingsModel The settings to update
	 */
	updateSettings : function(settingsModel)
	{
		settingsModel.set('grommunio/v1/plugins/chat/autostart', this.autostart.getValue());
	}
});

Ext.reg('grommunio.plugins.chat.settings.generalsettingswidget', Grommunio.plugins.chat.settings.GeneralSettingsWidget);
