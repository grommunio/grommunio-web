Ext.namespace('Zarafa.settings.ui');

/**
 * @class Zarafa.settings.ui.SettingsAddressBookWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.settingsaddressbookwidget
 *
 * The default Addressbook Configuration widget
 */
Zarafa.settings.ui.SettingsAddressBookWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		var hierarchyTpl = new Ext.XTemplate(
			'<tpl for=".">',
				'<div class="x-combo-list-item<tpl if="group_header"> k-combo-list-item-header</tpl>">',
					'{depth:indent}{display_name:htmlEncode}',
				'</div>',
			'</tpl>',
			{
				compiled : true
			}
		);

		Ext.applyIf(config, {
			xtype : 'zarafa.settingsaddressbookwidget',
			title : _('Address Book'),
			layout : 'form',
			items : [{
				xtype : 'combo',
				fieldLabel : _('Select Default Folder'),
				name : 'zarafa/v1/main/default_addressbook',
				ref : 'defaultABCombo',
				width : 200,
				store : Zarafa.addressbook.AddressBookHierarchyStore,
				mode: 'local',
				triggerAction: 'all',
				displayField : 'display_name',
				valueField : 'entryid',
				tpl : hierarchyTpl,
				lazyInit: false,
				forceSelection: true,
				editable: false,
				listeners : {
					beforeselect: this.onBeforeDefaultABSelect,
					select : this.onDefaultABSelect,
					scope : this
				}
			}]
		});

		Zarafa.settings.ui.SettingsAddressBookWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler for the onbeforeselect event of the Address Book combo. Will
	 * make sure group headers cannot be selected.
	 *
	 * @param {Ext.form.ComboBox} combo The Address Book combobox
	 * @param {Zarafa.core.data.IPMRecord IPMRecord} record The selected Address Book record
	 * @param {Number} index The index of the selected record in the combo
	 */
	onBeforeDefaultABSelect : function(combo, record, index)
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
	onDefaultABSelect : function(combo, record, index)
	{
		var value = record.get(combo.valueField);
		if (this.model) {
			this.model.set(combo.name, value);
		}
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategoryWidgetPanel widget panel}
	 * to load the latest version of the settings from the
	 * {@link Zarafa.settings.SettingsModel} into the UI of this category.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to load
	 */
	update : function(settingsModel)
	{
		Zarafa.settings.ui.SettingsAddressBookWidget.superclass.update.apply(this, arguments);
		this.model = settingsModel;

		if (Zarafa.addressbook.AddressBookHierarchyStore.getCount() === 0) {
			// there aren't any records in the store
			// we can not select any value
			return;
		}

		var combo = this.defaultABCombo;

		var entryid = this.model.get(combo.name);
		var record;

		// get corresponding record from combo store as we want to use id comparison functions
		if (!Ext.isEmpty(entryid)) {
			record = Zarafa.addressbook.AddressBookHierarchyStore.getById(entryid);
		}

		if (Ext.isEmpty(record)){
			record = Zarafa.addressbook.AddressBookHierarchyStore.getAt(0);
		}

		combo.setValue(record.get(combo.valueField));
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategoryWidgetPanel widget panel}
	 * to update the settings from the UI into the {@link Zarafa.settings.SettingsModel settings model}.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to update
	 */
	updateSettings : function(settingsModel)
	{
		Zarafa.settings.ui.SettingsAddressBookWidget.superclass.updateSettings.apply(this, arguments);
		settingsModel.set(this.defaultABCombo.name, this.defaultABCombo.getValue());
	}
});

Ext.reg('zarafa.settingsaddressbookwidget', Zarafa.settings.ui.SettingsAddressBookWidget);
