Ext.namespace('Zarafa.plugins.files.backend.Seafile.ui');

/**
 * Grid that displays all Seafile share recipients for the selected record.
 */
Zarafa.plugins.files.backend.Seafile.ui.FilesShareUserGrid = Ext.extend(
	Ext.grid.GridPanel,
	{
		store: undefined,
		recordId: undefined,
		constructor: function (e) {
			e = e || {};
			this.store =
				Zarafa.plugins.files.backend.Seafile.data.singleton.ShareStore.getStore();
			Ext.applyIf(e, {
				xtype: 'filesplugin.seafile.filesshareusergrid',
				ref: 'sharegrid',
				store: this.store,
				border: false,
				baseCls: 'shareGrid',
				enableHdMenu: false,
				loadMask: this.initLoadMask(),
				viewConfig: this.initViewConfig(),
				sm: this.initSelectionModel(),
				cm: this.initColumnModel(),
				listeners: {
					rowdblclick: this.onRowDblClick,
					scope: this,
				},
				tbar: [
					{
						iconCls: 'filesplugin_icon_add',
						text: _('Add'),
						handler: this.onAdd.createDelegate(this),
					},
					'-',
					{
						iconCls: 'filesplugin_icon_delete',
						text: _('Delete'),
						ref: '../removeAccountBtn',
						disabled: true,
						handler: this.onDelete.createDelegate(this),
					},
				],
			});
			Zarafa.plugins.files.backend.Seafile.ui.FilesShareUserGrid.superclass.constructor.call(
				this,
				e,
			);
		},
		initLoadMask: function () {
			return {
				msg:
					_('Loading users and groups') +
					'...',
			};
		},
		initViewConfig: function () {
			return {
				enableRowBody: false,
				forceFit: true,
				emptyText:
					"<div class='emptytext'>" +
					_('Add users or groups to share files.') +
					'</div>',
				deferEmptyText: false,
			};
		},
		initSelectionModel: function () {
			return new Ext.grid.RowSelectionModel({
				singleSelect: true,
				listeners: {
					selectionchange: this.onRowSelected,
				},
			});
		},
		initColumnModel: function () {
			return new Zarafa.plugins.files.backend.Seafile.ui.FilesShareUserGridColumnModel(
				{
					fileType: this.store.fileType,
				},
			);
		},
		onRowSelected: function (e) {
			this.grid.removeAccountBtn.setDisabled(e.getCount() != 1);
		},
		onRowDblClick: function (e, t) {
			Zarafa.core.data.UIFactory.openLayerComponent(
				Zarafa.core.data.SharedComponentType['filesplugin.seafile.useredit'],
				undefined,
				{
					store: e.getStore(),
					record: e.getStore().getAt(t),
					manager: Ext.WindowMgr,
					recordId: this.recordId,
				},
			);
		},
		onAdd: function (e, t) {
			Zarafa.core.data.UIFactory.openLayerComponent(
				Zarafa.core.data.SharedComponentType['filesplugin.seafile.useredit'],
				undefined,
				{
					store: this.store,
					manager: Ext.WindowMgr,
					recordId: this.recordId,
				},
			);
		},
		onDelete: function (e, t) {
			var i = this.getSelectionModel().getSelected();
			if (!i) {
				return false;
			}
			this.store.remove(i);
		},
	},
);
Ext.reg(
	'filesplugin.seafile.filesshareusergrid',
	Zarafa.plugins.files.backend.Seafile.ui.FilesShareUserGrid,
);
