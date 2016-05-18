Ext.ns('Zarafa.common.ui');

/**
 * @class Zarafa.common.ui.DatePeriodField
 * @extends Zarafa.common.ui.DateRangeField
 * @xtype zarafa.dateperiodfield 
 *
 * This class can be used to combine two {@link Ext.form.DateField datefield}
 * objects together to configure a startdate and enddate.
 */
Zarafa.common.ui.DatePeriodField = Ext.extend(Zarafa.common.ui.DateRangeField, {
	/**
	 * @cfg {String} dateFormat The format in which the date appears in the
	 * {@link Ext.form.DateField DateField}.
	 */
	// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
	dateFormat : _('d/m/Y'),
	
	/**
	 * @cfg {Boolean} allowBlank Specifies empty dates are accepted or not by {@link Ext.form.DateField DateField}.
	 */
	allowBlank : false,

	/**
	 * @constructor
	 * @param {Object} Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		config.startFieldConfig = config.startFieldConfig || {};
		config.startFieldConfig.listeners = Zarafa.core.Util.mergeListeners(config.startFieldConfig.listeners, {
			select: this.onStartSelect,
			scope: this
		});

		config.startFieldConfig = Ext.applyIf(config.startFieldConfig, {
			xtype: 'datefield',
			fieldLabel : _('Start date'),
			labelWidth: this.labelWidth,
			emptyText : _('None'),
			format: this.dateFormat,
			allowBlank : config.allowBlank || this.allowBlank
		});

		config.endFieldConfig = config.endFieldConfig || {};
		config.endFieldConfig.listeners = Zarafa.core.Util.mergeListeners(config.endFieldConfig.listeners, {
			select: this.onEndSelect,
			scope: this
		});

		config.endFieldConfig = Ext.applyIf(config.endFieldConfig || {}, {
			xtype: 'datefield',
			fieldLabel : _('End date'),
			labelWidth: this.labelWidth,
			emptyText : _('None'),
			format: this.dateFormat,
			allowBlank : config.allowBlank || this.allowBlank
		});

		if(config.allowBlank && !Ext.isDefined(config.defaultValue)) {
			Ext.applyIf(config, {
				// use a daterange which can accept empty dates
				defaultValue : new Zarafa.core.DateRange({ allowBlank : true }),
				defaultPeriod : 30
			});
		}

		Zarafa.common.ui.DatePeriodField.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler which is raised when the start date has been changed,
	 * this will update the end date to maintain the currently active period settings.
	 * @param {Ext.form.Field} field The field which has changed
	 * @param {Mixed} newValue The new value for the field
	 * @private
	 */
	onStartSelect : function(field, newValue)
	{
		this.onStartChange(field, newValue, field.startValue);
	},

	/**
	 * Event handler which is raised when the end date has been changed,
	 * this will update the start date when the end date is earlier then
	 * the start date.
	 * @param {Ext.form.Field} field The field which has changed
	 * @param {Mixed} newValue The new value for the field
	 * @private
	 */
	onEndSelect : function(field, newValue)
	{
		this.onEndChange(field, newValue, field.startValue);
	},

	/**
	 * Event handler which is raised when the start date has been changed,
	 * this will update the end date to maintain the currently active period settings.
	 * this will also honor the {#allowBlank} config and do calculation according to it.
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

		if(range.getStartDate() != newValue) {
			if(Ext.isEmpty(newValue)) {
				range.setStartDate(null);
			} else {
				var dueTime = range.getDueTime();

				// clear time information as that is not important for dateperiodfield
				// @FIXME we should extend daterange object to only support dates and clear time information
				// whenever its used in DatePeriodField
				newValue = newValue.clearTime(true);

				if(dueTime) {
					// due date is present so do dome validations
					var duration = range.getDuration();
					if(duration !== 0) {
						// we have fixed duration so dates should be changed with respect to duration
						var newDueValue = newValue.add(Date.MILLI, duration);
						range.set(newValue, newDueValue);
					} else {
						if(newValue.getTime() > dueTime) {
							// start date is greater then due date then change due date
							// to be same as start date
							range.set(newValue, newValue.clone());
						} else {
							// start date is less then due date so no validations required
							range.setStartDate(newValue);
						}
					}
				} else {
					// due date is not provided so set it same as start date
					range.set(newValue, newValue.clone());
				}
			}

			this.fireEvent('change', this, range.clone(), oldRange);
		}
	},

	/**
	 * Event handler which is raised when the end date has been changed,
	 * this will update the start date when the end date is earlier then
	 * the start date.
	 * this will also honor the {#allowBlank} config and do calculation according to it.
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

		if(range.getDueDate() != newValue) {
			if(Ext.isEmpty(newValue)) {
				// if due date is removed then we should remove start date also
				range.set(null, null);
			} else {
				var startTime = range.getStartTime();
				var duration = range.getDuration();

				// clear time information as that is not important for dateperiodfield
				// @FIXME we should extend daterange object to only support dates and clear time information
				// whenever its used in DatePeriodField
				newValue = newValue.clearTime(true);

				if(startTime && duration !== 0 && newValue.getTime() < startTime) {
					// start date is present so do dome validations
					// we have fixed duration so dates should be changed with respect to duration
					var newStartValue = newValue.add(Date.MILLI, -duration);
					range.set(newStartValue, newValue);
				} else {
					// start date is not present so simply set due date
					range.setDueDate(newValue);
				}
			}

			this.fireEvent('change', this, range.clone(), oldRange);
		}
	}
});

Ext.reg('zarafa.dateperiodfield', Zarafa.common.ui.DatePeriodField);
