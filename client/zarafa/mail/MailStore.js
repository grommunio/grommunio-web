/*
 * #dependsFile client/zarafa/mail/data/ConversationManagers.js
 * #dependsFile client/zarafa/mail/data/ConversationItemsResponseHandler.js
 */
Ext.namespace('Zarafa.mail');

/**
 * @class Zarafa.mail.MailStore
 * @extends Zarafa.core.data.ListModuleStore
 * @xtype zarafa.mailstore
 *
 * The MailStore class provides a way to connect the 'maillistmodule' in the server back-end to an
 * Ext.grid.GridPanel object. It provides a means to retrieve mail listings asynchronously.
 * The MailStore object, once instantiated, will be able to retrieve and list mails from a
 * single specific folder only.
 */
Zarafa.mail.MailStore = Ext.extend(Zarafa.core.data.ListModuleStore, {

	/**
	 * @constructor
	 * @param {Object} config configuration params that should be used to create instance of this store.
	 */
	constructor: function(config)
	{
		config = config || {};

		// Apply default settings.
		Ext.applyIf(config, {
			preferredMessageClass: 'IPM.Note',
			defaultSortInfo: {
				field: 'message_delivery_time',
				direction: 'desc'
			},
			conversationManager: new Zarafa.mail.data.ConversationManagers()
		});

		Zarafa.mail.MailStore.superclass.constructor.call(this, config);

		// Client-side conversation grouping: the server delivers a plain,
		// date-sorted message list with a conversation_id on every item and the
		// store folds the items into conversations. Rebuild that structure
		// whenever the record set changes.
		this.conversationHeaderRecords = {};
		this.fetchedSentConversations = {};
		this.sentConversationCounts = {};
		this.queriedSentConversations = {};
		this.regroupTask = new Ext.util.DelayedTask(this.regroupConversations, this);
		this.on('load', this.onConversationViewLoad, this);
		this.on('add', this.scheduleRegroup, this);
		this.on('remove', this.scheduleRegroup, this);

		// Don't register standalone stores (used in modal dialogs) with the PresenceManager
		if ( !this.standalone ){
			Zarafa.core.PresenceManager.registerStore(this, ['sender', 'received_by', 'sent_representing']);
		}
	},

	/**
	 * Filter a list of {@link Zarafa.core.data.IPMRecord records} by checking if the record
	 * belongs to this Store. This comparison is based on checking if the entryid of the given
	 * records match the entryid of the records inside the store.
	 *
	 * What will be returned is an object containing the records as present inside the store,
	 * and the data objects which should be applied to them (the data from the records of the
	 * store that triggered the event).
	 *
	 * Function will also mark all updates that are already opened of this meeting to be
	 * out dated and force it to be opened again when its loaded in preview pane.
	 *
	 * @param {Zarafa.core.data.IPMRecord|Array} records The record or records to filter
	 * @param {Ext.data.Api.actions} action The API action for which the updates are looked for.
	 * @return {Object} Object containing the key 'records' containing the array of records inside
	 * this store, and the key 'updatedRecords' containing the array of records which should be
	 * applied to those records.
	 * @private
	 */
	getRecordsForUpdateData: function(records, action)
	{
		if (!Ext.isDefined(records) || action !== Ext.data.Api.actions.open) {
			return Zarafa.mail.MailStore.superclass.getRecordsForUpdateData.apply(this, arguments);
		}

		var results = { records: [], updatedRecords: [] };

		if (!Array.isArray(records)) {
			records = [ records ];
		}

		for (var i = 0, len = records.length; i < len; i++) {
			var record = records[i];

			if(record instanceof Zarafa.calendar.MeetingRequestRecord) {
				// use CleanGlobalObjectId, so we can force reload of all exceptions also for recurring series
				var globalObjectId = record.get('goid2');

				if (Ext.isEmpty(globalObjectId)) {
					// no global object id found, we can't do anything
					return Zarafa.mail.MailStore.superclass.getRecordsForUpdateData.apply(this, arguments);
				}

				// find all meeting request records which is earlier/latest update of this meeting request record
				var index = -1;
				do {
					index = this.findExact('goid2', globalObjectId, index + 1);

					// check if we got any matching record or not
					if(index < 0) {
						continue;
					}

					var rec = this.getAt(index);

					// check if we found the same record which we updated, for that we need to pass updated data
					// instead of just cloning the same record
					if (!record.equals(rec)) {
						if(rec.isOpened()) {
							// indicate that record data is outdated, record should be reopened again when needed
							rec.opened = false;

							results.records.push(rec);
							results.updatedRecords.push({});
						}
					} else {
						// add original updated record with updated data
						results.records.push(this.getAt(index));
						results.updatedRecords.push(record);
					}
				} while(index != -1);
			} else if(record.isMessageClass('IPM.TaskRequest', true)) {
				// Don't update MailStore-record when it is an IPM.TaskRequest/Accept/Decline/Update
				// because when user tried to open that particular task request, we actually open
				// the associated task.
				continue;
			} else {
				// for other type of mails, just invoke parent class
				return Zarafa.mail.MailStore.superclass.getRecordsForUpdateData.apply(this, arguments);
			}
		}

		return results;
	},

	/**
	 * Function is used to set the filter restriction if {#hasFilterApplied filter is enabled}
	 * while reloading mail store.
	 * @param {Object} options An options which set the filter restriction in params
	 * if filter was already applied on store.
	 */
	reload: function(options)
	{
		if (this.hasFilterApplied) {
			options = Ext.apply(options||{}, {
				params:{
					restriction:{
						filter: this.getFilterRestriction(Zarafa.common.data.Filters.UNREAD)
					}
				}
			});
		}
		Zarafa.mail.MailStore.superclass.reload.call(this, options);
	},

	/**
	 * Used to check if this store contains conversations. (records grouped by conversation and
	 * prefixed with conversation header records)
	 *
	 * @return {Boolean} True if the store contains conversations, or false otherwise.
	 */
	containsConversations: function()
	{
		// Check if the user enabled conversation view in his settings
		if (container.isEnabledConversation() === false) {
			return false;
		}

		// Check if the user is using infinite scroll
		var infiniteScrollEnabled = container.getSettingsModel().get('zarafa/v1/contexts/mail/enable_live_scroll');
		if (!infiniteScrollEnabled) {
			return false;
		}

		// Search results and filtered (e.g. unread only) lists are shown flat.
		if (this.hasSearchResults || this.hasFilterApplied) {
			return false;
		}

		// Conversations are only shown for the default (newest first) sorting.
		// Any other sorting shows the sorted, flat list.
		var sort = this.sortInfo || this.defaultSortInfo;
		if (sort && (sort.field !== 'message_delivery_time' || String(sort.direction).toUpperCase() !== 'DESC')) {
			return false;
		}

		// Check if this store contains the inbox. It is the only folder that can be rendered
		// with conversation view.
		var inbox = container.getHierarchyStore().getDefaultFolder('inbox');
		if (!inbox) {
			return false;
		}
		return (Zarafa.core.EntryId.compareEntryIds(this.entryId, inbox.get('entryid')));
	},

	/**
	 * Schedules a (buffered) {@link #regroupConversations} run. Used for events
	 * that can fire in quick succession, like the removal of multiple records.
	 * @private
	 */
	scheduleRegroup: function()
	{
		this.regroupTask.delay(10);
	},

	/**
	 * Called when the store has loaded. A fresh (non-appending) load replaced
	 * all records: the sent items that were fetched for expanded conversations
	 * are gone from the store, and the cached sent counts may be stale (e.g. a
	 * reply was sent in the meantime), so they are re-queried. The old counts
	 * are kept for display until the fresh ones arrive to avoid regrouping
	 * twice.
	 *
	 * @param {Zarafa.mail.MailStore} store This store.
	 * @param {Zarafa.mail.MailRecord[]} records The loaded records.
	 * @param {Object} options The load options.
	 * @private
	 */
	onConversationViewLoad: function(store, records, options)
	{
		if (!options || options.add !== true) {
			this.fetchedSentConversations = {};
			this.queriedSentConversations = {};
		}
		this.regroupConversations();
	},

	/**
	 * Rebuilds the conversation structure of the store: messages that share a
	 * conversation_id are folded into a conversation, prefixed with a locally
	 * created header record whose entryid ('conversation-<id>') is stable across
	 * reloads. When the conversation view is not active, previously created
	 * structure is removed again.
	 *
	 * The grid shows the records through the conversation filter (see
	 * {@link #filterByConversations}): items of collapsed conversations are
	 * hidden, the header records are always visible.
	 * @private
	 */
	regroupConversations: function()
	{
		var active = this.containsConversations();
		var collection = this.snapshot || this.data;
		var items = collection.getRange();
		var changed = false;

		// Collect the real records; previously generated headers are dropped
		// (they are regenerated below when conversations are active).
		var inboxRecords = [];
		var sentRecords = [];
		items.forEach(function(record) {
			if (record.isSyntheticConversationHeader === true) {
				changed = true;
				return;
			}
			if (record.fetchedByConversationView === true) {
				sentRecords.push(record);
			} else {
				inboxRecords.push(record);
			}
		});

		if (!active) {
			// Flatten: drop the sent items that were fetched for expanded
			// conversations and reset the conversation fields.
			var flat = [];
			changed = changed || sentRecords.length > 0;
			inboxRecords.forEach(function(record) {
				if (record.get('depth') !== 0 || record.get('conversation_count') !== 0) {
					record.data.depth = 0;
					record.data.conversation_count = 0;
					changed = true;
				}
				record.conversationHeaderId = undefined;
				flat.push(record);
			});

			if (changed) {
				collection.clear();
				collection.addAll(flat);
			}
			// Undo a previously applied conversation filter.
			if (this.snapshot) {
				this.data = this.snapshot;
				delete this.snapshot;
				changed = true;
			}
			if (changed) {
				this.fireEvent('datachanged', this);
			}
			return;
		}

		var recordTime = function(record) {
			var date = record.get('message_delivery_time') || record.get('client_submit_time');
			return Ext.isDate(date) ? date.getTime() : 0;
		};

		// The store order may have been rearranged by a previous regroup, so
		// restore the canonical newest-first order of the inbox flow.
		inboxRecords.sort(function(a, b) {
			return recordTime(b) - recordTime(a);
		});

		// Group the records by their conversation id.
		var groups = {};
		inboxRecords.forEach(function(record) {
			var conversationId = record.get('conversation_id');
			if (Ext.isEmpty(conversationId)) {
				return;
			}
			(groups[conversationId] = groups[conversationId] || []).push(record);
		});
		sentRecords.forEach(function(record) {
			var conversationId = record.get('conversation_id');
			if (!Ext.isEmpty(conversationId) && groups[conversationId]) {
				groups[conversationId].push(record);
			}
			// Sent items whose inbox counterparts are gone are dropped.
		});

		// Emit the new record sequence: conversations (of more than one
		// message, counting known Sent Items) become a header followed by
		// their items, at the position of their newest inbox message.
		var result = [];
		var emittedConversations = {};
		var unqueriedConversations = [];
		var me = this;
		inboxRecords.forEach(function(record) {
			var conversationId = record.get('conversation_id');
			var members = Ext.isEmpty(conversationId) ? false : groups[conversationId];

			record.data.folder_name = 'inbox';

			// Number of messages of this conversation in the Sent Items folder
			// that have not been fetched (and thus are not part of members) yet.
			var pendingSent = 0;
			if (members) {
				if (me.queriedSentConversations[conversationId] !== true) {
					unqueriedConversations.push(conversationId);
				}
				if (me.fetchedSentConversations[conversationId] !== true) {
					pendingSent = me.sentConversationCounts[conversationId] || 0;
				}
			}

			if (!members || members.length + pendingSent <= 1) {
				// Not part of a conversation.
				if (record.get('depth') !== 0 || record.get('conversation_count') !== 0) {
					record.data.depth = 0;
					record.data.conversation_count = 0;
				}
				record.conversationHeaderId = undefined;
				result.push(record);
				return;
			}

			if (emittedConversations[conversationId] === true) {
				return;
			}
			emittedConversations[conversationId] = true;

			members.sort(function(a, b) {
				return recordTime(b) - recordTime(a);
			});

			var header = me.getConversationHeaderRecord(conversationId, members, members.length + pendingSent);
			result.push(header);
			members.forEach(function(member) {
				member.data.depth = 1;
				member.data.conversation_count = 0;
				member.conversationHeaderId = header.get('entryid');
				result.push(member);
			});

			// An expanded conversation whose sent items are not in the store
			// (e.g. a reload replaced all records) fetches them again.
			if (pendingSent > 0 && me.isConversationOpened(header)) {
				me.fetchConversationSentItems(header);
			}
		});

		collection.clear();
		collection.addAll(result);
		this.filterByConversations();

		// Ask the server which of the newly loaded conversations have messages
		// in the Sent Items folder; those must be presented as conversations
		// even when only one of their messages is in the Inbox.
		this.requestSentConversationCounts(unqueriedConversations);
	},

	/**
	 * Requests, for the given conversation ids, the number of messages each
	 * conversation has in the Sent Items folder. Ids that were requested
	 * before are skipped. The response is handled by
	 * {@link #onConversationCountsResponse}.
	 *
	 * @param {String[]} conversationIds The conversation ids to query.
	 * @private
	 */
	requestSentConversationCounts: function(conversationIds)
	{
		var query = [];
		Ext.each(conversationIds, function(conversationId) {
			if (this.queriedSentConversations[conversationId] !== true) {
				this.queriedSentConversations[conversationId] = true;
				query.push(conversationId);
			}
		}, this);

		if (Ext.isEmpty(query)) {
			return;
		}

		container.getRequest().singleRequest(
			'maillistmodule',
			'conversationcounts',
			{
				store_entryid: this.storeEntryId,
				conversation_ids: query
			},
			new Zarafa.mail.data.ConversationItemsResponseHandler({
				store: this,
				queriedIds: query
			})
		);
	},

	/**
	 * Handles the response of the 'conversationcounts' request. When the sent
	 * count of any of the queried conversations changed (it can also decrease,
	 * e.g. after a reload with stale cached counts), the conversation structure
	 * is rebuilt.
	 *
	 * @param {Object} response The 'conversationcounts' response data.
	 * @param {String[]} queriedIds The conversation ids that were queried.
	 */
	onConversationCountsResponse: function(response, queriedIds)
	{
		var counts = (response && Ext.isObject(response.counts)) ? response.counts : {};

		var changed = false;
		Ext.each(queriedIds || [], function(conversationId) {
			var count = counts[conversationId] || 0;
			if ((this.sentConversationCounts[conversationId] || 0) !== count) {
				if (count > 0) {
					this.sentConversationCounts[conversationId] = count;
				} else {
					delete this.sentConversationCounts[conversationId];
				}
				changed = true;
			}
		}, this);

		if (changed) {
			this.regroupConversations();
		}
	},

	/**
	 * Returns the header record for the given conversation, creating it when it
	 * does not exist yet. The header carries the aggregated state of the
	 * conversation: the number of items, the date of the newest item and the
	 * unread state.
	 *
	 * @param {String} conversationId The conversation id (hex) of the conversation.
	 * @param {Zarafa.mail.MailRecord[]} members The items of the conversation, newest first.
	 * @param {Number} totalCount The number of items of the conversation, including
	 * Sent Items messages that have not been fetched yet.
	 * @return {Zarafa.mail.MailRecord} The header record.
	 * @private
	 */
	getConversationHeaderRecord: function(conversationId, members, totalCount)
	{
		var newest = members[0];
		var read = members.every(function(member) {
			return !Ext.isFunction(member.isRead) || member.isRead();
		});

		var values = {
			entryid: 'conversation-' + conversationId,
			conversation_id: conversationId,
			depth: 0,
			conversation_count: totalCount,
			message_class: 'IPM.Note',
			subject: newest.get('normalized_subject') || newest.get('subject'),
			normalized_subject: newest.get('normalized_subject'),
			message_delivery_time: newest.get('message_delivery_time') || newest.get('client_submit_time'),
			message_flags: read ? Zarafa.core.mapi.MessageFlags.MSGFLAG_READ : 0,
			parent_entryid: newest.get('parent_entryid'),
			store_entryid: newest.get('store_entryid'),
			// Fallback for the sender column when no participant names can be
			// determined from the conversation items.
			sent_representing_name: newest.get('sent_representing_name'),
			sender_name: newest.get('sender_name')
		};

		var header = this.conversationHeaderRecords[conversationId];
		if (header) {
			Ext.apply(header.data, values);
			return header;
		}

		header = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Note', values);
		header.phantom = false;
		header.isSyntheticConversationHeader = true;
		// The renderers reach the store through the record to inspect the
		// conversation (e.g. record.getStore().isConversationOpened(record)).
		header.join(this);
		this.conversationHeaderRecords[conversationId] = header;

		return header;
	},

	/**
	 * Checks if the given record is part of an expanded conversation
	 *
	 * @param {Zarafa.mail.MailRecord} record The record that should be checked
	 * @return {Boolean} True is the record is part of an expanded conversation,
	 * false otherwise
	 */
	isConversationOpened: function(record)
	{
		var openedRecordManager = this.conversationManager.getOpenedRecordManager();
		if (record.isConversationHeaderRecord()) {
			return openedRecordManager.containsKey(record.get('entryid'));
		}

		return openedRecordManager.containsKey(record.conversationHeaderId);
	},

	/**
	 * Filters the store to not show items in conversations that have not been expanded
	 */
	filterByConversations: function()
	{
		if (!this.containsConversations()) {
			return;
		}

		var openedRecordManager = this.conversationManager.getOpenedRecordManager();

		this.filterBy(function(record) {
			return record.get('depth') === 0 || openedRecordManager.containsKey(record.conversationHeaderId) === true;
		}, this);
	},

	/**
	 * Function toggles the conversation.
	 *
	 * @param {Zarafa.core.IPMRecord} headerRecord The header record of conversation.
	 * @param {Boolean} expand The expand is true if conversation needs to expand else false.
	 */
	toggleConversation: function(headerRecord, expand)
	{
		if (!headerRecord.isConversationHeaderRecord()) {
			return;
		}
		var headerRecordEntryId = headerRecord.get('entryid');
		var openedRecordManager = this.conversationManager.getOpenedRecordManager();
		var hide = Ext.isDefined(expand) ? !expand : openedRecordManager.containsKey(headerRecordEntryId);

		if (hide) {
			openedRecordManager.removeKey(headerRecordEntryId);
		} else {
			openedRecordManager.add(headerRecordEntryId, true);
			this.fetchConversationSentItems(headerRecord);
		}

		this.filterByConversations();
	},

	/**
	 * Fetches the Sent Items messages that belong to the given conversation from
	 * the server (once per conversation) and merges them into the conversation.
	 *
	 * @param {Zarafa.mail.MailRecord} headerRecord The header record of the conversation.
	 * @private
	 */
	fetchConversationSentItems: function(headerRecord)
	{
		var conversationId = headerRecord.get('conversation_id');
		if (Ext.isEmpty(conversationId) || this.fetchedSentConversations[conversationId] === true) {
			return;
		}
		this.fetchedSentConversations[conversationId] = true;

		container.getRequest().singleRequest(
			'maillistmodule',
			'conversationitems',
			{
				store_entryid: this.storeEntryId,
				conversation_id: conversationId
			},
			new Zarafa.mail.data.ConversationItemsResponseHandler({
				store: this
			})
		);
	},

	/**
	 * Handles the response of the 'conversationitems' request: the received
	 * Sent Items messages are added to the store and the conversation structure
	 * is rebuilt so they appear inside their conversation.
	 *
	 * @param {Object} response The 'conversationitems' response data.
	 */
	onConversationItemsResponse: function(response)
	{
		var items = response ? response.item : undefined;
		if (Ext.isEmpty(items)) {
			return;
		}
		if (!Array.isArray(items)) {
			items = [items];
		}

		var readerData = this.reader.readRecords({
			count: items.length,
			item: items
		});

		var collection = this.snapshot || this.data;
		var existing = {};
		collection.each(function(record) {
			existing[record.get('entryid')] = true;
		});

		var added = false;
		Ext.each(readerData.records, function(record) {
			if (existing[record.get('entryid')] === true) {
				return;
			}
			record.fetchedByConversationView = true;
			record.data.folder_name = 'sent_items';
			record.join(this);
			collection.add(record);
			added = true;
		}, this);

		if (added) {
			this.regroupConversations();
		}
	},

	/**
	 * Function will collapse all the conversation except the given header record in parameter
	 * and if no header record is provided then it will collapse all the conversation.
	 *
	 * @param {Zarafa.core.IPMRecord} headerRecord The header record of conversation.
	 */
	collapseAllConversation: function(headerRecord)
	{
		if (!this.containsConversations()) {
			return;
		}
		this.conversationManager.closeAll(headerRecord);
		this.filterByConversations();
	},

	/**
	 * Helper function to open (expand) a conversation
	 *
	 * @param {Zarafa.mail.MailRecord} headerRecord
	 */
	expandConversation: function(headerRecord)
	{
		this.toggleConversation(headerRecord, true);
	},

	/**
	 * Returns all the records in the store that are part of the conversation identified
	 * by the given header record
	 *
	 * @param {Zarafa.core.data.MapiRecord} headerRecord The header record of the conversation
	 * @return {Zarafa.core.data.MapiRecord[]} The records that belong to the requested conversation
	 */
	getConversationItemsFromHeaderRecord: function(headerRecord)
	{
		var items = this.snapshot || this.data;
		var index = items.findIndex('id', headerRecord.id) + 1;
		var retVal = [];
		var item;
		while ((item = items.get(index)) && item.get('depth') > 0) {
			retVal.push(item);
			index++;
		}

		return retVal;
	},

	/**
	 * Returns header record identified by the given record item which is part of that conversation.
	 * Or it returns false if given record is not part of any conversation.
	 *
	 * @param {Zarafa.core.data.MapiRecord} record The conversation item record whose header record needs to be found.
	 * @return {Zarafa.core.data.MapiRecord} returns header record for the given conversation item
	 * or false if given record is not part of any conversation.
	 */
	getHeaderRecordFromItem: function(record)
	{
		if (!Ext.isDefined(record) || record.isNormalRecord()) {
			return false;
		} else if (record.isConversationHeaderRecord()) {
			return record;
		}

		var items = this.snapshot || this.data;
		var index = items.findIndex('id', record.id) - 1;
		var headerRecord = false;
		var item;
		while ((item = items.get(index))) {
			if (item.get('depth') === 0 && item.get('conversation_count') > 0) {
				headerRecord = item;
				break;
			}
			index--;
		}

		return headerRecord;
	},

	/**
	 * Returns the number of conversations that are contained by the store
	 *
	 * @return {Number} Number of conversation in the store
	 */
	getConversationCount: function()
	{
		if (!this.containsConversations()) {
			return 0;
		}

		var count = 0;
		var items = this.snapshot ? this.snapshot.items : this.getRange();
		items.forEach(function(item) {
			if (item.get('depth') === 0) {
				count++;
			}
		});

		return count;
	},

	/**
	 * Returns the number of items that have the store has
	 * corresponds as a parent folder. (i.e. for conversations it will only
	 * count the items from the Inbox folder and not the items from the Sent Items
	 * folder)
	 *
	 * @return {Number} The number of items
	 */
	getStoreLength: function()
	{
		// For conversations only count the items from the Inbox folder: not the
		// conversation header records and not the fetched Sent Items.
		if (this.containsConversations()) {
			var count = 0;
			var items = this.snapshot ? this.snapshot.items : this.getRange();
			items.forEach(function(item) {
				if (item.get('folder_name') === 'inbox') {
					count++;
				}
			});

			return count;
		}

		return Zarafa.mail.MailStore.superclass.getStoreLength.apply(this, arguments);
	},

	/**
	 * Function which provide the restriction based on the given {@link Zarafa.common.data.Filters.UNREAD Filter}
	 *
	 * @param {Zarafa.common.data.Filters} filterType The filterType which needs to perform on store.
	 * @return {Array|false} RES_BITMASK restriction else false.
	 */
	getFilterRestriction: function(filterType)
	{
		if (filterType === Zarafa.common.data.Filters.UNREAD) {
			var unreadFilterRestriction = Zarafa.core.data.RestrictionFactory.dataResBitmask(
				'PR_MESSAGE_FLAGS',
				Zarafa.core.mapi.Restrictions.BMR_EQZ,
				Zarafa.core.mapi.MessageFlags.MSGFLAG_READ);

			var model = container.getCurrentContext().getModel();
			if (model) {
				var previewedRecord = model.getPreviewRecord();

				// Add preview record in filter restriction so we can
				// make it remains preview in preview panel.
				if(!Ext.isEmpty(previewedRecord) && this.hasFilterApplied) {
					return Zarafa.core.data.RestrictionFactory.createResOr([
						Zarafa.core.data.RestrictionFactory.dataResProperty(
							'entryid',
							Zarafa.core.mapi.Restrictions.RELOP_EQ,
							previewedRecord.get('entryid')
						),
						unreadFilterRestriction
					]);
				}
			}

			return unreadFilterRestriction;
		}
		return false;
	}
});

Ext.reg('zarafa.mailstore', Zarafa.mail.MailStore);
