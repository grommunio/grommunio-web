/**
 * @class String
 * #core
 */

Ext.applyIf(String, {
	/**
	 * Pads the right side of a string with a specified character.  This is especially useful
	 * for normalizing number and date strings.  Example usage:
	 * <pre><code>
	 var s = String.rightPad('123', 5, '0');
	 // s now contains the string: '12300'
	 * </code></pre>
	 * @param {String} value The original string
	 * @param {Number} padSize The total length of the output string
	 * @param {String} padChar (optional) The character with which to pad the original string (defaults to empty string " ")
	 * @return {String} The padded string
	 * @static
	 */
	rightPad : function(value, padSize, padChar)
	{
		var result = String(value);
		if(!padChar) {
			padChar = ' ';
		}

		while (result.length < padSize) {
			result += padChar;
		}

		return result;
	}
});

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