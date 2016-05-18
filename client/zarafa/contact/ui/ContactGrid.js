Ext.namespace('Zarafa.contact.ui');

/**
 * @class Zarafa.contact.ui.ContactGrid
 * @extends Zarafa.common.ui.grid.MapiMessageGrid
 * @xtype zarafa.contactgrid
 *
 * this view is used to list all the contacts as a list view
 */
Zarafa.contact.ui.ContactGrid = Ext.extend(Zarafa.common.ui.grid.MapiMessageGrid, {
	/**
	 * @cfg {Zarafa.contact.ContactContext} context The context to which this panel belongs
	 */
	context : undefined,

	/**
	 * The {@link Zarafa.contact.ContactContextModel} which is obtained from the {@link #context}.
	 * @property
	 * @type Zarafa.contact.ContactContextModel
	 */
	model : undefined,

	/**
	 * The {@link Zarafa.contact.ContactStore} which is obtained from the {@link #model}.
	 * @property
	 * @type Zarafa.contact.ContactStore
	 */
	store : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		if (!Ext.isDefined(config.model) && Ext.isDefined(config.context)) {
			config.model = config.context.getModel();
		}
		if (!Ext.isDefined(config.store) && Ext.isDefined(config.model)) {
			config.store = config.model.getStore();
		}
		config.store = Ext.StoreMgr.lookup(config.store);

		Ext.applyIf(config, {
			xtype : 'zarafa.contactgrid',
			border : false,
			stateful : true,
			statefulRelativeDimensions : false,
			autoExpandColumn : 'fileas',

			loadMask : this.initLoadMask(),
			viewConfig : this.initViewConfig(),
			selModel : this.initSelectionModel(),
			colModel : this.initColumnModel(),
			enableDragDrop : true,
			ddGroup : 'dd.mapiitem'
		});

		Zarafa.contact.ui.ContactGrid.superclass.constructor.call(this, config);
	},

	/**
	 * @return {Object} view config object
	 * @private
	 */
	initViewConfig : function()
	{
		return {
		};
	},

	/**
	 * @return {Object} loas mask config object
	 * @private
	 */
	initLoadMask : function()
	{
		return {
			msg : _('Loading contacts') + '...'
		};
	},

	/**
	 * creates and returns a column model object, used in {@link Ext.grid.EditorGridPanel.colModel colModel} config
	 * @return {Ext.grid.ColumnModel} column model object
	 * @private
	 */
	initColumnModel : function()
	{
		return new Zarafa.contact.ui.ContactGridColumnModel();
	},

	/**
	 * creates and returns a selection model object, used in {@link Ext.grid.GridPanel.selModel selModel} config
	 * @return {Ext.grid.RowSelectionModel} selection model object
	 * @private
	 */
	initSelectionModel : function()
	{
		return new Ext.grid.RowSelectionModel({
			singleSelect : false,
			listeners : {
				scope : this,
				selectionchange : this.onSelectionChange
			}
		});
	},

	/**
	 * Returns {@link Zarafa.contact.ui.ContactMainPanel ContactMainPanel} object which instantiated all the views
	 * @return {Zarafa.contact.ui.ContactMainPanel} contact main panel
	 */
	getMainPanel : function()
	{
		return this.ownerCt;
	},

	/**
	 * initialize events for the grid panel
	 * @private
	 */
	initEvents : function()
	{
		Zarafa.contact.ui.ContactGrid.superclass.initEvents.apply(this, arguments);

		this.on('rowcontextmenu', this.onRowContextMenu, this);
		this.on('rowdblclick', this.onRowDblClick, this);
	},

	/**
	 * Event handler which is triggered when user opens context menu
	 * @param {Ext.grid.GridPanel} grid grid panel object
	 * @param {Number} rowIndex	index of row
	 * @param {Ext.EventObject} eventObj eventObj object of the event
	 * @private
	 */
	onRowContextMenu : function(grid, rowIndex, eventObj)
	{
		// check row is already selected or not, if its not selected then select it first
		var selectionModel = this.getSelectionModel();
		if (!selectionModel.isSelected(rowIndex)) {
			selectionModel.selectRow(rowIndex);
		}

		Zarafa.core.data.UIFactory.openDefaultContextMenu(selectionModel.getSelections(), { position : eventObj.getXY() });
	},

	/**
	 * Event handler which is triggered when user double clicks on a row.
	 * @param {Ext.grid.GridPanel} grid grid panel object
	 * @param {Number} rowIndex	index of row
	 * @param {Ext.event} eventObj object of the event
	 * @private
	 */
	onRowDblClick : function(grid, rowIndex, eventObj)
	{
		Zarafa.contact.Actions.openDialog(grid.getSelectionModel().getSelections());
	},

	/**
	 * Event handler which is triggered when the {@link Zarafa.contact.ui.ContactGrid ContactGrid}
	 * {@link Zarafa.core.data.IPMRecord record} selection is changed. This will inform
	 * the {@link Zarafa.contact.ContactContextModel contextmodel} about the change.
	 *
	 * @param {Ext.grid.RowSelectionModel} selectionModel The selection model used by the grid.
	 * @private
	 */
	onSelectionChange : function(selectionModel)
	{
		this.model.setSelectedRecords(selectionModel.getSelections());
	}
});

Ext.reg('zarafa.contactgrid', Zarafa.contact.ui.ContactGrid);
