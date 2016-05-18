Ext.namespace('Zarafa.advancesearch');

/**
 * @class Zarafa.advancesearch.AdvanceSearchContextModel
 * @extends Zarafa.core.ContextModel
 */
Zarafa.advancesearch.AdvanceSearchContextModel = Ext.extend(Zarafa.core.ContextModel, {

	/**
	 * @cfg {Object} stores The object which contains more then one {@link Zarafa.advancesearch.AdvanceSearchStore
	 * AdvanceStore} instances. Each {@link Zarafa.advancesearch.AdvanceSearchStore AdvanceStore} contains search
	 * results of respective search tab. When user creates new search tab it will create new
	 * {@link Zarafa.advancesearch.AdvanceSearchStore AdvanceStore} object for that particular search tab
	 * and push that object to {@link #stores} object. When user close search tab, after the removing of search
	 * folder from server side we remove {@link Zarafa.advancesearch.AdvanceSearchStore AdvanceStore} which mapped with that
	 * particular search tab from {@link #stores}. While switching between search tabs we find the relevant
	 * {@link Zarafa.advancesearch.AdvanceSearchStore AdvanceStore} from {@link #stores} and set it to store config of
	 * model using {@link #setActiveStore} so model can use that store for performing operation on that tab.
	 * @Private
	 */
	stores : {},

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		if(!Ext.isDefined(config.store)) {
			config.store = new Zarafa.advancesearch.AdvanceSearchStore();
		}

		Ext.applyIf(config, {
			statefulRecordSelection: true,
			current_data_mode : Zarafa.common.data.DataModes.ALL,
			stateful: false
		});

		Zarafa.advancesearch.AdvanceSearchContextModel.superclass.constructor.call(this, config);
		container.on('folderselect', this.onFolderSelect, this);
	},

	/**
	 * Set given {@link Zarafa.advancesearch.AdvanceSearchStore AdvanceSearchStore} instance to active store for the model.
	 * @param {Zarafa.advancesearch.AdvanceSearchStore} store the newly created store.
	 */
	setActiveStore : function(store)
	{
		this.store = store;
	},

	/**
	 * Provide active {@link Zarafa.advancesearch.AdvanceSearchStore AdvanceSearchStore}
	 * @return {Zarafa.advancesearch.AdvanceSearchStore} return active {@link Zarafa.advancesearch.AdvanceSearchStore AdvanceSearchStore}
	 * if found from {@link #stores} object else return undefined.
	 */
	getActiveStore : function()
	{
		return this.store;
	},

	/**
	 * Pushes the newly create {@link Zarafa.advancesearch.AdvanceSearchStore AdvanceSearchStore} in to {@link #stores} object.
	 *
	 * @param {String} searchTabId the newly created {@link Zarafa.advancesearch.dialogs.SearchContentPanel SearchContentPanel} name.
	 * @param {Zarafa.advancesearch.AdvanceSearchStore} store the newly created {@link Zarafa.advancesearch.AdvanceSearchStore AdvanceSearchStore}.
	 */
	pushStore : function(searchTabId, store)
	{
		this.stores[searchTabId] = store;
	},

	/**
	 * Discards the {@link Zarafa.advancesearch.AdvanceSearchStore AdvanceSearchStore} object from {@link #stores} object.
	 *
	 * @param {String} searchTabId is {@link Zarafa.advancesearch.dialogs.SearchContentPanel search content panel} name,
	 * which is used to find the mapped {@link Zarafa.advancesearch.AdvanceSearchStore search store} from {@link #stores} object.
	 */
	discardStore : function(searchTabId)
	{
		delete this.stores[searchTabId];
	},

	/**
	 * Creates new instance of {@link Zarafa.advancesearch.AdvanceSearchStore AdvanceSearchStore} object for the newly
	 * created search tab and push that {@link Zarafa.advancesearch.AdvanceSearchStore AdvanceSearchStore} object in to {@link #stores}
	 * object for future use.
	 *
	 * @param {object} config the configuration object for the {@link Zarafa.advancesearch.AdvanceSearchStore AdvanceSearchStore}
	 * @return {Zarafa.advancesearch.AdvanceSearchStore} return {@link Zarafa.advancesearch.AdvanceSearchStore AdvanceSearchStore}
	 */
	createNewSearchStore : function (config)
	{
		var store = new Zarafa.advancesearch.AdvanceSearchStore({
			searchStoreUniqueId : config.searchTabId
		});
		this.setActiveStore(store);
		this.pushStore(config.searchTabId , store);
		return store;
	},

	/**
	 * Function is call the {@link Zarafa.mail.MailContextModel#createResponseRecord} to create 
	 * a new {@link Zarafa.core.data.IPMRecord IPMRecord} for responsing to an original
	 * {@link Zarafa.core.data.IPMRecord IPMRecord}. This will also set subject, body, attachment, recipient
	 * properties based on {@link Zarafa.mail.data.ActionTypes ActionType} provided.
	 * 
	 * @param {Zarafa.core.data.IPMRecord} record The original {@link Zarafa.core.data.IPMRecord IPMRecord}.
	 * @param {String} actionType The action type for the given {@link Zarafa.core.data.IPMRecord record}.
	 * Can be any of the values of {@link Zarafa.mail.data.ActionTypes ActionTypes}.
	 * @param {Zarafa.core.data.IPMRecord} responseRecord The new {@link Zarafa.core.data.IPMRecord IPMRecord}.
	 * @return {Zarafa.core.data.IPMRecord} return the response record.
	 * @private
	 */
	createResponseRecord : function(record, actionType, responseRecord)
	{
		var mailContextModel = container.getContextByName('mail').getModel();
		return mailContextModel.createResponseRecord(record, actionType, responseRecord);
	},

	/**
	 * Event handler triggers when context or folder gets change.
	 * it will set the newly selected folder to default folder for the
	 * advance search.
	 *
	 * @param {Zarafa.core.data.IPFRecord} folders.
	 */
	onFolderSelect : function(folders)
	{
		var folder;
		if(Ext.isArray(folders)) {
			folder = folders[0];
		} else{
			folder = folders;
		}

		// Check if we can use this folder
		if ( !( folder instanceof Zarafa.core.data.IPFRecord && Ext.isDefined(folder.getMAPIStore()) ) ){
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
	}
});
