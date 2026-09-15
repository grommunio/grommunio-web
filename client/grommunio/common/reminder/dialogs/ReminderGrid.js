Ext.namespace('Grommunio.common.reminder.dialogs');

/**
 * @class Grommunio.common.reminder.dialogs.ReminderGrid
 * @extends Grommunio.common.ui.grid.GridPanel
 * @xtype grommunio.remindergrid
 */
Grommunio.common.reminder.dialogs.ReminderGrid = Ext.extend(Grommunio.common.ui.grid.GridPanel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'grommunio.remindergrid',
			ariaLabel: _('Reminders'),
			border: true,
			columns: this.initColumnModel(),
			selModel: this.initSelectionModel()
		});

		Grommunio.common.reminder.dialogs.ReminderGrid.superclass.constructor.call(this, config);
	},

	/**
	 * Initialize the event handlers
	 * @protected
	 */
	initEvents : function()
	{
		this.on('rowdblclick', this.onRowDblClick, this);
	},

	/**
	 * creates and returns a column model object, used in {@link Ext.grid.GridPanel.colModel colModel} config
	 * @return {Ext.grid.ColumnModel} column model object
	 * @private
	 */
	initColumnModel: function()
	{
		return [{
				header: '<p class="icon_index">&nbsp;<span class="title">Icon</span></p>',
				headerCls: 'grommunio-icon-column',
				dataIndex: 'icon_index',
				width: 24,
				renderer: Grommunio.common.ui.grid.Renderers.icon,
				fixed: true,
				menuDisabled: true
			},{
				dataIndex: 'subject',
				renderer: Grommunio.common.ui.grid.Renderers.subject,
				header: _('Subject'),
				menuDisabled: true
			},{
				dataIndex: 'reminder_time',
				width: 150,
				header: _('Due In'),
				renderer: Grommunio.common.ui.grid.Renderers.dueBy,
				menuDisabled: true
			}];
	},

	/**
	 * creates and returns a selection model object, used in {@link Ext.grid.GridPanel.selModel selModel} config
	 * @return {Ext.grid.RowSelectionModel} selection model object
	 * @private
	 */
	initSelectionModel: function()
	{
		return new Ext.grid.RowSelectionModel({
			multiSelect: true
		});
	},

	/**
	 * Event handler which is fired when a row in the grid has been double-clicked.
	 * This will open the selected appointment/task item in a new dialog.
	 * @param {Ext.grid.GridPanel} grid The grid which fired the event
	 * @param {Number} rowIndex The index of the row which was double clicked
	 * @param {Ext.EventObject} event The event
	 */
	onRowDblClick: function(grid, rowIndex, event)
	{
		var record = this.store.getAt(rowIndex);
		if (record) {
			Grommunio.common.Actions.openReminderRecord(record);
			this.dialog.close();
		}
	}
});

Ext.reg('grommunio.remindergrid', Grommunio.common.reminder.dialogs.ReminderGrid);
