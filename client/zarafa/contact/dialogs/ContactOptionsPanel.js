Ext.namespace('Zarafa.contact.dialogs');

/**
 * @class Zarafa.contact.dialogs.ContactOptionsPanel
 * @extends Ext.Panel
 * @xtype zarafa.contactoptionspanel
 */
Zarafa.contact.dialogs.ContactOptionsPanel = Ext.extend(Ext.Panel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			xtype: 'zarafa.contactoptionspanel',
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
				xtype: 'zarafa.recordpropertiespanel',
				flex: 1
			}]
		});

		Zarafa.contact.dialogs.ContactOptionsPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.contactoptionspanel', Zarafa.contact.dialogs.ContactOptionsPanel);
