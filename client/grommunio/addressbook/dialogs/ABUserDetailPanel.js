/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.addressbook.dialogs');

/**
 * @class Grommunio.addressbook.dialogs.ABUserDetailPanel
 * @extends Ext.TabPanel
 * This class is used as wrapper class for all tabs, individual tab will have its own class
 * @xtype grommunio.abuserdetailpanel
 */
Grommunio.addressbook.dialogs.ABUserDetailPanel = Ext.extend(Ext.TabPanel,{
	// Insertion points for this class
	/**
	 * @insert context.addressbook.abuserdetailcontentpanel.tabs
	 * can be used to add extra tabs to addressbook user details dialog by 3rd party plugins
	 * @param {Grommunio.addressbook.dialogs.ABUserDetailPanel} panel This contactpanel
	 */

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'grommunio.abuserdetailpanel',
			border: false,
			activeTab: 0,
			items: [{
				xtype: 'grommunio.abusergeneraltab'
			}, {
				xtype: 'grommunio.abuserorganizationtab'
			},{
				xtype: 'grommunio.abuserphonetab'
			}, {
				xtype: 'grommunio.abmemberoftab'
			},{
				xtype: 'grommunio.abemailaddresstab'
			},
			// Add insertion point
			container.populateInsertionPoint('context.addressbook.abuserdetailcontentpanel.tabs', this)
			]
		});

		Grommunio.addressbook.dialogs.ABUserDetailPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.abuserdetailpanel', Grommunio.addressbook.dialogs.ABUserDetailPanel);
