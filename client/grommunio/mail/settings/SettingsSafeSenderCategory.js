/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.mail.settings');

/**
 * @class Grommunio.mail.settings.SettingsSafeSenderCategory
 * @extends Grommunio.settings.ui.SettingsCategory
 * @xtype grommunio.settingssafesendercategory
 *
 * The category for configuring sender lists (safe senders, safe recipients,
 * blocked senders) stored in the Outlook-compatible Junk Email Rule FAI message.
 */
Grommunio.mail.settings.SettingsSafeSenderCategory = Ext.extend(Grommunio.settings.ui.SettingsCategory, {

	/**
	 * @insert context.settings.category.safesender
	 * Insertion point to register new {@link Grommunio.settings.ui.SettingsWidget widgets}
	 * for the {@link Grommunio.mail.settings.SettingsSafeSenderCategory Sender Lists Category}.
	 * @param {Grommunio.mail.settings.SettingsSafeSenderCategory} category The Sender Lists
	 * category to which the widgets will be added.
	 */

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title: _('Sender Lists'),
			categoryIndex: 8,
			iconCls: 'grommunio-settings-category-safesenders',
			items: [{
				xtype: 'grommunio.settingssafesenderswidget',
				settingsContext: config.settingsContext
			},{
				xtype: 'grommunio.settingssaferecipientswidget',
				settingsContext: config.settingsContext
			},{
				xtype: 'grommunio.settingsblockedsenderswidget',
				settingsContext: config.settingsContext
			},{
				xtype: 'grommunio.settingssenderlistsoptionswidget',
				settingsContext: config.settingsContext
			},
				container.populateInsertionPoint('context.settings.category.safesender', this)
			]
		});

		Grommunio.mail.settings.SettingsSafeSenderCategory.superclass.constructor.call(this, config);

		// Start from fresh lists whenever the category is opened. Another
		// client may have edited the same rule since login.
		this.on('activate', function() {
			Grommunio.mail.data.JunkMailStore.load();
		}, this);
	},

	/**
	 * Event handler for the
	 * {@link Grommunio.settings.SettingsContextModel ContextModel}#{@link Grommunio.settings.SettingsContextModel#beforesavesettings beforesavesettings}
	 * event. It hooks into the save flow to also persist JunkMailStore to server.
	 * @private
	 */
	onBeforeSaveSettingsModel: function()
	{
		Grommunio.mail.settings.SettingsSafeSenderCategory.superclass.onBeforeSaveSettingsModel.apply(this, arguments);

		this.displaySavingMask();
		Grommunio.mail.data.JunkMailStore.save(function(success) {
			this.hideSavingMask(success);
		}, this);
	}
});

Ext.reg('grommunio.settingssafesendercategory', Grommunio.mail.settings.SettingsSafeSenderCategory);
