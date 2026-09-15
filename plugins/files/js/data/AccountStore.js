/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.files.data');

/**
 * @class Grommunio.plugins.files.data.AccountStore
 * @extends Grommunio.core.data.ListModuleStore
 * @xtype filesplugin.accountstore
 *
 * This store will hold all Files accounts that a user owns.
 */
Grommunio.plugins.files.data.AccountStore = Ext.extend(Grommunio.core.data.ListModuleStore, {

	/**
	 * @constructor
	 */
	constructor: function (config)
	{
		config = Ext.applyIf(config || {}, {
			preferredMessageClass: 'IPM.FilesAccount',
			autoLoad: true,
			autoSave: true,
			defaultSortInfo: {
				field: 'account_sequence',
				direction: 'asc'
			}
		});

		Grommunio.plugins.files.data.AccountStore.superclass.constructor.call(this, config);

		this.addEvents(
			/**
			 * @event reorder
			 * Fires when order of a configured account is changed in
			 * {@link Grommunio.plugins.files.settings.ui.AccountGrid AccountGrid}
			 *
			 * @param {Grommunio.plugins.files.data.AccountRecord} firstAccount which reorder.
			 * @param {Grommunio.plugins.files.data.AccountRecord} secondAccount which reorder.
			 */
			'reorder'
		);
	}
});

Ext.reg('filesplugin.accountstore', Grommunio.plugins.files.data.AccountStore);