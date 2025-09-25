Ext.namespace('Zarafa.plugins.files.backend.Seafile.ui');

/**
 * Column model that mirrors the permissions matrix used by the ownCloud backend.
 */
Zarafa.plugins.files.backend.Seafile.ui.FilesShareUserGridColumnModel =
	Ext.extend(Zarafa.common.ui.grid.ColumnModel, {
		constructor: function (e) {
			e = e || {};
			this.defaultColumns = this.createDefaultColumns(e.fileType);
			Ext.applyIf(e, {
				columns: this.defaultColumns,
				defaults: {
					sortable: true,
				},
			});
			Ext.apply(this, e);
			Zarafa.plugins.files.backend.Seafile.ui.FilesShareUserGridColumnModel.superclass.constructor.call(
				this,
				e,
			);
		},
		createDefaultColumns: function (e) {
			var t = [
				{
					header: _('Name'),
					dataIndex: 'shareWithDisplayname',
					flex: 1,
					sortable: true,
					tooltip: _('Sort by: Name'),
				},
				{
					header: _('Type'),
					dataIndex: 'type',
					flex: 1,
					align: 'center',
					sortable: true,
					renderer: this.shareTypeRenderer,
					tooltip: _('Sort by: Type'),
				},
				{
					header: _('Share'),
					dataIndex: 'permissionShare',
					flex: 1,
					align: 'center',
					sortable: false,
					renderer: this.yesNoRenderer,
				},
				{
					header: _('Change'),
					dataIndex: 'permissionChange',
					flex: 1,
					align: 'center',
					sortable: false,
					renderer: this.yesNoRenderer,
				},
			];
			if (e === Zarafa.plugins.files.data.FileTypes.FOLDER) {
				t.push(
					{
						header: _('Create'),
						dataIndex: 'permissionCreate',
						flex: 1,
						align: 'center',
						sortable: false,
						renderer: this.yesNoRenderer,
					},
					{
						header: _('Delete'),
						dataIndex: 'permissionDelete',
						flex: 1,
						align: 'center',
						sortable: false,
						renderer: this.yesNoRenderer,
					},
				);
			}
			return t;
		},
		shareTypeRenderer: function (e, t, i) {
			t.css = 'shareicon_16_' + e;
			t.css += ' zarafa-grid-empty-cell';
			return '';
		},
		yesNoRenderer: function (e, t, i) {
			t.css = e ? 'shareicon_16_yes' : 'shareicon_16_no';
			t.css += ' zarafa-grid-empty-cell';
			return '';
		},
	});
Ext.namespace('Zarafa.plugins.files.backend.Seafile.ui');
