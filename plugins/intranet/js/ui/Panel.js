Ext.namespace('Zarafa.plugins.intranet.ui');

/**
 * @class Zarafa.plugins.intranet.ui.Panel
 * @extends Ext.Panel
 */
Zarafa.plugins.intranet.ui.Panel = Ext.extend(Ext.Panel, {
	/**
	 * The id of the iframe element inside this panel
	 */
	iframeId : undefined,

	/**
	 * @cfg {Boolean} isLoadMaskShown true if load mask should be shown else false.
	 */
	isLoadMaskShown : false,

	/**
	 * The LoadMask object which will be shown when the {@link #record} is being opened, and
	 * the dialog is waiting for the server to respond with the desired data. This will only
	 * be set if {@link #showLoadMask} is true.
	 * @property
	 * @type Zarafa.common.ui.LoadMask
	 */
	loadMask : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};
		this.iframeId = 'intranet-iframe-'+config.tabOrder;
		if (Zarafa.plugins.intranet.isDeskApp()) {
			this.tag = 'webview';
		} else {
			this.tag = 'iframe';
		}

		Ext.applyIf(config, {
			// Overridden from Ext.Component
			xtype: 'zarafa.plugins.intranet.ui.panel',
			layout : 'fit',
			header: false,
			html : {
				tag: this.tag,
				id: this.iframeId,
				cls: 'intranet-iframe',
				src: config.url,
				style: 'display:block',
				partition: 'persist:kw-plugin-intranet'
			},
			listeners: {
				afterrender: this.onAfterRender,
				scope: this
			}
		});

		Zarafa.plugins.intranet.ui.Panel.superclass.constructor.call(this, config);
	},

	/**
	 * Handler for the afterrender event of this panel. Will set a load mask when opening
	 * a url. When using WEBVIEW (i.e. in DeskApp) it will add some listeners to handle
	 * dialogs in the webview.
	 */
	onAfterRender: function()
	{
		this.showLoadMask();

		var iframe = document.getElementById(this.iframeId);
		var event = (this.tag === 'webview') ? 'contentload' : 'load';

		iframe.addEventListener(event, function(){
			this.hideLoadMask();
			// For DeskApp: copy cookies to the main context so files can be downloaded
			if (this.tag === 'webview') {
				var intraUrl = this.url;
				window.chrome.cookies.getAll(
					{
						url: intraUrl,
						storeId: iframe.getCookieStoreId()
					},
					function(cookies) {
						for (var cookie of cookies) {
							window.chrome.cookies.set({
								url: intraUrl,
								domain: cookie.domain,
								expirationDate: cookie.expirationDate,
								httpOnly: cookie.httpOnly,
								name: cookie.name,
								path: cookie.path,
								sameSite: cookie.sameSite,
								secure: cookie.secure,
								value: cookie.value,
							});
						}
					}
				);
			}

		}.createDelegate(this));

		// Add some event listeners when we are using webviews (i.e. in DeskApp)
		if ( this.tag === 'webview' ){
			iframe.addEventListener('permissionrequest', this.handlePermissionRequests);
			iframe.addEventListener('dialog', this.handleDialogRequests, this);
			iframe.addEventListener('newwindow', this.handleNewWindowRequests, this);
		}
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
			var wprompt = window.prompt( e.messageText);

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
				e.request.allow();
			break;
			// Deny
			case 'pointerLock':
			case 'fullscreen':
			case 'geolocation':
				e.request.deny();
			break;
			// also deny all other, not yet known, requests
			default:
				e.request.deny();
			break;

		}
	},

	/**
	 * Handler for the newwindow event of WEBVIEW elements. Will handle new windows, by
	 * opening them externally in the browser.
	 * @param  {Event} e The newwindow event
	 */
	handleNewWindowRequests : function(e)
	{
		e.window.discard();
		//nw.Shell.openExternal(e.targetUrl);
	},

	/**
	 * If {@link #showLoadMask} is enabled, this function will display
	 * the {@link #loadMask}.
	 * @param {Boolean} errorMask True to show an error mask instead of the loading mask.
	 * @protected
	 */
	showLoadMask : function(errorMask)
	{
		if (this.isLoadMaskShown === true) {
			return;
		}
		if (!this.loadMask) {
			this.loadMask = new Zarafa.common.ui.LoadMask(this.ownerCt.el);
		}

		if (errorMask) {
			this.loadMask.showError();
		} else {
			this.loadMask.show();
			this.isLoadMaskShown = true;
		}
	},

	/**
	 * If {@link #showLoadMask} is enabled, and {@link #showLoadMask} has been
	 * called to display the {@link #loadMask} this function will disable the
	 * loadMask.
	 * @protected
	 */
	hideLoadMask : function()
	{
		if (this.isLoadMaskShown === false) {
			return;
		}

		if (this.loadMask) {
			this.loadMask.hide();
			this.isLoadMaskShown = false;
		}
	}

});

Ext.reg('zarafa.plugins.intranet.ui.panel', Zarafa.plugins.intranet.ui.Panel);
