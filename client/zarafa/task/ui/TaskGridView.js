Ext.namespace('Zarafa.task.ui');

/**
 * @class Zarafa.task.ui.TaskGridView
 * @extends Zarafa.common.ui.grid.MapiMessageGrid
 * @xtype zarafa.taskgrid
 *
 * this view is used to list all the tasks as a list view
 */
Zarafa.task.ui.TaskGridView = Ext.extend(Zarafa.common.ui.grid.MapiMessageGrid, {
	/**
	 * @cfg {Zarafa.task.TaskContextModel} model data handling part of context
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
			xtype : 'zarafa.taskgrid',
			border : false,
			stateful : true,
			statefulRelativeDimensions : false,
			loadMask : this.initLoadMask(),
			viewConfig : this.initViewConfig(),
			selModel : this.initSelectionModel(),
			colModel : this.initColumnModel(),
			enableDragDrop : true,
			ddGroup : 'dd.mapiitem'
		});

		Zarafa.task.ui.TaskGridView.superclass.constructor.call(this, config);
	},

	/**
	 * @return {Object} view config object
	 * @private
	 */
	initViewConfig : function()
	{
		return {
			autoExpandColumn : 'subject',
			enableRowBody : false,
			getRowClass : this.viewConfigGetRowClass
		};
	},

	/**
	 * @return {Object} loas mask config object
	 * @private
	 */
	initLoadMask : function()
	{
		return {
			msg : _('Loading tasks') + '...'
		};
	},

	/**
	 * creates and returns a column model object, used in {@link Ext.grid.EditorGridPanel.colModel colModel} config
	 * @return {Ext.grid.ColumnModel} column model object
	 * @private
	 */
	initColumnModel : function()
	{
		return new Zarafa.task.ui.TaskGridColumnModel();
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
	 * initialize events for the grid panel
	 * @private
	 */
	initEvents : function()
	{
		Zarafa.task.ui.TaskGridView.superclass.initEvents.call(this);

		this.on({
			'cellcontextmenu': this.onCellContextMenu,
			'rowdblclick': this.onRowDblClick,
			'rowbodycontextmenu': this.onRowBodyContextMenu,
			scope: this
		});
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
		Zarafa.task.Actions.openTaskContent(grid.getSelectionModel().getSelections());
	},

	/**
	 * Event handler which is triggered when user opens context menu
	 * @param {Ext.grid.GridPanel} grid grid panel object
	 * @param {Number} rowIndex	index of row
	 * @param {Ext.EventObject} eventObj eventObj object of the event
	 * @private
	 */
	onRowBodyContextMenu : function(grid, rowIndex, eventObj)
	{
		// check row is already selected or not, if its not selected then select it first
		var selectionModel = this.getSelectionModel();
		if (!selectionModel.isSelected(rowIndex)) {
			selectionModel.selectRow(rowIndex);
		}

		Zarafa.core.data.UIFactory.openDefaultContextMenu(selectionModel.getSelections(), { position : eventObj.getXY() });
	},

	/**
	 * Event handler which is triggered when the user opems the context menu.
	 *
	 * There are some selection rules regarding the context menu. If no rows where
	 * selected, the row on which the context menu was requested will be marked
	 * as selected. If there have been rows selected, but the context menu was
	 * requested on a different row, then the old selection is lost, and the new
	 * row will be selected. If the row on which the context menu was selected is
	 * part of the previously selected rows, then the context menu will be applied
	 * to all selected rows.
	 *
	 * @param {Zarafa.task.ui.TaskGridView} grid The grid which was right clicked
	 * @param {Number} rowIndex The index number of the row which was right clicked
	 * @param {Number} cellIndex The index number of the column which was right clicked
	 * @param {Ext.EventObject} event The event structure
	 * @private
	 */
	onCellContextMenu : function(grid, rowIndex, cellIndex, event)
	{
		var sm = this.getSelectionModel();
		var cm = this.getColumnModel();

		if (sm.hasSelection()) {
			// Some records were selected...
			if (!sm.isSelected(rowIndex)) {
				// But none of them was the record on which the
				// context menu was invoked. Reset selection.
				sm.clearSelections();
				sm.selectRow(rowIndex);
			}
		} else {
			// No records were selected,
			// select row on which context menu was invoked
			sm.selectRow(rowIndex);
		}

		var column = cm.getColumnById(cm.getColumnId(cellIndex));
		var records = sm.getSelections();

		switch (column.dataIndex) {
		case 'importance':
			Zarafa.core.data.UIFactory.openContextMenu(Zarafa.core.data.SharedComponentType['common.contextmenu.importance'], records, { position : event.getXY() });
			break;
		default:
			Zarafa.core.data.UIFactory.openDefaultContextMenu(records, { position : event.getXY() });
			break;
		}
	},

	/**
	 * Event handler which is triggered when the {@link Zarafa.task.ui.TaskGridView TaskGridView}
	 * {@link Zarafa.core.data.IPMRecord record} selection is changed. This will inform
	 * the {@link Zarafa.task.TaskContextModel contextmodel} about the change.
	 *
	 * @param {Ext.grid.RowSelectionModel} selectionModel The selection model used by the grid.
	 * @private
	 */
	onSelectionChange : function(selectionModel)
	{
		this.model.setSelectedRecords(selectionModel.getSelections());
	},

	/**
	 * Apply custom style and content for the row body. This will always
	 * apply the Complete/UnComplete and overdue style to the entire row.
	 *
	 * @param {Ext.data.Record} record The {@link Ext.data.Record Record} corresponding to the current row.
	 * @param {Number} rowIndex The row index
	 * @param {Object} rowParams A config object that is passed to the row template during
	 * rendering that allows customization of various aspects of a grid row.
	 * If enableRowBody is configured true, then the following properties may be set by this function,
	 * and will be used to render a full-width expansion row below each grid row.
	 * @param {Ext.data.Store} store The Ext.data.Store this grid is bound to
	 * @return {String} a CSS class name to add to the row
	 * @private
	 */
	viewConfigGetRowClass : function(record, rowIndex, rowParams, store)
	{
		var cssClass = '';

		var task_complete = record.get('complete');
		var task_duedate = record.get('duedate');

		if (Ext.isDate(task_duedate) && task_duedate.getTime() < new Date().getTime()) {
			cssClass += 'zarafa-task-overdue ';
		}

		if (task_complete) {
			cssClass += 'zarafa-task-complete ';
		}

		return cssClass;
	}
});

Ext.reg('zarafa.taskgrid', Zarafa.task.ui.TaskGridView);
