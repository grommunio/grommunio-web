Ext.namespace('Grommunio.plugins.mdm.ui');

/**
 * @class Grommunio.plugins.mdm.ui.MDMHierarchyTreePanel
 * @extends Grommunio.hierarchy.ui.Tree
 * @xtype mdm.hierarchytree
 *
 * MDMHierarchyTreePanel for hierarchy list in the
 * {@link Grommunio.plugins.mdm.dialogs.MDMManageSharedFolderPanel manageSharedFolderPanel}.
 */
Grommunio.plugins.mdm.ui.MDMHierarchyTreePanel = Ext.extend(Grommunio.hierarchy.ui.Tree, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		Grommunio.plugins.mdm.ui.MDMHierarchyTreePanel.superclass.constructor.call(this, config);
	},

	/**
	 * Function will initialize {@link Grommunio.hierarchy.ui.Tree Tree} and creates a
	 * {@link Grommunio.common.ui.LoadMask} if {@link Grommunio.hierarchy.ui.Tree Tree} is instantiated as full tree.
	 * @protected
	 */
	initComponent : function()
	{
		// Initialize the loader
		if (!this.loader) {
			this.loader = new Grommunio.plugins.mdm.data.MDMHierarchyTreeLoader({
				tree : this,
				store : this.store,
				nodeConfig : this.nodeConfig,
				deferredLoading : this.deferredLoading
			});
		}

		// call parent
		Grommunio.plugins.mdm.ui.MDMHierarchyTreePanel.superclass.initComponent.apply(this, arguments);
	},

	/**
	 * The filter which is applied for filtering nodes from the
	 * {@link Grommunio.hierarchy.ui.Tree HierarchyTree}.
	 * It will hide own user store.
	 *
	 * @param {Object} folder the folder to filter
	 * @return {Boolean} true to accept the folder
	 */
	nodeFilter: function (folder)
	{
		var hide = Grommunio.plugins.mdm.ui.MDMHierarchyTreePanel.superclass.nodeFilter.apply(this, arguments);

		if(hide && this.hideOwnTree) {
			hide = !folder.getMAPIStore().isDefaultStore();
		}

		return hide;
	}
});

Ext.reg('mdm.hierarchytree', Grommunio.plugins.mdm.ui.MDMHierarchyTreePanel);
