Ext.namespace('Zarafa.core.ui');

/**
 * @class Zarafa.core.ui.MainToolbar
 * @extends Zarafa.core.ui.Toolbar
 * @xtype zarafa.maintoolbar
 */
Zarafa.core.ui.MainToolbar = Ext.extend(Zarafa.core.ui.Toolbar, {
	// Insertion points for this class
	/**
	 * @insert main.maintoolbar.new.item
	 * Insertion point for populating the "New item" menu. It will be placed in the item part of the
	 * list. Each item inserted to this list is accessible from all contexts.
	 * @param {Zarafa.core.ui.MainToolbar} toolbar This toolbar
	 */
	/**
	 * @insert main.maintoolbar.new.folder
	 * Insertion point for populating the "New item" menu. It will be placed in the folder part of
	 * the list. Each item inserted to this list is accessible from all contexts.
	 * @param {Zarafa.core.ui.MainToolbar} toolbar This toolbar
	 */
	/**
	 * @insert main.toolbar.actions
	 * Insertion point for populating the main toolbar with buttons. It will be added after the
	 * NEW-button and before the VIEW-buttons.
	 */
	/**
	 * @insert main.toolbar.actions.last
	 * Insertion point for populating the main toolbar with buttons. It will be added after the
	 * VIEW-buttons.
	 */

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// Override from Ext.Component
			xtype: 'zarafa.maintoolbar',
			id : 'zarafa-maintoolbar',
			cls : 'zarafa-maintoolbar'
		});

		Zarafa.core.ui.MainToolbar.superclass.constructor.call(this, config);

		this.initButtonGroups();
	},

	/**
	 * Add default button groups to toolbar
	 * @private
	 */
	initButtonGroups : function()
	{
		// Initialize the items list with all default buttons, and add buttons which were
		// registered through insertion points.
		this.addNewItems();
		this.addActionItems();
		this.addPrintButton();
		this.addViewItems();
		this.addItems([], 'main.toolbar.actions.last');
	},

	/**
	 * Creates the "New" {@link Ext.Button}. The NEW-button menu consists of three parts. The first
	 * part is the button that will be considered the default button for the active context. The
	 * second part contains items that deal with folders and the last part will deal with the
	 * creation of items.
	 * The menu will be populated by using the main.maintoolbar.new.folder and
	 * main.maintoolbar.new.item insertion points. The first one is for adding items to the second
	 * (folder) part and the latter one is for adding items to the third (item) part of the menu.
	 *
	 * Based on the newMenuIndex property of each button the items are sorted. Based on the text
	 * property, double items are filtered out of the list. When the list contains items a dummy
	 * button and a separator is added at the top of the list. The dummy button will "replace" the
	 * item of the active context. The other item will not be removed, but it will be hidden and
	 * properties like the icon and the handler are also set on the dummy button. This switch is
	 * done when the contexts are switched by the {@link Zarafa.core.Container Container}.
	 * @private
	 */
	addNewItems : function()
	{
		var menu = [];
		var itemMenu = container.populateInsertionPoint('main.maintoolbar.new.item', this) || [];

		// Make sure the items are properly sorted by priority.
		itemMenu = Zarafa.core.Util.sortArray(itemMenu, 'ASC', 'newMenuIndex');

		// Remove doubles
		itemMenu = Zarafa.core.Util.uniqueArray(itemMenu, 'text');

		// menu.length should practically always be non-zero, but
		// just in case, we check it, and add the divider to separate
		// the default buttons from the rest.
		if (itemMenu.length !== 0) {
			// Hide the first item as we copy that to the default button.
			itemMenu[0].hidden = true;
			itemMenu[0].ref = 'defaultButton';
			menu.push({
				xtype: 'menuitem',
				id: 'zarafa-maintoolbar-newitem-defaultbutton',
				tooltip : itemMenu[0].tooltip,
				plugins : 'zarafa.menuitemtooltipplugin',
				// The following config properties copy the first item for the default button.
				iconCls: itemMenu[0].iconCls,
				text: itemMenu[0].text,
				handler : itemMenu[0].handler,
				scope : itemMenu[0].scope
			},
			'-');
		}

		// Add the item list to to the menu
		if (itemMenu.length !== 0) {
			menu = menu.concat(itemMenu);
		}

		this.addItems({
			xtype: 'splitbutton',
			id: 'zarafa-maintoolbar-newitem',
			cls: 'zarafa-action',
			scale: 'large',
			ref: 'newButton',
			rowspan: 2,
			menu: menu,
			listeners: {
				render: this.onRenderNewButton,
				scope: this
			},
			// The following config properties set the first item (that is now item number
			// three in the menu) as the button in the toolbar.
			iconCls: itemMenu[0] ? itemMenu[0].iconCls : undefined,
			handler : itemMenu[0] ? itemMenu[0].handler : undefined,
			scope : itemMenu[0] ? itemMenu[0].scope : undefined
		});
	},

	/**
	 * Adds an event handler to the NEW-button that is registered to the contextswitch event of the
	 * {@link Zarafa.core.Container Container}. This event handler will set the correct icon and
	 * handler for the {@link Ext.SplitButton SplitButton} in the toolbar. It will also add the icon,
	 * handler and text for the first item: the dummy button that holds the default action for the
	 * active context. This event handler is called within the scope of the SplitButton.
	 * It will loop through all the menu items in the last part of the menu and based on the
	 * activate context it will hide or show the menu items. If the button is marked to belong to
	 * the active context it will be hidden and the dummy button  will be changed so it will look
	 * like the button has moved to the top. All other buttons will  remain visible.
	 * If no button is marked to belong to the active context the first button in the list, after
	 * the dummy button and the separator, will become the new default button.
	 * @param {Ext.Component} cmp The SplitButton
	 */
	onRenderNewButton: function(cmp)
	{
		cmp.mon(container, 'contextswitch', this.onNewButtonContextSwitch, this);
		this.onNewButtonContextSwitch(null, container.getCurrentContext(), container.getCurrentContext());
	},

	/**
	 * Fired when the {@link Zarafa.core.Container container} fires the {@link Zarafa.core.Container#contextswitch} event.
	 * This will update the default new button to be shown.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder folder that is loaded for the new context
	 * @param {Zarafa.core.Context} oldContext context that was switched out
	 * @param {Zarafa.core.Context} newContext new context that was switched
	 * @private
	 */
	onNewButtonContextSwitch : function(parameters, oldContext, newContext)
	{
		var menu = this.newButton.menu;

		// The dummy button is the first button in the context menu that shows the button first
		// button registered by the active context.
		var dummyButton = menu.items.itemAt(0);
		// The default button is the button that will be set as the SplitButton if the active
		// context has not registered any buttons. The first button in the item-list will become
		// the default button.
		var defaultButton = menu.defaultButton;
		// Find the index of the default button. From this index on the list will be run down to
		// find the button that should be put as the SplitButton/dummy button.
		var itemIndex = menu.items.indexOf(defaultButton);
		// Use this variable to check whether there has already been assigned
		// a button to the default item. It could be that there are two buttons
		// being set by the same context.
		var button = false;

		// Only loop through the list if the default button is found.
		if(itemIndex >= 0){
			// Loop from the itemIndex onwards.
			for(var i=itemIndex,len=menu.items.length;i<len;i++){
				var item = menu.items.itemAt(i);
				// Only get the first button of the context that is active
				if(button===false && item.context == newContext.getName()){
					button = item;
				// Hide the found button of the active context to prevent doubles
					item.setVisible(false);
				}else{
					// Enable all other buttons
					item.setVisible(true);
				}
			}
		}

		// If no button was found, fall back to the default button
		if(button===false && defaultButton){
			button = defaultButton;
			// Hide the defaultButton so it does not show twice in the menu
			defaultButton.setVisible(false);
		}

		// If we have a button set the SplitButton and the dummy button properties
		if(button!==false){
			// Set the icon class and handler for the button in the toolbar
			this.newButton.setIconClass(button.iconCls);
			this.newButton.setHandler(button.handler, button.scope);

			// Set the default item (first item in the dropdown)
			dummyButton.tooltip = button.tooltip;
			dummyButton.setText(button.text);
			dummyButton.setIconClass(button.iconCls);
			dummyButton.setHandler(button.handler, button.scope);
		}
	},

	/**
	 * Creates the "View" {@link Ext.Button buttons}.
	 * For each context a "View" button will be created which will be populated with the
	 * main.maintoolbar.view.[context]. The first item from that list will also be used to set the
	 * properties like iconCls and handler to the {@link Ext.SplitButton SplitButton}.
	 * @private
	 */
	addViewItems : function()
	{
		var menu, menuItems = [];
		var contexts = container.getContexts();
		for(var i = 0,len = contexts.length; i < len; i++){
			var context = contexts[i];
			menu = context.getMainToolbarViewButtons();
			if (Array.isArray(menu) && menu.length) {
				if (context.groupViewBtns) {
					menuItems.push({
						xtype: 'splitbutton',
						id: 'zarafa-maintoolbar-view-'+context.getName(),
						scale: 'large',
						iconCls: 'view_icon',
						tooltip: _('Switch view') + ' (Ctrl + Alt + 1..9)',
						hidden: true,
						contextName: context.getName(),
						menu: Zarafa.core.Util.uniqueArray(menu, 'text'),
						listeners : {
							render : this.onRenderViewButton
						}
					});
				} else {
					for (var j = 0, jlen = menu.length; j < jlen; j++) {
						var item = Ext.apply({}, menu[j], {
							xtype : 'button',
							scale : 'large',
							hidden : true,
							contextName : context.getName()
						});

						// Move the 'text' property to the tooltip
						var viewCounter = j + 1;
						item.tooltip = item.text + ' (Ctrl + Alt + '+ viewCounter +')';
						delete item.text;

						item.listeners = Zarafa.core.Util.mergeListeners(item.listeners, {
							render : this.onRenderViewButton
						});

						menuItems.push(item);
					}
				}
			}
		}

		this.addItems(menuItems);
	},

	/**
	 * Adds an event handler to the VIEW-button that is registered to the contextswitch event of the
	 * {@link Zarafa.core.Container Container}. This event handler will enable or disable the
	 * VIEW-button based on whether this button belong to the active context. This event handler is
	 * called within the scope of the SplitButton/Button.
	 * @param {Ext.Component} cmp The SplitButton/Button
	 */
	onRenderViewButton: function(cmp)
	{
		cmp.mon(container, 'contextswitch', function(parameters, oldContext, newContext) {
			this.setVisible(this.contextName == newContext.getName());
		}, cmp);
		//we need this line in order to set the visibility correctly as the contextswitch event will not have fired yet
		cmp.setVisible(cmp.contextName === container.getCurrentContext().getName());

		// We want the menu to be toggled when the splitbutton is clicked. We cannot use the regular btn handler
		// for this, since an opened menu will already be closed before the handler is executed and there is
		// no way of knowing anymore if we should open it or not. So we will add a handler for an ordinary
		// mousedown event that gets called when the menu is still open.
		if ( cmp.xtype === 'splitbutton' ){
			cmp.btnEl.on('mousedown', function(){
				if ( cmp.hasVisibleMenu() ){
					cmp.hideMenu();
				} else {
					cmp.showMenu();
				}
			});
		}
	},

	/**
	 * Creates the Print {@link Ext.Button buttons}.
	 * This differs for each context, and is populated with
	 * main.toolbar.view.[context].
	 */
	 addPrintButton : function()
	 {
		 var menu, menuItems = [];
		 var contexts = container.getContexts();
		 for(var i=0,len=contexts.length;i<len;i++){
			var context = contexts[i];
			menu = context.getMainToolbarPrintButtons();
			if(Array.isArray(menu) && menu.length){
				menuItems.push({
					xtype: 'splitbutton',
					id: 'zarafa-maintoolbar-print-'+context.getName(),
					scale: 'large',
					iconCls: 'icon_print',
					tooltip: _('Print') + ' (Ctrl + P)',
					handler: menu[0].handler,
					scope: menu[0].scope,
					hidden: true,
					contextName: context.getName(),
					menu: {
						xtype : 'zarafa.conditionalmenu',
						defaults : {
							context : context,

							// Override getRecords to obtain the
							// records from the current selected records
							getRecords : function() {
								return this.context.getModel().getSelectedRecords();
							}
						},
						items : Zarafa.core.Util.uniqueArray(menu, 'text'),
						// Override this function so the menu will not be destroyed when hidden.
						onMenuHide: Ext.emptyFn
					},
					listeners : {
						render : this.onRenderPrintButton
					}
				});
			}
		}

		this.addItems(menuItems);
	 },

	/**
	 * Adds an event handler to the Print button that is registered to the contextswitch event of the
	 * {@link Zarafa.core.Container Container}. This event handler will enable or disable the
	 * VIEW-button based on whether this button belong to the active context. This event handler is
	 * called within the scope of the SplitButton.
	 * @param {Ext.Component} cmp The SplitButton
	 */
	onRenderPrintButton: function(cmp)
	{
		cmp.mon(container, 'contextswitch', function(parameters, oldContext, newContext) {
			this.setVisible(this.contextName == newContext.getName());
		}, cmp);
		//we need this line in order to set the visibility correctly as the contextswitch event will not have fired yet
		cmp.setVisible(cmp.contextName === container.getCurrentContext().getName());
	},

	/**
	 * Adds the action buttons to the main toolbar. It adds a couple of default buttons by default
	 * and allows to populate the toolbar with more buttons by using the main.maintoolbar.actions
	 * insertion point.
	 * @private
	 */
	addActionItems : function()
	{
		var menuItems = [{
			xtype: 'button',
			id: 'zarafa-maintoolbar-addressbook',
			scale: 'large',
			overflowText: _('Address Book'),
			tooltip: _('Address Book'),
			iconCls: 'icon_addressbook',
			handler : this.onAddressBook,
			scope: this
		},{
			xtype: 'button',
			id: 'zarafa-maintoolbar-refresh',
			scale: 'large',
			title: _('Refresh'),
			overflowText: _('Refresh'),
			tooltip: _('Refresh') + ' (F5)',
			iconCls: 'x-tbar-loading',
			handler : this.onRefresh,
			ref: 'refreshButton',
			scope: this,
			listeners: {
				render: this.onRenderRefreshButton,
				scope: this
			}
		}];

		this.addItems(menuItems, 'main.toolbar.actions');
	},


	/**
	 * Open the {@link Zarafa.addressbook.dialogs.AddressBookContentPanel AddressBookContentPanel}
	 * @private
	 */
	onAddressBook : function()
	{
		Zarafa.addressbook.Actions.openAddressBook();
	},

	/**
	 * This will Refresh the view and fire {@link Zarafa.core.data.ListModuleStore#reload}
	 * @private
	 */
	onRefresh : function()
	{
		var model = container.getCurrentContext().getModel();
		if (model) {
			model.reload();
		}
	},

	/**
	 * This will print the current view
	 * @private
	 */
	onPrint : function()
	{
		var context = container.getCurrentContext();
		if (context) {
			Zarafa.common.Actions.openPrintDialog(context);
		}
	},

	/**
	 * Adds an event handler to the Refresh button that will register the contextswitch event of the
	 * {@link Zarafa.core.Container Container}. This event handler will hide or unhide the
	 * Refresh button based on whether the active context have store or not. This event handler is
	 * called within the scope of the Refresh Button.
	 * @param {Ext.Component} cmp The {@link #refreshButton}
	 */
	onRenderRefreshButton : function(cmp)
	{
		var context = container.getCurrentContext();
		cmp.mon(container, 'contextswitch', function(parameters, oldContext, newContext) {
			var store = newContext.getModel().getStore();
			this.setVisible(Ext.isDefined(store));
		}, cmp);

		//we need this line in order to set the visibility correctly as the contextswitch event will not have fired yet
		var contextModel = context.getModel();
		cmp.setVisible(Ext.isDefined(contextModel) && Ext.isDefined(contextModel.getStore()));
	}
});

Ext.reg('zarafa.maintoolbar', Zarafa.core.ui.MainToolbar);
