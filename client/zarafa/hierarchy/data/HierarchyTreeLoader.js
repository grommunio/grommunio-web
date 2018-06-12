Ext.namespace('Zarafa.hierarchy.data');

/**
 * @class Zarafa.hierarchy.data.HierarchyTreeLoader
 * @extends Ext.tree.TreeLoader
 *
 * A Special treeloader to be used by the {@link Zarafa.hierarchy.ui.HierarchyTreePanel HierarchyTree}.
 * This wil dynamically load the child nodes for a given node by obtaining the subfolders of
 * the folder related to the given node.
 */
Zarafa.hierarchy.data.HierarchyTreeLoader = Ext.extend(Ext.tree.TreeLoader, {
	/**
	 * @cfg {Zarafa.hierarchy.ui.Tree} tree The tree on which this treeloader
	 * is applied.
	 */
	tree : undefined,

	/**
	 * @cfg {Zarafa.core.data.HierarchyStore} store store which will be used to get data for hierarchy.
	 */
	store : undefined,

	/**
	 * @cfg {Object} config option for {@link Zarafa.hierarchy.ui.FolderNode foldernode}
	 */
	nodeConfig : undefined,

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
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		if (!config.directFn) {
			// Small hack, ExtJs calls directFn in the DOMWindow scope, rather
			// then the scope of this class. Since we wish to extend the TreeLoader
			// rather then passing the directFn as a configuration option, we are now
			// just going to create a delegate and force the function into the correct
			// scope.
			config.directFn = this.directFn.createDelegate(this);
		}

		Zarafa.hierarchy.data.HierarchyTreeLoader.superclass.constructor.call(this, config);

		// If the tree is already rendered, call onTreeAfterRender directly,
		// otherwise add the event handler.
		if (this.tree.rendered) {
			this.onTreeAfterRender();
		} else {
			this.tree.on('afterrender', this.onTreeAfterRender, this, { single : true });
		}
	},

	/**
	 * Event handler which is fired when the {@link #tree} is being rendered. This will
	 * call {@link #bindStore} to hook all events from the {@link #store}.
	 * @private
	 */
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
	 * Bind a store to this loader. This will intialize all required event handlers.
	 * @param {Zarafa.core.data.HierarchyStore} store The store to bind
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

	/**
	 * Event handler for the {@link Zarafa.hierarcy.data.HierarchyStore#load load} event.
	 * This will add the loaded records into the tree as Store nodes. 
	 * @param {Ext.data.Store} store The store which fired the event
	 * @param {Ext.data.Record[]} records The records which were loaded into the store
	 * @param {Object} options The additional options that were passed for loading the data.
	 * @private
	 */
	onHierarchyLoad : function(store, records, options)
	{
		// If we don't want to append a new store into the tree,
		// then remove all currently existing nodes and rebuild
		// the entire tree from scratch.
		if (options.add !== true) {
			this.tree.getRootNode().removeAll(true);
		}

		var parentCt = this.deferredLoadingActiveParent;

		if (this.deferredLoading !== true || parentCt === parentCt.ownerCt.layout.activeItem) {
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
			var treeNode = rootNode.findChildByEntryId(folder.get('entryid'));
			if (!treeNode) {
				var node = this.createNode(item);
				rootNode.appendChild(node);
			} else if (treeNode.attributes.folder !== folder) {
				treeNode.attributes.folder = folder;
				treeNode.reload();
			} else if (folder.isFavoritesRootFolder()) {
                // Check if favorite node and favorite folder doesn't have same number of children
                // then reload the favorite node.
                var favoritesStore = folder.getMAPIStore().getFavoritesStore();
                if (treeNode.childNodes.length !== favoritesStore.getCount()) {
                    treeNode.reload();
                }
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
	 * Handles the 'remove' even from the {@link Zarafa.hierarchy.data.HierarchyStore hierarchyStore}.
	 * This will lookup any folder inside the tree which belongs to the given {@link Zarafa.hierarchy.data.MAPIStoreRecord},
	 * and removes it from the tree.
	 * @param {Zarafa.hierarchy.data.HierarchyStore} store The store which fired the event
	 * @param {Zarafa.core.data.IPFRecord} record The MAPIStoreRecord which was removed from the hierarchy
	 * @param {Number} index The index from where the store was removed
	 * @private
	 */
	onHierarchyStoreRemove : function(store, record)
	{
		// A call to doHierarchyLoad is pending,
		// no need to execute this event handler.
		if (this.isDeferred === true) {
			return;
		}

		var rootNode = this.tree.getRootNode();
		var treeNode = rootNode.findChildStoreByEntryId(record.get('store_entryid'));
		if (treeNode) {
			treeNode.remove(true);
			if (this.deferredLoading === true) {
				this.deferredLoadingActiveParent.on('activate', this.doHierarchyLoad, this, { single : true });
			}
		}
	},

	/**
	 * Handles the add event on folder from the global hierarchy object. This will add the folder to the tree.
	 *
	 * @param {Zarafa.hierarchy.data.HierarchyStore} store The store which fired the event
	 * @param {Zarafa.hierarchy.data.MAPIStoreRecord} mapiStore mapi store in which new folders are added.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord/Zarafa.hierarchy.data.MAPIFolderRecord[]} folder folders which are added in hierarchy.
	 * @private
	 */
	onHierarchyAddFolder : function(store, mapiStore, record)
	{
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
				var treeNode;
				// If record/folder is favorites mark and active context is other then Mail or Home and "show all folders"
				// check box is unchecked then don't add new tree node in hierarchy.
				if (record.isFavoritesFolder() && (record.isContainerClass('IPF.Note') || !this.tree.hasFilter())) {
					treeNode = this.tree.getNodeById("favorites-"+record.get('entryid'));
				} else {
					treeNode = this.tree.getNodeById(record.get('entryid'));
				}

				if (!treeNode) {
					var parentNode = this.getFilteredParentNode(record);
					var nodeType = 'folder';

					if (!parentNode) {
						parentNode = this.tree.getRootNode();
						nodeType = 'rootfolder';
					}

					var newNode = this.createNode(Ext.apply({ nodeType : nodeType, folder: record }, this.nodeConfig));
					parentNode.appendChild(newNode);
					parentNode.expand();
				}
			}
		}
	},

	/**
	 * Handles the update event on folder from the global hierarchy object. Updates folder in tree.
	 * @param {Zarafa.hierarchy.data.HierarchyStore} store The store which fired the event
	 * @param {Zarafa.hierarchy.data.MAPIStoreRecord} mapiStore mapi store in which folders are updated.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} record folders which are updated in hierarchy.
	 * @private
	 */
	onHierarchyUpdateFolder : function(store, mapiStore, record)
	{
		// A call to doHierarchyLoad is pending,
		// no need to execute this event handler.
		if (this.isDeferred === true) {
			return;
		}

		var treeNode = this.tree.getTreeNode(record);
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
		} else if (!this.tree.nodeFilter(record)) {
			// treeNode was found, but it doesn't pass our filter...
			// That means the update affected that the folder is no
			// longer visible in the tree...
			// Let the 'removeFolder' event handler handle this case.
			this.onHierarchyRemoveFolder(store, mapiStore, record);
		} else {
			var curParentNode = treeNode.parentNode;
			var newParentNode = this.getFilteredParentNode(record);
			if (!newParentNode) {
				newParentNode = this.tree.getRootNode();
			}

			if (curParentNode !== newParentNode) {
				// It doesn't matter if there is a parentNode or not,
				// when we do appendChild, the parentNode will detect
				// if this is a move or not.
				newParentNode.appendChild(treeNode);
			} else {
				treeNode.updateUI(record);
				// Update favorites folder tree node in hierarchy if selected folder is not favorites folder but
				// it exists in favorites store(record was marked as favorites).
				if(!record.isFavoriteFolder() && record.existsInFavorites()) {
					var favRecord = record.getFavoritesFolder();
					var favContentUnread = favRecord.get('content_unread');
					var recordContentUnread = record.get('content_unread');
					if( favContentUnread !== recordContentUnread) {
						favRecord.set('content_unread', recordContentUnread, false);
					}
					treeNode = this.tree.getTreeNode(favRecord);
					// treeNode is undefined in case where webapp was reloaded recently and
					// favorites tree was in collapsible mode. Extjs is follow the lazy rendering
					// so tree node was only created when tree is in expanded mode or user expand it.
					if (Ext.isDefined(treeNode)) {
						treeNode.updateUI(record);
					}
				}
			}
		}
	},

	/**
	 * Handles the delete event on folder from global hierarchy object. Deletes folder from tree.
	 * @param {Zarafa.hierarchy.data.HierarchyStore} store The store which fired the event
	 * @param {Zarafa.hierarchy.data.MAPIStoreRecord} mapiStore mapi store in which folders are removed.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder folders which are removed from hierarchy.
	 * @private
	 */
	onHierarchyRemoveFolder : function(store, mapiStore, record)
	{
		// A call to doHierarchyLoad is pending,
		// no need to execute this event handler.
		if (this.isDeferred === true) {
			return;
		}
		var treeNode = this.tree.getTreeNode(record);
		if (treeNode) {
			treeNode.remove(true);
		}

		if (record.existsInFavorites()) {
			treeNode = this.tree.getTreeNode(record.getFavoritesFolder());
			if (treeNode) {
				treeNode.remove(true);
			}
		}
	},

	/**
	 * This is called when a node in the HierarchyTree is being expanded, this will read
	 * the {@link Zarafa.hierarchy.data.MAPIFolderRecord} to find the child nodes which
	 * are positioned below the expanded node.
	 *
	 * @param {String} node The ID of the node which is being expanded
	 * @param {Function} fn The function which must be called with the JSON data of
	 * the nodes below the provided node.
	 * @private
	 */
	directFn : function(node, fn)
	{
		var treeNode = this.tree.getNodeById(node);
		var data = [];

		// The root can not be loaded through this function,
		// we only handle that through the 'load' event handler
		// onHierarchyLoad which will generate the special Store nodes.
		if (treeNode.isRoot) {
			var stores = this.store.getRange();
			for (var i = 0, len = stores.length; i < len; i++) {
				var store = stores[i];
				var folder = store.getSubtreeFolder();

				if (folder) {
					// The IPM_SUBTREE of a shared stores doesn't need to be shown when
					// a filter has been applied and the IPM_SUBTREE itself isn't a shared folder.
					// This could be the case when we only loaded the Inbox or Calendar of the
					// other store, but we didn't load the entire store itself. In that situation
					// the IPM_SUBTREE is really a fake entry which exists for displaying in
					// a non-filtered tree.
					var visibleRoot = !this.tree.hasFilter() || !store.isSharedStore() || folder.isSharedFolder();

					if (visibleRoot && this.tree.nodeFilter(folder)) {
						data.push(Ext.apply({ nodeType : 'rootfolder', folder: folder }, this.nodeConfig));
					} else {
						data = data.concat(this.getFilteredChildNodes(folder, 'rootfolder'));
					}
				}

				var favoritesFolder = store.getFavoritesRootFolder();
				if (store.isDefaultStore() && Ext.isDefined(favoritesFolder) && this.tree.nodeFilter(favoritesFolder)) {
					data.push(Ext.apply({ nodeType : 'rootfolder', folder: favoritesFolder }, this.nodeConfig));
				}
			}

			fn(data, {status: true});
		} else {
			// When we are not loading the root, we want to defer the loading
			// for 1 ms. This helps with large hierarchies where the JS would normally
			// try to load the entire tree in a single thread which might take so long
			// that the browser will kill it.
			/*eslint no-unused-vars: ["error", { "varsIgnorePattern": "defer" }]*/
			var defer = function(node, fn) {
				data = this.getFilteredChildNodes(treeNode.getFolder(), 'folder');
				fn(data, { status: true });
			}.defer(1, this, [node, fn]);
		}
	},

	/**
	 * Obtain the list of nodes which are positioned below the given {@link Zarafa.hierarchy.data.MAPIFolderRecord folder}.
	 * If a subfolder is {@link Zarafa.hierarchy.ui.Tree#nodeFilter filtered} the subfolder will not be added itself,
	 * but subfolder will be used for a recursive call to {@link #getFilteredChildNodes} to see if the sub-subfolders
	 * do match the filter.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder which is checked
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
			} else if (subfolder.get('has_subfolder')) {
				nodes = nodes.concat(this.getFilteredChildNodes(subfolder, nodeType));
			}
		}

		return nodes;
	},

	/**
	 * Obtain the parent node for the given {@link Zarafa.hierarchy.data.MAPIFolderRecord folder},
	 * normally only the node with an id which matches the 'parent_entryid' of the original
	 * folder would be sufficient, but when the tree is filtered, this might not be the case.
	 * Hence we start calling this function recursively until we find the first node in the chain
	 * which should act as parent or grandparent of the given folder.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder which is being checked
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} base The root folder for the search, if
	 * this folder is encountered as parent, this search ends.
	 * @return {Ext.tree.TreeNode} The parent node for the folder
	 * @private
	 */
	getFilteredParentNode : function(folder, base)
	{
		var parentfolder;
		if(folder.isFavoritesFolder()) {
			parentfolder = folder.getFavoritesRootFolder();
		} else {
			parentfolder = folder.getParentFolder();
		}

		var node = false;

		if (parentfolder) {
			if (parentfolder === base) {
				node = base;
			} else if (this.tree.nodeFilter(parentfolder)) {
				node = this.tree.getNodeById(parentfolder.get('entryid'));
			}

			if (!node) {
				node = this.getFilteredParentNode(parentfolder);
			}
		}

		return node;
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
		if (attr.nodeType === 'rootfolder') {
			attr.extendedDisplayName = this.tree.hasFilter();
		}

		// To uniquely identify the favorites tree nodes we append the "favorites-" key word with node id
		// when the node is created.
		attr.id = folder.isFavoritesFolder() ? "favorites-" + folder.get('entryid') : folder.get('entryid');
		if (folder.isFavoritesRootFolder()) {
			attr.leaf = folder.get('assoc_content_count') === 0;
		} else {
			attr.leaf = !folder.get('has_subfolder');
		}

		attr.uiProvider = Zarafa.hierarchy.ui.FolderNodeUI;
		attr.expanded = this.tree.isFolderOpened(folder);
		attr.allowDrag = !folder.isDefaultFolder() && !folder.isSearchFolder();
	}

		return Zarafa.hierarchy.data.HierarchyTreeLoader.superclass.createNode.apply(this, arguments);
	},

	/**
	 * Destroys the TreeLoader
	 */
	destroy : function()
	{
		this.bindStore(null);
		Zarafa.hierarchy.data.HierarchyTreeLoader.superclass.destroy.apply(this, arguments);
	}
});
