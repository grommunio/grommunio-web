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
	addressBookStore : undefined,

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
	 * @cfg {Boolean} singleSelect true to allow selection of only one row at a time (defaults to false allowing multiple selections)
	 */
	singleSelect : false,

	/**
	 * The text that will be shown in the grid when the user has to do a search before
	 * results are shown. (for the GAB when the admin has set DISABLE_FULL_GAB to true)
	 * @property
	 * @type {String}
	 */
	emptyGridText : _('Use the search bar to get results'),

	/**
	 * The text that will be shown in the grid when a search gave no results.
	 * @property
	 * @type {String}
	 */
	noResultsGridText : _('There are no items to show in this list'),

	/**
 	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor : function(config)
	{
		// Let's remove the state settings of the addres book panel once so
		// everyone will start again with the new default settings (januari 2017)
		var sm = container.getSettingsModel();
		var stateUpdated = sm.get('zarafa/v1/contexts/addressbook/stateUpdated');
		if ( Ext.isEmpty(stateUpdated) ){
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
			this.createViewPanel(config.addressBookStore, { singleSelect : Ext.isDefined(config.singleSelect) ? config.singleSelect : this.singleSelect})
		].concat(items);

		Ext.applyIf(config, {
			xtype : 'zarafa.addressbookmainpanel',
			border : false,
			cls: 'k-addressbookmainpanel',
			layout: {
				type:'vbox',
				align:'stretch'
			}
		});

		// Call parent constructor
		Zarafa.addressbook.ui.AddressBookMainPanel.superclass.constructor.call(this, config);

		// Load the addres book
		this.initDialog();

		// When the MainPanel is destroyed, also destroy the store,
		// this ensures that any pending requests will be cancelled.
		this.on('destroy', this.addressBookStore.destroy, this.addressBookStore);
	},

	/**
	 * Initialize the header panel in which the search bar, and the
	 * container selection components are placed which can filter the
	 * contents of the {@link Ext.grid.GridPanel gridpanel}.
	 * @return {Object} Configuration object for the header panel
	 * @private
	 */
	createHeaderPanel : function(hideContactsFolders)
	{
		var hierarchyTpl = new Ext.XTemplate(
			'<tpl for=".">',
				'<div class="x-combo-list-item<tpl if="group_header"> k-combo-list-item-header</tpl>">',
					'{depth:indent}{display_name:htmlEncode}',
				'</div>',
			'</tpl>',
			{
				compiled : true
			}
		);

		return {
			xtype: 'panel',
			cls: 'k-addressbookmainpanel-header',
			border: false,
			layout: 'hbox',
			items: [{
				xtype: 'trigger',
				ref : '../searchText',
				flex: 1,
				hideFieldLabel : true,
				enableKeyEvents : true,
				triggerClass : 'icon_search',
				triggerScope: this,
				onTriggerClick: this.onSearchButtonClick.createDelegate(this),
				wrapFocusClass: '',
				listeners:{
					scope: this,
					render : this.onRenderSearchField,
					keyup : this.onSearchTextFiledKeyUp
				}
			},{
				xtype: 'spacer',
				width: 30,
				height: 10
			},{
				xtype: 'container',
				width: 355,
				items: [{
					xtype : 'combo',
					width: 200,
					plugins: [ 'zarafa.fieldlabeler', 'zarafa.comboautowidth' ],
					fieldLabel: _('Show Names from the'),
					labelWidth : 150,
					editable : false,
					mode : 'local',
					triggerAction : 'all',
					store : Zarafa.addressbook.AddressBookHierarchyStore,
					displayField : 'display_name',
					valueField : 'entryid',
					ref : '../../addressBookSelectionCB',
					tpl : hierarchyTpl,
					autoSelect : true,
					minListWidth : 150,
					listeners:{
						beforeselect: this.onBeforeSelectAddressBook,
						select: this.onAddressBookChange,
						scope: this
					},
					onLoad : this.onAddressBookComboLoad.createDelegate(this, [hideContactsFolders])
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
	createViewPanel : function(addressBookStore, viewConfig)
	{
		return Ext.apply(viewConfig, {
			xtype: 'zarafa.addressbookgrid',
			hideLabel: true,
			name: 'viewpanel',
			cls: 'k-addressbookmainpanel-grid',
			viewConfig : {
				emptyText: this.emptyGridText,
				deferEmptyText: false
			},
			store : addressBookStore,
			border : false,
			ref : 'viewPanel',
			flex : 1
		});
	},

	/**
	 * Obtain the {@link Ext.grid.GridPanel gridpanel} which is used within this
	 * {@link Ext.Panel panel}.
	 * @return {Zarafa.addressbook.ui.AddressBookGrid} The GridPanel for this panel
	 */
	getGridPanel : function()
	{
		return this.viewPanel;
	},

	/**
	 * Event handler for the render event of the searchfield. Will add a placeholder
	 * attribute to the input.
	 */
	onRenderSearchField : function(triggerField)
	{
		triggerField.getEl().set({'placeholder': _('Search...')});
	},

	/**
	 * Event handler for the onbeforeselect event of the Address Book combo. Will
	 * make sure group headers cannot be selected.
	 *
	 * @param {Ext.form.ComboBox} combo The Address Book combobox
	 * @param {Zarafa.core.data.IPMRecord IPMRecord} record The selected Address Book record
	 * @param {Number} index The index of the selected record in the combo
	 */
	onBeforeSelectAddressBook : function(combo, record, index)
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
	onAddressBookChange : function(field, record, index)
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
	onAddressBookComboLoad : function(hideContactsFolders){
		if ( hideContactsFolders === true ){
			Zarafa.addressbook.AddressBookHierarchyStore.filter('type', 'gab');
		} else {
			Zarafa.addressbook.AddressBookHierarchyStore.clearFilter();
		}

		Ext.form.ComboBox.prototype.onLoad.call(this.addressBookSelectionCB);
	},

	/**
	 * Initializes the dialog by selecting the default address book in the dropdown
	 * and triggering a search to fill the grid.
	 * @private
	 */
	initDialog : function()
	{
		var record;

		// Check that addressBookSelectionCB is created
		if (!Ext.isDefined(this.addressBookSelectionCB)) {
			return;
		}

		// Check that we have at least obtained one item
		if (Zarafa.addressbook.AddressBookHierarchyStore.getCount() === 0) {
			return;
		}

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
		this.viewPanel.on('render', this.onSearchButtonClick, this);
	},

	/**
	 * Event handler which is triggered when the searchButton is
	 * clicked, The handler will send request to server to search
	 * in addressbook
	 * @private
	 */
	onSearchButtonClick : function()
	{
		var selectedFolder = this.getSelectedFolderRecord();
		if ( !Ext.isDefined(selectedFolder) ){
			return;
		}

		var folderType = selectedFolder.get('type');
		var fullGabDisabled = container.getServerConfig().isFullGabDisabled();
		var searchText = (this.searchText.getValue() || '').trim();

		// Do not load when we are doing a GAB load without a search text
		// and the admin has configured to not load the GAB in that case
		if ( folderType === 'gab' && fullGabDisabled && Ext.isEmpty(searchText) ){
			this.viewPanel.getView().emptyText = '<div class="emptytext">' + this.emptyGridText + '</div>';
			this.addressBookStore.removeAll();
			return;
		}

		this.viewPanel.getView().emptyText = '<div class="emptytext">' + this.noResultsGridText + '</div>';

		this.addressBookStore.load({
			actionType : Zarafa.core.Actions['list'],
			params: {
				subActionType : Zarafa.core.Actions['globaladdressbook'],
				entryid : selectedFolder.get('entryid'),
				store_entryid : selectedFolder.get('store_entryid'),
				restriction : Ext.applyIf({searchstring : searchText}, this.listRestriction),
				folderType: folderType
			}
		});
	},

	/**
	 * Returns the currently selected folder in the hierarchy combobox
	 *
	 *@return {Zarafa.core.data.IPMRecord IPMRecord} The selected record from the
	 * {#hierarchyStore}
	 */
	getSelectedFolderRecord : function()
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
	onSearchTextFiledKeyUp : function(field, e)
	{
		if (e.getKey() === e.ENTER) {
			this.onSearchButtonClick();
		}
	}
});

Ext.reg('zarafa.addressbookmainpanel', Zarafa.addressbook.ui.AddressBookMainPanel);
