Ext.namespace('Zarafa.mail.ui');

/**
 * @class Zarafa.mail.ui.MailViewPanel
 * @extends Ext.Panel
 * @xtype zarafa.mailviewpanel
 * 
 * Panel that shows the contents of mail messages.
 */
Zarafa.mail.ui.MailViewPanel = Ext.extend(Ext.Panel, {
	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'zarafa.mailviewpanel',
			border : false,
			cls: 'zarafa-mailviewpanel',
			layout: 'zarafa.collapsible',
			items : [{
				xtype: 'zarafa.messageheader'
			},{
				xtype : 'zarafa.messagebody'
			}]
		});

		Zarafa.mail.ui.MailViewPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.mailviewpanel', Zarafa.mail.ui.MailViewPanel);
