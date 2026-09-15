Ext.namespace('Grommunio.hierarchy.ui');

/**
 * @class Grommunio.hierarchy.ui.TreeEditor
 * @extends Ext.tree.TreeEditor
 * @xtype grommunio.foldertreeeditor
 *
 * Editor for editing nodes within {@link Grommunio.hierarchy.ui.Tree HierarchyTree}
 */
Grommunio.hierarchy.ui.TreeEditor = Ext.extend(Ext.tree.TreeEditor, {
	/**
	 * Used to lock editing on treenodes
	 */
	enableEdit: undefined,

	/**
	 * @constructor
	 * @param {Grommunio.hierarchy.ui.Tree} treeObj object of parent {@link Grommunio.hierarchy.ui.Tree HierarchyTree}
	 * which uses this {@link Grommunio.hierarchy.ui.TreeEditor TreeEditor}.
	 * @param {Object} fc config of {@link Ext.form.Field Field} which can be used for editing {@link Grommunio.hierarchy.ui.FolderNode FolderNode}.
	 * @param {Object} config Configuration object for {@link Ext.tree.TreeEditor TreeEditor}
	 */
	constructor: function(treeObj, fc, config) {
		fc = fc || {};
		config = config || {};

		fc = Ext.applyIf(fc, {
			ignoreNoChange: true
		});

		config = Ext.applyIf(config, {
			cancelOnEsc: true,
			completeOnEnter: true
		});

		Grommunio.hierarchy.ui.TreeEditor.superclass.constructor.call(this, treeObj, fc, config);

		// treeEditor event handlers
		this.on({
			'beforenodeclick': this.onBeforeNodeClick,
			'beforestartedit': this.onBeforeStartEdit,
			'canceledit': this.onEditCancel,
			'complete': this.onEditComplete,
			scope: this
		});

	},

	/**
	 * Fired before triggering click on treeNode.
	 * @return {Boolean} when true it does not enter edit mode on selection of node
	 * @private
	 */
	onBeforeNodeClick: function() {
		return true;
	},

	/**
	 * Fired before triggering edit on treeNode.
	 * @return {Boolean} false if editing should be stopped.
	 * @private
	 */
	onBeforeStartEdit: function() {
		// Editing? Only if its unlocked
		if (!this.enableEdit) {
			return false;
		}
	},

	/**
	 * Fired on cancel of editing treeNode
	 * @private
	 */
	onEditCancel: function() {
		// Put edit lock back ON.
		this.enableEdit = false;
	},

	/**
	 * Fired on completion of editing of treeNode
	 * @param {Ext.tree.TreeNode} treeNode node which is edited
	 * @param {String} newName new name of node
	 * @param {String} oldName old name of node
	 * @private
	 */
	onEditComplete: function(treeNode, newName, oldName) {
		this.enableEdit = false;

		var folder = treeNode.editNode.getFolder();

		folder.set('display_name', newName);
		folder.save();
	},

	/**
	 * Triggers node editing
	 * @param {Ext.tree.TreeNode} treeNode node to be edited
	 */
	startEditingNode: function(treeNode) {
		// Release edit lock
		this.enableEdit = true;
		this.triggerEdit(treeNode);
	}
});

Ext.reg('grommunio.foldertreeeditor', Grommunio.hierarchy.ui.TreeEditor);
