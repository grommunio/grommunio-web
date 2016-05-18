Ext.namespace('Zarafa.addressbook.ui');

/**
 * @class Zarafa.addressbook.ui.AddressBookContextMenu
 * @extends Zarafa.core.ui.menu.ConditionalMenu
 * @xtype zarafa.addressbookcontextmenu
 *
 * The context menu for the {@link Zarafa.addressbook.ui.AddressBookPanel AddressBookPanel}.
 */
Zarafa.addressbook.ui.AddressBookContextMenu = Ext.extend(Zarafa.core.ui.menu.ConditionalMenu, {
	// Insertion points for this class
	/**
	 * @insert context.addressbook.contextmenu.actions
	 * Insertion point for adding extra context menu items in this context menu.
	 * @param {Zarafa.addressbook.ui.AddressBookContextMenu} contextmeny This contextmenu
	 */

	/**
	 * @cfg {Boolean} enableSelect Enable the "Select" menu item. This requires a special handler
	 * to be provided which is called when a particular recipient or recipients have been selected.
	 */
	enableSelect : false,

	/**
	 * @cfg {Function} selectHandler Only used when {@link #enableSelect} is true. This function
	 * is called when the "select" button has been pressed. This function will be called with
	 * the selected {@link Ext.data.Record records} as argument.
	 */
	selectHandler : undefined,

	/**
	 * @cfg {Object} selectScope The scope in which {@link #selectHandler} will be called.
	 */
	selectScope : undefined,

	/**
	 * @cfg {Zarafa.core.ui.ContentPanel} contentpanel The content panel from where the contextmenu is requested
	 */
	dialog : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			items: [{
				xtype: 'zarafa.conditionalitem',
				text: _('Select'),
				// iconCls: FIXME
				beforeShow : function(item, records) { item.setDisabled(!this.enableSelect); },
				handler: this.onSelect,
				scope: this
			},{
				xtype: 'zarafa.conditionalitem',
				text: _('Show Details'),
				iconCls: 'icon_contact',
				singleSelectOnly: true,
				handler: this.onOpenDetails,
				scope: this
			},{
				xtype: 'menuseparator'
			},
			container.populateInsertionPoint('context.addressbook.contextmenu.actions', this)
			]
		});

		Zarafa.addressbook.ui.AddressBookContextMenu.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler which is called when the "Select" item has been selected. This
	 * will obtain the current {@link #records} and pass them to {@link #selectHandler}.
	 * @private
	 */
	onSelect : function()
	{
		if (Ext.isFunction(this.selectHandler)) {
			this.selectHandler.call(this.selectScope || this, this.records);
		}
	},

	/**
	 * Event handler which is called when the "Details" item has been selected. This
	 * will obtain the current {@link #records} and use them to open the
	 * {@link Zarafa.addressbook.Actions#openDetailsContent details dialog}.
	 * @private
	 */
	onOpenDetails : function()
	{
		Zarafa.addressbook.Actions.openDetailsContent(this.records);
	}
});

Ext.reg('zarafa.addressbookcontextmenu', Zarafa.addressbook.ui.AddressBookContextMenu);
