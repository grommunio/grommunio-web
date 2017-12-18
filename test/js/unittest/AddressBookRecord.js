describe('AddressbookRecord', function() {

	const entryid = '00000000AC21A95040D3EE48B319FBA7533044250100000004000000000000000000000000000000ext-gen2EID';
	const data = {
		'entryid' : entryid,
		'search_key' : 'Search Key',
		'fileas' : 'File As',
		'object_type' : Zarafa.core.mapi.ObjectType.MAPI_MAILUSER,
		'display_type' : Zarafa.core.mapi.DisplayType.DT_MAILUSER,
		'display_type_ex' : Zarafa.core.mapi.DisplayType.DT_MAILUSER,
		'address_type' : 'ZARAFA',
		'email_address' : 'Email Address',
		'smtp_address' : 'test@test.com',
		'given_name' : 'Given Name',
		'initials' : 'Initials',
		'surname' : 'Surname',
		'display_name' : 'Display Name',
		'account' : 'Account',
		'street_address' : 'Street Address',
		'locality' : 'Locality',
		'state_or_province' : 'State or Province',
		'postal_code' : 'Postal Code',
		'country' : 'Country',
		'title' : 'Title',
		'company_name' : 'Company Name',
		'department_name' : 'Department Name',
		'office_location' : 'Office Location',
		'assistant' : 'Assistant',
		'office_telephone_number' : 'Office Telephone Number',
		'business_telephone_number' : 'Business Telephone Number',
		'business2_telephone_number' : 'Business2 Telephone Number',
		'business2_telephone_number_mv' : 'Business2 Telephone Number',
		'primary_fax_number' : 'Fax Number',
		'home_telephone_number' : 'Home Telephone Number',
		'home2_telephone_number' : 'Home2 Telephone Number',
		'home2_telephone_number_mv' : 'Home2 Telephone Number',
		'mobile_telephone_number' : 'Mobile Telephone Number',
		'pager_telephone_number' : 'Pager Telephone Number',
		'comment' : 'Comment'
	};
	const record = Zarafa.core.data.RecordFactory.createRecordObjectByObjectType(Zarafa.core.mapi.ObjectType.MAPI_MAILUSER, data, entryid);

	it('convertToRecipient', function() {
		const recipient = record.convertToRecipient();
		expect(recipient.get('entryid')).toEqual(entryid);
		expect(recipient.get('recipient_type')).toEqual(Zarafa.core.mapi.RecipientType.MAPI_TO);
	});

	it('convertToRecipient with recipienttype', function() {
		const recipient = record.convertToRecipient(Zarafa.core.mapi.RecipientType.MAPI_CC);
		expect(recipient.get('entryid')).toEqual(entryid);
		expect(recipient.get('recipient_type')).toEqual(Zarafa.core.mapi.RecipientType.MAPI_CC);
	});

	it('convertToDistlistMember', function() {
		const distlist = record.convertToDistlistMember();
		expect(distlist.get('entryid')).toEqual(entryid);
		expect(distlist.get('distlist_type')).toEqual(Zarafa.core.mapi.DistlistType.DL_USER_AB);
	});

	it('convertToPermission', function() {
		const permission = record.convertToUserPermission();
		expect(permission.get('entryid')).toEqual(entryid);
		expect(permission.get('rights')).toEqual(Zarafa.core.mapi.Rights.RIGHTS_NO_RIGHTS);
	});
	
	it('convertToDelegate', function() {
		const delegate = record.convertToDelegate();
		expect(delegate.get('entryid')).toEqual(entryid);
		expect(delegate.get('display_name')).toEqual(record.get('display_name'));
	});

	it('isPersonalContact', function() {
		expect(record.isPersonalContact()).toEqual(false);
	});

	it('isPersonalContact mail user', function() {
		record.set('message_class', 'IPM.Contact');
		expect(record.isPersonalContact()).toEqual(true);
	});

	it('convertToContactRecord', function() {
		const contact = record.convertToContactRecord();
		expect(contact.get('message_class')).toEqual('IPM.Contact');
	});

	it('convertToDistlistRecord', function() {
		const distlist = record.convertToDistListRecord();
		expect(distlist.get('message_class')).toEqual('IPM.DistList');
	});

	it('equals', function() {
		const record2 = Zarafa.core.data.RecordFactory.createRecordObjectByObjectType(Zarafa.core.mapi.ObjectType.MAPI_MAILUSER, data, entryid);
		expect(record.equals(record)).toEqual(true);
	});
});
