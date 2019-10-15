Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.MessageRecordFields
 * Array of {@link Ext.data.Field field} configurations for the
 * {@link Zarafa.core.data.MAPIRecord MAPIRecord} object which is
 * used as Message (which is sendable/receivable)
 * @private
 */
Zarafa.core.data.MessageRecordFields = [
	{name: 'received_by_name'},
	{name: 'received_by_email_address'},
	{name: 'received_by_username'},
	{name: 'received_by_address_type'},
	{name: 'received_by_entryid'},
	{name: 'received_by_search_key'},
	{name: 'received_by_presence_status'}, // Note: this field will not be filled by the back-end
	{name: 'received_representing_name'},
	{name: 'received_representing_email_address'},
	{name: 'received_representing_address_type'},
	{name: 'received_representing_entryid'},
	{name: 'received_representing_search_key'},
	{name: 'delegated_by_rule', type: 'boolean', defaultValue: false},
	{name: 'message_delivery_time', type:'date', dateFormat:'timestamp', defaultValue: null, sortDir : 'DESC'},
	{name: 'client_submit_time', type:'date', dateFormat:'timestamp', defaultValue: null, sortDir : 'DESC'},
	{name: 'transport_message_headers'},
	{name: 'hide_attachments', type: 'boolean', defaultValue: false},
];

/**
 * @class Zarafa.core.data.MessageRecord
 * @extends Zarafa.core.data.IPMRecord
 *
 * An extension to the {@link Zarafa.core.data.IPMRecord IPMRecord} specific to records which are
 * sendable / receivable.
 */
