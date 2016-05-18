/**
 * #dependsFile client/zarafa/common/ui/layout/SwitchBorderLayout.js
 * #dependsFile client/zarafa/common/ui/layout/SwitchBorderLayoutRegion.js
 */
Ext.namespace('Zarafa.common.ui.layout');

/**
 * @class Zarafa.common.ui.layout.SwitchBorderLayout.SwitchSplitRegion
 * @extends Ext.layout.BorderLayout.SplitRegion
 *
 * Extension to the {@link Ext.layout.BorderLayout.SplitRegion} for usage
 * in the {@link Zarafa.common.ui.layout.SwitchBorderLayout}. This defines
 * a resizable area in the layout
 */
Zarafa.common.ui.layout.SwitchBorderLayout.SwitchSplitRegion = Ext.extend(Ext.layout.BorderLayout.SplitRegion, {
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
	 * @constructor
	 * @param {Zarafa.common.ui.layout.SwitchBorderLayout} layout The parent layout
	 * @param {Object} config The configuration object to apply
	 * @param {String} pos The position string ('north', 'west', 'south', 'east') for which
	 * region to object is created
	 */
	constructor : function(layout, config, pos)
	{
		Zarafa.common.ui.layout.SwitchBorderLayout.SwitchSplitRegion.superclass.constructor.call(this, layout, config, pos);

		// Small fix, the region is taken of config which might have been
		// used for the alternate region. So fixup the region with the position
		this.region = pos;

		// applyLayout is selected from the 'splitSettings' property, so we can't really
		// extend it. Lets just prefix the function with our addition.
		this.applyLayout = this.applyLayout.createInterceptor(this.preApplyLayout, this);
	},

	/**
	 * Enables the visibility of the region (not the {@link #panel}!).
	 * This will update the {@link #hidden} property. If the region is
	 * being hidden, then the {@link #oldSize} will be saved, when the
	 * region is shown again, the {@link #oldSize} will be restored to
	 * the {@link #panel}.
	 *
	 * @param {Boolean} visible False to mark the region as hidden
	 */
	setVisible : Zarafa.common.ui.layout.SwitchBorderLayout.SwitchRegion.prototype.setVisible,

	/**
	 * Check if the region is currently {@link #hidden visible}. If the {@link #hidden} property
	 * is undefined, it will check the visibility of the {@link #panel}.
	 * @return {Boolean} True when the region is visible
	 */
	isVisible : Zarafa.common.ui.layout.SwitchBorderLayout.SwitchRegion.prototype.isVisible,

	/**
	 * Obtain the desired size for the region, this will use {@link #restrictSize}
	 * to restrict the values to the allowed boundaries.
	 * @return {Object} size The size for the region
	 */
	getSize : function() {
		var size = Zarafa.common.ui.layout.SwitchBorderLayout.SwitchSplitRegion.superclass.getSize.call(this);
		return this.restrictSize(size);
	},

	/**
	 * Restrict the given size object (as obtained by {@link #getSize}) to ensure that
	 * the {@link Ext.Component#minHeight}/{@ink Ext.Component#minWidth} is enforced.
	 * @param {Object} size The desired size
	 * @return {Object} The restricted size
	 * @private
	 */
	restrictSize : Zarafa.common.ui.layout.SwitchBorderLayout.SwitchRegion.prototype.restrictSize,

	/**
	 * Render the components for this region (e.g. the {@link #splitEl split element}.
	 * @param {Ext.Element} ct The parent container in which this region is added
	 * @param {Ext.Component} p The component which is handled by this region
	 * @param {Boolean} fakeId True if a fake ID should be used for creating the 
	 * {@link #splitEl split element},  normally the ID from the component ('p') will
	 * be used.
	 */
	render : function(ct, p, fakeId)
	{
		if (fakeId === true) {
			var oldId = p.id;
			p.id += '-switch';
			Zarafa.common.ui.layout.SwitchBorderLayout.SwitchSplitRegion.superclass.render.apply(this, arguments);
			p.id = oldId;
		} else {
			Zarafa.common.ui.layout.SwitchBorderLayout.SwitchSplitRegion.superclass.render.apply(this, arguments);
		}
	},

	/**
	 * {@Link Function#createInterceptor interceptor} for the {@link #applyLayout} function.
	 * This will {@link Ext.Element#setPositioning reposition} the {@link #splitEl split element}
	 * to ensure it will be visible by the user
	 * @param {Object} box The positioning information for the split element
	 * @private
	 */
	preApplyLayout : function(box)
	{
		this.splitEl.setPositioning({ left : box.x + 'px', top : box.y + box.height + 'px' });
	},

	/**
	 * Event handler which is fired when the {@link #split} element has been moved.
	 * This will recalculate the width of the {@link #panel} and fire a {@link Ext.Container#doLayout}.
	 * @param {Ext.SplitBar} split The splitbar which was moved
	 * @param {Number} newSize The new size which should be applied to the panel
	 * @private
	 */
	onSplitMove : function(split, newSize)
	{
		var s = this.panel.getSize();
		this.lastSplitSize = newSize;
		if(this.position == 'north' || this.position == 'south'){
			this.panel.setSize(s.width, newSize);
			this.state.height = newSize;
		}else{
			this.panel.setSize(newSize, s.height);
			this.state.width = newSize;
		}
		// Apply the doLayout on the container, this will
		// ensure that all subchildren will also be layed
		// out correctly again.
		this.layout.container.doLayout();
		this.panel.saveState();
		return false;
	}
});
