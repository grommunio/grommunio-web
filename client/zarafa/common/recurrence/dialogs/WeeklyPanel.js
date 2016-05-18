Ext.namespace('Zarafa.common.recurrence.dialogs');

/**
 * @class Zarafa.common.recurrence.dialogs.WeeklyPanel
 * @extends Zarafa.common.recurrence.dialogs.RecurrenceSubPanel
 * @xtype zarafa.recurrenceweeklypanel
 *
 * The Panel used for configuring a Weekly Recurrence
 */
Zarafa.common.recurrence.dialogs.WeeklyPanel = Ext.extend(Zarafa.common.recurrence.dialogs.RecurrenceSubPanel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'zarafa.recurrenceweeklypanel',
			recurrenceType : Zarafa.common.recurrence.data.RecurrenceType.WEEKLY,
			recurrenceSubtypes : [
				Zarafa.common.recurrence.data.RecurrenceSubtype.WEEKLY_REGENERATE,
				Zarafa.common.recurrence.data.RecurrenceSubtype.WEEKLY
			],
			defaults: {
				border: false,
				bodyStyle: 'background-color: inherit;',
				height: 25
			},
			items: [
				this.createEveryNWeeksPanel(),
				this.createDaySelectionPanel(),
				this.createRegeneratePanel()
			]
		});

		Zarafa.common.recurrence.dialogs.WeeklyPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Creates the configuration object for the "Every N Weeks Panel",
	 * this panel allows Messages to recur the configured days every N weeks.
	 *
	 * @return {Object} Configuration object for the panel
	 * @private
	 */
	createEveryNWeeksPanel : function()
	{
		return {
			xtype: 'panel',
			layout: 'column',
			items: [{
				xtype: 'radio',
				name: 'weekly_pattern',
				patternValue: Zarafa.common.recurrence.data.RecurrenceSubtype.WEEKLY,
				hideLabel: true,
				width: 25,
				listeners: {
					check: this.onSubtypeChange,
					scope: this
				}
			},{
				xtype: 'zarafa.compositefield',
				plugins: [ 'zarafa.splitfieldlabeler' ],
				fieldLabel: _('Every {A} week(s) on') + ':',
				labelWidth: 140,
				columnWidth: 1,
				items: [{
					xtype: 'zarafa.spinnerfield',
					plugins: [ 'zarafa.numberspinner' ],
					ref: '../../everyNWeeksSpinner',
					name: 'recurrence_everyn',
					labelSplitter: '{A}',
					allowNegative: false,
					minValue: 1,
					width: 50,
					listeners : {
						change : this.onWeeklyChange,
						scope: this
					}
				}]
			}]
		};
	},

	/**
	 * Creates the configuration object for the "Day Selection Panel",
	 * this panel allows Messages to recur on specific weekdays (used
	 * in conjunction with the "Every N Weeks Panel"
	 *
	 * @return {Object} Configuration object for the panel
	 * @private
	 */
	createDaySelectionPanel : function()
	{
		var weekStart = container.getSettingsModel().get('zarafa/v1/main/week_start');

		return {
			xtype: 'checkboxgroup',
			ref: 'weeklyDaySelect',
			name: 'recurrence_weekdays',
			columns: 3,
			style: 'padding-left: 25px',
			anchor: '100% 100%',
			height: 'auto',
			// The array of checkboxes depends on the first day of the
			// week. If this is sunday, the first checkbox must be sunday,
			// while when the first day of the week is monday, the first
			// checkbox must be monday. The way we are going to do this,
			// is my simply start counting from the weekStart index,
			// and limit the value to the <0, 6>. Each value belonging to
			// the checkbox is also depending on the day, but this can be
			// calculated the same way, but taking the power of two of the
			// used dayNames index.
			items: [{
				xtype: 'checkbox',
				boxLabel: Date.dayNames[(weekStart + 0) % 7],
				dayValue : Math.pow(2, (weekStart + 0) % 7),
				width: 250,
				listeners : {
					change: this.onWeeklyDayChange,
					scope: this
				}
			},{
				xtype: 'checkbox',
				boxLabel: Date.dayNames[(weekStart + 1) % 7],
				dayValue : Math.pow(2, (weekStart + 1) % 7),
				width: 250,
				listeners : {
					change: this.onWeeklyDayChange,
					scope: this
				}
			},{
				xtype: 'checkbox',
				boxLabel: Date.dayNames[(weekStart + 2) % 7],
				dayValue : Math.pow(2, (weekStart + 2) % 7),
				width: 250,
				listeners : {
					change: this.onWeeklyDayChange,
					scope: this
				}
			},{
				xtype: 'checkbox',
				boxLabel: Date.dayNames[(weekStart + 3) % 7],
				dayValue : Math.pow(2, (weekStart + 3) % 7),
				width: 250,
				listeners : {
					change: this.onWeeklyDayChange,
					scope: this
				}
			},{
				xtype: 'checkbox',
				boxLabel: Date.dayNames[(weekStart + 4) % 7],
				dayValue : Math.pow(2, (weekStart + 4) % 7),
				width: 250,
				listeners : {
					change: this.onWeeklyDayChange,
					scope: this
				}
			},{
				xtype: 'checkbox',
				boxLabel: Date.dayNames[(weekStart + 5) % 7],
				dayValue : Math.pow(2, (weekStart + 5) % 7),
				width: 250,
				listeners : {
					change: this.onWeeklyDayChange,
					scope: this
				}
			},{
				xtype: 'checkbox',
				boxLabel: Date.dayNames[(weekStart + 6) % 7],
				dayValue : Math.pow(2, (weekStart + 6) % 7),
				width: 250,
				listeners : {
					change: this.onWeeklyDayChange,
					scope: this
				}
			}]
		};
	},

	/**
	 * Creates the configuration object for the "Regenerate Panel",
	 * this panel allows Tasks to recur N weeks after the given task
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
				name: 'weekly_pattern',
				patternValue: Zarafa.common.recurrence.data.RecurrenceSubtype.WEEKLY_REGENERATE,
				hideLabel: true,
				width: 25,
				listeners: {
					check: this.onSubtypeChange,
					scope: this
				}
			},{ 
				xtype: 'zarafa.compositefield',
				plugins: [ 'zarafa.splitfieldlabeler' ],
				fieldLabel: _('Regenerate new task {A} week(s) after each task is completed'),
				labelWidth: 400,
				columnWidth: 1,
				items: [{
					xtype: 'zarafa.spinnerfield',
					plugins: [ 'zarafa.numberspinner' ],
					ref: '../../regenNWeeksSpinner',
					name: 'recurrence_everyn',
					labelSplitter: '{A}',
					allowNegative: false,
					minValue: 1,
					width: 50,
					listeners : {
						change: this.onWeeklyRegenerateChange,
						scope: this
					}
				}]  
			}]
		};
	},

	/**
	 * Event handler which is fired when one of the components belonging to the
	 * {@link Zarafa.common.recurrence.data.RecurrenceSubtype#WEEKLY} recurrence type has been changed.
	 * This will call {@link #onSubtypePropertyChange}.
	 * @param {Ext.form.Field} field The field which was changed
	 * @param {Mixed} value The new value of the field
	 * @private
	 */
	onWeeklyChange : function(field, value)
	{
		this.onSubtypePropertyChange(Zarafa.common.recurrence.data.RecurrenceSubtype.WEEKLY, field, value);
	},

	/**
	 * Event handler which is fired when one of the components belonging to the
	 * {@link Zarafa.common.recurrence.data.RecurrenceSubtype#WEEKLY} recurrence type has been changed.
	 * This will call {@link #onSubtypePropertyChange}.
	 * @param {Ext.form.Field} field The field which was changed
	 * @param {Mixed} value The new value of the field
	 * @private
	 */
	onWeeklyDayChange : function(field, value)
	{
		var oldValue = this.record.get(field.name);

		if (value) {
			oldValue |= field.dayValue;
		} else {
			oldValue &= ~field.dayValue;
		}

		this.onSubtypePropertyChange(Zarafa.common.recurrence.data.RecurrenceSubtype.WEEKLY, field, oldValue);
	},

	/**
	 * Event handler which is fired when one of the components belonging to the
	 * {@link Zarafa.common.recurrence.data.RecurrenceSubtype#WEEKLY_REGENERATE} recurrence type has been changed.
	 * This will call {@link #onSubtypePropertyChange}.
	 * @param {Ext.form.Field} field The field which was changed
	 * @param {Mixed} value The new value of the field
	 * @private
	 */
	onWeeklyRegenerateChange : function(field, value)
	{
		this.onSubtypePropertyChange(Zarafa.common.recurrence.data.RecurrenceSubtype.WEEKLY_REGENERATE, field, value * (7 * 24 * 60));
	},

	/**
	 * Apply the values for the "Every N Weeks Panel",
	 *
     * @param {Zarafa.core.data.IPMRecord} record The record which is loaded in this panel
	 * @param {Boolean} useDefaultValues True if defaultValues should be used rather then the
	 * data from the Record.
	 * @private
	 */
	updateEveryNWeeksValues : function(record, useDefaultValues)
	{
		var everyn = useDefaultValues ? 1 : record.get('recurrence_everyn');
		this.everyNWeeksSpinner.setValue(everyn);
	},

	/**
	 * Apply the values for the "Day Selection Panel",
	 *
     * @param {Zarafa.core.data.IPMRecord} record The record which is loaded in this panel
	 * @param {Boolean} useDefaultValues True if defaultValues should be used rather then the
	 * data from the Record.
	 * @private
	 */
	updateDaySelectionValues : function(record, useDefaultValues)
	{
		// Detect the start of the occurence
		var startdate = record.get('startdate') || new Date();
		var weekdays = useDefaultValues ? Math.pow(2, startdate.getDay()) : record.get('recurrence_weekdays');
		this.weeklyDaySelect.items.each(function(radio) {
			radio.setValue(!!(radio.dayValue & weekdays));
		});
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
		// Convert everyn value from minutes, to weeks
		var everyn = useDefaultValues ? 1 : Math.floor(record.get('recurrence_everyn') / (7 * 24 * 60));
		this.regenNWeeksSpinner.setValue(everyn);
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

		if (layout)
			this.doLayout();
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

		if (this.isSubtype(subTypes.WEEKLY, pattern)) {
			this.updateEveryNWeeksValues(record, useDefaultValues);
			this.updateDaySelectionValues(record, useDefaultValues);
		} else if (this.isSubtype(subTypes.WEEKLY_REGENERATE, pattern)) {
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

		if (this.isSubtype(subTypes.WEEKLY, pattern)) {
			record.set('recurrence_everyn', this.everyNWeeksSpinner.getValue());

			var weekdays = 0;
			Ext.each(this.weeklyDaySelect.getValue(), function(radio) {
				weekdays |= radio.dayValue;
			});
			record.set('recurrence_weekdays', weekdays);
		} else if (this.isSubtype(subTypes.WEEKLY_REGENERATE, pattern)) {
			record.set('recurrence_everyn', this.regenNWeeksSpinner.getValue() * (7 * 24 * 60));
		}

		// Unset all unsused properties for this recurrence type.
		record.set('recurrence_month', undefined);
		record.set('recurrence_monthday', undefined);
		record.set('recurrence_nday', undefined);
	}
});

Ext.reg('zarafa.recurrenceweeklypanel', Zarafa.common.recurrence.dialogs.WeeklyPanel);
