/*
 * Test the RecipientStore actions.
 */
describe("RecipientStore", function() {
	/* Recipient Request */
	const data = {
		"item": [{
			"entryid": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000050000000000000000000000000000000000006425534895B4CA5AC93F06388C00000000",
			"parent_entryid": "000000001A2BB1DF088E453CB94B73D67E0BAB1001000000030000000000000000000000000000000000006525534895B4CA5AC93F06388C00000000",
			"store_entryid": "0000000038A1BB1005E5101AA1BB08002B2A56C200007A617261666136636C69656E742E646C6C00000000001A2BB1DF088E453CB94B73D67E0BAB1001000000010000000000000000000000000000000000006653914E6FBE75A7DF49F9A4A866696C653A2F2F2F7661722F72756E2F7A61726166610000",
			"props": {
			"message_class": "IPM.Note",
			"subject": "a",
			"normalized_subject": "a",
			"body": "b",
			"sent_representing_entryid": "00000000AC21A95040D3EE48B319FBA753304425010000000600000000000000000000000000000000000001EID",
			"sent_representing_name": "jane",
			"sent_representing_email_address": "jane@zarafa.local",
			"sent_representing_address_type": "ZARAFA",
			"isHTML": false
			},
			"recipients": {
			"item": [
			{
			"rowid": 0,
			"props": {
			"display_name": "John Doe",
			"email_address": "john",
			"smtp_address": "john@zarafa.local",
			"address_type": "ZARAFA",
			"object_type": 6,
			"recipient_type": 1,
			"entryid": "00000000AC21A95040D3EE48B319FBA753304425010000000600000000000000000000000000000000000003EID",
			"proposednewtime": false,
			"recipient_trackstatus": 0,
			"recipient_trackstatus_time": 23423422
			}
			},
			{
			"rowid": 1,
			"props": {
				"display_name": "Jane Doe",
				"email_address": "jane",
				"smtp_address": "jane@zarafa.local",
				"address_type": "ZARAFA",
				"object_type": 6,
				"recipient_type": 2,
				"entryid": "00000000AC21A95040D3EE48B319FBA753304425010000000600000000000000000000000000000000000004EID",
				"proposednewtime": false,
				"recipient_trackstatus": 0,
				"recipient_trackstatus_time": 234234
			}
			}]
			},
			"attachments": {
				"item": [
					{
					"attach_num": 0,
					"props": {
						"attach_method": 1,
						"size": 2470288,
						"filetype": "application/pdf",
						"hidden": false,
						"name": "ECMA-262.pdf"
					}
					}
				]
			}
		}]
	};

	/*
	 * Test if the formatting functions for recipients (string to recipient,
	 * and recipient to string conversions) is working correctly.
	 */
	describe('Formatting', function() {
		var store;
		var recipient;

		beforeEach(function() {

			store = new Zarafa.core.data.IPMRecipientStore();
			recipient = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RECIPIENT, {
				'rowid': 0,
				'display_name': 'Alice Doe',
				'email_address': 'alice',
				'smtp_address': 'alice@zarafa.local',
				'address_type': 'ZARAFA',
				'object_type': Zarafa.core.mapi.ObjectType.MAPI_MAILUSER,
				'recipient_type': Zarafa.core.mapi.RecipientType.MAPI_TO,
				'entryid': '00000000AC21A95040D3EE48B319FBA753304425010000000600000000000000000000000000000000000003EID',
				'proposednewtime': false,
				'recipient_trackstatus': Zarafa.core.mapi.RecipientTrackStatus.RECIPIENT_TRACKSTATUS_NONE,
				'recipient_trackstatus_time': new Date()
			}, 0);

			store.add(recipient);
		});

		afterEach(function() {
			store.destroy();
		});

		it('can convert a recipient into a user-friendly string', function() {
			expect(recipient.formatRecipient()).toEqual('Alice Doe <alice@zarafa.local>');
		});	

		it('can convert the string \'Alice Doe\' into a recipient', function() {
			var recipient = store.parseRecipient('Alice Doe');

			expect(recipient.get('display_name')).toEqual('Alice Doe');
			expect(recipient.get('smtp_address')).toEqual('');
		});

		it('can convert the string \'alice@zarafa.local\' into a recipient', function() {
			var recipient = store.parseRecipient('alice@zarafa.local');

			expect(recipient.get('display_name')).toEqual('alice@zarafa.local');
			expect(recipient.get('smtp_address')).toEqual('alice@zarafa.local');
		});

		it('can convert the string \'alice@zarafa\' into a recipient', function() {
			var recipient = store.parseRecipient('alice@zarafa');

			expect(recipient.get('display_name')).toEqual('alice@zarafa');
			expect(recipient.get('smtp_address')).toEqual('');
		});

		it('can convert the string \'Alice Doe <alice@zarafa.local>\' into a recipient', function() {
			var recipient = store.parseRecipient('Alice Doe <alice@zarafa.local>');

			expect(recipient.get('display_name')).toEqual('Alice Doe');
			expect(recipient.get('smtp_address')).toEqual('alice@zarafa.local');
		});

		it('can convert the string \'Alice<alice@zarafa.local>\' into a recipient', function() {
			var recipient = store.parseRecipient('Alice<alice@zarafa.local>');

			expect(recipient.get('display_name')).toEqual('Alice');
			expect(recipient.get('smtp_address')).toEqual('alice@zarafa.local');
		});
	});

	describe('JsonWriter', function() {
		var ipmStore;
		var ipmRecord;
		var recipientStore;

		beforeEach(function() {
			/*jshint -W020 */
			container = new Zarafa.core.Container();
			ipmStore = new Zarafa.core.data.ListModuleStore();
			ipmRecord = ipmStore.reader.readRecords(data).records[0];
			recipientStore = ipmRecord.getSubStore('recipients');

			ipmStore.add(ipmRecord);
		});

		afterEach(function() {
			ipmStore.destroy();
		});

		it('does not serialize unmodified records', function() {
			expect(recipientStore.writer.toPropHash(ipmRecord)).toEqual({});
		});

		it('serializes modified records', function() {
			recipientStore.getAt(0).set('display_name', 'John');

			var hash = recipientStore.writer.toPropHash(ipmRecord);
			expect(hash.recipients.modify.length).toEqual(1);
			expect(hash.recipients.add).not.toBeDefined();
			expect(hash.recipients.remove).not.toBeDefined();
		});

		it('serializes added records', function() {
			const newRecipient = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RECIPIENT, {
				'display_name': 'John Doe',
				'email_address': 'john',
				'smtp_address': 'john@zarafa.local',
				'address_type': 'ZARAFA',
				'object_type': Zarafa.core.mapi.ObjectType.MAPI_MAILUSER,
				'recipient_type': Zarafa.core.mapi.RecipientType.MAPI_TO,
				'entryid': '00000000AC21A95040D3EE48B319FBA753304425010000000600000000000000000000000000000000000003EID',
				'proposednewtime': false,
				'recipient_trackstatus': Zarafa.core.mapi.RecipientTrackStatus.RECIPIENT_TRACKSTATUS_NONE,
				'recipient_trackstatus_time': new Date()
			});
			recipientStore.add(newRecipient);

			const hash = recipientStore.writer.toPropHash(ipmRecord);
			expect(hash.recipients.modify).not.toBeDefined();
			expect(hash.recipients.add.length).toEqual(1);
			expect(hash.recipients.remove).not.toBeDefined();
		});

		it('serializes removed records', function() {
			recipientStore.removeAt(0);

			const hash = recipientStore.writer.toPropHash(ipmRecord);
			expect(hash.recipients.modify).not.toBeDefined();
			expect(hash.recipients.add).not.toBeDefined();
			expect(hash.recipients.remove.length).toEqual(1);
		});
	});
});
