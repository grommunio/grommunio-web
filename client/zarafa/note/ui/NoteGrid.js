/*
 * #dependsFile client/zarafa/note/ui/NoteGridColumnModel.js
 */
Ext.namespace('Zarafa.note.ui');

/**
 * @class Zarafa.note.ui.NoteGrid
 * @extends Zarafa.common.ui.grid.MapiMessageGrid
 * @xtype zarafa.notegrid
 *
 * This GridView extends the {@link Zarafa.common.ui.grid.MapiMessageGrid GridPanel} and
 * implements custom context menus.
 */
Zarafa.note.ui.NoteGrid = Ext.extend(Zarafa.common.ui.grid.MapiMessageGrid, {
	/**
	 * @cfg {Zarafa.note.NoteContext} context The context to which this panel belongs
	 */
	context : undefined,

	/**
	 * The {@link Zarafa.note.NoteContextModel} which is obtained from
	 * the {@link #context}.
	 *
	 * @property
	 * @type Zarafa.note.NoteContextModel
	 */
	model : undefined,

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
			id			: 'note-gridview',
			border		: false,
			autoExpandColumn : 'subject',
			stateful        : true,
			statefulRelativeDimensions : false,
			loadMask	: this.initLoadMask(),
			viewConfig	: this.initViewConfig(),
			selModel	: this.initSelectionModel(),
			colModel	: this.initColumnModel(),
			enableDragDrop : true,
			ddGroup : 'dd.mapiitem'
		});

		Zarafa.note.ui.NoteGrid.superclass.constructor.call(this, config);
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
	 * creates and returns a column model object, used in {@link Ext.grid.EditorGridPanel.colModel colModel} config
	 * @return {Ext.grid.ColumnModel} column model object
	 * @private
	 */
	initColumnModel : function()
	{
		return new Zarafa.note.ui.NoteGridColumnModel();
	},

	/**
	 * @return {Object} loas mask config object
	 * @private
	 */
	initLoadMask : function()
	{
		return {
			msg : _('Loading Notes') + '...'
		};
	},

	/**
	 * initialize events for the grid panel
	 * @private
	 */
	initEvents : function()
	{
		Zarafa.note.ui.NoteGrid.superclass.initEvents.call(this);

		this.on({
			'rowdblclick': this.onNoteRowDblClick,
			scope : this
		});
	},

	/**
	 *@Private
	 *Event handler which is triggered when user double click on row
	 *@param {Ext.grid.GridPanel} grid grid panel object
	 *@param {Number} rowIndex	index of row
	 *@param {Ext.event} eventObj eventObj object of the event
	 */
	onNoteRowDblClick: function(grid, rowIndex, event)
	{
		Zarafa.note.Actions.openNoteContent(grid.getSelectionModel().getSelected());
	},

	/**
	 * Event handler which is triggered when the {@link Zarafa.note.ui.NoteGrid NoteGrid}
	 * {@link Zarafa.core.data.IPMRecord record} selection is changed. This will inform
	 * the {@link Zarafa.note.NoteModel contextmodel} about the change.
	 *
	 * @param {Ext.grid.RowSelectionModel} selectionModel The selection model used by the grid.
	 * @private
	 */
	onSelectionChange : function(selectionModel)
	{
		this.model.setSelectedRecords(selectionModel.getSelections());
	}
});

Ext.reg('zarafa.notegrid',Zarafa.note.ui.NoteGrid);
