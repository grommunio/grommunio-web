/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.calendar.ui');

/**
 * @class Grommunio.task.ui.TaskRequestButtons
 * @extends Ext.ButtonGroup
 * @xtype grommunio.taskrequestbuttons
 *
 * Container for a group of buttons contains functions create {@link Ext.Button Buttons} that
 * can be added to {@link Ext.Toolbar Toolbar}. It also contains handler functions to handle
 * functionality of buttons.
 */
Grommunio.task.ui.TaskRequestButtons = Ext.extend(Ext.ButtonGroup, {
	/**
	 * The record for which this ButtonGroup is shown.
	 * @property
	 * @type Ext.data.Record
	 */
	record: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function (config) {
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('grommunio.recordcomponentupdaterplugin');

		Ext.applyIf(config, {
			hidden: true,
			forceLayout: true,
			cls: 'k-tr-buttons',
			ref : 'taskRequestButtons',
			items: [
				this.createAcceptButton(),
				this.createDeclineButton()
			]
		});

		Grommunio.task.ui.TaskRequestButtons.superclass.constructor.call(this, config);
	},

	/**
	 * Update the components with the given record.
	 *
	 * @param {Grommunio.core.data.MAPIRecord} record The record to update in this component
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 * @private
	 */
	update : function(record, contentReset)
	{
		if (!(record instanceof Grommunio.task.TaskRecord)) {
			this.setVisible(false);
			return;
		}

		this.record = record;

		// Check if we are having a sub message, if then don't display any of the buttons
		var isSubMessage = record.isSubMessage();

		var showAcceptButton = false;
		var showDeclineButton = false;
		if (contentReset) {
			var isMessageTaskResponse = Grommunio.core.MessageClass.isClass(record.get('message_class'), ['IPM.TaskRequest.Accept', 'IPM.TaskRequest.Update', 'IPM.TaskRequest.Decline', 'IPM.TaskRequest.Complete']);
			var isTaskReceived = false;
			var isTaskAccepted = false;

			// If record is instance of TaskRequestRecord, message_class property is IPM.TaskRequest and record is received task
			// then show the Accept and Decline button in preview panel toolbar
			if (record instanceof Grommunio.task.TaskRequestRecord && record.isMessageClass('IPM.TaskRequest')) {
				var iskAssignedTR = record.isReceivedTaskRequestFromAssigner();
				showAcceptButton = iskAssignedTR && !isSubMessage;
				showDeclineButton = iskAssignedTR && !isSubMessage;
			} else if(!isMessageTaskResponse) {
				// Condition gets true if record is other then 'IPM.TaskRequest/.Accept/.Update/.Decline'.
				// isTaskOwner gets true if user is owner of this task else false
				var isTaskOwner = record.isTaskOwner();
				// isTaskAssigned gets true if task was assigned to login user else false.
				var isTaskAssigned = record.isTaskAssigned();
				// isTaskReceived gets true if task is received task else false.
				isTaskReceived = record.isTaskReceived();
				// isTaskReceived gets true if task is Accepted by user else false.
				isTaskAccepted = record.isTaskAccepted();
				// showAcceptButton gets true if task is received task, task is assigned to user, user is owner of the task
				// and task yet not accepted else false.
				showAcceptButton = (isTaskReceived && isTaskAssigned && isTaskOwner && !isTaskAccepted && !isSubMessage);
				// showDeclineButton gets true if task is received task, user is owner of the task and
				// task is assigned to user and task is accepted else false.
				showDeclineButton = (!isSubMessage && isTaskReceived && isTaskOwner && (isTaskAssigned || isTaskAccepted || record.isTaskUpdated()));
			}
			this.acceptButton.setVisible(showAcceptButton);
			this.declineButton.setVisible(showDeclineButton);
		}

		if (!contentReset && record.isModifiedSinceLastUpdate('taskmode')) {
			this.acceptButton.setVisible(showAcceptButton);
			this.declineButton.setVisible(showDeclineButton);
		}

		if ( this.acceptButton.isVisible() ) {
			this.acceptButton.getEl().addClass('grommunio-action');
		}
		// Determine if there are any visible buttons, if that is not the case,
		// lets hide the entire button group.
		var visible = false;
		this.items.each(function(btn) {
			if (btn.hidden !== true) {
				visible = true;
				return false;
			}
		});

		this.setVisible(visible);
	},

	/**
	 * Function used to create "Accept" button. which used to
	 * accept the task request.
	 *
	 * @return {Ext.Button} element config which should be
	 * added in the {@link Ext.Toolbar Toolbar}.
	 * @private
	 */
	createAcceptButton : function()
	{
		return {
			xtype: 'button',
			ref : 'acceptButton',
			text: _('Accept'),
			iconCls: 'icon_calendar_appt_accept',
			responseStatus : Grommunio.core.mapi.TaskMode.ACCEPT,
			handler: this.openSendConfirmationContent,
			scope: this
		};
	},

	/**
	 * Function used to create "Decline" button. which used to
	 * decline the task request.
	 *
	 * @return {Ext.Button} element config which should be
	 * added in the {@link Ext.Toolbar Toolbar}.
	 * @private
	 */
	createDeclineButton : function()
	{
		return {
			xtype : 'button',
			ref : 'declineButton',
			text : _('Decline'),
			iconCls : 'icon_calendar_appt_cancelled',
			responseStatus : Grommunio.core.mapi.TaskMode.DECLINE,
			handler: this.openSendConfirmationContent,
			scope: this
		};
	},

	/**
	 * Opens a {@link Grommunio.task.dialogs.SendTaskRequestConfirmationContentPanel SendTaskRequestConfirmationContentPanel}
	 *
	 * @param {Ext.Button} button button object.
	 * @param {EventObject} eventObject The click event object.
	 * @private
	 */
	openSendConfirmationContent : function(button, eventObject)
	{
		if (this.record.isTaskOwner()) {
			Grommunio.task.Actions.openSendConfirmationContent(this.record, { responseType : button.responseStatus });
		}
	}
});

Ext.reg('grommunio.taskrequestbuttons', Grommunio.task.ui.TaskRequestButtons);
