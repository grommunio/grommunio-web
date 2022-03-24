Ext.namespace('Zarafa.plugins.files.ui');

/**
 * @class Zarafa.plugins.files.ui.FilesHierarchyRootNode
 * @extends Zarafa.hierarchy.ui.HierarchyRootNode
 *
 * Utility TreeNode which is the root node for the entire hierarchy,
 * which by default is invisible. The direct childnodes for this nodes
 * are the opened stores.
 */
Zarafa.plugins.files.ui.FilesHierarchyRootNode = Ext.extend(Zarafa.hierarchy.ui.HierarchyRootNode, {

	/**
	 * Finds a TreeNode which represents the given EntryId
	 * @param {String} entryid The Entryid to find
	 * @return {Zarafa.hierarchy.ui.RootFolderNode} The found node
	 */
	findChildByEntryId : function(id)
	{
		return this.findChildBy(function(node) {
			return Zarafa.core.EntryId.compareEntryIds(node.attributes.folder.get('id'), id);
		});
	},

	/**
	 * Find a store treenode by the given Entryid
	 * @param {String} entryid The Store Entryid to find
	 * @return {Zarafa.hierarchy.ui.RootFolderNode} The found store node
	 */
	findChildStoreByEntryId : function(id)
	{
		return this.findChildBy(function(node) {
			return Zarafa.core.EntryId.compareStoreEntryIds(node.attributes.folder.get('id'), id);
		});
	}
});
