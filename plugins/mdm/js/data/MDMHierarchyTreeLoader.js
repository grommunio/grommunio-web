/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.hierarchy.data');

/**
 * @class Grommunio.plugins.mdm.data.MDMHierarchyTreeLoader
 * @extends Grommunio.hierarchy.data.HierarchyTreeLoader
 *
 * A Special treeloader to be used by the {@link Grommunio.plugins.mdm.data.MDMHierarchyTreeLoader MDMHierarchyTree}.
 * This will dynamically load the child nodes for a given node by obtaining the subfolders of
 * the folder related to the given node.
 */
Grommunio.plugins.mdm.data.MDMHierarchyTreeLoader = Ext.extend(Grommunio.hierarchy.data.HierarchyTreeLoader, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		Grommunio.plugins.mdm.data.MDMHierarchyTreeLoader.superclass.constructor.call(this, config);
	},

	/**
	 * Add extra attributes for a new {@link Grommunio.hierarchy.ui.FolderNode folderNode} which is about
	 * to be created. This will check the {@link Grommunio.hierarchy.ui.FolderNode#folder folder} to
	 * see what properties must be set.
	 *
	 * Override to provide (@link Grommunio.plugins.mdm.ui.MDMFolderNodeUI MDMFolderNodeUI} to ui provider
	 * @param {Object} attr The attributes which will be used to create the node
	 * @return {Grommunio.hierarchy.ui.FolderNode} The created node
	 */
	createNode : function(attr)
	{
		var folder = attr.folder;

		if (folder) {
			if (attr.nodeType === 'rootfolder') {
				attr.extendedDisplayName = this.tree.hasFilter();
			}

			attr.leaf = !folder.get('has_subfolder');
			attr.uiProvider = Grommunio.plugins.mdm.ui.MDMFolderNodeUI;
			attr.expanded = this.tree.isFolderOpened(folder);
			attr.allowDrag = !folder.isDefaultFolder();
		}

		// call parent of parent because of parent class will change ui provider
		return Grommunio.hierarchy.data.HierarchyTreeLoader.superclass.createNode.apply(this, arguments);
	}
});
