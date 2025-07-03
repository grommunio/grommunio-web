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
	 * @cfg {Zarafa.common.outofoffice.data.OofStore} store store to use for loading out of office settings
	 */
	store: undefined,

	/**
	 * @cfg {Zarafa.common.outofoffice.data.OofRecord} record selected record to populate data into view by {@link #updateView}
	 * and save data.
	 */
	record: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		if(Ext.isEmpty(config.store)) {
			config.store = new Zarafa.common.outofoffice.data.OofStore();
		}

		Ext.applyIf(config, {
			xtype: 'zarafa.settingsoofwidget',
			title: _('Out of Office'),
			ref: '../outOfOfficeWidget',
			cls: 'zarafa-settings-widget',
			layout: 'form',
			labelWidth: 225,
			items: this.getNewConfig()
		});

		Zarafa.mail.settings.SettingsOofWidget.superclass.constructor.call(this, config);

		// Register 'selectnow' event for both the DateTimeFields
		this.outOfOfficeDateTimeField.dateField.on('selectnow', this.onOutOfOfficeSelectNow, this);
		this.backDateTimeField.dateField.on('selectnow', this.onBackSelectNow, this);
	},

	/**
	 * initialize events for the {@link Zarafa.mail.settings.SettingsOofWidget SettingsOofWidget}.
	 * @private
	 */
	initEvents: function()
	{
		Zarafa.mail.settings.SettingsOofWidget.superclass.initEvents.call(this);

		var contextModel = this.settingsContext.getModel();

		// Set handler for update to set the settings model dirty.
		this.mon(this.getOofStore(),'update', this.doStoreUpdate, this);
		// listen to savesettings and discardsettings to save/discard oof settings data
		this.mon(contextModel, 'savesettings', this.onSaveSettings, this);
		this.mon(contextModel, 'discardsettings', this.onDiscardSettings, this);
	},

	/**
	 * @return {Zarafa.common.outofoffice.data.OofStore} The store which holds record of users' out of office settings.
	 */
	getOofStore: function()
	{
		return this.store;
	},

	/**
	 * The configuration object for the new oof that allows the user to enter
	 * a time span for when he is out.
	 * Also adds user selection combo which holds user names who has given 'owner' permission.
	 * @return {Object} Configuration object
	 */
	getNewConfig: function()
	{
		var backDate = new Date().getNextWorkWeekDay() || new Date().add(Date.DAY, 1);
		backDate = backDate.clearTime().add(Date.MINUTE, container.getSettingsModel().get('zarafa/v1/main/start_working_hour'));
		var comboStore = this.createComboboxStore();
		var items = [];

		// Show user combo box only when shared stores with 'owner' permission available.
		if (comboStore.getCount() > 1) {
			items.push({
				xtype: 'container',
				cls: 'k-store-picker',
				border: false,
				layout: 'form',
				labelWidth: 225,
				items: {
					xtype: 'combo',
					mode: 'local',
					ref: '../userCombo',
					store: comboStore,
					fieldLabel: _('Update Out of Office settings for'),
					triggerAction: 'all',
					displayField: 'name',
					valueField: 'value',
					lazyInit: false,
					forceSelection: true,
					value: comboStore.getAt(0).get('value'),
					editable: false,
					listeners: {
						beforeselect: this.onBeforeUserSelect,
						select: this.updateView,
						scope: this
					}
				}
			});
		}

		items.push({
			xtype: 'radio',
			name: 'set',
			// ExtJs demands inputValue to be a string
			inputValue: 'false',
			boxLabel: _('I am currently in the office'),
			hideLabel: true,
			ref: 'inOfficeField',
			listeners: {
				check: this.onRadioChecked,
				scope: this
			}
		},{
			xtype: 'container',
			layout: {
				type: 'table',
				columns: 3
			},
			border: false,
			style: {
				paddingBottom: '25px'
			},
			defaults:{
				xtype: 'container',
				layout: 'form',
				cellCls: 'zarafa-settings-oof-table-cellpadding'
			},
			items: [{
				items:[{
					xtype: 'radio',
					name: 'set',
					hideLabel: true,
					boxLabel: _('I am out of the office from') + ':',
					ref: '../../outOfOfficeRadio',
					// ExtJs demands inputValue to be a string
					inputValue: 'true',
					listeners: {
						check: this.onRadioChecked,
						scope: this
					}
				}]
			},{
				items:[{
					xtype: 'zarafa.datetimefield',
					ref: '../../outOfOfficeDateTimeField',
					name: 'from',
					dateFieldConfig: {
						showNow: true,
						invalidClass: 'zarafa-settings-oof-invalid'
					},
					fieldLabel: '',
					width: 225,
					hideLabel: true,
					dateFormat: _('d/m/Y'),
					minValue: new Date(),
					defaultValue: new Date(),
					timeIncrement: container.getSettingsModel().get('zarafa/v1/contexts/calendar/default_zoom_level'),
					listeners: {
						change: this.onOutOfOfficeChange,
						scope: this
					}
				}]
			},{
				xtype: 'displayfield'
			},{
				items:[{
					xtype: 'checkbox',
					disabled: true,
					name: 'zarafa/v1/contexts/mail/autosave_enable',
					ref: '../../willBeBackCheckBox',
					boxLabel: _('I will be back on') + ':',
					hideLabel: true,
					listeners: {
						render: this.onWillBeBackCheckRender,
						check: this.onWillBeBackCheck,
						scope: this
					}
				}]
			},{
				xtype: 'zarafa.datetimefield',
				fieldLabel: '',
				ref: '../backDateTimeField',
				name: 'until',
				dateFieldConfig: {
					showNow: true,
					invalidClass: 'zarafa-settings-oof-invalid'
				},
				timeFieldConfig: {
					invalidClass: 'zarafa-settings-oof-invalid'
				},
				width: 225,
				disabled: true,
				hideLabel: true,
				dateFormat: _('d/m/Y'),
				minValue: new Date(),
				defaultValue: backDate,
				timeIncrement: container.getSettingsModel().get('zarafa/v1/contexts/calendar/default_zoom_level'),
				listeners: {
					change: this.backDateTimeChange,
					scope: this
				}
			},{
				xtype: 'displayfield',
				width: '100%',
				cellCls: 'zarafa-settings-oof-table-cellpadding',
				ref: '../oofWarning'
			}]
		},{
			xtype: 'displayfield',
			anchor: '100%',
			cls: 'zarafa-settings-oof-autoreplay',
			hideLabel: true,
			value: _('Automatically reply with the following message:') + ' ' + _("(The frequency of replies is dependent on server configuration.)")
		},{
			xtype: 'tabpanel',
			ref: 'replyMessages',
			activeTab: 0,
			items: [{
				title: _('Inside My Organization'),
				itemId: 'internal',
				height: '100%',
				width: '100%',
				items: [
				{
					xtype: 'container',
					cls: 'zarafa-settings-oof-subject',
					anchor: '100%',
					layout: 'hbox',
					items: [{
						xtype: 'displayfield',
						cls: 'label-subject',
						value: _('Subject') + ':',
						autoWidth: true
					},{
						xtype: 'textfield',
						name: 'internal_subject',
						ref: '../../../intSubjectField',
						emptyText: _('Out of Office'),
						defaultValue: _('Out of Office'),
						flex: 1,
						listeners: {
							change: this.onFieldChange,
							scope: this
						}
					}]
				},{
					xtype: 'zarafa.editorfield',
					cls: 'k-signature-editor',
					name: 'internal_reply',
					ref: '../../intBodyField',
					defaultValue: _('User is currently out of office.'),
					anchor: '100%',
					height: 450,
					useHtml: true,
					disableEditor: false,
					listeners: {
						change: this.onFieldChange,
						scope: this
					}
				}],
			}, {
				title: _('Outside My Organization'),
				itemId: 'external',
				height: '100%',
				width: '100%',
				items: [{
					xtype: 'container',
					style: {
						paddingBottom: '5px'
					},
					anchor: '100%',
					layout: 'hbox',
					items: [{
						xtype: 'checkbox',
						name: 'allow_external',
						ref: '../../../externalCheckBox',
						boxLabel: _('Auto-reply to people outside my organization'),
						hideLabel: true,
						listeners: {
							render: this.onCheckBoxRender,
							check: this.onExternalChecked,
							scope: this
						}
					}]
				},{
					xtype: 'container',
					style: {
						paddingLeft: '25px',
						paddingBottom: '5px'
					},
					anchor: '100%',
					layout: 'hbox',
					items: [{
						xtype: 'radio',
						name: 'external_audience',
						// ExtJs demands inputValue to be a string
						inputValue: 'true',
						boxLabel: _('My contacts only') + '&nbsp;',
						hideLabel: true,
						ref: '../../../contactsOnlyField',
						listeners: {
							check: this.onAudienceChecked,
							scope: this
						}
					}, {
						xtype: 'radio',
						name: 'external_audience',
						// ExtJs demands inputValue to be a string
						inputValue: 'false',
						boxLabel: _('Anyone outside my organization'),
						hideLabel: true,
						ref: '../../../anyoneField',
						listeners: {
							check: this.onAudienceChecked,
							scope: this
						}
					}]
				},{
					xtype: 'container',
					cls: 'zarafa-settings-oof-subject',
					anchor: '100%',
					layout: 'hbox',
					items: [{
						xtype: 'displayfield',
						cls: 'label-subject',
						value: _('Subject') + ':',
						autoWidth: true
					},{
						xtype: 'textfield',
						name: 'external_subject',
						ref: '../../../extSubjectField',
						emptyText: _('Out of Office'),
						defaultValue: _('Out of Office'),
						flex: 1,
						listeners: {
							change: this.onFieldChange,
							scope: this
						}
					}]
				},{
					xtype: 'zarafa.editorfield',
					cls: 'k-signature-editor',
					name: 'external_reply',
					ref: '../../extBodyField',
					defaultValue: _('User is currently out of office.'),
					anchor: '100%',
					height: 450,
					useHtml: true,
					disableEditor: false,
					listeners: {
						change: this.onFieldChange,
						scope: this
					}
				}]
			}],
			listeners: {
				tabchange: this.onTabChange,
				scope: this
			}
		});

		return items;
	},

	/**
	 * Creates an jsonstore for the combobox which contains the users of which store is fully opened
	 * and the Inbox 'folder permissions' are set.
	 * @return {Object} array which contains the jsonstore.
	 * @private
	 */
	createComboboxStore: function()
	{
		var hierarchyStore = container.getHierarchyStore();
		var myStoreEntryId = hierarchyStore.getDefaultStore().get('store_entryid');
		var data = [{name: _('myself'), value: myStoreEntryId }];
		var processedStores = [];

		hierarchyStore.getStores().forEach(function(store) {
			var subtree = store.getSubtreeFolder();
			var hasSufficientPermission = (subtree.get('rights') & Zarafa.core.mapi.Rights.RIGHTS_SECRETARY) === Zarafa.core.mapi.Rights.RIGHTS_SECRETARY;
			var storeEntryId = store.get('store_entryid');
			if (storeEntryId != myStoreEntryId && hasSufficientPermission) {
				data = data.concat({ name: store.get('mailbox_owner_name'), value: storeEntryId });
				processedStores.push(Zarafa.core.Util.bin2hex(store.get('user_name')));
			}
		});

		var sharedStores = container.getSettingsModel().get('zarafa/v1/contexts/hierarchy/shared_stores', true);
		for (var user in sharedStores) {
			// Skip not fully opened or already included stores
			if (!sharedStores[user].hasOwnProperty("all") || processedStores.includes(user)) {
				continue;
			}

			hierarchyStore.getStores().forEach(function(store) {
				if (store.get('user_name') === user) {
					// Saving out of office only works with equal or more than secretary permissions on the full store.
					// Note: The grommunio Web backend will not check the rights and allows saving out of office settings
					// when the user has folder rights, because that is what Gromox needs).
					var subtree = store.getSubtreeFolder();
					var hasSufficientPermission = (subtree.get('rights') & Zarafa.core.mapi.Rights.RIGHTS_SECRETARY) === Zarafa.core.mapi.Rights.RIGHTS_SECRETARY;

					if (hasSufficientPermission) {
						data = data.concat({name: store.get('mailbox_owner_name'), value: store.get('store_entryid') });
					}
				}
			});

		}

		return new Ext.data.JsonStore({
			fields: ['name', 'value'],
			data: data
		});
	},

	/**
	 * Event handler for the beforeselect event, when the user selects a different
	 * user to update the out of office settings.
	 *
	 * Checks if the model is dirty and shows the user a dialog if the user wants to
	 * save any changes.
	 *
	 * @param {Ext.form.ComboBox} field The combobox which was selected
	 * @param {Ext.Record} nextRecord The record that was selected
	 * @param {Number} index The index of the selected record
	 *
	 * @return {Mixed} False if there are pending changes. The selecting will then be
	 * handled by {@link #applyChanges}. Undefined otherwise.
	 */
	onBeforeUserSelect: function(field, nextRecord, index)
	{
		var model = this.settingsContext.getModel();
		if (model.hasChanges()) {
			Ext.MessageBox.show({
				title: _('Apply changes'),
				msg: _('Do you wish to apply the changes?'),
				fn: this.applyChanges.createDelegate(this, [ model, field, nextRecord ], 1),
				buttons: Ext.MessageBox.YESNOCANCEL
			});

			return false;
		}
	},

	/**
	 * Handler for the event fired after the {@link Ext.form.Checkbox checkbox} markup is rendered.
	 * We are aligning the check box to the right of its cell.
	 * @param {Ext.form.Checkbox} checkbox Will be back checkbox instance.
	 */
	onWillBeBackCheckRender: function(checkbox)
	{
		checkbox.wrap.addClass('zarafa-settings-oof-table-cellalign');
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
	 * This is used to get the latest version of the settings from the
	 * {@link Zarafa.settings.SettingsModel}.
	 * @param {Zarafa.settings.SettingsModel} settingsModel latest settings
	 */
	update: function(settingsModel)
	{
		this.model = settingsModel;

		this.updateView();
	},

	/**
	 * Called by the {@link #update} or when first time load of {@link Zarafa.mail.settings.SettingsOofWidget}
	 * and when user from drop down has been changed.
	 *
	 * This is used to load the latest version of the settings from the
	 * {@config record} into the UI of this widget.
	 */
	updateView: function()
	{
		if(this.userCombo) {
			var defaultUser = this.userCombo.getValue();
			this.record = this.getOofStore().getById(defaultUser);
			this.filterUserFromDropDown();
		} else {
			this.record = this.getOofStore().getAt(0);
		}
		var record = this.record;
		var isOofSet = record.get('set');
		this.inOfficeField.setValue(!isOofSet);
		this.outOfOfficeRadio.setValue(!!isOofSet);

		if (isOofSet) {
			var configuredFromSetting = record.get('from');
			var configuredUntilDateSetting = record.get('until');

			// Check if the values of 'from' out of office is proper to be set.
			if(configuredFromSetting !== 0) {
				this.outOfOfficeDateTimeField.setValue(new Date(configuredFromSetting*1000));
			}

			// Check if the values of 'until' out of office is proper to be set.
			// Otherwise set default back date value and disable the back date field.
			if(configuredUntilDateSetting !== 0) {
				this.backDateTimeField.setValue(new Date(configuredUntilDateSetting*1000));
				this.willBeBackCheckBox.setValue(true);
			} else {
				this.backDateTimeField.setValue(this.backDateTimeField.defaultValue);
				this.willBeBackCheckBox.setValue(false);
			}

		} else {
			// Reset Date fields
			this.outOfOfficeDateTimeField.setValue(this.outOfOfficeDateTimeField.defaultValue);
			this.backDateTimeField.setValue(this.backDateTimeField.defaultValue);
		}

		var intSubject = record.get(this.intSubjectField.name) || this.intSubjectField.defaultValue;
		this.intSubjectField.setValue(intSubject);

		var extSubject = record.get(this.extSubjectField.name) || this.extSubjectField.defaultValue;
		this.extSubjectField.setValue(extSubject);

		var intBody = record.get(this.intBodyField.name) || this.intBodyField.defaultValue;
		this.intBodyField.setValue(intBody);

		if (this.extBodyLoaded) {
			var extBody = record.get(this.extBodyField.name) || this.extBodyField.defaultValue;
			this.extBodyField.setValue(extBody);
		}
	},

	/**
	 * Called by the {@link #updateView} to filter unnecessary Users from comboBox.
	 * When shared user store's permission gets changed we need to filter those user.
	 *
	 * This function will remove users from comboBox which are not in {@config store} to sync with
	 * the latest shared users. And also hide comboBox when there's no other Users available.
	 */
	filterUserFromDropDown: function()
	{
		var comboStore = this.userCombo.getStore();
		var oofStore = this.getOofStore();

		comboStore.each(function(user){
			var comboUserEntryId = user.get('value');
			var userIndexOofStore = oofStore.findExact('store_entryid', comboUserEntryId);
			if (userIndexOofStore < 0) {
				comboStore.remove(user);
			}
		});

		this.userCombo.setVisible(comboStore.getCount() > 1);
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link zarafa.settings.ui.SettingsCategory#updateSettings}.
	 * This is used to update the settings from the UI into the {@config record}.
	 */
	updateSettings: function()
	{
		// We must either set the requested subject, or the default subject
		var intsubject = this.intSubjectField.getValue() || this.intSubjectField.emptyText;
		var extsubject = this.extSubjectField.getValue() || this.extSubjectField.emptyText;

		// We must either set the requested body, or the default body
		var intbody = this.intBodyField.getValue() || this.intBodyField.emptyText;
		if (this.extBodyLoaded) {
			var extbody = this.extBodyField.getValue() || this.extBodyField.emptyText;
		}

		this.record.beginEdit();
		this.record.set(this.intSubjectField.name, intsubject);
		this.record.set(this.extSubjectField.name, extsubject);
		this.record.set(this.intBodyField.name, intbody);
		if (this.extBodyLoaded) {
			this.record.set(this.extBodyField.name, extbody);
		}

		this.record.set(this.outOfOfficeRadio.name, this.outOfOfficeRadio.getValue());

		if(this.outOfOfficeRadio.getValue()){
			this.record.set(this.outOfOfficeDateTimeField.name, this.outOfOfficeDateTimeField.getValue().getTime()/1000);

			if(this.willBeBackCheckBox.getValue() === true){
				this.record.set(this.backDateTimeField.name, this.backDateTimeField.getValue().getTime()/1000);
			} else {
				this.record.set(this.backDateTimeField.name, 0);
			}
		}

		if (true == this.extBodyLoaded) {
			this.record.set(this.externalCheckBox.name, this.externalCheckBox.checked);
			this.record.set(this.contactsOnlyField.name, this.contactsOnlyField.checked);
		}

		this.record.endEdit();
	},

	onTabChange: function(tabPanel, newCard)
	{
		if (newCard.itemId === "external") {
			if (!this.extBodyLoaded) {
				var enableExternal = this.record.get(this.externalCheckBox.name);
				this.anyoneField.setDisabled(!enableExternal);
				this.contactsOnlyField.setDisabled(!enableExternal);
				this.extSubjectField.setDisabled(!enableExternal);
				this.externalCheckBox.setValue(enableExternal);
				var extbody = this.record.get(this.extBodyField.name) || this.extSubjectField.emptyText;
				this.extBodyField.setValue(extbody);
				if (enableExternal) {
					this.extBodyField.enable();
					var external_audience = this.record.get('external_audience');
					this.contactsOnlyField.setValue(external_audience ? 'false' : 'true');
					this.anyoneField.setValue(external_audience ? 'true' : 'false');
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
	onOutOfOfficeSelectNow: function(dateField, date)
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
	onBackSelectNow: function(dateField, date)
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
	onRadioChange: function(group, radio)
	{
		var set = radio.inputValue === 'true';

		if (this.record.get(group.name) !== set) {
			this.record.set(group.name, set);
		}
	},

	/**
	 * Event handler which is fired when a {@link Ext.form.Radio} in the
	 * {@link Ext.form.RadioGroup} has been changed. This will toggle the
	 * visibility of the other fields.
	 * @param {Ext.form.Radio} radio The radio which was enabled
	 * @param {Boolean} checked True if the radio is currently checked, false otherwise
	 * @private
	 */
	onRadioChecked: function(radio, checked)
	{
		if (checked === true) {
			var set = radio.inputValue === 'true';

			if (!!this.record.get(radio.name) !== set) {
				this.record.set(radio.name, set);
				// Ensure settings model is marked dirty when a field is changed
				this.settingsContext.getModel().setDirty();
			}

			this.outOfOfficeDateTimeField.setDisabled(!set);
			this.willBeBackCheckBox.setDisabled(!set);

			if(this.willBeBackCheckBox.getValue() === true) {
				this.willBeBackCheckBox.setValue(false);
			}

			this.reviseWarningStatus();
		}
	},

	onExternalChecked: function(checkbox, checked)
	{
		this.anyoneField.setDisabled(!checked);
		this.contactsOnlyField.setDisabled(!checked);
		this.extSubjectField.setDisabled(!checked);
		if (checked) {
			this.extBodyField.enable();
		} else {
			this.extBodyField.disable();
		}
		if (!!this.record) {
			this.record.set(checkbox.name, checked);
		}
	},

	onAudienceChecked: function(radio, checked)
	{
		if (checked === true) {
			var set = radio.inputValue === 'true';
			if (!!this.record) {
				this.record.set(radio.name, set);
			}
		}
	},

	/**
	 * Event handler which is fired when the "Enable reminder" checkbox has been clicked.
	 * @param {Ext.form.Checkbox} field The field which fired the event
	 * @param {Boolean} check True if the checkbox is currently checked
	 * @private
	 */
	onWillBeBackCheck: function(field, check)
	{
		if(!check) {
			this.record.set('until',0);
		} else {
			var backDateTimeValue = this.backDateTimeField.getValue().getTime()/1000;
			this.record.set('until', backDateTimeValue);
		}

		this.backDateTimeField.setDisabled(!check);
		this.reviseWarningStatus();
	},

	/**
	 * Event handler which is called when one of the textfields has been changed.
	 * This will apply the new value to the {@link #record} (or if the text is empty,
	 * the {@link Ext.form.Field#emptyText} will be saved).
	 * @param {Ext.form.Field} field The field which has fired the event
	 * @param {String} value The new value
	 * @private
	 */
	onFieldChange: function(field, value)
	{
		this.record.set(field.name, value || field.emptyText);

		// Ensure settings model is marked dirty when a field is changed
		var model = this.settingsContext.getModel();
		model.setDirty();

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
	onOutOfOfficeChange: function(dateField, newValue, oldValue)
	{
		this.backDateTimeField.dateField.setMinValue(newValue);
		this.reviseWarningStatus();
		this.record.set(dateField.name, newValue.getTime()/1000 || dateField.defaultValue);
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
	backDateTimeChange: function(dateField, newValue, oldValue)
	{
		this.reviseWarningStatus();
		this.record.set(dateField.name, newValue.getTime()/1000 || dateField.defaultValue);
	},

	/**
	 * Helper function to show or hide warning according to the latest date related changes by
	 * calling {@link Ext.form.DisplayField#set set} or {@link Ext.form.DisplayField#reset reset} methods respectively.
	 * @private
	 */
	reviseWarningStatus: function()
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
	},

	/**
	 * Applies changes according to the answer from the user. And then switches
	 * the user in combobox to the user provided selection.
	 *
	 * @param {Ext.button} btn The messagebox button
	 * @param {Zarafa.settings.SettingsContextModel} model the settings model
	 * @param {Ext.form.ComboBox} field the user selection combobox.
	 * @param {Ext.Record} record The user's record which was selected from user combobox.
	 */
	applyChanges: function(btn, model, field, record)
	{
		// The user cancels the switch to a different category
		if (btn === 'cancel') {
			return;
		}

		// Check if the user wishes to save all changes
		if (btn === 'yes') {
			model.applyChanges();
		} else {
			// Check if the user wishes to discard all changes
			model.discardChanges();
		}

		// Select the user in the dropdown
		field.setValue(record.get('value'));

		this.updateView();
	},

	/**
	 * Event handler for the {@link Ext.data.Store#update} event which is fired
	 * by the {@link Zarafa.common.outofoffice.data.OofStore} inside the {@link Zarafa.mail.settings.SettingsOofWidget}.
	 * This will mark the {@link Zarafa.settings.SettingsContextModel} as
	 * {@link Zarafa.settings.SettingsContextModel#setDirty dirty}.
	 * @param {Ext.data.Store} store The store which fired the event
	 * @param {Ext.data.Record} record The record which was updated
	 * @param {String} operation The update operation being performed.
	 * @private
	 */
	doStoreUpdate: function(store, record, operation)
	{
		if (operation !== Ext.data.Record.COMMIT) {
			var contextModel = this.settingsContext.getModel();

			if (!store.isLoaded || (store.isInitializing && !this.savingSettings)) {
				return;
			}

			if (operation !== Ext.data.Record.COMMIT) {
				var contextModel = this.settingsContext.getModel();
				contextModel.setDirty();
			}
		}
	},


	/**
	 * Function will be used to reload data in the {@link Zarafa.common.outofoffice.data.OofStore OofStore}.
	 */
	onDiscardSettings: function()
	{
		this.record.reject(true);
		this.updateView();
	},

	/**
	 * Event handler will be called when {@link Zarafa.settings.SettingsContextModel#savesettings} event is fired.
	 * This will save out of office store data.
	 * @private
	 */
	onSaveSettings: function()
	{
		var store = this.getOofStore();

		// Ensure store is fully initialized before saving
		if (store.isInitializing) {
			store.isInitializing = false;
		}

		store.save();
	}

});

Ext.reg('zarafa.settingsoofwidget', Zarafa.mail.settings.SettingsOofWidget);
