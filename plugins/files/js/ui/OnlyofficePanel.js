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
		var url = config.url;
		var fileid = config.record.getFileid();

		this.iframeId = 'files-iframe-'+config.tabOrder;
		this.filesOrigin = window.location.protocol + '//' + window.location.host;
		var baseUrl = this.filesOrigin + '/files/index.php/apps/onlyoffice/';
		var filePath = url.split('/').slice(1).join('%2F');

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
				src: baseUrl + fileid + "?filePath=%2F" + filePath,
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

		Ext.MessageBox.show({
			title: _('grommunio Web'),
			msg: _('Authentication required, when using grommunio-files for the first time'),
			buttons: Ext.MessageBox.OK,
			icon: Ext.MessageBox.INFO,
			scope : this
		});
	},

	/**
	 * Handler for the afterrender event of this panel. Will set a load mask when opening
	 * a url.
	 */
	onAfterRender: function()
	{
		var iframe = document.getElementById(this.iframeId);
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
