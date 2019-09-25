Ext.namespace('Zarafa.addressbook.dialogs');

/**
 * @class Zarafa.addressbook.dialogs.ABUserDetailPanel
 * @extends Ext.TabPanel
 * This class is used as wrapper class for all tabs, individual tab will have its own class
 * @xtype zarafa.abuserdetailpanel
 */
Zarafa.addressbook.dialogs.ABUserDetailPanel = Ext.extend(Ext.TabPanel,{
	// Insertion points for this class
	/**
	 * @insert context.addressbook.abuserdetailcontentpanel.tabs
	 * can be used to add extra tabs to addressbook user details dialog by 3rd party plugins
	 * @param {Zarafa.addressbook.dialogs.ABUserDetailPanel} panel This contactpanel
	 */

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype : 'zarafa.abuserdetailpanel',
			border : false,
			activeTab : 0,
			items : [{
				xtype : 'zarafa.abusergeneraltab'
			}, {
				xtype : 'zarafa.abuserorganizationtab'
			},{
				xtype : 'zarafa.abuserphonetab'
			}, {
				xtype : 'zarafa.abmemberoftab'
			},{
				xtype : 'zarafa.abemailaddresstab'
			},
			// Add insertion point
			container.populateInsertionPoint('context.addressbook.abuserdetailcontentpanel.tabs', this)
			]
		});
		
		Zarafa.addressbook.dialogs.ABUserDetailPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.abuserdetailpanel', Zarafa.addressbook.dialogs.ABUserDetailPanel);
