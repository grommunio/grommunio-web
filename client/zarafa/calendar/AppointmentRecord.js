/*
 * #dependsFile client/zarafa/core/data/RecordFactory.js
 * #dependsFile client/zarafa/core/data/MessageRecord.js
 */
Ext.namespace('Zarafa.calendar');

/**
 * @class Zarafa.calendar.AppointmentRecordFields
 *
 * Array of {@link Ext.data.Field field} configurations for the
 * {@link Zarafa.core.data.IPMRecord IPMRecord} object.
 * These fields will be available in all 'IPM.Appointment' type messages.
 */
Zarafa.calendar.AppointmentRecordFields = [
	{name: 'importance', type: 'int', defaultValue: Zarafa.core.mapi.Importance.NORMAL},
	{name: 'sensitivity', type: 'int', defaultValue: Zarafa.core.mapi.Sensitivity.NONE},
	{name: 'startdate', type: 'date', dateFormat: 'timestamp', allowBlank : false, sortDir : 'DESC'},
	{name: 'duedate', type: 'date', dateFormat: 'timestamp', allowBlank : false, sortDir : 'DESC'},
	{name: 'basedate', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'recurring', type: 'boolean', defaultValue: false},
	{name: 'recurring_reset', type: 'boolean', defaultValue: false},
	{name: 'recurring_pattern', type: 'string'},
	{name: 'startdate_recurring', type: 'date', dateFormat: 'timestamp', defaultValue: null, sortDir : 'DESC'},
	{name: 'enddate_recurring', type: 'date', dateFormat: 'timestamp', defaultValue: null, sortDir : 'DESC'},
	{name: 'exception', type : 'boolean', defaultValue: false},
	{name: 'reply_time', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'reply_name', type: 'string', defaultValue: ''},
	{name: 'busystatus', type: 'int', defaultValue: Zarafa.core.mapi.BusyStatus.BUSY},
	{name: 'label', type: 'int', defaultValue: Zarafa.core.mapi.AppointmentLabels.NONE},
	{name: 'request_sent', type: 'boolean', defaultValue: false},
	{name: 'alldayevent', type: 'boolean', defaultValue: false},
	{name: 'private', type: 'boolean', defaultValue: false},
	{name: 'meeting', type: 'int', defaultValue: Zarafa.core.mapi.MeetingStatus.NONMEETING},
	{name: 'location', type: 'string'},
	{name: 'duration', type: 'int'},
	{name: 'auxiliary_flags', type: 'int'},
	{name: 'responsestatus', type: 'int', defaultValue: Zarafa.core.mapi.ResponseStatus.RESPONSE_NONE},
	{name: 'reminder', type: 'boolean'},
	{name: 'reminder_minutes', type: 'int'},
	{name: 'reminder_time', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'flagdueby', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'commonstart', type: 'date', dateFormat: 'timestamp', allowBlank : false},
	{name: 'commonend', type: 'date', dateFormat: 'timestamp', allowBlank : false},
	{name: 'commonassign'},
	{name: 'counter_proposal', type: 'boolean', defaultValue: false},
	// TODO: Move all Recurrence properties into a single object
	{name: 'recurrence_type', mapping: 'type', type: 'int', forceProtocol: true},
	{name: 'recurrence_subtype', mapping: 'subtype', type: 'int', forceProtocol: true},
	{name: 'recurrence_everyn', mapping: 'everyn', type: 'int', forceProtocol: true},
	{name: 'recurrence_regen', mapping: 'regen', type: 'int', forceProtocol: true},
	{name: 'recurrence_weekdays', mapping: 'weekdays', type: 'int', forceProtocol: true},
	{name: 'recurrence_month', mapping: 'month', type: 'int', forceProtocol: true},
	{name: 'recurrence_monthday', mapping: 'monthday', type: 'int', forceProtocol: true},
	{name: 'recurrence_nday', mapping: 'nday', type: 'int', forceProtocol: true},
	{name: 'recurrence_term', mapping: 'term', type: 'int', forceProtocol: true},
	{name: 'recurrence_numoccur', mapping: 'numoccur', type: 'int', forceProtocol: true},
	{name: 'recurrence_numexcept', mapping: 'numexcept', type: 'int', forceProtocol: true},
	{name: 'recurrence_numexceptmod', mapping: 'numexceptmod', type: 'int', forceProtocol: true},
	{name: 'recurrence_start', mapping: 'start', type: 'date', dateFormat: 'timestamp', forceProtocol: true, defaultValue: null},
	{name: 'recurrence_end', mapping: 'end', type: 'date', dateFormat: 'timestamp', forceProtocol: true, defaultValue: null},
	{name: 'recurrence_startocc', mapping: 'startocc', type: 'int', forceProtocol: true},
	{name: 'recurrence_endocc', mapping: 'endocc', type: 'int', forceProtocol: true},
	// TODO: Move all Timezone properties into a single object
	{name: 'timezone', type: 'int', forceProtocol: true},
	{name: 'timezone_unk', mapping: 'unk', type: 'int', forceProtocol: true},
	{name: 'timezone_timezonedst', mapping: 'timezonedst', type: 'int', forceProtocol: true},
	{name: 'timezone_dstendmonth', mapping: 'dstendmonth', type: 'int', forceProtocol: true},
	{name: 'timezone_dstendweek', mapping: 'dstendweek', type: 'int', forceProtocol: true},
	{name: 'timezone_dstendday', mapping: 'dstendday', type: 'int', forceProtocol: true},
	{name: 'timezone_dstendhour', mapping: 'dstendhour', type: 'int', forceProtocol: true},
	{name: 'timezone_dststartmonth', mapping: 'dststartmonth', type: 'int', forceProtocol: true},
	{name: 'timezone_dststartweek', mapping: 'dststartweek', type: 'int', forceProtocol: true},
	{name: 'timezone_dststartday', mapping: 'dststartday', type: 'int', forceProtocol: true},
	{name: 'timezone_dststarthour', mapping: 'dststarthour', type: 'int', forceProtocol: true}
];

