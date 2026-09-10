Ext.namespace('Zarafa.plugins.files.ui');

/**
 * @class Zarafa.plugins.files.ui.OnlyofficePanel
 * @extends Ext.OnlyofficePanel
 */
Zarafa.plugins.files.ui.OnlyofficePanel = Ext.extend(Ext.Panel, {
	/**
	 * The id of the iframe element inside this onlyofficepanel
	 * @property
	 * @type String
	 */
	iframeId : undefined,

	/**
	 * @cfg {String} src The editor URL to embed
	 */
	src : undefined,

	/**
	 * @cfg {String} origin Origin of the embedded Nextcloud, the only one whose messages are handled
	 */
	origin : undefined,

	/**
	 * @cfg {Function} callback Called with this panel once the frame has loaded,
	 * for instance after the editor created a new file
	 */
	callback : undefined,

	/**
	 * @cfg {Object} scope Scope for {@link #callback}
	 */
	scope : undefined,

	/**
	 * Origin from which the embedded files application is allowed to send messages.
	 * @property
	 * @type String
	 * @private
	 */
	filesOrigin : undefined,

	/**
	 * Bound window message handler, retained so it can be removed on destroy.
	 * @property
	 * @type Function
	 * @private
	 */
	messageHandler : undefined,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		this.iframeId = 'files-iframe-'+config.tabOrder;
		this.filesOrigin = config.origin;

		Ext.applyIf(config, {
			// Overridden from Ext.Component
			xtype: 'zarafa.plugins.files.ui.onlyofficepanel',
			layout : 'fit',
			header: false,
			border: false,
			iconCls: 'icon_files',
			html : {
				tag: 'iframe',
				width: '100%',
				frameborder: '0',
				id: this.iframeId,
				cls: 'files-iframe',
				src: config.src,
				style: 'position:absolute;display:block;top:-50px;height:calc(100% + 50px);'
			},
			listeners: {
				afterrender: this.onAfterRender,
				scope: this
			}
		});

		Zarafa.plugins.files.ui.OnlyofficePanel.superclass.constructor.call(this, config);

		this.messageHandler = this.onWindowMessage.createDelegate(this);
		window.addEventListener('message', this.messageHandler, false);
	},

	/**
	 * Handle login requests from this panel's same-origin iframe only.
	 *
	 * @param {MessageEvent} event Browser message event
	 * @private
	 */
	onWindowMessage: function(event)
	{
		var iframe = document.getElementById(this.iframeId);
		if (!iframe || event.origin !== this.filesOrigin || event.source !== iframe.contentWindow || event.data !== 'ocLoginRequired') {
			return;
		}

		container.getNotifier().notify('info.files', _('Files'), _('Authentication required, when using grommunio-files for the first time'));
	},

	/**
	 * Handler for the afterrender event of this panel. Watches the frame's load and,
	 * for a same-origin Nextcloud, hooks its window to recognise the login page. The
	 * initial about:blank window is reused by a same-origin navigation, so the hook
	 * survives; a cross-origin frame cannot be inspected at all.
	 */
	onAfterRender: function()
	{
		var iframe = document.getElementById(this.iframeId);
		Ext.get(iframe).on('load', this.onFrameLoad, this, { single: true });

		if (this.filesOrigin !== window.location.origin) {
			return;
		}

		var iframeWin = iframe.contentWindow || iframe;
		var iframeDoc = iframe.contentDocument || iframeWin.document;

		var script = iframeDoc.createElement("script");
		script.append(`
			window.onload = function() {
				const el = document.getElementById('password');
				if(el) {
					var parentWindow = window.parent;
					parentWindow.postMessage('ocLoginRequired', window.location.protocol + '//' + window.location.host);
				}
			}
	`);
		iframeDoc.documentElement.appendChild(script);
	},

	/**
	 * The embedded page has loaded; hand over to the {@link #callback}.
	 * @private
	 */
	onFrameLoad: function()
	{
		if (Ext.isFunction(this.callback)) {
			this.callback.call(this.scope || this, this);
		}
	},

	/**
	 * Remove the global message listener when the panel is destroyed.
	 * @protected
	 */
	onDestroy: function()
	{
		if (this.messageHandler) {
			window.removeEventListener('message', this.messageHandler, false);
			this.messageHandler = undefined;
		}

		Zarafa.plugins.files.ui.OnlyofficePanel.superclass.onDestroy.apply(this, arguments);
	}
});

Ext.reg('zarafa.plugins.files.ui.onlyofficepanel', Zarafa.plugins.files.ui.OnlyofficePanel);
