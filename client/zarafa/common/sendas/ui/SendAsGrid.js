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
	constructor : function(config)
	{
		config = config || {};
	
		Ext.applyIf(config, {
			xtype : 'zarafa.sendasgrid',
			border : true,
			viewConfig : {
				forceFit : true,
				deferEmptyText : false,
				emptyText : '<div class=\'emptytext\'>' + _('No send as address configured') + '</div>'
			},
			loadMask : {
				msg : _('Loading send as addresses') + '...'
			},
			columns : this.initColumnModel(),
			selModel : new Zarafa.common.ui.grid.RowSelectionModel({
				singleSelect : true
			}),
			listeners : {
				viewready : this.onViewReady,
				rowdblclick : this.onRowDblClick,
				scope : this
			}
		});

		Zarafa.common.sendas.ui.SendAsGrid.superclass.constructor.call(this, config);
	},

	/**
	 * Creates a column model object, used in {@link #colModel} config
	 * @return {Ext.grid.ColumnModel} column model object
	 * @private
	 */
	initColumnModel : function()
	{
		return [{
			dataIndex : 'icon_index',
			headerCls: 'zarafa-icon-column',
			header : '<p class="icon_index">&nbsp;</p>',
			width : 24,
			fixed : true,
			renderer : Zarafa.common.ui.grid.Renderers.icon
		},{
			dataIndex : 'display_name',
			header : _('Name'),
			renderer : Zarafa.common.ui.grid.Renderers.text
		},{
			dataIndex : 'smtp_address',
			header : _('Email Address'),
			renderer : Zarafa.common.ui.grid.Renderers.text
		}];
	},

	/**
	 * Event handler which is fired when the gridPanel is ready. This will automatically
	 * select the first row in the grid.
	 * @private
	 */
	onViewReady : function()
	{
		this.getSelectionModel().selectFirstRow();
	},

	/**
	 * Function will be called to remove a sendas address.
	 * It will raise an alert if there is no selection made by user,
	 * but user is trying to remove record from the grid.
	 */
	removeSendAs : function()
	{
		var selectionModel = this.getSelectionModel();
		var sendasRecord = this.getSelectionModel().getSelected();

		if(!sendasRecord) {
			Ext.Msg.alert(_('Alert'), _('Please select a send as record.'));
			return;
		}

		// before removing send as we should select next available send as,
		// because deleting send as will remove selection
		if (selectionModel.hasNext()) {
			selectionModel.selectNext();
		} else if (selectionModel.hasPrevious()) {
			selectionModel.selectPrevious();
		}

		this.store.remove(sendasRecord);
	},
	
	/**
	 * Event handler which is fired when the 
	 * {@link Zarafa.common.sendas.ui.SendAsGrid SendAsGrid} is double clicked.
	 * it will call generic function to handle the functionality.
	 * @param {Ext.grid.GridPanel} grid the grid of which the row double clicked.	 
	 * @param {Number} rowIndex number of the row double clicked.
	 * @private
	 */
	onRowDblClick : function(grid, rowIndex)
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
	editSendAsRecipient : function(record, removeOnCancel)
	{
		Zarafa.common.Actions.openSendAsRecipientContent(record, { removeOnCancel : removeOnCancel});
	},
	
	/**
	 * It will call {@link Zarafa.common.Actions#openViewRecipientContent} to open the address book contact.
	 * @param {Ext.data.Record} record record to be opened
	 */
	viewSendAsRecipient : function(record)
	{
		Zarafa.common.Actions.openViewRecipientContent(record);
	}
});

Ext.reg('zarafa.sendasgrid', Zarafa.common.sendas.ui.SendAsGrid);
