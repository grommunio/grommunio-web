/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.calendar.dialogs');

/**
 * @class Grommunio.calendar.dialogs.ProposeNewTimeContentPanel
 * @extends Grommunio.core.ui.ContentPanel
 * @xtype grommunio.proposenewtimecontentpanel
 */
Grommunio.calendar.dialogs.ProposeNewTimeContentPanel = Ext.extend(Grommunio.core.ui.ContentPanel, {
	/**
	 * @cfg {Grommunio.core.ui.IPMRecord} record The record for which the
	 * propose new time panel is opened.
	 */
	record: undefined,

	/**
	 * @cfg {Boolean} autoSave Automatically save all changes on the
	 * {@link Grommunio.core.data.IPMRecord IPMRecord} to the
	 * {@link Grommunio.core.data.IPMStore IPMStore}.
	 */
	constructor: function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			// Override from Ext.Component
			xtype: 'grommunio.proposenewtimecontentpanel',
			layout: 'fit',
			title: _('Propose New Time'),
			width: 375,
			height: 200,
			recordComponentPluginConfig: Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite: true
			}),
			items: [{

				xtype: 'grommunio.proposenewtimepanel',
				record: config.record,
				ref: 'proposeNewTimePanel',
				buttons: [{
					text: _('Ok'),
					handler: this.onOk,
					scope: this
				},{
					text: _('Cancel'),
					handler: this.onCancel,
					scope: this
				}]
			}]
		});

		Grommunio.calendar.dialogs.ProposeNewTimeContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler which is raised when the user clicks the "Ok" {@link Ext.Button button}
	 * @private
	 */
	onOk: function()
	{
		this.proposeNewTimePanel.updateRecord(this.record);
		this.close();
	},

	/**
	 * Event handler which is raised when the user clicks the "Cancel" {@link Ext.Button button}
	 *
	 * This will close the panel.
	 * @private
	 */
	onCancel: function()
	{
		this.close();
	}
});

Ext.reg('grommunio.proposenewtimecontentpanel', Grommunio.calendar.dialogs.ProposeNewTimeContentPanel);
