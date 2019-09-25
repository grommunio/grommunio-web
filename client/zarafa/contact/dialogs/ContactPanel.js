/*
 * #dependsFile client/zarafa/contact/data/ContactDetailsParser.js
 */
Ext.namespace('Zarafa.contact.dialogs');

/**
 * @class Zarafa.contact.dialogs.ContactPanel
 * @extends Ext.Panel
 * @xtype zarafa.contactpanel
 *
 * This class is used as wrapper class for all tabs, individual tab will have its own class,
 * extra tabs can be added using insertion point in this dialog.
 */
Zarafa.contact.dialogs.ContactPanel = Ext.extend(Ext.Panel, {
	// Insertion points for this class
	/**
	 * @insert context.contact.contactcontentpanel.tabs
	 * can be used to add extra tabs to contactcontentpanel by 3rd party plugins
	 * @param {Zarafa.contact.dialogs.ContactPanel} panel This contactpanel
	 */

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype : 'zarafa.contactpanel',
			cls : 'zarafa-contactcreatepanel',
			border : false,
			layout : 'fit',
			items: this.createTabPanel()
		});

		Zarafa.contact.dialogs.ContactPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Initialize {@link Ext.TabPanel tabpanel) that will contain all the fields and forms
	 * @return {Object} Configuration object for the form panel
	 * @private
	 */
	createTabPanel : function()
	{
		return [{
			xtype : 'tabpanel',
			activeTab : 0,
			border : false,
			defaults: {
				layout : 'column',
				autoHeight : false		// autoScroll won't work if height is auto
			},
			items : [
				{
					xtype : 'zarafa.contactgeneraltab'
				}, {
					xtype : 'zarafa.contactdetailtab'
				},
				// Add insertion point
				container.populateInsertionPoint('context.contact.contactcontentpanel.tabs', this)
			]
		}];
	}
});

Ext.reg('zarafa.contactpanel', Zarafa.contact.dialogs.ContactPanel);
