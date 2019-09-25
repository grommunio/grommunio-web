Ext.namespace('Zarafa.mail.dialogs');

/**
 * @class Zarafa.mail.dialogs.MailCreateOptionsContentPanel
 * @extends Zarafa.core.ui.RecordContentPanel
 * @xtype zarafa.mailcreateoptionscontentpanel
 *
 * Content panel for users for setting the options on a {@link Zarafa.mail.MailRecord record}
 */
Zarafa.mail.dialogs.MailCreateOptionsContentPanel = Ext.extend(Zarafa.core.ui.RecordContentPanel, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			// Override from Ext.Component
			xtype : 'zarafa.mailcreateoptionscontentpanel',
			// Override from Ext.Component
			layout : 'fit',
			title : _('Message Options'),
			recordComponentPluginConfig : Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite : true
			}),
			autoSave : config.modal ? false : true,
			width: 320,
			height: 220,
			items: [{
				xtype: 'zarafa.mailcreateoptionspanel',
				buttons: [{
					text: _('Ok'),
					handler: this.onOk,
					scope: this
				},{
					text: _('Cancel'),
					handler: this.onCancel,
					scope: this
				}]
			}]
		});

		Zarafa.mail.dialogs.MailCreateOptionsContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.mailcreateoptionscontentpanel', Zarafa.mail.dialogs.MailCreateOptionsContentPanel);