/**
 *	You are programmatically manipulating appointment items in Microsoft Outlook
 *	and expect the message class of all appointment items to be IPM.Appointment,
 *	but the message class of recurring exceptions is set to IPM.OLE.CLASS.{00061055-0000-0000-C000-000000000046}
 *	http://support.microsoft.com/kb/183024
 *
 *	IPM.OLE.Class	: The exception item of a recurrence series
 */
Zarafa.core.data.RecordFactory.addFieldToMessageClass('IPM.OLE.CLASS.{00061055-0000-0000-C000-000000000046}', Zarafa.calendar.AppointmentRecordFields);
Zarafa.core.data.RecordFactory.addFieldToMessageClass('IPM.OLE.CLASS.{00061055-0000-0000-C000-000000000046}', Zarafa.core.data.MessageRecordFields);

Zarafa.core.data.RecordFactory.addFieldToMessageClass('IPM.Appointment', Zarafa.calendar.AppointmentRecordFields);
Zarafa.core.data.RecordFactory.addFieldToMessageClass('IPM.Appointment', Zarafa.core.data.MessageRecordFields);
Zarafa.core.data.RecordFactory.addListenerToMessageClass('IPM.Appointment', 'createphantom', Zarafa.core.data.MessageRecordPhantomHandler);

Zarafa.core.data.RecordFactory.addListenerToMessageClass('IPM.Appointment', 'createphantom', function(record, data) {
	record.beginEdit();

	if (Ext.isNumber(record.get('duration'))) {
		var startDate = record.get('startdate') || record.get('commonstart');
		var dueDate = record.get('duedate') || record.get('commonend');
		if (startDate && dueDate) {
			record.set('duration', (dueDate - startDate) / (60 * 1000));
		}
	}

	var settings = container.getSettingsModel();

	if (!data || !Ext.isDefined(data.reminder)) {
		var reminder = false;
		var store = container.getHierarchyStore().getById(record.get('store_entryid'));
		if (!store || !store.isPublicStore()) {
			reminder = settings.get('zarafa/v1/contexts/calendar/default_reminder');
		}
		record.set('reminder', reminder);
	}

	if (!data || !Ext.isDefined(data.reminder_minutes)) {
		if (record.get('alldayevent')) {
			record.set('reminder_minutes', settings.get('zarafa/v1/contexts/calendar/default_allday_reminder_time'));
		} else {
			record.set('reminder_minutes', settings.get('zarafa/v1/contexts/calendar/default_reminder_time'));
		}
	}

	if (record.get('reminder')) {
		var startDate = record.get('startdate');
		if (Ext.isDate(startDate)) {
			record.set('reminder_time', startDate);
			record.set('flagdueby', startDate.add(Date.MINUTE, -record.get('reminder_minutes')));
		}
	}

	record.endEdit();
});

/**
 * @class Zarafa.calendar.AppointmentRecord
 * @extends Zarafa.core.data.MessageRecord
 *
 * An extension to the {@link Zarafa.core.data.MessageRecord MessageRecord} specific to Appointment Request/Response Messages.
 */
