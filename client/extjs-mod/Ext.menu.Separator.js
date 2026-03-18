(function() {
	Ext.menu.Separator.prototype.onRender = Ext.menu.Separator.prototype.onRender.createSequence(function() {
		if (this.el) {
			this.el.set({ 'role': 'separator' });
		}
	});
})();
