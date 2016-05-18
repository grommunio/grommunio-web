(function() {
 	var orig_doAutoWidth = Ext.Tip.prototype.doAutoWidth;

	Ext.override(Ext.Tip, {
		/*
		 * Fix an issue where IE9 & IE10 & IE11 breaks words and wraps it to new line
		 * because of wrong calculation of text width
		 * Maybe this is caused when we request an element's dimension via offsetWidth or offsetHeight, getBoundingClientRect, etc.
		 * the browser returns the subpixel width rounded to the nearest pixel.
		 */
		doAutoWidth : function()
		{
			orig_doAutoWidth.call(this, Ext.isIE ? 1 : 0);
		}
	});
})();