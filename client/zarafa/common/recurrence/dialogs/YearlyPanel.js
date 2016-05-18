Ext.namespace('Zarafa.common.recurrence.dialogs');

/**
 * @class Zarafa.common.recurrence.dialogs.YearlyPanel
 * @extends Zarafa.common.recurrence.dialogs.RecurrenceSubPanel
 * @xtype zarafa.recurrenceyearlypanel
 *
 * The Panel used for configuring a Yearly Recurrence
 */
Zarafa.common.recurrence.dialogs.YearlyPanel = Ext.extend(Zarafa.common.recurrence.dialogs.RecurrenceSubPanel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'zarafa.recurrenceyearlypanel',
			recurrenceType : Zarafa.common.recurrence.data.RecurrenceType.YEARLY,
			recurrenceSubtypes : [
				Zarafa.common.recurrence.data.RecurrenceSubtype.YEARLY_MONTH,
				Zarafa.common.recurrence.data.RecurrenceSubtype.YEARLY_N_WEEKDAY,
				Zarafa.common.recurrence.data.RecurrenceSubtype.YEARLY_REGENERATE
			],
			defaults: {
				border: false,
				bodyStyle: 'background-color: inherit;',
				height: 25
			},
			items: [
				this.createEveryNWeekdayPanel(),
				this.createEveryMonthPanel(),
				this.createRegeneratePanel()
			]
		});

		Zarafa.common.recurrence.dialogs.YearlyPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Creates the configuration object for the "Every N day Panel",
	 * this panel allows Messages to recur every Nth day.
	 *
	 * @return {Object} Configuration object for the panel
	 * @private
	 */
	createEveryNWeekdayPanel : function()
	{
		return {
			xtype: 'panel',
			layout: 'column',
			items: [{
				xtype: 'radio',
				name: 'yearly_pattern',
				patternValue: Zarafa.common.recurrence.data.RecurrenceSubtype.YEARLY_MONTH,
				hideLabel: true,
				width: 25,
				listeners : {
					change: this.onSubtypeChange,
					scope: this
				}
			},{
				xtype: 'zarafa.compositefield',
				plugins: [ 'zarafa.splitfieldlabeler' ],
				fieldLabel: _('Every {A} {B}'),
				labelWidth: 50,
				columnWidth: 1,
				items: [{
					xtype: 'combo',
					ref: '../../monthCombo',
					name: 'recurrence_month',
					labelSplitter: '{A}',
					width: 100,
					store: {
						xtype: 'jsonstore',
						fields: ['name', 'value'],
						data : Zarafa.common.recurrence.data.MonthData
					},
					mode: 'local',
					triggerAction: 'all',
					displayField: 'name',
					valueField: 'value',
					lazyInit: false,
					forceSelection: true,
					editable: false,
					autoSelect: true,
					listeners: {
						change : this.onYearlyMonthChange,
						select : this.onEveryNWeekdayMonthSelect,
						scope: this
					}
				},{
					xtype: 'zarafa.spinnerfield',
					plugins: [ 'zarafa.numberspinner' ],
					ref: '../../monthDaySpinner',
					name: 'recurrence_monthday',
					labelSplitter: '{B}',
					allowNegative: false,
					minValue: 1,
					maxValue: 31,
					width: 50,
					listeners : {
						change: this.onYearlyMonthChange,
						scope: this
					}
				}]
			}]
		};
	},

	/**
	 * Creates the configuration object for the "Every N Day of the Month Panel",
	 * this panel allows Messages to recur every Nth day of the Month.
	 *
	 * @return {Object} Configuration object for the panel
	 * @private
	 */
	createEveryMonthPanel : function()
	{
		return {
			xtype: 'panel',
			layout: 'column',
			items: [{
				xtype: 'radio',
				name: 'yearly_pattern',
				patternValue: Zarafa.common.recurrence.data.RecurrenceSubtype.YEARLY_N_WEEKDAY,
				hideLabel: true,
				width: 25,
				listeners : {
					change: this.onSubtypeChange,
					scope: this
				}
			},{
				xtype: 'zarafa.compositefield',
				plugins: [ 'zarafa.splitfieldlabeler' ],
				fieldLabel: _('The {A} {B} of {C}'),
				labelWidth: 75,
				columnWidth: 1,
				items: [{
					xtype: 'combo',
					ref: '../../dayRankCombo',
					name: 'recurrence_nday',
					labelSplitter: '{A}',
					width: 80,
					store: {
						xtype: 'jsonstore',
						fields: ['name', 'value'],
						data : Zarafa.common.recurrence.data.DayRankData
					},
					mode: 'local',
					triggerAction: 'all',
					displayField: 'name',
					valueField: 'value',
					lazyInit: false,
					forceSelection: true,
					editable: false,
					autoSelect: true,
					listeners : {
						change: this.onYearlyNWeekdayChange,
						scope: this
					}
				},{
					xtype: 'combo',
					ref: '../../weekdayCombo',
					name: 'recurrence_weekdays',
					labelSplitter: '{B}',
					width: 100,
					store: {
						xtype: 'jsonstore',
						fields: ['name', 'value'],
						data : Zarafa.common.recurrence.data.DayData
					},
					mode: 'local',
					triggerAction: 'all',
					displayField: 'name',
					valueField: 'value',
					lazyInit: false,
					forceSelection: true,
					editable: false,
					autoSelect: true,
					listeners : {
						change: this.onYearlyNWeekdayChange,
						scope: this
					}
				},{
					xtype: 'combo',
					ref: '../../monthWeekdayCombo',
					name: 'recurrence_month',
					labelSplitter: '{C}',
					width: 100,
					store: {
						xtype: 'jsonstore',
						fields: ['name', 'value'],
						data : Zarafa.common.recurrence.data.MonthData
					},
					mode: 'local',
					triggerAction: 'all',
					displayField: 'name',
					valueField: 'value',
					lazyInit: false,
					forceSelection: true,
					editable: false,
					autoSelect: true,
					listeners : {
						change: this.onYearlyNWeekdayChange,
						scope: this
					}
				}]
			}]
		};
	},

	/**
	 * Creates the configuration object for the "Regenerate Panel",
	 * this panel allows Tasks to recur N years after the given task
	 * is completed.
	 *
	 * @return {Object} Configuration object for the panel
	 * @private
	 */
	createRegeneratePanel : function()
	{
		return {
			xtype: 'panel',
			layout: 'column',
			ref: 'regeneratePanel',
			items: [{
				xtype: 'radio',
				name: 'yearly_pattern',
				patternValue: Zarafa.common.recurrence.data.RecurrenceSubtype.YEARLY_REGENERATE,
				hideLabel: true,
				width: 25,
				listeners : {
					change: this.onSubtypeChange,
					scope: this
				}
			},{
				xtype: 'zarafa.compositefield',
				plugins: [ 'zarafa.splitfieldlabeler' ],
				fieldLabel: _('Regenerate new task {A} year(s) after each task is completed'),
				labelWidth: 400,
				columnWidth: 1,
				items: [{
					xtype: 'zarafa.spinnerfield',
					plugins: [ 'zarafa.numberspinner' ],
					ref: '../../regenNYearsSpinner',
					name: 'recurrence_everyn',
					labelSplitter: '{A}',
					allowNegative: false,
					minValue: 1,
					width: 50,
					listeners : {
						change: this.onYearlyRegenerateChange,
						scope: this
					}
				}]
			}]
		};
	},

	/**
	 * Event handler which is fired when one of the components belonging to the
	 * {@link Zarafa.common.recurrence.data.RecurrenceSubtype#YEARLY_MONTH} recurrence type has been changed.
	 * This will call {@link #onSubtypePropertyChange}.
	 * @param {Ext.form.Field} field The field which was changed
	 * @param {Mixed} value The new value of the field
	 * @private
	 */
	onYearlyMonthChange : function(field, value)
	{
		this.onSubtypePropertyChange(Zarafa.common.recurrence.data.RecurrenceSubtype.YEARLY_MONTH, field, value);
	},

	/**
	 * Event handler which is fired when one of the components belonging to the
	 * {@link Zarafa.common.recurrence.data.RecurrenceSubtype#YEARLY_N_WEEKDAY} recurrence type has been changed.
	 * This will call {@link #onSubtypePropertyChange}.
	 * @param {Ext.form.Field} field The field which was changed
	 * @param {Mixed} value The new value of the field
	 * @private
	 */
	onYearlyNWeekdayChange : function(field, value)
	{
		this.onSubtypePropertyChange(Zarafa.common.recurrence.data.RecurrenceSubtype.YEARLY_N_WEEKDAY, field, value);
	},

	/**
	 * Event handler which is fired when one of the components belonging to the
	 * {@link Zarafa.common.recurrence.data.RecurrenceSubtype#YEARLY_REGENERATE} recurrence type has been changed.
	 * This will call {@link #onSubtypePropertyChange}.
	 * @param {Ext.form.Field} field The field which was changed
	 * @param {Mixed} value The new value of the field
	 * @private
	 */
	onYearlyRegenerateChange : function(field, value)
	{
		this.onSubtypePropertyChange(Zarafa.common.recurrence.data.RecurrenceSubtype.YEARLY_REGENERATE, field, value);
	},

	/**
	 * Event handler which is triggered when a Month has been selected in the "Every N Weekday in Month Panel".
	 * With the selected month known, we can limit the allowed maximum value for the day spinnerbox which
	 * is connected with the month selection.
	 *
	 * @param {Ext.form.ComboBox} combo The combobox which was selected
	 * @param {Ext.data.Record} record The selected record
	 * @param {Number} index The index of the selected record
	 * @private
	 */
	onEveryNWeekdayMonthSelect : function(combo, record, index)
	{
		var maxDaysInMonth = [31, 29 /* Include leapyear */, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
		var value = maxDaysInMonth[index];

		if (this.monthDaySpinner.getValue() > value) {
			this.monthDaySpinner.setValue(value);
		}
		this.monthDaySpinner.maxValue = value;
	},

	/**
	 * Apply the values for the "Every N day Panel",
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record which is loaded in this panel
	 * @param {Boolean} useDefaultValues True if defaultValues should be used rather then the
	 * data from the Record.
	 * @private
	 */
	updateEveryNWeekdayValues : function(record, useDefaultValues)
	{
		var month;
		var monthday;

		if (useDefaultValues) {
			var today = record.get('startdate') || new Date();

			var monthStore = this.monthCombo.getStore();
			month = monthStore.getAt(today.getMonth()).get('value'); // Month index matches store contents...

			monthday = today.getDate();
		} else {
			month = record.get('recurrence_month');
			monthday = record.get('recurrence_monthday');
		}

		this.monthCombo.setValue(month);
		this.monthDaySpinner.setValue(monthday);
	},

	/**
	 * Apply the values for the "Every N Day of the Month Panel",
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record which is loaded in this panel
	 * @param {Boolean} useDefaultValues True if defaultValues should be used rather then the
	 * data from the Record.
	 * @private
	 */
	updateEveryMonthValues : function(record, useDefaultValues)
	{
		var nday;
		var weekdays;
		var month;

		if (useDefaultValues) {
			var today = record.get('startdate') || new Date();

			nday = Math.ceil(today.getDate() / 7);
			weekdays = Math.pow(2, today.getDay());

			var monthStore = this.monthWeekdayCombo.getStore();
			month = monthStore.getAt(today.getMonth()).get('value'); // Month index matches store contents...
		} else {
			nday = record.get('recurrence_nday');
			weekdays = record.get('recurrence_weekdays');
			month = record.get('recurrence_month');
		}

		this.dayRankCombo.setValue(nday);
		this.weekdayCombo.setValue(weekdays);
		this.monthWeekdayCombo.setValue(month);
	},

	/**
	 * Apply the values for the "Regenerate Panel",
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record which is loaded in this panel
	 * @param {Boolean} useDefaultValues True if defaultValues should be used rather then the
	 * data from the Record.
	 * @private
	 */
	updateRegenerateValues : function(record, useDefaultValues)
	{
		// Convert everyn value from minutes, to days
		this.regenNYearsSpinner.setValue(1);
	},

	/**
	 * Enable/disable/hide/unhide all {@link Ext.Component Components} within the {@link Ext.Panel Panel}
	 * using the given {@link Zarafa.core.data.IPMRecord IPMRecord}.
	 * @param {Zarafa.core.data.IPMRecord} record The record to update the panel with
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 * @private
	 */
	updateUI : function(record, contentReset)
	{
		var layout = false;

		if (contentReset === true || record.isModifiedSinceLastUpdate('message_class')) {
			if (record.isMessageClass('IPM.TaskRequest', true)) {
				this.regeneratePanel.show();
			} else {
				this.regeneratePanel.hide();
			}

			layout = true;
		}

		if (layout) {
			this.doLayout();
		}
	},

	/**
	 * Update the {@link Ext.Component components} which belong to the given
	 * {@link Zarafa.common.recurrence.data.RecurrenceSubtype subtype}.
	 * @param {Zarafa.core.data.MAPIRecord} record The record from where the values must be read
	 * @param {Zarafa.common.recurrence.data.RecurrenceSubtype} subtype The subtype for which the UI
	 * components must be updated
	 * @param {Boolean} useDefault True if default values should be used rather then the data from
	 * the given record.
	 * @protected
	 */
	updateSubtype : function(record, pattern, useDefaultValues)
	{
		var subTypes = Zarafa.common.recurrence.data.RecurrenceSubtype;

		if (this.isSubtype(subTypes.YEARLY_MONTH, pattern)) {
			this.updateEveryNWeekdayValues(record, useDefaultValues);
		} else if (this.isSubtype(subTypes.YEARLY_N_WEEKDAY, pattern)) {
			this.updateEveryMonthValues(record, useDefaultValues);
		} else if (this.isSubtype(subTypes.YEARLY_REGENERATE, pattern)) {
			this.updateRegenerateValues(record, useDefaultValues);
		}
	},

	/**
	 * Called by {@link #updateRecordSubType} to indicate that the record must be updated for the
	 * given {@link Zarafa.common.recurrence.data.RecurrenceSubtype recurrence subtype}. The record
	 * itself is already in {@link Zarafa.core.data.MAPIRecord#editing editing} mode.
	 * @param {Zarafa.core.data.MAPIRecord} record The record which must be updated from the UI
	 * @param {Zarafa.common.recurrence.data.RecurrenceSubtype} pattern The Subtype which is
	 * currently enabled. Only the components for this subtype must be used to update the record.
	 * @protected
	 */
	updateRecordSubType : function(record, pattern)
	{
		var subTypes = Zarafa.common.recurrence.data.RecurrenceSubtype;

		if (this.isSubtype(subTypes.YEARLY_MONTH, pattern)) {
			record.set('recurrence_everyn', 12);
			record.set('recurrence_nday', undefined);
			record.set('recurrence_weekdays', undefined);
			record.set('recurrence_month', this.monthCombo.getValue());
			record.set('recurrence_monthday', this.monthDaySpinner.getValue());
		} else if (this.isSubtype(subTypes.YEARLY_N_WEEKDAY, pattern)) {
			record.set('recurrence_everyn', 12);
			record.set('recurrence_nday', this.dayRankCombo.getValue());
			record.set('recurrence_weekdays', this.weekdayCombo.getValue());
			record.set('recurrence_month', this.monthWeekdayCombo.getValue());
			record.set('recurrence_monthday', undefined);
		} else if (this.isSubtype(subTypes.YEARLY_REGENERATE, pattern)) {
			record.set('recurrence_everyn', this.regenNYearsSpinner.getValue());
			record.set('recurrence_nday', undefined);
			record.set('recurrence_weekdays', undefined);
			record.set('recurrence_month', undefined);
			record.set('recurrence_monthday', 1);
		}
	}
});

Ext.reg('zarafa.recurrenceyearlypanel', Zarafa.common.recurrence.dialogs.YearlyPanel);
