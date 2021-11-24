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
	enableSelect: false,

	/**
	 * @cfg {Function} selectHandler Only used when {@link #enableSelect} is true. This function
	 * is called when the "select" button has been pressed. This function will be called with
	 * the selected {@link Ext.data.Record records} as argument.
	 */
	selectHandler: undefined,

	/**
	 * @cfg {Object} selectScope The scope in which {@link #selectHandler} will be called.
	 */
	selectScope: undefined,

	/**
	 * @cfg {Zarafa.core.ui.ContentPanel} contentpanel The content panel from where the contextmenu is requested
	 */
	dialog: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			items: [{
				xtype: 'zarafa.conditionalitem',
				text: _('Select'),
				// iconCls: FIXME
				beforeShow: function(item, records) { item.setDisabled(!this.enableSelect); },
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
				container.populateInsertionPoint('context.addressbook.contextmenu.actions', this),
			{
				xtype: 'menuseparator'
			},{
				xtype: 'zarafa.conditionalitem',
				text: _('Copy contact'),
				iconCls: 'icon_copy',
				hidden: true,
				beforeShow: this.onBeforeShowItem,
				singleSelectOnly: true,
				handler: this.onCopyContact,
				scope: this
			}]
		});

		Zarafa.addressbook.ui.AddressBookContextMenu.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler which is called when the "Select" item has been selected. This
	 * will obtain the current {@link #records} and pass them to {@link #selectHandler}.
	 * @private
	 */
	onSelect: function()
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
	onOpenDetails: function()
	{
		Zarafa.addressbook.Actions.openDetailsContent(this.records);
	},

	/**
	 * Event handler triggers before the item shows. Disable the item "Copy contact" if selected contacts are not GAB contact.
	 *
	 * @param {Zarafa.core.ui.menu.ConditionalItem} item The item to enable/disable
	 * @param {Zarafa.core.data.IPMRecord[]} records The records which must be checked
	 * to see if the item must be enabled or disabled.
	 * @private
	 */
	onBeforeShowItem: function (item, records) {
		var isGABContact = this.selectedFolderType === 'gab';
		if (isGABContact && records.length > 1) {
			item.setText(_("Copy contacts"));
			// When multiple items are selected from the addressbook
			// check atleast one GAB contact is selected.
			var hasGABContact = records.some(function(record){
				return record.get('object_type') === Zarafa.core.mapi.ObjectType.MAPI_MAILUSER;
			});

			item.setVisible(isGABContact && hasGABContact);
			return;
		}

		var hasDistlist = records.some(function(record){
			return record.get('object_type') === Zarafa.core.mapi.ObjectType.MAPI_DISTLIST;
		});
		item.setVisible(isGABContact && !hasDistlist);
	},

	/**
	 * Handler triggered when user click on "Copy contact" context menu item.
	 * It will open the {@link Zarafa.hierarchy.dialogs.FolderSelectionContentPanel FolderSelectionContentPanel} to select
	 * the folder to copy GAB contact.
	 */
	onCopyContact: function ()
	{
		Zarafa.hierarchy.Actions.openFolderSelectionContent({
			folder: container.getHierarchyStore().getDefaultFolder('contact'),
			hideTodoList: true,
			hideSearchFolders: true,
			IPMFilter: 'IPF.Contact',
			permissionFilter: Zarafa.core.mapi.Rights.RIGHTS_CREATE,
			callback: this.copyContactCallback,
			scope: this,
			modal: true
		});
	},

	/**
	 * Callback function called when ok button pressed of {@link Zarafa.hierarchy.dialogs.FolderSelectionPanel FolderSelectionPanel}.
	 * It will create the contact record and set necessary properties from the GAB contact.
	 *
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} The selected folder
	 */
	copyContactCallback: function (folder)
	{
		var model = container.getContextByName("contact").getModel();
		var store = container.getShadowStore();
		for (var record of this.records) {
			if (record.get('object_type') === Zarafa.core.mapi.ObjectType.MAPI_DISTLIST) {
				continue;
			}

			var contactRecord = model.createRecord(folder);
			contactRecord.set("fileas", record.get("full_name"));
			contactRecord.set("email_address_1", record.get("smtp_address"));
			contactRecord.set("address_type", "SMTP");
			contactRecord.set("email_address_type_1", "SMTP");
			contactRecord.set("given_name", record.get("given_name"));
			contactRecord.set("surname", record.get("surname"));
			contactRecord.set("display_name", record.get("display_name"));
			contactRecord.set("subject", record.get("display_name"));
			contactRecord.set("title", record.get("title"));
			contactRecord.set("department_name", record.get("department_name"));
			contactRecord.set("office_location", record.get("office_location"));
			contactRecord.set("primary_fax_number", record.get("primary_fax_number"));
			contactRecord.set("home_telephone_number", record.get("home_telephone_number"));
			contactRecord.set("pager_telephone_number", record.get("pager_telephone_number"));

			// Required to set the message action to update some of the props
			// from server side because when unopened address book record has
			// limited information so copied contact does not have all the information.
			contactRecord.addMessageAction("action_type", "copyToContact");
			contactRecord.addMessageAction("source_entryid", record.get("entryid"));
			contactRecord.updateAddressbookProps();

			store.add(contactRecord);
		}
		store.save();
	}
});

Ext.reg('zarafa.addressbookcontextmenu', Zarafa.addressbook.ui.AddressBookContextMenu);
