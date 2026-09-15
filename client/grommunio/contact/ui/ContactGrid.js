Ext.namespace('Grommunio.contact.ui');

/**
 * @class Grommunio.contact.ui.ContactGrid
 * @extends Grommunio.common.ui.grid.MapiMessageGrid
 * @xtype grommunio.contactgrid
 *
 * this view is used to list all the contacts as a list view
 */
Grommunio.contact.ui.ContactGrid = Ext.extend(Grommunio.common.ui.grid.MapiMessageGrid, {
	/**
	 * @cfg {Grommunio.contact.ContactContext} context The context to which this panel belongs
	 */
	context: undefined,

	/**
	 * The {@link Grommunio.contact.ContactContextModel} which is obtained from the {@link #context}.
	 * @property
	 * @type Grommunio.contact.ContactContextModel
	 */
	model: undefined,

	/**
	 * The {@link Grommunio.contact.ContactStore} which is obtained from the {@link #model}.
	 * @property
	 * @type Grommunio.contact.ContactStore
	 */
	store: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		if (!Ext.isDefined(config.model) && Ext.isDefined(config.context)) {
			config.model = config.context.getModel();
		}
		if (!Ext.isDefined(config.store) && Ext.isDefined(config.model)) {
			config.store = config.model.getStore();
		}
		config.store = Ext.StoreMgr.lookup(config.store);

		config.plugins = Ext.value(config.plugins, []);
		if (!Ext.isArray(config.plugins)) {
			config.plugins = [ config.plugins ];
		}
		config.plugins.push('grommunio.contactgridrowactions');

		Ext.applyIf(config, {
			xtype: 'grommunio.contactgrid',
			ariaLabel: _('Contacts list'),
			border: false,
			stateful: true,
			statefulRelativeDimensions: false,
			autoExpandColumn: 'fileas',

			loadMask: this.initLoadMask(),
			viewConfig: this.initViewConfig(),
			selModel: this.initSelectionModel(),
			colModel: this.initColumnModel(),
			enableDragDrop: true,
			ddGroup: 'dd.mapiitem'
		});

		Grommunio.contact.ui.ContactGrid.superclass.constructor.call(this, config);
	},

	/**
	 * @return {Object} view config object
	 * @private
	 */
	initViewConfig: function()
	{
		return {
		};
	},

	/**
	 * @return {Object} loas mask config object
	 * @private
	 */
	initLoadMask: function()
	{
		return {
			msg: _('Loading contacts') + '...'
		};
	},

	/**
	 * creates and returns a column model object, used in {@link Ext.grid.EditorGridPanel.colModel colModel} config
	 * @return {Ext.grid.ColumnModel} column model object
	 * @private
	 */
	initColumnModel: function()
	{
		return new Grommunio.contact.ui.ContactGridColumnModel();
	},

	/**
	 * creates and returns a selection model object, used in {@link Ext.grid.GridPanel.selModel selModel} config
	 * @return {Ext.grid.RowSelectionModel} selection model object
	 * @private
	 */
	initSelectionModel: function()
	{
		return new Ext.grid.RowSelectionModel({
			singleSelect: false,
			listeners: {
				scope: this,
				selectionchange: this.onSelectionChange
			}
		});
	},

	/**
	 * Returns {@link Grommunio.contact.ui.ContactMainPanel ContactMainPanel} object which instantiated all the views
	 * @return {Grommunio.contact.ui.ContactMainPanel} contact main panel
	 */
	getMainPanel: function()
	{
		return this.ownerCt;
	},

	/**
	 * initialize events for the grid panel
	 * @private
	 */
	initEvents: function()
	{
		Grommunio.contact.ui.ContactGrid.superclass.initEvents.apply(this, arguments);

		this.on('rowdblclick', this.onRowDblClick, this);
	},

	/**
	 * Event handler which is triggered when user double clicks on a row.
	 * @param {Ext.grid.GridPanel} grid grid panel object
	 * @param {Number} rowIndex	index of row
	 * @param {Ext.event} eventObj object of the event
	 * @private
	 */
	onRowDblClick: function(grid, rowIndex, eventObj)
	{
		Grommunio.contact.Actions.openDialog(grid.getSelectionModel().getSelections());
	},

	/**
	 * Event handler which is triggered when the {@link Grommunio.contact.ui.ContactGrid ContactGrid}
	 * {@link Grommunio.core.data.IPMRecord record} selection is changed. This will inform
	 * the {@link Grommunio.contact.ContactContextModel contextmodel} about the change.
	 *
	 * @param {Ext.grid.RowSelectionModel} selectionModel The selection model used by the grid.
	 * @private
	 */
	onSelectionChange: function(selectionModel)
	{
		this.model.setSelectedRecords(selectionModel.getSelections());
	}
});

Ext.reg('grommunio.contactgrid', Grommunio.contact.ui.ContactGrid);
