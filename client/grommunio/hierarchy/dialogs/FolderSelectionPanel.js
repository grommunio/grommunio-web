/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.hierarchy.dialogs');

/**
 * @class Grommunio.hierarchy.dialogs.FolderSelectionPanel
 * @extends Ext.Panel
 * @xtype grommunio.folderselectionpanel
 */
Grommunio.hierarchy.dialogs.FolderSelectionPanel = Ext.extend(Ext.Panel, {
	/**
	 * @cfg {Boolean} hideTodoList True to hide the To-do list.
	 */
	hideTodoList: false,

	/**
	 * @cfg {Grommunio.hierarchy.data.MAPIFolderRecord} folder The Folder object
	 * which is selected by default.
	 */
	folder: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			layout: 'fit',
			border: false,
			items: [{
				xtype: 'grommunio.hierarchytree',
				ref: 'hierarchyTree',
				IPMSubTreeFilter: config.IPMSubTreeFilter,
				IPMFilter: config.IPMFilter ? config.IPMFilter : undefined,
				permissionFilter: config.permissionFilter ? config.permissionFilter : undefined,
				border: true,
				hideFavorites: true,
				forceLayout: true,
				treeSorter: true,
				hideTodoList: !!config.hideTodoList
			}]
		});

		Grommunio.hierarchy.dialogs.FolderSelectionPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Initialize the events
	 * @private
	 */
	initEvents: function()
	{
		Grommunio.hierarchy.dialogs.FolderSelectionPanel.superclass.initEvents.apply(this, arguments);

		if (this.folder) {
			this.mon(this.hierarchyTree, 'load', this.onTreeNodeLoad, this);
		}
	},

	/**
	 * Fired when the {@link Grommunio.hierarchy.ui.Tree Tree} fires the {@link Grommunio.hierarchy.ui.Tree#load load}
	 * event. This function will try to select the {@link Ext.tree.TreeNode TreeNode} in
	 * {@link Grommunio.hierarchy.ui.Tree Tree} initially. When the given node is not loaded yet, it will try again
	 * later when the event is fired again.
	 *
	 * @private
	 */
	onTreeNodeLoad: function()
	{
		// If the folder could be selected, then unregister the event handler.
		if (this.hierarchyTree.selectFolderInTree(this.folder)) {
			this.mun(this.hierarchyTree, 'load', this.onTreeNodeLoad, this);
		}
	},

	/**
	 * Obtain the currently selected {@link Grommunio.hierarchy.data.MAPIFolderRecord folder}
	 * @return {Grommunio.hierarchy.data.MAPIFolderRecord} The selected folder
	 */
	getFolder: function()
	{
		return this.hierarchyTree.getSelectionModel().getSelectedNode().getFolder();
	}
});

Ext.reg('grommunio.folderselectionpanel', Grommunio.hierarchy.dialogs.FolderSelectionPanel);
