/*
 * #dependsFile client/zarafa/common/ui/grid/Renderers.js
 */
Ext.namespace('Zarafa.note.attachitem');

/**
 * @class Zarafa.note.attachitem.AttachNoteColumnModel
 * @extends Zarafa.common.ui.grid.ColumnModel
 *
 * The {@link Zarafa.note.attachitem.AttachNoteColumnModel AttachNoteColumnModel} is the column model containing 
 * sets of {@link Ext.grid.Column columns} for sticky note folders.
 * This column model will be used with {@link Zarafa.common.attachment.dialog.AttachItemGrid AttachItemGrid}.
 */
Zarafa.note.attachitem.AttachNoteColumnModel = Ext.extend(Zarafa.common.ui.grid.ColumnModel, {
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

		Zarafa.note.attachitem.AttachNoteColumnModel.superclass.constructor.call(this, config);
	},

	/**
	 * Create an array of {@link Ext.grid.Column columns} which will be visible when loading data from
	 * sticky note folder into {@link Zarafa.common.attachment.dialog.AttachItemGrid AttachItemGrid}.
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
			dataIndex : 'subject',
			header : _('Subject'),
			tooltip : _('Sort by: Subject'),
			renderer : Zarafa.common.ui.grid.Renderers.subject
		}];
	}
});