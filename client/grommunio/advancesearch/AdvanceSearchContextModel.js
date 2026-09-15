/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.advancesearch');

/**
 * @class Grommunio.advancesearch.AdvanceSearchContextModel
 * @extends Grommunio.core.ContextModel
 */
Grommunio.advancesearch.AdvanceSearchContextModel = Ext.extend(Grommunio.core.ContextModel, {

	/**
	 * @cfg {Object} stores The object which contains more then one {@link Grommunio.advancesearch.AdvanceSearchStore
	 * AdvanceStore} instances. Each {@link Grommunio.advancesearch.AdvanceSearchStore AdvanceStore} contains search
	 * results of respective search tab. When user creates new search tab it will create new
	 * {@link Grommunio.advancesearch.AdvanceSearchStore AdvanceStore} object for that particular search tab
	 * and push that object to {@link #stores} object. When user close search tab, after the removing of search
	 * folder from server side we remove {@link Grommunio.advancesearch.AdvanceSearchStore AdvanceStore} which mapped with that
	 * particular search tab from {@link #stores}. While switching between search tabs we find the relevant
	 * {@link Grommunio.advancesearch.AdvanceSearchStore AdvanceStore} from {@link #stores} and set it to store config of
	 * model using {@link #setActiveStore} so model can use that store for performing operation on that tab.
	 * @private
	 */
	stores: {},

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		if(!Ext.isDefined(config.store)) {
			config.store = new Grommunio.advancesearch.AdvanceSearchStore();
		}

		Ext.applyIf(config, {
			statefulRecordSelection: true,
			current_data_mode: Grommunio.common.data.DataModes.ALL,
			stateful: false
		});

		Grommunio.advancesearch.AdvanceSearchContextModel.superclass.constructor.call(this, config);
		container.on('folderselect', this.onFolderSelect, this);
		container.getHierarchyStore().on('removeFolder', this.onHierarchyRemoveFolder, this);
	},

	/**
	 * Create a new {@link Grommunio.core.data.IPFRecord SearchFolder} record.
	 *
	 * @param {String} folderName display name of folder which we are going to create.
	 * @return {Grommunio.core.data.IPFRecord} The new {@link Grommunio.core.data.IPFRecord IPFRecord}.
	 */
	createSearchFolderRecord: function (folderName)
	{
		var hierarchyStore = container.getHierarchyStore();
		var defaultStore = hierarchyStore.getDefaultStore();
		var folder = defaultStore.getFavoritesRootFolder();
		var entryId = '';
		if (defaultStore.getFavoritesStore().findExact('entryid',this.store.searchFolderEntryId) === -1){
			entryId = this.store.searchFolderEntryId;
		}
		var record = Grommunio.core.data.RecordFactory.createRecordObjectByObjectType(Grommunio.core.mapi.ObjectType.MAPI_FOLDER, {
			entryid: entryId,
			parent_entryid: folder.get('entryid'),
			store_entryid: folder.get('store_entryid'),
			display_name: folderName,
			folder_type: Grommunio.core.mapi.MAPIFolderType.FOLDER_SEARCH
		});

		return record;
	},

	/**
	 * Set given {@link Grommunio.advancesearch.AdvanceSearchStore AdvanceSearchStore} instance to active store for the model.
	 * @param {Grommunio.advancesearch.AdvanceSearchStore} store the newly created store.
	 */
	setActiveStore: function(store)
	{
		this.store = store;
	},

	/**
	 * Provide active {@link Grommunio.advancesearch.AdvanceSearchStore AdvanceSearchStore}
	 * @return {Grommunio.advancesearch.AdvanceSearchStore} return active {@link Grommunio.advancesearch.AdvanceSearchStore AdvanceSearchStore}
	 * if found from {@link #stores} object else return undefined.
	 */
	getActiveStore: function()
	{
		return this.store;
	},

	/**
	 * Pushes the newly create {@link Grommunio.advancesearch.AdvanceSearchStore AdvanceSearchStore} in to {@link #stores} object.
	 *
	 * @param {String} searchTabId the newly created {@link Grommunio.advancesearch.dialogs.SearchContentPanel SearchContentPanel} name.
	 * @param {Grommunio.advancesearch.AdvanceSearchStore} store the newly created {@link Grommunio.advancesearch.AdvanceSearchStore AdvanceSearchStore}.
	 */
	pushStore: function(searchTabId, store)
	{
		this.stores[searchTabId] = store;
	},

	/**
	 * Discards the {@link Grommunio.advancesearch.AdvanceSearchStore AdvanceSearchStore} object from {@link #stores} object.
	 *
	 * @param {String} searchTabId is {@link Grommunio.advancesearch.dialogs.SearchContentPanel search content panel} name,
	 * which is used to find the mapped {@link Grommunio.advancesearch.AdvanceSearchStore search store} from {@link #stores} object.
	 */
	discardStore: function(searchTabId)
	{
		delete this.stores[searchTabId];
	},

	/**
	 * Creates new instance of {@link Grommunio.advancesearch.AdvanceSearchStore AdvanceSearchStore} object for the newly
	 * created search tab and push that {@link Grommunio.advancesearch.AdvanceSearchStore AdvanceSearchStore} object in to {@link #stores}
	 * object for future use.
	 *
	 * @param {object} config the configuration object for the {@link Grommunio.advancesearch.AdvanceSearchStore AdvanceSearchStore}
	 * @return {Grommunio.advancesearch.AdvanceSearchStore} return {@link Grommunio.advancesearch.AdvanceSearchStore AdvanceSearchStore}
	 */
	createNewSearchStore: function (config)
	{
		var store = new Grommunio.advancesearch.AdvanceSearchStore({
			searchStoreUniqueId: config.searchTabId
		});
		this.setActiveStore(store);
		this.pushStore(config.searchTabId , store);
		return store;
	},

	/**
	 * Function is call the {@link Grommunio.mail.MailContextModel#createResponseRecord} to create
	 * a new {@link Grommunio.core.data.IPMRecord IPMRecord} for responding to an original
	 * {@link Grommunio.core.data.IPMRecord IPMRecord}. This will also set subject, body, attachment, recipient
	 * properties based on {@link Grommunio.mail.data.ActionTypes ActionType} provided.
	 *
	 * @param {Grommunio.core.data.IPMRecord} record The original {@link Grommunio.core.data.IPMRecord IPMRecord}.
	 * @param {String} actionType The action type for the given {@link Grommunio.core.data.IPMRecord record}.
	 * Can be any of the values of {@link Grommunio.mail.data.ActionTypes ActionTypes}.
	 * @param {Grommunio.core.data.IPMRecord} responseRecord The new {@link Grommunio.core.data.IPMRecord IPMRecord}.
	 * @return {Grommunio.core.data.IPMRecord} return the response record.
	 * @private
	 */
	createResponseRecord: function(record, actionType, responseRecord)
	{
		var mailContextModel = container.getContextByName('mail').getModel();
		return mailContextModel.createResponseRecord(record, actionType, responseRecord);
	},

	/**
	 * Event handler triggers when context or folder gets change.
	 * it will set the newly selected folder to default folder for the
	 * advance search.
	 *
	 * @param {Grommunio.core.data.IPFRecord} folders.
	 */
	onFolderSelect: function(folders)
	{
		var folder;
		if(Array.isArray(folders)) {
			folder = folders[0];
		} else {
			folder = folders;
		}

		// Check if we can use this folder
		if ( !( folder instanceof Grommunio.core.data.IPFRecord && Ext.isDefined(folder.getMAPIStore()) ) ){
			// Don't change the default folder
			return;
		}

		if(Ext.isDefined(folder) && !folder.isIPMSubTree()) {
			var defaultFolder = this.getDefaultFolder();
			var isSameFolder = folder.equals(defaultFolder);
			if(!isSameFolder) {
				this.setFolders(folders);
			}
		}
	},

	/**
	 * Event handler triggers when folder was delete from hierarchy. function was
	 * responsible to clear/delete the search criteria from settings.
	 *
	 * @param {Grommunio.hierarchy.data.HierarchyStore} store The store which fired the event
	 * @param {Grommunio.hierarchy.data.MAPIStoreRecord} mapiStore mapi store in which folders are deleted.
	 * @param {Grommunio.hierarchy.data.MAPIFolderRecord} folder which was deleted from hierarchy.
	 * @private
	 */
	onHierarchyRemoveFolder: function (store, mapiStore, folder)
	{
		if (folder.isSearchFolder()) {
			container.getSettingsModel().remove('grommunio/v1/contexts/search/search_criteria/'+folder.get('entryid'));
		}
	}
});
