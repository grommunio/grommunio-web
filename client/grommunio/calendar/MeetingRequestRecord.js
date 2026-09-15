/*
 * #dependsFile client/grommunio/core/data/RecordFactory.js
 */
Ext.namespace('Grommunio.calendar');
/**
 * @class Grommunio.calendar.MeetingRequestRecordFields
 *
 * Array of {@link Ext.data.Field field} configurations for the
 * {@link Grommunio.core.data.IPMRecord IPMRecord} object.
 * These fields will be available in all 'IPM.Schedule' type messages.
 */
Grommunio.calendar.MeetingRequestRecordFields = [
	{name: 'conflictinfo'},
	{name: 'appointment_not_found', type: 'boolean', defaultValue: false},
	{name: 'counter_proposal', type: 'boolean', defaultValue: false},
	{name: 'meetingtype', type: 'number', defaultValue: Grommunio.core.mapi.MeetingType.MEETING_NONE},
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
	{name: 'updatecounter', type: 'int', defaultValue: 0},
	{name: 'meeting_updated', type: 'boolean', defaultValue: false},
	{name: 'goid', type: 'string'},
	{name: 'goid2', type: 'string'}
];

Grommunio.core.data.RecordFactory.addFieldToMessageClass('IPM.Schedule', Grommunio.calendar.MeetingRequestRecordFields);
Grommunio.core.data.RecordFactory.addFieldToMessageClass('IPM.Schedule', Grommunio.core.data.MessageRecordFields);
Grommunio.core.data.RecordFactory.setSubStoreToMessageClass('IPM.Schedule', 'reply-to', Grommunio.core.data.IPMRecipientStore);
Grommunio.core.data.RecordFactory.addListenerToMessageClass('IPM.Schedule', 'createphantom', Grommunio.core.data.MessageRecordPhantomHandler);

/**
 * @class Grommunio.calendar.MeetingRequestRecord
 * @extends Grommunio.calendar.AppointmentRecord
 *
 * An extension to the {@link Grommunio.calendar.AppointmentRecord AppointmentRecord} specific to Meeting Request/Response Messages.
 */
