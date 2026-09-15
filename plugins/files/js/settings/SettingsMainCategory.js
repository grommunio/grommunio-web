/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.files.settings');

/**
 * @class Grommunio.plugins.files.settings.SettingsMainCategory
 * @extends Grommunio.settings.ui.SettingsCategory
 * @xtype filesplugin.settingsmaincategory
 *
 * The files category for users which will
 * allow the user to configure Files related settings
 */
Grommunio.plugins.files.settings.SettingsMainCategory = Ext.extend(Grommunio.settings.ui.SettingsCategory, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function (config) {
		config = config || {};

		Ext.applyIf(config, {
			title        : _('Files'),
			categoryIndex: 1,
			iconCls      : 'icon_files_category',
			items        : [{
				xtype: 'filesplugin.settingsaccountswidget',
				model : config.model,
				store : config.store
			}, {
				xtype: 'filesplugin.settingsresetwidget'
			},
				container.populateInsertionPoint('context.settings.category.files', this)
			]
		});

		Grommunio.plugins.files.settings.SettingsMainCategory.superclass.constructor.call(this, config);
	}
});

Ext.reg('filesplugin.settingsmaincategory', Grommunio.plugins.files.settings.SettingsMainCategory);
