(function() {
	Ext.override(Ext.Toolbar, {
		/**
		 * @cfg {String} ariaLabel The ARIA label for this toolbar.
		 */
		ariaLabel: undefined,

		onRender: Ext.Toolbar.prototype.onRender.createSequence(function() {
			if (this.el) {
				this.el.set({ 'role': 'toolbar' });
				if (this.ariaLabel) {
					this.el.set({ 'aria-label': this.ariaLabel });
				}
			}
		})
	});
})();
