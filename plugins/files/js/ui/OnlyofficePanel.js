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
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};
		const url = config.url;
		const fileid = config.record.getFileid();

		this.iframeId = 'files-iframe-'+config.tabOrder;
		const baseUrl = window.location.protocol + '//' + window.location.hostname + "/files/index.php/apps/onlyoffice/";
		const filePath = url.split('/').slice(1).join('%2F');

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
				style: 'position:absolute;display:block;top:-50px;height:calc(100% + 50px);',
			},
			listeners: {
				afterrender: this.onAfterRender,
				scope: this
			}
		});

		window.addEventListener("message", (e) => {
			if(e.data === "ocLoginRequired") {
					Ext.MessageBox.show({
					title: _('grommunio Web'),
					msg: _('Authentication required, when using grommunio-files for the first time'),
					buttons: Ext.MessageBox.OK,
					icon: Ext.MessageBox.INFO,
					scope : this
				});
			}
		});

		Zarafa.plugins.files.ui.OnlyofficePanel.superclass.constructor.call(this, config);
	},

	/**
	 * Handler for the afterrender event of this panel. Will set a load mask when opening
	 * a url.
	 */
	onAfterRender: function()
	{
		const iframe = document.getElementById(this.iframeId);
		const iframeWin = iframe.contentWindow || iframe;
		const iframeDoc = iframe.contentDocument || iframeWin.document;

		var script = iframeDoc.createElement("script");
		script.append(`
			window.onload = function() {
				const el = document.getElementById('password');
				if(el) {
					var parentWindow = window.parent;
					parentWindow.postMessage('ocLoginRequired', '*');
				}
			}
	`);
	iframeDoc.documentElement.appendChild(script);
	}
});

Ext.reg('zarafa.plugins.files.ui.onlyofficepanel', Zarafa.plugins.files.ui.OnlyofficePanel);
