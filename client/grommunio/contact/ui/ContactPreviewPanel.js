Ext.namespace('Grommunio.contact.ui');

/**
 * @class Grommunio.contact.ui.ContactPreviewPanel
 * @extends Ext.Panel
 * @xtype grommunio.contactpreviewpanel
 *
 * Panel that previews the contents of contact.
 */
Grommunio.contact.ui.ContactPreviewPanel = Ext.extend(Ext.Panel, {
	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'grommunio.contactpreviewpanel',
			border: false,
			bodyCfg: {
				cls: 'preview-body'
			},
			layout: 'fit',
			items: [{
				xtype: 'grommunio.contactbody'
			}]
		});

		Grommunio.contact.ui.ContactPreviewPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.contactpreviewpanel', Grommunio.contact.ui.ContactPreviewPanel);
