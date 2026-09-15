/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * #dependsFile client/grommunio/contact/ContactContextModel.js
 */
Ext.namespace('Grommunio.contact');

/**
 * @class Grommunio.contact.ContactContext
 * @extends Grommunio.core.Context
 * This class will be used as a controller between {@link Grommunio.contact.ContactContextModel ContactContextModel}
 * and {@link Grommunio.contact.ui.ContactMainPanel ContactMainPanel}
 */
Grommunio.contact.ContactContext = Ext.extend(Grommunio.core.Context, {
	// Insertion points for this class
	/**
	 * @insert main.maintoolbar.view.contact
	 * Insertion point for populating the main toolbar with a View button. This item is only visible
	 * when this context is active.
	 * @param {Grommunio.mail.ContactContext} context This context
	 */

	/**
	 * When searching, this property marks the {@link Grommunio.core.Context#getCurrentView view}
	 * which was used before {@link #onSearchStart searching started} the view was switched to
	 * {@link Grommunio.contact.data.Views#SEARCH}.
	 * @property
	 * @type Mixed
	 * @private
	 */
	oldView: undefined,

	/**
	 * When searching, this property marks the {@link Grommunio.core.Context#getCurrentViewMode viewmode}
	 * which was used before {@link #onSearchStart searching started} the viewmode was switched to
	 * {@link Grommunio.contact.data.ViewModes#SEARCH}.
	 * @property
	 * @type Mixed
	 * @private
	 */
	oldViewMode: undefined,

	/*
	 * @constructor
	 * @param {Object} config configuration object
	 */
	constructor: function(config)
	{
		config = config || {};
		Ext.applyIf(config, {
			current_view: Grommunio.contact.data.Views.LIST,
			current_view_mode: Grommunio.contact.data.ViewModes.NORMAL
		});

		// The "New contact" and "New distribution list" buttons which are available in all contexts
		this.registerInsertionPoint('main.maintoolbar.new.item', this.createNewContactButton, this);
		this.registerInsertionPoint('main.maintoolbar.new.item', this.createNewDistributionListButton, this);

		// Context menu button to add a recipient as contact
		this.registerInsertionPoint('context.common.recipientfield.contextmenu.actions', this.createContactFromRecipientButton, this);

		// Recipient hover card button to add a recipient as contact
		this.registerInsertionPoint('context.common.recipientfield.hovercardview.actions', this.createContactFromHoverCardRecipientButton, this);
		// The tab in the top tabbar
		this.registerInsertionPoint('main.maintabbar.left', this.createMainTab, this);

		Grommunio.contact.ContactContext.superclass.constructor.call(this, config);

		// Add a tree control showing a list of contact folders to the navigation panel.
		// The control will be shown when the user selects the contact context from the button panel.
		this.registerInsertionPoint('navigation.center', this.createContactNavigationPanel, this);

		// Register contact specific dialog types
		Grommunio.core.data.SharedComponentType.addProperty('contact.detailsparser');
		Grommunio.core.data.SharedComponentType.addProperty('contact.dialog.contact.namedetails');
		Grommunio.core.data.SharedComponentType.addProperty('contact.dialog.contact.addressdetails');
		Grommunio.core.data.SharedComponentType.addProperty('contact.dialog.contact.phonedetails');
		Grommunio.core.data.SharedComponentType.addProperty('contact.dialog.distlist.externalmember');
		Grommunio.core.data.SharedComponentType.addProperty('contact.dialog.options');

		// If additional prefix added by user in config.php file than append it into existing prefix's list
		var prefix = container.getServerConfig().getContactPrefix();
		if (Ext.isDefined(prefix) && Array.isArray(prefix)) {
			Grommunio.contact.data.config.Prefix = Grommunio.contact.data.config.Prefix.concat(prefix);
		}

		// If additional suffix added by user in config.php file than append it into existing suffix's list
		var suffix = container.getServerConfig().getContactSuffix();
		if (Ext.isDefined(suffix) && Array.isArray(suffix)) {
			Grommunio.contact.data.config.Suffix = Grommunio.contact.data.config.Suffix.concat(suffix);
		}
	},

	/**
	 * @return {Grommunio.contact.ContactContextModel} the contact context model
	 */
	getModel: function()
	{
		if (!Ext.isDefined(this.model)) {
			this.model = new Grommunio.contact.ContactContextModel();
			this.model.on({
				'searchstart': this.onModelSearchStart,
				'searchstop': this.onModelSearchStop,
				scope: this
			});
		}
		return this.model;
	},

	/**
	 * Event handler for the {@link #model}#{@link Grommunio.core.ContextModel#searchstart searchstart} event.
	 * This will {@link #switchView switch the view} to {@link Grommunio.contact.data.Views#SEARCH search mode}.
	 * The previously active {@link #getCurrentView view} will be stored in the {@link #oldView} and will
	 * be recovered when the {@link #onModelSearchStop search is stopped}.
	 * @param {Grommunio.core.ContextModel} model The model which fired the event
	 * @private
	 */
	onModelSearchStart: function(model)
	{
		if(this.getCurrentView() !== Grommunio.contact.data.Views.SEARCH && this.getCurrentViewMode() !== Grommunio.contact.data.ViewModes.SEARCH){
			this.oldView = this.getCurrentView();
			this.oldViewMode = this.getCurrentViewMode();
			this.switchView(Grommunio.contact.data.Views.SEARCH, Grommunio.contact.data.ViewModes.SEARCH);
		}
	},

	/**
	 * Event handler for the {@link #model}#{@link Grommunio.core.ContextModel#searchstop searchstop} event.
	 * This will {@link #switchView switch the view} to the {@link #oldView previous view}.
	 * @param {Grommunio.core.ContextModel} model The model which fired the event
	 * @private
	 */
	onModelSearchStop: function(model)
	{
		this.switchView(this.oldView, this.oldViewMode);
		delete this.oldView;
		delete this.oldViewMode;
	},

	/**
	 * Bid for the type of shared component and the given record.
	 * @param {Grommunio.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Number} The bid for the shared component
	 */
	bidSharedComponent: function(type, record)
	{
		var bid = -1;

		if (Array.isArray(record)) {
			record = record[0];
		}

		switch (type) {
			// Bid for create/view dialog for opening contact/distlist records
			case Grommunio.core.data.SharedComponentType['common.create']:
			case Grommunio.core.data.SharedComponentType['common.view']:
			case Grommunio.core.data.SharedComponentType['common.preview']:
				if (record instanceof Grommunio.core.data.IPMRecord && record.isMessageClass([ 'IPM.Contact', 'IPM.DistList' ], true)) {
					bid = 1;
				// If the guid of the entryid indicates this record comes from the Contact Provider
				// then we also want this record. This happens when opening an Addressbook record.
				} else if (record instanceof Grommunio.core.data.MAPIRecord) {
					var entryid = record.get('entryid');
					if(entryid && Grommunio.core.EntryId.hasContactProviderGUID(entryid)) {
						bid = 1;
					}
				}
				break;
			// Bid for specific contact dialogs
			case Grommunio.core.data.SharedComponentType['contact.dialog.contact.namedetails']:
			case Grommunio.core.data.SharedComponentType['contact.dialog.contact.addressdetails']:
			case Grommunio.core.data.SharedComponentType['contact.dialog.contact.phonedetails']:
			case Grommunio.core.data.SharedComponentType['contact.dialog.distlist.externalmember']:
				bid = 1;
				break;
			case Grommunio.core.data.SharedComponentType['contact.dialog.options']:
				if (record instanceof Grommunio.core.data.IPMRecord && record.isMessageClass([ 'IPM.Contact', 'IPM.DistList' ], true)) {
					bid = 1;
				}
				break;
			case Grommunio.core.data.SharedComponentType['common.contextmenu']:
				if (record instanceof Grommunio.core.data.IPMRecord && record.isMessageClass([ 'IPM.Contact', 'IPM.DistList' ], true)) {
					bid = 1;
				} else if(record instanceof Grommunio.core.data.IPMAttachmentRecord && record.isContactPhoto()) {
					bid = 2;
				}
				break;
			case Grommunio.core.data.SharedComponentType['common.printer.renderer']:
				if (record instanceof Grommunio.core.data.IPMRecord && record.get('object_type') === Grommunio.core.mapi.ObjectType.MAPI_MESSAGE) {
					if (record.isMessageClass([ 'IPM.Contact', 'IPM.DistList' ], true)) {
						bid = 1;
					}
				} else if (record instanceof Grommunio.contact.ContactContext) {
					// @todo
					bid = -1;
				}
				break;
			// Bid for the details parser
			case Grommunio.core.data.SharedComponentType['contact.detailsparser']:
				bid = 1;
				break;
			case Grommunio.core.data.SharedComponentType['common.attachment.dialog.attachitem.columnmodel']:
				if (record instanceof Grommunio.hierarchy.data.MAPIFolderRecord) {
					if (record.isContainerClass('IPF.Contact', true)) {
						bid = 1;
					}
				}
				break;
			case Grommunio.core.data.SharedComponentType['common.attachment.dialog.attachitem.textrenderer']:
				if (record instanceof Grommunio.core.data.IPMRecord && record.isMessageClass([ 'IPM.Contact', 'IPM.DistList' ], true)) {
					bid = 1;
				}
				break;
		}
		return bid;
	},

	/**
	 * Will return the reference to the shared component.
	 * Based on the type of component requested a component is returned.
	 * @param {Grommunio.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Ext.Component} Component
	 */
	getSharedComponent: function(type, record)
	{
		var component;
		switch (type) {
			case Grommunio.core.data.SharedComponentType['common.create']:
			case Grommunio.core.data.SharedComponentType['common.view']:
				if (record instanceof Grommunio.core.data.IPMRecord){
					if (record.isMessageClass('IPM.Contact', true)) {
						component = Grommunio.contact.dialogs.ContactContentPanel;
					} else if (record.isMessageClass('IPM.DistList', true)) {
						component = Grommunio.contact.dialogs.DistlistContentPanel;
					}
				} else if (record instanceof Grommunio.core.data.MAPIRecord) {
					var entryid = record.get('entryid');
					if (entryid && Grommunio.core.EntryId.hasContactProviderGUID(entryid)) {
						if (record.get('object_type') === Grommunio.core.mapi.ObjectType.MAPI_MAILUSER) {
							component = Grommunio.contact.dialogs.ContactContentPanel;
						} else if (record.get('object_type') === Grommunio.core.mapi.ObjectType.MAPI_DISTLIST) {
							component = Grommunio.contact.dialogs.DistlistContentPanel;
						}
					}
				}
				break;
			case Grommunio.core.data.SharedComponentType['common.preview']:
				component = Grommunio.contact.ui.ContactPreviewPanel;
				break;
			case Grommunio.core.data.SharedComponentType['contact.dialog.contact.namedetails']:
				component = Grommunio.contact.dialogs.ContactNameContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['contact.dialog.contact.addressdetails']:
				component = Grommunio.contact.dialogs.ContactAddressContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['contact.dialog.contact.phonedetails']:
				component = Grommunio.contact.dialogs.ContactPhoneContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['contact.dialog.distlist.externalmember']:
				component = Grommunio.contact.dialogs.DistlistExternalMemberContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['contact.dialog.options']:
				component = Grommunio.contact.dialogs.ContactOptionsContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['common.contextmenu']:
				if (record instanceof Grommunio.core.data.IPMAttachmentRecord && record.isContactPhoto()){
					component = Grommunio.contact.ui.ContactPhotoContextMenu;
				} else {
					component = Grommunio.contact.ui.ContactContextMenu;
				}
				break;
			case Grommunio.core.data.SharedComponentType['common.printer.renderer']:
				if (record instanceof Grommunio.core.data.IPMRecord && record.get('object_type') === Grommunio.core.mapi.ObjectType.MAPI_MESSAGE) {
					if (record.isMessageClass('IPM.Contact', true)) {
						component = Grommunio.contact.printer.ContactRenderer;
					} else {
						component = Grommunio.contact.printer.DistlistRenderer;
					}
				} else {
					component = undefined; // Grommunio.contact.printer.ContactCardViewRenderer;
				}
				break;
			case Grommunio.core.data.SharedComponentType['contact.detailsparser']:
				component = Grommunio.contact.data.ContactDetailsParser;
				break;
			case Grommunio.core.data.SharedComponentType['common.attachment.dialog.attachitem.columnmodel']:
				component = Grommunio.contact.attachitem.AttachContactColumnModel;
				break;
			case Grommunio.core.data.SharedComponentType['common.attachment.dialog.attachitem.textrenderer']:
				if (record.isMessageClass('IPM.DistList', true)) {
					component = Grommunio.contact.attachitem.AttachDistlistRenderer;
				} else {
					component = Grommunio.contact.attachitem.AttachContactRenderer;
				}
				break;
		}
		return component;
	},

	/**
	 * Creates the contact tree that is shown when the user selects the contact context from the
	 * button panel. It shows a tree of available contact folders that can be checked and unchecked.
	 * @private
	 */
	createContactNavigationPanel: function()
	{
		return {
			xtype: 'grommunio.contextnavigation',
			context: this,
			items: [{
				xtype: 'panel',
				id: 'grommunio-navigationpanel-contacts-navigation',
				cls: 'grommunio-context-navigation-block',
				layout: 'fit',
				items: [{
					xtype: 'grommunio.hierarchytreepanel',
					id: 'grommunio-navigationpanel-contacts-navigation-tree',
					model: this.getModel(),
					IPMFilter: 'IPF.Contact',
					contextFavorites: true,
					hideDeletedFolders: true,
					enableDD: true,
					enableItemDrop: true,
					deferredLoading: true,
					bbarConfig: {
						defaultSelectedSharedFolderType: Grommunio.hierarchy.data.SharedFolderTypes['CONTACT'],
						buttonText: _('Open Shared Contacts')
					}
				}]
			}]
		};
	},

	/**
	 * enable the content panel when a context switch happens
	 * @param {Grommunio.hierarchy.data.MAPIFolderRecord} folder folder to bid on.
	 * @return {Number} returns a number which is used for bidding for a folder, highest bidder
	 * will be allowed to show the contents
	 */
	bid: function(folder)
	{
		// the folder contains items of type IPF.Contact, return 1
		if (folder.isContainerClass('IPF.Contact', true)) {
			return 1;
		}

		// return -1, don't handle this content type
		return -1;
	},

	/**
	 * this will create a content panel, which is a container for all the views
	 * @return {Object} configuration object to create {@link Grommunio.contact.ui.ContactMainPanel ContactMainPanel}
	 */
	createContentPanel: function()
	{
		// create object of ContactMainPanel that will create the views
		return {
			xtype: 'grommunio.contactmainpanel',
			id: 'grommunio-mainpanel-contentpanel-contacts',
			context: this
		};
	},

	/**
	 * Returns the buttons for the dropdown list of the VIEW-button in the main toolbar. It will use the
	 * main.maintoolbar.view.contact insertion point to allow other plugins to add their items at the end.
	 *
	 * @return {Ext.Component[]} an array of components
	 */
	getMainToolbarViewButtons: function()
	{
		var items = container.populateInsertionPoint('main.maintoolbar.view.contact', this) || [];

		var defaultItems = [{
			id: 'grommunio-maintoolbar-view-contacts-businesscards',
			text: _('Business Cards'),
			overflowText: _('Business Cards'),
			iconCls: 'icon_contact_card_view',
			valueView: Grommunio.contact.data.Views.ICON,
			valueViewMode: Grommunio.contact.data.ViewModes.BUSINESS,
			valueDataMode: Grommunio.contact.data.DataModes.CHARACTER_RESTRICT,
			handler: this.onContextSelectView,
			scope: this
		},{
			id: 'grommunio-maintoolbar-view-contacts-phonlist',
			text: _('Phone List'),
			overflowText: _('Phone List'),
			iconCls: 'icon_contact_list',
			valueView: Grommunio.contact.data.Views.LIST,
			valueViewMode: Grommunio.contact.data.ViewModes.NORMAL,
			valueDataMode: Grommunio.contact.data.DataModes.ALL,
			handler: this.onContextSelectView,
			scope: this
		}];

		return defaultItems.concat(items);
	},

	/**
	 * Event handler which is fired when one of the View buttons
	 * has been pressed. This will call {@link Grommunio.contact.ContactContext#setView setView}
	 * to update the view.
	 * @param {Ext.Button} button The button which was pressed
	 * @private
	 */
	onContextSelectView: function(button)
	{
		this.getModel().setDataMode(button.valueDataMode);
		this.switchView(button.valueView, button.valueViewMode);
	},

	/**
	 * Create "New Contact" {@link Ext.menu.MenuItem item} for the "New item"
	 * {@link Ext.menu.Menu menu} in the {@link Grommunio.core.ui.MainToolbar MainToolbar}.
	 * This button should be shown in all {@link Grommunio.core.Context contexts} and
	 * is used to create a new contact.
	 *
	 * @return {Object} The menu item for creating a new contact item
	 * @static
	 */
	createNewContactButton: function()
	{
		return {
			xtype: 'menuitem',
			id: 'grommunio-maintoolbar-newitem-contact',
			text: _('Contact'),
			tooltip: _('Contact') + Grommunio.core.KeyMapMgr.formatShortcutHint('Ctrl + Alt + C', false),
			plugins: 'grommunio.menuitemtooltipplugin',
			handler: function()
			{
				Grommunio.contact.Actions.openCreateContactContent(this.getModel());
			},
			scope: this,
			iconCls: 'icon_new_contact',
			newMenuIndex: 3,
			context: 'contact'
		};
	},

	/**
	 * Create "Add to contact list" item for {@link Grommunio.common.recipientfield.ui.RecipientContextMenu contextmenu}
	 * in when opening a context menu on a recipient field
	 *
	 * @param {String} insertionPoint The name of the insertion point
	 * @param {Grommunio.common.recipientfield.ui.RecipientContextMenu} contextMenu The context menu
	 * @return {Object} The menu item for creating a new context menu contact item
	 * @static
	 */
	createContactFromRecipientButton: function(insertionPoint, contextMenu)
	{
		return {
			xtype: 'grommunio.conditionalitem',
			text: _('Add to contacts'),
			iconCls: 'icon_new_contact',
			handler: Grommunio.contact.Actions.openRecipientContactContent,
			scope: this
		};
	},

	/**
	 * Create "Add to contact list" item for {@link Grommunio.common.recipientfield.ui.RecipientHoverCardView recipienthovercardview}
	 * in when opening a recipienthovercard
	 *
	 * @param {String} insertionPoint The name of the insertion point
	 * @param {Grommunio.common.recipientfield.ui.RecipientHoverCardView} recipienthovercardview
	 * @return {Object} The button for creating a new {@link Grommunio.common.recipientfield.ui.RecipientHoverCardButton recipienthovercardbutton}
	 * @static
	 */
	createContactFromHoverCardRecipientButton: function(insertionPoint, recipienthovercardview)
	{
		return {
			xtype: 'grommunio.recipienthovercardbutton',
			iconCls: 'icon_new_contact',
			tooltip: _('Add to contacts'),
			handler: Grommunio.contact.Actions.openRecipientContactContent,
			scope: this
		};
	},

	/**
	 * Populates the View button in the main toolbar
	 * @return {Array} items The menu items available for printing in this context
	 */
	getMainToolbarPrintButtons: function()
	{
		var items = container.populateInsertionPoint('main.toolbar.print.contact', this) || [];

		var defaultItems = [{
			xtype:'grommunio.conditionalitem',
			id: 'grommunio-maintoolbar-print-selectedcontact',
			overflowText: _('Print selected contact'),
			iconCls: 'icon_print_contact',
			tooltip: _('Print selected contact') + Grommunio.core.KeyMapMgr.formatShortcutHint('Ctrl + P', true),
			plugins: 'grommunio.menuitemtooltipplugin',
			text: _('Print selected contact'),
			hideOnDisabled: false,
			singleSelectOnly: true,
			handler: this.onPrintSelected.createDelegate(this, [_('No contact selected')], 2),
			scope: this
		}];

		return defaultItems.concat(items);
	},

	/**
	 * Create "New distribution list" {@link Ext.menu.MenuItem item} for the "New item"
	 * {@link Ext.menu.Menu menu} in the {@link Grommunio.core.ui.MainToolbar MainToolbar}.
	 * This button should be shown in all {@link Grommunio.core.Context contexts} and
	 * is used to create a new distribution list.
	 *
	 * @return {Object} The menu item for creating a new distribution item
	 * @static
	 */
	createNewDistributionListButton: function(context)
	{
		//create new Distribution list button, as we don't want support create Distribution list function in Milestone 6 launch
		return {
			xtype: 'menuitem',
			id: 'grommunio-maintoolbar-newitem-distlist',
			tooltip: _('Distribution list') + Grommunio.core.KeyMapMgr.formatShortcutHint('Ctrl + Alt + D', false),
			plugins: 'grommunio.menuitemtooltipplugin',
			text: _('Distribution list'),
			handler: function()
			{
				Grommunio.contact.Actions.openCreateDistlistContent(this.getModel());
			},
			scope: this,
			iconCls: 'icon_new_distlist',
			newMenuIndex: 3,
			context: 'contact'
		};
	},

	/**
	 * Adds a button to the top tab bar for this context.
	 * @return {Object} The button for the top tabbar
	 * @private
	 */
	createMainTab: function()
	{
		return {
			text: this.getDisplayName(),
			tabOrderIndex: 4,
			context: this.getName(),
			id: 'mainmenu-button-contacts'
		};
	},

	/**
	 * Event handler which is executed right before the {@link #viewmodechange}
	 * event is fired. This will check which {@link Grommunio.contact.data.ViewModes ViewMode}
	 * was applied and thus which kind of {@link Grommunio.core.ContextModel#groupBy grouping}
	 * must be applied to the {@link #model}.
	 *
	 * @param {Grommunio.core.Context} context The context which fired the event.
	 * @param {Mixed} newViewMode The selected View Mode.
	 * @param {Mixed} oldViewMode The previously selected View Mode.
	 * @private
	 */
	onViewModeChange: function(context, newViewMode, oldViewMode)
	{
		var model = this.getModel();

		switch (newViewMode) {
			case Grommunio.contact.data.ViewModes.SEARCH:
			case Grommunio.contact.data.ViewModes.NORMAL:
				model.clearGrouping();
				break;
			case Grommunio.contact.data.ViewModes.GROUP_CATEGORY:
				model.groupBy('categories');
				break;
			case Grommunio.contact.data.ViewModes.GROUP_COMPANY:
				model.groupBy('company_name');
				break;
			case Grommunio.contact.data.ViewModes.GROUP_LOCATION:
				model.groupBy('office_location');
				break;
		}
	}
});

Grommunio.onReady(function() {
	container.registerContext(new Grommunio.core.ContextMetaData({
		name: 'contact',
		displayName: _('Contacts'),
		allowUserVisible: false,
		pluginConstructor: Grommunio.contact.ContactContext
	}));
});
