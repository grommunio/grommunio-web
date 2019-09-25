Ext.namespace('Zarafa.contact.ui');

/**
 * @class Zarafa.contact.ui.ContactPreviewPanel
 * @extends Ext.Panel
 * @xtype zarafa.contactpreviewpanel
 * 
 * Panel that previews the contents of contact.
 */
Zarafa.contact.ui.ContactPreviewPanel = Ext.extend(Ext.Panel, {
	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'zarafa.contactpreviewpanel',
			border : false,
			bodyCfg: {
				cls : 'preview-body'
			},
			layout : 'fit',
			items : [{
				xtype: 'zarafa.contactbody'
			}]
		});

		Zarafa.contact.ui.ContactPreviewPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.contactpreviewpanel', Zarafa.contact.ui.ContactPreviewPanel);
