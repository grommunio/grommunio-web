/*
 * #dependsFile client/zarafa/core/mapi/ObjectType.js
 * #dependsFile client/zarafa/core/mapi/MessageFlags.js
 * #dependsFile client/zarafa/core/data/Record.js
 * #dependsFile client/zarafa/core/data/RecordFactory.js
 * #dependsFile client/zarafa/core/data/IPMRecipientStore.js
 * #dependsFile client/zarafa/core/data/IPMAttachmentStore.js
 */
Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.IPMRecordFields
 * Array of {@link Ext.data.Field field} configurations for the
 * {@link Zarafa.core.data.IPMRecord IPMRecord} object.
 * These fields will be available in all 'IPM' and 'REPORT.IPM' type messages.
 * @private
 */
Zarafa.core.data.IPMRecordFields = [
	{name: 'body', type: 'string'},
	{name: 'html_body', type: 'string'},
	{name: 'isHTML', type:'boolean', defaultValue: false},
	{name: 'entryid'},
	{name: 'creation_time', type:'date', dateFormat:'timestamp', defaultValue: null, sortDir : 'DESC'},
	{name: 'icon_index', type: 'int', defaultValue: -1},
	{name: 'access', type: 'number', defaultValue: Zarafa.core.mapi.Access.ACCESS_READ},
	{name: 'message_class', type: 'string'},
	{name: 'message_flags', type: 'int', defaultValue: Zarafa.core.mapi.MessageFlags.MSGFLAG_UNSENT | Zarafa.core.mapi.MessageFlags.MSGFLAG_READ},
	{name: 'read_receipt_requested', type: 'boolean', defaultValue: false},
	{name: 'parent_entryid'},
	{name: 'store_entryid'},
	{name: 'subject'},
	{name: 'object_type', type: 'int', defaultValue: Zarafa.core.mapi.ObjectType.MAPI_MESSAGE},
	{name: 'normalized_subject'},
	{name: 'last_modification_time', type:'date', dateFormat:'timestamp', defaultValue: null, sortDir : 'DESC'},
	{name: 'last_verb_execution_time', type:'date', dateFormat:'timestamp', defaultValue: null},
	{name: 'last_verb_executed', type: 'int'},
	{name: 'hasattach', type: 'boolean', defaultValue: false},
	{name: 'display_to'},
	{name: 'display_cc'},
	{name: 'display_bcc'},
	{name: 'sent_representing_name'},
	{name: 'sent_representing_email_address'},
	{name: 'sent_representing_username'},
	{name: 'sent_representing_address_type'},
	{name: 'sent_representing_entryid'},
	{name: 'sent_representing_search_key'},
	{name: 'sent_representing_presence_status'}, // Note: this field will not be filled by the back-end
	{name: 'sender_name'},
	{name: 'sender_email_address'},
	{name: 'sender_username'},
	{name: 'sender_address_type'},
	{name: 'sender_entryid'},
	{name: 'sender_search_key'},
	{name: 'sender_presence_status'}, // Note: this field will not be filled by the back-end
	{name: 'message_size', type: 'int'},
	{name: 'categories'},
	{name: 'deleted_on', type:'date', dateFormat:'timestamp', defaultValue: null},
    {name: 'deferred_send_time', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	// required when converting attachment record to ipm record for opening embedded messages
	{name: 'attach_num', defaultValue: null}
];

// Register these properties as base for the IPM message class, this will ensure that every IPM.* class
// will have these properties. We also install the MAPI_MESSAGE object type in case we receive a broken
// message which only has an object_type but doesn't have a message class.
Zarafa.core.data.RecordFactory.addFieldToMessageClass('IPM', Zarafa.core.data.IPMRecordFields);
Zarafa.core.data.RecordFactory.addFieldToMessageClass('REPORT.IPM', Zarafa.core.data.IPMRecordFields);
Zarafa.core.data.RecordFactory.addFieldToObjectType(Zarafa.core.mapi.ObjectType.MAPI_MESSAGE, Zarafa.core.data.IPMRecordFields);

Zarafa.core.data.RecordFactory.addListenerToMessageClass('IPM', 'createphantom', function(record) {
	// Phantom records must always be marked as opened (they contain the full set of data)
	record.afterOpen();
});

Zarafa.core.data.RecordFactory.addListenerToObjectType(Zarafa.core.mapi.ObjectType.MAPI_MESSAGE, 'createphantom', function(record) {
	// Phantom records must always be marked as opened (they contain the full set of data)
	record.afterOpen();
});

/**
 * @class Zarafa.core.data.IPMRecord
 * @extends Zarafa.core.data.MAPIRecord
 *
 * An extension to the {@link Zarafa.core.data.MAPIRecord Record} specific to IPM Messages.
 *
 * By default, using {@link Zarafa.core.data.IPMRecord.set set} will set a property for the given
 * {@link Zarafa.core.data.IPMRecord record}. However, additional functions have been provided
 * for the manipulation of recipients, attachments and message actions.
 */
Zarafa.core.data.IPMRecord = Ext.extend(Zarafa.core.data.MAPIRecord, {
	/**
	 * When event propagation is enabled, events about {@link Zarafa.core.data.IPMRecord record}
	 * from the {@link Zarafa.core.data.IPMStore store} will be propagated through a new event
	 * to other {@link Zarafa.core.data.IPMStore stores} by the {@link Zarafa.core.data.IPMStoreMgr IPMStoreMgr}
	 * This should be temporarily be disabled when the {@link Zarafa.core.data.IPMStore store}
	 * is handling an event from {@link Zarafa.core.data.IPMStoreMgr IPMStoreMgr} and will raise
	 * a similar event which will be used by the {@link Zarafa.core.data.IPMStoreMgr IPMStoreMgr} again
	 * (which results in circular events).
	 *
	 * This property can be changed by the function {@link #setEventPropagation} and the status
	 * can be requested using {@link #hasEventPropagation}.
	 *
	 * @property
	 * @type Boolean
	 */
	eventPropagation : true,

	/**
	 * The base array of ID properties which is copied to the {@link #idProperties}
	 * when the record is being created.
	 * @property
	 * @type Array
	 * @private
	 */
	baseIdProperties : [ 'entryid', 'store_entryid', 'parent_entryid', 'attach_num' ],

	/**
	 * Compare this {@link Zarafa.core.data.IPMRecord record} instance with another one to see
	 * if they are the same IPM Message from the server (i.e. The entryid matches).
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The IPMRecord to compare with
	 * @return {Boolean} True if the records are the same.
	 */
	equals : function(record)
	{
		// Simplest case, do we have the same object...
		if (this === record) {
			return true;
		}

		// Check if record definition is changed, then consider it as different record
		if(this.fields !== record.fields) {
			return false;
		}

		// When only one of the 2 records is a phantom, then the
		// records can impossibly be equal...
		if (this.phantom !== record.phantom) {
			return false;
		}

		// For phantom records, no entryid exists. Since both objects thus only
		// contain on the client-side and cannot be represented by 2 different
		// objects, comparison on the id-field only is sufficient.
		if (this.phantom) {
			return this.id == record.id;
		} else {
			var equal = Zarafa.core.EntryId.compareEntryIds(this.get('entryid'), record.get('entryid'));
			if(equal) {
				// compare attach_num as well if embedded message
				if(this.isSubMessage() && record.isSubMessage()) {
					equal = this.get('attach_num').equals(record.get('attach_num'));
				} else if (this.isSubMessage() || record.isSubMessage()) {
					equal = false;
				}
			}

			return equal;
		}
	},

	/**
	 * This will determine if the provided className matches the message_class
	 * on this record. This comparison is done case-insensitive. See {@link Zarafa.core.MessageClass#isClass}
	 * for further details.
	 *
	 * @param {String/Array} className The class name which must be compared to the message_class
	 * @param {Boolean} baseOnly (optional) True when only the start of the message_class needs
	 * to match with the className (So isMessageClass('IPM', true) will return true when the
	 * actual message_class is 'IPM.Note'). Defaults to false.
	 * @return True when the given className matches the message_class.
	 */
	isMessageClass : function(className, baseOnly)
	{
		return Zarafa.core.MessageClass.isClass(this.get('message_class'), className, baseOnly);
	},

	/**
	 * Utility function to get sender string from {@link Zarafa.core.data.IPMRecord IPMRecord},
	 * Fuction will also check if delegate is present then it will generate a different string.
	 * @return {String} string which can be shown in ui as from address.
	 */
	getSenderString : function()
	{
		var sender = '';
		var senderEntryId = this.get('sender_entryid');
		var sentRepresentingEntryId = this.get('sent_representing_entryid');

		if(!Ext.isEmpty(senderEntryId) && !Ext.isEmpty(sentRepresentingEntryId) && !Zarafa.core.EntryId.compareABEntryIds(senderEntryId, sentRepresentingEntryId)) {
			var delegate = !Ext.isEmpty(this.get('sender_name')) ? this.get('sender_name') : this.get('sender_email_address');
			var delegator = !Ext.isEmpty(this.get('sent_representing_name')) ? this.get('sent_representing_name') : this.get('sent_representing_email_address');

			// # TRANSLATORS: {0} indicates name/email address of secretary and {1} indicates boss' name/email address
			sender = String.format(_('{0} on behalf of {1}'), delegate, delegator);
		} else {
			sender = !Ext.isEmpty(this.get('sender_name')) ? this.get('sender_name') : this.get('sender_email_address');
		}

		return sender;
	},

	/**
	 * Helper function to get contents of body property of {@link Zarafa.core.data.IPMRecord IPMRecord}
	 * @param {Boolean} preferHTML True if the HTML body should be returned or not, false if the plain-text
	 * body should be returned.
	 * @return {String} The body property of {@link Zarafa.core.data.IPMRecord IPMRecord}.
	 */
	getBody : function(preferHTML)
	{
		var isHTML = this.get('isHTML');
		var body;

		if (preferHTML === false) {
			if (isHTML) {
				// plain-text requested, convert the body
				body = Zarafa.core.HTMLParser.convertHTMLToPlain(this.get('html_body'));
			} else {
				// Plain-text requested, simply return the basic body
				body = this.get('body');
			}
		} else if (preferHTML === true) {
			if (isHTML) {
				// html requested, simply return the basic body
				// add urls in inline images
				body = this.inlineImgOutlookToZarafa(this.get('html_body'));
			} else {
				// html requested, convert the body
				body = Zarafa.core.HTMLParser.convertPlainToHTML(this.get('body'));
			}
		} else {
			if (isHTML) {
				// add urls in inline images
				body = this.inlineImgOutlookToZarafa(this.get('html_body'));
			} else {
				body = this.get('body');
			}
		}

		return body;
	},

	/**
	 * Helper function to set contents of body property of {@link Zarafa.core.data.IPMRecord IPMRecord}.
	 * @param {String} body body that should be set in {@link Zarafa.core.data.IPMRecord IPMRecord}.
	 * @param {Boolean} isHTMLEditor flag to indicate that we should update html body or plain body
	 * based on type of editor used for modifications.
	 */
	setBody : function(body, isHTMLEditor)
	{
		// Only set the isHTML property when the
		// body has been changed. This prevents the
		// isHTML flag to be sent to client when the
		// body won't be sent.
		if(isHTMLEditor) {
			// convert inline image urls
			body = this.inlineImgZarafaToOutlook(body);

			if (this.get('html_body') !== body) {
				this.set('isHTML', true, true);
				this.set('html_body', body);
			}
		} else {
			// Sometimes record body contains \r\n and editor value always
			// contains \n bue to different line breaking earlier, condition
			// is satisfied and we again set the body in record which mark
			// the record dirty and because of that we get "Unsaved changes..." message box.
			var recordBody = Zarafa.core.HTMLParser.rlnl2nl(this.get('body'));

			if (recordBody !== body) {
				this.set('isHTML', false, true);
				this.set('body', body);
			}
		}
	},

	/**
	 * Function is used to convert inline images source string to proper format which can request the inline
	 * image through server side code. It searches for attach content id property and replaces it with full fledged
	 * url to request image data using download_attachment.php file. This function is called by {@link #getBody}
	 * when requesting html data from record.
	 * @param {String} body html body of the record which should be converted to properly retrieve inline image data.
	 * @return {String} modified data that can retrieve inline images when loaded in editor.
	 */
	inlineImgOutlookToZarafa : function(body)
	{
		var entryid;
		var store;

		var action_type = this.getMessageAction('action_type');
		var attachNum = this.get('attach_num');

		//FIXME: this would only work if all images are either added or from the original record, but not both
		if (this.phantom && (Zarafa.mail.data.ActionTypes.isSendOrForward(action_type) || action_type===Zarafa.mail.data.ActionTypes.EDIT_AS_NEW) ) {
			entryid = this.getMessageAction('source_entryid');
			store = this.getMessageAction('source_store_entryid');
		} else {
			entryid = this.get('entryid');
			store = this.get('store_entryid');
		}

		if (store && entryid) {
			body = Zarafa.core.HTMLParser.inlineImgOutlookToZarafa(body, store, entryid, attachNum);
		}

		return body;
	},

	/**
	 * Function is used to convert inline images source string to proper format which is used by outlook.
	 * It will search for image source containing attach content id property and will replace the whole source string
	 * with just the content id. This function is called by {@link #setBody} we want to save user changed data from
	 * editor the html body of record. This will actually reverse changes done by {@link inlineImgOutlookToZarafa}.
	 * @param {String} body html body from the editor which will be saved in the {@link Zarafa.core.data.IPMRecord IPMRecord}.
	 * @return {String} modified data that can be safely saved in html body of record which is understandable by outlook.
	 */
	inlineImgZarafaToOutlook : function(body)
	{
		return Zarafa.core.HTMLParser.inlineImgZarafaToOutlook(body);
	},

	/**
	 * Convenience method for determining if the message has been read or not.
	 * @return {Boolean} True if this item has been read.
	 */
	isRead : function()
	{
		// embedded message should never be considered as unread messages
		return this.isSubMessage() || (this.get('message_flags') & Zarafa.core.mapi.MessageFlags.MSGFLAG_READ) > 0;
	},

	/**
	 * Convenience method for determining if the message has been sent or not.
	 * @return {Boolean} True if this item has NOT been sent.
	 */
	isUnsent : function()
	{
		return (this.get('message_flags') & Zarafa.core.mapi.MessageFlags.MSGFLAG_UNSENT) > 0;
	},

	/**
	 * Convenience method for determining if the message is a sub message of another message.
	 * @return {Boolean} True if this message is a sub message.
	 */
	isSubMessage : function()
	{
		return !Ext.isEmpty(this.get('attach_num'));
	},

	/**
	 * Convenience method for determining if the message needs a Read Receipt to be send when marking
	 * the message as read.
	 * @return {Boolean} True if this item needs a read receipt to be send.
	 */
	needsReadReceipt : function()
	{
		return (this.get('message_flags') & Zarafa.core.mapi.MessageFlags.MSGFLAG_RN_PENDING) === Zarafa.core.mapi.MessageFlags.MSGFLAG_RN_PENDING;
	},

	/**
	 * Convenience method for setting the read flag
	 *
	 * @param {Boolean} read True to mark the record as read.
	 */
	setReadFlags : function(read)
	{
		var flags = this.get('message_flags');

		if (read === false) {
			this.set('message_flags', flags & ~Zarafa.core.mapi.MessageFlags.MSGFLAG_READ);
		} else {
			this.set('message_flags', flags | Zarafa.core.mapi.MessageFlags.MSGFLAG_READ);
		}
	},

	/**
	 * Returns whether the IPMRecord supports the use of recipients or not (See {@link #supportsSubStore}).
	 * @return {Boolean} True if recipients are supported.
	 */
	supportsRecipients: function()
	{
		return this.supportsSubStore('recipients');
	},

	/**
	 * Creates a Recipients store for the {@link Zarafa.core.data.IPMRecord IPMRecord} (See {@link #createSubStore}).
	 * @return {Zarafa.core.data.IPMRecipientStore} The new Recipient store.
	 */
	createRecipientStore : function()
	{
		return this.createSubStore('recipients');
	},

	/**
	 * Set the Recipient store for the {@link Zarafa.core.data.IPMRecord record} (See {@link #setSubStore}).
	 * @param {Zarafa.core.data.IPMRecipientStore} recipientStore The Recipient store.
	 * @return {Zarafa.core.data.IPMRecipientStore} The Recipient store.
	 */
	setRecipientStore : function(recipientStore)
	{
		return this.setSubStore('recipients', recipientStore);
	},

	/**
	 * Get the Recipients store for the {@link Zarafa.core.data.IPMRecord IPMRecord} (See {@link #getSubStore}).
	 * @return {Zarafa.core.data.IPMRecipientStore} The Recipient store.
	 */
	getRecipientStore : function()
	{
		return this.getSubStore('recipients');
	},

	/**
	 * Returns whether the IPMRecord supports the use of recipients or not (See {@link #supportsSubStore}).
	 * @return {Boolean} True if recipients are supported.
	 */
	supportsAttachments: function()
	{
		return this.supportsSubStore('attachments');
	},

	/**
	 * Creates a Folder store for the {@link Zarafa.core.data.IPMRecord IPMRecord} (See {@link #createSubStore}).
	 * @return {Zarafa.core.data.IPMAttachmentStore} The new Attachment store.
	 */
	createAttachmentStore : function()
	{
		return this.createSubStore('attachments');
	},

	/**
	 * Set the Attachment store for the {@link Zarafa.core.data.IPMRecord record} (See {@link #setSubStore}).
	 * @param {Zarafa.core.data.IPMAttachmentStore} attachmentStore The Attachmentstore.
	 * @return {Zarafa.core.data.IPMAttachmentStore} The Attachment store.
	 */
	setAttachmentStore : function(attachmentStore)
	{
		return this.setSubStore('attachments', attachmentStore);
	},

	/**
	 * Get the Attachments store for the {@link Zarafa.core.data.IPMRecord IPMRecord} (See {@link #getSubStore}).
	 * @return {Zarafa.core.data.IPMAttachmentStore} The Attachment store.
	 */
	getAttachmentStore : function()
	{
		return this.getSubStore('attachments');
	},

	/**
	 * Helper function to return names of all attachments of message.
	 * @return {String} comma seperated attachment names
	 */
	getAttachmentNames : function()
	{
		if (!this.get('hasattach') || this.get('hide_attachments')) {
			return '';
		}

		var store = this.getSubStore('attachments');
		var names = [];

		store.each(function(attach) {
			if(!attach.get('hidden')) {
				names.push(attach.get('name'));
			}
		}, this);

		return names.join('; ');
	},

	/**
	 * Function can be used to check if the current record is faulty or not,
	 * this will check if message_class property in the {@link Zarafa.core.data.IPMRecord IPMRecord}
	 * is empty/'IPM'/'MEMO'/'REPORT' or message_class which not contains 'IPM'
	 * as prefix or suffix followed by dot(.), so we will not be able to display the message
	 * properly.
	 * @return {Boolean} true if message is faulty else false.
	 */
	isFaultyMessage : function()
	{
		var messageClass = this.get('message_class');

		if(Ext.isEmpty(messageClass)) {
			return true;
		}

		// @TODO handle other non supported types
		var faultyMessages = ['IPM', 'MEMO', 'REPORT'];
		return this.isMessageClass(faultyMessages, false);
	},

	/**
	 * Function can be used to repair a faulty message which can not be displayed properly
	 * in webapp, it will change the message class to IPM.Note so all the fields related to
	 * mail record will be populated properly.
	 */
	fixFaultyMessage : function()
	{
		if(!this.isFaultyMessage()) {
			// don't do anything if this is a normal message
			return;
		}

		this.set('message_class', 'IPM.Note');

		// send a request to server to save changes
		this.save();
	},

	/**
	 * Builds URL to download different messages as its respective file format.
	 * Email message will be downloaded as RFC822-formatted stream with eml extension.
	 * It uses {@link Zarafa.core.data.IPMRecord IPMRecord} to get store and message entryids.
	 * But, in the case of downloading all those eml messages in a ZIP, we just need to
	 * pass 'AllAsZip' argument as true in url.
	 * @param {Boolean} allAsZip (optional) True to downloading all the attachments as ZIP
	 * @return {String} URL for downloading message as file.
	 */
	getDownloadMessageUrl : function(allAsZip)
	{
		var url = container.getBaseURL();
		url = Ext.urlAppend(url, 'load=download_message');
		url = Ext.urlAppend(url, 'storeid=' + this.get('store_entryid'));

		if(!allAsZip){
			url = Ext.urlAppend(url, 'entryid=' + this.get('entryid'));
		} else {
			url = Ext.urlAppend(url, 'AllAsZip=true');
		}
		return url;
	},

	/**
	 * Function checks whether record has any visible attachments or not,
	 * Attachment like inline images and smime are invisible attachments
	 * @return {Boolean} True Function will return true if any attachment
	 * is visible; false otherwise
	 */
	hasVisibleAttachments : function()
	{
		var visible = false;
		var attachments = this.getAttachmentStore().getRange();
		Ext.each(attachments, function(attachment){
			if(attachment.get('hidden') === false){
				visible = true;
			}
		}, this);
		return visible;
	}
});

Zarafa.core.data.RecordFactory.setBaseClassToMessageClass('REPORT.IPM', Zarafa.core.data.IPMRecord);
Zarafa.core.data.RecordFactory.setSubStoreToMessageClass('REPORT.IPM', 'recipients', Zarafa.core.data.IPMRecipientStore);
Zarafa.core.data.RecordFactory.setSubStoreToMessageClass('REPORT.IPM', 'attachments', Zarafa.core.data.IPMAttachmentStore);

Zarafa.core.data.RecordFactory.setBaseClassToMessageClass('IPM', Zarafa.core.data.IPMRecord);
Zarafa.core.data.RecordFactory.setSubStoreToMessageClass('IPM', 'recipients', Zarafa.core.data.IPMRecipientStore);
Zarafa.core.data.RecordFactory.setSubStoreToMessageClass('IPM', 'attachments', Zarafa.core.data.IPMAttachmentStore);

Zarafa.core.data.RecordFactory.setBaseClassToObjectType(Zarafa.core.mapi.ObjectType.MAPI_MESSAGE, Zarafa.core.data.IPMRecord);
