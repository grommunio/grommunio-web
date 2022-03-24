Ext.namespace('Zarafa.plugins.files.settings');

/**
 * @class Zarafa.plugins.files.settings.SettingsResetWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype filesplugin.settingsresetwidget
 *
 * The Reset Settings widget
 */
Zarafa.plugins.files.settings.SettingsResetWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {

	/**
	 * The loadMask object which will be shown when reset request is being sent to the server.
	 * @property
	 * @type Zarafa.common.ui.LoadMask
	 */
	loadMask: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function (config) {
		config = config || {};

		Ext.applyIf(config, {
			title : dgettext('plugin_files', 'Reset Files settings'),
			layout: 'form',
			items : [{
				xtype    : 'displayfield',
				hideLabel: true,
				value    : dgettext('plugin_files', 'Resets Files settings to their original defaults')
			}, {
				xtype  : 'button',
				text   : dgettext('plugin_files', 'Reset Files settings'),
				width  : 150,
				handler: this.onResetSettings,
				scope  : this
			}]
		});

		Zarafa.plugins.files.settings.SettingsResetWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler when the "Reset Files Settings" button was clicked.
	 * This will {@link Zarafa.settings.SettingsModel#reset reset} the
	 * {@link Zarafa.settings.data.SettingsDefaultValue values} of the settings.
	 * @private
	 */
	onResetSettings: function () {
		var message = dgettext('plugin_files', 'Are you sure to remove all settings and accounts?');
		message += '<br/>';
		message += '<i>' + dgettext('plugin_files', 'Accounts marked by your administrator as "cannot be changed" will not be removed.') + '</i>';
		message += '<br/><br/>';
		message += dgettext('plugin_files', 'WebApp will automatically restart in order for these changes to take effect.');
		message += '<br/>';

		Zarafa.common.dialogs.MessageBox.addCustomButtons({
			title       : dgettext('plugin_files', 'Reset Files settings'),
			msg         : message,
			fn          : this.resetDefaultSettings,
			customButton: [{
				text: dgettext('plugin_files', 'Reset'),
				name: 'reset'
			}, {
				text: dgettext('plugin_files', 'Cancel'),
				name: 'cancel'
			}],
			scope       : this
		});

	},

	/**
	 * Event handler for {@link #onResetSettings}. This will check if the user
	 * wishes to reset the default settings or not.
	 * @param {String} button The button which user pressed.
	 * @private
	 */
	resetDefaultSettings: function (button) {
		if (button === 'reset') {
			var settingsModel = container.getSettingsModel();
			var accounts = settingsModel.getSettingsObject('zarafa/v1/plugins/files/accounts');
			for (var account in accounts) {
				if (accounts[account].cannot_change !== true) {
					settingsModel.reset('zarafa/v1/plugins/files/accounts/' + account);
				}
			}
			settingsModel.reset('zarafa/v1/contexts/files');
			settingsModel.save();

			this.loadMask = new Zarafa.common.ui.LoadMask(Ext.getBody(), {
				msg: '<b>' + dgettext('plugin_files', 'Webapp is reloading, Please wait.') + '</b>'
			});

			this.loadMask.show();

			this.mon(settingsModel, 'save', this.onSettingsSave, this);
			this.mon(settingsModel, 'exception', this.onSettingsException, this);
		}

	},

	/**
	 * Called when the {@link Zarafa.settings.SettingsModel} fires the {@link Zarafa.settings.SettingsModel#save save}
	 * event to indicate the settings were successfully saved and it will forcefully realod the webapp.
	 * @param {Zarafa.settings.SettingsModel} model The model which fired the event.
	 * @param {Object} parameters The key-value object containing the action and the corresponding
	 * settings which were saved to the server.
	 * @private
	 */
	onSettingsSave: function (model, parameters) {
		if (parameters.action === Zarafa.core.Actions['reset']) {
			this.mun(model, 'save', this.onSettingsSave, this);
			this.mun(model, 'exception', this.onSettingsException, this);
			Zarafa.core.Util.reloadWebapp();
		}
	},

	/**
	 * Called when the {@link Zarafa.settings.SettingsModel} fires the {@link Zarafa.settings.SettingsModel#exception exception}
	 * event to indicate the settings were not successfully saved.
	 * @param {Zarafa.settings.SettingsModel} model The settings model which fired the event
	 * @param {String} type The value of this parameter will be either 'response' or 'remote'.
	 * @param {String} action Name of the action (see {@link Ext.data.Api#actions}).
	 * @param {Object} options The object containing a 'path' and 'value' field indicating
	 * respectively the Setting and corresponding value for the setting which was being saved.
	 * @param {Object} response The response object as received from the PHP-side
	 * @private
	 */
	onSettingsException: function (model, type, action, options, response) {
		if (options.action === Zarafa.core.Actions['reset']) {
			this.loadMask.hide();

			this.mun(model, 'save', this.onSettingsSave, this);
			this.mun(model, 'exception', this.onSettingsException, this);
		}
	}
});

Ext.reg('filesplugin.settingsresetwidget', Zarafa.plugins.files.settings.SettingsResetWidget);
