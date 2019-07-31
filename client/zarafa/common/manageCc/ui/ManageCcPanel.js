Ext.namespace('Zarafa.common.manageCc.ui');

/**
 * @class Zarafa.common.manageCc.ui.ManageCcPanel
 * @extends Ext.Panel
 * @xtype zarafa.manageccpanel
 *
 * Panel contains the {@link Zarafa.common.manageCc.ui.ManageCcGrid ManageCcGrid}.
 * which mange the default Cc recipient for new / reply mails.
 */
Zarafa.common.manageCc.ui.ManageCcPanel = Ext.extend(Ext.Panel, {

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};
		Ext.applyIf(config, {
			xtype : 'zarafa.manageccpanel',
			height : 300,
			title : _("Manage Cc recipients"),
			layout : {
				type : 'vbox',
				align : 'stretch',
				pack  : 'start'
			},
			items : this.createPanelItems()
		});

		Zarafa.common.manageCc.ui.ManageCcPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Function will create panel items for {@link Zarafa.common.manageCc.ui.ManageCcPanel ManageCcPanel}
	 *
	 * @return {Array} array of items that should be added to panel.
	 * @private
	 */
	createPanelItems : function()
	{
		return [{
			xtype: 'displayfield',
			value: _('Cc recipients can be used to set a default Cc user in new mail, replies or both.'),
			fieldClass: 'x-form-display-field zarafa-settings-widget-extrainfo'
		},{
			xtype: 'container',
			flex: 1,
			layout: {
				type: 'hbox',
				align: 'stretch',
				pack: 'start'
			},
			items: [{
				xtype: 'zarafa.manageccgrid',
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
					handler: this.onClickAddressBookBtn,
					scope: this
				},{
					xtype: 'spacer',
					height: 20
				},{
					xtype: 'button',
					text: _('Add') + '...',
					ref: '../../addButton',
					handler : this.onClickAdd,
					scope: this
				},{
					xtype: 'spacer',
					height: 20
				},{
					xtype: 'button',
					text: _('Remove') + '...',
					disabled: true,
					ref: '../../removeButton',
					handler : this.onClickRemove,
					scope: this
				}]
			}]
		}];
	},

	/**
	 * Initialize events for the panel.
	 * @private
	 */
	initEvents : function()
	{
		Zarafa.common.manageCc.ui.ManageCcPanel.superclass.initEvents.call(this);

		this.mon(this.getStore(), {
			'remove' : this.onStoreRemove,
			'update' : this.onStoreUpdate,
			'add' : this.onStoreAdd,
			scope : this
		});

		// register event to enable/disable buttons
		this.mon(this.manageCcgrid.getSelectionModel(), 'selectionchange', this.onGridSelectionChange, this);
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link zarafa.settings.ui.SettingsCategory#update}.
	 * This is used to load the latest version of the settings from the
	 *
	 * {@link Zarafa.settings.SettingsModel} into the UI of this category.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to load
	 */
	update : function(settingsModel)
	{
		this.model = settingsModel;

		// Convert the Cc recipients into Store data
		var recipients = settingsModel.get('zarafa/v1/contexts/mail/cc_recipients', []);

		var recipientsData = {'item' : []};
		Ext.each(recipients, function(recipient, index) {
			recipientsData.item.push({props : recipient});
		});

		// Load all recipients into the Store
		this.getStore().loadData(recipientsData);
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link zarafa.settings.ui.SettingsCategory#updateSettings}.
	 * This is used to update the settings from the UI into the {@link Zarafa.settings.SettingsModel settings model}.
	 *
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to update
	 */
	updateSettings : function(settingsModel)
	{
		var recipients  = settingsModel.get('zarafa/v1/contexts/mail/cc_recipients', []);
		var records = Ext.pluck(this.getStore().getRange(), 'data');

		if (!recipients.equals(records)) {
			settingsModel.set('zarafa/v1/contexts/mail/cc_recipients', records);
		}
	},

	/**
	 * Event handler triggered when 'Add' button has been clicked.
	 * It will call the {@link Zarafa.common.manageCc.ui.ManageCcGrid#addOrEditManageCcRecipient}.
	 */
	onClickAdd : function()
	{
		var store = this.getStore();
		// find rowid value
		var data = Ext.pluck(store.getRange(), 'data');
		var rowId = Ext.max(Ext.pluck(data, 'rowid')) || 0;

		var record = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_CC_RECIPIENT, {
			rowid : rowId + 1,
			display_type : Zarafa.core.mapi.DisplayType.DT_REMOTE_MAILUSER
		});

		store.add(record);

		this.manageCcgrid.addOrEditManageCcRecipient(record, true);
	},

	/**
	 * Handler called when 'remove' button was clicked. It is used to remove the
	 * user from {@link Zarafa.common.manageCc.ui.manageCcGrid manageCcGrid}.
	 */
	onClickRemove : function()
	{
		this.manageCcgrid.removeCcRecipient();
	},

	/**
	 * Returns the {@link Zarafa.core.data.IPMRecipientStore IPMRecipientStore} associated
	 * with this panel.
	 * @return {Zarafa.core.data.IPMRecipientStore} The store
	 */
	getStore : function()
	{
		return this.manageCcgrid.getStore();
	},

	/**
	 * Event handler for the {@link Ext.data.Store#remove} event which is fired
	 * by the {@link Ext.data.Store} inside the {@link #manageCcgrid}.
	 * This will mark the {@link Zarafa.settings.SettingsContextModel} as
	 * {@link Zarafa.settings.SettingsContextModel#setDirty dirty}.
	 *
	 * @param {Ext.data.Store} store The store which fired the event
	 * @param {Ext.data.Record} record The record which was updated
	 * @private
	 */
	onStoreRemove : function(store, record)
	{
		if(!record.phantom) {
			this.settingsContext.getModel().setDirty();
		}
	},

	/**
	 * Event handler for the {@link Ext.data.Store#add} event which is fired
	 * by the {@link Ext.data.Store} inside the {@link #manageCcgrid}.
	 * This will mark the {@link Zarafa.settings.SettingsContextModel} as
	 * {@link Zarafa.settings.SettingsContextModel#setDirty dirty} while
	 * Cc recipient was added from address book only.
	 *
	 * @param {Ext.data.Store} store The store which fired the event
	 * @param {Array} records An Array of {@link Ext.data.Record record} objects which are added to store
	 * @private
	 */
	onStoreAdd : function(store, records)
	{
		if (!Ext.isEmpty(records[0].get('entryid'))) {
			// mark the model as dirty as the new send as is added
			this.settingsContext.getModel().setDirty();
		}
	},

	/**
	 * Event handler for the {@link Ext.data.Store#update} event which is fired
	 * by the {@link Ext.data.Store} inside the {@link #manageCcgrid}.
	 * This will mark the {@link Zarafa.settings.SettingsContextModel} as
	 * {@link Zarafa.settings.SettingsContextModel#setDirty dirty}.
	 *
	 * @param {Ext.data.Store} store The store which fired the event
	 * @param {Ext.data.Record} record The record which was updated
	 * @param {String} operation The update operation being performed.
	 * @private
	 */
	onStoreUpdate : function(store, record, operation)
	{
		if (operation !== Ext.data.Record.COMMIT) {
			this.settingsContext.getModel().setDirty();
		}
	},

	/**
	 * Event handler will be called when selection in {@link Zarafa.common.manageCc.ui.manageCcGrid manageCcGrid}
	 * has been changed.
	 * @param {Ext.grid.RowSelectionModel} selectionModel selection model that fired the event
	 */
	onGridSelectionChange : function(selectionModel)
	{
		this.removeButton.setDisabled(!selectionModel.hasSelection());
	},

	/**
	 * Handler function will be called when user clicks on 'Address Book' button,
	 * this will open an Address Book and one can select as a default Cc recipient
	 * from any of the address book contact list.
	 * @private
	 */
	onClickAddressBookBtn : function()
	{
		Zarafa.common.Actions.openABUserSelectionContent({
			callback : this.abCallBack,
			scope : this,
			singleSelect : false,
			listRestriction : {
				hide_users : ['system', 'everyone'],
				hide_companies : true
			}
		});
	},

	/**
	 * Callback function for {@link Zarafa.addressbook.dialogs.ABUserSelectionContent AddressBook}
	 * @param {Ext.data.Record} record user selected from AddressBook
	 * @private
	 */
	abCallBack : function(records)
	{
		var store = this.getStore();
		// find rowid value
		var data = Ext.pluck(store.getRange(), 'data');
		var rowId = Ext.max(Ext.pluck(data, 'rowid')) || 0;

		var duplicate = [];
		for (var i = 0; i < records.length; i++) {
			var record = records[i];
			if (store.isRecipientExists(record)) {
				duplicate.push(record.get('display_name'));
				continue;
			}
			var recipientRecord = record.convertToRecipient(Zarafa.core.mapi.RecipientType.MAPI_CC, store.customObjectType);
			recipientRecord.set('rowid', ++rowId);

			store.add(recipientRecord);
		}

		// Show warning message box.
		if (!Ext.isEmpty(duplicate)) {
			if (duplicate.length > 1) {
				var msg = _('Following recipients are already exists');
				msg += '<br>' + duplicate.map(function (item) {
					return '<br>' + item;
				});

				return Ext.Msg.alert(_('Duplicate recipients'), msg);
			} else {
				Ext.Msg.alert(_('Duplicate recipient'), _('Recipient already exists.'));
			}
		}
	}
});
Ext.reg('zarafa.manageccpanel', Zarafa.common.manageCc.ui.ManageCcPanel);
