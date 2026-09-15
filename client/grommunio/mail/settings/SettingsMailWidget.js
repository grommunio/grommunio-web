Ext.namespace('Grommunio.mail.settings');

/**
 * @class Grommunio.mail.settings.SettingsMailWidget
 * @extends Grommunio.settings.ui.SettingsWidget
 * @xtype grommunio.settingsmailwidget
 *
 * The {@link Grommunio.settings.ui.SettingsWidget widget} for configuring
 * the general mail options in the {@link Grommunio.mail.settings.SettingsMailCategory mail category}.
 */
Grommunio.mail.settings.SettingsMailWidget = Ext.extend(Grommunio.settings.ui.SettingsWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		var previewStore = {
			xtype: 'jsonstore',
			autoDestroy: true,
			fields: ['name', 'value'],
			data: [{
				'name': _('No preview'),
				'value': Grommunio.mail.data.ViewModes.NO_PREVIEW
			},{
				'name': _('Right'),
				'value': Grommunio.mail.data.ViewModes.RIGHT_PREVIEW
			},{
				'name': _('Bottom'),
				'value': Grommunio.mail.data.ViewModes.BOTTOM_PREVIEW
			}]
		};

		var delegateWastebasketStore = {
			xtype: 'jsonstore',
			autoDestroy: true,
			fields: ['name', 'value'],
			data: [{
				'name': _('Into mailbox owner\'s wastebasket'),
				'value': 4 // 4 = Stores deleted items in the mailbox owner's folder.
			},{
				'name': _('Into your wastebasket'),
				'value': 8 // 8 = Stores deleted items in your folder.
			}]
		};

		var items = [{
			xtype: 'combo',
			name: 'grommunio/v1/state/contexts/mail/current_view_mode',
			ref: 'previewCombo',
			fieldLabel: _('Location of preview pane'),
			width: 400,
			store: previewStore,
			mode: 'local',
			triggerAction: 'all',
			displayField: 'name',
			valueField: 'value',
			lazyInit: false,
			forceSelection: true,
			editable: false,
			autoSelect: true,
			listeners: {
				select: this.onComboSelect,
				scope: this
			}
		},{
			xtype: 'checkbox',
			name: 'grommunio/v1/contexts/mail/use_english_abbreviations',
			ref: 'englishAbb',
			/* Re is actually Latin, not English. */
			boxLabel: _('Use subject prefixes in accordance with RFC 5256/5322'),
			hideLabel: true,
			lazyInit: false,
			hidden: Grommunio.core.Util.inArray(['en_GB', 'en_GB.UTF-8', 'en_US', 'en_US.UTF-8'], container.getSettingsModel().get('grommunio/v1/main/language'), false, false),
			listeners: {
				check: this.onCheck,
				scope: this
			}
		},{
			xtype: 'checkbox',
			name: 'grommunio/v1/contexts/mail/close_on_respond',
			ref: 'closeCheck',
			boxLabel: _('Close original message on reply or forward'),
			hideLabel: true,
			lazyInit: false,
			listeners: {
				check: this.onCheck,
				scope: this
			}
		},{
			xtype: 'checkbox',
			name: 'grommunio/v1/contexts/mail/hover_actions',
			ref: 'hoverActions',
			boxLabel: _('Show quick actions when hovering over a list item'),
			hideLabel: true,
			lazyInit: false,
			listeners: {
				check: this.onCheck,
				scope: this
			}
		},{
			xtype: 'combo',
			name: 'grommunio/v1/contexts/mail/delegate_wastebasket_style',
			cls:'x-font-select',
			fieldLabel: _("Move items deleted in delegate's store"),
			width: 400,
			ref: 'delegateWastebasketStyleCombo',
			store: delegateWastebasketStore,
			triggerAction: 'all',
			mode: 'local',
			displayField: 'name',
			valueField: 'value',
			editable: false,
			autoSelect: true,
			forceSelection: true,
			lazyInit: false,
			listeners: {
				select: this.onComboSelect,
				scope: this
			}
		}];

		Ext.applyIf(config, {
			title: _('General mail settings'),
			layout: 'form',
			items: items
		});

		// Display the popout settings only if supported.
		if (Grommunio.supportsPopOut()) {
			config.items.splice(1, 0, {
				xtype: 'displayfield',
				hideLabel: true,
				value: _('Open or compose a mail item in a') + ':'
			},{
				xtype: 'radiogroup',
				name: 'grommunio/v1/main/base_content_layer',
				ref: 'openingMailField',
				columns: 1,
				hideLabel: true,
				items: [{
					xtype: 'radio',
					name: 'openingMail',
					inputValue: 'tabs',
					boxLabel: _('grommunio Web tab')
				},{
					xtype: 'radio',
					name: 'openingMail',
					inputValue: 'separateWindows',
					boxLabel: _('Browser window')
				}],
				listeners: {
					change: this.onRadioChange,
					scope: this
				}
			});
		}

		Grommunio.mail.settings.SettingsMailWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Called by the {@link Grommunio.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link grommunio.settings.ui.SettingsCategory#update}.
	 * This is used to load the latest version of the settings from the
	 * {@link Grommunio.settings.SettingsModel} into the UI of this category.
	 * @param {Grommunio.settings.SettingsModel} settingsModel The settings to load
	 */
	update: function(settingsModel)
	{
		this.model = settingsModel;

		var previewLocation = settingsModel.get(this.previewCombo.name);
		if(!Ext.isDefined(previewLocation)) {
			previewLocation = Grommunio.mail.data.ViewModes.RIGHT_PREVIEW;
		}
		this.previewCombo.setValue(previewLocation);
		this.closeCheck.setValue(settingsModel.get(this.closeCheck.name));
		this.hoverActions.setValue(settingsModel.get(this.hoverActions.name) !== false);
		this.englishAbb.setValue(settingsModel.get(this.englishAbb.name));

		if (Grommunio.supportsPopOut()) {
			this.openingMailField.setValue(settingsModel.get(this.openingMailField.name));
		}

		this.delegateWastebasketStyleCombo.setValue(settingsModel.get(this.delegateWastebasketStyleCombo.name));
	},

	/**
	 * Called by the {@link Grommunio.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link grommunio.settings.ui.SettingsCategory#updateSettings}.
	 * This is used to update the settings from the UI into the {@link Grommunio.settings.SettingsModel settings model}.
	 * @param {Grommunio.settings.SettingsModel} settingsModel The settings to update
	 */
	updateSettings: function(settingsModel)
	{
		settingsModel.set(this.previewCombo.name, this.previewCombo.getValue());
		settingsModel.set(this.closeCheck.name, this.closeCheck.getValue());
		settingsModel.set(this.hoverActions.name, this.hoverActions.getValue());

		if (Grommunio.supportsPopOut()) {
			settingsModel.set(this.openingMailField.name, this.openingMailField.getValue().inputValue);
		}
	},

	/**
	 * Event handler which is called when a selection has been made in the
	 * Preview Panel type {@link Ext.form.ComboBox combobox}.
	 * @param {Ext.form.ComboBox} field The field which fired the event
	 * @param {Ext.data.Record} record The selected record
	 */
	onComboSelect: function(field, record)
	{
		if (this.model) {
			var set = record.get(field.valueField);

			// FIXME: The settings model should be able to detect if
			// a change was applied
			if (this.model.get(field.name) !== set) {
				this.model.set(field.name, set);
			}
		}
	},

	/**
	 * Event handler called when checkbox has been modified
	 *
	 * @param {Ext.form.CheckBox} checkbox Checkbox element from which the event originated
	 * @param {Boolean} checked State of the checkbox
	 * @private
	 */
	onCheck: function(checkbox, checked)
	{
		if(this.model) {
			// FIXME: The settings model should be able to detect if
			// a change was applied
			if (this.model.get(checkbox.name) !== checked) {
				this.model.set(checkbox.name, checked);
			}
		}
	},

	/**
	 * Event handler which is fired when a {@link Ext.form.Radio} in the
	 * {@link Ext.form.RadioGroup} has been changed. This will set the value
	 * selected by user in settingsModel.
	 * @param {Ext.form.RadioGroup} group The radio group which fired the event
	 * @param {Ext.form.Radio} radio The radio which was enabled
	 * @private
	 */
	onRadioChange: function(group, radio)
	{
		if (this.model && (this.model.get(group.name) !== radio.inputValue)) {
			this.model.set(group.name, radio.inputValue);
		}
	}
});

Ext.reg('grommunio.settingsmailwidget', Grommunio.mail.settings.SettingsMailWidget);
