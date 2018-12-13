Ext.namespace('Zarafa.settings.ui');

/**
 * @class Zarafa.settings.ui.SettingsResetSettingsWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.settingsresetsettingswidget
 *
 * The Reset Settings widget
 */
Zarafa.settings.ui.SettingsResetSettingsWidget= Ext.extend(Zarafa.settings.ui.SettingsWidget, {

	/**
	 * The loadMask object which will be shown when reset request is being sent to the server.
	 * @property
	 * @type Zarafa.common.ui.LoadMask
	 */
	loadMask : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title: _('Reset settings'),
			layout: 'column',
			items: [{
				xtype: 'displayfield',
				columnWidth: 1,
				hideLabel: true,
				value : _('Reset settings to their original defaults.')
			},{
				xtype: 'button',
				text: _('Reset settings'),
				columnWidth: 1,
				autoWidth: true,
				handler: this.onResetSettings,
				scope: this
			}]
		});

		Zarafa.settings.ui.SettingsResetSettingsWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler when the "Reset settings" button was clicked.
	 * This will {@link Zarafa.settings.SettingsModel#reset reset} the 
	 * {@link Zarafa.settings.data.SettingsDefaultValue values} of the settings.
	 * @private
	 */
	onResetSettings : function()
	{
		var message = _('This will close all opened shared stores and resets all settings to the default value.');
		message += '<br/><br/>';
		message += _('WebApp will automatically reload in order for these changes to take effect');
		message += '<br/>';

		Zarafa.common.dialogs.MessageBox.addCustomButtons({
			title: _('Reset settings'),
			msg: message,
			cls: Ext.MessageBox.WARNING_CLS,
			fn: this.resetDefaultSettings,
			customButton: [{
				text: _('Reset'),
				name: 'reset'
			}, {
				text: _('Cancel'),
				name: 'cancel'
			}],
			scope : this
		});

	},

	/**
	 * Event handler for {@link #onResetSettings}. This will check if the user
	 * wishes to reset the default settings or not.
	 * @param {String} button The button which user pressed.
	 * @private
	 */
	resetDefaultSettings : function(button)
	{
		if (button === 'reset') {
			var contextModel = this.settingsContext.getModel();
			var realModel = contextModel.getRealSettingsModel();

			realModel.reset('zarafa/v1');
			realModel.save();

			this.loadMask = new Zarafa.common.ui.LoadMask(Ext.getBody(), {
				msg : '<b>' + _('Reloading, Please wait.') + '</b>'
			});

			this.loadMask.show();

			this.mon(realModel, 'save', this.onSettingsSave, this);
			this.mon(realModel, 'exception', this.onSettingsException, this);
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
	onSettingsSave : function(model, parameters)
	{
		if(parameters.action === Zarafa.core.Actions['reset']) {
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
	onSettingsException : function(model, type, action, options, response)
	{
		if(options.action === Zarafa.core.Actions['reset']) {
			this.loadMask.hide();
			// Remove event handlers
			this.mun(model, 'save', this.onSettingsSave, this);
			this.mun(model, 'exception', this.onSettingsException, this);
		}
	}
});

Ext.reg('zarafa.settingsresetsettingswidget', Zarafa.settings.ui.SettingsResetSettingsWidget);
