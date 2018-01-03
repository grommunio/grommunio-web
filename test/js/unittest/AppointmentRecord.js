describe('AppointmentRecord', function() {
	const abEntryId = '00000000AC21A95040D3EE48B319FBA753304425010000000600000000000000000000000000000000000000EID';
	const startDate = new Date().add(Date.DAY, 5);
	const endDate = startDate.clone().add(Date.HOUR, 1);
	const data = {
		'startdate':  startDate,
		'duedate': endDate,
	};
	var record;
	var shadowStore;

	beforeEach(function() {
		record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Appointment', data, 1);
		shadowStore = new Zarafa.core.data.ShadowStore();
		shadowStore.add(record);
		record.store = shadowStore;
	});

	afterEach(function() {
		shadowStore.destroy();
		record.store = undefined;
	});

	describe('isMeetingReceived', function() {
		it('can generate meeting time info', function() {
			expect(record.generateMeetingTimeInfo()).toContain('When: ' + 
				startDate.format(_('l jS F Y G:i')) +
				' - '  +
				endDate.format(_('l jS F Y G:i')));
		});

		it('can display location', function() {
			record.set('location', 'Delft');
			expect(record.generateMeetingTimeInfo()).toContain('Where: Delft');
		});

		it('can take optional argument', function() {
			expect(record.generateMeetingTimeInfo('Kopano is great')).toContain('Kopano is great');
		});
	});

	describe('isAppointmentInPast', function() {
		it('is not in the past', function() {
			expect(record.isAppointmentInPast()).toBeFalsy();
		});

		it('is in the past', function() {
			record.set('duedate',  new Date('Mar 25 2017 01:00'));
			expect(record.isAppointmentInPast()).toBeTruthy();
		});
	})

	describe('generateProposeNewTimeBody', function() {
		it('can generate new proposed time', function() {
			const result = record.generateProposeNewTimeBody('Please reschedule', startDate, endDate);
			expect(result).toContain('Please reschedule');
			expect(result).toContain('New Meeting Time Proposed');
			expect(result).toContain('New Meeting Time Proposed');
			expect(result).toContain(startDate.format(_('l jS F Y G:i')) + ' - '  + endDate.format(_('l jS F Y G:i')));
		});
	});

	describe('sendMeetingRequestResponse', function() {


		it('invalid response type', function() {
			expect(record.sendMeetingRequestResponse(undefined, 'henk', 'henk')).toEqual(undefined);
		});

		it('can send tentative response', function() {
			record.sendMeetingRequestResponse(Zarafa.core.mapi.ResponseStatus.RESPONSE_TENTATIVE, 'meeting', 'yes');
			expect(record.getMessageAction('action_type')).toEqual('acceptMeetingRequest');
			expect(record.getMessageAction('meetingTimeInfo')).toEqual('meeting');
			expect(record.getMessageAction('sendResponse')).toEqual('yes');
			expect(record.getMessageAction('responseType')).toEqual(Zarafa.core.mapi.ResponseStatus.RESPONSE_TENTATIVE);
		});

		it('can send accepted response', function() {
			record.sendMeetingRequestResponse(Zarafa.core.mapi.ResponseStatus.RESPONSE_ACCEPTED, 'meeting', 'yes');
			expect(record.getMessageAction('action_type')).toEqual('acceptMeetingRequest');
			expect(record.getMessageAction('meetingTimeInfo')).toEqual('meeting');
			expect(record.getMessageAction('sendResponse')).toEqual('yes');
			expect(record.getMessageAction('responseType')).toEqual(Zarafa.core.mapi.ResponseStatus.RESPONSE_ACCEPTED);
		});

		it('can send declined response', function() {
			record.sendMeetingRequestResponse(Zarafa.core.mapi.ResponseStatus.RESPONSE_DECLINED, 'meeting', 'yes');
			expect(record.getMessageAction('action_type')).toEqual('declineMeetingRequest');
			expect(record.getMessageAction('meetingTimeInfo')).toEqual('meeting');
			expect(record.getMessageAction('sendResponse')).toEqual('yes');
			expect(record.getMessageAction('responseType')).toEqual(Zarafa.core.mapi.ResponseStatus.RESPONSE_DECLINED);
		});
	});

	describe('respondToMeetingRequest', function() {
		it('response to meeting request', function() {
			record.respondToMeetingRequest(Zarafa.core.mapi.ResponseStatus.RESPONSE_DECLINED, 'nope', 'good');
			expect(record.getMessageAction('action_type')).toEqual('declineMeetingRequest');
			expect(record.getMessageAction('meetingTimeInfo')).toContain('nope');
			expect(record.getMessageAction('sendResponse')).toEqual('good');
			expect(record.getMessageAction('responseType')).toEqual(Zarafa.core.mapi.ResponseStatus.RESPONSE_DECLINED);
		});
	});

	describe('proposeNewTimeToMeetingRequest', function() {
		it('can propose new time to meeting request', function() {
			record.proposeNewTimeToMeetingRequest(Zarafa.core.mapi.ResponseStatus.RESPONSE_DECLINED, 'comment', startDate, endDate);
			expect(record.get('counter_proposal')).toBeTruthy();
			expect(record.getMessageAction('proposed_starttime')).toEqual(startDate);
			expect(record.getMessageAction('proposed_endtime')).toEqual(endDate);
		});
	});

	describe('cancelInvitation', function() {
		container = new Zarafa.core.Container();

		it('can cancel invitation', function() {
			record.cancelInvitation('comment');
			expect(record.getMessageAction('action_type')).toEqual('cancelInvitation');
			expect(record.getMessageAction('meetingTimeInfo')).toContain('comment');
		});
	});

	describe('declineMeeting', function() {

		it('can decline meeting', function() {
			record.declineMeeting('updateflag');
			expect(record.getMessageAction('action_type')).toEqual('declineMeeting');
		});

		it('can decline meeting without updateflag', function() {
			record.declineMeeting();
			expect(record.getMessageAction('action_type')).toBeFalsy();
		});
	});
});
