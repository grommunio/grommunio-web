Ext.namespace('Zarafa.plugins.filepreviewer');

/**
 * @class Zarafa.plugins.filepreviewer.ViewerPanel
 * @extends Ext.Panel
 * @xtype filepreviewer.viewerpanel
 *
 * The main panel which contains the iframe to display a PDF or ODF document.
 */
Zarafa.plugins.filepreviewer.ViewerPanel = Ext.extend(Ext.Panel, {
	/**
	 * @cfg {String} viewerjsPath Path to the ViewerJS installation.
	 * This is a relative path starting from the plugin root.
	 */
	viewerjsPath: 'external/ViewerJS/index.html',

	/**
	 * @cfg {String} pdfjsPath Path to the pdfjs installation.
	 * This is a relative path starting from the plugin root.
	 */
	pdfjsPath: 'external/pdfjs/web/viewer.html',

	/**
	 * @cfg {String} src The Iframe source. This will be applied if no record is set.
	 * If a records was passed to this panel, the return value of the "getInlineImageUrl" function
	 * will be used.
	 */
	src: '',

	/**
	 * @cfg {String} title The panel title. This will be applied if no record is set.
	 * If a records was passed to this panel, the "name" or "filename" property of the record
	 * will be used.
	 */
	title: '',

	/**
	 * @cfg {Boolean|Ext.Component} autoResize This flag specifies if the panel gets automatically resized if the window size has changed.
	 * If it is set to true the panel will listen on the Window update event. Otherwise it will listen to the component
	 * resize event.
	 * Defaults to false.
	 */
	autoResize: false,

	/**
	 * @cfg {Number} defaultScale The default scaling of the panel.
	 * Defaults to 0.8 meaning 80% of the browser width.
	 */
	defaultScale: 0.8,

	/**
	 * @constructor
	 * @param config
	 */
	constructor: function (config) {
		config = config || {};

		if (Ext.isDefined(config.record)) {
			this.title = config.record.get('name') || config.record.get('filename');

			var extension = this.title.split('.').pop().toLowerCase();
			this.src = this.getIframeURL(config.record.getInlineImageUrl(), extension);

		} else {
			this.src = config.src;
			this.title = config.title;
		}

		if (Ext.isDefined(config.autoResize)) {
			this.autoResize = config.autoResize;
		} else {
			this.autoResize = false;
		}

		if (Ext.isDefined(config.defaultScale)) {
			this.defaultScale = config.defaultScale;
		} else {
			this.defaultScale = 0.8;
		}

		var isDeskApp = Ext.isFunction(Zarafa.isDeskApp) ? Zarafa.isDeskApp() : Ext.isDefined(window.nw);
		if (isDeskApp) {
			// Render a webview for DeskApp, to make it more secure
			// (it also solves issues with namespace collisions)
			this.tag = 'webview';
			// First load a blank page to be able to inject the cookies with credentials
			// Store the src of the viewer so we can redirect to it after the cookies have
			// been injected
			var path = container.getSettingsModel().get('zarafa/v1/plugins/filepreviewer/path');
			this.viewerSrc = this.src;
			this.src = location.href + path + '/html/blank.html';
		} else {
			this.tag = 'iframe';
		}
		Ext.applyIf(config, {
			xtype : 'filepreviewer.viewerpanel',
			layout: 'anchor',
			anchor: '100%',
			items : [{
				xtype : 'component',
				ref : 'iframe',
				autoEl: {
					tag            : this.tag,
					src            : this.src,
					style          : {
						width : '100%',
						height: '100%'
					},
					frameborder    : 0,
					allowfullscreen: true
				},
				listeners : {
					afterrender : this.onAfterRender,
					scope: this
				}
			}],
			title : Ext.util.Format.htmlEncode(this.title),
			header: false,
			height: Ext.getBody().getViewSize().height * this.defaultScale,
			width : Ext.getBody().getViewSize().width * this.defaultScale
		});

		Zarafa.plugins.filepreviewer.ViewerPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Initializes the events. This function is called during rendering of the panel.
	 * @private
	 */
	initEvents: function () {
		if (this.autoResize === true) {
			Ext.EventManager.onWindowResize(this.resizePanel, this);
		} else if(this.autoResize !== false) {
			this.autoResize.on('resize', this.resizePanel, this);

			// save old autoscroll value and disable autoscrolling
			if(Ext.isDefined(this.autoResize.autoScroll)) {
				this.autoResize.initialAutoScrollValue = this.autoResize.autoScroll;
				this.autoResize.setAutoScroll(false);
			}
		}
	},

	/**
	 * Removes the resize event listener. This function is called when the panel gets destroyed.
	 * @private
	 */
	onDestroy: function () {
		if (this.autoResize === true) {
			Ext.EventManager.removeResizeListener(this.resizePanel, this);
		} else if(this.autoResize !== false) {
			this.autoResize.un('resize', this.resizePanel, this);

			// re-enable autoscrolling if it was enabled before
			if(Ext.isDefined(this.autoResize.autoScroll)) {
				this.autoResize.setAutoScroll(this.autoResize.initialAutoScrollValue);
			}
		}

		Zarafa.plugins.filepreviewer.ViewerPanel.superclass.onDestroy.call(this, arguments);
	},

	/**
	 * This functions resizes the panel to the given width. It will be called on the resize event if autoResize is enabled.
	 *
	 * @param {Number} width The window width.
	 * @param {Number} height The window height.
	 * @private
	 */
	resizePanel: function (width, height) {
		// the element event will pass more arguments
		// than the window resize event
		if(arguments.length > 2) {
			var autoResizeElement = arguments[0];
			width = autoResizeElement.getInnerWidth();
			height = autoResizeElement.getInnerHeight();
		}
		this.setWidth(width * this.defaultScale);
		this.setHeight(height * this.defaultScale);

		// center the panel
		if (this.ownerCt instanceof Ext.Window) {
			this.ownerCt.center();
		}
	},

	/**
	 * Generate the complete Iframe URL including the ViewerJS path.
	 *
	 * @param {String} url The inline url of the attachment to view.
	 * @param {String} extension The fileextension of the attachment. Optional.
	 * @returns {string}
	 */
	getIframeURL: function (url, extension) {
		var pluginRoot = container.getBasePath() + 'plugins/filepreviewer/';

		var options = '';

		if(Ext.isDefined(extension)) {
			if (extension === 'pdf'){
				options += '#zoom=' + container.getSettingsModel().get('zarafa/v1/plugins/filepreviewer/config_pdf_default_zoom');
				// Add the filename to the url to make sure that the pdfjs viewer will use it when downloaded.
				// Replace the hashes because otherwise pdfjs viewer will strip everything after it.
				url += '&filename='+this.title.replace('#', '-')
				return pluginRoot + this.pdfjsPath + '?file=' + encodeURIComponent(url) + options;
			} else if((/(od[tps])$/i).test(extension)) {
				options += '?zoom=' + container.getSettingsModel().get('zarafa/v1/plugins/filepreviewer/config_odf_default_zoom');
			} else {
				options += '?zoom=auto';
			}
			options += '&type=' + extension;
		}

		return pluginRoot + this.viewerjsPath + options + '#' + url;
	},

	/**
	 * Event handler which is fired after the {@link Zarafa.plugins.filepreviewer.ViewerPanel Panel}
	 * has been {@link Ext.Component#afterrender rendered}.
	 * This will register the load event handler on {@link Ext.Component IFrame}.
	 * @param {Ext.Component} iframe The component that encapsulates the iframe
	 */
	onAfterRender : function (iframe)
	{
		// Add a load event handler for the iframe
		this.getEl().on('load', this.onLoadFrame, this.getEl(), {single : true});
		// Add a load event handler for the webview
		this.getEl().on('contentload', this.onLoadWebview, this, {single : true});

		// Add some event listeners when we are using webviews (i.e. in DeskApp)
		if ( this.tag === 'webview' ){
			iframe.el.dom.addEventListener('permissionrequest', this.handlePermissionRequests);
			iframe.el.dom.addEventListener('dialog', this.handleDialogRequests, this);
		}
	},

	/**
	 * Handler for the 'load' event of iframe, fired immediately after iframe is loaded.
	 * Passes the keydown event for the Escape key to the parent window, so it can close
	 * the preview window.
	 * Get the {@link Ext.Button download button} of iframe body and
	 * it will skip showing the requester on {@link Ext.Button download button} click event
	 */
	onLoadFrame : function ()
	{
		var frameDom = this.dom.contentDocument;

		var self = this;
		frameDom.addEventListener('keydown', function(origEvent) {
			// Pass the esc keydown event to the parent window, so
			// it can close the preview window
			if ( origEvent.keyCode === 27 ) {
				var event = new KeyboardEvent(origEvent.type, origEvent);
				self.dom.dispatchEvent(event);
			}
		});

		var download = frameDom.getElementById('download');
		download = Ext.get(download);

		// when user clicks on download button,the attachment document url will open on parent window and
		// that's way it calls unload event of parent window and there for requester will be shown.
		// So, we just need to skip the requester.
		download.on('click', function () {
			Zarafa.core.Util.skipRequester = true;
		});
	},

	/**
	 * Handler for the contentload event of the webview. Will inject the WebApp cookies
	 * into the webview, so documents can be loaded
	 */
	onLoadWebview : function()
	{
		var iframeCookieStoreId = this.iframe.el.dom.getCookieStoreId();
		var cookieCounter = 0;
		chrome.cookies.getAll({url: location.href}, function(cookies) {
			cookies.forEach( function(c) {
				var cookie = {
					url: location.href,
					name: c.name,
					value: c.value,
					path: c.path,
					secure: c.secure,
					httpOnly: c.httpOnly,
					sameSite: c.sameSite,
					storeId: iframeCookieStoreId
				};
				chrome.cookies.set(cookie, function() {
					if ( ++cookieCounter === cookies.length ) {
						this.iframe.el.dom.src = this.viewerSrc;
					}
				}.bind(this));
			}.bind(this));
		}.bind(this));
	},

	/**
	 * Handler for the dialog event of WEBVIEW elements. Will handle alert, prompt,
	 * and confirm dialogs
	 * @param  {Event} e The dialog event
	 */
	handleDialogRequests : function(e)
	{
		// Handle alerts
		if ( e.messageType === 'alert' ) {
			window.alert(e.messageText);
		}

		// Handle confirm dialogs
		else if ( e.messageType === 'confirm' ) {
			var confirmation =  window.confirm(e.messageText);

			if ( confirmation ) {
				e.dialog.ok();
			} else {
				e.dialog.cancel();
			}
		}

		// Handle prompts
		else if ( e.messageType === 'prompt' ){
			var wprompt = window.prompt(e.messageText);

			if ( wprompt === null ){
				e.dialog.cancel();
			} else {
				e.dialog.ok(wprompt);
			}
		}

	},

	/**
	 * Handler for the permissionrequest event of WEBVIEW elements. Will handle the request
	 * by its type.
	 * Possible types are media, geolocation, pointerLock, download, loadplugin and fullscreen.
	 * For now we deny geolocation, fullscreen and pointerLock requests.
	 * @param {Event} e The permissionrequest event
	 */
	handlePermissionRequests : function(e)
	{
		e.preventDefault();
		switch (e.permission) {
			// Allow
			case 'download':
			case 'media':
			case 'loadplugin':
			case 'fullscreen':
				e.request.allow();
			break;
			// Deny
			case 'pointerLock':
			case 'geolocation':
				e.request.deny();
			break;
			// also deny all other, not yet known, requests
			default:
				e.request.deny();
			break;

		}
	}
});

Ext.reg('filepreviewer.viewerpanel', Zarafa.plugins.filepreviewer.ViewerPanel);
