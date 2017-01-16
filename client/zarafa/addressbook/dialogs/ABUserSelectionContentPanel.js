Ext.namespace('Zarafa.addressbook.dialogs');

/**
 * @class Zarafa.addressbook.dialogs.ABUserSelectionContentPanel
 * @extends Zarafa.core.ui.RecordContentPanel
 * @xtype zarafa.abuserselectioncontentpanel
 */
Zarafa.addressbook.dialogs.ABUserSelectionContentPanel = Ext.extend(Zarafa.core.ui.RecordContentPanel, {
	/**
	 * @cfg {Function} callback the callback function to return to after selecting user from AdressBook.
	 */
	callback : Ext.emptyFn,

	/**
	 * @cfg {Boolean} singleSelect false to allow multiple selections(defaults to true allowing selection of only one row at a time)
	 */
	singleSelect : true,

	/**
	 * @cfg {Object} scope The scope in which the {@link #callback} will be called
	 */
	scope : undefined,

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
	 * @param {Object} config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			xtype : 'zarafa.abuserselectioncontentpanel',
			layout : 'fit',
			title : _('Address Book'),
			width : 1000,
			items: [{
				xtype: 'zarafa.abuserselectionpanel',
				hideContactsFolders : config.hideContactsFolders,
				listRestriction : config.listRestriction,
				callback : config.callback,
				singleSelect : Ext.isDefined(config.singleSelect) ? config.singleSelect : this.singleSelect,
				scope : config.scope
			}]
		});

		// Call parent constructor
		Zarafa.addressbook.dialogs.ABUserSelectionContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.abuserselectioncontentpanel', Zarafa.addressbook.dialogs.ABUserSelectionContentPanel);
