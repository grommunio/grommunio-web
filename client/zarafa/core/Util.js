Ext.namespace('Zarafa.core');

/**
 * @class Zarafa.core.Util
 * Utility class
 * @singleton
 */
Zarafa.core.Util =
{
	/**
	 * @cfg {Boolean} skipRequester This flag specifies if confirm dialog will skip.
	 * If it is true then confirm dialog will not show otherwise it will show.
	 */
	skipRequester : false,

	/**
	 * Sort an array of objects
	 *
	 * @param {Array} list The array of objects which must be sorted
	 * @param {String} order The order in which the array must be sorted, can be either "ASC" or "DESC"
	 * @param {String/Function} sort (optional) Can either be a string, a function or nothing.
	 * A String argument will be used to sort the array on the given fieldname. A function will be used
	 * as comparison function for sorting. When not provided the default comparison function shall be
	 * used which compares items based on their value.
	 * @return {Array} The sorted array
	 * @method
	 */
	sortArray : function(list, order, sort)
	{
		var collection = new Ext.util.MixedCollection();
		var fn;
		collection.addAll(list);

		if (Ext.isFunction(sort)) {
			// Use given sort function
			fn = sort;
		} else if (Ext.isString(sort)) {
			// Sort on object attribute value, by default this is a
			// numeric sort. We need to wrap the function to
			// access the attribute value.
			fn = function(obj1, obj2) {
				return Zarafa.core.Util.numericComparison(obj1[sort], obj2[sort]);
			};
		} else {
			// Sort the object, by default this is a numeric sort
			fn = this.numericComparison;
		}

		collection.sort(order, fn);
		return collection.getRange();
	},

	/**
	 * Comparison function for comparing two numbers.
	 * This function can be used for sorting in for example the functions
	 * {@link Ext.util.MixedCollection#sort} and {@link #sortArray}.
	 *
	 * @param {Number} number1 The first number to compare
	 * @param {Number} number2 The second number to compare
	 * @return {Number} A positive value when number1 is greater then number2.
	 * A negative value when number2 is greater then number1. 0 when both objects are equal.
	 */
	numericComparison : function(number1, number2)
	{
		return number1 - number2;
	},

	/**
	 * Comparison function for comparing two strings using case sensitive comparison.
	 * This function can be used for sorting in for example the functions
	 * {@link Ext.util.MixedCollection#sort} and {@link #sortArray}.
	 *
	 * @param {String} string1 The first object to compare
	 * @param {String} string2 The second object to compare
	 * @return {Number} A positive value when string1 is greater then string2.
	 * A negative value when string2 is greater then string1. 0 when both objects are equal.
	 */
	caseSensitiveComparison : function(string1, string2)
	{
		return string1 > string2 ? 1 : (string1 < string2 ? -1 : 0);
	},

	/**
	 * Comparison function for comparing two strings using case insensitive comparison.
	 * This function can be used for sorting in for example the functions
	 * {@link Ext.util.MixedCollection#sort} and {@link #sortArray}.
	 *
	 * @param {String} string1 The first object to compare
	 * @param {String} string2 The second object to compare
	 * @return {Number} A positive value when string1 is greater then string2.
	 * A negative value when string2 is greater then string1. 0 when both objects are equal.
	 */
	caseInsensitiveComparison : function(string1, string2)
	{
		var v1 = String(string1).toUpperCase(), v2 = String(string2).toUpperCase();
		return Zarafa.core.Util.caseSensitiveComparison(v1, v2);
	},

	/**
	 * Remove all duplicate entries from an array of objects
	 *
	 * @param {Array} list The array of objects which must be filtered
	 * @param {String} attr (optional) The fieldname on which objects must be compared to detect duplicates
	 * If not provided the comparison is done on the object value.
	 * @return {Array} The array with only unique elements
	 * @method
	 */
	uniqueArray : function(list, attr)
	{
		var collection = new Ext.util.MixedCollection();

		Ext.each(list, function(item) {
			var value = attr ? item[attr] : item;

			if (!collection.containsKey(value)) {
				collection.add(value, item);
			}
		}, this);

		return collection.getRange();
	},

	/**
	 * This is a utility function to trim strings in a single or multi dimensional array
	 * this function should only be used with array which has only string values, otherwise
	 * this function will give unpredicated results without any error
	 * @param {Array} arrayToTrim array whose values should be trimmed
	 * @return {Array} trimmed array
	 */
	trimStringArray : function(arrayToTrim)
	{
		var tmpArray = arrayToTrim;
		arrayToTrim = [];				// reset array

		for(var index = 0, len = tmpArray.length; index < len; index++) {
			if(Array.isArray(tmpArray[index])) {
				// recursively call the same function
				arrayToTrim.push(Zarafa.core.Util.trimStringArray(tmpArray[index]));
			} else {
				if(Ext.isString(tmpArray[index]) && !Ext.isEmpty(tmpArray[index].trim())) {
					arrayToTrim.push(tmpArray[index].trim());
				}
			}
		}

		return arrayToTrim;
	},

	/**
	 * This is a utility function to check if any multi dimensional array contains any token
	 * @param {Array} multiDimArray single or multi-dimensional array
	 * @param {Mixed} tokenToSearch token to search in array
	 * @param {Boolean} caseInSensitive case sensitive match
	 * @param {Boolean} matchPartial comparison will also check for partial match
	 * @return {Boolean} true if token is found else false
	 */
	inArray : function(multiDimArray, tokenToSearch, caseInSensitive, matchPartial)
	{
		for(var index = 0, len = multiDimArray.length; index < len; index++) {
			if(Array.isArray(multiDimArray[index])) {
				// recursively call the same function
				if(Zarafa.core.Util.inArray(multiDimArray[index], tokenToSearch, caseInSensitive, matchPartial)) {
					return true;
				}
			} else {
				if(tokenToSearch) {
					if(matchPartial) {
						if(caseInSensitive) {
							if(multiDimArray[index].indexOf(tokenToSearch.toLowerCase()) != -1 || tokenToSearch.indexOf(multiDimArray[index].toLowerCase()) != -1) {
								return true;
							}
						} else {
							if(multiDimArray[index].indexOf(tokenToSearch) != -1) {
								return true;
							}
						}
					} else {
						if(caseInSensitive) {
							if(multiDimArray[index].toLowerCase() === tokenToSearch.toLowerCase()) {
								return true;
							}
						} else {
							if(multiDimArray[index] === tokenToSearch) {
								return true;
							}
						}
					}
				}
			}
		}

		return false;
	},

	/**
	 * This is a utility function to copy all the properties of config to obj recursively.
	 * Ext.appply() does the same thing but this extension preserves child object's previous values
	 * instead of overwriting it with new values.
	 * @param {Object} obj The receiver of the properties
	 * @param {Object} config The source of the properties
	 * @param {Object} defaults A different object that will also be applied for default values
	 * @return {Object} returns obj
	 */
	applyRecursive : function(obj, config, defaults)
	{
		if(defaults) {
			obj = Zarafa.core.Util.applyRecursive(obj, defaults);
		}

		if(obj && config && (Ext.isObject(config) || Array.isArray(config))) {
			for(var key in config) {
				if (Ext.isDefined(obj[key]) && Ext.isObject(obj[key])) {
					// object with child elements, so call this function recursively
					obj[key] = Zarafa.core.Util.applyRecursive(obj[key], config[key]);
				} else if (Ext.isObject(config[key])) {
					obj[key] = Zarafa.core.Util.applyRecursive({}, config[key]);
				} else {
					// normal copy
					obj[key] = config[key];
				}
			}
		}

		return obj;
	},

	/**
	 * This is a utility function to copy all the properties of config to obj recursively,
	 * if they don't already exist. Ext.appplyIf() does the same thing but this extension
	 * preserves child object's previous values instead of overwriting it with new values.
	 * @param {Object} obj The receiver of the properties
	 * @param {Object} config The source of the properties
	 * @param {Object} defaults A different object that will also be applied for default values
	 * @return {Object} returns obj
	 */
	applyIfRecursive : function(obj, config, defaults)
	{
		if(defaults) {
			obj = Zarafa.core.Util.applyIfRecursive(obj, defaults);
		}

		if(obj && config && (Ext.isObject(config) || Array.isArray(config))) {
			for(var key in config) {
				if(Ext.isDefined(obj[key]) && Ext.isObject(obj[key])) {
					// object with child elements, so call this function recursively
					obj[key] = Zarafa.core.Util.applyIfRecursive(obj[key], config[key]);
				} else if (Ext.isObject(config[key])) {
					obj[key] = Zarafa.core.Util.applyIfRecursive({}, config[key]);
				} else if(!Ext.isDefined(obj[key])) {
					// normal copy
					obj[key] = config[key];
				}
			}
		}

		return obj;
	},

	/**
	 * Recursively flattens a JSON object hierarchy into a flat list of key/value pairs.
	 *
	 * For example: The object:
	 *	{
	 *   	'zarafa' : {
	 *   		'v1' : {
	 *   			'main' : {
	 *   				'settingA' : 'value1',
	 *					'settingB' : 'value2'
	 *   			}
	 *   		}
	 *   	}
	 *	}
	 *
	 * will be flattened to:
	 *	{
	 * 		'zarafa/v1/main/settingA' : 'value1',
	 * 		'zarafa/v1/main/settingB' : 'value2'
	 *	}
	 *
	 * @param {Object} obj The object to flatten.
	 * @param {String} sep The separator which must be applied between each path-key (e.g: '/')
	 * @param {String} path The basePath for the keys inside the object.
	 * @return {Object} The flattened object
	 */
	flattenObject : function(obj, sep, path)
	{
		var ret = {};

		var separator = '';
		if (Ext.isEmpty(path)) {
			path = '';
		} else {
			separator = sep;
		}

		if (Ext.isObject(obj)) {
			for (var key in obj) {
				Ext.apply(ret, Zarafa.core.Util.flattenObject(obj[key], sep, path + separator + key));
			}
		} else {
			ret[path] = obj;
		}

		return ret;
	},

	/**
	 * Function will return object which has all keys in lowercase
	 *
	 * @param {Object} obj The object.
	 * @return {Object} The object with all keys as lowercase
	 */
	objectKeysToLowerCase : function(object)
	{
		var key, keys = Object.keys(object);
		var newObject={};
		for (var i=0; i<keys.length; i++) {
			key = keys[i];
			newObject[key.toLowerCase()] = object[key];
		}
		return newObject;
	},

	/**
	 * Split a string in pieces based on whether each piece matches the passed
	 * pattern. It returns both the pieces that match and that do not match the
	 * pattern.
	 * @param {String} str The input string to be split up
	 * @param {RegExp} pattern The regex pattern used to be split the string
	 * @return {Array} The array of pieces
	 * @private
	 */
	splitStringByPattern : function(str, pattern)
	{
		var cutOffPoints = [0];
		var found;
		// Find the cutOffPoints in the str
		while((found = pattern.exec(str)) !== null){
			if(found.index!==0){
				cutOffPoints.push(found.index);
			}
			if(pattern.lastIndex < str.length){
				cutOffPoints.push(pattern.lastIndex);
			}
		}
		// Cut the string up into the pieces based on the cutOffPoints
		var parts = [];
		if(cutOffPoints.length > 1){
			for(var i=0;i<cutOffPoints.length;i++){
				// Use the current and the next cutOffPoint to calculate the number of character we need to extract.
				if(Ext.isDefined(cutOffPoints[i+1])){
					parts.push(str.slice(cutOffPoints[i], cutOffPoints[i+1]));
				}else{
					parts.push(str.slice(cutOffPoints[i]));
				}
			}
		}else{
			parts = [str];
		}
		return parts;
	},

	/**
	 * Convenience method to check if a given point (x,y) is inside a box (x,y,width,height)
	 * @param {Object} box a (x, y, with, height) tuple
	 * @param {Number} x point x component
	 * @param {Number} y point y component
	 * @return {Boolean} True if the given point is inside the box.
	 */
	inside : function(box, x, y)
	{
		return (x >= box.x && x < (box.x + box.width) && y >= box.y && y < (box.y + box.height));
	},

	/**
	 * Restrict a box containing 'x', 'y', 'width' and 'height' properties,
	 * to fall completely inside the given container box (which has the same properties).
	 * This ensures that the position of the box left-top corner will always be inside
	 * the container, and will attempt to move the x and y coordinates in such a way
	 * that the full width and height will fit inside the container box.
	 * @param {Object} container The container box
	 * @param {Object} box The box
	 * @return {Object} The updated box position
	 */
	restrictBox : function(container, box)
	{
		// Ensure we copy the box
		box = Ext.apply({}, box);

		// For all our calculations, we at least
		// want the top-left position to be inside
		// the container.
		box.x = Math.max(container.x, box.x);
		box.y = Math.max(container.y, box.y);

		// We can only correct the x-coordinate
		// if it doesn't equal are most-left position
		if (box.x > container.x) {
			var overflowX = Math.max(0, (box.x + box.width) - (container.x + container.width));
			box.x -= overflowX;
		}

		// We can only correct the x-coordinate
		// if it doesn't equal are most-upper position
		if (box.y > container.y) {
			var overflowY = Math.max(0, (box.y + box.height) - (container.y + container.height));
			box.y -= overflowY;
		}

		// Technically we could have moved the boxed
		// beyond our minumum top-left position. Fix
		// that here, and just accept that we will
		// overflow...
		box.x = Math.max(container.x, box.x);
		box.y = Math.max(container.y, box.y);

		return box;
	},

	/**
	 * Function will get the index of the start and end position of the current selection.
	 * @param {Ext.Element/HTMLElement} obj Reference to the textfield
	 * @return {Object} An object containing a 'start' and 'end' field which indicate
	 * the current position of the start and end of the selection. The fields will
	 * be -1 if there is no selection.
	 */
	getSelectionRange : function(obj)
	{
		obj = obj.dom || obj;

		if (obj.selectionStart || (obj.selectionStart == "0")) {
			return { start : obj.selectionStart, end : obj.selectionEnd };
		}
	},

	/**
	 * Function which will set the current caret position in the given textfield.
	 * @param {Ext.Element/HTMLElement} obj Reference to the textfield or the id of the textfield
	 * @param {Number} position The desired position for the caret
	 */
	setCaretPosition: function(obj, position)
	{
		Zarafa.core.Util.setSelectionRange(obj, position, position);
	},

	/**
	 * Function makes a selection in the textfield
	 * @param {Ext.Element/HTMLElement} obj Reference to the textfield or the id of the textfield
	 * @param {Number} selectionStart Index of the starting position of the selection
	 * @param {Number} selectionEnd Index of the ending position of the selection
	 */
	setSelectionRange: function(obj, selectionStart, selectionEnd)
	{
		obj = obj.dom || obj;

		if (obj && typeof obj == "object" && obj.setSelectionRange) {
			obj.focus();
			obj.setSelectionRange(selectionStart, selectionEnd);
		}
	},

	/**
	 * Checks whether a string is a valid email address using a regular expression. This check is
	 * not performed to the extend as the RFC 5322 specification describes the format.
	 * @param {String} str String to be validated
	 * @return {Boolean} Returns true when the email address is valid
	 */
	validateEmailAddress: function(str)
	{
		//TODO make a better check
		var filter = new RegExp(/^([^<]*<){0,1}(([a-z0-9\.\!\#\$\%\&\'\*\+\-\/\=\?\^\_\`\{\|\}\~])+\@(([a-z0-9\-])+\.)+([a-z0-9]{2,5})+)>{0,1}$|^\[[^\]]+\]$/i);
		if(Ext.isString(str) && str.length > 0 ){
			return filter.test(str);
		}else{
			return false;
		}
	},

	/**
	 * Merge 2 objects containing event hanlers into a single object,
	 * while preserving scopes. This can be used when a {@link Ext.Component}
	 * receives a {@link Ext.Component#listeners} object while it also needs
	 * to add listeners in the same way (while it cannot use {@link Ext.Component#on}).
	 * By default the source listeners will {@link Function#createInterceptor intercept}
	 * the functions from the target.
	 *
	 * @param {Object} target The object with event handlers into which the new
	 * handlers will be merged.
	 * @param {Object} sourcec The object with event handlers which will be merged
	 * into the target
	 * @param {Boolean} intercept (optional) False to use {@link Function#createSequence}
	 * rather then {@link Function#createInterceptor}.
	 * @return {Object} The merged object
	 */
	mergeListeners : function(target, source, intercept)
	{
		// Make sure we have a target
		target = Ext.value(target, {});

		// Take the scope from our source, otherwise we default to the target
		var scope = source['scope'] || target['scope'];

		// Go over all listeners
		for (var key in source) {
			if (key === 'scope') {
				continue;
			}

			// Always create a delegate, the default scope inside the
			// target might might be equal to the scope of the source.
			var handler = source[key].createDelegate(scope);

			// Add the event handler
			if (Ext.isDefined(target[key])) {
				if (intercept !== false) {
					target[key] = target[key].createInterceptor(handler);
				} else {
					target[key] = target[key].createSequence(handler);
				}
			} else {
				target[key] = handler;
			}
		}

		return target;
	},

	/**
	 * Encode string in utf-16 hex format
	 * @param {String} str String to be converted into utf-16 encoded hex string
	 * @return {String} The utf-16 encoded string in hex format
	 */
	encode_utf16 : function(str)
	{
		var num1, num2;
		var result = '';

		if(!Ext.isString(str)) {
		    str = String(str);
		}

		for (var i = 0, len = str.length; i < len; i++) {
		    num2 = (str.charCodeAt(i) >> 8).toString(16);
		    num1 = (str.charCodeAt(i) & 0xff).toString(16);

		    result += String.leftPad(String(num1), 2, '0');
		    result += String.leftPad(String(num2), 2, '0');
		}

		return result;
	},

	/**
	 * Function converts string in to hexadecimal string
	 * @param {String} str ASCII string to be converted into hexadecimal representation.
	 * @return {String} The hexadecimal representation as a string.
	 */
	stringToHex : function(string)
	{
		string = string.toUpperCase();
		var hexString = '';
		for(var i=0; i < string.length; i++) {
			hexString += '' + string.charCodeAt(i).toString(16);
		}

		return hexString;
	},

	/**
	 * Function converts hexadecimal string in to ASCII string
	 * @param {String} hexString The hexadecimal string
	 * @return {String} converted ASCII string
	 */
	hexToString : function(hexString)
	{
		hexString = hexString.toString();
		var string = '';
		for (var i = 0; i < hexString.length; i += 2) {
			string += String.fromCharCode(parseInt(hexString.substr(i, 2), 16));
		}
		return string.toLowerCase();
	},

	/**
	 * Function used to reload the webapp.
	 */
	reloadWebapp : function()
	{
		if ( container.fireEvent('beforewebappreload') !== false ){
			this.disableLeaveRequester();
			window.location.reload();
		}
	},

	/**
	 * Function is use to register onbeforeunload event to show confirm dialog
	 * when user trying to leave the page.
	 */
	enableLeaveRequester : function()
	{
		window.onbeforeunload = this.onBeforeUnload.createDelegate(this);
	},

	/**
	 * Function is use to deregistering onbeforeunload event.
	 */
	disableLeaveRequester : function()
	{
		window.onbeforeunload = null;
	},

	/**
	 * Function which is show confirm dialog when user trying to leave the page.
	 * It will also check the value of {#Zarafa.core.Util.skipRequester skipRequester}
	 * If it's true then it will not show the confirm dialog.
	 */
	onBeforeUnload : function()
	{
		if(!this.skipRequester) {
			return _('Your changes will be lost if you leave this page now.');
		} else {
			this.skipRequester = false;
			return;
		}
	},

	/**
	 * Helper function which add the given text into
	 * browser clipboard data.
	 *
	 * @param {String} text The text which is going to
	 * add in clipboard data.
	 */
	copyToClipboard : function (text)
	{
		var textArea = document.createElement("textarea");
		textArea.setAttribute("id","copyTextArea");
		document.body.appendChild(textArea);
		textArea.innerText = text;
		textArea.select();
		document.execCommand("copy");
		document.body.removeChild(textArea);
	}
};
