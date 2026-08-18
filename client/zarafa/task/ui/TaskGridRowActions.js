Ext.namespace('Zarafa.task.ui');

/**
 * @class Zarafa.task.ui.TaskGridRowActions
 * @extends Zarafa.common.ui.grid.RowActionsPlugin
 * @ptype zarafa.taskgridrowactions
 *
 * Shows the complete toggle and delete over the task row under the mouse.
 */
Zarafa.task.ui.TaskGridRowActions = Ext.extend(Zarafa.common.ui.grid.RowActionsPlugin, {
	/**
	 * @return {Array} The complete toggle and delete
	 */
	getActions: function()
	{
		return [{
			name: 'complete',
			supports: function(record) {
				return Ext.isFunction(record.isMessageClass) && record.isMessageClass('IPM.Task', true);
			},
			update: function(record, icon, anchor) {
				var complete = record.get('complete') === true;
				icon.removeClass(['icon_task_complete', 'icon_task_incomplete']).addClass(complete ? 'icon_task_incomplete' : 'icon_task_complete');
				anchor.dom.title = complete ? _('Mark Incomplete') : _('Mark Complete');
			},
			handler: function(record) {
				Zarafa.task.Actions.markComplete(record, record.get('complete') !== true);
			}
		},{
			name: 'delete',
			iconCls: 'icon_delete',
			title: _('Delete'),
			handler: function(record) {
				this.hide();
				Zarafa.common.Actions.deleteRecords(record);
			}
		}];
	}
});

Ext.preg('zarafa.taskgridrowactions', Zarafa.task.ui.TaskGridRowActions);
