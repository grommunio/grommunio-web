(function() {
	/*
	 * Overridden to destroy the menu when it does not have an owner component.
	 */
	var orig_constructor = Ext.menu.Menu.prototype.constructor;

	Ext.override(Ext.menu.Menu, {
		constructor: function() {
			orig_constructor.apply(this, arguments);
			this.on('hide', this.onMenuHide, this);
		},

		/**
		 * Event handler for the load event of {@link Zarafa.core.data.IPMStore store}
		 * When we have {@link Ext.menu.Menu contextmenu} open and if we receive a new record
		 * then store and sub store of the selected records are not accessible anymore,so we have
		 * to get a new records by the entryid of the old records.
		 *
		 * @param {Zarafa.core.data.IPMStore} store This store
		 * @param {Zarafa.core.data.IPMRecord[]} records loaded record set
		 * @param {Object} options the options (parameters) with which the load was invoked.
		 * @private
		 */
		onLoad: function (store, records, options)
		{
			var newRecords = [];
			Ext.each(this.records, function (record) {
				record = store.getById(record.id);
				if(record) {
					newRecords.push(record);
				} else {
					// If the selected record is not in the store anymore then destroy context menu
					this.destroy();
				}
			}, this);

			this.records = newRecords;
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
		onMenuHide: function(menu)
		{
			// Check if the menu has an owner component (only context menu's don't have it)
			if (!Ext.isDefined(menu.ownerCt) && !Ext.isDefined(menu.parentMenu) && menu.autoDestroy) {
				menu.destroy();
			}
		}
	});
})();
