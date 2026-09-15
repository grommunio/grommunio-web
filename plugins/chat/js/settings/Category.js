/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.chat.settings');

/**
 * @class Grommunio.plugins.chat.settings.Category
 * @extends Grommunio.settings.ui.SettingsCategory
 * @xtype grommunio.plugins.chat.settings.category
 */
Grommunio.plugins.chat.settings.Category = Ext.extend(Grommunio.settings.ui.SettingsCategory, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title : _('Chat'),
			categoryIndex : 12,
			iconCls : 'k-chat-settings-category',
			items : [{
				xtype : 'grommunio.plugins.chat.settings.generalsettingswidget'
			}]
		});

		Grommunio.plugins.chat.settings.Category.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.plugins.chat.settings.category', Grommunio.plugins.chat.settings.Category);
