(function() {
 	var orig_beforeShow = Ext.Window.prototype.beforeShow;
 	var orig_onWindowResize = Ext.Window.prototype.onWindowResize;
	var orig_afterHide = Ext.Window.prototype.afterHide;

	Ext.override(Ext.Window, {
		/**
		 * @private
		 * The element that had focus before this window was shown.
		 * Used to restore focus when the window is hidden.
		 */
		previousFocus: undefined,
		/**
		 * The window object that represents the browser window that contains this Ext.Window
		 */
		browserWindow: undefined,

		/*
		 * overridden to set the correct size for the mask element in popout windows
		 */
		beforeShow: function()
		{
			orig_beforeShow.call(this);

			this.correctMaskSize();

			this.browserWindow = this.el.dom.ownerDocument.defaultView;

			// Save the currently focused element so we can restore it when this window closes
			this.previousFocus = this.el.dom.ownerDocument.activeElement;

			// Add ARIA dialog attributes
			if (this.el) {
				this.el.set({ 'role': this.ariaRole || 'dialog' });
				if (this.modal) {
					this.el.set({ 'aria-modal': 'true' });
				}
				if (this.title) {
					var headerId = this.getId() + '-header-text';
					var headerEl = this.header ? this.header.child('.x-window-header-text') : null;
					if (headerEl) {
						headerEl.set({ 'id': headerId });
						this.el.set({ 'aria-labelledby': headerId });
					} else {
						this.el.set({ 'aria-label': this.title });
					}
				}

				// Set up focus trap for modal windows
				if (this.modal) {
					this.el.on('keydown', this.onFocusTrapKeyDown, this);
				}
			}
		},

		/*
		 * Overridden to set a different handler for the resize event of popout windows
		 */
		afterShow: function(isAnim)
		{
	        if (this.isDestroyed) {
	            return false;
	        }
	        this.proxy.hide();
	        this.el.setStyle('display', 'block');
	        this.el.show();
	        if(this.maximized) {
	            this.fitContainer();
	        }

	        if(this.monitorResize || this.modal || this.constrain || this.constrainHeader) {
           		// Popout browser windows should listen to their own resize event and not to the one of the main window
				if ( this.browserWindow.name === 'mainBrowserWindow' ) {
	            	Ext.EventManager.onWindowResize(this.onWindowResize, this);
	           } else {
					Zarafa.core.BrowserWindowMgr.on('separatewindowresize', this.onSeparateWindowResize, this);
	           }
	        }
	        this.doConstrain();
	        this.doLayout();
	        if(this.keyMap) {
	            this.keyMap.enable();
	        }
	        this.toFront();
	        this.updateHandles();
	        if(isAnim && (Ext.isIE || Ext.isWebKit)) {
	            var sz = this.getSize();
	            this.onResize(sz.width, sz.height);
	        }
	        this.onShow();
	        this.fireEvent('show', this);
		},

		/*
		 * Overridden to remove the correct event listener for popout browser windows
		 * and restore focus to the previously focused element.
		 */
		afterHide: function() {
			this.proxy.hide();
			if(this.monitorResize || this.modal || this.constrain || this.constrainHeader) {
				if ( this.browserWindow.name === 'mainBrowserWindow' ) {
					Ext.EventManager.removeResizeListener(this.onWindowResize, this);
			   } else {
					Zarafa.core.BrowserWindowMgr.un('separatewindowresize', this.onSeparateWindowResize, this);
			   }
			}
			if(this.keyMap) {
				this.keyMap.disable();
			}

			// Clean up focus trap listener
			if (this.modal && this.el) {
				this.el.un('keydown', this.onFocusTrapKeyDown, this);
			}

			// Restore focus to the element that was focused before this window was shown
			if (this.previousFocus && this.previousFocus.focus) {
				try {
					this.previousFocus.focus();
				} catch(e) {}
				delete this.previousFocus;
			}

			this.onHide();
			this.fireEvent('hide', this);
		},

		/*
		 * Overridden to set the correct size of the mask for popout windows
		 */
		onWindowResize: function()
		{
			orig_onWindowResize.call(this);

			this.correctMaskSize();
		},

		/**
		 * Event handler for the separatewindowresize event of the {@link Zarafa.core.BrowserWindowMgr}
		 *
		 * @param {Window} browserWindow The window object that represents the browser window that
		 * was resized.
		 */
		onSeparateWindowResize: function(browserWindow)
		{
			if ( browserWindow === this.browserWindow ) {
				this.onWindowResize();
			}
		},

		/**
		 * Key handler that traps Tab focus within modal windows.
		 * When Tab is pressed on the last focusable element, focus wraps to the first.
		 * When Shift+Tab is pressed on the first focusable element, focus wraps to the last.
		 * @param {Ext.EventObject} e The keydown event
		 * @private
		 */
		onFocusTrapKeyDown: function(e) {
			if (e.getKey() !== e.TAB) {
				return;
			}

			var dom = this.el.dom;
			var focusable = dom.querySelectorAll(
				'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), ' +
				'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"]), ' +
				'select:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), ' +
				'[tabindex]:not([tabindex="-1"])'
			);

			if (focusable.length === 0) {
				e.stopEvent();
				return;
			}

			var first = focusable[0];
			var last = focusable[focusable.length - 1];
			var active = dom.ownerDocument.activeElement;

			if (e.shiftKey) {
				if (active === first || !dom.contains(active)) {
					e.stopEvent();
					last.focus();
				}
			} else {
				if (active === last || !dom.contains(active)) {
					e.stopEvent();
					first.focus();
				}
			}
		},

		/**
		 * Resizes the mask that is used for modal windows to fit the browser window size
		 */
		correctMaskSize: function()
		{
			if(this.modal) {
				// Hide the mask when resizing it or it will influence the size of the window
				this.mask.hide();
				this.mask.setSize(
					this.mask.dom.ownerDocument.body.scrollWidth,
					this.mask.dom.ownerDocument.body.scrollHeight
				);
				this.mask.show();
			}
		}
	});
})();
