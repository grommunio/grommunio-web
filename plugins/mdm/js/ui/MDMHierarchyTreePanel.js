Ext.namespace('Zarafa.plugins.mdm.ui');

/**
 * @class Zarafa.plugins.mdm.ui.MDMHierarchyTreePanel
 * @extends Zarafa.hierarchy.ui.Tree
 * @xtype mdm.hierarchytree
 *
 * MDMHierarchyTreePanel for hierarchy list in the
 * {@link Zarafa.plugins.mdm.dialogs.MDMManageSharedFolderPanel manageSharedFolderPanel}.
 */
Zarafa.plugins.mdm.ui.MDMHierarchyTreePanel = Ext.extend(Zarafa.hierarchy.ui.Tree, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		Zarafa.plugins.mdm.ui.MDMHierarchyTreePanel.superclass.constructor.call(this, config);
	},

	/**
	 * Function will initialize {@link Zarafa.hierarchy.ui.Tree Tree} and creates a
	 * {@link Zarafa.common.ui.LoadMask} if {@link Zarafa.hierarchy.ui.Tree Tree} is instantiated as full tree.
	 * @protected
	 */
	initComponent : function()
	{
		// Initialize the loader
		if (!this.loader) {
			this.loader = new Zarafa.plugins.mdm.data.MDMHierarchyTreeLoader({
				tree : this,
				store : this.store,
				nodeConfig : this.nodeConfig,
				deferredLoading : this.deferredLoading
			});
		}

		// call parent
		Zarafa.plugins.mdm.ui.MDMHierarchyTreePanel.superclass.initComponent.apply(this, arguments);
	},

	/**
	 * The filter which is applied for filtering nodes from the
	 * {@link Zarafa.hierarchy.ui.Tree HierarchyTree}.
	 * It will hide own user store.
	 *
	 * @param {Object} folder the folder to filter
	 * @return {Boolean} true to accept the folder
	 */
	nodeFilter: function (folder)
	{
		var hide = Zarafa.plugins.mdm.ui.MDMHierarchyTreePanel.superclass.nodeFilter.apply(this, arguments);

		if(hide && this.hideOwnTree) {
			hide = !folder.getMAPIStore().isDefaultStore();
		}

		return hide;
	}
});

Ext.reg('mdm.hierarchytree', Zarafa.plugins.mdm.ui.MDMHierarchyTreePanel);