Zarafa.calendar.AppointmentRecord = Ext.extend(Zarafa.core.data.MessageRecord, {

	/**
	 * The base array of ID properties which is copied to the {@link #idProperties}
	 * when the record is being created.
	 * @property
	 * @type Array
	 * @private
	 */
	baseIdProperties : [ 'entryid', 'store_entryid', 'parent_entryid', 'basedate', 'attach_num' ],

	/**
	 * Compare this {@link Zarafa.core.data.IPMRecord record} instance with another one to see
	 * if they are the same IPM Message from the server (i.e. The entryid matches).
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The IPMRecord to compare with
	 * @return {Boolean} True if the records are the same.
	 */
	equals : function(record)
	{
		if (Zarafa.calendar.AppointmentRecord.superclass.equals.apply(this, arguments) === true) {
			// For recurring appointments we must also check if we have a match on the occurence (through the basedate).
			return (this.get('basedate') === record.get('basedate'));
		}
		return false;
	},

	/**
	 * Function will get the recurrence information from (@link Zarafa.core.data.IPMRecord IPMRecord) and
	 * will generate the recurring pattern string that can be saved in recurring_pattern proeprty of {@link Zarafa.core.data.IPMRecord IPMRecord}.
	 * @return {String} Recurring pattern string that can be saved in {@link Zarafa.core.data.IPMRecord IPMRecord}.
	 */
	generateRecurringPattern : function()
	{
		// Start formatting the properties in such a way we can apply
		// them directly into the recurrence pattern.
		var type = this.get('recurrence_type');
		var everyn = this.get('recurrence_everyn');
		var start = this.get('recurrence_start').toUTC();
		var end = this.get('recurrence_end').toUTC();
		var term = this.get('recurrence_term');
		var numocc = this.get('recurrence_numoccur');
		var startocc = this.get('recurrence_startocc');
		var endocc = this.get('recurrence_endocc');
		var pattern;
		var occSingleDayRank = false;
		var occTimeRange = (startocc !== 0 && endocc !== 0);

		switch (type) {
			case Zarafa.common.recurrence.data.RecurrenceType.DAILY:
				if (everyn == 1) {
					type = _('workday');
					occSingleDayRank = true;
				} else if (everyn == (24 * 60)) {
					type = _('day');
					occSingleDayRank = true;
				} else {
					everyn /= (24 * 60);
					type = _('days');
					occSingleDayRank = false;
				}
				break;
			case Zarafa.common.recurrence.data.RecurrenceType.WEEKLY:
				if (everyn == 1) {
					type = _('week');
					occSingleDayRank = true;
				} else {
					type = _('weeks');
					occSingleDayRank = false;
				}

				// Append selected week days related information, if any
				type += _(' on ') + this.prepareWeekDaysString();
				break;
			case Zarafa.common.recurrence.data.RecurrenceType.MONTHLY:
				if (everyn == 1) {
					type = _('month');
					occSingleDayRank = true;
				} else {
					type = _('months');
					occSingleDayRank = false;
				}
				break;
			case Zarafa.common.recurrence.data.RecurrenceType.YEARLY:
				if (everyn <= 12) {
					everyn = 1;
					type = _('year');
					occSingleDayRank = true;
				} else {
					everyn = everyn / 12;
					type = _('years');
					occSingleDayRank = false;
				}
				break;
		}

		var tmpStart = start.clone();
		tmpStart.setHours(startocc / 60);
		tmpStart.setMinutes(startocc % 60);
		// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
		startocc = tmpStart.format(_('G:i'));
		tmpStart.setHours(endocc / 60);
		tmpStart.setMinutes(endocc % 60);
		// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
		endocc = tmpStart.format(_('G:i'));

		// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
		start = start.format(_('d/m/Y'));
		// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
		end = end.format(_('d/m/Y'));

		// Based on the properties, we need to generate the recurrence pattern string.
		// This is obviously very easy since we can simply concatenate a bunch of strings,
		// however this messes up translations for languages which order their words
		// differently.
		// To improve translation quality we create a series of default strings, in which
		// we only have to fill in the correct variables. The base string is thus selected
		// based on the available properties.
		if (term == Zarafa.common.recurrence.data.RecurrenceEnd.NEVER) {
			if (occTimeRange) {
				if (occSingleDayRank) {
					pattern = String.format(_('Occurs every {0} effective {1} from {2} to {3}.'), type, start, startocc, endocc);
				} else {
					pattern = String.format(_('Occurs every {0} {1} effective {2} from {3} to {4}.'), everyn, type, start, startocc, endocc);
				}
			} else {
				if (occSingleDayRank) {
					pattern = String.format(_('Occurs every {0} effective {1}.'), type, start);
				} else {
					pattern = String.format(_('Occurs every {0} {1} effective {2}.'), everyn, type, start);
				}
			}
		} else if (term == Zarafa.common.recurrence.data.RecurrenceEnd.N_OCCURENCES) {
			if (occTimeRange) {
				if (occSingleDayRank) {
					pattern = String.format(ngettext('Occurs every {0} effective {1} for {2} occurence from {3} to {4}.', 'Occurs every {0} effective {1} for {2} occurences from {3} to {4}.', numocc),
								type, start, numocc, startocc, endocc);
				} else {
					pattern = String.format(ngettext('Occurs every {0} {1} effective {2} for {3} occurence from {4} to {5}.', 'Occurs every {0} {1} effective {2} for {3} occurences {4} to {5}.', numocc),
								everyn, type, start, numocc, startocc, endocc);
				}
			} else {
				if (occSingleDayRank) {
					pattern = String.format(ngettext('Occurs every {0} effective {1} for {2} occurence.', 'Occurs every {0} effective {1} for {2} occurences.', numocc),
								type, start, numocc);
				} else {
					pattern = String.format(ngettext('Occurs every {0} {1} effective {2} for {3} occurence.', 'Occurs every {0} {1} effective {2} for {3} occurences.', numocc),
								everyn, type, start, numocc);
				}
			}
		} else if (term == Zarafa.common.recurrence.data.RecurrenceEnd.ON_DATE) {
			if (occTimeRange) {
				if (occSingleDayRank) {
					pattern = String.format(_('Occurs every {0} effective {1} until {2} from {3} to {4}.'), type, start, end, startocc, endocc);
				} else {
					pattern = String.format(_('Occurs every {0} {1} effective {2} until {3} from {4} to {5}.'), everyn, type, start, end, startocc, endocc);
				}
			} else {
				if (occSingleDayRank) {
					pattern = String.format(_('Occurs every {0} effective {1} until {2}.'), type, start, end);
				} else {
					pattern = String.format(_('Occurs every {0} {1} effective {2} until {3}.'), everyn, type, start, end);
				}
			}
		}

		return pattern;
	},

	/**
	 * Generates meeting time details which will be added to meeting response body.
	 * @return {String} generated body message.
	 */
	generateMeetingTimeInfo : function(responseText)
	{
		var messageBody = responseText || '';
		var startDate = this.get('startdate');
		var dueDate = this.get('duedate');
		var meetingLocation = this.get('location') || '';
		var recurringPattern = this.get('recurring_pattern') || '';

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
	 * Sends a requests to accept/decline a incoming meeting request.
	 *
	 * @param {Zarafa.core.mapi.ResponseStatus} responseType accept/decline/propose new time
	 * @param {String} meetingTimeInfo Meeting Time Information shown in message body.
	 * @param {Boolean} noResponse true if no response should be send to organizer else false
	 * @private
	 */
	sendMeetingRequestResponse : function(responseType, meetingTimeInfo, sendResponse)
	{
		if (Ext.isDefined(responseType)) {
			switch(responseType)
			{
				case Zarafa.core.mapi.ResponseStatus.RESPONSE_TENTATIVE:
				case Zarafa.core.mapi.ResponseStatus.RESPONSE_ACCEPTED:
					this.addMessageAction('action_type', 'acceptMeetingRequest');
					break;
				case Zarafa.core.mapi.ResponseStatus.RESPONSE_DECLINED:
					this.addMessageAction('action_type', 'declineMeetingRequest');
					break;
			}

			this.addMessageAction('responseType', responseType);
			this.addMessageAction('meetingTimeInfo', meetingTimeInfo);
			this.addMessageAction('sendResponse', sendResponse);

			this.getStore().save(this);
		}
	},

	/**
	 * Respond to a meeting request with the correct {@link Zarafa.core.mapi.ResponseStatus}.
	 *
	 * @param {Zarafa.core.mapi.ResponseStatus} responseType accept/decline/tentative
	 * @param {String} comment user's extra comments to response
	 * @param {Boolean} sendResponse send response to organizer
	 */
	respondToMeetingRequest : function(responseType, comment, sendResponse)
	{
		this.sendMeetingRequestResponse(responseType, this.generateMeetingTimeInfo(comment), sendResponse);
	},

	/**
	 * Proposes new time for received meeting request
	 *
	 * @param {Zarafa.core.mapi.ResponseStatus} responseType tentative accept/decline
	 * @param {String} comment user's extra comment in propose new time dialog
	 * @param {Date} startDate Proposed start time for the meeting
	 * @param {Date} endDate Proposed end time for the meeting
	 */
	proposeNewTimeToMeetingRequest : function(responseType, comment, startDate, endDate)
	{
		this.set('counter_proposal', true);

		this.addMessageAction('proposed_starttime', startDate);
		this.addMessageAction('proposed_endtime', endDate);

		this.sendMeetingRequestResponse(responseType, this.generateProposeNewTimeBody(comment, startDate, endDate), true);
	},

	/**
	 * Genereates body for propose new time MR mail.
	 *
	 * @param {String} comment user's extra comments in propose new time dialog
	 * @param {Date} startDate Proposed start time for the meeting
	 * @param {Date} endDate Proposed end time for the meeting
	 */
	generateProposeNewTimeBody : function (comment, startDate, endDate)
	{
		var proposeNewTimeBody = comment + '\n\n\n-----------\n' + _('New Meeting Time Proposed') + ':\n';
		// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
		proposeNewTimeBody += startDate.format(_('l jS F Y G:i')) + ' - ';
		// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
		proposeNewTimeBody += endDate.format(_('l jS F Y G:i')) + '\n';

		return proposeNewTimeBody;
	},

	/**
	 * Function cancels Meeting invitation and sends Meeting Cancellation message.
	 * @param {String} Meeting Time Information shown in message body.
	 */
	cancelInvitation : function(meetingTimeInfo)
	{
		this.addMessageAction('action_type', 'cancelInvitation');
		this.addMessageAction('meetingTimeInfo', this.generateMeetingTimeInfo(meetingTimeInfo));

		var store = this.getStore();
		store.remove(this);
		store.save(this);
	},

	/**
	 * Function which cancel/decline/deletes Meeting and sends Meeting decline message to organizer.
	 * @param {String} sendUpdateFlag flag which decides messageAction for the deleting item
	 */
	declineMeeting : function(sendUpdateFlag)
	{
		var store = this.getStore();

		if(sendUpdateFlag){
			this.addMessageAction('action_type', 'declineMeeting');
		}

		store.remove(this);
		store.save(this);
	},

	/**
	 * Function is used to check if duedate property value of
	 * {@link Zarafa.calendar.AppointmentRecord AppointmentRecord} is in past or not.
	 * @return {Boolean} true if meeting/appointment is in past else false.
	 */
	isAppointmentInPast : function()
	{
		var dueDate = this.get('duedate');

		// find the correct due date for recurring appointments
		if  (this.isRecurring()) {
			dueDate = this.get('enddate_recurring');
		}

		if(Ext.isDate(dueDate) && dueDate.getTime() < (new Date().getTime())) {
			return true;
		}

		return false;
	},

	/**
	 * @return {Boolean} Returns true if the {@link Zarafa.core.data.AppointmentRecord AppointmentRecord} has
	 * been sent to the invitees.
	 */
	isMeetingSent : function()
	{
		return this.isMeetingOrganized() && this.get('request_sent') === true;
	},

	/**
	 * @return {Boolean} Returns true if the {@link Zarafa.core.data.AppointmentRecord AppointmentRecord} has
	 * meeting status received.
	 */
	isMeetingReceived : function()
	{
		return this.get('meeting') === Zarafa.core.mapi.MeetingStatus.MEETING_RECEIVED &&
			   this.get('responsestatus') !== Zarafa.core.mapi.ResponseStatus.RESPONSE_ORGANIZED;
	},

	/**
	 * @return {Boolean} Returns true if the {@link Zarafa.core.data.AppointmentRecord AppointmentRecord} has
	 * meeting status organized.
	 */
	isMeetingOrganized : function()
	{
		return this.get('meeting') === Zarafa.core.mapi.MeetingStatus.MEETING &&
			   this.get('responsestatus') === Zarafa.core.mapi.ResponseStatus.RESPONSE_ORGANIZED;
	},

	/**
	 * @return {Boolean} Returns true if the {@link Zarafa.core.data.AppointmentRecord AppointmentRecord} has
	 * meeting status nonmeeting.
	 */
	isMeeting : function()
	{
		var meeting = this.get('meeting');
		return (meeting && meeting !== Zarafa.core.mapi.MeetingStatus.NONMEETING);
	},

	/**
	 * @return {Boolean} Returns true if the {@link Zarafa.core.data.AppointmentRecord AppointmentRecord} has
	 * meeting status meeting canceled.
	 */
	isMeetingCanceled : function()
	{
		var meeting = this.get('meeting');
		return (meeting === Zarafa.core.mapi.MeetingStatus.MEETING_CANCELED || meeting === Zarafa.core.mapi.MeetingStatus.MEETING_RECEIVED_AND_CANCELED);
	},

	/**
	 * @return {Boolean} Returns true if the {@link Zarafa.core.data.AppointmentRecord AppointmentRecord} has
	 * meeting status meeting received and canceled.
	 */
	isMeetingReceivedAndCanceled : function()
	{
		return this.get('meeting') === Zarafa.core.mapi.MeetingStatus.MEETING_RECEIVED_AND_CANCELED &&
			   this.get('responsestatus') !== Zarafa.core.mapi.ResponseStatus.RESPONSE_ORGANIZED;
	},

	/**
	 * @return {Boolean} Returns true when the organizer requires a response from the attendee
	 */
	isMeetingResponseRequired : function()
	{
		return this.isMeetingReceived() && this.get('responsestatus') !== Zarafa.core.mapi.ResponseStatus.RESPONSE_NONE;
	},

	/**
	 * @return {Boolean} Returns true if the {@link Zarafa.core.data.AppointmentRecord AppointmentRecord} is
	 * recurring appointment.
	 */
	isRecurring : function()
	{
		return this.get('recurring') === true && !this.hasIdProp('basedate');
	},

	/**
	 * @return {Boolean} Returns true if the {@link Zarafa.core.data.AppointmentRecord AppointmentRecord} is
	 * recurring occurence appointment.
	 */
	isRecurringOccurence : function()
	{
		return Ext.isDate(this.get('basedate'));
	},

	/**
	 * @return {Boolean} Returns true if the {@link Zarafa.core.data.AppointmentRecord AppointmentRecord} is
	 * recurring occurence appointment.
	 */
	isRecurringException : function()
	{
		return Ext.isDate(this.get('basedate')) && this.get('exception') === true;
	},

	/**
	 * Convenience method for determining if the message is a sub message of another message.
	 * For appointment record we need to also check if message is not an exception/occurence of recurring appointment.
	 * @return {Boolean} True if this message is a sub message.
	 */
	isSubMessage : function()
	{
		// Recurring occurences can never be embedded message
		if(this.isRecurringOccurence()) {
			return false;
		}

		return Zarafa.calendar.AppointmentRecord.superclass.isSubMessage.apply(this, arguments);
	},

	/**
	 * @return {Boolean} Returns true if this
	 */
	hasRecurringExceptions : function()
	{
		// The appointment is not open, we don't know if there is an exeption or not
		if (!this.isOpened()) {
			return undefined;
		}

		// If the apointment is not recurring, or this is an occurence, there are no exceptions.
		if (!this.isRecurring()) {
			return false;
		}

		// If the appointment is recurring and having any exceptions.
		if (this.isRecurring() && this.get('recurrence_numexcept') > 0) {
			return true;
		}

		// Search if the recurring appointment has an exception attachment.
		var subStore = this.getSubStore('attachments');
		if (!subStore) {
			return false;
		}

		return subStore.findBy(function(attach) { return attach.isRecurrenceException(); }) >= 0;
	},

	/**
	 * Called by the store after the record was opened successfully.
	 * @private
	 */
	afterOpen : function()
	{
		if (this.isRecurring()) {
			// Recurring appointments can be opened as series or as occurence.
			// When openening as a series, we actually have all the data for a single
			// occurence (the one the user selected from the UI), which we are overriding
			// with the data about the series. However, the occurence and series have
			// slight differences. The series doesn't have a basedate, and the startdate
			// and duedate properties are the values from the first occurence.
			// When the record is being opened, it might already have been hooked to a
			// UI componennt, which at this moment has been initialized with the data
			// from the occurence. Force all fields which will likely to be different
			// between the occurence and series to be marked as modified, forcing the
			// UI to reinitialize the components which belong to it.
			this.modified = this.modified || {};
			this.modified['startdate'] = this.get('startdate');
			this.modified['duedate'] = this.get('duedate');
			this.modified['basedate'] = this.get('basedate');
			if (this.trackUpdateModifications === true) {
				this.updateModifications = this.updateModifications || {};
				this.updateModifications['startdate'] = this.get('startdate');
				this.updateModifications['duedate'] = this.get('duedate');
				this.updateModifications['basedate'] = this.get('basedate');
			}
		}

		Zarafa.calendar.AppointmentRecord.superclass.afterOpen.call(this);

		this.opened = !this.isRecurring();
		this.openedSeries = !this.opened;

		this.updateMeetingRecipients();
	},

	/**
	 * @return {Boolean} true if the record has been fully loaded.
	 */
	isOpened : function()
	{
		if (!this.isRecurring()) {
			return this.opened === true;
		} else {
			return this.openedSeries === true;
		}
	},

	/**
	 * @return {Boolean} true if the record is copied record.
	 */
	isCopied : function ()
	{
		return (this.get('auxiliary_flags') & Zarafa.core.mapi.AppointmentAuxiliaryFlags.auxApptFlagCopied) > 0;
	},

	/**
	 * Add action to Message Action list. When the added MessageAction is 'Send',
	 * then this will automatically {@link #generateMeetingTimeInfo update the meetingTimeInfo} as well.
	 * @param {String} name The action name to add to the list.
	 * @param {String} value The value attached to the action name
	 */
	addMessageAction : function(name, value)
	{
		Zarafa.calendar.AppointmentRecord.superclass.addMessageAction.apply(this, arguments);
		if (name === 'send') {
			this.addMessageAction('meetingTimeInfo', this.generateMeetingTimeInfo(this.getBody()));
		}
		if (name === 'meetingTimeInfo') {
			// If the record has not been opened yet, the body will not be part of the
			// meetingTimeInfo. In this case the server needs to add this.
			if(!this.isOpened()){
				this.addMessageAction('append_body', true);
			}else{
				this.deleteMessageAction('append_body');
			}
		}
	},

	/**
	 * Called by Extjs whenever {@link #endEdit} has been called (or {@link #set} without {@link #editing} enabled).
	 * If this {@link #hasMessageAction messageAction} 'send' has been set, then this will automatically
	 * {@link #generateMeetingTimeInfo update the meetingTimeInfo} as well.
	 * @override
	 * @private
	 */
	afterEdit : function()
	{
		if (this.isMeeting() && this.hasMessageAction('send')) {
			this.addMessageAction('meetingTimeInfo', this.generateMeetingTimeInfo(this.getBody()));
		}
		Zarafa.calendar.AppointmentRecord.superclass.afterEdit.apply(this, arguments);
	},

	/**
	 * This will update all timezone properties inside this record, the properties
	 * will be initialized according to the timezone information which is currently
	 * valid for this browser (See {@link Date#getTimezoneStruct}).
	 */
	updateTimezoneInformation : function()
	{
		var tz = Date.getTimezoneStruct();

		this.beginEdit();
		this.set('timezone', tz.timezone);
		this.set('timezone_timezonedst', tz.timezonedst);
		this.set('timezone_dstendmonth', tz.dstendmonth);
		this.set('timezone_dstendweek', tz.dstendweek);
		this.set('timezone_dstendday', tz.dstendday);
		this.set('timezone_dstendhour', tz.dstendhour);
		this.set('timezone_dststartmonth', tz.dststartmonth);
		this.set('timezone_dststartweek', tz.dststartweek);
		this.set('timezone_dststartday', tz.dststartday);
		this.set('timezone_dststarthour', tz.dststarthour);
		this.endEdit();
	},

	/**
	 * This will update the {@link Zarafa.calendar.AppointmentRecord AppointmentRecord} recipients
	 * based on the current {@link Zarafa.core.mapi.MeetingStatus 'meeting' status}.
	 * If this appointment is a {@link #isMeeting meeting} then the organizer will be added into
	 * the recipients table otherwise all recipients will be removed.
	 */
	updateMeetingRecipients : function()
	{
		var recipientStore = this.getSubStore('recipients');
		if (!Ext.isDefined(recipientStore)) {
			return;
		}

		if (this.isMeeting()) {
			// find index of organizer's record
			var orgIndex = recipientStore.findBy(function(record, id) {
				if(record.isMeetingOrganizer()) {
					return true;
				}
			}, this);

			if (orgIndex < 0) {
				var props = {
					recipient_type : Zarafa.core.mapi.RecipientType.MAPI_ORIG,
					recipient_flags : Zarafa.core.mapi.RecipientFlags.recipSendable | Zarafa.core.mapi.RecipientFlags.recipOrganizer,
					recipient_trackstatus : Zarafa.core.mapi.ResponseStatus.RESPONSE_ORGANIZED
				};

				// Check if the sent_representing_* properties are there,
				// if that is the case the organizer is the represented user,
				// otherwise the real sender is the organizer,
				if (this.get('sent_representing_entryid')) {
					Ext.apply(props, {
						display_name : this.get('sent_representing_name'),
						smtp_address : this.get('sent_representing_email_address'),
						address_type : this.get('sent_representing_address_type'),
						entryid : this.get('sent_representing_entryid')
					});
				} else {
					Ext.apply(props, {
						display_name : this.get('sender_name'),
						smtp_address : this.get('sender_email_address'),
						address_type : this.get('sender_address_type'),
						entryid : this.get('sender_entryid')
					});
				}

				// no organizer found then, add one
				// Apply fake ID to prevent is being marked as phantom
				var organizer = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RECIPIENT, props, -1);

				// Act like a dummy store load operation to add organizer in recipient sub store
				// without any changes being registered.
				var existingRecords = [];
				recipientStore.each(function(rec){
					// Copy the record to get a separate instance instead of referring the same instance.
					existingRecords.push(rec.copy());
				});
				existingRecords.push(organizer);

				recipientStore.loadRecords({records : existingRecords}, undefined, true);

				// Register for an update event of ShadowStore to add organizer every time
				// when server responded about recipient(s) related changes
				container.getShadowStore().on('update', this.addOrganizerAfterUpdate, this);
			}

			// Apply sorting to the RecipientStore as we want
			// the organizer to be sorted to the start of the store,
			// and the rest to be applied on the rowid.
			recipientStore.sortBy('ASC', function(a, b) {
				var aOrganizer = a.isMeetingOrganizer();
				var bOrganizer = b.isMeetingOrganizer();

				if (aOrganizer !== bOrganizer) {
					return aOrganizer ? -1 : 1;
				} else {
					return a.get('rowid') - b.get('rowid');
				}
			});

		} else if (recipientStore.getCount() > 0) {
			// Normal appointments don't have any recipients.
			recipientStore.removeAll();
		}
	},

	/**
	 * Event handler executed when update event will be fired if a Record has been updated.
	 * {@link #updateMeetingRecipients} method will be called to add organizer into the recipient sub store,
	 * while server will send modified recipient set.
	 * @param {Zarafa.core.data.ShadowStore} store The store from which any record(s) gets updated
	 * @param {Ext.data.Record} record The Record that was updated
	 * @param {String} operation The update operation being performed
	 */
	addOrganizerAfterUpdate : function(store, record, operation)
	{
		if(operation === Ext.data.Record.COMMIT) {
			// Unregister the update event from shadow store as it will be registered again if there is no organizer found
			container.getShadowStore().un('update', this.addOrganizerAfterUpdate, this);
			this.updateMeetingRecipients();
		}
	},

	/**
	 * Update the current appointment to a meeting, this will update the 'meeting'
	 * and 'responsestatus' properties to the proper values.
	 */
	convertToMeeting : function()
	{
		this.beginEdit();
		this.set('meeting', Zarafa.core.mapi.MeetingStatus.MEETING);
		this.set('responsestatus', Zarafa.core.mapi.ResponseStatus.RESPONSE_ORGANIZED);
		this.updateMeetingRecipients();
		this.endEdit();
	},

	/**
	 * Update the current meeting to a normal appointment, this will update the 'meeting'
	 * and 'responsestatus' properties to the proper values.
	 */
	convertToAppointment : function()
	{
		this.beginEdit();
		this.set('meeting', Zarafa.core.mapi.MeetingStatus.NONMEETING);
		this.set('responsestatus', Zarafa.core.mapi.ResponseStatus.RESPONSE_NONE);
		this.updateMeetingRecipients();
		this.endEdit();
	},

	/**
	 * Function is used to convert a series record to an occurence record.
	 * When we are opening a single occurence from series record then we need to modify some properties
	 * that are different on occurence record and also need to add basedate as {@link #idProperties}.
	 * so the record can be correctly identified as an occurence record.
	 * @return {Zarafa.core.data.IPMRecord} record that can be used to open occurence of a series.
	 */
	convertToOccurenceRecord : function()
	{
		// only convert it when its a series record
		if(this.hasIdProp('basedate') === false) {
			var cloneRec = this.copy();

			// For occurences the the 'recurring' property must
			// always be false (as the occurence itself doesn't recur.
			cloneRec.set('recurring', false);

			// For occurences, the 'basedate' is part of the unique id
			cloneRec.addIdProp('basedate');

			// set delegate properties if needed
			if(!cloneRec.userIsStoreOwner()) {
				var storeRecord = container.getHierarchyStore().getById(cloneRec.get('store_entryid'));
				if(storeRecord) {
					cloneRec.setDelegatorInfo(storeRecord, true);
				}
			}

			return cloneRec;
		}

		return this;
	},

	/**
	 * Function is used to convert an occurence record to a series record.
	 * Series and occurence records has some silghtly differences in properties so we need to reset some
	 * properties which are only valid for occurence record not for series record.
	 * Also we need to remove basedate property from {@link #idProperties} so record will be correctly identified
	 * as a series record.
	 * @return {Zarafa.core.data.IPMRecord} record that can be used to open whole series.
	 */
	convertToSeriesRecord : function()
	{
		// only convert it when its a occurrence record
		if(this.hasIdProp('basedate') === true) {
			var cloneRec = this.copy();

			// Series always have the 'recurring' property to true
			// (occurences themselves have this property set to false
			cloneRec.set('recurring', true);
			// The 'basedate' is not used in series
			cloneRec.set('basedate', '');
			// A series cannot be an exception
			cloneRec.set('exception', false);

			// Remove the 'basedate' from the unique id
			cloneRec.removeIdProp('basedate');

			return cloneRec;
		}

		return this;
	},

	/**
	 * Function is used to convert 'recurrence_weekdays' {@link Zarafa.common.recurrence.data.RecurrenceSubtype subtype}
	 * property into a comma separated list which contains selected week days. To display weekday information
	 * as a part of recurring pattern.
	 * @return {String} A string containing selected week days separated by comma.
	 */
	prepareWeekDaysString : function()
	{
		var weekDaysObject = new Ext.util.MixedCollection();
		var weekStart = container.getSettingsModel().get('zarafa/v1/main/week_start');
		var checkedWeekDays = [];

		// Dynamically prepare an object which contains mapping between day name and its value according to the configured week start setting.
		for (var i = 0; i < Date.dayNames.length; i++) {
			weekDaysObject.add({
				dayName: Date.dayNames[(weekStart + i) % 7],
				dayValue : Math.pow(2, (weekStart + i) % 7)
			});
		}

		// Get the property value from record to prepare array of selected week days.
		var weekdays = this.get('recurrence_weekdays');
		weekDaysObject.each(function(dayObject) {
			if(!!(dayObject.dayValue & weekdays)){
				checkedWeekDays.push(dayObject.dayName);
			}
		});

		// Check if there is more than one days are selected, to append 'and' word before last week day
		if(checkedWeekDays.length > 1) {
			var lastWeekDayIndex = checkedWeekDays.length - 1;
			checkedWeekDays[lastWeekDayIndex] = _('and ') + checkedWeekDays[lastWeekDayIndex];
		}

		return (checkedWeekDays.length === 2) ? checkedWeekDays.join(" ") : checkedWeekDays.join(", ");
	}
});

Zarafa.core.data.RecordFactory.setBaseClassToMessageClass('IPM.Appointment', Zarafa.calendar.AppointmentRecord);
Zarafa.core.data.RecordFactory.setBaseClassToMessageClass('IPM.OLE.CLASS.{00061055-0000-0000-C000-000000000046}', Zarafa.calendar.AppointmentRecord);
