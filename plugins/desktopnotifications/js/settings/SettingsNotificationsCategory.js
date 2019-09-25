Ext.namespace('Zarafa.plugins.desktopnotifications.js.settings');

/**
 * @class Zarafa.plugins.desktopnotifications.js.settings.SettingsNotificationsCategory
 * @extends Zarafa.settings.ui.SettingsCategory
 * @xtype zarafa.settingspasswdcategory
 *
 * The desktop notification settings category that will allow users to enable/disable desktop notifications
 */
Zarafa.plugins.desktopnotifications.js.settings.SettingsNotificationsCategory = Ext.extend(Zarafa.settings.ui.SettingsCategory, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title : _('Desktop Notifications'),
			categoryIndex : 9996,
			xtype : 'zarafa.settingsdesktopnotificationscategory',
			iconCls : 'icon_desktopnotifications_settings',
			items : [{
				xtype : 'zarafa.settingsdesktopnotificationswidget',
				settingsContext : config.settingsContext
			}]
		});

		Zarafa.plugins.desktopnotifications.js.settings.SettingsNotificationsCategory.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.settingsdesktopnotificationscategory', Zarafa.plugins.desktopnotifications.js.settings.SettingsNotificationsCategory);
