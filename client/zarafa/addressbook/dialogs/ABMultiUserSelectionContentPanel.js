Ext.namespace('Zarafa.addressbook.dialogs');

/**
 * @class Zarafa.addressbook.dialogs.ABMultiUserSelectionContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 * @xtype zarafa.abmultiuserselectioncontentpanel
 */
Zarafa.addressbook.dialogs.ABMultiUserSelectionContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {
	/**
	 * @cfg {Function} callback the callback function to return to after selecting user from AdressBook.
	 */
	callback : undefined,

	/**
	 * @cfg {Function} convert the convert function which converts an
	 * {@link Zarafa.addressbook.AddressBookRecord user} to the correct type
	 * which can be placed in the {@link #store}.
	 * This function receives the selected AddressBookRecord as first argument,
	 * and optionally passes the {@link Ext.Component} which was generated from the
	 * {@link #selectionCfg} which was used to select the recipient as second argument.
	 */
	convert : undefined,

	/**
	 * @cfg {Object} scope The scope in which the {@link #callback} will be called
	 */
	scope : undefined,

	/**
	 * @cfg {Ext.data.Store} store The store in which all records should be placed.
	 */
	store : undefined,

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
	 * @cfg {Array} selectionCfg Array of {@link Zarafa.common.ui.BoxField} configuration
	 * objects which are created below the User list. These will show which users
	 * the user has selected.
	 */
	selectionCfg : undefined,

	/**
 	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			xtype : 'zarafa.abmultiuserselectioncontentpanel',
			layout : 'fit',
			title : _('Address Book'),
			items: [{
				xtype: 'zarafa.abmultiuserselectionpanel',
				hierarchyRestriction : config.hierarchyRestriction,
				listRestriction : config.listRestriction,
				selectionCfg : config.selectionCfg,
				callback : config.callback,
				convert : config.convert,
				scope : config.scope,
				store : config.store
			}]
		});

		// Call parent constructor
		Zarafa.addressbook.dialogs.ABMultiUserSelectionContentPanel.superclass.constructor.call(this, config);
	}
});


Ext.reg('zarafa.abmultiuserselectioncontentpanel', Zarafa.addressbook.dialogs.ABMultiUserSelectionContentPanel);
