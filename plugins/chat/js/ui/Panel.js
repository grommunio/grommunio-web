Ext.namespace('Zarafa.plugins.chat.ui');

/**
 * @class Zarafa.plugins.chat.ui.Panel
 * @extends Ext.Panel
 */
Zarafa.plugins.chat.ui.Panel = Ext.extend(Ext.Panel, {
	/**
	 * The id of the iframe element inside this panel
	 * @property
	 * @type String
	 */
	iframeId : undefined,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		this.iframeId = 'chat-iframe-'+config.tabOrder;

		Ext.applyIf(config, {
			// Overridden from Ext.Component
			xtype: 'zarafa.plugins.chat.ui.panel',
			layout : 'fit',
			header: false,
			border: false,
			iconCls: 'icon_chat',
			html : {
				tag: 'iframe',
				id: this.iframeId,
				cls: 'chat-iframe',
				src: config.url,
				style: 'display:block',
				partition: 'persist:kw-plugin-chat-'+container.getUser().getUserName(),
				allow: 'geolocation; microphone; camera; midi; encrypted-media'
			},
			listeners: {
				afterrender: this.onAfterRender,
				scope: this
			}
		});

		Zarafa.plugins.chat.ui.Panel.superclass.constructor.call(this, config);
	},

	/**
	 * Handler for the afterrender event of this panel. Will set a load mask when opening
	 * a url.
	 */
	onAfterRender: function()
	{
		this.showLoadMask();

		var iframe = document.getElementById(this.iframeId);
		var event = (this.tag === 'webview') ? 'contentload' : 'load';

		iframe.addEventListener(event, function(){
			this.hideLoadMask();
			Zarafa.plugins.chat.Notifications.initialize(iframe);
		}.createDelegate(this));
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

Ext.reg('zarafa.plugins.chat.ui.panel', Zarafa.plugins.chat.ui.Panel);
