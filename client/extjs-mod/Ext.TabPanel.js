(function() {
	var orig_onRender = Ext.TabPanel.prototype.onRender;
	var orig_setActiveTab = Ext.TabPanel.prototype.setActiveTab;

	Ext.override(Ext.TabPanel, {
		/**
		 * Override onRender to add ARIA tablist/tab roles after the tab strip is built.
		 */
		onRender: function() {
			orig_onRender.apply(this, arguments);

			// Set role="tablist" on the tab strip <ul>
			if (this.strip) {
				this.strip.set({ 'role': 'tablist' });
			}

			// Set role="tab" on each tab strip <li> (except the edge spacer)
			this.applyTabRoles();
		},

		/**
		 * Override setActiveTab to update aria-selected on tab changes.
		 */
		setActiveTab: function(item) {
			orig_setActiveTab.apply(this, arguments);
			this.updateAriaSelected();
		},

		/**
		 * Apply role="tab" to all tab <li> elements in the strip.
		 * @private
		 */
		applyTabRoles: function() {
			if (!this.strip) {
				return;
			}
			var tabs = this.strip.query('li');
			for (var i = 0; i < tabs.length; i++) {
				var li = Ext.get(tabs[i]);
				if (li && !li.hasClass('x-tab-edge')) {
					li.set({ 'role': 'tab' });
				}
			}
			this.updateAriaSelected();
		},

		/**
		 * Update aria-selected on all tab <li> elements based on active state.
		 * @private
		 */
		updateAriaSelected: function() {
			if (!this.strip) {
				return;
			}
			var tabs = this.strip.query('li');
			for (var i = 0; i < tabs.length; i++) {
				var li = Ext.get(tabs[i]);
				if (li && !li.hasClass('x-tab-edge')) {
					li.set({ 'aria-selected': li.hasClass('x-tab-strip-active') ? 'true' : 'false' });
				}
			}
		}
	});

	// Also update tab roles when new tabs are added
	var orig_initTab = Ext.TabPanel.prototype.initTab;
	Ext.override(Ext.TabPanel, {
		initTab: function(item, index) {
			orig_initTab.apply(this, arguments);
			// Re-apply roles after a new tab is initialized (if already rendered)
			if (this.rendered) {
				this.applyTabRoles();
			}
		}
	});
})();
