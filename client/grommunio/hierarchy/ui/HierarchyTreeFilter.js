/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.hierarchy.ui');

/**
 * @class Grommunio.hierarchy.ui.HierarchyTreeFilter
 * @extends Grommunio.common.ui.TreeFilter
 *
 * Filter class for the Tree, this enables filtering of the tree nodes,
 * in which tree nodes are filtered according to the filter query.
 */
Grommunio.hierarchy.ui.HierarchyTreeFilter = Ext.extend(Grommunio.common.ui.TreeFilter, {
	/**
	 * @cfg {Number} revealMinChars Matches in collapsed branches are only revealed from
	 * this many typed characters on, a single letter would open most of the hierarchy.
	 */
	revealMinChars: 2,

	/**
	 * @cfg {Number} revealLimit The maximum number of matches in collapsed branches to reveal
	 */
	revealLimit: 100,

	/**
	 * The nodes which were expanded to reveal matches, keyed by node id.
	 * @property
	 * @type Object
	 */
	revealed: undefined,

	/**
	 * Expand the branches holding folders whose name matches.
	 * @param {RegExp} value The filter
	 * @param {String} source The text the filter was built from
	 * @private
	 */
	revealMatches: function(value, source)
	{
		this.collapseRevealed();
		if (String(source || '').length < this.revealMinChars || !Ext.isFunction(this.tree.findFolders)) {
			return;
		}

		var expanded = [];
		var folders = this.tree.findFolders(function(folder) {
			return value.test(folder.get('display_name'));
		}, this.revealLimit);

		Ext.each(folders, function(folder) {
			this.tree.revealFolder(folder, expanded);
		}, this);

		Ext.each(expanded, function(node) {
			this.revealed[node.id] = node;
		}, this);
	},

	/**
	 * @param {Ext.tree.TreeNode} node The node to check
	 * @return {Boolean} True when the node was only expanded to reveal a match
	 */
	isRevealed: function(node)
	{
		return !!(this.revealed && this.revealed[node.id]);
	},

	/**
	 * Collapse the nodes {@link #revealMatches} expanded, except the path to the selected folder.
	 * @private
	 */
	collapseRevealed: function()
	{
		var keep = {};
		var selected = this.tree.getSelectionModel().getSelectedNode();
		for (var node = selected && selected.parentNode; node; node = node.parentNode) {
			keep[node.id] = true;
		}

		var revealed = this.revealed || {};
		this.revealed = {};
		Ext.iterate(revealed, function(id) {
			// The loader may have replaced the node since, so look it up again
			var node = this.tree.getNodeById(id);
			if (node && !keep[id] && node.isExpanded()) {
				node.collapse(false, false);
			}
		}, this);
	},

	/**
	 * Clear the filter and collapse what it expanded.
	 */
	reset: function()
	{
		this.clear();
		this.collapseRevealed();
	},

    /**
     * Filter the data by a specific attribute.
     * @param {RegExp} value Regex which needs to test with the attribute value.
     * should start with a RegExp to test against the attribute.
     * @param {String} attr (optional) The attribute passed in your node's attributes collection. Defaults to "text".
     * @param {TreeNode} startNode (optional) The node to start the filter at.
     */
    filter : function(value, attr, startNode, source)
    {
        attr = attr || "text";
        if (value.exec) {
            this.revealMatches(value, source);
        }
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
