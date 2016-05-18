Ext.ns('Zarafa.common.plugins');

/**
 * @class Zarafa.common.plugins.NumberSpinner
 * @extends Zarafa.common.plugins.SpinnerPlugin
 * @ptype zarafa.numberspinner
 * Extension to the {@link Zarafa.common.plugins.SpinnerPlugin Spinner} object,
 * to correctly parse numbers This is used by the
 * {@link Zarafa.common.ui.SpinnerField SpinnerField}
 */
Zarafa.common.plugins.NumberSpinner = Ext.extend(Zarafa.common.plugins.SpinnerPlugin, {
	/**
	 * @cfg {Boolean} allowDecimals False to disallow decimal values (defaults to true)
	 */
	allowDecimals : true,
	/**
	 * @cfg {String} decimalSeparator Character(s) to allow as the decimal separator (defaults to '.')
	 */
	decimalSeparator : '.',
	/**
	 * @cfg {Number} decimalPrecision The maximum precision to display after the decimal separator (defaults to 2)
	 */
	decimalPrecision : 2,
	/**
	 * @cfg {Boolean} allowNegative False to prevent entering a negative sign (defaults to true)
	 */
	allowNegative : true,	
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		Ext.applyIf(this, config);

		Zarafa.common.plugins.NumberSpinner.superclass.constructor.call(this, config);
	},

	/**
	 * Initializes the {@link Zarafa.common.ui.SpinnerField SpinnerField} to which
	 * this plugin has been hooked.
	 * @param {Zarafa.common.ui.SpinnerField} The parent field to which this component is connected
	 */
	init : function(field)
	{
		Zarafa.common.plugins.NumberSpinner.superclass.init.call(this, field);

		// Enforce all default values to the int format. If they are not
		// defined obtain them from the Ext.from.NumberField.
		if (Ext.isDefined(field.defaultValue) && Ext.isString(field.defaultValue)) {
			field.defaultValue = parseFloat(field.defaultValue);
		}
		if (!Ext.isDefined(field.minValue)) {
			field.minValue = Ext.form.NumberField.minValue;
		} else if (Ext.isString(field.minValue)) {
			field.minValue = parseFloat(field.minValue);
		}
		if (!Ext.isDefined(field.maxValue)) {
			field.maxValue = Ext.form.NumberField.maxValue;
		} else if (Ext.isString(field.maxValue)) {
			field.maxValue = parseFloat(field.maxValue);
		}

		// Enfore all values which were set on the plugin to be present
		// on the field.
		if (!Ext.isDefined(field.allowDecimals)) {
			field.allowDecimals = this.allowDecimals;
		}
		if (!Ext.isDefined(field.decimalSeparator)) {
			field.decimalSeparator = this.decimalSeparator;
		}
		if (!Ext.isDefined(field.decimalPrecision)) {
			field.decimalPrecision = this.decimalPrecision;
		}
		if (!Ext.isDefined(field.allowNegative)) {
			field.allowNegative = this.allowNegative;
		}

		var allowed = '0123456789';
		if (field.allowDecimals) {
			allowed += field.decimalSeparator;
		}
		if (field.allowNegative) {
			allowed += '-';
		}
		field.maskRe = new RegExp('[' + Ext.escapeRe(allowed) + ']');

		field.value = this.floatToString(field.defaultValue);

		// Update the getValue/setValue functions with our custom
		// functions which handle the Date value type.
		this.setStringValue = field.setValue.createDelegate(field);
		this.getStringValue = field.getValue.createDelegate(field);
		field.setValue = this.setValue.createDelegate(this);
		field.getValue = this.getValue.createDelegate(this);
	},

	/**
	 * Reference to the original {@link Ext.form.Field#setValue} function
	 * for setting the inner value as String.
	 * @param {String} value The value to set
	 * @private
	 */
	setStringValue : Ext.emptyFn,

	/**
	 * Reference to the original {@link Ext.form.Field#getValue} function
	 * for getting the inner value as String.
	 * @return {String} value The value to set
	 * @private
	 */
	getStringValue : Ext.emptyFn,

	/**
	 * Convert a String into a Float. This will convert the value from {@link #getStringValue}
	 * to a Float value.
	 * @param {String} value The string to convert to a float
	 * @return {Float} The float value representing the string
	 * @protected
	 */
	stringToFloat : function(value)
	{
		return parseFloat(value);
	},

	/**
	 * Convert a Float to a String. This will convert the value for {@link #setStringValue}.
	 * @param {Float} value The float value which must be converted
	 * @return {String} The stringified value represented as percentage
	 * @private
	 */
	floatToString : function(value)
	{
		if (!Ext.isDefined(value)) {
			return undefined;
		}

		return value.toString();
	},

	/**
	 * Sets a data value into the field and validates it.
	 * To set the value directly without validation see {@link Ext.form.Field#setRawValue}.
	 * @param {Number/String} value The value to set
	 * @private
	 */
	setValue : function(value)
	{
		this.setStringValue(this.floatToString(this.fixBoundries(value)));
	},

	/**
	 * Returns the normalized data value (undefined or emptyText will be returned as '').
	 * To return the raw value see {@link Ext.form.Field#getRawValue}.
	 * @return {Number} The selected number
	 * @protected
	 */
	getValue : function()
	{
		var stringValue = this.getStringValue();
		if (Ext.isEmpty(stringValue)) {
			return undefined;
		}
		return this.stringToFloat(stringValue);
	},

	/**
	 * The default spin action when the value inside the
	 * {@link Zarafa.common.ui.SpinnerField SpinnerField} must be changed.
	 *
	 * @param {Boolean} down True when the value must be decreased
	 * @param {Boolean} alternate True when the alternate change has been requested
	 * @private
	 */
	spin : function(down, alternate)
	{
		if (this.field.rendered) {
			this.field.onFocus();
		}

		// Always parse the value from the parent field, in case the user typed in an update
		var v = this.field.getValue();

		// Determine the method to change the value
		var incr = (alternate === true) ? this.field.alternateIncrementValue : this.field.incrementValue;

		v += (down ? -1 : 1) * incr;
		v = (isNaN(v)) ? this.defaultValue : v;
		v = this.fixBoundries(v);

		// Format the Data back into a string for displaying.
		this.field.setValue(v);
	}
});

// Register as plugin, so that it can be used using lazy loading
// with the Zarafa.common.ui.SpinnerField
Ext.preg('zarafa.numberspinner', Zarafa.common.plugins.NumberSpinner);
