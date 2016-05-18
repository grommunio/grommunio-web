Ext.namespace('Zarafa.settings.ui');

/**
 * @class Zarafa.settings.ui.SettingsTreeNode
 * @extends Ext.tree.AsyncTreeNode
 *
 * Special treeNode to be used in the {@link Zarafa.settings.ui.SettingsTreePanel SettingsTree}.
 */
Zarafa.settings.ui.SettingsTreeNode = Ext.extend(Ext.tree.AsyncTreeNode, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		this.addEvents(
			/**
			 * @event valuechange
			 * Fires when the value for a node is changed
			 * @param {Node} node The node
			 * @param {Mixed} value the value
			 * @param {Mixed} oldValue The old value
			 */
			'valuechange'
		);

		Zarafa.settings.ui.SettingsTreeNode.superclass.constructor.call(this, config);
	},

	/**
	 * Enable the editor for this Treenode
	 */
	startEdit : function()
	{
		this.ownerTree.startEdit(this, 1);
	},

	/**
	 * @return {Boolean} True if this node can be edited
	 */
	isEditable : function()
	{
		return this.leaf && !Ext.isArray(this.attributes.value);
	},

	/**
	 * Sets the value for this node
	 * @param {Mixed} value
	 */
	setValue : function(value)
	{
		var oldValue = this.attributes['value'];
		this.attributes['value'] = value;
		if (this.rendered) {
			this.ui.onValueChange(this, value, oldValue);
		}
		this.fireEvent('valuechange', this, value, oldValue);
	}
});

Ext.tree.TreePanel.nodeTypes.setting = Zarafa.settings.ui.SettingsTreeNode;
