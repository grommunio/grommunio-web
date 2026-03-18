(function() {
	var orig_afterRender = Ext.ProgressBar.prototype.afterRender;
	var orig_updateProgress = Ext.ProgressBar.prototype.updateProgress;

	Ext.override(Ext.ProgressBar, {
		/**
		 * Override afterRender to add ARIA progressbar role and attributes.
		 */
		afterRender: function() {
			orig_afterRender.apply(this, arguments);

			if (this.el) {
				this.el.set({
					'role': 'progressbar',
					'aria-valuemin': '0',
					'aria-valuemax': '100',
					'aria-valuenow': '0'
				});
				if (this.text) {
					this.el.set({ 'aria-valuetext': this.text });
				}
			}
		},

		/**
		 * Override updateProgress to keep ARIA attributes in sync.
		 */
		updateProgress: function(value, text, animate) {
			var result = orig_updateProgress.apply(this, arguments);

			if (this.el) {
				var pct = Math.round((value || 0) * 100);
				this.el.set({ 'aria-valuenow': String(pct) });
				if (text) {
					this.el.set({ 'aria-valuetext': text });
				}
			}

			return result;
		}
	});
})();
