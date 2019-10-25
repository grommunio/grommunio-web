Ext.namespace('Zarafa.common.manageCc.ui');

/**
 * @class Zarafa.common.manageCc.ui.ManageCcGrid
 * @extends Ext.grid.GridPanel
 * @xtype zarafa.manageccgrid
 *
 * Grid panel will be used to display user. Which show in Cc recipient field in create mail dialog.
 */
Zarafa.common.manageCc.ui.ManageCcGrid = Ext.extend(Ext.grid.GridPanel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor: function (config) {
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'zarafa.manageccgrid',
			border: true,
			viewConfig: {
				forceFit: true,
				deferEmptyText: false,
				emptyText: '<div class=\'emptytext\'>' + _('No Cc recipient configured') + '</div>'
			},
			loadMask: {
				msg: _('Loading Cc recipients') + '...'
			},
			store : new Zarafa.core.data.IPMRecipientStore({
				autoResolve : false,
				autoDestroy : true,
				customObjectType : Zarafa.core.data.RecordCustomObjectType.ZARAFA_CC_RECIPIENT
			}),
			columns: this.initColumnModel(),
			selModel: new Zarafa.common.ui.grid.RowSelectionModel({
				singleSelect: true
			})
		});

		Zarafa.common.manageCc.ui.ManageCcGrid.superclass.constructor.call(this, config);
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
			width : 25,
			sortable : false,
			menuDisabled :true,
			fixed : true,
			renderer : Zarafa.common.ui.grid.Renderers.icon
		},{
			dataIndex : 'reply_mail',
			header : _('Reply Mail'),
			renderer : this.columnRenderer,
			sortable : false,
			menuDisabled :true,
			fixed : true,
			align  : "center",
			width: 150,
			listeners: {
				click: this.onCellClick
			}
		},{
			dataIndex : 'new_mail',
			header : _('New Mail'),
			renderer : this.columnRenderer,
			sortable : false,
			align  : "center",
			menuDisabled :true,
			fixed : true,
			width: 150,
			listeners: {
				click: this.onCellClick,
			}
		},{
			dataIndex : 'display_name',
			header : _('Display Name'),
			renderer : Zarafa.common.ui.grid.Renderers.displayName,
			sortable : false,
			menuDisabled :true,
			width: 250
		},{
			dataIndex : 'smtp_address',
			header : _('Email Address'),
			renderer : Zarafa.common.ui.grid.Renderers.displayName,
			sortable : false,
			menuDisabled :true,
			width: 250
		}];
	},

	/**
	 * initialize events for the grid panel.
	 * @private
	 */
	initEvents : function()
	{
		Zarafa.common.manageCc.ui.ManageCcGrid.superclass.initEvents.apply(this, arguments);

		this.on({
			'viewready': this.onViewReady,
			'rowdblclick': this.onRowDblClick,
			scope : this
		});
	},

	/**
	 * Render which shows cross or green right icon in grid column if Cc recipient is configured
	 * for the 'New mail' or 'Reply mail'.
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @return {String} The formatted string
	 */
	columnRenderer : function (value, p) {
		p.css += 'zarafa-grid-empty-cell';
		p.css += value === true ? ' icon_flag_complete' : ' icon_cross_red';
		return '';
	},

	/**
	 * Function which delete the {@link Zarafa.common.manageCc.data.IPMCcRecipientRecord IPMCcRecipientRecord}
	 * remove the Cc recipient from the {@link Zarafa.core.data.IPMRecipientStore IPMRecipientStore}.
	 */
	removeCcRecipient : function ()
	{
		var selectionModel = this.getSelectionModel();
		var record = this.getSelectionModel().getSelected();

		if(!record) {
			Ext.Msg.alert(_('Remove'), _('Please select a Cc recipient record.'));
			return;
		}

		// before removing Cc recipient we should select next available record,
		// because deleting Cc recipient will remove selection
		if (selectionModel.hasNext()) {
			selectionModel.selectNext();
		} else if (selectionModel.hasPrevious()) {
			selectionModel.selectPrevious();
		}

		this.store.remove(record);
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
	 * Event handler which is fired when the {@link Zarafa.common.manageCc.ui.ManageCcGrid ManageCcGrid} is double clicked.
	 * it will call generic function to handle the functionality.
	 *
	 * @param {Ext.grid.GridPanel} grid the grid of which the row double clicked.
	 * @param {Number} rowIndex number of the row double clicked.
	 * @private
	 */
	onRowDblClick : function(grid, rowIndex)
	{
		var store = grid.getStore();
		var record = store.getAt(rowIndex);

		if(record.isOneOff()) {
			this.addOrEditManageCcRecipient(record, false);
		} else {
			Zarafa.common.Actions.openViewRecipientContent(record);
		}
	},
	
	/**
	 * Event handler triggered when the icon on the cell of "Reply Mail" or "New Mail" is clicked.
	 *
	 * @param {Object} item The item of {Ext.grid.ColumnModel columnModel} which was clicked.
	 * @param {Ext.grid.GridPanel} grid the grid of which the row was clicked.
	 * @param {Number} rowIndex number of the row clicked.
	 */
	onCellClick : function(item, grid, rowIndex)
	{
		var store = grid.getStore();
		var record = store.getAt(rowIndex);
		record.set(item.dataIndex, !record.get(item.dataIndex));
	},

	/**
	 * It will call {@link Zarafa.common.Actions#openEditRecipientContent} to add or edit external contact.
	 * @param {Ext.data.Record} record record to be opened
	 * @param {Boolean} removeOnCancel true to remove the record
	 * from store while pressing cancel button, false otherwise
	 */
	addOrEditManageCcRecipient : function (record, removeOnCancel)
	{
		var componentType = Zarafa.core.data.SharedComponentType['common.managecc.dialog.managecceditcontentpanel'];
		Zarafa.common.Actions.openEditRecipientContent(componentType, record, { removeOnCancel : removeOnCancel});
	}
});

Ext.reg('zarafa.manageccgrid', Zarafa.common.manageCc.ui.ManageCcGrid);
