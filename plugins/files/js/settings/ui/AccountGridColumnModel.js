Ext.namespace('Zarafa.plugins.files.settings.ui');

/**
 * @class Zarafa.plugins.files.settings.ui.AccountGridColumnModel
 * @extends Zarafa.common.ui.grid.ColumnModel
 */
Zarafa.plugins.files.settings.ui.AccountGridColumnModel = Ext.extend(Zarafa.common.ui.grid.ColumnModel, {

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor: function (config) {
		config = config || {};

		Ext.applyIf(config, {
			columns : this.createDefaultColumns(),
			defaults: {
				sortable: true
			}
		});

		Zarafa.plugins.files.settings.ui.AccountGridColumnModel.superclass.constructor.call(this, config);
	},

	/**
	 * Create an array of {@link Ext.grid.Column columns} which must be visible within
	 * the default view of this {@link Ext.grid.ColumnModel ColumnModel}.
	 *
	 * @return {Ext.grid.Column[]} The array of columns
	 * @private
	 */
	createDefaultColumns: function () {
		return [
			new Ext.grid.RowNumberer(),
			{
				header   : dgettext('plugin_files', 'ID'),
				dataIndex: 'id',
				width    : 50,
				hidden   : true,
				sortable : false,
				tooltip  : dgettext('plugin_files', 'Sort by: ID')
			}, {
				header   : dgettext('plugin_files', 'Status'),
				dataIndex: 'status',
				width    : 40,
				sortable : false,
				renderer : Zarafa.plugins.files.settings.data.AccountRenderUtil.statusRenderer,
				tooltip  : dgettext('plugin_files', 'Sort by: Status')
			}, {
				header   : dgettext('plugin_files', 'Name'),
				dataIndex: 'name',
				flex     : 1,
				sortable : false,
				tooltip  : dgettext('plugin_files', 'Sort by: Name')
			}, {
				header   : dgettext('plugin_files', 'Backend'),
				dataIndex: 'backend',
				width    : 40,
				sortable : false,
				renderer : Zarafa.plugins.files.settings.data.AccountRenderUtil.backendRenderer,
				tooltip  : dgettext('plugin_files', 'Sort by: Backend')
			}, {
				xtype    : 'actioncolumn',
				header   : dgettext('plugin_files', 'Features'),
				dataIndex: 'backend_features',
				width    : 40,
				sortable : false,
				tooltip  : dgettext('plugin_files', 'Shows all available features of the backend.'),
				items    : [{
					getClass: Zarafa.plugins.files.settings.data.AccountRenderUtil.featureRenderer.createDelegate(this, [Zarafa.plugins.files.data.AccountRecordFeature.QUOTA], true),
					icon    : 'plugins/files/resources/icons/features/quota.png',
					tooltip : dgettext('plugin_files', 'Show quota information'),
					handler : this.showDialog.createDelegate(this, ['filesplugin.featurequotainfo'], 2)
				}, {
					getClass: Zarafa.plugins.files.settings.data.AccountRenderUtil.featureRenderer.createDelegate(this, [Zarafa.plugins.files.data.AccountRecordFeature.VERSION_INFO], true),
					icon    : 'plugins/files/resources/icons/features/info.png',
					tooltip : dgettext('plugin_files', 'Show version information'),
					handler : this.showDialog.createDelegate(this, ['filesplugin.featureversioninfo'], 2)
				}, {
					getClass: Zarafa.plugins.files.settings.data.AccountRenderUtil.featureRenderer.createDelegate(this, [Zarafa.plugins.files.data.AccountRecordFeature.SHARING], true),
					icon    : 'plugins/files/resources/icons/features/sharing.png',
					tooltip : dgettext('plugin_files', 'Share files')
				}, {
					getClass: Zarafa.plugins.files.settings.data.AccountRenderUtil.featureRenderer.createDelegate(this, [Zarafa.plugins.files.data.AccountRecordFeature.STREAMING], true),
					icon    : 'plugins/files/resources/icons/features/streaming.png',
					tooltip : dgettext('plugin_files', 'Fast Down/Upload')
				}]
			}];
	},

	/**
	 * This method gets called if the user clicks on the quota icon.
	 * It will then display the {@link Zarafa.plugins.files.settings.ui.FeatureQuotaInfoContentPanel quota panel}.
	 *
	 * @param {Object} grid the grid
	 * @param {Number} rowIndex used to retrieve the selected record
	 * @param {String} componentType the component to show
	 */
	showDialog: function(grid, rowIndex, componentType) {
		var record = grid.getStore().getAt(rowIndex);
		if (record.get('status') !== 'ok') {
			return;
		}

		Zarafa.core.data.UIFactory.openLayerComponent(Zarafa.core.data.SharedComponentType[componentType], undefined, {
			store  : grid.getStore(),
			item   : record,
			manager: Ext.WindowMgr
		});
	}
});
