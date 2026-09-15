/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.desktopnotifications');

/**
 * @class Grommunio.plugins.desktopnotifications.DesktopNotificationsPlugin
 * @extends Grommunio.core.Plugin
 * This class is used for adding files from the users's Dropbox folder
 * to his emails as attachments
 */
Grommunio.plugins.desktopnotifications.DesktopNotificationsPlugin = Ext.extend(Grommunio.core.Plugin, {
	/**
	 * initialises insertion point for plugin
	 * @protected
	 */
	initPlugin : function()
	{	
		Grommunio.plugins.desktopnotifications.DesktopNotificationsPlugin.superclass.initPlugin.apply(this, arguments);

		this.registerInsertionPoint('context.settings.categories', this.createSettingsCategory, this);
	},

	/**
	 * Return the instance of {@link Grommunio.plugins.desktopnotifications.js.settings.SettingsDesktopNotificationsCategory SettingsDesktopNotificationsCategory}.
	 *
	 * @return {Grommunio.plugins.desktopnotifications.js.settings.SettingsDesktopNotificationsCategory} An instance of the settings category
	 * @private
	 */
	createSettingsCategory : function()
	{
		return {
			xtype : 'grommunio.settingsdesktopnotificationscategory',
			plugin : this
		};
	}
});

Grommunio.onReady(function() {
	container.registerPlugin(new Grommunio.core.PluginMetaData({
		name : 'desktopnotifications',
		displayName : _('Desktop Notifications Plugin'),
		about : Grommunio.plugins.desktopnotifications.ABOUT,
		pluginConstructor : Grommunio.plugins.desktopnotifications.DesktopNotificationsPlugin
	}));
});
