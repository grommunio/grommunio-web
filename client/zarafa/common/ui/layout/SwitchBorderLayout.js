Ext.namespace('Zarafa.common.ui.layout');

/**
 * @class Zarafa.common.ui.layout.SwitchBorderLayout
 * @extends Ext.layout.BorderLayout
 * 
 * Extension to the BorderLayout to support switching a panel between the "north" and "west" panel,
 * or between the "south" and "east" panel. The {@link #orientation} can be controlled by the {@link #setOrientation}
 * and passing it an {@link Zarafa.common.ui.layout.SwitchBorderLayout.Orientation orientation}.
 *
 * When applying this layout on a {@link Ext.Container}, only 2 items may exist in the {@link Ext.Container},
 * the 'center' {@link Ext.Component component} and one {@link Ext.Component} in either
 * 'north', 'west', 'south' or 'east'.
 *
 * When {@link Zarafa.common.ui.layout.SwitchBorderLayout.Orientation#OFF} is enabled, then only
 * the 'center' panel will be displayed full-sized. For the orientation
 * {@link Zarafa.common.ui.layout.SwitchBorderLayout.Orientation#HORIZONTAL} the panel located in
 * the 'north' will be moved to the 'west', or the panel in the 'south' will be moved to the 'east'
 * (Transformation depends on the {@link #switchMap}. For the orientation
 * {@link Zarafa.common.ui.layout.SwitchBorderLayout.Orientation#VERTICAL} the 'west' panel will be
 * moved to the 'north', or the 'east' panel will be moved to the 'south' (again this depends on the
 * {@link ##switchMap}.
 */
