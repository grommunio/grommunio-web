Ext.namespace('Zarafa.addressbook.ui');

/**
 * @class Zarafa.addressbook.ui.AddressBookMainPanel
 * @extends Ext.Panel
 * @xtype zarafa.addressbookmainpanel
 */
Zarafa.addressbook.ui.AddressBookMainPanel = Ext.extend(Ext.Panel, {
	/**
	 * @cfg {Zarafa.addressbook.AddressBookStore} addressBookStore
	 * The store which should be used for displaying the contents of the
	 * addressbook inside the grid. If not provided, a new store will
	 * allocated.
	 */
	addressBookStore: undefined,

	/**
	 * @cfg (Boolean) Set to true to hide contacts folders in the address book
	 * hierarchy dropdown.
	 */
	hideContactsFolders: false,

	/**
	 * @cfg {Object} listRestriction The default restriction which
	 * must be send to the server side when obtaining a fresh list
	 * from the server. This can be used to restrict the visibility
	 * of users, groups, companies etc.
	 */
	listRestriction: undefined,

	/**
	 * @cfg {Boolean} singleSelect true to allow selection of only one row at a time (defaults to false allowing multiple selections)
	 */
	singleSelect: false,

	/**
	 * The text that will be shown in the grid when the user has to do a search before
	 * results are shown. (for the GAB when the admin has set ENABLE_FULL_GAB to false)
	 * @property
	 * @type {String}
	 */
	emptyGridText: _('Use the search bar to get results'),

	/**
	 * The text that will be shown in the grid when a search gave no results.
	 * @property
	 * @type {String}
	 */
	noResultsGridText: _('There are no items to show in this list'),

	/**
 	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor: function(config)
	{
		// Let's remove the state settings of the address book panel once so
		// everyone will start again with the new default settings (januari 2017)
		var sm = container.getSettingsModel();
		var stateUpdated = sm.get('zarafa/v1/contexts/addressbook/stateUpdated');
		if ( Ext.isEmpty(stateUpdated) ) {
			sm.remove('zarafa/v1/state/dialogs/addressbookcontentpanel');
			sm.remove('zarafa/v1/state/dialogs/abuserselectioncontentpanel');
			sm.remove('zarafa/v1/state/gab/contacts');
			sm.remove('zarafa/v1/state/gab/globaladdressbook');
			sm.set('zarafa/v1/contexts/addressbook/stateUpdated', 1);
		}

		config = config || {};

		if (!Ext.isDefined(config.addressBookStore)) {
			config.addressBookStore = new Zarafa.addressbook.AddressBookStore();
		}

		var items = config.items || [];
		// whatever items passed in config should be added at last place
		config.items = [
			this.createHeaderPanel(config.hideContactsFolders),
			this.createViewPanel(config.addressBookStore, { singleSelect: Ext.isDefined(config.singleSelect) ? config.singleSelect : this.singleSelect})
		].concat(items);

		Ext.applyIf(config, {
			xtype: 'zarafa.addressbookmainpanel',
			border: false,
			cls: 'k-addressbookmainpanel',
			layout: {
				type:'vbox',
				align:'stretch'
			}
		});

		// Call parent constructor
		Zarafa.addressbook.ui.AddressBookMainPanel.superclass.constructor.call(this, config);

		// Load the address book
		this.initDialog();

		// When shared stores are added/removed in the hierarchy, keep the
		// AB hierarchy dropdown in sync.
		this.hierarchyStore = container.getHierarchyStore();
		this.hierarchyStore.on('remove', this.onHierarchyStoreRemove, this);
		this.hierarchyStore.on('addFolder', this.onHierarchyFolderChange, this);
		this.hierarchyStore.on('removeFolder', this.onHierarchyFolderChange, this);

		// When the MainPanel is destroyed, also destroy the store,
		// this ensures that any pending requests will be cancelled.
		this.on('destroy', this.onMainPanelDestroy, this);
	},

	/**
	 * Called when a shared store is removed from the hierarchy (e.g. user
	 * closes a shared store). Directly removes matching entries from the
	 * AB hierarchy store to avoid a race condition with the server-side
	 * closesharedfolder action.
	 *
	 * @param {Zarafa.hierarchy.data.HierarchyStore} store The hierarchy store
	 * @param {Zarafa.hierarchy.data.MAPIStoreRecord} record The removed store record
	 * @param {Number} index The index from where the record was removed
	 * @private
	 */
	onHierarchyStoreRemove: function(store, record)
	{
		var storeEntryId = record.get('store_entryid');
		if (!storeEntryId) {
			return;
		}

		// Find all AB hierarchy entries that belong to the removed store
		var toRemove = [];
		Zarafa.addressbook.AddressBookHierarchyStore.each(function(r) {
			if (r.get('store_entryid') === storeEntryId) {
				toRemove.push(r);
			}
		});

		if (toRemove.length > 0) {
			Zarafa.addressbook.AddressBookHierarchyStore.remove(toRemove);

			// Clean up group headers that no longer have any children
			var emptyHeaders = [];
			var count = Zarafa.addressbook.AddressBookHierarchyStore.getCount();
			Zarafa.addressbook.AddressBookHierarchyStore.each(function(r, index) {
				if (index > 0 && r.get('depth') === 0) {
					if (index === count - 1 ||
						Zarafa.addressbook.AddressBookHierarchyStore.getAt(index + 1).get('depth') === 0) {
						emptyHeaders.push(r);
					}
				}
			});

			if (emptyHeaders.length > 0) {
				Zarafa.addressbook.AddressBookHierarchyStore.remove(emptyHeaders);
			}
		}
	},

	/**
	 * Called when a folder is added to or removed from the hierarchy.
	 * Reloads the AB hierarchy from the server if the folder is a
	 * contact folder (IPF.Contact).
	 *
	 * @param {Zarafa.hierarchy.data.HierarchyStore} hierarchyStore The hierarchy store
	 * @param {Zarafa.hierarchy.data.MAPIStoreRecord} storeRecord The store containing the folder
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord/Array} records The added/removed folder(s)
	 * @private
	 */
	onHierarchyFolderChange: function(hierarchyStore, storeRecord, records)
	{
		if (!records) {
			return;
		}
		if (!Array.isArray(records)) {
			records = [records];
		}

		for (var i = 0; i < records.length; i++) {
			var containerClass = records[i].get ? records[i].get('container_class') : '';
			if (containerClass && containerClass.indexOf('IPF.Contact') === 0) {
				Zarafa.addressbook.AddressBookHierarchyStore.loadAddressBookHierarchy();
				return;
			}
		}
	},

	/**
	 * Cleanup handler when the panel is destroyed. Removes hierarchy store
	 * listeners and destroys the address book store.
	 * @private
	 */
	onMainPanelDestroy: function()
	{
		this.hierarchyStore.un('remove', this.onHierarchyStoreRemove, this);
		this.hierarchyStore.un('addFolder', this.onHierarchyFolderChange, this);
		this.hierarchyStore.un('removeFolder', this.onHierarchyFolderChange, this);
		this.addressBookStore.destroy();
	},

	/**
	 * Initialize the header panel in which the search bar, and the
	 * container selection components are placed which can filter the
	 * contents of the {@link Ext.grid.GridPanel gridpanel}.
	 * @return {Object} Configuration object for the header panel
	 * @private
	 */
	createHeaderPanel: function(hideContactsFolders)
	{
		var hierarchyTpl = new Ext.XTemplate(
			'<tpl for=".">',
				'<div class="x-combo-list-item<tpl if="group_header"> k-combo-list-item-header</tpl>">',
					'{depth:indent}{display_name:htmlEncode}',
				'</div>',
			'</tpl>',
			{
				compiled: true
			}
		);

		return {
			xtype: 'panel',
			cls: 'k-addressbookmainpanel-header',
			border: false,
			layout: 'hbox',
			items: [{
				xtype: 'trigger',
				ref: '../searchText',
				flex: 1,
				hideFieldLabel: true,
				enableKeyEvents: true,
				triggerClass: 'icon_magnifier',
				triggerScope: this,
				onTriggerClick: this.onSearchButtonClick.createDelegate(this),
				wrapFocusClass: '',
				listeners:{
					scope: this,
					render: this.onRenderSearchField,
					keyup: this.onSearchTextFiledKeyUp
				}
			},{
				xtype: 'spacer',
				width: 30,
				height: 10
			},{
				xtype: 'container',
				width: 355,
				items: [{
					xtype: 'combo',
					width: 200,
					plugins: [ 'zarafa.fieldlabeler', 'zarafa.comboautowidth' ],
					fieldLabel: _('Show Names from the'),
					labelWidth: 150,
					listClass: 'k-addressbook-combo-list',
					editable: false,
					mode: 'local',
					triggerAction: 'all',
					store: Zarafa.addressbook.AddressBookHierarchyStore,
					displayField: 'display_name',
					valueField: 'entryid',
					ref: '../../addressBookSelectionCB',
					tpl: hierarchyTpl,
					autoSelect: true,
					minListWidth: 150,
					listeners:{
						beforeselect: this.onBeforeSelectAddressBook,
						select: this.onAddressBookChange,
						scope: this
					},
					onLoad: this.onAddressBookComboLoad.createDelegate(this, [hideContactsFolders])
				}]
			}]
		};
	},

	/**
	 * Initialize View Panel which shows the grid of the address book items
	 * in the selected container.
	 * @param {Zarafa.addressbook.AddressBookStore} addressBookStore The store which must
	 * be displayed in the GridPanel.
	 * @param {Object} viewConfig config options for view panel
	 * be displayed in the GridPanel.
	 * @return {Object} The Configuration object for the {@link Ext.grid.GridPanel gridpanel}
	 * @private
	 */
	createViewPanel: function(addressBookStore, viewConfig)
	{
		return Ext.apply(viewConfig, {
			xtype: 'zarafa.addressbookgrid',
			hideLabel: true,
			name: 'viewpanel',
			cls: 'k-addressbookmainpanel-grid',
			viewConfig: {
				emptyText: this.emptyGridText,
				deferEmptyText: false
			},
			store: addressBookStore,
			border: false,
			ref: 'viewPanel',
			flex: 1
		});
	},

	/**
	 * Obtain the {@link Ext.grid.GridPanel gridpanel} which is used within this
	 * {@link Ext.Panel panel}.
	 * @return {Zarafa.addressbook.ui.AddressBookGrid} The GridPanel for this panel
	 */
	getGridPanel: function()
	{
		return this.viewPanel;
	},

	/**
	 * Event handler for the render event of the searchfield. Will add a placeholder
	 * attribute to the input.
	 */
	onRenderSearchField: function(triggerField)
	{
		triggerField.getEl().set({'placeholder': _('Search…')});
	},

	/**
	 * Event handler for the onbeforeselect event of the Address Book combo. Will
	 * make sure group headers cannot be selected.
	 *
	 * @param {Ext.form.ComboBox} combo The Address Book combobox
	 * @param {Zarafa.core.data.IPMRecord IPMRecord} record The selected Address Book record
	 * @param {Number} index The index of the selected record in the combo
	 */
	onBeforeSelectAddressBook: function(combo, record, index)
	{
		return !record.get('group_header');
	},

	/**
	 * Event handler which is triggered when the addressbook
	 * combobox has been used to change the selected addressbook
	 *
	 * @param {Ext.form.ComboBox} field The combobox which was selected
	 * @param {Zarafa.core.data.IPMRecord} record The selected Record
	 * @param {Number} The index number of the selected record.
	 * @private
	 */
	onAddressBookChange: function(field, record, index)
	{
		// Trigger a search
		this.onSearchButtonClick();
	},

	/**
	 * Overriding the onLoad function of the combobox to be able to use the filter
	 * on the store of the combobox. The doQuery function of {@Ext.form.ComboBox}
	 * will clear the filter before calling onLoad, so we set it in this
	 * override.
	 */
	onAddressBookComboLoad: function(hideContactsFolders) {
		if ( hideContactsFolders === true ) {
			Zarafa.addressbook.AddressBookHierarchyStore.filter('type', 'gab');
		} else {
			Zarafa.addressbook.AddressBookHierarchyStore.clearFilter();
		}

		Ext.form.ComboBox.prototype.onLoad.call(this.addressBookSelectionCB);
	},

	/**
	 * Initializes the dialog by reloading the AB hierarchy (to pick up any
	 * shared store changes), selecting the default address book in the
	 * dropdown, and triggering a search to fill the grid.
	 * @private
	 */
	initDialog: function()
	{
		// Check that addressBookSelectionCB is created
		if (!Ext.isDefined(this.addressBookSelectionCB)) {
			return;
		}

		// Always reload the AB hierarchy to pick up changes (shared stores
		// opened/closed, contact folders created/deleted since last load).
		Zarafa.addressbook.AddressBookHierarchyStore.on('load', this.selectDefaultAddressBook, this, {single: true});
		Zarafa.addressbook.AddressBookHierarchyStore.loadAddressBookHierarchy();
	},

	/**
	 * Selects the default address book in the combo box and triggers the
	 * initial search. Called after the AB hierarchy store has been reloaded.
	 * @private
	 */
	selectDefaultAddressBook: function()
	{
		// Check that we have at least obtained one item
		if (Zarafa.addressbook.AddressBookHierarchyStore.getCount() === 0) {
			return;
		}

		var record;

		// Get the entryId of default address book configured in setting
		var folderEntryId = container.getSettingsModel().get('zarafa/v1/main/default_addressbook');

		// If there is no configuration for default address book into setting,
		// than we by default displays the 'Global Address Book'
		if (!Ext.isEmpty(folderEntryId)) {
			record = Zarafa.addressbook.AddressBookHierarchyStore.getById(folderEntryId);
		}

		if (Ext.isEmpty(record)) {
			record = Zarafa.addressbook.AddressBookHierarchyStore.getAt(0);
		}

		var entryid = record.get('entryid');
		if (!Ext.isDefined(entryid)) {
			return;
		}

		this.addressBookSelectionCB.setValue(entryid);

		// Trigger a search when the grid has been rendered. We do this
		// because Ext 'forgets' to add the scrollOfset to an empty grid
		// when the store fires the load event, but it does do this when
		// rendering an empty grid on start. Since we don't want the
		// emptyText to jump because of this we will make sure the store
		// fires the load event when the grid is rendered and not before
		// it is rendered.
		if (this.viewPanel.rendered) {
			this.onSearchButtonClick();
		} else {
			this.viewPanel.on('render', this.onSearchButtonClick, this);
		}
	},

	/**
	 * Event handler which is triggered when the searchButton is
	 * clicked, The handler will send request to server to search
	 * in addressbook
	 * @private
	 */
	onSearchButtonClick: function()
	{
		var selectedFolder = this.getSelectedFolderRecord();
		if ( !Ext.isDefined(selectedFolder) ) {
			return;
		}

		var folderType = selectedFolder.get('type');
		var fullGabDisabled = container.getServerConfig().isFullGabDisabled();
		var searchText = (this.searchText.getValue() || '').trim();

		// Do not load when we are doing a GAB load without a search text
		// and the admin has configured to not load the GAB in that case
		if ( folderType === 'gab' && fullGabDisabled && Ext.isEmpty(searchText) ) {
			this.viewPanel.getView().emptyText = '<div class="emptytext">' + this.emptyGridText + '</div>';
			this.addressBookStore.removeAll();
			return;
		}

		this.viewPanel.getView().emptyText = '<div class="emptytext">' + this.noResultsGridText + '</div>';

		var params = {
			subActionType: Zarafa.core.Actions['globaladdressbook'],
			entryid: selectedFolder.get('entryid'),
			store_entryid: selectedFolder.get('store_entryid'),
			restriction: Ext.applyIf({searchstring: searchText}, this.listRestriction),
			folderType: folderType
		};

		if (folderType === 'contacts' || folderType === 'sharedcontacts') {
			var folderId = selectedFolder.get("entryid");
			var lookupEntryId;

			// Only unwrap entry IDs that are wrapped by the AB Contact Provider.
			// Direct store entry IDs (raw) should be used as-is.
			if (folderType === 'contacts' && Zarafa.core.EntryId.hasContactProviderGUID(folderId)) {
				lookupEntryId = Zarafa.core.EntryId.unwrapContactProviderEntryId(folderId);
			} else {
				lookupEntryId = folderId;
			}

			var folder = container.getHierarchyStore().getFolder(lookupEntryId);
			if (folder) {
				var isSharedStore = folder.getMAPIStore().isSharedStore() || folder.getMAPIStore().isPublicStore();
				if (isSharedStore) {
					params["isSharedFolder"] = isSharedStore;
					params["sharedFolder"] = {
						store_entryid: folder.get("store_entryid")
					};
				}
			} else if (folderType === 'sharedcontacts' && selectedFolder.get('store_entryid')) {
				// Fallback: use store_entryid from the addressbook hierarchy record
				params["isSharedFolder"] = true;
				params["sharedFolder"] = {
					store_entryid: selectedFolder.get("store_entryid")
				};
			}
		}

		this.addressBookStore.load({
			actionType: Zarafa.core.Actions['list'],
			params: params
		});
	},

	/**
	 * Returns the currently selected folder in the hierarchy combobox
	 *
	 *@return {Zarafa.core.data.IPMRecord IPMRecord} The selected record from the
	 * {#hierarchyStore}
	 */
	getSelectedFolderRecord: function()
	{
		var entryid = this.addressBookSelectionCB.getValue();
		var index = Zarafa.addressbook.AddressBookHierarchyStore.find('entryid', entryid);
		return Zarafa.addressbook.AddressBookHierarchyStore.getAt(index);
	},

	/**
	 * Event handler which is triggered when
	 * a key is pressed in the searchTextField
	 *
	 * @param {Ext.form.TextField} field
	 * @param {Ext.EventObject} e
	 * @private
	 */
	onSearchTextFiledKeyUp: function(field, e)
	{
		if (e.getKey() === e.ENTER) {
			this.onSearchButtonClick();
		}
	}
});

Ext.reg('zarafa.addressbookmainpanel', Zarafa.addressbook.ui.AddressBookMainPanel);
