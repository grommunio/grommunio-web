describe('DistlistRecord', function() {
	const fullname = 'jonn doe';
	const titlefullname = 'dr. ' + fullname;
	const record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Contact', {'display_name': titlefullname}, 1);

	describe('hasEmailAddress', function() {
		it('has no email address', function() { 
			expect(record.hasEmailAddress()).toBeFalsy();
		});

		it('has  email address 1', function() { 
			record.set('email_address_1', 'henk@bar.com');
			expect(record.hasEmailAddress()).toBeTruthy();
		});

		it('has  email address 2', function() { 
			record.set('email_address_2', 'henk@bar.com');
			expect(record.hasEmailAddress()).toBeTruthy();
		});

		it('has  email address 3', function() { 
			record.set('email_address_3', 'henk@bar.com');
			expect(record.hasEmailAddress()).toBeTruthy();
		});
	});

	describe('updateTimezoneInformation', function() {
		it('can update', function() {
			record.updateTimezoneInformation();
			expect(record.get('timezone')).not.toBeUndefined();
			expect(record.get('timezone_dststarthour')).not.toBeUndefined();
		});
	});

	describe('updateSubject', function() {
		// TODO: the rest of the cases
		it('only display_name', function() {
			record.updateSubject();
			expect(record.get('subject')).toEqual(titlefullname);
		});

		it('has a prefix', function() {
			record.set('display_name_prefix', 'dr.');
			record.updateSubject();
			expect(record.get('subject')).toEqual(fullname);
		});
	});
});
