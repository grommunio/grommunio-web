Ext.namespace('Zarafa.plugins.passwd.settings');

/**
 * @class Zarafa.plugins.passwd.settings.SettingsPasswdWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.settingspasswdwidget
 *
 * The {@link Zarafa.settings.ui.SettingsWidget widget} for changing password
 * in the {@link Zarafa.plugins.passwd.settings.SettingsPasswdCategory password category}.
 */
Zarafa.plugins.passwd.settings.SettingsPasswdWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title : _('Change Password'),
			xtype : 'zarafa.settingspasswdwidget',
			layout: 'form',
			items : [{
				xtype : 'zarafa.passwdpanel',
				ref : 'passwdPanel',
				listeners : {
					userchange : this.setModelDirty,
					scope : this
				}
			}]
		});

		Zarafa.plugins.passwd.settings.SettingsPasswdWidget.superclass.constructor.call(this, config);
	},

	/**
	 * initialize events for the {@link Zarafa.plugins.passwd.settings.SettingsPasswdWidget SettingsPasswdWidget}.
	 * @private
	 */
	initEvents : function()
	{
		Zarafa.plugins.passwd.settings.SettingsPasswdWidget.superclass.initEvents.call(this);

		// listen to savesettings and discardsettings to save/discard delegation data
		var contextModel = this.settingsContext.getModel();

		this.mon(contextModel, 'beforesavesettings', this.onBeforeSaveSettings, this);
		this.mon(contextModel, 'savesettings', this.onSaveSettings, this);
		this.mon(contextModel, 'discardsettings', this.onDiscardSettings, this);
	},

	/**
	 * Event handler will be called when {@link Zarafa.settings.SettingsContextModel#beforesavesettings} event is fired.
	 * This function will validate the formdata.
	 *
	 * @private
	 */
	onBeforeSaveSettings : function()
	{
		if(false == this.ownerCt.isVisible()) {
			return true;
		}
		// do some quick checks before submitting
		if(this.passwdPanel.new_password.getValue() != this.passwdPanel.new_password_repeat.getValue()) {
			Ext.MessageBox.alert(_('Error'), _('New passwords do not match.'));
			return false;
		} else if(Ext.isEmpty(this.passwdPanel.current_password.getValue())) {
			Ext.MessageBox.alert(_('Error'), _('Current password is empty.'));
			return false;
		} else if(Ext.isEmpty(this.passwdPanel.new_password.getValue()) || Ext.isEmpty(this.passwdPanel.new_password_repeat.getValue())) {
			Ext.MessageBox.alert(_('Error'), _('New password is empty.'));
			return false;
		} else if(!this.passwdPanel.getForm().isValid()) {
			Ext.MessageBox.alert(_('Error'), _('One or more fields does contain errors.'));
			return false;
		} else if (container.getSettingsModel().get("zarafa/v1/plugins/passwd/enable_strict_check")) {
			// do a quick score check:
			if(this.passwdPanel.new_password.getScore() < 70) {
				Ext.MessageBox.alert(_('Error'), _('Password is weak. Password should contain capital, non-capital letters and numbers. Password should have 8 to 20 characters.'));
				return false;
			}
		}

		return true;
	},

	/**
	 * Event handler will be called when {@link Zarafa.settings.SettingsContextModel#savesettings} event is fired.
	 * This will relay this event to {@link Zarafa.plugins.passwd.settings.PasswdPanel PasswdPanel} so it can
	 * save data.
	 * @private
	 */
	onSaveSettings : function()
	{
		// only save when this category is visible on screen
		if(this.ownerCt.isVisible()) {
			this.ownerCt.displaySavingMask();

			var data = this.passwdPanel.getForm().getFieldValues();

			// send request
			container.getRequest().singleRequest('passwdmodule', 'save', data, new Zarafa.plugins.passwd.data.PasswdResponseHandler({
				callbackFn: function (success, response) {
					this.ownerCt.hideSavingMask(success);
					if(success) {
						this.passwdPanel.getForm().reset();
					}
				},
				scope : this
			}));
		}
	},

	/**
	 * Event handler will be called when {@link Zarafa.settings.SettingsContextModel#discardsettings} event is fired.
	 * This will relay this event to {@link Zarafa.plugins.passwd.settings.PasswdPanel PasswdPanel} so it can
	 * discard current changes.
	 * @private
	 */
	onDiscardSettings : function()
	{
		this.passwdPanel.getForm().reset();
	},

	/**
	 * Function will be called when any field in {@link Zarafa.plugins.passwd.settings.PasswdPanel}
	 * is changed and we need to mark settings model as dirty.
	 * @private
	 */
	setModelDirty : function()
	{
		var model = this.settingsContext.getModel();

		if(!model.hasChanges()) {
			model.setDirty();
		}
	}
});

Ext.reg('zarafa.settingspasswdwidget', Zarafa.plugins.passwd.settings.SettingsPasswdWidget);
