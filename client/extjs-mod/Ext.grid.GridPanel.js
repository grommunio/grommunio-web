(function() {
	var orig_onClick = Ext.grid.GridPanel.prototype.onClick;

	Ext.override(Ext.grid.GridPanel, {

		/**
		 * Override onRender to add ARIA grid role for accessibility.
		 */
		onRender: Ext.grid.GridPanel.prototype.onRender.createSequence(function() {
			if (this.el) {
				this.el.set({ 'role': 'grid' });
				var label = this.ariaLabel || this.title;
				if (label) {
					this.el.set({ 'aria-label': label });
				}
			}
		}),

		/*
		 * Override onClick to fix an issue that clicking on an
		 * already selected row will not put the focus on the grid itself. This
		 * prevents key-control to work properly on a grid.
		 */
		onClick: function(e)
		{
			orig_onClick.apply(this, arguments);

			// Don't change the focus when the user clicks on an input because
			// that would close a grid editor when one clicks on it
			var target = e.getTarget();
			if ( target.tagName !== 'INPUT' && target.className !== 'x-grid-group-title' && target.className !== 'x-grid-group-hd') {
				this.view.focusEl.focus();
			}
		},

		/*
		 * Override reconfigure to fix an issue that reconfiguring grid with
		 * new column model and store, was not re-initializing the state to get state settings
		 * for column model.
		 */
		reconfigure: function(store, colModel)
		{
			// initStateEvents registers 'hiddenchange' event on column model,
			// and we are going to change the column model, so we are here removing listener for hiddenchange event
			// and this will be again registered by initStateEvents for new column model
			if(this.stateful !== false && colModel !== this.colModel) {
				this.mun(this.colModel, 'hiddenchange', this.saveState, this);
			}

			var rendered = this.rendered;
			if(rendered) {
				if(this.loadMask) {
					this.loadMask.destroy();
					this.loadMask = new Ext.LoadMask(this.bwrap,
							Ext.apply({}, {store:store}, this.initialConfig.loadMask));
				}
			}

			if(this.view) {
				this.view.initData(store, colModel);
			}

			this.store = store;
			this.colModel = colModel;

			// we have reconfigured column model, so re-apply state settings
			// that will change column order in column model
			if(this.stateful !== false) {
				this.initStateEvents();
				this.initState();
			}

			if(rendered) {
				this.view.refresh(true);
			}

			this.fireEvent('reconfigure', this, store, colModel);
		}
	});
})();
