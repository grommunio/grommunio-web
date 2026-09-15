Ext.namespace('Grommunio.plugins.desktopnotifications.js.settings');

/**
 * @class Grommunio.plugins.desktopnotifications.js.settings.SettingsNotificationsWidget
 * @extends Grommunio.settings.ui.SettingsWidget
 * @xtype grommunio.settingsdesktopnotificationswidget
 *
 * The {@link Grommunio.settings.ui.SettingsWidget widget} for enable/disable desktop notifications
 * in the {@link Grommunio.plugins.desktopnotifications.js.settings.SettingsDesktopNotificationsCategory desktop notification category}.
 */
Grommunio.plugins.desktopnotifications.js.settings.SettingsNotificationsWidget = Ext.extend(Grommunio.settings.ui.SettingsWidget, {

	/**
	 * @cfg {Grommunio.plugins.desktopnotifications.js.DesktopNotificationsPlugin} plugin The plugin which has registered this
	 * settings widget.
	 */
	plugin : undefined,

	/**
	 * Settings model instance which will be used to get current settings
	 * @property
	 * @type Grommunio.settings.SettingsModel
	 */
	model : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title : _('Desktop Notifications Settings'),
			xtype : 'grommunio.settingsdesktopnotificationswidget',
			layout : {
				// override from SettingsWidget
				type : 'fit'
			},
			items : this.createPanelItems()
		});

		Grommunio.plugins.desktopnotifications.js.settings.SettingsNotificationsWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Function will return object which will be used to create items for this settings widget
	 * @return {Array} Array containing configuration objects of child items
	 */
	createPanelItems : function()
	{
		return [{
			xtype : 'form',
			border : false,
			autoHeight: true,
			items : [{
				xtype : 'displayfield',
				hideLabel : true,
				value : _('We need permissions to enable desktop notifications.')
			}, {
				xtype : 'button',
				width : 200,
				text : _('Request Permissions'),
				handler : this.requestPermission,
				scope : this,
				hideLabel : true,
				ref : '../requestPermissionBtn',
				style: 'margin-bottom: 6px;'
			}, {
				xtype : 'checkbox',
				boxLabel : _('Enable desktop notifications for new mail'),
				name : 'grommunio/v1/main/notifier/info/newmail/value',
				handler : this.onChangeCheckbox,
				scope : this,
				hideLabel : true,
				ref : '../newMailNotificationsCheck'
			}, {
				xtype : 'checkbox',
				boxLabel : _('Enable desktop notifications for reminders'),
				name : 'grommunio/v1/main/notifier/info/reminder/value',
				handler : this.onChangeCheckbox,
				scope : this,
				hideLabel : true,
				ref : '../reminderNotificationsCheck'
			}, {
				xtype: 'grommunio.compositefield',
				plugins: [ 'grommunio.splitfieldlabeler' ],
				fieldLabel: _('{A} Auto-hide desktop notification after second(s) {B}'),
				labelWidth: 300,
				combineErrors: false,
				items: [{
					xtype : 'checkbox',
					labelSplitter: '{A}',
					name : 'grommunio/v1/plugins/desktopnotifications/autohide_enable',
					ref : '../../autoHideBox',
					boxLabel : '',
					hideLabel : true,
					checked : true,
					style: 'margin-top: 4px',
					listeners : {
						change : this.onFieldChange,
						scope : this
					}
				}, {
					xtype: 'grommunio.spinnerfield',
					labelSplitter: '{B}',
					vtype: 'naturalInteger',
					name : 'grommunio/v1/plugins/desktopnotifications/autohide_time',
					ref : '../../autoHideTimeSpinner',
					incrementValue: 1,
					defaultValue: 1,
					minValue : 1,
					width: 55,
					allowBlank: false,
					allowDecimals: false,
					allowNegative: false,
					listeners: {
						change: this.onFieldChange,
						scope: this
					},
					plugins: ['grommunio.numberspinner']
				}]
			}, {
				xtype: 'checkbox',
				boxLabel: _('Disable sound'),
				name: 'grommunio/v1/main/desktop_notification/disable_sound',
				handler: this.onFieldChange,
				scope: this,
				hideLabel: true,
				ref: '../disableSound'
			}]
		}];
	},

	/**
	 * Function will be used to get permission from user to show desktop notifications
	 * @FIXME move code of changing setting to some other part
	 */
	requestPermission : function()
	{
		Grommunio.plugins.desktopnotifications.js.DesktopNotification.authorize(function(perm) {
			if (perm === 'granted') {
				// update ui
				this.update(this.model);
			}
		}.createDelegate(this));
	},

	/**
	 * Function will be used to enable/disable desktop notifications for new mail and reminder functionalities.
	 */
	onChangeCheckbox : function(checkbox, checked)
	{
		if (!this.model) {
			return;
		}

		var notifier = container.getSettingsModel().get(checkbox.name, false, true) || 'toast';

		if (checked) {
			notifier = 'desktopnotifier';
		}

		// change setting for new mail/reminder notification
		if (this.model.get(checkbox.name) !== notifier) {
			this.model.set(checkbox.name, notifier);
		}

		// update ui
		this.update(this.model);
	},

	/**
	 * Update the view with the new values of the settings
	 * model. Called when opening the settings widget or when a new
	 * folder is selected.
	 *
	 * @param {Grommunio.settings.SettingsModel} settingsModel The settings to display.
	 */
	update : function(settingsModel)
	{
		this.model = settingsModel;

		// enable/disable request permission button
		var hasPermission = Grommunio.plugins.desktopnotifications.js.DesktopNotification.hasPermission();

		this.requestPermissionBtn.setDisabled(hasPermission);

		this.newMailNotificationsCheck.setDisabled(!hasPermission);
		this.reminderNotificationsCheck.setDisabled(!hasPermission);

		// check/uncheck checkboxes for newmail and reminder functionality
		var newMailChecked = (this.model.get(this.newMailNotificationsCheck.name) === 'desktopnotifier');
		this.newMailNotificationsCheck.setValue(newMailChecked);

		var reminderChecked = (this.model.get(this.reminderNotificationsCheck.name) === 'desktopnotifier');
		this.reminderNotificationsCheck.setValue(reminderChecked);

		// Set values in autoSave checkbox and textfield.
		var enabled = settingsModel.get(this.autoHideBox.name);

		this.autoHideBox.setValue(enabled);

		var spinnerValue = this.model.get(this.autoHideTimeSpinner.name);
		if (spinnerValue === 0 || !Ext.isDefined(spinnerValue))  {
			this.autoHideTimeSpinner.setValue(5); // Default 5 seconds
		} else {
			this.autoHideTimeSpinner.setValue(spinnerValue);
		}

		/********
		 * Sound
		 ********/
		var	soundCheckbox = this.model.get(this.disableSound.name);
		// Disable sound checkbox
		this.disableSound.setDisabled(!hasPermission);

		// Show the correct value of the checkbox
		this.disableSound.setValue(soundCheckbox);
	},

	/**
	 * Called by the {@link Grommunio.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link grommunio.settings.ui.SettingsCategory#updateSettings}.
	 * This is used to update the settings from the UI into the {@link Grommunio.settings.SettingsModel settings model}.
	 * @param {Grommunio.settings.SettingsModel} settingsModel The settings to update
	 */
	updateSettings : function(settingsModel)
	{
		var spinnerValue = this.autoHideTimeSpinner.getValue();
		if (spinnerValue === 0 || !Ext.isDefined(spinnerValue))  {
			spinnerValue = 1;
		}

		settingsModel.beginEdit();
		settingsModel.set(this.autoHideTimeSpinner.name, spinnerValue);
		settingsModel.set(this.disableSound.name, this.disableSound.getValue());
		settingsModel.endEdit();
	},

	/**
	 * Event handler which is called when one of the textfields has been changed.
	 * This will apply the new value to the settings.
	 * @param {Ext.form.Field} field The field which has fired the event
	 * @param {String} value The new value
	 * @private
	 */
	onFieldChange : function(field, value)
	{
		if (this.model) {
			// FIXME: The settings model should be able to detect if
			// a change was applied
			if (this.model.get(field.name) !== value) {
				this.model.set(field.name, value);
			}
		}
	}
});

Ext.reg('grommunio.settingsdesktopnotificationswidget', Grommunio.plugins.desktopnotifications.js.settings.SettingsNotificationsWidget);