Zarafa.common.ui.layout.SwitchBorderLayout = Ext.extend(Ext.layout.BorderLayout, {
	/**
	 * The region of the non-centered {@link Ext.Component} for the horizontal orientation
	 * this can be either 'west' or 'east'.
	 * @property
	 * @type String
	 */
	horizontalRegion : undefined,

	/**
	 * The region of the non-centered {@link Ext.Component} for the vertical orientation
	 * this can be either 'north' or 'south'. This is determined based on the {@link #switchMap}.
	 * @property
	 * @type String
	 */
	verticalRegion : undefined,

	/**
	 * @cfg {Object} switchMap The switchMap on how {@link #horizontalRegion} and {@link #verticalRegion}
	 * relate to eachother. A vertical region always maps to a horizontal region, so 'north' can
	 * be mapped to 'east' or 'west' and 'west' can be mapped to 'north' and 'south'.
	 */
	switchMap : {
		'north' : 'west',
		'west' : 'north',
		'south' : 'east',
		'east' : 'south'
	},

	/**
	 * @cfg {Zarafa.common.ui.layout.SwitchBorderLayout.Orientation} orientation The currently active
	 * orientation mode.
	 */
	orientation : undefined,

	/**
	 * This will layout the entire container, if the component has not been rendered yet
	 * it will allocate the {@link Zarafa.common.ui.layout.SwitchBorderLayout.SwitchRegion Region}
	 * or {@link Zarafa.common.ui.layout.SwitchBorderLayout.SwitchSplitRegion SplitRegion} depending
	 * on the {@link #split} configuration option on the panel.
	 * @param {Ext.Container} ct The component which is being layed out
	 * @param {Ext.Element} target The target Element in which the layout occurs
	 * @private
	 */
	onLayout : function(ct, target)
	{
		if (!this.rendered) {
			var collapsed = [];
			var i, c, pos, items = ct.items.items, len = items.length;

			for(i = 0; i < len; i++) {
				c = items[i];
				pos = c.region;
				if(c.collapsed){
					collapsed.push(c);
				}
				c.collapsed = false;
				if(!c.rendered){
					c.render(target, i);
					c.getPositionEl().addClass('x-border-panel');
				}

				// Allocate the region
				this[pos] = pos != 'center' && c.split ?
					new Zarafa.common.ui.layout.SwitchBorderLayout.SwitchSplitRegion(this, c.initialConfig, pos) :
					new Zarafa.common.ui.layout.SwitchBorderLayout.SwitchRegion(this, c.initialConfig, pos);
				this[pos].render(target, c);

				// If this is not the center region, we can create
				// the alternative region to which we can switch later.
				if (pos != 'center') {
					var altPos = this.switchMap[pos];

					this[altPos] = this[pos].split ?
						new Zarafa.common.ui.layout.SwitchBorderLayout.SwitchSplitRegion(this, c.initialConfig, altPos) :
						new Zarafa.common.ui.layout.SwitchBorderLayout.SwitchRegion(this, c.initialConfig, altPos);
					this[altPos].render(target, c, true);

					// Update the region references
					if (pos === 'north' || pos === 'south') {
						this.horizontalRegion = altPos;
						this.verticalRegion = pos;
					} else {
						this.horizontalRegion = pos;
						this.verticalRegion = altPos;
					}
				}
			}
			this.rendered = true;

			// We just rendered everything, ensure
			// we apply the currently configured orientation
			var orientation = this.orientation;
			delete this.orientation;
			this.setOrientation(orientation);

			// setOrientation() will have called layout()
			// which arrives in onLayout() recursively.
			// so no need to continue further.
			return;

		}
		Zarafa.common.ui.layout.SwitchBorderLayout.superclass.onLayout.apply(this, arguments);
	},

	/**
	 * Toggle the currently active {@link Zarafa.common.ui.layout.SwitchBorderLayout.Orientation orientation}
	 * and {@link #layout} the {@link #container} again according to the new orientation.
	 * @param {Zarafa.common.ui.layout.SwitchBorderLayout.Orientation} orientation The new orientation which
	 * should be applied to the container.
	 */
	setOrientation : function(orientation)
	{
		if (this.orientation === orientation) {
			return;
		}
		this.orientation = orientation;

		// Don't continue if we are not yet rendered,
		// we must wait until the parent is being layed out
		// by Extjs for the first time.
		if (!this.rendered) {
			return;
		}

		var horizontalRegion = this[this.horizontalRegion];
		var verticalRegion = this[this.verticalRegion];

		switch (orientation) {
			case Zarafa.common.ui.layout.SwitchBorderLayout.Orientation.OFF:
				// Hide the seperators, as resizing is not
				// allowed when we are hiding the panel.
				if (horizontalRegion.split) {
					horizontalRegion.splitEl.setVisible(false);
				}
				if (verticalRegion.split) {
					verticalRegion.splitEl.setVisible(false);
				}

				// Mark both regions as invisible
				horizontalRegion.setVisible(false);
				verticalRegion.setVisible(false);

				// Simplest way to hide the panel while maintaining
				// its dimensions is to collapse the entire panel.
				// Don't use animations as that will upset or size
				// calculations later.
				horizontalRegion.panel.collapse(false);
				break;
			case Zarafa.common.ui.layout.SwitchBorderLayout.Orientation.HORIZONTAL:
			/* falls through */
			default:
				// In case our previous orientation was 'OFF'
				// we must expand the panel (Again don't use animations
				// to prevent problems with size calculations).
				verticalRegion.panel.expand(false);

				// The horizontal region is visible
				horizontalRegion.setVisible(true);
				verticalRegion.setVisible(false);

				// Only show the horizontal seperator
				if (horizontalRegion.split) {
					horizontalRegion.splitEl.setVisible(true);
				}
				if (verticalRegion.split) {
					verticalRegion.splitEl.setVisible(false);
				}
				break;
			case Zarafa.common.ui.layout.SwitchBorderLayout.Orientation.VERTICAL:
				// In case our previous orientation was 'OFF'
				// we must expand the panel (Again don't use animations
				// to prevent problems with size calculations).
				horizontalRegion.panel.expand(false);

				// The vertical region is visible
				horizontalRegion.setVisible(false);
				verticalRegion.setVisible(true);

				// Only show the vertical seperator
				if (horizontalRegion.split) {
					horizontalRegion.splitEl.setVisible(false);
				}
				if (verticalRegion.split) {
					verticalRegion.splitEl.setVisible(true);
				}
				break;
		}

		// Call the doLayout on the container,
		// this enforced all child elements
		// to be layed out as well.
		this.container.doLayout();
	}
});

Ext.Container.LAYOUTS['zarafa.switchborder'] = Zarafa.common.ui.layout.SwitchBorderLayout;
