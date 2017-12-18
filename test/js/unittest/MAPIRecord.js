/*
 * Test the Zarafa.core.data.MAPIRecord
 */
describe('MAPIRecord', function() {
	container = new Zarafa.core.Container();
	container.setUser({'fullname': 'henk', 'username': 'henk'});
	const entryid1 = '000000001A2BB1DF088E453CB94B73D67E0BAB1001000000050000000000000000000000000000000000000125534895B4CA5AC93F06388C00000000';
	const entryid2 = '000000001A2BB1DF088E453CB94B73D67E0BAB1001000000050000000000000000000000000000000000000225534895B4CA5AC93F06388C00000000';
	var origRecord;
	var destRecord;

	beforeEach(function() {
		jasmine.addMatchers(customMatchers);

		origRecord = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Note');
		destRecord = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Note');
	});

	/*
	 * Test if making changes to the substore propagates the correct events
	 */
	describe('SubStores', function() {
		var store;
		var record;
		var recipient1;
		var recipient2;

		beforeEach(function() {
			record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Note');
			recipient1 = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RECIPIENT, { display_name: 'John' });
			recipient2 = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RECIPIENT, { display_name: 'Jane' });

			record.getSubStore('recipients').add(recipient1);

			store = container.getShadowStore();
			store.add(record);

			spyOn(store, 'fireEvent').and.callThrough();
		});

		it('fires the \'update\' event when a record has been added to a substore', function() {
			record.getSubStore('recipients').add(recipient2);
			expect(store.fireEvent).toHaveBeenCalledWithFirstArgument('update');
		});

		it('fires the \'update\' event when a record has been removed to a substore', function() {
			record.getSubStore('recipients').remove(recipient1);
			expect(store.fireEvent).toHaveBeenCalledWithFirstArgument('update');
		});

		it('fires the \'update\' event when a record has been changed in a substore', function() {
			recipient1.set('display_name', 'Bob');
			expect(store.fireEvent).toHaveBeenCalledWithFirstArgument('update');
		});

		it('does not fire the \'update\' event for a substore change during editing of the record', function() {
			record.beginEdit();
			recipient1.set('display_name', 'Bob');
			expect(store.fireEvent).not.toHaveBeenCalledWithFirstArgument('update');
			record.endEdit();
			expect(store.fireEvent).toHaveBeenCalledWithFirstArgument('update');
		});
	});

	/*
	 * Test if the MAPIRecord.applyData() is correctly merging all changes.
	 */
	describe('Merge records', function() {
		it('does merge modified fields', function() {
			origRecord.set('subject', 'test');
			origRecord.set('body', 'bla');

			destRecord.applyData(origRecord);

			expect(destRecord.get('subject')).toEqual('test');
			expect(destRecord.get('body')).toEqual('bla');
		});

		it('will add the record into the store modified array', function() {
			var store = new Zarafa.core.data.IPMStore();
			store.add(destRecord);

			origRecord.set('subject', 'test');
			origRecord.set('body', 'bla');

			destRecord.applyData(origRecord);

			expect(store.modified.indexOf(destRecord)).toBeGreaterThan(-1);
		});

		it('should remove references from objects of original record', function() {
			var date = new Date('Sun Mar 13 2017 13:37:37');

			origRecord.set('subject', 'test');
			origRecord.set('body', 'bla');
			origRecord.set('creation_time', date);

			destRecord.applyData(origRecord);

			date.setMonth(0);

			expect(destRecord.modified).not.toBe(origRecord.modified);
			expect(destRecord.data).not.toBe(origRecord.data);
			expect(destRecord.get('creation_time').getTime()).not.toEqual(date.getTime());
		});
	});

	/*
	 * Test if the MAPIRecord.applyData() is correctly merging all changes for recipients substore.
	 */
	describe('Merge recipient records', function() {
		var recip1;
		var recip2;
		var origRecipients;
		var destRecipients;
		const entryid3 = '000000001A2BB1DF088E453CB94B73D67E0BAB1001000000050000000000000000000000000000000000000325534895B4CA5AC93F06388C00000000';
		const entryid4 = '000000001A2BB1DF088E453CB94B73D67E0BAB1001000000050000000000000000000000000000000000000425534895B4CA5AC93F06388C00000000';

		beforeEach(function() {
			recip1 = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RECIPIENT, { display_name : 'test1', entryid : entryid1 }, 1);
			recip2 = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RECIPIENT, { display_name : 'test2', entryid : entryid2 }, 2);


			recip1.commit();
			recip2.commit();

			origRecipients = origRecord.getSubStore('recipients');
			destRecipients = destRecord.getSubStore('recipients');

			origRecipients.add([ recip1, recip2 ]);
			origRecipients.commitChanges();

			destRecipients.add([ recip1.copy(), recip2.copy() ]);
			destRecipients.commitChanges();

			spyOn(origRecipients, 'fireEvent').and.callThrough();
			spyOn(destRecipients, 'fireEvent').and.callThrough();
		});

		it('merges all added recipients', function() {
			var recip3 = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RECIPIENT, { display_name : 'test3', entryid : entryid3 }, 3);
			origRecipients.add(recip3);
			var recip4 = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RECIPIENT, { display_name : 'test4', entryid : entryid4 });
			origRecipients.add(recip4);

			destRecord.applyData(origRecord);

			expect(Ext.pluck(destRecipients.modified, 'id')).toEqual([ recip4.id ]);
			expect(destRecipients.removed.length).toEqual(0);
			expect(Ext.pluck(destRecipients.getRange(), 'id')).toEqual([ recip1.id, recip2.id, recip3.id, recip4.id ]);
		});

		it('merges all removed recipients', function() {
			var recip3 = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RECIPIENT, { display_name : 'test3',entryid : entryid3 }, 3);

			origRecipients.add(recip3);

			origRecipients.remove(recip1);
			origRecipients.remove(recip3);

			destRecord.applyData(origRecord);

			expect(destRecipients.modified.length).toEqual(0);
			expect(Ext.pluck(destRecipients.removed, 'id')).toEqual([ recip1.id ]);
			expect(Ext.pluck(destRecipients.getRange(), 'id')).toEqual([ recip2.id ]);
		});

		it('should not merge duplicate recipients', function() {
			var recipientRecord = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RECIPIENT, { display_name : 'test1',entryid : entryid1 }, 1);

			origRecipients.add(recipientRecord);

			destRecord.applyData(origRecord);

			expect(Ext.isEmpty(Ext.pluck(destRecipients.modified, 'id'))).toEqual(true);
			expect(destRecipients.removed.length).toEqual(0);
			expect(Ext.pluck(destRecipients.getRange(), 'id')).toEqual([ recip1.id, recip2.id ]);
		});

		it('should not merge duplicate phantom recipients', function() {
			var recip3 = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RECIPIENT, { display_name : 'test3', entryid : entryid3 });
			origRecipients.add(recip3);
			destRecipients.add(recip3);

			destRecipients.fireEvent.calls.reset();
			destRecord.applyData(origRecord);

			expect(Ext.pluck(destRecipients.modified, 'id')).toEqual([ recip3.id ]);
			expect(destRecipients.removed.length).toEqual(0);
			expect(Ext.pluck(destRecipients.getRange(), 'id')).toEqual([ recip1.id, recip2.id, recip3.id ]);
			expect(destRecipients.fireEvent).not.toHaveBeenCalledWithFirstArgument('add');
		});
	});
});
