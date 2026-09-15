/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.addressbook.dialogs');

/**
 * @class Grommunio.addressbook.dialogs.AddressBookContentPanel
 * @extends Grommunio.core.ui.RecordContentPanel
 * @xtype addressbook.addressbookcontentpanel
 */
Grommunio.addressbook.dialogs.AddressBookContentPanel = Ext.extend(Grommunio.core.ui.ContentPanel, {
	/**
	 * @cfg (Boolean) Set to true to hide contacts folders in the address book
	 * hierarchy dropdown.
	 */
	hideContactsFolders: false,

	/**
	 * @cfg {Object} listRestriction The default restriction which
	 * must be send to the server side when obtaining a fresh list
	 * from the server. This can be used to restrict the visibility
	 * of users, groups, companies etc.
	 */
	listRestriction: undefined,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'grommunio.addressbookcontentpanel',
			layout: 'fit',
			cls: 'k-addressbookcontentpanel',
			title: _('Address Book'),
			width: 1000,
			items: [{
				xtype: 'grommunio.addressbookpanel',
				hideContactsFolders: config.hideContactsFolders,
				listRestriction: config.listRestriction
			}]
		});

		// Call parent constructor
		Grommunio.addressbook.dialogs.AddressBookContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.addressbookcontentpanel', Grommunio.addressbook.dialogs.AddressBookContentPanel);
