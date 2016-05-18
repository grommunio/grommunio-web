Ext.namespace('Zarafa.settings.ui');

/**
 * @class Zarafa.settings.ui.SettingsTreeNodeUI
 * @extends Ext.ux.tree.TreeGridNodeUI
 *
 * Extension of the default {@link Ext.ux.tree.TreeGridNodeUI} class,
 * to add some helper functionality for editing the settings value.
 */
Zarafa.settings.ui.SettingsTreeNodeUI = Ext.extend(Ext.ux.tree.TreeGridNodeUI, {
	/**
	 * The {@link Ext.Element} which contains the text (or setting name).
	 * @property
	 * @type Ext.Element
	 */
	textNode : undefined,

	/**
	 * The {@link Ext.Element} which contains the value (or setting value).
	 * @property
	 * @type Ext.Element
	 */
	valueNode : undefined,

	/**
	 * Main renderer for the different elements within the node
	 * @private
	 */
	renderElements : function()
	{
		Zarafa.settings.ui.SettingsTreeNodeUI.superclass.renderElements.apply(this, arguments);

		this.valueNode = this.elNode.childNodes[1].childNodes[0];
	},

	/**
	 * Change the value inside the {@link #valueNode}.
	 * @param {Zarafa.settings.ui.SettingsTreeNode} node The node which was changed
	 * @param {Mixed} value The new value which must be applied to the node
	 * @param {Mixed} oldValue The old value which was previously on the node
	 */
	onValueChange : function(node, value, oldValue)
	{
		if (this.rendered) {
			this.valueNode.innerHTML = Ext.util.Format.htmlEncode(value);
		}
	}
});
