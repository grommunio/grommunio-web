(function() {
	Ext.menu.CheckItem.prototype.onRender = Ext.menu.CheckItem.prototype.onRender.createSequence(function() {
		if (this.el) {
			var anchor = this.el.child('a');
			if (anchor) {
				// Use menuitemradio for grouped items, menuitemcheckbox for standalone
				anchor.set({
					'role': this.group ? 'menuitemradio' : 'menuitemcheckbox',
					'aria-checked': this.checked ? 'true' : 'false'
				});
			}
		}
	});

	var orig_setChecked = Ext.menu.CheckItem.prototype.setChecked;
	Ext.override(Ext.menu.CheckItem, {
		setChecked: function(state, suppressEvent) {
			orig_setChecked.apply(this, arguments);
			if (this.el) {
				var anchor = this.el.child('a');
				if (anchor) {
					anchor.set({ 'aria-checked': state ? 'true' : 'false' });
				}
			}
		}
	});
})();
