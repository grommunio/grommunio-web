Ext.namespace('Zarafa.common.settings');

/**
 * @class Zarafa.common.settings.SettingsSendAsWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.settingssendaswidget
 *
 * The {@link Zarafa.settings.ui.SettingsWidget widget} for configuring
 * send as options in the {@link Zarafa.common.settings.SettingsSendAsCategory sendas category}.
 */
Zarafa.common.settings.SettingsSendAsWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		var store = new Zarafa.core.data.IPMRecipientStore({
			autoResolve : false,
			autoDestroy : true
		});

		Ext.applyIf(config, {
			height : 400,
			title : _('From Addresses settings'),
			xtype : 'zarafa.settingssendaswidget',
			layout : {
				// override from SettingsWidget
				type : 'fit'
			},
			items : [{
				xtype : 'zarafa.sendaspanel',
				store : store,
				ref : 'sendasPanel'
			}]
		});

		Zarafa.common.settings.SettingsSendAsWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Returns the {@link Zarafa.core.data.IPMRecipientStore IPMRecipientStore} associated
	 * with this panel.
	 * @return {Zarafa.core.data.IPMRecipientStore} The store
	 */
	getStore : function()
	{
		return this.sendasPanel.store;
	},

	/**
	 * Initialize events for the panel.
	 * @private
	 */
	initEvents : function()
	{
		Zarafa.common.settings.SettingsSendAsWidget.superclass.initEvents.call(this);

		this.mon(this.getStore(), {
			'remove' : this.doStoreRemove,
			'update' : this.doStoreUpdate,
			'add' : this.doStoreAdd,
			scope : this
		});
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

		// Convert the send as into Store data
		var addresses = settingsModel.get('zarafa/v1/contexts/mail/sendas', true);

		var addressData = {'item' : []};
		Ext.each(addresses, function(address, index) {
			addressData.item.push({props : address});
		});

		// Load all addresses into the Store
		this.getStore().loadData(addressData);
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link zarafa.settings.ui.SettingsCategory#updateSettings}.
	 * This is used to update the settings from the UI into the {@link Zarafa.settings.SettingsModel settings model}.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to update
	 */
	updateSettings : function(settingsModel)
	{
		// Start reading the Grid store and convert the contents back into
		// an object which can be pushed to the settings.
		var addresses = this.getStore().getRange();
		addresses = Ext.pluck(addresses, 'data');

		// removing unnecessary props, some required props of recipient record is going to be stored into setting.
		for (var i = 0; i < addresses.length; i++) {
			var address = addresses[i];

			delete address.proposednewtime;
			delete address.proposednewtime_end;
			delete address.proposednewtime_start;
			delete address.recipient_flags;
			delete address.recipient_trackstatus;
			delete address.recipient_trackstatus_time;
		}

		settingsModel.set('zarafa/v1/contexts/mail/sendas', addresses);
	},

	/**
	 * Event handler for the {@link Ext.data.Store#remove} event which is fired
	 * by the {@link Ext.data.Store} inside the {@link #sendasPanel}.
	 * This will mark the {@link Zarafa.settings.SettingsContextModel} as
	 * {@link Zarafa.settings.SettingsContextModel#setDirty dirty}.
	 * @param {Ext.data.Store} store The store which fired the event
	 * @param {Ext.data.Record} record The record which was updated
	 * @param {Number} index index of the record in store which is removed
	 * @private
	 */
	doStoreRemove : function(store, record, index)
	{
		if(!record.phantom) {
			this.settingsContext.getModel().setDirty();
		}
	},

	/**
	 * Event handler for the {@link Ext.data.Store#add} event which is fired
	 * by the {@link Ext.data.Store} inside the {@link #sendasPanel}.
	 * This will mark the {@link Zarafa.settings.SettingsContextModel} as
	 * {@link Zarafa.settings.SettingsContextModel#setDirty dirty} while
	 * send as was added from address book only.
	 * @param {Ext.data.Store} store The store which fired the event
	 * @param {Array} records An Array of {@link Ext.data.Record record} objects which are added to store
	 * @param {Number} index index of the record in store which is removed
	 * @private
	 */
	doStoreAdd : function(store, records, index)
	{
		/*
		 * In case of externally added send as, we will configure oneoff entryid
		 * after the send as is added into store. Means entryid is configured only if
		 * record is added from address book.
		 * Additionally, Multiple send as will be added from address book only,
		 * So we just need to check for the first record.
		 */
		if (!Ext.isEmpty(records[0].get('entryid'))) {
			// mark the model as dirty as the new send as is added
			this.settingsContext.getModel().setDirty();
		}
	},

	/**
	 * Event handler for the {@link Ext.data.Store#update} event which is fired
	 * by the {@link Ext.data.Store} inside the {@link #sendasPanel}.
	 * This will mark the {@link Zarafa.settings.SettingsContextModel} as
	 * {@link Zarafa.settings.SettingsContextModel#setDirty dirty}.
	 * @param {Ext.data.Store} store The store which fired the event
	 * @param {Ext.data.Record} record The record which was updated
	 * @param {String} operation The update operation being performed.
	 * @private
	 */
	doStoreUpdate : function(store, record, operation)
	{
		if (operation !== Ext.data.Record.COMMIT) {
			this.settingsContext.getModel().setDirty();
		}
	}
});

Ext.reg('zarafa.settingssendaswidget', Zarafa.common.settings.SettingsSendAsWidget);
