/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.files.settings.ui');

/**
 * @class Grommunio.plugins.files.settings.ui.AccountEditContentPanel
 * @extends Grommunio.core.ui.ContentPanel
 * @xtype filesplugin.accounteditcontentpanel
 */
Grommunio.plugins.files.settings.ui.AccountEditContentPanel = Ext.extend(Grommunio.core.ui.ContentPanel, {

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function (config) {
		config = config || {};

		Ext.applyIf(config, {

			xtype: 'filesplugin.accounteditcontentpanel',

			layout: 'fit',
			modal: true,
			width: 520,
			height: 300,
			stateful: false,
			title: _('Edit Account'),
			items: [{
				xtype: 'filesplugin.accounteditpanel',
				item: config.item,
				backendStore : config.backendStore
			}]
		});

		Grommunio.plugins.files.settings.ui.AccountEditContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('filesplugin.accounteditcontentpanel', Grommunio.plugins.files.settings.ui.AccountEditContentPanel);