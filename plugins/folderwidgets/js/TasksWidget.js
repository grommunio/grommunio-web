Ext.namespace('Zarafa.widgets.folderwidgets');

/**
 * @class Zarafa.widgets.folderwidgets.TasksWidget
 * @extends Zarafa.widgets.folderwidgets.AbstractFolderWidget
 *
 * Widget that current (non-completed) tasks.
 */
Zarafa.widgets.folderwidgets.TasksWidget = Ext.extend(Zarafa.widgets.folderwidgets.AbstractFolderWidget, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		var store = new Zarafa.task.TaskStore();

		// Create a restriction, we only want uncomplete tasks, so tasks which
		// do not have the status flag set to Zarafa.core.mapi.TaskStatus.COMPLETE
		store.setRestriction({
			'search' : Zarafa.core.data.RestrictionFactory.dataResProperty(
				'status',
				Zarafa.core.mapi.Restrictions.RELOP_NE,
				Zarafa.core.mapi.TaskStatus.COMPLETE
			)
		});
		// If we want to use a search restriction we must say that this store is an advanceSearchStore
		// or it will be removed.
		store.isAdvanceSearchStore = function(){
			return true;
		};

		Ext.applyIf(config, {
			height : 200,
			autoScroll: true,
			layout: 'fit',
			folderType : 'task',
			store : store,
			items : [{
				xtype: 'zarafa.gridpanel',
				store: store,
				border: true,
				loadMask : {
					msg : _('Loading tasks') + '...'
				},
				sm: new Ext.grid.RowSelectionModel({
					singleSelect: true
				}),
				viewConfig: {
					deferEmptyText: false,
					emptyText: '<div class="emptytext">' + _('No tasks.') + '</div>',
					forceFit: true
				},
				colModel : new Ext.grid.ColumnModel({
					columns: [{
						header: _('Owner'),
						dataIndex: 'owner',
						menuDisabled : true,
						renderer: Ext.util.Format.htmlEncode
					},{
						header: _('Subject'),
						dataIndex: 'subject',
						editable: false,
						menuDisabled : true,
						renderer: Ext.util.Format.htmlEncode
					}]
				}),
				listeners: {
					'rowcontextmenu' : this.onRowContextMenu,
					'rowdblclick': this.onRowDblClick,
					scope: this
				}
			}]
		});

		Zarafa.widgets.folderwidgets.TasksWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Update the filter.
	 * @private
	 */
        updateFilter : function()
	{
		this.store.filterBy(function(record) {
			return (record.get('status') != Zarafa.core.mapi.TaskStatus.COMPLETE);
		}, this);
	},

	/**
	 * Event handler which is triggered when user opens context menu
	 * @param {Ext.grid.GridPanel} grid grid panel object
	 * @param {Number} rowIndex index of row
	 * @param {Ext.EventObject} eventObj eventObj object of the event
	 * @private
	 */
	onRowContextMenu : function(grid, rowIndex, event)
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
			}
		}

		Zarafa.core.data.UIFactory.openDefaultContextMenu(selectionModel.getSelections(), { position : event.getXY(), model : model });
	},

	/**
	 * Called when the user double-clicks on a task.
	 * @param {Ext.grid.GridPanel} grid The grid which fired the event
	 * @param {Number} rowIndex The row which was double clicked
	 * @param {Ext.EventObject} event The event object
	 * @private
	 */
	onRowDblClick : function(grid, rowIndex, event)
	{
		Zarafa.core.data.UIFactory.openViewRecord(grid.getSelectionModel().getSelected());
	}
});

Zarafa.onReady(function() {
	container.registerWidget(new Zarafa.core.ui.widget.WidgetMetaData({
		name : 'tasks',
		displayName : _('Tasks'),
		widgetConstructor : Zarafa.widgets.folderwidgets.TasksWidget
	}));
});
