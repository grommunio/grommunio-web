Ext.namespace('Grommunio.common.settings');

/**
 * @class Grommunio.common.settings.SettingsNotificationsCategory
 * @extends Grommunio.settings.ui.SettingsCategory
 * @xtype grommunio.settingsnotificationscategory
 *
 * The desktop notification settings category that will allow users to enable/disable desktop notifications
 */
Grommunio.common.settings.SettingsNotificationsCategory = Ext.extend(Grommunio.settings.ui.SettingsCategory, {
	// Insertion points for this class
	/**
	 * @insert context.settings.category.notifications
	 * Insertion point to register new {@link Grommunio.settings.ui.SettingsWidget widgets}
	 * for the {@link Grommunio.common.settings.SettingsNotificationsCategory SettingsNotificationsCategory}.
	 * @param {Grommunio.common.settings.SettingsNotificationsCategory} category The notification
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
			title: _('Notifications'),
			categoryIndex: 9996,
			xtype: 'grommunio.settingsnotificationscategory',
			iconCls: 'grommunio-settings-category-notifications',
			hidden: Ext.isIE,
			items: [{
					xtype: 'grommunio.settingsdesktopnotificationswidget',
					settingsContext: config.settingsContext
				},
				container.populateInsertionPoint('context.settings.category.notifications', this)
			]
		});

		Grommunio.common.settings.SettingsNotificationsCategory.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.settingsnotificationscategory', Grommunio.common.settings.SettingsNotificationsCategory);
