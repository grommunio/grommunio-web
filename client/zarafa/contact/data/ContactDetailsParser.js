/*
 * #dependsFile client/zarafa/contact/data/ContactConfig.js
 */
Ext.namespace('Zarafa.contact.data');

/**
 * @class Zarafa.contact.data.ContactDetailsParser
 * @extends Object
 * This class is used to parse/combine detailed info for full name, address and phone numbers
 * this class can not parse all the formats of different regions so it assumes input data
 * in some specific format
 */
Zarafa.contact.data.ContactDetailsParser = Ext.extend(Object, {
	/**
	 * @cfg {Array} prefixOptions prefix options array in the form of [[displayText]]
	 */
	prefixOptions : undefined,

	/**
	 * @cfg {Array} suffixOptions suffix options array in the form of [[displayText]]
	 */
	suffixOptions : undefined,

	/**
	 * @cfg {HexValue} CR carriage return value in form of 8-bit hex value
	 */
	CR : Zarafa.contact.data.config.CR,

	/**
	 * @cfg {HexValue} LF line feed value in form of 8-bit hex value
	 */
	LF : Zarafa.contact.data.config.LF,

	/**
	 * @cfg {HexValue} CRLF carriage return + line feed in form of 8-bit hex value
	 */
	CRLF : Zarafa.contact.data.config.CRLF,

	/**
	 * @cfg {HexValue} SP space value in form of 8-bit hex value
	 */
	SP : Zarafa.contact.data.config.SP,

	/**
	 * @cfg {HexValue} LF non-breaking space value in form of 8-bit hex value
	 */
	NBSP : Zarafa.contact.data.config.NBSP,

	/**
	 * @constructor
	 * @param {Object} configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};
		this.prefixOptions = Zarafa.contact.data.config.Prefix;
		this.suffixOptions = Zarafa.contact.data.config.Suffix;
		Ext.apply(this, config);
		Zarafa.contact.data.ContactDetailsParser.superclass.constructor.call(this, config);
	},

	/**
	 * This is a wrapper function for all parsing methods for different type of data
	 * @param {String} infoType type of data that needs to be parsed
	 * @param {String} data data string that will be parsed
	 * @return {Object} object that contains parsed data
	 */
	parseInfo : function(infoType, data)
	{
		// invalid data
		if(!Ext.isString(data)) {
			return null;
		}

		switch(infoType) {
			case 'name':
				return this.parseNameInfo(data);
			case 'phone':
				return this.parsePhoneInfo(data);
			case 'address':
				return this.parseAddressInfo(data);
			default:
				return null;
		}
	},

	/**
	 * This function will parse full name string and convert into an object that will contain
	 * prefix, given_name, middle_name, surname, generation
	 *
	 * assumptions that is used for parsing full name in this function
	 * value              | prefix | given_name | middle_name | surname | generation
	 * John               |        | John       |             |         |
	 * John Doe           |        | John       |             | Doe     |
	 * John A Doe         |        | John       | A           | Doe     |
	 * John Doe Jr.       |        | John       |             | Doe     | Jr.
	 * Mr. John           | Mr.    | John       |             |         |
	 * Mr. John Doe       | Mr.    | John       |             | Doe     |
	 * Mr. John A Doe     | Mr.    | John       | A           | Doe     |
	 * Mr. John A Doe Jr. | Mr.    | John       | A           | Doe     | Jr.
	 * Doe Jr.            |        |            |             | Doe     | Jr.
	 *
	 * @param {String} data data string that will be parsed
	 * @return {Object} object that contains parsed data
	 * @private
	 */
	parseNameInfo : function(data)
	{
		var result = {
			'display_name_prefix' : '',
			'given_name' : '',
			'middle_name' : '',
			'surname' : '',
			'generation' : '',
			'incomplete_info' : false
		};

		// split display name
		// ([0] => display_name_prefix, [1] => given_name, [2] => middle_name, [3] => surname, [4] => generation)
		var displayNameParts = data.split(new RegExp(this.SP + '|' + this.NBSP, 'g'));
		displayNameParts = Zarafa.core.Util.trimStringArray(displayNameParts);

		switch(displayNameParts.length) {
			case 4:
				// search for display name prefix in name
				var firstToken = displayNameParts.shift();
				result['display_name_prefix'] = Zarafa.core.Util.inArray(this.prefixOptions, firstToken, true) ? firstToken : '';

				// search for suffix in name
				var lastToken = displayNameParts.pop();
				result['generation'] = Zarafa.core.Util.inArray(this.suffixOptions, lastToken, true) ? lastToken : '';
				result['given_name'] = !Ext.isEmpty(result['display_name_prefix']) ? displayNameParts.shift() : firstToken;
				result['surname'] = !Ext.isEmpty(result['generation']) ? displayNameParts.pop() : lastToken;
				result['middle_name'] = !Ext.isEmpty(displayNameParts.length) ? displayNameParts.shift() : '';
				break;
			case 3:
				// search for display name prefix in name
				var firstToken = displayNameParts.shift();
				result['display_name_prefix'] = Zarafa.core.Util.inArray(this.prefixOptions, firstToken, true) ? firstToken : '';

				// search for suffix in name
				var lastToken = displayNameParts.pop();
				result['generation'] = Zarafa.core.Util.inArray(this.suffixOptions, lastToken, true) ? lastToken : '';

				if(Ext.isEmpty(result['display_name_prefix']) && Ext.isEmpty(result['generation'])) {
					result['given_name'] = firstToken;
					result['middle_name'] = displayNameParts.shift();
					result['surname'] = lastToken;
				} else if(!Ext.isEmpty(result['display_name_prefix']) && Ext.isEmpty(result['generation'])) {
					result['given_name'] = displayNameParts.shift();
					result['surname'] = lastToken;
				} else if(Ext.isEmpty(result['display_name_prefix']) && !Ext.isEmpty(result['generation'])) {
					result['given_name'] = firstToken;
					result['surname'] = displayNameParts.shift();
				} else if(!Ext.isEmpty(result['display_name_prefix']) && !Ext.isEmpty(result['generation'])) {
					result['surname'] = displayNameParts.shift();
				}
				break;
			case 2:
				// search for display name prefix in name
				var firstToken = displayNameParts.shift();
				result['display_name_prefix'] = Zarafa.core.Util.inArray(this.prefixOptions, firstToken, true) ? firstToken : '';

				// search for suffix in name
				var lastToken = displayNameParts.pop();
				result['generation'] = Zarafa.core.Util.inArray(this.suffixOptions, lastToken, true) ? lastToken : '';

				if(Ext.isEmpty(result['display_name_prefix']) && Ext.isEmpty(result['generation'])) {
					result['given_name'] = firstToken;
					result['surname'] = lastToken;
				} else if(Ext.isEmpty(result['display_name_prefix']) && !Ext.isEmpty(result['generation'])) {
					result['surname'] = firstToken;
					// information entered is incomplete or unclear
					result['incomplete_info'] = true;
				} else if(!Ext.isEmpty(result['display_name_prefix']) && Ext.isEmpty(result['generation'])) {
					result['surname'] = lastToken;
					// information entered is incomplete or unclear
					result['incomplete_info'] = true;
				}
				break;
			case 1:
				result['given_name'] = displayNameParts.shift();
				// information entered is incomplete or unclear
				result['incomplete_info'] = true;
				break;
			default:
				// search for display name prefix in name
				var firstToken = displayNameParts.shift();
				result['display_name_prefix'] = Zarafa.core.Util.inArray(this.prefixOptions, firstToken, true) ? firstToken : '';

				// search for suffix in name
				var lastToken = displayNameParts.pop();
				result['generation'] = Zarafa.core.Util.inArray(this.suffixOptions, lastToken, true) ? lastToken : '';

				result['given_name'] = !Ext.isEmpty(result['display_name_prefix']) ? displayNameParts.shift() : firstToken;
				result['surname'] = !Ext.isEmpty(result['display_name_prefix']) ? displayNameParts.pop() : lastToken;
				result['middle_name'] = displayNameParts.join(this.NBSP);
				break;
		}

		return result;
	},

	/**
	 * This function will parse phone number string and convert into an object that will contain
	 * countr_code, city_code, local_number, extension
	 *
	 * assumptions that is used for parsing phone numbers in this function
	 * value                        | country_code | city_code | local_number | extension
	 * 1234567                      |              |           | 1234567      |
	 * 1234567 x 123                |              |           | 1234567      | 123
	 * +91 1234567 x 123            | +91          |           | 1234567      | 123
	 * +91 1234567                  | +91          |           | 1234567      |
	 * +91 (0265) 1234567           | +91          | 0265      | 1234567      |
	 * +91 (0265) 1234567 x 123     | +91          | 0265      | 1234567      | 123
	 * +91 (0265) 1234567/123       | +91          | 0265      | 1234567      | 123
	 * (0265) 1234567               |              | 0265      | 1234567      |
	 *
	 * @param {String} data data string that will be parsed
	 * @return {Object} object that contains parsed data
	 * @private
	 */
	parsePhoneInfo : function(data)
	{
		var result = {
			'country_code' : '',
			'city_code' : '',
			'local_number' : '',
			'extension' : ''
		};

		// Search for extensions
		var extensions = ['x', '/', '-'];
		for (var i = 0, len = extensions.length; i < len; i++) {
			var ext = extensions[i];
			var index = data.indexOf(ext);

			if (index >= 0) {
				result['extension'] = data.slice(index);
				// remove extension from phone number
				data = data.replace(result['extension'], '');

				// remove seperator character from extension
				result['extension'] = result['extension'].replace(ext, '').trim();

				// Only one extension can be allowed
				break;
			}
		}

		// Valid country codes start with '00' or '+', for example: 0031 or +31
		var countryRegexp = new RegExp('(\\+|0{2})[^' + this.SP + '|' + this.NBSP + ']+');
		// valid city codes start with a single '0', for example: 020 or (0)20
		var cityRegexp = new RegExp('(^|' + this.SP + '|' + this.NBSP + ')\\(?0\\)?[^0|' + this.SP + '|' + this.NBSP + ']+');

		// Check if a section of the telephone number is grouped, this is either the
		// country or area code. When we extracted the portion, replace it with a space
		// because the part which comes before might be the country code as well.
		var group = data.match('\\((.{2,})\\)');
		if (group && group.length === 2) {
			var code = group[1].trim();

			// The group is either country code or city code, for country code
			// there are stricter rules, so we apply that countryRegexp and if it doesn't
			// matches we assume it will be the city code (even when the cityRegexp
			// won't match).
			if (code.match(countryRegexp)) {
				result['country_code'] = code;
			} else {
				result['city_code'] = code;
			}

			// remove the group from the number, be aware that the group
			// might not be at the start, or be surrounded by spaces. So
			// replace it with a space
			data = data.replace(group[0], ' ');
		} else {
			// What if a single number was surrounded by (), we must ensure
			// it has a space before it, because this kind of grouping is used
			// for adding a number to the group following it.
			data = data.replace(new RegExp('([^' + this.SP + '|' + this.NBSP + '])\\((.)\\)([^' + this.SP + '|' + this.NBSP + '])'), '$1 $2$3');
		}

		// Split whatever is left of the telephone number, we can then apply
		// simple heuristics on determining the remaining pieces.
		var phoneNumberParts = data.split(new RegExp(this.SP + '|' + this.NBSP + '|' + '-', 'g'));
		phoneNumberParts = Zarafa.core.Util.trimStringArray(phoneNumberParts);

		// If we don't have the country code yet, then check if the first section qualifies.
		if (phoneNumberParts.length > 1 && !result['country_code'] && phoneNumberParts[0].match(countryRegexp)) {
			result['country_code'] = phoneNumberParts.shift();
		}

		// If we don't have the city code yet, then check if this is the city
		if (phoneNumberParts.length > 1 && !result['city_code'] && phoneNumberParts[0].match(cityRegexp)) {
			result['city_code'] = phoneNumberParts.shift();
		}

		// The remainder is assumed to be the telephone number itself
		result['local_number'] = phoneNumberParts.join(this.NBSP);

		return result;
	},

	/**
	 * This function will parse address string and convert into an object that will contain
	 * street, country, postal_code, state, city
	 *
	 * assumptions that is used for parsing address in this function
	 * value                                  | street      | city       |	state	| postal_code | country
	 * first                                  |             | first      |          |             |
	 * first second                           |             | first      | second   |             |
	 * first(\n)second                        | first       | second     |          |             |
	 * first(\n)second third(\n)fourth        | first       | second     | third    |             | fourth
	 * first(\n)second third fourth(\n)fourth | first       | second     | third    | fourth      | fourth
	 *
	 * @param {String} data data string that will be parsed
	 * @return {Object} object that contains parsed data
	 * @private
	 */
	parseAddressInfo : function(data)
	{
		var singleLine = false;
		var result = {
			'street' : '',
			'country' : '',
			'postal_code' : '',
			'city' : '',
			'state' : '',
			'incomplete_info' : false
		};

		// split address based on newline characters
		var addressParts = data.split(new RegExp(this.CR + '|' + this.LF + '|' + this.CRLF, 'g'));
		addressParts = Zarafa.core.Util.trimStringArray(addressParts);

		// What has the user filled in, we can make educated guesses regarding the content.
		// 1) If provided, the country is the last line
		// 2) The city & state will most likely be on the same line
		// 3) The zipcode might be on the same line as the city & state
		// 4) The first line(s) are likely the street
		//
		// From this we can make the following breakdown based on the line count
		switch(addressParts.length) {
			default:
				// For 3 lines or more, the chance is high that
				// the last line is the country
				result['country'] = addressParts.pop();
				// furthermore the second to last line is the postal/city/state information
				singleLine = addressParts.pop();
				// The remaining information is the street, this might not be accurate,
				// but at least we parse all remaining information into a field.
				result['street'] = addressParts.join(this.CRLF);
				// A lot of information was provided, the educated guess is that
				// we have parsed the address correctly.
				result['incomplete_info'] = false;
				break;
			case 2:
				// For 2 lines, we don't expect the country to be given.
				// The first line is likely the street, and the second line
				// is probably the postal/city/state information
				result['street'] = addressParts.shift();
				singleLine = addressParts.shift();
				// Not all fields could be recognized, lets ask the user
				// if we did a good job.
				result['incomplete_info'] = true;
				break;
			case 1:
				// Only 1 line means that the user probably doesn't know
				// where the user is exactly located. He probably did nothing
				// more then type some postal/city/state information.
				singleLine = addressParts.shift();
				// We really have no clue if we did a good job. The user should
				// be more informative.
				result['incomplete_info'] = true;
				break;
			case 0:
				// No information was provided, but that is considered "complete".
				result['incomplete_info'] = false;
				break;
		}

		// We might have some extra parsing todo, we have a single line which
		// contains the city, state and postal code information which has to be recognized.
		if(singleLine !== false) {
			// split address based on spaces characters
			addressParts = singleLine.split(new RegExp(this.SP + '|' + this.NBSP, 'g'));
			addressParts = Zarafa.core.Util.trimStringArray(addressParts);

			// The line might have started or ended with the postal code, postal codes
			// are most likely numbers. The chance that a field which consists only of
			// numbers being a city or state is very small. The postal code is normally
			// at the start or at the end of the line as well. So we can simplify our
			// check
			if (Ext.isNumber(parseInt(addressParts[0]))) {
				result['postal_code'] = addressParts.shift();
			} else if (Ext.isNumber(parseInt(addressParts[addressParts.length - 1]))) {
				result['postal_code'] = addressParts.pop();
			}

			// If something is left, the city is the most likely thing that was
			// provided. If we have sufficient parts left, then the last component
			// is most likely the state.
			if (addressParts.length > 1) {
				result['state'] = addressParts.pop();
				result['city'] = addressParts.join(this.NBSP);
			} else if (addressParts.length === 1) {
				result['city'] = addressParts.shift();
			}
		}

		return result;
	},

	/**
	 * This function will work as a wrapper function for all functions that will combine
	 * data and create string representation
	 * @param {String} infoType type of data that will be combined
	 * @param {Object} data data object that will be combined
	 * @return {String} object that contains combined string data
	 */
	combineInfo : function(infoType, data)
	{
		// invalid data
		if(!Ext.isObject(data)) {
			return null;
		}

		switch(infoType) {
			case 'name':
				return this.combineNameInfo(data);
			case 'phone':
				return this.combinePhoneInfo(data);
			case 'address':
				return this.combineAddressInfo(data);
			default:
				return null;
		}
	},

	/**
	 * This function will combine full name object and convert into a string representation
	 * @param {Object} data data object that will be combined
	 * @return {String} string that contains combined data
	 * @private
	 */
	combineNameInfo : function(data)
	{
		var nameString = !Ext.isEmpty(data['display_name_prefix']) ? (data['display_name_prefix'] + this.NBSP) : '';
		nameString += !Ext.isEmpty(data['given_name']) ? (data['given_name'] + this.NBSP) : '';
		nameString += !Ext.isEmpty(data['middle_name']) ? (data['middle_name'] + this.NBSP) : '';
		nameString += !Ext.isEmpty(data['surname']) ? (data['surname'] + this.NBSP) : '';
		nameString += !Ext.isEmpty(data['generation']) ? data['generation'] : '';

		return nameString.trim();
	},

	/**
	 * This function will combine phone number object and convert into a string representation
	 * @param {Object} data data object that will be combined
	 * @return {String} string that contains combined data
	 * @private
	 */
	combinePhoneInfo : function(data)
	{
		var phoneString = '';
		// Check country code is available if yes then
		// check if it is valid country code,
		// if not then convert it to valid country code by appending '+'
		if (!Ext.isEmpty(data['country_code'])) {
			var countryRegex = new RegExp('(\\+|0{2})[^' + this.SP + '|' + this.NBSP + ']+');
			phoneString = data['country_code'] + this.NBSP;
			if (!data['country_code'].match(countryRegex)) {
				phoneString = '+' + phoneString;
			}
		}

		phoneString += !Ext.isEmpty(data['city_code']) ? ('(' + data['city_code'] + ')' + this.NBSP) : '';
		phoneString += !Ext.isEmpty(data['local_number']) ? (data['local_number'] + this.NBSP) : '';
		phoneString += !Ext.isEmpty(data['extension']) ? ('-' + this.NBSP + data['extension']) : '';

		return phoneString.trim();
	},

	/**
	 * This function will combine address object and convert into a string representation
	 * @param {Object} data data object that will be combined
	 * @return {String} string that contains combined data
	 * @private
	 */
	combineAddressInfo : function(data)
	{
		var addressString = '';

		if (!Ext.isEmpty(data['street'])) {
			addressString += data['street'];
		}
		if (addressString[addressString.length - 1] !== this.LF) {
			addressString += this.CRLF;
		}

		if (!Ext.isEmpty(data['city'])) {
			if (addressString[addressString.length - 1] !== this.LF) {
				addressString += this.NBSP;
			}
			addressString += data['city'];
		}
		if (!Ext.isEmpty(data['state'])) {
			if (addressString[addressString.length - 1] !== this.LF) {
				addressString += this.NBSP;
			}
			addressString += data['state'];
		}
		if (!Ext.isEmpty(data['postal_code'])) {
			if (addressString[addressString.length - 1] !== this.LF) {
				addressString += this.NBSP;
			}
			addressString += data['postal_code'];
		}
		if (addressString[addressString.length - 1] !== this.LF) {
			addressString += this.CRLF;
		}

		if (!Ext.isEmpty(data['country'])) {
			addressString += data['country'];
		}

		return addressString.trim();
	}
});
