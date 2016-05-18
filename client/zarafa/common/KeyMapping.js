/*
 * #dependsFile client/zarafa/core/KeyMapMgr.js
 */
Ext.namespace('Zarafa.common');

/**
 * @class Zarafa.common.KeyMapping
 * @extends Object
 *
 * The map of keys used for global functionalities.
 * @singleton
 */
Zarafa.common.KeyMapping = Ext.extend(Object, {

	/**
	 * @constructor
	 */
	constructor: function()
	{
		var numberKeys = [
			// number keys from main keyboard
			Ext.EventObject.ZERO, Ext.EventObject.ONE, Ext.EventObject.TWO,
			Ext.EventObject.THREE, Ext.EventObject.FOUR, Ext.EventObject.FIVE,
			Ext.EventObject.SIX, Ext.EventObject.SEVEN, Ext.EventObject.EIGHT,
			Ext.EventObject.NINE,
			// number keys from numpad
			Ext.EventObject.NUM_ZERO, Ext.EventObject.NUM_ONE, Ext.EventObject.NUM_TWO,
			Ext.EventObject.NUM_THREE, Ext.EventObject.NUM_FOUR, Ext.EventObject.NUM_FIVE,
			Ext.EventObject.NUM_SIX, Ext.EventObject.NUM_SEVEN, Ext.EventObject.NUM_EIGHT,
			Ext.EventObject.NUM_NINE
		];

		var mainTabBar = [{
			key: numberKeys,
			ctrl: true,
			alt: false,
			shift: false,
			// Overwrites the browser behavior to switch between tabs
			stopEvent: true,
			handler: this.onSwitchContexts,
			scope: this,
			settingsCfg : {
				description : _('Switch between different contexts e.g. inbox, calendar, etc.'),
				category : _('Basic navigation')
			}
		}];

		var mainToolbarKeys = [{
			key: numberKeys,
			ctrl: true,
			alt: true,
			shift: false,
			stopEvent: true,
			handler: this.onSwitchViews,
			scope: this,
			settingsCfg : {
				description : _('Switch between different views'),
				category : _('Basic navigation')
			}
		},{
			key: Ext.EventObject.N,
			ctrl: true,
			alt: true,
			shift: false,
			stopEvent: true,
			handler: this.onNewItem,
			scope: this,
			settingsCfg : {
				description : _('New item'),
				category : _('Creating an item')
			}
		},{
			key: Ext.EventObject.F5,
			ctrl: false,
			alt: false,
			shift: false,
			stopEvent: true,
			handler: this.onRefresh,
			scope: this,
			settingsCfg : {
				description : _('Refresh'),
				category : _('All views')
			},
			basic: true
		}];

		var contentPanelActionsKeys = [{
			key: Ext.EventObject.W,
			ctrl: true,
			alt: true,
			shift: false,
			stopEvent: true,
			handler: this.onCloseCurrentMainContentTab,
			scope: this,
			settingsCfg : {
				description : _('Close tab'),
				category : _('Basic navigation')
			}
		}];

		var defaultPrintMessageKey = [{
			key: Ext.EventObject.P,
			ctrl: true,
			alt: false,
			shift: false,
			// Overwrites the browser behavior of opening print dialog
			stopEvent: true,
			handler: this.onPrintItem,
			scope: this,
			settingsCfg : {
				description : _('Print item'),
				category : _('Items')
			},
			basic: true
		}];

		var defaultRecordActionsKeys = [{
			key: Ext.EventObject.S,
			ctrl: true,
			alt: false,
			shift: false,
			// Overwrites the browser behavior of opening save dialog
			stopEvent: true,
			handler: this.onSaveTabItem,
			scope: this,
			settingsCfg : {
				description : _('Save an item e.g. mail, contact, etc.'),
				category : _('Items')
			},
			basic: true
		}];

		var defaultMessageActionsKeys = [{
			key: Ext.EventObject.ENTER,
			ctrl: true,
			alt: false,
			shift: false,
			stopEvent: true,
			handler: this.onSendTabItem,
			scope: this,
			settingsCfg : {
				description : _('Send an item e.g. mail, meeting request, etc.'),
				category : _('Items')
			},
			basic: true
		}];

		var selectionKey = [{
			key: Ext.EventObject.A,
			ctrl: true,
			alt: false,
			shift: false,
			// Overwrites the browser behavior to select everything
			stopEvent: true,
			// enable this key combination globally because we will be having a different
			// key binding to disable ctrl + a in global scope
			enableGlobally : true,
			handler: this.onSelectAll,
			scope: this,
			settingsCfg : {
				description : _('Select all items'),
				category : _('All views')
			},
			basic: true
		},{
			key: Ext.EventObject.HOME,
			ctrl: false,
			alt: false,
			shift: true,
			handler: this.onSelectUpDown,
			scope: this,
			settingsCfg : {
				description : _('Extend the selection to the first item in the list'),
				category : _('All views')
			}
		},{
			key: Ext.EventObject.END,
			ctrl: false,
			alt: false,
			shift: true,
			handler: this.onSelectUpDown,
			scope: this,
			settingsCfg : {
				description : _('Extend the selection to the last item in the list'),
				category : _('All views')
			}
		}];

		var mapiMessageKeys = [{
			key: Ext.EventObject.ENTER,
			ctrl: false,
			alt: false,
			shift: false,
			stopEvent: true,
			enableGlobally : true,
			handler: this.onOpenItem,
			scope: this,
			settingsCfg : {
				description : _('Open selected item'),
				category : _('All views')
			},
			basic: true
		},{
			key: Ext.EventObject.G,
			ctrl: true,
			alt: false,
			shift: false,
			stopEvent: true,
			handler: this.onCategorize,
			scope: this,
			settingsCfg : {
				description : _('Open dialog to categorize selected item'),
				category : _('All views')
			}
		},{
			key: Ext.EventObject.P,
			ctrl: true,
			alt: true,
			shift: false,
			// Overwrites the browser behavior of opening print dialog
			stopEvent: true,
			handler: this.onPrintList,
			scope: this,
			settingsCfg : {
				description : _('Print list'),
				category : _('All views')
			}
		},{
			key: Ext.EventObject.P,
			ctrl: true,
			alt: false,
			shift: false,
			// Overwrites the browser behavior of opening print dialog
			stopEvent: true,
			handler: this.onPrintListItem,
			scope: this,
			settingsCfg : {
				description : _('Print selected item'),
				category : _('All views')
			},
			basic: true
		},{
			key: Ext.EventObject.M,
			ctrl: true,
			alt: false,
			shift: false,
			stopEvent: true,
			handler: this.onMoveItem,
			scope: this,
			settingsCfg : {
				description : _('Open copy/move dialog'),
				category : _('All views')
			}
		},{
			key: Ext.EventObject.DELETE,
			ctrl: false,
			alt: false,
			shift: false,
			stopEvent: true,
			enableGlobally : true,
			handler: this.onDeleteItem,
			scope: this,
			settingsCfg : {
				description : _('Delete selected item'),
				category : _('All views')
			},
			basic: true
		}];

		var reminderKeys = [{
			key: Ext.EventObject.ENTER,
			ctrl: false,
			alt: false,
			shift: false,
			stopEvent: true,
			enableGlobally: true,
			handler: this.onOpenReminder,
			scope: this
			// not specifying settingsCfg as we already have an entry of opening item in all views
		}];

		Zarafa.core.KeyMapMgr.register('global', mainTabBar);
		Zarafa.core.KeyMapMgr.register('global', mainToolbarKeys);

		Zarafa.core.KeyMapMgr.register('grid', selectionKey);
		Zarafa.core.KeyMapMgr.register('view.mapimessage', selectionKey);

		Zarafa.core.KeyMapMgr.register('grid.mapimessage', mapiMessageKeys);
		Zarafa.core.KeyMapMgr.register('view.mapimessage', mapiMessageKeys);
		Zarafa.core.KeyMapMgr.register('grid.reminder', reminderKeys);

		Zarafa.core.KeyMapMgr.register('contentpanel', contentPanelActionsKeys);
		Zarafa.core.KeyMapMgr.register('contentpanel.record', defaultPrintMessageKey);
		Zarafa.core.KeyMapMgr.register('contentpanel.record', defaultRecordActionsKeys);
		Zarafa.core.KeyMapMgr.register('contentpanel.record.message', defaultMessageActionsKeys);

		Zarafa.core.KeyMapMgr.register('previewpanel.mail', defaultPrintMessageKey);
	},

	/**
	 * Event handler for the keydown event of the {@link Zarafa.core.KeyMap KeyMap}
	 * when the user wants to create a new item.
	 * @param {Number} key Key code
	 * @param {Ext.EventObject} event The event
	 * @param {Ext.Component} component The component on which key event is fired.
	 */
	onNewItem: function(key, event, component)
	{
		var newButton = container.getMainPanel().mainToolbar.newButton;
		newButton.handler.call(newButton.scope);
	},

	/**
	 * Event handler for the keydown event of the {@link Zarafa.core.KeyMap KeyMap}
	 * when the user wants to refresh the view.
	 * @param {Number} key Key code
	 * @param {Ext.EventObject} event The event
	 * @param {Ext.Component} component The component on which key event is fired.
	 */
	onRefresh: function(key, event, component)
	{
		var refreshButton = container.getMainPanel().mainToolbar.refreshButton;

		if(!refreshButton.isVisible()) {
			// don't call handler if button is hidden
			return;
		}

		refreshButton.handler.call(refreshButton.scope);
	},

	/**
	 * Event handler for the keydown event of the {@link Zarafa.core.KeyMap KeyMap}
	 * when the user wants to switch between {@link Zarafa.core.Context Contexts}.
	 * @param {Number} key Key code
	 * @param {Ext.EventObject} event The event
	 * @param {Ext.Component} component The component on which key event is fired.
	 */
	onSwitchContexts: function(key, event, component)
	{
		var itemNumber = parseInt(event.getKeyCharCode(), 10);
		var mainTabBar = container.getMainPanel().mainTabBar;
		var item, items = mainTabBar.find('type', 'button');
		item = items[itemNumber];
		
		if(item && item.handler && item.handler !== mainTabBar.onLogoutButton){
			item.handler.call(item.scope || item);
		}
	},

	/**
	 * Event handler for the keydown event of the {@link Zarafa.core.KeyMap KeyMap}
	 * when the user wants to switch between the available views.
	 * @param {Number} key Key code
	 * @param {Ext.EventObject} event The event
	 * @param {Ext.Component} component The component on which key event is fired.
	 */
	onSwitchViews: function(key, event, component)
	{
		// Get key number which was pressed, we need to decrease it by one
		// as in views array we have first view saved at '0' index.
		var itemNumber = parseInt(event.getKeyCharCode(), 10) - 1;
		var activeContext = container.getCurrentContext();

		// Get the view buttons directly from the Context
		var item, items = activeContext.getMainToolbarViewButtons();
		item = items[itemNumber];

		if(item && item.handler){
			item.handler.call(item.scope || item, item);
		}
	},

	/**
	 * Event handler for the keydown event of the {@link Zarafa.core.KeyMap KeyMap}
	 * when the user wants to close the current tab he has open in the
	 * {@link Zarafa.core.ui.MainContentTabPanel MainContentTabPanel}.
	 * @param {Number} key Key code
	 * @param {Ext.EventObject} event The event
	 * @param {Ext.Component} component The component on which key event is fired.
	 */
	onCloseCurrentMainContentTab: function(key, event, component)
	{
		if(component.closable) {
			component[component.closeAction]();
		}
	},

	/**
	 * Event handler for the keydown event of the {@link Zarafa.core.KeyMap KeyMap}
	 * when the user wants to send the item that is open in the
	 * {@link Zarafa.core.ui.MessageContentPanel MessageContentPanel}.
	 * @param {Number} key Key code
	 * @param {Ext.EventObject} event The event
	 * @param {Ext.Component} component The component on which key event is fired.
	 */
	onSendTabItem: function(key, event, component)
	{
		if(Ext.isFunction(component.sendRecord)) {
			component.sendRecord();
		}
	},

	/**
	 * Event handler for the keydown event of the {@link Zarafa.core.KeyMap KeyMap} 
	 * when the user wants to save the item that is open in the
	 * {@link Zarafa.core.ui.RecordContentPanel RecordContentPanel}.
	 * @param {Number} key Key code
	 * @param {Ext.EventObject} event The event
	 * @param {Ext.Component} component The component on which key event is fired.
	 */
	onSaveTabItem: function(key, event, component)
	{
		if(Ext.isFunction(component.saveRecord)) {
			component.saveRecord();
		}
	},

	/**
	 * Event handler for the keydown event of the {@link Zarafa.core.KeyMap KeyMap}
	 * when the user wants to print an item.
	 * @param {Number} key Key code
	 * @param {Ext.EventObject} event The event
	 * @param {String} context The name of the context the key is pressed in
	 * @param {Ext.Component} component The component on which key event is fired.
	 */
	onPrintItem: function(key, event, component)
	{
		if(component.record){
			Zarafa.common.Actions.openPrintDialog(component.record);
		}
	},

	/**
	 * Event handler for the keydown event of the {@link Ext.KeyMap KeyMap}
	 * when the user wants to print a list of items.
	 * @param {Number} key Key code
	 * @param {Ext.EventObject} event The event
	 * @param {String} context The name of the context the key is pressed in
	 * @param {Ext.Component} component The component on which key event is fired.
	 */
	onPrintList: function(key, event, component)
	{
		// Currently Print List functionality is only available with task,
		// In future, Print List will be implemented for all the Contexts.
		if (component.context) {
			Zarafa.common.Actions.openPrintDialog(component.context);
		}
	},

	/**
	 * Helper function to get selected records from component.
	 * @param {Ext.Component} component The component on which key event is fired.
	 * @return {Ext.data.Record[]} The records which are selected int the view.
	 * @private
	 */
	getSelectedRecords : function (component)
	{
		if(Ext.isFunction(component.getSelectedRecords)) {
			return component.getSelectedRecords();
		} else if(Ext.isFunction(component.getSelectionModel)) {
			return component.getSelectionModel().getSelections();
		}

		return [];
	},

	/**
	 * Event handler for the keydown event of the {@link Zarafa.core.KeyMap KeyMap}
	 * when the user wants to print selected item.
	 * @param {Number} key Key code
	 * @param {Ext.EventObject} event The event
	 * @param {Ext.Component} component The component on which key event is fired.
	 */
	onPrintListItem: function(key, event, component)
	{
		var records = this.getSelectedRecords(component);

		if(!Ext.isEmpty(records)) {
			Zarafa.common.Actions.openPrintDialog(records);
		}
	},

	/**
	 * Event handler for the keydown event of the {@link Zarafa.core.KeyMap KeyMap}
	 * when the user wants to move an item.
	 * @param {Number} key Key code
	 * @param {Ext.EventObject} event The event
	 * @param {Ext.Component} component The component on which key event is fired.
	 */
	onMoveItem: function(key, event, component)
	{
		var records = this.getSelectedRecords(component);

		if(!Ext.isEmpty(records)) {
			Zarafa.common.Actions.openCopyMoveContent(records);
		}
	},

	/**
	 * Event handler for the keydown event of the {@link Zarafa.core.KeyMap KeyMap}
	 * when the user wants to delete an item.
	 * @param {Number} key Key code
	 * @param {Ext.EventObject} event The event
	 * @param {Ext.Component} component The component on which key event is fired.
	 */
	onDeleteItem: function(key, event, component)
	{
		var records = this.getSelectedRecords(component);

		if(!Ext.isEmpty(records)) {
			Zarafa.common.Actions.deleteRecords(records);
		}
	},

	/**
	 * Event handler for the keydown event of the {@link Ext.KeyMap KeyMap}
	 * when the user wants to categorize an item.
	 * @param {Number} key Key code
	 * @param {Ext.EventObject} event The event
	 * @param {Ext.Component} component The component on which key event is fired.
	 */
	onCategorize: function(key, event, component)
	{
		var records = this.getSelectedRecords(component);

		if(!Ext.isEmpty(records)) {
			Zarafa.common.Actions.openCategoriesContent(records);
		}
	},

	/**
	 * Event handler for the keydown event of the {@link Ext.KeyMap KeyMap}
	 * when the user wants to open an item.
	 * @param {Number} key Key code
	 * @param {Ext.EventObject} event The event
	 * @param {Ext.Component} component The component on which key event is fired.
	 */
	onOpenItem: function(key, event, component)
	{
		var records = this.getSelectedRecords(component);

		if(!Ext.isEmpty(records)) {
			for(var i = 0, len = records.length; i < len; i++){
				if(records[i].isUnsent() && !records[i].isFaultyMessage()) {
					Zarafa.core.data.UIFactory.openCreateRecord(records[i]);
				} else {
					Zarafa.core.data.UIFactory.openViewRecord(records[i]);
				}
			}
		}
	},

	/**
	 * Event handler for the keydown event of the {@link Ext.KeyMap KeyMap}
	 * when the user wants to open an item from reminder dialog.
	 * @param {Number} key Key code
	 * @param {Ext.EventObject} event The event
	 * @param {Ext.Component} component The component on which key event is fired.
	 */
	onOpenReminder: function(key, event, component)
	{
		var records = this.getSelectedRecords(component);
		if(!Ext.isEmpty(records)) {
			for(var i = 0, len = records.length; i < len; i++){
				Zarafa.common.Actions.openReminderRecord(records[i]);
			}
		}
	},

	/**
	 * Event handler for the keydown event of the {@link Ext.KeyMap KeyMap}
	 * when the user wants to select all items below or above the current selected item {@link Zarafa.common.ui.grid.GridPanel}.
	 * @param {Number} key Key code
	 * @param {Ext.EventObject} event The event
	 * @param {Ext.Component} component The component on which key event is fired.
	 */
	onSelectUpDown: function(key, event, component)
	{
		var store = component.getStore();
		var selectionRange = null;

		if(key === Ext.EventObject.HOME) {
			selectionRange = 0;
		} else if (key === Ext.EventObject.END) {
			selectionRange = store.getCount();
		}

		if(Ext.isFunction(component.selectRange)) {
			var selected = component.getSelectedRecords();
			if(!Ext.isEmpty(selected)) {
				component.selectRange(store.indexOf(selected[0]), selectionRange);
			}
		} else if(Ext.isFunction(component.getSelectionModel)) {
			var selectionModel = component.getSelectionModel();
			var selected = selectionModel.getSelected();
			if(selected) {
				if(!selectionModel.singleSelect) {
					// retrieve selected index
					var index = store.indexOf(selected);
					// select range from current item till last range
					selectionModel.selectRange(index,selectionRange);
				}
			}
		}
	},

	/**
	 * Event handler for the keydown event of the {@link Ext.KeyMap KeyMap}
	 * when the user wants to select all items in the {@link Zarafa.common.ui.grid.GridPanel}.
	 * @param {Number} key Key code
	 * @param {Ext.EventObject} event The event
	 * @param {Ext.Component} component The component on which key event is fired.
	 */
	onSelectAll: function(key, event, component)
	{
		if(Ext.isFunction(component.selectRange)) {
			// Select all elements for data-views.
			component.selectRange();
		} else if(Ext.isFunction(component.getSelectionModel)) {
			// Select all elements for components with selection model, e.g. grids.
			var selectionModel = component.getSelectionModel();
			if(!selectionModel.singleSelect) {
				selectionModel.selectAll();
			}
		}
	}
});

Zarafa.common.KeyMapping = new Zarafa.common.KeyMapping();
