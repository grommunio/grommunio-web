describe('NoteRecord', function() {
	var record;

	beforeEach(function() {
		record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.StickyNote', {}, 1);
	});

	describe('generateSubject', function() {
		it('empty subject when body is empty', function() {
			expect(record.generateSubject()).toEqual('');
		});

		it('non empty subject generates a subject', function() {
			const text = 'hello';
			record.set('body', text);
			expect(record.generateSubject()).toEqual(text);
		});

		it('long body is truncated to maximum subject length', function() {
			const text = 'this is a very long long long text';
			record.set('body', text);
			expect(record.generateSubject()).toEqual(text.slice(0, 25) + '...');
		});

		it('body containing enters', function() {
			const text = 'this is a very\n long long long text';
			record.set('body', text);
			expect(record.generateSubject()).toEqual('this is a very');

			const text2 = 'this is a very\r long long long text';
			record.set('body', text2);
			expect(record.generateSubject()).toEqual('this is a very');

			const text3 = 'this is a very\r\n long long long text';
			record.set('body', text3);
			expect(record.generateSubject()).toEqual('this is a very');
		});
	});
});
