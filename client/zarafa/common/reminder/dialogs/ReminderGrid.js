Ext.namespace('Zarafa.common.reminder.dialogs');

/**
 * @class Zarafa.common.reminder.dialogs.ReminderGrid
 * @extends Zarafa.common.ui.grid.GridPanel
 * @xtype zarafa.remindergrid
 */
Zarafa.common.reminder.dialogs.ReminderGrid = Ext.extend(Zarafa.common.ui.grid.GridPanel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype : 'zarafa.remindergrid',
			border : true,
			columns : this.initColumnModel(),
			selModel : this.initSelectionModel()
		});

		Zarafa.common.reminder.dialogs.ReminderGrid.superclass.constructor.call(this, config);

		this.on('rowdblclick', this.onRowDblClick, this);
		this.on('rowcontextmenu', this.onRowContextMenu, this);
	},

	/**
	 * creates and returns a column model object, used in {@link Ext.grid.GridPanel.colModel colModel} config
	 * @return {Ext.grid.ColumnModel} column model object
	 * @private
	 */
	initColumnModel : function()
	{
		return [{
				header : '<p class="icon_index">&nbsp;</p>',
				headerCls: 'zarafa-icon-column',
				dataIndex : 'icon_index',
				width : 24,
				renderer : Zarafa.common.ui.grid.Renderers.icon,
				fixed : true,
				menuDisabled: true
			},{
				dataIndex: 'subject',
				renderer: Zarafa.common.ui.grid.Renderers.subject,
				header: _('Subject'),
				menuDisabled: true
			},{
				dataIndex: 'reminder_time',
				width : 150,
				header: _('Due In'),
				renderer: Zarafa.common.ui.grid.Renderers.dueBy,
				menuDisabled: true
			}];
	},

	/**
	 * creates and returns a selection model object, used in {@link Ext.grid.GridPanel.selModel selModel} config
	 * @return {Ext.grid.RowSelectionModel} selection model object
	 * @private
	 */
	initSelectionModel : function()
	{
		return new Ext.grid.RowSelectionModel({
			multiSelect : true
		});
	},

	/**
	 * Event handler which is fired when a row in the grid has been double-clicked.
	 * This will open the selected appointment/task item in a new dialog.
	 * @param {Ext.grid.GridPanel} grid The grid which fired the event
	 * @param {Number} rowIndex The index of the row which was double clicked
	 * @param {Ext.EventObject} event The event
	 */
	onRowDblClick : function(grid, rowIndex, event)
	{
		var record = this.store.getAt(rowIndex);
		if (record) {
			Zarafa.common.Actions.openReminderRecord(record);
			this.dialog.close();
		}
	},

	/**
	 * Event handler which is triggered when the user right clicks on a row in
	 * {@link Zarafa.common.reminder.dialogs.ReminderGrid ReminderGrid}.
	 *
	 * @param {Zarafa.common.reminder.dialogs.ReminderGrid} grid The grid which was right clicked
	 * @param {Number} rowIndex The index number of the row which was right clicked
	 * @param {Ext.EventObject} event The event structure
	 * @private
	 */
	onRowContextMenu : function(grid, rowIndex, event)
	{
		var sm = this.getSelectionModel();

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

		var records = sm.getSelections();
		if (records) {
			Zarafa.core.data.UIFactory.openContextMenu(Zarafa.core.data.SharedComponentType['common.contextmenu.reminder.remindergrid'], records, { position : event.getXY() });
		}
	}
});

Ext.reg('zarafa.remindergrid', Zarafa.common.reminder.dialogs.ReminderGrid);
