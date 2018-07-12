Ext.namespace('Zarafa.widgets.folderwidgets');

/**
 * @class Zarafa.widgets.folderwidgets.TasksWidget
 * @extends Zarafa.widgets.folderwidgets.AbstractFolderWidget
 *
 * Widget that shows current, non-completed tasks incl. its duedate, importance,
 * % completed, owner and categories
 */
Zarafa.widgets.folderwidgets.TasksWidget = Ext.extend(Zarafa.widgets.folderwidgets.AbstractFolderWidget, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function (config)
	{
		config = config || {};

		// FIXME - add something to find mails marked for follow-up as well
		var store = new Zarafa.task.TaskStore();

		// sort by duedate
		store.setDefaultSort('duedate', 'asc');

		// Create a restriction, we only want uncomplete tasks, so tasks which
		// do not have the status flag set to Zarafa.core.mapi.TaskStatus.COMPLETE
		store.setRestriction({
			'task': Zarafa.core.data.RestrictionFactory.dataResProperty(
				'status',
				Zarafa.core.mapi.Restrictions.RELOP_NE,
				Zarafa.core.mapi.TaskStatus.COMPLETE
			)
		});

		Ext.applyIf(config, {
			height: this.get('widgetheight') || 300,
			autoScroll: true,
			layout: 'fit',
			folderType: 'task',
			store: store,
			items: [{
				xtype: 'zarafa.gridpanel',
				store: store,
				loadMask: {
					msg: _('Loading tasks') + '...'
				},
				sm: new Ext.grid.RowSelectionModel({
					singleSelect: true
				}),
				viewConfig: {
					deferEmptyText: false,
					emptyText: '<div class="emptytext">' + _('No tasks.') + '</div>',
					forceFit: true,
					enableRowBody: true,
					rowSelectorDepth: 15,
					getRowClass: this.viewConfigGetRowClass

				},
				colModel: new Ext.grid.ColumnModel({
					columns: [{
						header: _("Due Date"),
						tooltip: _("Due Date"),
						dataIndex: "duedate",
						renderer: this.dueDateRenderer
					}, {
						header: "<p class='icon_importance'>&nbsp;</p>",
						tooltip: _("Importance"),
						dataIndex: "importance",
						align: "center",
						width: 55,
						renderer: Zarafa.common.ui.grid.Renderers.importance
					}, {
						header: "%",
						tooltip: _("% Completed"),
						dataIndex: "percent_complete",
						align: "center",
						width: 80,
						renderer: Zarafa.common.ui.grid.Renderers.percentage
					}, {
						header: _('Owner'),
						tooltip: _("Owner"),
						dataIndex: 'owner',
						renderer: this.ownerRenderer
					}],
					defaults: {
						sortable: true,
						menuDisabled: true
					}
				}),
				listeners: {
					'rowcontextmenu': this.onRowContextMenu,
					'rowdblclick': this.onRowDblClick,
					scope: this
				}
			}]
		});

		Zarafa.widgets.folderwidgets.TasksWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Update the filter to make sure only non-completed tasks are shown
	 * @private
	 */
	updateFilter: function ()
	{
		this.store.filterBy(function (record) {
			return (record.get('status') != Zarafa.core.mapi.TaskStatus.COMPLETE);
		}, this);
	},

	/**
	 * Render the due date in the form "d/m/Y" and add color red if
	 * due date is already reached
	 *
	 * @param {Mixed} value The subject of the appointment
	 * @param {Object} metaData Used to set style information to gray out appointments that occur now
	 * @param {Ext.data.Record} record The record being displayed, used to retrieve the start and end times
	 * @private
	 */
	dueDateRenderer: function (value, metaData, record)
	{
		var dateNow = new Date;
		var dateDue = record.get("duedate");
		metaData.attr = "";

		if (!dateDue) {
			value = _("none");
		} else if (dateDue < dateNow.clearTime().add(Date.DAY, 1)) {
			value = _("Today");
			metaData.attr = "style='color: #F00;'";
		} else if (dateDue < dateNow.clearTime().add(Date.DAY, 2)) {
			value = _("Tomorrow");
		} else {
			value = dateDue.format(_("d/m/Y"));
		}


		return String.format("{0}", value)
	},

	/**
	 * Renders the owner of the task as its initials and adds its full
	 * form as a tooltip
	 *
	 * @param {Mixed} value The subject of the appointment
	 * @param {Object} metaData Used to set style information to gray out appointments that occur now
	 * @param {Ext.data.Record} record The record being displayed, used to retrieve the start and end times
	 * @private
	 */
	ownerRenderer: function (value, metaData, record)
	{
		var ownerArray = record.get("owner").split(" "); // array of all parts of the owner's name
		var ownerValue = "";

		for (var i = 0, len = ownerArray.length; i < len; i++) {
			ownerValue += ownerArray[i].substring(0, 1);
		}

		return String.format('<span title="{1}">{0}</span>', ownerValue, record.get("owner"));
	},

	/**
	 * Apply custom style and content for the row body. This will color
	 * a task in red when its due-date is reached. If categories are applied
	 * to a task these categories will be displayed in a colored square naming
	 * the first letter of the category and its full name in a tooltip.
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
	viewConfigGetRowClass: function (record, rowIndex, rowParams)
	{
		var valueSubject = record.get("subject"); // Subject to be displayed
		var valueCategories = Zarafa.widgets.folderwidgets.TasksWidget.superclass.renderCategories(record);

		// Add color red if due date is reached
		var dateNow = new Date;
		var dateDue = record.get("duedate");
		var color = "";

		if (dateDue && (dateDue < dateNow.clearTime().add(Date.DAY, 1))) {
			color = 'style="color:#F00;"';
		}

		rowParams.body = String.format('<div class="folderwidget-task-row" {2}>{1}{0}</div>', valueSubject, valueCategories, color);

		return "x-grid3-row-expanded ";
	},

	/**
	 * Event handler which is triggered when user opens context menu
	 * @param {Ext.grid.GridPanel} grid grid panel object
	 * @param {Number} rowIndex index of row
	 * @param {Ext.EventObject} event event object of the event
	 * @private
	 */
	onRowContextMenu: function (grid, rowIndex, event)
	{
		// check row is already selected or not, if its not selected then select it first
		var selectionModel = grid.getSelectionModel();
		if (!selectionModel.isSelected(rowIndex)) {
			selectionModel.selectRow(rowIndex);
		}

		// The ContextMenu needs the ContextModel for cases where we want to reply the mail.
		var model;
		if (this.folder) {
			var context = container.getContextByFolder(this.folder);
			if (context) {
				model = context.getModel();
				Zarafa.core.data.UIFactory.openDefaultContextMenu(selectionModel.getSelections(), {
					position: event.getXY(),
					model: model
				});
			}
		}
	},

	/**
	 * Called when the user double-clicks on a task.
	 * @param {Ext.grid.GridPanel} grid The grid which fired the event
	 * @param {Number} rowIndex The row which was double clicked
	 * @param {Ext.EventObject} event The event object
	 * @private
	 */
	onRowDblClick: function (grid, rowIndex, event)
	{
		Zarafa.core.data.UIFactory.openViewRecord(grid.getSelectionModel().getSelected());
	}
});

Zarafa.onReady(function () {
	container.registerWidget(new Zarafa.core.ui.widget.WidgetMetaData({
		name : 'tasks',
		displayName : _('Tasks'),
		widgetConstructor : Zarafa.widgets.folderwidgets.TasksWidget
	}));
});
