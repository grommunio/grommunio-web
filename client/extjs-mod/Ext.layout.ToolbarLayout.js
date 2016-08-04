(function() {
 	var orig_configureItem = Ext.layout.ToolbarLayout.prototype.configureItem;
 	var orig_hideItem = Ext.layout.ToolbarLayout.prototype.hideItem;
 	var orig_unhideItem = Ext.layout.ToolbarLayout.prototype.unhideItem;
	var orig_onLayout = Ext.layout.ToolbarLayout.prototype.onLayout;
	var orig_addComponentToMenu = Ext.layout.ToolbarLayout.prototype.addComponentToMenu;
	Ext.override(Ext.layout.ToolbarLayout, {
		// Fix the trigger width, Extjs defines it as 18 which only covers the '>>' button, but not
		// the padding for the trigger button itself.
		triggerWidth : 41,

		// The tabIndex that should be applied to the 'more' button when the toolbar overflows
		overflowTabIndex : undefined,

		/*
		 * Fix that the ToolbarLayout will go over all items in the container
		 * and check if those items contains layouts which need to be called as
		 * well. This ensures that the ToolbarLayout is capable of containing
		 * other Containers as well.
		 */
		onLayout : function(ct, target) 
		{
			orig_onLayout.apply(this, arguments);
			ct.items.each(function(item) {
				if (Ext.isFunction(item.doLayout)) {
					item.doLayout();
				}
			}, this);

			if (this.overflowTabIndex && this.more) {
				Ext.get(this.more.el).child('button').set({ 'tabIndex' : this.overflowTabIndex });
			}
		},

		/*
		 * Override configureItem to hook the 'show' and 'hide'
		 * event handlers to the items. This allows us to peform
		 * a layout of the items when one of them is being hidden
		 * or shown (as this means we have to consider moving items
		 * into or out of the overflow menu).
		 */
		configureItem : function(item)
		{
			var ct = this.container;
			var target = ct.getLayoutTarget();

			orig_configureItem.apply(this, arguments);

			item.on('show', function(item) {
				if (item.xtbHidden !== true) {
					this.onLayout(ct, target);
				}
			}, this);

			item.on('hide', function(item) {
				if (item.xtbHidden !== true) {
					this.onLayout(ct, target);
				}
			}, this);
		},

		/*
		 * Override the hideItem function, when the item is placed in the overflow menu,
		 * we do want to remain in touch with the "show" and "hide" requests from the
		 * component itself. Because in those cases we want to ensure that the item
		 * is removed or added into the overflow menu.
		 */
		hideItem : function(item)
		{
			var layout = this;
			orig_hideItem.apply(this, arguments);

			// When showing a previously hidden item,
			// them we must update the xtbWidth to ensure that
			// the toolbar knows if the item must be removed
			// from the overflow menu or not.
			item.xtbOrigShow = item.show;
			item.show = function() {
				item.xtbOrigShow(true);
				item.xtbWidth = item.getPositionEl().dom.parentNode.offsetWidth;
				item.xtbOrigHide(false);
			}

			// When we are hiding an item in the overflow menu,
			// we must unhide it, and invoke the real hide function
			// to make it invisible.
			item.xtbOrigHide = item.hide;
			item.hide = function() {
				layout.unhideItem(item);
				item.hide();
			}
		},

		/*
		 * Override the unhideItem function to ensure we restore
		 * the "show" and "hide" function to the original implementation again.
		 */
		unhideItem : function(item)
		{
			item.show = item.xtbOrigShow;
			delete item.xtbOrigShow;

			item.hide = item.xtbOrigHide;
			delete item.xtbOrigHide;

			// Another bug from Extjs, the xtbWidth must be
			// removed when unhiding, as otherwise the layout
			// will still try to use it when the item must
			// be completely hidden.
			delete item.xtbWidth;

			orig_unhideItem.apply(this, arguments);
		},

		/*
		 * Fix that hidden items inside a buttongroup will be rendered into the
		 * overflow menu. This happens because only the top components in the
		 * toolbar will be marked with 'xtbHidden' which indicates that the 'hidden'
		 * state should be ignored because the toolbar has hidden the item.
		 * However the items below are added regardless of their 'hidden' status.
		 * This fix will not only check for xtbHidden, but also for the normal
		 * 'hidden' flag before deciding to render the item into the menu.
		 * And It will check if the toolbar item has menu and splitOnMoreMenu is set then extract all items of menu and
		 * add those items into more menu.
		 */
		addComponentToMenu : function(menu, component)
		{
			if (component.xtbHidden === true || component.hidden !== true) {

				// Check if component has menu then extract all items of menu and add into more menu
				if(Ext.isDefined(component.menu) && component.splitOnMoreMenu){
					var items = component.menu.items.items;
					Ext.each(items,function (item) {
						menu.add(this.createMenuConfig(item));
					},this);
				} else {
					orig_addComponentToMenu.apply(this, arguments);
				}
			}
		},

		/**
		 * Override initMore to replace {@link Ext.Button More button} with our own button
		 * @private
		 * Creates the expand trigger and menu, adding them to the <tr> at the extreme right of the
		 * Toolbar table
		 */
		initMore : function ()
		{
			if (!this.more) {
				/**
				 * @private
				 * @property moreMenu
				 * @type Ext.menu.Menu
				 * The expand menu - holds items for every Toolbar item that cannot be shown
				 * because the Toolbar is currently not wide enough.
				 */
				this.moreMenu = new Ext.menu.Menu({
					ownerCt : this.container,
					listeners: {
						beforeshow: this.beforeMoreShow,
						scope: this
					}
				});

				/**
				 * @private
				 * @property more
				 * @type Ext.Button
				 * The expand button which triggers the overflow menu to be shown
				 */
				this.more = new Ext.Button({
					iconCls: 'icon_more',
					ownerCt: this.container,
					tooltip: _('More options'),
					overflowText: _('More options'),
					listeners : {
						afterrender : this.afterMoreButtonRender,
						scope : this
					}
				});

				var td = this.insertCell(this.more, this.extrasTr, 100);
				this.more.render(td);
			}
		},

		/**
		 * Handler which is use to add menu in more button after the {@link Ext.Button} rendered
		 * @param button
         */
		afterMoreButtonRender : function (button)
		{
			// Ext will add down arrow button on render time if the button has menu
			// So, set the menu after the more button rendered successfully
			button.menu = this.moreMenu
		}
	});
})();
