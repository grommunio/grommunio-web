Ext.ns('Zarafa.common.ui');

/**
 * @class Zarafa.common.ui.DateTimePeriodField
 * @extends Zarafa.common.ui.DateRangeField
 * @xtype zarafa.datetimeperiodfield
 *
 * This class can be used to combine two {@link Zarafa.common.ui.DateTimeField DateTimeField}
 * objects together to configure a period.
 */
Zarafa.common.ui.DateTimePeriodField = Ext.extend(Zarafa.common.ui.DateRangeField, {
	/**
	 * @cfg {Boolean} enableTimeSelection Enable the time selection components
	 * to appear, otherwise the period will only exist between dates.
	 */
	enableTimeSelection : true,
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
	timeIncrement : 30,
	/**
	 * @constructor
	 * @param {Object} Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};
		config.hideLabels = true;
		Ext.apply(this, config);

		config.startFieldConfig = Ext.applyIf(config.startFieldConfig || {}, {
			xtype: 'zarafa.datetimefield',
			fieldLabel : _('Start date'),
			enableTimeSelection: this.enableTimeSelection,
			dateFormat: this.dateFormat,
			timeFormat: this.timeFormat,
			timeIncrement: this.timeIncrement
		});

		config.endFieldConfig = Ext.applyIf(config.endFieldConfig || {}, {
			xtype: 'zarafa.datetimefield',
			fieldLabel : _('End date'),
			enableTimeSelection: this.enableTimeSelection,
			dateFormat: this.dateFormat,
			timeFormat: this.timeFormat,
			timeIncrement: this.timeIncrement
		});

		Zarafa.common.ui.DateTimePeriodField.superclass.constructor.call(this, config);
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
			this.startField.setEnabledTimeSelection(enabled);
			this.endField.setEnabledTimeSelection(enabled);
		} else {
			this.get(0).setEnabledTimeSelection(enabled);
			this.get(1).setEnabledTimeSelection(enabled);
		}
	}
});

Ext.reg('zarafa.datetimeperiodfield', Zarafa.common.ui.DateTimePeriodField);
