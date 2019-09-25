Ext.namespace('Zarafa.common.ui');

/**
 * @class Zarafa.common.ui.DurationField
 * @extend Ext.form.NumberField
 * @xtype zarafa.durationfield
 *
 * The duration field is a special case of the {@link Ext.form.NumberField}.
 * When the user types in a numeric value, the value is converted into a
 * duration (by postfixing the value with 'hours').
 */
Zarafa.common.ui.DurationField = Ext.extend(Ext.form.NumberField, {
	/**
	 * @cfg {RegExp} stripCharsRe
	 * @hide
	 */
	stripCharsRe : /[^0-9]+/,

	/**
	 * @cfg {Boolean} allowDecimals
	 * @hide
	 */
	allowDecimals : false,

	/**
	 * @cfg {Boolean} allowNegative
	 * @hide
	 */
	allowNegative : false,

	/**
	 * Prepare a raw value or validation (see {@link #validate} and {@link #isValid}).
	 * This method will strip any non-numeric value from the value.
	 * @param {Mixed} value
	 * @return {Mixed} The string containing only number
	 */
	processValue : function(value){
		if (Ext.isString(value) && this.stripCharsRe) {
			return value.replace(this.stripCharsRe, '');
		}
		return value;
	},

	/**
	 * Sets a data value into the field and validates it. This will append the
	 * given numeric value with 'hour' or 'hours' to visualize the meaning
	 * of the value.
	 * @param {Mixed} value The value to set
	 * @return {Ext.form.Field} this
	 */
	setValue : function(value)
	{
		value = this.parseValue(value);

		// Apply a translated string which indicates the hours
		value = String.format(ngettext('{0} hour', '{0} hours', value), value);

		Ext.form.NumberField.superclass.setValue.call(this, value);
	}
});

Ext.reg('zarafa.durationfield', Zarafa.common.ui.DurationField);
