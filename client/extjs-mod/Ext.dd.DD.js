(function() {
	var orig_unreg = Ext.dd.DD.prototype.unreg;
	Ext.override(Ext.dd.DD, {
		/**
		 * When set to true, the utility automatically tries to scroll the browser
		 * window when a drag and drop element is dragged near the viewport boundary.
		 * Defaults to false. Overriden because in webapp we will never need to drag anything out of window.
		 * @property scroll
		 * @type boolean
		 */
		scroll : false,

		/**
		 * Remove all drag and drop hooks for this element,
		 * Override the method to de-register element which was destroyed with respect to its owner window.
		 * @method unreg
		 */
		unreg: function() {
			orig_unreg.apply(this, arguments);

			// Remove the element if it is being dragged currently from DragDropMgr as well
			if(this == this.DDM.dragCurrent) {
				this.DDM.dragCurrent = null;
			}
		}
	});
})();