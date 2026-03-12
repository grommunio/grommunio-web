(function() {
	var orig_onBeforeLoad = Ext.LoadMask.prototype.onBeforeLoad;

	Ext.override(Ext.LoadMask, {
		/**
		 * Override onBeforeLoad to add aria-live attribute to the mask element
		 * so screen readers announce loading status changes.
		 */
		onBeforeLoad: function()
		{
			orig_onBeforeLoad.apply(this, arguments);
			// After the mask is shown, find the mask message element and add aria-live
			if (this.el) {
				var msgEl = this.el.child('.ext-el-mask-msg');
				if (msgEl) {
					msgEl.set({
						'role': 'status',
						'aria-live': 'polite'
					});
				}
			}
		}
	});
})();
