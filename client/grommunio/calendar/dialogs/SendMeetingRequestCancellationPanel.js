/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.calendar.dialogs');

/**
 * @class Grommunio.calendar.dialogs.SendMeetingRequestCancellationPanel
 * @extends Ext.form.FormPanel
 * @xtype grommunio.sendmeetingrequestcancellationpanel
 */
Grommunio.calendar.dialogs.SendMeetingRequestCancellationPanel = Ext.extend(Ext.form.FormPanel, {

	/**
	 * Info string that will be shown for organizer which is going to cancel the meeting request.
	 * @property
	 * @type String
	 */
	cancellationInfoString: _('This meeting will be cancelled. Do you want to include comments with your cancellation?'),

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// Override from Ext.Component
			xtype: 'grommunio.sendmeetingrequestcancellationpanel',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			border: false,
			hideLabels: true,
			items: [{
				xtype: 'displayfield',
				value: this.cancellationInfoString,
				autoHeight: true,
				style: 'padding-bottom: 10px;'
			},{
				xtype:'radio',
				boxLabel: _('Edit the cancellation before Sending.'),
				name: 'sendmrcancellation',
				autoHeight: true,
				listeners: {
					check: this.onEditCancellationChecked,
					scope: this
				}
			},{
				xtype: 'textarea',
				name: 'cancellationText',
				fieldLabel: _('Cancellation message'),
				ref: 'cancellationTextField',
				disabled: true,
				flex: 1
			},{
				xtype:'radio',
				boxLabel: _('Send the cancellation now.'),
				checked: true,
				name: 'sendmrcancellation',
				autoHeight: true
			}]
		});

		Grommunio.calendar.dialogs.SendMeetingRequestCancellationPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler for the {@link Ext.form.RadioButton#check check} event, this will
	 * enable/disable the cancellationTextField accordingly.
	 * @param {Ext.form.RadioButton} rb The radio button which was selected
	 * @param {Boolean} checked True if the radio button was checked
	 * @private
	 */
	onEditCancellationChecked: function(rb, checked)
	{
		this.cancellationTextField.setDisabled(!checked);
	},

	/**
	 * Called by the dialog check the settings from the user and either
	 * send the accept or decline message to the organizer.
	 * @param {Grommunio.core.data.IPMRecord} record The record which is being
	 * accepted or declined.
	 */
	updateRecord: function(record)
	{
		var values = this.getForm().getFieldValues();

		record.cancelInvitation(values.cancellationText);
	},

	/**
	 * Called when the panel is being resized. This will call {@link #doLayout} to update
	 * the heights of all fields inside the panel.
	 * @private
	 */
	onResize: function()
	{
		Grommunio.calendar.dialogs.SendMeetingRequestCancellationPanel.superclass.onResize.apply(this, arguments);
		this.doLayout();
	}
});

Ext.reg('grommunio.sendmeetingrequestcancellationpanel', Grommunio.calendar.dialogs.SendMeetingRequestCancellationPanel);
