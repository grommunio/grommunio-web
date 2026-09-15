/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.manageCc.ui');

/**
 * @class Grommunio.common.manageCc.ui.ManageCcPanel
 * @extends Ext.Panel
 * @xtype grommunio.manageccpanel
 *
 * Panel contains the {@link Grommunio.common.manageCc.ui.ManageCcGrid ManageCcGrid}.
 * which manages the default Cc recipient for new / reply mails.
 */
Grommunio.common.manageCc.ui.ManageCcPanel = Ext.extend(Ext.Panel, {

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};
		Ext.applyIf(config, {
			xtype: 'grommunio.manageccpanel',
			border: false,
			autoScroll: false,
			layout: {
				type: 'vbox',
				align: 'stretch',
				pack: 'start'
			},
			items: this.createPanelItems()
		});

		Grommunio.common.manageCc.ui.ManageCcPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Function will create panel items for {@link Grommunio.common.manageCc.ui.ManageCcPanel ManageCcPanel}
	 *
	 * @return {Array} array of items that should be added to panel.
	 * @private
	 */
	createPanelItems: function()
	{
		return [{
			xtype: 'container',
			flex: 1,
			layout: {
				type: 'hbox',
				align: 'stretch',
				pack: 'start'
			},
			items: [{
				xtype: 'grommunio.manageccgrid',
				ref: '../manageCcgrid',
				flex: 1
			},{
				xtype: 'container',
				width: 160,
				layout: {
					type: 'vbox',
					align: 'center',
					pack: 'start'
				},
				items: [{
					xtype: 'button',
					text: _('Address Book') + '...',
					width: 130,
					handler: this.onClickAddressBookBtn,
					scope: this
				},{
					xtype: 'spacer',
					height: 10
				},{
					xtype: 'button',
					text: _('Add') + '...',
					width: 130,
					ref: '../../addButton',
					handler: this.onClickAdd,
					scope: this
				},{
					xtype: 'spacer',
					height: 10
				},{
					xtype: 'button',
					text: _('Remove') + '...',
					width: 130,
					disabled: true,
					ref: '../../removeButton',
					handler: this.onClickRemove,
					scope: this
				}]
			}]
		}];
	},

	/**
	 * Initialize events for the panel.
	 * @private
	 */
	initEvents: function()
	{
		Grommunio.common.manageCc.ui.ManageCcPanel.superclass.initEvents.call(this);

		this.mon(this.getStore(), {
			'remove': this.onStoreRemove,
			'update': this.onStoreUpdate,
			'add': this.onStoreAdd,
			scope: this
		});

		// register event to enable/disable buttons
		this.mon(this.manageCcgrid.getSelectionModel(), 'selectionchange', this.onGridSelectionChange, this);
	},

	/**
	 * Called by the {@link Grommunio.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link grommunio.settings.ui.SettingsCategory#update}.
	 * This is used to load the latest version of the settings from the
	 *
	 * {@link Grommunio.settings.SettingsModel} into the UI of this category.
	 * @param {Grommunio.settings.SettingsModel} settingsModel The settings to load
	 */
	update: function(settingsModel)
	{
		this.model = settingsModel;

		// Convert the Cc recipients into Store data
		var recipients = settingsModel.get('grommunio/v1/contexts/mail/cc_recipients', []);

		var recipientsData = {'item': []};
		Ext.each(recipients, function(recipient, index) {
			recipientsData.item.push({props: recipient});
		});

		// Load all recipients into the Store
		this.getStore().loadData(recipientsData);
	},

	/**
	 * Called by the {@link Grommunio.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link grommunio.settings.ui.SettingsCategory#updateSettings}.
	 * This is used to update the settings from the UI into the {@link Grommunio.settings.SettingsModel settings model}.
	 *
	 * @param {Grommunio.settings.SettingsModel} settingsModel The settings to update
	 */
	updateSettings: function(settingsModel)
	{
		var recipients = settingsModel.get('grommunio/v1/contexts/mail/cc_recipients', []);
		var records = Ext.pluck(this.getStore().getRange(), 'data');

		if (!recipients.equals(records)) {
			settingsModel.set('grommunio/v1/contexts/mail/cc_recipients', records);
		}
	},

	/**
	 * Event handler triggered when 'Add' button has been clicked.
	 * It will call the {@link Grommunio.common.manageCc.ui.ManageCcGrid#addOrEditManageCcRecipient}.
	 */
	onClickAdd: function()
	{
		var store = this.getStore();
		// find rowid value
		var data = Ext.pluck(store.getRange(), 'data');
		var rowId = Ext.max(Ext.pluck(data, 'rowid')) || 0;

		var record = Grommunio.core.data.RecordFactory.createRecordObjectByCustomType(Grommunio.core.data.RecordCustomObjectType.GROMMUNIO_CC_RECIPIENT, {
			rowid: rowId + 1,
			display_type: Grommunio.core.mapi.DisplayType.DT_REMOTE_MAILUSER
		});

		store.add(record);

		this.manageCcgrid.addOrEditManageCcRecipient(record, true);
	},

	/**
	 * Handler called when 'remove' button was clicked. It is used to remove the
	 * user from {@link Grommunio.common.manageCc.ui.manageCcGrid manageCcGrid}.
	 */
	onClickRemove: function()
	{
		this.manageCcgrid.removeCcRecipient();
	},

	/**
	 * Returns the {@link Grommunio.core.data.IPMRecipientStore IPMRecipientStore} associated
	 * with this panel.
	 * @return {Grommunio.core.data.IPMRecipientStore} The store
	 */
	getStore: function()
	{
		return this.manageCcgrid.getStore();
	},

	/**
	 * Event handler for the {@link Ext.data.Store#remove} event which is fired
	 * by the {@link Ext.data.Store} inside the {@link #manageCcgrid}.
	 * This will mark the {@link Grommunio.settings.SettingsContextModel} as
	 * {@link Grommunio.settings.SettingsContextModel#setDirty dirty}.
	 *
	 * @param {Ext.data.Store} store The store which fired the event
	 * @param {Ext.data.Record} record The record which was updated
	 * @private
	 */
	onStoreRemove: function(store, record)
	{
		if(!record.phantom) {
			this.settingsContext.getModel().setDirty();
		}
	},

	/**
	 * Event handler for the {@link Ext.data.Store#add} event which is fired
	 * by the {@link Ext.data.Store} inside the {@link #manageCcgrid}.
	 * This will mark the {@link Grommunio.settings.SettingsContextModel} as
	 * {@link Grommunio.settings.SettingsContextModel#setDirty dirty} while
	 * Cc recipient was added from address book only.
	 *
	 * @param {Ext.data.Store} store The store which fired the event
	 * @param {Array} records An Array of {@link Ext.data.Record record} objects which are added to store
	 * @private
	 */
	onStoreAdd: function(store, records)
	{
		if (!Ext.isEmpty(records[0].get('entryid'))) {
			// mark the model as dirty as the new send as is added
			this.settingsContext.getModel().setDirty();
		}
	},

	/**
	 * Event handler for the {@link Ext.data.Store#update} event which is fired
	 * by the {@link Ext.data.Store} inside the {@link #manageCcgrid}.
	 * This will mark the {@link Grommunio.settings.SettingsContextModel} as
	 * {@link Grommunio.settings.SettingsContextModel#setDirty dirty}.
	 *
	 * @param {Ext.data.Store} store The store which fired the event
	 * @param {Ext.data.Record} record The record which was updated
	 * @param {String} operation The update operation being performed.
	 * @private
	 */
	onStoreUpdate: function(store, record, operation)
	{
		if (operation !== Ext.data.Record.COMMIT) {
			this.settingsContext.getModel().setDirty();
		}
	},

	/**
	 * Event handler will be called when selection in {@link Grommunio.common.manageCc.ui.manageCcGrid manageCcGrid}
	 * has been changed.
	 * @param {Ext.grid.RowSelectionModel} selectionModel selection model that fired the event
	 */
	onGridSelectionChange: function(selectionModel)
	{
		this.removeButton.setDisabled(!selectionModel.hasSelection());
	},

	/**
	 * Handler function will be called when user clicks on 'Address Book' button,
	 * this will open an Address Book and one can select as a default Cc recipient
	 * from any of the address book contact list.
	 * @private
	 */
	onClickAddressBookBtn: function()
	{
		Grommunio.common.Actions.openABUserSelectionContent({
			callback: Grommunio.common.Actions.abCallBack,
			scope: this,
			singleSelect: false,
			listRestriction: {
				hide_users: ['system', 'everyone'],
				hide_companies: true
			}
		});
	}
});
Ext.reg('grommunio.manageccpanel', Grommunio.common.manageCc.ui.ManageCcPanel);
