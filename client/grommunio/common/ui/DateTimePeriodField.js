/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.ns('Grommunio.common.ui');

/**
 * @class Grommunio.common.ui.DateTimePeriodField
 * @extends Grommunio.common.ui.DateRangeField
 * @xtype grommunio.datetimeperiodfield
 *
 * This class can be used to combine two {@link Grommunio.common.ui.DateTimeField DateTimeField}
 * objects together to configure a period.
 */
Grommunio.common.ui.DateTimePeriodField = Ext.extend(Grommunio.common.ui.DateRangeField, {
	/**
	 * @cfg {Boolean} enableTimeSelection Enable the time selection components
	 * to appear, otherwise the period will only exist between dates.
	 */
	enableTimeSelection: true,
	/**
	 * @cfg {String} dateFormat The format in which the date appears in the
	 * {@link Ext.form.DateField DateField}.
	 */
	// # TRANSLATORS: See http://docs.sencha.com/extjs/3.4.0/#!/api/Date for the meaning of these formatting instructions
	dateFormat: _('d/m/Y'),
	/**
	 * @cfg {String} timeFormat The format in which the time appears in the
	 * time {@link Ext.ux.form.Spinner Spinner}.
	 */
	timeFormat: _('G:i'),
	/**
	 * @cfg {Number} timeIncrement The number of minutes to increase/decrease
	 * when the time {@link Ext.ux.form.Spinner Spinner} is used.
	 */
	timeIncrement: 30,
	/**
	 * @constructor
	 * @param {Object} Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};
		config.hideLabels = true;
		Ext.apply(this, config);

		this.timeFormat = config.timeFormat || container.settingsModel.get('grommunio/v1/main/datetime_time_format');

		config.startFieldConfig = Ext.applyIf(config.startFieldConfig || {}, {
			xtype: 'grommunio.datetimefield',
			fieldLabel: _('Start date'),
			enableTimeSelection: this.enableTimeSelection,
			dateFormat: this.dateFormat,
			timeFormat: this.timeFormat,
			timeIncrement: this.timeIncrement
		});

		config.endFieldConfig = Ext.applyIf(config.endFieldConfig || {}, {
			xtype: 'grommunio.datetimefield',
			fieldLabel: _('End date'),
			enableTimeSelection: this.enableTimeSelection,
			dateFormat: this.dateFormat,
			timeFormat: this.timeFormat,
			timeIncrement: this.timeIncrement
		});

		Grommunio.common.ui.DateTimePeriodField.superclass.constructor.call(this, config);
	},

	/**
	 * Toggle the enabled state of the {@link Grommunio.common.ui.SpinnerField SpinnerField}
	 * for setting the time.
	 * @param {Boolean} enabled True to enable the selection of time
	 */
	setEnabledTimeSelection: function(enabled)
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

Ext.reg('grommunio.datetimeperiodfield', Grommunio.common.ui.DateTimePeriodField);
