(function() {
	/*
	 * Fix the Ext.tree.TreeEditor, the fitToTree and bindScroll are called with a small delay,
	 * and unfortunately ExtJs doesn't care that objects can be destroyed while
	 * a function which expects that object is deferred.
	 */
	var orig_bindScroll = Ext.tree.TreeEditor.prototype.bindScroll;
	var orig_fitToTree = Ext.tree.TreeEditor.prototype.fitToTree;

	Ext.override(Ext.tree.TreeEditor, {
		fitToTree : function()
		{
			if (this.tree && this.tree.isDestroyed !== true) {
				orig_fitToTree.apply(this, arguments);
			}
		},

		bindScroll : function()
		{
			if (this.tree && this.tree.isDestroyed !== true) {
				orig_bindScroll.apply(this, arguments);
			}
		}
	});
})();
