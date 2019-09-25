/*
 * Test the ContactParser.
 */
describe('ContactParser', function(){
	var parser;
	const crlf = Zarafa.contact.data.config.CR + Zarafa.contact.data.config.LF;
	const nbsp = Zarafa.contact.data.config.NBSP;

	beforeEach(function() {
		parser = new Zarafa.contact.data.ContactDetailsParser();
	});

	/**
	 * Test that invalid arguments can be passed to the parseInfo function
	 */
	describe('Parse Invalid', function() {

		it('returns null when an invalid info type is given', function() {
			expect(parser.parseInfo('news', 'This is the news')).toBeNull();
		});
	});

	/*
	 * Test that invalid arguments can be passed to the combineInfo function
	 */
	describe('Combine Invalid', function() {

		it('returns null when an invalid info type is given', function() {
			expect(parser.combineInfo('news', {})).toBeNull();
		});
	});

	/* 
	 * Tests that contact names are properely parsed
	 */
	describe('Parse Name',function(){

		/*
		 * check name is properly segmented into give_name,middle_name etc
		 */
		it('can parse \'Mr. John Andy Doe Jr.\' correctly', function(){
			const nameParts = parser.parseInfo('name', 'Mr. John Andy Doe Jr.');
			expect(nameParts['display_name_prefix']).toEqual('Mr.');
			expect(nameParts['given_name']).toEqual('John');
			expect(nameParts['middle_name']).toEqual('Andy');
			expect(nameParts['surname']).toEqual('Doe');
			expect(nameParts['generation']).toEqual('Jr.');
		});

		it('can parse \'Jane John Andy Doe Dean\' correctly', function(){
			const nameParts = parser.parseInfo('name', 'Jane John Andy Doe Dean');
			expect(nameParts['display_name_prefix']).toEqual('');
			expect(nameParts['given_name']).toEqual('Jane');
			expect(nameParts['middle_name']).toEqual('John' + nbsp + 'Andy' + nbsp + 'Doe');
			expect(nameParts['surname']).toEqual('Dean');
			expect(nameParts['generation']).toEqual('');
		});

		it('can parse \'Mr. John Andy Doe\' correctly', function(){
			const nameParts = parser.parseInfo('name', 'Mr. John Andy Doe');
			expect(nameParts['display_name_prefix']).toEqual('Mr.');
			expect(nameParts['given_name']).toEqual('John');
			expect(nameParts['middle_name']).toEqual('Andy');
			expect(nameParts['surname']).toEqual('Doe');
			expect(nameParts['generation']).toEqual('');
		});

		it('can parse \'Mr. John Doe\' correctly', function(){
			const nameParts = parser.parseInfo('name', 'Mr. John Doe');
			expect(nameParts['display_name_prefix']).toEqual('Mr.');
			expect(nameParts['given_name']).toEqual('John');
			expect(nameParts['middle_name']).toEqual('');
			expect(nameParts['surname']).toEqual('Doe');
			expect(nameParts['generation']).toEqual('');
		});

		it('can parse \'John Andy Doe\' correctly', function(){
			const nameParts = parser.parseInfo('name', 'John Andy Doe');
			expect(nameParts['display_name_prefix']).toEqual('');
			expect(nameParts['given_name']).toEqual('John');
			expect(nameParts['middle_name']).toEqual('Andy');
			expect(nameParts['surname']).toEqual('Doe');
			expect(nameParts['generation']).toEqual('');
		});

		it('can parse \'John Doe\' correctly', function() {
			const nameParts = parser.parseInfo('name', 'John Doe');
			expect(nameParts['display_name_prefix']).toEqual('');
			expect(nameParts['given_name']).toEqual('John');
			expect(nameParts['middle_name']).toEqual('');
			expect(nameParts['surname']).toEqual('Doe');
			expect(nameParts['generation']).toEqual('');
		});

		it('can parse \'Mr. Doe\' correctly', function() {
			const nameParts = parser.parseInfo('name', 'Mr. Doe');
			expect(nameParts['display_name_prefix']).toEqual('Mr.');
			expect(nameParts['given_name']).toEqual('');
			expect(nameParts['middle_name']).toEqual('');
			expect(nameParts['surname']).toEqual('Doe');
			expect(nameParts['generation']).toEqual('');
		});

		it('can parse \'John Doe Jr.\' correctly', function() {
			const nameParts = parser.parseInfo('name', 'John Doe Jr.');
			expect(nameParts['display_name_prefix']).toEqual('');
			expect(nameParts['given_name']).toEqual('John');
			expect(nameParts['middle_name']).toEqual('');
			expect(nameParts['surname']).toEqual('Doe');
			expect(nameParts['generation']).toEqual('Jr.');
		});

		it('can parse \'Doe Jr.\' correctly', function() {
			const nameParts = parser.parseInfo('name', 'Doe Jr.');
			expect(nameParts['display_name_prefix']).toEqual('');
			expect(nameParts['given_name']).toEqual('');
			expect(nameParts['middle_name']).toEqual('');
			expect(nameParts['surname']).toEqual('Doe');
			expect(nameParts['generation']).toEqual('Jr.');
		});

		it('can parse \'Mr. Doe Jr.\' correctly', function() {
			const nameParts = parser.parseInfo('name', 'Mr. Doe Jr.');
			expect(nameParts['display_name_prefix']).toEqual('Mr.');
			expect(nameParts['given_name']).toEqual('');
			expect(nameParts['middle_name']).toEqual('');
			expect(nameParts['surname']).toEqual('Doe');
			expect(nameParts['generation']).toEqual('Jr.');
		});

		it('can parse \'John\' correctly', function() {
			const nameParts = parser.parseInfo('name', 'John');
			expect(nameParts['display_name_prefix']).toEqual('');
			expect(nameParts['given_name']).toEqual('John');
			expect(nameParts['middle_name']).toEqual('');
			expect(nameParts['surname']).toEqual('');
			expect(nameParts['generation']).toEqual('');
		});

		it('returns null when parsing a non-string', function() {
			expect(parser.parseInfo('name', 5)).toBeNull();
		});
	});

	/* 
	 * Tests that contact names can be properly formatted
	 */
	describe('Combine Name', function() {
		/*
		 * check name parts can be combined 
		 */
		it('can combine valid name parts',function(){
			const nameParts = {
				'display_name_prefix' : 'Mr.',
				'given_name' : 'John',
				'middle_name' : 'Andy',
				'surname' : 'Doe',
				'generation' : ''
			};
			
			const displayName = parser.combineInfo('name', nameParts);
			expect(displayName).toEqual('Mr.' + nbsp +'John' + nbsp + 'Andy' + nbsp + 'Doe');
		});
		
		it('returns null when trying to combine non-valid name parts', function(){
			const displayName = parser.combineInfo('name', '');
			expect(displayName).toBeNull();
		});
	});

	/* 
	 * Tests that contact telephone number are properely parsed
	 */
	describe('Parse telephone number', function() {

		it('can parse \'1234567\' correctly', function() {
			const phoneParts = parser.parseInfo('phone', '1234567');
			expect(phoneParts['country_code']).toEqual('');
			expect(phoneParts['city_code']).toEqual('');
			expect(phoneParts['local_number']).toEqual('1234567');
			expect(phoneParts['extension']).toEqual('');
		});

		it('can parse \'12 34 567\' correctly', function() {
			const phoneParts = parser.parseInfo('phone', '12 34 567');
			expect(phoneParts['country_code']).toEqual('');
			expect(phoneParts['city_code']).toEqual('');
			expect(phoneParts['local_number']).toEqual('12' + nbsp + '34' + nbsp + '567');
			expect(phoneParts['extension']).toEqual('');
		});

		it('can parse \'1234567/12\' correctly', function() {
			const phoneParts = parser.parseInfo('phone', '1234567/12');
			expect(phoneParts['country_code']).toEqual('');
			expect(phoneParts['city_code']).toEqual('');
			expect(phoneParts['local_number']).toEqual('1234567');
			expect(phoneParts['extension']).toEqual('12');
		});

		it('can parse \'12 34 567 / 12\' correctly', function() {
			const phoneParts = parser.parseInfo('phone', '12 34 567 / 12');
			expect(phoneParts['country_code']).toEqual('');
			expect(phoneParts['city_code']).toEqual('');
			expect(phoneParts['local_number']).toEqual('12' + nbsp + '34' + nbsp + '567');
			expect(phoneParts['extension']).toEqual('12');
		});

		it('can parse \'1234567x12\' correctly', function() {
			const phoneParts = parser.parseInfo('phone', '1234567x12');
			expect(phoneParts['country_code']).toEqual('');
			expect(phoneParts['city_code']).toEqual('');
			expect(phoneParts['local_number']).toEqual('1234567');
			expect(phoneParts['extension']).toEqual('12');
		});

		it('can parse \'12 34 567 x 12\' correctly', function() {
			const phoneParts = parser.parseInfo('phone', '12 34 567 x 12');
			expect(phoneParts['country_code']).toEqual('');
			expect(phoneParts['city_code']).toEqual('');
			expect(phoneParts['local_number']).toEqual('12' + nbsp + '34' + nbsp + '567');
			expect(phoneParts['extension']).toEqual('12');
		});

		it('can parse \'0265 1234567\' correctly', function() {
			const phoneParts = parser.parseInfo('phone', '0265 1234567');
			expect(phoneParts['country_code']).toEqual('');
			expect(phoneParts['city_code']).toEqual('0265');
			expect(phoneParts['local_number']).toEqual('1234567');
			expect(phoneParts['extension']).toEqual('');
		});

		it('can parse \'0265 12 34 567\' correctly', function() {
			const phoneParts = parser.parseInfo('phone', '0265 12 34 567');
			expect(phoneParts['country_code']).toEqual('');
			expect(phoneParts['city_code']).toEqual('0265');
			expect(phoneParts['local_number']).toEqual('12' + nbsp + '34' + nbsp +'567');
			expect(phoneParts['extension']).toEqual('');
		});

		it('can parse \'(0265)1234567\' correctly', function() {
			const phoneParts = parser.parseInfo('phone', '(0265)1234567');
			expect(phoneParts['country_code']).toEqual('');
			expect(phoneParts['city_code']).toEqual('0265');
			expect(phoneParts['local_number']).toEqual('1234567');
			expect(phoneParts['extension']).toEqual('');
		});

		it('can parse \'(0265) 12 34 567\' correctly', function() {
			const phoneParts = parser.parseInfo('phone', '(0265) 12 34 567');
			expect(phoneParts['country_code']).toEqual('');
			expect(phoneParts['city_code']).toEqual('0265');
			expect(phoneParts['local_number']).toEqual('12' + nbsp + '34' + nbsp + '567');
			expect(phoneParts['extension']).toEqual('');
		});

		it('can parse \'0265 1234567\' correctly', function() {
			const phoneParts = parser.parseInfo('phone', '0265 1234567');
			expect(phoneParts['country_code']).toEqual('');
			expect(phoneParts['city_code']).toEqual('0265');
			expect(phoneParts['local_number']).toEqual('1234567');
			expect(phoneParts['extension']).toEqual('');
		});

		it('can parse \'0265 12 34 567\' correctly', function() {
			const phoneParts = parser.parseInfo('phone', '0265 12 34 567');
			expect(phoneParts['country_code']).toEqual('');
			expect(phoneParts['city_code']).toEqual('0265');
			expect(phoneParts['local_number']).toEqual('12' + nbsp + '34' + nbsp + '567');
			expect(phoneParts['extension']).toEqual('');
		});

		it('can parse \'0091 1234567\' correctly', function() {
			const phoneParts = parser.parseInfo('phone', '0091 1234567');
			expect(phoneParts['country_code']).toEqual('0091');
			expect(phoneParts['city_code']).toEqual('');
			expect(phoneParts['local_number']).toEqual('1234567');
			expect(phoneParts['extension']).toEqual('');
		});

		it('can parse \'0091 12 34 567\' correctly', function() {
			const phoneParts = parser.parseInfo('phone', '0091 12 34 567');
			expect(phoneParts['country_code']).toEqual('0091');
			expect(phoneParts['city_code']).toEqual('');
			expect(phoneParts['local_number']).toEqual('12' + nbsp + '34' + nbsp + '567');
			expect(phoneParts['extension']).toEqual('');
		});

		it('can parse \'0091 1234567\' correctly', function() {
			const phoneParts = parser.parseInfo('phone', '0091 1234567');
			expect(phoneParts['country_code']).toEqual('0091');
			expect(phoneParts['city_code']).toEqual('');
			expect(phoneParts['local_number']).toEqual('1234567');
			expect(phoneParts['extension']).toEqual('');
		});

		it('can parse \'0091 12 34 567\' correctly', function() {
			const phoneParts = parser.parseInfo('phone', '0091 12 34 567');
			expect(phoneParts['country_code']).toEqual('0091');
			expect(phoneParts['city_code']).toEqual('');
			expect(phoneParts['local_number']).toEqual('12' + nbsp + '34' + nbsp + '567');
			expect(phoneParts['extension']).toEqual('');
		});

		it('can parse \'+91 1234567\' correctly', function() {
			const phoneParts = parser.parseInfo('phone', '+91 1234567');
			expect(phoneParts['country_code']).toEqual('+91');
			expect(phoneParts['city_code']).toEqual('');
			expect(phoneParts['local_number']).toEqual('1234567');
			expect(phoneParts['extension']).toEqual('');
		});

		it('can parse \'+91 12 34 567\' correctly', function() {
			const phoneParts = parser.parseInfo('phone', '+91 12 34 567');
			expect(phoneParts['country_code']).toEqual('+91');
			expect(phoneParts['city_code']).toEqual('');
			expect(phoneParts['local_number']).toEqual('12' + nbsp + '34' + nbsp + '567');
			expect(phoneParts['extension']).toEqual('');
		});

		it('can parse \'+91 1234567\' correctly', function() {
			const phoneParts = parser.parseInfo('phone', '+91 1234567');
			expect(phoneParts['country_code']).toEqual('+91');
			expect(phoneParts['city_code']).toEqual('');
			expect(phoneParts['local_number']).toEqual('1234567');
			expect(phoneParts['extension']).toEqual('');
		});

		it('can parse \'+91 12 34 567\' correctly', function() {
			const phoneParts = parser.parseInfo('phone', '+91 12 34 567');
			expect(phoneParts['country_code']).toEqual('+91');
			expect(phoneParts['city_code']).toEqual('');
			expect(phoneParts['local_number']).toEqual('12' + nbsp + '34' + nbsp + '567');
			expect(phoneParts['extension']).toEqual('');
		});

		it('can parse \'0091 0265 1234567\' correctly', function() {
			const phoneParts = parser.parseInfo('phone', '0091 0265 1234567');
			expect(phoneParts['country_code']).toEqual('0091');
			expect(phoneParts['city_code']).toEqual('0265');
			expect(phoneParts['local_number']).toEqual('1234567');
			expect(phoneParts['extension']).toEqual('');
		});

		it('can parse \'0091 0265 12 34 567\' correctly', function() {
			const phoneParts = parser.parseInfo('phone', '0091 0265 12 34 567');
			expect(phoneParts['country_code']).toEqual('0091');
			expect(phoneParts['city_code']).toEqual('0265');
			expect(phoneParts['local_number']).toEqual('12' + nbsp + '34' + nbsp + '567');
			expect(phoneParts['extension']).toEqual('');
		});

		it('can parse \'0091 0265 1234567\' correctly', function() {
			const phoneParts = parser.parseInfo('phone', '0091 0265 1234567');
			expect(phoneParts['country_code']).toEqual('0091');
			expect(phoneParts['city_code']).toEqual('0265');
			expect(phoneParts['local_number']).toEqual('1234567');
			expect(phoneParts['extension']).toEqual('');
		});

		it('can parse \'0091 0265 12 34 567\' correctly', function() {
			const phoneParts = parser.parseInfo('phone', '0091 0265 12 34 567');
			expect(phoneParts['country_code']).toEqual('0091');
			expect(phoneParts['city_code']).toEqual('0265');
			expect(phoneParts['local_number']).toEqual('12' + nbsp + '34' + nbsp + '567');
			expect(phoneParts['extension']).toEqual('');
		});

		it('can parse \'+91(0)265 1234567\' correctly', function() {
			const phoneParts = parser.parseInfo('phone', '+91(0)265 1234567');
			expect(phoneParts['country_code']).toEqual('+91');
			expect(phoneParts['city_code']).toEqual('0265');
			expect(phoneParts['local_number']).toEqual('1234567');
			expect(phoneParts['extension']).toEqual('');
		});

		it('can parse \'+91(0)265 12 34 567\' correctly', function() {
			const phoneParts = parser.parseInfo('phone', '+91(0)265 12 34 567');
			expect(phoneParts['country_code']).toEqual('+91');
			expect(phoneParts['city_code']).toEqual('0265');
			expect(phoneParts['local_number']).toEqual('12' + nbsp + '34' + nbsp + '567');
			expect(phoneParts['extension']).toEqual('');
		});

		it('can parse \'+91(0265)1234567\' correctly', function() {
			const phoneParts = parser.parseInfo('phone', '+91(0265)1234567');
			expect(phoneParts['country_code']).toEqual('+91');
			expect(phoneParts['city_code']).toEqual('0265');
			expect(phoneParts['local_number']).toEqual('1234567');
			expect(phoneParts['extension']).toEqual('');
		});

		it('can parse \'+91 (0265) 12 34 567\' correctly', function() {
			const phoneParts = parser.parseInfo('phone', '+91 (0265) 12 34 567');
			expect(phoneParts['country_code']).toEqual('+91');
			expect(phoneParts['city_code']).toEqual('0265');
			expect(phoneParts['local_number']).toEqual('12' + nbsp + '34' + nbsp + '567');
			expect(phoneParts['extension']).toEqual('');
		});

		it('can parse \'(+91)0265 1234567\' correctly', function() {
			const phoneParts = parser.parseInfo('phone', '(+91)0265 1234567');
			expect(phoneParts['country_code']).toEqual('+91');
			expect(phoneParts['city_code']).toEqual('0265');
			expect(phoneParts['local_number']).toEqual('1234567');
			expect(phoneParts['extension']).toEqual('');
		});

		it('can parse \'(+91) 0265 12 34 567\' correctly', function() {
			const phoneParts = parser.parseInfo('phone', '(+91) 0265 12 34 567');
			expect(phoneParts['country_code']).toEqual('+91');
			expect(phoneParts['city_code']).toEqual('0265');
			expect(phoneParts['local_number']).toEqual('12' + nbsp + '34' + nbsp + '567');
			expect(phoneParts['extension']).toEqual('');
		});

		it('can parse \'(0091)0265 1234567\' correctly', function() {
			const phoneParts = parser.parseInfo('phone', '(0091)0265 1234567');
			expect(phoneParts['country_code']).toEqual('0091');
			expect(phoneParts['city_code']).toEqual('0265');
			expect(phoneParts['local_number']).toEqual('1234567');
			expect(phoneParts['extension']).toEqual('');
		});

		it('can parse \'(0091) 0265 12 34 567\' correctly', function() {
			const phoneParts = parser.parseInfo('phone', '(0091) 0265 12 34 567');
			expect(phoneParts['country_code']).toEqual('0091');
			expect(phoneParts['city_code']).toEqual('0265');
			expect(phoneParts['local_number']).toEqual('12' + nbsp + '34' + nbsp + '567');
			expect(phoneParts['extension']).toEqual('');
		});

		it('can parse \'0900KOPANO\' correctly', function() {
			const phoneParts = parser.parseInfo('phone', '0900KOPANO');
			expect(phoneParts['country_code']).toEqual('');
			expect(phoneParts['city_code']).toEqual('');
			expect(phoneParts['local_number']).toEqual('0900KOPANO');
			expect(phoneParts['extension']).toEqual('');
		});

		it('can parse \'0900 KOPANO\' correctly', function() {
			const phoneParts = parser.parseInfo('phone', '0900 KOPANO');
			expect(phoneParts['country_code']).toEqual('');
			expect(phoneParts['city_code']).toEqual('0900');
			expect(phoneParts['local_number']).toEqual('KOPANO');
			expect(phoneParts['extension']).toEqual('');
		});

		it('can parse \'0900 KOPANO\' correctly', function() {
			const phoneParts = parser.parseInfo('phone', '0900 KOPANO');
			expect(phoneParts['country_code']).toEqual('');
			expect(phoneParts['city_code']).toEqual('0900');
			expect(phoneParts['local_number']).toEqual('KOPANO');
			expect(phoneParts['extension']).toEqual('');
		});

		it('returns null when parsing a non-string', function() {
			expect(parser.parseInfo('phone', 5)).toBeNull();
		});
	});

	/* 
	 * Tests that phone numbers can be properly formatted
	 */
	describe('Combine Telephone number', function() {
		/*
		 * check number parts can be combined 
		 */
		it('can combine valid phone parts',function(){
			const phoneParts = {
				'country_code' : '+91',
				'city_code' : '0265',
				'local_number' : '1234567',
				'extension' : '12'
			};
			
			const  phoneNumber = parser.combineInfo('phone', phoneParts);
			expect(phoneNumber).toEqual('+91' + nbsp + '(0265)' + nbsp + '1234567' + nbsp + '-' + nbsp + '12');
		});
		
		it('returns null when trying to combine non-valid phone parts', function(){
			const  phoneNumber = parser.combineInfo('phone', '');
			expect(phoneNumber).toBeNull();
		});
	});

	/* 
	 * Tests that contact telephone number are properely parsed
	 */
	describe('Parse addresses', function() {

		it('can parse \'MainStreet 15\\nLocalCity\' correctly', function() {
			const addressParts = parser.parseInfo('address', 'MainStreet 15\nLocalCity');
			expect(addressParts['street']).toEqual('MainStreet 15');
			expect(addressParts['country']).toEqual('');
			expect(addressParts['postal_code']).toEqual('');
			expect(addressParts['city']).toEqual('LocalCity');
			expect(addressParts['state']).toEqual('');
			expect(addressParts['incomplete_info']).toBeTruthy();
		});

		it('can parse \'MainStreet 15\\nLocalCity 123AB\' correctly', function() {
			const addressParts = parser.parseInfo('address', 'MainStreet 15\nLocalCity 123AB');
			expect(addressParts['street']).toEqual('MainStreet 15');
			expect(addressParts['country']).toEqual('');
			expect(addressParts['postal_code']).toEqual('123AB');
			expect(addressParts['city']).toEqual('LocalCity');
			expect(addressParts['state']).toEqual('');
			expect(addressParts['incomplete_info']).toBeTruthy();
		});

		it('can parse \'MainStreet 15\\n123AB LocalCity\' correctly', function() {
			const addressParts = parser.parseInfo('address', 'MainStreet 15\n123AB LocalCity');
			expect(addressParts['street']).toEqual('MainStreet 15');
			expect(addressParts['country']).toEqual('');
			expect(addressParts['postal_code']).toEqual('123AB');
			expect(addressParts['city']).toEqual('LocalCity');
			expect(addressParts['state']).toEqual('');
			expect(addressParts['incomplete_info']).toBeTruthy();
		});

		it('can parse \'MainStreet 15\\nLocalCity BigState\' correctly', function() {
			const addressParts = parser.parseInfo('address', 'MainStreet 15\nLocalCity BigState');
			expect(addressParts['street']).toEqual('MainStreet 15');
			expect(addressParts['country']).toEqual('');
			expect(addressParts['postal_code']).toEqual('');
			expect(addressParts['city']).toEqual('LocalCity');
			expect(addressParts['state']).toEqual('BigState');
			expect(addressParts['incomplete_info']).toBeTruthy();
		});

		it('can parse \'MainStreet 15\\nLocalCity BigState 123AB\' correctly', function() {
			const addressParts = parser.parseInfo('address', 'MainStreet 15\nLocalCity BigState 123AB');
			expect(addressParts['street']).toEqual('MainStreet 15');
			expect(addressParts['country']).toEqual('');
			expect(addressParts['postal_code']).toEqual('123AB');
			expect(addressParts['city']).toEqual('LocalCity');
			expect(addressParts['state']).toEqual('BigState');
			expect(addressParts['incomplete_info']).toBeTruthy();
		});

		it('can parse \'MainStreet 15\\n123AB LocalCity BigState\' correctly', function() {
			const addressParts = parser.parseInfo('address', 'MainStreet 15\n123AB LocalCity BigState');
			expect(addressParts['street']).toEqual('MainStreet 15');
			expect(addressParts['country']).toEqual('');
			expect(addressParts['postal_code']).toEqual('123AB');
			expect(addressParts['city']).toEqual('LocalCity');
			expect(addressParts['state']).toEqual('BigState');
			expect(addressParts['incomplete_info']).toBeTruthy();
		});

		it('can parse \'MainStreet 15\\nLocalCity\\nMyCountry\' correctly', function() {
			const addressParts = parser.parseInfo('address', 'MainStreet 15\nLocalCity\nMyCountry');
			expect(addressParts['street']).toEqual('MainStreet 15');
			expect(addressParts['country']).toEqual('MyCountry');
			expect(addressParts['postal_code']).toEqual('');
			expect(addressParts['city']).toEqual('LocalCity');
			expect(addressParts['state']).toEqual('');
			expect(addressParts['incomplete_info']).toBeFalsy();
		});

		it('can parse \'MainStreet 15\\n123AB LocalCity BigState\\nMyCountry\' correctly', function() {
			const addressParts = parser.parseInfo('address', 'MainStreet 15\n123AB LocalCity BigState\nMyCountry');
			expect(addressParts['street']).toEqual('MainStreet 15');
			expect(addressParts['country']).toEqual('MyCountry');
			expect(addressParts['postal_code']).toEqual('123AB');
			expect(addressParts['city']).toEqual('LocalCity');
			expect(addressParts['state']).toEqual('BigState');
			expect(addressParts['incomplete_info']).toBeFalsy();
		});

		it('can parse \'MainStreet 15\\nExtra information\\n123AB LocalCity BigState\\nMyCountry\' correctly', function() {
			const addressParts = parser.parseInfo('address', 'MainStreet 15\nExtra information\n123AB LocalCity BigState\nMyCountry');
			expect(addressParts['street']).toEqual('MainStreet 15' + crlf + 'Extra information');
			expect(addressParts['country']).toEqual('MyCountry');
			expect(addressParts['postal_code']).toEqual('123AB');
			expect(addressParts['city']).toEqual('LocalCity');
			expect(addressParts['state']).toEqual('BigState');
			expect(addressParts['incomplete_info']).toBeFalsy();
		});

		it('can parse \'LocalCity BigState\' correctly', function() {
			const addressParts = parser.parseInfo('address', 'LocalCity BigState');
			expect(addressParts['street']).toEqual('');
			expect(addressParts['country']).toEqual('');
			expect(addressParts['postal_code']).toEqual('');
			expect(addressParts['city']).toEqual('LocalCity');
			expect(addressParts['state']).toEqual('BigState');
			expect(addressParts['incomplete_info']).toBeTruthy();
		});

		it('returns null when parsing a non-string', function() {
			expect(parser.parseInfo('address', 5)).toBeNull();
		});
	});

	/* 
	 * Tests that addresses can be properly formatted
	 */
	describe('Combine address', function() {
		/*
		 * check address parts can be combined 
		 */
		it('can combine valid addressparts',function(){
			const addressParts = {
				'street' : 'MainStreet 15' + crlf + 'Extra information',
				'country' : 'MyCountry',
				'postal_code' : '123AB',
				'city' : 'LocalCity',
				'state' : 'BigState'
			};
			
			const address = parser.combineInfo('address', addressParts);
			expect(address).toEqual('MainStreet 15' + crlf + 'Extra information' + crlf + 'LocalCity' + nbsp + 'BigState' + nbsp + '123AB' + crlf + 'MyCountry');
		});
		
		it('returns null when trying to combine non-valid address parts', function(){
			const address = parser.combineInfo('address', '');
			expect(address).toBeNull();
		});
	});
});
