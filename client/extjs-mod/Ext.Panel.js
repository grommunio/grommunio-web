(function() {
	var orig_onCollapse = Ext.Panel.prototype.onCollapse;
	var orig_onExpand = Ext.Panel.prototype.onExpand;

	Ext.override(Ext.Panel, {
		/**
		 * Override onCollapse to set aria-expanded="false" on the panel element.
		 */
		onCollapse: function(doAnim, animArg) {
			orig_onCollapse.apply(this, arguments);
			if (this.el) {
				this.el.set({ 'aria-expanded': 'false' });
			}
		},

		/**
		 * Override onExpand to set aria-expanded="true" on the panel element.
		 */
		onExpand: function(doAnim, animArg) {
			orig_onExpand.apply(this, arguments);
			if (this.el) {
				this.el.set({ 'aria-expanded': 'true' });
			}
		}
	});
})();
