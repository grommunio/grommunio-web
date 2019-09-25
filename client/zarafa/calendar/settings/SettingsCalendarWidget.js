Ext.namespace('Zarafa.calendar.settings');

/**
 * @class Zarafa.calendar.settings.SettingsCalendarWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.settingscalendarwidget
 *
 * The {@link Zarafa.settings.ui.SettingsWidget widget} for configuring
 * the general calendar options in the {@link Zarafa.calendar.settings.SettingsCalendarCategory calendar category}.
 */
Zarafa.calendar.settings.SettingsCalendarWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		var dayData = [];
		for (var i = 0, len = Date.dayNames.length; i < len; i++) {
			dayData.push({
				name : Date.dayNames[i],
				value : i
			});
		}

		var dayStore = {
			xtype : 'jsonstore',
			fields : [ 'name', 'value' ],
			data : dayData
		};

		var zoomStore = {
			xtype : 'jsonstore',
			fields : [ 'name', 'value' ],
			data : [{
				value : 5,
				name : Ext.util.Format.duration(5)
			},{
				value : 6,
				name : Ext.util.Format.duration(6)
			},{
				value : 10,
				name : Ext.util.Format.duration(10)
			},{
				value : 15,
				name : Ext.util.Format.duration(15)
			},{
				value : 30,
				name : Ext.util.Format.duration(30)
			},{
				value : 60,
				name : Ext.util.Format.duration(60)
			}]
		};

		Ext.applyIf(config, {
			title : _('General calendar settings'),
			layout : 'form',
			items : [{
				xtype : 'combo',
				ref : 'weekStartCombo',
				fieldLabel : _('First day of the week'),
				name : 'zarafa/v1/main/week_start',
				store : dayStore,
				mode: 'local',
				triggerAction: 'all',
				displayField: 'name',
				valueField: 'value',
				lazyInit: false,
				autoSelect : true,
				forceSelection: true,
				editable: false,
				listeners : {
					select : this.onFieldSelect,
					scope : this
				}
			},{
				xtype : 'zarafa.timeperiodfield',
				ref : 'workingHourPeriod',
				defaultValue : new Zarafa.core.DateRange(),
				defaultPeriod : 1,
				defaultPeriodType : Date.HOUR,
				labelWidth : 200,
				startFieldConfig : {
					fieldLabel : _('Start of workday'),
					name : 'zarafa/v1/main/start_working_hour',
					incrementValue : 30,
					alternateIncrementValue : 1,
					minValue : new Date().clearTime(),
					maxValue : new Date().clearTime().add(Date.HOUR, 23)
				},
				endFieldConfig : {
					fieldLabel : _('End of workday'),
					name : 'zarafa/v1/main/end_working_hour',
					incrementValue : 30,
					alternateIncrementValue : 1,
					minValue : new Date().clearTime().add(Date.HOUR, 1),
					maxValue : new Date().clearTime().add(Date.HOUR, 24)
				},
				listeners : {
					change  :this.onWorkTimeChange,
					scope : this
				}
			},{
				xtype : 'combo',
				ref : 'zoomLevelCombo',
				fieldLabel : _('Calendar resolution'),
				name : 'zarafa/v1/contexts/calendar/default_zoom_level',
				store : zoomStore,
				mode: 'local',
				triggerAction: 'all',
				displayField: 'name',
				valueField: 'value',
				lazyInit: false,
				autoSelect : true,
				forceSelection: true,
				editable: false,
				listeners : {
					select : this.onFieldSelect,
					scope : this
				}
			},{
				xtype: 'zarafa.compositefield',
				plugins: [{
					ptype : 'zarafa.splitfieldlabeler',
					firstLabelCfg : {
						style: 'text-align: left; padding: 3px 3px 3px 0px',
						width : 205
					}
				}],
				combineErrors: false,
				fieldLabel: _('Default appointment duration {A} minutes'),
				items : [{
					xtype: 'zarafa.spinnerfield',
					plugins: [ 'zarafa.numberspinner' ],
					ref: '../durationSpinner',
					name: 'zarafa/v1/contexts/calendar/default_appointment_period',
					labelSplitter: '{A}',
					allowBlank: false,
					allowDecimals : false,
					allowNegative : false,
					defaultValue : 30,
					minValue: 1,
					maxValue: 120,
					width: 50,
					validator : function(value) {
						if(value >= 1 && value <= 120) {
							return true;
						}
						return _('Duration must be between 1 and 120 minutes.');
					},
					listeners : {
						change: this.onDurationChange,
						scope: this
					}
				}]
			},{
				xtype : 'checkboxgroup',
				ref : 'workingDays',
				fieldLabel : _('Working days'),
				name : 'zarafa/v1/main/working_days',
				width : 225,
				columns: 4,
				items: [
				{
					boxLabel: _('Mon'),
					name: 'day-col-1',
					inputValue: 1
				},{
					boxLabel: _('Tue'),
					name: 'day-col-2',
					inputValue: 2
				},{
					boxLabel: _('Wed'),
					name: 'day-col-3',
					inputValue: 3
				},{
					boxLabel: _('Thu'),
					name: 'day-col-4',
					inputValue: 4
				},{
					boxLabel: _('Fri'),
					name: 'day-col-5',
					inputValue: 5
				},{
					boxLabel: _('Sat'),
					name: 'day-col-6',
					inputValue: 6
				},{
					boxLabel: _('Sun'),
					name: 'day-col-0',
					inputValue: 0
				}]
			},{
				xtype : 'checkbox',
				ref : 'boldCheck',
				boxLabel : _('Show busy dates as bold in the date picker'),
				hideLabel : true,
				name : 'zarafa/v1/contexts/calendar/datepicker_show_busy',
				listeners : {
					check : this.onBoldCheck,
					scope : this
				}
			}]
		});

		Zarafa.calendar.settings.SettingsCalendarWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link zarafa.settings.ui.SettingsCategory#update}.
	 * This is used to load the latest version of the settings from the
	 * {@link Zarafa.settings.SettingsModel} into the UI of this category.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to load
	 */
	update : function(settingsModel)
	{
		this.model = settingsModel;

		// Convert the start of workday from minutes to an actual time
		var startTime = new Date().clearTime();
		startTime = startTime.add(Date.MINUTE, settingsModel.get(this.workingHourPeriod.startField.name));
		// Convert the end of  workday from minutes to an actual time
		var endTime = new Date().clearTime();
		endTime = endTime.add(Date.MINUTE, settingsModel.get(this.workingHourPeriod.endField.name));
		this.workingHourPeriod.getValue().set(startTime, endTime);

		this.weekStartCombo.setValue(settingsModel.get(this.weekStartCombo.name));
		this.zoomLevelCombo.setValue(settingsModel.get(this.zoomLevelCombo.name));
		this.boldCheck.setValue(settingsModel.get(this.boldCheck.name));

		this.durationSpinner.setValue(settingsModel.get(this.durationSpinner.name));

		// checkboxgroup.setValue() takes an object with name property as key and boolean values to set the checkboxes.
		// The workingDaysList contains a list of days which are enabled by the user.
		// Sunday 0, Monday 1, Tuesday 2, Wednesday 3, Thursday 4, Friday 5, Saturday 6
		var workingDaysList = this.model.get(this.workingDays.name);
		var dayList = {};
		for (var i = 0; i <= 6; i++) {
			if(workingDaysList.indexOf(i) > -1 ) {
				dayList['day-col-' + i] = true;
			} else {
				dayList['day-col-' + i] = false;
			}
		}
		this.workingDays.setValue(dayList);

		// Hack! @FIXME
		// Change event needs to be registered after the values are configured into the corresponding check box.
		// Because change event will be fired for every checkbox providing cumulative values, so we failed to figure out
		// if there is any actual change performed by user.
		this.mon(this.workingDays, 'change', this.onWorkingDaysChange, this, { single: true });
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link zarafa.settings.ui.SettingsCategory#updateSettings}.
	 * This is used to update the settings from the UI into the {@link Zarafa.settings.SettingsModel settings model}.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to update
	 */
	updateSettings : function(settingsModel)
	{
		var duration = this.durationSpinner.getValue();
		if (!this.durationSpinner.isValid()) {
			if(Ext.isEmpty(duration) || duration === 0) {
				duration = settingsModel.get(this.durationSpinner.name, false, true);
			} else {
				duration = this.durationSpinner.maxValue;
			}
		}

		settingsModel.beginEdit();
		this.onWorkTimeChange(this.workingHourPeriod, this.workingHourPeriod.getValue());
		settingsModel.set(this.weekStartCombo.name, this.weekStartCombo.getValue());
		settingsModel.set(this.zoomLevelCombo.name, this.zoomLevelCombo.getValue());
		settingsModel.set(this.boldCheck.name, this.boldCheck.getValue());
		settingsModel.set(this.durationSpinner.name, duration);
		settingsModel.set(this.workingDays.name, Ext.pluck(this.workingDays.getValue(), 'inputValue'));
		settingsModel.endEdit();
	},

	/**
	 * Event handler which is called when a duration was changed
	 * from {@link Zarafa.common.ui.SpinnerField duration} spinner field.
	 *
	 * @param {Zarafa.common.ui.SpinnerField} field The spinner field which holds
	 * default duration for the appointment
	 * @param {Number} newValue The new value for default duration for the appointments
	 */
	onDurationChange : function(field, newValue)
	{
		if (this.model && this.model.get(field.name) !== newValue) {
			this.model.set(field.name, newValue);
		}

	},

	/**
	 * Event handler which is called when a selection has been made in the
	 * {@link Ext.form.ComboBox combobox}.
	 * @param {Ext.form.ComboBox} field The field which fired the event
	 * @param {Ext.data.Record} record The selected record
	 * @private
	 */
	onFieldSelect : function(field, record)
	{
		if (this.model) {
			var set = record.get(field.valueField);

			// FIXME: The settings model should be able to detect if
			// a change was applied
			if (this.model.get(field.name) !== set) {
				this.model.set(field.name, set);
			}
		}
	},

	/**
	 * Event handler which is fired when the {@link Zarafa.common.ui.TimePeriodField}
	 * fires the {@link Zarafa.common.ui.TimePeriodField#change change} event.
	 * @param {Zarafa.common.ui.TimePeriodField} field The field which fired the event
	 * @param {Zarafa.core.DateRange} newValue The new value which is set on the field
	 * @param {Zarafa.core.DateRange} oldValue the old value which was previously set
	 * @private
	 */
	onWorkTimeChange  : function(field, newValue, oldValue)
	{
		if (this.model) {
			// Convert the start of workday from date to number
			var startTime = newValue.getStartDate();
			startTime = (startTime.getHours() * 60) + startTime.getMinutes();
			var endTime = newValue.getDueDate();
			endTime = (endTime.getHours() * 60) + endTime.getMinutes();

			// Compensation in case the user managed to get a end time before the start time.
			if (endTime < startTime) {
				endTime = startTime + (this.workingHourPeriod.defaultPeriod * 60);
			}

			this.model.set(this.workingHourPeriod.startField.name, startTime);
			this.model.set(this.workingHourPeriod.endField.name, endTime);
		}
	},

	/**
	 * event handler which is fired when the "Bold days in datepicker" checkbox has been clicked.
	 * @param {Ext.form.ComboBox} field The field which fired the event
	 * @param {Ext.data.Record} record The selected record
	 * @private
	 */
	onBoldCheck : function(field, check)
	{
		if (this.model) {
			// FIXME: The settings model should be able to detect if
			// a change was applied
			if (this.model.get(field.name) !== check) {
				this.model.set(field.name, check);
			}
		}
	},

	/**
	 * Event handler which is fired when a checkbox in the "working days" checkboxgroup has been clicked
	 * @param {Ext.form.CheckboxGroup} field the field is {@link Ext.form.CheckboxGroup checkbox}
	 * @param {Array} checkedArray the checkedArray containing the checked boxes
	 * @private
	 */
	onWorkingDaysChange : function(field, checkedArray)
	{
		if (this.model) {
			this.model.set(this.workingDays.name, Ext.pluck(this.workingDays.getValue(), 'inputValue'));
		}
	}
});

Ext.reg('zarafa.settingscalendarwidget', Zarafa.calendar.settings.SettingsCalendarWidget);
