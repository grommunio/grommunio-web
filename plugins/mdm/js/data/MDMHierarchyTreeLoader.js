Ext.namespace('Zarafa.hierarchy.data');

/**
 * @class Zarafa.plugins.mdm.data.MDMHierarchyTreeLoader
 * @extends Zarafa.hierarchy.data.HierarchyTreeLoader
 *
 * A Special treeloader to be used by the {@link Zarafa.plugins.mdm.data.MDMHierarchyTreeLoader MDMHierarchyTree}.
 * This wil dynamically load the child nodes for a given node by obtaining the subfolders of
 * the folder related to the given node.
 */
Zarafa.plugins.mdm.data.MDMHierarchyTreeLoader = Ext.extend(Zarafa.hierarchy.data.HierarchyTreeLoader, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		Zarafa.plugins.mdm.data.MDMHierarchyTreeLoader.superclass.constructor.call(this, config);
	},

	/**
	 * Add extra attributes for a new {@link Zarafa.hierarchy.ui.FolderNode folderNode} which is about
	 * to be created. This will check the {@link Zarafa.hierarchy.ui.FolderNode#folder folder} to
	 * see what properties must be set.
	 *
	 * Override to provide (@link Zarafa.plugins.mdm.ui.MDMFolderNodeUI MDMFolderNodeUI} to ui provider
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

			attr.leaf = !folder.get('has_subfolder');
			attr.uiProvider = Zarafa.plugins.mdm.ui.MDMFolderNodeUI;
			attr.expanded = this.tree.isFolderOpened(folder);
			attr.allowDrag = !folder.isDefaultFolder();
		}

		// call parent of parent because of parent class will change ui provider
		return Zarafa.hierarchy.data.HierarchyTreeLoader.superclass.createNode.apply(this, arguments);
	}
});
