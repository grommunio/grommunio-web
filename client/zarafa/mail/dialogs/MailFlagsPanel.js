Ext.namespace('Zarafa.mail.dialogs');

/**
 * @class Zarafa.mail.dialogs.MailFlagsPanel
 * @extends Ext.Panel
 * @xtype zarafa.mailflagspanel
 *
 * Panel for users to set the flag on a given {@link Zarafa.mail.MailRecord record}
 */
Zarafa.mail.dialogs.MailFlagsPanel = Ext.extend(Ext.Panel, {
	/**
	 * @cfg {Boolean} disableFlagColor if true then flag color combo will be disabled,
	 * it is used by new mail dialog.
	 */
	disableFlagColor : false,

	/**
	 * @cfg {Boolean} disableCompleted if true then completed checkbox will be disabled,
	 * it is used by new mail dialog.
	 */
	disableCompleted : false,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		if(!Ext.isBoolean(config.disableFlagColor)) {
			config.disableFlagColor = this.disableFlagColor;
		}

		if(!Ext.isBoolean(config.disableCompleted)) {
			config.disableCompleted = this.disableCompleted;
		}

		config = Ext.applyIf(config, {
			// Override from Ext.Component
			xtype: 'zarafa.mailflagspanel',
			layout: 'form',
			border: false,
			items: [
				this.createFlagColorPanel(config.disableFlagColor),
				this.createFlagExpirationPanel(),
				this.createFlagCompletePanel(config.disableCompleted)
			]
		});

		Zarafa.mail.dialogs.MailFlagsPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Create a {@link Ext.Panel panel} which contains
	 * the {@link Ext.form.ComboBox combobox} where the
	 * user can select the desired color for the flag.
	 * @param {Boolean} disabled flag to render flag color combo disabled.
	 * @return {Object} The configuration object for the panel
	 * @private
	 */
	createFlagColorPanel : function(disabled)
	{
		var colorStore = {
			xtype: 'jsonstore',
			fields: ['name', /*'iconCls', 'flagStatus',*/ 'flagColor'],
			data : [].concat(Zarafa.mail.data.MailFlags.state[1], Zarafa.mail.data.MailFlags.colors)
		};

		return {
			xtype: 'combo',
			ref: 'flagColorCombo',
			fieldLabel : _('Color of Flag'),
			anchor : '100%',
			store: colorStore,
			mode: 'local',
			triggerAction: 'all',
			displayField: 'name',
			valueField: 'flagColor',
			lazyInit: false,
			forceSelection: true,
			editable: false,
			disabled : disabled,
			listeners :{
				'select' : this.onColorSelect,
				scope : this
			}
		};
	},

	/**
	 * Create a {@link Ext.Panel panel} which contains
	 * the {@link Ext.form.DateField datefield} and {
	 * {@link Ext.form.TimeField timefield} where the
	 * user can set the expiry date for the flag.
	 * @return {Object} The configuration object for the panel
	 * @private
	 */
	createFlagExpirationPanel : function()
	{
		return {
			xtype: 'zarafa.datetimefield',
			anchor : '100%',
			ref: 'datetimeField',
			fieldLabel : _('End date'),
			listeners :{
				'change' : this.onDateChange,
				scope : this
			}
		};
	},

	/**
	 * Create a {@link Ext.Panel panel} which contains
	 * the {@link Ext.form.CheckBox checkbox} where the
	 * user can complete the flag.
	 * @param {Boolean} disabled flag to render flag color combo disabled.
	 * @return {Object} The configuration object for the panel
	 * @private
	 */
	createFlagCompletePanel : function(disabled)
	{
		return {
			xtype: 'checkbox',
			ref: 'completeCheckbox',
			fieldLabel: _('Complete'),
			handler : this.onToggleComplete,
			scope : this,
			disabled : disabled
		};
	},

	/**
	 * Update the {@link Zarafa.mail.dialogs.MailFlagsPanel panel} with
	 * the given {@link Zarafa.core.data.IPMRecord record}.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record to update the panel with
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
		this.record = record;
		// FIXME: WHat if the record is undefined, shouldn't we clear all fields?
		if (this.record) {
			var completed = (this.record.get('flag_status') == Zarafa.core.mapi.FlagStatus.completed);

			// Select the correct flag icon in the combobox
			var flagIcon = this.record.get('flag_icon');
			if (Ext.isEmpty(flagIcon)) {
				flagIcon = Zarafa.core.mapi.FlagIcon.clear;
			}

			this.flagColorCombo.setValue(flagIcon);

			// The time property which must be used, depends if the
			// flag has been completed or not.
			var timeProp = 'flag_due_by';
			if (completed) {
				timeProp = 'flag_complete_time';
			}

			// If no timestamp was provided, use the timestamp of now.
			var time = this.record.get(timeProp);
			if (!Ext.isDate(time)) {
				time = new Date();
			}

			// Set the timestamp according
			// to the requested formatting used in the UI component.
			this.datetimeField.setValue(time);

			// Check the checkbox if the flag is completed.
			this.completeCheckbox.setValue(completed);
		}
	},

	/**
	 * Update the {@link Zarafa.core.data.IPMRecord IPMRecord} with the data from the {@link Ext.Panel Panel}.
	 * @param {Zarafa.core.data.IPMRecord} record The record which has to be updated
	 */
	updateRecord : function(record)
	{
		var flagIcon = this.flagColorCombo.getValue();
		var completed = this.completeCheckbox.getValue();

		record.beginEdit();
		// Set the icon
		record.set('flag_icon', flagIcon);

		var time = this.datetimeField.getValue();
		if (completed) {
			record.set('flag_complete_time', time);
		} else {
			record.set('flag_due_by', time);
		}

		// Update the flag status depending on the selected color,
		// but also the completion checkbox.
		if (completed){
			record.set('flag_status', Zarafa.core.mapi.FlagStatus.completed);
		} else if (flagIcon == Zarafa.core.mapi.FlagIcon.clear) {
			record.set('flag_status', Zarafa.core.mapi.FlagStatus.cleared);
		} else {
			record.set('flag_status', Zarafa.core.mapi.FlagStatus.flagged);
		}

		record.endEdit();
	},

	/**
	 * Event handler which is triggered when enddate fields
	 * has been changed by the user. It will validate the new value,
	 * and if correct, will apply it to the {@link Zarafa.core.data.IPMRecord record}.
	 * @param {Ext.form.Field} field The {@link Ext.form.Field field} which was changed.
	 * @param {Mixed} newValue The new value
	 * @param {Mixed} oldValue The old value
	 * @private
	 */
	onDateChange : function(field, newValue, oldValue)
	{
		var completed = this.completeCheckbox.getValue();

		if (completed) {
			this.record.set('flag_complete_time', newValue);
		} else {
			this.record.set('flag_due_by', newValue);
		}
	},
	/**
	 * Event handler which is triggered when flag color fields
	 * has been changed by the user. It will validate the new value,
	 * and if correct, will apply it to the {@link Zarafa.core.data.IPMRecord record}.
	 * @param {Ext.form.Field} field The {@link Ext.form.Field field} which was changed.
	 * @param {Ext.data.Record} record The data record returned from the underlying store
	 * @param {Number} index The index of the selected item in the dropdown list
	 * @private
	 */
	onColorSelect : function(field, record, number)
	{
		var flagIcon = this.flagColorCombo.getValue();
		this.record.set('flag_icon', flagIcon);

		if(flagIcon == Zarafa.core.mapi.FlagIcon.clear) {
			this.record.set('flag_status', Zarafa.core.mapi.FlagStatus.cleared);
		} else {
			this.record.set('flag_status', Zarafa.core.mapi.FlagStatus.flagged);
		}
	},

	/**
	 * Event handler which is triggered when complete fields
	 * has been changed by the user. It will validate the new value,
	 * and if correct, will apply it to the {@link Zarafa.core.data.IPMRecord record}.
	 * @param {Ext.form.Field} field The {@link Ext.form.Field field} which was changed.
	 * @param {Mixed} newValue The new value
	 * @param {Mixed} oldValue The old value
	 * @private
	 */
	onToggleComplete : function(checkbox, checked)
	{
		var time = this.datetimeField.getValue();
		var flagIcon = this.flagColorCombo.getValue();

		this.flagColorCombo.setDisabled(checked);

		if (checked){
			this.record.set('flag_status', Zarafa.core.mapi.FlagStatus.completed);
			this.record.set('flag_complete_time', time);
			this.record.set('flag_due_by', null);

			this.record.set('flag_icon', undefined);
		} else if (flagIcon == Zarafa.core.mapi.FlagIcon.clear) {
			this.record.set('flag_status', Zarafa.core.mapi.FlagStatus.cleared);
			this.record.set('flag_due_by', time);
			this.record.set('flag_complete_time', null);

			this.record.set('flag_icon', undefined);
		} else {
			this.record.set('flag_status', Zarafa.core.mapi.FlagStatus.flagged);
			this.record.set('flag_due_by', time);
			this.record.set('flag_complete_time', null);
		}

	}
});

Ext.reg('zarafa.mailflagspanel', Zarafa.mail.dialogs.MailFlagsPanel);
