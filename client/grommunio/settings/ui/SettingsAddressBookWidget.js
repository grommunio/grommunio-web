/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.settings.ui');

/**
 * @class Grommunio.settings.ui.SettingsAddressBookWidget
 * @extends Grommunio.settings.ui.SettingsWidget
 * @xtype grommunio.settingsaddressbookwidget
 *
 * The default Addressbook Configuration widget
 */
Grommunio.settings.ui.SettingsAddressBookWidget = Ext.extend(Grommunio.settings.ui.SettingsWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		var hierarchyTpl = new Ext.XTemplate(
			'<tpl for=".">',
				'<div class="x-combo-list-item<tpl if="group_header"> k-combo-list-item-header</tpl>">',
					'{depth:indent}{display_name:htmlEncode}',
				'</div>',
			'</tpl>',
			{
				compiled: true
			}
		);

		var nameFormatStore = new Ext.data.ArrayStore({
			fields: ['value', 'label'],
			data: [
				['lastfirst', _('Last Name, First Name')],
				['firstlast', _('First Name Last Name')]
			]
		});

		Ext.applyIf(config, {
			xtype: 'grommunio.settingsaddressbookwidget',
			title: _('Address Book'),
			layout: 'form',
			items: [{
				xtype: 'combo',
				fieldLabel: _('Select Default Folder'),
				name: 'grommunio/v1/main/default_addressbook',
				ref: 'defaultABCombo',
				width: 200,
				store: Grommunio.addressbook.AddressBookHierarchyStore,
				mode: 'local',
				triggerAction: 'all',
				displayField: 'display_name',
				valueField: 'entryid',
				tpl: hierarchyTpl,
				lazyInit: false,
				forceSelection: true,
				editable: false,
				listeners: {
					beforeselect: this.onBeforeDefaultABSelect,
					select: this.onDefaultABSelect,
					scope: this
				}
			},{
				xtype: 'combo',
				fieldLabel: _('Name Display Format'),
				name: 'grommunio/v1/main/addressbook_name_format',
				ref: 'nameFormatCombo',
				width: 200,
				store: nameFormatStore,
				mode: 'local',
				triggerAction: 'all',
				displayField: 'label',
				valueField: 'value',
				forceSelection: true,
				editable: false,
				listeners: {
					select: this.onNameFormatSelect,
					scope: this
				}
			}]
		});

		Grommunio.settings.ui.SettingsAddressBookWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler for the onbeforeselect event of the Address Book combo. Will
	 * make sure group headers cannot be selected.
	 *
	 * @param {Ext.form.ComboBox} combo The Address Book combobox
	 * @param {Grommunio.core.data.IPMRecord IPMRecord} record The selected Address Book record
	 * @param {Number} index The index of the selected record in the combo
	 */
	onBeforeDefaultABSelect: function(combo, record, index)
	{
		return !record.get('group_header');
	},

	/**
	 * Event handler which is fired when a Address book name in the {@link Ext.form.ComboBox combobox}
	 * has been selected.
	 * @param {Ext.form.ComboBox} combo The combobox which fired the event
	 * @param {Ext.data.Record} record The selected record in the combobox
	 * @param {Number} index The selected index in the store
	 * @private
	 */
	onDefaultABSelect: function(combo, record, index)
	{
		var value = record.get(combo.valueField);
		if (this.model) {
			this.model.set(combo.name, value);
		}
	},

	/**
	 * Event handler which is fired when a name format in the {@link Ext.form.ComboBox combobox}
	 * has been selected.
	 * @param {Ext.form.ComboBox} combo The combobox which fired the event
	 * @param {Ext.data.Record} record The selected record in the combobox
	 * @param {Number} index The selected index in the store
	 * @private
	 */
	onNameFormatSelect: function(combo, record, index)
	{
		if (this.model) {
			this.model.set(combo.name, record.get(combo.valueField));
		}
	},

	/**
	 * Called by the {@link Grommunio.settings.ui.SettingsCategoryWidgetPanel widget panel}
	 * to load the latest version of the settings from the
	 * {@link Grommunio.settings.SettingsModel} into the UI of this category.
	 * @param {Grommunio.settings.SettingsModel} settingsModel The settings to load
	 */
	update: function(settingsModel)
	{
		Grommunio.settings.ui.SettingsAddressBookWidget.superclass.update.apply(this, arguments);
		this.model = settingsModel;

		if (Grommunio.addressbook.AddressBookHierarchyStore.getCount() === 0) {
			// there aren't any records in the store
			// we can not select any value
			return;
		}

		var combo = this.defaultABCombo;

		var entryid = this.model.get(combo.name);
		var record;

		// get corresponding record from combo store as we want to use id comparison functions
		if (!Ext.isEmpty(entryid)) {
			record = Grommunio.addressbook.AddressBookHierarchyStore.getById(entryid);
		}

		if (Ext.isEmpty(record)){
			record = Grommunio.addressbook.AddressBookHierarchyStore.getAt(0);
		}

		combo.setValue(record.get(combo.valueField));

		var nameFormat = this.model.get(this.nameFormatCombo.name) || 'lastfirst';
		this.nameFormatCombo.setValue(nameFormat);
	},

	/**
	 * Called by the {@link Grommunio.settings.ui.SettingsCategoryWidgetPanel widget panel}
	 * to update the settings from the UI into the {@link Grommunio.settings.SettingsModel settings model}.
	 * @param {Grommunio.settings.SettingsModel} settingsModel The settings to update
	 */
	updateSettings: function(settingsModel)
	{
		Grommunio.settings.ui.SettingsAddressBookWidget.superclass.updateSettings.apply(this, arguments);
		settingsModel.set(this.defaultABCombo.name, this.defaultABCombo.getValue());
		settingsModel.set(this.nameFormatCombo.name, this.nameFormatCombo.getValue());
	}
});

Ext.reg('grommunio.settingsaddressbookwidget', Grommunio.settings.ui.SettingsAddressBookWidget);