Zarafa.core.data.MessageRecord = Ext.extend(Zarafa.core.data.IPMRecord, {
	/**
	 * Flag will be used to indicate {@link Zarafa.core.data.MessageRecord MessageRecord} contains external content
	 * in the body property or not. Flag is used here because everytime we load the same mail then we don't have to
	 * run through {@link Zarafa.core.HTMLParser HTMLParser} to find out if it contains external content or not
	 * as checking whole body consumes lots of resources so we check only once and store the value for further uses.
	 * @property
	 * @type Boolean
	 */
	externalContent : false,

	/**
	 * Function will check if {@link Zarafa.core.data.IPMRecord IPMRecord} contains external content
	 * in the body property.
	 * @param {String} body (optional) contents of body property of {@link Zarafa.core.data.IPMRecord IPMRecord}.
	 * @return {Boolean} true if {@link Zarafa.core.data.IPMRecord IPMRecord} contains external content else false.
	 */
	hasExternalContent : function(body)
	{
		body = Ext.isDefined(body) ? body : this.getBody();

		// plain text mails can not have external content
		if(!this.get('isHTML')) {
			this.externalContent = false;
			return this.externalContent;
		}

		if(!this.externalContent || this.isModifiedSinceLastUpdate('html_body')) {
			this.externalContent = Zarafa.core.HTMLParser.hasExternalContent(body);
		}

		return this.externalContent;
	},

	/**
	 * Helper function to get contents of body property of {@link Zarafa.core.data.IPMRecord IPMRecord}
	 * it will also check {@link Zarafa.core.Settings Settings} if it needs to remove external content and return
	 * filtered content.
	 * @param {Boolean} preferHTML True if the HTML body should be returned or not, false if the plain-text
	 * body should be returned.
	 * @return {String} filtered contents of body property of {@link Zarafa.core.data.IPMRecord IPMRecord}.
	 */
	getBody : function(preferHTML)
	{
		var isHTML = this.get('isHTML');
		var actualBody = Zarafa.core.data.MessageRecord.superclass.getBody.call(this, preferHTML);

		// If plain-text is requested, or this message is in plain-text, then we don't
		// need to block the external content.
		if (isHTML === true && preferHTML === true && !Ext.isEmpty(actualBody)) {
			// if record is not sent yet then it is a new mail or a draft,
			// so we don't need to block the external content while composing mail.
			if(this.isUnsent() || !this.isExternalContentBlocked(actualBody)) {
				return actualBody;
			}
			return Zarafa.core.HTMLParser.blockExternalContent(actualBody);
		} else {
			return actualBody;
		}
	},

	/**
	 * Removes some weird styling that Outlook adds to html mails.
	 *
	 * @param {String} body The text that should be cleaned up
	 * @return {String} The cleaned up text
	 */
	cleanupOutlookStyles: function(body) {
		// clean up some weird Outlook styling
		const el = document.createElement('div');
		el.innerHTML = body;
		const paragraphs = el.querySelectorAll('p'); //MsoListParagraph
		for (let i=0; i<paragraphs.length; i++) {
			const p = Ext.fly(paragraphs[i]);

			// First check for MsoListParagraph elements created by Outlook 2013
			if (p.hasClass('MsoListParagraph')) {
				p.setStyle({
					'text-indent': 0
				});
			}

			// Remove generic browser margins from paragraphs
			if (!p.getStyle('margin')) {
				p.setStyle({
					margin: 0
				});
			}

			// Try to find and remove the 'non-breaking spaces' that Outlook
			// adds after the numbers and bullets of lists
			var all = paragraphs[i].querySelectorAll('*');
			for (let j=0; j<all.length; j++) {
				if (all[j].innerText && all[j].innerText.trim() === '') {
					all[j].innerHTML = '&nbsp;';
				}

				if ((/^\d+\.(&nbsp;)+$/).test(all[j].innerHTML)) {
					all[j].innerHTML = all[j].innerHTML.replace(/(&nbsp;)+/, '&nbsp;');
				}
			}

			var font = paragraphs[i].querySelector('font[face="Symbol"]');
			if (font) {
				font = font.querySelectorAll('font');
				for (let j=0; j<font.length; j++) {
					if (font[j].innerText.trim() === '') {
						font[j].innerHTML = '&nbsp;';
					}
				}
			}
		}

		// Remove strange margin on tables
		const tables = el.querySelectorAll('table.MsoNormalTable');
		for (let i=0; i<tables.length; i++) {
			const t = Ext.fly(tables[i]);

			if (parseFloat(t.getStyle('margin-left')) < 0) {
				t.setStyle({
					'margin-left': null
				});
			}
		}

		return el.innerHTML;
	},

	/**
	 * Function is used to convert a mail record to task record.
	 * @param {Zarafa.core.IPMFolder} folder The target folder in which the new record must be
	 * created.
	 * @return {Zarafa.core.data.IPMRecord} record The newly created task.
	 */
	convertToTask : function(folder)
	{
		return this.convertRecord(folder, 'IPM.Task');
	},

	/**
	* Convert a mail record to an appointment record by using the mail's
	* @param {Zarafa.core.IPMFolder} folder The target folder in which the new record must be
	* created.
	* @return {Zarafa.core.data.IPMRecord} record The newly created appointment.
	*/
	convertToAppointment : function(folder)
	{
		return this.convertRecord(folder, 'IPM.Appointment');
	},

	/**
	 * Convert a mail record to a record with the provided messageClass
	 * @param {Zarafa.core.IPMFolder} folder The target folder in which the new record must be
	 * created.
	 * @param {String} messageClass the messageClass of the new item.
	 * @return {Zarafa.core.data.IPMRecord} record The newly created appointment.
	 * @private
	 */
	convertRecord : function(folder, messageClass)
	{
		var defaultStore = folder.getMAPIStore();

		var newRecord = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass(messageClass, {
			store_entryid : folder.get('store_entryid'),
			parent_entryid : folder.get('entryid'),
			subject : this.get('subject'),
			body : this.getBody(false),
			importance : this.get('importance'),
			categories : this.get('categories'),
			owner : defaultStore.isPublicStore() ? container.getUser().getFullName() : defaultStore.get('mailbox_owner_name')
		});

		// Set icon based on messageClass
		newRecord.set('icon_index', Zarafa.core.mapi.IconIndex[Zarafa.common.ui.IconClass.getIconClassFromMessageClass(newRecord)]);

		/**
		 * By copying the reference to the original mail,
		 * the server is able to add attachments in to the appointment.
		 */
		newRecord.addMessageAction('source_entryid', this.get('entryid'));
		newRecord.addMessageAction('source_store_entryid', this.get('store_entryid'));

		// Initialize the appointmentRecord with attachments
		var store = newRecord.getAttachmentStore();
		var origStore = this.getAttachmentStore();
		origStore.each(function (attach) {
			store.add(attach.copy());
		}, this);

		return newRecord;
	},

	/**
	 * Function will check if the {@link Zarafa.core.data.IPMRecord IPMRecord} contains any external content
	 * in body part and if we should show it or hide it based on {@link Zarafa.core.Settings Settings}.
	 * @param {String} body (optional) contents of body property of {@link Zarafa.core.data.IPMRecord IPMRecord}.
	 * @return {String} filtered contents of body property of {@link Zarafa.core.data.IPMRecord IPMRecord}.
	 */
	isExternalContentBlocked : function(body)
	{
		body = Ext.isDefined(body) ? body : this.getBody();

		if(Ext.isEmpty(body)) {
			// no point of continueing with empty body
			return false;
		}

		// check settings
		if(!container.getSettingsModel().get('zarafa/v1/contexts/mail/block_external_content')) {
			return false;
		}

		var blockExternalContent = true;
		var ignoreChecks = false;
		var senderSMTPAddress = (this.get('sent_representing_email_address') || this.get('sender_email_address')).toLowerCase();
		var safeSenders = container.getSettingsModel().get('zarafa/v1/contexts/mail/safe_senders_list', true).map(function(s){return s.toLowerCase();});

		// if block_status property is set correctly then ignore all settings and show external content
		if(this.checkBlockStatus()) {
			blockExternalContent = false;
			ignoreChecks = true;
		}

		// first check for perfect match
		if(!ignoreChecks) {
			// safe sender list will have higher priority then blocked sender list
			if(safeSenders.indexOf(senderSMTPAddress) != -1) {
				blockExternalContent = false;
				ignoreChecks = true;
			}
		}

		// now check for partial matches
		if(!ignoreChecks) {
			// safe sender list will have higher priority then blocked sender list
			if(Zarafa.core.Util.inArray(safeSenders, senderSMTPAddress, true, true)) {
				blockExternalContent = false;
			}
		}

		if(blockExternalContent && this.hasExternalContent(body)) {
			return true;
		}

		return false;
	},

	/**
	 * Function will check block_status property value and compare it with generated value from
	 * message_delivery_time property value and if both matches then we can say that external content
	 * should be shown.
	 * @return {Boolean} returns true if external content should be blocked else false
	 */
	checkBlockStatus : function()
	{
		if (this.senderIsUser()) {
			return true;
		}

		if (!this.get('block_status') || !Ext.isDate(this.get('message_delivery_time'))) {
			return false;
		}

		return this.get('block_status') == this.calculateBlockStatus();
	},

	/**
	 * Function will calculate value of block_status property based on message_delivery_time property value.
	 * Formula for calculation of block status value can be checked at
	 * http://msdn.microsoft.com/en-us/library/ee219242(v=EXCHG.80).aspx.
	 * @return {Number} calculated value of block status property.
	 */
	calculateBlockStatus : function()
	{
		if(!Ext.isDate(this.get('message_delivery_time'))) {
			return 0;
		}

		// generate block status value from message_delivery_time property
		// no of days between 30th december 1899 and 1st jan 1970 = 2209161600 / 86400 = 25569
		var days = 25569;

		// convert message_delivery_time property to number of days from 1st jan 1970
		// 86400 = no of seconds in a day, 1000 is used to convert timestamp from miliseconds to seconds
		days += (this.get('message_delivery_time').getTime() / (86400 * 1000));

		var result = ((days - Math.floor(days)) * 100000000) + 3;
		result = Math.floor(result);

		return result;
	},

	/**
	 * Function is used to check if the sender and receiver in the message is same or different
	 * first it checks for entryids of sender and receiver and if no entryids are present then it checks
	 * on smtp/email address of sender and receiver.
	 * @FIXME when sentItems folder is selected, propertes 'received_by_entryid' and 'received_by_email_address' are not set.
	 * @return {Boolean} true if sender and receiver is same user else false.
	 */
	senderIsReceiver : function()
	{
		var senderEntryId = this.get('sent_representing_entryid') || this.get('sender_entryid');
		var receiverEntryId = this.get('received_by_entryid');

		if(!Ext.isEmpty(senderEntryId) && !Ext.isEmpty(receiverEntryId)) {
			// @FIXME tweak EntryId object to handle addressbook entryids also
			return Zarafa.core.EntryId.compareABEntryIds(senderEntryId, receiverEntryId);
		}

		// if no entryids are present then check for smtp address
		var senderAddress = this.get('sent_representing_email_address') || this.get('sender_email_address');
		var receiverAddress = this.get('received_by_email_address');

		if(!Ext.isEmpty(senderAddress) && !Ext.isEmpty(receiverAddress)) {
			return senderAddress === receiverAddress;
		}

		return false;
	},

	/**
	 * Function is used to check if the sender in the message and user logged-in is same or different.
	 * @return {Boolean} true if sender and user logged-in is same user else false.
	 */
	senderIsUser : function()
	{
		var senderEntryId = this.get('sent_representing_entryid') || this.get('sender_entryid');
		var userEntryId = container.getUser().getEntryId();

		if(!Ext.isEmpty(senderEntryId) && !Ext.isEmpty(userEntryId)) {
			return Zarafa.core.EntryId.compareABEntryIds(senderEntryId, userEntryId);
		}

		return false;
	},

	/**
	 * Function is used to check if the sender in the message and user message sender is same or different.
	 * @return {Boolean} true if sender and user logged-in is same user else false.
	 */
	senderIsStoreOwner : function()
	{
		var senderEntryId = this.get('sent_representing_entryid') || this.get('sender_entryid');

		var storeOwner = container.getHierarchyStore().getById(this.get('store_entryid'));
		if(storeOwner) {
			var storeOwnerEntryId = storeOwner.get('mailbox_owner_entryid');

			if(!Ext.isEmpty(senderEntryId) && !Ext.isEmpty(storeOwnerEntryId)) {
				return Zarafa.core.EntryId.compareABEntryIds(senderEntryId, storeOwnerEntryId);
			}
		}

		return false;
	},

	/**
	 * Function is used to check if the sender in the message and user logged-in is same or different.
	 * @return {Boolean} true if store owner and user logged-in is same user else false.
	 */
	userIsStoreOwner : function()
	{
		var userEntryId = container.getUser().getEntryId();
		var storeRecord = container.getHierarchyStore().getById(this.get('store_entryid'));

		if(storeRecord) {
			var storeOwnerEntryId = storeRecord.get('mailbox_owner_entryid');

			if(!Ext.isEmpty(userEntryId) && !Ext.isEmpty(storeOwnerEntryId)) {
				return Zarafa.core.EntryId.compareABEntryIds(userEntryId, storeOwnerEntryId);
			}
		}

		return false;
	},

	/**
	 * Function sets delegator infromation on the record.
	 * Function checks whether message record is in logged-in user's store or other store,
	 * if it is in other's store then it sent sent_representing_* properties.
	 * @param {Ext.data.Record} delegatorStore The delegator user store's record which we are looking for
	 * @param {Boolean} force forcefully save the changes to server even if its not changed
	 */
	setDelegatorInfo : function(delegatorStore, force)
	{
		if(delegatorStore) {
			force = force || false;

			this.set('sent_representing_name', delegatorStore.get('mailbox_owner_name'), force);
			this.set('sent_representing_email_address', delegatorStore.get('mailbox_owner_name'), force);
			this.set('sent_representing_address_type', 'ZARAFA', force);
			this.set('sent_representing_entryid', delegatorStore.get('mailbox_owner_entryid'), force);
		}
	},

	/**
	 * Convert data from the record to an {@link Zarafa.core.data.IPMRecipientRecord}
	 * Invoke {@link Zarafa.core.data.RecordFactory#createRecordObjectByCustomType} with arguments {@link Zarafa.core.data.RecordCustomObjectType.ZARAFA_RECIPIENT} and an {@link Object} containing the mapping of properties.
	 * If sender_entryid is not present, return false
	 * @return {Zarafa.core.data.IPMRecipientRecord}
	 */
	getSender : function()
	{
		if(!this.get('sender_entryid')){
			return false;
		}

		var sender = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RECIPIENT, {
			smtp_address : this.get('sender_email_address'),
			display_name : this.get('sender_name'),
			address_type : this.get('sender_address_type'),
			entryid : this.get('sender_entryid'),
			search_key : this.get('sender_search_key')
		});

		return sender;
	},

	/**
	 * Convert data from the record to an {@link Zarafa.core.data.IPMRecipientRecord}
	 * Invoke {@link Zarafa.core.data.RecordFactory#createRecordObjectByCustomType} with arguments {@link Zarafa.core.data.RecordCustomObjectType.ZARAFA_RECIPIENT} and an {@link Object} containing the mapping of properties.
	 * If sent_representing_entryid is not present, return false
	 * @return {Zarafa.core.data.IPMRecipientRecord}
	 */
	getSentRepresenting : function()
	{
		if(!this.get('sent_representing_entryid')){
			return false;
		}

		var sender = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RECIPIENT, {
			smtp_address : this.get('sent_representing_email_address'),
			display_name : this.get('sent_representing_name'),
			address_type : this.get('sent_representing_address_type'),
			entryid : this.get('sent_representing_entryid'),
			search_key : this.get('sent_representing_search_key')
		});

		return sender;
	},

	/**
	 * Function is used to set the default Cc recipient in New or Reply mail as per the user
	 * configured in settings.
	 */
	setDefaultCcRecipients : function ()
	{
		var actionType = this.getMessageAction('action_type');
		var isCreateAction = !this.hasMessageAction('action_type') && this.phantom;
		var isReplyAction = actionType === Zarafa.mail.data.ActionTypes.REPLY;

		// return if mail is not reply or new mail.
		if (isCreateAction === false && isReplyAction === false) {
			return;
		}

		var settingsModel = container.getSettingsModel();
		var defaultCcRecipients  = settingsModel.get('zarafa/v1/contexts/mail/cc_recipients', []);
		var recipientStore = this.getRecipientStore();

		for (var i = 0; i < defaultCcRecipients.length; i++) {
			var recipient = defaultCcRecipients[i];
			if (recipientStore.isRecipientExists(recipient) || isCreateAction && !recipient['new_mail'] || isReplyAction && !recipient['reply_mail']) {
				continue;
			}

			var recipientData = Ext.apply({}, recipient);

			// Create a new recipient containing all data from the original.
			var record = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RECIPIENT, recipientData);

			// We have copied the 'rowid' as well, but new recipients
			// shouldn't have this property as it will be filled in by PHP.
			record.set('rowid', undefined);

			recipientStore.add(record);
		}
	}
});

/**
 * This will initialize the properties for a phantom {@link Zarafa.core.data.MAPIRecord record},
 * which are needed to correctly send out the message.
 * @param {Zarafa.core.data.MAPIRecord} record The phantom record to initialize
 * @method
 */
Zarafa.core.data.MessageRecordPhantomHandler = function(record) {
	var userInfo = container.getUser();

	record.beginEdit();
	record.set('sender_name', userInfo.getFullName());
	record.set('sender_address_type', 'ZARAFA');
	record.set('sender_email_address', userInfo.getUserName());
	record.set('sender_entryid', userInfo.getEntryId());
	record.set('sender_search_key', userInfo.getSearchKey());

	// set delegate properties if needed
	if(!record.userIsStoreOwner()) {
		var storeRecord = container.getHierarchyStore().getById(record.get('store_entryid'));
		if(storeRecord) {
			record.setDelegatorInfo(storeRecord);
		}
	}

	record.endEdit();
};
