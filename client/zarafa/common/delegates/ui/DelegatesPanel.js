Ext.namespace('Zarafa.common.delegates.ui');

/**
 * @class Zarafa.common.delegates.ui.DelegatesPanel
 * @extends Ext.Panel
 * @xtype zarafa.delegatespanel
 * Will generate UI for the {@link Zarafa.common.settings.SettingsDelegateWidget SettingsDelegateWidget}.
 */
Zarafa.common.delegates.ui.DelegatesPanel = Ext.extend(Ext.Panel, {
	/**
	 * @cfg {Zarafa.common.delegates.data.DelegateStore} store Delegate store that will be used to load delegates data
	 */
	store : undefined,

	/**
	 * The LoadMask object which will be shown when the {@link #record} is being opened, and
	 * the dialog is waiting for the server to respond with the desired data.
	 * @property
	 * @type Zarafa.common.ui.LoadMask
	 */
	loadMask : undefined,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		if(!config.store) {
			config.store = new Zarafa.common.delegates.data.DelegateStore();
		}

		Ext.applyIf(config, {
			// Override from Ext.Component
			xtype : 'zarafa.delegatespanel',
			border : false,
			layout : {
				type : 'vbox',
				align : 'stretch',
				pack  : 'start'
			},
			items : this.createPanelItems(config.store)
		});

		Zarafa.common.delegates.ui.DelegatesPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Function will create panel items for {@link Zarafa.common.delegates.ui.DelegatesPanel DelegatesPanel}
	 * @return {Array} array of items that should be added to panel.
	 * @param {Zarafa.common.delegates.data.DelegateStore} store store that will be used to load delegates data.
	 * @private
	 */
	createPanelItems : function(store)
	{
		return [{
			xtype : 'displayfield',
			value : _('Delegates can send items on your behalf. To grant permission to others to access your folders without also giving them send-on-behalf-of privileges, go to properties for each folder and change the options on the Permissions Tab.'),
			fieldClass : 'x-form-display-field zarafa-settings-widget-extrainfo'
		}, {
			xtype : 'container',
			flex : 1,
			layout : {
				type : 'hbox',
				align : 'stretch',
				pack  : 'start'
			},
			items : [{
				xtype : 'zarafa.delegatesgrid',
				ref : '../delegatesGrid',
				store : store,
				flex : 1
			}, {
				xtype : 'container',
				width : 160,
				layout : {
					type : 'vbox',
					align : 'center',
					pack  : 'start'
				},
				items : [{
					xtype : 'button',
					text : _('Add') + '...',
					handler : this.onDelegateAdd,
					ref : '../../addButton',
					scope : this
				}, {
					xtype : 'spacer',
					height : 20
				}, {
					xtype : 'button',
					text : _('Remove') + '...',
					disabled : true,
					ref : '../../removeButton',
					handler : this.onDelegateRemove,
					scope : this
				}, {
					xtype : 'spacer',
					height : 20
				}, {
					xtype : 'button',
					text : _('Permission') + '...',
					disabled : true,
					ref : '../../permissionButton',
					handler : this.onDelegatePermission,
					scope : this
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
		Zarafa.common.delegates.ui.DelegatesPanel.superclass.initEvents.call(this);

		// register event to open permissions dialog after adding new delegate
		this.mon(this.store, 'add', this.afterDelegateAdd, this);

		// register event to enable/disable buttons
		this.mon(this.delegatesGrid.getSelectionModel(), 'selectionchange', this.onGridSelectionChange, this);
	},

	/**
	 * If {@link #showLoadMask} is enabled, this function will display the {@link #loadMask}.
	 * @protected
	 */
	showLoadMask : function()
	{
		if (!this.loadMask) {
			this.loadMask = new Zarafa.common.ui.LoadMask(this.el);
		}

		this.loadMask.show();
	},

	/**
	 * If {@link #showLoadMask} is enabled, and {@link #showLoadMask} has been
	 * called to display the {@link #loadMask} this function will disable the loadMask.
	 * @protected
	 */
	hideLoadMask : function()
	{
		if (this.loadMask) {
			this.loadMask.hide();
		}
	},

	/**
	 * Handler function will be called when user clicks on 'Add' button,
	 * this will show addressbook dialog to select delegate user.
	 * @private
	 */
	onDelegateAdd : function()
	{
		Zarafa.common.Actions.openABUserSelectionContent({
			callback : this.abCallBack,
			scope : this,
			hierarchyRestriction : {
				hide_contacts : true
			},
			listRestriction : {
				hide_users : ['contact', 'system', 'non_security', 'room', 'equipment', 'non_active'],
				hide_groups : ['non_security'],
				hide_companies : true
			}
		});
	},

	/**
	 * Callback function for {@link Zarafa.addressbook.dialogs.ABUserSelectionContentPanel AddressBook}
	 * @param {Ext.data.Record} record user selected from AddressBook
	 * @private
	 */
	abCallBack : function(record)
	{
		record = record.convertToDelegate();

		if(this.store.getById(record.get('entryid'))) {
			Ext.Msg.alert(_('Alert'), _('Delegate already exists in the list.'));
			return;
		}

		this.store.add(record);
	},

	/**
	 * Function will be called when a delegate record is added to the store and we want to
	 * open {@link Zarafa.common.delegates.dialogs.DelegatePermissionContentPanel DelegatePermissionContentPanel}
	 * for the currently added delegate.
	 * @param {Zarafa.common.delegates.data.DelegateStore} store store that was used to add delegate user.
	 * @param {Zarafa.common.delegates.data.DelegateRecord[]} record array of records that are added in store.
	 * @param {Number} index index of the store at where records are added in store.
	 */
	afterDelegateAdd : function(store, record, index)
	{
		if(Ext.isArray(record)) {
			for(var i = 0, j = record.length; i < j; i++) {
				this.afterDelegateAdd(store, record[i], i);
			}

			return;
		}

		// only open permissions dialog for phantom records
		if(record.phantom) {
			this.openDelegatePermissions(record, true);
		}
	},

	/**
	 * Helper function that will be used when user adds a new {@link Zarafa.common.delegates.data.DelegateRecord DelegateRecord}
	 * so this will check if we need to get folder permissions that is already saved for the current delegate and fill it in delegates record
	 * and then {@link Zarafa.common.delegates.dialogs.DelegatePermissionContentPanel DelegatePermissionContentPanel} can be opened
	 * using the record.
	 * @param {Zarafa.common.delegates.data.DelegateRecord} record delegate record which is added in grid
	 */
	openDelegatePermissions : function(record)
	{
		if(!record.isOpened()) {
			this.openDelegateRecord(record, this.openDelegatePermissions);
			return;
		}

		this.delegatesGrid.openDelegatePermissions(record, { removeRecordOnCancel : true });
	},

	/**
	 * Helper function will get folder permissions already assigned to particular delegate when adding it to the delegates store.
	 * This will also show / hide load mask when requesting more data
	 * @param {Zarafa.common.delegates.data.DelegateRecord} record delegate record for which we need to get existing folder permissions
	 * @param {Ext.Function} callback callback function that will be called after successfully opening the delegate record.
	 */
	openDelegateRecord : function(record, callback)
	{
		// show load mask till we fetch full data from server
		this.showLoadMask();

		// store a reference of record's store which can be used to deregister events in exception handler
		var store = record.getStore();

		var fnOpen = function(recStore, rec) {
			if (record === rec) {
				// remove registered handlers
				store.un('open', fnOpen, this);
				store.un('exception', fnException, this);

				// hide load mask as data has arrived
				this.hideLoadMask();

				// call the callback function
				callback.call(this, record);
			}
		};

		var fnException = function(proxy, type, action, options, response, args) {
			if(action === Ext.data.Api.actions.open) {
				// remove registered handlers, this exception has been fired by Proxy so we will not get store in parameters
				store.un('open', fnOpen, this);
				store.un('exception', fnException, this);

				// actual error message will be shown by common exception handler
				// we will just hide the load mask
				this.hideLoadMask();
			}
		};

		store.on('open', fnOpen, this);
		store.on('exception', fnException, this);

		record.open();
	},

	/**
	 * Event handler will be called when selection in {@link Zarafa.common.delegates.ui.DelegatesGrid DelegatesGrid}
	 * has been changed
	 * @param {Ext.grid.RowSelectionModel} selectionModel selection model that fired the event
	 */
	onGridSelectionChange : function(selectionModel)
	{
		var noSelection = (selectionModel.hasSelection() === false);

		this.removeButton.setDisabled(noSelection);
		this.permissionButton.setDisabled(noSelection);
	},

	/**
	 * Handler function will be called when user clicks on 'Remove' button,
	 * this will remove currently selected delegate from delegates list.
	 * @private
	 */
	onDelegateRemove : function()
	{
		this.delegatesGrid.removeDelegate();
	},

	/**
	 * Handler function will be called when user clicks on 'Permission' button,
	 * this will open {@link Zarafa.common.delegates.dialogs.DelegatePermissionContentPanel DelegatePermissionContentPanel}
	 * to show detailed permissions of delegate user.
	 * @private
	 */
	onDelegatePermission : function()
	{
		this.delegatesGrid.openDelegatePermissions();
	},

	/**
	 * Function will be used to reload data in the {@link Zarafa.common.delegates.data.DelegateStore DelegateStore}.
	 */
	discardChanges : function()
	{
		this.store.load();
	},

	/**
	 * Function will be used to save changes in the {@link Zarafa.common.delegates.data.DelegateStore DelegateStore}.
	 */
	saveChanges : function()
	{
		this.store.save();
	}
});

Ext.reg('zarafa.delegatespanel', Zarafa.common.delegates.ui.DelegatesPanel);
