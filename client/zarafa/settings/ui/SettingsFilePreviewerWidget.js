Ext.namespace('Zarafa.settings.ui');

/**
 * @class Zarafa.settings.ui.SettingsFilePreviewerWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.settingsfilepreviewerwidget
 *
 * The Webapp Display settings widget. Gives the option to preview the supported files.
 */
Zarafa.settings.ui.SettingsFilePreviewerWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function (config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'zarafa.settingsdisplaywidget',
			title: _('File previewing'),
			layout: 'form',
			hidden: !container.getServerConfig().isFilePreviewerEnabled(),
			items:[{
				xtype : 'checkbox',
				name : 'zarafa/v1/main/file_previewer/enable',
				ref : 'enableFilePreviewer',
				boxLabel : _('Attachment preview (PDF, Open formats and images)'),
				hideLabel : true,
				listeners : {
					change : this.onFieldChange,
					scope : this
				}
			}]
		});
		Zarafa.settings.ui.SettingsFilePreviewerWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link zarafa.settings.ui.SettingsCategory#update}.
	 * This is used to load the latest version of the settings from the
	 * {@link Zarafa.settings.SettingsModel} into the UI of this category.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to load
	 */
	update : function (settingsModel)
	{
		this.model = settingsModel;
		this.enableFilePreviewer.setValue(settingsModel.get(this.enableFilePreviewer.name));
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link zarafa.settings.ui.SettingsCategory#updateSettings}.
	 * This is used to update the settings from the UI into the {@link Zarafa.settings.SettingsModel settings model}.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to update
	 */
	updateSettings : function (settingsModel)
	{
		settingsModel.set(this.enableFilePreviewer.name, this.enableFilePreviewer.getValue());
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

Ext.reg('zarafa.settingsfilepreviewerwidget', Zarafa.settings.ui.SettingsFilePreviewerWidget);
