Ext.namespace('Zarafa.common.settings');

/**
 * @class Zarafa.common.settings.SettingsNotificationsCategory
 * @extends Zarafa.settings.ui.SettingsCategory
 * @xtype zarafa.settingsnotificationscategory
 *
 * The desktop notification settings category that will allow users to enable/disable desktop notifications
 */
Zarafa.common.settings.SettingsNotificationsCategory = Ext.extend(Zarafa.settings.ui.SettingsCategory, {
	// Insertion points for this class
	/**
	 * @insert context.settings.category.notifications
	 * Insertion point to register new {@link Zarafa.settings.ui.SettingsWidget widgets}
	 * for the {@link Zarafa.common.settings.SettingsNotificationsCategory SettingsNotificationsCategory}.
	 * @param {Zarafa.common.settings.SettingsNotificationsCategory} category The notification
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
			xtype: 'zarafa.settingsnotificationscategory',
			iconCls: 'zarafa-settings-category-notifications',
			hidden: Ext.isIE,
			items: [{
					xtype: 'zarafa.settingsdesktopnotificationswidget',
					settingsContext: config.settingsContext
				},
				container.populateInsertionPoint('context.settings.category.notifications', this)
			]
		});

		Zarafa.common.settings.SettingsNotificationsCategory.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.settingsnotificationscategory', Zarafa.common.settings.SettingsNotificationsCategory);
