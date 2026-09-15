/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.calendar.data.busytime');

/**
 * @class Grommunio.calendar.data.busytime.BusyTimeStore
 * @extends Grommunio.core.data.MAPIStore
 * @xtype grommunio.busytimestore
 */
Grommunio.calendar.data.busytime.BusyTimeStore = Ext.extend(Grommunio.core.data.MAPIStore,
{
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			batch: true,
			autoSave: false,
			remoteSort: false,
			proxy: new Grommunio.calendar.data.busytime.BusyTimeProxy(),
			reader: new Ext.data.JsonReader({
				root: 'item'
			}, Grommunio.calendar.data.busytime.BusyTimeRecord)
		});
		Grommunio.calendar.data.busytime.BusyTimeStore.superclass.constructor.call(this, config);
	},

	/**
	 * Clear all data in the store
	 * @private
	 */
	clearData: function()
	{
		// Skip the superclass implementation.
		Grommunio.core.data.MAPIStore.superclass.clearData.apply(this, arguments);
	}
});

Ext.reg('grommunio.busytimestore', Grommunio.calendar.data.busytime.BusyTimeStore);
