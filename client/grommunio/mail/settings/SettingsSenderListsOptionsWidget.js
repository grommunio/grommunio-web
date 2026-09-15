/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.mail.settings');

/**
 * @class Grommunio.mail.settings.SettingsSenderListsOptionsWidget
 * @extends Grommunio.settings.ui.SettingsWidget
 * @xtype grommunio.settingssenderlistsoptionswidget
 *
 * Widget for sender list options (contacts trust setting).
 */
Grommunio.mail.settings.SettingsSenderListsOptionsWidget = Ext.extend(Grommunio.settings.ui.SettingsWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title: _('Options'),
			xtype: 'grommunio.settingssenderlistsoptionswidget',
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

		Grommunio.mail.settings.SettingsSenderListsOptionsWidget.superclass.constructor.call(this, config);

		this.mon(Grommunio.mail.data.JunkMailStore, 'load', this.update, this);
	},

	/**
	 * Load the include contacts setting from JunkMailStore.
	 */
	update: function()
	{
		this.loadingView = true;
		this.includeContactsCheckbox.setValue(Grommunio.mail.data.JunkMailStore.getIncludeContacts());
		this.loadingView = false;
	},

	/**
	 * Save the include contacts setting to JunkMailStore.
	 */
	updateSettings: function()
	{
		if (Grommunio.mail.data.JunkMailStore.loaded) {
			Grommunio.mail.data.JunkMailStore.setIncludeContacts(this.includeContactsCheckbox.getValue());
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

Ext.reg('grommunio.settingssenderlistsoptionswidget', Grommunio.mail.settings.SettingsSenderListsOptionsWidget);
