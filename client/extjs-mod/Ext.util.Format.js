(function() {
	/**
	 * @class Ext.util.Format
	 * Reusable data formatting functions
	 * @singleton
	 */
	Ext.apply(Ext.util.Format, {
		/**
		 * Simple format for a file size (xxx bytes, xxx KB, xxx MB)
		 * @param {Number/String} size The numeric value to format
		 * @return {String} The formatted file size
		 */
		fileSize : function(size)
		{
			if (!Ext.isNumber(size)) {
				size = 0;
			}

			if (size < 1024) {
				return String.format(ngettext('{0} byte', '{0} bytes', size), size);
			}

			size = parseFloat((size / 1024).toFixed(1));
			if (size < 1024) {
				return String.format(ngettext('{0} KB', '{0} KB', size), size);
			}

			size = parseFloat((size / 1024).toFixed(1));
			if (size < 1024) {
				return String.format(ngettext('{0} MB', '{0} MB', size), size);
			}

			size = parseFloat((size / 1024).toFixed(1));
			if (size < 1024) {
				return String.format(ngettext('{0} GB', '{0} GB', size), size);
			}

			size = parseFloat((size / 1024).toFixed(1));
			return String.format(ngettext('{0} TB', '{0} TB', size), size);
		},

		/**
		 * Returns a string version of a float number as a percentage.
		 * @param {Float} value A number in the range [0..1]
		 * @param {Number} fixed optional, The number of digits in the percentage, defaults to 2.
		 * @return {String} Formatted percentage string
		 */
		percentage: function(value, fixed)
		{
			if (!Ext.isDefined(fixed)) {
				fixed = 2;
			}
			return (value * 100.0).toFixed(fixed) + "%";
		},

		/**
		 * Generate a string which represents a duration (xx minutes, xx hours, etc)
		 * @param {Number} value The duration (in minutes)
		 * @param {Number} decimals When rounding, how many decimals should be used
		 * @return {String} The formatted duration
		 */
		duration : function(value, decimals)
		{
			decimals = Ext.isDefined(decimals) ? decimals : 0;

			// Duration is less then an hour, print the number of minutes
			if (value < 60) {
				return String.format(ngettext('{0} minute', '{0} minutes', value), value);
			}

			// Duration is less then a day, print the number of hours
			// rounded to the requested number after the decimal point.
			value = parseFloat((value / 60).toFixed(decimals));
			if (value < 24) {
				return String.format(ngettext('{0} hour', '{0} hours', value), value);
			}

			// Duration is less then a week, print the number of days
			// rounded to the requested number after the decimal point.
			value = parseFloat((value / 24).toFixed(decimals));
			if (value < 7) {
				return String.format(ngettext('{0} day', '{0} days', value), value);
			}

			// Duration is one week or more, print the number of weeks
			// rounded to the requested number after the decimal point.
			value = parseFloat((value / 7).toFixed(decimals));
			return String.format(ngettext('{0} week', '{0} weeks', value), value);
		},

		/**
		 * Generate a string which can be used for indentation in the HTML.
		 * @param {Number} value The number of tabs to indent
		 * @param {Number} size (optional) The number of spaces per tab which should be generated
		 * @return {String} A string containing multiple '&nbsp' strings
		 */
		indent : function(value, size)
		{
			var spaces = (Ext.isDefined(value) ? value : 1) * (Ext.isDefined(size) ? size : 4);
			var indent = '';

			for (var i = 0; i < spaces; i++) {
				indent += '&nbsp;';
			}

			return indent;
		},

		/**
		 * Truncate a string from the middle and add an ellipsis ('...') in between.
		 * length of the string before and after ellipsis ('...') are specified in
		 * function parameters.
		 * @param {String} value The string to truncate
		 * @param {Number} startLength The maximum length to allow before truncation
		 * @param {Number} endLength The maximum length to allow after truncation
		 * @return {String} The converted/truncated text
		 */
		elide : function(value, startLength, endLength)
		{
			startLength = startLength || 0;
			endLength = Ext.isDefined(endLength) ? endLength : startLength;

			if (startLength === 0 && endLength === 0) {
				return value;
			}

			if (value && value.length > startLength + endLength) {
				return value.substr(0, startLength) + '...' + value.substr(value.length - endLength);
			}
			return value;
		},

		/**
		 * Combination of {@link #htmlEncode} and {@link #undef}.
		 * @param {String} value The string to encode
		 * @return {String} The htmlEncoded text
		 */
		htmlEncodeUndef : function(value)
		{
			return this.htmlEncode(this.undef.apply(this, arguments));
		},

		/**
		 * Combination of {@link #htmlEncode} and {@link #defaultValue}.
		 * @param {String} value The string which will be first replaced by defaultValue if it is empty / undefined
		 * and then it will be encoded.
		 * @return {String} The htmlEncoded text.
		 */
		htmlEncodeDefaultValue : function(value, defaultValue)
		{
			return this.htmlEncode(this.defaultValue.apply(this, arguments));
		},

		/**
		 * Combination of {@link #htmlEncode} and {@link #elide}.
		 * @param {String} value The string to truncate
		 * @param {Number} startLength The maximum length to allow before truncation
		 * @param {Number} endLength The maximum length to allow after truncation
		 * @return {String} The htmlEncoded and truncated text
		 */
		htmlEncodeElide : function(value, startLength, endLength)
		{
			return this.htmlEncode(this.elide.apply(this, arguments));
		},

		/**
		 * Combination of {@link #htmlEncode} and {@link #ellipsis}.
		 * @param {String} value The string to truncate
		 * @param {Number} length The maximum length to allow before truncating
		 * @param {Boolean} word True to try to find a common work break
		 * @return {String} The converted text
		 */
		htmlEncodeEllipsis : function(value, len, word)
		{
			return this.htmlEncode(this.ellipsis.apply(this, arguments));
		},

		/**
		 * Obtain the basename (filename) from the given string. This will remove
		 * everything which came before the last '\' character.
		 * @param {String} value The filename for which the basename is requested
		 * @return {String} The basename
		 */
		basename : function(value)
		{
			return value.split('\\').pop();
		},

		/**
		 * Combination of {@link #htmlEncode} and {@link #basename}.
		 * @param {String} value The filename for which the basename is requested
		 * @return {String} The htmlEncoded basename
		 */
		htmlEncodeBasename : function(value)
		{
			return this.htmlEncode(this.basename.apply(this, arguments));
		},

		/**
		 * Returns a translated string version for PR_SENSITIVITY
		 * @param {Number} value Value in PR_SENSITIVITY
		 * @return {String} Human readable sensitivity
		 */
		sensitivityString: function(value)
		{
			return Zarafa.core.mapi.Sensitivity.getDisplayName(value);
		},

		/**
		 * Returns a translated string version for PR_IMPORTANCE
		 * @param {Number} value Value in PR_IMPORTANCE
		 * @return {String} Human readable importance
		 */
		importanceString: function(value)
		{
			return Zarafa.core.mapi.Importance.getDisplayName(value);
		},

		/**
		 * Returns a translated string version for MeetingStatus property
		 * @param {Number} value Value in MeetingStatus
		 * @return {String} Human readable meeting status
		 */
		meetingStatusString: function(value)
		{
			return Zarafa.core.mapi.MeetingStatus.getDisplayName(value);
		},

		/**
		 * Returns a translated string version for ResponseStatus property
		 * @param {Number} value Value in ResponseStatus
		 * @return {String} Human readable response status
		 */
		responseStatusString: function(value)
		{
			return Zarafa.core.mapi.ResponseStatus.getDisplayName(value);
		},

		/**
		 * Returns a translated string version for Task status property
		 * @param {Number} value Enum value in TaskStatus
		 * @return {String} Human readable task status
		 */
		taskStatusString: function(value)
		{
			return Zarafa.core.mapi.TaskStatus.getDisplayName(value);
		},

		/**
		 * Returns a translated string version for busy status property
		 * @param {Number} value Enum value in BusyStatus
		 * @return {String} Human readable busy status
		 */
		busyStatusString: function(value)
		{
			return Zarafa.core.mapi.BusyStatus.getDisplayName(value);
		}
	});
})();
