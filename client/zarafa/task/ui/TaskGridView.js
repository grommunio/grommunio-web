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
			'rowdblclick': this.onRowDblClick,
			scope: this
		});

		this.mon(this.context, 'viewmodechange', this.onContextViewModeChange, this);

		// Call the handler manually as task-context-object isn't initialized yet,
		// while switching to task context for the first time.
		this.onContextViewModeChange(this.context, this.context.getCurrentViewMode());
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
	},

	/**
	 * Event handler which is fired when the {@link Zarafa.core.Context} fires the
	 * {@link Zarafa.core.Context#viewmodechange viewmodechange} event.
	 * This will check the selected mode, and if needed change the
	 * {@link Ext.grid.Column columns} inside the {@link Ext.grid.ColumnModel ColumnModel}
	 * of this grid. Either use the simple set or the detailed set.
	 *
	 * @param {Zarafa.core.Context} context The context which fired the event
	 * @param {Zarafa.mail.data.ViewModes} newViewMode The new active mode
	 * @param {Zarafa.mail.data.ViewModes} oldViewMode The previous mode
	 * @private
	 */
	onContextViewModeChange : function(context, newViewMode, oldViewMode)
	{
		switch(newViewMode){
			case Zarafa.task.data.ViewModes.SIMPLE :
				this.getColumnModel().setSimpleView(true);
				break;
			case Zarafa.task.data.ViewModes.DETAILED :
				this.getColumnModel().setSimpleView(false);
				break;
		}
	}
});

Ext.reg('zarafa.taskgrid', Zarafa.task.ui.TaskGridView);
