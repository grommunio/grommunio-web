/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.archive.ui');

/**
 * @class Grommunio.plugins.archive.ui.ContentPanel
 * @extends Grommunio.core.ui.ContentPanel
 */
Grommunio.plugins.archive.ui.ContentPanel = Ext.extend(Grommunio.core.ui.ContentPanel, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// Overridden from Ext.Component
			xtype: 'grommunio.plugins.archive.ui.contentpanel',
			layout : 'fit',
			iconCls: 'icon_archive',
			border: false,
			items : [{
				xtype: 'grommunio.plugins.archive.ui.panel',
				url: config.url,
				tabOrder: config.tabOrder
			}]
		});

		Grommunio.plugins.archive.ui.ContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.plugins.archive.ui.contentpanel', Grommunio.plugins.archive.ui.ContentPanel);
