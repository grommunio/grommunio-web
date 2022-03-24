Ext.namespace('Zarafa.plugins.files.ui');

/**
 * @class Zarafa.plugins.files.ui.Tree
 * @extends Ext.tree.TreePanel
 * @xtype filesplugin.tree
 *
 * The hierarchy tree panel implementation for files.
 */
Zarafa.plugins.files.ui.Tree = Ext.extend(Ext.tree.TreePanel, {

	/**
	 * @cfg {String} account id that should be loaded.
	 */
	accountFilter: undefined,

	/**
	 * @cfg {Object} config option for {@link Zarafa.hierarchy.ui.FolderNode foldernode}
	 */
	nodeConfig : undefined,

	/**
	 * @cfg {String} IPMFilter The IPM String on which the hierarchy must be filtered
	 */
	FilesFilter : undefined,

	/**
	 * @cfg {Object} treeSorter a {@link Ext.Ext.tree.TreeSorter} config or {@link Boolean}
	 * to sort the {@linkZarafa.plugins.files.ui.Tree Tree}
	 * Defaults to <code>true</code>.
	 */
	treeSorter : true,

	/**
	 * @constructor
	 * @param config
	 */
	constructor: function (config) {
		config = config || {};

		if (Ext.isDefined(config.accountFilter)) {
			this.accountFilter = config.accountFilter;
		}

		if (!config.store) {
			config.store = config.model.getHierarchyStore();
		}

		Ext.applyIf(config, {
			xtype : 'filesplugin.tree',
			enableDD : true,
			border : false,
			ddGroup : 'dd.filesrecord',
			ddAppendOnly : true,
			pathSeparator: '&',
			root : new Zarafa.plugins.files.ui.FilesHierarchyRootNode({
				text : 'Files',
				id : '#R#',
				// TODO: Find why we need this
				cc : false,
				leaf : false,
				expanded : true,
				uiProvider : Ext.tree.RootTreeNodeUI
			}),
			expanded : true,
			rootVisible : false,
			autoScroll : true,
			maskDisabled : true
		});
		Zarafa.plugins.files.ui.Tree.superclass.constructor.call(this, config);

		if(this.treeSorter && !(this.treeSorter instanceof Ext.tree.TreeSorter)) {
			this.treeSorter = new Ext.tree.TreeSorter(this);
		}
	},

	/**
	 * Init the events.
	 */
	initEvents : function()
	{
		Zarafa.plugins.files.ui.Tree.superclass.initEvents.apply(this, arguments);
		this.on('afterrender', this.onAfterRenderTree, this);
	},

	/**
	 * Function will initialize {@link Zarafa.plugins.files.ui.Tree Tree}.
	 * @protected
	 */
	initComponent : function()
	{
		// Intialize the loader
		if (!this.loader) {
			this.loader = new Zarafa.plugins.files.data.NavigatorTreeLoader({
				tree : this,
				store : this.store,
				nodeConfig : this.nodeConfig,
				deferredLoading : this.deferredLoading
			});
		}

		Zarafa.plugins.files.ui.Tree.superclass.initComponent.apply(this, arguments);

		// create load mask
		if(this.loadMask) {
			this.on('render', this.createLoadMask, this);
		}
	},

	/**
	 * Function will create {@link Zarafa.common.ui.LoadMask} which will be shown
	 * when loading the {@link Zarafa.plugins.files.ui.Tree Tree}.
	 * @private
	 */
	createLoadMask : function()
	{
		this.loadMask = new Zarafa.common.ui.LoadMask(this.ownerCt.getEl(), Ext.apply({ store: this.store }, this.loadMask));
		if (this.store.isLoading()) {
			this.loadMask.show();
		}
	},

	/**
	 * Event handler triggered when tree panel rendered.
	 * It will also listen for the {@link Ext.tree.DefaultSelectionModel#selectionchange selection change} event.
	 * @private
	 */
	onAfterRenderTree : function()
	{
		this.mon(this.selModel, 'selectionchange', this.onSelectionChange, this);
	},

	/**
	 * Event handler triggered when folder is changed in hierarchy.
	 * It will check that selected node(folder) is Expandable and currently not Expanded then
	 * expand the selected node.
	 *
	 * @param {Ext.tree.DefaultSelectionModel} selModel The {@link Ext.tree.DefaultSelectionModel DefaultSelectionModel}.
	 * @param {TreeNode} node The node to select
	 */
	onSelectionChange : function(selModel, selectedNode)
	{
		if (Ext.isEmpty(selectedNode)) {
			return;
		}

		if(selectedNode.isExpandable() && !selectedNode.isExpanded()){
			selectedNode.expand(false, true);
		}
	},

	/**
	 * Manual selection of the treeNode to which the folder is attached in the tree.
	 * This will first ensure the given folder {@link #ensureFolderVisible is visible}
	 * and will then {@link Ext.tree.DefaultSelectionModel#select select the given node} in the tree.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder to select
	 * @param {Boolean} ensureVisibility True to make given folder visible in screen moving scroll bar.
	 * @return {Boolean} True when the TreeNode for the given folder existed, and could be selected.
	 */
	selectFolderInTree : function(folder, ensureVisibility)
	{
		var treeNode;

		if (ensureVisibility !== false) {
			treeNode = this.ensureFolderVisible(folder);
		} else {
			treeNode = this.getNodeById(folder.id);
		}

		if (treeNode) {
			this.getSelectionModel().select(treeNode, undefined, ensureVisibility);
			return true;
		}
		return false;
	},
	/**
	 * This will call {@link Ext.tree.TreeNode#ensureVisible} in the node
	 * to which the given folder is attached. This will first make sure
	 * that the actual folder has been loaded by the parent folder.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder which must
	 * be made visible.
	 * @return {Zarafa.hierarchy.ui.FolderNode} The node which was made visible,
	 * false if the folder was not found in the hierarchy.
	 */
	ensureFolderVisible : function(folder)
	{
		var treeNode = this.getNodeById(folder.id);

		// If the tree has not been found, take the parent folder.
		if (!treeNode) {
			var parentfolder = folder.getParentFolder();
			if (!parentfolder) {
				return false;
			}

			// With the parent folder we can ensure that folder is visible,
			// and expand it to ensure the subfolders will be rendered.
			var parentNode = this.ensureFolderVisible(parentfolder);
			if (!parentNode) {
				return false;
			}

			parentNode.expand();

			// With luck, the node has now been created.
			treeNode = this.getNodeById(folder.id);
		}

		if (treeNode) {
			// Ensure that the given node is visible.
			// WARNING: After this call, treeNode is destroyed
			// as the TreeLoader will have reloaded the parent!
			treeNode.ensureVisible();

			// Obtain the new treeNode reference, update the UI and return it.
			treeNode = this.getNodeById(folder.id);
			treeNode.update(true);
			return treeNode;
		}

		return false;
	},

	/**
	 * The filter which is applied for filtering nodes from the
	 * {@link Zarafa.plugins.files.ui.Tree Tree}.
	 *
	 * @param {Object} folder the folder to filter
	 * @return {Boolean} true to accept the folder
	 */
	nodeFilter : function (folder)
	{
		var hide = false;

		if (Ext.isDefined(this.accountFilter)) {
			hide = folder.getFilesStore().get('entryid') !== this.accountFilter;
		}

		if (!hide && Ext.isDefined(this.FilesFilter)) {
			hide = folder.get('object_type') !== Zarafa.plugins.files.data.FileTypes.FOLDER;
		}

		if( !hide && folder.isHomeFolder()) {
			hide = true;
		}

		return !hide;
	}
});

Ext.reg('filesplugin.tree', Zarafa.plugins.files.ui.Tree);
