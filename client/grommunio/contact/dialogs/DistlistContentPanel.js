/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.contact.dialogs');

/**
 * @class Grommunio.contact.dialogs.DistlistContentPanel
 * @extends Grommunio.core.ui.RecordContentPanel
 * @xtype grommunio.distlistcontentpanel
 *
 * this class will be used to create a distlist contentpanel
 */
Grommunio.contact.dialogs.DistlistContentPanel = Ext.extend(Grommunio.core.ui.RecordContentPanel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			layout: 'fit',
			xtype: 'grommunio.distlistcontentpanel',
			title: _('Distribution List'),
			recordComponentPluginConfig: Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite: true
			}),
			confirmClose: true,
			closeOnSave: true,
			items: [ this.createPanel() ]
		});

		Grommunio.contact.dialogs.DistlistContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Add the main Window Panel to the dialog.
	 * This will contain a {@link Grommunio.core.ui.ContentPanelToolbar ContentPanelToolbar}
	 * and a {@link Grommunio.contact.dialogs.DistListPanel DistListPanel}.
	 * @return {Object} configuration object for the panel.
	 * @private
	 */
	createPanel: function()
	{
		// Create a new panel and add it.
		return {
			xtype: 'grommunio.distlistpanel',
			tbar: {
				xtype: 'grommunio.distlistcontentpaneltoolbar'
			}
		};
	},

	/**
	 * Update the {@link Ext.Panel Panel} with the given {@link Grommunio.core.data.IPMRecord IPMRecord}
	 * @param {Grommunio.core.data.IPMRecord} record The record to update the panel with
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update: function(record, contentReset)
	{
		if(contentReset){
			this.updateIconFromRecord(record);
		}
		this.updateTitleFromRecord(record);
	},

	/**
	 * Update this panel's icon class from the record that it contains
	 * First obtains the icon class from a mapping, then calls {@link #setIcon}
	 *
	 * @param {Grommunio.core.data.MAPIRecord} record The record bound to this component
	 * @private
	 */
	updateIconFromRecord: function(record)
	{
		//TODO: create a new icon mapping for tabs
		var iconCls = Grommunio.common.ui.IconClass.getIconClass(record);
		this.setIcon(iconCls);
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
		if(!Ext.isEmpty(display_name)) {
			this.setTitle(display_name);
		} else {
			this.setTitle(this.initialConfig.title);
		}
	}
});

// register panel
Ext.reg('grommunio.distlistcontentpanel', Grommunio.contact.dialogs.DistlistContentPanel);
