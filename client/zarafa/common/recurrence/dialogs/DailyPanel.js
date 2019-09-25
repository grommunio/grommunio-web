Ext.namespace('Zarafa.common.recurrence.dialogs');

/**
 * @class Zarafa.common.recurrence.dialogs.DailyPanel
 * @extends Zarafa.common.recurrence.dialogs.RecurrenceSubPanel
 * @xtype zarafa.recurrencedailypanel
 *
 * The Panel used for configuring a Daily Recurrence
 */
Zarafa.common.recurrence.dialogs.DailyPanel = Ext.extend(Zarafa.common.recurrence.dialogs.RecurrenceSubPanel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'zarafa.recurrencedailypanel',
			recurrenceType : Zarafa.common.recurrence.data.RecurrenceType.DAILY,
			recurrenceSubtypes : [
				Zarafa.common.recurrence.data.RecurrenceSubtype.DAILY_EVERY_N_DAYS,
				Zarafa.common.recurrence.data.RecurrenceSubtype.DAILY_WEEKDAYS,
				Zarafa.common.recurrence.data.RecurrenceSubtype.DAILY_REGENERATE
			],
			defaults: {
				border: false,
				bodyStyle: 'background-color: inherit;',
				height: 25
			},
			items: [
				this.createEveryNDaysPanel(),
				this.createEveryWeekdayPanel(),
				this.createRegeneratePanel()
			]
		});

		Zarafa.common.recurrence.dialogs.DailyPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Creates the configuration object for the "Every N Days Panel",
	 * this panel allows Messages to recur every N number of days.
	 *
	 * @return {Object} Configuration object for the panel
	 * @private
	 */
	createEveryNDaysPanel : function()
	{
		return {
			xtype: 'panel',
			layout: 'column',
			items: [{
				xtype: 'radio',
				name: 'daily_pattern',
				patternValue: Zarafa.common.recurrence.data.RecurrenceSubtype.DAILY_EVERY_N_DAYS,
				hideLabel: true,
				width: 25,
				listeners: {
					check: this.onSubtypeChange,
					scope: this
				}
			},{
				xtype: 'zarafa.compositefield',
				plugins: [ 'zarafa.splitfieldlabeler' ],
				fieldLabel: _('Every {A} day(s)'),
				labelWidth: 100,
				columnWidth: 1,
				items: [{
					xtype: 'zarafa.spinnerfield',
					plugins: [ 'zarafa.numberspinner' ],
					ref: '../../everyNDaysSpinner',
					name: 'recurrence_everyn',
					labelSplitter: '{A}',
					allowNegative: false,
					minValue: 1,
					width: 50,
					listeners: {
						change: this.onEveryNDaysChange,
						scope: this
					}
				}]
			}]
		};
	},

	/**
	 * Creates the configuration object for the "Every Weekday Panel",
	 * this panel allows Messages to recur every weekday.
	 *
	 * @return {Object} Configuration object for the panel
	 * @private
	 */
	createEveryWeekdayPanel : function()
	{
		return {
			xtype: 'panel',
			layout: 'column',
			items: [{
				xtype: 'radio',
				name: 'daily_pattern',
				patternValue: Zarafa.common.recurrence.data.RecurrenceSubtype.DAILY_WEEKDAYS,
				hideLabel: true,
				width: 25,
				listeners: {
					check: this.onSubtypeChange,
					scope: this
				}
			},{
				xtype: 'displayfield',
				value: _('Every weekday'),
				hideLabel : true
			}]
		};
	},

	/**
	 * Creates the configuration object for the "Regenerate Panel",
	 * this panel allows Tasks to recur N days after the given task
	 * is completed.
	 *
	 *return @return {Object} Configuration object for the panel
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
				name: 'daily_pattern',
				patternValue: Zarafa.common.recurrence.data.RecurrenceSubtype.DAILY_REGENERATE,
				hideLabel: true,
				width: 25,
				listeners: {
					check: this.onSubtypeChange,
					scope: this
				}
			},{
				xtype: 'zarafa.compositefield',
				plugins: [ 'zarafa.splitfieldlabeler' ],
				fieldLabel: _('Regenerate new task {A} day(s) after each task is completed'),
				labelWidth: 400,
				columnWidth: 1,
				items: [{
					xtype: 'zarafa.spinnerfield',
					plugins: [ 'zarafa.numberspinner' ],
					ref: '../../regenNDaysSpinner',
					name: 'recurrence_everyn',
					labelSplitter: '{A}',
					allowNegative: false,
					minValue: 1,
					width: 50,
					listeners : {
						change: this.onDailyRegenerateChange,
						scope: this
					}
				}]
			}]
		};
	},

	/**
	 * Event handler which is fired when one of the components belonging to the
	 * {@link Zarafa.common.recurrence.data.RecurrenceSubtype#DAILY_EVERY_N_DAYS} recurrence type has been changed.
	 * This will call {@link #onSubtypePropertyChange}.
	 * @param {Ext.form.Field} field The field which was changed
	 * @param {Mixed} value The new value of the field
	 * @private
	 */
	onEveryNDaysChange : function(field, value)
	{
		this.onSubtypePropertyChange(Zarafa.common.recurrence.data.RecurrenceSubtype.DAILY_EVERY_N_DAYS, field, value * (24 * 60));
	},

	/**
	 * Event handler which is fired when one of the components belonging to the
	 * {@link Zarafa.common.recurrence.data.RecurrenceSubtype#DAILY_REGENERATE} recurrence type has been changed.
	 * This will call {@link #onSubtypePropertyChange}.
	 * @param {Ext.form.Field} field The field which was changed
	 * @param {Mixed} value The new value of the field
	 * @private
	 */
	onDailyRegenerateChange : function(field, value)
	{
		this.onSubtypePropertyChange(Zarafa.common.recurrence.data.RecurrenceSubtype.DAILY_REGENERATE, field, value * (24 * 60));
	},

	/**
	 * Apply the values for the "Every N Days Panel",
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record which is loaded in this panel
	 * @param {Boolean} useDefaultValues True if defaultValues should be used rather then the
	 * data from the Record.
	 * @private
	 */
	updateEveryNDaysValues : function(record, useDefaultValues)
	{
		// Convert everyn value from minutes, to days
		var everyn = useDefaultValues ? 1 : Math.floor(record.get('recurrence_everyn') / (24 * 60));
		this.everyNDaysSpinner.setValue(everyn);
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
		var everyn = useDefaultValues ? 1 : Math.floor(record.get('recurrence_everyn') / (24 * 60));
		this.regenNDaysSpinner.setValue(everyn);
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

		if (this.isSubtype(subTypes.DAILY_EVERY_N_DAYS, pattern)) {
			this.updateEveryNDaysValues(record, useDefaultValues);
		} else if (this.isSubtype(subTypes.DAILY_REGENERATE, pattern)) {
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

		if (this.isSubtype(subTypes.DAILY_EVERY_N_DAYS, pattern)) {
			record.set('recurrence_everyn', this.everyNDaysSpinner.getValue() * (24 * 60));
		} else if (this.isSubtype(subTypes.DAILY_WEEKDAYS, pattern)) {
			record.set('recurrence_everyn', 1);
		} else if (this.isSubtype(subTypes.DAILY_REGENERATE, pattern)) {
			record.set('recurrence_everyn', this.regenNDaysSpinner.getValue() * (24 * 60));
		}

		// Unset all unsused properties for this recurrence type.
		record.set('recurrence_weekdays', undefined);
		record.set('recurrence_month', undefined);
		record.set('recurrence_monthday', undefined);
		record.set('recurrence_nday', undefined);
	}
});

Ext.reg('zarafa.recurrencedailypanel', Zarafa.common.recurrence.dialogs.DailyPanel);
