/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.calendar.dialogs');

/**
 * @class Grommunio.calendar.dialogs.SendMeetingRequestConfirmationContentPanel
 * @extends Grommunio.core.ui.ContentPanel
 * @xtype grommunio.sendmeetingrequestconfirmcontentpanel
 */
Grommunio.calendar.dialogs.SendMeetingRequestConfirmationContentPanel = Ext.extend(Grommunio.core.ui.ContentPanel, {
	/**
	 * @cfg {Grommunio.core.ui.IPMRecord} record The record for which the
	 * propose new time content panel is opened.
	 */
	record: undefined,

	/**
	 * @cfg {Grommunio.core.mapi.ResponseStatus} responseType The response type value selected by user.
	 */
	responseType: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			// Override from Ext.Component
			xtype: 'grommunio.sendmeetingrequestconfirmcontentpanel',
			layout: 'fit',
			title: _('Send Meeting Request Confirmation'),
			modal: true,
			width: 350,
			height: 250,
			items: [{
				xtype: 'grommunio.sendmeetingrequestconfirmpanel',
				record: config.record,
				responseType: config.responseType,
				ref: 'sendMRConfirmationPanel',
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

		Grommunio.calendar.dialogs.SendMeetingRequestConfirmationContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler which is raised when the user clicks the "Ok" {@link Ext.Button button}
	 * @private
	 */
	onOk: function()
	{
		/*
		 * If user wants to perform an action (accept/decline/propose new time/ tentatively accept) on whole
		 * meeting request then we have to remove base date from record because if record contains basedate then it
		 * will be treated as exception on server side and requested operation carried out on single occurrence.
		 */
		if(this.record.isRecurringOccurrence() && Ext.isDefined(this.buttonName) && this.buttonName === 'recurring') {
			this.record.removeIdProp('basedate');
			this.record.set('basedate', '');
		}
		this.sendMRConfirmationPanel.updateRecord(this.record);
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

Ext.reg('grommunio.sendmeetingrequestconfirmcontentpanel', Grommunio.calendar.dialogs.SendMeetingRequestConfirmationContentPanel);
