/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.settings.ui');

/**
 * @class Grommunio.settings.ui.SettingsCopyrightWidget
 * @extends Grommunio.settings.ui.SettingsWidget
 * @xtype grommunio.settingscopyrightwidget
 *
 * The grommunio Web copyright notice widget
 */
Grommunio.settings.ui.SettingsCopyrightWidget = Ext.extend(Grommunio.settings.ui.SettingsWidget, {

	/**
	 * @cfg {String} about The Copyright notice which must be displayed by this widget.
	 * Defaults to {@link Grommunio#ABOUT}
	 */
	about: Grommunio.ABOUT,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title : _('grommunio Web'),
			layout: 'form',
			items: [{
				xtype: 'displayfield',
				cls: 'grommunio-settings-about-text',
				value: config.about || this.about,
				hideLabel: true,
				htmlEncode: false
			}]
		});

		Grommunio.settings.ui.SettingsCopyrightWidget.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.settingscopyrightwidget', Grommunio.settings.ui.SettingsCopyrightWidget);
