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
		var oofChecked = container.getSettingsModel().get('zarafa/v1/contexts/mail/outofoffice/set');
		var timerangeChecked = container.getSettingsModel().get('zarafa/v1/contexts/mail/outofoffice/timerange');
		var audienceChecked = container.getSettingsModel().get('zarafa/v1/contexts/mail/outofoffice/external_audience');
		
		return {
			items : [{
				xtype : 'radio',
				name : 'zarafa/v1/contexts/mail/outofoffice/set',
				// ExtJs demands inputValue to be a string
				inputValue : 'false',
				boxLabel : _('I am currently in the office'),
				hideLabel : true,
				checked : !oofChecked,
				ref : 'inOfficeField',
				listeners : {
					check : this.onRadioChecked,
					scope : this
					}
			},{
				xtype : 'radio',
				name : 'zarafa/v1/contexts/mail/outofoffice/set',
				// ExtJs demands inputValue to be a string
				inputValue : 'true',
				boxLabel : _('I am out of the office'),
				hideLabel : true,
				checked : oofChecked,
				ref : 'outOfficeField',
				// ExtJs demands inputValue to be a string
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
					paddingLeft : '25px',
					paddingBottom : '25px'
				},
				items : [{
					xtype : 'checkbox',
					name : 'zarafa/v1/contexts/mail/outofoffice/timerange',
					ref : '../timeRangeCheckBox',
					cellCls : 'zarafa-settings-oof-table-cellpadding',
					boxLabel : _('only valid during this time range') + ':',
					hideLabel : true,
					disabled : !oofChecked,
					checked : timerangeChecked,
					listeners : {
						render : this.onCheckBoxRender,
						check: this.onTimeRangeChecked,
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
					disabled : !oofChecked||!timerangeChecked,
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
					xtype : 'displayfield'
				},{
					xtype: 'zarafa.datetimefield',
					ref: '../backDateTimeField',
					cellCls : 'zarafa-settings-oof-table-cellpadding',
					name : 'zarafa/v1/contexts/mail/outofoffice/until',
					dateFieldConfig : {
						showNow : true,
						invalidClass : 'zarafa-settings-oof-invalid'
					},
					fieldLabel : '',
					width : 200,
					hideLabel : true,
					disabled : !oofChecked||!timerangeChecked,
					dateFormat : _('d/m/Y'),
					timeFormat : _('G:i'),
					minValue : new Date(),
					defaultValue : backDate,
					timeIncrement: container.getSettingsModel().get('zarafa/v1/contexts/calendar/default_zoom_level'),
					listeners : {
						change : this.onOutOfOfficeChange,
						scope : this
					}
				},{
					xtype : 'displayfield',
					width : '100%',
					cellCls : 'zarafa-settings-oof-table-cellpadding',
					ref : '../oofWarning'
				}]
			},{
				xtype : 'displayfield',
				anchor: '100%',
				cls : 'zarafa-settings-oof-autoreplay',
				hideLabel : true,
				value : _('Automatically reply once for each sender with the following messages') + ':'
			},
			{
				xtype : 'tabpanel',
				ref : 'replyMessages',
				activeTab: 0,
				items : [{
					title : _('Inside My Orgnization'),
					itemId : 'internal',
					height : '100%',
					width : '100%',
					items : [
					{
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
							name : 'zarafa/v1/contexts/mail/outofoffice/internal_subject',
							ref : '../../../intSubjectField',
							emptyText : _('Out of Office'),
							flex: 1,
							listeners : {
								change : this.onFieldChange,
								scope : this
							}
						}]
					},{
						xtype : 'zarafa.editorfield',
						cls : 'k-signature-editor',
						name : 'zarafa/v1/contexts/mail/outofoffice/internal_reply',
						ref : '../../intBodyField',
						anchor : '100%',
						height: 450,
						useHtml : true,
						disableEditor: false,
						listeners : {
							change : this.onFieldChange,
							scope : this
						}
					}],
				}, {
					title : _('Outside My Orgnization'),
					itemId : 'external',
					height : '100%',
					width : '100%',
					items : [{
						xtype : 'container',
						style : {
							paddingBottom : '5px'
						},
						anchor: '100%',
						layout: 'hbox',
						items : [{
							xtype : 'checkbox',
							name : 'zarafa/v1/contexts/mail/outofoffice/allow_external',
							ref : '../../../externalCheckBox',
							boxLabel : _('Auto-reply to people outside my orgnization'),
							hideLabel : true,
							listeners : {
								render : this.onCheckBoxRender,
								check: this.onExternalChecked,
								scope : this
							}
						}]
					},{
						xtype : 'container',
						style : {
							paddingLeft : '25px',
							paddingBottom : '5px'
						},
						anchor: '100%',
						layout: 'hbox',
						items : [{
							xtype : 'radio',
							name : 'zarafa/v1/contexts/mail/outofoffice/external_audience',
							// ExtJs demands inputValue to be a string
							inputValue : 'true',
							boxLabel : _('My contacts only') + '&nbsp;',
							hideLabel : true,
							checked : audienceChecked,
							ref : '../../../contactsOnlyField',
							listeners : {
								check : this.onAudienceChecked,
								scope : this
							}
						}, {
							xtype : 'radio',
							name : 'zarafa/v1/contexts/mail/outofoffice/external_audience',
							// ExtJs demands inputValue to be a string
							inputValue : 'false',
							boxLabel : _('Anyone outside my orgnization'),
							hideLabel : true,
							checked : !audienceChecked,
							ref : '../../../anyoneField',
							listeners : {
								check : this.onAudienceChecked,
								scope : this
							}
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
							name : 'zarafa/v1/contexts/mail/outofoffice/external_subject',
							ref : '../../../extSubjectField',
							emptyText : _('Out of Office'),
							flex: 1,
							listeners : {
								change : this.onFieldChange,
								scope : this
							}
						}]
					},{
						xtype : 'zarafa.editorfield',
						cls : 'k-signature-editor',
						name : 'zarafa/v1/contexts/mail/outofoffice/external_reply',
						ref : '../../extBodyField',
						anchor : '100%',
						height: 450,
						useHtml : true,
						disableEditor: false,
						listeners : {
							change : this.onFieldChange,
							scope : this
						}
					}]
				}],
				listeners : {
					tabchange : this.onTabChange,
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
	onCheckBoxRender : function(checkbox)
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
		if (outOfOfficeSetting){
			this.timeRangeCheckBox.setDisabled(false);
			var configuredFromSetting = settingsModel.get(this.outOfOfficeDateTimeField.name);
			var configuredUntilDateSetting = settingsModel.get(this.backDateTimeField.name);
			// Check if the value in settings model is proper to be set into the respective field or not
			if(configuredFromSetting !== 0) {
				this.outOfOfficeDateTimeField.setValue(new Date(configuredFromSetting*1000));
			}
			if(configuredUntilDateSetting !== 0) {
				this.backDateTimeField.setValue(new Date(configuredUntilDateSetting*1000));
			}
		} else {
			this.replyMessages.setDisabled(true);
		}

		this.intSubjectField.setValue(settingsModel.get(this.intSubjectField.name));
		this.extSubjectField.setValue(settingsModel.get(this.extSubjectField.name));
		this.intBodyField.setValue(settingsModel.get(this.intBodyField.name));
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
		var intsubject = this.intSubjectField.getValue() || this.intSubjectField.emptyText;
		var extsubject = this.extSubjectField.getValue() || this.extSubjectField.emptyText;

		// We must either set the requested body, or the default body
		var intbody = this.intBodyField.getValue() || this.intBodyField.emptyText;
		if (this.extBodyLoaded) {
			var extbody = this.extBodyField.getValue() || this.extBodyField.emptyText;
		}

		settingsModel.beginEdit();

		settingsModel.set(this.intSubjectField.name, intsubject);
		settingsModel.set(this.extSubjectField.name, extsubject);
		settingsModel.set(this.intBodyField.name, intbody);
		if (this.extBodyLoaded) {
			settingsModel.set(this.extBodyField.name, extbody);
		}

		settingsModel.set(this.outOfficeField.name, this.outOfficeField.getValue());

		if(this.outOfficeField.getValue()){
			settingsModel.set(this.outOfOfficeDateTimeField.name, this.outOfOfficeDateTimeField.getValue().getTime()/1000);

			if (this.timeRangeCheckBox.getValue() === true) {
				settingsModel.set(this.backDateTimeField.name, this.backDateTimeField.getValue().getTime()/1000);
			} else {
				settingsModel.set(this.backDateTimeField.name, 0);
			}
			if (true == this.extBodyLoaded) {
				settingsModel.set(this.externalCheckBox.name, this.externalCheckBox.checked);
				settingsModel.set(this.contactsOnlyField.name, this.contactsOnlyField.checked);
			}
		}

		settingsModel.endEdit();
	},

	onTabChange : function(tabPanel, newCard)
	{
		if (newCard.itemId === "external") {
			if (!this.extBodyLoaded) {
				var settingsModel = container.getSettingsModel();
				var enableExternal = settingsModel.get(this.externalCheckBox.name);
				this.anyoneField.setDisabled(!enableExternal);
				this.contactsOnlyField.setDisabled(!enableExternal);
				this.extSubjectField.setDisabled(!enableExternal);
				this.externalCheckBox.setValue(enableExternal);
				var extbody = settingsModel.get(this.extBodyField.name) || this.extSubjectField.emptyText;
				this.extBodyField.setValue(extbody);
				if (enableExternal) {
					this.extBodyField.enable();
				} else {
					this.extBodyField.disable();
				}
				this.extBodyLoaded = true;
			}
		}
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
			this.timeRangeCheckBox.setDisabled(!set);
			if (!set) {
				this.outOfOfficeDateTimeField.setDisabled(true);
				this.backDateTimeField.setDisabled(true);
			} else {
				if (this.timeRangeCheckBox.checked) {
					this.outOfOfficeDateTimeField.setDisabled(false);
					this.backDateTimeField.setDisabled(false);
				}
			}
			this.replyMessages.setDisabled(!set);
			this.reviseWarningStatus();
		}
	},
	
	onTimeRangeChecked : function(checkbox, checked)
	{
		this.outOfOfficeDateTimeField.setDisabled(!checked);
		this.backDateTimeField.setDisabled(!checked);
		if (this.model) {
			this.model.set(checkbox.name, checked);
		}
	},
	
	onExternalChecked : function(checkbox, checked)
	{
		this.anyoneField.setDisabled(!checked);
		this.contactsOnlyField.setDisabled(!checked);
		this.extSubjectField.setDisabled(!checked);
		if (checked) {
			this.extBodyField.enable();
		} else {
			this.extBodyField.disable();
		}
		if (this.model) {
			this.model.set(checkbox.name, checked);
		}
	},
	
	onAudienceChecked : function(radio, checked)
	{
		if (checked === true) {
			var set = radio.inputValue === 'true';
			if (this.model) {
				this.model.set(radio.name, set);
			}
		}
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
		if(this.outOfOfficeDateTimeField.getValue() >= this.backDateTimeField.getValue() && this.timeRangeCheckBox.getValue() === true) {
			this.oofWarning.setValue(_('The time you entered is before the out of office date. Please reschedule.'));
		} else {
			this.oofWarning.reset();
		}
	}
});

Ext.reg('zarafa.settingsoofwidget', Zarafa.mail.settings.SettingsOofWidget);
