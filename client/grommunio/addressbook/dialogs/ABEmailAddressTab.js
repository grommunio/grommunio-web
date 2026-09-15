/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.addressbook.dialogs');

/**
 * @class Grommunio.addressbook.dialogs.ABEmailAddressTab
 * @extends Ext.form.FormPanel
 * @xtype grommunio.abemailaddresstab
 *
 * This class is used to create layout of email address tab panel.
 */
Grommunio.addressbook.dialogs.ABEmailAddressTab = Ext.extend(Ext.form.FormPanel, {
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
			xtype: 'grommunio.abemailaddresstab',
			title: _('Email Addresses'),
			bodyStyle: 'padding: 5px;',
			layout: {
				type: 'vbox',
				pack: 'start',
				align: 'stretch'
			},
			items: [{
				xtype: 'fieldset',
				title: _('Email addresses'),
				border: true,
				cls: 'grommunio-fieldset',
				flex: 1,
				layout: 'fit',
				items: [{
					xtype: 'grid',
					ref: '../emailList',
					store: new Ext.data.JsonStore({
						fields: ['address'],
						root: 'item'
					}),
					border: true,
					hideHeaders: false,
					columns: [{
						header: _('Email Address'),
						dataIndex: 'address',
						sortable: true,
						renderer: function(value) {
							if (value && value.indexOf(':') !== -1) {
								return Ext.util.Format.htmlEncode(value.substring(value.indexOf(':') + 1));
							}
							return Ext.util.Format.htmlEncode(value || '');
						}
					}],
					viewConfig: {
						forceFit: true
					}
				}]
			}]
		});

		Grommunio.addressbook.dialogs.ABEmailAddressTab.superclass.constructor.call(this, config);
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

		var proxyAddressSubStore = record.getSubStore('ems_ab_proxy_addresses');
		if (proxyAddressSubStore && this.emailList.getStore() !== proxyAddressSubStore) {
			this.emailList.reconfigure(proxyAddressSubStore, this.emailList.getColumnModel());
		}
	}
});

Ext.reg('grommunio.abemailaddresstab', Grommunio.addressbook.dialogs.ABEmailAddressTab);
