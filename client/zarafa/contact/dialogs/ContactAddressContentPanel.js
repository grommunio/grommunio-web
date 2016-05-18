Ext.namespace('Zarafa.contact.dialogs');

/**
 * @class Zarafa.contact.dialogs.ContactAddressContentPanel
 * @extends Zarafa.core.ui.RecordContentPanel
 *
 * This class will be used to create a detailed address content panel
 *
 * @xtype zarafa.contactaddresscontentpanel
 */
Zarafa.contact.dialogs.ContactAddressContentPanel = Ext.extend(Zarafa.core.ui.RecordContentPanel, {
	/**
	 * @cfg {Zarafa.contact.data.ContactDetailsParser} parser parser object that will be used to parse information
	 */
	parser : null,

	/**
	 * @cfg {String} property property that will be modified
	 */
	property : null,

	/**
	 * @cfg {Object} parsedData if data is already parsed then it can be passed here,
	 * so no need to prase same data again
	 */
	parsedData : null,

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			layout : 'fit',
			border: false,
			xtype : 'zarafa.contactaddresscontentpanel',
			title: _('Check address'),
			recordComponentPluginConfig : Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite : true
			}),
			autoSave : false,
			width: 400,
			height: 300,
			items: [{
				xtype: 'zarafa.contactaddresspanel',
				ref: 'mainPanel',
				parser: config.parser,
				parsedData: config.parsedData,
				property: config.property,
				buttons : [{
					text : _('Ok'),
					handler : this.onOk,
					scope : this
				},{
					text : _('Cancel'),
					scope : this,
					handler : this.onCancel
				}]
			}]
		});

		Zarafa.contact.dialogs.ContactAddressContentPanel.superclass.constructor.call(this, config);
	}
});

// register panel
Ext.reg('zarafa.contactaddresscontentpanel', Zarafa.contact.dialogs.ContactAddressContentPanel);
