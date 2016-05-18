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
		}
	});
})();
