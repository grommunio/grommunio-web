/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.advancesearch.ui');

/**
 * @class Grommunio.advancesearch.ui.SearchResultPreviewPanel
 * @extends Grommunio.core.ui.PreviewPanel
 * @xtype grommunio.searchresultpreviewpanel
 */
Grommunio.advancesearch.ui.SearchResultPreviewPanel = Ext.extend(Grommunio.core.ui.PreviewPanel, {
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
			xtype: 'grommunio.searchresultpreviewpanel',
			cls: 'grommunio-previewpanel grommunio-context-mainpanel',
			recordComponentPluginConfig: Ext.applyIf(config.recordComponentPluginConfig || {}, {
				// Defer loading mail immediately, because the user
				// might be quickly clicking through the list of mails.
				enableOpenLoadTask: true,
				autoOpenLoadTaskDefer: 0
			}),
			width: 600,
			height: 400,
			/*
			 * TODO: make this code common for the Grommunio.advancesearch.ui.SearchResultPreviewPanel,
			 * Grommunio.mail.ui.MailPreviewPanel and Grommunio.advancesearch.dialogs.SearchToolbarPanel
			 */
			tbar: {
				height: 33,
				items: [{
					xtype: 'button',
					tooltip: _('Reply') + Grommunio.core.KeyMapMgr.formatShortcutHint('Ctrl + R', false),
					overflowText: _('Reply'),
					iconCls: 'icon_reply',
					ref: 'replyBtn',
					responseMode: Grommunio.mail.data.ActionTypes.REPLY,
					handler: this.onResponse,
					scope: this
				},{
					xtype: 'button',
					tooltip: _('Reply All') + Grommunio.core.KeyMapMgr.formatShortcutHint('Ctrl + Alt + R', false),
					overflowText: _('Reply All'),
					iconCls: 'icon_reply_all',
					ref: 'replyAllBtn',
					responseMode: Grommunio.mail.data.ActionTypes.REPLYALL,
					handler: this.onResponse,
					scope: this
				},{
					xtype: 'button',
					tooltip: _('Forward') + Grommunio.core.KeyMapMgr.formatShortcutHint('Ctrl + F', false),
					overflowText: _('Forward'),
					iconCls: 'icon_forward',
					ref: 'forwardBtn',
					responseMode: Grommunio.mail.data.ActionTypes.FORWARD,
					handler: this.onResponse,
					scope: this
				},{
					xtype: 'button',
					tooltip: _('Edit as New') + Grommunio.core.KeyMapMgr.formatShortcutHint('Ctrl + E', false),
					overflowText: _('Edit as New'),
					iconCls: 'icon_edit_as_new_mail',
					ref: 'editAsNewBtn',
					responseMode: Grommunio.mail.data.ActionTypes.EDIT_AS_NEW,
					handler: this.onResponse,
					scope: this
				}]
			}
		});

		this.addEvents([
			/**
			 * @event afterupdatesearchpreviewpanel
			 * Fired when {@link Grommunio.advancesearch.ui.SearchResultPreviewPanel SearchResultPreviewPanel}
			 * gets update.
			 * @param {Grommunio.advancesearch.ui.SearchResultPreviewPanel} SearchResultPreviewPanel The SearchResultPreviewPanel which fired the event
			 * @param {Grommunio.core.data.MAPIRecord} record The record to update in this component
			 * @param {Boolean} contentReset force the component to perform a full update of the data.
			 */
			'afterupdatesearchpreviewpanel'
		]);

		Grommunio.advancesearch.ui.SearchResultPreviewPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Update the components with the given record.
	 *
	 * @param {Grommunio.core.data.MAPIRecord} record The record to update in this component
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update: function (record, contentReset)
	{
		Grommunio.advancesearch.ui.SearchResultPreviewPanel.superclass.update.apply(this, arguments);

		this.fireEvent('afterupdatesearchpreviewpanel', this, record, contentReset);

		if(record) {
			var isFaultyMessage = record.isFaultyMessage();
			var isMessageReplyable = Grommunio.core.MessageClass.isClass(record.get('message_class'), ['IPM.NOTE', 'REPORT.IPM', 'IPM.SCHEDULE', 'IPM.APPOINTMENT']);

			// Additional check when the message is IPM.Appointment and not a meeting request
			// but a simple appointment which can not be replied as there is no reply-to recipients available.
			if(isMessageReplyable && Grommunio.core.MessageClass.isClass(record.get('message_class'), ['IPM.APPOINTMENT'])) {
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
			if (Grommunio.supportsPopOut()) {
				var isSupportPopout = Grommunio.core.MessageClass.isClass(record.get('message_class'), ['IPM.NOTE', 'REPORT.IPM.Note', 'IPM.Schedule.Meeting'], true);
				toolbar.popoutBtn.setVisible(isSupportPopout);
			}

			// Only show the "Edit as New" button in the toolbar when the item is in the Sent folder
			var defaultFolder = this.model.getDefaultFolder();
			toolbar.editAsNewBtn.setVisible(defaultFolder.getDefaultFolderKey()==='sent' && !isFaultyMessage && isMessageReplyable);
		}
	},

	/**
	 * See {@link Grommunio.core.plugins.RecordComponentPlugin#setRecord}. also it will
	 * disable the toolbar if {@link Grommunio.common.data.ViewModes#RIGHT_PREVIEW} else it will show the toolbar
	 *
	 * @param {Grommunio.core.data.MAPIRecord} record The record to set
	 */
	setRecord: function(record)
	{
		for (var i = 0; i < this.toolbars.length; i++) {
			if(this.searchContext.getCurrentViewMode() === Grommunio.common.data.ViewModes.RIGHT_PREVIEW) {
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
	 * that record is going to preview in correct {@link Grommunio.advancesearch.ui.SearchResultPreviewPanel SearchResultPreviewPanel}
	 * instance.
	 * @param {Grommunio.core.data.MAPIRecord} record
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
		// Grommunio.advancesearch.AdvanceSearchStore#dedupeConversations) or the
		// single message are shown.
		if (container.getSettingsModel().get('grommunio/v1/contexts/mail/enable_conversation_preview', true) !== false &&
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

		if (this.get(0) instanceof Grommunio.mail.ui.ConversationViewPanel) {
			this.removeAll();
			this.record = undefined;
		}

		Grommunio.advancesearch.ui.SearchResultPreviewPanel.superclass.showRecordInPanel.call(this, record);
	},

	/**
	 * Mounts the conversation panel (when needed) and shows the given records.
	 *
	 * @param {Grommunio.core.data.IPMRecord[]} conversationRecords The conversation, newest first.
	 * @param {Grommunio.core.data.IPMRecord} record The selected search result.
	 * @private
	 */
	showConversationInPanel: function(conversationRecords, record)
	{
		if (!(this.get(0) instanceof Grommunio.mail.ui.ConversationViewPanel)) {
			this.removeAll();
			this.add(new Grommunio.mail.ui.ConversationViewPanel({
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
	 * @param {Grommunio.core.data.IPMRecord} record The search result.
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
			new Grommunio.mail.data.ConversationItemsResponseHandler({
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
				if (Grommunio.core.EntryId.compareEntryIds(rec.get('entryid'), current.get('entryid'))) {
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
		Grommunio.mail.Actions.openCreateMailResponseContent(this.record, mailContextModel, button.responseMode);
	}
});

Ext.reg('grommunio.searchresultpreviewpanel', Grommunio.advancesearch.ui.SearchResultPreviewPanel);

