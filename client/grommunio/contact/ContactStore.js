/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.contact');

/**
 * @class Grommunio.contact.ContactStore
 * @extends Grommunio.core.data.ListModuleStore
 * @xtype grommunio.contactstore
 *
 * this will contain all records fetched from the server side code
 */
Grommunio.contact.ContactStore = Ext.extend(Grommunio.core.data.ListModuleStore, {
	/**
	 * @constructor
	 * @param {Object} config configuration params that should be used to create instance of this store.
	 */
	constructor: function(config)
	{
		config = config || {};

		// Apply default settings.
		Ext.applyIf(config, {
			preferredMessageClass: 'IPM.Contact',
			defaultSortInfo: {
				field: 'fileas',
				direction: 'desc'
			}
		});

		Grommunio.contact.ContactStore.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.contactstore', Grommunio.contact.ContactStore);
