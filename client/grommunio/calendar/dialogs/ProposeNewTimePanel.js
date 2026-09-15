/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * #dependsFile client/grommunio/core/mapi/ResponseStatus.js
 */
Ext.namespace('Grommunio.calendar.dialogs');

/**
 * @class Grommunio.calendar.dialogs.ProposeNewTimePanel
 * @extends Ext.Panel
 * @xtype grommunio.proposenewtimepanel
 */
Grommunio.calendar.dialogs.ProposeNewTimePanel = Ext.extend(Ext.Panel, {
	/**
	 * @cfg {Grommunio.core.data.IPMRecord} record The record for which
	 * propose new time dialog is opened
	 */
	record: undefined,
	/**
	 * @cfg {Grommunio.core.mapi.ResponseStatus} responseType tentative accept/decline
	 * As a default accept tentatively and propose new time.
	 */
	responseType: Grommunio.core.mapi.ResponseStatus.RESPONSE_TENTATIVE,
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// Override from Ext.Component
			xtype: 'grommunio.proposenewtimepanel',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			border: false,
			defaults: {
				border: false,
				bodyStyle: 'padding-bottom: 5px; background-color: inherit;'
			},
			items: this.createProposeTimePanel()
		});

		Grommunio.calendar.dialogs.ProposeNewTimePanel.superclass.constructor.call(this, config);

		// set the record values in UI
		this.update(this.record, true);
	},

	/**
	 * Create the {@link Ext.Panel Panel} containing the
	 * {@link Grommunio.common.ui.DateTimePeriodField DateTimePeriodField}.
	 * @return {Object} Configuration object for the panel with time selection fields
	 * @private
	 */
	createProposeTimePanel: function()
	{
		return [{
				xtype: 'grommunio.datetimeperiodfield',
				ref: 'datetimePeriod',
				defaultPeriod: 30,
				width: 300,
				startFieldConfig: {
					name: 'startdate',
					fieldLabel: _('Start time'),
					labelWidth: 100,
					listeners: {
						change: this.onFieldChange,
						scope: this
					}
				},
				endFieldConfig: {
					name: 'duedate',
					fieldLabel: _('End time'),
					labelWidth: 100,
					listeners: {
						change: this.onFieldChange,
						scope: this
					}
				}
			},{
				layout: {
					type: 'hbox',
					pack: 'start',
					align: 'stretch'
				},
				items: [{
						xtype: 'label',
						text: _('Comment') + ': ',
						width: 105
					},{
						xtype: 'textarea',
						ref: '../comment',
						fieldLabel: _('Comment'),
						flex:1
					}],
				flex:1
			}];
	},

	/**
	 * Update the components with the given record.
	 *
	 * @param {Grommunio.core.data.MAPIRecord} record The record to update in this component
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update: function(record, contentReset)
	{
		var startDate;
		var dueDate;

		if (record.isMessageClass('IPM.Schedule.Meeting.Request', true)) {
			startDate = record.get('appointment_startdate');
			dueDate = record.get('appointment_duedate');
		} else {
			startDate = record.get('startdate');
			dueDate = record.get('duedate');
		}

		if (startDate && dueDate) {
			this.datetimePeriod.getValue().set(startDate, dueDate);
		}
	},

	/**
	 * Update the {@link Grommunio.core.data.IPMRecord IPMRecord} with the data from the {@link Ext.Panel Panel}.
	 * @param {Grommunio.core.data.IPMRecord} record The record which has to be updated
	 */
	updateRecord: function(record)
	{
		record.proposeNewTimeToMeetingRequest(this.responseType, this.comment.getValue(), this.datetimePeriod.getValue().startDate, this.datetimePeriod.getValue().dueDate);
	}
});

Ext.reg('grommunio.proposenewtimepanel', Grommunio.calendar.dialogs.ProposeNewTimePanel);
