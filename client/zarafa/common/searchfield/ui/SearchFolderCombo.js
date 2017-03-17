Ext.ns('Zarafa.common.searchfield.ui');

/**
 * @class Zarafa.common.searchfield.ui.SearchFolderCombo
 * @extends Ext.form.ComboBox
 * @xtype zarafa.searchfoldercombo
 *
 * This class can be used to construct a search folder combo box which
 * manly contains 'All folders', 'Current folder', 'Imported folder' and 'Other..' options.
 * which represent IPM_SUBTREE, currently selected folder in hierarchy, folder which imported
 * in search folder combo box using {@link Zarafa.advancesearch.dialogs.SelectFolderContentPanel SelectFolderContentPanel}
 * respectively. while 'Other...' option used to open the {@link Zarafa.advancesearch.dialogs.SelectFolderContentPanel SelectFolderContentPanel}
 */
Zarafa.common.searchfield.ui.SearchFolderCombo = Ext.extend(Ext.form.ComboBox, {

	/**
	 * The {@link Zarafa.core.ContextModel} which is obtained from the {@link #context}.
	 * @property
	 * @type Zarafa.core.ContextModel
	 */
	model : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		this.model = config.model;
		var defaultStore = container.getHierarchyStore().getDefaultStore();
		var index = 0;
		var subtreeEntryid = '';
		var folderName = '';
		var folderEntryid = '';
		// We have to add this check due to some js unit test. Test are
		// related to when default store/folder not found while loading webapp.
		if (defaultStore) {
			subtreeEntryid = defaultStore.getSubtreeFolder().get('entryid');
			var defaultFolder = this.model.getDefaultFolder();
			if (defaultFolder) {
				folderName = defaultFolder.getDisplayName();
				folderEntryid = defaultFolder.get('entryid');
				if (defaultFolder.getDefaultFolderKey() !== 'inbox' || defaultFolder.getMAPIStore().isSharedStore()) {
					index = 1;
				}
			}
		}

		var searchFolderStore = new Ext.data.JsonStore({
			idIndex: 0,
			idProperty: 'value',
			fields: ['name', 'value', 'flag', 'include_subfolder'],
			data : [{
				'name' : _('All folders'),
				'value' : subtreeEntryid,
				'include_subfolder' : true,
				'flag' : Zarafa.advancesearch.data.SearchComboBoxFieldsFlags.ALL_FOLDERS
			},{
				'name' : Ext.util.Format.htmlEncode(folderName),
				'value' : folderEntryid,
				'include_subfolder' : false,
				'flag' : Zarafa.advancesearch.data.SearchComboBoxFieldsFlags.CURRENT_SELECTED_FOLDER
			},{
				'name' : _('Other...'),
				'value' : 'other'
			}],
			autoDestroy: true
		});

		Ext.apply(config, {
			xtype : 'zarafa.searchfoldercombo',
			mode: 'local',
			ref : 'searchFolderCombo',
			valueField: 'value',
			displayField: 'name',
			store: searchFolderStore,
			triggerAction: 'all',
			value: searchFolderStore.getAt(index).get('value'),
			editable: false,
			width: 100,
			listWidth : 150
		});

		Zarafa.common.searchfield.ui.SearchFolderCombo.superclass.constructor.call(this, config);
	},

	/**
	 * initialize events for the grid panel
	 * @private
	 */
	initEvents : function()
	{
		Zarafa.common.searchfield.ui.SearchFolderCombo.superclass.initEvents.apply(this, arguments);

		this.on('beforeselect', this.onBeforeSelectSearchFolder, this);
		this.mon(this.model, 'folderchange', this.onFolderChange, this);
		this.mon(this.model, 'activate', this.onActiveFolder, this);
		this.mon(container, 'aftercontextswitch', this.onAfterContextSwitch, this);
	},

	/**
	 * Event handler triggered before selection performs in search folder combo
	 * Will open {@link Zarafa.advancesearch.dialogs.SelectFolderContentPanel SelectFolderContentPanel}, if
	 * "Other.." option was selected.
	 *
	 * @param {Zarafa.common.searchfield.ui.SearchFolderCombo} combo The combo which fired the event.
	 * @param {Ext.data.Record} record The data record returned from the underlying store
	 * @param {number} index The index of the selected item in the dropdown list
	 * @return {boolean} true if selected record is not 'Other...' else false.
	 */
	onBeforeSelectSearchFolder : function (combo, record, index)
	{
		if(record.get('value') === 'other') {
			combo.collapse();
			Zarafa.advancesearch.Actions.openSelectSearchFolderDialog({
				searchFolderCombo : combo
			});
			return false;
		}
		return true;
	},

	/**
	 * Event handler triggered when {@link Zarafa.calendar.ui.CalendarMultiView CalendarMultiView}
	 * was activated and user select the calendar by using clicking on tab of calender.
	 * it was used to set the selected calender folder as current folder in search folder combo box.
	 *
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder which will be current folder in search folder combo box.
	 */
	onActiveFolder : function(folder)
	{
		this.setFolder(folder, true);
	},

	/**
	 * Event handler which is triggered when the folder is changed.
	 *
	 * @param {Zarafa.core.ContextModel} model The model which fired the event.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord[]} folders selected folders as an array of
	 * {@link Zarafa.hierarchy.data.MAPIFolderRecord MAPIFolder} objects.
	 * @private
	 */
	onFolderChange: function (model, folders)
	{
		var folder = model.getDefaultFolder();
		this.setFolder(folder, true);
	},

	/**
	 * Event handler triggers when context was switch successfully.
	 *
	 * @param {Object} folders contains folder details
	 * @param {Context} oldContext previously selected context
	 * @param {Context} context selected context
	 */
	onAfterContextSwitch : function (folders, oldContext, context)
	{
		var folder = context.getModel().getDefaultFolder();
		this.setFolder(folder, false);
	},

	/**
	 * Function is used to set the folder in {@link Zarafa.common.searchfield.ui.SearchFolderCombo SearchFolderCombo}
	 * according to folder type.
	 *
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder folder that should be shown by the selected context.
	 * @param {Boolean} changeCurrentFolder true to change the current folder in search folder combo box.
	 */
	setFolder : function(folder, changeCurrentFolder)
	{
		// Don't update search folder combo box which belongs to search panel toolbar or we
		// not found folder.
		if (this.findParentByType("zarafa.searchpaneltoolbar") || !Ext.isDefined(folder)) {
			return;
		} else if (Ext.isArray(folder)) {
			folder = folder[0];
		}

		var store = this.getStore();
		if (changeCurrentFolder) {
			this.doChangeCurrentFolder(store, folder);
		}

		// Select 'All folders' if select folder is 'Inbox' folder of own store.
		if (folder.getDefaultFolderKey() === 'inbox' && !folder.getMAPIStore().isSharedStore()) {
			var allFolderRecord = store.getAt(store.find('flag', Zarafa.advancesearch.data.SearchComboBoxFieldsFlags.ALL_FOLDERS));
			this.setValue(allFolderRecord.get('value'));
		} else {
			this.setValue(folder.get('entryid'));
		}
	},

	/**
	 * Function is used to change the current folder with selected folder from hierarchy
	 * in search folder combo.
	 *
	 * @param {Ext.data.JsonStore} store of search folder combo box.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder folder that should be shown by the selected context.
	 */
	doChangeCurrentFolder : function(store, folder)
	{
		var currentFolder = store.getAt(store.find('flag', Zarafa.advancesearch.data.SearchComboBoxFieldsFlags.CURRENT_SELECTED_FOLDER));

		currentFolder.beginEdit();
		currentFolder.set("name", folder.getDisplayName());
		currentFolder.set("value", folder.get('entryid'));
		currentFolder.set("include_subfolder", false);
		currentFolder.id = folder.get('entryid');
		currentFolder.endEdit();
		currentFolder.commit();
	}
});

Ext.reg('zarafa.searchfoldercombo', Zarafa.common.searchfield.ui.SearchFolderCombo);
