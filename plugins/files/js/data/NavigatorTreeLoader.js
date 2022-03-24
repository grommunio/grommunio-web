Ext.namespace('Zarafa.plugins.files.data');

/**
 * @class Zarafa.plugins.files.data.NavigatorTreeLoader
 * @extends Ext.tree.TreeLoader
 *
 * Files directory loader. Extends Ext treeloader to use grommunio
 * specific requests.
 */
Zarafa.plugins.files.data.NavigatorTreeLoader = Ext.extend(Ext.tree.TreeLoader, {

	/**
	 * When {@link #deferredLoading} is true, this property indicates if a call to
	 * {@link #doHierarchyLoad} has been made and has been scheduled. This implies
	 * that no events from the {@link #store} need to be handled, as a full refresh
	 * is pending.
	 * @property
	 * @type Boolean
	 * @private
	 */
	isDeferred : false,

	/**
	 * @cfg {Boolean} deferredLoading True to defer updating the Hierarchy when the panel
	 * is currently not visible. The parent {@link Ext.Container} which contains the
	 * {@link Ext.layout.CardLayout}, is stored in the {@link #deferredLoadingActiveParent}.
	 */
	deferredLoading : false,

	/**
	 * When {@link #deferredLoading} is true, this property contains the {@link Ext.Container}
	 * to which this loader will be listening to determine which Container is active.
	 * This will be initialized during {@link #onTreeAfterRender}.
	 * @property
	 * @type Ext.Container
	 * @private
	 */
	deferredLoadingActiveParent : undefined,

	/**
	 * @cfg {Object} config option for {@link Zarafa.plugins.files.ui.FilesFolderNode FilesFolderNode}
	 */
	nodeConfig : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function (config) {
		config = config || {};

		Ext.applyIf(config, {
			directFn : this.directFn.createDelegate(this),
		});

		Zarafa.plugins.files.data.NavigatorTreeLoader.superclass.constructor.call(this, config);
		// If the tree is already rendered, call onTreeAfterRender directly,
		// otherwise add the event handler.
		if (this.tree.rendered) {
			this.onTreeAfterRender();
		} else {
			this.tree.on('afterrender', this.onTreeAfterRender, this, { single : true });
		}
	},

	onTreeAfterRender : function()
	{
		this.bindStore(this.store, true);

		// If deferred loading is enabled, then we are going to need the parent
		// container which will have to be activated before we will load it.
		// If we can't find the parent, then don't defer loading.
		if (this.deferredLoading === true) {
			// Search for the desired container which can be activated.
			if (this.isParentCardLayout(this.tree)) {
				this.deferredLoadingActiveParent = this.tree;
			} else {
				this.deferredLoadingActiveParent = this.tree.findParentBy(this.isParentCardLayout, this);
				if (!this.deferredLoadingActiveParent) {
					this.deferredLoading = false;
				}
			}
		}
	},

	/**
	 * Returned true if the {@link Ext.Component#ownerCt owner} of the given {@link Ext.Container}
	 * contains the {@link Ext.layout.CardLayout}. This function is given in
	 * {@link #onTreeAfterRender} to determine the {@link #deferredLoadingActiveParent}.
	 * @param {Ext.Container} ct The container to check
	 * @return {Boolean} True if the parent of the given container has the CardLayout
	 * @private
	 */
	isParentCardLayout : function(ct)
	{
		return ct.ownerCt && ct.ownerCt.layout && ct.ownerCt.layout.type === 'card';
	},

	/**
	 * Bind a store to this loader. This will initialize all required event handlers.
	 * @param {Zarafa.plugins.files.data.FilesHierarchyStore} store The store to bind
	 * @param {Boolean} init True when this is called during initialization.
	 * @private
	 */
	bindStore : function(store, init)
	{
		if (init !== true && this.store === store) {
			return;
		}

		if (this.store) {
			this.store.un('load', this.onHierarchyLoad, this);
			this.store.un('remove', this.onHierarchyStoreRemove, this);
			this.store.un('addFolder', this.onHierarchyAddFolder, this);
			this.store.un('updateFolder', this.onHierarchyUpdateFolder, this);
			this.store.un('removeFolder', this.onHierarchyRemoveFolder, this);
		}

		this.store = store;
		if (this.store) {
			this.store.on({
				'load' : this.onHierarchyLoad,
				'remove' : this.onHierarchyStoreRemove,
				'addFolder' : this.onHierarchyAddFolder,
				'updateFolder' : this.onHierarchyUpdateFolder,
				'removeFolder' : this.onHierarchyRemoveFolder,
				'scope' : this
			});
		}
	},

	onHierarchyLoad: function(){
		var parentCt = this.deferredLoadingActiveParent;

		if (parentCt === parentCt.ownerCt.layout.activeItem) {
			this.doHierarchyLoad();
		} else {
			// We are going to defer to doHierarchyLoad() action,
			// set isDeferred to true, so we don't need to perform
			// update event handlers.
			this.isDeferred = true;
			this.deferredLoadingActiveParent.on('activate', this.doHierarchyLoad, this, { single : true });
		}
	},

	/**
	 * Called by {@link #onHierarchyLoad} to start (re)loading the hierarchy.
	 * @private
	 */
	doHierarchyLoad : function()
	{
		var rootNode = this.tree.getRootNode();

		if (this.fireEvent('beforeload', this, rootNode, this.directFn) !== false) {
			this.directFn(rootNode.id, this.doHierarchyLoadCallback.createDelegate(this));
		}

		// The deferred action has been completed,
		// we can now listen to update events again.
		this.isDeferred = false;
	},

	/**
	 * Callback function for {@link #directFn} as used by {@link #doHierarchyLoad}.
	 * @param {Object} data The data as returned by the server
	 * @param {Object} response The response as returned by the server
	 * @private
	 */
	doHierarchyLoadCallback : function(data, response)
	{
		var rootNode = this.tree.getRootNode();

		for (var i = 0, len = data.length; i < len; i++) {
			var item = data[i];
			var folder = item.folder;
			// Check if the node already exists or not.
			var treeNode = rootNode.findChildByEntryId(folder.get('id'));
			if (!treeNode) {
				var node = this.createNode(item);
				rootNode.appendChild(node);
			} else if (treeNode.attributes.folder !== folder) {
				treeNode.attributes.folder = folder;
				treeNode.reload();
			}
		}
		// when we close the shared store suggested contact folder
		// of shared store was removed but node was not removed from
		// contact context tree panel because we don't refresh/reload the tree panel
		// nodes when we switch the context so here we just reload the root node.
		if(rootNode.childNodes.length !== data.length) {
			rootNode.reload();
		}

		this.fireEvent('load', this, rootNode, response);
	},

	/**
	 *
	 */
	onHierarchyStoreRemove : function(){
		// TODO: Currently we reload the hierarchy store to remove the backend account from hierarchy
		//  rather to do so we can simple remove the backend account from hierarchy.
		console.log(" onHierarchyStoreRemove called");
	},

	/**
	 *
	 * @param store
	 * @param mapiStore
	 * @param record
	 */
	onHierarchyAddFolder : function(store, mapiStore, record) {
		// A call to doHierarchyLoad is pending,
		// no need to execute this event handler.
		if (this.isDeferred === true) {
			return;
		}

		if (Array.isArray(record)) {
			for (var i = 0, len = record.length; i < len; i++) {
				this.onHierarchyAddFolder(store, mapiStore, record[i]);
			}
			return;
		}

		if (record.phantom !== true) {
			if (this.tree.nodeFilter(record)) {
				var treeNode = this.tree.getNodeById(record.get('id'));

				if (!treeNode) {
					var parentNode = this.getFilteredParentNode(record);
					var nodeType = 'filesfolder';

					if (!parentNode) {
						parentNode = this.tree.getRootNode();
						nodeType = 'filesrootfolder';
					}

					var newNode = this.createNode(Ext.apply({ nodeType : nodeType, folder: record }, this.nodeConfig));
					parentNode.loading = false;
					parentNode.appendChild(newNode);
					parentNode.expand(false, true);
				}
			}
		}
	},

	/**
	 *
	 * @param store
	 * @param mapiStore
	 * @param record
	 */
	onHierarchyUpdateFolder : function(store, mapiStore, record) {
		// A call to doHierarchyLoad is pending,
		// no need to execute this event handler.
		if (this.isDeferred === true) {
			return;
		}

		var treeNode = this.tree.getNodeById(record.get('entryid'));
		if (!treeNode) {
			// Don't add new node in hierarchy if its parent node is
			// not expanded yet. As Extjs follow the lazy rendering so when we expand the
			// parent node, tree automatically creates respective child nodes
			var parentNode = this.getFilteredParentNode(record);
			if (Ext.isDefined(parentNode) && (!parentNode || !parentNode.isExpanded())) {
				return;
			}
			// treeNode not found, so apparently the folder change might
			// have made this folder visible in the current hierarchy.
			// Let the 'addFolder' event handler handle this case.
			this.onHierarchyAddFolder(store, mapiStore, record);
		} else if(!record.isHomeFolder()) {
			treeNode.updateUI(record);
		}
	},

	/**
	 *
	 * @param store
	 * @param mapiStore
	 * @param record
	 */
	onHierarchyRemoveFolder : function(store, mapiStore, record) {
		// A call to doHierarchyLoad is pending,
		// no need to execute this event handler.
		if (this.isDeferred === true) {
			return;
		}

		var treeNode = this.tree.getNodeById(record.get('id'));
		if (treeNode) {
			treeNode.remove(true);
		}
	},

	/**
	 *
	 * @param folder
	 * @param base
	 * @return {boolean}
	 */
	getFilteredParentNode : function(folder, base)
	{
		var parentfolder = folder.getParentFolder();

		var node = false;

		if (parentfolder) {
			if (parentfolder === base) {
				node = base;
			} else if (this.tree.nodeFilter(parentfolder)) {
				node = this.tree.getNodeById(parentfolder.get('id'));
			}

			if (!node) {
				node = this.getFilteredParentNode(parentfolder);
			}
		}

		return node;
	},

	/**
	 * This is called when a node in the HierarchyTree is being expanded, this will read
	 * the {@link Zarafa.plugins.files.data.FilesFolderRecord FilesFolderRecord} to find the child nodes which
	 * are positioned below the expanded node. But if folder is not expanded already then trigger the
	 * {@link Zarafa.core.Actions#updatelist update list} request to fetch the child folder to selected folder.
	 *
	 * @param {String} node The ID of the node which is being expanded
	 * @param {Function} fn The function which must be called with the JSON data of
	 * the nodes below the provided node.
	 * @private
	 */
	directFn: function (node, fn) {
		var treeNode = this.tree.getNodeById(node);
		var data = [];

		if (treeNode.isRoot) {
			var stores = this.store.getRange();
			for (var i = 0, len = stores.length; i < len; i++) {
				var store = stores[i];
				var folder = store.getSubtreeFolder();
				if (folder) {
					if (this.tree.nodeFilter(folder)) {
						data.push(Ext.apply({ nodeType : 'filesrootfolder', folder: folder }, this.nodeConfig));
					}
				}
			}
		} else {
			data = this.getFilteredChildNodes(treeNode.getFolder(), 'filesfolder');
			if (Ext.isEmpty(data) && treeNode.isExpandable() && !treeNode.isExpanded()) {
				var folder = treeNode.getFolder();
				var store = folder.getStore();
				store.load({
					folder : folder,
					actionType : Zarafa.core.Actions['updatelist'],
					cancelPreviousRequest : false,
					add:true
				});
				return;
			}
		}
		fn(data, {status: true});
	},

	/**
	 * Obtain the list of nodes which are positioned below the given {@link Zarafa.plugins.files.data.FilesFolderRecord folder}
	 * also subfolder will be used for a recursive call to {@link #getFilteredChildNodes} to see if the sub-subfolders
	 * do match the filter.
	 *
	 * @param {Zarafa.plugins.files.data.FilesFolderRecord} folder The folder which is clicked
	 * @param {String} nodeType The nodeType which must be applied to each node
	 * @return {Object[]} The array of nodes which must be created as subfolders
	 * @private
	 */
	getFilteredChildNodes : function(folder, nodeType)
	{
		var subfolders = folder.getChildren();
		var nodes = [];

		for (var i = 0, len = subfolders.length; i < len; i++) {
			var subfolder = subfolders[i];
			if (this.tree.nodeFilter(subfolder)) {
				nodes.push(Ext.apply({ nodeType : nodeType, folder: subfolder }, this.nodeConfig));
			}
		}

		return nodes;
	},

	/**
	 * Add extra attributes for a new {@link Zarafa.hierarchy.ui.FolderNode folderNode} which is about
	 * to be created. This will check the {@link Zarafa.hierarchy.ui.FolderNode#folder folder} to
	 * see what properties must be set.
	 * @param {Object} attr The attributes which will be used to create the node
	 * @return {Zarafa.hierarchy.ui.FolderNode} The created node
	 */
	createNode : function(attr)
	{
		var folder = attr.folder;

		if (folder) {
			attr.extendedDisplayName = attr.nodeType === 'filesrootfolder';
		}

		attr.uiProvider = Zarafa.plugins.files.ui.FolderNodeUI;
		attr.leaf = !folder.get('has_subfolder');

		return Zarafa.plugins.files.data.NavigatorTreeLoader.superclass.createNode.apply(this, arguments);
	},

	/**
	 * Update the reload flag.
	 *
	 * @param reload
	 */
	setReload: function (reload) {
		this.reload = reload;
	},

	/**
	 * Destroys the TreeLoader
	 */
	destroy : function()
	{
		this.bindStore(null);
		Zarafa.plugins.files.data.NavigatorTreeLoader.superclass.destroy.apply(this, arguments);
	}
});