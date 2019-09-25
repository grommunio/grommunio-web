Ext.namespace('Zarafa.common.sendas.ui');

/**
 * @class Zarafa.common.sendas.ui.SendAsPanel
 * @extends Ext.Panel
 * @xtype zarafa.sendaspanel
 * Will generate UI for the {@link Zarafa.common.settings.SettingsSendAsWidget SettingsSendAsWidget}.
 */
Zarafa.common.sendas.ui.SendAsPanel = Ext.extend(Ext.Panel, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// Override from Ext.Component
			xtype : 'zarafa.sendaspanel',
			border : false,
			layout : {
				type : 'vbox',
				align : 'stretch',
				pack  : 'start'
			},
			items : this.createPanelItems(config.store)
		});

		Zarafa.common.sendas.ui.SendAsPanel.superclass.constructor.call(this, config);
	},
	
	/**
	 * Function will create panel items for {@link Zarafa.common.sendas.ui.SendAsPanel SendAsPanel}
	 * @param {Zarafa.core.data.IPMRecipientStore} store store which configured in the grid
	 * @return {Array} array of items that should be added to panel.
	 * @private
	 */
	createPanelItems : function(store)
	{
		return [{
			xtype: 'displayfield',
			value: _('Manage the email addresses you can use as sender address when sending an email.'),
			fieldClass: 'x-form-display-field zarafa-settings-widget-extrainfo'
		}, {
			xtype: 'container',
			flex: 1,
			layout: {
				type: 'hbox',
				align: 'stretch',
				pack: 'start'
			},
			items: [{
				xtype: 'zarafa.sendasgrid',
				ref: '../sendasGrid',
				store: store,
				flex: 1
			}, {
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
					handler: this.onSendAsAddressBook,
					scope: this
				},{
					xtype: 'spacer',
					height: 20
				},{
					xtype: 'button',
					text: _('Add') + '...',
					handler: this.onSendAsAdd,
					scope: this
				},{
					xtype: 'spacer',
					height: 20
				},{
					xtype: 'button',
					text: _('Edit') + '...',
					disabled: true,
					ref: '../../editButton',
					handler: this.onSendAsEdit,
					scope: this
				},{
					xtype: 'spacer',
					height: 20
				},{
					xtype: 'button',
					text: _('View') + '...',
					disabled: true,
					ref: '../../viewButton',
					handler: this.onSendAsView,
					scope: this
				},{
					xtype: 'spacer',
					height: 20
				},{
					xtype: 'button',
					text: _('Remove') + '...',
					disabled: true,
					ref: '../../removeButton',
					handler: this.onSendAsRemove,
					scope: this
				}]
			}]
		}];
	},

	/**
	 * initialize events for the panel.
	 * @private
	 */
	initEvents : function()
	{
		Zarafa.common.sendas.ui.SendAsPanel.superclass.initEvents.call(this);

		// register event to enable/disable buttons
		this.mon(this.sendasGrid.getSelectionModel(), 'selectionchange', this.onGridSelectionChange, this);
	},

	/**
	 * Handler function will be called when user clicks on 'Add' button,
	 * this will show addressbook dialog to select sendas user.
	 * @private
	 */
	onSendAsAdd : function()
	{
		// find rowid value
		var data = Ext.pluck(this.store.getRange(), 'data');
		var rowId = Ext.max(Ext.pluck(data, 'rowid')) || 0;

		var record = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RECIPIENT, {
			// rowid is the {@link Ext.data.JsonReader#idProperty} in {@link Zarafa.core.data.IPMRecipientStore IPMRecipientStore}
			// so we must have to configure the rowid properly.
			rowid : rowId + 1,
			display_type : Zarafa.core.mapi.DisplayType.DT_REMOTE_MAILUSER
		});
		
		this.store.add(record);

		this.sendasGrid.editSendAsRecipient(record, true);
	},

	/**
	 * Event handler will be called when selection in {@link Zarafa.common.ui.SendAsGrid SendAsGrid}
	 * has been changed.
	 * @param {Ext.grid.RowSelectionModel} selectionModel selection model that fired the event
	 */
	onGridSelectionChange : function(selectionModel)
	{
		var record = selectionModel.getSelected();

		var isOneOff = record && record.isOneOff();
		var hasSelection = selectionModel.hasSelection();

		// +----------------------------------------------------+
		// |             | Enable / Disable (Edit, View, Remove)|
		// +----------------------------------------------------+
		// |             | Selection | Operation | isOneOff     |
		// +----------------------------------------------------+
		// |Edit Button  | !(true)   | OR        | !(true)      |
		// |View Button  | !(true)   | OR        | true         |
		// |Remove Button| !(true)   | Null      | Null         |
		// +----------------------------------------------------+
		// Here is toggle the view and edit button as per the contact type
		// and if there is no selection in sendAsGrid, all three (Edit, View, Remove) buttons are disable.
		this.editButton.setDisabled(!hasSelection || !isOneOff);
		this.viewButton.setDisabled(!hasSelection || isOneOff);
		this.removeButton.setDisabled(!hasSelection);
	},

	/**
	 * Handler function will be called when user clicks on 'Remove' button,
	 * this will remove currently selected sendas from sendass list.
	 * @private
	 */
	onSendAsRemove : function()
	{
		this.sendasGrid.removeSendAs();
	},

	/**
	 * Fuction will be call to get the selected contact from {@link Zarafa.common.ui.SendAsGrid SendAsGrid}
	 * @return {Ext.data.Record} The record which is selected from {@link Zarafa.common.ui.SendAsGrid SendAsGrid}.
	 * @private
	 */
	getSendAsRecord : function()
	{
		var sendasRecord = this.sendasGrid.getSelectionModel().getSelected();

		if(!sendasRecord) {
			Ext.Msg.alert(_('Alert'), _('Please select a sendas record.'));
			return;
		}

		return sendasRecord;
	},

	/**
	 * Handler function will be called when user click on 'Edit' button,
	 * this will edit currently selected contact from sendas list.
	 * @private
	 */
	onSendAsEdit : function()
	{
		var sendasRecord = this.getSendAsRecord();

		this.sendasGrid.editSendAsRecipient(sendasRecord, false);
	},

	/**
	 * Handler function will be called when user click on 'View' button,
	 * this will open currently selected address book contact from sendas list.
	 * @private
	 */
	onSendAsView : function()
	{
		var sendasRecord = this.getSendAsRecord();

		this.sendasGrid.viewSendAsRecipient(sendasRecord);
	},

	/**
	 * Handler function will be called when user clicks on 'Address Book' button,
	 * this will open an Address Book and one can select sendas from any of the address book contact list.
	 * @private
	 */
	onSendAsAddressBook : function()
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
		// find rowid value
		var data = Ext.pluck(this.store.getRange(), 'data');
		var rowId = Ext.max(Ext.pluck(data, 'rowid')) || 0;

		for (var i = 0; i < records.length; i++) {
			var record = records[i];

			record = record.convertToRecipient();
			record.set('rowid', ++rowId);

			this.store.add(record);
		}
	}
});

Ext.reg('zarafa.sendaspanel', Zarafa.common.sendas.ui.SendAsPanel);
