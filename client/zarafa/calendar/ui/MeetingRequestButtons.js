Ext.namespace('Zarafa.calendar.ui');

/**
 * @class Zarafa.calendar.ui.MeetingRequestButtons
 * @extends Ext.ButtonGroup
 * @xtype zarafa.meetingrequestbuttons
 *
 * Singleton contains functions to get config of {@link Ext.Button Button} that
 * can be added to {@link Ext.Toolbar Toolbar}. It also contains handler functions to handle
 * functionality of buttons.
 */
Zarafa.calendar.ui.MeetingRequestButtons = Ext.extend(Ext.ButtonGroup, {
	/**
	 * The record for which this ButtonGroup is shown.
	 * @property
	 * @type Ext.data.Record
	 */
	record : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		Ext.applyIf(config, {
			hidden : true,
			forceLayout : true,
			cls: 'zarafa-mr-buttons',
			items: [
				this.getRemoveFromCalendarButton(),
				this.getNotCurrentButton(),
				this.getNoResponseRequiredButton(),
				this.getAcceptButton(),
				this.getTentativeButton(),
				this.getDeclineButton(),
				this.getProposeNewTimeButton(),
				this.getViewAllProposalsButton(),
				this.getAcceptProposalButton(),
				this.getCalendarButton()
			]
		});

		Zarafa.calendar.ui.MeetingRequestButtons.superclass.constructor.call(this, config);
	},

	/**
	 * Update the components with the given record.
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The record to update in this component
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 * @private
	 */
	update : function(record, contentReset)
	{
		if (!(record instanceof Zarafa.calendar.AppointmentRecord)) {
			this.setVisible(false);
			return;
		}

		this.record = record;
		var isMeeting = false;
		var isMeetingRequest = false;
		var isMeetingResponse = false;
		var isMeetingProposal = false;
		var isMeetingRecurring = false;
		var isMeetingOccurence = false;
		var isMeetingUpdated = false;
		var isMeetingCanceled = false;
		var isMeetingOutOfDate = false;

		// Check if we are having a sub message, if then don't display any of the buttons
		var isSubMessage = record.isSubMessage();

		// Check if the sender has sent himself the meeting request
		var senderIsReceiver = record.senderIsReceiver();

		// Check if the appointment was located in the calendar
		var apptNotFound = record.get('appointment_not_found');

		// Check whether message receiver is not the message creator.
		// Check whether message is in sent_items folder
		// Check whether messsage was sent to himself
		var senderIsStoreOwner = record.senderIsStoreOwner();

		// Check if this was a received meeting
		var requestReceived = record.isMeetingReceived();

		if (record instanceof Zarafa.calendar.MeetingRequestRecord) {
			isMeeting = record.isMeetingRequest();
			isMeetingRequest = isMeeting;
			isMeetingResponse = record.isMeetingRequestResponse();
			isMeetingProposal = isMeetingResponse && record.get('counter_proposal');
			isMeetingRecurring = record.get('appointment_recurring');
			isMeetingUpdated = record.get('meeting_updated');
			isMeetingCanceled = record.isMeetingRequestCanceled();
			isMeetingOutOfDate = record.isMeetingOutOfDate();
		} else {
			isMeeting = record.isMeeting();
			isMeetingCanceled = record.isMeetingCanceled();
			isMeetingRecurring = record.get('recurring');
			isMeetingOccurence = record.hasIdProp('basedate');
			isMeetingOutOfDate = isMeetingOccurence && record.get('duedate') < new Date();
		}

		// When the meeting is canceled, the user is allowed to remove the appointment
		// from the calendar.
		this.removeFromCalendarButton.setVisible(isMeetingCanceled && !isSubMessage && !apptNotFound);

		// When the meeting request is outdated, we can show the non-current button
		this.nonCurrentButton.setVisible(isMeetingRequest && !isSubMessage && isMeetingOutOfDate);

		// When this meeting is current, but the user did send this meeting request to himself,
		// then the user doesn't need to respond.
		this.noResponseButton.setVisible(isMeetingRequest && !isSubMessage && senderIsReceiver && !isMeetingOutOfDate);

		// When this meeting is current, and the user didn't send the meeting request himself,
		// then the user is allowed to accept or decline the meeting.
		var showButton = isMeeting && !isSubMessage && !senderIsReceiver && !isMeetingOutOfDate && !isMeetingCanceled && !senderIsStoreOwner && requestReceived;
		this.acceptButton.setVisible(showButton);
		this.tentativeButton.setVisible(showButton);
		this.declineButton.setVisible(showButton);

		// A user can only propose a new time for non-recurring meetings, or occurences. For the rest,
		// the same rules apply as for accepting.
		this.proposeNewTimeButton.setVisible(isMeeting && !isSubMessage && (!isMeetingRecurring || isMeetingOccurence) && !senderIsReceiver && !isMeetingOutOfDate && !isMeetingCanceled && !senderIsStoreOwner && requestReceived);

		// Proposals can only be viewed and accepted from a Meeting request
		this.viewProposalsButton.setVisible(isMeetingProposal && !isSubMessage && !isMeetingUpdated && !senderIsStoreOwner);
		this.acceptProposalButton.setVisible(isMeetingProposal && !isSubMessage && !isMeetingUpdated && !senderIsStoreOwner);

		// Only meeting requests will need a button to the calendar
		this.calendarButton.setVisible((isMeetingRequest || isMeetingResponse) && !isSubMessage && !apptNotFound);

		// Determine the action button
		if ( this.acceptButton.isVisible() ){
			this.calendarButton.getEl().removeClass('zarafa-action');
		} else if ( this.nonCurrentButton.isVisible() ){
			this.calendarButton.getEl().removeClass('zarafa-action');
		} else if ( this.calendarButton.isVisible() ){
			this.calendarButton.getEl().addClass('zarafa-action');
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
	 * @return {Ext.Button} element config which should be
	 * added in the {@link Ext.Toolbar Toolbar}.
	 * @private
	 */
	getRemoveFromCalendarButton : function()
	{
		return {
			xtype : 'button',
			ref : 'removeFromCalendarButton',
			text : _('Remove From Calendar'),
			tooltip: {
				title: _('Remove From Calendar'),
				text: _('Remove From Calendar')
			},
			cls: 'tb-calendar-btn-remove zarafa-action',
			handler : this.onRemoveFromCalendar,
			scope: this
		};
	},

	/**
	 * @return {Ext.Button} element config which should be
	 * added in the {@link Ext.Toolbar Toolbar}.
	 * @private
	 */
	getNotCurrentButton : function()
	{
		return {
			xtype : 'button',
			ref : 'nonCurrentButton',
			text : _('Not Current'),
			tooltip: {
				title: _('Not Current'),
				text: _('Meeting Request is out of date')
			},
			cls: 'tb-calendar-btn-not-current zarafa-action',
			handler : this.onNotCurrent,
			scope: this
		};
	},

	/**
	 * @return {Ext.Button} element config which should be
	 * added in the {@link Ext.Toolbar Toolbar}.
	 */
	getNoResponseRequiredButton : function()
	{
		return  {
			xtype : 'button',
			ref : 'noResponseButton',
			text : _('No Response Required'),
			tooltip: {
				title: _('No Response Required'),
				text: _('No Response Required')
				},
			cls: 'tb-calendar-btn-no-response-required',
			iconCls : 'icon_no_response_required',
			handler : this.onNoResponseRequired,
			scope: this
		};
	},

	/**
	 * @return {Ext.Button} element config which should be
	 * added in the {@link Ext.Toolbar Toolbar}.
	 * @private
	 */
	getAcceptButton : function()
	{
		return {
			xtype: 'button',
			ref : 'acceptButton',
			text: _('Accept'),
			tooltip: {
				title: _('Accept'),
				text: _('Accept Meeting Request')
			},
			cls: 'zarafa-action',
			iconCls: 'icon_calendar_appt_accept',
			responseStatus : Zarafa.core.mapi.ResponseStatus.RESPONSE_ACCEPTED,
			handler: this.openSendConfirmationContent,
			scope: this
		};
	},

	/**
	 * @return {Ext.Button} element config which should be
	 * added in the {@link Ext.Toolbar Toolbar}.
	 * @private
	 */
	getTentativeButton : function()
	{
		return {
			xtype : 'button',
			ref : 'tentativeButton',
			text : _('Tentative'),
			tooltip: {
				title: _('Tentative'),
				text: _('Tentatively Accept Meeting Request')
			},
			iconCls : 'icon_appt_meeting_tentative',
			responseStatus : Zarafa.core.mapi.ResponseStatus.RESPONSE_TENTATIVE,
			handler: this.openSendConfirmationContent,
			scope: this
		};
	},

	/**
	 * @return {Ext.Button} element config which should be
	 * added in the {@link Ext.Toolbar Toolbar}.
	 * @private
	 */
	getDeclineButton : function()
	{
		return {
			xtype : 'button',
			ref : 'declineButton',
			text : _('Decline'),
			tooltip: {
				title: _('Decline'),
				text: _('Decline Meeting Request')
			},
			iconCls : 'icon_calendar_appt_cancelled',
			responseStatus : Zarafa.core.mapi.ResponseStatus.RESPONSE_DECLINED,
			handler: this.openSendConfirmationContent,
			scope: this
		};
	},

	/**
	 * @return {Ext.Button} element config which should be
	 * added in the {@link Ext.Toolbar Toolbar}.
	 * @private
	 */
	getProposeNewTimeButton : function()
	{
		return {
			xtype : 'button',
			ref : 'proposeNewTimeButton',
			text : _('Propose New Time'),
			tooltip: {
				title: _('Propose New Time'),
				text: _('Propose New Time for Meeting Request')
			},
			iconCls : 'icon_calendar_appt_newtime',
			handler : this.openProposeNewTimeContent,
			scope: this
		};
	},

	/**
	 * @return {Ext.Button} element config which should be
	 * added in the {@link Ext.Toolbar Toolbar}.
	 * @private
	 */
	getViewAllProposalsButton : function()
	{
		return  {
			xtype : 'button',
			ref: 'viewProposalsButton',
			text : _('View All Proposals'),
			tooltip: {
				title: _('View All Proposals'),
				text: _('View All Proposals')
			},
			iconCls : 'icon_calendar_appt_proposals',
			handler : this.viewAllProposals,
			scope : this
		};
	},

	/**
	 * @return {Ext.Button} element config which should be
	 * added in the {@link Ext.Toolbar Toolbar}.
	 * @private
	 */
	getAcceptProposalButton : function()
	{
		return {
			xtype : 'button',
			ref : 'acceptProposalButton',
			text : _('Accept Proposal'),
			tooltip: {
				title: _('Accept Proposal'),
				text: _('Accept Proposed Time')
			},
			iconCls : 'icon_calendar_appt_accept',
			handler : this.acceptProposal,
			scope: this
		};
	},

	/**
	 * @return {Ext.Button} element config which should be
	 * added in the {@link Ext.Toolbar Toolbar}.
	 * @private
	 */
	getCalendarButton : function()
	{
		return  {
			xtype : 'button',
			ref : 'calendarButton',
			text : _('View in calendar'),
			tooltip: {
				title: _('View in calendar'),
				text: _('View in calendar')
			},
			cls: 'tb-calendar-btn-calendar zarafa-action',
			iconCls : 'icon_calendar_view',
			handler : this.showMeetingInCalendar,
			scope: this
		};
	},

	/**
	 * Function sends request to remove outdated Meeting Request mails.
	 * @param {Ext.Button} button button object.
	 * @param {EventObject} eventObject The click event object.
	 * @private
	 */
	onNotCurrent : function(button, eventObject)
	{
		Ext.MessageBox.show({
			title: _('Kopano WebApp'),
			msg : _('This meeting request is out-of-date and will now be deleted.'),
			icon: Ext.MessageBox.WARNING,
			record: this.record,
			fn: this.removeRecordOnOk,
			scope: this,
			buttons: Ext.MessageBox.OKCANCEL
		});
	},

	/**
	 * Function sends request to remove Meeting Request mails which invites
	 * the organizer himself in the Meeting Request.
	 * @param {Ext.Button} button button object.
	 * @param {EventObject} eventObject The click event object.
	 * @private
	 */
	onNoResponseRequired : function(button, eventObject)
	{
		Ext.MessageBox.show({
			title: _('Kopano WebApp'),
			msg :_('Your calendar has been updated automatically. This meeting request will now be deleted.'),
			icon: Ext.MessageBox.WARNING,
			record: this.record,
			fn: this.removeRecordOnOk,
			scope: this,
			buttons: Ext.MessageBox.OKCANCEL
		});
	},

	/**
	 * @param {String} buttonClicked The ID of the button pressed,
	 * here, one of: ok cancel.
	 * @param {String} text Value of the input field, not useful here
	 * @private
	 */
	removeRecordOnOk : function (buttonClicked, text)
	{
		if (buttonClicked == 'ok') {
			var store = this.record.getStore();
			store.remove(this.record);
			store.save(this.record);
		}
	},

	/**
	 * Organizer has declined the Meeting Request, so now remove its instance
	 * from your calendar and remove the mail as well.
	 * @param {Ext.Button} button button object.
	 * @param {EventObject} eventObject The click event object.
	 * @private
	 */
	onRemoveFromCalendar : function(button, eventObject)
	{
		this.record.addMessageAction('action_type', 'removeFromCalendar');

		var store = this.record.getStore();
		store.remove(this.record);
		store.save(this.record);
	},

	/**
	 * Opens the Propose New Time Content Panel
	 * @param {Ext.Button} button The clicked button
	 * @param {EventObject} eventObject The click event object
	 * @private
	 */
	openProposeNewTimeContent : function(button, eventObject)
	{
		if (this.record.get('appointment_not_found')) {
			Ext.MessageBox.show({
				title: _('Kopano WebApp'),
				msg :_('This appointment has been moved or deleted, do you want to continue?'),
				icon: Ext.MessageBox.WARNING,
				record: this.record,
				fn: this.onProposeNewTimeAppointmentNotFoundConfirmation,
				scope: this,
				buttons: Ext.MessageBox.YESNO
			});
		} else {
			Zarafa.calendar.Actions.openProposeNewTimeContent(this.record);
		}
	},

	/**
	 * Callback function for {@link #openProposeNewTimeContent}, which openes a {@link Ext.MessageBox} if
	 * the appointment is not found in the calendar, but we still wants to propose a new time.
	 * @param {String} button The button which was clicked by the user
	 * @private
	 */
	onProposeNewTimeAppointmentNotFoundConfirmation : function(button)
	{
		if (button === 'yes') {
			Zarafa.calendar.Actions.openProposeNewTimeContent(this.record);
		}
	},

	/**
	 * Opens a {@link Zarafa.calendar.dialogs.SendMeetingRequestConfirmationContentPanel SendMeetingRequestConfirmationContentPanel}
	 * @param {Ext.Button} button button object.
	 * @param {EventObject} eventObject The click event object.
	 * @private
	 */
	openSendConfirmationContent : function(button, eventObject)
	{
		if (this.record.get('appointment_not_found')) {
			Ext.MessageBox.show({
				title: _('Kopano WebApp'),
				msg :_('This appointment has been moved or deleted, do you want to continue?'),
				icon: Ext.MessageBox.WARNING,
				record: this.record,
				fn: this.onRespondAppointmentNotFoundConfirmation.createDelegate(this, [ button.responseStatus ], 1),
				scope: this,
				buttons: Ext.MessageBox.YESNO
			});
		} else {
			Zarafa.calendar.Actions.openSendConfirmationContent(this.record, { responseType : button.responseStatus });
		}
	},

	/**
	 * Callback function for {@link #openSendConfirmationContent}, which openes a {@link Ext.MessageBox} if
	 * the appointment is not found in the calendar, but we still want to accept it.
	 * @param {String} button The button which was clicked by the user
	 * @param {Zarafa.core.mapi.ResponseStatus} responseType The response type which was selected by the user
	 * @private
	 */
	onRespondAppointmentNotFoundConfirmation : function(button, responseType)
	{
		if (button === 'yes') {
			Zarafa.calendar.Actions.openSendConfirmationContent(this.record, { responseType : responseType });
		}
	},

	/**
	 * Opens a {@link Zarafa.calendar.dialogs.openAppointmentContentPanel}
	 * @param {Ext.Button} button button object.
	 * @param {EventObject} eventObject The click event object.
	 * @private
	 */
	acceptProposal : function(button, eventObject)
	{
		// When the button belongs to one of the currently opened popout windows then
		// it is required to bring the main webapp window to front prior to switching to the calender context.
		if (!Zarafa.core.BrowserWindowMgr.isOwnedByMainWindow(button)) {
			Zarafa.core.BrowserWindowMgr.switchFocusToMainWindow();
		}

		Zarafa.calendar.Actions.openAppointmentContentToAcceptProposal(this.record);
	},

	/**
	 * Loads {@link Zarafa.calendar.CalendarContext CalendarContext} in container
	 * @param {Ext.Button} button button object.
	 * @param {EventObject} eventObject The click event object.
	 * @private
	 */
	showMeetingInCalendar : function(button, eventObject)
	{
		// When the button belongs to one of the currently opened popout windows then
		// it is required to bring the main webapp window to front prior to switching to the calender context.
		if (!Zarafa.core.BrowserWindowMgr.isOwnedByMainWindow(button)) {
			Zarafa.core.BrowserWindowMgr.switchFocusToMainWindow();
		}

		Zarafa.calendar.Actions.showMeetingInCalendar(this.record);
	},

	/**
	 * Opens a {@link Zarafa.calendar.dialogs.openAppointmentContentPanel}
	 * @param {Ext.Button} button button object.
	 * @param {EventObject} eventObject The click event object.
	 * @private
	 */
	viewAllProposals : function(button, eventObject)
	{
		// When the button belongs to one of the currently opened popout windows then
		// it is required to bring the main webapp window to front prior to switching to the calender context.
		if (!Zarafa.core.BrowserWindowMgr.isOwnedByMainWindow(button)) {
			Zarafa.core.BrowserWindowMgr.switchFocusToMainWindow();
		}
		Zarafa.calendar.Actions.openAppointmentContentToViewAllProposals(this.record);
	}
});

Ext.reg('zarafa.meetingrequestbuttons', Zarafa.calendar.ui.MeetingRequestButtons);
