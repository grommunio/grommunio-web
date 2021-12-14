Ext.namespace('Zarafa.common.sendas.ui');

/**
 * @class Zarafa.common.sendas.ui.SendAsGrid
 * @extends Ext.grid.GridPanel
 * @xtype zarafa.sendasgrid
 *
 * {@link Zarafa.common.sendas.ui.SendAsGrid SendAsGrid} will be used to display
 * sendas of the current user.
 */
Zarafa.common.sendas.ui.SendAsGrid = Ext.extend(Ext.grid.GridPanel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		var store = new Zarafa.core.data.IPMRecipientStore({
			autoResolve: false,
			autoDestroy: true,
			customObjectType: Zarafa.core.data.RecordCustomObjectType.ZARAFA_FROM_RECIPIENT
		});

		Ext.applyIf(config, {
			xtype: 'zarafa.sendasgrid',
			store: store,
			border: true,
			viewConfig: {
				forceFit: true,
				deferEmptyText: false,
				emptyText: '<div class=\'emptytext\'>' + _('No from addresses configured') + '</div>'
			},
			loadMask: {
				msg: _('Loading from addresses') + '...'
			},
			columns: this.initColumnModel(),
			selModel: new Zarafa.common.ui.grid.RowSelectionModel({
				singleSelect: true
			}),
			listeners: {
				viewready: this.onViewReady,
				rowdblclick: this.onRowDblClick,
				scope: this
			}
		});

		Zarafa.common.sendas.ui.SendAsGrid.superclass.constructor.call(this, config);
	},

	/**
	 * Creates a column model object, used in {@link #colModel} config
	 * @return {Ext.grid.ColumnModel} column model object
	 * @private
	 */
	initColumnModel: function()
	{
		return [{
			dataIndex: 'icon_index',
			headerCls: 'zarafa-icon-column',
			header: '<p class="icon_index">&nbsp;</p>',
			width: 24,
			fixed: true,
			renderer: Zarafa.common.ui.grid.Renderers.icon
		},{
			dataIndex: 'reply_mail',
			header: _('Reply Mail'),
			renderer: this.columnRenderer,
			sortable: false,
			menuDisabled:true,
			fixed: true,
			align: "center",
			width: 150,
			listeners: {
				click: this.onCellClick,
				scope: this
			}
		},{
			dataIndex: 'new_mail',
			header: _('New Mail'),
			renderer: this.columnRenderer,
			sortable: false,
			align: "center",
			menuDisabled:true,
			fixed: true,
			width: 150,
			listeners: {
				click: this.onCellClick,
				scope: this
			}
		},{
			dataIndex: 'forward_mail',
			header: _('Forward Mail'),
			renderer: this.columnRenderer,
			sortable: false,
			align: "center",
			menuDisabled:true,
			fixed: true,
			width: 150,
			listeners: {
				click: this.onCellClick,
				scope: this
			}
		},{
			dataIndex: 'display_name',
			header: _('Name'),
			renderer: Zarafa.common.ui.grid.Renderers.text,
			sortable: false,
			menuDisabled:true,
			width: 250
		},{
			dataIndex: 'smtp_address',
			header: _('Email Address'),
			renderer: Zarafa.common.ui.grid.Renderers.text,
			sortable: false,
			menuDisabled:true,
			width: 250
		}];
	},

	/**
	 * Render which shows cross or green right icon in grid column if From recipient is configured
	 * for the 'New mail', 'Reply mail' or 'Forward mail'.
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @return {String} The formatted string
	 */
	columnRenderer: function (value, p)
	{
		p.css += 'zarafa-grid-empty-cell';
		p.css += value === true ? ' icon_flag_complete' : ' icon_cross_red';
		return '';
	},

	/**
	 * Event handler triggered when the icon on the cell of "Reply Mail" or "New Mail" or "Forward mail" is clicked.
	 *
	 * @param {Object} item The item of {Ext.grid.ColumnModel columnModel} which was clicked.
	 * @param {Ext.grid.GridPanel} grid the grid of which the row was clicked.
	 * @param {Number} rowIndex number of the row clicked.
	 */
	onCellClick: function(item, grid, rowIndex)
	{
		var store = grid.getStore();
		var record = store.getAt(rowIndex);
		var recordProp = item.dataIndex;
		var value = !record.get(recordProp);

		// Uncheck other true values while setting clicked cell's value as true.
		if (value) {
			store.getRange().forEach(function(record) {
				if (record.get(recordProp)) {
					record.set(recordProp, false);
				}
			});
		}
		record.set(item.dataIndex, value);
	},

	/**
	 * Event handler which is fired when the gridPanel is ready. This will automatically
	 * select the first row in the grid.
	 * @private
	 */
	onViewReady: function()
	{
		this.getSelectionModel().selectFirstRow();
	},

	/**
	 * Function will be called to remove a sendas address.
	 * It will raise an alert if there is no selection made by user,
	 * but user is trying to remove record from the grid.
	 */
	removeSendAs: function()
	{
		var selectionModel = this.getSelectionModel();
		var sendasRecord = this.getSelectionModel().getSelected();
		var rowToSelect;

		if(!sendasRecord) {
			Ext.Msg.alert(_('Alert'), _('Please select a from address record.'));
			return;
		}

		// before removing send as we should store row index of next available send as,
		// because deleting send as will remove selection
		if (selectionModel.hasNext()) {
			rowToSelect = selectionModel.last;
		} else if (selectionModel.hasPrevious()) {
			rowToSelect = selectionModel.last-1;
		}

		this.store.remove(sendasRecord);

		if (Ext.isDefined(rowToSelect)) {
			selectionModel.selectRow(rowToSelect);
		}
	},

	/**
	 * Event handler which is fired when the
	 * {@link Zarafa.common.sendas.ui.SendAsGrid SendAsGrid} is double clicked.
	 * it will call generic function to handle the functionality.
	 * @param {Ext.grid.GridPanel} grid the grid of which the row double clicked.
	 * @param {Number} rowIndex number of the row double clicked.
	 * @private
	 */
	onRowDblClick: function(grid, rowIndex)
	{
		var record = grid.getStore().getAt(rowIndex);

		if(record.isOneOff()) {
			this.editSendAsRecipient(record, false);
		} else {
			this.viewSendAsRecipient(record);
		}
	},

	/**
	 * It will call {@link Zarafa.common.Actions#openSendAsRecipientContent} to add or edit external contact.
	 * @param {Ext.data.Record} record record to be opened
	 * @param {Boolean} removeOnCancel true to remove the record
	 * from store while pressing cancel button, false otherwise
	 */
	editSendAsRecipient: function(record, removeOnCancel)
	{
		Zarafa.common.Actions.openSendAsRecipientContent(record, {
			title: _('Add/Edit From recipient'),
			removeOnCancel: removeOnCancel
		});
	},

	/**
	 * It will call {@link Zarafa.common.Actions#openViewRecipientContent} to open the address book contact.
	 * @param {Ext.data.Record} record record to be opened
	 */
	viewSendAsRecipient: function(record)
	{
		Zarafa.common.Actions.openViewRecipientContent(record, {modal:true});
	}
});

Ext.reg('zarafa.sendasgrid', Zarafa.common.sendas.ui.SendAsGrid);
