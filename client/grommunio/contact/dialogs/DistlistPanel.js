/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.contact.dialogs');

/**
 * @class Grommunio.contact.dialogs.DistlistPanel
 * @extends Ext.Panel
 * @xtype grommunio.distlistpanel
 */
Grommunio.contact.dialogs.DistlistPanel = Ext.extend(Ext.Panel, {
	// Insertion points for this class
	/**
	 * @insert context.contact.distlistcontentpanel.tabs
	 * can be used to add extra tabs to distlistcontentpanel by 3rd party plugins
	 * @param {Grommunio.contact.dialogs.DistlistPanel} panel This panel
	 */

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'grommunio.distlistpanel',
			border: false,
			layout: 'fit',
			items: this.createFormPanel()
		});

		Grommunio.contact.dialogs.DistlistPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Function will create form panel and will add tabs in view.
	 * distlistmemberstab and distlistnotestab will be added.
	 */
	createFormPanel: function()
	{
		return [{
				xtype: 'tabpanel',
				activeTab: 0,
				border: false,
				defaults: {
					autoHeight: false,		// autoScroll won't work if height is auto
					frame: true
				},
				items:[{
						xtype: 'grommunio.distlistmemberstab'
					}, {
						xtype: 'grommunio.distlistnotestab',
						autoScroll: false
					},
					container.populateInsertionPoint('context.contact.distlistcontentpanel.tabs', this)
				]
		}];
	}
});

Ext.reg('grommunio.distlistpanel', Grommunio.contact.dialogs.DistlistPanel);
