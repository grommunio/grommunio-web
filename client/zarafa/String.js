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
