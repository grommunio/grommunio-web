/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.desktopnotifications.js.settings');

/**
 * @class Grommunio.plugins.desktopnotifications.js.settings.SettingsNotificationsCategory
 * @extends Grommunio.settings.ui.SettingsCategory
 * @xtype grommunio.settingspasswdcategory
 *
 * The desktop notification settings category that will allow users to enable/disable desktop notifications
 */
Grommunio.plugins.desktopnotifications.js.settings.SettingsNotificationsCategory = Ext.extend(Grommunio.settings.ui.SettingsCategory, {
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
			xtype : 'grommunio.settingsdesktopnotificationscategory',
			iconCls : 'icon_desktopnotifications_settings',
			items : [{
				xtype : 'grommunio.settingsdesktopnotificationswidget',
				settingsContext : config.settingsContext
			}]
		});

		Grommunio.plugins.desktopnotifications.js.settings.SettingsNotificationsCategory.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.settingsdesktopnotificationscategory', Grommunio.plugins.desktopnotifications.js.settings.SettingsNotificationsCategory);
