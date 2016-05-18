Ext.namespace('Zarafa.addressbook.ui');

/**
 * @class Zarafa.addressbook.ui.AddressBookMainPanel
 * @extends Ext.Panel
 * @xtype zarafa.addressbookmainpanel
 */
Zarafa.addressbook.ui.AddressBookMainPanel = Ext.extend(Ext.Panel, {
	/**
	 * @cfg {Zarafa.addressbook.AddressBookHierarchyStore} hierarchyStore
	 * The hierarchyStore which should be used for displaying the hierarchy
	 * items inside the combobox. If not provided, a new store will be
	 * allocated.
	 */
	hierarchyStore : undefined,

	/**
	 * @cfg {Zarafa.addressbook.AddressBookStore} addressBookStore
	 * The store which should be used for displaying the contents of the
	 * addressbook inside the grid. If not provided, a new store will
	 * allocated.
	 */
	addressBookStore : undefined,

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
	 * @cfg {Boolean} singleSelect true to allow selection of only one row at a time (defaults to false allowing multiple selections)
	 */
	singleSelect : false,

	/**
	 * The LoadMask object which will be shown when the {@link Zarafa.addressbook.AddressBookHierarchyStore HierarchyStore}
	 * is being loaded, and the dialog is waiting for the server to respond with the desired data.
	 * This will only be set if {@link #loadMask} is undefined.
	 * @property
	 * @type Zarafa.common.ui.LoadMask
	 */
	loadMask : undefined,

	/**
 	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		if (!Ext.isDefined(config.hierarchyStore)) {
			config.hierarchyStore = new Zarafa.addressbook.AddressBookHierarchyStore();
		}

		if (!Ext.isDefined(config.addressBookStore)) {
			config.addressBookStore = new Zarafa.addressbook.AddressBookStore();
		}

		var items = config.items || [];
		// whatever items passed in config should be added at last place
		config.items = [
			this.createHeaderPanel(config.hierarchyStore),
			this.createViewPanel(config.addressBookStore, { singleSelect : Ext.isDefined(config.singleSelect) ? config.singleSelect : this.singleSelect})
		].concat(items);

		Ext.applyIf(config, {
			xtype : 'zarafa.addressbookmainpanel',
			border : false,
			bodyStyle: 'padding: 5px;',
			layout: {
				type:'vbox',
				align:'stretch'
			}
		});

		// Call parent constructor
		Zarafa.addressbook.ui.AddressBookMainPanel.superclass.constructor.call(this, config);

		// Register to events
		this.mon(this.hierarchyStore, 'load', this.onHierarchyStoreLoad, this);
		this.on('afterlayout', this.onAfterLayout, this, { single: true });
		this.mon(this.hierarchyStore, 'beforeload', this.showLoadMask, this);

		// When the MainPanel is destroyed, also destroy the store,
		// this ensures that any pending requests will be cancelled.
		this.on('destroy', this.hierarchyStore.destroy, this.hierarchyStore);
		this.on('destroy', this.addressBookStore.destroy, this.addressBookStore);
	},

	/**
	 * Initialize the header panel in which the search bar, and the
	 * container selection components are placed which can filter the
	 * contents of the {@link Ext.grid.GridPanel gridpanel}.
	 * @param {Zarafa.addressbook.AddressBookHierarchyStore} hierarchyStore The store
	 * to be used for the Container Combobox containing the hierarchy.
	 * @return {Object} Configuration object for the header panel
	 * @private
	 */
	createHeaderPanel : function(hierarchyStore)
	{
		var hierarchyTpl = new Ext.XTemplate(
			'<tpl for=".">',
				'<div class="x-combo-list-item">',
					'{depth:indent}{display_name:htmlEncode}',
				'</div>',
			'</tpl>',
			{
				compiled : true
			}
		);

		return {
			xtype: 'panel',
			height : 50,
			border: false,
			layout: 'hbox',
			items: [{
				xtype: 'trigger',
				ref : '../searchText',
				flex: 0.45,
				plugins: [ 'zarafa.fieldlabeler' ],
				fieldLabel : _('Type Name'),
				enableKeyEvents : true,
				triggerClass : 'icon_search',
				triggerScope: this,
				onTriggerClick: this.onSearchButtonClick.createDelegate(this),
				wrapFocusClass: '',
				listeners:{
					scope: this,
					'keyup' : this.onSearchTextFiledKeyUp
				}
			},{
				xtype: 'spacer',
				flex: 0.10,
				height: 10
			},{
				xtype : 'combo',
				flex: 0.45,
				plugins: [ 'zarafa.fieldlabeler', 'zarafa.comboautowidth' ],
				fieldLabel: _('Show Names from the'),
				labelWidth : 150,
				editable : false,
				mode : 'local',
				triggerAction : 'all',
				store : hierarchyStore,
				displayField : 'display_name',
				valueField : 'entryid',
				ref : '../addressBookSelectionCB',
				tpl : hierarchyTpl,
				autoSelect : true,
				minListWidth : 150,
				listeners:{
					'select': this.onAddressBookChange,
					scope: this
				}
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
		var actionTypeParameters = {
			actionType : Zarafa.core.Actions['list'],
			params: {
				subActionType : Zarafa.core.Actions['globaladdressbook'],
				entryid : record.get('entryid'),
				store_entryid : record.get('store_entryid'),
				restriction : Ext.applyIf({}, this.listRestriction),
				folderType: record.get('type')
			}
		};

		this.addressBookStore.load(actionTypeParameters);
	},

	/**
	 * Event handler which is triggered when the layout
	 * for the {@link Ext.Panel panel} has been completed.
	 * @private
	 */
	onAfterLayout : function()
	{
		this.hierarchyStore.load({
			actionType : Zarafa.core.Actions['list'],
			params : {
				subActionType : Zarafa.core.Actions['hierarchy'],
				gab : 'all',
				restriction: Ext.applyIf({}, this.hierarchyRestriction)
			}
		});
	},

	/**
	 * Event handler which is triggered when the Hierarchy Store
	 * has been loaded. This will select the default Hierarchy container
	 * inside the Hierarchy combobox.
	 * @private
	 */
	onHierarchyStoreLoad : function()
	{
		var record;

		// Check that addressBookSelectionCB is created
		if (!Ext.isDefined(this.addressBookSelectionCB)) {
			return;
		}

		// Check that we have at least obtained one item
		if (this.hierarchyStore.getCount() === 0) {
			return;
		}

		// Get the entryId of default address book configured in setting
		var folderEntryId = container.getSettingsModel().get('zarafa/v1/main/default_addressbook');

		// If there is no configuration for default address book into setting,
		// than we by default displays the 'Global Address Book'
		if (!Ext.isEmpty(folderEntryId)) {
			record = this.hierarchyStore.getById(folderEntryId);
		}

		if (Ext.isEmpty(record)) {
			record = this.hierarchyStore.getAt(0);
		}

		// Hiding the load mask of dialog box, and Grid loadMask will be shown.
		this.hideLoadMask();

		this.addressBookStore.load({
			actionType : Zarafa.core.Actions['list'],
			params: {
				subActionType : Zarafa.core.Actions['globaladdressbook'],
				entryid : record.get('entryid'),
				store_entryid : record.get('store_entryid'),
				restriction : Ext.applyIf({}, this.listRestriction),
				folderType: record.get('type')
			}
		});

		var entryid = record.get('entryid');
		if (!Ext.isDefined(entryid)) {
			return;
		}

		this.addressBookSelectionCB.setValue(entryid);
	},

	/**
	 * Event handler which is triggered when the searchButton is
	 * clicked, The handler will send request to server to search
	 * in addressbook
	 * @private
	 */
	onSearchButtonClick : function()
	{
		var searchText = this.searchText.getValue().trim();
		this.addressBookStore.load({
			actionType : Zarafa.core.Actions['list'],
			params: {
				subActionType : Zarafa.core.Actions['globaladdressbook'],
				restriction : Ext.applyIf({searchstring : searchText}, this.listRestriction),
				folderType: this.addressBookStore.lastOptions.params.folderType
			}
		});
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
		}/* @TODO: Auto select and set focus to addressbook entry which
			partially matches to the entered search text.
		else {
			this.addressBookStore.filter('display_name', field.getValue(), true);
		}*/
	},

	/**
	 * If {@link #loadMask} is not undefined, this function will display the {@link #loadMask}.
	 * @protected
	 */
	showLoadMask : function()
	{
		if (!this.loadMask) {
			this.loadMask = new Zarafa.common.ui.LoadMask(this.el);
		}

		this.loadMask.show();
	},

	/**
	 * If {@link #LoadMask} is defined, this function will hide the {@link #loadMask}.
	 * @protected
	 */
	hideLoadMask : function()
	{
		if (this.loadMask) {
			this.loadMask.hide();
		}
	}
});

Ext.reg('zarafa.addressbookmainpanel', Zarafa.addressbook.ui.AddressBookMainPanel);
