/**
 * @class String
 * #core
 */

// https://github.com/uxitten/polyfill/blob/master/string.polyfill.js
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/repeat
if (!String.prototype.padEnd) {
    /* jshint freeze: false */
    String.prototype.padEnd = function padEnd(targetLength,padString) {
        targetLength = targetLength>>0; //floor if number or convert non-number to 0;
        padString = String(padString || ' ');
        if (this.length > targetLength) {
            return String(this);
        }
        else {
            targetLength = targetLength-this.length;
            if (targetLength > padString.length) {
                padString += padString.repeat(targetLength/padString.length); //append to original to ensure we are longer than needed
            }
            return String(this) + padString.slice(0,targetLength);
        }
    };
}

if (!String.prototype.startsWith) {
	/**
	 * Determines whether a string begins with the characters of a specified string,
	 * returning true or false as appropriate.
	 * @param {String} searchString The characters to be searched for at the start of this string.
	 * @param {Number} position The position in this string at which to begin searching for searchString; defaults to 0.
	 * @return {Boolean} true if the given characters are found at the beginning of the string; otherwise, false.
	 */
	Object.defineProperty(String.prototype, 'startsWith', {
		value : function(searchString, position) {
			return this.substr(position || 0, searchString.length) === searchString;
		}
	});
}

// https://github.com/uxitten/polyfill/blob/master/string.polyfill.js
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart
if (!String.prototype.padStart) {
    /* jshint freeze: false */
    String.prototype.padStart = function padStart(targetLength,padString) {
        targetLength = targetLength>>0; //floor if number or convert non-number to 0;
        padString = String(padString || ' ');
        if (this.length > targetLength) {
            return String(this);
        }
        else {
            targetLength = targetLength-this.length;
            if (targetLength > padString.length) {
                padString += padString.repeat(targetLength/padString.length); //append to original to ensure we are longer than needed
            }
            return padString.slice(0,targetLength) + String(this);
        }
    };
}

if (!String.prototype.repeat) {

	/**
	 * IE does not supported repeat function so, add a function into string to available repeat the string function.
	 * @param {Number} times an integer indicating the number of times to repeat the string in the newly-created string.
	 * @returns {string} A new string containing the specified number of copies of the given string.
	 */
	String.prototype.repeat = function repeat(times) {
		var repeatedString = "";

		while (times > 0) {
			repeatedString += this;
			times--;
		}

		return repeatedString;
	};
}