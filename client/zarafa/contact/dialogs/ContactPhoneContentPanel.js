Ext.namespace('Zarafa.contact.dialogs');

/**
 * @class Zarafa.contact.dialogs.ContactPhoneContentPanel
 * @extends Zarafa.core.ui.RecordContentPanel
 *
 * This class will be used to create a detailed phone content panel,
 * This panel doesn't support passing already parsed data as there isn't any
 * functionality needed that will automatically trigger this panel so data will
 * be parsed in this content panel only
 *
 * @xtype zarafa.contactphonecontentpanel
 */
Zarafa.contact.dialogs.ContactPhoneContentPanel = Ext.extend(Zarafa.core.ui.RecordContentPanel, {
	/**
	 * @cfg {Zarafa.contact.data.ContactDetailsParser} parser parser object that will be used to parse information
	 */
	parser : null,

	/**
	 * @cfg {String} property property that will be modified
	 */
	property : null,

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype : 'zarafa.contactphonecontentpanel',
			layout : 'fit',
			border: false,
			title: _('Check phone number'),
			recordComponentPluginConfig : Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite : true
			}),
			autoSave : false,
			width: 400,
			height: 250,
			items: [{
				xtype: 'zarafa.contactphonepanel',
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

		Zarafa.contact.dialogs.ContactPhoneContentPanel.superclass.constructor.call(this, config);
	}
});

// register panel
Ext.reg('zarafa.contactphonecontentpanel', Zarafa.contact.dialogs.ContactPhoneContentPanel);
