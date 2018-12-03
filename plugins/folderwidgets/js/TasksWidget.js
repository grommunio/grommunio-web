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
		// do not have the status flag set to Zarafa.core.mapi.TaskStatus.COMPLETE or
		// Zarafa.core.mapi.FlagStatus.completed
		store.setRestriction({
			'task': Zarafa.core.data.RestrictionFactory.createResAnd([Zarafa.core.data.RestrictionFactory.dataResProperty(
				'status',
				Zarafa.core.mapi.Restrictions.RELOP_NE,
				Zarafa.core.mapi.TaskStatus.COMPLETE
			),Zarafa.core.data.RestrictionFactory.dataResProperty(
				'flag_status',
				Zarafa.core.mapi.Restrictions.RELOP_NE,
				Zarafa.core.mapi.FlagStatus.completed
			)])
		});

		Ext.applyIf(config, {
			autoScroll: true,
			layout: 'fit',
			folderType: 'todolist',
			store: store,
			items: [{
				xtype: 'zarafa.gridpanel',
				cls: 'k-taskwidget',
				store: store,
				loadMask: {
					msg: _('Loading tasks') + '...'
				},
				sm: new Zarafa.common.ui.grid.RowSelectionModel({
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
						header: _("Due"),
						tooltip : _('Sort by: Due Date'),
						dataIndex: "duedate",
						renderer: Zarafa.common.ui.grid.Renderers.utcdate
					}, {
						header: "<p class='icon_importance'>&nbsp;</p>",
						tooltip : _('Sort by: Priority'),
						dataIndex: "importance",
						width: 24,
						fixed: true,
						renderer: Zarafa.common.ui.grid.Renderers.importance
					}, {
						header: "%",
						tooltip : _('Sort by: Percentage Completed'),
						dataIndex: "percent_complete",
						width : 75,
						renderer: Zarafa.common.ui.grid.Renderers.percentage
					}, {
						header: _('Owner'),
						tooltip : _('Sort by: Owner'),
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
		var owner = record.get("owner");
		if (!Ext.isString(owner)) {
			return '';
		}

		var ownerNames = owner.split(" "); // array of all parts of the owner's name
		var initials = '';

		for (var i = 0, len = ownerNames.length; i < len; i++) {
			initials += ownerNames[i].substring(0, 1);
		}

		return '<span ext:qtip="' + Ext.util.Format.htmlEncode(owner) + '" ext:qwidth="100%">' + Ext.util.Format.htmlEncode(initials) + '</span>';
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
		displayName : _('Tasks / To-Do'),
		widgetConstructor : Zarafa.widgets.folderwidgets.TasksWidget
	}));
});
