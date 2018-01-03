/*
 * Test the Zarafa.core.data.MessageRecord
 */
describe('MessageRecord', function() {
	var record;
  const data = {
    'entryid': '000000001A2BB1DF088E453CB94B73D67E0BAB1001000000050000000000000000000000000000000000006425534895B4CA5AC93F06388C00000000',
    'parent_entryid': '000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000006525534895B4CA5AC93F06388C00000000',
    'store_entryid': '0000000038A1BB1005E5101AA1BB08002B2A56C200007A617261666136636C69656E742E646C6C00000000001A2BB1DF088E453CB94B73D67E0BAB1001000000010000000000000000000000000000000000006653914E6FBE75A7DF49F9A4A866696C653A2F2F2F7661722F72756E2F7A61726166610000',
    'message_class': 'IPM.Note',
    'subject': 'a',
    'normalized_subject': 'a',
    'html_body': '<img src="http://example.org/foo.png">',
    'isHTML' : true,
    'message_delivery_time' : new Date(1306916229 * 1000),
    'block_status' : 34524308,
    'sent_representing_entryid' : '00000000AC21A95040D3EE48B319FBA753304425010000000600000000000000000000000000000000000067EID',
    'sent_representing_name' : 'john',
    'sent_representing_email_address' : 'john@kopano.local',
    'sent_representing_address_type' : 'ZARAFA',
    'sender_entryid' : '00000000AC21A95040D3EE48B319FBA753304425010000000600000000000000000000000000000000000068EID',
    'sender_name' : 'jane',
    'sender_email_address' : 'jane@kopano.local',
    'sender_address_type' : 'ZARAFA'
  };

  beforeAll(function() {
    container = new Zarafa.core.Container();
    container.setUser({
      'entryid': '00000000AC21A95040D3EE48B319FBA753304425010000000600000000000000000000000000000000000001EID',
      'username': 'Test test',
      'email_address': 'test@john.doe'
    });
  });

	beforeEach(function() {
		record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Note', data, '000000001A2BB1DF088E453CB94B73D67E0BAB1001000000050000000000000000000000000000000000006425534895B4CA5AC93F06388C00000000');
	});

	/*
	 * Test the calculation of block_status property
	 */
	describe('Block Status Property', function() {
		var checkBlockStatus;

		beforeEach(function() {
			checkBlockStatus = function() {
				return record.checkBlockStatus();
			};
		});

		it('can check block_status property value', function() {
			expect(checkBlockStatus).not.toThrow();
			expect(checkBlockStatus()).toBeTruthy();
		});

		it('can check block_status property value with invalid block_status value', function() {
			record.set('block_status', 111);		// an invalid value
			expect(record.checkBlockStatus()).toBeFalsy();
		});

		it('will block images for received mails', function() {
			record.set('message_delivery_time', new Date());
			expect(record.checkBlockStatus()).toBeFalsy();
		});

		it('will not block images for mails sent by the user himself', function() {
			const user = container.getUser();
			record.set('sent_representing_entryid', user.getEntryId());
			record.set('sent_representing_name', user.getUserName());
			record.set('sent_representing_email_address', user.getEmailAddress());
			record.set('sent_representing_address_type', 'ZARAFA');

			expect(record.checkBlockStatus()).toBeTruthy();
		});
	});

	/*
	 * Test if record contains external content
	 */
	describe('Has External Content', function() {
		var hasExternalContent;

		beforeEach(function() {
			hasExternalContent = function() {
				return record.hasExternalContent();
			};
		});

		it('can check record body for external content', function() {
			expect(hasExternalContent).not.toThrow();
			expect(hasExternalContent()).toBeTruthy();
		});

		it('can check record body for external content after change in body', function() {
			expect(hasExternalContent()).toBeTruthy();
			record.set('html_body', '<b>no external content here</b>');
			expect(hasExternalContent()).toBeFalsy();
		});
	});

	/*
	 * Test if external content should be blocked based on settings
	 */
	describe('Block External Content', function() {
		var isExternalContentBlocked;
		var settingsModel;

		beforeEach(function() {
			isExternalContentBlocked = function() {
				return record.isExternalContentBlocked();
			};

			settingsModel = container.getSettingsModel();
      settingsModel.initialize({});

			spyOn(container, 'getSettingsModel').and.returnValue(settingsModel);
			// don't send saving requests to server
			spyOn(settingsModel, 'execute');

			// reset values to default
			record.set('block_status', 0);
		});

    afterEach(function() {
      settingsModel.remove();
    });

		it('can block external content in record body without any error', function() {
			expect(isExternalContentBlocked).not.toThrow();
		});

		it('should check for block_external_content setting', function() {
			settingsModel.set('zarafa/v1/contexts/mail/block_external_content', false);
			expect(isExternalContentBlocked()).toBeFalsy();
		});

		it('should check for safe_senders_list setting for exact match', function() {

			settingsModel.set('zarafa/v1/contexts/mail/safe_senders_list', ['john@kopano.local']);
			expect(isExternalContentBlocked()).toBeFalsy();
		});

		it('should check for blocked_senders_list setting for exact match', function() {
			settingsModel.set('zarafa/v1/contexts/mail/blocked_senders_list', ['john@kopano.local']);
			expect(isExternalContentBlocked()).toBeTruthy();
		});

		it('should check for safe_senders_list setting for partial match', function() {
			settingsModel.set('zarafa/v1/contexts/mail/safe_senders_list', ['kopano.local']);
			expect(isExternalContentBlocked()).toBeFalsy();
		});

		it('should check for blocked_senders_list setting for partial match', function() {
			settingsModel.set('zarafa/v1/contexts/mail/blocked_senders_list', ['kopano.local']);
			expect(isExternalContentBlocked()).toBeTruthy();
		});

		it('should handle empty body in record', function() {
			record.set('html_body', '');
			expect(isExternalContentBlocked()).toBeFalsy();
		});
	});

	describe('getSender', function() {
		it('no sender_entryid', function() {
			record.set('sender_entryid', '');
			expect(record.getSender()).toBeFalsy();
		});

		it('sender_entryid exists', function() {
			const sender = record.getSender();
			expect(sender.get('smtp_address')).toBeDefined();
			expect(sender.get('display_name')).toBeDefined();
			expect(sender.get('address_type')).toBeDefined();
			expect(sender.get('entryid')).toBeDefined();
			expect(sender.get('search_key')).toBeDefined();
		});
	});

	describe('getSentRepresenting', function() {
		it('no sent_representing_entryid', function() {
			record.set('sent_representing_entryid', '');
			expect(record.getSentRepresenting()).toBeFalsy();
		});

		it('sent_representing_entryid exists', function() {
			const sender = record.getSentRepresenting();
			expect(sender.get('smtp_address')).toBeDefined();
			expect(sender.get('display_name')).toBeDefined();
			expect(sender.get('address_type')).toBeDefined();
			expect(sender.get('entryid')).toBeDefined();
			expect(sender.get('search_key')).toBeDefined();
		});
	});
});
