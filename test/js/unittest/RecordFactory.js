/*
 * Test the Zarafa.core.data.RecordFactory
 */
describe('RecordFactory', function() {
	const entryid = '000000001A2BB1DF088E453CB94B73D67E0BAB1001000000050000000000000000000000000000000000000125534895B4CA5AC93F06388C00000000';

	afterEach(function() {
		delete Zarafa.core.data.RecordFactory.definitions['TEST'];
		delete Zarafa.core.data.RecordFactory.definitions['TEST.A'];
		delete Zarafa.core.data.RecordFactory.definitions['TEST.A.B'];
	});

	/*
	 * Tests if we can set a base class to a particular message class, this
	 * must be overridable in subtypes of the message class. When no base
	 * class is configured, it must still be possible to create a record using
	 * a default base class.
	 */
	describe('Base Class', function() {

		beforeEach(function() {
			Zarafa.core.data.RecordFactory.setBaseClassToMessageClass('TEST.A', Zarafa.core.data.MAPIRecord);
			Zarafa.core.data.RecordFactory.setBaseClassToMessageClass('TEST.A.B', Zarafa.core.data.IPMRecord);
		});

		it('can create a record without a base class configured', function() {
			const record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('TEST');
			expect(record).toBeDefined();
		});

		it('can set a default base class to a message class', function() {
			const record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('TEST.A');
			expect(record).toEqual(jasmine.any(Zarafa.core.data.MAPIRecord));
		});

		it('can override the default base class to a subtype of the message class', function() {
			const record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('TEST.A.B');
			expect(record).toEqual(jasmine.any(Zarafa.core.data.IPMRecord));
		});
	});

	/*
	 * Test if we can configure the SubStores which are supported by the
	 * Records. We should be able to add additional subStore support to subtypes
	 * of the message class, as well as be able to change the change the Substore
	 * type itself.
	 */
	describe('Sub Stores', function() {

		beforeEach(function() {
			Zarafa.core.data.RecordFactory.setBaseClassToMessageClass('TEST', Zarafa.core.data.MAPIRecord);
			Zarafa.core.data.RecordFactory.setSubStoreToMessageClass('TEST', 'sub1', Zarafa.core.data.MAPISubStore);
			Zarafa.core.data.RecordFactory.setSubStoreToMessageClass('TEST.A', 'sub2', Zarafa.core.data.MAPISubStore);
			Zarafa.core.data.RecordFactory.setSubStoreToMessageClass('TEST.A', 'sub1', Zarafa.hierarchy.data.IPFSubStore);
		});

		it('can set a SubStore to a message class', function() {
			const record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('TEST');
			expect(record.supportsSubStore('sub1')).toBeTruthy();
			expect(record.supportsSubStore('sub2')).toBeFalsy();
		});

		it('can add a second SubStore to a subtype of the message class', function() {
			const record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('TEST.A');
			expect(record.supportsSubStore('sub1')).toBeTruthy();
			expect(record.supportsSubStore('sub2')).toBeTruthy();
		});

		it('can create a SubStore with the configured type', function() {
			const record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('TEST');
			record.createSubStores();
			expect(record.getSubStore('sub1')).toEqual(jasmine.any(Zarafa.core.data.MAPISubStore));
		});

		it('can override the type of a SubStore to a subtype of the message class', function() {
			const record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('TEST.A');
			record.createSubStores();
			expect(record.getSubStore('sub1')).toEqual(jasmine.any(Zarafa.core.data.IPFStore));
		});
	});

	/*
	 * Test if we can apply Field definition to a RecordDefinition. We should be able
	 * to inherit Field definitions to the message class subtypes. We should also be able
	 * to add additional fields to the subtypes, as well as change the field definition itself.
	 */
	describe('Fields', function() {

		beforeEach(function() {
			Zarafa.core.data.RecordFactory.addFieldToMessageClass('TEST.A',		[ {name: 'FIELD2', type: 'int'} ]);
			Zarafa.core.data.RecordFactory.addFieldToMessageClass('TEST.A.B',	[ {name: 'FIELD2', type: 'string'} ]);
			Zarafa.core.data.RecordFactory.addFieldToMessageClass('TEST',		[ {name: 'FIELD1'} ]);
		});

		it('can add the Field to a message class', function() {
			const record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('TEST');
			expect(record.fields.length).toEqual(43);
			expect(record.fields.containsKey(['FIELD1'])).not.toBeUndefined();
		});

		it('can add a second Field to a subtype of the message class', function() {
			const record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('TEST.A');
			expect(record.fields.length).toEqual(44);
			expect(record.fields.containsKey(['FIELD1'])).not.toBeUndefined();
			expect(record.fields.containsKey(['FIELD2'])).not.toBeUndefined();
		});

		it('can override the type of a Field in a subtype of the message class', function() {
			const recordA = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('TEST.A');
			const recordAB = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('TEST.A.B');

			expect(recordA.fields.get('FIELD2').type.type).toEqual('int');
			expect(recordAB.fields.get('FIELD2').type.type).toEqual('string');
		});
	});

	/*
	 * Test if the default values are applied to a Record. We test 2 different default values,
	 * the first one are the ones set inside the Field definition, which must always be applied,
	 * and the second from the defaultValues from the RecordDefinition class (configured through
	 * the RecordFactory) which must only be applied to the phantom records.
	 */
	describe('Default Values', function() {

		beforeEach(function() {
			Zarafa.core.data.RecordFactory.addFieldToMessageClass('TEST.A',		[ {name: 'FIELD2', type: 'int', defaultValue: 5} ]);
			Zarafa.core.data.RecordFactory.addFieldToMessageClass('TEST.A.B',	[ {name: 'FIELD2', type: 'string'} ]);
			Zarafa.core.data.RecordFactory.addFieldToMessageClass('TEST',		[ {name: 'FIELD1'} ]);
			Zarafa.core.data.RecordFactory.addFieldToMessageClass('TEST',		[ {name: 'FIELD3', type: 'int', defaultValue: 3} ]);
			Zarafa.core.data.RecordFactory.addFieldToMessageClass('TEST',		[ {name: 'FIELD4'} ]);

			Zarafa.core.data.RecordFactory.addDefaultValueToMessageClass('TEST', 'FIELD1', 'a');
			Zarafa.core.data.RecordFactory.addDefaultValueToMessageClass('TEST.A', 'FIELD2', 1);
			Zarafa.core.data.RecordFactory.addDefaultValueToMessageClass('TEST.A.B', 'FIELD2', 'b');
		});

		it('can apply a default value from Ext.data.Field when not supplied explicitely', function() {
			const record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('TEST');
			expect(record.get('FIELD4')).toEqual('');
		});

		it('can apply a default value from the Field definition on a phantom record', function() {
			const record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('TEST');
			expect(record.get('FIELD3')).toEqual(3);
		});

		it('can apply a default value from the Field definition on a normal record', function() {
			const record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('TEST', { FIELD2 : 6 }, entryid);
			expect(record.get('FIELD3')).toEqual(3);
		});

		it('does not apply a default value from the Field definition when it would override existing data', function() {
			const record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('TEST', { FIELD3 : 6 }, entryid);
			expect(record.get('FIELD3')).toEqual(6);
		});

		it('can apply a custom default value on a phantom record', function() {
			const record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('TEST');
			expect(record.get('FIELD1')).toEqual('a');
		});

		it('does not apply a custom default value on a normal record', function() {
			const record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('TEST', { FIELD3 : 6 }, entryid);
			expect(record.get('FIELD1')).not.toEqual('a');
		});

		it('can override a custom default value in a subtype of the message class', function() {
			const recordA = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('TEST.A');
			const recordAB = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('TEST.A.B');

			expect(recordA.get('FIELD2')).toEqual(1);
			expect(recordAB.get('FIELD2')).toEqual('b');
		});

		it('should automatically add the message_class/object_type to phantom records', function() {
			const recordC = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('TEST.C');
			const recordD = Zarafa.core.data.RecordFactory.createRecordObjectByObjectType(9988);

			expect(recordC.get('message_class')).toEqual('TEST.C');
			expect(recordD.get('object_type')).toEqual(9988);
		});

		it('should automatically add the message_class/object_type to normal records', function() {
			const recordC = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('TEST.C', undefined, entryid);
			const recordD = Zarafa.core.data.RecordFactory.createRecordObjectByObjectType(9988, undefined, entryid);

			expect(recordC.get('message_class')).toEqual('TEST.C');
			expect(recordD.get('object_type')).toEqual(9988);
		});
	});

	/*
	 * Test if the events are being fired by the RecordFactory when a record is being created
	 */
	describe('Events', function() {

		it('fires the \'createphantom\' event when a new phantom record is created', function() {
			const handler = jasmine.createSpy();
			Zarafa.core.data.RecordFactory.addListenerToMessageClass('TEST', 'createphantom', handler);
			const record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('TEST');
			expect(handler).toHaveBeenCalledWith(record, undefined);
		});

		it('fires the \'createrecord\' event when a new record is created', function() {
			const handler = jasmine.createSpy();
			Zarafa.core.data.RecordFactory.addListenerToMessageClass('TEST', 'createrecord', handler);
			const record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('TEST', {}, entryid);
			expect(handler).toHaveBeenCalledWith(record, {});
		});
	});
});
