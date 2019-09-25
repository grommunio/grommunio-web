Ext.namespace('Zarafa.core.plugins');

/**
 * @class Zarafa.core.plugins.ContentTabLayerPlugin
 * @extends Zarafa.core.plugins.ContentLayerPlugin
 * @ptype zarafa.contenttablayerplugin
 *
 * Implementation of the {@link Zarafa.core.plugins.ContentLayerPlugin ConentLayerPlugin}
 * which supports placing the {@link Zarafa.core.ui.ContentPanel Content Panel} inside a Tab
 */
Zarafa.core.plugins.ContentTabLayerPlugin = Ext.extend(Zarafa.core.plugins.ContentLayerPlugin, {
	/**
	 * This will bring focus to the Container by bringing it to the attention
	 * of the user by {@link Zarafa.core.ui.ContextContainer#setActiveTab activating the tab}
	 *
	 * @protected
	 */
	focus : function()
	{
		container.getTabPanel().setActiveTab(this.field);
	}
});

Ext.preg('zarafa.contenttablayerplugin', Zarafa.core.plugins.ContentTabLayerPlugin);
