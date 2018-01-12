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
	 * @cfg {Boolean} useCompactView If true the compact column model will be
	 * used by default. Otherwise the default column model will be used which
	 * contains all possible columns.
	 */
	useCompactView : false,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		this.defaultColumns = this.createDefaultColumns(config);
		this.compactColumns = this.createCompactColumns(config);

		Ext.applyIf(config, {
			columns: this.defaultColumns
		});

		// Switch to compact view if needed
		if (config.useCompactView === true) {
			config.columns = this.compactColumns;
		}

		Zarafa.advancesearch.ui.SearchGridColumnModel.superclass.constructor.call(this, config);
	},

	/**
	 * Create an array of {@link Ext.grid.Column columns} which must be visible within
	 * the default view of this {@link Ext.grid.ColumnModel ColumnModel}.
	 *
	 * @return {Ext.grid.Column[]} The array of columns
	 * @private
	 */
	createDefaultColumns: function (config)
	{
		var grid = config.grid;
		return [{
			id: 'column_icon',
			dataIndex: 'icon_index',
			fixed: true,
			width: 28,
			renderer: Zarafa.common.ui.grid.Renderers.icon,
			preventRowSelection: true
		}, {
			id: 'name',
			sortable: false,
			hideable: false,
			width: 125,
			fixed: true,
			renderer: Zarafa.advancesearch.ui.SearchGridRenderers.nameColumn
		}, {
			id: grid.getId() + '-col0',
			sortable: false,
			hideable: false,
			renderer: Zarafa.advancesearch.ui.SearchGridRenderers.subjectWithBodyColumn
		}, {
			dataIndex: 'hasattach',
			width: 24,
			renderer: Zarafa.common.ui.grid.Renderers.attachment,
			fixed: true
		}, {
			id: grid.getId() + '-col1',
			dataIndex: 'searchdate',
			header: _('Date'),
			width: 110,
			fixed: true,
			resizable: false,
			sortable: true,
			tooltip: _('Sort by: Date'),
			hideable: false,
			renderer: Zarafa.advancesearch.ui.SearchGridRenderers.dateColumn,
			css: 'padding: 0; margin:0;'
		}];
	},

	/**
	 * Create an array of {@link Ext.grid.Column columns} which must be visible within
	 * the compact view of this {@link Ext.grid.ColumnModel ColumnModel}.
	 *
	 * @return {Ext.grid.Column[]} The array of columns
	 * @private
	 */
	createCompactColumns: function (config)
	{
		var grid = config.grid;
		return [{
			id: 'column_icon',
			dataIndex: 'icon_index',
			fixed: true,
			width: 28,
			renderer: Zarafa.common.ui.grid.Renderers.icon,
			preventRowSelection: true
		}, {
			id: 'name',
			sortable: false,
			hideable: false,
			renderer: Zarafa.advancesearch.ui.SearchGridRenderers.nameColumn
		}, {
			dataIndex: 'hasattach',
			width: 24,
			renderer: Zarafa.common.ui.grid.Renderers.attachment,
			fixed: true
		}, {
			id: grid.getId() + '-col1',
			dataIndex: 'searchdate',
			header: _('Date'),
			width: 110,
			fixed: true,
			resizable: false,
			sortable: true,
			tooltip: _('Sort by: Date'),
			hideable: false,
			renderer: Zarafa.advancesearch.ui.SearchGridRenderers.dateColumn,
			css: 'padding: 0; margin:0;'
		}, {
			dataIndex: 'flag_due_by',
			width: 24,
			renderer: Zarafa.common.ui.grid.Renderers.flag,
			fixed: true
		}];
	},

	/**
	 * This will switch the {@link Zarafa.advancesearch.ui.SearchGridColumnModel columnmodel}
	 * configuration to either the compact or extended configuration.
	 *
	 * @param {Boolean} compact True to enable the compact view
	 */
	setCompactView : function(compact)
	{
		if (this.useCompactView !== compact) {
			this.useCompactView = compact;

			if (compact) {
				// Extjs will store the this.columns into this.config after it has constructed
				// all the columns. At that point this.columns consists of the configuration objects,
				// while this.columns consists of all the allocated columns.
				this.defaultColumns = this.config;
				this.columns = this.compactColumns;
			} else {
				this.compactColumns = this.config;
				this.columns = this.defaultColumns;
			}

			this.setConfig(this.columns, false);
		}
	}
});

