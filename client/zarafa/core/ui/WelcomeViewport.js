Ext.namespace('Zarafa.core.ui');

/**
 * @class Zarafa.core.ui.WelcomeViewport
 * @extends Ext.Viewport
 * The viewport to be used as welcome page for first time users, this will show
 * a welcome message, and allow the user to configure to initial settings
 * before continuing to the {@link Zarafa.core.ui.MainViewport Main viewport}.
 */
Zarafa.core.ui.WelcomeViewport = Ext.extend(Ext.Viewport, {

	/**
	 * The reference as returned by {@link Zarafa.core.ui.notifier.Notifier#notify} to reference the
	 * message in order to remove the message as soon as the save was completed.
	 * @property
	 * @type Ext.Element
	 * @private
	 */
	savingEl : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			layout : {
				type : 'vbox',
				align : 'stretch'
			},
			items : [{
				xtype : 'container',
				flex : 0.5
			},{
				layout : {
					type : 'hbox'
				},
				xtype : 'container',
				items : [{
					xtype : 'container',
					flex : 0.5
				},{
					xtype : 'panel',
					cls : 'zarafa-welcome-body',
					border : false,
					items : [{
						xtype : 'displayfield',
						cls : 'zarafa-welcome-title',
						value : _('Welcome to Kopano WebApp')
					},{
						xtype : 'displayfield',
						cls : 'zarafa-welcome-message',
						value : _('This is the first time you are using WebApp. <br />Please check the following settings before continuing.')
					},{
						xtype : 'zarafa.settingswelcomecategory',
						ref : '../../settingsCategory'
					}],
					buttonAlign : 'right',
					buttons : [{
						cls: 'zarafa-action',
						text: _('Continue'),
						handler : this.onContinueButton,
						scope : this
					}]
				},{
					xtype : 'container',
					flex : 0.5
				}]
			},{
				xtype : 'container',
				flex : 0.5
			}]
		});

		Zarafa.core.ui.WelcomeViewport.superclass.constructor.call(this, config);

		this.settingsCategory.update(container.getSettingsModel());

		// Disable autoSave, we want to call the save function manually,
		// so we can supply a callback function.
		container.getSettingsModel().autoSave = false;
	},

	/**
	 * Event handler which is fired when the user clicks the 'Continue' button
	 * This will save all settings, and reload the page to continue to the
	 * {@link Zarafa.core.ui.MainViewport}.
	 * @private
	 */
	onContinueButton : function()
	{
		var model = container.getSettingsModel();

		model.beginEdit();

		// Load settings from UI
		this.settingsCategory.updateSettings(model);

		// Disable the welcome message for next logon
		model.set('zarafa/v1/main/show_welcome', false);

		// set the default keyboard controls to 'basic'
		// We must do this explicitly because there is some logic
		// for backward compatibility that will assume 'disabled'
		// when no keycontrols are set.
		model.set('zarafa/v1/main/keycontrols', 'basic');

		model.endEdit();

		// Register event listener, so we can redirect the user
		// once the save has completed.
		this.mon(model, 'save', this.onSettingsSave, this, { single : true });
		this.mon(model, 'exception', this.onSettingsException, this, { single : true });

		// Show an information box indicating that the settings are being saved.
		this.savingEl = container.getNotifier().notify('info.saving', '', _('Saving') + '...', {
			container : this.getEl(),
			persistent : true
		});

		// Save settings
		model.save();
	},

	/**
	 * Called when the {@link Zarafa.settings.SettingsModel} fires the {@link Zarafa.settings.SettingsModel#save save}
	 * event to indicate the settings were successfully saved.
	 * @param {Zarafa.settings.SettingsModel} model The model which fired the event.
	 * @param {Object} parameters The key-value object containing the action and the corresponding
	 * settings which were saved to the server.
	 * @private
	 */
	onSettingsSave : function(model, parameters)
	{
		container.getNotifier().notify('info.saving', null, null, {
			container : this.getEl(),
			destroy : true,
			reference : this.savingEl
		});

		Zarafa.core.Util.disableLeaveRequester();
		window.location.reload();
	},

	/**
	 * Called when the {@link Zarafa.settings.SettingsModel} fires the {@link Zarafa.settings.SettingsModel#exception exception}
	 * event to indicate the settings were not successfully saved.
	 * @private
	 */
	onSettingsException : function()
	{
		container.getNotifier().notify('info.saving', null, null, {
			container : this.getEl(),
			destroy : true,
			reference : this.savingEl
		});
	}
});
