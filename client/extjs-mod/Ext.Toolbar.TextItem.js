(function() {
	/**
	 * Override Ext.Toolbar.TextItem to make the text unselectable.
	 */
	var orig_onRender = Ext.Toolbar.TextItem.prototype.onRender;
	Ext.override(Ext.Toolbar.TextItem, {

		onRender : function(ct, position)
		{
			orig_onRender.apply(this, arguments);

			if (this.el) {
				this.el.unselectable();
			}
		}

	});
})();
