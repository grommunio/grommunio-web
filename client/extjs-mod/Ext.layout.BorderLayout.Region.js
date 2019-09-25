(function() {
	/*
	 * Fix the BorderLayout#Region class, whenever the region is collapsed, we should
	 * hide the split element in such a way it will not be considered by the browser
	 * for sizing/positioning. By default the BorderLayout#region would apply "visibility: none" 
	 * to the style of the CSS element. However due to a bug in Extjs the splitEl would have
	 * a greater height then the MainViewPort element. As a result the entire WebApp could be
	 * scrolled up partially out of the view of the user. This occurred primarily when using
	 * debugging tools...
	 */
	var orig_beforeCollapse = Ext.layout.BorderLayout.Region.prototype.beforeCollapse;
	var orig_onExpand = Ext.layout.BorderLayout.Region.prototype.onExpand;
	Ext.override(Ext.layout.BorderLayout.Region, {
		// Instead of only applying "visibility: none" to the splitEl,
		// we apply the x-hide-display CSS class to prevent that the element
		// still occupies space during rendering.
		beforeCollapse : function()
		{
			if (this.splitEl) {
				this.splitEl.addClass('x-hide-display');
			}
			orig_beforeCollapse.apply(this, arguments);
		},

		// Remove the x-hide-display CSS class again.
		onExpand : function()
		{
			if (this.splitEl) {
				this.splitEl.removeClass('x-hide-display');
			}
			orig_onExpand.apply(this, arguments);
		}
	});
})();
