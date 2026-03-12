(function() {
	var orig_onRender = Ext.ColorPalette.prototype.onRender;

	Ext.override(Ext.ColorPalette, {
		onRender: function() {
			orig_onRender.apply(this, arguments);
			if (this.el) {
				this.el.set({
					'role': 'listbox',
					'aria-label': _('Color palette')
				});
				var items = this.el.select('a');
				items.each(function(a) {
					a.set({
						'role': 'option',
						'aria-label': '#' + a.dom.className.match(/color-([A-Fa-f0-9]{6})/)[1]
					});
				});
			}
		}
	});

	// Add aria-selected tracking on select
	var orig_select = Ext.ColorPalette.prototype.select;
	Ext.override(Ext.ColorPalette, {
		select: function(color, suppressEvent) {
			// Remove aria-selected from previous
			if (this.value && this.el) {
				var prev = this.el.child('a.color-' + this.value);
				if (prev) {
					prev.dom.removeAttribute('aria-selected');
				}
			}
			orig_select.apply(this, arguments);
			// Add aria-selected to new
			if (this.el) {
				var curr = this.el.child('a.color-' + this.value);
				if (curr) {
					curr.set({ 'aria-selected': 'true' });
				}
			}
		}
	});
})();
