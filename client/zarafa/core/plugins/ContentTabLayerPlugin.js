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
	focus: function()
	{
		container.getTabPanel().setActiveTab(this.field);

		// Also move keyboard focus into the panel so its keymap works immediately
		// (e.g. Ctrl+Alt+W to close) without requiring a click.
		if (Ext.isFunction(this.field.focus)) {
			if (this.field.rendered) {
				this.field.focus();
			}
			else {
				this.field.on('afterrender', this.field.focus, this.field, { single: true });
			}
		}
	}
});

Ext.preg('zarafa.contenttablayerplugin', Zarafa.core.plugins.ContentTabLayerPlugin);
