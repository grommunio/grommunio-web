/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.files.settings');

/**
 * @class Grommunio.files.settings.SettingsAccountsWidget
 * @extends Grommunio.settings.ui.SettingsWidget
 * @xtype filesplugin.settingsaccountswidget
 *
 * The {@link Grommunio.settings.ui.SettingsWidget widget} for configuring
 * the general files options in the {@link Grommunio.files.settings.SettingsFilesCategory files category}.
 */
Grommunio.plugins.files.settings.SettingsAccountsWidget = Ext.extend(Grommunio.settings.ui.SettingsWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function (config) {
		config = config || {};

		Ext.applyIf(config, {
			title : _('Manage Accounts'),
			xtype : 'filesplugin.settingsaccountswidget',
			cls: 'grommunio-settings-widget k-settings-nogap',
			height: 400,
			layout: 'fit',
			items : [{
				xtype: "filesplugin.accountpanel",
				model : config.model,
				store : config.store
			}]
		});

		Grommunio.plugins.files.settings.SettingsAccountsWidget.superclass.constructor.call(this, config);
	}
});

Ext.reg('filesplugin.settingsaccountswidget', Grommunio.plugins.files.settings.SettingsAccountsWidget);
