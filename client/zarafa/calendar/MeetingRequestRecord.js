/*
 * #dependsFile client/zarafa/core/data/RecordFactory.js
 */
Ext.namespace('Zarafa.calendar');
/**
 * @class Zarafa.calendar.MeetingRequestRecordFields
 *
 * Array of {@link Ext.data.Field field} configurations for the
 * {@link Zarafa.core.data.IPMRecord IPMRecord} object.
 * These fields will be available in all 'IPM.Schedule' type messages.
 */
Zarafa.calendar.MeetingRequestRecordFields = [
	{name: 'conflictinfo'},
	{name: 'appointment_not_found', type: 'boolean', defaultValue: false},
	{name: 'counter_proposal', type: 'boolean', defaultValue: false},
	{name: 'meetingtype', type: 'number', defaultValue: Zarafa.core.mapi.MeetingType.MEETING_NONE},
	{name: 'proposed_start_date', type:'date', dateFormat:'timestamp', defaultValue: null},
	{name: 'proposed_end_date', type:'date', dateFormat:'timestamp', defaultValue: null},
	{name: 'proposed_duration', type: 'number'},
	{name: 'appointment_entryid'},
	{name: 'appointment_store_entryid'},
	{name: 'appointment_parent_entryid'},
	{name: 'appointment_basedate', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'appointment_duedate', type:'date', dateFormat:'timestamp'},
	{name: 'appointment_startdate', type:'date', dateFormat:'timestamp'},
	{name: 'appointment_recurring', type: 'boolean' },
	{name: 'appointment_recurring_pattern', type: 'string'},
	{name: 'appointment_startdate_recurring', type: 'date', dateFormat: 'timestamp'},
	{name: 'appointment_enddate_recurring', type: 'date', dateFormat: 'timestamp'},
	{name: 'appointment_exception', type: 'boolean', defaultValue: false},
	{name: 'appointment_location', type: 'string'},
	{name: 'updatecounter', type: 'int', defaultValue : 0},
	{name: 'meeting_updated', type: 'boolean', defaultValue: false},
	{name: 'goid', type: 'string'},
	{name: 'goid2', type: 'string'}
];

Zarafa.core.data.RecordFactory.addFieldToMessageClass('IPM.Schedule', Zarafa.calendar.MeetingRequestRecordFields);
Zarafa.core.data.RecordFactory.addFieldToMessageClass('IPM.Schedule', Zarafa.core.data.MessageRecordFields);
Zarafa.core.data.RecordFactory.setSubStoreToMessageClass('IPM.Schedule', 'reply-to', Zarafa.core.data.IPMRecipientStore);
Zarafa.core.data.RecordFactory.addListenerToMessageClass('IPM.Schedule', 'createphantom', Zarafa.core.data.MessageRecordPhantomHandler);

/**
 * @class Zarafa.calendar.MeetingRequestRecord
 * @extends Zarafa.calendar.AppointmentRecord
 * 
 * An extension to the {@link Zarafa.calendar.AppointmentRecord AppointmentRecord} specific to Meeting Request/Response Messages.
 */
