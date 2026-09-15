Ext.namespace('Grommunio.common.attachment.dialogs');

/**
 * @class Grommunio.common.attachment.dialogs.AttachItemGrid
 * @extends Grommunio.common.ui.grid.GridPanel
 * @xtype grommunio.attachitemgrid
 *
 * Grid will be used to display contents of folder that is selected in hierarchy.
 * Messages from this grid can be selected to add as an embedded attachment to message.
 */
Grommunio.common.attachment.dialogs.AttachItemGrid = Ext.extend(Grommunio.common.ui.grid.GridPanel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'grommunio.attachitemgrid',
			border: true,
			colModel: this.initColumnModel(),
			selModel: this.initSelectionModel(),
			// provide a dummy store for initialization, this will be changed later on
			store: new Grommunio.core.data.ListModuleStore(),
			loadMask: true,
			tbar: [{
				xtype: 'grommunio.paging',
				pageSize: 50,
				// provide a dummy store for initialization, this will be changed later on
				store: new Grommunio.core.data.ListModuleStore()
			}],
			listeners: {
				// Register event that will change store associated with pagination
				'reconfigure': this.onGridReconfigure,
				// Register event that will add message as attachment to message
				'rowdblclick': this.onRowDblClick,
				scope: this
			}
		});

		Grommunio.common.attachment.dialogs.AttachItemGrid.superclass.constructor.call(this, config);
	},

	/**
	 * Creates and returns a column model object, used in {@link Ext.grid.GridPanel.colModel colModel} config.
	 * This will be just a dummy column model, actual column model will be loaded when folder is selected.
	 * @return {Ext.grid.ColumnModel} column model object
	 * @private
	 */
	initColumnModel: function()
	{
		return new Grommunio.common.ui.grid.ColumnModel();
	},

	/**
	 * Creates and returns a selection model object, used in {@link Ext.grid.GridPanel.selModel selModel} config
	 * @return {Ext.grid.RowSelectionModel} selection model object
	 * @private
	 */
	initSelectionModel: function()
	{
		return new Ext.grid.RowSelectionModel({
			singleSelect: true
		});
	},

	/**
	 * Event handler which is fired when the {@link #store store} is loaded. And we can select the first row.
	 * @private
	 */
	onStoreLoad: function()
	{
		this.getSelectionModel().selectFirstRow();
	},

	/**
	 * Function will change {@link Grommunio.core.data.ListModuleStore ListModuleStore} associated with {@link Grommunio.common.ui.PagingToolbar PagingToolbar}
	 * when {@link Grommunio.common.ui.grid.GridPanel GridPanel} is configured with new store.
	 * @param {Grommunio.common.ui.grid.GridPanel} grid grid panel which is reconfigured with new store and column model.
	 * @param {Grommunio.core.data.ListModuleStore} store new store which is now bound with grid panel.
	 * @param {Grommunio.common.ui.grid.ColumnModel} colModel column model which is now bound with grid panel.
	 * @private
	 */
	onGridReconfigure: function(grid, store, colModel)
	{
		// change store of paging toolbar
		var paging = this.getTopToolbar().findByType('grommunio.paging')[0];

		paging.bindStore(store);

		// register event that will select first item in the grid
		this.mon(store, 'load', this.onStoreLoad, this);
	},

	/**
	 * Event handler which is fired when a row in the grid has been double-clicked.
	 * This will call {@link Grommunio.common.attachment.dialogs.AttachItemGrid#attachItem} method.
	 * @param {Ext.grid.GridPanel} grid The grid which fired the event
	 * @param {Number} rowIndex The index of the row which was double clicked
	 * @param {Ext.EventObject} event The event
	 * @private
	 */
	onRowDblClick: function(grid, rowIndex, event)
	{
		this.ownerCt.attachItem();
	}
});

Ext.reg('grommunio.attachitemgrid', Grommunio.common.attachment.dialogs.AttachItemGrid);
