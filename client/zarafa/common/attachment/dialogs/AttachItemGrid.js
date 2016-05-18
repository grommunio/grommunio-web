Ext.namespace('Zarafa.common.attachment.dialogs');

/**
 * @class Zarafa.common.attachment.dialogs.AttachItemGrid
 * @extends Zarafa.common.ui.grid.GridPanel
 * @xtype zarafa.attachitemgrid
 *
 * Grid will be used to display contents of folder that is selected in hierarchy.
 * Messages from this grid can be selected to add as an embedded attachment to message.
 */
Zarafa.common.attachment.dialogs.AttachItemGrid = Ext.extend(Zarafa.common.ui.grid.GridPanel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype : 'zarafa.attachitemgrid',
			border : true,
			colModel : this.initColumnModel(),
			selModel : this.initSelectionModel(),
			// provide a dummy store for initialization, this will be changed later on
			store : new Zarafa.core.data.ListModuleStore(),
			loadMask : true,
			tbar : [{
				xtype : 'displayfield',
				value : _('Items:'),
				hideLabel : true
			}, 
				// right align
				'->',
			{
				xtype : 'zarafa.paging',
				pageSize : 50,
				// provide a dummy store for initialization, this will be changed later on
				store : new Zarafa.core.data.ListModuleStore()
			}],
			listeners : {
				// Register event that will change store associated with pagination
				'reconfigure' : this.onGridReconfigure,
				// Register event that will add message as attachment to message
				'rowdblclick' : this.onRowDblClick,
				scope : this
			}
		});

		Zarafa.common.attachment.dialogs.AttachItemGrid.superclass.constructor.call(this, config);
	},

	/**
	 * Creates and returns a column model object, used in {@link Ext.grid.GridPanel.colModel colModel} config.
	 * This will be just a dummy column model, actual column model will be loaded when folder is selected.
	 * @return {Ext.grid.ColumnModel} column model object
	 * @private
	 */
	initColumnModel : function()
	{
		return new Zarafa.common.ui.grid.ColumnModel();
	},

	/**
	 * Creates and returns a selection model object, used in {@link Ext.grid.GridPanel.selModel selModel} config
	 * @return {Ext.grid.RowSelectionModel} selection model object
	 * @private
	 */
	initSelectionModel : function()
	{
		return new Ext.grid.RowSelectionModel({
			singleSelect : true
		});
	},

	/**
	 * Event handler which is fired when the {@link #store store} is loaded. And we can select the first row.
	 * @private
	 */
	onStoreLoad : function()
	{
		this.getSelectionModel().selectFirstRow();
	},

	/**
	 * Function will change {@link Zarafa.core.data.ListModuleStore ListModuleStore} associated with {@link Zarafa.common.ui.PagingToolbar PagingToolbar}
	 * when {@link Zarafa.common.ui.grid.GridPanel GridPanel} is configured with new store.
	 * @param {Zarafa.common.ui.grid.GridPanel} grid grid panel which is reconfigured with new store and column model.
	 * @param {Zarafa.core.data.ListModuleStore} store new store which is now bound with grid panel.
	 * @param {Zarafa.common.ui.grid.ColumnModel} colModel column model which is now bound with grid panel.
	 * @private
	 */
	onGridReconfigure : function(grid, store, colModel)
	{
		// change store of paging toolbar
		var paging = this.getTopToolbar().findByType('zarafa.paging')[0];

		paging.bindStore(store);

		// register event that will select first item in the grid
		this.mon(store, 'load', this.onStoreLoad, this);
	},

	/**
	 * Event handler which is fired when a row in the grid has been double-clicked.
	 * This will call {@link Zarafa.common.attachment.dialogs.AttachItemGrid#attachItem} method.
	 * @param {Ext.grid.GridPanel} grid The grid which fired the event
	 * @param {Number} rowIndex The index of the row which was double clicked
	 * @param {Ext.EventObject} event The event
	 * @private
	 */
	onRowDblClick : function(grid, rowIndex, event)
	{
		this.ownerCt.attachItem();
	}
});

Ext.reg('zarafa.attachitemgrid', Zarafa.common.attachment.dialogs.AttachItemGrid);
