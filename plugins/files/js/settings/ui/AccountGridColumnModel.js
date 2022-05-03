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
					icon    : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPScxNicgaGVpZ2h0PScxNicgdmlld0JveD0iMCAwIDEzNS40MiAxMjIuODgiPjxwYXRoIGQ9Ik02NS42MiwxNC4wOEg4NS44NWEyLDIsMCwwLDEsMiwyVjk1LjU2YTIsMiwwLDAsMS0yLDJINjUuNjJhMiwyLDAsMCwxLTItMlYxNmEyLDIsMCwwLDEsMi0yWm02OS44LDEwOC44SDkuOTN2MEE5Ljg5LDkuODksMCwwLDEsMCwxMTNIMFYwSDEyLjY5VjExMC4xOUgxMzUuNDJ2MTIuNjlaTTEwMy4wNSw1My44aDIwLjIzYTIsMiwwLDAsMSwyLDJWOTUuNTZhMiwyLDAsMCwxLTIsMkgxMDMuMDVhMiwyLDAsMCwxLTItMlY1NS43NWEyLDIsMCwwLDEsMi0yWk0yOC4xOSwyOS40NEg0OC40MmEyLDIsMCwwLDEsMS45NSwxLjk1Vjk1LjU2YTIsMiwwLDAsMS0xLjk1LDJIMjguMTlhMiwyLDAsMCwxLTItMlYzMS4zOWEyLDIsMCwwLDEsMi0xLjk1WiIgZmlsbD0iIzZkNmQ3MCIvPjwvc3ZnPgo=',
					tooltip : _('Show quota information'),
					handler : this.showDialog.createDelegate(this, ['filesplugin.featurequotainfo'], 2)
				}, {
					getClass: Zarafa.plugins.files.settings.data.AccountRenderUtil.featureRenderer.createDelegate(this, [Zarafa.plugins.files.data.AccountRecordFeature.VERSION_INFO], true),
					icon    : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPScxNicgaGVpZ2h0PScxNicgdmlld0JveD0iMCAwIDEyMi44OCAxMjIuODgiPjxwYXRoIGQ9Ik02MS40NCA5LjIzbC01LjM1LjI1LTUuMTcuNzdjLTEuNzIuMzQtMy4zOS43Ny01IDEuMjYtMS41OS40OS0zLjE2IDEuMDctNC43IDEuNzJsLS4xLjA1aDBsLTQuNjcgMi4yNS00LjMxIDIuNi0zLjk5IDIuOTctMy42OCAzLjM1LS4wNC4wNC0zLjMzIDMuNjYtMi45NyAzLjk5Yy0uOTIgMS4zNi0xLjc4IDIuOC0yLjU5IDQuM2wtMi4yNiA0LjY3LS4wNS4xMWgwbC0uMDcuMTRjLS42MyAxLjUtMS4xOSAzLjA0LTEuNjcgNC42MS0uNDkgMS41OS0uOSAzLjIzLTEuMjQgNC45My0uMzUgMS43My0uNiAzLjQ1LS43NyA1LjE3YTU0LjM4IDU0LjM4IDAgMCAwLS4yNSA1LjM1bC4yNSA1LjM1Ljc3IDUuMTcgMS4yNyA1IDEuNyA0LjY2Yy4wNC4wNy4wNy4xNC4xLjIxbDIuMjMgNC42IDIuNTkgNC4zIDIuOTggNCAzLjI2IDMuNTljLjA3LjA2LjEzLjEyLjE5LjE5bDMuNTkgMy4yNiAzLjk5IDIuOTdjMS4zNi45MiAyLjggMS43OCA0LjMgMi41OWw0LjY3IDIuMjYuMjEuMWE0OC44OSA0OC44OSAwIDAgMCA0LjY3IDEuNjljMS41OC40OSAzLjIzLjkgNC45MiAxLjI0IDEuNzMuMzUgMy40NS42IDUuMTcuNzdhNTQuMzggNTQuMzggMCAwIDAgNS4zNS4yNWw1LjM1LS4yNSA1LjE3LS43NyA1LTEuMjdhNDguNDQgNDguNDQgMCAwIDAgNC43MS0xLjczbC4wOS0uMDR2LS4wMWw0LjY3LTIuMjUgNC4zMS0yLjYgMy45OS0yLjk3IDMuNjItMy4yOS4xOC0uMTggMy4yNS0zLjU4IDIuOTgtNGMuOTItMS4zNiAxLjc4LTIuOCAyLjU5LTQuM2wyLjI2LTQuNjcuMS0uMjJhNDguNTEgNDguNTEgMCAwIDAgMS42OS00LjY1Yy40OS0xLjU5LjktMy4yMyAxLjI0LTQuOTMuMzUtMS43My42LTMuNDUuNzctNS4xN2E1NC4zOCA1NC4zOCAwIDAgMCAuMjUtNS4zNWwtLjI1LTUuMzUtLjc3LTUuMTctMS4yNy01YTQ4LjQ0IDQ4LjQ0IDAgMCAwLTEuNzMtNC43MWwtLjA0LS4wOWgwbC0yLjI1LTQuNjctMi41OS00LjMtMi45Ny0zLjk5LTMuMjgtMy42MWMtLjA3LS4wNi0uMTMtLjEyLS4xOC0uMThsLTMuNTktMy4yNi0zLjk5LTIuOTctNC4zLTIuNTktNC42Ny0yLjI1LS4xOS0uMDljLTEuNTItLjY0LTMuMDgtMS4yMS00LjY4LTEuNy0xLjU4LS40OS0zLjIzLS45LTQuOTMtMS4yNC0xLjczLS4zNS0zLjQ1LS42LTUuMTctLjc3bC01LjM3LS4yMmgwem0xLjkgMjEuOTRjMi4xOSAwIDMuOTEuNjMgNS4xNiAxLjg4IDEuMjQgMS4yNSAxLjg3IDIuOTYgMS44NyA1LjE3IDAgMi4yNC0xLjA3IDQuMjItMy4yMSA1Ljk3LTIuMTYgMS43NC00LjY2IDIuNjItNy41MiAyLjYyLTIuMTQgMC0zLjg1LS42LTUuMTYtMS44LTEuMzEtMS4yMi0xLjk2LTIuNzktMS45Ni00Ljc1IDAtMi40NyAxLjA3LTQuNTkgMy4xOS02LjQgMi4xMS0xLjggNC42Ni0yLjY5IDcuNjMtMi42OWgwIDB6bTEyLjIxIDYwLjU0SDQ3LjMzdi00Ljc1aDUuM1Y1Ny45NWgtNS4zdi0zLjc4aDEzLjE5YzMuMzMgMCA2LjYxLS40IDkuODUtMS4yMnYzNC4wMWg1LjE4djQuNzVoMCAwek00OS4xMiAxLjJDNTEuMDguODEgNTMuMTEuNTEgNTUuMi4zMWE2Mi4zNyA2Mi4zNyAwIDAgMSAxMi40OCAwbDYuMDguODlhNTkuMSA1OS4xIDAgMCAxIDUuODIgMS40OGMxLjg4LjU4IDMuNzQgMS4yNiA1LjU4IDIuMDRsLjE5LjA3aDBsLjA2LjAyIDUuMzggMi42MSA1LjA3IDMuMDcgNC43MyAzLjUyYTU2LjE3IDU2LjE3IDAgMCAxIDQuMzQgMy45NWwzLjk1IDQuMzQgMy41MiA0LjczIDMuMDYgNS4wNmgwIC4wMWwyLjYxIDUuMzkuMDYuMTVhNTguNTggNTguNTggMCAwIDEgMi4wNSA1LjZjLjYxIDEuOTYgMS4xMSAzLjkyIDEuNSA1Ljg5LjM5IDEuOTYuNjkgMy45OS44OSA2LjA4bC4zIDYuMjQtLjMxIDYuMjRjLS4yIDIuMDktLjUgNC4xMi0uODkgNi4wOGE1OS4xIDU5LjEgMCAwIDEtMS40OCA1LjgyIDYwLjIzIDYwLjIzIDAgMCAxLTIuMDUgNS42MmwtLjA0LjA5aDBsLS4wNS4xMS0yLjYxIDUuMzgtMy4wNyA1LjA3LTMuNTIgNC43M2E1OC4wOCA1OC4wOCAwIDAgMS0zLjk1IDQuMzRsLTQuMzUgMy45NS00LjcyIDMuNTEtNS4wNiAzLjA2LTUuMzkgMi42Mi0uMTYuMDZhNTguNTggNTguNTggMCAwIDEtNS42IDIuMDUgNTcuNjIgNTcuNjIgMCAwIDEtNS44OCAxLjVjLTEuOTYuMzktMy45OS42OS02LjA4Ljg5bC02LjI0LjNhNjUuNDcgNjUuNDcgMCAwIDEtNi4yNC0uM2wtNi4wOC0uODlhNTkuMSA1OS4xIDAgMCAxLTUuODItMS40OGMtMS44OS0uNTgtMy43Ni0xLjI3LTUuNjEtMi4wNWwtLjItLjA4aDBsLTUuMzgtMi42MS01LjA3LTMuMDdhNjAuMTEgNjAuMTEgMCAwIDEtNC43Mi0zLjUxbC00LjM1LTMuOTUtMy45NS00LjM0LTMuNTItNC43My0zLjA2LTUuMDYtMi42Mi01LjQtLjA2LS4xNWE1OC41OCA1OC41OCAwIDAgMS0yLjA1LTUuNmMtLjYxLTEuOTYtMS4xMS0zLjkzLTEuNS01Ljg5cy0uNjktMy45OS0uODktNi4wOEMuMSA2NS41OSAwIDYzLjUxIDAgNjEuNDRhNjIuMzcgNjIuMzcgMCAwIDEgLjMxLTYuMjRjLjItMi4wOS41LTQuMTIuODktNi4wOGE1OS4xIDU5LjEgMCAwIDEgMS40OC01LjgyIDU5LjYgNTkuNiAwIDAgMSAyLjA0LTUuNTlsLjA5LS4yM2gwbDIuNjEtNS4zOCAzLjA3LTUuMDcgMy41Mi00LjczYTU4LjA4IDU4LjA4IDAgMCAxIDMuOTUtNC4zNGw0LjM0LTMuOTUgNC43My0zLjUyIDUuMDctMy4wNy4xMy0uMDYgNS4yNi0yLjU1LjE1LS4wNmE1OC41OCA1OC41OCAwIDAgMSA1LjYtMi4wNWMxLjk1LS42MSAzLjkxLTEuMTEgNS44OC0xLjVoMHoiIGZpbGw9IiM2ZDZkNzAiLz48L3N2Zz4K',
					tooltip : _('Show version information'),
					handler : this.showDialog.createDelegate(this, ['filesplugin.featureversioninfo'], 2)
				}, {
					getClass: Zarafa.plugins.files.settings.data.AccountRenderUtil.featureRenderer.createDelegate(this, [Zarafa.plugins.files.data.AccountRecordFeature.SHARING], true),
					icon    : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPScxMicgaGVpZ2h0PScxMicgdmlld0JveD0iMCAwIDEyMi44OCAxMjAuOTQiPjxwYXRoIGQ9Ik05OC4xMSAwQTI0Ljc3IDI0Ljc3IDAgMSAxIDgwLjYgNDIuMjhsLS42NC0uNjctMzEuMTQgMTNhMjUgMjUgMCAwIDEgLjUzIDguOTVMODEgNzguMzFBMjQuNjYgMjQuNjYgMCAxIDEgNzQuNzIgODhMNDUuMzQgNzQuMjZBMjQuNzcgMjQuNzcgMCAxIDEgNDIuMjggNDNsMS4yNyAxLjM3IDMwLjc0LTEyLjgyQTI0Ljc3IDI0Ljc3IDAgMCAxIDk4LjExIDB6IiBmaWxsPSIjNmQ2ZDcwIi8+PC9zdmc+Cg==',
					tooltip : _('Share files')
				}, {
					getClass: Zarafa.plugins.files.settings.data.AccountRenderUtil.featureRenderer.createDelegate(this, [Zarafa.plugins.files.data.AccountRecordFeature.STREAMING], true),
					icon    : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPScxNicgaGVpZ2h0PScxNicgdmlld0JveD0iMCAwIDEyMi44OCA4MC40NSI+PHBhdGggZD0iTTYxLjM4IDUyYTE4LjI1IDE4LjI1IDAgMCAxLTMuMTItLjI2IDEyLjM2IDEyLjM2IDAgMCAxLTQuNDQtMi4yOSAxMi40NSAxMi40NSAwIDAgMS0uODYtLjc3IDExLjkxIDExLjkxIDAgMCAxLTMuNS04LjUgMTIuMTIgMTIuMTIgMCAwIDEgMy41LTguNSAxMS45MSAxMS45MSAwIDAgMSA4LjUtMy41IDEyLjEyIDEyLjEyIDAgMCAxIDguNSAzLjUgMTIuMDUgMTIuMDUgMCAwIDEgMi4zNSAxMy42M0ExMS4zNyAxMS4zNyAwIDAgMSA2MS4zOCA1MnpNMjMuNjcgNzIuNDFhNC44NiA0Ljg2IDAgMCAxIDEuMTYgMy40MyA0Ljk0IDQuOTQgMCAwIDEtMS41NiAzLjMxbC0uMTUuMTNhNC44MiA0LjgyIDAgMCAxLTMuNDQgMS4xNiA0LjkgNC45IDAgMCAxLTMuMjktMS41NWwtLjE2LS4yQTY5Ljg3IDY5Ljg3IDAgMCAxIDQgNTkuNzQgNDguMjkgNDguMjkgMCAwIDEgMCA0MGE0OC43NSA0OC43NSAwIDAgMSA0LjY0LTE5LjcxQTcwLjA3IDcwLjA3IDAgMCAxIDE3LjU4IDEuNjJsLjEzLS4xM0E1IDUgMCAwIDEgMjEgLjA5YTQuNzkgNC43OSAwIDAgMSAzLjQ4IDEuMzNsLjExLjEyQTQuOTMgNC45MyAwIDAgMSAyNiA0LjgyYTQuNzggNC43OCAwIDAgMS0xLjMzIDMuNDdsLS4wNy4wOGE2MS41OSA2MS41OSAwIDAgMC0xMSAxNS43OCAzOC45MSAzOC45MSAwIDAgMC0zLjg1IDE2QTM5LjQ4IDM5LjQ4IDAgMCAwIDEzIDU2LjI1IDYwLjM2IDYwLjM2IDAgMCAwIDIzLjI1IDcyYTEuNTQgMS41NCAwIDAgMSAuMjkuMjNsLjEzLjE0em0xOC4yNi0xNC42NWE0Ljg3IDQuODcgMCAwIDEgLjkzIDMuMzkgNC43NSA0Ljc1IDAgMCAxLTEuNzUgMy4yNGwtLjE5LjE1YTQuOSA0LjkgMCAwIDEtMy4zOS45MyA0Ljc1IDQuNzUgMCAwIDEtMy4yNS0xLjc1bC0uMDktLjExYTQyLjg0IDQyLjg0IDAgMCAxLTYuNzEtMTEuMzUgMzMuNzQgMzMuNzQgMCAwIDEtMi4zNS0xMi4xMyAzMi42MSAzMi42MSAwIDAgMSAyLjI1LTEyIDQyLjEgNDIuMSAwIDAgMSA2Ljc0LTExLjM2IDQuODUgNC44NSAwIDAgMSA3LjU2IDYuMDh2LjA1YTMyLjIzIDMyLjIzIDAgMCAwLTUuMSA4LjUxIDIyLjc3IDIyLjc3IDAgMCAwIDAgMTcuNDEgMzMuODQgMzMuODQgMCAwIDAgNS4yIDguNzJsLjE3LjI1em02NC41OSAyMS4xYTQuOTMgNC45MyAwIDAgMS0zLjMgMS41MyA0LjcxIDQuNzEgMCAwIDEtMy41LTEuMjMgNC44NSA0Ljg1IDAgMCAxLTEuNjItMy4zNWgwYTQuNzcgNC43NyAwIDAgMSAxLjIzLTMuNDdsLjA2LS4wN2E2MCA2MCAwIDAgMCAxMC40Ni0xNkEzOS41IDM5LjUgMCAwIDAgMTEzLjE4IDQwYTM4LjkxIDM4LjkxIDAgMCAwLTMuODYtMTZBNjAuOTIgNjAuOTIgMCAwIDAgOTguMjUgOC4yNGwtLjEyLS4xM2E0Ljc5IDQuNzkgMCAwIDEtMS4yNC0zLjM4IDUgNSAwIDAgMSAxLjQ5LTMuMzdsLjEzLS4xMkE0Ljc5IDQuNzkgMCAwIDEgMTAxLjg5IDBhNSA1IDAgMCAxIDMuMzcgMS40OWwuMTIuMTJhNzAuNTggNzAuNTggMCAwIDEgMTIuODcgMTguNTkgNDguODMgNDguODMgMCAwIDEgNC42MiAxOS42OCA0OC42NyA0OC42NyAwIDAgMS00IDE5LjgxIDY5LjQyIDY5LjQyIDAgMCAxLTEyIDE4LjY4IDEuOTQgMS45NCAwIDAgMS0uMzQuNDdoMHpNODguMzUgNjQuMDVhNC44NSA0Ljg1IDAgMCAxLTguMjgtMi44OSA0Ljg0IDQuODQgMCAwIDEgMS4wNS0zLjU2di0uMDVhMzMgMzMgMCAwIDAgNS4xNy04LjYzIDIzLjEzIDIzLjEzIDAgMCAwIDAtMTcuNDh2LS4wOGEzMS45IDMxLjkgMCAwIDAtNS4xLTguNDRsLS4xNS0uMThhNC44OSA0Ljg5IDAgMCAxLS45Mi0zLjM4IDQuNzEgNC43MSAwIDAgMSAxLjc1LTMuMjRMODIgMTZhNC45MSA0LjkxIDAgMCAxIDMuNDgtMSA0LjggNC44IDAgMCAxIDMuMjUgMS43NmwuMDcuMDlhNDEuNjQgNDEuNjQgMCAwIDEgNi42OSAxMS4zIDMyLjQ3IDMyLjQ3IDAgMCAxIDIuMjYgMTIgMzMuNTkgMzMuNTkgMCAwIDEtMi4zNSAxMi4xIDQzLjM3IDQzLjM3IDAgMCAxLTYuNzcgMTEuNDUgMi40NyAyLjQ3IDAgMCAxLS4yOC4yOHoiIGZpbGw9IiM2ZDZkNzAiLz48L3N2Zz4K',
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
