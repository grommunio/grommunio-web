/*
 * Test the Zarafa.core.data.JsonWriter and serialization of complex properties like
 * recipients, attachments etc.
 */
describe('JsonWriter', function() {
	container = new Zarafa.core.Container();
	container.setUser({'fullname': 'henk'});
	const entryid1 = '000000001A2BB1DF088E453CB94B73D67E0BAB1001000000050000000000000000000000000000000000000125534895B4CA5AC93F06388C00000000';
	const entryid2 = '000000001A2BB1DF088E453CB94B73D67E0BAB1001000000050000000000000000000000000000000000000225534895B4CA5AC93F06388C00000000';

	/*
	 * Tests if the IPMRecipientStore which is assigned to an IPMRecord can
	 * be serialied correctly by the JsonRecipientWriter.
	 */
	describe('Recipients', function() {
		var record;
		var recipientStore;
		var newRecipient;
		var modifiedRecipient;
		var deletedRecipient;

		beforeEach(function() {
			recipientStore = new Zarafa.core.data.IPMRecipientStore();

			newRecipient = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RECIPIENT);
			modifiedRecipient = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RECIPIENT, { 'rowid' : 1 }, entryid1);
			deletedRecipient = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RECIPIENT, { 'rowid' : 2 }, entryid2);

			record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Note');
			record.setRecipientStore(recipientStore);
		});

		it('can serialize the recipients store', function() {
			spyOn(recipientStore, 'getModifiedRecords').and.returnValue([ newRecipient, modifiedRecipient ]);
			spyOn(recipientStore, 'getRemovedRecords').and.returnValue([ deletedRecipient ]);

			expect(function() { recipientStore.writer.toPropHash(record); }).not.toThrow();
		});

		it('correctly creates a serialized object with added recipients', function() {
			spyOn(recipientStore, 'getModifiedRecords').and.returnValue([ newRecipient ]);

			const data = recipientStore.writer.toPropHash(record);
			expect(data.recipients.add.length).toEqual(1);
		});

		it('correctly creates a serialized object with modified recipients', function() {
			spyOn(recipientStore, 'getModifiedRecords').and.returnValue([ modifiedRecipient ]);

			const data = recipientStore.writer.toPropHash(record);
			expect(data.recipients.modify.length).toEqual(1);
		});

		it('correctly creates a serialized object with deleted recipients', function() {
			spyOn(recipientStore, 'getRemovedRecords').and.returnValue([ deletedRecipient ]);

			const data = recipientStore.writer.toPropHash(record);
			expect(data.recipients.remove.length).toEqual(1);
		});
	});

	/*
	 * Tests if the DistlistStore which is assigned to an IPMRecord can
	 * be serialied correctly by the JsonMemberWriter.
	 */
	describe('Members', function() {
		var record;
		var memberStore;

		beforeEach(function() {
			memberStore = new Zarafa.contact.DistlistMemberStore();
			const memberRecord = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_DISTLIST_MEMBER);
			memberStore.add(memberRecord);

			record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.DistList');
			record.setMemberStore(memberStore);
		});
	
		it('can serialize the members store', function() {
			expect(function() { memberStore.writer.toPropHash(record); }).not.toThrow();
		});

		it('correctly creates a serialized object with a members', function() {
			const data = memberStore.writer.toPropHash(record);
			expect(data.members.length).toEqual(1);
		});
	});

	/*
	 * Tests if the IPMAttachmentStore which is assigned to an IPMRecord can
	 * be serialied correctly by the JsonAttachmentWriter.
	 */
	describe('Attachments', function() {
		var record;
		var attachmentStore;
		var newAttachment;
		var deletedAttachment;

		beforeEach(function() {
			attachmentStore = new Zarafa.core.data.IPMAttachmentStore();

			newAttachment = Zarafa.core.data.RecordFactory.createRecordObjectByObjectType(Zarafa.core.mapi.ObjectType.MAPI_ATTACH);
			newAttachment.setInline(true);
			deletedAttachment = Zarafa.core.data.RecordFactory.createRecordObjectByObjectType(Zarafa.core.mapi.ObjectType.MAPI_ATTACH, {}, entryid2);
			deletedAttachment.setInline(true);

			record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Note');
			record.setAttachmentStore(attachmentStore);
		});

		it('can serialize the attachments store', function() {
			expect(function() { attachmentStore.writer.toPropHash(record); }).not.toThrow();
		});

		it('correctly creates a serialized object with added attachments', function() {
			spyOn(attachmentStore, 'getModifiedRecords').and.returnValue([ newAttachment ]);

			const data = attachmentStore.writer.toPropHash(record);
			expect(data.attachments.add.length).toEqual(1);
		});

		it('correctly creates a serialized object with deleted attachments', function() {
			spyOn(attachmentStore, 'getRemovedRecords').and.returnValue([ deletedAttachment ]);

			const data = attachmentStore.writer.toPropHash(record);
			expect(data.attachments.remove.length).toEqual(1);
		});
	});

	/*
	 * Test if JsonWriter can serialize IPM.StickyNote data which has no sub stores.
	 */
	describe('IPM', function() {
		var jsonWriter;
		var record;
		var attachmentStore;
		var attachmentRecord;

		beforeEach(function() {
			jsonWriter = new Zarafa.core.data.JsonWriter({ meta : { idProperty : 'entryid' } });
			attachmentStore = new Zarafa.core.data.IPMAttachmentStore();
			attachmentRecord = Zarafa.core.data.RecordFactory.createRecordObjectByObjectType(Zarafa.core.mapi.ObjectType.MAPI_ATTACH);
			attachmentStore.add(attachmentRecord);

			record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Note');
			record.setAttachmentStore(attachmentStore);
		});

		it('only serializes the ID properties when opening the record', function() {
			const data = jsonWriter.openRecord(record);
			expect(data.entryid).toBeDefined();
			expect(data.props).not.toBeDefined();
		});

		it('serializes both ID and the normal properties when creating the record', function() {
			const data = jsonWriter.createRecord(record);
			expect(data.entryid).toBeDefined();
			expect(data.props).toBeDefined();
		});

		it('serializes both ID and the normal properties when updating the record', function() {
			const data = jsonWriter.updateRecord(record);
			expect(data.entryid).toBeDefined();
			expect(data.props).toBeDefined();
		});

		it('only serializes the ID properties when deleting the record', function() {
			const data = jsonWriter.destroyRecord(record);
			expect(data.entryid).toBeDefined();
			expect(data.props).not.toBeDefined();
		});

		it('serializes the substore when this is supported by the record', function() {
			const data = jsonWriter.createRecord(record);
			expect(data.attachments).toBeDefined();
		});

		it('doesn\'t serialize a substore when this is not supported by the record', function() {
			delete record.subStoresTypes.attachments;
			const data = jsonWriter.createRecord(record);
			expect(data.attachments).not.toBeDefined();
		});
	});

	/*
	 * Test that all Types are correctly converted to Json.
	 * (Dates become timestamps, etc...).
	 */
	describe('Types', function() {
		var jsonWriter;
		var record;

		beforeEach(function() {
			jsonWriter = new Zarafa.core.data.JsonWriter({ meta : { idProperty : 'entryid' } });
			record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Note', { entryid : entryid1 }, entryid1);
		});

		it('serializes a Date object to a timestamp', function() {
			record.set('creation_time', new Date());
			const data = jsonWriter.updateRecord(record);
			jsonWriter.renderData(data);
			expect(data.props.creation_time).toEqual(Math.floor(record.get('creation_time').getTime() / 1000));
		});
	});
});
