/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace("Grommunio.plugins.kendox.js.settings");

/**
 * @class Grommunio.plugins.kendox.js.settings.SettingsNotificationsCategory
 * @extends Grommunio.settings.ui.SettingsCategory
 * @xtype grommunio.settingspasswdcategory
 *
 * The Kendox InfoShare settings category that will allow users to edit urls to InfoShare API and web-dialog
 */
Grommunio.plugins.kendox.js.settings.SettingsKendoxCategory = Ext.extend(
	Grommunio.settings.ui.SettingsCategory,
	{
		/**
		 * @constructor
		 * @param {Object} config Configuration object
		 */
		constructor: function (config) {
			config = config || {};

			Ext.applyIf(config, {
				title: _("Kendox InfoShare"),
				categoryIndex: 9990,
				xtype: "grommunio.kendoxsettingscategory",
				iconCls: "icon_kendox_settings",
				items: [
					{
						xtype: "grommunio.settingskendoxwidget",
						settingsContext: config.settingsContext,
					},
				],
			});

			Grommunio.plugins.kendox.js.settings.SettingsKendoxCategory.superclass.constructor.call(
				this,
				config,
			);
		},
	},
);

Ext.reg(
	"grommunio.kendoxsettingscategory",
	Grommunio.plugins.kendox.js.settings.SettingsKendoxCategory,
);

/**
 * @class Grommunio.plugins.kendox.js.settings.SettingsKendoxWidget
 * @extends Grommunio.settings.ui.SettingsWidget
 * @xtype grommunio.settingskendoxwidget
 *
 * The {@link Grommunio.settings.ui.SettingsWidget widget} for setup InfoShare API
 * in the {@link Grommunio.plugins.kendox.js.settings.SettingsKendoxCategory Kendox InfoShare category}.
 */
