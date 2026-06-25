Ext.namespace('Zarafa.advancesearch');

/**
 * @class Zarafa.advancesearch.AdvanceSearchStore
 * @extends Zarafa.core.data.ListModuleStore
 * @xtype zarafa.advancesearchstore
 *
 * The AdvabceSearchStore class provides a way to connect the 'advancedsearchlistmodule' in the server back-end to an
 * Ext.grid.GridPanel object. It provides a means to retrieve search returl list asynchronously.
 * The advance search store object, once instantiated, will be able to retrieve and list search result from a
 * search folder only.
 */
Zarafa.advancesearch.AdvanceSearchStore = Ext.extend(Zarafa.core.data.ListModuleStore, {
	/**
	 * Read-only. entryid of the search folder.
	 * @property
	 * @type HexString
	 */
	searchFolderEntryId: undefined,

	/**
	 * Read-only. store entryId where search folder is belongs.
	 * @property
	 * @type HexString
	 */
	searchStoreEntryId: undefined,

	/**
	 * searchStoreUniqueId is represent the unique id of {@link Zarafa.advancesearch.AdvanceSearchStore AdvanceSearchStore}.
	 * searchStoreUniqueId and {@link Zarafa.advancesearch.dialogs.SearchContentPanel SearchContentPanel} name
	 * are similar, so we can easily map or manage the {@link Zarafa.advancesearch.AdvanceSearchStore AdvanceSearchStore}.
	 * @type Mixed
	 * @private
	 */
	searchStoreUniqueId: undefined,

	/**
	 * True if the model is currently busy searching. This is updated during
	 * {@link #startSearch} and {@link #stopSearch} and can be checked using
	 * {@link #isSearching}.
	 * @property
	 * @type Boolean
	 * @private
	 */
	isBusySearching: false,

	/**
	 * The search suggestion if one was given by the search engine.
	 * @property
	 * @type String
	 */
	suggestion: '',

	/**
	 *
	 */
	searchFolder: {},

	/**
	 * @constructor
	 * @param {Object} config configuration params that should be used to create instance of this store.
	 */
	constructor: function(config)
	{
		config = config || {};

		// Apply default settings.
		Ext.applyIf(config, {
			preferredMessageClass: 'IPM.Search'
		});

		Zarafa.advancesearch.AdvanceSearchStore.superclass.constructor.call(this, config);

		// Fold search results that belong to the same conversation into one
		// row (see #dedupeConversations). Rebuilt whenever the result set
		// changes.
		this.dedupeTask = new Ext.util.DelayedTask(this.dedupeConversations, this);
		this.on('load', this.dedupeConversations, this);
		this.on('add', this.scheduleDedupe, this);
		this.on('remove', this.scheduleDedupe, this);
	},

	/**
	 * Schedules a (buffered) {@link #dedupeConversations} run.
	 * @private
	 */
	scheduleDedupe: function()
	{
		this.dedupeTask.delay(10);
	},

	/**
	 * Returns the number of loaded records. The conversation dedupe hides
	 * records through a filter, so the (visible) count must not be used for
	 * live scroll paging: it would never reach the total row count and every
	 * scroll would keep requesting the same page.
	 *
	 * @return {Number} The number of loaded records.
	 */
	getStoreLength: function()
	{
		return (this.snapshot || this.data).getCount();
	},

	/**
	 * Folds search results that belong to the same conversation into a single
	 * row: the first (most relevant) hit stays visible, carries the number of
	 * hits and all messages of the conversation (newest first) for the
	 * conversation preview, and the other hits are hidden. The relevance
	 * ordering of the result list is unaffected.
	 * @private
	 */
	dedupeConversations: function()
	{
		if (container.isEnabledConversation() === false) {
			return;
		}

		var collection = this.snapshot || this.data;
		var groups = {};
		collection.each(function(record) {
			if (!Ext.isFunction(record.isMessageClass) || !record.isMessageClass('IPM.Note', true)) {
				return;
			}
			var conversationId = record.get('conversation_id');
			if (Ext.isEmpty(conversationId)) {
				return;
			}
			(groups[conversationId] = groups[conversationId] || []).push(record);
		});

		var recordTime = function(record) {
			var date = record.get('message_delivery_time') || record.get('client_submit_time');
			return Ext.isDate(date) ? date.getTime() : 0;
		};

		var hidden = {};
		var hasHidden = false;
		Ext.iterate(groups, function(conversationId, members) {
			var primary = members[0];
			if (members.length > 1) {
				primary.searchConversationRecords = members.slice().sort(function(a, b) {
					return recordTime(b) - recordTime(a);
				});
				primary.searchConversationCount = members.length;
				Ext.each(members, function(member) {
					if (member !== primary) {
						hidden[member.id] = true;
						hasHidden = true;
					}
				});
			} else {
				primary.searchConversationRecords = undefined;
				primary.searchConversationCount = 0;
			}
		});

		// Only touch the filter when the hidden set actually changed: filterBy
		// triggers a full grid refresh, and dedupe runs after every load.
		var signature = Object.keys(hidden).sort().join(',');
		if (hasHidden) {
			if (signature !== this.conversationDedupeSignature) {
				this.conversationDedupeSignature = signature;
				this.conversationDedupeActive = true;
				this.filterBy(function(record) {
					return hidden[record.id] !== true;
				});
			}
		} else if (this.conversationDedupeActive === true) {
			this.conversationDedupeActive = false;
			this.conversationDedupeSignature = undefined;
			this.clearFilter();
		}
	},

	/**
	 * Initialize all events which this {#Zarafa.advancesearch.AdvanceSearchStore AdvanceSearchStore} will listen to.
	 * @private
	 */
	initEvents: function()
	{
		this.on('load', this.onLoad, this);
	},

	/**
	 * Getter function which used to get the {@link #searchStoreUniqueId}.
	 * @return {String} return {@link #searchStoreUniqueId}
	 */
	getSearchStoreUniqueId: function()
	{
		return this.searchStoreUniqueId;
	},

	/**
	 * Function is used as a callback for 'read' action. It is overridden to be able to
	 * store the search suggestion in the AdvanceSearchStore if one is given.
	 * @param {Object} options options that are passed through {@link #load} event.
	 * @param {Boolean} success success status of request.
	 * @param {Object} metaData extra information that is received with response data.
	 */
	loadRecords: function(data, options, success, metaData)
	{
		// Only update the suggestion for the search action, not for the updatesearch action
		// because the suggestion is not send with that response
		if ( options.actionType === 'search' ){
			if ( success!==false && Ext.isObject(metaData) && Ext.isObject(metaData.search_meta) ) {
				this.suggestion = metaData.search_meta.suggestion;
			} else {
				this.suggestion = '';
			}
		}

		// Guard against undefined data from server errors
		if (!data || !data.records) {
			return;
		}

		Zarafa.advancesearch.AdvanceSearchStore.superclass.loadRecords.apply(this, arguments);
	},

	/**
	 * Event handler for the load event of this {#Zarafa.advancesearch.AdvanceSearchStore}
	 * @param {Zarafa.advancesearch.AdvanceSearchStore} store This store
	 * @param {Zarafa.core.data.IPMRecord[]} records loaded record set
	 * @param {Object} options the options (parameters) with which the load was invoked.
	 * @private
	 */
	onLoad: function(store, records, options)
	{
		// Set the searchdate field for each record, so Ext can use it for local sorting
		Ext.each(records, function(record){
			// update the record in the store, bypass setting dirty flag,
			// and do not store the change in the modified records
			record.data['searchdate'] = record.get('message_delivery_time') || record.get('last_modification_time');
			record.commit();
		});
	},

	/**
	 * Function will set entryid of search folder.
	 * @param {HexString} searchFolderEntryId entry id of search folder.
	 */
	setSearchEntryId: function(searchFolderEntryId)
	{
		this.searchFolderEntryId = searchFolderEntryId;
	},

	/**
	 * Function will set store entryid where search folder is belongs.
	 *
	 * @param {HexString} searchStoreEntryId entryId of store where search folder is belongs.
	 */
	setSearchStoreEntryId: function(searchStoreEntryId)
	{
		this.searchStoreEntryId = searchStoreEntryId;
	},

	/**
	 * Function will be used to issue a search request to server to start searching,
	 * this will internally call {@link #load} method but with some different options also it will
	 * cancel existing {@link Zarafa.core.Actions#updatesearch} or {@link Zarafa.core.Actions#search}
	 * request and send new {@link Zarafa.core.Actions#search} request with updated search restriction.
	 *
	 * @param {Object} options options object that must contain restriction to apply for search.
	 */
	search: function(options)
	{
		// When doing a new search we will have sorting done by the backend
		this.remoteSort = true;
		// Also remove the sortInfo because the backend will do sorting on relevance and not on a field
		delete this.sortInfo;

		if (this.isExecuting(Zarafa.core.Actions['updatesearch']) || this.isExecuting(Zarafa.core.Actions['search'])) {
			this.proxy.cancelRequests(Zarafa.core.Actions['updatesearch']);
			this.proxy.cancelRequests(Zarafa.core.Actions['search']);
		}

		this.hasSearchResults = false;

		/**
		 * userSearchFolder is only true if folder is not Public folder, shred folder or Favorite folder.
		 * These are the folders don't support search folder so we have to set search entryid to undefined.
		 */
		if(!options.useSearchFolder) {
			this.setSearchEntryId(undefined);
		}

		Zarafa.advancesearch.AdvanceSearchStore.superclass.search.apply(this, arguments);
	}
});

Ext.reg('zarafa.advancesearchstore', Zarafa.advancesearch.AdvanceSearchStore);
