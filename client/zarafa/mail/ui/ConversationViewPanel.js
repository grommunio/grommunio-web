/*
 * #dependsFile client/zarafa/common/ui/messagepanel/MessageBody.js
 * #dependsFile client/zarafa/common/ui/messagepanel/MessageHeader.js
 */
Ext.namespace('Zarafa.mail.ui');

/**
 * @class Zarafa.mail.ui.ConversationViewPanel
 * @extends Ext.Panel
 * @xtype zarafa.conversationviewpanel
 *
 * Preview panel content that shows all messages of a conversation stacked,
 * newest at the top. Every message is a collapsible card containing the full
 * standard message view (header with sender, recipients, attachments and the
 * external-content handling, plus the message body). Each card is its own
 * record component root: the message view components inside bind against the
 * card and receive exactly that card's record through the same pipeline the
 * normal single-message preview uses.
 *
 * The newest {@link #autoExpandCount} messages are expanded (and thus loaded)
 * immediately, older ones when their card is expanded.
 */
Zarafa.mail.ui.ConversationViewPanel = Ext.extend(Ext.Panel, {
	/**
	 * @cfg {Function} resolveConversation Function that returns the current
	 * items (newest first) of the conversation the given record belongs to,
	 * or false. Used to refresh the panel when the conversation membership
	 * changes (e.g. the sent items arrive after the preview was opened).
	 */
	resolveConversation: undefined,

	/**
	 * @cfg {Number} autoExpandCount The number of newest messages that are
	 * expanded (and thus loaded) when the conversation is shown.
	 */
	autoExpandCount: 15,

	/**
	 * Key (concatenated entryids) of the conversation that is currently shown.
	 * @property
	 * @type String
	 */
	conversationKey: undefined,

	/**
	 * The record that is selected in the mail grid.
	 * @property
	 * @type Zarafa.mail.MailRecord
	 */
	selectedRecord: undefined,

	/**
	 * Map of entryid to the {@link Ext.Panel card} that shows the message.
	 * @property
	 * @type Object
	 */
	recordCards: undefined,

	/**
	 * The store whose 'datachanged' event is monitored to detect changes of
	 * the conversation membership.
	 * @property
	 * @type Zarafa.mail.MailStore
	 */
	boundStore: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'zarafa.conversationviewpanel',
			cls: 'zarafa-mailconversationpanel',
			border: false,
			autoScroll: true,
			bodyStyle: 'padding: 9px;'
		});

		Zarafa.mail.ui.ConversationViewPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Shows the given conversation. When the same conversation is already
	 * shown, only the selected message is scrolled into view.
	 *
	 * @param {Zarafa.mail.MailRecord[]} records The items of the conversation, newest first.
	 * @param {Zarafa.mail.MailRecord} selected The record that is selected in the mail grid.
	 */
	showConversation: function(records, selected)
	{
		var key = records.map(function(record) { return record.get('entryid'); }).join(',');
		this.selectedRecord = selected;
		if (this.conversationKey === key) {
			this.focusRecord(selected);
			return;
		}
		this.conversationKey = key;

		if (records.length > 0) {
			this.bindStore(records[0].getStore());
		}

		this.removeAll(true);
		this.recordCards = {};

		Ext.each(records, function(record, index) {
			var card = this.createCard(record, index >= this.autoExpandCount);
			this.recordCards[record.get('entryid')] = card;
			this.add(card);
		}, this);

		this.doLayout();
		this.focusRecord(selected);
	},

	/**
	 * Monitors the given store to detect membership changes of the shown
	 * conversation (e.g. the sent items arrived after the preview was opened).
	 *
	 * @param {Zarafa.mail.MailStore} store The store to monitor.
	 * @private
	 */
	bindStore: function(store)
	{
		if (this.boundStore === store) {
			return;
		}
		if (this.boundStore) {
			this.mun(this.boundStore, 'datachanged', this.onStoreDataChanged, this);
		}
		this.boundStore = store;
		if (store) {
			this.mon(store, 'datachanged', this.onStoreDataChanged, this, { buffer: 100 });
		}
	},

	/**
	 * Called (buffered) when the monitored store changed: when the membership
	 * of the shown conversation changed, the panel is rebuilt.
	 * @private
	 */
	onStoreDataChanged: function()
	{
		if (!this.selectedRecord || !Ext.isFunction(this.resolveConversation)) {
			return;
		}

		var items = this.resolveConversation(this.selectedRecord);
		if (!Ext.isArray(items) || Ext.isEmpty(items)) {
			return;
		}

		var key = items.map(function(record) { return record.get('entryid'); }).join(',');
		if (key !== this.conversationKey) {
			this.showConversation(items, this.selectedRecord);
		}
	},

	/**
	 * Creates the card for one message of the conversation. The card carries
	 * its own {@link Zarafa.core.plugins.RecordComponentPlugin} so the message
	 * view components inside bind against the card, and thus against this
	 * card's message.
	 *
	 * @param {Zarafa.mail.MailRecord} record The message.
	 * @param {Boolean} collapsed True when the card starts collapsed.
	 * @return {Ext.Panel} The card.
	 * @private
	 */
	createCard: function(record, collapsed)
	{
		var sent = record.get('folder_name') === 'sent_items';
		var card = new Ext.Panel({
			cls: 'k-conversation-item' + (sent ? ' k-own-message' : ''),
			title: this.getCardTitle(record),
			collapsible: true,
			titleCollapse: true,
			animCollapse: false,
			collapsed: collapsed === true,
			border: false,
			plugins: [{
				ptype: 'zarafa.recordcomponentplugin',
				allowWrite: false,
				useShadowStore: true
			}],
			items: [{
				xtype: 'zarafa.messageheader'
			}, {
				xtype: 'zarafa.messagebody'
			}],
			listeners: {
				expand: this.activateCard,
				afterrender: function(panel) {
					if (!panel.collapsed) {
						this.activateCard(panel);
					}
				},
				// Fired by the card's record component plugin whenever the
				// record is set, loaded or updated: (re)fit the body.
				setrecord: this.onCardRecordEvent,
				loadrecord: this.onCardRecordEvent,
				updaterecord: this.onCardRecordEvent,
				scope: this
			}
		});
		card.conversationRecord = record;

		return card;
	},

	/**
	 * Hands the record of the given card to the card's record component
	 * plugin (once), which opens it and updates the message view components.
	 *
	 * @param {Ext.Panel} card The card to activate.
	 * @private
	 */
	activateCard: function(card)
	{
		if (card.recordActivated !== true && card.recordComponentPlugin && card.conversationRecord) {
			card.recordActivated = true;
			card.recordComponentPlugin.setRecord(card.conversationRecord);
		}
		this.settleCard(card);
	},

	/**
	 * Record event handler of a card: refit the body.
	 * @param {Ext.Panel} card The card the event belongs to.
	 * @private
	 */
	onCardRecordEvent: function(card)
	{
		this.settleCard(card);
	},

	/**
	 * Adjusts the body iframe of the card now and after the content settled
	 * (images, fonts, late rewrites of the iframe document).
	 *
	 * @param {Ext.Panel} card The card to adjust.
	 * @private
	 */
	settleCard: function(card)
	{
		var me = this;
		var run = function() {
			me.adjustCardBody(card);
		};
		run();
		setTimeout(run, 300);
		setTimeout(run, 1500);
	},

	/**
	 * Sizes the body iframe of a card to its content, so the whole
	 * conversation scrolls as one document, and makes sure wheel events
	 * inside the iframe scroll this panel.
	 *
	 * @param {Ext.Panel} card The card to adjust.
	 * @private
	 */
	adjustCardBody: function(card)
	{
		if (!card.rendered || card.collapsed || this.isDestroyed) {
			return;
		}

		if (!card.messageBodyCmp) {
			var found = card.findByType('zarafa.messagebody');
			card.messageBodyCmp = found.length > 0 ? found[0] : undefined;
		}
		var messageBody = card.messageBodyCmp;
		if (!messageBody || !messageBody.rendered) {
			return;
		}

		var iframe = messageBody.getEl().dom;
		try {
			var doc = iframe.contentDocument;
			var body = doc ? doc.body : null;
			if (body) {
				// Neutralize percentage heights, which would feed the current
				// iframe height back into the measurement.
				body.style.height = 'auto';
				if (doc.documentElement) {
					doc.documentElement.style.height = 'auto';
				}

				// scrollHeight is floored by the current viewport height, so
				// measure with a collapsed viewport to get the true content
				// height (otherwise any slack compounds on every re-measure).
				iframe.style.height = '10px';
				var contentHeight = body.scrollHeight;

				// Long messages are capped to roughly the pane height and
				// scroll themselves (see #forwardIframeScroll).
				var cap = Math.max(300, (this.body ? this.body.getHeight() : 900) - 140);
				iframe.style.height = Math.max(40, Math.min(contentHeight + 8, cap)) + 'px';
			}
		} catch (e) {
			// Cross-origin or detached iframe: keep the default height.
		}

		this.forwardIframeScroll(card, iframe);
	},

	/**
	 * Forwards mouse wheel events from inside the body iframe of a card to
	 * this panel: the iframes are sized to their content and never scroll
	 * themselves, but wheel events inside an iframe do not reach the parent
	 * document, which would make the conversation impossible to scroll while
	 * the cursor is above a message body.
	 *
	 * @param {Ext.Panel} card The card the iframe belongs to.
	 * @param {HTMLElement} iframe The body iframe of the card.
	 * @private
	 */
	forwardIframeScroll: function(card, iframe)
	{
		var me = this;
		try {
			var doc = iframe.contentDocument;
			if (!doc) {
				return;
			}

			// Writing the iframe document removes listeners but not always the
			// document object itself; unhook a previous handler to avoid
			// forwarding twice when the document was reused.
			if (card.wheelForwardDoc && card.wheelForwardHandler) {
				try {
					card.wheelForwardDoc.removeEventListener('wheel', card.wheelForwardHandler);
				} catch (e) {
					// The old document is gone; nothing to unhook.
				}
			}

			var handler = function(event) {
				// A message that is taller than its (capped) iframe scrolls
				// itself first; only at its top/bottom edge the wheel moves
				// the conversation. Short messages always move the conversation.
				try {
					var innerDoc = iframe.contentDocument;
					var scrollEl = innerDoc.scrollingElement || innerDoc.documentElement;
					var maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight;
					if (maxScroll > 1) {
						var up = event.deltaY < 0;
						var atTop = scrollEl.scrollTop <= 0;
						var atBottom = scrollEl.scrollTop >= maxScroll - 1;
						if ((up && !atTop) || (!up && !atBottom)) {
							// Native scrolling of the message itself.
							return;
						}
					}
				} catch (e) {
					// Fall through to scrolling the conversation.
				}

				var scroller = me.body ? me.body.dom : null;
				if (scroller) {
					scroller.scrollTop += event.deltaY;
					event.preventDefault();
				}
			};
			doc.addEventListener('wheel', handler, { passive: false });
			card.wheelForwardDoc = doc;
			card.wheelForwardHandler = handler;
		} catch (e) {
			// Inaccessible iframe document: scrolling next to the cards still works.
		}
	},

	/**
	 * Builds the header line of a card: avatar, sender (or the recipients for
	 * an own message) and the date.
	 *
	 * @param {Zarafa.mail.MailRecord} record The message.
	 * @return {String} The header html.
	 * @private
	 */
	getCardTitle: function(record)
	{
		var sent = record.get('folder_name') === 'sent_items';
		var name;
		if (sent) {
			name = '→ ' + String(record.get('display_to') || '').split(';').map(function(part) {
				return part.trim();
			}).filter(function(part) {
				return !Ext.isEmpty(part);
			}).join(', ');
		} else {
			name = record.get('sent_representing_name') || record.get('sender_name') || '';
		}

		var initial = String(record.get('sent_representing_name') || record.get('sender_name') || '?').trim().charAt(0).toUpperCase();
		var date = record.get('message_delivery_time') || record.get('client_submit_time');
		var dateText = Ext.isDate(date) ? date.format(_('d-m-Y G:i')) : '';

		return '<span class="k-avatar">' + Ext.util.Format.htmlEncode(initial) + '</span>' +
			'<span class="k-sender">' + Ext.util.Format.htmlEncode(name) + '</span>' +
			'<span class="k-date">' + Ext.util.Format.htmlEncode(dateText) + '</span>';
	},

	/**
	 * Scrolls the card of the given record into view and highlights it.
	 *
	 * @param {Zarafa.mail.MailRecord} record The record to focus.
	 * @private
	 */
	focusRecord: function(record)
	{
		if (!record || !this.recordCards) {
			return;
		}
		var card = this.recordCards[record.get('entryid')];
		if (!card) {
			return;
		}

		if (card.collapsed) {
			card.expand();
		}

		(function() {
			if (this.isDestroyed || !card.el || !card.el.dom) {
				return;
			}
			card.el.scrollIntoView(this.body, false);
			Ext.each(this.items ? this.items.items : [], function(item) {
				item.el.removeClass('k-conversation-item-focus');
			});
			card.el.addClass('k-conversation-item-focus');
		}).defer(50, this);
	},

	/**
	 * Cleans up the store binding.
	 * @private
	 */
	onDestroy: function()
	{
		this.bindStore(undefined);
		Zarafa.mail.ui.ConversationViewPanel.superclass.onDestroy.apply(this, arguments);
	}
});

Ext.reg('zarafa.conversationviewpanel', Zarafa.mail.ui.ConversationViewPanel);
