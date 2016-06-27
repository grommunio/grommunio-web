Ext.namespace('Zarafa.hierarchy.ui');

/**
 * @class Zarafa.hierarchy.ui.RootFolderNode
 * @extends Zarafa.hierarchy.ui.FolderNode
 * 
 * This will register itself as 'rootfolder' nodetype in the {@link Ext.tree.TreePanel#nodeTypes} object. 
 */
Zarafa.hierarchy.ui.RootFolderNode = Ext.extend(Zarafa.hierarchy.ui.FolderNode, {
	/**
	 * @cfg {Boolean} extendedDisplayName True if the display name of the folder must
	 * be extended with the ownership details of the store in which the folder is located.
	 * See {@link #getTextFromFolder}.
	 */
	extendedDisplayName : false,
	
	/*
	 * @constructor
	 * @param {Object} config configuration object
	 */
	constructor : function(config)
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
			containerCls : containerCls,
			cls : nodeCls,
			allowDrag : false,
			draggable : false
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
	onBeforeClick : function(node)
	{
		var folder = node.getFolder();
		if (folder.isFavoritesRootFolder()) {
			return false;
		} else if (folder && folder.isIPMSubTree()) {
			return folder.getMAPIStore().isDefaultStore() || folder.get('is_unavailable') === true;
		}
	},

	/**
	 * Obtain the Display Name for the current {@link #folder}. When {@link #extendedDisplayName} is enabled,
	 * and this folder is either a {@link Zarafa.hierarchy.data.MAPIStoreRecord#isPublicStore Public Store} or
	 * {@link Zarafa.hierarchy.data.MAPIStoreRecord#isSharedStore Shared Store} then the display name will
	 * be postixed with the ownername of the store to whom the folder belongs.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder for which the display name is requested
	 * @return {String} The name of the folder which must be shown.
	 * @protected
	 */
	getTextFromFolder : function(folder)
	{
		// For Subtree Folders which are located in the non-filtered hierarchy tree,
		// the display name from the PHP is valid to be shown. However for filtered
		// trees, we need to format the text for shared and public stores to ensure
		// the user can see from which store a particular folder comes from.
		if (this.attributes.extendedDisplayName) {
			return folder.getFullyQualifiedDisplayName();
		} else {
			return Zarafa.hierarchy.ui.RootFolderNode.superclass.getTextFromFolder.call(this, folder);
		}
	}
});

Ext.tree.TreePanel.nodeTypes.rootfolder = Zarafa.hierarchy.ui.RootFolderNode;
