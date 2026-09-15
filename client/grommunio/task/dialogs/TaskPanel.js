/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.task.dialogs');

/**
 * @class Grommunio.task.dialogs.TaskPanel
 * @extends Ext.Panel
 * @xtype grommunio.taskpanel
 *
 * This class is used as wrapper class for all tabs, individual tab will have its own class,
 * extra tabs can be added using insertion point in this dialog.
 */
Grommunio.task.dialogs.TaskPanel = Ext.extend(Ext.Panel, {
	// Insertion points for this class
	/**
	 * @insert context.task.taskeditcontent.tabs
	 * can be used to add extra tabs to taskeditcontentpanel by 3rd party plugins
	 * @param {Grommunio.task.dialogs.TaskPanel} panel This panel
	 */

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor: function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			xtype: 'grommunio.taskpanel',
			bodyStyle: 'background-color: inherit;',
			border: false,
			layout: 'fit',
			items: this.createTabPanel()
		});

		Grommunio.task.dialogs.TaskPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Initialize {@link Ext.TabPanel tabpanel) that will contain all the fields and forms
	 * @return {Object} Configuration object for the form panel
	 * @private
	 */
	createTabPanel: function()
	{
		return [{
			xtype: 'tabpanel',
			activeTab: 0,
			layoutOnTabChange: true,
			border: false,
			items: [{
				xtype: 'grommunio.taskgeneraltab'
			},{
				xtype: 'grommunio.taskdetailtab'
			},
			container.populateInsertionPoint('context.task.taskcontentpanel.tabs', this)
			]
		}];
	}
});

Ext.reg('grommunio.taskpanel', Grommunio.task.dialogs.TaskPanel);
