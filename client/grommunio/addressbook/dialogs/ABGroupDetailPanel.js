/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.addressbook.dialogs');

/**
 * @class Grommunio.addressbook.dialogs.ABGroupDetailPanel
 * @extends Ext.TabPanel
 * @xtype grommunio.abgroupdetailpanel
 */
Grommunio.addressbook.dialogs.ABGroupDetailPanel = Ext.extend(Ext.TabPanel, {
	// Insertion points for this class
	/**
	 * @insert context.addressbook.abgroupdetailcontentpanel.tabs
	 * can be used to add extra tabs to addressbook group details dialog by 3rd party plugins
	 * @param {Grommunio.addressbook.dialogs.ABGroupDetailPanel} panel This contactpanel
	 */

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'grommunio.abgroupdetailpanel',
			border: false,
			activeTab: 0,
			items: [{
				xtype: 'grommunio.abgroupgeneraltab'
			}, {
				xtype: 'grommunio.abmemberoftab'
			},{
				xtype: 'grommunio.abemailaddresstab'
			},
			// Add insertion point
			container.populateInsertionPoint('context.addressbook.abgroupdetailcontentpanel.tabs', this)
			]
		});

		Grommunio.addressbook.dialogs.ABGroupDetailPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.abgroupdetailpanel', Grommunio.addressbook.dialogs.ABGroupDetailPanel);
