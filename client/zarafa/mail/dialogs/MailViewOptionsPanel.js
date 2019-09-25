Ext.namespace('Zarafa.mail.dialogs');

/**
 * @class Zarafa.mail.dialogs.MailViewOptionsPanel
 * @extends Ext.Panel
 * @xtype zarafa.mailviewoptionspanel
 *
 * Panel for users to set the options on a given {@link Zarafa.mail.MailRecord record}
 */
Zarafa.mail.dialogs.MailViewOptionsPanel = Ext.extend(Ext.Panel, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			// Override from Ext.Component
			xtype : 'zarafa.mailviewoptionspanel',
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
			},{
				xtype: 'zarafa.mailoptionsmiscpanel',
				flex: 1
			}]
		});

		Ext.apply(this, config);

		Zarafa.mail.dialogs.MailViewOptionsPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.mailviewoptionspanel', Zarafa.mail.dialogs.MailViewOptionsPanel);
