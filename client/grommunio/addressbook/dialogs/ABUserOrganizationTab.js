/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.addressbook.dialogs');

/**
 * @class Grommunio.addressbook.dialogs.ABUserOrganizationTab
 * @extends Ext.form.FormPanel
 * @xtype grommunio.abuserorganizationtab
 *
 * This class is used to create layout of Organization tab of tab panel.
 */
Grommunio.addressbook.dialogs.ABUserOrganizationTab = Ext.extend(Ext.form.FormPanel, {
	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor: function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('grommunio.recordcomponentupdaterplugin');

		Ext.applyIf(config, {
			xtype: 'grommunio.abuserorganizationtab',
			title: _('Organization'),
			selModel: this.initSelectionModel(),
			bodyStyle: 'padding: 5px;',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			autoScroll: true,
			items: [{
				xtype: 'fieldset',
				title: _('Manager'),
				border: true,
				cls: 'grommunio-fieldset',
				flex: 1,
				layout: 'fit',
				items: [{
					xtype: 'grommunio.abitemgrid',
					ref: '../managerList'
				}]
			},{
				xtype: 'fieldset',
				title: _('Direct reports'),
				border: true,
				cls: 'grommunio-fieldset',
				flex: 1,
				layout: 'fit',
				items: [{
					xtype: 'grommunio.abitemgrid',
					ref: '../reportList'
				}]
			}]
		});

		Grommunio.addressbook.dialogs.ABUserOrganizationTab.superclass.constructor.call(this, config);
	},

	/**
	 * creates and returns a selection model object, used in {@link Ext.grid.GridPanel.selModel selModel} config
	 * @return {Ext.grid.RowSelectionModel} selection model object
	 * @private
	 */
	initSelectionModel: function()
	{
		return new Ext.grid.RowSelectionModel({
			singleSelect: false
		});
	},

	/**
	 * Function is used to update values of form fields when ever
	 * an updated {@link Grommunio.core.data.MAPIRecord record} is received
	 * @param {Grommunio.core.data.MAPIRecord} record The record update the panel with.
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 * @private
	 */
	update: function(record, contentReset)
	{
		this.getForm().loadRecord(record);
		var managerSubStore = record.getSubStore('ems_ab_manager');
		if (managerSubStore && this.managerList.getStore() !== managerSubStore) {
			this.managerList.reconfigure(managerSubStore, this.managerList.getColumnModel());
		}

		var reportsSubStore = record.getSubStore('ems_ab_reports');
		if (reportsSubStore && this.reportList.getStore() !== reportsSubStore) {
			this.reportList.reconfigure(reportsSubStore, this.reportList.getColumnModel());
		}
	}
});

Ext.reg('grommunio.abuserorganizationtab', Grommunio.addressbook.dialogs.ABUserOrganizationTab);
