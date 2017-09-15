Ext.namespace('Zarafa.hierarchy.dialogs');

/**
 * @class Zarafa.hierarchy.dialogs.FolderSelectionPanel
 * @extends Ext.Panel
 * @xtype zarafa.folderselectionpanel
 */
Zarafa.hierarchy.dialogs.FolderSelectionPanel = Ext.extend(Ext.Panel, {
	/**
	 * @cfg {Boolean} hideTodoList True to hide the To-do list.
	 */
	hideTodoList : false,

	/**
	 * @cfg {Zarafa.hierarchy.data.MAPIFolderRecord} folder The Folder object
	 * which is selected by default.
	 */
	folder : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			layout : 'fit',
			border: false,
			items: [{
				xtype : 'zarafa.hierarchytree',
				ref : 'hierarchyTree',
				border: true,
				forceLayout : true,
				treeSorter : true,
				hideTodoList: !!config.hideTodoList,
			}]
		});

		Zarafa.hierarchy.dialogs.FolderSelectionPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Initialize the events
	 * @private
	 */
	initEvents : function()
	{
		Zarafa.hierarchy.dialogs.FolderSelectionPanel.superclass.initEvents.apply(this, arguments);

		if (this.folder) {
			this.mon(this.hierarchyTree, 'load', this.onTreeNodeLoad, this);
		}
	},

	/**
	 * Fired when the {@link Zarafa.hierarchy.ui.Tree Tree} fires the {@link Zarafa.hierarchy.ui.Tree#load load}
	 * event. This function will try to select the {@link Ext.tree.TreeNode TreeNode} in
	 * {@link Zarafa.hierarchy.ui.Tree Tree} intially. When the given node is not loaded yet, it will try again
	 * later when the event is fired again.
	 *
	 * @private
	 */
	onTreeNodeLoad : function()
	{
		// If the folder could be selected, then unregister the event handler.
		if (this.hierarchyTree.selectFolderInTree(this.folder)) {
			this.mun(this.hierarchyTree, 'load', this.onTreeNodeLoad, this);
		}
	},

	/**
	 * Obtain the currently selected {@link Zarafa.hierarchy.data.MAPIFolderRecord folder}
	 * @return {Zarafa.hierarchy.data.MAPIFolderRecord} The selected folder
	 */
	getFolder : function()
	{
		return this.hierarchyTree.getSelectionModel().getSelectedNode().getFolder();
	}
});

Ext.reg('zarafa.folderselectionpanel', Zarafa.hierarchy.dialogs.FolderSelectionPanel);
