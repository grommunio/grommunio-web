Ext.ns('Zarafa.common.ui');

/**
 * @class Zarafa.common.ui.TimePeriodField
 * @extends Zarafa.common.ui.DateRangeField
 * @xtype zarafa.timeperiodfield
 *
 * This class can be used to combine two {@link Zarafa.common.ui.SpinnerField SpinnerFields}
 * with the {@link Zarafa.common.plugins.TimeSpinner TimeSpinner} plugins applied to them.
 */
Zarafa.common.ui.TimePeriodField = Ext.extend(Zarafa.common.ui.DateRangeField, {
	/**
	 * @cfg {String} timeFormat The format in which the time appears in the
	 * time {@link Zarafa.common.ui.SpinnerField Spinner}.
	 */
	timeFormat : _('G:i'),
	/**
	 * @cfg {Number} timeIncrement The number of minutes to increase/decrease
	 * when the time {@link Zarafa.common.ui.SpinnerField Spinner} is used.
	 */
	timeIncrement : 30,
	/**
	 * @cfg {Object} pluginCfg Configuration object which should be applied
	 * by default on the {@link Zarafa.common.plugins.TimeSpinner TimeSpinner} plugin.
	 */
	pluginCfg : undefined,
	/**
	 * @constructor
	 * @param {Object} Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		config.startFieldConfig = config.startFieldConfig || {};
		config.startFieldConfig.plugins = Ext.value(config.startFieldConfig.plugins, []);
		config.startFieldConfig.plugins.push(Ext.applyIf(config.pluginCfg || {}, {
			ptype: 'zarafa.timespinner',
			format: config.timeFormat || this.timeFormat
		}));
		config.startFieldConfig.listeners = Ext.value(config.startFieldConfig.listeners, {});
		if (config.startFieldConfig.listeners.spin) {
			config.startFieldConfig.listeners.spin = config.startFieldConfig.listeners.spin.createInterceptor(this.onStartSpin, this);
		} else {
			config.startFieldConfig.listeners.spin = this.onStartSpin.createDelegate(this);
		}

		Ext.applyIf(config.startFieldConfig, {
			xtype: 'zarafa.spinnerfield',
			fieldLabel : _('Start time'),
			width : 190,
			minValue: config.minValue || this.minValue,
			maxValue: config.maxValue || this.maxValue,
			incrementValue: config.timeIncrement || this.timeIncrement,
			alternateIncrementValue: 1
		});

		config.endFieldConfig = config.endFieldConfig || {};
		config.endFieldConfig.plugins = Ext.value(config.endFieldConfig.plugins, []);
		config.endFieldConfig.plugins.push(Ext.applyIf(config.pluginCfg || {}, {
			ptype: 'zarafa.timespinner',
			format: config.timeFormat || this.timeFormat
		}));
		config.endFieldConfig.listeners = Ext.value(config.endFieldConfig.listeners, {});
		if (config.endFieldConfig.listeners.spin) {
			config.endFieldConfig.listeners.spin = config.endFieldConfig.listeners.spin.createInterceptor(this.onEndSpin, this);
		} else {
			config.endFieldConfig.listeners.spin = this.onEndSpin.createDelegate(this);
		}

		config.endFieldConfig = Ext.applyIf(config.endFieldConfig || {}, {
			xtype: 'zarafa.spinnerfield',
			fieldLabel : _('End time'),
			width : 190,
			minValue: config.minValue || this.minValue,
			maxValue: config.maxValue || this.maxValue,
			incrementValue: config.timeIncrement || this.timeIncrement,
			alternateIncrementValue: 1
		});

		Zarafa.common.ui.TimePeriodField.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler fired when the {@link #startField} has spinned. This will call
	 * the {@link #onStartChange} function to fix the duration of the entire field
	 * appropriately.
	 * @param {Zarafa.common.plugins.TimeSpinner} spinner The spinner which fired the event
	 * @private
	 */
	onStartSpin : function(spinner)
	{
		this.onStartChange(spinner.field, spinner.field.getValue(), spinner.field.startValue);
	},

	/**
	 * Event handler fired when the {@link #endField} has spinned. This will call
	 * the {@link #onEndChange} function to fix the duration of the entire field
	 * appropriately.
	 * @param {Zarafa.common.plugins.TimeSpinner} spinner The spinner which fired the event
	 * @private
	 */
	onEndSpin : function(spinner)
	{
		this.onEndChange(spinner.field, spinner.field.getValue(), spinner.field.startValue);
	}
});

Ext.reg('zarafa.timeperiodfield', Zarafa.common.ui.TimePeriodField);
