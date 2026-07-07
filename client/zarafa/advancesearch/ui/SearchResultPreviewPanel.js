Ext.namespace('Zarafa.advancesearch.ui');

/**
 * @class Zarafa.advancesearch.ui.SearchResultPreviewPanel
 * @extends Zarafa.core.ui.PreviewPanel
 * @xtype zarafa.searchresultpreviewpanel
 */
Zarafa.advancesearch.ui.SearchResultPreviewPanel = Ext.extend(Zarafa.core.ui.PreviewPanel, {
	/**
	 * @constructor
	 * @param config Configuration structure.
	 */
	constructor: function (config)
	{
		config = config || {};

		if (!Ext.isDefined(config.model) && Ext.isDefined(config.searchContext)) {
			config.model = config.searchContext.getModel();
		}

		Ext.applyIf(config, {
			xtype: 'zarafa.searchresultpreviewpanel',
			cls: 'zarafa-previewpanel zarafa-context-mainpanel',
			recordComponentPluginConfig: Ext.applyIf(config.recordComponentPluginConfig || {}, {
				// Defer loading mail immediately, because the user
				// might be quickly clicking through the list of mails.
				enableOpenLoadTask: true,
				autoOpenLoadTaskDefer: 0
			}),
			width: 600,
			height: 400,
			/*
			 * TODO: make this code common for the Zarafa.advancesearch.ui.SearchResultPreviewPanel,
			 * Zarafa.mail.ui.MailPreviewPanel and Zarafa.advancesearch.dialogs.SearchToolbarPanel
			 */
			tbar: {
				height: 33,
				items: [{
					xtype: 'button',
					tooltip: _('Reply') + Zarafa.core.KeyMapMgr.formatShortcutHint('Ctrl + R', false),
					overflowText: _('Reply'),
					iconCls: 'icon_reply',
					ref: 'replyBtn',
					responseMode: Zarafa.mail.data.ActionTypes.REPLY,
					handler: this.onResponse,
					scope: this
				},{
					xtype: 'button',
					tooltip: _('Reply All') + Zarafa.core.KeyMapMgr.formatShortcutHint('Ctrl + Alt + R', false),
					overflowText: _('Reply All'),
					iconCls: 'icon_reply_all',
					ref: 'replyAllBtn',
					responseMode: Zarafa.mail.data.ActionTypes.REPLYALL,
					handler: this.onResponse,
					scope: this
				},{
					xtype: 'button',
					tooltip: _('Forward') + Zarafa.core.KeyMapMgr.formatShortcutHint('Ctrl + F', false),
					overflowText: _('Forward'),
					iconCls: 'icon_forward',
					ref: 'forwardBtn',
					responseMode: Zarafa.mail.data.ActionTypes.FORWARD,
					handler: this.onResponse,
					scope: this
				},{
					xtype: 'button',
					tooltip: _('Edit as New') + Zarafa.core.KeyMapMgr.formatShortcutHint('Ctrl + E', false),
					overflowText: _('Edit as New'),
					iconCls: 'icon_edit_as_new_mail',
					ref: 'editAsNewBtn',
					responseMode: Zarafa.mail.data.ActionTypes.EDIT_AS_NEW,
					handler: this.onResponse,
					scope: this
				}]
			}
		});

		this.addEvents([
			/**
			 * @event afterupdatesearchpreviewpanel
			 * Fired when {@link Zarafa.advancesearch.ui.SearchResultPreviewPanel SearchResultPreviewPanel}
			 * gets update.
			 * @param {Zarafa.advancesearch.ui.SearchResultPreviewPanel} SearchResultPreviewPanel The SearchResultPreviewPanel which fired the event
			 * @param {Zarafa.core.data.MAPIRecord} record The record to update in this component
			 * @param {Boolean} contentReset force the component to perform a full update of the data.
			 */
			'afterupdatesearchpreviewpanel'
		]);

		Zarafa.advancesearch.ui.SearchResultPreviewPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Update the components with the given record.
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The record to update in this component
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update: function (record, contentReset)
	{
		Zarafa.advancesearch.ui.SearchResultPreviewPanel.superclass.update.apply(this, arguments);

		this.fireEvent('afterupdatesearchpreviewpanel', this, record, contentReset);

		if(record) {
			var isFaultyMessage = record.isFaultyMessage();
			var isMessageReplyable = Zarafa.core.MessageClass.isClass(record.get('message_class'), ['IPM.NOTE', 'REPORT.IPM', 'IPM.SCHEDULE', 'IPM.APPOINTMENT']);

			// Additional check when the message is IPM.Appointment and not a meeting request
			// but a simple appointment which can not be replied as there is no reply-to recipients available.
			if(isMessageReplyable && Zarafa.core.MessageClass.isClass(record.get('message_class'), ['IPM.APPOINTMENT'])) {
				if(!record.isMeeting()){
					isMessageReplyable = false;
				}
			}

			var toolbar = this.getTopToolbar();

			toolbar.replyBtn.setVisible(!isFaultyMessage && isMessageReplyable);
			toolbar.replyAllBtn.setVisible(!isFaultyMessage && isMessageReplyable);
			toolbar.forwardBtn.setVisible(!isFaultyMessage && isMessageReplyable);

			// Currently pop-out functionality is not available for
			// contact, sticky note, distribution list, appointment and task
			// So disable showing popout button in search results preview panel for those context item
			// TODO Remove when we support popout for all context
			if (Zarafa.supportsPopOut()) {
				var isSupportPopout = Zarafa.core.MessageClass.isClass(record.get('message_class'), ['IPM.NOTE', 'REPORT.IPM.Note', 'IPM.Schedule.Meeting'], true);
				toolbar.popoutBtn.setVisible(isSupportPopout);
			}

			// Only show the "Edit as New" button in the toolbar when the item is in the Sent folder
			var defaultFolder = this.model.getDefaultFolder();
			toolbar.editAsNewBtn.setVisible(defaultFolder.getDefaultFolderKey()==='sent' && !isFaultyMessage && isMessageReplyable);
		}
	},

	/**
	 * See {@link Zarafa.core.plugins.RecordComponentPlugin#setRecord}. also it will
	 * disable the toolbar if {@link Zarafa.common.data.ViewModes#RIGHT_PREVIEW} else it will show the toolbar
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The record to set
	 */
	setRecord: function(record)
	{
		for (var i = 0; i < this.toolbars.length; i++) {
			if(this.searchContext.getCurrentViewMode() === Zarafa.common.data.ViewModes.RIGHT_PREVIEW) {
				this.toolbars[i].setVisible(false);
			} else {
				this.toolbars[i].setVisible(!!record);
			}
		}

		if (this.recordComponentPlugin) {
			this.recordComponentPlugin.setRecord(record);
		}
	},

	/**
	 * Function for 'previewrecordchange' and 'show' events before setting record into component also it will check
	 * that record is going to preview in correct {@link Zarafa.advancesearch.ui.SearchResultPreviewPanel SearchResultPreviewPanel}
	 * instance.
	 * @param {Zarafa.core.data.MAPIRecord} record
	 * @private
	 */
	showRecordInPanel: function(record)
	{
		if(this.model.store.getSearchStoreUniqueId() !== this.dialog.name) {
			return;
		}

		// Show the entire conversation of a mail search result. The search
		// store has no conversation structure, so the complete membership of
		// the conversation is fetched from the server once per conversation
		// (see #fetchConversationItems); while it is underway, the matched
		// hits (if the result was folded, see
		// Zarafa.advancesearch.AdvanceSearchStore#dedupeConversations) or the
		// single message are shown.
		if (container.getSettingsModel().get('zarafa/v1/contexts/mail/enable_conversation_preview', true) !== false &&
			container.isEnabledConversation() && record &&
			Ext.isFunction(record.isMessageClass) && record.isMessageClass('IPM.Note', true) &&
			!Ext.isEmpty(record.get('conversation_id'))) {
			var conversationId = record.get('conversation_id');
			var cached = this.getConversationCache()[conversationId];

			if (cached === undefined) {
				this.fetchConversationItems(record);
				cached = 'pending';
			}

			var conversationRecords = Ext.isArray(cached) ? cached : record.searchConversationRecords;
			if (Ext.isArray(conversationRecords) && conversationRecords.length > 1) {
				this.showConversationInPanel(conversationRecords, record);
				return;
			}
			// Not (yet) known to be a conversation: fall through to the normal
			// single view; when the fetch reveals more members, the preview
			// switches (see #onConversationItemsResponse).
		}

		if (this.get(0) instanceof Zarafa.mail.ui.ConversationViewPanel) {
			this.removeAll();
			this.record = undefined;
		}

		Zarafa.advancesearch.ui.SearchResultPreviewPanel.superclass.showRecordInPanel.call(this, record);
	},

	/**
	 * Mounts the conversation panel (when needed) and shows the given records.
	 *
	 * @param {Zarafa.core.data.IPMRecord[]} conversationRecords The conversation, newest first.
	 * @param {Zarafa.core.data.IPMRecord} record The selected search result.
	 * @private
	 */
	showConversationInPanel: function(conversationRecords, record)
	{
		if (!(this.get(0) instanceof Zarafa.mail.ui.ConversationViewPanel)) {
			this.removeAll();
			this.add(new Zarafa.mail.ui.ConversationViewPanel({
				resolveConversation: (function(rec) {
					if (!rec) {
						return false;
					}
					var cached = this.getConversationCache()[rec.get('conversation_id')];

					return Ext.isArray(cached) ? cached : rec.searchConversationRecords;
				}).createDelegate(this)
			}));
			this.doLayout();
		}
		this.get(0).showConversation(conversationRecords, record);

		// Standard record handling: toolbar, record bookkeeping and opening of
		// the selected record. The response actions act on the selected
		// message of the conversation.
		this.setRecord(record);
		this.hideLoadMask();
	},

	/**
	 * @return {Object} Map of conversation id to the fetched conversation
	 * records ('pending' while a fetch is underway).
	 * @private
	 */
	getConversationCache: function()
	{
		if (!this.conversationCache) {
			this.conversationCache = {};
		}

		return this.conversationCache;
	},

	/**
	 * Fetches the complete membership (inbox and sent items) of the
	 * conversation the given record belongs to.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The search result.
	 * @private
	 */
	fetchConversationItems: function(record)
	{
		var conversationId = record.get('conversation_id');
		this.getConversationCache()[conversationId] = 'pending';

		container.getRequest().singleRequest(
			'maillistmodule',
			'conversationitems',
			{
				store_entryid: record.get('store_entryid'),
				conversation_id: conversationId,
				include_inbox: true
			},
			new Zarafa.mail.data.ConversationItemsResponseHandler({
				callback: this.onConversationItemsResponse.createDelegate(this)
			})
		);
	},

	/**
	 * Handles the fetched conversation membership: caches it and, when the
	 * currently previewed record belongs to it and it has more than one
	 * message, switches the preview to the conversation.
	 *
	 * @param {Object} response The 'conversationitems' response data.
	 * @private
	 */
	onConversationItemsResponse: function(response)
	{
		var conversationId = response ? response.conversation_id : undefined;
		if (Ext.isEmpty(conversationId)) {
			return;
		}

		var items = response.item || [];
		if (!Array.isArray(items)) {
			items = [items];
		}

		var records = [];
		if (items.length > 0) {
			records = this.model.store.reader.readRecords({
				count: items.length,
				item: items
			}).records;
		}
		this.getConversationCache()[conversationId] = records;

		// Switch the preview when the fetched conversation belongs to the
		// record that is still being previewed.
		var current = this.model.getPreviewRecord();
		if (records.length > 1 && current && !this.isDestroyed &&
			current.get('conversation_id') === conversationId) {
			var selected = current;
			Ext.each(records, function(rec) {
				if (Zarafa.core.EntryId.compareEntryIds(rec.get('entryid'), current.get('entryid'))) {
					selected = rec;
					return false;
				}
			});
			this.showConversationInPanel(records, selected);
		}
	},

	/**
	 * Called when one of the "Reply"/"Reply All"/"Forward"/"Edit as New" menuitems are clicked.
	 * @param {Ext.Button} button The button which was clicked
	 * @private
	 */
	onResponse: function(button)
	{
		var mailContextModel = container.getContextByName('mail').getModel();
		Zarafa.mail.Actions.openCreateMailResponseContent(this.record, mailContextModel, button.responseMode);
	}
});

Ext.reg('zarafa.searchresultpreviewpanel', Zarafa.advancesearch.ui.SearchResultPreviewPanel);

