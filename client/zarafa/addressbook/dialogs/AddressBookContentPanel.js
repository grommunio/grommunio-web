Ext.namespace('Zarafa.addressbook.dialogs');

/**
 * @class Zarafa.addressbook.dialogs.AddressBookContentPanel
 * @extends Zarafa.core.ui.RecordContentPanel
 * @xtype addressbook.addressbookcontentpanel
 */
Zarafa.addressbook.dialogs.AddressBookContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {
	/**
	 * @cfg {Object} hierarchyRestriction The default restriction
	 * which must be applied on the hierarchy to limit the type of
	 * containers which will be shown in the hierarchy.
	 */
	hierarchyRestriction : undefined,

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
			title : _('Address Book'),
			items: [{
				xtype: 'zarafa.addressbookpanel',
				listRestriction : config.listRestriction,
				hierarchyRestriction : config.hierarchyRestriction
			}]
		});

		// Call parent constructor
		Zarafa.addressbook.dialogs.AddressBookContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.addressbookcontentpanel', Zarafa.addressbook.dialogs.AddressBookContentPanel);
