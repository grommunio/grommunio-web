(function() {
	/*
	 * Fix the Ext.tree.TreeSorter, the doSort function is always deferred
	 * by ExtJs, but unfortunately it doesn't keep in mind that the node
	 * could have been destroyed before the function is being called...
	 */
	Ext.override(Ext.tree.TreeSorter, {
		doSort : function(node)
		{
			// Check if the node has children which
			// can be sorted.
			if (node.childNodes) {
				node.sort(this.sortFn);
			}
		}
	});
})();
