/*
 * #dependsFile client/grommunio/common/ui/grid/Renderers.js
 */
Ext.namespace('Grommunio.mail.attachitem');

/**
 * @class Grommunio.mail.attachitem.AttachMailColumnModel
 * @extends Grommunio.common.ui.grid.ColumnModel
 *
 * The {@link Grommunio.mail.attachitem.AttachMailColumnModel AttachMailColumnModel} is the column model containing
 * sets of {@link Ext.grid.Column columns} for mail folders.
 * This column model will be used with {@link Grommunio.common.attachment.dialog.AttachItemGrid AttachItemGrid}.
 */
Grommunio.mail.attachitem.AttachMailColumnModel = Ext.extend(Grommunio.common.ui.grid.ColumnModel, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			columns: this.getColumns(),
			defaults: {
				sortable: true
			}
		});

		Grommunio.mail.attachitem.AttachMailColumnModel.superclass.constructor.call(this, config);
	},

	/**
	 * Create an array of {@link Ext.grid.Column columns} which will be visible when loading data from
	 * mail folder into {@link Grommunio.common.attachment.dialog.AttachItemGrid AttachItemGrid}.
	 *
	 * @return {Ext.grid.Column[]} The array of columns
	 * @private
	 */
	getColumns: function()
	{
		return [{
			header: '<p class=\'icon_importance\'>&nbsp;</p>',
			headerCls: 'grommunio-icon-column',
			dataIndex: 'importance',
			width: 24,
			fixed: true,
			renderer: Grommunio.common.ui.grid.Renderers.importance,
			tooltip: _('Sort by: Importance')
		}, {
			header: '<p class=\'icon_index\'>&nbsp;</p>',
			headerCls: 'grommunio-icon-column',
			dataIndex: 'icon_index',
			width: 24,
			fixed: true,
			renderer: Grommunio.common.ui.grid.Renderers.icon,
			tooltip: _('Sort by: Icon')
		}, {
			header: '<p class=\'icon_paperclip\'>&nbsp;</p>',
			headerCls: 'grommunio-icon-column',
			dataIndex: 'hasattach',
			width: 24,
			fixed: true,
			renderer: Grommunio.common.ui.grid.Renderers.attachment,
			tooltip: _('Sort by: Attachment')
		}, {
			header: _('From'),
			dataIndex: 'sent_representing_name',
			width: 100,
			renderer: Grommunio.common.ui.grid.Renderers.sender,
			tooltip: _('Sort by: From')
		}, {
			header: _('To'),
			dataIndex: 'display_to',
			width: 100,
			renderer: Grommunio.common.ui.grid.Renderers.to,
			tooltip: _('Sort by: To')
		}, {
			header: _('Subject'),
			dataIndex: 'subject',
			renderer: Grommunio.common.ui.grid.Renderers.subject,
			tooltip: _('Sort by: Subject')
		}, {
			header: _('Received'),
			dataIndex: 'message_delivery_time',
			width: 180,
			renderer: Grommunio.common.ui.grid.Renderers.datetime,
			tooltip: _('Sort by: Received')
		}, {
			header: _('Categories'),
			dataIndex: 'categories',
			width: 160,
			renderer: Grommunio.common.ui.grid.Renderers.text,
			tooltip: _('Sort by: Categories')
		}];
	}
});
