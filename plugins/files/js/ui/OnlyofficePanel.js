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
				height: '100%',
				width: '100%',
				id: this.iframeId,
				cls: 'files-iframe',
				src: baseUrl + fileid + "?filePath=%2F" + filePath,
				style: 'position:absolute;display:block;top:-45px'
			}
		});

		Zarafa.plugins.files.ui.OnlyofficePanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.plugins.files.ui.onlyofficepanel', Zarafa.plugins.files.ui.OnlyofficePanel);
