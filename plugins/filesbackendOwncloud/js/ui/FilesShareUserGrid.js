Ext.namespace('Zarafa.plugins.files.backend.Owncloud.ui');

/**
 * @class Zarafa.plugins.files.backend.Owncloud.ui.FilesShareUserGrid
 * @extends Ext.grid.GridPanel
 * @xtype filesplugin.owncloud.filesshareusergrid
 *
 * The main gridpanel for our share list. It will display user and group shares.
 */
Zarafa.plugins.files.backend.Owncloud.ui.FilesShareUserGrid = Ext.extend(Ext.grid.GridPanel, {

	/**
	 * @cfg {Object} The account store.
	 */
	store: undefined,

  /**
   * @cfg {Number} The parent record id
   */
  recordId: undefined,
	
	/**
	 * @constructor
	 * @param {Object} config
	 */
	constructor: function (config) {
		config = config || {};

		this.store = Zarafa.plugins.files.backend.Owncloud.data.singleton.ShareStore.getStore();

		Ext.applyIf(config, {
			xtype       : 'filesplugin.owncloud.filesshareusergrid',
			ref         : 'sharegrid',
			store       : this.store,
			border      : false,
			baseCls     : 'shareGrid',
			enableHdMenu: false,
			loadMask    : this.initLoadMask(),
			viewConfig  : this.initViewConfig(),
			sm          : this.initSelectionModel(),
			cm          : this.initColumnModel(),
			listeners   : {
				rowdblclick: this.onRowDblClick,
				scope      : this
			},
			tbar        : [{
				iconCls: 'filesplugin_icon_add',
				text   : _('Add'),
				handler: this.onAdd.createDelegate(this)
			}, '-', {
				iconCls : 'filesplugin_icon_delete',
				text    : _('Delete'),
				ref     : '../removeAccountBtn',
				disabled: true,
				handler : this.onDelete.createDelegate(this)
			}]
		});

		Zarafa.plugins.files.backend.Owncloud.ui.FilesShareUserGrid.superclass.constructor.call(this, config);
	},

	/**
	 * Initialize the {@link Ext.grid.GridPanel.loadMask} field.
	 *
	 * @return {Ext.LoadMask} The configuration object for {@link Ext.LoadMask}
	 * @private
	 */
	initLoadMask: function () {
		return {
			msg: _('Loading users and groups') + '...'
		};
	},

	/**
	 * Initialize the {@link Ext.grid.GridPanel#viewConfig} field.
	 *
	 * @return {Ext.grid.GridView} The configuration object for {@link Ext.grid.GridView}
	 * @private
	 */
	initViewConfig: function () {
		// enableRowBody is used for enabling the rendering of
		// the second row in the compact view model. The actual
		// rendering is done in the function getRowClass.
		//
		// NOTE: Even though we default to the extended view,
		// enableRowBody must be enabled here. We disable it
		// later in onContextViewModeChange(). If we set false
		// here, and enable it later then the row body will never
		// be rendered. So disabling after initializing the data
		// with the rowBody works, but the opposite will not.

		return {
			enableRowBody : false,
			forceFit      : true,
			emptyText     : '<div class=\'emptytext\'>' + _('Add users or groups to share files.') + '</div>',
			deferEmptyText: false
		};
	},

	/**
	 * Initialize the {@link Ext.grid.GridPanel.sm SelectionModel} field.
	 *
	 * @return {Ext.grid.RowSelectionModel} The subclass of {@link Ext.grid.AbstractSelectionModel}
	 * @private
	 */
	initSelectionModel: function () {
		return new Ext.grid.RowSelectionModel({
			singleSelect: true,
			listeners   : {
				selectionchange: this.onRowSelected
			}
		});
	},

	/**
	 * Initialize the {@link Ext.grid.GridPanel.cm ColumnModel} field.
	 *
	 * @return {Ext.grid.ColumnModel} The {@link Ext.grid.ColumnModel} for this grid
	 * @private
	 */
	initColumnModel: function () {
		return new Zarafa.plugins.files.backend.Owncloud.ui.FilesShareUserGridColumnModel({fileType: this.store.fileType});
	},

	/**
	 * Function is called if a row in the grid gets selected.
	 *
	 * @param selectionModel
	 * @private
	 */
	onRowSelected: function (selectionModel) {
		var remButton = this.grid.removeAccountBtn;
		remButton.setDisabled(selectionModel.getCount() != 1);
	},

	/**
	 * Eventhandler that is triggered if a grid row gets double clicked. It will open the user edit dialog.
	 *
	 * @param grid the grid holding the share records
	 * @param rowIndex index of the currently selected record
	 */
	onRowDblClick: function (grid, rowIndex) {
		Zarafa.core.data.UIFactory.openLayerComponent(Zarafa.core.data.SharedComponentType['filesplugin.owncloud.useredit'], undefined, {
			store  : grid.getStore(),
			record : grid.getStore().getAt(rowIndex),
			manager: Ext.WindowMgr,
			recordId: this.recordId
		});
	},

	/**
	 * Eventhandler for the add button. It will create a new grid entry and starts the editor for the newly created
	 * entry.
	 *
	 * @param btn
	 * @param event
	 * @private
	 */
	onAdd: function (btn, event) {
		Zarafa.core.data.UIFactory.openLayerComponent(Zarafa.core.data.SharedComponentType['filesplugin.owncloud.useredit'], undefined, {
			store  : this.store,
			manager: Ext.WindowMgr,
			recordId: this.recordId
		});
	},

	/**
	 * Eventhandler for the delete button. It will remove the selected record from the grid.
	 *
	 * @param button
	 * @param event
	 * @private
	 */
	onDelete: function (button, event) {
		var rec = this.getSelectionModel().getSelected();
		if (!rec) {
			return false;
		}
		this.store.remove(rec);
	}
});

Ext.reg('filesplugin.owncloud.filesshareusergrid', Zarafa.plugins.files.backend.Owncloud.ui.FilesShareUserGrid);
