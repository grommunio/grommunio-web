Ext.namespace('Zarafa.hierarchy.ui');

/**
 * @class Zarafa.hierarchy.ui.Tree
 * @extends Ext.tree.TreePanel
 * @xtype zarafa.hierarchytree
 *
 * TreePanel for Hierachy List
 */
Zarafa.hierarchy.ui.Tree = Ext.extend(Ext.tree.TreePanel, {
	/**
	 * @cfg {Zarafa.core.ContextModel} model The model which is used to control the
	 * current folder selection from this hierarchy tree.
	 */
	model : undefined,

	/**
	 * @cfg {Zarafa.core.data.HierarchyStore} store store which will be used to get data for hierarchy.
	 */
	store : undefined,

	/**
	 * @cfg {String} IPMFilter The IPM String on which the hierarchy must be filtered
	 */
	IPMFilter : undefined,

	/**
	 * @cfg {Boolean} hideDeletedFolders True to hide the subfolders of "Deleted Items".
	 */
	hideDeletedFolders : false,

	/**
	 * @cfg {Object} config option for {@link Zarafa.hierarchy.ui.FolderNode foldernode}
	 */
	nodeConfig : undefined,

	/**
	 * @cfg {Boolean} deferredLoading True to defer updating the Hierarchy when the panel
	 * is currently not visible.
	 */
	deferredLoading : false,

	/**
	 * The editor which is used for editing a field inside this tree.
	 * @property
	 * @type Zarafa.hierarchy.ui.TreeEditor
	 */
	treeEditor : undefined,

	/**
	 * @cfg {Object} loadMask An {@link Zarafa.common.ui.LoadMask} config or true to mask the {@link Zarafa.hierarchy.ui.Tree Tree} while
	 * loading. Defaults to <code>false</code>.
	 */
	loadMask : false,

	/**
	 * @cfg {Object} treeSorter a {@link Ext.Ext.tree.TreeSorter} config or {@link Boolean}
	 * to sort the {@link Zarafa.hierarchy.ui.Tree Tree}
	 * Defaults to <code>false</code>.
	 */
	treeSorter : false,

	/**
	 * @cfg {Boolean} ddAutoScrollContainer Autodetect a valid container to
	 * {@link Ext.dd.ScrollManager#register register} to the {@link Ext.dd.ScrollManager}.
	 *
	 * When {@link #enableDD} is enabled, but this panel itself does not have any {@link #autoScroll scrollbars},
	 * enabling this option will allow the class to dynamically detect which parent panel does have scrollbars,
	 * and register that panel to the {@link Ext.dd.ScrollManager}.
	 * Alternatively {@link #ddScrollContainer} can be used to set a certain panel specifically.
	 */
	ddAutoScrollContainer : false,

	/**
	 * @cfg {Ext.Element/Ext.Container} ddScrollContainer A valid container to
	 * {@link Ext.dd.ScrollManager#register register} to the {@link Ext.dd.ScrollManager}.
	 *
	 * When {@link #enableDD} is enabled, but this panel itself does not have any {@link #autoScroll scrollbars},
	 * setting a component or element to this option will register it to the {@link Ext.dd.ScrollManager}.
	 * Alternatively {@link #ddAutoScrollContainer} can be used to have the container be detected automatically.
	 */
	ddScrollContainer : undefined,

	/**
	 * @cfg {Boolean} defaultOpen Used by {@link #isFolderOpened} to determine if the folder should be opened
	 * by default or not.
	 */
	defaultOpen : false,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		if (!config.store) {
			config.store = container.getHierarchyStore();
		}

		// Configure root node for this component
		Ext.applyIf(config, {
			rootVisible : false,
			autoScroll : true,
			animate : false,
			border : false,
			// The rootnode is the parent node under which all Stores will be visualized,
			// because it is not part of the actual hierarchy but more of a helper node,
			// this node is invisible by default.
			root : new Zarafa.hierarchy.ui.HierarchyRootNode()
		});

		Zarafa.hierarchy.ui.Tree.superclass.constructor.call(this, config);

		// sort tree
		if(this.treeSorter && !(this.treeSorter instanceof Ext.tree.TreeSorter)) {
			this.treeSorter = new Zarafa.hierarchy.ui.TreeSorter(this, Ext.apply({}, this.treeSorter));
		}
	},

	/**
	 * Function will initialize {@link Zarafa.hierarchy.ui.Tree Tree} and creates a
	 * {@link Zarafa.common.ui.LoadMask} if {@link Zarafa.hierarchy.ui.Tree Tree} is intantiated as full tree.
	 * @protected
	 */
	initComponent : function()
	{
		// Intialize the loader
		if (!this.loader) {
			this.loader = new Zarafa.hierarchy.data.HierarchyTreeLoader({
				tree : this,
				store : this.store,
				nodeConfig : this.nodeConfig,
				deferredLoading : this.deferredLoading
			});
		}

		// call parent
		Zarafa.hierarchy.ui.Tree.superclass.initComponent.apply(this, arguments);

		// When DD is enabled within container scrolling, we must register a hook
		// to determine the container on which we are going to scroll.
		if (this.enableDD === true) {
			if (this.ddAutoScrollContainer === true) {
				this.on('load', this.autodetectScrollContainer, this);
			} else if (this.ddScrollContainer) {
				this.ddScrollContainer = Ext.Element(this.ddScrollContainer) ? this.ddScrollContainer : this.ddScrollContainer.el;
				this.registerScrollContainer(this.ddScrollContainer);
			}
		}

		// create load mask
		if(this.loadMask) {
			this.on('render', this.createLoadMask, this);
		}
	},

	/**
	 * When {@link #ddAutoScrollContainer} has been enabled, this function will walk
	 * up the parents of the current component parent which is scrollable. The {@link Ext.Container#body}
	 * will then be used for {@link #registerScrollContainer}.
	 * @private
	 */
	autodetectScrollContainer : function()
	{
		var ct = this.ownerCt;
		while (ct && ct.autoScroll !== true) {
			ct = ct.ownerCt;
		}

		if (ct) {
			// When autoScroll is enabled, the 'body' of the component will
			// have the the actuall scrollbar attached to it.
			this.registerScrollContainer(ct.body || ct.el);
		}
	},

	/**
	 * Register the given {@link Ext.Element} with the
	 * {@link Ext.dd.ScrollManager ScrollManager}.
	 * @param {Ext.Element} el The element to register to the scrollmanager
	 * @private
	 */
	registerScrollContainer : function(el)
	{
		// Apply some extra configuration options
		// which are used by the ScrollManager.
		el.ddScrollConfig = {
			vthresh: 50,
			hthresh: -1,
			frequency: 100,
			increment: 25
		};

		Ext.dd.ScrollManager.register(el);
	},

	/**
	 * Function will create {@link Zarafa.common.ui.LoadMask} which will be shown
	 * when loading the {@link Zarafa.hierarchy.ui.Tree Tree}.
	 * @private
	 */
	createLoadMask : function()
	{
		this.loadMask = new Zarafa.common.ui.LoadMask(this.getEl(), Ext.apply({store: this.store}, this.loadMask));
	},

	/**
	 * @return True when this tree has an {@link #IPMFilter} applied
	 */
	hasFilter : function()
	{
		return !Ext.isEmpty(this.IPMFilter);
	},

	/**
	 * The filter which is applied for filtering nodes from the
	 * {@link Zarafa.hierarchy.ui.Tree HierarchyTree}.
	 * @param {Object} folder the folder to filter
	 * @return {Boolean} true to accept the folder
	 */
	nodeFilter : function(folder)
	{
		var hide = false;

		// Check if the folder matches the requested IPMFilter
		if (Ext.isDefined(this.IPMFilter)) {
			hide = !folder.isContainerClass(this.IPMFilter, false);
		}

		// Check if the folder is located in Deleted items
		if (!hide && this.hideDeletedFolders) {
			hide = folder.isInDeletedItems();
		}

		return !hide;
	},

	/**
	 * @return {Array} list of all childnodes
	 * @private
	 */
	getAllNodes : function()
	{
		return this.getRootNode().childNodes;
	},

	/**
	 * Manual selection of the treeNode to which the folder is attached in the tree.
	 * This will first ensure the given folder {@link #ensureFolderVisible is visible}
	 * and will then {@link Ext.tree.DefaultSelectionModel#select select the given node} in the tree.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder to select
	 * @return {Boolean} True when the TreeNode for the given folder existed, and could be selected.
	 */
	selectFolderInTree : function(folder)
	{
		var treeNode = this.ensureFolderVisible(folder);
		if (treeNode) {
			this.getSelectionModel().select(treeNode);
			return true;
		} else {
			return false;
		}
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
		var treeNode = this.getTreeNode(folder);

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
			treeNode = this.getTreeNode(folder);
		}

		if (treeNode) {
			// Ensure that the given node is visible.
			// WARNING: After this call, treeNode is destroyed
			// as the TreeLoader will have reloaded the parent!
			treeNode.ensureVisible();

			// Obtain the new treeNode reference, update the UI and return it.
			treeNode = this.getTreeNode(folder);
			treeNode.update(true);
			return treeNode;
		}

		return false;
	},

	/**
	 * Check if the folder should be opened by default or not.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder to check
	 * @return {Boolean} True if the folder should be expanded by default
	 * @private
	 */
	isFolderOpened : function(folder)
	{
		return folder.isIPMSubTree() || this.defaultOpen;
	},

	/**
	 * Call {@link Zarafa.hierarchy.ui.FolderNode}#{@link Zarafa.hierarchy.ui.FolderNode#update update}
	 * on {@link #getAllNodes all nodes}.
	 * @protected
	 */
	updateAll : function()
	{
		var nodes = this.getAllNodes();
		for (var i = 0; i < nodes.length; i++) {
			nodes[i].update(true);
		}
	},

	/**
	 * Function will destroy load mask and calls parent class' beforeDestroy.
	 * @private
	 */
	beforeDestroy : function()
	{
		if (this.rendered && this.loadMask) {
			Ext.destroy(this.loadMask);
			this.loadMask = false;
		}
		if (this.treeSorter) {
			Ext.destroy(this.treeSorter);
			this.treeSorter = false;
		}
		Zarafa.hierarchy.ui.Tree.superclass.beforeDestroy.call(this);
	},

	/**
	 * Function is used to find the {@link Zarafa.hierarchy.ui.FolderNode} based on the folder.
	 * If selected folder is {@link Zarafa.common.favorites.data.FavoritesFolderRecord favorites} folder then
	 * we append "favorites-" keyword with folder entryid to uniquely identify and get the favorites marked folder node.
	 * 
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord | Zarafa.common.favorites.data.FavoritesFolderRecord} folder the folder
	 * can be favorites folder or any noramal folder.
	 * @returns {Zarafa.hierarchy.ui.FolderNode} folder node object
	 */
	getTreeNode: function (folder)
	{
		var id = folder.get('entryid');
		if (folder.isFavoritesFolder()) {
			id = "favorites-"+id;
		}
		return this.getNodeById(id);
	}
});

Ext.reg('zarafa.hierarchytree', Zarafa.hierarchy.ui.Tree);
