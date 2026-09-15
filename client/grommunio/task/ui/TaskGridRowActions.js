Ext.namespace('Grommunio.task.ui');

/**
 * @class Grommunio.task.ui.TaskGridRowActions
 * @extends Grommunio.common.ui.grid.RowActionsPlugin
 * @ptype grommunio.taskgridrowactions
 *
 * Shows the complete toggle and delete over the task row under the mouse.
 */
Grommunio.task.ui.TaskGridRowActions = Ext.extend(Grommunio.common.ui.grid.RowActionsPlugin, {
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
				Grommunio.task.Actions.markComplete(record, record.get('complete') !== true);
			}
		},{
			name: 'delete',
			iconCls: 'icon_delete',
			title: _('Delete'),
			handler: function(record) {
				this.hide();
				Grommunio.common.Actions.deleteRecords(record);
			}
		}];
	}
});

Ext.preg('grommunio.taskgridrowactions', Grommunio.task.ui.TaskGridRowActions);
