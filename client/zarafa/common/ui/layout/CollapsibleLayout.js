Ext.namespace('Zarafa.common.ui.layout');

/**
 * @class Zarafa.common.ui.layout.CollapsibleLayout
 * @extends Ext.layout.FitLayout
 *
 * Special layout which functions when 2 {@link Ext.Container containers} are used,
 * in which the first container is collapsible, and the second container must be resized
 * automatically based on the remaining size available in the parent container.
 *
 * The container which is {@link Ext.Panel#collapsible} will be saved in the {@link #activeItem}
 * field, while the other {@link Ext.Panel} will be saved in the {@link #resizeItem}. No more then
 * 2 different {@link Ext.Panel panels} are supported by this layout.
 */
Zarafa.common.ui.layout.CollapsibleLayout = Ext.extend(Ext.layout.FitLayout, {
	/**
	 * The non-collapsible {@link Ext.Panel} which is being handled by this layout.
	 * @property
	 * @type Ext.Panel
	 */
	resizeItem : undefined,

	/**
	 * Apply event listeners for the {@link Ext.Panel#collapse} and {@link Ext.panel#expand} events
	 * when this component is {@link Ext.Panel#collapsible}.
	 * @param {Ext.Component} c The component being configured
	 * @private
	 */
	configureItem: function(c)
	{
		var position = this.container.items.indexOf(c);
		if (position < 2) {
			if (c.collapsible) {
				this.activeItem = c;
				c.on('collapse', this.onCollapseState, this);
				c.on('expand', this.onCollapseState, this);
			} else {
				this.resizeItem = c;
			}
		}

		Zarafa.common.ui.layout.CollapsibleLayout.superclass.configureItem.call(this, c, position);
	},

	/**
	 * Remove all registered event listeners from {@link #configureItem}.
	 * @param {Ext.Component} c The component being removed
	 * @private
	 */
	onRemove: function(c)
	{
		if (c.collapsible) {
			c.un('collapse', this.onCollapseState, this);
			c.un('expand', this.onCollapseState, this);
		}

		if (c === this.activeItem) {
			delete this.activeItem;
		}

		if (c === this.resizeItem) {
			delete this.resizeItem;
		}

		Zarafa.common.ui.layout.CollapsibleLayout.superclass.onRemove.call(this, c);
	},

	/**
	 * Called whenever the {@link #activeItem} has expanded or collapsed or when calculating
	 * the initial height for the component. This will adjust the size of the {@link #resizeItem}
	 * to make sure it will fit inside the height offered by the {@link #contaner}.
	 * @private
	 */
	doResizeItem : function()
	{
		if (this.resizeItem && this.activeItem) {
			var totalHeight = this.container.getInnerHeight ? this.container.getInnerHeight() : this.container.getHeight();
			var activeHeight = this.activeItem.getHeight();
			this.resizeItem.setHeight(totalHeight - activeHeight);
		}
	},

	/**
	 * Event handler which is fired when a component has been {@link Ext.Panel#collapse collapsed}
	 * or {@link Ext.Panel#expand expanded}. This will check if below the panel, another panel is
	 * located which can be resized accordingly.
	 *
	 * @param {Ext.Panel} c The panel which is expanded or collapsed
	 * @private
	 */
	onCollapseState : function(c)
	{
		this.doResizeItem();
	},

	/**
	 * Called when the container is being layed out. This will first use the {@link Ext.layout.Fitlayout FitLayout}
	 * to resize the {@link #activeItem}, and based on the size the activeItem takes in, we can resize the
	 * {@link #resizeitem} to fill the remaining space.
	 *
	 * @param {Ext.Container} ct The container which is being layed out
	 * @param {Ext.Element} target The target element which is being layed out
	 * @private
	 */
	onLayout : function(ct, target)
	{
		Zarafa.common.ui.layout.CollapsibleLayout.superclass.onLayout.call(this, ct, target);
		this.doResizeItem();
	}
});

Ext.Container.LAYOUTS['zarafa.collapsible'] = Zarafa.common.ui.layout.CollapsibleLayout;
