/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.addressbook.dialogs');

/**
 * @class Grommunio.addressbook.dialogs.ABGroupGeneralTab
 * @extends Ext.form.FormPanel
 * @xtype grommunio.abgroupgeneraltab
 *
 * This class is used to create layout of general tab in tab panel.
 */
Grommunio.addressbook.dialogs.ABGroupGeneralTab = Ext.extend(Ext.form.FormPanel, {

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
			xtype: 'grommunio.abgroupgeneraltab',
			title: _('General'),
			layout: 'column',
			autoScroll: true,
			bodyStyle: 'padding: 5px;',
			defaults: {
				border: false,
				style: 'padding: 2px 5px; margin: 0;'
			},
			items: [
				this.createNameFieldset(),
				this.createMembersFieldset()
			]
		});

		Grommunio.addressbook.dialogs.ABGroupGeneralTab.superclass.constructor.call(this, config);
	},

	/**
	 * Creates fieldset for general tab of tab panel.
	 * @return {Object} config object for creating {@link Ext.form.FieldSet FieldSet}.
	 * @private
	 */
	createNameFieldset: function()
	{
		return {
			xtype: 'panel',
			columnWidth: 0.5,
			layout: 'form',
			items: [{
				xtype: 'textfield',
				fieldLabel: _('Display Name'),
				name: 'display_name',
				anchor: '100%',
				readOnly: true
			},{
				xtype: 'textfield',
				fieldLabel: _('Alias'),
				name: 'account',
				anchor: '100%',
				readOnly: true
			},{
				xtype: 'displayfield',
				value: Grommunio.util.Translations.Label(_('Notes')),
				hideLabel: true
			},{
				xtype: 'textarea',
				hideLabel: true,
				fieldLabel: _('Notes'),
				name: 'comment',
				anchor: '100%',
				height: 120,
				readOnly: true
			}]
		};
	},

	/**
	 * Creates fieldset for general tab of tab panel.
	 * @return {Object} config object for creating {@link Ext.form.FieldSet FieldSet}.
	 * @private
	 */
	createMembersFieldset: function()
	{
		return {
			xtype: 'panel',
			columnWidth: 0.5,
			layout: 'fit',
			title: _('Members'),
			items: [{
				xtype: 'grommunio.abitemgrid',
				height: 250,
				ref: '../groupMembersList'
			}]
		};
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

		var membersSubStore = record.getSubStore('members');
		if (membersSubStore && this.groupMembersList.getStore() !== membersSubStore) {
			this.groupMembersList.reconfigure(membersSubStore, this.groupMembersList.getColumnModel());
		}
	}
});

Ext.reg('grommunio.abgroupgeneraltab', Grommunio.addressbook.dialogs.ABGroupGeneralTab);
