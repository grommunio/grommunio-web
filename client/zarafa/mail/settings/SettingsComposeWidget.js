Ext.namespace('Zarafa.mail.settings');

/**
 * @class Zarafa.mail.settings.SettingsComposeWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.settingscomposewidget
 *
 * The {@link Zarafa.settings.ui.SettingsWidget widget} for configuring
 * the composing mail options in the {@link Zarafa.mail.settings.SettingsMailCategory mail category}.
 */
Zarafa.mail.settings.SettingsComposeWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		var composerStore = {
			xtype : 'jsonstore',
			autoDestroy : true,
			fields : ['name', 'value'],
			data : [{
				'name' : _('HTML'),
				'value' : 'html'
			},{
				'name' : _('Plain Text'),
				'value' : 'plain'
			}]
		};

		var fontFamilies = Zarafa.common.ui.htmleditor.Fonts.getFontFamilies();
		var fontData = fontFamilies.split(";").map(function(font) {
			return {
				'name' : font.split("=")[0],
				'value' : font.split("=")[1].toLowerCase()
			};
		});

		var fontStore = {
			xtype : 'jsonstore',
			autoDestroy : true,
			fields : ['name', 'value'],
			data : fontData
		};

		var fontSizes = Zarafa.common.ui.htmleditor.Fonts.getFonts();
		// To understand the sorting of the keys, please read the
		// comment in Zarafa.common.ui.htmleditor.Fonts.getFonts
		var fontSizesKeys = Object.keys(fontSizes).sort();
		var fontSizeData = [];
		Ext.each(fontSizesKeys, function(key){
			fontSizeData.push({'name' : fontSizes[key] + 'pt', 'value' : key });
		});

		var fontSizeStore = {
			xtype : 'jsonstore',
			autoDestroy : true,
			fields : ['name', 'value'],
			data : fontSizeData
		};

		Ext.applyIf(config, {
			title : _('Compose mail settings'),
			layout : 'form',
			items : [{
				xtype : 'combo',
				name : 'zarafa/v1/contexts/mail/dialogs/mailcreate/use_html_editor',
				ref : 'composerCombo',
				fieldLabel : _('Compose mail in this format'),
				width : 200,
				store : composerStore,
				mode: 'local',
				triggerAction: 'all',
				displayField: 'name',
				valueField: 'value',
				lazyInit: false,
				forceSelection: true,
				editable: false,
				autoSelect: true,
				listeners : {
					select : this.onComposerSelect,
					scope : this
				}
			},{
				xtype : 'combo',
				name : 'zarafa/v1/main/default_font',
				cls:'x-font-select',
				fieldLabel : _('Default font'),
				width : 200,
				ref : 'fontCombo',
				store : fontStore,
				triggerAction : 'all',
				mode : 'local',
				displayField : 'name',
				valueField : 'value',
				editable : false,
				autoSelect : true,
				forceSelection : true,
				lazyInit : false,
				listeners : {
					select : this.onFontSelect,
					scope : this
				}
			},{
				xtype : 'combo',
				name : 'zarafa/v1/main/default_font_size',
				cls:'x-font-select',
				fieldLabel : _('Default font size'),
				width : 200,
				ref : 'fontSizeCombo',
				store : fontSizeStore,
				triggerAction : 'all',
				mode : 'local',
				displayField : 'name',
				valueField : 'value',
				editable : false,
				autoSelect : true,
				forceSelection : true,
				lazyInit : false,
				listeners : {
					select : this.onFontSelect,
					scope : this
				}
			},{
				xtype : 'checkbox',
				name : 'zarafa/v1/contexts/mail/always_request_readreceipt',
				ref : 'readBox',
				boxLabel : _('Always request a read receipt'),
				hideLabel : true,
				listeners : {
					check : this.onFieldChange,
					scope : this
				}
			},{
				xtype: 'zarafa.compositefield',
				plugins: [ 'zarafa.splitfieldlabeler' ],
				// # TRANSLATORS: The {A} _must_ always be at the start of the translation
				// # The '{B}' represents the number of minutes which the user will type in.
				fieldLabel: _('{A}AutoSave unsent mail every {B} minute(s)'),
				labelWidth: 250,
				combineErrors: false,
				items: [{
					xtype : 'checkbox',
					labelSplitter: '{A}',
					name : 'zarafa/v1/contexts/mail/autosave_enable',
					ref : '../autoSaveBox',
					boxLabel : '',
					hideLabel : true,
					checked : true,
					listeners : {
						check : this.onAutoSaveCheckBoxChange,
						change : this.onFieldChange,
						scope : this
					}
				},{
					xtype: 'zarafa.spinnerfield',
					labelSplitter: '{B}',
					vtype: 'naturalInteger',
					name : 'zarafa/v1/contexts/mail/autosave_time',
					ref : '../autoSaveTimeSpinner',
					incrementValue: 1,
					defaultValue: 1,
					minValue : 1,
					allowBlank: false,
					allowDecimals: false,
					allowNegative: false,
					listeners: {
						change: this.onFieldChange,
						scope: this
					},
					plugins: ['zarafa.numberspinner']
				}]
			}]
		});

		Zarafa.mail.settings.SettingsComposeWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link zarafa.settings.ui.SettingsCategory#update}.
	 * This is used to load the latest version of the settings from the
	 * {@link Zarafa.settings.SettingsModel} into the UI of this category.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to load
	 */
	update : function(settingsModel)
	{
		this.model = settingsModel;

		// If not defined, we have a fallback setting
		var useHtml = settingsModel.get(this.composerCombo.name);

		this.composerCombo.setValue(useHtml ? 'html' : 'plain');

		this.fontCombo.setValue(settingsModel.get(this.fontCombo.name));
		this.fontSizeCombo.setValue(settingsModel.get(this.fontSizeCombo.name));

		// disable font and font size combos for plain text compose option
		this.fontCombo.setDisabled(useHtml !== true);
		this.fontSizeCombo.setDisabled(useHtml !== true);

		this.readBox.setValue(settingsModel.get(this.readBox.name));

		// Set values in autoSave checkbox and textfield.
		var enabled = settingsModel.get(this.autoSaveBox.name);

		this.autoSaveBox.setValue(enabled);
		this.autoSaveTimeSpinner.setValue(settingsModel.get(this.autoSaveTimeSpinner.name) / 60);

	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link zarafa.settings.ui.SettingsCategory#updateSettings}.
	 * This is used to update the settings from the UI into the {@link Zarafa.settings.SettingsModel settings model}.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to update
	 */
	updateSettings : function(settingsModel)
	{
		var spinnerValue = this.autoSaveTimeSpinner.getValue();

		if(spinnerValue === 0 || !Ext.isDefined(spinnerValue))  {
			spinnerValue = settingsModel.get('zarafa/v1/contexts/mail/autosave_time', false, true);
		}
		else {
			spinnerValue = spinnerValue * 60;
		}
		settingsModel.beginEdit();
		settingsModel.set(this.composerCombo.name, this.composerCombo.getValue() === 'html');
		settingsModel.set(this.readBox.name, this.readBox.getValue());
		settingsModel.set(this.autoSaveTimeSpinner.name, spinnerValue);
		settingsModel.endEdit();
	},

	/**
	 * Event handler which is called when a selection has been made in the
	 * Composer type {@link Ext.form.ComboBox combobox}.
	 * @param {Ext.form.ComboBox} field The field which fired the event
	 * @param {Ext.data.Record} record The selected record
	 */
	onComposerSelect : function(field, record)
	{
		if (this.model) {
			var set = record.get(field.valueField);

			// FIXME: The settings model should be able to detect if
			// a change was applied
			if (this.model.get(field.name) !== set) {
				this.model.set(field.name, set === 'html');
			}

			// disable font and font size combos for plain text compose option
			this.fontCombo.setDisabled(set !== 'html');
			this.fontSizeCombo.setDisabled(set !== 'html');
		}
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
	},

	/**
	 * Event handler which is fired when the {@link Ext.form.Checkbox Checkbox} has been clicked.
	 * @param {Ext.form.Checkbox} checkbox The checkbox which fired the event
	 * @param {Boolean} check True if the checkbox is currently checked
	 * @private
	 */
	onAutoSaveCheckBoxChange : function(checkbox, check)
	{
		// Checkbox's check event doesn't fire change event on element in
		// chrome and IE browser, so calling onFieldChange event manually.
		this.onFieldChange(checkbox, check);
		this.autoSaveTimeSpinner.setDisabled(!check);
	},

	/**
	 * Event handler which is called when a selection has been made in the
	 * Font selection {@link Ext.form.ComboBox combobox}.
	 * @param {Ext.form.ComboBox} field The field which fired the event
	 * @param {Ext.data.Record} record The selected record
	 */
	onFontSelect : function(field, record)
	{
		if (this.model) {
			var value = record.get(field.valueField);
			// FIXME: The settings model should be able to detect if
			// a change was applied
			if(this.model.get(field.name) !== value) {
				this.model.set(field.name, value);
			}
		}
	}
});

Ext.reg('zarafa.settingscomposewidget', Zarafa.mail.settings.SettingsComposeWidget);
