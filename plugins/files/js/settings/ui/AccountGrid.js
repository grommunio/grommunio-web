Ext.namespace('Zarafa.plugins.files.settings.ui');

/**
 * @class Zarafa.plugins.files.settings.ui.AccountGrid
 * @extends Ext.grid.GridPanel
 * @xtype filesplugin.accountgrid
 *
 * The main gridpanel for our account list.
 */
Zarafa.plugins.files.settings.ui.AccountGrid = Ext.extend(Zarafa.common.ui.grid.GridPanel, {

	/**
	 * @cfg {Object} The account store.
	 */
	store: null,

	/**
	 * @cfg {Zarafa.plugins.files.data.BackendStore} backendStore which
	 * contains {@link Zarafa.plugins.files.data.FilesBackendRecord backend} records.
	 */
	backendStore : undefined,

	/**
	 * @constructor
	 * @param {Object} config
	 */
	constructor: function (config) {
		config = config || {};

		Ext.applyIf(config, {
			xtype : 'filesplugin.accountgrid',
			store : config.store,
			border : false,
			baseCls : 'accountGrid',
			enableHdMenu: false,
			loadMask : this.initLoadMask(),
			viewConfig : {
				forceFit : true,
				deferEmptyText : false,
				emptyText : '<div class="emptytext">' + dgettext('plugin_files', 'No account created!') + '</div>'
			},
			sm  : this.initSelectionModel(),
			cm : this.initColumnModel(),
			listeners : {
				rowdblclick : this.onRowDblClick,
				scope : this
			},
			tbar : [{
				iconCls: 'filesplugin_icon_add',
				text   : dgettext('plugin_files', 'Add Account'),
				ref    : '../addAccountBtn',
				handler: this.onAccountAdd,
				scope : this
			}, {
				iconCls : 'filesplugin_icon_delete',
				text : dgettext('plugin_files', 'Remove Account'),
				disabled: true,
				ref : '../removeAccountBtn',
				handler : this.onAccountRemove,
				scope : this
			}, {
				xtype : 'spacer',
				width : 10
			}, {
				xtype : 'button',
				iconCls : 'zarafa-rules-sequence-up',
				disabled : true,
				ref : '../upButton',
				handler : this.onAccountSequenceUp,
				scope : this,
				width : 20
			}, {
				xtype : 'spacer',
				width : 10
			}, {
				xtype : 'button',
				iconCls : 'zarafa-rules-sequence-down',
				disabled : true,
				ref : '../downButton',
				handler : this.onAccountSequenceDown,
				scope : this,
				width : 20
			}]
		});

		Zarafa.plugins.files.settings.ui.AccountGrid.superclass.constructor.call(this, config);
	},

	/**
	 * Initialize the {@link Ext.grid.GridPanel.loadMask} field.
	 *
	 * @return {Ext.LoadMask} The configuration object for {@link Ext.LoadMask}
	 * @private
	 */
	initLoadMask: function ()
	{
		return {
			msg: dgettext('plugin_files', 'Loading accounts') + '...'
		};
	},

	/**
	 * Initialize event handlers
	 * @private
	 */
	initEvents : function ()
	{
		this.on('afterrender', this.onAfterRender, this);
	},

	/**
	 * Event handler triggered after rendering account grid.
	 * which reload the account store so we can get updated status
	 * for all configured accounts.
	 */
	onAfterRender : function ()
	{
		this.store.reload();
	},

	/**
	 * Initialize the {@link Ext.grid.GridPanel.sm SelectionModel} field.
	 *
	 * @return {Ext.grid.RowSelectionModel} The subclass of {@link Ext.grid.AbstractSelectionModel}
	 * @private
	 */
	initSelectionModel: function () {
		return new Ext.grid.RowSelectionModel({
			singleSelect: true,
			listeners   : {
				selectionchange: this.onRowSelected
			}
		});
	},

	/**
	 * Initialize the {@link Ext.grid.GridPanel.cm ColumnModel} field.
	 *
	 * @return {Ext.grid.ColumnModel} The {@link Ext.grid.ColumnModel} for this grid
	 * @private
	 */
	initColumnModel: function () {
		return new Zarafa.plugins.files.settings.ui.AccountGridColumnModel();
	},

	/**
	 * Function is called if a row in the grid gets selected.
	 *
	 * @param selectionModel
	 */
	onRowSelected: function (selectionModel) {
		if (selectionModel.getCount() < 1) {
			return;
		}
		var remButton = this.grid.removeAccountBtn;
		var isAdministrativeAccount = selectionModel.getSelections()[0].get("cannot_change");
		remButton.setDisabled(isAdministrativeAccount);

		this.grid.upButton.setDisabled(!selectionModel.hasPrevious());
		this.grid.downButton.setDisabled(!selectionModel.hasNext());
	},

	/**
	 * Function is called if a row in the grid gets double clicked.
	 *
	 * @param grid
	 * @param rowIndex
	 */
	onRowDblClick: function (grid, rowIndex)
	{
		var accountStore = this.getStore();
		var accountRecord = accountStore.getAt(rowIndex);
		if (accountRecord.get("cannot_change")) {
			return;
		}
		Zarafa.core.data.UIFactory.openLayerComponent(Zarafa.core.data.SharedComponentType['filesplugin.accountedit'], undefined, {
			store  : grid.getStore(),
			item   : grid.getStore().getAt(rowIndex),
			backendStore : this.backendStore,
			manager: Ext.WindowMgr
		});
	},

	/**
	 * Clickhandler for the "add account" button.
	 */
	onAccountAdd: function ()
	{
		var component = Zarafa.core.data.SharedComponentType['filesplugin.accountedit'];
		Zarafa.core.data.UIFactory.openLayerComponent(component, undefined, {
			store  : this.getStore(),
			backendStore : this.backendStore,
			modal : true
		});
	},

	/**
	 * Clickhandler for the "remove account" button.
	 */
	onAccountRemove: function ()
	{
		var selections = this.getSelectionModel().getSelections();

		// Warn user before deleting the account!
		if (Ext.isDefined(selections[0])) { // as we have single select, remove the first item
			Ext.MessageBox.confirm(
				dgettext('plugin_files', 'Confirm deletion'),
				String.format(dgettext('plugin_files', 'Do you really want to delete the account "{0}"?'), selections[0].get("name")),
				this.doRemove.createDelegate(this, [selections[0]], true),
				this
			);
		}
	},

	/**
	 * Actually removes the given account from the backend.
	 *
	 * @param {String} button
	 * @param {String} value Unused
	 * @param {Object} options Unused
	 * @param {AccountRecord} account
	 */
	doRemove: function (button, value, options, account) {
		if (button === "yes") {
			this.getStore().remove(account);
		}
	},

	/**
	 * Handler function will be called when user clicks on 'Up' button
	 * This will determine which accounts to swap and call {@link #swapAccounts}.
	 * @private
	 */
	onAccountSequenceUp : function()
	{
		var store = this.getStore();
		var sm = this.getSelectionModel();
		var account = sm.getSelected();

		/*
		 * Start looking for the first sequence number which is lower then
		 * the current sequence number. Note that we want the account_sequence
		 * which is closest to the current account_sequence, hence the account:
		 *    account.get('account_sequence') > record.get('account_sequence') > swapAccount.get('account_sequence')
		 */
		var swapAccount;
		store.each(function(record) {
			if (account.get('account_sequence') > record.get('account_sequence')) {
				if (!swapAccount || record.get('account_sequence') > swapAccount.get('account_sequence')) {
					swapAccount = record;
				}
			}
		}, this);

		this.swapAccounts(account, swapAccount);
	},

	/**
	 * Handler function will be called when user clicks on 'Down' button
	 * This will determine which accounts to swap and call {@link #swapAccounts}.
	 * @private
	 */
	onAccountSequenceDown : function()
	{
		var store = this.getStore();
		var sm = this.getSelectionModel();
		var account = sm.getSelected();

		/*
		 * Start looking for the first sequence number which is higher then
		 * the current sequence number. Note that we want the account_sequence
		 * which is closest to the current account_sequence, hence the account:
		 *    account.get('account_sequence') < record.get('account_sequence') < swapAccount.get('account_sequence')
		 */
		var swapAccount;
		store.each(function(record) {
			if (account.get('account_sequence') < record.get('account_sequence')) {
				if (!swapAccount || record.get('account_sequence') < swapAccount.get('account_sequence')) {
					swapAccount = record;
				}
			}
		}, this);

		this.swapAccounts(account, swapAccount);
	},

	/**
	 * Swap two accounts by changing the 'account_sequence' property
	 * for both accounts, and {@link Ext.data.Store#sort sort}
	 * the {@link #store}.
	 * @param {Zarafa.plugins.files.data.AccountRecord} a The first account
	 * @param {Zarafa.plugins.files.data.AccountRecord} b The second account
	 * @private
	 */
	swapAccounts : function(a, b)
	{
		var aSeq = parseInt(a.get('account_sequence'));
		var bSeq = parseInt(b.get('account_sequence'));

		// Disable UI buttons to prevent race conditions
		this.upButton.setDisabled(true);
		this.downButton.setDisabled(true);

		// Swap the 2 accounts
		this.store.suspendEvents(); // do not use the autoSave feature of the store
		a.set('account_sequence', bSeq);
		b.set('account_sequence', aSeq);
		this.store.resumeEvents();

		// store both accounts in one request
		this.store.save(this.store.getModifiedRecords());

		// Reapply the sorting, this will update the UI
		this.store.on('update', this.onAfterSequenceChanged.createDelegate(this, [a,b], true), null, {single: true});
	},

	/**
	 * Eventhandler, called after the store has been updated.
	 * This will reload the store to update the ordering.
	 *
	 * @param store
	 * @param record
	 * @param operation
	 * @param {Zarafa.plugins.files.data.AccountRecord} a The first account
	 * @param {Zarafa.plugins.files.data.AccountRecord} b The second account
	 */
	onAfterSequenceChanged : function(store, record, operation, a, b)
	{
		// Reapply the sorting, this will update the UI
		store.reload();
		// Update the UI when the store has been reloaded
		store.on('load', this.onAfterSequenceReload.createDelegate(this, [a,b], true), this, {single: true});
	},

	/**
	 * This updates the UI after the store has been reloaded.
	 *
	 * @param store
	 * @param record
	 * @param operation
	 * @param {Zarafa.plugins.files.data.AccountRecord} a The first account
	 * @param {Zarafa.plugins.files.data.AccountRecord} b The second account
	 */
	onAfterSequenceReload: function(store, record, operation, a, b)
	{
		 // Update the 'up'/'down' button
		var sm = this.getSelectionModel();
		this.upButton.setDisabled(!sm.hasPrevious());
		this.downButton.setDisabled(!sm.hasNext());

		// fire the reorder event
		store.fireEvent('reorder', a, b);
	}
});

Ext.reg('filesplugin.accountgrid', Zarafa.plugins.files.settings.ui.AccountGrid);
