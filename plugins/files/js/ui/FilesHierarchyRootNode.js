Ext.namespace('Grommunio.plugins.files.ui');

/**
 * @class Grommunio.plugins.files.ui.FilesHierarchyRootNode
 * @extends Grommunio.hierarchy.ui.HierarchyRootNode
 *
 * Utility TreeNode which is the root node for the entire hierarchy,
 * which by default is invisible. The direct childnodes for this nodes
 * are the opened stores.
 */
Grommunio.plugins.files.ui.FilesHierarchyRootNode = Ext.extend(Grommunio.hierarchy.ui.HierarchyRootNode, {

	/**
	 * Finds a TreeNode which represents the given EntryId
	 * @param {String} entryid The Entryid to find
	 * @return {Grommunio.hierarchy.ui.RootFolderNode} The found node
	 */
	findChildByEntryId : function(id)
	{
		return this.findChildBy(function(node) {
			return Grommunio.core.EntryId.compareEntryIds(node.attributes.folder.get('id'), id);
		});
	},

	/**
	 * Find a store treenode by the given Entryid
	 * @param {String} entryid The Store Entryid to find
	 * @return {Grommunio.hierarchy.ui.RootFolderNode} The found store node
	 */
	findChildStoreByEntryId : function(id)
	{
		return this.findChildBy(function(node) {
			return Grommunio.core.EntryId.compareStoreEntryIds(node.attributes.folder.get('id'), id);
		});
	}
});
