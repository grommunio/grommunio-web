Ext.namespace("Zarafa.plugins.kendox.js.settings");

/**
 * @class Zarafa.plugins.kendox.js.settings.SettingsNotificationsCategory
 * @extends Zarafa.settings.ui.SettingsCategory
 * @xtype zarafa.settingspasswdcategory
 *
 * The Kendox InfoShare settings category that will allow users to edit urls to InfoShare API and web-dialog
 */
Zarafa.plugins.kendox.js.settings.SettingsKendoxCategory = Ext.extend(
	Zarafa.settings.ui.SettingsCategory,
	{
		/**
		 * @constructor
		 * @param {Object} config Configuration object
		 */
		constructor: function (config) {
			config = config || {};

			Ext.applyIf(config, {
				title: _("Kendox InfoShare"),
				categoryIndex: 9997,
				xtype: "zarafa.kendoxsettingscategory",
				iconCls: "icon_kendox_settings",
				items: [
					{
						xtype: "zarafa.settingskendoxwidget",
						settingsContext: config.settingsContext,
					},
				],
			});

			Zarafa.plugins.kendox.js.settings.SettingsKendoxCategory.superclass.constructor.call(
				this,
				config,
			);
		},
	},
);

Ext.reg(
	"zarafa.kendoxsettingscategory",
	Zarafa.plugins.kendox.js.settings.SettingsKendoxCategory,
);

Ext.namespace("Zarafa.plugins.kendox.js.settings");

/**
 * @class Zarafa.plugins.kendox.js.settings.SettingsKendoxWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.settingskendoxwidget
 *
 * The {@link Zarafa.settings.ui.SettingsWidget widget} for setup InfoShare API
 * in the {@link Zarafa.plugins.kendox.js.settings.SettingsKendoxCategory Kendox InfoShare category}.
 */
Zarafa.plugins.kendox.js.settings.SettingsKendoxWidget = Ext.extend(
	Zarafa.settings.ui.SettingsWidget,
	{
		/**
		 * @cfg {Zarafa.plugins.kendox.js.KendoxPlugin} plugin The plugin which has registered this
		 * settings widget.
		 */
		plugin: undefined,

		/**
		 * Settings model instance which will be used to get current settings
		 * @property
		 * @type Zarafa.settings.SettingsModel
		 */
		model: undefined,

		max_attachments_number: undefined,
		max_attachments_size_mb: undefined,
		environment: undefined,
		api_url: undefined,
		api_url_test: undefined,
		dialog_url: undefined,
		dialog_url_test: undefined,

		/**
		 * @constructor
		 * @param {Object} config Configuration object
		 */
		constructor: function (config) {
			config = config || {};

			Ext.applyIf(config, {
				title: _("Kendox InfoShare"),
				xtype: "zarafa.settingskendoxwidget",
				layout: {
					// override from SettingsWidget
					type: "fit",
				},
				items: this.createPanelItems(),
			});

			Zarafa.plugins.kendox.js.settings.SettingsKendoxWidget.superclass.constructor.call(
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
							xtype: "textfield",
							inputType: "number",
							allowBlank: false,
							fieldLabel: _("Max count attachments"),
							name: "max_attachments_number",
							value: this.getSetting("max_attachments_number", 10),
							msgTarget: "under", // location of the error message
							invalidText: '"{0}" bad. "{1}" good.', // custom error message text
							listeners: {
								change: this.onFieldChange,
								scope: this,
							},
						},
						{
							xtype: "numberfield",
							inputType: "number",
							allowBlank: false,
							fieldLabel: _("Max size all selected attachments (MB)"),
							name: "max_attachments_size_mb",
							value: this.getSetting("max_attachments_size_mb", 10),
							msgTarget: "under", // location of the error message
							invalidText: '"{0}" bad. "{1}" good.', // custom error message text
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
							name: "environment",
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
							value: this.getSetting("environment"),
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
							name: "api_url",
							value: this.getSetting("api_url"),
							msgTarget: "under", // location of the error message
							invalidText: '"{0}" bad. "{1}" good.', // custom error message text
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
							name: "dialog_url",
							value: this.getSetting("dialog_url"),
							msgTarget: "under", // location of the error message
							invalidText: '"{0}" bad. "{1}" good.', // custom error message text
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
							name: "api_url_test",
							value: this.getSetting("api_url_test"),
							msgTarget: "under", // location of the error message
							invalidText: '"{0}" bad. "{1}" good.', // custom error message text
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
							name: "dialog_url_test",
							value: this.getSetting("dialog_url_test"),
							msgTarget: "under", // location of the error message
							invalidText: '"{0}" bad. "{1}" good.', // custom error message text
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
		 *
		 * @param {string} settingName
		 * @returns {string}
		 */
		getSetting: function (settingName, defaultValue) {
			var settingModel = container.getSettingsModel();
			var value = settingModel.get("zarafa/v1/plugins/kendox/" + settingName);
			if (value === undefined) {
				value = defaultValue;
			}
			return value;
		},

		/**
		 * Update the view with the new values of the settings
		 * model. Called when opening the settings widget or when a new
		 * folder is selected.
		 *
		 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to display.
		 */
		update: function (settingsModel) {
			this.model = settingsModel;
			this.max_attachments_number = this.model.get(
				"zarafa/v1/plugins/kendox/max_attachments_number",
			);
			this.max_attachments_size_mb = this.model.get(
				"zarafa/v1/plugins/kendox/max_attachments_size_mb",
			);
			this.environment = this.model.get("zarafa/v1/plugins/kendox/environment");
			this.api_url = this.model.get("zarafa/v1/plugins/kendox/api_url");
			this.api_url_test = this.model.get(
				"zarafa/v1/plugins/kendox/api_url_test",
			);
			this.dialog_url = this.model.get("zarafa/v1/plugins/kendox/dialog_url");
			this.dialog_url_test = this.model.get(
				"zarafa/v1/plugins/kendox/dialog_url_test",
			);
		},

		/**
		 * Called by the {@link Zarafa.settings.ui.SettingsCategory Category} when
		 * it has been called with {@link zarafa.settings.ui.SettingsCategory#updateSettings}.
		 * This is used to update the settings from the UI into the {@link Zarafa.settings.SettingsModel settings model}.
		 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to update
		 */
		updateSettings: function (settingsModel) {
			this.model.beginEdit();
			this.model.set(
				"zarafa/v1/plugins/kendox/max_attachments_number",
				this.max_attachments_number,
			);
			this.model.set(
				"zarafa/v1/plugins/kendox/max_attachments_size_mb",
				this.max_attachments_size_mb,
			);
			this.model.set("zarafa/v1/plugins/kendox/api_url", this.api_url);
			this.model.set(
				"zarafa/v1/plugins/kendox/api_url_test",
				this.api_url_test,
			);
			this.model.set("zarafa/v1/plugins/kendox/dialog_url", this.dialog_url);
			this.model.set(
				"zarafa/v1/plugins/kendox/dialog_url_test",
				this.dialog_url_test,
			);
			this.model.endEdit();
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
			var originalValue = this.model.get("zarafa/v1/plugins/kendox/" + field.name);
			if (originalValue !== value) {
				this.model.setDirty();
			}
		},
	},
);

Ext.reg(
	"zarafa.settingskendoxwidget",
	Zarafa.plugins.kendox.js.settings.SettingsKendoxWidget,
);
