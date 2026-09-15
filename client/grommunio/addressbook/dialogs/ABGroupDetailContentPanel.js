/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.addressbook.dialogs');

/**
 * @class Grommunio.addressbook.dialogs.ABGroupContentPanel
 * @extends Grommunio.core.ui.RecordContentPanel
 * @xtype grommunio.abgroupdetailcontentpanel
 *
 * This class will be used to create a content panel for showing userGroups/Company,
 */
Grommunio.addressbook.dialogs.ABGroupDetailContentPanel = Ext.extend(Grommunio.core.ui.RecordContentPanel, {

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype	: 'grommunio.abgroupdetailcontentpanel',
			layout	: 'fit',
			border	: false,
			title: _('Group details'),
			items: [{
				xtype: 'grommunio.abgroupdetailpanel'
			}]
		});

		Grommunio.addressbook.dialogs.ABGroupDetailContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Update the {@link Ext.Panel Panel} with the given {@link Grommunio.core.data.IPMRecord IPMRecord}
	 * @param {Grommunio.core.data.IPMRecord} record The record to update the panel with
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update: function(record, contentReset)
	{
		this.updateTitleFromRecord(this.record);
	},

	/**
	 * When record has been updated, title also has to be - for instance if we have the subject
	 * in the title and the subject changes
	 * Calls {@link #setTitle} this.setTitle in order to update
	 * @param {Grommunio.core.data.MAPIRecord} record The record that has been updated
	 */
	updateTitleFromRecord: function(record)
	{
		var display_name = record.get('display_name');
		if(!Ext.isEmpty(display_name)){
			this.setTitle(display_name);
		} else {
			this.setTitle(this.initialConfig.title);
		}
	}
});

// register content panel
Ext.reg('grommunio.abgroupdetailcontentpanel', Grommunio.addressbook.dialogs.ABGroupDetailContentPanel);
