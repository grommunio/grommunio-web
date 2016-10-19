/*
 * #dependsFile client/zarafa/common/ui/grid/Renderers.js
 */
Ext.namespace('Zarafa.advancesearch.ui');

/**
 * @class Zarafa.advancesearch.ui.SearchGridColumnModel
 * @extends Zarafa.common.ui.grid.ColumnModel
 *
 */
Zarafa.advancesearch.ui.SearchGridColumnModel = Ext.extend(Zarafa.common.ui.grid.ColumnModel, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			columns: this.createColumns(config)
		});

		Zarafa.advancesearch.ui.SearchGridColumnModel.superclass.constructor.call(this, config);
	},

	/**
	 * Create an array of {@link Ext.grid.Column columns} which must be visible within
	 * the default view of this {@link Ext.grid.ColumnModel ColumnModel}.
	 *
	 * @return {Ext.grid.Column[]} The array of columns
	 * @private
	 */
	createColumns : function(config)
	{
		var grid = config.grid;
		return [{
			id : grid.getId()+'-col0',
			sortable: false,
			hideable: false,
			renderer : Zarafa.common.ui.grid.Renderers.dataColumn
		},{
			id : grid.getId()+'-col1',
			dataIndex: 'searchdate',
			header : _('Date'),
			width : 110,
			fixed : true,
			resizable: false,
			sortable: true,
			tooltip : _('Sort by: Date'),
			hideable: false,
			renderer : Zarafa.common.ui.grid.Renderers.dateColumn,
			css : 'padding: 0; margin:0;'
		}];
	}
});

