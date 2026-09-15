/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.task.ui');

/**
 * @class Grommunio.task.ui.TaskGridView
 * @extends Grommunio.common.ui.grid.MapiMessageGrid
 * @xtype grommunio.taskgrid
 *
 * this view is used to list all the tasks as a list view
 */
Grommunio.task.ui.TaskGridView = Ext.extend(Grommunio.common.ui.grid.MapiMessageGrid, {
	/**
	 * @cfg {Grommunio.task.TaskContextModel} model data handling part of context
	 */
	model: undefined,

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
		config.plugins.push('grommunio.taskgridrowactions');

		Ext.applyIf(config, {
			xtype: 'grommunio.taskgrid',
			ariaLabel: _('Tasks list'),
			border: false,
			stateful: true,
			statefulRelativeDimensions: false,
			loadMask: this.initLoadMask(),
			viewConfig: this.initViewConfig(),
			selModel: this.initSelectionModel(),
			colModel: this.initColumnModel(config.model),
			enableDragDrop: true,
			ddGroup: 'dd.mapiitem'
		});

		Grommunio.task.ui.TaskGridView.superclass.constructor.call(this, config);
	},

	/**
	 * @return {Object} view config object
	 * @private
	 */
	initViewConfig: function()
	{
		return {
			autoExpandColumn: 'subject',
			enableRowBody: false,
			getRowClass: this.viewConfigGetRowClass
		};
	},

	/**
	 * @return {Object} loas mask config object
	 * @private
	 */
	initLoadMask: function()
	{
		return {
			msg: _('Loading tasks') + '...'
		};
	},

	/**
	 * creates and returns a column model object, used in {@link Ext.grid.EditorGridPanel.colModel colModel} config
	 *
	 * @param {Grommunio.task.TaskContextModel} model The {@link Grommunio.task.TaskContextModel}.
	 * @return {Ext.grid.ColumnModel} column model object
	 * @private
	 */
	initColumnModel: function(model)
	{
		return new Grommunio.task.ui.TaskGridColumnModel({model: model});
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
	 * initialize events for the grid panel
	 * @private
	 */
	initEvents: function()
	{
		Grommunio.task.ui.TaskGridView.superclass.initEvents.call(this);

		this.on({
			'cellclick': this.onCellClick,
			'rowdblclick': this.onRowDblClick,
			scope: this
		});

		this.mon(this.context, 'viewmodechange', this.onContextViewModeChange, this);

		// Call the handler manually as task-context-object isn't initialized yet,
		// while switching to task context for the first time.
		this.onContextViewModeChange(this.context, this.context.getCurrentViewMode());

		// Add an event handler that will reload the store when the flag status of
		// a record has been changed
		this.mon(this.getStore(), 'update', this.onStoreUpdate, this);
	},

	/**
	 * Event handler for the cellclick event of the grid. Will open the
	 * {@link Grommunio.common.flags.ui.FlagsMenu FlagContextMenu} if flag icon column
	 * was clicked by user.
	 *
	 * @param {Grommunio.task.ui.TaskGridView} grid The task grid
	 * @param {Number} rowIndex The index number of the row that was clicked
	 * @param {Number} columnIndex The index number of the column that was clicked
	 * @param {Ext.EventObject} event The event object
	 * @private
	 */
	onCellClick: function(grid, rowIndex, columnIndex, e)
	{
		var record = this.store.getAt(rowIndex);
		if (!Ext.isDefined(record)) {
			return;
		}

		var cm = this.getColumnModel();
		var column = cm.config[columnIndex];
		// show flag menu only for received/assignee task copy.
		var disabled = record.isMessageClass('IPM.Task', true) && (record.isTaskOrganized() || record.isTaskNotResponded());
		if(column.dataIndex === 'flag_due_by' && !disabled) {
			Grommunio.task.Actions.openFlagsMenu(record, {
				position: e.getXY()
			});
		}
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
		Grommunio.common.Actions.openMessageContent(this.getSelectionModel().getSelected());
	},

	/**
	 * Event handler for the update event of the store of the grid. Will reload the store (and thus update
	 * the view) when the flag status of a record has been changed.
	 * @param {Grommunio.core.data.IPMStore} store The store with the data that is being displayed in the grid
	 * @param {Grommunio.core.data.IPMRecord} record The Record that was updated
	 * @private
	 */
	onStoreUpdate: function(store, record)
	{
		var todoListEntryId = container.getHierarchyStore().getDefaultFolder('todolist').get('entryid');
		if ( !Grommunio.core.EntryId.compareEntryIds(todoListEntryId, store.entryId) ){
			// Only reload when watching the To-do list
			return;
		}

		if ( record.modified && (record.isModified('flag_due_by') || record.isModified('flag_request')) ){
			store.reload();
		}
	},

	/**
	 * Event handler which is triggered when the {@link Grommunio.task.ui.TaskGridView TaskGridView}
	 * {@link Grommunio.core.data.IPMRecord record} selection is changed. This will inform
	 * the {@link Grommunio.task.TaskContextModel contextmodel} about the change.
	 *
	 * @param {Ext.grid.RowSelectionModel} selectionModel The selection model used by the grid.
	 * @private
	 */
	onSelectionChange: function(selectionModel)
	{
		this.model.setSelectedRecords(selectionModel.getSelections());
	},

	/**
	 * Apply custom style and content for the row body. This will always
	 * apply the Complete/Incomplete and overdue style to the entire row.
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
	viewConfigGetRowClass: function(record, rowIndex, rowParams, store)
	{
		var cssClass = '';
		var complete;

		// For TaskRecords we will use the complete field to style it strikethrough . For
		// other records (in the Todo-list) we will use the flag_status field.
		if ( record instanceof Grommunio.task.TaskRecord ){
			complete = record.get('complete');
		} else {
			complete = record.get('flag_status') === Grommunio.core.mapi.FlagStatus.completed;
		}

		var duedate = record.get('duedate');
		if (Ext.isDate(duedate) && duedate.getTime() < new Date().getTime()) {
			cssClass += 'grommunio-task-overdue ';
		}

		if (complete) {
			cssClass += 'grommunio-task-complete ';
		}

		return cssClass;
	},

	/**
	 * Event handler which is fired when the {@link Grommunio.core.Context} fires the
	 * {@link Grommunio.core.Context#viewmodechange viewmodechange} event.
	 * This will check the selected mode, and if needed change the
	 * {@link Ext.grid.Column columns} inside the {@link Ext.grid.ColumnModel ColumnModel}
	 * of this grid. Either use the simple set or the detailed set.
	 *
	 * @param {Grommunio.core.Context} context The context which fired the event
	 * @param {Grommunio.mail.data.ViewModes} newViewMode The new active mode
	 * @param {Grommunio.mail.data.ViewModes} oldViewMode The previous mode
	 * @private
	 */
	onContextViewModeChange: function(context, newViewMode, oldViewMode)
	{
		switch(newViewMode){
			case Grommunio.task.data.ViewModes.SIMPLE:
				this.getColumnModel().setSimpleView(true);
				break;
			case Grommunio.task.data.ViewModes.DETAILED:
				this.getColumnModel().setSimpleView(false);
				break;
		}
	}
});

Ext.reg('grommunio.taskgrid', Grommunio.task.ui.TaskGridView);
