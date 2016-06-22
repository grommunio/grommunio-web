Ext.namespace('Zarafa.common.recurrence.dialogs');

/**
 * @class Zarafa.common.recurrence.dialogs.MonthlyPanel
 * @extends Zarafa.common.recurrence.dialogs.RecurrenceSubPanel
 * @xtype zarafa.recurrencemonthlypanel
 *
 * The Panel used for configuring a Monthly Recurrence
 */
Zarafa.common.recurrence.dialogs.MonthlyPanel = Ext.extend(Zarafa.common.recurrence.dialogs.RecurrenceSubPanel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'zarafa.recurrencemonthlypanel',
			recurrenceType : Zarafa.common.recurrence.data.RecurrenceType.MONTHLY,
			recurrenceSubtypes : [
				Zarafa.common.recurrence.data.RecurrenceSubtype.MONTHLY_N_DAY_OF_MONTH,
				Zarafa.common.recurrence.data.RecurrenceSubtype.MONTHLY_N_WEEKDAY_OF_MONTH,
				Zarafa.common.recurrence.data.RecurrenceSubtype.MONTHLY_REGENERATE
			],
			defaults: {
				border: false,
				bodyStyle: 'background-color: inherit;',
				height: 25
			},
			items: [
				this.createEveryNDayOfMonthPanel(),
				this.createEveryNWeekDayOfMonthPanel(),
				this.createRegeneratePanel()
			]
		});

		Zarafa.common.recurrence.dialogs.MonthlyPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Creates the configuration object for the "Every N Day of Month Panel",
	 * this panel allows Messages to recur every Nth day of the Month.
	 *
	 * @return {Object} Configuration object for the panel
	 * @private
	 */
	createEveryNDayOfMonthPanel : function()
	{
		return {
			xtype: 'panel',
			layout: 'column',
			items: [{
				xtype: 'radio',
				name: 'monthly_pattern',
				patternValue: Zarafa.common.recurrence.data.RecurrenceSubtype.MONTHLY_N_DAY_OF_MONTH,
				hideLabel: true,
				width: 25,
				listeners: {
					check: this.onSubtypeChange,
					scope: this
				}
			},{
				xtype: 'zarafa.compositefield',
				plugins: [ 'zarafa.splitfieldlabeler' ],
				fieldLabel: _('Day {A} of every {B} month(s)'),
				labelWidth: 250,
				columnWidth: 1,
				items : [{
					xtype: 'zarafa.spinnerfield',
					plugins: [ 'zarafa.numberspinner' ],
					ref: '../../nthDaySpinner',
					name: 'recurrence_monthday',
					labelSplitter: '{A}',
					allowNegative: false,
					minValue: 1,
					maxValue: 31,
					width: 50,
					listeners : {
						change: this.onMonthlyNDayOfMonthChange,
						scope: this
					}
				},{
					xtype: 'zarafa.spinnerfield',
					plugins: [ 'zarafa.numberspinner' ],
					ref: '../../everyNMonthsSpinner',
					name: 'recurrence_everyn',
					labelSplitter: '{B}',
					allowNegative: false,
					minValue: 1,
					width: 50,
					listeners : {
						change: this.onMonthlyNDayOfMonthChange,
						scope: this
					}
				}]
			}]
		};
	},

	/**
	 * Creates the configuration object for the "Every N Weekday of Month Panel",
	 * this panel allows Messages to recur every Nth weekday of the Month.
	 *
	 * @return {Object} Configuration object for the panel
	 * @private
	 */
	createEveryNWeekDayOfMonthPanel : function()
	{
		return {
			xtype: 'panel',
			layout: 'column',
			items: [{
				xtype: 'radio',
				name: 'monthly_pattern',
				patternValue: Zarafa.common.recurrence.data.RecurrenceSubtype.MONTHLY_N_WEEKDAY_OF_MONTH,
				hideLabel: true,
				width: 25,
				listeners: {
					check: this.onSubtypeChange,
					scope: this
				}
			},{
				xtype: 'zarafa.compositefield',
				plugins: [ 'zarafa.splitfieldlabeler' ],
				fieldLabel: _('The {A} {B} of every {C} month(s)'),
				labelWidth: 200,
				columnWidth: 1,
				items: [{
					xtype: 'combo',
					ref: '../../weekdayRankCombo',
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
						change: this.onMonthlyNWeekdayOfMonthChange,
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
						change: this.onMonthlyNWeekdayOfMonthChange,
						scope: this
					}
				},{
					xtype: 'zarafa.spinnerfield',
					plugins: [ 'zarafa.numberspinner' ],
					ref: '../../weekdayEveryNMonthsSpinner',
					name: 'recurrence_everyn',
					labelSplitter: '{C}',
					allowNegative: false,
					minValue: 1,
					width: 50,
					listeners : {
						change: this.onMonthlyNWeekdayOfMonthChange,
						scope: this
					}
				}]
			}]
		};
	},

	/**
	 * Creates the configuration object for the "Regenerate Panel",
	 * this panel allows Tasks to recur N months after the given task
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
				name: 'monthly_pattern',
				patternValue: Zarafa.common.recurrence.data.RecurrenceSubtype.MONTHLY_REGENERATE,
				hideLabel: true,
				width: 25,
				listeners: {
					check: this.onSubtypeChange,
					scope: this
				}
			},{
				xtype: 'zarafa.compositefield',
				plugins: [ 'zarafa.splitfieldlabeler' ],
				fieldLabel: _('Regenerate new task {A} month(s) after each task is completed'),
				labelWidth: 400,
				columnWidth: 1,
				items: [{
					xtype: 'zarafa.spinnerfield',
					plugins: [ 'zarafa.numberspinner' ],
					ref: '../../regenNMonthsSpinner',
					name: 'recurrence_everyn',
					labelSplitter: '{A}',
					allowNegative: false,
					minValue: 1,
					width: 50,
					listeners : {
						change: this.onMonthlyRegenerateChange,
						scope: this
					}
				}]
			}]
		};
	},

	/**
	 * Event handler which is fired when one of the components belonging to the
	 * {@link Zarafa.common.recurrence.data.RecurrenceSubtype#MONTHLY_N_DAY_OF_MONTH} recurrence type has been changed.
	 * This will call {@link #onSubtypePropertyChange}.
	 * @param {Ext.form.Field} field The field which was changed
	 * @param {Mixed} value The new value of the field
	 * @private
	 */
	onMonthlyNDayOfMonthChange : function(field, value)
	{
		this.onSubtypePropertyChange(Zarafa.common.recurrence.data.RecurrenceSubtype.MONTHLY_N_DAY_OF_MONTH, field, value);
	},

	/**
	 * Event handler which is fired when one of the components belonging to the
	 * {@link Zarafa.common.recurrence.data.RecurrenceSubtype#MONTHLY_N_WEEKDAY_OF_MONTH} recurrence type has been changed.
	 * This will call {@link #onSubtypePropertyChange}.
	 * @param {Ext.form.Field} field The field which was changed
	 * @param {Mixed} value The new value of the field
	 * @private
	 */
	onMonthlyNWeekdayOfMonthChange : function(field, value)
	{
		this.onSubtypePropertyChange(Zarafa.common.recurrence.data.RecurrenceSubtype.MONTHLY_N_WEEKDAY_OF_MONTH, field, value);
	},

	/**
	 * Event handler which is fired when one of the components belonging to the
	 * {@link Zarafa.common.recurrence.data.RecurrenceSubtype#MONTHLY_REGENERATE} recurrence type has been changed.
	 * This will call {@link #onSubtypePropertyChange}.
	 * @param {Ext.form.Field} field The field which was changed
	 * @param {Mixed} value The new value of the field
	 * @private
	 */
	onMonthlyRegenerateChange : function(field, value)
	{
		this.onSubtypePropertyChange(Zarafa.common.recurrence.data.RecurrenceSubtype.MONTHLY_REGENERATE, field, value);
	},

	/**
	 * Apply the values for the "Every N Day of Month Panel",
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record which is loaded in this panel
	 * @param {Boolean} useDefaultValues True if defaultValues should be used rather then the
	 * data from the Record.
	 * @private
	 */
	updateEveryNDayOfMonthValues : function(record, useDefaultValues)
	{
		var startdate = record.get('startdate') || new Date();
		var monthday = useDefaultValues ? startdate.getDate() : record.get('recurrence_monthday');
		var everyn = useDefaultValues ? 1 : record.get('recurrence_everyn');

		this.nthDaySpinner.setValue(monthday);
		this.everyNMonthsSpinner.setValue(everyn);
	},

	/**
	 * Apply the values for the "Every N Weekday of Month Panel",
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record which is loaded in this panel
	 * @param {Boolean} useDefaultValues True if defaultValues should be used rather then the
	 * data from the Record.
	 * @private
	 */
	updateEveryNWeekDayOfMonthValues : function(record, useDefaultValues)
	{
		var dayRank;
		var weekday;
		var everyn;

		if (useDefaultValues) {
			var today = record.get('startdate') || new Date();

			dayRank = Math.ceil(today.getDate() / 7);
			weekday = Math.pow(2, today.getDay());
			everyn = 1;
		} else {
			dayRank = record.get('recurrence_nday');
			weekday = record.get('recurrence_weekdays');
			everyn = record.get('recurrence_everyn');
		}

		this.weekdayRankCombo.setValue(dayRank);
		this.weekdayCombo.setValue(weekday);
		this.weekdayEveryNMonthsSpinner.setValue(everyn);
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
		// Convert everyn value from minutes, to months
		var everyn = useDefaultValues ? 1 : record.get('recurrence_everyn');
		this.regenNMonthsSpinner.setValue(everyn);
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

		if (this.isSubtype(subTypes.MONTHLY_N_DAY_OF_MONTH, pattern)) {
			this.updateEveryNDayOfMonthValues(record, useDefaultValues);
		} else if (this.isSubtype(subTypes.MONTHLY_N_WEEKDAY_OF_MONTH, pattern)) {
			this.updateEveryNWeekDayOfMonthValues(record, useDefaultValues);
		} else if (this.isSubtype(subTypes.MONTHLY_REGENERATE, pattern)) {
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

		if (this.isSubtype(subTypes.MONTHLY_N_DAY_OF_MONTH, pattern)) {
			record.set('recurrence_monthday', this.nthDaySpinner.getValue());
			record.set('recurrence_nday', undefined);
			record.set('recurrence_weekdays', undefined);
			record.set('recurrence_everyn', this.everyNMonthsSpinner.getValue());
		} else if (this.isSubtype(subTypes.MONTHLY_N_WEEKDAY_OF_MONTH, pattern)) {
			record.set('recurrence_monthday', undefined);
			record.set('recurrence_nday', this.weekdayRankCombo.getValue());
			record.set('recurrence_weekdays', this.weekdayCombo.getValue());
			record.set('recurrence_everyn', this.weekdayEveryNMonthsSpinner.getValue());
		} else if (this.isSubtype(subTypes.MONTHLY_REGENERATE, pattern)) {
			record.set('recurrence_monthday', 1);
			record.set('recurrence_nday', undefined);
			record.set('recurrence_weekdays', undefined);
			record.set('recurrence_everyn', this.regenNMonthsSpinner.getValue());
		}

		// Unset all unsused properties for this recurrence type.
		record.set('recurrence_month', undefined);
	}
});

Ext.reg('zarafa.recurrencemonthlypanel', Zarafa.common.recurrence.dialogs.MonthlyPanel);
