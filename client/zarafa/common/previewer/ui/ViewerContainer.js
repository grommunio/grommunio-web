Ext.namespace('Zarafa.common.previewer.ui');

/**
 * @class Zarafa.common.previewer.ui.ViewerContainer
 * @extends Zarafa.core.ui.ContentPanel
 * @xtype zarafa.ViewerContentPanel
 *
 * ViewerContainer is provide the container for the pdf and odf file previewer.
 */
Zarafa.common.previewer.ui.ViewerContainer = Ext.extend(Zarafa.core.ui.ContentPanel, {

	/**
	 * @cfg {String} viewerjsPath Path to the ViewerJS installation.
	 * This is a relative path starting from the plugin root.
	 */
	viewerjsPath: 'client/filepreviewer/ViewerJS/index.html',

	/**
	 * @cfg {String} pdfjsPath Path to the pdfjs installation.
	 * This is a relative path starting from the plugin root.
	 */
	pdfjsPath: 'client/filepreviewer/pdfjs/web/viewer.html',

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
  constructor: function (config)
  {
		config = config || {};

		var src = config.src;
		this.title = config.title;
		var record = config.record;

		if (Ext.isDefined(record)) {
			this.title = record.get('name') || record.get('filename');

			var extension = this.title.split('.').pop().toLowerCase();
			src = this.generateUrl(record.getInlineImageUrl(), extension);
		}

		if (Zarafa.isDeskApp) {
			// Render a webview for DeskApp, to make it more secure
			// (it also solves issues with namespace collisions)
			this.tag = 'webview';
			// First load a blank page to be able to inject the cookies with credentials
			// Store the src of the viewer so we can redirect to it after the cookies have
			// been injected
			this.viewerSrc = src;
			src = Ext.SSL_SECURE_URL;
		} else {
			this.tag = 'iframe';
		}

		var viewSize = Ext.getBody().getViewSize();

    Ext.applyIf(config, {
			xtype: 'zarafa.viewercontainer',
			layout: 'anchor',
			anchor: '100%',
      title: Ext.util.Format.htmlEncode(this.title),
			height: viewSize.height * this.defaultScale,
			width: viewSize.width * this.defaultScale,
			defaultScale: config.defaultScale || this.defaultScale,
			autoResize: config.autoResize || false,
			items: [{
				xtype: 'component',
				ref: 'iframeComponent',
				autoEl: {
					tag: this.tag,
					src: src,
					style: {
						width: '100%',
						height: '100%'
					},
					frameborder: 0,
					allowfullscreen: true
				},
				listeners: {
					afterrender: this.onAfterRender,
					scope: this
				}
			}]
    });

		Zarafa.common.previewer.ui.ViewerContainer.superclass.constructor.call(this, config);

		if (this.autoResize === true) {
			Ext.EventManager.onWindowResize(this.onResizeWindow, this);
		}
	},

	/**
	 * Removes the resize event listener. This function is called when the panel gets destroyed.
	 * @private
	 */
	onDestroy: function ()
	{
		if (this.autoResize === true) {
			Ext.EventManager.removeResizeListener(this.onResizeWindow, this);
		}

		Zarafa.common.previewer.ui.ViewerContainer.superclass.onDestroy.apply(this, arguments);
	},

	/**
	 * This functions resizes the panel to the given width. It will be called on the resize event if autoResize is enabled.
	 *
	 * @param {Number} adjWidth The window width.
	 * @param {Number} adjHeight The window height.
	 * @private
	 */
	onResizeWindow: function(adjWidth, adjHeight)
	{
		this.setWidth(adjWidth * this.defaultScale);
		this.setHeight(adjHeight * this.defaultScale);

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
	generateUrl: function (url, extension)
	{
		var root = container.getBasePath();
		var options = '';
		if(Ext.isDefined(extension)) {
			if (extension === 'pdf') {
				options += '#zoom=' + container.getSettingsModel().get('zarafa/v1/main/file_previewer/pdf_zoom');
				// Add the filename to the url to make sure that the pdfjs viewer will use it when downloaded.
				// Replace the hashes because otherwise pdfjs viewer will strip everything after it.
				url += '&filename=' + this.title.replace('#', '-');
				return root + this.pdfjsPath + '?file=' + encodeURIComponent(url) + options;
			} else if((/(od[tps])$/i).test(extension)) {
				options += '?zoom=' + container.getSettingsModel().get('zarafa/v1/main/file_previewer/odf_zoom');
			} else {
				// ViewerJS does not provide zooming options for images, instead sets the width. 
				// Hence, we only keep the 'auto' option for images.
				options += '?zoom=auto';
			}
			options += '&type=' + extension;
		}

		return root + this.viewerjsPath + options + '#' + url;
	},

	/**
	 * Event handler which is fired after the {@link Ext.Component#afterrender rendered}.
	 * This will register the load event handler on {@link Ext.Component IFrame}.
	 * @param {Ext.Component} component The component that encapsulates the iframe
	 */
	onAfterRender: function (component)
	{
		var componentEl = component.getEl();
		// Add a load event handler for the iframe
		componentEl.on('load', this.onLoadFrame, component.getEl(), { single: true});
		// Add a load event handler for the webview
		this.getEl().on('contentload', this.onLoadWebview, this, { single: true});

		// Add some event listeners when we are using webviews (i.e. in DeskApp)
		if ( this.tag === 'webview' ){
			componentEl.dom.addEventListener('permissionrequest', this.handlePermissionRequests);
			componentEl.dom.addEventListener('dialog', this.handleDialogRequests, this);
			componentEl.dom.addEventListener('loadstop', this.onWebViewLoadstop, componentEl.dom);
			componentEl.dom.addEventListener('newwindow', this.newWindowHandler);
		}
	},

	/**
	 * Handler for the 'loadstop' event of WEBVIEW, fired after the content has been loaded
	 * in WEBVIEW. This function is currently used for injecting a script into WEBVIEW context
	 * to set default target of links reside in pdf to '_blank'.
	 */
	onWebViewLoadstop: function()
	{
		// We are adding a script tag at the end of all scripts in WEBVIEW dom so that
		// we can have access of all global variables exported by all the other scripts
		// while this script runs.
		// We also don't want unnecessary script tag in dom. So to keep dom clean we remove script tag.
		this.executeScript({ code: "var script = document.createElement('script');" +
				"script.textContent = '(' + function() " +
				"{if(window.PDFJS) {window.PDFJS.externalLinkTarget = window.PDFJS.LinkTarget.BLANK;}}" +
				" + ')();';" +
				"(document.head||document.documentElement).appendChild(script);" +
				"script.remove();"
		});
	},

	/**
	 * Handler for the 'load' event of iframe, fired immediately after iframe is loaded.
	 * Passes the keydown event for the Escape key to the parent window, so it can close
	 * the preview window.
	 * Also set the target for links in pdf to new tab.
	 * Get the {@link Ext.Button download button} of iframe body and
	 * it will skip showing the requester on {@link Ext.Button download button} click event
	 */
	onLoadFrame: function ()
	{
		var self = this;
		var frameDom = this.dom.contentDocument;
		var frameWindow = this.dom.contentWindow;
		var pdfjsObj = frameWindow.PDFJS;

		if (!Ext.isEmpty(pdfjsObj)) {
			// Open all links inside pdf into new tab of browser.
			pdfjsObj.externalLinkTarget = pdfjsObj.LinkTarget.BLANK;
		}

		frameDom.addEventListener('keydown', function(origEvent) {
			// Pass the esc keydown event to the parent window, so
			// it can close the preview window
			if ( origEvent.keyCode === 27 ) {
				self.dom.dispatchEvent(new KeyboardEvent(origEvent.type, origEvent));
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
	onLoadWebview: function()
	{
		var iframeCookieStoreId = this.iframeComponent.el.dom.getCookieStoreId();
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
						this.iframeComponent.el.dom.src = this.viewerSrc;
					}
				}.bind(this));
			}.bind(this));
		}.bind(this));
	},

	/**
	 * Handler of the newwindow event of WEBVIEW element.
	 * Chrome is blocking new window from WEBVIEW. So this handler will handle new window request
	 * from WEBVIEW and open link in new window.
	 * @param {Event} event The newwindow event
	 */
	newWindowHandler: function(event)
	{
		switch (event.windowOpenDisposition) {
			case 'new_window':
			case 'new_background_tab':
			case 'new_foreground_tab':
			case 'new_popup':
				var newWindow = window.open(event.targetUrl, '_blank');
				if (newWindow) {
					newWindow.focus();
				}
				return;
			// Ignore other cases like "save_to_disk", "current_tab", "ignore" for the request of new window.
			default: return;
		}
	},

	/**
	 * Handler for the dialog event of WEBVIEW elements. Will handle alert, prompt,
	 * and confirm dialogs
	 * @param {Event} e The dialog event
	 */
	handleDialogRequests: function(e)
	{
		switch (e.messageType) {
			case "alert":
				window.alert(e.messageText); // eslint-disable-line no-alert
			break;
			case "confirm":
				var confirmation = window.confirm(e.messageText); // eslint-disable-line no-alert
				if (confirmation === true) {
					e.dialog.ok();
				} else {
					e.dialog.cancel();
				}
			break;
			case "prompt":
				var wprompt = window.prompt(e.messageText); // eslint-disable-line no-alert
				if (wprompt !== null) {
					e.dialog.ok(wprompt);
				} else {
					e.dialog.cancel();
				}
			break;
		}
	},

	/**
	 * Handler for the permissionrequest event of WEBVIEW elements. Will handle the request
	 * by its type.
	 * Possible types are media, geolocation, pointerLock, download, loadplugin and fullscreen.
	 * For now we deny geolocation, fullscreen and pointerLock requests.
	 * @param {Event} e The permissionrequest event
	 */
	handlePermissionRequests: function(e)
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

Ext.reg('zarafa.viewercontainer', Zarafa.common.previewer.ui.ViewerContainer);
