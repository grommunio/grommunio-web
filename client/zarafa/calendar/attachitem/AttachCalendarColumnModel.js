/*
 * #dependsFile client/zarafa/common/ui/grid/Renderers.js
 */
Ext.namespace('Zarafa.calendar.attachitem');

/**
 * @class Zarafa.calendar.attachitem.AttachCalendarColumnModel
 * @extends Zarafa.common.ui.grid.ColumnModel
 *
 * The {@link Zarafa.calendar.attachitem.AttachCalendarColumnModel AttachCalendarColumnModel} is the column model containing 
 * sets of {@link Ext.grid.Column columns} for calendar folders.
 * This column model will be used with {@link Zarafa.common.attachment.dialog.AttachItemGrid AttachItemGrid}.
 */
Zarafa.calendar.attachitem.AttachCalendarColumnModel = Ext.extend(Zarafa.common.ui.grid.ColumnModel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration structure
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

		Zarafa.calendar.attachitem.AttachCalendarColumnModel.superclass.constructor.call(this, config);
	},

	/**
	 * Create an array of {@link Ext.grid.Column columns} which will be visible when loading data from
	 * calendar folder into {@link Zarafa.common.attachment.dialog.AttachItemGrid AttachItemGrid}.
	 *
	 * @return {Ext.grid.Column[]} The array of columns
	 * @private
	 */
	getColumns : function()
	{
		return [{
			header : '<p class=\'icon_index\'>&nbsp;</p>',
			headerCls: 'zarafa-icon-column',
			dataIndex : 'icon_index',
			tooltip : _('Sort by: Icon'),
			width : 24,
			fixed : true,
			renderer : Zarafa.common.ui.grid.Renderers.icon
		}, {
			header : '<p class=\'icon_attachment\'>&nbsp;</p>',
			headerCls: 'zarafa-icon-column',
			dataIndex : 'hasattach',
			width : 24,
			fixed : true,
			renderer : Zarafa.common.ui.grid.Renderers.attachment,
			tooltip : _('Sort by: Attachment')
		}, {
			header : '<p class=\'icon_recurring\'>&nbsp;</p>',
			headerCls: 'zarafa-icon-column',
			dataIndex: 'recurring',
			tooltip : _('Sort by: Recurring'),
			width : 24,
			renderer : Zarafa.common.ui.grid.Renderers.recurrence,
			fixed : true
		}, {
			header : _('Subject'),
			dataIndex : 'subject',
			tooltip : _('Sort by: Subject'),
			renderer : Zarafa.common.ui.grid.Renderers.subject
		}, {
			header : _('Startdate'),
			dataIndex : 'startdate',
			tooltip : _('Sort by: Startdate'),
			width : 180,
			renderer : Zarafa.common.ui.grid.Renderers.datetime
		}, {
			header : _('Enddate'),
			dataIndex: 'duedate',
			tooltip : _('Sort by: Enddate'),
			width : 180,
			renderer : Zarafa.common.ui.grid.Renderers.datetime
		}];
	}
});