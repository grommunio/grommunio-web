/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.calendar.dialogs');

/**
 * @class Grommunio.calendar.dialogs.SendMeetingRequestConfirmationPanel
 * @extends Ext.form.FormPanel
 * @xtype grommunio.sendmeetingrequestconfirmpanel
 */
Grommunio.calendar.dialogs.SendMeetingRequestConfirmationPanel = Ext.extend(Ext.form.FormPanel, {
	/**
	 * @cfg {Grommunio.core.mapi.ResponseStatus} responseType The response type value selected by user.
	 */
	responseType: undefined,

	/**
	 * Info string that will be shown for attendee that is going to accept meeting request.
	 * @property
	 * @type String
	 */
	acceptInfoString: _('This meeting will be accepted and moved to your calendar. Do you want to include comments with your response?'),

	/**
	 * Info string that will be shown for attendee that is going to tentatively accept meeting request.
	 * @property
	 * @type String
	 */
	tentativeAcceptInfoString: _('This meeting will be tentatively accepted and moved to your calendar. Do you want to include comments with your response?'),

	/**
	 * Info string that will be shown for attendee that is going to decline meeting request.
	 * @property
	 * @type String
	 */
	declineInfoString: _('This meeting will be declined and moved to your Deleted Items folder. Do you want to include comments with your response?'),

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// Override from Ext.Component
			xtype: 'grommunio.sendmeetingrequestconfirmpanel',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			border: false,
			hideLabels: true,
			items: [{
				xtype: 'displayfield',
				value: this.getDisplayText(config.responseType),
				autoHeight: true,
				style: 'padding-bottom: 10px;'
			},{
				xtype:'radio',
				boxLabel: _('Edit the response before sending'),
				name: 'sendmrconfirmation',
				autoHeight: true,
				listeners: {
					check: this.onEditResponseChecked,
					scope: this
				}
			},{
				xtype: 'textarea',
				name: 'responseText',
				fieldLabel: _('Response message'),
				ref: 'responseTextField',
				disabled: true,
				flex: 1
			},{
				xtype:'radio',
				boxLabel: _('Send the response now.'),
				checked: true,
				name: 'sendmrconfirmation',
				autoHeight: true
			},{
				xtype:'radio',
				boxLabel: _('Don\'t send a response.'),
				name: 'sendmrconfirmation',
				autoHeight: true
			}]
		});

		Grommunio.calendar.dialogs.SendMeetingRequestConfirmationPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Checks the {@link Grommunio.core.mapi.ResponseStatus responsetype} and either uses the {@link #acceptInfoString}
	 * or {@link #declineString} for generating the displaytext which should be shown on top of this panel.
	 * @param {Grommunio.core.mapi.ResponseStatus} responseType The response type for which this dialog is shown.
	 * @return {String} The display text which should be shown on top of this panel.
	 * @private
	 */
	getDisplayText: function(responseType)
	{
		switch(responseType)
		{
			case Grommunio.core.mapi.ResponseStatus.RESPONSE_ACCEPTED:
				return this.acceptInfoString;
			case Grommunio.core.mapi.ResponseStatus.RESPONSE_TENTATIVE:
				return this.tentativeAcceptInfoString;
			case Grommunio.core.mapi.ResponseStatus.RESPONSE_DECLINED:
				return this.declineInfoString;
		}

		return '';
	},

	/**
	 * Event handler for the {@link Ext.form.RadioButton#check check} event, this will
	 * enable/disable the responseTextField accordingly.
	 * @param {Ext.form.RadioButton} rb The radio button which was selected
	 * @param {Boolean} checked True if the radio button was checked
	 * @private
	 */
	onEditResponseChecked: function(rb, checked)
	{
		this.responseTextField.setDisabled(!checked);
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

		// Check if the 'Don't send a response.' radio has been selected.
		var sendResponse = (values.sendmrconfirmation[2] !== true);

		record.respondToMeetingRequest(this.responseType, values.responseText, sendResponse);
	},

	/**
	 * Called when the panel is being resized. This will call {@link #doLayout} to update
	 * the heights of all fields inside the panel.
	 * @private
	 */
	onResize: function()
	{
		Grommunio.calendar.dialogs.SendMeetingRequestConfirmationPanel.superclass.onResize.apply(this, arguments);
		this.doLayout();
	}
});

Ext.reg('grommunio.sendmeetingrequestconfirmpanel', Grommunio.calendar.dialogs.SendMeetingRequestConfirmationPanel);
