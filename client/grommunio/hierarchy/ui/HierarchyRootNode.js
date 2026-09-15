Ext.namespace('Grommunio.hierarchy.ui');

/**
 * @class Grommunio.hierarchy.ui.HierarchyRootNode
 * @extends Ext.tree.AsyncTreeNode
 *
 * Utility TreeNode which is the root node for the entire hierarchy,
 * which by default is invisible. The direct childnodes for this nodes
 * are the opened stores.
 */
Grommunio.hierarchy.ui.HierarchyRootNode = Ext.extend(Ext.tree.AsyncTreeNode, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			text: 'root',
			leaf: false,
			expanded: true,
			uiProvider: Ext.tree.RootTreeNodeUI
		});

		Grommunio.hierarchy.ui.HierarchyRootNode.superclass.constructor.call(this, config);
	},

	/**
	 * Finds a TreeNode which represents the given EntryId
	 * @param {String} entryid The Entryid to find
	 * @return {Grommunio.hierarchy.ui.RootFolderNode} The found node
	 */
	findChildByEntryId: function(entryid)
	{
		return this.findChildBy(function(node) {
			return Grommunio.core.EntryId.compareEntryIds(node.attributes.folder.get('entryid'), entryid);
		});
	},

	/**
	 * Find a store treenode by the given Entryid
	 * @param {String} entryid The Store Entryid to find
	 * @return {Grommunio.hierarchy.ui.RootFolderNode} The found store node
	 */
	findChildStoreByEntryId: function(entryid)
	{
		return this.findChildBy(function(node) {
			return Grommunio.core.EntryId.compareStoreEntryIds(node.attributes.folder.get('store_entryid'), entryid);
		});
	}
});
