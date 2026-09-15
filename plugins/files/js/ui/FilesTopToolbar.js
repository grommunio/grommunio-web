/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.files.ui');

/**
 * @class Grommunio.plugins.files.ui.FilesTopToolbar
 * @extends Ext.Toolbar
 * @xtype filesplugin.filestoptoolbar
 *
 * The top toolbar for the files explorer.
 */
Grommunio.plugins.files.ui.FilesTopToolbar = Ext.extend(Ext.Toolbar, {
	/**
	 * @cfg {Grommunio.core.Context} context The context to which this toolbar belongs
	 */
	context: undefined,

	/**
	 * The {@link Grommunio.plugins.files.FilesContextModel} which is obtained from the {@link #context}.
	 * @property
	 * @type Grommunio.plugins.files.FilesContextModel
	 */
	model: undefined,

	/**
	 * @constructor
	 * @param config
	 */
	constructor: function (config) {
		config = config || {};

		if (!Ext.isDefined(config.model) && Ext.isDefined(config.context)) {
			config.model = config.context.getModel();
		}

		Ext.applyIf(config, {
			cls: 'files_top_toolbar',
			items: [{
				xtype: 'filesplugin.navigationbar',
				model: config.model,
				accountsStore : config.context.getAccountsStore()
			}, {
				xtype: 'tbfill'
			}, {
				xtype: 'filesplugin.quotabar',
				model: config.model,
				accountsStore : config.context.getAccountsStore()
			}]
		});
		Grommunio.plugins.files.ui.FilesTopToolbar.superclass.constructor.call(this, config);
	}
});

Ext.reg('filesplugin.filestoptoolbar', Grommunio.plugins.files.ui.FilesTopToolbar);
