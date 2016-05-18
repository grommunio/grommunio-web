Ext.ns('Zarafa.common.ui');

/**
 * @class Zarafa.common.ui.DateRangeField
 * @extends Ext.Container
 * @xtype zarafa.daterangefield
 *
 * This class can be used to combine two {@link Ext.form.Field fields}
 * objects together to configure a {@link Zarafa.core.DateRange DateRange}.
 * The first {@link Ext.form.Field field} will never be allowed to be set
 * to a later {@link Date Date} then the second {@link Ext.form.Field field}
 * or vice versa. By default there will be a default range between the start
 * and end {@link Ext.Date Date} which is applied when either one of the two
 * {@link Ext.form.Field fields} become invalid.
 */
Zarafa.common.ui.DateRangeField = Ext.extend(Ext.Container, {
	/**
	 * @cfg {Object} startFieldConfig The configuration which must be
	 * applied to the start {@link Ext.form.Field field}.
	 * This {@link Ext.form.Field field} must accept a
	 * {@link Ext.Date Date} object in the {@link Ext.form.Field.setValue setValue}
	 * function and return {@link Ext.Date Date} in the {@link Ext.form.Field.getValue getValue}
	 * function.
	 */
	startFieldConfig : {},
	/**
	 * @cfg {Object} endFieldConfig The configuration which must be
	 * applied to the end date {@link Ext.form.Field field}.
	 * This {@link Ext.form.Field field} must accept a
	 * {@link Ext.Date Date} object in the {@link Ext.form.Field.setValue setValue}
	 * function and return {@link Ext.Date Date} in the {@link Ext.form.Field.getValue getValue}
	 * function.
	 */
	endFieldConfig : {},
	/**
	 * @cfg {Object} spacerConfig If this spacerConfig is provided, a {@link Ext.Spacer}
	 * will be created between the startField and endField. The spacerConfig object will
	 * be applied to the spacer object.
	 */
	spacerConfig : undefined,
	/**
	 * @cfg {Zarafa.core.DateRange} defaultValue The default {@link Zarafa.core.DateRange daterange}
	 * object which must be set on this field.
	 */
	defaultValue : undefined,
	/**
	 * @cfg {Number} defaultPeriod The default value which must be assumed for
	 * the {@link Zarafa.core.DateRange daterange}. This value can be in minutes, hours, days, etc...
	 * depending on the {@link #defaultPeriodType} field.
	 */
	defaultPeriod: undefined,
	/**
	 * @cfg {String} defaultPeriodType The value type of the {@link #defaultPeriod}.
	 * This can be Date.MINUTE, Date.HOUR, etc...
	 */
	defaultPeriodType: Date.MINUTE,

	/**
	 * @cfg {Boolean} allowEqualValue True to indicate that the start and due values
	 * are allowed to be equal. This will prevent the startdate to be adjusted when the duedate is being
	 * changed by the user
	 */
	allowEqualValue : false,

	/**
	 * @constructor
	 * @param {Object} Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			xtype: 'zarafa.daterangefield',
			border: false,
			bodyStyle: 'background-color: inherit;',
			layout: 'form'
		});

		this.addEvents(
			/**
			 * @event change
			 * Fires when the start or enddate has been changed
			 * @param {Zarafa.common.ui.DateRangeField} field The field which has been changed
			 * @param {Zarafa.core.DateRange} newValue The new DateRange
			 * @param {Zarafa.core.DateRange} oldValue the old DateRange
			 */
			'change'
		);

		if (!Ext.isDefined(config.defaultValue)) {
			// If no defaultValue is given, construct it using the current date
			// when the defaultPeriod was provided.
			if (Ext.isDefined(config.defaultPeriod)) {
				var start = new Date();
				var end = start.clone().add(config.defaultPeriodType, config.defaultPeriod);

				config.defaultValue = new Zarafa.core.DateRange({ startDate : start, dueDate : end });
			}
		} else if (!Ext.isDefined(config.defaultPeriod)) {
			// A default value was provided, but no defaultPeriod,
			// calculate the new period based on the default value.
			// _however_ this means we reset defaultPeriodType to minutes
			// to simplify our calculation for the period.
			config.defaultPeriodType = Date.MINUTE;
			config.defaultPeriod = config.defaultValue.getDuration(Date.MINUTE);
		}

		Zarafa.common.ui.DateRangeField.superclass.constructor.call(this, config);

		this.addFieldItems();
		this.bindDateRange(this.defaultValue);
	},

	/**
	 * Add the two {@link Ext.form.Field fields} which are used
	 * to display the start and end {@link Ext.Date Date} to this container.
	 * @private
	 */
	addFieldItems : function()
	{
		if (Ext.isDefined(this.startFieldConfig)) {
			if (this.layout !== 'form') {
				this.startFieldConfig.plugins = Ext.value(this.startFieldConfig.plugins, []).concat('zarafa.fieldlabeler');
			}

			this.startFieldConfig.listeners = Zarafa.core.Util.mergeListeners(this.startFieldConfig.listeners, {
				change : this.onStartChange,
				scope: this
			});

			this.add(Ext.applyIf(this.startFieldConfig, {
				ref: 'startField',
				flex: 0.5,
				// custom made components uses defaultValue config to set its value when field is rendered
				// but extjs default components uses value config instead so added value in both configs
				defaultValue: this.defaultValue ? this.defaultValue.getStartDate() : undefined,
				value: this.defaultValue ? this.defaultValue.getStartDate() : undefined
			}));
		}

		if (Ext.isDefined(this.spacerConfig)) {
			this.add(Ext.applyIf(this.spacerConfig, {
				xtype: 'spacer',
				height: 5,
				width: 5
			}));
		}

		if (Ext.isDefined(this.endFieldConfig)) {
			if (this.layout !== 'form') {
				this.endFieldConfig.plugins = Ext.value(this.endFieldConfig.plugins, []).concat('zarafa.fieldlabeler');
			}

			this.endFieldConfig.listeners = Zarafa.core.Util.mergeListeners(this.endFieldConfig.listeners, {
				change : this.onEndChange,
				scope: this
			});

			this.add(Ext.applyIf(this.endFieldConfig, {
				ref: 'endField',
				flex: 0.5,
				// custom made components uses defaultValue config to set its value when field is rendered
				// but extjs default components uses value config instead so added value in both configs
				defaultValue: this.defaultValue ? this.defaultValue.getDueDate() : undefined,
				value: this.defaultValue ? this.defaultValue.getDueDate() : undefined
			}));
		}
	},

	/**
	 * Set the {@link Zarafa.core.DateRange DateRange} object, this will replace
	 * the currently set object and attaches event listeners to it.
	 * @param {Zarafa.core.DateRange} daterange The new DateRange object
	 * @private
	 */
	bindDateRange : function(daterange)
	{
		if (this.defaultValue) {
			this.mun(this.defaulValue, 'update', this.onDateRangeUpdate, this);
		}

		var oldDateRange = this.defaultValue;
		this.defaultValue = daterange;

		if (this.defaultValue) {
			this.mon(this.defaultValue, 'update', this.onDateRangeUpdate, this);
		}

		this.onDateRangeUpdate(daterange, oldDateRange);
	},

	/**
	 * Event handler which is raised when the start date has been changed,
	 * this will update the end date to maintain the currently active period settings.
	 *
	 * @param {Ext.form.Field} field The field which has changed
	 * @param {Mixed} newValue The new value for the field
	 * @param {Mixed} oldValue The old value for the field
	 * @private
	 */
	onStartChange : function(field, newValue, oldValue)
	{
		var range = this.defaultValue;
		var oldRange = this.defaultValue.clone();

		if (range.getStartDate() != newValue) {
			var duration = range.getDuration();
			var oldDueValue = range.getDueDate().clone();
			var newDueValue = newValue.add(Date.MILLI, duration);

			// When working around the Daylight Saving time, it is
			// possible that adding an hour to a date, will be canceled
			// if the new date falls in the hour which has disappeared.
			// If that happens, we need to add an extra hour to move the
			// due date to exceed the DST time.
			if (newDueValue < newValue) {
				newDueValue = newDueValue.add(Date.HOUR, 2);
			}

			if (this.endField.maxValue && newDueValue > this.endField.maxValue) {
				newDueValue = this.endField.maxValue;
			}

			range.set(newValue.clone(), newDueValue.clone());
			if (newDueValue != oldDueValue) {
				this.endField.setValue(newDueValue);
			}

			this.fireEvent('change', this, range.clone(), oldRange);
		}
	},

	/**
	 * Event handler which is raised when the end date has been changed,
	 * this will update the start date when the end date is earlier then
	 * the start date.
	 *
	 * @param {Ext.form.Field} field The field which has changed
	 * @param {Mixed} newValue The new value for the field
	 * @param {Mixed} oldValue The old value for the field
	 * @private
	 */
	onEndChange : function(field, newValue, oldValue)
	{
		var range = this.defaultValue;
		var oldRange = this.defaultValue.clone();

		if (range.getDueDate() != newValue) {
			var newTime = newValue.getTime();
			var oldTime = range.getStartTime();

			if (newTime < oldTime || (this.allowEqualValue === false && newTime === oldTime)) {
				var oldStartValue = range.getStartDate().clone();
				var newStartValue = newValue.add(this.defaultPeriodType, -this.defaultPeriod);

				if (this.startField.minValue && newStartValue < this.startField.minValue) {
					newStartValue = this.startField.minValue;
				}

				range.set(newStartValue.clone(), newValue.clone());

				if (newStartValue != oldStartValue) {
					this.startField.setValue(newStartValue);
				}
			} else {
				range.setDueDate(newValue.clone());
			}

			this.fireEvent('change', this, range.clone(), oldRange);
		}
	},

	/**
	 * Sets a data value into the field and validates it. To set the value directly
	 * without validation see {@link #setStartValue}.
	 * @param {Zarafa.core.DateRange} The value to set
	 */
	setValue : function(value)
	{
		this.bindDateRange(value);
	},

	/**
	 * Sets the underlying DOM field's value directly, bypassing validation.
	 * To set the value with validation see {@link #setValue}.
	 * @param {Zarafa.core.DateRange} The value to set
	 */
	setRawValue : function(value)
	{
		this.bindDateRange(value);
	},

	/*
	 * Returns the normalized data value (undefined or emptyText will be returned as '').
	 * To return the raw value see {@link #getRawValue}.
	 * @return {Date} The date object
	 */
	getValue : function()
	{
		return this.defaultValue;
	},

	/**
	 * Returns the raw data value which may or may not be a valid, defined value.
	 * To return a normalized value see {@link #getValue}.
	 * @return {Date} The date object
	 */
	getRawValue : function()
	{
		return this.defaultValue;
	},

	/**
	 * Enable this component and fire the 'enable' event.
	 */
	enable : function()
	{
		Zarafa.common.ui.DateRangeField.superclass.enable.call(this);
		this.startField.enable();
		this.endField.enable();
	},

	/**
	 * Disable this component and fire the 'disable' event.
	 */
	disable : function()
	{
		Zarafa.common.ui.DateRangeField.superclass.disable.call(this);
		this.startField.disable();
		this.endField.disable();
	},

	/**
	 * Event handler which is triggered when the {@link Zarafa.core.DateRange daterange}
	 * has been changed. This will write the new value into the {@link Zarafa.core.ui.DateTimeField DateTimeField}
	 * @param {Zarafa.core.DateRange} daterange The daterange which has been update
	 * @param {Zarafa.core.DateRange} olddaterange The copy of the daterange object containing the old values
	 */
	onDateRangeUpdate : function(daterange, olddaterange)
	{
		if (daterange) {
			if (this.rendered) {
				this.startField.setValue(daterange.getStartDate());
				this.endField.setValue(daterange.getDueDate());
			} else {
				this.items.get(0).defaultValue = daterange.getStartDate();
				this.items.get(1).defaultValue = daterange.getDueDate();

				this.items.get(0).value = daterange.getStartDate();
				this.items.get(1).value = daterange.getDueDate();
			}
		}
	}
});

Ext.reg('zarafa.daterangefield', Zarafa.common.ui.DateRangeField);
