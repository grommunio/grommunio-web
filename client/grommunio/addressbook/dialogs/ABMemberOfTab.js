/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.addressbook.dialogs');

/**
 * @class Grommunio.addressbook.dialogs.ABMemberOfTab
 * @extends Ext.form.FormPanel
 * @xtype grommunio.abmemberoftab
 *
 * This class is used to create layout of MemberOf tab panel.
 */
Grommunio.addressbook.dialogs.ABMemberOfTab = Ext.extend(Ext.form.FormPanel, {
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
			xtype: 'grommunio.abmemberoftab',
			title: _('Member Of'),
			bodyStyle: 'padding: 5px;',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items: [{
				xtype: 'fieldset',
				title: _('Group Membership'),
				border: true,
				cls: 'grommunio-fieldset',
				flex: 1,
				layout: 'fit',
				items: [{
					xtype: 'grommunio.abitemgrid',
					ref: '../memberOfList'
				}]
			}]
		});

		Grommunio.addressbook.dialogs.ABMemberOfTab.superclass.constructor.call(this, config);
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
		var memberOfSubStore = record.getSubStore('ems_ab_is_member_of_dl');
		if (memberOfSubStore && this.memberOfList.getStore() !== memberOfSubStore) {
			this.memberOfList.reconfigure(memberOfSubStore, this.memberOfList.getColumnModel());
		}
	}
});

Ext.reg('grommunio.abmemberoftab', Grommunio.addressbook.dialogs.ABMemberOfTab);
