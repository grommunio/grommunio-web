Ext.namespace('Zarafa.contact.dialogs');

/**
 * @class Zarafa.contact.dialogs.ContactOptionsContentPanel
 * @extends Zarafa.core.ui.RecordContentPanel
 * @xtype zarafa.contactoptionscontentpanel
 */
Zarafa.contact.dialogs.ContactOptionsContentPanel = Ext.extend(Zarafa.core.ui.RecordContentPanel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			xtype: 'zarafa.contactoptionscontentpanel',
			layout: 'fit',
			title: _('Message Options'),
			recordComponentPluginConfig: Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite: true
			}),
			autoSave: config.modal ? false : true,
			width: 360,
			height: 220,
			items: [{
				xtype: 'zarafa.contactoptionspanel',
				buttons: [{
					text: _('Ok'),
					handler: this.onOk,
					scope: this
				}]
			}]
		});

		Zarafa.contact.dialogs.ContactOptionsContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.contactoptionscontentpanel', Zarafa.contact.dialogs.ContactOptionsContentPanel);
