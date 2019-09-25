Ext.namespace('Zarafa.contact.dialogs');

/**
 * @class Zarafa.contact.dialogs.DistlistPanel
 * @extends Ext.Panel
 * @xtype zarafa.distlistpanel
 */
Zarafa.contact.dialogs.DistlistPanel = Ext.extend(Ext.Panel, {
	// Insertion points for this class
	/**
	 * @insert context.contact.distlistcontentpanel.tabs
	 * can be used to add extra tabs to distlistcontentpanel by 3rd party plugins
	 * @param {Zarafa.contact.dialogs.DistlistPanel} panel This panel
	 */

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype : 'zarafa.distlistpanel',
			border : false,
			layout : 'fit',
			items: this.createFormPanel()
		});

		Zarafa.contact.dialogs.DistlistPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Function will create form panel and will add tabs in view.
	 * distlistmemberstab and distlistnotestab will be added.
	 */
	createFormPanel : function()
	{
		return [{
				xtype : 'tabpanel',
				activeTab : 0,
				border : false,
				defaults : {
					autoHeight : false,		// autoScroll won't work if height is auto
					frame : true
				},
				items :[{
						xtype : 'zarafa.distlistmemberstab'
					}, {
						xtype : 'zarafa.distlistnotestab',
						autoScroll : false
					},
					container.populateInsertionPoint('context.contact.distlistcontentpanel.tabs', this)
				]
		}];
	}
});

Ext.reg('zarafa.distlistpanel', Zarafa.contact.dialogs.DistlistPanel);
