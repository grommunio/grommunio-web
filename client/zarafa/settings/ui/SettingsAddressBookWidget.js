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
	 * @cfg {Zarafa.addressbook.AddressBookHierarchyStore} store which can be used to store all available addressbooks.
	 */
	store : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		var hierarchyTpl = new Ext.XTemplate(
			'<tpl for=".">',
				'<div class="x-combo-list-item">',
					'{depth:indent}{display_name:htmlEncode}',
				'</div>',
			'</tpl>',
			{
				compiled : true
			}
		);

		if (Ext.isEmpty(config.store)) {
			config.store = new Zarafa.addressbook.AddressBookHierarchyStore();
		}

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
				store : config.store,
				mode: 'local',
				triggerAction: 'all',
				displayField : 'display_name',
				valueField : 'entryid',
				tpl : hierarchyTpl,
				lazyInit: false,
				forceSelection: true,
				editable: false,
				listeners : {
					select : this.onDefaultABSelect,
					render : this.onABComboRender,
					scope : this
				}
			}]
		});

		Zarafa.settings.ui.SettingsAddressBookWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler which is called when the {@link #store} has been loaded.
	 * If the is no settings than by default the 'Global Address Book' will be selected.
	 * @param {Ext.data.Store} store The store which was loaded
	 * @param {Ext.data.Record[]} records The records which were loaded from the store
	 * @param {Object} options The options which were used to load the data
	 * @private
	 */
	onHierarchyStoreLoad : function( store, records, options )
	{
		if (store.getCount() === 0) {
			// there aren't any records in the store
			// we can not select any value
			return;
		}

		var combo = this.defaultABCombo;

		var entryid = this.model.get(combo.name);
		var record;

		// get corresponding record from combo store as we want to use id comparison functions
		if (!Ext.isEmpty(entryid)) {
			record = store.getById(entryid);
		}

		if (Ext.isEmpty(record)){
			record = store.getAt(0);
		}

		combo.setValue(record.get(combo.valueField));
	},

	/**
	 * Function called after the {@link #render rendering} of {@link #defaultABCombo}.
	 * This will show the {@link Zarafa.common.ui.LoadMask loadMask} till the
	 * {@link Zarafa.addressbook.AddressBookHierarchyStore} will be loaded.
	 * This will send load request to get the available addressbook list.
	 * @param {Ext.Container} cmp The container in which the combobox is being rendered.
	 * @private.
	 */
	onABComboRender : function(cmp)
	{
		/*jslint unused: false*/
		var loadMask = new Zarafa.common.ui.LoadMask(cmp.wrap, {
			store : this.store,
			msgCls : 'x-mask-loading x-mask-loading-combo',
			removeMask : true
		});

		// send request to get addressbook hierarchy data
		this.store.load({
			actionType : Zarafa.core.Actions['list'],
			params : {
				subActionType : Zarafa.core.Actions['hierarchy']
			}
		});
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

		var hierarchyStore = this.store;
		if (hierarchyStore.getCount() === 0) {
			this.mon(hierarchyStore, 'load', this.onHierarchyStoreLoad, this, { single: true });
		} else {
			this.onHierarchyStoreLoad(hierarchyStore);
		}
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
