(function() {
	/*
	 * Fix the Ext.data.Node, when child nodes have been added or removed, the 'leaf'
	 * property must be updated. Otherwise the expand button will never be actually
	 * updated when adding or removing child nodes.
	 */
	var orig_appendChild = Ext.data.Node.prototype.appendChild;
	var orig_removeChild = Ext.data.Node.prototype.removeChild;

	Ext.override(Ext.data.Node, {
		appendChild : function(node)
		{
			this.leaf = false;
			return orig_appendChild.apply(this, arguments);
		},

		removeChild : function(node, destroy)
		{
			var ret = orig_removeChild.apply(this, arguments);
			if (!this.hasChildNodes()) {
				this.leaf = true;
			}
			return ret;
		}
	});
})();
