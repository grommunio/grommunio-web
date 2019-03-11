Ext.namespace('Zarafa.mail.dialogs');

/**
 * @class Zarafa.mail.dialogs.MailViewOptionsContentPanel
 * @extends Zarafa.core.ui.RecordContentPanel
 * @xtype zarafa.mailviewoptionscontentpanel
 *
 * Content panel for users for setting the options on a {@link Zarafa.mail.MailRecord record}
 */
Zarafa.mail.dialogs.MailViewOptionsContentPanel = Ext.extend(Zarafa.core.ui.RecordContentPanel, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			// Override from Ext.Component
			xtype : 'zarafa.mailviewoptionscontentpanel',
			// Override from Ext.Component
			layout : 'fit',
			title : _('Message Options'),
			recordComponentPluginConfig : Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite : true
			}),
			autoSave : config.modal ? false : true,
			width: 650,
			height: 550,
			items: [{
				xtype: 'zarafa.mailviewoptionspanel',
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

		Zarafa.mail.dialogs.MailViewOptionsContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.mailviewoptionscontentpanel', Zarafa.mail.dialogs.MailViewOptionsContentPanel);
