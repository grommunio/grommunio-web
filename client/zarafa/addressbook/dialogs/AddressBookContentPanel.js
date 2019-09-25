Ext.namespace('Zarafa.addressbook.dialogs');

/**
 * @class Zarafa.addressbook.dialogs.AddressBookContentPanel
 * @extends Zarafa.core.ui.RecordContentPanel
 * @xtype addressbook.addressbookcontentpanel
 */
Zarafa.addressbook.dialogs.AddressBookContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {
	/**
	 * @cfg (Boolean) Set to true to hide contacts folders in the address book
	 * hierarchy dropdown.
	 */
	hideContactsFolders : false,

	/**
	 * @cfg {Object} listRestriction The default restriction which
	 * must be send to the server side when obtaining a fresh list
	 * from the server. This can be used to restrict the visibility
	 * of users, groups, companies etc.
	 */
	listRestriction : undefined,

	/**
 	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype : 'zarafa.addressbookcontentpanel',
			layout : 'fit',
			cls: 'k-addressbookcontentpanel',
			title : _('Address Book'),
			width : 1000,
			items: [{
				xtype: 'zarafa.addressbookpanel',
				hideContactsFolders : config.hideContactsFolders,
				listRestriction : config.listRestriction
			}]
		});

		// Call parent constructor
		Zarafa.addressbook.dialogs.AddressBookContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.addressbookcontentpanel', Zarafa.addressbook.dialogs.AddressBookContentPanel);
