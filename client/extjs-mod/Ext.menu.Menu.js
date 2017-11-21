(function() {
	/*
	 * Overridden to destroy the menu when it does not have an owner component.
	 */
	var orig_constructor = Ext.menu.Menu.prototype.constructor;

	Ext.override(Ext.menu.Menu, {
		constructor : function() {
			orig_constructor.apply(this, arguments);
			this.on('hide', this.onMenuHide, this);
		},

		/**
		 * Event handler for the {@link #hide} event. It will destroy the menu when it does not have an owner component.
		 * Since the UIFactory creates a new menu on each contextclick, we must make sure the menu's are also destroyed
		 * again when they are hidden, or else we will pollute the dom with abandoned menus.
		 * Child menus will be destroyed when their parent is destroyed.
		 *
		 * @param {Ext.menu.Menu} menu The menu which is being hidden.
		 * @private
		 */
		onMenuHide : function(menu)
		{
			// Check if the menu has an owner component (only context menu's don't have it)
			if (!Ext.isDefined(menu.ownerCt) && !Ext.isDefined(menu.parentMenu) && menu.autoDestroy) {
				menu.destroy();
			}
		}
	});
})();
