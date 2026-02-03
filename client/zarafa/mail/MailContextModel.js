Ext.namespace('Zarafa.mail');

/**
 * @class Zarafa.mail.MailContextModel
 * @extends Zarafa.core.ContextModel
 */
Zarafa.mail.MailContextModel = Ext.extend(Zarafa.core.ContextModel, {
	/**
	 * When searching, this property marks the {@link Zarafa.core.ContextModel#getCurrentDataMode datamode}
	 * which was used before {@link #onSearchStart searching started} the datamode was switched to
	 * {@link Zarafa.mail.data.DataModes#SEARCH}.
	 * @property
	 * @type Mixed
	 * @private
	 */
	oldDataMode: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		if(!Ext.isDefined(config.store)) {
			config.store = new Zarafa.mail.MailStore();
		}

		Ext.applyIf(config, {
			statefulRecordSelection: true,
			current_data_mode: Zarafa.mail.data.DataModes.ALL
		});

		Zarafa.mail.MailContextModel.superclass.constructor.call(this, config);

		this.prefetchedMailCache = [];
		this.prefetchedMailCacheMap = {};
		this.prefetchPendingRecords = {};
		this.prefetchMailGrid = null;
		this.prefetchMailGridView = null;
		this.prefetchInteractionBodyEl = null;
		this.prefetchInteractionSelectionModel = null;
		this.mailPrefetchScrollTask = null;
		this.prefetchDebugHighlightState = null;
		this.prefetchDebugStyleApplied = false;

		this.on({
			'searchstart': this.onSearchStart,
			'searchstop': this.onSearchStop,
			scope: this
		});

		if (container.getServerConfig().isPrefetchEnabled()) {
			config.store.on('load', this.onPrefetchStoreLoad, this, { buffer: 5 });
			config.store.on('open', this.onPrefetchedRecordOpened, this);
			config.store.on('remove', this.onPrefetchedRecordRemoved, this);
			config.store.on('clear', this.onPrefetchStoreCleared, this);
		}
	},

	/**
	 * Create a new {@link Zarafa.core.data.IPMRecord IPMRecord} which must be used within
	 * the {@link Zarafa.mail.dialogs.MailCreateContentPanel MailCreateContentPanel}.
	 * @param {Zarafa.core.data.MAPIFolder} folder folder in which new record should be created.
	 * @return {Zarafa.core.data.IPMRecord} The new {@link Zarafa.core.data.IPMRecord IPMRecord}.
	 */
	createRecord: function(folder)
	{
		folder = folder || container.getHierarchyStore().getDefaultFolder('drafts');

		var signatureId = this.getSignatureId();

		var record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Note', {
			store_entryid: folder.get('store_entryid'),
			parent_entryid: folder.get('entryid'),
			body: this.getSignatureData(false, signatureId),
			html_body: this.getSignatureData(true, signatureId),
			isHTML: container.getSettingsModel().get('zarafa/v1/contexts/mail/dialogs/mailcreate/use_html_editor')
			// @todo should set From properties differently if replying for someone else's store
		});

		return record;
	},

	/**
	 * Function will create a new {@link Zarafa.core.data.IPMRecord IPMRecord} for responding to an original
	 * {@link Zarafa.core.data.IPMRecord IPMRecord}. This will also set subject, body, attachment, recipient
	 * properties based on {@link Zarafa.mail.data.ActionTypes ActionType} provided.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The original {@link Zarafa.core.data.IPMRecord IPMRecord}.
	 * @param {String} actionType The action type for the given {@link Zarafa.core.data.IPMRecord record}.
	 * Can be any of the values of {@link Zarafa.mail.data.ActionTypes ActionTypes}.
	 * @param {Zarafa.core.data.IPMRecord} responseRecord The new {@link Zarafa.core.data.IPMRecord IPMRecord}.
	 * @param {Object} (Optional) config The optional configuration.
	 * @private
	 */
	createResponseRecord: function(record, actionType, responseRecord, config)
	{
		// FIXME: Error message?
		if (Ext.isEmpty(actionType) || !record) {
			return;
		}

		var isMultipleItems = false;
		if (Ext.isDefined(responseRecord)) {
			isMultipleItems = true;
		}
		else {
			responseRecord = this.createRecord();
		}

		// Set the Message action for the record. This will instruct
		// the server side to update the original message accordingly.
		responseRecord.addMessageAction('action_type', actionType);

		// By copying the reference to the original mail,
		// the server is able to update that mail and add
		// reply/forward flags to it.
		responseRecord.addMessageAction('source_entryid', record.get('entryid'));
		responseRecord.addMessageAction('source_store_entryid', record.get('store_entryid'));

		this.setSourceMessageInfo(record, actionType, responseRecord);

		var attachNum = record.get('attach_num');
		if(!Ext.isEmpty(attachNum) && actionType!==Zarafa.mail.data.ActionTypes.EDIT_AS_NEW) {
			responseRecord.addMessageAction('source_attach_num', attachNum);
		}

		// initialize properties of response record
		if (actionType === Zarafa.mail.data.ActionTypes.EDIT_AS_NEW){
			this.copyRecordRecipients(responseRecord, record);
		} else {
			var mapiFolderStore = this.getDefaultFolder().getMAPIFolderStore();
			var folderIndex = mapiFolderStore.find('entryid', record.get('parent_entryid'));
			var folder = mapiFolderStore.getAt(folderIndex);
			var isSentFolder = folder ? folder.getDefaultFolderKey() === 'sent' : false;
			this.initRecordRecipients(responseRecord, record, actionType, isSentFolder);
		}

		this.initRecordSubject(responseRecord, record, actionType);

		if (actionType === Zarafa.mail.data.ActionTypes.FORWARD_ATTACH) {
			responseRecord.getAttachmentStore().addAsAttachment(record, config);
		} else if (actionType === Zarafa.mail.data.ActionTypes.EDIT_AS_NEW) {
			this.copyRecordBody(responseRecord, record);
			this.initRecordAttachments(responseRecord, record, actionType);
		} else {
			this.initRecordBody(responseRecord, record, actionType);
			this.initRecordAttachments(responseRecord, record, actionType);
		}

		if (isMultipleItems) {
			if (container.getSettingsModel().get('zarafa/v1/contexts/mail/use_english_abbreviations')) {
				responseRecord.set('subject', ('Fwd') + ': ');
			} else {
				responseRecord.set('subject', _('Fwd') + ': ');
			}
		}

		// If the record we are replying is in other user's store then set delegator info.
		if (!Ext.isFunction(record.userIsStoreOwner) || !record.userIsStoreOwner()) {
			var storeOwner = container.getHierarchyStore().getById(record.get('store_entryid'));

			if(storeOwner) {
				responseRecord.setDelegatorInfo(storeOwner);
			}
		}

		return responseRecord;
	},

	/**
	 * Function is used to set the source message action type.
	 * @param {Zarafa.core.data.IPMRecord} record The original {@link Zarafa.core.data.IPMRecord IPMRecord}.
	 * @param {String} actionType The action type for the given {@link Zarafa.core.data.IPMRecord record}.
	 * @param {Zarafa.core.data.IPMRecord} responseRecord The new {@link Zarafa.core.data.IPMRecord IPMRecord}.
	 * Can be any of the values of {@link Zarafa.mail.data.ActionTypes ActionTypes}.
	 */
	setSourceMessageInfo: function(record, actionType, responseRecord)
	{
		// Hack alert !
		// we are not able to identify the 0x85CE named property, So here we hardcode first 24byte
		// value of the record, based on action type (reply, replyall, forward) and add 48byte
		// entryid at the end.
		var sourceMessageAction;
		switch(actionType) {
			case 'reply':
					sourceMessageAction = "0501000066000000";
				break;
			case 'replyall':
					sourceMessageAction = "0501000067000000";
				break;
			case 'forward':
			case 'forward_attach':
					sourceMessageAction = "0601000068000000";
				break;
		}
		if (sourceMessageAction) {
			var sourceMessageInfo = "01000E000C000000" + sourceMessageAction + "0200000030000000" + record.get('entryid');
			responseRecord.set('source_message_info', sourceMessageInfo);
		}
	},

	/**
	 * Initialize the {@link Zarafa.core.data.IPMRecord record} with an updated
	 * subject. This will prefix the previous subject with 'Re' or 'Fwd',
	 * depending on the given action type.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record to initialize
	 * @param {Zarafa.core.data.IPMRecord} origRecord The original record
	 * to which the respond is created
	 * @param {Zarafa.mail.data.ActionTypes} actionType The actionType used
	 * for this response.
	 * @private
	 */
	initRecordSubject: function(record, origRecord, actionType)
	{
		var subjectPrefix;
		var english_abb = container.getSettingsModel().get('zarafa/v1/contexts/mail/use_english_abbreviations');

		switch (actionType)
		{
			case Zarafa.mail.data.ActionTypes.REPLY:
			case Zarafa.mail.data.ActionTypes.REPLYALL:
				if (english_abb) {
					subjectPrefix = ('Re') + ': ';
				} else {
					subjectPrefix = _('Re') + ': ';
				}
				break;
			case Zarafa.mail.data.ActionTypes.FORWARD:
			case Zarafa.mail.data.ActionTypes.FORWARD_ATTACH:
				if (english_abb) {
					subjectPrefix = ('Fwd') + ': ';
				} else {
					subjectPrefix = _('Fwd') + ': ';
				}
				break;
			case Zarafa.mail.data.ActionTypes.EDIT_AS_NEW:
				subjectPrefix = '';
				break;
			default:
				// FIXME: Error message?
				subjectPrefix = _('Re') + ': ';
				break;
		}

		var normalizedSubject = origRecord.get('normalized_subject');
		record.set('subject', subjectPrefix + normalizedSubject);
		record.set('normalized_subject', normalizedSubject);
	},

	/**
	 * Initialize the {@link Zarafa.core.data.IPMRecord record} with an updated
	 * body. This will quote the previous body as plain-text or html depending
	 * on the editors preferences.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record to initialize
	 * @param {Zarafa.core.data.IPMRecord} origRecord The original record
	 * to which the respond is created
	 * @param {Zarafa.mail.data.ActionTypes} actionType The actionType used
	 * for this response.
	 * @private
	 */
	initRecordBody: function(record, origRecord, actionType)
	{
		var signatureId = this.getSignatureId(actionType);

		// Create a copy of the original data, the body has changed,
		// and we don't want to change the original record.
		var respondData = Ext.apply({}, origRecord.data);

		/**
		 * here we go through all the recipients in recipientStore and build the username <user@abc.com> format
		 * recipient for to and cc fields, and add then in respondData display_to and display_cc field.
		 * and we don't want to change original record,
		 */
		if(origRecord.isOpened()){
			var recipientStore = origRecord.getRecipientStore();
			var to = [];
			var cc = [];

			if (recipientStore.getCount() > 0) {
				recipientStore.each(function(recipient) {
					switch(recipient.get('recipient_type')){
						case Zarafa.core.mapi.RecipientType.MAPI_TO:
							to.push(recipient.formatRecipient());
							break;
						case Zarafa.core.mapi.RecipientType.MAPI_CC:
							cc.push(recipient.formatRecipient());
							break;
					}
				},this);

				respondData.display_to = to.join('; ');
				respondData.display_cc = cc.join('; ');
			}
		}

		// Initialize HTML body
		respondData.body = origRecord.getSanitizedHtmlBody();
		respondData.signatureData = this.getSignatureData(true, signatureId);
		respondData.fontFamily = container.getSettingsModel().get('zarafa/v1/main/default_font');
		respondData.fontSize = Zarafa.common.ui.htmleditor.Fonts.getDefaultFontSize();

		record.set('html_body', Zarafa.mail.data.Templates.htmlQuotedTemplate.apply(respondData));

		// Initialize plain-text body
		respondData.body = origRecord.getBody(false);
		respondData.signatureData = this.getSignatureData(false, signatureId);

		// Prefix each line with the '> ' sign to indicate
		// it is being quoted. Wrap the text around 72 chars.
		const text = respondData.body;
		let newText = "> ";
		let count = 0;
		for (let i=0; i < text.length; ++i) {
			if ((text[i] === " " && count > 72) || text[i] === "\n") {
				newText += "\n> ";
				count = 0;
			} else {
				newText += text[i];
				count++;
			}
		}
		respondData.body = newText;

		record.set('body', Zarafa.mail.data.Templates.plaintextQuotedTemplate.apply(respondData));
	},

	/**
	 * Initialize the {@link Zarafa.core.data.IPMRecord record} with updated
	 * recipients. This will possibly copy all recipients, or will copy the
	 * sender recipient into a To recipient depending on the given actionType.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record to initialize
	 * @param {Zarafa.core.data.IPMRecord} origRecord The original record
	 * to which the respond is created
	 * @param {Zarafa.mail.data.ActionTypes} actionType The actionType used
	 * for this response.
	 * @param {Boolean} isSentFolder it should be true if {@link Zarafa.core.data.IPMRecord record} belong in sent folder.
	 * @private
	 */
	initRecordRecipients: function(record, origRecord, actionType, isSentFolder)
	{
		// When forwarding, we don't need to copy any recipients
		if (actionType === Zarafa.mail.data.ActionTypes.FORWARD || actionType === Zarafa.mail.data.ActionTypes.FORWARD_ATTACH) {
			return;
		}

		var store = record.getRecipientStore();

		// To prevent duplicates to be added, we keep a list of
		// all recipients which are added. Note that the contents
		// of reply-to is unconditional, and we will only be using
		// this list for the REPLYALL case.
		var addedRecipientEntryids = [];

		// Simply, Don't use reply-to information in case of "sent items"
		if(!isSentFolder) {
			// This line will prevent logged-in user from recipients,
			// When we are in 'sent items', we want to include ourself in TO,CC,BCC
			var loggedInEntryId = container.getUser().getEntryId();
			addedRecipientEntryids.push(loggedInEntryId);

			// We always need to add the reply-to recipients except "sent items"
			var replyTo = origRecord.getSubStore('reply-to');

			replyTo.each(function(recipient) {
				this.addRecipientToStore(store, recipient, true);

				var recipEntryid = recipient.get('entryid');

				// Store entryid of added recipient to prevent doubles
				addedRecipientEntryids.push(recipEntryid);
			}, this);
		}

		// When Replying to all recipients, start adding the originals as well
		// If we are replying from "Inbox" then skip this whole logic, as we need only "reply-to" information
		if (actionType === Zarafa.mail.data.ActionTypes.REPLYALL || (actionType === Zarafa.mail.data.ActionTypes.REPLY && isSentFolder)) {
			var origStore = origRecord.getRecipientStore();

			origStore.each(function(recipient) {
				// In case where we are replying from "sent items" folder then
				// we only skip the CC/BCC recipients, TO recipient needs to be carried forward.
				if (actionType === Zarafa.mail.data.ActionTypes.REPLY && recipient.get('recipient_type') !== Zarafa.core.mapi.RecipientType.MAPI_TO) {
					return;
				}

				var recipEntryid = recipient.get('entryid');

				// Check if entryid is in list of added recipients to prevent doubles.
				// if no entryid is present then also add it as that can be SMTP address
				var recipDuplicate = false;
				if (recipEntryid) {
					for (var i = 0; i < addedRecipientEntryids.length; i++) {
						if (Zarafa.core.EntryId.compareABEntryIds(addedRecipientEntryids[i], recipEntryid)) {
							recipDuplicate = true;
							break;
						}
					}
				}

				if (!recipDuplicate) {
					this.addRecipientToStore(store, recipient, false);

					// Store entryid of added recipient to prevent doubles
					addedRecipientEntryids.push(recipEntryid);
				}
			}, this);

			// Add myself back as recipient if I am replying in the sent folder and there are no recipients in the TO field.
			if(isSentFolder && store.find('recipient_type', Zarafa.core.mapi.RecipientType.MAPI_TO) === -1) {
				this.addRecipientToStore(store, origRecord.getSender(), true);
			}
		}
	},

	/**
	 * Helper function for {@link Zarafa.mail.MailContextModel#initRecordRecipients}, adds a recipient to the store.
	 *
	 * @param {Zarafa.core.data.IPMRecipientStore} store recipient store
	 * @param {Zarafa.core.data.IPMRecipientRecord} recipient which should be added to store
	 * @param {boolean} to specifies if recipient should be TO or not
	 * @private
	 */
	addRecipientToStore: function(store, recipient, to)
	{
		var recipData = Ext.apply({}, recipient.data);

		// Create a new recipient containing all data from the original.
		recipient = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RECIPIENT, recipData);

		if (to) {
			recipient.set('recipient_type', Zarafa.core.mapi.RecipientType.MAPI_TO);
		}

		// We have copied the 'rowid' as well, but new recipients
		// shouldn't have this property as it will be filled in by PHP.
		recipient.set('rowid', undefined);

		store.add(recipient);

	},

	/**
	 * Copy the body (both plain text and html) of the {@link Zarafa.core.data.IPMRecord original record}
	 * to the {@link Zarafa.core.data.IPMRecord new record}.
	 * The html body will be cleaned, meaning the wrapping div that was added by
	 * the grommunio Web backend will be removed. This is necessary because it introduces
	 * problems when we paste it in TinyMCE.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The new record
	 * @param {Zarafa.core.data.IPMRecord} origRecord The original record
	 * @private
	 */
	copyRecordBody: function(record, origRecord)
	{
		// We can simply copy the contents of the plain text body
		record.set('body', origRecord.getBody(false));

		var htmlBody = origRecord.getBody(true);

		// Remove the comments
		htmlBody = htmlBody.replace(/<\!\-\-.*?\-\->/gi, '');

		// Remove the wrapping div
		htmlBody = htmlBody.replace(/^\s*<div\s+class=['"]bodyclass['"]\s*>/gi, '');
		htmlBody = htmlBody.replace(/\s*<\/div\s*>\s*$/gi, '');
		record.set('html_body', htmlBody);
	},

	/**
	 * Copy the recipients of the {@link Zarafa.core.data.IPMRecord original record}
	 * to the {@link Zarafa.core.data.IPMRecord new record}.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record to initialize
	 * @param {Zarafa.core.data.IPMRecord} origRecord The original record
	 * to which the respond is created
	 * @private
	 */
	copyRecordRecipients: function(record, origRecord)
	{
		var recipientStore = record.getRecipientStore();
		var origRecipientStore = origRecord.getRecipientStore();

		origRecipientStore.each(function(recipient) {
			var recipData = Ext.apply({}, recipient.data);

			// Create a new recipient containing all data from the original.
			recipient = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RECIPIENT, recipData);

			// We have copied the 'rowid' as well, but new recipients
			// shouldn't have this property as it will be filled in by PHP.
			recipient.set('rowid', undefined);

			recipientStore.add(recipient);
		}, this);
	},

	/**
	 * Initialize the {@link Zarafa.core.data.IPMRecord record} with attachments
	 * in case of forward it the attachments will be copied to the record.
	 * For reply it will be added if it is a inline image.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record to initialize
	 * @param {Zarafa.core.data.IPMRecord} origRecord The original record
	 * to which the respond is created
	 * @param {Zarafa.mail.data.ActionTypes} actionType The actionType used
	 * for this response.
	 * @private
	 */
	initRecordAttachments: function(record, origRecord, actionType)
	{
		var store = record.getAttachmentStore();

		switch (actionType)
		{
			case Zarafa.mail.data.ActionTypes.FORWARD:
			case Zarafa.mail.data.ActionTypes.FORWARD_ATTACH:
			case Zarafa.mail.data.ActionTypes.EDIT_AS_NEW:
				var origStore = origRecord.getAttachmentStore();
				origStore.each(function(attach) {
					store.add(attach.copy());
				}, this);

				// Check record store or so
				record.set('hasattach', origRecord.get('hasattach'));
			/* falls through */
			case Zarafa.mail.data.ActionTypes.REPLYALL:
			case Zarafa.mail.data.ActionTypes.REPLY:
				// TODO: handle inline image attachments
				break;
		}
	},

	/**
	 * Function is used to get signature id of the signature which should be added to the
	 * body of {@link Zarafa.core.data.IPMRecord IPMRecord} based on passed actionType.
	 * If no action type is passed then it should be considered as new mail.
	 * @param {Zarafa.mail.data.ActionTypes} actionType one of 'reply', 'forward', 'replyall'.
	 * @return {Number} signature of signature that should be added to the body.
	 */
	getSignatureId: function(actionType)
	{
		var signatureId;

		// get signature id based on action type passed
		switch (actionType) {
			case Zarafa.mail.data.ActionTypes.FORWARD:
			case Zarafa.mail.data.ActionTypes.FORWARD_ATTACH:
			case Zarafa.mail.data.ActionTypes.REPLYALL:
			case Zarafa.mail.data.ActionTypes.REPLY:
				signatureId = container.getSettingsModel().get('zarafa/v1/contexts/mail/signatures/replyforward_message', true);
				break;
			default:
				signatureId = container.getSettingsModel().get('zarafa/v1/contexts/mail/signatures/new_message', true);
				break;
		}

		return parseInt(signatureId, 10);
	},

	/**
	 * Function is used to get signature data based on passed signature id
	 * from {@link Zarafa.settings.SettingsModel SettingsModel}. It also does conversion of signature data
	 * when it needs to be converted from plain to html or vice versa.
	 * @param {Boolean} preferHTML True if the signature should be returned in HTML format else in plain format.
	 * @param {Number} signatureId id of the signature to get the data, this id can be get using {@link #getSignatureId}.
	 * @param {Boolean} withEmptyLines True (default) to add empty lines before the signature, false otherwise.
	 * @return {String} signature data that should be added to body of the {@link Zarafa.core.data.IPMRecord IPMRecord}.
	 */
	getSignatureData: function(preferHtml, signatureId, withEmptyLines)
	{
		if(!signatureId) {
			return '';
		}

		var sigDetails = container.getSettingsModel().get('zarafa/v1/contexts/mail/signatures/all/' + signatureId, true);

		if(Ext.isEmpty(sigDetails)) {
			return '';
		}

		// Create a copy of the original data
		sigDetails = Ext.apply({}, sigDetails);

		if(!Ext.isDefined(sigDetails['content'])) {
			return '';
		}

		var sigIsHtml = sigDetails['isHTML'];

		if(preferHtml === false) {
			// we want signature in plain format, so if signature is in html format then convert it to plain format
			if(sigIsHtml === true) {
				sigDetails['content'] = Zarafa.core.HTMLParser.convertHTMLToPlain(sigDetails['content']);
			}

			// Prefix the signature with two newlines
			if ( withEmptyLines !== false ) {
				sigDetails['content'] = '\n\n' + sigDetails['content'];
			}
		} else {
			if (sigIsHtml === false) {
				// we want signature in html format, so if signature is in plain format then convert it to html
				sigDetails['content'] = Zarafa.core.HTMLParser.convertPlainToHTML(sigDetails['content']);
			}

			// Prefix the signature with two newlines
			if ( withEmptyLines !== false ) {
				sigDetails['content'] = this.wrapSignature(sigDetails['content']);
			}
		}

		// Parse the signature to replace the templates
		sigDetails['content'] = this.replaceSignatureTemplates(sigDetails['content'], preferHtml);

		return sigDetails['content'];
	},

	/**
	 * Function is used to wrap the signature with div 'signatureContainer'
	 * along with two empty lines.
	 *
	 * @param {String} signature The signature which is going to wrapped.
	 * @return {String} Wrapped signature.
	 */
	wrapSignature: function(signature)
	{
		var fontFamily = container.getSettingsModel().get('zarafa/v1/main/default_font');
		var fontSize = Zarafa.common.ui.htmleditor.Fonts.getDefaultFontSize();

		var lineStyle = 'font-family:'+fontFamily+'; font-size:'+fontSize+'; padding: 0; margin: 0;';
		var emptyLine = '<p style="' + lineStyle + '"><span><br/></span></p>';

		return emptyLine + emptyLine + '<div class="signatureContainer">'+signature+'</div>';
	},

	/**
	 * Replaces the templates in a signature
	 * @param {String} signatureContent The text of the signature (can be html or plain text)
	 * @param {Boolean} preferHTML True if the signature should be returned in HTML format else in plain format.
	 * @return {String} The text of the signature with template holders replaced by their value
	 */
	replaceSignatureTemplates: function(signatureContent, preferHtml)
	{
		// First check if there are template holders in the signature
		// otherwise we can return immediately
		if ( !/{%.*}/gi.test(signatureContent) ){
			return signatureContent;
		}

		// TODO: The user information should be updated, so we will always have
		// the latest data

		// Get the user information
		var user = container.getUser();
		// Map the template holders to their data
		var map = {
			firstname		: user.getFirstName(),
			initials		: user.getInitials(),
			lastname		: user.getLastName(),
			displayname		: user.getDisplayName(),
			title			: user.getTitle(),
			company			: user.getCompany(),
			department		: user.getDepartment(),
			office			: user.getOffice(),
			assistant		: user.getAssistant(),
			phone			: user.getPhone(),
			primary_email	: user.getSMTPAddress(),
			address			: user.getAddress(),
			city			: user.getCity(),
			state			: user.getState(),
			zipcode			: user.getZipCode(),
			country			: user.getCountry(),
			phone_business	: user.getPhoneBusiness(),
			phone_business2	: user.getPhoneBusiness2(),
			phone_fax		: user.getFax(),
			phone_assistant	: user.getPhoneAssistant(),
			phone_home		: user.getPhoneHome(),
			phone_home2		: user.getPhoneHome2(),
			phone_mobile	: user.getPhoneMobile(),
			phone_pager		: user.getPhonePager()
		};

		Ext.iterate(map, function(key, value){
			if ( !Ext.isDefined(value) ){
				value = '';
			} else if ( preferHtml ){
				// Let's replace newlines with br's, to make sure that info that was entered
				// on multiple lines in ldap will also be displayed on multiple lines.
				value = Zarafa.core.HTMLParser.nl2br(Ext.util.Format.htmlEncode(value));
			}
			signatureContent = signatureContent.replace(new RegExp('{%'+key+'}', 'gi'), value);
		});

		return signatureContent;
	},

	/**
	 * Load the store using the given (optional) restriction. if
	 * {@link Zarafa.core.data.ListModuleStore#hasFilterApplied} then
	 * set the filter restriction in params and if context is going to switch
	 * then clear the filter.
	 * @param {Object} options The options object to load the store with
	 * @private
	 */
	load: function(options)
	{
		var store = this.getStore();
		// suspended is only true when context is going to switch
		// on context witch if filter is enabled then clear the filter.
		if (this.suspended && store.hasFilterApplied) {
			store.stopFilter();
		} else {
			// If user switch folder within the context and Datamode is {@link Zarafa.mail.data.DataModes.UNREAD UNREAD}
			// then we have to persist the filter so, set the filter restriction
			// in restriction/params object.
			options = Ext.applyIf(options || {}, {
				params: {
					restriction: {
						filter: this.getFilterRestriction(this.getFilterTypeFromDataMode())
					}
				}
			});
		}
		Zarafa.mail.MailContextModel.superclass.load.call(this, options);
	},

	/**
	 * Function will provide the filter type based on the {@link #this.current_data_mode current_data_mode}
	 * when {@link #this.current_data_mode current_data_mode} is available.
	 *
	 * @return {Zarafa.common.data.Filters} filterType to get the restriction.
	 */
	getFilterTypeFromDataMode: function()
	{
		if (Ext.isDefined(this.current_data_mode)) {
			if (this.current_data_mode === Zarafa.mail.data.DataModes.UNREAD) {
				return Zarafa.common.data.Filters.UNREAD;
			}
		}
	},

	/**
	 * Function which provide the restriction based on the given {@link Zarafa.common.data.Filters.UNREAD Filter}
	 *
	 * @param {Zarafa.common.data.Filters} filterType The filterType which needs to perform on store.
	 * @return {Array|false} RES_BITMASK restriction else false.
	 */
	getFilterRestriction: function(filterType)
	{
		var store = this.getStore();
		return store.getFilterRestriction(filterType);
	},

	/**
	 * Event handler which is executed right before the {@link #datamodechange}
	 * event is fired. This allows subclasses to initialize the {@link #store}.
	 * This will apply a restriction to the {@link #store} if needed.
	 *
	 * @param {Zarafa.contact.ContactContextModel} model The model which fired the event.
	 * @param {Zarafa.contact.data.DataModes} newMode The new selected DataMode.
	 * @param {Zarafa.contact.data.DataModes} oldMode The previously selected DataMode.
	 * @private
	 */
	onDataModeChange: function(model, newMode, oldMode)
	{
		Zarafa.mail.MailContextModel.superclass.onDataModeChange.call(this, model, newMode, oldMode);

		if (newMode !== oldMode && oldMode === Zarafa.mail.data.DataModes.SEARCH) {
			this.stopSearch();
			// stop the live scroll after the search gets stopped.
			this.stopLiveScroll();
		}
		switch (newMode) {
			case Zarafa.mail.data.DataModes.SEARCH:
			case Zarafa.mail.data.DataModes.LIVESCROLL:
				break;
			case Zarafa.mail.data.DataModes.ALL:
				this.load();
				break;
			case Zarafa.mail.data.DataModes.UNREAD:
				this.load({
					params: {
						restriction: {
							filter: this.getFilterRestriction(Zarafa.common.data.Filters.UNREAD)
						}
					}
				});
				break;
			default: break;
		}
	},


	/**
	 * Event handler which is executed right before the {@link #folderchange}
	 * event is fired. This allows subclasses to update the folders.
	 * Also apply the default sorting on mail grid as per the folder type.
	 *
	 * @param {Zarafa.core.ContextModel} model The model which fired the event.
	 * @param {Array} folders selected folders as an array of {@link Zarafa.hierarchy.data.MAPIFolderRecord Folder} objects.
	 * @private
	 */
	onFolderChange: function(model, folders)
	{
		if(!Ext.isEmpty(folders)) {
			var folder = folders[0];
			var folderKey = folder.getDefaultFolderKey();
			var field = 'message_delivery_time';

			if(folderKey === 'drafts') {
				field = 'last_modification_time';
			} else if(folderKey === 'sent' || folderKey === 'outbox') {
				field = 'client_submit_time';
			}

			this.store.defaultSortInfo.field = field;
		}

		Zarafa.mail.MailContextModel.superclass.onFolderChange.call(this, model, folders);
	},

	/**
	 * Event handler for the {@link #searchstart searchstart} event.
	 * This will {@link #setDataMode change the datamode} to {@link Zarafa.mail.data.DataModes#SEARCH search mode}.
	 * The previously active {@link #getCurrentDataMode view} will be stored in the {@link #oldDataMode} and will
	 * be recovered when the {@link #onSearchStop search is stopped}.
	 * @param {Zarafa.core.ContextModel} model The model which fired the event
	 * @private
	 */
	onSearchStart: function(model)
	{
		if(this.getCurrentDataMode() != Zarafa.mail.data.DataModes.SEARCH){
			this.oldDataMode = this.getCurrentDataMode();
			this.setDataMode(Zarafa.mail.data.DataModes.SEARCH);
		}
	},

	/**
	 * Event handler for the {@link #searchstop searchstop} event.
	 * This will {@link #setDataMode change the datamode} to the {@link #oldDataMode previous datamode}.
	 * @param {Zarafa.core.ContextModel} model The model which fired the event
	 * @private
	 */
	onSearchStop: function(model)
	{
		if (this.getCurrentDataMode() === Zarafa.mail.data.DataModes.SEARCH) {
			this.setDataMode(this.oldDataMode);
		}
		delete this.oldDataMode;
	},

	/**
	 * Handle store load events for mail prefetching.
	 * @param {Ext.data.Store} store The store which was loaded.
	 * @param {Ext.data.Record[]} records The records which were loaded from the store.
	 */
	onPrefetchStoreLoad: function(store, records) {
		if (!container.getServerConfig().isPrefetchEnabled()) {
			return;
		}

		store = store || this.getStore();
		if (!store) {
			return;
		}

		this.ensureMailGridBindings(store);

		if (this.usesViewportPrefetching()) {
			this.prefetchVisibleMailBodies(store, records);
		} else if (this.usesInteractionPrefetching()) {
			this.prefetchSelectionContext(store);
		}
	},

	/**
	 * Determine which prefetch strategy should be used.
	 * @return {String} The resolved strategy identifier.
	 */
	resolvePrefetchStrategy: function() {
		const strategy = container.getServerConfig().getPrefetchStrategy();
		if (!Ext.isString(strategy)) {
			return 'VIEWPORT';
		}

		return strategy.toUpperCase();
	},

	/**
	 * @return {Boolean} True when the viewport-based prefetching should be applied.
	 */
	usesViewportPrefetching: function() {
		return this.resolvePrefetchStrategy() === 'VIEWPORT';
	},

	/**
	 * @return {Boolean} True when the interaction-based prefetching should be applied.
	 */
	usesInteractionPrefetching: function() {
		return this.resolvePrefetchStrategy() === 'INTERACTION';
	},

	/**
	 * Prefetch message bodies for the records that are currently visible in the mail list.
	 * @param {Ext.data.Store} store The store which was loaded
	 * @param {Ext.data.Record[]} records The records which were loaded from the store
	 */
	prefetchVisibleMailBodies: function(store, records) {
		try {
			if (!container.getServerConfig().isPrefetchEnabled() || !this.usesViewportPrefetching()) {
				return;
			}

			store = store || this.getStore();
			if (!store) {
				return;
			}

			this.ensureMailGridBindings(store);

			const defaultFolder = this.getDefaultFolder();
			if (defaultFolder && defaultFolder.getDefaultFolderKey() === 'outbox') {
				return;
			}

			const visibleSpan = this.getVisibleIndexSpan(store);
			if (!visibleSpan) {
				return;
			}

			const budget = this.getPrefetchBudget(visibleSpan);
			const buffer = this.calculatePrefetchBuffer(visibleSpan, budget);
			const prefetchRange = this.getPrefetchRange(store, visibleSpan, buffer, budget);

			if (!prefetchRange) {
				return;
			}

			this.prunePrefetchedCache(store, prefetchRange, budget);

			const toOpenCandidates = this.collectPrefetchCandidates(store, prefetchRange);
			if (Ext.isEmpty(toOpenCandidates)) {
				return;
			}

			let toOpen = toOpenCandidates;

			const requiredSlots = this.getRequiredPrefetchSlots(toOpen.length, budget);
			if (requiredSlots > 0) {
				this.freePrefetchCacheSlots(requiredSlots, store);
			}

			const availableSlots = this.getAvailablePrefetchSlots(budget);
			if (Ext.isNumber(availableSlots)) {
				if (availableSlots <= 0) {
					return;
				}

				if (toOpen.length > availableSlots) {
					toOpen = toOpen.slice(0, availableSlots);
				}
			}

			if (!Ext.isEmpty(toOpen)) {
				this.markMailRecordsPending(toOpen);
				store.open(toOpen);
			}
		} finally {
			this.refreshPrefetchDebugHighlights();
		}
	},

	/**
	 * Prefetch the hovered mail or the neighbours of the selected mail when interaction mode is active.
	 * @param {Ext.data.Store} store The store owning the records.
	 * @param {Ext.data.Record[]|Ext.data.Record} records The records to prefetch.
	 */
	prefetchMailRecords: function(store, records) {
		try {
			if (!container.getServerConfig().isPrefetchEnabled()) {
				return;
			}

			store = store || this.getStore();
			if (!store) {
				return;
			}

			const defaultFolder = this.getDefaultFolder();
			if (defaultFolder && defaultFolder.getDefaultFolderKey() === 'outbox') {
				return;
			}

			const list = Ext.isArray(records) ? records : [records];
			const candidates = [];

			for (let i = 0; i < list.length; i++) {
				const record = list[i];
				if (!record || !this.shouldPrefetchMailRecord(record, store) || this.isMailRecordCached(record)) {
					continue;
				}

				candidates.push(record);
			}

			if (Ext.isEmpty(candidates)) {
				return;
			}

			const visibleSpan = this.getVisibleIndexSpan(store);
			const budget = this.getPrefetchBudget(visibleSpan);
			const requiredSlots = this.getRequiredPrefetchSlots(candidates.length, budget);
			if (requiredSlots > 0) {
				this.freePrefetchCacheSlots(requiredSlots, store);
			}

			const availableSlots = this.getAvailablePrefetchSlots(budget);
			if (Ext.isNumber(availableSlots)) {
				if (availableSlots <= 0) {
					return;
				}

				if (candidates.length > availableSlots) {
					candidates.splice(availableSlots, candidates.length - availableSlots);
				}
			}

			if (Ext.isEmpty(candidates)) {
				return;
			}

			this.markMailRecordsPending(candidates);
			store.open(candidates);
		} finally {
			this.refreshPrefetchDebugHighlights();
		}
	},

	/**
	 * Prefetch the neighbours of the currently selected mail when interaction mode is active.
	 * @param {Ext.data.Store} store The store owning the records.
	 */
	prefetchSelectionContext: function(store) {
		try {
			if (!this.usesInteractionPrefetching()) {
				return;
			}

			store = store || this.getStore();
			if (!store) {
				return;
			}

			const grid = this.prefetchMailGrid || this.getActiveMailGrid(store);
			const selectionModel = grid ? grid.getSelectionModel() : null;
			if (!selectionModel) {
				return;
			}

			const selected = Ext.isFunction(selectionModel.getSelected) ? selectionModel.getSelected() : null;
			if (!selected) {
				return;
			}

			const selectedIndex = store.indexOf(selected);
			if (!Ext.isNumber(selectedIndex) || selectedIndex < 0) {
				return;
			}

			const candidates = [];
			const previous = selectedIndex > 0 ? store.getAt(selectedIndex - 1) : null;
			const next = selectedIndex + 1 < store.getCount() ? store.getAt(selectedIndex + 1) : null;

			if (previous) {
				candidates.push(previous);
			}

			if (next) {
				candidates.push(next);
			}

			if (!Ext.isEmpty(candidates)) {
				this.prefetchMailRecords(store, candidates);
			}
		} finally {
			this.refreshPrefetchDebugHighlights();
		}
	},

	/**
	 * React to selection changes in the mail grid to prefetch neighbouring mails.
	 * @param {Ext.grid.RowSelectionModel} selectionModel The selection model emitting the event.
	 */
	onMailGridSelectionChange: function(selectionModel) {
		if (!this.usesInteractionPrefetching()) {
			return;
		}

		this.prefetchSelectionContext(this.getStore());
	},

	/**
	 * Prefetch mails that are hovered in the interaction-based strategy.
	 * @param {Ext.EventObject} event The mouse event object.
	 * @param {HTMLElement} target The hovered row element.
	 */
	onMailGridRowMouseOver: function(event, target) {
		if (!this.usesInteractionPrefetching()) {
			return;
		}

		const view = this.prefetchMailGridView || (this.prefetchMailGrid ? this.prefetchMailGrid.getView() : null);
		const store = this.getStore();
		if (!view || !store) {
			return;
		}

		const row = target || (event ? event.getTarget('.x-grid3-row') : null);
		if (!row) {
			return;
		}

		const rowIndex = this.getRowIndexFromElement(view, row, store);
		if (!Ext.isNumber(rowIndex) || rowIndex < 0) {
			return;
		}

		const record = store.getAt(rowIndex);
		if (record) {
			this.prefetchMailRecords(store, record);
		}
	},

	/**
	 * Determine the store index range that should be prefetched based on the rows that are visible in the mail grid.
	 * @param {Ext.data.Store} store The store under consideration.
	 * @param {{start: Number, end: Number, count: Number}} visibleSpan The currently visible index span.
	 * @param {Number} buffer The amount of extra records to include before and after the visible range.
	 * @param {Number} budget Maximum number of records that should be prefetched at once.
	 * @return {{start: Number, end: Number}|null} The inclusive start/end index range or null when it cannot be determined.
	 */
	getPrefetchRange: function(store, visibleSpan, buffer, budget) {
		if (!store || !visibleSpan) {
			return null;
		}

		const storeCount = store.getCount ? store.getCount() : 0;
		if (storeCount === 0) {
			return null;
		}

		buffer = Ext.isNumber(buffer) ? buffer : parseInt(buffer, 10);
		buffer = isNaN(buffer) ? 0 : Math.max(buffer, 0);

		let start = Math.max(visibleSpan.start - buffer, 0);
		let end = Math.min(visibleSpan.end + buffer, storeCount - 1);

		if (start > end) {
			start = visibleSpan.start;
			end = visibleSpan.end;
		}

		const rangeSize = end - start + 1;
		if (Ext.isNumber(budget) && isFinite(budget) && budget > 0 && rangeSize > budget) {
			const overflow = rangeSize - budget;
			const trimStart = Math.min(Math.floor(overflow / 2), Math.max(start, 0));
			const trimEnd = overflow - trimStart;

			start = Math.min(start + trimStart, storeCount - 1);
			end = Math.max(end - trimEnd, start);
		}

		return {
			start: Math.max(start, 0),
			end: Math.max(end, start)
		};
	},

	/**
	 * Retrieve the index span that corresponds to the rows currently visible in the active mail grid.
	 * @param {Ext.data.Store} store The store to inspect.
	 * @return {{start: Number, end: Number, count: Number}|null} The visible span or null when it cannot be determined.
	 */
	getVisibleIndexSpan: function(store) {
		const grid = this.getActiveMailGrid(store);
		if (!grid || !grid.rendered) {
			return null;
		}

		const view = grid.getView();
		if (!view || !view.scroller || !view.scroller.dom) {
			return null;
		}

		const storeCount = store && Ext.isFunction(store.getCount) ? store.getCount() : 0;
		if (storeCount <= 0) {
			return null;
		}

		let span = this.getVisibleSpanFromView(view, store, storeCount);
		if (!span) {
			span = this.getVisibleSpanFromDom(view, store, storeCount);
		}

		if (!span) {
			span = this.getVisibleSpanFromScroll(view, storeCount);
		}

		if (!span) {
			return null;
		}

		const normalizedStart = Math.max(0, Math.min(span.start, storeCount - 1));
		const normalizedEnd = Math.max(normalizedStart, Math.min(span.end, storeCount - 1));

		return {
			start: normalizedStart,
			end: normalizedEnd,
			count: normalizedEnd - normalizedStart + 1
		};
	},

	getVisibleSpanFromView: function(view, store, storeCount) {
		if (!view) {
			return null;
		}

		if (Ext.isFunction(view.getVisibleRows)) {
			const visibleRows = view.getVisibleRows();
			if (visibleRows && Ext.isNumber(visibleRows.first) && Ext.isNumber(visibleRows.last)) {
				return {
					start: visibleRows.first,
					end: visibleRows.last
				};
			}
		}

		if (Ext.isFunction(view.getVisibleRowCount)) {
			const count = view.getVisibleRowCount();
			if (Ext.isNumber(count) && count > 0) {
				const estimate = this.getVisibleSpanFromScroll(view, storeCount, count);
				if (estimate) {
					return estimate;
				}
			}
		}

		return null;
	},

	getVisibleSpanFromDom: function(view, store, storeCount) {
		if (!view || !Ext.isFunction(view.getRows)) {
			return null;
		}

		const rows = view.getRows();
		if (!rows || rows.length === 0) {
			return null;
		}

		const scrollerDom = view.scroller.dom;
		const scrollTop = scrollerDom.scrollTop;
		const viewportBottom = scrollTop + scrollerDom.clientHeight;
		const scrollerRect = scrollerDom.getBoundingClientRect ? scrollerDom.getBoundingClientRect() : null;

		let firstVisibleIndex = null;
		let lastVisibleIndex = null;

		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			if (!row) {
				continue;
			}

			let rowTop;
			let rowBottom;

			if (scrollerRect && row.getBoundingClientRect) {
				const rowRect = row.getBoundingClientRect();
				rowTop = rowRect.top - scrollerRect.top + scrollTop;
				rowBottom = rowRect.bottom - scrollerRect.top + scrollTop;
			} else {
				rowTop = row.offsetTop;
				rowBottom = rowTop + row.offsetHeight;
			}

			if (rowBottom <= scrollTop || rowTop >= viewportBottom) {
				continue;
			}

			const rowIndex = this.getRowIndexFromElement(view, row, store);
			if (!Ext.isNumber(rowIndex) || rowIndex < 0 || rowIndex >= storeCount) {
				continue;
			}

			if (firstVisibleIndex === null || rowIndex < firstVisibleIndex) {
				firstVisibleIndex = rowIndex;
			}

			if (lastVisibleIndex === null || rowIndex > lastVisibleIndex) {
				lastVisibleIndex = rowIndex;
			}
		}

		if (firstVisibleIndex === null || lastVisibleIndex === null) {
			return null;
		}

		return {
			start: firstVisibleIndex,
			end: lastVisibleIndex
		};
	},

	getVisibleSpanFromScroll: function(view, storeCount, visibleCount) {
		if (!view || !view.scroller || !view.scroller.dom) {
			return null;
		}

		const rowHeight = this.getApproximateRowHeight(view);
		if (!Ext.isNumber(rowHeight) || rowHeight <= 0) {
			return null;
		}

		const scrollerDom = view.scroller.dom;
		const scrollTop = scrollerDom.scrollTop;
		const count = Ext.isNumber(visibleCount) && visibleCount > 0 ? visibleCount : Math.ceil(scrollerDom.clientHeight / rowHeight);
		if (!Ext.isNumber(count) || count <= 0) {
			return null;
		}

		const start = Math.floor(scrollTop / rowHeight);
		const end = start + count - 1;

		return {
			start: start,
			end: end
		};
	},

	getApproximateRowHeight: function(view) {
		if (!view) {
			return 0;
		}

		if (Ext.isFunction(view.getCalculatedRowHeight)) {
			const calculated = view.getCalculatedRowHeight();
			if (Ext.isNumber(calculated) && calculated > 0) {
				return calculated;
			}
		}

		if (Ext.isFunction(view.getRows)) {
			const rows = view.getRows();
			if (rows && rows.length > 0) {
				for (let i = 0; i < rows.length; i++) {
					const height = rows[i] ? rows[i].offsetHeight : 0;
					if (Ext.isNumber(height) && height > 0) {
						return height;
					}
				}
			}
		}

		return 0;
	},

	getRowIndexFromElement: function(view, row, store) {
		if (!view || !row) {
			return -1;
		}

		if (Ext.isFunction(view.findRowIndex)) {
			const located = view.findRowIndex(row);
			if (Ext.isNumber(located) && located >= 0) {
				return located;
			}
		}

		let record = null;
		if (Ext.isFunction(view.getRecord)) {
			record = view.getRecord(row);
		}

		if (!record) {
			return -1;
		}

		if (Ext.isNumber(record.storeIndex) && record.storeIndex >= 0) {
			return record.storeIndex;
		}

		if (Ext.isNumber(record.index) && record.index >= 0) {
			return record.index;
		}

		if (store && Ext.isFunction(store.indexOf)) {
			return store.indexOf(record);
		}

		return -1;
	},

	isPrefetchDebugEnabled: function() {
		const resolved = this.resolvePrefetchDebugEnabled();
		if (this.prefetchDebugHighlightState !== resolved) {
			if (this.prefetchDebugHighlightState === true && resolved === false) {
				this.clearAllPrefetchDebugHighlights();
			}
			this.prefetchDebugHighlightState = resolved;
		}

		return resolved === true;
	},

	resolvePrefetchDebugEnabled: function() {
		let enabled = false;

		try {
			if (typeof window !== 'undefined') {
				if (window.location && window.location.search) {
					const search = window.location.search;
					if (/[?&]prefetchDebug=(1|true)/i.test(search)) {
						enabled = true;
					}
				}

				if (!enabled && window.localStorage) {
					const stored = window.localStorage.getItem('mailPrefetchDebug');
					if (stored === '1' || stored === 'true') {
						enabled = true;
					}
				}
			}
		} catch (error) {
			// ignore
		}

		return enabled;
	},

	ensurePrefetchDebugStyle: function() {
		if (this.prefetchDebugStyleApplied || typeof document === 'undefined') {
			return;
		}

		try {
			const style = document.createElement('style');
			style.type = 'text/css';
			style.id = 'mail-prefetch-debug-style';
			style.appendChild(document.createTextNode('.prefetch-mail-debug-row{box-shadow:inset 0 0 0 9999px rgba(76,175,80,0.18);} .prefetch-mail-debug-row.x-grid3-row-selected{box-shadow:inset 0 0 0 9999px rgba(56,142,60,0.28);}'));

			const head = document.head || document.getElementsByTagName('head')[0];
			if (head) {
				head.appendChild(style);
				this.prefetchDebugStyleApplied = true;
			}
		} catch (error) {
			// ignore
		}
	},

	togglePrefetchDebugHighlight: function(record, highlight, store) {
		if (!record) {
			return;
		}

		const debugEnabled = this.isPrefetchDebugEnabled();
		if (!debugEnabled && highlight !== false) {
			return;
		}

		const grid = this.prefetchMailGrid || this.getActiveMailGrid(store || this.getStore());
		if (!grid || !grid.rendered) {
			return;
		}

		const view = grid.getView();
		if (!view || !Ext.isFunction(view.getRow)) {
			return;
		}

		const targetStore = store || grid.getStore() || this.getStore();
		const index = targetStore && Ext.isFunction(targetStore.indexOf) ? targetStore.indexOf(record) : -1;
		if (!Ext.isNumber(index) || index < 0) {
			return;
		}

		const row = view.getRow(index);
		if (!row) {
			return;
		}

		const rowEl = Ext.get(row);
		if (!rowEl) {
			return;
		}

		if (highlight && debugEnabled) {
			this.ensurePrefetchDebugStyle();
			rowEl.addClass('prefetch-mail-debug-row');
		} else {
			rowEl.removeClass('prefetch-mail-debug-row');
		}
	},


	applyPrefetchDebugHighlights: function(view) {
		const grid = this.prefetchMailGrid || this.getActiveMailGrid(this.getStore());
		const targetView = view || (grid ? grid.getView() : null);

		if (!targetView || !Ext.isFunction(targetView.getRows)) {
			return;
		}

		const rows = targetView.getRows();
		if (!rows || rows.length === 0) {
			return;
		}

		this.applyPrefetchDebugHighlightsForRange(targetView, 0, rows.length - 1);
	},

	applyPrefetchDebugHighlightsForRange: function(view, startRow, endRow) {
		if (!view || !Ext.isFunction(view.getRow)) {
			return;
		}

		let rows = null;
		if (Ext.isFunction(view.getRows)) {
			rows = view.getRows();
		}

		const maxIndex = rows && rows.length ? rows.length - 1 : null;
		if (maxIndex !== null) {
			if (maxIndex < 0) {
				return;
			}

			startRow = Math.max(0, startRow);
			endRow = Math.min(endRow, maxIndex);

			if (startRow > maxIndex || startRow > endRow) {
				return;
			}
		}

		if (startRow > endRow) {
			return;
		}

		const grid = this.prefetchMailGrid;
		const store = grid && Ext.isFunction(grid.getStore) ? grid.getStore() : this.getStore();
		const debugEnabled = this.isPrefetchDebugEnabled();

		if (!debugEnabled) {
			// When debug is disabled, ensure any residual styling is removed.
			for (let index = startRow; index <= endRow; index++) {
				const row = view.getRow(index);
				if (!row) {
					continue;
				}

				const rowEl = Ext.get(row);
				if (rowEl) {
					rowEl.removeClass('prefetch-mail-debug-row');
				}
			}

			return;
		}

		this.ensurePrefetchDebugStyle();

		for (let index = startRow; index <= endRow; index++) {
			const row = view.getRow(index);
			if (!row) {
				continue;
			}

			let record = null;
			if (Ext.isFunction(view.getRecord)) {
				record = view.getRecord(row);
			}

			if (!record && store && Ext.isFunction(store.getAt)) {
				record = store.getAt(index);
			}

			const rowEl = Ext.get(row);
			if (!rowEl) {
				continue;
			}

			if (record && this.isMailRecordCached(record)) {
				rowEl.addClass('prefetch-mail-debug-row');
			} else {
				rowEl.removeClass('prefetch-mail-debug-row');
			}
		}
	},

	refreshPrefetchDebugHighlights: function() {
		const store = this.getStore();
		const grid = this.prefetchMailGrid || this.getActiveMailGrid(store);
		const view = this.prefetchMailGridView || (grid ? grid.getView() : null);

		if (!view) {
			return;
		}

		this.applyPrefetchDebugHighlights(view);
	},

	clearAllPrefetchDebugHighlights: function() {
		if (!this.prefetchMailGrid || !this.prefetchMailGrid.rendered) {
			return;
		}

		const view = this.prefetchMailGrid.getView();
		if (!view || !Ext.isFunction(view.getRows)) {
			return;
		}

		const rows = view.getRows();
		if (!rows) {
			return;
		}

		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			if (row) {
				Ext.fly(row).removeClass('prefetch-mail-debug-row');
			}
		}
	},

	/**
	 * Obtain the mail grid that is currently visible for this context model.
	 * @param {Ext.data.Store} store The store that should back the grid.
	 * @return {Ext.grid.GridPanel|null} The grid when it is available, null otherwise.
	 */
	getActiveMailGrid: function(store) {
		const currentContext = container.getCurrentContext();
		if (!currentContext || currentContext.getModel() !== this) {
			return null;
		}

		const contentPanel = container.getContentPanel();
		if (!contentPanel) {
			return null;
		}

		let gridPanel = null;
		if (Ext.isFunction(contentPanel.getGridPanel)) {
			gridPanel = contentPanel.getGridPanel();
		} else if (Ext.isDefined(contentPanel.mailGrid)) {
			gridPanel = contentPanel.mailGrid;
		}

		if (gridPanel && store && gridPanel.getStore() !== store) {
			return null;
		}

		return gridPanel || null;
	},

	/**
	 * Calculate the total number of records that may be prefetched based on configuration and visibility.
	 * @param {{count: Number}} visibleSpan Information about the visible rows.
	 * @return {Number} The calculated budget.
	 */
	getPrefetchBudget: function(visibleSpan) {
		const configured = this.normalizePrefetchCount(container.getServerConfig().getPrefetchTotalCount());
		const marginAllowance = Math.max(this.getViewportPrefetchMargin(), 0) * 2;

		if (!visibleSpan || !Ext.isNumber(visibleSpan.count) || visibleSpan.count <= 0) {
			if (configured > 0) {
				return configured;
			}

			if (marginAllowance > 0) {
				return marginAllowance;
			}

			return Number.POSITIVE_INFINITY;
		}

		const minimum = visibleSpan.count + marginAllowance;

		if (configured <= 0) {
			return minimum > 0 ? minimum : visibleSpan.count;
		}

		return Math.max(configured, minimum > 0 ? minimum : visibleSpan.count);
	},

	getViewportPrefetchMargin: function() {
		return 5;
	},

	/**
	 * Calculate the number of additional records that should be prefetched around the visible range.
	 * @param {{count: Number}} visibleSpan The visible span information.
	 * @param {Number} budget Maximum number of prefetched items.
	 * @return {Number} The buffer size that should be applied before and after the visible range.
	 */
	calculatePrefetchBuffer: function(visibleSpan, budget) {
		const baseBuffer = Math.max(this.getViewportPrefetchMargin(), 0);

		if (!visibleSpan || !Ext.isNumber(visibleSpan.count) || visibleSpan.count <= 0) {
			return baseBuffer;
		}

		const visibleCount = visibleSpan.count;

		if (!Ext.isNumber(budget) || !isFinite(budget) || budget <= 0) {
			const preferred = Math.max(Math.ceil(visibleCount / 2), baseBuffer);
			return Math.min(preferred, 50);
		}

		const slack = Math.max(budget - visibleCount, 0);
		const halfSlack = Math.floor(slack / 2);
		if (halfSlack <= 0) {
			return Math.min(baseBuffer, halfSlack);
		}

		const preferred = Math.max(Math.ceil(visibleCount / 2), baseBuffer);
		return Math.min(preferred, halfSlack, 50);
	},

	/**
	 * Normalize the configured prefetch count so it can be used as a budget.
	 * @param {Number} configuredCount The count retrieved from the server configuration.
	 * @return {Number} The normalized amount or 0 when it is not a valid number.
	 */
	normalizePrefetchCount: function(configuredCount) {
		const normalizedCount = Ext.isNumber(configuredCount) ? configuredCount : parseInt(configuredCount, 10);

		if (isNaN(normalizedCount)) {
			return 0;
		}

		return Math.max(normalizedCount, 0);
	},

	/**
	 * Determine which records within the prefetch range still need to be loaded.
	 * @param {Ext.data.Store} store The store owning the records.
	 * @param {{start: Number, end: Number}} prefetchRange The target range.
	 * @return {Ext.data.Record[]} The records that should be opened.
	 */
	collectPrefetchCandidates: function(store, prefetchRange) {
		if (!store || !Ext.isFunction(store.getAt) || !prefetchRange) {
			return [];
		}

		const candidates = [];
		const start = Math.max(prefetchRange.start, 0);
		const end = Math.max(prefetchRange.end, start);

		for (let index = start; index <= end; index++) {
			const record = store.getAt(index);
			if (!record || !this.shouldPrefetchMailRecord(record, store) || this.isMailRecordCached(record)) {
				continue;
			}

			candidates.push(record);
		}

		return candidates;
	},

	/**
	 * Check how many additional prefetch slots are available.
	 * @param {Number} budget The current prefetch budget.
	 * @return {Number|null} The remaining slots or null when unlimited.
	 */
	getAvailablePrefetchSlots: function(budget) {
		if (!Ext.isNumber(budget) || !isFinite(budget) || budget <= 0) {
			return null;
		}

		return Math.max(budget - this.prefetchedMailCache.length, 0);
	},

	/**
	 * Determine how many cache slots need to be freed before prefetching the given amount of records.
	 * @param {Number} candidateCount Number of records considered for prefetching.
	 * @param {Number} budget Prefetch budget.
	 * @return {Number} Number of slots that must be cleared.
	 */
	getRequiredPrefetchSlots: function(candidateCount, budget) {
		if (!Ext.isNumber(budget) || !isFinite(budget) || budget <= 0) {
			return 0;
		}

		const available = this.getAvailablePrefetchSlots(budget);
		if (available === null) {
			return 0;
		}

		return Math.max(candidateCount - available, 0);
	},

	/**
	 * Remove cached sanitized bodies for mails that are no longer needed.
	 * @param {Ext.data.Store} store The store that owns the records.
	 * @param {{start: Number, end: Number}} prefetchRange The current prefetch range.
	 * @param {Number} budget Prefetch budget.
	 */
	prunePrefetchedCache: function(store, prefetchRange, budget) {
		if (!this.prefetchedMailCache || this.prefetchedMailCache.length === 0) {
			return;
		}

		const keep = [];
		const newMap = {};

		for (let i = 0; i < this.prefetchedMailCache.length; i++) {
			const recordId = this.prefetchedMailCache[i];
			const record = store ? store.getById(recordId) : null;

			if (!record) {
				continue;
			}

			const recordIndex = store.indexOf(record);
			if (!prefetchRange || recordIndex < prefetchRange.start || recordIndex > prefetchRange.end) {
				if (!record.isOpened || !record.isOpened()) {
					this.clearRecordSanitizedBody(record);
				}
				this.togglePrefetchDebugHighlight(record, false, store);
				continue;
			}

			keep.push(recordId);
			newMap[recordId] = true;
		}

		this.prefetchedMailCache = keep;
		this.prefetchedMailCacheMap = newMap;

		if (Ext.isNumber(budget) && isFinite(budget) && budget > 0 && this.prefetchedMailCache.length > budget) {
			this.freePrefetchCacheSlots(this.prefetchedMailCache.length - budget, store);
		}
	},

	/**
	 * Free the given amount of cache slots by removing the oldest prefetched records.
	 * @param {Number} slots Number of slots to free.
	 * @param {Ext.data.Store} store The store owning the records.
	 */
	freePrefetchCacheSlots: function(slots, store) {
		if (!Ext.isNumber(slots) || slots <= 0 || !this.prefetchedMailCache || this.prefetchedMailCache.length === 0) {
			return;
		}

		let remaining = slots;
		let safetyCounter = 0;

		while (remaining > 0 && this.prefetchedMailCache.length > 0 && safetyCounter < 1000) {
			safetyCounter++;

			const recordId = this.prefetchedMailCache.shift();
			if (!recordId) {
				continue;
			}

			delete this.prefetchedMailCacheMap[recordId];

			const record = store ? store.getById(recordId) : null;

			if (record && record.isOpened && record.isOpened()) {
				this.prefetchedMailCache.push(recordId);
				this.prefetchedMailCacheMap[recordId] = true;

				if (safetyCounter > this.prefetchedMailCache.length) {
					break;
				}

				continue;
			}

			if (record) {
				this.clearRecordSanitizedBody(record);
				this.togglePrefetchDebugHighlight(record, false, store);
			}

			remaining--;
		}
	},

	/**
	 * Remember that a record has been prefetched so that we can avoid duplicate work later on.
	 * @param {Ext.data.Store} store The store owning the record.
	 * @param {Ext.data.Record} record The record to remember.
	 */
	registerPrefetchedRecord: function(store, record) {
		if (!record) {
			return;
		}

		const recordId = record.id;
		this.clearMailRecordPending(record);
		if (!this.prefetchedMailCacheMap) {
			this.prefetchedMailCacheMap = {};
		}

		if (!this.prefetchedMailCache) {
			this.prefetchedMailCache = [];
		}

		if (this.prefetchedMailCacheMap[recordId]) {
			const existingIndex = this.prefetchedMailCache.indexOf(recordId);
			if (existingIndex !== -1) {
				this.prefetchedMailCache.splice(existingIndex, 1);
			}
		}

		this.prefetchedMailCache.push(recordId);
		this.prefetchedMailCacheMap[recordId] = true;
		this.togglePrefetchDebugHighlight(record, true, store);

		const budget = this.getPrefetchBudget(this.getVisibleIndexSpan(store));
		if (Ext.isNumber(budget) && isFinite(budget) && budget > 0 && this.prefetchedMailCache.length > budget) {
			this.freePrefetchCacheSlots(this.prefetchedMailCache.length - budget, store);
		}
	},

	/**
	 * Forget that a record was prefetched and drop its sanitized cache.
	 * @param {Ext.data.Record} record The record to forget.
	 */
	forgetPrefetchedRecord: function(record) {
		if (!record || !this.prefetchedMailCacheMap) {
			return;
		}

		const recordId = record.id;

		if (this.prefetchedMailCacheMap[recordId]) {
			delete this.prefetchedMailCacheMap[recordId];
		}

		if (this.prefetchedMailCache && this.prefetchedMailCache.length > 0) {
			const index = this.prefetchedMailCache.indexOf(recordId);
			if (index !== -1) {
				this.prefetchedMailCache.splice(index, 1);
			}
		}

		this.clearMailRecordPending(record);
		this.clearRecordSanitizedBody(record);
		this.togglePrefetchDebugHighlight(record, false, this.getStore());
	},

	/**
	 * Check whether the given record is already cached.
	 * @param {Ext.data.Record} record The record to inspect.
	 * @return {Boolean} True when the record is cached.
	 */
	isMailRecordCached: function(record) {
		if (!record) {
			return false;
		}

		if (this.prefetchedMailCacheMap && this.prefetchedMailCacheMap[record.id] === true) {
			return true;
		}

		if (record.isOpened && record.isOpened()) {
			return true;
		}

		if (Ext.isDefined(record.sanitizedHTMLBody) && record.sanitizedHTMLBody !== null) {
			if (!Ext.isFunction(record.isModifiedSinceLastUpdate) || !record.isModifiedSinceLastUpdate('html_body')) {
				return true;
			}
		}

		return false;
	},

	/**
	 * Check if a record is currently pending prefetch.
	 * @param {Ext.data.Record} record The record to inspect.
	 * @return {Boolean} True when prefetching has already been scheduled for the record.
	 */
	isMailRecordPending: function(record) {
		if (!record || !this.prefetchPendingRecords) {
			return false;
		}

		return this.prefetchPendingRecords[record.id] === true;
	},

	/**
	 * Remember that the given records are pending prefetch so duplicate work can be avoided.
	 * @param {Ext.data.Record[]|Ext.data.Record} records Records to mark as pending.
	 */
	markMailRecordsPending: function(records) {
		if (!records) {
			return;
		}

		const list = Ext.isArray(records) ? records : [records];
		for (let i = 0; i < list.length; i++) {
			this.markMailRecordPending(list[i]);
		}
	},

	/**
	 * Mark a single record as pending prefetch.
	 * @param {Ext.data.Record} record The record to mark.
	 */
	markMailRecordPending: function(record) {
		if (!record) {
			return;
		}

		if (!this.prefetchPendingRecords) {
			this.prefetchPendingRecords = {};
		}

		this.prefetchPendingRecords[record.id] = true;
	},

	/**
	 * Clear the pending state for a record once prefetching has completed or is cancelled.
	 * @param {Ext.data.Record} record The record whose pending state should be cleared.
	 */
	clearMailRecordPending: function(record) {
		if (!record || !this.prefetchPendingRecords) {
			return;
		}

		delete this.prefetchPendingRecords[record.id];
	},

	/**
	 * Clear the sanitized HTML body that was cached for the given record.
	 * @param {Ext.data.Record} record The record whose cache should be cleared.
	 */
	clearRecordSanitizedBody: function(record) {
		if (!record) {
			return;
		}

		if (Ext.isFunction(record.clearSanitizedHtmlBody)) {
			record.clearSanitizedHtmlBody();
		} else if (Ext.isDefined(record.sanitizedHTMLBody)) {
			record.sanitizedHTMLBody = null;
		}
		this.togglePrefetchDebugHighlight(record, false, this.getStore());
	},

	/**
	 * Determine if a mail record should be prefetched.
	 * @param {Ext.data.Record} record The record under consideration.
	 * @param {Ext.data.Store} store The store that owns the record.
	 * @return {Boolean} True if the record should be prefetched.
	 */
	shouldPrefetchMailRecord: function(record, store) {
		if (!record || !Ext.isFunction(record.isMessageClass)) {
			return false;
		}

		if (record.isOpened && record.isOpened()) {
			return false;
		}

		if (this.isMailRecordPending(record)) {
			return false;
		}

		if (!store || store.indexOf(record) < 0) {
			return false;
		}

		return record.isMessageClass(['IPM.Note', 'IPM.Schedule.Meeting'], true);
	},

	/**
	 * Ensure that prefetched mails have their sanitized HTML bodies cached so that opening them is instant.
	 * @param {Ext.data.Store} store The store emitting the event.
	 * @param {Ext.data.Record} record The record that has been opened.
	 */
	onPrefetchedRecordOpened: function(store, record) {
		if (!container.getServerConfig().isPrefetchEnabled()) {
			return;
		}

		if (!record || !Ext.isFunction(record.getSanitizedHtmlBody)) {
			return;
		}

		record.getSanitizedHtmlBody();
		this.registerPrefetchedRecord(store, record);
	},

	/**
	 * React to records being removed from the store so that the cache does not retain stale data.
	 * @param {Ext.data.Store} store The store emitting the event.
	 * @param {Ext.data.Record} record The record that was removed.
	 */
	onPrefetchedRecordRemoved: function(store, record) {
		if (!container.getServerConfig().isPrefetchEnabled()) {
			return;
		}

		this.clearMailRecordPending(record);
		this.forgetPrefetchedRecord(record);
	},

	/**
	 * Clear the prefetch cache when the underlying store is cleared.
	 * @param {Ext.data.Store} store The store emitting the event.
	 */
	onPrefetchStoreCleared: function(store) {
		if (!container.getServerConfig().isPrefetchEnabled()) {
			return;
		}

		if (this.prefetchedMailCache) {
			this.prefetchedMailCache.length = 0;
		}

		this.prefetchedMailCacheMap = {};
		this.prefetchPendingRecords = {};
		this.clearAllPrefetchDebugHighlights();
	},

	/**
	 * Ensure that the scroll events from the mail grid trigger prefetch updates.
	 * @param {Ext.data.Store} store The store backing the grid.
	 */
	ensureMailGridBindings: function(store) {
		const grid = this.getActiveMailGrid(store);
		if (!grid) {
			return;
		}

		if (this.prefetchMailGrid && this.prefetchMailGrid !== grid) {
			this.teardownMailGridBindings();
		}

		if (this.prefetchMailGrid === grid) {
			return;
		}

		this.prefetchMailGrid = grid;

		if (this.usesViewportPrefetching()) {
			grid.on('bodyscroll', this.onMailGridBodyScroll, this);
		}
		grid.on('destroy', this.onMailGridDestroyed, this);

		if (grid.viewReady) {
			this.onMailGridViewReady();
		} else {
			grid.on('viewready', this.onMailGridViewReady, this, { single: true });
		}

		if (this.usesInteractionPrefetching()) {
			const selectionModel = grid.getSelectionModel();
			if (selectionModel) {
				selectionModel.on('selectionchange', this.onMailGridSelectionChange, this);
				this.prefetchInteractionSelectionModel = selectionModel;
			}
		}
	},

	setupInteractionViewListeners: function(view) {
		if (!this.usesInteractionPrefetching()) {
			return;
		}

		if (!view || !view.mainBody) {
			return;
		}

		const body = view.mainBody;

		if (this.prefetchInteractionBodyEl && this.prefetchInteractionBodyEl !== body) {
			this.prefetchInteractionBodyEl.un('mouseover', this.onMailGridRowMouseOver, this);
			this.prefetchInteractionBodyEl = null;
		}

		if (this.prefetchInteractionBodyEl === body) {
			return;
		}

		this.prefetchInteractionBodyEl = body;
		body.on('mouseover', this.onMailGridRowMouseOver, this, { delegate: '.x-grid3-row' });
	},

	/**
	 * Stop listening for events from the previous grid.
	 */
	teardownMailGridBindings: function() {
		if (!this.prefetchMailGrid) {
			return;
		}

		this.prefetchMailGrid.un('bodyscroll', this.onMailGridBodyScroll, this);
		this.prefetchMailGrid.un('destroy', this.onMailGridDestroyed, this);
		this.prefetchMailGrid.un('viewready', this.onMailGridViewReady, this);
		if (this.prefetchInteractionSelectionModel) {
			this.prefetchInteractionSelectionModel.un('selectionchange', this.onMailGridSelectionChange, this);
			this.prefetchInteractionSelectionModel = null;
		}
		this.prefetchMailGrid = null;

		this.teardownMailGridViewListeners();

		if (this.mailPrefetchScrollTask) {
			this.mailPrefetchScrollTask.cancel();
			this.mailPrefetchScrollTask = null;
		}

		this.clearAllPrefetchDebugHighlights();
	},

	/**
	 * Trigger a prefetch update once the mail grid view is ready.
	 */
	onMailGridViewReady: function() {
		const grid = this.prefetchMailGrid || this.getActiveMailGrid(this.getStore());
		if (!grid) {
			return;
		}

		const view = grid.getView();
		if (!view) {
			return;
		}

		if (this.prefetchMailGridView && this.prefetchMailGridView !== view) {
			this.teardownMailGridViewListeners();
		}

		if (this.prefetchMailGridView !== view) {
			this.prefetchMailGridView = view;
			view.on('refresh', this.onMailGridViewRefresh, this);
			view.on('rowsinserted', this.onMailGridViewRowsInserted, this);
			view.on('rowupdated', this.onMailGridViewRowUpdated, this);
			view.on('rowremoved', this.onMailGridViewRowRemoved, this);
		}

		if (this.usesInteractionPrefetching()) {
			this.setupInteractionViewListeners(view);
		}

		this.applyPrefetchDebugHighlights(view);

		const store = grid.getStore() || this.getStore();
		if (store) {
			if (this.usesViewportPrefetching()) {
				this.prefetchVisibleMailBodies(store, null);
			} else if (this.usesInteractionPrefetching()) {
				this.prefetchSelectionContext(store);
			}
		}
	},

	/**
	 * When the grid is destroyed we clean up listeners and pending tasks.
	 * @param {Ext.Component} grid The grid instance being destroyed.
	 */
	onMailGridDestroyed: function(grid) {
		if (grid !== this.prefetchMailGrid) {
			return;
		}

		this.teardownMailGridBindings();
	},

	/**
	 * Handle scroll events from the mail grid by scheduling a lightweight prefetch update.
	 */
	onMailGridBodyScroll: function() {
		this.refreshPrefetchDebugHighlights();

		if (!container.getServerConfig().isPrefetchEnabled() || !this.usesViewportPrefetching()) {
			return;
		}

		if (!this.mailPrefetchScrollTask) {
			this.mailPrefetchScrollTask = new Ext.util.DelayedTask(this.runMailPrefetchUpdate, this);
		}

		const store = this.getStore();
		if (!store) {
			return;
		}

		this.mailPrefetchScrollTask.delay(75, this.runMailPrefetchUpdate, this, [store]);
	},

	runMailPrefetchUpdate: function(store) {
		store = store || this.getStore();

		if (!store) {
			this.refreshPrefetchDebugHighlights();
			return;
		}

		this.prefetchVisibleMailBodies(store, null);
	},

	teardownMailGridViewListeners: function() {
		if (!this.prefetchMailGridView) {
			return;
		}

		this.prefetchMailGridView.un('refresh', this.onMailGridViewRefresh, this);
		this.prefetchMailGridView.un('rowsinserted', this.onMailGridViewRowsInserted, this);
		this.prefetchMailGridView.un('rowupdated', this.onMailGridViewRowUpdated, this);
		this.prefetchMailGridView.un('rowremoved', this.onMailGridViewRowRemoved, this);
		this.prefetchMailGridView = null;

		if (this.prefetchInteractionBodyEl) {
			this.prefetchInteractionBodyEl.un('mouseover', this.onMailGridRowMouseOver, this);
			this.prefetchInteractionBodyEl = null;
		}
	},

	onMailGridViewRefresh: function(view) {
		const targetView = view || this.prefetchMailGridView;

		if (this.usesInteractionPrefetching()) {
			this.setupInteractionViewListeners(targetView);
		}

		this.applyPrefetchDebugHighlights(targetView);
	},

	onMailGridViewRowsInserted: function(view, firstRow, lastRow) {
		const targetView = view || this.prefetchMailGridView;
		if (!targetView) {
			return;
		}

		if (this.usesInteractionPrefetching()) {
			this.setupInteractionViewListeners(targetView);
		}

		const start = Ext.isNumber(firstRow) ? firstRow : 0;
		const end = Ext.isNumber(lastRow) ? lastRow : start;
		this.applyPrefetchDebugHighlightsForRange(targetView, start, end);
	},

	onMailGridViewRowUpdated: function(view, rowIndex) {
		const targetView = view || this.prefetchMailGridView;
		if (!targetView || !Ext.isNumber(rowIndex)) {
			if (this.usesInteractionPrefetching()) {
				this.setupInteractionViewListeners(targetView);
			}

			this.applyPrefetchDebugHighlights(targetView);
			return;
		}

		if (this.usesInteractionPrefetching()) {
			this.setupInteractionViewListeners(targetView);
		}

		this.applyPrefetchDebugHighlightsForRange(targetView, rowIndex, rowIndex);
	},

	onMailGridViewRowRemoved: function(view) {
		const targetView = view || this.prefetchMailGridView;

		if (this.usesInteractionPrefetching()) {
			this.setupInteractionViewListeners(targetView);
		}

		this.applyPrefetchDebugHighlights(targetView);
	}

});
