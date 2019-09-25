Ext.namespace('Zarafa.mail.dialogs');

/**
 * @class Zarafa.mail.dialogs.MailCreateOptionsPanel
 * @extends Ext.Panel
 * @xtype zarafa.mailcreateoptionspanel
 *
 * Panel for users to set the options on a given {@link Zarafa.mail.MailRecord record}
 */
Zarafa.mail.dialogs.MailCreateOptionsPanel = Ext.extend(Ext.Panel, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			// Override from Ext.Component
			xtype : 'zarafa.mailcreateoptionspanel',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			border: false,
			defaults: {
				bodyStyle: 'padding-top: 5px; padding-left: 6px; padding-right: 5px; background-color: inherit;',
				border: false
			},
			items: [{
				xtype: 'zarafa.mailoptionssettingspanel'
			},{
				xtype: 'zarafa.mailoptionstrackingpanel'
			}]
		});

		Ext.apply(this, config);

		Zarafa.mail.dialogs.MailCreateOptionsPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.mailcreateoptionspanel', Zarafa.mail.dialogs.MailCreateOptionsPanel);
