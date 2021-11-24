Ext.namespace('Zarafa.common.settings');

/**
 * @class Zarafa.common.settings.SettingsDesktopNotificationsWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.settingsdesktopnotificationswidget
 *
 * The {@link Zarafa.settings.ui.SettingsWidget widget} for enable/disable desktop notifications
 * in the {@link Zarafa.common.settings.SettingsDesktopNotificationsCategory SettingsDesktopNotificationsCategory}.
 */
Zarafa.common.settings.SettingsDesktopNotificationsWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {

	/**
	 * Settings model instance which will be used to get current settings
	 * @property
	 * @type Zarafa.settings.SettingsModel
	 */
	model: undefined,

	/**
	 * This property will only be true if desktop notifications plugin's settings has been applied on UI.
	 * @property
	 * @type Boolean
	 */
	pluginSettingsApplied: false,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title: _('Desktop Notifications Settings'),
			xtype: 'zarafa.settingsdesktopnotificationswidget',
			layout: {
				// override from SettingsWidget
				type: 'fit'
			},
			items: this.createPanelItems()
		});

		Zarafa.common.settings.SettingsDesktopNotificationsWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Function will return object which will be used to create items for this settings widget
	 * @return {Array} Array containing configuration objects of child items
	 */
	createPanelItems: function()
	{
		return [{
			xtype: 'form',
			border: false,
			autoHeight: true,
			items: [{
				xtype: 'displayfield',
				hideLabel: true,
				value: _('We need permissions to enable desktop notifications.'),
				hidden: true,
				ref: '../requestPermissionText'
			}, {
				xtype: 'button',
				width: 200,
				text: _('Request Permissions'),
				handler: this.requestPermission,
				hidden: true,
				scope: this,
				hideLabel: true,
				ref: '../requestPermissionBtn',
				style: 'margin-bottom: 6px;'
			}, {
				xtype: 'checkbox',
				boxLabel: _('Enable desktop notifications for new mail'),
				name: 'zarafa/v1/main/notifier/info/newmail/value',
				handler: this.onChangeNotifications,
				scope: this,
				hideLabel: true,
				ref: '../newMailNotificationsCheck'
			}, {
				xtype: 'checkbox',
				boxLabel: _('Enable desktop notifications for reminders'),
				name: 'zarafa/v1/main/notifier/info/reminder/value',
				handler: this.onChangeNotifications,
				scope: this,
				hideLabel: true,
				ref: '../reminderNotificationsCheck'
			}, {
				xtype: 'zarafa.compositefield',
				defaultMargins: '0 0 0 0',
				plugins: [ 'zarafa.splitfieldlabeler' ],
				fieldLabel: _('{A} Auto hide desktop notification after second(s) {B}'),
				labelWidth: 300,
				combineErrors: false,
				ref: '../autoHideFieldLabel',
				items: [{
					xtype: 'checkbox',
					labelSplitter: '{A}',
					name: 'zarafa/v1/main/desktop_notification/autohide_enable',
					pluginSettingName: 'zarafa/v1/plugins/desktopnotifications/autohide_enable',
					ref: '../../autoHideBox',
					boxLabel: '',
					hideLabel: true,
					checked: true,
					listeners: {
						change: this.onFieldChange,
						scope: this
					}
				}, {
					xtype: 'zarafa.spinnerfield',
					labelSplitter: '{B}',
					vtype: 'naturalInteger',
					name: 'zarafa/v1/main/desktop_notification/autohide_time',
					pluginSettingName: 'zarafa/v1/plugins/desktopnotifications/autohide_time',
					ref: '../../autoHideTimeSpinner',
					incrementValue: 1,
					defaultValue: 1,
					minValue: 1,
					width: 55,
					allowBlank: false,
					allowDecimals: false,
					allowNegative: false,
					listeners: {
						change: this.onFieldChange,
						scope: this
					},
					plugins: ['zarafa.numberspinner']
				}]
			}, {
				xtype: 'checkbox',
				boxLabel: _('Disable sound'),
				name: 'zarafa/v1/main/desktop_notification/disable_sound',
				pluginSettingName: 'zarafa/v1/plugins/desktopnotifications/disable_sound',
				ref: '../disableSound',
				listeners: {
					change: this.onFieldChange,
					scope: this
				},
				hideLabel: true
			}]
		}];
	},

	/**
	 * Function will be used to get permission from user to show desktop notifications
	 * @FIXME move code of changing setting to some other part
	 */
	requestPermission: function()
	{
		Zarafa.common.Actions.authorize(function(perm) {
			if (perm === 'granted') {
				// update ui
				this.update(this.model);
			}
		}.createDelegate(this));
	},

	/**
	 * Function will be used to enable/disable desktop notifications for new mail and reminder functionalities.
	 */
	onChangeNotifications: function(checkbox, checked)
	{
		if (!this.model) {
			return;
		}

		var notifier = container.getSettingsModel().get(checkbox.name, false, true) || 'popup';
		if (checked) {
			notifier = 'desktopnotifier';
		}

		// change setting for new mail/reminder notification
		if (this.model.get(checkbox.name) !== notifier) {
			this.model.set(checkbox.name, notifier);
		}
	},

	/**
	 * Update the view with the new values of the settings
	 * model. Called when opening the settings widget or when a new
	 * folder is selected.
	 *
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to display.
	 */
	update: function(settingsModel)
	{
		this.model = settingsModel;

		/**************************************
		 * Permissions button and notifications
		 *************************************/

		// Enable/disable request permission button
		var hasPermission = Zarafa.common.Actions.hasPermission();
		this.requestPermissionBtn.setVisible(!hasPermission);
		this.requestPermissionText.setVisible(!hasPermission);

		// Enable/disable mail, reminder notification
		this.newMailNotificationsCheck.setDisabled(!hasPermission);
		this.reminderNotificationsCheck.setDisabled(!hasPermission);

		// Check/uncheck checkboxes for newmail and reminder functionality
		var newMailChecked = (this.model.get(this.newMailNotificationsCheck.name) === 'desktopnotifier');
		this.newMailNotificationsCheck.setValue(newMailChecked);
		var reminderChecked = (this.model.get(this.reminderNotificationsCheck.name) === 'desktopnotifier');
		this.reminderNotificationsCheck.setValue(reminderChecked);

		/**********
		 * Autohide
		 *********/

		// Disable the items if there are no permissions granted
		this.autoHideFieldLabel.setDisabled(!hasPermission);

		// Note: Desktop plugin settings needs to be applied in webapp main settings
		// due to desktop notification plugin has been included into webapp core.
		// Fetch plugin settings if any and apply them.
		this.pluginSettingsApplied = Ext.isDefined(settingsModel.get('zarafa/v1/plugins/desktopnotifications/enable'));
		var name = this.pluginSettingsApplied ? "pluginSettingName" : "name";
		var autoHideBoxEnabled = settingsModel.get(this.autoHideBox[name]);
		var spinnerValue = settingsModel.get(this.autoHideTimeSpinner[name]);
		var	soundCheckbox = settingsModel.get(this.disableSound[name]);

		// Set values in autoSave checkbox and textfield.
		this.autoHideBox.setValue(autoHideBoxEnabled);

		if (spinnerValue === 0 || !Ext.isDefined(spinnerValue)) {
			this.autoHideTimeSpinner.setValue(5); // Default 5 seconds
		} else {
			this.autoHideTimeSpinner.setValue(spinnerValue);
		}

		/********
		 * Sound
		 ********/
		// Disable sound checkbox
		this.disableSound.setDisabled(!hasPermission);

		// Show the correct value of the checkbox
		this.disableSound.setValue(soundCheckbox);
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link zarafa.settings.ui.SettingsCategory#updateSettings}.
	 * This is used to update the settings from the UI into the {@link Zarafa.settings.SettingsModel settings model}.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to update
	 */
	updateSettings: function(settingsModel)
	{
		var spinnerValue = this.autoHideTimeSpinner.getValue();
		if (spinnerValue === 0 || !Ext.isDefined(spinnerValue)) {
			spinnerValue = 1;
		}

		settingsModel.beginEdit();
		settingsModel.set(this.autoHideTimeSpinner.name, spinnerValue);

		// Note: Need to remove unnecessary plugin's settings and save the current settings in webapp main settings
		// so that there will not be any dependency of plugin settings.
		// And this will only run once to convert plugin's settings into main settings.
		if (this.pluginSettingsApplied) {
			settingsModel.remove('zarafa/v1/plugins/desktopnotifications', {type: 'deprecated'});
			settingsModel.set(this.autoHideBox.name, this.autoHideBox.getValue());
			settingsModel.set(this.disableSound.name, this.disableSound.getValue());
		}
		settingsModel.endEdit();
	},

	/**
	 * Event handler which is called when one of the textfields has been changed.
	 * This will apply the new value to the settings.
	 * @param {Ext.form.Field} field The field which has fired the event
	 * @param {String} value The new value
	 * @private
	 */
	onFieldChange: function(field, value)
	{
		if (this.model) {
			// FIXME: The settings model should be able to detect if
			// a change was applied
			var name = this.pluginSettingsApplied && Ext.isDefined(field["pluginSettingName"]) ? "pluginSettingName" : "name";
			if (this.model.get(field[name]) !== value) {
				this.model.set(field[name], value);
			}
		}
	}
});

Ext.reg('zarafa.settingsdesktopnotificationswidget', Zarafa.common.settings.SettingsDesktopNotificationsWidget);
