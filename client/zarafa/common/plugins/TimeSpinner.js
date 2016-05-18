Ext.ns('Zarafa.common.plugins');

/**
 * @class Zarafa.common.plugins.TimeSpinner
 * @extends Zarafa.common.plugins.SpinnerPlugin
 * @ptype zarafa.timespinner
 * Extension to the {@link Zarafa.common.plugins.SpinnerPlugin} object,
 * to correctly parse times. This is used by the
 * {@link Zarafa.common.ui.SpinnerField SpinnerField}
 */
Zarafa.common.plugins.TimeSpinner = Ext.extend(Zarafa.common.plugins.SpinnerPlugin, {
	/**
	 * @cfg {String} format The string format which is applied for
	 * displaying the time in the {@link Zarafa.common.ui.SpinnerField SpinnerField}.
	 */
	format : _('G:i'),
	/**
	 * @cfg {String} alternateIncrementField The Date field which must be incremented
	 * when the alternate increment/decrement option is used (default: Date.HOUR).
	 */
	alternateIncrementField : Date.HOUR,
	/**
	 * @cfg {String} incrementField The Date field which must be incremented when the
	 * normal increment/decrement option is used (default: Date.MINUTE).
	 */
	incrementField: Date.MINUTE,
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		Ext.applyIf(this, config);

		Zarafa.common.plugins.TimeSpinner.superclass.constructor.call(this, config);
	},

	/**
	 * Initializes the {@link Zarafa.common.ui.SpinnerField SpinnerField} to which
	 * this plugin has been hooked.
	 * @param {Zarafa.common.ui.SpinnerField} The parent field to which this component is connected
	 */
	init : function(field)
	{
		Zarafa.common.plugins.TimeSpinner.superclass.init.call(this, field);

		// Enforce all default values to the date format.
		if (Ext.isDefined(field.defaultValue) && !Ext.isDate(field.defaultValue)) {
			field.defaultValue = Date.parseDate(field.defaultValue, this.format);
		}
		if (Ext.isDefined(field.minValue) && !Ext.isDate(field.minValue)) {
			field.minValue = Date.parseDate(field.minValue, this.format);
		}
		if (Ext.isDefined(field.maxValue) && !Ext.isDate(field.maxValue)) {
			field.maxValue = Date.parseDate(field.maxValue, this.format);
		}

		// Initialize our values
		this.dateValue = field.defaultValue;
		if (Ext.isDate(this.dateValue)) {
			field.value = this.dateValue.format(this.format);
		}

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
	 * Sets a data value into the field and validates it.
	 * To set the value directly without validation see {@link Ext.form.Field#setRawValue}.
	 * @param {Date/String} value The value to set
	 * @private
	 */
	setValue : function(value)
	{
		if (!Ext.isDefined(value) || Ext.isEmpty(value)) {
			// If no value is provided, we clear the field.
			this.dateValue = null;
			this.setStringValue('');
		} else if (Ext.isDate(value)) {
			// The value is a date, clone it to obtain a local copy.
			this.dateValue = value.clone();
			this.setStringValue(value.format(this.format));
		} else if (Ext.isDate(this.dateValue)) {
			// The value is a String, but the dateValue is a Date.
			// Use the dateValue to determine the date (Day, Month, Year)
			// part which must be applied to the value (which only contains hours and minutes).
			var tmpDate = Date.parseDate(value, this.format);	
			value = this.dateValue.clone();
			value.setHours(tmpDate.getHours());
			value.setMinutes(tmpDate.getMinutes());
			this.dateValue = value;
			this.setStringValue(value.format(this.format));
		} else {
			// The value is a String, dateValue is useless.
			// We parse the date and assume that the Day, Month, Year
			// should be set for today.
			this.dateValue = Date.parseDate(value, this.format);
			this.setStringValue(value);
		}
	},

	/**
	 * Returns the normalized data value (undefined or emptyText will be returned as '').
	 * To return the raw value see {@link Ext.form.Field#getRawValue}.
	 * @return {Date} The selected Date
	 * @private
	 */
	getValue : function()
	{
		var stringValue = this.getStringValue();
		if (Ext.isEmpty(stringValue) || Ext.isEmpty(this.dateValue)) {
			return null;
		}

		var dateValue = Date.parseDate(stringValue, this.format);

		this.dateValue.setHours(dateValue.getHours());
		this.dateValue.setMinutes(dateValue.getMinutes());

		return this.dateValue.clone();
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
		var oldValue;

		if (this.field.rendered) {
			this.field.onFocus();
		}

		// Always parse the value from the parent field, in case the user typed in an update
		var v = this.field.getValue();

		// Determine the method to change the value
		var incr = (alternate === true) ? this.field.alternateIncrementValue : this.field.incrementValue;
		var incrField = (alternate === true) ? this.alternateIncrementField : this.incrementField;

		oldValue = v;
		if (v) {
			v = v.add(incrField, down ? (-1 * incr) : incr);
		}

		// When spinning up, we could at one point increase the time into the Daylight Saving area.
		// With switch to Daylight savings between 2 and 3 AM, all values within that lost hour, are
		// rounded down by Javascript. Meaning that we can't use the spinbox to step over the given
		// hour. So when the new value is lower then the old value, while we are spinning down, we
		// assume this is the DST switch, and we must add 2 hours to step over the lost hour and
		// make the step as logical as possible.
		if (!down && v && (v <= oldValue)) {
			v = v.add(Date.HOUR, 2);
		}

		v = (!Ext.isDate(v)) ? this.field.defaultValue : v;
		v = this.fixBoundries(v);

		// Format the Date back into a string for displaying.
		this.field.setValue(v);
	},

	/**
	 * Update the value to a correctly formatted float.
	 * Disable this function, since it must be a noop for
	 * Date values.
	 * @param {Mixed} value The value to fix
	 * @private
	 */
	fixPrecision : function(value)
	{
		return value;
	}
});

// Register as plugin, so that it can be used using lazy loading
// with the Zarafa.common.ui.SpinnerField
Ext.preg('zarafa.timespinner', Zarafa.common.plugins.TimeSpinner);
