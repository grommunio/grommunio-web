Ext.namespace('Zarafa.addressbook.dialogs');

/**
 * @class Zarafa.addressbook.dialogs.ABGroupDetailPanel
 * @extends Ext.TabPanel
 * @xtype zarafa.abgroupdetailpanel
 */
Zarafa.addressbook.dialogs.ABGroupDetailPanel = Ext.extend(Ext.TabPanel, {
	// Insertion points for this class
	/**
	 * @insert context.addressbook.abgroupdetailcontentpanel.tabs
	 * can be used to add extra tabs to addressbook group details dialog by 3rd party plugins
	 * @param {Zarafa.addressbook.dialogs.ABGroupDetailPanel} panel This contactpanel
	 */

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype : 'zarafa.abgroupdetailpanel',
			border : false,
			activeTab : 0,
			items : [{
				xtype : 'zarafa.abgroupgeneraltab'
			}, {
				xtype : 'zarafa.abmemberoftab'
			},{
				xtype : 'zarafa.abemailaddresstab'
			},
			// Add insertion point
			container.populateInsertionPoint('context.addressbook.abgroupdetailcontentpanel.tabs', this)
			]
		});
		
		Zarafa.addressbook.dialogs.ABGroupDetailPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.abgroupdetailpanel', Zarafa.addressbook.dialogs.ABGroupDetailPanel);
