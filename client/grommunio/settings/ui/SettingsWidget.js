/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.settings.ui');

/**
 * @class Grommunio.settings.ui.SettingsWidget
 * @extends Ext.Panel
 * @xtype grommunio.settingswidget
 *
 * A widget which is placed in a {@link Grommunio.settings.ui.SettingsCategory Settings Category}
 * and will be rendered into the {@link Grommunio.settings.ui.SettingContentPanel}. Each
 * widget is a collection of settings which logically belong to each other and allows the
 * user to edit them nicely.
 */
Grommunio.settings.ui.SettingsWidget = Ext.extend(Ext.Panel, {
	/**
	 * @cfg {Grommunio.settings.SettingsContext} settingsContext
	 */
	settingsContext: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			cls: 'grommunio-settings-widget',
			layout: 'form',
			labelWidth: 200
		});

		Grommunio.settings.ui.SettingsWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Called by the {@link Grommunio.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link grommunio.settings.ui.SettingsCategory#update}.
	 * This is used to load the latest version of the settings from the
	 * {@link Grommunio.settings.SettingsModel} into the UI of this category.
	 * @param {Grommunio.settings.SettingsModel} settingsModel The settings to load
	 */
	update: Ext.emptyFn,

	/**
	 * Called by the {@link Grommunio.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link grommunio.settings.ui.SettingsCategory#updateSettings}.
	 * This is used to update the settings from the UI into the {@link Grommunio.settings.SettingsModel settings model}.
	 * @param {Grommunio.settings.SettingsModel} settingsModel The settings to update
	 */
	updateSettings: Ext.emptyFn
});

Ext.reg('grommunio.settingswidget', Grommunio.settings.ui.SettingsWidget);