Grommunio.calendar.MeetingRequestRecord = Ext.extend(Grommunio.calendar.AppointmentRecord, {
	/**
	 * @return {Boolean} Returns true, overridden from {@link Grommunio.calendar.AppointmentRecord}
	 * as Meeting Requests in your inbox are always received.
	 */
	isMeetingReceived: function()
	{
		return true;
	},

	/**
	 * @return {Boolean} Returns true if the {@link Grommunio.core.data.MessageRecord MessageRecord} is a
	 * meeting response message.
	 */
	isMeetingRequestResponse: function()
	{
		return this.isMessageClass('IPM.Schedule.Meeting.Resp', true);
	},

	/**
	 * @return {Boolean} Returns true if the {@link Grommunio.core.data.MessageRecord MessageRecord} is a
	 * meeting cancellation response message.
	 */
	isMeetingRequestCanceled: function()
	{
		return this.isMessageClass('IPM.Schedule.Meeting.Canceled', true);
	},

	/**
	 * @return {Boolean} Returns true if the {@link Grommunio.core.data.MessageRecord MessageRecord} is a
	 * meeting request message.
	 */
	isMeetingRequest: function()
	{
		return this.isMessageClass('IPM.Schedule.Meeting.Request', true);
	},

	/**
	 * @return {Boolean} Returns true if the {@link Grommunio.core.data.MeetingRequestRecord MeetingRequestRecord} is a
	 * recurring meeting.
	 * @overridden
	 */
	isRecurring: function()
	{
		return this.get('appointment_recurring') === true;
	},

	/**
	 * @return {Boolean} Returns true if the {@link Grommunio.core.data.MeetingRequestRecord MeetingRequestRecord} is a
	 * recurring occurrence meeting.
	 * @overridden
	 */
	isRecurringOccurrence: function()
	{
		return Ext.isDate(this.get('appointment_basedate'));
	},

	/**
	 * @return {Boolean} Returns true if the {@link Grommunio.core.data.MeetingRequestRecord MeetingRequestRecord} is a
	 * recurring exception meeting.
	 * @overridden
	 */
	isRecurringException: function()
	{
		return Ext.isDate(this.get('appointment_basedate')) && this.get('appointment_exception') === true;
	},

	/**
	 * @return {Boolean} Returns true if the {@link Grommunio.core.data.MessageRecord MessageRecord} is and out of date
	 * meeting request/response.
	 */
	isMeetingOutOfDate: function()
	{
		return this.get('meetingtype') === Grommunio.core.mapi.MeetingType.MEETING_OUT_OF_DATE;
	},

	/**
	 * Function is used to check if duedate property value of
	 * {@link Grommunio.calendar.MeetingRequestRecord MeetingRequestRecord} is in past or not.
	 * @return {Boolean} true if meeting request/response is in past else false.
	 */
	isAppointmentInPast: function()
	{
		// @FIXME this actually depends on appointment_duedate property which is not returned for all meeting objects
		var dueDate = this.get('appointment_duedate');

		if(Ext.isDate(dueDate) && dueDate.getTime() < (new Date().getTime())) {
			return true;
		}

		return false;
	},

	/**
	 * Create a new {@link Grommunio.core.data.IPMRecord IPMRecord}. This record can be used to get all the properties
	 * of meeting record associated with this {@link Grommunio.calendar.MeetingRequestRecord MeetingRequestRecord}.
	 * @param {Boolean} viewAllProposals (optional) pass true if you want to show
	 * {@link Grommunio.calendar.dialogs.CounterProposalGrid CounterProposalGrid} with all the proposals.
	 * @return {Grommunio.core.data.IPMRecord} record which should be used to open
	 * {@link Grommunio.calendar.dialogs.AppointmentContentPanel AppointmentContentPanel}.
	 */
	convertToAppointmentRecord: function(viewAllProposals)
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

		var record = Grommunio.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Appointment', {
			entryid: appointmentEntryid,
			store_entryid: appointmentStoreEntryid,
			parent_entryid: appointmentParentEntryid,
			basedate: appointmentBasedate,
			counter_proposal: viewAllProposals,

			/*
			 * we need to provide some properties initially to the appointment record so when its set first time in
			 * the record dialog, checks which are using initial === true will work correct otherwise
			 * these properties will only be available after record is opened and at that time
			 * initial will be false
			 */
			meeting: Grommunio.core.mapi.MeetingStatus.MEETING,
			responsestatus: Grommunio.core.mapi.ResponseStatus.RESPONSE_ORGANIZED,
			startdate: this.get('appointment_startdate'),
			duedate: this.get('appointment_duedate')
		}, appointmentEntryid);

		return record;
	},

	/**
	 * This will update the {@link Grommunio.calendar.AppointmentRecord AppointmentRecord} recipients
	 * based on the current {@link Grommunio.core.mapi.MeetingStatus 'meeting' status}.
	 * If this appointment is a {@link #isMeeting meeting} then the organizer will be added into
	 * the recipients table otherwise all recipients will be removed. Overridden here by empty function
	 * as we don't need this functionality in {@link Grommunio.calendar.MeetingRequestRecord MeetingRequestRecord}.
	 * @hide
	 */
	updateMeetingRecipients: Ext.emptyFn,

	/**
	 * Meeting requests and responses live in mail folders and should be exported as
	 * RFC822 .eml streams (and zipped together with regular mails when multiple items
	 * are selected), not as ICS like a calendar appointment. Override the
	 * {@link Grommunio.calendar.AppointmentRecord AppointmentRecord} ICS URL with the
	 * mail-style eml/ZIP URL from {@link Grommunio.core.data.IPMRecord IPMRecord}.
	 * @param {Boolean} allAsZip (optional) True to download all selected messages as ZIP
	 * @return {String} URL for downloading message as eml file or ZIP archive.
	 */
	getDownloadMessageUrl: function(allAsZip)
	{
		var url = container.getBaseURL();
		url = Ext.urlAppend(url, 'load=download_message');
		url = Ext.urlAppend(url, 'storeid=' + this.get('store_entryid'));

		if (!allAsZip) {
			url = Ext.urlAppend(url, 'entryid=' + this.get('entryid'));
		} else {
			url = Ext.urlAppend(url, 'AllAsZip=true');
		}
		return url;
	}
});
Grommunio.core.data.RecordFactory.setBaseClassToMessageClass('IPM.Schedule', Grommunio.calendar.MeetingRequestRecord);
