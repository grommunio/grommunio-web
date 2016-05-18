Ext.ns('Zarafa.common.plugins');

/**
 * @class Zarafa.common.plugins.PercentSpinner
 * @extends Zarafa.common.plugins.NumberSpinner
 * @ptype zarafa.percentspinner
 *
 * Extension to the {@link Zarafa.common.plugins.NumberSpinner} object,
 * to correctly parse percentages. This is used by the {@link Zarafa.common.ui.SpinnerField SpinnerField}.
 *
 * We inherit from the {@link Zarafa.common.plugins.NumberSpinner} class because
 * percentages are represented as Floats, and only our raw DOM value is a string
 * where the % sign is postfixed.
 */
Zarafa.common.plugins.PercentSpinner = Ext.extend(Zarafa.common.plugins.NumberSpinner, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			allowDecimals : true,
			decimalPrecision : 4
		});

		Zarafa.common.plugins.PercentSpinner.superclass.constructor.call(this, config);
	},

	/**
	 * Initializes the {@link Zarafa.common.ui.SpinnerField SpinnerField} to which
	 * this plugin has been hooked.
	 * @param {Zarafa.common.ui.SpinnerField} The parent field to which this component is connected
	 */
	init : function(field)
	{
		// The superClass will call parseFloat() on the defaultValue, minValue and
		// maxValue when those values are written in Strings. We however expect a string
		// to be formatted with a '%' as postfix. Although we don't really care for that
		// case (parseFloat will still work as expected), we must divide the value by 100
		// to get a value between 0 and 1.
		if (Ext.isDefined(field.defaultValue) && Ext.isString(field.defaultValue)) {
			field.defaultValue = this.stringToFloat(field.defaultValue);
		}
		if (!Ext.isDefined(field.minValue)) {
			field.minValue = 0;
		} else if (Ext.isString(field.minValue)) {
			field.minValue = this.stringToFloat(field.minValue);
		}
		if (!Ext.isDefined(field.maxValue)) {
			field.maxValue = 1;
		} else if (Ext.isString(field.maxValue)) {
			field.maxValue = this.stringToFloat(field.maxValue);
		}

		Zarafa.common.plugins.PercentSpinner.superclass.init.call(this, field);
	},

	/**
	 * Convert a String into a Float. If the String contains the '%' character,
	 * the value is converted as percentage (and thus divided by 100), otherwise
	 * it is assumed to be the literal stringified version of the float.
	 * @param {String} value The string to convert to a float
	 * @return {Float} The float value representing the string
	 * @protected
	 */
	stringToFloat : function(value)
	{
		var isPercent;

		if (Ext.isEmpty(value)) {
			return undefined;
		}

		isPercent = value.indexOf('%');

		value = parseFloat(value);
		if (isPercent) {
			value /= 100;
		}

		return value;
	},

	/**
	 * Convert a Float to a String representing the Float as percentage.
	 * @param {Float} value The float value which must be converted
	 * @return {String} The stringified value represented as percentage
	 * @protected
	 */
	floatToString : function(value)
	{
		if (!Ext.isDefined(value)) {
			return undefined;
		}

		return (value * 100) + '%';
	},

	/**
	 * Sets a data value into the field and validates it.
	 * To set the value directly without validation see {@link Ext.form.Field#setRawValue}.
	 * @param {Number/String} value The value to set
	 * @private
	 */
	setValue : function(value)
	{
		if (!Ext.isEmpty(value) && Ext.isString(value)) {
			value = parseFloat(value) / 100;
		}
		Zarafa.common.plugins.PercentSpinner.superclass.setValue.call(this, value);
	}
});

// Register as plugin, so that it can be used using lazy loading
// with the Zarafa.common.ui.SpinnerField
Ext.preg('zarafa.percentspinner', Zarafa.common.plugins.PercentSpinner);
