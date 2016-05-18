Ext.ns('Zarafa.common.ui');

/**
 * @class Zarafa.common.ui.DateTimeField
 * @extends Zarafa.common.ui.CompositeField
 * @xtype zarafa.datetimefield
 *
 * This class can be used to construct a {@link Ext.form.Field field}
 * which contains a {@link Ext.form.DateField DateField} and a {@link Ext.ux.form.Spinner Spinner}
 * {@link Ext.form.Field field} for the time.
 */
Zarafa.common.ui.DateTimeField = Ext.extend(Zarafa.common.ui.CompositeField, {
	/**
	 * @cfg {Boolean} enableTimeSelection Enable the time selection components
	 * to appear, otherwise the period will only exist between dates.
	 */
	enableTimeSelection: true,
	/**
	 * @cfg {Date/String} defaultValue The default value which must be applied
	 * to the date
	 */
	defaultValue: undefined,
	/**
	 * @cfg {Date/String} minValue The minimum value which can be used.
	 */
	minValue : undefined,
	/**
	 * @cfg {Date/String} maxValue The maximum value which can be used.
	 */
	maxValue : undefined,
	/**
	 * @cfg {String} dateFormat The format in which the date appears in the
	 * {@link Ext.form.DateField DateField}.
	 */
	// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
	dateFormat : _('d/m/Y'),
	/**
	 * @cfg {String} timeFormat The format in which the time appears in the
	 * time {@link Ext.ux.form.Spinner Spinner}.
	 */
	timeFormat : _('G:i'),
	/**
	 * @cfg {Number} timeIncrement The number of minutes to increase/decrease
	 * when the time {@link Ext.ux.form.Spinner Spinner} is used.
	 */
	timeIncrement : 15,
	/**
	 * @cfg {Object} dateFieldConfig The way by which one can pass the configuration options of {@link Ext.form.DateField}.
	 */
	dateFieldConfig : {},
	/**
	 * @cfg {Object} timeFieldConfig The way by which one can pass the configuration options of {@link #this.TimeField}.
	 */
	timeFieldConfig : {},
	/**
	 * @constructor
	 * @param {Object} Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.apply(this, config);
	
		if (Ext.isDefined(this.defaultValue) && !Ext.isDate(this.defaultValue))
			this.defaultValue = Date.parseDate(this.defaultValue, this.dateFormat + ' ' + this.timeFormat);
		if (Ext.isDefined(this.minValue) && !Ext.isDate(this.minValue))
			this.minValue = Date.parseDate(this.minValue, this.dateFormat + ' ' + this.timeFormat);
		if (Ext.isDefined(this.maxValue) && !Ext.isDate(this.maxValue))
			this.maxValue = Date.parseDate(this.maxValue, this.dateFormat + ' ' + this.timeFormat);

		// Hide the labels, as we will draw them ourself to have more control over them
		config.hideLabels = true;
		
		var items = [];
		
		if ( !config.hideLabel && config.fieldLabel ){
			var labelConfig = config.labelConfig || {};
			labelConfig = Ext.applyIf(labelConfig, {
				xtype : 'label',
				text : config.fieldLabel + (config.labelSeparator || ':')  || ''
			});
			if ( config.labelWidth ){
				labelConfig.width = config.labelWidth;
			} else {
				labelConfig.autoWidth = true;
			}

			items.push(labelConfig);
		}
		
		items = items.concat([
			Ext.apply({
				xtype: 'datefield',
				ref: 'dateField',
				flex: 1,
				format: this.dateFormat,
				value : this.defaultValue,
				minValue: this.minValue,
				maxValue: this.maxValue,
				listeners: {
					change: this.onDateChange,
					select: this.onDateSelect,
					scope: this
				},
				hideLabel : true,
				hideLabels : true
			}, this.dateFieldConfig ),
			Ext.apply({
				xtype: 'zarafa.spinnerfield',
				ref: 'timeField',
				width: 85,
				defaultValue : this.defaultValue,
				minValue: this.minValue,
				maxValue: this.maxValue,
				incrementValue: this.timeIncrement,
				alternateIncrementValue: 1,
				plugins: [{
					ptype: 'zarafa.timespinner',
					format: this.timeFormat
				}],
				listeners: {
					change: this.onTimeChange,
					spin: this.onTimeSpin,
					scope: this
				}
			}, this.timeFieldConfig )
		]);

		config = Ext.applyIf(config, {
			isSingleValued : true,
			hideLabels : true,
			items: items
		});

		Ext.apply(this, config);

		Zarafa.common.ui.DateTimeField.superclass.constructor.call(this, config);
	},

	/**
	 * Called by {@link #onDateChange} or {@link #onDateSelect} when the {@link #dateField}
	 * has a new value. This will construct a new value for the {@link #timeField} and
	 * fire the {@link #change} event.
	 * @param {Date} newValue The new Date inside the DateField
	 * @param {Date} oldValue The old Date from the DateField
	 * @private
	 */
	doDateChange : function(newValue, oldValue)
	{
		var oldDate;
		var newDate;

		if (this.enableTimeSelection) {
			var curTime = this.timeField.getValue();
			oldDate = this.combineDateAndTime(oldValue, curTime);
			newDate = this.combineDateAndTime(newValue, curTime);
		} else {
			oldDate = oldValue;
			newDate = newValue;
		}

		// Restrict value to minimum and maximum value. Both the Time and
		// Date fields already enforce their individual restriction, but
		// it is still possible to create a value outside of the range
		// when the individual values are combined.
		if(Ext.isDefined(newDate)) {
			if (newDate > this.maxValue) {
				newDate = this.maxValue;
			} else if (newDate < this.minValue) {
				newDate = this.minValue;
			}

			// Enforce the new date to the timeField, this way the
			// timeField holds the full date value for this entire
			// component.
			this.timeField.setValue(newDate);

			this.fireEvent('change', this, newDate, oldDate);
		}
	},

	/**
	 * Called by {@link #onTimeChange} or {@link #onTimeSpin} when the {@link #timeField}
	 * has a new value. This will update the {@link #dateField} and fire the {@link #change}
	 * event.
	 * @param {Date} newValue The new Date inside the SpinnerField
	 * @param {Date} oldValue The old Date from the SpinnerField
	 * @private
	 */
	doTimeChange : function(newValue, oldValue) {
		// While spinning the date could have changed,
		// update the dateField with the new date.
		this.dateField.setValue(newValue);

		this.fireEvent('change', this, newValue, oldValue);
	},

	/**
	 * Event handler which is raised when the date has been changed (by typing),
	 * this will call {@link #doDateChange} for updating the new Field value
	 * and firing the {@link #change} event.
	 * @param {Ext.form.DateField} field The field which has fired the event
	 * @param {Date} newValue The new Date inside the DateField
	 * @param {Date} oldValue The old Date from the DateField
	 * @private
	 */
	onDateChange : function(field, newValue, oldValue)
	{
		this.doDateChange(newValue, oldValue);
	},

	/**
	 * Event handler which is raised when the date has been selected
	 * this will call {@link #doDateChange} for updating the new Field value
	 * and firing the {@link #change} event.
	 * @param {Ext.form.DateField} field The field which has fired the event
	 * @param {Date} date The new value for the field
	 * @pivate
	 */
	onDateSelect : function(field, date)
	{
		var oldValue = field.startValue;
		var newValue = date;

		this.doDateChange(newValue, oldValue);
	},

	/**
	 * Event handler which is raised when the timefield has been changed (by typing),
	 * this will call {@link #doTimeChange} for updating the new Field value
	 * and firing the {@link #change} event.
	 * @param {Zarafa.common.ui.SpinnerField} field The field which fired the event
	 * @param {Date} newValue The new Date inside the SpinnerField
	 * @param {Date} oldValue The old Date from the SpinnerField
	 * @private
	 */
	onTimeChange : function(field, newValue, oldValue)
	{
		this.doTimeChange(newValue, oldValue);
	},

	/**
	 * Event handler which is raised when the timeSpinner has been spinned
	 * this will call {@link #doTimeChange} for updating the new Field value
	 * and firing the {@link #change} event.
	 * @param {Zarafa.common.plugins.TimeSpinner} spinner The spinner plugin
	 * @private
	 */
	onTimeSpin : function(spinner)
	{
		var oldValue = spinner.field.startValue;
		var newValue = spinner.field.getValue();

		this.doTimeChange(newValue, oldValue);
	},

	/**
	 * Sets a data value into the field and validates it. To set the value directly
	 * without validation see {@link #setRawValue}.
	 * @param {Date} The value to set
	 */
	setValue : function(value)
	{
		this.dateField.setValue(value);
		if (this.enableTimeSelection)
			this.timeField.setValue(value);
	},

	/**
	 * Sets the underlying DOM field's value directly, bypassing validation.
	 * To set the value with validation see {@link #setValue}.
	 */
	setRawValue : function(value)
	{
		this.dateField.setRawValue(value);
		if (this.enableTimeSelection)
			this.timeField.setRawValue(value);
	},

	/**
	 * Returns the normalized data value (undefined or emptyText will be returned as '').
	 * To return the raw value see {@link #getRawValue}.
	 * @return {Date} The date object
	 */
	getValue : function()
	{
		if (this.enableTimeSelection)
			return this.timeField.getValue();
		else
			return this.dateField.getValue();
	},

	/**
	 * Returns the raw data value which may or may not be a valid, defined value.
	 * To return a normalized value see {@link #getValue}.
	 * @return {Date} The date object
	 */
	getRawValue : function()
	{
		if (this.enableTimeSelection)
			return this.timeField.getRawValue();
		else
			return this.dateField.getRawValue();
	},

	/**
	 * Combine the date value together with a time value
	 * and return the corresponding {@link Date date} object.
	 * @param {Date/String} dateObject The date object, either a string (containing
	 * a date formatted using {@link #dateFormat} or a {@link Date date} object.
	 * @param {Date/String} timeObject The object containing the time
	 * @return {Date} The date object
	 */
	combineDateAndTime : function(dateObject, timeObject)
	{
		// A bit silly, but dateField returns the Date object,
		// but to add the time information we must convert it
		// to a string, append the time, and convert it into
		// a Date object again.
		if (Ext.isDate(dateObject))
			dateObject = dateObject.format(this.dateFormat);
		if (Ext.isDate(timeObject))
			timeObject = timeObject.format(this.timeFormat);

		if(Ext.isDefined(dateObject) && Ext.isDefined(timeObject)) {
			return Date.parseDate(dateObject + ' ' + timeObject, this.dateFormat + ' ' + this.timeFormat);
		} else {
			return undefined;
		}
	},

	/**
	 * Toggle the enabled state of the {@link Zarafa.common.ui.SpinnerField SpinnerField}
	 * for setting the time.
	 * @param {Boolean} enabled True to enable the selection of time
	 */
	setEnabledTimeSelection : function(enabled)
	{
		this.enableTimeSelection = enabled;
		if (this.rendered) {
			this.timeField.setVisible(enabled);
			this.doLayout();
		}
	}
});

Ext.reg('zarafa.datetimefield', Zarafa.common.ui.DateTimeField);
