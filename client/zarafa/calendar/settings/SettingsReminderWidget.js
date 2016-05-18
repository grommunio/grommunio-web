Ext.namespace('Zarafa.calendar.settings');

/**
 * @class Zarafa.calendar.settings.SettingsReminderWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.settingsreminderwidget
 *
 * The {@link Zarafa.settings.ui.SettingsWidget widget} for configuring
 * the reminder options for new {@link Zarafa.calendar.AppointmentRecord appointments}.
 */
Zarafa.calendar.settings.SettingsReminderWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title : _('Reminder settings'),
			layout : 'form',
			items : [{
				xtype : 'checkbox',
				ref : 'reminderCheck',
				boxLabel : _('Enable reminder for new appointments'),
				hideLabel : true,
				name : 'zarafa/v1/contexts/calendar/default_reminder',
				listeners : {
					check : this.onReminderCheck,
					scope : this
				}
			},{
				xtype : 'combo',
				ref : 'timeCombo',
				fieldLabel : _('Default reminder time'),
				name : 'zarafa/v1/contexts/calendar/default_reminder_time',
				store : {
					xtype: 'jsonstore',
					fields: ['name', 'value'],
					data : Zarafa.calendar.data.ReminderPeriods		
				},
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
				xtype : 'combo',
				ref : 'alldayTimeCombo',
				fieldLabel : _('Default all-day appointment reminder time'),
				name : 'zarafa/v1/contexts/calendar/default_allday_reminder_time',
				store : {
					xtype: 'jsonstore',
					fields: ['name', 'value'],
					data : Zarafa.calendar.data.ReminderPeriods		
				},
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
			}]
		});

		Zarafa.calendar.settings.SettingsReminderWidget.superclass.constructor.call(this, config);
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

		var enabled = settingsModel.get(this.reminderCheck.name);
		this.reminderCheck.setValue(enabled);
		this.timeCombo.setValue(settingsModel.get(this.timeCombo.name));
		this.alldayTimeCombo.setValue(settingsModel.get(this.alldayTimeCombo.name));

		this.timeCombo.setDisabled(!enabled);
		this.alldayTimeCombo.setDisabled(!enabled);
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link zarafa.settings.ui.SettingsCategory#updateSettings}.
	 * This is used to update the settings from the UI into the {@link Zarafa.settings.SettingsModel settings model}.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to update
	 */
	updateSettings : function(settingsModel)
	{
		settingsModel.beginEdit();
		settingsModel.set(this.reminderCheck.name, this.reminderCheck.getValue());
		settingsModel.set(this.timeCombo.name, this.timeCombo.getValue());
		settingsModel.set(this.alldayTimeCombo.name, this.alldayTimeCombo.getValue());
		settingsModel.endEdit();
	},

	/**
	 * Event handler which is fired when the "Enable reminder" checkbox has been clicked.
	 * @param {Ext.form.Checkbox} field The field which fired the event
	 * @param {Boolean} check True if the checkbox is currently checked
	 * @private
	 */
	onReminderCheck : function(field, check)
	{
		if (this.model) {
			// FIXME: The settings model should be able to detect if
			// a change was applied
			if (this.model.get(field.name) !== check) {
				this.model.set(field.name, check);
			}
		}

		this.timeCombo.setDisabled(!check);
		this.alldayTimeCombo.setDisabled(!check);
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
	}
});

Ext.reg('zarafa.settingsreminderwidget', Zarafa.calendar.settings.SettingsReminderWidget);
