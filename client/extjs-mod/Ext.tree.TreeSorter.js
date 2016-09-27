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
				var activeElement = document.activeElement;
				node.sort(this.sortFn);
				// If the former active element still exist, give it the focus again.
				// Except when the active element is an iframe, because that could
				// cause strange behaviour in IE and EDGE. (i.e if the focus was
				// inside the tinymce editor, after focussing the iframe the SPACE and
				// ENTER keys would not work anymore)
				if ( activeElement  && activeElement.tagName!=='IFRAME' ){
					activeElement.focus();
				}
			}
		}
	});
})();
