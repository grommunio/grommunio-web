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
	 * This property will only be true if filepreviewer plugin's settings has been applied on UI.
	 * @property
	 * @type Boolean
	 */
	pluginSettingsApplied: false,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function (config)
	{
	    config = config || {};

	    var zoomStore = new Ext.data.JsonStore({
	        fields: ['name', 'value'],
	        data: [{
	            'name': _('Auto'),
	            'value': 'auto'
	        },{
	            'name': _('Actual size'),
	            'value': 'page-actual'
	        },{
	            'name': _('Page width'),
	            'value': 'page-width'
	        }]
	    });

	    var items = [{
	        xtype: 'checkbox',
	        name: 'zarafa/v1/main/file_previewer/enable',
	        pluginSettingPath: 'zarafa/v1/plugins/filepreviewer/enable',
	        ref: 'enableFilePreviewer',
	        boxLabel: _('Attachment preview (PDF and Open formats)'),
			handler: this.onClickEnableFilePreviewer,
	        hideLabel: true,
			scope: this,
	        listeners: {
	            change: this.onFieldChange,
	            scope: this
	        }
	    }];

	    items = items.concat(this.createZoomDropdownBox([{
	            name:'zarafa/v1/main/file_previewer/odf_zoom',
	            ref: 'odfZoom',
	            store: zoomStore,
	            fieldLabel: _('Document default zoom'),
	        },{
	            name:'zarafa/v1/main/file_previewer/pdf_zoom',
	            ref: 'pdfZoom',
	            store: zoomStore,
	            fieldLabel: _('PDF zoom')
	        }
	    ]));

	    Ext.applyIf(config, {
	        xtype: 'zarafa.settingsdisplaywidget',
	        title: _('File previewing'),
	        layout: 'form',
	        hidden: !container.getServerConfig().isFilePreviewerEnabled(),
	        items: items
	    });
	    Zarafa.settings.ui.SettingsFilePreviewerWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Creates and returns a dropdown box for the required combo.
	 *
	 * @param {Object} configs The configuration object used for the combo.
	 */
	createZoomDropdownBox: function(configs)
	{
	    var items = [];
	    for (var config of configs) {
	        items.push(
				Object.assign(config, {
	            	xtype: 'combo',
	            	width: 125,
	            	mode: 'local',
	            	triggerAction: 'all',
	            	displayField: 'name',
	            	valueField: 'value',
	            	lazyInit: false,
	            	forceSelection: true,
	            	editable: false,
	            	autoSelect: true,
	            	listeners: {
	            	    change: this.onDefaultZoomSelect,
	            	    scope: this
	            	}
	        	})
			);
	    }
	    return items;
	},

	/**
	 * Handler can uncheck and disable the {@link #odfZoom Document default Zoom} and {@link #pdfZoom PDF Zoom}
	 * combo if {@link #enableFilePreviewer Enable File Previewer} checkbox is unchecked and vice versa
	 * based on user settings.
	 *
	 * @param {Ext.form.CheckBox} checkbox The Enable File Previewer checkbox element
	 * @param {Boolean} checked State of the checkbox
	 */
	onClickEnableFilePreviewer: function(checkbox, checked)
	{
		this.odfZoom.setDisabled(!checked);
		this.pdfZoom.setDisabled(!checked);
		this.odfZoom.disableLabel(!checked);
		this.pdfZoom.disableLabel(!checked);
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link zarafa.settings.ui.SettingsCategory#update}.
	 * This is used to load the latest version of the settings from the
	 * {@link Zarafa.settings.SettingsModel} into the UI of this category.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to load
	 */
	update: function (settingsModel)
	{
		this.model = settingsModel;
		// Check if filepreviewer plugin's setings are available then apply them on UI.
		var pluginSetting = settingsModel.get('zarafa/v1/plugins/filepreviewer/enable');
		this.pluginSettingsApplied = Ext.isDefined(pluginSetting);

		var enableFilePreviewer = this.pluginSettingsApplied ? pluginSetting : settingsModel.get(this.enableFilePreviewer.name);
		this.enableFilePreviewer.setValue(enableFilePreviewer);

		// PDF zoom
		this.pdfZoom.setValue(settingsModel.get(this.pdfZoom.name));
		this.pdfZoom.setDisabled(!enableFilePreviewer);
		this.pdfZoom.disableLabel(!enableFilePreviewer);

		// ODF zoom
		this.odfZoom.setValue(settingsModel.get(this.odfZoom.name));
		this.odfZoom.setDisabled(!enableFilePreviewer);
		this.odfZoom.disableLabel(!enableFilePreviewer);
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link zarafa.settings.ui.SettingsCategory#updateSettings}.
	 * This is used to update the settings from the UI into the {@link Zarafa.settings.SettingsModel settings model}.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to update
	 */
	updateSettings: function (settingsModel)
	{
		// Remove unnecessary plugin's settings as we have removed file previewer plugin.
		// And save current settings in webapp's main settings.
		if (this.pluginSettingsApplied) {
			settingsModel.remove('zarafa/v1/plugins/filepreviewer', {type: 'deprecated'});
		}
		settingsModel.set(this.enableFilePreviewer.name, this.enableFilePreviewer.getValue());

		// Set the value for PDF zoom
		settingsModel.set(this.pdfZoom.name, this.pdfZoom.getValue());

		// Set the value for ODFzoom
		settingsModel.set(this.odfZoom.name, this.odfZoom.getValue());
	},

	/**
	 * Event handler which is called when one of the textfields has been changed.
	 * This will apply the new value to the settings.
	 * @param {Ext.form.Field} field The field which has fired the event
	 * @param {String} value The new value
	 * @private
	 */
	onFieldChange: function(field, value)
	{
		if (this.model) {
			// FIXME: The settings model should be able to detect if
			// a change was applied
			var property = this.pluginSettingsApplied && Ext.isDefined(field['pluginSettingPath']) ? 'pluginSettingPath' : 'name';
			if (this.model.get(field[property]) !== value) {
				this.model.set(field[property], value);
			}
		}
	},

	/**
	 * Event handler which is fired when a default zoom in the {@link Ext.form.ComboBox combobox}
	 * has been selected.
	 * @param {Ext.form.ComboBox} field The field which fired the event
	 * @param {Ext.data.Record} record The selected record
	 */
	onDefaultZoomSelect : function(field, record)
	{
		if (this.model) {
			if (this.model.get(field.name) !== field.getValue()) {
				this.model.set(field.name, field.getValue());
			}
		}
	}

});

Ext.reg('zarafa.settingsfilepreviewerwidget', Zarafa.settings.ui.SettingsFilePreviewerWidget);
