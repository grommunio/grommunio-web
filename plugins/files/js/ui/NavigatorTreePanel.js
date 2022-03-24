Ext.namespace('Zarafa.plugins.files.ui');

/**
 * @class Zarafa.plugins.files.ui.NavigatorTreePanel
 * @extends Zarafa.plugins.files.ui.Tree
 * @xtype filesplugin.navigatortreepanel
 *
 * The hierarchy tree panel implementation for files.
 */
Zarafa.plugins.files.ui.NavigatorTreePanel = Ext.extend(Zarafa.plugins.files.ui.Tree, {

	/**
	 * @property {String} nodeToSelect is the path of the node that should be selected.
	 */
	nodeToSelect : null,

	/**
	 * @cfg {@link Zarafa.plugins.files.data.FilesRecordStore filesStore} which contains
	 * {@link Zarafa.plugins.files.data.FilesRecord FilesRecord}.
	 */
	filesStore : undefined,

	/**
	 * @constructor
	 * @param config
	 */
	constructor: function (config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype : 'filesplugin.navigatortreepanel',
			loadMask : true

		});

		Zarafa.plugins.files.ui.NavigatorTreePanel.superclass.constructor.call(this, config);

		this.mon(this.store, 'removeFolder', this.onFolderRemove, this);
	},

	/**
	 * Event handler which is fired when the {@link #store} fires the
	 * {@link Zarafa.hierarchy.data.HierarchyStore#removeFolder} event handlerr. This will check
	 * if the folder is currently opened, and will deselect that folder.
	 *
	 * @param {Zarafa.plugins.files.data.FilesHierarchyStore} store The store which fired the event
	 * @param {Zarafa.plugins.files.data.FilesStoreRecord} storeRecord The store from where the folder is
	 * removed
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder which was removed from the store
	 * @private
	 */
	onFolderRemove : function(store, storeRecord, folder)
	{
		if (this.model) {
			this.model.removeFolder(folder);
		}
	},

	/**
	 * Function called by Extjs when the {@link Zarafa.plugins.files.ui.Tree TreePanel}
	 * has been {@link #render rendered}. At this time all events can be registered.
	 * @private
	 */
	initEvents : function()
	{
		Zarafa.plugins.files.ui.NavigatorTreePanel.superclass.initEvents.apply(this, arguments);

		this.on({
			"click" : this.onNodeClick,
			"beforenodedrop" : this.onBeforeNodeDrop,
			"nodedragover" : this.onNodeDragOver,
			"afterrender" : this.onAfterRender,
			"contextmenu" : this.onContextMenu,
			scope : this
		});

		this.mon(container, 'folderselect', this.onFolderSelect, this);
		this.mon(this.store, 'load', this.onHierarchyStoreLoad, this);
	},

	/**
	 * The {@link Ext.tree.TreePanel#beforenodedrop} event handler. It will move dropped nodes to the new
	 * location.
	 *
	 * @param event
	 * @returns {*}
	 */
	onBeforeNodeDrop: function (event)
	{
		if (Ext.isArray(event.data.selections)) {
			event.cancel = false;

			Ext.each(event.data.selections, function (record) {
				record.setDisabled(true);
			});

			return Zarafa.plugins.files.data.Actions.moveRecords(event.data.selections, event.target.getFolder(), {hierarchyStore : this.store});
		}
	},

	/**
	 * The {@link Ext.tree.TreePanel#nodedragover} event handler. This function will check if dropping a node on
	 * this hovered node is allowed. (For example: same account check)
	 *
	 * @param event
	 * @returns {boolean}
	 */
	onNodeDragOver: function (event)
	{
		var ret = true;
		var targetFolder = event.target.getFolder();
		var filesStore = targetFolder.getFilesStore();
		var targetedAccountID = filesStore.get('backend_config').current_account_id;

		Ext.each(event.data.selections, function (record) {
			var parentFolder = this.store.getFolder(record.get('parent_entryid'));

			if (!Ext.isDefined(parentFolder)) {
				ret = false;
				return false;
			}

			var accountID = parentFolder.getFilesStore().get('backend_config').current_account_id;

			if (targetedAccountID !== accountID) {
				ret = false;
				return false;
			}

			if (targetFolder.get('entryid') === record.get('entryid')  || parentFolder.get("entryid") === targetFolder.get('entryid')) {
				ret = false;
				return false;
			}
		}, this);

		return ret;
	},

	/**
	 * The {@link Ext.tree.TreePanel#click} event handler. This function will expand the node after it was clicked.
	 *
	 * @param node
	 */
	onNodeClick: function (node)
	{
		container.selectFolder(node.getFolder());
	},

	/**
	 * Fires when the {@link Zarafa.core.Container} fires the
	 * {@link Zarafa.core.Container#folderselect} event. This
	 * will search for the corresponding node in the tree,
	 * and will mark the given folder as {@link #selectFolderInTree selected}.
	 *
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord|Array} folder The folder which
	 * is currently selected.
	 * @private
	 */
	onFolderSelect : function(folder)
	{
		if (Array.isArray(folder)) {

			// If we have multi selected folder then select previously selected node in tree.
			if (folder.length > 1 && this.model) {
				folder = this.model.getDefaultFolder();
			} else {
				folder = folder[0];
			}
		}

		// Select the node of selected folder.
		if (folder) {
			if (Ext.isFunction(folder.isHomeFolder) && folder.isHomeFolder()) {
				this.selModel.clearSelections();
			} else {
				this.selectFolderInTree(folder);
			}
		}
	},

	/**
	 * Event handler triggered when {@link Zarafa.plugins.files.data.FilesHierarchyStore FilesHierarchyStore}.
	 * @param {Object} loader TreeLoader object.
	 * @param {Object} node The {@link Ext.tree.TreeNode} object being loaded.
	 * @param {Object} response The response object containing the data from the server.
	 * @private
	 */
	onHierarchyStoreLoad : function()
	{
		// TODO: Need to find proper way to refresh the hierarchy.
		this.root.reload();
		this.onFolderSelect(this.model.getDefaultFolder());
	},

	/**
	 * The {@link Ext.tree.TreePanel#afterrender} event handler. The DropZone needs to set up after the panel
	 * has been rendered.
	 *
	 * @param treepanel
	 */
	onAfterRender: function (treepanel)
	{
		// TODO: Create HierarchyItemDropZone, HierarchyFolderDropZone and HierarchyTreeDropZone
		// instead of Ext.tree.TreeDropZone. it will help in future to support drag and drop folder/file
		// inter files account.
		this.dragZone.lock();
		this.dropZone = new Ext.tree.TreeDropZone(this, {
			ddGroup: this.ddGroup,
			appendOnly: this.ddAppendOnly === true,
			getDropPoint : function(e, n, dd)
			{
				return 'append';
			}
		});
	},

	/**
	 * Eventhandler for the context menu event. This will show the default content menu.
	 *
	 * @param node
	 * @param event
	 */
	onContextMenu: function (node, event)
	{
		var component = Zarafa.core.data.SharedComponentType['zarafa.plugins.files.treecontextmenu'];
		Zarafa.core.data.UIFactory.openContextMenu(component, node.getFolder(), {
			position: event.getXY(),
			model : this.model
		});
	}
});

Ext.reg('filesplugin.navigatortreepanel', Zarafa.plugins.files.ui.NavigatorTreePanel);
