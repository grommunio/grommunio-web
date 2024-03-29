Ext.namespace('Zarafa.plugins.files.ui');

Zarafa.plugins.files.ui.FilesRecordGridColumnModel = Ext.extend(Zarafa.common.ui.grid.ColumnModel, {

	useCompactView: false,

	constructor: function (config) {
		config = config || {};

		this.defaultColumns = this.createDefaultColumns();
		this.compactColumns = this.createCompactColumns();

		Ext.applyIf(config, {
			columns : this.defaultColumns,
			defaults: {
				sortable: true
			}
		});

		if (config.useCompactView === true) {
			config.columns = this.compactColumns;
		}

		Ext.apply(this, config);

		Zarafa.plugins.files.ui.FilesRecordGridColumnModel.superclass.constructor.call(this, config);
	},

	createDefaultColumns: function () {
		return [{
			id       : 'type',
			dataIndex: 'type',
			header   : '<p class="icon_index">&nbsp;</p>',
			headerCls: 'zarafa-icon-column icon',
			renderer : Zarafa.plugins.files.data.Utils.Renderer.typeRenderer,
			width    : 24,
			fixed    : true,
			tooltip  : _('Sort by: Type')
		},
			{
				header   : 'ID',
				dataIndex: 'id',
				width    : 50,
				hidden   : true,
				tooltip  : _('Sort by: ID')
			},
			{
				header   : 'Path',
				dataIndex: 'path',
				width    : 100,
				hidden   : true,
				tooltip  : _('Sort by: Path')
			},
			{
				header   : _('Filename'),
				dataIndex: 'filename',
				width    : 160,
				tooltip  : _('Sort by: Filename')
			},
			{
				header   : _('Last modified'),
				dataIndex: 'lastmodified',
				width    : 160,
				renderer : Zarafa.plugins.files.data.Utils.Renderer.datetimeRenderer,
				tooltip  : _('Sort by: Last modified')
			},
			{
				header   : _('Size'),
				dataIndex: 'message_size',
				width    : 80,
				renderer : Zarafa.plugins.files.data.Utils.Format.fileSizeList,
				tooltip  : _('Sort by: Size')
			},
			{
				id       : 'isshared',
				dataIndex: 'isshared',
				header   : '<p class="files_icon_12_share">&nbsp;</p>',
				headerCls: 'zarafa-icon-column icon',
				renderer : Zarafa.plugins.files.data.Utils.Renderer.sharedRenderer,
				listeners: {
					click: this.doOnShareButtonClick
				},
				width    : 32,
				fixed    : true,
				tooltip  : _('Sort by: Shared')
			}
		];
	},

	createCompactColumns: function () {
		return [{
			id       : 'column_type',
			dataIndex: 'type',
			header   : '<p class="icon_index">&nbsp;</p>',
			headerCls: 'zarafa-icon-column icon',
			renderer : Zarafa.plugins.files.data.Utils.Renderer.typeRenderer,
			width    : 24,
			fixed    : true,
			tooltip  : _('Sort by: Type')
		},
			{
				header   : _('Filename'),
				dataIndex: 'filename',
				width    : 160,
				tooltip  : _('Sort by: Filename')
			},
			{
				header   : _('Last modified'),
				dataIndex: 'lastmodified',
				width    : 100,
				renderer : Zarafa.plugins.files.data.Utils.Renderer.datetimeRenderer,
				tooltip  : _('Sort by: Last modified')
			},
			{
				header   : _('Size'),
				dataIndex: 'message_size',
				width    : 80,
				renderer : Zarafa.plugins.files.data.Utils.Format.fileSizeList,
				tooltip  : _('Sort by: Size')
			},
			{
				id       : 'isshared',
				dataIndex: 'isshared',
				header   : '<p class="files_icon_12_share">&nbsp;</p>',
				headerCls: 'zarafa-icon-column icon',
				renderer : Zarafa.plugins.files.data.Utils.Renderer.sharedRenderer,
				listeners: {
					click: this.doOnShareButtonClick
				},
				width    : 32,
				fixed    : true,
				tooltip  : _('Sort by: Shared')
			}
		];
	},

	setCompactView: function (compact) {
		if (this.useCompactView !== compact) {
			this.useCompactView = compact;

			if (compact) {
				this.name = 'compact';

				this.defaultColumns = this.config;
				this.columns = this.compactColumns;
			} else {
				this.name = 'default';
				this.compactColumns = this.config;
				this.columns = this.defaultColumns;
			}

			this.setConfig(this.columns, false);
		}
	},

	doOnShareButtonClick: function (col, grid, row, event) {
		var record = grid.store.getAt(row);

		if (record.get("isshared") === true) {
			Zarafa.plugins.files.data.Actions.createShareDialog([record]);
		}
	}
});
