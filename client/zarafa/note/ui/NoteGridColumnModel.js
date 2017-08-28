/*
 * #dependsFile client/zarafa/common/ui/grid/Renderers.js
 */
Ext.namespace('Zarafa.note.ui');

/**
 * @class Zarafa.note.ui.NoteGridColumnModel
 * @extends Zarafa.common.ui.grid.ColumnModel
 */
Zarafa.note.ui.NoteGridColumnModel = Ext.extend(Zarafa.common.ui.grid.ColumnModel, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			columns : this.createColumns(),
			defaults : {
				sortable : true
			}
		});

		Zarafa.note.ui.NoteGridColumnModel.superclass.constructor.call(this, config);
	},

	/**
	 * Create an array of {@link Ext.grid.Column columns} which must be visible within
	 * the default view of this {@link Ext.grid.ColumnModel ColumnModel}.
	 * @return {Ext.grid.Column[]} The array of columns
	 * @private
	 */
	createColumns : function()
	{
		return [{
			dataIndex	: 'icon_index',
			headerCls	: 'zarafa-icon-column',
			header		: '<p class="icon_index">&nbsp;</p>',
			tooltip		: _('Sort by: Icon'),
			width		: 24,
			fixed		: true,
			renderer	: Zarafa.common.ui.grid.Renderers.icon
		}, {
			dataIndex	: 'subject',
			header		: _('Subject'),
			width		: 400,
			tooltip		: _('Sort by: Subject'),
			renderer	: Zarafa.common.ui.grid.Renderers.subject
		}, {
			dataIndex	: 'creation_time',
			header		: _('Created'),
			tooltip		: _('Sort by: Created'),
			width		: 160,
			renderer	: Zarafa.common.ui.grid.Renderers.datetime
		}, {
			dataIndex	: 'categories',
			id			: 'categories',
			header		: _('Categories'),
			width		: 160,
			tooltip		: _('Sort by: Categories'),
			renderer	: Zarafa.common.ui.grid.Renderers.categories
		}, {
			dataIndex	: 'color',
			header		: _('Color'),
			width		: 160,
			tooltip		: _('Sort by: Color'),
			renderer	: Zarafa.common.ui.grid.Renderers.colorTextValue,
			hidden		: true
		}];
	}
});
