/*
 * #dependsFile client/zarafa/common/ui/grid/Renderers.js
 */
Ext.namespace('Zarafa.contact.attachitem');

/**
 * @class Zarafa.contact.attachitem.AttachContactColumnModel
 * @extends Zarafa.common.ui.grid.ColumnModel
 *
 * The {@link Zarafa.contact.attachitem.AttachContactColumnModel AttachContactColumnModel} is the column model containing
 * sets of {@link Ext.grid.Column columns} for contact folders.
 * This column model will be used with {@link Zarafa.common.attachment.dialog.AttachItemGrid AttachItemGrid}.
 */
Zarafa.contact.attachitem.AttachContactColumnModel = Ext.extend(Zarafa.common.ui.grid.ColumnModel, {
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

		Zarafa.contact.attachitem.AttachContactColumnModel.superclass.constructor.call(this, config);
	},

	/**
	 * Create an array of {@link Ext.grid.Column columns} which will be visible when loading data from
	 * contact folder into {@link Zarafa.common.attachment.dialog.AttachItemGrid AttachItemGrid}.
	 *
	 * @return {Ext.grid.Column[]} The array of columns
	 * @private
	 */
	getColumns : function()
	{
		return [{
			dataIndex : 'icon_index',
			headerCls: 'zarafa-icon-column',
			header : '<p class=\'icon_index\'>&nbsp;</p>',
			tooltip : _('Sort by: Icon'),
			width : 24,
			fixed : true,
			renderer : Zarafa.common.ui.grid.Renderers.icon
		}, {
			header : '<p class=\'icon_paperclip\'>&nbsp;</p>',
			headerCls: 'zarafa-icon-column',
			dataIndex : 'hasattach',
			width : 24,
			fixed : true,
			renderer : Zarafa.common.ui.grid.Renderers.attachment,
			tooltip : _('Sort by: Attachment')
		}, {
			dataIndex : 'fileas',
			header : _('File As'),
			tooltip : _('Sort by: File As'),
			renderer : Ext.util.Format.htmlEncode
		}, {
			dataIndex : 'company_name',
			header : _('Company Name'),
			tooltip : _('Sort by: Company Name'),
			renderer : Ext.util.Format.htmlEncode
		}, {
			dataIndex : 'title',
			header : _('Job Title'),
			tooltip : _('Sort by: Job Title'),
			renderer : Ext.util.Format.htmlEncode
		}];
	}
});