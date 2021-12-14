Ext.namespace('Zarafa.hierarchy.ui');

/**
 * @class Zarafa.hierarchy.ui.RootFolderNode
 * @extends Zarafa.hierarchy.ui.FolderNode
 *
 * This will register itself as 'rootfolder' nodetype in the {@link Ext.tree.TreePanel#nodeTypes} object.
 */
Zarafa.hierarchy.ui.RootFolderNode = Ext.extend(Zarafa.hierarchy.ui.FolderNode, {
	/*
	 * @constructor
	 * @param {Object} config configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		var containerCls = 'zarafa-tree-root-container';
		var nodeCls = 'zarafa-tree-root-node';

		// Format IPM subtree container differently
		if (config.folder) {
			if (config.folder.isIPMSubTree()) {
				containerCls += ' zarafa-tree-ipm-subtree-container';
			} else if (config.folder.isFavoritesRootFolder()) {
				containerCls += ' zarafa-tree-ipm-subtree-favorites-container';
			}
			nodeCls += ' zarafa-tree-ipm-subtree-node';
		}

		Ext.applyIf(config, {
			containerCls: containerCls,
			cls: nodeCls,
			allowDrag: false,
			draggable: false
		});

		Zarafa.hierarchy.ui.RootFolderNode.superclass.constructor.call(this, config);

		this.on('beforeclick', this.onBeforeClick, this);
	},

	/**
	 * Event handler which is fired when the user has clicked the foldernode, this event will
	 * be called just before the event handlers will run to allow the default action to be cancelled.
	 *
	 * When the folder is the {@link Zarafa.hierarchy.data.MAPIFolderRecord#isIPMSubtree subtree} of
	 * a non-{@link Zarafa.hierarchy.data.MAPIStoreRecord#isDefaultStore default} store or
	 * {@link Zarafa.hierarchy.data.MAPIFolderRecord#isFavoritesRootFolder FavoritesRootFolder} then click
	 * action will be cancelled. The reason is that by default there are no actions possible on
	 * a IPM_SUBTREE or Favorites(IPM_COMMON_VIEWS) folder.
	 *
	 * Another case for which we will allow the click action is if the folder has the 'is_unavailable'
	 * property set. This indicates that the folder is fake, and by allowing the user to interact
	 * with it, we can show an error to the user.
	 *
	 * @param {Zarafa.hierarchy.ui.RootFolderNode} node The node which is being clicked
	 * @private
	 */
	onBeforeClick: function(node)
	{
		var folder = node.getFolder();
		if (folder.isFavoritesRootFolder()) {
			return false;
		} else if (folder && folder.isIPMSubTree()) {
			return folder.getMAPIStore().isDefaultStore() || folder.get('is_unavailable') === true;
		}
	}
});

Ext.tree.TreePanel.nodeTypes.rootfolder = Zarafa.hierarchy.ui.RootFolderNode;
