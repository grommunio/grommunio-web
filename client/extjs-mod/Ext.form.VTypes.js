(function() {
	var checkPerc = /^(100?|\d?\d)?%?$/;
	var checkNaturalInteger = /^[1-9]\d*$/i;
	// Override regex to allow TLD with max length of 10 characters
	var email = /^(\w+)([\-+.\']+[\w]+)*@(\w[\-\w]*\.){1,5}([A-Za-z]){2,10}$/;

	/**
	 * @class Ext.form.VTypes
	 * This will apply the custom vtype which is used to check
	 * given percentage must be between 0 to 100.
	 * @singleton
	 */
	Ext.apply(Ext.form.VTypes, {
		/**
		 * Used to validate the given percentage value must be between 0 to 100.
		 * and also check that value is not float.
		 * @param {Number} perc the perc is represent percentage value from field.
		 * @return {Boolean} return true if given percentage value matches
		 * with regular expression else return false.
		 */
		percentage : function(perc) {
			return checkPerc.test(perc);
		},

		//The error text to display when the validation function returns false
		percentageText: _('Value must be between 0% to 100%'),

		/**
		 * Used to validate the given value must be a whole number of one or higher
		 * @param {Number} value the value of the spinner field
		 * @return {Boolean} return true if the value is one or higher,
		 * else return false.
		 */
		naturalInteger: function(value)
		{
			return checkNaturalInteger.test(value);
		},

		// The error text to display when the validation function returns false
		naturalIntegerText: _('Number must be higher than zero'),

		/**
		 * The function used to validate email addresses.  Note that this is a very basic validation -- complete
		 * validation per the email RFC specifications is very complex and beyond the scope of this class, although
		 * this function can be overridden if a more comprehensive validation scheme is desired.  See the validation
		 * section of the <a href="http://en.wikipedia.org/wiki/E-mail_address">Wikipedia article on email addresses</a>
		 * for additional information.  This implementation is intended to validate the following emails:<tt>
		 * 'barney@example.de', 'barney.rubble@example.com', 'barney-rubble@example.coop', 'barney+rubble@example.com'
		 * </tt>.
		 * @param {String} value The email address
		 * @return {Boolean} true if the RegExp test passed, and false if not.
		 */
		'email' : function(v){
		    return email.test(v);
		}
	});
})();
