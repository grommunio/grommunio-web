Ext.namespace('Zarafa.hierarchy.ui');

/**
 * @class Zarafa.hierarchy.ui.HierarchyTreeFilter
 * @extends Zarafa.common.ui.TreeFilter
 *
 * Filter class for the Tree, this enables filtering of the tree nodes,
 * in which tree nodes are filtered according to the filter query.
 */
Zarafa.hierarchy.ui.HierarchyTreeFilter = Ext.extend(Zarafa.common.ui.TreeFilter, {

    /**
     * Filter the data by a specific attribute.
     * @param {RegExp} value Regex which needs to test with the attribute value.
     * should start with a RegExp to test against the attribute.
     * @param {String} attr (optional) The attribute passed in your node's attributes collection. Defaults to "text".
     * @param {TreeNode} startNode (optional) The node to start the filter at.
     */
    filter : function(value, attr, startNode)
    {   
        attr = attr || "text";
        var fn;
        
        // regex expression.
        if(value.exec) {
            fn = function(node) {
                var nodeValue;
                var folder = node.attributes.folder;
                
                if (!Ext.isDefined(folder) || (!folder.isFavoritesFolder() && node.attributes.nodeType !== 'rootfolder') || folder.isIPMSubTree() || folder.isFavoritesRootFolder()) {
                    nodeValue = node.attributes[attr];
                } else {
                    // Favorite folders and folders in contexts like Calendar, Contacts, Tasks, Notes are displayed with the owner name.
                    // So, include the owner name in the final value.
                    nodeValue = node.attributes[attr] + node.ui.folderOwnerNode.textContent;
                }
                return value.test(nodeValue);
            };
        } else {
            throw 'Illegal filter type, must be regex';
        }
        this.filterBy(fn, null, startNode);
	}
});