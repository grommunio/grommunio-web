Ext.namespace('Zarafa.mail.settings');

/**
 * @class Zarafa.mail.settings.SettingsSenderListsOptionsWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.settingssenderlistsoptionswidget
 *
 * Widget for sender list options (contacts trust setting).
 */
Zarafa.mail.settings.SettingsSenderListsOptionsWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title: _('Options'),
			xtype: 'zarafa.settingssenderlistsoptionswidget',
			layout: 'form',
			items: [{
				xtype: 'checkbox',
				boxLabel: _('Also trust email from my Contacts'),
				ref: 'includeContactsCheckbox',
				hideLabel: true,
				listeners: {
					check: this.onCheckChange,
					scope: this
				}
			}]
		});

		Zarafa.mail.settings.SettingsSenderListsOptionsWidget.superclass.constructor.call(this, config);

		this.mon(Zarafa.mail.data.JunkMailStore, 'load', this.update, this);
	},

	/**
	 * Load the include contacts setting from JunkMailStore.
	 */
	update: function()
	{
		this.loadingView = true;
		this.includeContactsCheckbox.setValue(Zarafa.mail.data.JunkMailStore.getIncludeContacts());
		this.loadingView = false;
	},

	/**
	 * Save the include contacts setting to JunkMailStore.
	 */
	updateSettings: function()
	{
		if (Zarafa.mail.data.JunkMailStore.loaded) {
			Zarafa.mail.data.JunkMailStore.setIncludeContacts(this.includeContactsCheckbox.getValue());
		}
	},

	/**
	 * @private
	 */
	onCheckChange: function()
	{
		// Rendering the loaded value is not a user change.
		if (!this.loadingView) {
			this.settingsContext.getModel().setDirty();
		}
	}
});

Ext.reg('zarafa.settingssenderlistsoptionswidget', Zarafa.mail.settings.SettingsSenderListsOptionsWidget);
