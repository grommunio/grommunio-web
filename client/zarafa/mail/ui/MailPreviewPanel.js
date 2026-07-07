Ext.namespace('Zarafa.mail.ui');

/**
 * @class Zarafa.mail.ui.MailPreviewPanel
 * @extends Zarafa.core.ui.PreviewPanel
 * @xtype zarafa.mailpreviewpanel
 */
Zarafa.mail.ui.MailPreviewPanel = Ext.extend(Zarafa.core.ui.PreviewPanel, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		if (!Ext.isDefined(config.model) && Ext.isDefined(config.context)) {
			config.model = config.context.getModel();
		}

		Ext.applyIf(config, {
			xtype: 'zarafa.mailpreviewpanel',
			cls: 'zarafa-previewpanel zarafa-context-mainpanel',
			loadMaskDelay: 250,
			recordComponentPluginConfig: Ext.applyIf(config.recordComponentPluginConfig || {}, {
				// Defer loading mail immediately, because the user
				// might be quickly clicking through the list of mails.
				enableOpenLoadTask: true,
				autoOpenLoadTaskDefer: 0
			}),
			width: 600,
			height: 400,
			tbar: {
				items: [
					this.createReplyButton(),
					this.createReplyAllButton(),
					this.createForwardButton()
				]
			}
		});

		Zarafa.mail.ui.MailPreviewPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Returns the conversation the given record belongs to when it should be
	 * previewed as a whole conversation, or false to preview the single record.
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The record to be previewed.
	 * @return {Object|Boolean} Object with 'items' (newest first), or false.
	 * @private
	 */
	getConversationForRecord: function(record)
	{
		if (!record || record.isSyntheticConversationHeader === true) {
			return false;
		}

		if (container.getSettingsModel().get('zarafa/v1/contexts/mail/enable_conversation_preview', true) === false) {
			return false;
		}

		// Search results carry their conversation siblings directly (see
		// Zarafa.advancesearch.AdvanceSearchStore#dedupeConversations).
		if (Ext.isArray(record.searchConversationRecords) && record.searchConversationRecords.length > 1) {
			return { items: record.searchConversationRecords };
		}

		var store = record.getStore ? record.getStore() : record.store;
		if (!store || !Ext.isFunction(store.containsConversations) || !store.containsConversations() ||
			!Ext.isFunction(store.getHeaderRecordFromItem)) {
			return false;
		}

		var header = store.getHeaderRecordFromItem(record);
		if (header === false) {
			return false;
		}

		// A header means this is a conversation, even when only one of its
		// messages is loaded so far (the sent items of the conversation are
		// fetched asynchronously when it is expanded); the conversation panel
		// refreshes itself when the other messages arrive.
		var items = store.getConversationItemsFromHeaderRecord(header);
		if (Ext.isEmpty(items)) {
			return false;
		}

		return { items: items };
	},

	/**
	 * Overridden to show the entire conversation when the previewed record is
	 * part of one; single messages use the default behavior.
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The record to preview.
	 * @private
	 */
	showRecordInPanel: function(record)
	{
		var conversation = this.getConversationForRecord(record);
		if (conversation === false) {
			// Leaving conversation mode: force a rebuild of the default view.
			if (this.get(0) instanceof Zarafa.mail.ui.ConversationViewPanel) {
				this.removeAll();
				this.record = undefined;
			}
			Zarafa.mail.ui.MailPreviewPanel.superclass.showRecordInPanel.apply(this, arguments);
			return;
		}

		if (!(this.get(0) instanceof Zarafa.mail.ui.ConversationViewPanel)) {
			this.removeAll();
			this.add(new Zarafa.mail.ui.ConversationViewPanel({
				resolveConversation: (function(rec) {
					var conv = this.getConversationForRecord(rec);
					return conv === false ? false : conv.items;
				}).createDelegate(this)
			}));
			this.doLayout();
		}

		this.get(0).showConversation(conversation.items, record);

		// Standard record handling: toolbar, record bookkeeping and opening of
		// the selected record. The response actions (reply, forward, ...) act
		// on the selected message of the conversation.
		this.setRecord(record);
		this.hideLoadMask();
	},

	/**
	 * Update the components with the given record.
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The record to update in this component
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update: function(record, contentReset)
	{
		if ( this.record && this.record !== record && this.record.store && this.record.store !== record.store ){
			Zarafa.core.PresenceManager.unregisterStore(this.record.store);
		}
		if ( record && record.store ){
			Zarafa.core.PresenceManager.registerStore(record.store, 'sender');
		}

		if ( this.record && this.record.subStores && this.record.subStores.recipients ){
			Zarafa.core.PresenceManager.unregisterStore(this.record.subStores.recipients);
		}
		if ( record && record.subStores && record.subStores.recipients ){
			Zarafa.core.PresenceManager.registerStore(record.subStores.recipients);
		}

		Zarafa.mail.ui.MailPreviewPanel.superclass.update.apply(this, arguments);

		if(record) {
			var isFaultyMessage = record.isFaultyMessage();
			var toolbar = this.getTopToolbar();

			toolbar.replyBtn.setVisible(!isFaultyMessage);
			toolbar.replyAllBtn.setVisible(!isFaultyMessage);
			toolbar.forwardBtn.setVisible(!isFaultyMessage);
		}
	},

	/**
	 * Function returns config for the reply button in previewpanel's toolbar
	 *
	 * @return {Object} Configuration object of reply button for the panel toolbar
	 * @private
	 */
	createReplyButton: function()
	{
		return {
			xtype: 'button',
			tooltip: _('Reply') + Zarafa.core.KeyMapMgr.formatShortcutHint('Ctrl + R', false),
			overflowText: _('Reply'),
			text: _('Reply'),
			iconCls: 'icon_reply',
			ref: 'replyBtn',
			responseMode: Zarafa.mail.data.ActionTypes.REPLY,
			handler: this.onResponse,
			scope: this
		};
	},

	/**
	 * Function returns config for the replyall button in previewpanel's toolbar
	 *
	 * @return {Object} Configuration object of replyall button for the panel toolbar
	 * @private
	 */
	createReplyAllButton: function()
	{
		return {
			xtype: 'button',
			tooltip: _('Reply All') + Zarafa.core.KeyMapMgr.formatShortcutHint('Ctrl + Alt + R', false),
			overflowText: _('Reply All'),
			text: _('Reply All'),
			iconCls: 'icon_reply_all',
			ref: 'replyAllBtn',
			responseMode: Zarafa.mail.data.ActionTypes.REPLYALL,
			handler: this.onResponse,
			scope: this
		};
	},

	/**
	 * Function returns config for the forward button in previewpanel's toolbar
	 *
	 * @return {Object} Configuration object of forward button for the panel toolbar
	 * @private
	 */
	createForwardButton: function()
	{
		return {
			xtype: 'button',
			tooltip: _('Forward') + Zarafa.core.KeyMapMgr.formatShortcutHint('Ctrl + F', false),
			overflowText: _('Forward'),
			text: _('Forward'),
			iconCls: 'icon_forward',
			ref: 'forwardBtn',
			responseMode: Zarafa.mail.data.ActionTypes.FORWARD,
			handler: this.onResponse,
			scope: this
		};
	},

	/**
	 * Called when one of the "Reply"/"Reply All"/"Forward"/"Edit as New" menuitems are clicked.
	 * @param {Ext.Button} button The button which was clicked
	 * @private
	 */
	onResponse: function(button)
	{
		if (button.responseMode === Zarafa.mail.data.ActionTypes.FORWARD) {
			var messageClass = this.record.get('message_class') || '';
			if (messageClass.indexOf('IPM.Schedule.Meeting') === 0 &&
				messageClass.indexOf('IPM.Schedule.Meeting.Notification') !== 0) {
				Zarafa.calendar.Actions.openForwardMeetingRequestContent(this.record);
				return;
			}
		}
		Zarafa.mail.Actions.openCreateMailResponseContent(this.record, this.model, button.responseMode);
	}
});

Ext.reg('zarafa.mailpreviewpanel', Zarafa.mail.ui.MailPreviewPanel);
