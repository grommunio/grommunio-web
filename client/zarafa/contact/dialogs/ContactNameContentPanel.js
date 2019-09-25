/*
 * #dependsFile client/zarafa/contact/data/ContactConfig.js
 */
Ext.namespace('Zarafa.contact.dialogs');

/**
 * @class Zarafa.contact.dialogs.ContactNameContentPanel
 * @extends Zarafa.core.ui.RecordContentPanel
 *
 * this class will be used to create a detailed contact name content panel
 *
 * @xtype zarafa.contactnamecontentpanel
 */
Zarafa.contact.dialogs.ContactNameContentPanel = Ext.extend(Zarafa.core.ui.RecordContentPanel, {
	/**
	 * @cfg {Zarafa.contact.data.ContactDetailsParser} parser parser object that will be used to parse information
	 */
	parser : null,

	/**
	 * @cfg {Zarafa.contact.dialogs.parsedNameRecord} parsedData if data is already parsed then it can be passed here,
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

		Ext.applyIf(config, {
			xtype : 'zarafa.contactnamecontentpanel',
			layout : 'fit',
			border: false,
			title : _('Check full name'),
			recordComponentPluginConfig : Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite : true
			}),
			autoSave : false,
			width: 400,
			height: 250,
			items: [{
				xtype: 'zarafa.contactnamepanel',
				ref: 'mainPanel',
				parser: config.parser,
				parsedData: config.parsedData,
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

		Zarafa.contact.dialogs.ContactNameContentPanel.superclass.constructor.call(this, config);
	}
});

// register panel
Ext.reg('zarafa.contactnamecontentpanel', Zarafa.contact.dialogs.ContactNameContentPanel);
