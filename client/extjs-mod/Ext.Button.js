(function() {
 	var orig_onClick = Ext.Button.prototype.onClick;

	Ext.override(Ext.Button, {
		/*
		 * Fix issue that when the Button is pressed the focus is not moved
		 * away from the current input field. This is an issue which exists
		 * on some browsers (at least Firefox), while other browsers (Chrome)
		 * are safe.
		 */
		onClick: function(e)
		{
			// Copy the original event, during focus() and blur() the
			// 'e' will be changed to the input element that is being
			// blurred. Hence we create a copy which we will pass to
			// the original function.
			var origEvent = new Ext.EventObjectImpl(e);
			this.focus();

			orig_onClick.call(this, origEvent);

			// Ensure that we have remove the focus again to prevent
			// the button from remaining blurred. Note that the event
			// handler for the button might have destroyed the button
			// (e.g. the Ok or cancel button in a dialog which closes
			// the dialog).
			if (!this.isDestroyed) {
				this.blur();
			}
		},

		/* Override default ext.js template, which uses tables for buttons.
		 * This way buttons are easier to handle, and the code is much cleaner and leaner.
		 * The scheme is <div><div><em><button>
		 * The two containers are needed because Ext.JS applies various classes for icons, etc.
		 * The em element is used for applying the arrow of split buttons, and for making buttons unselectable.
		 */
		template:new Ext.Template(
			'<div id="{4}" class="x-btn {3}"><div class="{1}">',
			'<em class="{2}" class="x-unselectable" unselectable="on"><button type="{0}"></button></em>',
			'</div></div>'),

		/**
		 * Override onRender to add ARIA attributes to buttons.
		 * Icon-only buttons get aria-label from tooltip text.
		 * All buttons get proper role attributes.
		 */
		onRender: Ext.Button.prototype.onRender.createSequence(function() {
			var btnEl = this.el;
			if (!btnEl) {
				return;
			}

			// Add aria-label: prefer explicit ariaLabel config, then derive from tooltip for icon-only buttons
			if (this.ariaLabel) {
				btnEl.set({ 'aria-label': this.ariaLabel });
			} else if (!this.text && this.iconCls) {
				var label = this.tooltip || this.iconCls.replace(/^icon[_-]/, '').replace(/[_-]/g, ' ');
				if (Ext.isObject(label)) {
					label = label.title || label.text || '';
				}
				if (label) {
					btnEl.set({ 'aria-label': label });
				}
			}

			// Mark disabled buttons
			if (this.disabled) {
				btnEl.set({ 'aria-disabled': 'true' });
			}

			// Mark buttons that have dropdown menus
			if (this.menu) {
				btnEl.set({ 'aria-haspopup': 'true', 'aria-expanded': 'false' });
			}
		}),

		/**
		 * Override setDisabled to update aria-disabled attribute.
		 */
		setDisabled: Ext.Button.prototype.setDisabled.createSequence(function(disabled) {
			if (this.el) {
				this.el.set({ 'aria-disabled': disabled ? 'true' : 'false' });
			}
		}),

		/**
		 * Override showMenu to set aria-expanded when the menu opens.
		 */
		showMenu: Ext.Button.prototype.showMenu.createSequence(function() {
			if (this.el && this.menu) {
				this.el.set({ 'aria-expanded': 'true', 'aria-haspopup': 'true' });
			}
		}),

		/**
		 * Override hideMenu to clear aria-expanded when the menu closes.
		 */
		hideMenu: Ext.Button.prototype.hideMenu.createSequence(function() {
			if (this.el && this.menu) {
				this.el.set({ 'aria-expanded': 'false' });
			}
		})
	});
})();
