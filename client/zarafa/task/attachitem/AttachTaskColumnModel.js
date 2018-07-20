/*
 * #dependsFile client/zarafa/common/ui/grid/Renderers.js
 */
Ext.namespace('Zarafa.task.attachitem');

/**
 * @class Zarafa.task.attachitem.AttachTaskColumnModel
 * @extends Zarafa.common.ui.grid.ColumnModel
 *
 * The {@link Zarafa.task.attachitem.AttachTaskColumnModel AttachTaskColumnModel} is the column model containing
 * sets of {@link Ext.grid.Column columns} for task folders.
 * This column model will be used with {@link Zarafa.common.attachment.dialog.AttachItemGrid AttachItemGrid}.
 */
Zarafa.task.attachitem.AttachTaskColumnModel = Ext.extend(Zarafa.common.ui.grid.ColumnModel, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			columns : this.getColumns(),
			defaults : {
				sortable : true
			}
		});

		Zarafa.task.attachitem.AttachTaskColumnModel.superclass.constructor.call(this, config);
	},

	/**
	 * Create an array of {@link Ext.grid.Column columns} which will be visible when loading data from
	 * task folder into {@link Zarafa.common.attachment.dialog.AttachItemGrid AttachItemGrid}.
	 *
	 * @return {Ext.grid.Column[]} The array of columns
	 * @private
	 */
	getColumns : function()
	{
		return[{
			dataIndex : 'icon_index',
			headerCls: 'zarafa-icon-column',
			header : '<p class=\'icon_index\'>&nbsp;</p>',
			width : 24,
			fixed : true,
			tooltip : _('Sort by: Icon'),
			renderer : Zarafa.common.ui.grid.Renderers.icon
		}, {
			dataIndex : 'importance',
			headerCls: 'zarafa-icon-column',
			header : '<p class=\'icon_importance\'>&nbsp;</p>',
			width : 24,
			fixed : true,
			tooltip : _('Sort by: Priority'),
			renderer : Zarafa.common.ui.grid.Renderers.importance
		}, {
			header : '<p class=\'icon_paperclip\'>&nbsp;</p>',
			headerCls: 'zarafa-icon-column',
			dataIndex : 'hasattach',
			width : 24,
			fixed : true,
			renderer : Zarafa.common.ui.grid.Renderers.attachment,
			tooltip : _('Sort by: Attachment')
		}, {
			dataIndex : 'subject',
			header : _('Subject'),
			tooltip : _('Sort by: Subject'),
			renderer : Zarafa.common.ui.grid.Renderers.subject
		}, {
			header : _('Status'),
			dataIndex : 'status',
			width : 160,
			renderer : Zarafa.common.ui.grid.Renderers.taskstatus,
			tooltip : _('Sort by: Status')
		}, {
			dataIndex : 'duedate',
			header : _('Due Date'),
			tooltip : _('Sort by: Due Date'),
			renderer : Zarafa.common.ui.grid.Renderers.utcdate
		}, {
			dataIndex : 'percent_complete',
			header : _('% Completed'),
			width : 75,
			tooltip : _('Sort by: Percent Completed'),
			renderer : Zarafa.common.ui.grid.Renderers.percentage
		}, {
			dataIndex : 'categories',
			header : _('Categories'),
			tooltip : _('Sort by: Categories'),
			renderer : Zarafa.common.ui.grid.Renderers.text
		}];
	}
});
