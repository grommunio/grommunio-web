Ext.namespace('Zarafa.common.delegates.ui');

/**
 * @class Zarafa.common.delegates.ui.DelegatesGrid
 * @extends Ext.grid.GridPanel
 * @xtype zarafa.delegatesgrid
 *
 * {@link Zarafa.common.delegates.ui.DelegatesGrid DelegatesGrid} will be used to display
 * delegates of the current user.
 */
Zarafa.common.delegates.ui.DelegatesGrid = Ext.extend(Ext.grid.GridPanel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		if(!config.store) {
			config.store = new Zarafa.common.delegates.data.DelegateStore();
		}
	
		Ext.applyIf(config, {
			xtype : 'zarafa.delegatesgrid',
			border : true,
			store : config.store,
			viewConfig : {
				forceFit : true,
				emptyText : '<div class=\'emptytext\'>' + _('No delegate exists') + '</div>'
			},
			loadMask : this.initLoadMask(),
			columns : this.initColumnModel(),
			selModel : this.initSelectionModel(),
			listeners : {
				viewready : this.onViewReady,
				rowdblclick : this.onRowDblClick,
				scope : this
			}
		});

		Zarafa.common.delegates.ui.DelegatesGrid.superclass.constructor.call(this, config);
	},

	/**
	 * initialize events for the grid panel.
	 * @private
	 */
	initEvents : function()
	{
		Zarafa.common.delegates.ui.DelegatesGrid.superclass.initEvents.call(this);

		// select first delegate when store has finished loading
		this.mon(this.store, 'load', this.onViewReady, this, {single : true});
	},

	/**
	 * Creates a column model object, used in {@link #colModel} config
	 * @return {Ext.grid.ColumnModel} column model object
	 * @private
	 */
	initColumnModel : function()
	{
		return [{
			dataIndex : 'display_name',
			header : _('Name'),
			renderer : Zarafa.common.ui.grid.Renderers.text
		}];
	},

	/**
	 * Creates a selection model object, used in {@link #selModel} config
	 * @return {Ext.grid.RowSelectionModel} selection model object
	 * @private
	 */
	initSelectionModel : function()
	{
		return new Ext.grid.RowSelectionModel({
			singleSelect : true
		});
	},

	/**
	 * Initialize the {@link Ext.grid.GridPanel.loadMask} field
	 *
	 * @return {Ext.LoadMask} The configuration object for {@link Ext.LoadMask}
	 * @private
	 */
	initLoadMask : function()
	{
		return {
			msg : _('Loading delegates') + '...'
		};
	},

	/**
	 * Event handler which is fired when the gridPanel is ready. This will automatically
	 * select the first row in the grid.
	 * @private
	 */
	onViewReady : function()
	{
		this.getSelectionModel().selectFirstRow();
	},

	/**
	 * Event handler which is fired when the {@link Zarafa.common.delegates.ui.DelegatesGrid DelegatesGrid} is double clicked.
	 * it will call generic function to handle the functionality.
	 * @private
	 */
	onRowDblClick : function(grid, rowIndex)
	{
		this.openDelegatePermissions(grid.getStore().getAt(rowIndex));
	},

	/**
	 * Generic function to open {@link Zarafa.common.delegates.dialogs.DelegatePermissionContentPanel DelegatePermissionContentPanel} for
	 * the user which has been selected.
	 * @param {Zarafa.common.delegates.data.DelegateRecord} delegateRecord record that should be opened in {@link Zarafa.common.delegates.dialogs.DelegatePermissionContentPanel DelegatePermissionContentPanel}.
	 * if not passed then currently selected record will be used.
	 * @param {Object} config configuration object that should be passed to {@link Zarafa.common.delegates.dialogs.DelegatePermissionContentPanel DelegatePermissionContentPanel}.
	 */
	openDelegatePermissions : function(delegateRecord, config)
	{
		config = config || {};

		delegateRecord = delegateRecord || this.getSelectionModel().getSelected();
		if(!delegateRecord) {
			Ext.Msg.alert(_('Alert'), _('Please select a delegate.'));
			return;
		}

		Ext.apply(config, {
			recordComponentPluginConfig : {
				// we will open records ourself
				enableOpenLoadTask : false
			}
		});

		// open detailed permissions content panel
		Zarafa.common.Actions.openDelegatePermissionContent(delegateRecord, config);
	},

	/**
	 * Function will be called to remove a delegate.
	 */
	removeDelegate : function()
	{
		var selectionModel = this.getSelectionModel();
		var delegateRecord = selectionModel.getSelected();

		if(!delegateRecord) {
			Ext.Msg.alert(_('Alert'), _('Please select a delegate.'));
			return;
		}

		// before removing delegate we should select next available delegate,
		// because deleting delegate will remove selection
		if (selectionModel.hasNext()) {
			selectionModel.selectNext();
		} else if (selectionModel.hasPrevious()) {
			selectionModel.selectPrevious();
		}

		this.store.remove(delegateRecord);
	}
});

Ext.reg('zarafa.delegatesgrid', Zarafa.common.delegates.ui.DelegatesGrid);
