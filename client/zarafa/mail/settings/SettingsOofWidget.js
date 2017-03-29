Ext.namespace('Zarafa.mail.settings');

/**
 * @class Zarafa.mail.settings.SettingsOofWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.settingsoofwidget
 *
 * The {@link Zarafa.settings.ui.SettingsWidget widget} for configuring
 * the Out of Office settings in the {@link Zarafa.mail.settings.SettingsMailCategory mail category}.
 */
Zarafa.mail.settings.SettingsOofWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title : _('Out of Office'),
			iconCls : 'zarafa-settings-favorite-oof'
		});

		Ext.applyIf(config, this.getNewConfig());

		Zarafa.mail.settings.SettingsOofWidget.superclass.constructor.call(this, config);

		// Register 'selectnow' event for both the DateTimeFields
		this.outOfOfficeDateTimeField.dateField.on('selectnow', this.onOutOfOfficeSelectNow, this);
		this.backDateTimeField.dateField.on('selectnow', this.onBackSelectNow, this);
	},

	/**
	 * The configuration object for the new oof that allows the user to enter
	 * a time span for when he is out.
	 * @return {Object} Configuration object
	 */
	getNewConfig : function()
	{
		var backDate = new Date().getNextWorkWeekDay() || new Date().add(Date.DAY, 1);
		backDate = backDate.clearTime().add(Date.MINUTE, container.getSettingsModel().get('zarafa/v1/main/start_working_hour'));

		return {
			items : [{
				xtype : 'radio',
				name : 'zarafa/v1/contexts/mail/outofoffice/set',
				// ExtJs demands inputValue to be a string
				inputValue : 'false',
				boxLabel : _('I am currently in the office'),
				hideLabel : true,
				ref : 'inOfficeField',
				listeners : {
					check : this.onRadioChecked,
					scope : this
				}
			},{
				xtype : 'container',
				layout: {
					type: 'table',
					columns: 3
				},
				border : false,
				style : {
					paddingBottom : '25px'
				},
				items : [{
					xtype : 'radio',
					name : 'zarafa/v1/contexts/mail/outofoffice/set',
					hideLabel : true,
					boxLabel : _('I am out of the office from') + ':',
					ref : '../outOfOfficeRadio',
					cellCls : 'zarafa-settings-oof-table-cellpadding',
					// ExtJs demands inputValue to be a string
					inputValue : 'true',
					listeners : {
						check : this.onRadioChecked,
						scope : this
					}
				},{
					xtype: 'zarafa.datetimefield',
					ref: '../outOfOfficeDateTimeField',
					name : 'zarafa/v1/contexts/mail/outofoffice/from',
					dateFieldConfig : {
						showNow : true,
						invalidClass : 'zarafa-settings-oof-invalid'
					},
					fieldLabel : '',
					width : 200,
					hideLabel : true,
					dateFormat : _('d/m/Y'),
					timeFormat : _('G:i'),
					minValue : new Date(),
					defaultValue : new Date(),
					timeIncrement: container.getSettingsModel().get('zarafa/v1/contexts/calendar/default_zoom_level'),
					listeners : {
						change : this.onOutOfOfficeChange,
						scope : this
					}
				},{
					xtype : 'displayfield'
				},{
					xtype : 'checkbox',
					disabled : true,
					name : 'zarafa/v1/contexts/mail/autosave_enable',
					ref : '../willBeBackCheckBox',
					cellCls : 'zarafa-settings-oof-table-cellpadding',
					boxLabel : _('I will be back on') + ':',
					hideLabel : true,
					listeners : {
						render : this.onWillBeBackCheckRender,
						check : this.onWillBeBackCheck,
						scope : this
					}
				},{
					xtype: 'zarafa.datetimefield',
					fieldLabel : '',
					ref: '../backDateTimeField',
					cellCls : 'zarafa-settings-oof-table-cellpadding',
					name : 'zarafa/v1/contexts/mail/outofoffice/until',
					dateFieldConfig : {
						showNow : true,
						invalidClass : 'zarafa-settings-oof-invalid'
					},
					timeFieldConfig : {
						invalidClass : 'zarafa-settings-oof-invalid'
					},
					width : 200,
					disabled : true,
					hideLabel : true,
					dateFormat : _('d/m/Y'),
					timeFormat : _('G:i'),
					minValue : new Date(),
					defaultValue : backDate,
					timeIncrement: container.getSettingsModel().get('zarafa/v1/contexts/calendar/default_zoom_level'),
					listeners : {
						change : this.backDateTimeChange,
						scope : this
					}
				},{
					xtype : 'displayfield',
					width : '100%',
					cellCls : 'zarafa-settings-oof-table-cellpadding',
					ref : '../oofWarning'
				}]
			},{
				xtype : 'container',
				cls : 'zarafa-settings-oof-subject',
				anchor: '100%',
				layout: 'hbox',
				items : [{
					xtype : 'displayfield',
					cls : 'label-subject',
					value : _('Subject') + ':',
					autoWidth: true
				},{
					xtype : 'textfield',
					name : 'zarafa/v1/contexts/mail/outofoffice/subject',
					ref : '../subjectField',
					emptyText : _('Out of Office'),
					flex: 1,
					listeners : {
						change : this.onFieldChange,
						scope : this
					}
				}]
			},{
				xtype : 'displayfield',
				anchor: '100%',
				cls : 'zarafa-settings-oof-autoreplay',
				hideLabel : true,
				value : _('AutoReply only once to each sender with the following text') + ':'
			},{
				xtype : 'textarea',
				anchor: '100%',
				name : 'zarafa/v1/contexts/mail/outofoffice/message',
				ref : 'bodyField',
				hideLabel : true,
				emptyText : _('User is currently out of office.'),
				listeners : {
					change : this.onFieldChange,
					scope : this
				}
			}]
		};
	},

	/**
	 * Handler for the event fired after the {@link Ext.form.Checkbox checkbox} markup is rendered.
	 * We are aligning the check box to the right of its cell.
	 * @param {Ext.form.Checkbox} checkbox Will be back checkbox instance.
	 */
	onWillBeBackCheckRender : function(checkbox)
	{
		checkbox.wrap.addClass('zarafa-settings-oof-table-cellalign');
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

		var outOfOfficeSetting = settingsModel.get(this.inOfficeField.name);
		this.inOfficeField.setValue(!outOfOfficeSetting);
		this.outOfOfficeRadio.setValue(outOfOfficeSetting);

		if(outOfOfficeSetting){
			var configuredFromSetting = settingsModel.get(this.outOfOfficeDateTimeField.name);
			var configuredUntilDateSetting = settingsModel.get(this.backDateTimeField.name);

			// Check if the value in settings model is proper to be set into the respective field or not
			if(configuredFromSetting !== 0) {
				this.outOfOfficeDateTimeField.setValue(new Date(configuredFromSetting*1000));
			}

			if(configuredUntilDateSetting !== 0) {
				this.backDateTimeField.setValue(new Date(configuredUntilDateSetting*1000));
				this.willBeBackCheckBox.setValue(true);
			}
		}

		this.subjectField.setValue(settingsModel.get(this.subjectField.name));
		this.bodyField.setValue(settingsModel.get(this.bodyField.name));
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link zarafa.settings.ui.SettingsCategory#updateSettings}.
	 * This is used to update the settings from the UI into the {@link Zarafa.settings.SettingsModel settings model}.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to update
	 */
	updateSettings : function(settingsModel)
	{
		// We must either set the requested subject, or the default subject
		var subject = this.subjectField.getValue() || this.subjectField.emptyText;

		// We must either set the requested body, or the default body
		var body = this.bodyField.getValue() || this.bodyField.emptyText;

		settingsModel.beginEdit();

		settingsModel.set(this.subjectField.name, subject);
		settingsModel.set(this.bodyField.name, body);

		settingsModel.set(this.outOfOfficeRadio.name, this.outOfOfficeRadio.getValue());

		if(this.outOfOfficeRadio.getValue()){
			settingsModel.set(this.outOfOfficeDateTimeField.name, this.outOfOfficeDateTimeField.getValue().getTime()/1000);

			if(this.willBeBackCheckBox.getValue() === true){
				settingsModel.set(this.backDateTimeField.name, this.backDateTimeField.getValue().getTime()/1000);
			} else {
				settingsModel.set(this.backDateTimeField.name, 0);
			}
		}

		settingsModel.endEdit();
	},

	/**
	 * Event handler which is called when 'selectnow' event of {@link Ext.form.DateField} is fired.
	 * This will set current time to the respective sibling {@link Zarafa.common.ui.DateTimeField#timeField time field}.
	 * @param {Ext.form.DateField} dateField Which fired the event
	 * @param {Date} date The date that was selected
	 * @private
	 */
	onOutOfOfficeSelectNow : function(dateField, date)
	{
		this.outOfOfficeDateTimeField.timeField.setValue(new Date());
	},

	/**
	 * Event handler which is called when 'selectnow' event of {@link Ext.form.DateField} is fired.
	 * This will set current time to the respective sibling {@link Zarafa.common.ui.DateTimeField#timeField time field}.
	 * @param {Ext.form.DateField} dateField Which fired the event
	 * @param {Date} date The date that was selected
	 * @private
	 */
	onBackSelectNow : function(dateField, date)
	{
		this.backDateTimeField.timeField.setValue(new Date());
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
		var set = radio.inputValue === 'true';

		if (this.model) {
			// FIXME: The settings model should be able to detect if
			// a change was applied
			if (this.model.get(group.name) !== set) {
				this.model.set(group.name, set);
			}
		}

		this.subjectField.setDisabled(!set);
		this.bodyField.setDisabled(!set);
	},

	/**
	 * Event handler which is fired when a {@link Ext.form.Radio} in the
	 * {@link Ext.form.RadioGroup} has been changed. This will toggle the
	 * visibility of the other fields.
	 * @param {Ext.form.Radio} radio The radio which was enabled
	 * @param {Boolean} checked True if the radio is currently checked, false otherwise
	 * @private
	 */
	onRadioChecked : function(radio, checked)
	{
		if (checked === true) {
			var set = radio.inputValue === 'true';

			if (this.model) {
				// FIXME: The settings model should be able to detect if
				// a change was applied
				if (this.model.get(radio.name) !== set) {
					this.model.set(radio.name, set);
				}
			}

			this.subjectField.setDisabled(!set);
			this.bodyField.setDisabled(!set);
			this.outOfOfficeDateTimeField.setDisabled(!set);
			this.willBeBackCheckBox.setDisabled(!set);

			if(this.willBeBackCheckBox.getValue() === true) {
				this.willBeBackCheckBox.setValue(false);
			}

			this.reviseWarningStatus();
		}
	},

	/**
	 * Event handler which is fired when the "Enable reminder" checkbox has been clicked.
	 * @param {Ext.form.Checkbox} field The field which fired the event
	 * @param {Boolean} check True if the checkbox is currently checked
	 * @private
	 */
	onWillBeBackCheck : function(field, check)
	{
		this.backDateTimeField.setDisabled(!check);
		this.reviseWarningStatus();
	},

	/**
	 * Event handler which is called when one of the textfields has been changed.
	 * This will apply the new value to the settings (or if the text is empty,
	 * the {@link Ext.form.Field#emptyText} will be saved).
	 * @param {Ext.form.Field} field The field which has fired the event
	 * @param {String} value The new value
	 * @private
	 */
	onFieldChange : function(field, value)
	{
		if (this.model) {
			this.model.set(field.name, value || field.emptyText);
		}
	},

	/**
	 * Event handler which is triggered when {@link #outOfOfficeDateTimeField} field
	 * has been changed by the user. It configures minimum value for {@link #backDateTimeField} accordingly.
	 * It calls {@link #reviseWarningStatus} to show/hide warning according to the latest date related changes.
	 * @param {Ext.form.Field} dateField The {@link Ext.form.Field field} which was changed.
	 * @param {Mixed} newValue The new value
	 * @param {Mixed} oldValue The old value
	 * @private
	 */
	onOutOfOfficeChange : function(dateField, newValue, oldValue)
	{
		this.backDateTimeField.dateField.setMinValue(newValue);
		this.reviseWarningStatus();
		if (this.model) {
			this.model.set(dateField.name, newValue || dateField.defaultValue);
		}
	},

	/**
	 * Event handler which is triggered when {@link #backDateTimeField} field
	 * has been changed by the user. It calls {@link #reviseWarningStatus} to
	 * show/hide warning according to the latest date related changes.
	 *
	 * @param {Ext.form.Field} field The {@link Ext.form.Field field} which was changed.
	 * @param {Mixed} newValue The new value
	 * @param {Mixed} oldValue The old value
	 * @private
	 */
	backDateTimeChange : function(dateField, newValue, oldValue)
	{
		this.reviseWarningStatus();
		if (this.model) {
			this.model.set(dateField.name, newValue || dateField.defaultValue);
		}
	},

	/**
	 * Helper function to show or hide warning according to the latest date related changes by
	 * calling {@link Ext.form.DisplayField#set set} or {@link Ext.form.DisplayField#reset reset} methods respectively.
	 * @private
	 */
	reviseWarningStatus : function()
	{
		if(this.outOfOfficeDateTimeField.getValue() >= this.backDateTimeField.getValue() && this.willBeBackCheckBox.getValue() === true) {
			this.oofWarning.setValue(_('The time you entered is before the out of office date. Please reschedule.'));
			this.backDateTimeField.dateField.markInvalid();
			this.backDateTimeField.timeField.markInvalid();
		} else {
			this.oofWarning.reset();
			this.backDateTimeField.dateField.clearInvalid();
			this.backDateTimeField.timeField.clearInvalid();
		}
	}
});

Ext.reg('zarafa.settingsoofwidget', Zarafa.mail.settings.SettingsOofWidget);