Grommunio.plugins.kendox.js.settings.SettingsKendoxWidget = Ext.extend(
	Grommunio.settings.ui.SettingsWidget,
	{
		/**
		 * @cfg {Grommunio.plugins.kendox.js.KendoxPlugin} plugin The plugin which has registered this
		 * settings widget.
		 */
		plugin: undefined,

		/**
		 * Settings model instance which will be used to get current settings
		 * @property
		 * @type Grommunio.settings.SettingsModel
		 */
		model: undefined,

		/**
		 * @constructor
		 * @param {Object} config Configuration object
		 */
		constructor: function (config) {
			config = config || {};

			Ext.applyIf(config, {
				title: _("Kendox InfoShare"),
				xtype: "grommunio.settingskendoxwidget",
				cls: "grommunio-settings-widget k-settings-kendox",
				autoScroll: true,
				items: this.createPanelItems(),
			});

			Grommunio.plugins.kendox.js.settings.SettingsKendoxWidget.superclass.constructor.call(
				this,
				config,
			);
		},

		/**
		 * Function will return object which will be used to create items for this settings widget
		 * @return {Array} Array containing configuration objects of child items
		 */
		createPanelItems: function () {
			return [
				{
					xtype: "panel",
					layout: "form",
					title: _("Constraints for single attachment archiving"),
					border: false,
					autoHeight: true,
					labelWidth: 250,
					items: [
						{
							xtype: "numberfield",
							allowBlank: false,
							fieldLabel: _("Max count attachments"),
							name: "grommunio/v1/plugins/kendox/max_attachments_number",
							ref: "../max_attachments_number",
							msgTarget: "under",
							listeners: {
								change: this.onFieldChange,
								scope: this,
							},
						},
						{
							xtype: "numberfield",
							allowBlank: false,
							fieldLabel: _("Max size all selected attachments (MB)"),
							name: "grommunio/v1/plugins/kendox/max_attachments_size_mb",
							ref: "../max_attachments_size_mb",
							msgTarget: "under",
							listeners: {
								change: this.onFieldChange,
								scope: this,
							},
						},
					],
				},
				{
					xtype: "panel",
					layout: "form",
					title: _("Selection Kendox InfoShare environment"),
					border: false,
					autoHeight: true,
					labelWidth: 250,
					items: [
						{
							xtype: "radiogroup",
							name: "grommunio/v1/plugins/kendox/environment",
							ref: "../environment",
							hideLabel: true,
							columns: 1,
							items: [
								{
									boxLabel: _("Production"),
									name: "environment",
									inputValue: "prod",
									checked: this.environment === "prod",
								},
								{
									boxLabel: _("Test"),
									name: "environment",
									inputValue: "test",
									checked: this.environment === "test",
								},
							],
							listeners: {
								change: this.onFieldChange,
								scope: this,
							},
						},
					],
				},
				{
					xtype: "panel",
					layout: "form",
					title: _("URLs for production environment"),
					border: false,
					autoHeight: true,
					labelWidth: 250,
					items: [
						{
							xtype: "textfield",
							anchor: "100%",
							inputType: "text",
							allowBlank: false,
							vtype: "url",
							fieldLabel: _("Kendox InfoShare API URL"),
							name: "grommunio/v1/plugins/kendox/api_url",
							ref: "../api_url",
							msgTarget: "under",
							listeners: {
								change: this.onFieldChange,
								scope: this,
							},
						},
						{
							xtype: "textfield",
							anchor: "100%",
							inputType: "text",
							allowBlank: false,
							vtype: "url",
							fieldLabel: _("Kendox InfoShare Web dialog URL"),
							name: "grommunio/v1/plugins/kendox/dialog_url",
							ref: "../dialog_url",
							msgTarget: "under",
							listeners: {
								change: this.onFieldChange,
								scope: this,
							},
						},
					],
				},
				{
					xtype: "panel",
					layout: "form",
					title: _("URLs for test environment"),
					border: false,
					autoHeight: true,
					labelWidth: 250,
					items: [
						{
							xtype: "textfield",
							anchor: "100%",
							inputType: "text",
							allowBlank: false,
							vtype: "url",
							fieldLabel: _("Kendox InfoShare API URL"),
							name: "grommunio/v1/plugins/kendox/api_url_test",
							ref: "../api_url_test",
							msgTarget: "under",
							listeners: {
								change: this.onFieldChange,
								scope: this,
							},
						},
						{
							xtype: "textfield",
							anchor: "100%",
							inputType: "text",
							allowBlank: false,
							vtype: "url",
							fieldLabel: _("Kendox InfoShare Web dialog URL"),
							name: "grommunio/v1/plugins/kendox/dialog_url_test",
							ref: "../dialog_url_test",
							msgTarget: "under",
							listeners: {
								change: this.onFieldChange,
								scope: this,
							},
						},
					],
				},
			];
		},

		/**
		 * Update the view with the new values of the settings
		 * model. Called when opening the settings widget or when a new
		 * folder is selected.
		 *
		 * @param {Grommunio.settings.SettingsModel} settingsModel The settings to display.
		 */
		update: function (settingsModel) {
			this.model = settingsModel;
			this.max_attachments_number.setValue(this.model.get(this.max_attachments_number.name));
			this.max_attachments_size_mb.setValue(this.model.get(this.max_attachments_size_mb.name));
			this.environment.setValue(this.model.get(this.environment.name));
			this.api_url.setValue(this.model.get(this.api_url.name));
			this.api_url_test.setValue(this.model.get(this.api_url_test.name));
			this.dialog_url.setValue(this.model.get(this.dialog_url.name));
			this.dialog_url_test.setValue(this.model.get(this.dialog_url_test.name));
		},

		/**
		 * Called by the {@link Grommunio.settings.ui.SettingsCategory Category} when
		 * it has been called with {@link grommunio.settings.ui.SettingsCategory#updateSettings}.
		 * This is used to update the settings from the UI into the {@link Grommunio.settings.SettingsModel settings model}.
		 * @param {Grommunio.settings.SettingsModel} settingsModel The settings to update
		 */
		updateSettings: function (settingsModel) {
			settingsModel.beginEdit();
			settingsModel.set(this.max_attachments_number.name, this.max_attachments_number.getValue());
			settingsModel.set(this.max_attachments_size_mb.name, this.max_attachments_size_mb.getValue());
			settingsModel.set(this.api_url.name, this.api_url.getValue());
			settingsModel.set(this.api_url_test.name, this.api_url_test.getValue());
			settingsModel.set(this.dialog_url.name, this.dialog_url.getValue());
			settingsModel.set(this.dialog_url_test.name, this.dialog_url_test.getValue());
			settingsModel.endEdit();
		},

		/**
		 * Event handler which is called when one of the textfields has been changed.
		 * This will apply the new value to the settings.
		 * @param {Ext.form.Field} field The field which has fired the event
		 * @param {String} value The new value
		 * @private
		 */
		onFieldChange: function(field, newValue) {
			var value = (field.xtype === "radiogroup") ? newValue.inputValue : newValue;
			var originalValue = this.model.get(field.name);
			if (originalValue !== value) {
				this.model.set(field.name, value);
			}
		},
	},
);

Ext.reg(
	"grommunio.settingskendoxwidget",
	Grommunio.plugins.kendox.js.settings.SettingsKendoxWidget,
);
