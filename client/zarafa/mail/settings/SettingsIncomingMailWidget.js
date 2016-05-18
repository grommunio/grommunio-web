Ext.namespace('Zarafa.mail.settings');

/**
 * @class Zarafa.mail.settings.SettingsIncomingMailWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.settingsincomingmailwidget
 *
 * The {@link Zarafa.settings.ui.SettingsWidget widget} for configuring
 * the incoming mail options in the {@link Zarafa.mail.settings.SettingsMailCategory mail category}.
 */
Zarafa.mail.settings.SettingsIncomingMailWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title : _('Incoming mail'),
			layout : 'form',
			items : [{
				xtype : 'displayfield',
				hideLabel : true,
				value : _('How to respond to requests for read receipts')
			},{
				xtype : 'radiogroup',
				name : 'zarafa/v1/contexts/mail/readreceipt_handling',
				ref : 'readReceiptGroup',
				columns : 1,
				hideLabel : true,
				items : [{
					xtype : 'radio',
					name : 'receiptHandling',
					inputValue : 'always',
					boxLabel : _('Always send a response')
				},{
					xtype : 'radio',
					name : 'receiptHandling',
					inputValue : 'never',
					boxLabel : _('Never send a response')
				},{
					xtype : 'radio',
					name : 'receiptHandling',
					inputValue : 'ask',
					boxLabel : _('Ask me before sending a response')
				}],
				listeners : {
					change : this.onRadioChange,
					scope : this
				}
			},{
				xtype: 'zarafa.compositefield',
				plugins: [ 'zarafa.splitfieldlabeler' ],
				// # TRANSLATORS: The {A} _must_ always be at the start of the translation
				// # The '{B}' represents the number of seconds which the user will type in.
				fieldLabel: _('{A}Automatically mark mail as read after {B} second(s)'),
				labelWidth: 250,
				items: [{
					xtype : 'checkbox',
					labelSplitter: '{A}',
					name : 'zarafa/v1/contexts/mail/readflag_time_enable',
					ref : '../readFlagTimeCheckbox',
					boxLabel : '',
					hideLabel : true,
					listeners : {
						check : this.onCheckboxChange,
						scope : this
					}
				},{
					xtype: 'zarafa.spinnerfield',
					labelSplitter: '{B}',
					name : 'zarafa/v1/contexts/mail/readflag_time',
					ref : '../readFlagTimeSpinner',
					incrementValue: 1,
					defaultValue: 0,
					minValue : 0,
					listeners: {
						'change': this.onFieldChange,
						scope: this
					},
					plugins: ['zarafa.numberspinner']
				}]


			}]
		});

		Zarafa.mail.settings.SettingsIncomingMailWidget.superclass.constructor.call(this, config);
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

		var enabled = settingsModel.get(this.readFlagTimeCheckbox.name);

		this.readFlagTimeCheckbox.setValue(enabled);
		this.readFlagTimeSpinner.setValue(settingsModel.get(this.readFlagTimeSpinner.name));
		this.readReceiptGroup.setValue(settingsModel.get(this.readReceiptGroup.name));

		this.readFlagTimeSpinner.setDisabled(!enabled);
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
		settingsModel.set(this.readReceiptGroup.name, this.readReceiptGroup.getValue().inputValue);
		settingsModel.set(this.readFlagTimeCheckbox.name, this.readFlagTimeCheckbox.getValue());
		settingsModel.set(this.readFlagTimeSpinner.name, this.readFlagTimeSpinner.getValue());
		settingsModel.endEdit();
	},

	/**
	 * Event handler which is fired when a {@link Ext.form.Radio} in the
	 * {@link Ext.form.RadioGroup} has been changed. This will toggle the
	 * visibility of the other fields.
	 * @param {Ext.form.RadioGroup} group The radio group which fired the event
	 * @param {Ext.form.Radio} radio The radio which was enabled
	 * @private
	 */
	onRadioChange : function(group, radio)
	{
		if (this.model) {
			// FIXME: The settings model should be able to detect if
			// a change was applied
			if (this.model.get(group.name) !== radio.inputValue) {
				this.model.set(group.name, radio.inputValue);
			}
		}
	},

	/**
	 * Event handler which is fired when {@link Ext.form.Field field} has been changed.
	 * @param {Ext.form.Field} field The Field which fired the event.
	 * @param {Mixed} value The updated value.
	 * @private
	 */
	onFieldChange : function(field, value) {
		if (this.model) {
			// FIXME: The settings model should be able to detect if
			// a change was applied
			if (this.model.get(field.name) !== value) {
				this.model.set(field.name, value);
			}
		}
	},

	/**
	 * Event handler which is fired when the {@link Ext.form.Checkbox Checkbox} has been clicked.
	 * @param {Ext.form.Checkbox} checkbox The checkbox which fired the event
	 * @param {Boolean} check True if the checkbox is currently checked
	 * @private
	 */
	onCheckboxChange : function(checkbox, check) {
		this.onFieldChange(checkbox, check);
		this.readFlagTimeSpinner.setDisabled(!check);
	}
});

Ext.reg('zarafa.settingsincomingmailwidget', Zarafa.mail.settings.SettingsIncomingMailWidget);
