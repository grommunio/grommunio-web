Ext.namespace('Zarafa.plugins.files.ui');

/**
 * @class Zarafa.plugins.files.ui.FilesRootFolderNode
 * @extends Zarafa.plugins.files.ui.FilesFolderNode
 *
 * This will register itself as 'rootfolder' nodetype in the {@link Ext.tree.TreePanel#nodeTypes} object.
 */
Zarafa.plugins.files.ui.FilesRootFolderNode = Ext.extend(Zarafa.plugins.files.ui.FilesFolderNode, {
	/*
	 * @constructor
	 * @param {Object} config configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		var containerCls = 'zarafa-tree-root-container';
		var nodeCls = 'zarafa-tree-root-node';

		config.folder.isSubTreeFolder();
		if (config.folder) {
			containerCls += ' zarafa-tree-ipm-subtree-container';
			nodeCls += ' zarafa-tree-ipm-subtree-node';
			config.id = config.folder.get('id');
		}

		Ext.applyIf(config, {
			containerCls : containerCls,
			cls : nodeCls,
			expanded: true,
			allowDrag : false,
			draggable : false
		});

		Zarafa.plugins.files.ui.FilesRootFolderNode.superclass.constructor.call(this, config);
	}
});

Ext.tree.TreePanel.nodeTypes.filesrootfolder = Zarafa.plugins.files.ui.FilesRootFolderNode;
