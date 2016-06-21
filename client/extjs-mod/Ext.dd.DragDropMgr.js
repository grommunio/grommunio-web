(function() {
	/**
	 * @class Ext.dd.DragDropMgr
	 * DragDropMgr is a singleton that tracks the element interaction for
	 * all DragDrop items in the window.  Generally, you will not call
	 * this class directly, but it does have helper methods that could
	 * be useful in your DragDrop implementations.
	 * @singleton
	 */
	var orig_getLocation = Ext.dd.DragDropMgr.getLocation;

	Ext.apply(Ext.dd.DragDropMgr, {

		/**
		 * Returns the DragDrop instance for a given id which belongs to
		 * the given group (as configured in the {@link Ext.dd.DragSource}.
		 * @method getGroupDDById
		 * @param {String} group the {@link Ext.dd.DragSource#ddGroup ddGroup}
		 * for which the id is searched for.
		 * @param {String} id the id of the DragDrop object
		 * @return {DragDrop} the drag drop object, null if it is not found
		 * @static
		 */
		getGroupDDById : function(group, id)
		{
			if (this.ids[group] && this.ids[group][id]) {
				return this.ids[group][id];
			}
			return null;
		},

		/**
		 * Returns a Region object containing the drag and drop element's position
		 * and size, including the padding configured for it
		 * @method getLocation
		 * @param {DragDrop} oDD the drag and drop object to get the
		 *                       location for
		 * @return {Ext.lib.Region} a Region object representing the total area
		 *                             the element occupies, including any padding
		 *                             the instance is configured for.
		 */
		getLocation : function(oDD)
		{
			var el = oDD.getEl();

			var region = orig_getLocation.apply(this, arguments);

			// below code is taken from previous version of extjs
			// to fix drag and drop between overlapping elements
			if(el && region) {
				/*
				 * The code below is to ensure that large scrolling elements will
				 * only have their visible area recognized as a drop target, otherwise it
				 * can potentially erronously register as a target when the element scrolls
				 * over the top of something below it.
				 */
				el = Ext.get(el.parentNode);
				while (el && region) {
					if (el.isScrollable()) {
						// check whether our element is visible in the view port:
						region = region.intersect(el.getRegion());
					}
					el = el.parent();
				}
			}

			return region;
		},

		/**
		 * @private
		 * Collects the z-index of the passed element, looking up the parentNode axis to find an absolutely positioned ancestor
		 * which is able to yield a z-index. If found to be not absolutely positionedm returns -1.
		 *
		 * This is used when sorting potential drop targets into z-index order so that only the topmost receives `over` and `drop` events.
		 *
		 * @return {Number} The z-index of the element, or of its topmost absolutely positioned ancestor. Returns -1 if the element is not
		 * absolutely positioned.
		 */
		getZIndex : function(element)
		{
			// to fix drag and drop between overlapping elements
			// we are removing use of this function as previous version of extjs was not having this function
			return -1;
		},

		/**
		 * Drag and drop initialization.Setting up the global event handlers on browser window
		 * @param {Object} browserWindowObject The newly created window object
         */
		initEvents : function(browserWindowObject)
		{
			// Initialize mouse event handlers which are use to handle drag and drop in separate browser window.
			Ext.EventManager.on(browserWindowObject.document, "mousemove", this.handleMouseMove, this, true);
			Ext.EventManager.on(browserWindowObject.document, "mouseup", this.handleMouseUp, this, true);
		},

		/**
		 * Checks the cursor location to see if it over the target
		 * @method isOverTarget
		 * @param {Ext.lib.Point} pt The point to evaluate
		 * @param {DragDrop} oTarget the DragDrop object we are inspecting
		 * @return {boolean} true if the mouse is over the target
		 * @private
		 */
		isOverTarget: function(pt, oTarget, intersect) {
			// use cache if available
			var loc = this.locationCache[oTarget.id];
			if (!loc || !this.useCache) {
				loc = this.getLocation(oTarget);
				this.locationCache[oTarget.id] = loc;

			}

			if (!loc) {
				return false;
			}

			oTarget.cursorIsOver = loc.contains( pt );

			// DragDrop is using this as a sanity check for the initial mousedown
			// in this case we are done.  In POINT mode, if the drag obj has no
			// contraints, we are also done. Otherwise we need to evaluate the
			// location of the target as related to the actual location of the
			// dragged element.
			var dc = this.dragCurrent;
			if (!dc || !dc.getTargetCoord || (!intersect && !dc.constrainX && !dc.constrainY)) {

				// verified is cursor is over the target by location and position.
				// But now we have multiple windows that's way it's require to check that
				// the target element is belongs to active window or not?

				if (oTarget.cursorIsOver) {
					var activeWindow = Zarafa.core.BrowserWindowMgr.getActive();
					var targetOwnerWindow = Zarafa.core.BrowserWindowMgr.getOwnerWindow(oTarget);
					return activeWindow === targetOwnerWindow;
				} else {
					return false
				}
			}

			oTarget.overlap = null;

			// Get the current location of the drag element, this is the
			// location of the mouse event less the delta that represents
			// where the original mousedown happened on the element.  We
			// need to consider constraints and ticks as well.
			var pos = dc.getTargetCoord(pt.x, pt.y);

			var el = dc.getDragEl();
			var curRegion = new Ext.lib.Region( pos.y,
					pos.x + el.offsetWidth,
					pos.y + el.offsetHeight,
					pos.x );

			var overlap = curRegion.intersect(loc);

			if (overlap) {
				oTarget.overlap = overlap;
				return (intersect) ? true : oTarget.cursorIsOver;
			} else {
				return false;
			}
		}
	});
})();
