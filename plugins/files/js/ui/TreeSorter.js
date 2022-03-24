Ext.namespace('Zarafa.plugins.files.ui');

/**
 * @class Zarafa.plugins.files.ui.TreeSorter
 * @extends Ext.tree.TreeSorter
 *
 * Special sorting class for the {@link Zarafa.plugins.files.ui.dialogs.AttachFromFilesTreePanel AttachFromFilesTreePanel},
 * this enables special sorting of the folders and files in alphabetical order.
 */
Zarafa.plugins.files.ui.TreeSorter = Ext.extend(Ext.tree.TreeSorter, {
	/**
	 * @constructor
	 * @param {Ext.tree.Tree} tree The tree which this sorter is being applied on
	 * @param {Object} config Configuration object
	 */
	constructor : function(tree, config)
	{
		Zarafa.plugins.files.ui.TreeSorter.superclass.constructor.apply(this, arguments);

		this.sortFn = this.hierarchySort.createDelegate(this);
	},

	/**
	 * Special sorting function which applies special sorting when the folder and field
	 * shows in tree.
	 *
	 * @param {Ext.tree.Node} nodeOne The first node to be compared
	 * @param {Ext.tree.Node} nodeTwo The second node to be compared
	 * @private
	 */
	hierarchySort : function(nodeOne, nodeTwo)
	{
		var nodeOneAttributes = nodeOne.attributes;
		var nodeTwoAttributes = nodeTwo.attributes;

		var isNodeOneFolder = nodeOneAttributes.isFolder;
		var isNodeTwoFolder = nodeTwoAttributes.isFolder;

		// Both the nodes are folder.
		var bothFolders = isNodeOneFolder && isNodeTwoFolder;
		// Both the nodes are files.
		var bothNotFolders = !isNodeOneFolder && !isNodeTwoFolder;

		if(bothFolders || bothNotFolders) {
			var nodeOneText = nodeOneAttributes.text,
				nodeTwoText = nodeTwoAttributes.text;

			return nodeOneText.toUpperCase() < nodeTwoText.toUpperCase() ? -1 : 1;
		} else {
			// second node is folder but node one is not folder.
			var nodeTwoIsFolder = !isNodeOneFolder && isNodeTwoFolder;
			return nodeTwoIsFolder ? 1 : -1;
		}
	}
});
