(function() {
	var orig_addComponentToMenu = Ext.layout.boxOverflow.Menu.prototype.addComponentToMenu;
	Ext.override(Ext.layout.boxOverflow.Menu, {
		/*
		 * Fix that hidden items inside a buttongroup will be rendered into the
		 * overflow menu. This happens because only the top components in the
		 * toolbar will be marked with 'xtbHidden' which indicates that the 'hidden'
		 * state should be ignored because the toolbar has hidden the item.
		 * However the items below are added regardless of their 'hidden' status.
		 * This fix will not only check for xtbHidden, but also for the normal
		 * 'hidden' flag before deciding to render the item into the menu. 
		 */
		addComponentToMenu : function(menu, component)
		{
			if (component.xtbHidden === true || component.hidden !== true) {
				orig_addComponentToMenu.apply(this, arguments);
			}
		}
	});
})();
