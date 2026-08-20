(function() {
	/*
	 * Keyboard navigation shares the submenu expansion with the mouse, which delays it
	 * by Ext.menu.Item#showDelay so submenus don't open while the pointer travels over
	 * the items. Pressing the right arrow key is explicit, expand without that delay.
	 */
	Ext.override(Ext.menu.MenuNav, {
		right: function(e, m)
		{
			var item = m.activeItem;
			if (!item || item.disabled || !item.menu) {
				return;
			}

			if (item.menu.isVisible()) {
				item.menu.tryActivate(0, 1);
				return;
			}

			clearTimeout(item.hideTimer);
			delete item.hideTimer;
			clearTimeout(item.showTimer);
			delete item.showTimer;

			item.deferExpand(true);
		}
	});
})();