Zarafa.calendar.MeetingRequestRecord = Ext.extend(Zarafa.calendar.AppointmentRecord, {
	/**
	 * @return {Boolean} Returns true, overridden from {@link Zarafa.calendar.AppointmentRecord}
	 * as Meeting Requests in your inbox are always received.
	 */
	isMeetingReceived : function()
	{
		return true;
	},

	/**
	 * @return {Boolean} Returns true if the {@link Zarafa.core.data.MessageRecord MessageRecord} is a
	 * meeting response message.
	 */
	isMeetingRequestResponse: function()
	{
		return this.isMessageClass('IPM.Schedule.Meeting.Resp', true);
	},
	
	/**
	 * @return {Boolean} Returns true if the {@link Zarafa.core.data.MessageRecord MessageRecord} is a
	 * meeting cancellation response message.
	 */
	isMeetingRequestCanceled: function()
	{
		return this.isMessageClass('IPM.Schedule.Meeting.Canceled', true);
	},
	
	/**
	 * @return {Boolean} Returns true if the {@link Zarafa.core.data.MessageRecord MessageRecord} is a
	 * meeting request message.
	 */
	isMeetingRequest: function()
	{
		return this.isMessageClass('IPM.Schedule.Meeting.Request', true);
	},

	/**
	 * @return {Boolean} Returns true if the {@link Zarafa.core.data.MeetingRequestRecord MeetingRequestRecord} is a
	 * recurring meeting.
	 * @overridden
	 */
	isRecurring : function()
	{
		return this.get('appointment_recurring') === true;
	},

	/**
	 * @return {Boolean} Returns true if the {@link Zarafa.core.data.MeetingRequestRecord MeetingRequestRecord} is a
	 * recurring occurence meeting.
	 * @overridden
	 */
	isRecurringOccurence : function()
	{
		return Ext.isDate(this.get('appointment_basedate'));
	},

	/**
	 * @return {Boolean} Returns true if the {@link Zarafa.core.data.MeetingRequestRecord MeetingRequestRecord} is a
	 * recurring exception meeting.
	 * @overridden
	 */
	isRecurringException : function()
	{
		return Ext.isDate(this.get('appointment_basedate')) && this.get('appointment_exception') === true;
	},

	/**
	 * @return {Boolean} Returns true if the {@link Zarafa.core.data.MessageRecord MessageRecord} is and out of date
	 * meeting request/response.
	 */
	isMeetingOutOfDate: function()
	{
		return this.get('meetingtype') === Zarafa.core.mapi.MeetingType.MEETING_OUT_OF_DATE;
	},

	/**
	 * Function is used to check if duedate property value of
	 * {@link Zarafa.calendar.MeetingRequestRecord MeetingRequestRecord} is in past or not.
	 * @return {Boolean} true if meeting request/response is in past else false.
	 */
	isAppointmentInPast : function()
	{
		// @FIXME this actually depends on appointment_duedate property which is not returned for all meeting objects
		var dueDate = this.get('appointment_duedate');

		if(Ext.isDate(dueDate) && dueDate.getTime() < (new Date().getTime())) {
			return true;
		}

		return false;
	},

	/**
	 * Generates meeting time details which will be added to meeting response body.
	 * @return {String} generated body message.
	 * @overridden
	 */
	generateMeetingTimeInfo : function(responseText)
	{
		var messageBody = responseText || '';
		var startDate = this.get('appointment_startdate');
		var dueDate = this.get('appointment_duedate');
		var meetingLocation = this.get('appointment_location') || '';
		var recurringPattern = this.get('appointment_recurring_pattern') || '';

		var meetingTimeInfo = _('When') + ': ';

		if (recurringPattern) {
			meetingTimeInfo += recurringPattern + '\n';
		} else {
			// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
			meetingTimeInfo += startDate.format(_('l jS F Y G:i')) + ' - ';
			// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
			meetingTimeInfo += dueDate.format(_('l jS F Y G:i')) + '\n';
		}

		meetingTimeInfo += _('Where') + ': '  + meetingLocation + '\n\n';
		meetingTimeInfo += '*~*~*~*~*~*~*~*~*~*\n\n' + messageBody;

		return meetingTimeInfo;
	},

	/**
	 * Create a new {@link Zarafa.core.data.IPMRecord IPMRecord}. This record can be used to get all the properties
	 * of meeting record associated with this {@link Zarafa.calendar.MeetingRequestRecord MeetingRequestRecord}.
	 * @param {Boolean} viewAllProposals (optional) pass true if you want to show
	 * {@link Zarafa.calendar.dialogs.CounterProposalGrid CounterProposalGrid} with all the proposals.
	 * @return {Zarafa.core.data.IPMRecord} record which should be used to open
	 * {@link Zarafa.calendar.dialogs.AppointmentContentPanel AppointmentContentPanel}.
	 */
	convertToAppointmentRecord : function(viewAllProposals)
	{
		// get entryids of the corresponding meeting in calendar
		var appointmentEntryid = this.get('appointment_entryid');
		var appointmentParentEntryid = this.get('appointment_parent_entryid');
		var appointmentStoreEntryid = this.get('appointment_store_entryid');
		var appointmentBasedate = this.get('appointment_basedate');

		if(Ext.isEmpty(appointmentEntryid) || Ext.isEmpty(appointmentStoreEntryid)) {
			return;
		}

		if(!Ext.isBoolean(viewAllProposals)) {
			viewAllProposals = true;
		}

		var record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Appointment', {
			entryid: appointmentEntryid,
			store_entryid: appointmentStoreEntryid,
			parent_entryid: appointmentParentEntryid,
			basedate: appointmentBasedate,
			counter_proposal : viewAllProposals,

			/*
			 * we need to provide some properties initially to the appointment record so when its set first time in 
			 * the record dialog, checks which are using initial === true will work correct otherwise
			 * these properties will only be avaialable after record is opened and at that time
			 * initial will be false
			 */
			meeting: Zarafa.core.mapi.MeetingStatus.MEETING,
			responsestatus: Zarafa.core.mapi.ResponseStatus.RESPONSE_ORGANIZED,
			startdate: this.get('appointment_startdate'),
			duedate: this.get('appointment_duedate')
		}, appointmentEntryid);

		return record;
	},

	/**
	 * This will update the {@link Zarafa.calendar.AppointmentRecord AppointmentRecord} recipients
	 * based on the current {@link Zarafa.core.mapi.MeetingStatus 'meeting' status}.
	 * If this appointment is a {@link #isMeeting meeting} then the organizer will be added into
	 * the recipients table otherwise all recipients will be removed. Overriden here by empty function
	 * as we don't need this functionality in {@link Zarafa.calendar.MeetingRequestRecord MeetingRequestRecord}.
	 * @hide
	 */
	updateMeetingRecipients : Ext.emptyFn
});
Zarafa.core.data.RecordFactory.setBaseClassToMessageClass('IPM.Schedule', Zarafa.calendar.MeetingRequestRecord);
