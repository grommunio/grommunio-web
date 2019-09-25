/**
 * #dependsFile client/zarafa/common/ui/layout/SwitchBorderLayout.js
 */
Ext.namespace('Zarafa.common.ui.layout');

/**
 * @class Zarafa.common.ui.layout.SwitchBorderLayout.SwitchRegion
 * @extends Ext.layout.BorderLayout.Region
 *
 * Extension to the {@link Ext.layout.BorderLayout.Region} for usage
 * in the {@link Zarafa.common.ui.layout.SwitchBorderLayout}. This defines
 * a non-resizable area in the layout.
 */
Zarafa.common.ui.layout.SwitchBorderLayout.SwitchRegion = Ext.extend(Ext.layout.BorderLayout.Region, {
	/**
	 * True if the region is currently hidden. This is controlled
	 * by {@link #setVisible}. If not defined, then it will depend on the visibility of the
	 * {@link #panel}.
	 * @property
	 * @type Boolean
	 */
	hidden : undefined,

	/**
	 * The old {@link Ext.Component#getWidth width} or {@link Ext.Component#getHeight height}
	 * or the {@link #panel} when it was being {@link #setVisible hidden}. This value represents
	 * the height when the {@link #position} is 'north' or 'south', it will represent the
	 * width otherwise.
	 * @property
	 * @type Number
	 */
	oldSize : undefined,

	/**
	 * Enables the visibility of the region (not the {@link #panel}!).
	 * This will update the {@link #hidden} property. If the region is
	 * being hidden, then the {@link #oldSize} will be saved, when the
	 * region is shown again, the {@link #oldSize} will be restored to
	 * the {@link #panel}.
	 *
	 * @param {Boolean} visible False to mark the region as hidden
	 */
	setVisible : function(visible)
	{
		var oldHidden = this.hidden;

		this.hidden = visible === false;

		if (oldHidden !== this.hidden) {
			if (this.hidden) {
				if (this.position === 'north' || this.position === 'south') {
					this.oldSize = this.panel.getHeight();
				} else {
					this.oldSize = this.panel.getWidth();
				}
			} else {
				// Ensure the panel thinks he is in a different position
				this.panel.region = this.position;

				if (this.position === 'north' || this.position === 'south') {
					this.panel.setHeight(this.oldSize || this.panel.height);
				} else {
					this.panel.setWidth(this.oldSize || this.panel.width);
				}
			}
		}
	},

	/**
	 * Check if the region is currently {@link #hidden visible}. If the {@link #hidden} property
	 * is undefined, it will check the visibility of the {@link #panel}.
	 * @return {Boolean} True when the region is visible
	 */
	isVisible : function()
	{
		return Ext.isDefined(this.hidden) ? !this.hidden : !this.panel.hidden;
	},

	/**
	 * Obtain the desired size for the region, this will use {@link #restrictSize}
	 * to restrict the values to the allowed boundaries.
	 * @return {Object} size The size for the region
	 */
	getSize : function()
	{
		var size = Zarafa.common.ui.layout.SwitchBorderLayout.SwitchRegion.superclass.getSize.call(this);
		return this.restrictSize(size);
	},

	/**
	 * Restrict the given size object (as obtained by {@link #getSize}) to ensure that
	 * the {@link Ext.Component#minHeight}/{@ink Ext.Component#minWidth} is enforced.
	 * @param {Object} size The desired size
	 * @return {Object} The restricted size
	 * @private
	 */
	restrictSize : function(size)
	{
		var panel = this.panel;
		var center = this.layout.center.panel;
		var targetEl = this.targetEl;
		var splitEl = this.splitEl;

		if (this.position === 'north' || this.position === 'south') {
			// Check if the given height is larger then the target 
			if (size.height >= targetEl.getHeight()) {
				if (panel.height) {
					// If the panel was initially configured with an height,
					// assume that as the default height
					size.height = panel.height;
				} else {
					// Otherwise we check how much space is available to us
					// considering the minimum width of the center
					size.height = Math.min(panel.maxHeight || 0, targetEl.getHeight() - (center.minHeight || center.height));
				}

				// Take something off for the split element
				size.height -= splitEl.dom.offsetHeight;
			}
		} else {
			// Check if the given width is larger then the target 
			if (size.width >= targetEl.getWidth()) {
				if (panel.width) {
					// If the panel was initially configured with an width,
					// assume that as the default width
					size.width = panel.width;
				} else {
					// Otherwise we check how much space is available to us
					// considering the minimum height of the center
					size.width = Math.min(panel.maxWidth || 0, targetEl.getWidth() - (center.minWidth || center.width));
				}

				// Take something off for the split element
				size.width -= splitEl.dom.offsetWidth;
			}
		}

		return size;
	}
});
