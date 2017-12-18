describe('User', function() {
	var user;
	const data = {
		username        : 'test',
		fullname        : 'Test User',
		entryid         : '2938492893',
		email_address   : 'testuser',
		search_key	: 'wefw',
		smtp_address    : 'testuser@kopano.com',
		given_name	: 'Test',
		initials	: 'Dr.',
		surname		: 'Test',
		title		: 'Dr.',
		company_name	: 'Kopano',
		department_name	: 'Development',
		office_location : 'Delft',
		assistant	: 'Hal 9000',
		office_telephone_number: '234233',
		business2_telephone_number: '234234',
		primary_fax_number: '234',
		assistant_telephone_number: '112',
		home_telephone_number: '232343',
		home2_telephone_number: '23423',
		mobile_telephone_number: '23423',
		pager_telephone_number: '23423',
		street_address	: 'Elektronicaweg',
		locality	: 'Delft',
		postal_code	: '9999AA',
		country		: 'Netherlands',
		state_or_province: 'Zuid Holland',
	};

	beforeAll(function() {
		user = new Zarafa.core.data.User(data);
	});

	it('can getEntryId', function() {
		expect(user.getEntryId()).toEqual(data['entryid']);
	});

	it('can getSearchKey', function() {
		expect(user.getSearchKey()).toEqual(data['search_key']);
	});

	it('can getDisplayName', function() {
		user = new Zarafa.core.data.User({'username': 'henk'});
		expect(user.getDisplayName()).toEqual('henk');
		user = new Zarafa.core.data.User(data);
		expect(user.getDisplayName()).toEqual(data['fullname']);
	});

	it('can getFullName', function() {
		expect(user.getFullName()).toEqual(data['fullname']);
	});

	it('can getUserName', function() {
		expect(user.getUserName()).toEqual(data['username']);
	});

	it('can getEmailAddress', function() {
		expect(user.getEmailAddress()).toEqual(data['email_address']);
	});

	it('can getSMTPAddress', function() {
		expect(user.getSMTPAddress()).toEqual(data['smtp_address']);
	});

	it('can getFirstName', function() {
		expect(user.getFirstName()).toEqual(data['given_name']);
	});

	it('can getInitials', function() {
		expect(user.getInitials()).toEqual(data['initials']);
	});

	it('can getLastName', function() {
		expect(user.getLastName()).toEqual(data['surname']);
	});

	it('can getAddress', function() {
		expect(user.getAddress()).toEqual(data['street_address']);
	});

	it('can getCity', function() {
		expect(user.getCity()).toEqual(data['locality']);
	});

	it('can getState', function() {
		expect(user.getState()).toEqual(data['state_or_province']);
	});

	it('can getZipCode', function() {
		expect(user.getZipCode()).toEqual(data['postal_code']);
	});

	it('can getCountry', function() {
		expect(user.getCountry()).toEqual(data['country']);
	});
	
	it('can getTitle', function() {
		expect(user.getTitle()).toEqual(data['title']);
	});

	it('can getCompany', function() {
		expect(user.getCompany()).toEqual(data['company_name']);
	});

	it('can getDepartment', function() {
		expect(user.getDepartment()).toEqual(data['department_name']);
	});

	it('can getOffice', function() {
		expect(user.getOffice()).toEqual(data['office_location']);
	});

	it('can getAssistant', function() {
		expect(user.getAssistant()).toEqual(data['assistant']);
	});

	it('can getPhone', function() {
		user = new Zarafa.core.data.User({'business_telephone_number': 'henk'});
		expect(user.getPhone()).toEqual('henk');
		user = new Zarafa.core.data.User(data);
		expect(user.getPhone()).toEqual(data['office_telephone_number']);
	});

	it('can getPhoneBusiness', function() {
		user = new Zarafa.core.data.User({'business_telephone_number': 'henk'});
		expect(user.getPhoneBusiness()).toEqual('henk');
		user = new Zarafa.core.data.User(data);
		expect(user.getPhoneBusiness()).toEqual(data['office_telephone_number']);
	});

	it('can getPhoneBusiness2', function() {
		expect(user.getPhoneBusiness2()).toEqual(data['business2_telephone_number']);
	});

	it('can getFax', function() {
		expect(user.getFax()).toEqual(data['primary_fax_number']);
	});

	it('can getPhoneAssistant', function() {
		expect(user.getPhoneAssistant()).toEqual(data['assistant_telephone_number']);
	});

	it('can getPhoneHome', function() {
		expect(user.getPhoneHome()).toEqual(data['home_telephone_number']);
	});

	it('can getPhoneHome2', function() {
		expect(user.getPhoneHome2()).toEqual(data['home2_telephone_number']);
	});

	it('can getPhoneMobile', function() {
		expect(user.getPhoneMobile()).toEqual(data['mobile_telephone_number']);
	});

	it('can getPhonePager', function() {
		expect(user.getPhonePager()).toEqual(data['pager_telephone_number']);
	});
});
