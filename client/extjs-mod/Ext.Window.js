(function() {
 	var orig_beforeShow = Ext.Window.prototype.beforeShow;
 	var orig_onWindowResize = Ext.Window.prototype.onWindowResize;

	Ext.override(Ext.Window, {
		/**
		 * The window object that represents the browser window that contains this Ext.Window
		 */
		browserWindow : undefined,

		/*
		 * overridden to set the correct size for the mask element in popout windows
		 */
		beforeShow : function()
		{
			orig_beforeShow.call(this);

			this.correctMaskSize();

			this.browserWindow = this.el.dom.ownerDocument.defaultView;
		},

		/*
		 * Overridden to set a different handler for the resize event of popout windows
		 */
		afterShow : function(isAnim)
		{
	        if (this.isDestroyed){
	            return false;
	        }
	        this.proxy.hide();
	        this.el.setStyle('display', 'block');
	        this.el.show();
	        if(this.maximized){
	            this.fitContainer();
	        }

	        if(this.monitorResize || this.modal || this.constrain || this.constrainHeader){
           		// Popout browser windows should listen to their own resize event and not to the one of the main window
				if ( this.browserWindow.name === 'mainBrowserWindow' ){
	            	Ext.EventManager.onWindowResize(this.onWindowResize, this);
	           } else {
					Zarafa.core.BrowserWindowMgr.on('separatewindowresize', this.onSeparateWindowResize, this);
	           }
	        }
	        this.doConstrain();
	        this.doLayout();
	        if(this.keyMap){
	            this.keyMap.enable();
	        }
	        this.toFront();
	        this.updateHandles();
	        if(isAnim && (Ext.isIE || Ext.isWebKit)){
	            var sz = this.getSize();
	            this.onResize(sz.width, sz.height);
	        }
	        this.onShow();
	        this.fireEvent('show', this);
		},

		/*
		 * Overridden to remove the correct event listener for popout browser windows
		 */
		afterHide : function(){
			this.proxy.hide();
			if(this.monitorResize || this.modal || this.constrain || this.constrainHeader){
				if ( this.browserWindow.name === 'mainBrowserWindow' ){
					Ext.EventManager.removeResizeListener(this.onWindowResize, this);
			   } else {
					Zarafa.core.BrowserWindowMgr.un('separatewindowresize', this.onSeparateWindowResize, this);
			   }
			}
			if(this.keyMap){
				this.keyMap.disable();
			}
			this.onHide();
			this.fireEvent('hide', this);
		},

		/*
		 * Overridden to set the correct size of the mask for popout windows
		 */
		onWindowResize : function()
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
		onSeparateWindowResize : function(browserWindow)
		{
			if ( browserWindow === this.browserWindow ){
				this.onWindowResize();
			}
		},

		/**
		 * Resizes the mask that is used for modal windows to fit the browser window size
		 */
		correctMaskSize : function()
		{
			if(this.modal){
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
