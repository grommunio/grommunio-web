Ext.namespace('Zarafa.common.rules.ui');

/**
 * @class Zarafa.common.rules.ui.RulesContextMenu
 * @extends Zarafa.core.ui.menu.ConditionalMenu
 * @xtype zarafa.rulescontextmenu
 *
 * The RulesContextMenu is the context menu that is shown as submenu
 * of the {@link Zarafa.mail.ui.MailGridContextMenu MailGridContextMenu}.
 */
Zarafa.common.rules.ui.RulesContextMenu = Ext.extend(Zarafa.core.ui.menu.ConditionalMenu, {

	/**
	 * @cfg {Zarafa.common.rules.data.RulesStore} store store to use for adding rules
	 */
	store : undefined,

	/**
	 * @cfg {Zarafa.core.data.MAPIStore} store contains {@link #records} on which
	 * rules are going to apply.
	 */
	mailStore : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function (config)
	{
		var senderName, subject, mailStore;
		if (Array.isArray(config.records)) {
			var record = config.records[0];
			mailStore = record.getStore();
			senderName = record.get('sender_name');
			var sentRepresentingName = record.get('sent_representing_name');

			// In case of any mail which has been sent on behalf of other user then show the name of that user.
			if (sentRepresentingName && sentRepresentingName!== senderName) {
				senderName = record.get('sent_representing_name');
			}

			senderName = senderName.bold();
			subject = record.get('subject');
		} else {
			mailStore = config.records.getStore();
		}

		Ext.applyIf(config || {}, {
			xtype: 'zarafa.rulescontextmenu',
			defaults: {
				cls : 'k-rules-menu-item'
			},
			mailStore : mailStore,
			store : new Zarafa.common.rules.data.RulesStore({
				'storeEntryId': container.getHierarchyStore().getDefaultStore().get('store_entryid')
			}),
			items: [{
				xtype : 'zarafa.conditionalitem',
				text : String.format(_('Always move messages from {0}'), senderName),
				name: 'ruleForSender',
				handler: this.onCreateRuleForSender,
				beforeShow: this.onBeforeshowHandler,
				scope: this
			},{
				xtype : 'zarafa.conditionalitem',
				text : _('Always move messages that are sent to <recipients>'),
				name : 'ruleForRecipient',
				handler : this.onCreateRuleForRecipient,
				beforeShow: this.onBeforeshowHandler,
				scope : this
			},{
				text : _('Always move messages with this subject'),
				hidden : Ext.isEmpty(subject),
				handler: this.onCreateRuleForSubject,
				scope: this
			},{
				text : _('Create rule...'),
				handler: this.onCreateRule,
				scope: this
			}]
		});

		Zarafa.common.rules.ui.RulesContextMenu.superclass.constructor.call(this, config);
		this.store.on('save', this.onSaveRecord, this);
		this.mon(this.mailStore,'load', this.onLoad, this);
	},

	/**
	 * Event handler triggers before the item shows. Disable the item ruleForRecipient
	 * If there is no recipients available other than loggedIn user.
	 * If It's Report mail then disable ruleForSender and ruleForRecipient menu items.
	 *
	 * @param {Zarafa.core.ui.menu.ConditionalItem} item The item to enable/disable
	 * @param {Zarafa.core.data.IPMRecord[]} records The records which must be checked
	 * to see if the item must be enabled or disabled.
	 * @private
	 */
	onBeforeshowHandler: function(item, records)
	{
		var itemName = item.name;
		var record = records[0];
		var isReportMessageClass = record.isMessageClass('REPORT.IPM', true);

		// If It's Report mail then Don't show sender and recipient rules.
		if (isReportMessageClass) {
			item.setDisabled(true);
			return;
		}

		if (itemName === 'ruleForRecipient') {
			var ccRecipients = record.get('display_to');
			var toRecipients = record.get('display_cc');
			var bccRecipients = record.get('display_bcc');
			var ownerName = record.get('received_by_name');
			// If mail is in sentItems then receiver name will be empty.
			if (Ext.isEmpty(ownerName)) {
				ownerName = record.get('sender_name');
			}

			var totalRecipients = ccRecipients.split(';');
			totalRecipients = totalRecipients.concat(toRecipients.split(';'));
			totalRecipients = totalRecipients.concat(bccRecipients.split(';'));

			totalRecipients = totalRecipients.filter(function(recipient) {
				return !Ext.isEmpty(recipient) && recipient.indexOf(ownerName) < 0;
			});

			// If no one other than owner of mailbox is present in To and CC then disable this menu item.
			if (Ext.isEmpty(totalRecipients)) {
				item.setDisabled(true);
			}
		}
	},

	/**
	 * Show a {@link Zarafa.core.ui.notifier.Notifier Notification} to the user indicating that Rule
	 * was saved successfully.
	 */
	onSaveRecord : function()
	{
		container.getNotifier().notify('info.saved','Saved', 'Rule saved successfully');
	},

	/**
	 * Event handler which is called when the user selects the 'Create rule..'
	 * item in the sub context menu. This will open the rule dialog for creating new rule.
	 * @private
	 */
	onCreateRule : function()
	{
		// FIXME: Need to hide context menu for the case where User keep on clicking the same context menu
		// while this handler is being executed.
		this.hide();

		var ruleRecord = this.createRuleRecord();

		this.store.add(ruleRecord);
		Zarafa.common.Actions.openRulesEditContent(ruleRecord, { removeRecordOnCancel : true , autoSave : true});
	},

	/**
	 * Event handler which is called when the user selects the 'Always move messages from'
	 * item in the sub context menu. This will open the rule dialog for creating new rule
	 * with condition as of type {@link Zarafa.common.rules.data.ConditionFlags.RECEIVED_FROM RECEIVED_FROM}
	 * and action as of type {@link Zarafa.common.rules.data.ActionFlags.MOVE MOVE}.
     *
     * @param {Ext.menu.Item} button which is clicked.
	 * @private
	 */
	onCreateRuleForSender : function(button)
	{
		// FIXME: Need to hide context menu for the case where User keep on clicking the same context menu
		// while this handler is being executed. This will create multiple conditions and actions in a Rule dialog.
		this.hide();

		var mailRecord = this.records[0];

		if (!mailRecord.isOpened()) {
			this.openRecord(mailRecord, button.name);
			return;
		}

		var ruleRecord = this.createRuleRecord();
		var userStore = mailRecord.getSubStore('reply-to');
		var conditionId = Zarafa.common.rules.data.ConditionFlags.RECEIVED_FROM;
		var actionId = Zarafa.common.rules.data.ActionFlags.MOVE;
		var definitions = this.getDefinitions(conditionId, actionId);

		var condition = definitions.conditionDefinition({store : userStore});
		var action = definitions.actionDefinition();
		ruleRecord.set('rule_condition', condition);
		ruleRecord.set('rule_actions', action);
		this.store.add(ruleRecord);

		Zarafa.common.Actions.openRulesEditContent(ruleRecord, { removeRecordOnCancel : true , autoSave : true});
	},

	/**
	 * Event handler which is called when the user selects the 'Always move messages that are sent to <recipient>'
	 * item in the sub context menu. This will open the rule dialog for creating new rule
	 * with condition as of type {@link Zarafa.common.rules.data.ConditionFlags.SENT_TO SENT_TO}
	 * and action as of type {@link Zarafa.common.rules.data.ActionFlags.MOVE MOVE}.
	 *
	 * @param {Ext.menu.Item} button which is clicked.
	 * @private
	 */
	onCreateRuleForRecipient : function(button)
	{
		//FIXME: Need to hide context menu for the case where User keep on clicking the same context menu
		// while this handler is being executed. This will create multiple conditions and actions in a Rule dialog.
		this.hide();

		var mailRecord = this.records[0];

		if (!mailRecord.isOpened()) {
			this.openRecord(mailRecord, button.name);
			return;
		}

		// Exclude owner of mailbox from recipients list
		var defaultUserEntryId = mailRecord.get('received_by_entryid');
		// If mail is in sentItems then owner will be sender.
		if (Ext.isEmpty(defaultUserEntryId)) {
			defaultUserEntryId = mailRecord.get('sender_entryid');
		}

		var userStore = new Zarafa.core.data.IPMRecipientStore();
		var recepientSubStore = mailRecord.getSubStore('recipients');
		recepientSubStore.each(function(recipient) {
			var recipientEntryId = recipient.get('entryid');
			if(!Zarafa.core.EntryId.compareEntryIds(defaultUserEntryId, recipientEntryId)) {
				var isUserAlreadyAdded = !Ext.isEmpty(userStore.getById(recipientEntryId));
				if(!isUserAlreadyAdded) {
					userStore.add(recipient.copy(recipientEntryId));
				}
			}
		});

		var ruleRecord = this.createRuleRecord();
		var conditionId = Zarafa.common.rules.data.ConditionFlags.SENT_TO;
		var actionId = Zarafa.common.rules.data.ActionFlags.MOVE;
		var definitions = this.getDefinitions(conditionId, actionId);

		var condition = definitions.conditionDefinition({store : userStore});
		var action = definitions.actionDefinition();

		ruleRecord.set('rule_condition', condition);
		ruleRecord.set('rule_actions', action);
		this.store.add(ruleRecord);

		Zarafa.common.Actions.openRulesEditContent(ruleRecord, { removeRecordOnCancel : true , autoSave : true});
	},

	/**
	 * Event handler which is called when the user selects the 'Always move messages with this subject'
	 * item in the sub context menu. This will open the rule dialog for creating new rule
	 * with condition as of type {@link Zarafa.common.rules.data.ConditionFlags.SUBJECT_WORDS SUBJECT_WORDS}
	 * and action as of type {@link Zarafa.common.rules.data.ActionFlags.MOVE MOVE}.
	 * @private
	 */
	onCreateRuleForSubject : function()
	{
		//FIXME: Need to hide context menu for the case where User keep on clicking the same context menu
		// while this handler is being executed. This will create multiple conditions and actions in a Rule dialog.
		this.hide();

		var mailRecord = this.records[0];
		var subject = mailRecord.get('subject');
		var wordStore = new Ext.data.Store({ fields : [ 'words' ] });
		wordStore.add(new Ext.data.Record({ words : subject }));

		var ruleRecord = this.createRuleRecord();
		var conditionId = Zarafa.common.rules.data.ConditionFlags.SUBJECT_WORDS;
		var actionId = Zarafa.common.rules.data.ActionFlags.MOVE;
		var definitions = this.getDefinitions(conditionId, actionId);

		var condition = definitions.conditionDefinition({store : wordStore});
		var action = definitions.actionDefinition();
		ruleRecord.set('rule_name', subject);
		ruleRecord.set('rule_condition', condition);
		ruleRecord.set('rule_actions', action);
		this.store.add(ruleRecord);

		Zarafa.common.Actions.openRulesEditContent(ruleRecord, {removeRecordOnCancel : true , autoSave : true});
	},

	/**
	 * General Function to get required condition and action definitions.
	 *
	 * @param {Zarafa.common.rules.data.ConditionFlags} conditionId for which we need definition function.
	 * @param {Zarafa.common.rules.data.ActionFlags} actionId for which we need definition function.
	 * @return {Object} returns Object that will contain condition and action definitions.
	 * @private
	 */
	getDefinitions : function(conditionId, actionId)
	{
		var conditionFactory = container.getRulesFactoryByType(Zarafa.common.data.RulesFactoryType.CONDITION);
		var conditionDefinition = conditionFactory.getConditionById(conditionId);

		var actionFactory = container.getRulesFactoryByType(Zarafa.common.data.RulesFactoryType.ACTION);
		var actionDefinition = actionFactory.getActionById(actionId);

		return {
			conditionDefinition : conditionDefinition,
			actionDefinition : actionDefinition
		};
	},

	/**
	 * General Function to create and get new {@link Zarafa.common.rules.data.RulesRecord RulesRecord}.
	 *
	 * @return {Zarafa.common.rules.data.RulesRecord} returns newly created Rule's Record.
	 * @private
	 */
	createRuleRecord : function() {
		return Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RULE);
	},

	/**
	 * Function which is used to open the mail record item and attach given handler for 'open' event with record's store.
	 *
	 * @param {Zarafa.core.data.IPMRecord} mailRecord which needs to be opened.
	 * @param {String} buttonName of clicked menu item.
	 * @private
	 */
	openRecord : function(mailRecord, buttonName)
	{
		var store = mailRecord.getStore();
		var handler = function(store, record) {
			if (!Zarafa.core.EntryId.compareEntryIds(mailRecord.get('entryid'), record.get('entryid'))) {
				return;
			}
			store.un('open', handler, this);

			switch (buttonName) {
				case 'ruleForSender':
					this.onCreateRuleForSender();
					break;
				case 'ruleForRecipient':
					this.onCreateRuleForRecipient();
					break;
			}
		};

		store.on('open', handler, this);
		mailRecord.open();
	},

	/**
	 * Event handler for the load event of {@link Zarafa.mail.MailStore store}
	 * When we have {@link Zarafa.mail.ui.MailGridContextMenu contextmenu} open
	 * and if we receive a new email then store and sub store of the selected records
	 * are not accessible anymore,so we have to get a new records by the entryid of the old records.
	 * @param {Zarafa.mail.MailStore} store This store
	 * @param {Zarafa.core.data.IPMRecord[]} records loaded record set
	 * @param {Object} options the options (parameters) with which the load was invoked.
	 * @private
	 */
	onLoad : function (store, records, options)
	{
		var newRecords = [];
		Ext.each(this.records, function (record) {
			record = store.getById(record.id);
			if(record) {
				newRecords.push(record);
			} else {
				// If the selected record is not in the store anymore then destroy context menu
				this.destroy();
			}
		}, this);

		this.records = newRecords;
	}
});

Ext.reg('zarafa.rulescontextmenu', Zarafa.common.rules.ui.RulesContextMenu);
