(function() {
	Ext.ToolTip.prototype.onRender = Ext.ToolTip.prototype.onRender.createSequence(function() {
		if (this.el) {
			this.el.set({ 'role': 'tooltip' });
		}
	});
})();
