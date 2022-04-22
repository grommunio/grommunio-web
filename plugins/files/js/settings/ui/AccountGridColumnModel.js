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
				header   : _('ID'),
				dataIndex: 'id',
				width    : 50,
				hidden   : true,
				sortable : false,
				tooltip  : _('Sort by: ID')
			}, {
				header   : _('Status'),
				dataIndex: 'status',
				width    : 40,
				sortable : false,
				renderer : Zarafa.plugins.files.settings.data.AccountRenderUtil.statusRenderer,
				tooltip  : _('Sort by: Status')
			}, {
				header   : _('Name'),
				dataIndex: 'name',
				flex     : 1,
				sortable : false,
				tooltip  : _('Sort by: Name')
			}, {
				header   : _('Backend'),
				dataIndex: 'backend',
				width    : 40,
				sortable : false,
				renderer : Zarafa.plugins.files.settings.data.AccountRenderUtil.backendRenderer,
				tooltip  : _('Sort by: Backend')
			}, {
				xtype    : 'actioncolumn',
				header   : _('Features'),
				dataIndex: 'backend_features',
				width    : 40,
				sortable : false,
				tooltip  : _('Shows all available features of the backend.'),
				items    : [{
					getClass: Zarafa.plugins.files.settings.data.AccountRenderUtil.featureRenderer.createDelegate(this, [Zarafa.plugins.files.data.AccountRecordFeature.QUOTA], true),
					icon    : 'plugins/files/resources/icons/features/quota.png',
					tooltip : _('Show quota information'),
					handler : this.showDialog.createDelegate(this, ['filesplugin.featurequotainfo'], 2)
				}, {
					getClass: Zarafa.plugins.files.settings.data.AccountRenderUtil.featureRenderer.createDelegate(this, [Zarafa.plugins.files.data.AccountRecordFeature.VERSION_INFO], true),
					icon    : 'plugins/files/resources/icons/features/info.png',
					tooltip : _('Show version information'),
					handler : this.showDialog.createDelegate(this, ['filesplugin.featureversioninfo'], 2)
				}, {
					getClass: Zarafa.plugins.files.settings.data.AccountRenderUtil.featureRenderer.createDelegate(this, [Zarafa.plugins.files.data.AccountRecordFeature.SHARING], true),
					icon    : 'plugins/files/resources/icons/features/sharing.png',
					tooltip : _('Share files')
				}, {
					getClass: Zarafa.plugins.files.settings.data.AccountRenderUtil.featureRenderer.createDelegate(this, [Zarafa.plugins.files.data.AccountRecordFeature.STREAMING], true),
					icon    : 'plugins/files/resources/icons/features/streaming.png',
					tooltip : _('Fast Down/Upload')
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
