/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.passwd.settings');

/**
 * @class Grommunio.plugins.passwd.settings.SettingsPasswdCategory
 * @extends Grommunio.settings.ui.SettingsCategory
 * @xtype grommunio.settingspasswdcategory
 *
 * The passwd settings category that will allow users to change their passwords
 */
Grommunio.plugins.passwd.settings.SettingsPasswdCategory = Ext.extend(Grommunio.settings.ui.SettingsCategory, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title : _('Change Password'),
			categoryIndex : 9997,
			iconCls : 'grommunio-settings-category-passwd',
			xtype : 'grommunio.settingspasswdcategory',
			items : [{
				xtype : 'grommunio.settingspasswdwidget',
				settingsContext : config.settingsContext
			},
				container.populateInsertionPoint('context.settings.category.passwd', this)
			]
		});

		Grommunio.plugins.passwd.settings.SettingsPasswdCategory.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.settingspasswdcategory', Grommunio.plugins.passwd.settings.SettingsPasswdCategory);
