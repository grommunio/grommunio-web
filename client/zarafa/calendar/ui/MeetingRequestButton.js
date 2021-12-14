Ext.namespace('Zarafa.calendar.ui');

/**
 * @class Zarafa.calendar.ui.MeetingRequestButton
 * @extends Ext.Button
 * @xtype zarafa.meetingrequestbutton
 *
 * Singleton Base class for all meeting request buttons. It contains common functions of
 * all meeting request buttons and handlers for all meeting request buttons.
 */
Zarafa.calendar.ui.MeetingRequestButton = Ext.extend(Ext.Button, {
	/**
	 * The record for which this Button is shown.
	 * @property
	 * @type Ext.data.Record
	 */
	record: undefined,

	/**
	 * This property will keep track whether this component was visible or hidden last.
	 * it will be set in {@link update} function.
	 * @property
	 * @type Boolean
	 */
	visible: false,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		Ext.applyIf(config, {
			xtype: 'zarafa.meetingrequestbutton',
			hidden: true,
			forceLayout: true,
			cls: 'zarafa-mr-buttons',
			handler: this.onClickHanlder,
			scope: this,

			/**
			 * Note: This is a fix for a bug: when Ext.js converts buttons to menuitems,
			 * it takes button component's initial configs into consideration.
			 * Initially this button component is hidden so we need to show/hide menuitem
			 * on the basis of visible config which is being set.
			 * in {@link #update} function.
			 */
			beforeShow: function(item) {
				item.setVisible(this.visible);
			}
		});
		Zarafa.calendar.ui.MeetingRequestButton.superclass.constructor.call(this, config);

		/**
		 * We need to remove 'zarafa.recordcomponentupdaterplugin' plugin from initialConfig.
		 * Because Ext uses initialConfig to make a menu item from button component.
		 * This 'zarafa.recordcomponentupdaterplugin' plugin will call update function
		 * which will not be found in newly created menuitem.
		 * So it will call Ext's update function instead
		 * and beacause Ext's update function will get called with wrong parameters,
		 * text of menu item will be changed.
		 */
		this.initialConfig.plugins = [];
	},

	/**
	 * Update the components with the given record.
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The record to update in this component
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 * @private
	 */
	update: function(record, contentReset)
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

		switch(this.name) {
			case Zarafa.calendar.data.MeetingRequestButtonNames.REMOVEFROMCALENDAR:
				// When the meeting is canceled, the user is allowed to remove the appointment
				// from the calendar.
				this.visible = isMeetingCanceled && !isSubMessage && !apptNotFound;
				break;
			case Zarafa.calendar.data.MeetingRequestButtonNames.NORESPONSE:
				// When this meeting is current, but the user did send this meeting request to himself,
				// then the user doesn't need to respond.
				this.visible = isMeetingRequest && !isSubMessage && senderIsReceiver && !isMeetingOutOfDate;
				break;
			case Zarafa.calendar.data.MeetingRequestButtonNames.ACCEPT:
			case Zarafa.calendar.data.MeetingRequestButtonNames.TENTATIVE:
			case Zarafa.calendar.data.MeetingRequestButtonNames.DECLINE:
				// When this meeting is current, and the user didn't send the meeting request himself,
				// then the user is allowed to accept or decline the meeting.
				this.visible = isMeeting && !isSubMessage && !senderIsReceiver && !isMeetingOutOfDate && !isMeetingCanceled && !senderIsStoreOwner && requestReceived;

				// Determine the action button
				// @FIXME: find a better solution to determine action button.
				// we don't have calendar button access directly as we created seprate buttons for meetingrequests.
				if (this.name === Zarafa.calendar.data.MeetingRequestButtonNames.ACCEPT) {
					var calendarButton = this.parentScope ? this.parentScope.calendarButton : false;
					if (this.visible && calendarButton) {
						calendarButton.getEl().removeClass('zarafa-action');
					} else if (calendarButton && calendarButton.isVisible()) {
						calendarButton.getEl().addClass('zarafa-action');
					}
				}
				break;
			case Zarafa.calendar.data.MeetingRequestButtonNames.PROPOSENEWTIME:
				// A user can only propose a new time for non-recurring meetings, or occurrences. For the rest,
				// the same rules apply as for accepting.
				this.visible = isMeeting && !isSubMessage && (!isMeetingRecurring || isMeetingOccurence) && !senderIsReceiver && !isMeetingOutOfDate && !isMeetingCanceled && !senderIsStoreOwner && requestReceived;
				break;
			case Zarafa.calendar.data.MeetingRequestButtonNames.VIEWPROPOSALS:
			case Zarafa.calendar.data.MeetingRequestButtonNames.ACCEPTPROPOSAL:
				this.visible = isMeetingProposal && !isSubMessage && !isMeetingUpdated && !senderIsStoreOwner;
				break;
			case Zarafa.calendar.data.MeetingRequestButtonNames.CALENDAR:
				this.visible = (isMeetingRequest || isMeetingResponse) && !isSubMessage && !apptNotFound;
				break;
			default:
				break;
		}

		this.setVisible(this.visible);
	},

	/**
	 * This is common handler for meeting requests buttons
	 * of type {@link Zarafa.calendar.ui.MeetingRequestButton MeetingRequestButton}.
	 * It will call button's handler based on button's name.
	 *
	 * @param {Ext.Button} button button object.
	 * @param {EventObject} eventObject The click event object.
	 * @private
	 */
	onClickHanlder: function(button, eventObject)
	{
		switch(button.name) {
			case Zarafa.calendar.data.MeetingRequestButtonNames.REMOVEFROMCALENDAR:
				this.onRemoveFromCalendar(button, eventObject);
				break;
			case Zarafa.calendar.data.MeetingRequestButtonNames.NORESPONSE:
				this.onNoResponseRequired(button, eventObject);
				break;
			case Zarafa.calendar.data.MeetingRequestButtonNames.ACCEPT:
			case Zarafa.calendar.data.MeetingRequestButtonNames.TENTATIVE:
			case Zarafa.calendar.data.MeetingRequestButtonNames.DECLINE:
				this.openSendConfirmationContent(button, eventObject);
				break;
			case Zarafa.calendar.data.MeetingRequestButtonNames.PROPOSENEWTIME:
				this.openProposeNewTimeContent(button, eventObject);
				break;
			case Zarafa.calendar.data.MeetingRequestButtonNames.VIEWPROPOSALS:
				this.viewAllProposals(button, eventObject);
				break;
			case Zarafa.calendar.data.MeetingRequestButtonNames.ACCEPTPROPOSAL:
				this.acceptProposal(button, eventObject);
				break;
			case Zarafa.calendar.data.MeetingRequestButtonNames.CALENDAR:
				this.showMeetingInCalendar(button, eventObject);
				break;
			default:
				break;
		}
	},

	/**
	 * Opens a {@link Zarafa.calendar.dialogs.SendMeetingRequestConfirmationContentPanel SendMeetingRequestConfirmationContentPanel}
	 * @param {Ext.Button} button button object.
	 * @param {EventObject} eventObject The click event object.
	 * @private
	 */
	openSendConfirmationContent: function(button, eventObject)
	{
		if (this.record.get('appointment_not_found')) {
			Ext.MessageBox.show({
				title: _('Appointment not found'),
				msg:_('This appointment has been moved or deleted, do you want to continue?'),
				cls: Ext.MessageBox.WARNING_CLS,
				record: this.record,
				fn: this.onRespondAppointmentNotFoundConfirmation.createDelegate(this, [ button.responseStatus ], 1),
				scope: this,
				buttons: Ext.MessageBox.YESNO
			});
		} else {
			Zarafa.calendar.Actions.openSendConfirmationContent(this.record, { responseType: button.responseStatus });
		}
	},

	/**
	 * Callback function for {@link #openSendConfirmationContent}, which openes a {@link Ext.MessageBox} if
	 * the appointment is not found in the calendar, but we still want to accept it.
	 * @param {String} button The button which was clicked by the user
	 * @param {Zarafa.core.mapi.ResponseStatus} responseType The response type which was selected by the user
	 * @private
	 */
	onRespondAppointmentNotFoundConfirmation: function(button, responseType)
	{
		if (button === 'yes') {
			Zarafa.calendar.Actions.openSendConfirmationContent(this.record, { responseType: responseType });
		}
	},

	/**
	 * Opens a {@link Zarafa.calendar.dialogs.openAppointmentContentPanel}
	 * @param {Ext.Button} button button object.
	 * @param {EventObject} eventObject The click event object.
	 * @private
	 */
	acceptProposal: function(button, eventObject)
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
	showMeetingInCalendar: function(button, eventObject)
	{
		// When the button belongs to one of the currently opened popout windows then
		// it is required to bring the main webapp window to front prior to switching to the calender context.
		if (!Zarafa.core.BrowserWindowMgr.isOwnedByMainWindow(button)) {
			Zarafa.core.BrowserWindowMgr.switchFocusToMainWindow();
		}

		Zarafa.calendar.Actions.showMeetingInCalendar(this.record);
	},

	/**
	 * Function sends request to remove Meeting Request mails which invites
	 * the organizer himself in the Meeting Request.
	 * @param {Ext.Button} button button object.
	 * @param {EventObject} eventObject The click event object.
	 * @private
	 */
	onNoResponseRequired: function(button, eventObject)
	{
		Ext.MessageBox.show({
			title: _('No additional response required'),
			msg:_('Your calendar has been updated automatically. This meeting request will now be deleted.'),
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
	removeRecordOnOk: function (buttonClicked, text)
	{
		if (buttonClicked == 'ok') {
			var store = this.record.getStore();
			store.remove(this.record);
			store.save(this.record);
		}
	},

	/**
	 * Opens the Propose New Time Content Panel
	 * @param {Ext.Button} button The clicked button
	 * @param {EventObject} eventObject The click event object
	 * @private
	 */
	openProposeNewTimeContent: function(button, eventObject)
	{
		if (this.record.get('appointment_not_found')) {
			Ext.MessageBox.show({
				title: _('Appointment not found'),
				msg:_('This appointment has been moved or deleted, do you want to continue?'),
				cls: Ext.MessageBox.WARNING_CLS,
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
	onProposeNewTimeAppointmentNotFoundConfirmation: function(button)
	{
		if (button === 'yes') {
			Zarafa.calendar.Actions.openProposeNewTimeContent(this.record);
		}
	},

	 /**
	 * Organizer has declined the Meeting Request, so now remove its instance
	 * from your calendar and remove the mail as well.
	 * @param {Ext.Button} button button object.
	 * @param {EventObject} eventObject The click event object.
	 * @private
	 */
	onRemoveFromCalendar: function(button, eventObject)
	{
		this.record.addMessageAction('action_type', 'removeFromCalendar');

		var store = this.record.getStore();
		store.remove(this.record);
		store.save(this.record);
	},

	/**
	 * Opens a {@link Zarafa.calendar.dialogs.openAppointmentContentPanel}
	 * @param {Ext.Button} button button object.
	 * @param {EventObject} eventObject The click event object.
	 * @private
	 */
	viewAllProposals: function(button, eventObject)
	{
		// When the button belongs to one of the currently opened popout windows then
		// it is required to bring the main webapp window to front prior to switching to the calender context.
		if (!Zarafa.core.BrowserWindowMgr.isOwnedByMainWindow(button)) {
			Zarafa.core.BrowserWindowMgr.switchFocusToMainWindow();
		}
		Zarafa.calendar.Actions.openAppointmentContentToViewAllProposals(this.record);
	}

});

Ext.reg('zarafa.meetingrequestbutton', Zarafa.calendar.ui.MeetingRequestButton);
