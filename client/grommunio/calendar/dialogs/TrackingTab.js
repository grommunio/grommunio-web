/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.calendar.dialogs');

/**
 * @class Grommunio.calendar.dialogs.TrackingTab
 * @extends Ext.Panel
 * @xtype grommunio.trackingtab
 *
 * TrackingTab tab in the {@link Grommunio.calendar.dialogs.AppointmentPanel}
 * that is used to keep track of responses from attendees for Meeting Requests.
 */
Grommunio.calendar.dialogs.TrackingTab = Ext.extend(Ext.Panel, {
	/**
	 * @constructor
	 * @param {Object} config
	 */
	constructor: function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('grommunio.recordcomponentupdaterplugin');

		Ext.applyIf(config, {
			xtype: 'grommunio.trackingtab',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			cls: 'k-trackingtab',
			border: false,
			items: [{
				xtype: 'displayfield',
				height: 36,
				value: _('The following responses for this meeting have been received') + ':',
				hideLabel: true
			},{
				xtype: 'grid',
				ref: 'responseTrackList',
				flex: 1,
				store: new Grommunio.core.data.IPMRecipientStore(),
				viewConfig: {
					forceFit: true
				},
				columns: [{
					dataIndex: 'display_name',
					header: _('Name'),
					renderer: Ext.util.Format.htmlEncode,
					sortable: true
				},{
					dataIndex: 'recipient_type',
					header: _('Attendance'),
					sortable: true,
					renderer: Grommunio.common.ui.grid.Renderers.recipienttype
				},{
					dataIndex: 'recipient_trackstatus',
					header: _('Response'),
					sortable: true,
					renderer: Grommunio.common.ui.grid.Renderers.responsestatus
				}]
			}]
		});

		Grommunio.calendar.dialogs.TrackingTab.superclass.constructor.call(this, config);
	},

	/**
	 * Update the {@link Ext.Panel Panel} with the given {@link Grommunio.core.data.IPMRecord IPMRecord}
	 * It will also build the attendee tracking data and pass it to the store
	 * @param {Grommunio.core.data.IPMRecord} record The record to update the panel with
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update: function(record, contentReset)
	{
		var recipientStore = record.getSubStore('recipients');

		if (recipientStore && this.responseTrackList.getStore() !== recipientStore) {
			this.responseTrackList.reconfigure(recipientStore, this.responseTrackList.getColumnModel());
		}
	}
});

Ext.reg('grommunio.trackingtab', Grommunio.calendar.dialogs.TrackingTab);
