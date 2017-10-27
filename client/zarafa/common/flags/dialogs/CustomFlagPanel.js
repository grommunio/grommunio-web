Ext.namespace('Zarafa.common.flags.dialogs');

/**
 * @class Zarafa.common.flags.dialogs.CustomFlagPanel
 * @extends Ext.Panel
 * @xtype zarafa.customflagpanel
 *
 * Panel for users to set the custom flag and reminder on a given {@link Zarafa.core.data.IPMRecord record}
 */
Zarafa.common.flags.dialogs.CustomFlagPanel = Ext.extend(Ext.form.FormPanel, {
	/**
	 *
	 */
	reminderTime : null,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};
		config = Ext.applyIf(config, {
			xtype : 'zarafa.customflagpanel',
			cls : 'k-custom-flag-panel',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			border: false,
			labelAlign : 'left',
			items : [
				this.createDatePanel(),
				this.createReminderPanel()
			]
		});
		Zarafa.common.flags.dialogs.CustomFlagPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Create the {@link Ext.Panel Panel} containing the
	 * {@link Zarafa.common.ui.DateTimePeriodField DateTimePeriodField}.
	 * @return {Object} Configuration object for the panel with time selection fields
	 * @private
	 */
	createDatePanel : function()
	{
		return {
			xtype: 'panel',
			cls: 'k-custom-date-panel',
			autoHeight: true,
			items: [{
				xtype: 'zarafa.dateperiodfield',
				ref: '../dateField',
				allowBlank : true,
				defaultPeriod: container.getSettingsModel().get('zarafa/v1/contexts/task/default_task_period'),
				listeners: {
					change: this.onDateRangeFieldChange,
					scope: this
				},
				startFieldConfig: {
					fieldLabel: _('Start date'),
					labelWidth: 84,
					cls: 'from-field',
					width: 121
				},
				endFieldConfig: {
					fieldLabel: _('End date'),
					labelWidth: 84,
					cls: 'to-field',
					width: 121
				}
			}]
		};
	},

	/**
	 * Create the {@link Ext.Panel Panel} containing the form fields
	 * for setting the reminder information.
	 * @return {Object} Configuration object for the panel with reminder fields
	 * @private
	 */
	createReminderPanel : function()
	{
		return {
			xtype: 'panel',
			cls : 'k-custom-reminder-panel',
			autoHeight: true,
			items: [{
				xtype: 'zarafa.compositefield',
				autoHeight: true,
				items: [{
					xtype : 'checkbox',
					name : 'reminder',
					ref:'../../reminderCheckbox',
					width : 100,
					boxLabel : _('Reminder') + ':',
					handler : this.onToggleReminder,
					scope : this
				},{
					xtype :'zarafa.datetimefield',
					name : 'reminder_time',
					width : 220,
					timeIncrement: container.getSettingsModel().get('zarafa/v1/contexts/task/reminder_time_stepping'),
					listeners :{
						change : this.onReminderFieldChange,
						scope : this
					},
					dateFieldConfig : {
						flex : 0
					}
				}]
			}]
		};
	},

	/**
	 * Called automatically when the {@link Zarafa.common.flag.dialogs.CustomFlagPanel CustomFlagPanel}
	 * is being rendered.
	 * @private
	 */
	onRender : function ()
	{
		Zarafa.common.flags.dialogs.CustomFlagPanel.superclass.onRender.apply(this, arguments);
		if (this.records.length === 1) {
			var record = this.records[0];
			this.reminderTime = record.get('reminder_time');
			var startDate = record.get('startdate');
			var dueDate = record.get('duedate');
			this.dateField.getValue().set(startDate,dueDate);
			this.getForm().loadRecord(record);
		}
	},

	/**
	 * Event handler which is fired when the {@link Zarafa.common.ui.DateRangeField} has been changed.
	 * This will update the start and due date inside the {@link #record} accordingly.
	 * @param {Ext.form.Field} field The field which has changed
	 * @param {Mixed} newValue The new value for the field
	 * @param {Mixed} oldValue The original value for the field
	 * @private
	 */
	onDateRangeFieldChange : function(field, newRange, oldRange)
	{
		var startDate = newRange.getStartDate();
		var dueDate = newRange.getDueDate();

		this.records.forEach(function (record) {
			record.beginEdit();

			if(Ext.isDate(startDate)) {
				record.set('startdate', startDate.clone().setToNoon());
			} else {
				record.set('startdate', null);
			}

			if(Ext.isDate(dueDate)) {
				record.set('duedate', dueDate.clone().setToNoon());
			} else {
				record.set('duedate', null);
			}
			record.endEdit();
		}, this);
	},

	/**
	 * Event handler which is triggered when reminder date field
	 * has been changed by the user. It will apply new value to the
	 * {@link Zarafa.core.data.IPMRecord[] records}.
	 * @param {Ext.form.Field} field The {@link Ext.form.Field field} which was changed.
	 * @param {Mixed} newValue The new value
	 * @param {Mixed} oldValue The old value
	 * @private
	 */
	onReminderFieldChange : function(field, newValue, oldValue)
	{
		this.records.forEach(function (record) {
			record.set(field.getName(), newValue);
		},this);
		this.getForm().loadRecord(this.records[0]);
	},

	/**
	 * A function called when the checked value changes for the
	 * reminder checkbox.
	 * @param {Ext.form.Checkbox} checkbox The Checkbox being toggled.
	 * @param {Boolean} checked The new checked state of the checkbox.
	 * @private
	 */
	onToggleReminder : function(checkbox, checked)
	{
		this.records.forEach(function (record) {
			record.beginEdit();
			record.set('reminder', checked);
			if (checked) {
				var reminderTime = this.reminderTime;
				if (!Ext.isDate(reminderTime)) {
					var dueDate = record.get('duedate');
					var time = container.getSettingsModel().get('zarafa/v1/contexts/task/default_reminder_time');

					if (!Ext.isDate(dueDate)) {
						dueDate = new Date().add(Date.DAY, 1);
					}
					reminderTime = dueDate.clearTime(true).add(Date.MINUTE, time);
				}
				record.set('reminder_time',reminderTime );
				record.set('flag_due_by', reminderTime);
			} else {
				record.set('reminder_time', null);
				record.set('flag_due_by', null);
			}
			record.endEdit();
		}, this);

		this.getForm().loadRecord(this.records[0]);
	}
});

Ext.reg('zarafa.customflagpanel', Zarafa.common.flags.dialogs.CustomFlagPanel);
