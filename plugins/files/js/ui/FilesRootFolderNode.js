/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.files.ui');

/**
 * @class Grommunio.plugins.files.ui.FilesRootFolderNode
 * @extends Grommunio.plugins.files.ui.FilesFolderNode
 *
 * This will register itself as 'rootfolder' nodetype in the {@link Ext.tree.TreePanel#nodeTypes} object.
 */
Grommunio.plugins.files.ui.FilesRootFolderNode = Ext.extend(Grommunio.plugins.files.ui.FilesFolderNode, {
	/*
	 * @constructor
	 * @param {Object} config configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		var containerCls = 'grommunio-tree-root-container';
		var nodeCls = 'grommunio-tree-root-node';

		config.folder.isSubTreeFolder();
		if (config.folder) {
			containerCls += ' grommunio-tree-ipm-subtree-container';
			nodeCls += ' grommunio-tree-ipm-subtree-node';
			config.id = config.folder.get('id');
		}

		Ext.applyIf(config, {
			containerCls : containerCls,
			cls : nodeCls,
			expanded: true,
			allowDrag : false,
			draggable : false
		});

		Grommunio.plugins.files.ui.FilesRootFolderNode.superclass.constructor.call(this, config);
	}
});

Ext.tree.TreePanel.nodeTypes.filesrootfolder = Grommunio.plugins.files.ui.FilesRootFolderNode;
