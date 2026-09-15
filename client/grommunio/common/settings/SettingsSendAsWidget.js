/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.settings');

/**
 * @class Grommunio.common.settings.SettingsSendAsWidget
 * @extends Grommunio.settings.ui.SettingsWidget
 * @xtype grommunio.settingssendaswidget
 *
 * The {@link Grommunio.settings.ui.SettingsWidget widget} for configuring
 * send as options in the {@link Grommunio.common.settings.SettingsSendAsCategory sendas category}.
 */
Grommunio.common.settings.SettingsSendAsWidget = Ext.extend(Grommunio.settings.ui.SettingsWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			height: 400,
			title: _('From Addresses settings'),
			cls: 'grommunio-settings-widget k-settings-nogap',
			xtype: 'grommunio.settingssendaswidget',
			layout: {
				// override from SettingsWidget
				type: 'fit'
			},
			items: [{
				xtype: 'grommunio.sendaspanel',
				ref: 'sendasPanel'
			}]
		});

		Grommunio.common.settings.SettingsSendAsWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Returns the {@link Grommunio.core.data.IPMRecipientStore IPMRecipientStore} associated
	 * with this panel.
	 * @return {Grommunio.core.data.IPMRecipientStore} The store
	 */
	getStore: function()
	{
		return this.sendasPanel.getStore();
	},

	/**
	 * Initialize events for the panel.
	 * @private
	 */
	initEvents: function()
	{
		Grommunio.common.settings.SettingsSendAsWidget.superclass.initEvents.call(this);

		this.mon(this.getStore(), {
			'remove': this.doStoreRemove,
			'update': this.doStoreUpdate,
			'add': this.doStoreAdd,
			scope: this
		});
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

		// Convert the send as into Store data
		var addresses = settingsModel.get('grommunio/v1/contexts/mail/sendas', true);

		var addressData = {'item': []};
		Ext.each(addresses, function(address, index) {
			addressData.item.push({props: address});
		});

		// Load all addresses into the Store
		this.getStore().loadData(addressData);
	},

	/**
	 * Called by the {@link Grommunio.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link grommunio.settings.ui.SettingsCategory#updateSettings}.
	 * This is used to update the settings from the UI into the {@link Grommunio.settings.SettingsModel settings model}.
	 * @param {Grommunio.settings.SettingsModel} settingsModel The settings to update
	 */
	updateSettings: function(settingsModel)
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

		settingsModel.set('grommunio/v1/contexts/mail/sendas', addresses);
	},

	/**
	 * Event handler for the {@link Ext.data.Store#remove} event which is fired
	 * by the {@link Ext.data.Store} inside the {@link #sendasPanel}.
	 * This will mark the {@link Grommunio.settings.SettingsContextModel} as
	 * {@link Grommunio.settings.SettingsContextModel#setDirty dirty}.
	 * @param {Ext.data.Store} store The store which fired the event
	 * @param {Ext.data.Record} record The record which was updated
	 * @param {Number} index index of the record in store which is removed
	 * @private
	 */
	doStoreRemove: function(store, record, index)
	{
		if(!record.phantom) {
			this.settingsContext.getModel().setDirty();
		}
	},

	/**
	 * Event handler for the {@link Ext.data.Store#add} event which is fired
	 * by the {@link Ext.data.Store} inside the {@link #sendasPanel}.
	 * This will mark the {@link Grommunio.settings.SettingsContextModel} as
	 * {@link Grommunio.settings.SettingsContextModel#setDirty dirty} while
	 * send as was added from address book only.
	 * @param {Ext.data.Store} store The store which fired the event
	 * @param {Array} records An Array of {@link Ext.data.Record record} objects which are added to store
	 * @param {Number} index index of the record in store which is removed
	 * @private
	 */
	doStoreAdd: function(store, records, index)
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
	 * This will mark the {@link Grommunio.settings.SettingsContextModel} as
	 * {@link Grommunio.settings.SettingsContextModel#setDirty dirty}.
	 * @param {Ext.data.Store} store The store which fired the event
	 * @param {Ext.data.Record} record The record which was updated
	 * @param {String} operation The update operation being performed.
	 * @private
	 */
	doStoreUpdate: function(store, record, operation)
	{
		if (operation !== Ext.data.Record.COMMIT) {
			this.settingsContext.getModel().setDirty();
		}
	}
});

Ext.reg('grommunio.settingssendaswidget', Grommunio.common.settings.SettingsSendAsWidget);
