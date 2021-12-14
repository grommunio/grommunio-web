/*
 * #dependsFile client/zarafa/common/ui/grid/MapiMessageGridPanel.js
 */

Ext.namespace('Zarafa.common.restoreitem.dialogs');

/**
 * @class Zarafa.common.restoreitem.dialogs.RestoreItemPanel
 * @extends Zarafa.common.ui.grid.MapiMessageGrid
 * @xtype zarafa.restoreitempanel
 *
 * A gridPanel which provides UI for RestoreItem dialog to display the list of soft deleted items.
 * It also contains a {@link Zarafa.core.ui.ContentPanelToolbar ContentPanelToolbar}.
 */
Zarafa.common.restoreitem.dialogs.RestoreItemPanel = Ext.extend(Zarafa.common.ui.grid.MapiMessageGrid , {

	/**
	 * @cfg {Zarafa.hierarchy.data.MAPIFolderRecord} folder default folder for the contextModel.
	 */
	folder: undefined,

	/**
	 * The current type of soft deleted items list.
	 * Default value is 'message' as By default Grid is loaded with soft deleted message list.
	 * This String is changed by {@link #onRadioChecked}.
	 * @property
	 * @type String
	 * @private
	 */
	itemType: 'message',

	/**
	 * The {@link Zarafa.core.ContextModel} which is obtained by using {@link #folder}.
	 * @property
	 * @type Zarafa.core.ContextModel
	 */
	model: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config,{
			xtype: 'zarafa.restoreitempanel',
			border: false,
			store: new Zarafa.common.restoreitem.data.RestoreItemStore({
				folder: config.folder,
				autoLoad: {
					folder: config.folder
				}
			}),
			model: container.getContextByFolder(config.folder).getModel(),
			loadMask: true,
			supportLiveScroll: true,
			viewConfig: {
				forceFit: true,
				emptyText: '<div class="emptytext">' + _('There are no items to show in this list') + '</div>',
				getRowClass: this.viewConfigGetRowClass
			},
			tbar: {
				xtype: 'zarafa.contentpaneltoolbar',
				insertionPointBase: 'common.restoreitemcontentpanel',
				actionItems: this.createActionButtons()
			},
			colModel: this.initMessageColumnModel(),
			sm: new Ext.grid.RowSelectionModel()
		});

		Zarafa.common.restoreitem.dialogs.RestoreItemPanel.superclass.constructor.call(this,config);

	},

	/**
	 * Initialize event handlers
	 * @private
	 */
	initEvents: function()
	{
		Zarafa.common.restoreitem.dialogs.RestoreItemPanel.superclass.initEvents.call(this);

		this.mon(this.store, 'remove', this.disableToolbarButton, this);
		this.mon(this.getSelectionModel(), 'selectionchange', this.onSelectionChange, this);
		this.mon(this.getView(), 'livescrollstart', this.onLiveScrollStart, this);
		this.mon(this.getView(), 'beforesort', this.onBeforeSort, this);

	},

	/**
	 * Apply custom style and content for the row body. This will always
	 * apply the Read/UnRead style to the entire row.
	 *
	 * @param {Ext.data.Record} record The {@link Ext.data.Record Record} corresponding to the current row.
	 * @param {Number} rowIndex The row index
	 * @param {Object} rowParams A config object that is passed to the row template during
	 * rendering that allows customization of various aspects of a grid row.
	 * @param {Ext.data.Store} store The Ext.data.Store this grid is bound to
	 * @return {String} a CSS class name to add to the row
	 * @private
	 */
	viewConfigGetRowClass:function(record, rowIndex, rowParams, store)
	{
		return record.isRead() ? 'mail_read' : 'mail_unread';
	},

	/**
	 * Function will create buttons for top toolbar and it will be
	 * attached to zarafa.contentpaneltoolbar
	 * @return {Array} array consist of buttons for restore content panel
	 * @private
	 */
	createActionButtons: function()
	{
		var radioGroupName = Ext.id(null, 'restoreitem-');
		return [{
			xtype: 'button',
			overflowText: _('Restore'),
			text: _('Restore'),
			iconCls: 'icon_restore',
			handler: this.onRestore,
			disabled: true,
			ref: '../restoreButton',
			scope: this
		}, {
			xtype: 'button',
			overflowText: _('Restore All'),
			text: _('Restore All'),
			iconCls: 'icon_restore',
			handler: this.onRestoreAll,
			disabled: true,
			ref: '../restoreAllButton',
			scope: this
		},{
			xtype: 'button',
			overflowText: _('Permanent Delete'),
			text: _('Permanent Delete'),
			iconCls: 'icon_delete',
			handler: this.onPermanentDelete,
			disabled: true,
			ref: '../permanentDeleteButton',
			scope: this
		},{
			xtype: 'button',
			overflowText: _('Delete All'),
			text: _('Delete All'),
			iconCls: 'icon_delete',
			handler: this.onDeleteAll,
			disabled: true,
			ref: '../deleteAllButton',
			scope: this
		},{
			xtype: 'tbfill'
		},{
			xtype: 'radio',
			width: 90,
			boxLabel: _('Messages'),
			name: radioGroupName,
			inputValue: 'message',
			checked: true,
			listeners: {
				check: this.onRadioChecked,
				scope: this
			}
		},{
			xtype: 'radio',
			width: 70,
			boxLabel: _('Folders'),
			name: radioGroupName,
			inputValue: 'folder',
			listeners: {
				check: this.onRadioChecked,
				scope: this
			}
		}];
	},

	/**
	 * Event handler which is fired when a {@link Ext.form.Radio}
	 * has been checked. This will send request to load data in store.
	 * @param {Ext.form.Radio} radio The radio which was checked
	 * @param {Boolean} checked The new checked value
	 * @private
	 */
	onRadioChecked: function(radio, checked)
	{
		// load data about deleted message or folder in store based on the selected radio
		if (checked === true) {
			this.itemType = radio.inputValue;
			this.store.setItemType(this.itemType);
			this.store.load();
		}
	},

	/**
	 * Event handler when the "Permanent Delete" button has been pressed.
	 * This will obtain the selected record(s) to be hard-deleted by
	 * {@link Ext.grid.RowSelectionModel#getSelections getSelection} method.
	 * @param {Ext.Button} button button component
	 * @param {Ext.EventObject} eventObj event object for the click event.
	 * @private
	 */
	onPermanentDelete: function(button, eventObj)
	{
		var records = this.getSelectionModel().getSelections();
		this.doPermanentDelete(records);
	},

	/**
	 * Event handler when the "Delete All" button has been pressed.
	 * This will raise a Conformation which ask user that he/she want to go ahead and
	 * Permanently delete all the items or not.
	 * @param {Ext.Button} button button component
	 * @param {Ext.EventObject} eventObj event object for the click event.
	 * @private
	 */
	onDeleteAll: function(button, eventObj)
	{
		Ext.MessageBox.show({
			title: _('Delete all items'),
			msg: _('Are you sure you want to permanently delete all items?'),
			buttons: Ext.MessageBox.YESNO,
			fn: function(buttonClicked) {
				if (buttonClicked == 'yes') {
					this.doPermanentDelete([], true);
				}
			},
			scope: this
		});
	},

	/**
	 * Helper for deleting / restoring items.
	 * @param {Zarafa.common.restoreitem.data.RestoreItemRecord[]} records The records that should be hard-deleted
	 * @param {boolean} bulkAction true to either restore/delete all folder/items.
	 * @private
	 */
	doAction: function(records, action, bulkAction)
	{
		if (bulkAction) {
			this.store.load({
				folder: this.folder,
				params: {
					message_action: {
						action_type: action + "All"
					}
				}
			});
		} else {
			var saveRecords = records.map(function(record) {
				record.addMessageAction('action_type', action + this.itemType);
				this.store.remove(record);
				return record;
			}, this);
			this.store.save(saveRecords);
		}
	},

	/**
	 * This will Permanently delete the selected record(s) which is passed as argument.
	 * @param {Zarafa.common.restoreitem.data.RestoreItemRecord[]} records The records that should be hard-deleted
	 * @param {boolean} bulkAction true to permanently delete all items.
	 * @private
	 */
	doPermanentDelete: function(records, bulkAction)
	{
		this.doAction(records, 'delete', bulkAction);
	},

	/**
	 * Event handler when the "Restore" button has been pressed.
	 * This will obtain the selected record(s) to be restored by
	 * {@link Ext.grid.RowSelectionModel#getSelections getSelection} method.
	 * @param {Ext.Button} button button component
	 * @param {Ext.EventObject} eventObj event object for the click event.
	 * @private
	 */
	onRestore: function(button, eventObj)
	{
		var records = this.getSelectionModel().getSelections();
		this.doRestore(records);
	},

	/**
	 * Event handler when the "Restore All" button has been pressed.
	 * This will raise a Conformation which ask user that he/she want to go ahead and
	 * restore all the items or not.
	 * @param {Ext.Button} button button component
	 * @param {Ext.EventObject} eventObj event object for the click event.
	 * @private
	 */
	onRestoreAll: function(button, eventObj)
	{
		Ext.MessageBox.show({
			title: _('Restore all items'),
			msg: _('Are you sure you want to restore all items?'),
			buttons: Ext.MessageBox.YESNO,
			fn: function(buttonClicked) {
				if (buttonClicked == 'yes') {
					this.doRestore([], true);
				}

			},
			scope: this
		});
	},

	/**
	 * This will retore the selected record(s) which is passed as argument.
	 * @param {Zarafa.common.restoreitem.data.RestoreItemRecord[]} records The records that should be restored
	 * @param {boolean} bulkAction true to restore all items.
	 * @private
	 */
	doRestore: function(records, bulkAction)
	{
		this.doAction(records, 'restore', bulkAction);
	},

	/**
	 * Event handler which is called when the {@link #store} has been loaded.
	 * The Appropriate Column Model will be configured accordingly.
	 * @param {Ext.data.Store} store The store which was loaded
	 * @param {Ext.data.Record[]} records The records which were loaded from the store
	 * @param {Object} options The options which were used to load the data
	 * @private
	 */
	onStoreLoad: function( store, records, options )
	{
		if (Ext.isDefined(options.params.itemType) && options.params.itemType === 'folder') {
			this.reconfigure(store, this.initFolderColumnModel());
		} else {
			this.reconfigure(store, this.initMessageColumnModel());
		}

		this.getSelectionModel().selectFirstRow();

		this.disableToolbarButton(store);

		Zarafa.common.restoreitem.dialogs.RestoreItemPanel.superclass.onStoreLoad.apply(this, arguments);
	},

	/**
	 * Event handler which is called when the selection has been changed.
	 * The tool bar buttons for Permanent-Delete/Restore will be activate/deactivate accordingly.
	 * @param {Ext.grid.RowSelectionModel} selectionModel The selection model used by the grid.
	 * @private
	 */
	onSelectionChange: function(selectionModel)
	{
		var noSelection = (selectionModel.hasSelection() === false);

		this.restoreButton.setDisabled(noSelection);
		this.permanentDeleteButton.setDisabled(noSelection);
	},

	/**
	 * Event handler for the {@link Ext.data.Store#remove} event which is fired
	 * by the {@link Ext.data.Store}.
	 * This will update the value of {@link #statusMessage}.
	 * @param {Ext.data.Store} store The store which fired the event
	 * @param {Ext.data.Record} record The record which was updated
	 * @param {Number} index The index from where the records were deleted
	 * @private
	 */
	setStatusMessage: function(store, record, index)
	{
		this.statusMessage.setValue(String.format(ngettext('Total {0} recoverable item', 'Total {0} recoverable items', store.getCount()), store.getCount()));
	},

	/**
	 * Event handler for the {@link Ext.data.Store#remove} event which is fired
	 * by the {@link Ext.data.Store}.
	 * This will activate/deactivate tool bar buttons for DeleteAll/RestoreAll accordingly.
	 * @param {Ext.data.Store} store The store which fired the event
	 * @param {Ext.data.Record} record The record which was updated
	 * @param {Number} index The index from where the records were deleted
	 * @private
	 */
	disableToolbarButton: function(store, record, index)
	{
		var noItem = (store.getCount() === 0);
		this.deleteAllButton.setDisabled(noItem);
		this.restoreAllButton.setDisabled(noItem);
	},

	/**
	 * Creates and returns a column model object to display Folder related columns,
	 * used in {@link Ext.grid.GridPanel.colModel colModel} config
	 * @return {Ext.grid.ColumnModel} column model object
	 * @private
	 */
	initFolderColumnModel: function()
	{
		return new Ext.grid.ColumnModel({
			columns: [{
				dataIndex: 'icon_index',
				headerCls: 'zarafa-icon-column',
				header: '<p class="icon_index">&nbsp;</p>',
				tooltip: _('Sort by: Icon'),
				width: 24,
				sortable: true,
				fixed: true,
				renderer: Zarafa.common.ui.grid.Renderers.icon
			},{
				dataIndex:'display_name',
				header: _('Name'),
				tooltip: _('Sort by: Name'),
				sortable: true,
				renderer: Ext.util.Format.htmlEncode
			},{
				dataIndex:'deleted_on',
				header: _('Deleted On'),
				tooltip: _('Sort by: Deleted On'),
				sortable: true,
				renderer: Zarafa.common.ui.grid.Renderers.datetime
			},{
				dataIndex: 'content_count',
				header: _('Item Count'),
				tooltip: _('Sort by: Item Count'),
				sortable: true,
				renderer: Ext.util.Format.htmlEncode
			}]
		});
	},

	/**
	 * Creates and returns a column model object to display Messages related columns,
	 * used in {@link Ext.grid.GridPanel.colModel colModel} config
	 * @return {Ext.grid.ColumnModel} column model object
	 * @private
	 */
	initMessageColumnModel: function()
	{
		return new Ext.grid.ColumnModel({
			columns: [{
				dataIndex: 'icon_index',
				headerCls: 'zarafa-icon-column',
				header: '<p class="icon_index">&nbsp;</p>',
				tooltip: _('Sort by: Icon'),
				width: 24,
				sortable: true,
				fixed: true,
				renderer: Zarafa.common.ui.grid.Renderers.icon
			},{
				dataIndex: 'hasattach',
				headerCls: 'zarafa-icon-column',
				header: '<p class=\'icon_paperclip\'>&nbsp;</p>',
				tooltip: _('Sort by: Attachment'),
				width: 24,
				sortable: true,
				fixed: true,
				renderer: Zarafa.common.ui.grid.Renderers.attachment
			},{
				dataIndex:'sender_name',
				header: _('From'),
				tooltip: _('Sort by: From'),
				sortable: true,
				renderer: Ext.util.Format.htmlEncode
			},{
				dataIndex: 'subject',
				header: _('Subject'),
				tooltip: _('Sort by: Subject'),
				sortable: true,
				renderer: Ext.util.Format.htmlEncode
			},{
				dataIndex:'deleted_on',
				header: _('Deleted On'),
				tooltip: _('Sort by: Deleted On'),
				sortable: true,
				renderer: Zarafa.common.ui.grid.Renderers.datetime
			},{
				dataIndex: 'message_delivery_time',
				header: _('Received'),
				tooltip: _('Sort by: Received'),
				sortable: true,
				renderer: Zarafa.common.ui.grid.Renderers.datetime
			},{
				dataIndex:'message_size',
				header: _('Size'),
				tooltip: _('Sort by: Size'),
				sortable: true,
				renderer: Zarafa.common.ui.grid.Renderers.size
			}]
		});
	},

	/**
	 * Event handler which triggered when scrollbar gets scrolled more then 90% of it`s height.
	 * it will be used to start live scroll on {@link Zarafa.core.data.ListModuleStore ListModuleStore}.
	 * also it will register event on {@link Zarafa.core.data.ListModuleStore ListModuleStore} to get
	 * updated batch of mails status.
	 *
	 * @param {Number} cursor the cursor contains the last index of record in grid.
	 * @private
	 */
	onLiveScrollStart: function(cursor)
	{
		this.model.startLiveScroll(cursor, this.getStore());
	},

	/**
	 * Event handler which triggered when header of grid was clicked to apply the sorting
	 * on {@link Zarafa.common.restoreitem.dialogs.RestoreItemPanel RestoreItemPanel}. it will first stop the
	 * {@link Zarafa.core.ContextModel#stopLiveScroll live scroll} and then apply the sorting.
	 * @private
	 */
	onBeforeSort: function()
	{
		this.model.stopLiveScroll();
	}
});

Ext.reg('zarafa.restoreitempanel',Zarafa.common.restoreitem.dialogs.RestoreItemPanel);
