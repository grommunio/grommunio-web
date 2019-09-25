Ext.namespace('Zarafa.core.ui');

/**
 * @class Zarafa.core.ui.MessageContentPanel
 * @extends Zarafa.core.ui.RecordContentPanel
 * @xtype zarafa.messagecontentpanel
 *
 * This extends the normal {@link Zarafa.core.ui.RecordContentPanel RecordContentPanel} which is
 * used for displaying and editing {@link Zarafa.core.data.IPMRecord records}. This
 * class is used for Messages which can be {@link #sendRecord send} as well.
 *
 * FIXME: Provide default buttons which are common for all content panels with messages
 */
Zarafa.core.ui.MessageContentPanel = Ext.extend(Zarafa.core.ui.RecordContentPanel, {

	/**
	 * The queue containing callback functions which can be used to validate the
	 * {@link Zarafa.core.data.IPMRecord} which is about to be send. If the queue
	 * completes successfully, the message can be send, otherwise it will be cancelled.
	 * @property
	 * @type Zarafa.core.data.CallbackQueue
	 * @protected
	 */
	sendValidationQueue : undefined,

	/**
	 * @cfg {String/Object} sendingText When {@link #showInfoMask} is true, this text
	 * will be shown when the message is being sent. When an object is provided which contains
	 * the 'msg' fields respectively.
	 */
	sendingText : { msg : _('Sending...') },

	/**
	 * @cfg {String/Object} sendingDoneText When {@link #showInfoMask} is true, this text
	 * will be shown when the message has been sent. When an object is provided which contains
	 * the 'msg' fields respectively.
	 */
	sendingDoneText :{ msg : '<b>'+ _('Sent successfully')+'</b>' },

	/**
	 * Indicates if the panel is currently busy sending data to the server.
	 * @property
	 * @type Boolean
	 */
	isSending : false,

	/**
	 * @cfg {Boolean} closeOnSend Config option to close the panel when client recieves confirmation of message is sent.
	 */
	closeOnSend : false,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push({
			ptype : 'zarafa.markasreadplugin',
			ignoreReadFlagTimer : true
		});


		this.addEvents(
			/**
			 * @event beforesendrecord
			 * Fires when a record is about to be {@link #sendRecord send}.
			 * This will allow Subclasses modify the {@link Zarafa.core.data.IPMRecord record} before
			 * it is being send. This event will be followed by the {@link #beforesaverecord} and
			 * {@link #saverecord} (which triggers the send action on the server) and ends with the
			 * {@link #sendrecord} event when everything has been completed.
			 * @param {Zarafa.core.ui.RecordContentPanel} contentpanel The contentpanel from where the record is send
			 * @param {Zarafa.core.data.IPMRecord} record The record which is going to be send
			 * @return {Boolean} false if the record should not be send.
			 */
			'beforesendrecord',
			/**
			 * @event sendrecord
			 * Fires after the record has been {@link #sendRecord send}.
			 * This follows the {@link #saverecord} event which triggers the send action on the server.
			 * @param {Zarafa.core.ui.RecordContentPanel} contentpanel The contentpanel from where the record is send
			 * @param {Zarafa.core.data.IPMRecord} record The record which has been send
			 */
			'sendrecord',
			/**
			 * @event aftersendrecord
			 * Fires after the record has been sent successfully.
			 * This follows the {@link #updaterecord} event when the server responded to the send action
			 * @param {Zarafa.core.ui.RecordContentPanel} contentpanel The contentpanel from where the record is send
			 * @param {Zarafa.core.data.IPMRecord} record The record which has been send
			 */
			'aftersendrecord'
		);

		Zarafa.core.ui.MessageContentPanel.superclass.constructor.call(this, config);

		// Initialize the Send Validation queue
		// which is used for validating the message before sending
		this.createSendValidationQueue();

		if (Ext.isString(this.sendingText)) {
			this.sendingText = { title : '', msg : this.sendingText };
		}
		if (Ext.isString(this.sendingDoneText)) {
			this.sendingDoneText = { title : '', msg : this.sendingDoneText };
		}

		if(this.record) {
			var store = this.record.getStore();
			if (store) {
				store.on('update', this.syncUpdatesToShadowStore, this);
			}
		}
	},

	/**
	 * Event handler which is triggered when a {@link Zarafa.core.data.IPMRecord record} has been
	 * updated from the server.
	 * When any record which belongs to {@link Zarafa.core.data.IPMStore} gets updated, respective
	 * {@link Zarafa.core.data.ShadowStore ShadowStore} record needs to be updated, if any.
	 *
	 * @param {Zarafa.core.data.IPMStore} store The store which performs the update
	 * @param {Zarafa.core.data.IPMRecord} record The Record which has been updated
	 * @param {String} operation  The update operation being performed.
	 * ({@link Ext.data.Record#EDIT}, {@link Ext.data.Record#REJECT}, {@link Ext.data.Record#COMMIT}).
	 * @private
	 */
	syncUpdatesToShadowStore : function(store, record, operation)
	{
		if (Zarafa.core.EntryId.compareEntryIds(record.get('entryid'), this.record.get('entryid'))) {
			if(operation === Ext.data.Record.COMMIT){
				var receivedFlags = record.get('message_flags');
				var categories = record.get('categories');
				var commit = false;

				// Stop modification-tracking to prevent dirty mark
				this.record.setUpdateModificationsTracking(false);

				// As of now, message_flags and categories property is being processed only because some properties
				// seems to be missing in MailStore-record as compare to ShadowStore-record result into some weird
				// behavior with mail-formatting and meeting-request-accept functionalities.
				this.record.beginEdit();
				if (this.record.get('message_flags') !== receivedFlags) {
					this.record.set('message_flags', receivedFlags);
					commit = true;
				}
				if (this.record.get('categories') !== categories) {
					this.record.set('categories', categories);
					commit = true;
				}
				this.record.endEdit();
				if ( commit ){
					this.record.commit();
				}

				// Start modification-tracking back for future user changes
				this.record.setUpdateModificationsTracking(true);
			}
		}
	},

	/**
	 * Create and initialize the {@link #sendValidationQueue}. This will add various
	 * validation steps which must be executed to determine if the message can be send.
	 * @protected
	 */
	createSendValidationQueue : function()
	{
		// Create a callback queue to validate the record before sending
		this.sendValidationQueue = new Zarafa.core.data.CallbackQueue();

		// Add a validation step to determine if there are recipients
		this.sendValidationQueue.add(this.validateEmptyRecipients, this);
		// Add a validation step to determine if a subject was provided
		this.sendValidationQueue.add(this.validateEmptySubject, this);
		// Add a validation step to determine if all recipients are resolved
		this.sendValidationQueue.add(this.validateResolvedRecipients, this);
		// Add a validation step to determine if all attachments are uploaded
		this.sendValidationQueue.add(this.validateAttachmentUpload, this);
	},

	/**
	 * If {@link showInfoMask} is enabled, this will display the {@link #savingText} to the user.
	 * @protected
	 * @overridden
	 */
	displayInfoMask : function()
	{
		if (this.showInfoMask === false) {
			return;
		}

		if (this.record.hasMessageAction('send') || this.record.getMessageAction('sendResponse')) {
			container.getNotifier().notify('info.sending', this.sendingText.title, this.sendingText.msg, {
				container : this.getEl()
			});
		} else {
			Zarafa.core.ui.MessageContentPanel.superclass.displayInfoMask.apply(this, arguments);
		}

	},

	/**
	 * If {@link #showInfoMask} is enabled, and {@link #displayInfoMask} has been called, this
	 * will remove the notification again. When saving has been successfull, a new notification
	 * will be shown to display the {@link #savingDoneText}.
	 * @param {Boolean} success false to disable the display of {@link #savingDoneText}.
	 * @protected
	 * @overridden
	 */
	hideInfoMask : function(success)
	{
		if (this.showInfoMask === false) {
			return;
		}

		if (this.record.hasMessageAction('send') || this.record.getMessageAction('sendResponse')) {
			if (success !== false) {
				container.getNotifier().notify('info.sent', this.sendingDoneText.title, this.sendingDoneText.msg);
			}
		} else {
			Zarafa.core.ui.MessageContentPanel.superclass.hideInfoMask.apply(this, arguments);
		}
	},

	/**
	 * Event handler which is fired when the the {@link Ext.data.Store store} for the {@link #record}
	 * fires the {@link Ext.data.Store#beforesave} event. This will check if the event was really regarding
	 * {@link #record} and will update the {@link #isSaving} or {@link #isSending} property and
	 * {@link #displayInfoMask display the infobox}.
	 * @param {Ext.data.Store} store The store which fired the event
	 * @param {Object} data The object data which is being saved to the server
	 * @private
	 */
	onBeforeSaveRecord : function(store, data)
	{
		if (data &&
		    ((data.update && data.update.indexOf(this.record) >= 0) ||
		     (data.create && data.create.indexOf(this.record) >= 0))) {
			this.isSending = this.record.hasMessageAction('send') || this.record.hasMessageAction('sendResponse');
		}
		Zarafa.core.ui.MessageContentPanel.superclass.onBeforeSaveRecord.apply(this, arguments);
	},

	/**
	 * Fired when the {@link #updaterecord} event has been fired. If {@link #showSavingMask} is enabled,
	 * this will display the {@link #savingText to indicate the saving is in progress.
	 *
	 * @param {Zarafa.core.ui.RecordContentPanel} contentpanel The contentpanel which fired the event
	 * @param {String} action write Action that ocurred. Can be one of
	 * {@link Ext.data.Record.EDIT EDIT}, {@link Ext.data.Record.REJECT REJECT} or
	 * {@link Ext.data.Record.COMMIT COMMIT}
	 * @param {Zarafa.core.data.IPMRecord} record The record which was updated
	 * @private
	 * @overridden
	 */
	onUpdateRecord : function(contentpanel, action, record)
	{
		Zarafa.core.ui.MessageContentPanel.superclass.onUpdateRecord.apply(this, arguments);

		var isSending = this.isSending;

		/**
		 * Close panel when it message has been sent or saved at serverside
		 * and here we have received confirmation
		 */
		if (action == Ext.data.Record.COMMIT) {
			var sendAction = record.hasMessageAction('send') || this.record.hasMessageAction('sendResponse');
			if (sendAction) {
				this.fireEvent('aftersendrecord', this, this.record);
				this.isSending = false;
			}

			if (isSending && this.closeOnSend && sendAction) {
				this.close();
				// We closed the panel, stop the event propagation as there is
				// no longer an UI that can be updated.
				return false;
			}
		}
	},

	/**
	 * Fired when the {@link #exceptionrecord} event has been fired. Will reset {@link #isSending}.
	 *
	 * @param {misc} misc See {@link Ext.data.DataProxy}.{@link Ext.data.DataProxy#exception exception}
	 * for description.
	 * @private
	 * @overridden
	 */
	onExceptionRecord : function(proxy, type, action, options, response, args)
	{
		Zarafa.core.ui.MessageContentPanel.superclass.onExceptionRecord.apply(this, arguments);

		if (type !== "open") {
			this.isSending = false;
		}
	},

	/**
	 * Save all changes made to the {@link #record} and send
	 * the message to the specified recipients.
	 */
	sendRecord : function()
	{
		// If record is saving then wait till saving is done. register aftersaverecord event
		// on message content panel.
		if(this.isSaving === true) {
			this.on('aftersaverecord', this.onAfterSaveRecord, this, {single : true});
			return;
		}

		if (this.recordComponentPlugin.allowWrite === false || this.isSending === true) {
			return;
		}

		if (this.fireEvent('beforesendrecord', this, this.record) === false) {
			return;
		}

		this.isSending = true;

		// Start the validation queue to determine if the record can be
		// send to the recipients correctly. If successfull, onCompleteValidateSendRecord
		// is called to send the actual record.
		this.sendValidationQueue.run(this.onCompleteValidateSendRecord, this);
	},

	/**
	 * Event handler which is called when send and save button is clicked
	 * immediately one after another. Function registers {@link Zarafa.core.data.MAPIStore#write}
	 * event which will call {@link #sendRecord} function when saving has been completed.
	 *
	 * This function is use to solve below problem.
	 *
	 * If we call {@link #sendRecord} straight away after {@link Zarafa.core.ui.RecordContentPanel #aftersaverecord} event then
	 * {@link Ext.data.Store #write} event is triggerd on {@link Zarafa.core.data.ShadowStore ShadowStore} for this record,
	 * It will call {@link Zarafa.core.data.MAPIRecord.clearMessageActions clearMessageActions}(i.e. send=true),
	 * so when we get response of send request there will be no reference of the send request in record.
	 * So we will not be able to perform {@link #aftersendrecord} event functionalities like,
	 * Closing the dialog, Showing the 'Sent Successfully' notification, hiding the 'Sending...' notification.
	 *
	 * @param {Zarafa.core.ui.RecordContentPanel} contentpanel The contentpanel from where the record is saved
	 * @param {Zarafa.core.data.IPMRecord} record The record which has been saved
	 */
	onAfterSaveRecord : function(contentPanel, record)
	{
		var store = record.getStore();
		this.mon(store, 'write', this.sendRecord, this, {single : true});
	},

	/**
	 * Validation function for the {@link #sendValidationQueue} to check if the Message
	 * can be send to the recipients.
	 *
	 * This validates if recipients were provided in the message. If not, then the
	 * message cannot be send
	 *
	 * @param {Function} callback The callback to call to continue in the queue
	 * @private
	 */
	validateEmptyRecipients : function(callback)
	{
		// Check if recipients have been provided
		var recipientStore = this.record.getRecipientStore();
		if (!Ext.isDefined(recipientStore) || recipientStore.getCount() === 0) {
			Ext.MessageBox.show({
				title: _('No recipient'),
				msg: _('Please specify at least one recipient'),
				buttons: Ext.MessageBox.OK
			});

			// The message cannot be send, cancel the callbacks
			callback(false);
		} else {
			// Check if the recipient_type is correct, there should at least be 1 TO/CC/BCC recipient
			var invalid = true;

			recipientStore.each(function(recip) {
				if (recip.get('recipient_type') !== Zarafa.core.mapi.RecipientType.MAPI_ORIG) {
					invalid = false;
					return false;
				}
			}, this);

			if (invalid) {
				Ext.MessageBox.show({
					title: _('No recipient'),
					msg: _('Please specify a recipient'),
					buttons: Ext.MessageBox.OK
				});

				// The message cannot be send, cancel the callbacks
				callback(false);
			} else {
				// The message can be send, the next callback can be called.
				callback(true);
			}
		}
	},

	/**
	 * Validation function for the {@link #sendValidationQueue} to check if the Message
	 * can be send to the recipients.
	 *
	 * This validates if the attachment is uploading while sending mail, if yes then the user is
	 * asked if he still wants to send the message without current uploading attachment.
	 *
	 * @param {Function} callback The callback to call to continue in the queue
	 * @private
	 */
	validateAttachmentUpload : function(callback)
	{
		var attachmentStore = this.record.getAttachmentStore();
		var isAllAttachUploaded = true;
		attachmentStore.each(function(attach) {
			if(!attach.isUploaded()) {
				isAllAttachUploaded = false;
				// stop further iterations
				return false;
			}
		}, this);

		// Check if the attachment has been uploaded
		if (!isAllAttachUploaded) {
			var message  = _('The attached files are not uploaded yet.');
			message += '<br/>';
			message += _('Do you want to send this message without attachments?');

			Zarafa.common.dialogs.MessageBox.addCustomButtons({
				title : _('Attachments not uploaded yet'),
				cls: Ext.MessageBox.WARNING_CLS,
				msg : message,
				fn : function(button) {
					callback(button === 'sendanyway');
				},
				customButton : [{
					text : _('Don\'t Send'),
					name : 'dontsend'
				}, {
					text : _('Send Anyway'),
					name : 'sendanyway'
				}]
			});
		} else {
			callback(true);
		}
	},

	/**
	 * Validation function for the {@link #sendValidationQueue} to check if the Message
	 * can be send to the recipients.
	 *
	 * This validates if the subject was provided in the message, if not then the user is
	 * asked if he still wants to send the message.
	 *
	 * @param {Function} callback The callback to call to continue in the queue
	 * @private
	 */
	validateEmptySubject : function(callback)
	{
		// Check if the subject has been provided
		if (Ext.isEmpty(this.record.get('subject'))){
			Ext.MessageBox.show({
				title: _('No subject'),
				msg: _('Send this message without a subject?'),
				buttons: Ext.MessageBox.YESNO,
				fn: function (buttonClicked) {
					// If the user clicked "yes" then the
					// callback queue can continue, otherwise
					// it will have to abort.
					callback(buttonClicked == 'yes');
				},
				scope: this,
			});
		} else {
			// The subject is provided, we can continue
			callback(true);
		}
	},

	/**
	 * Validation function for the {@link #sendValidationQueue} to check if the Message
	 * can be send to the recipients.
	 *
	 * This validates if all recipients were resolved in the message. If not, then
	 * the the recipientStore will resolve everything.
	 *
	 * @param {Function} callback The callback to call to continue in the queue
	 * @private
	 */
	validateResolvedRecipients : function(callback)
	{
		var recipientStore = this.record.getRecipientStore();
		var unresolved = recipientStore.getUnresolvedRecipients();
		var invalid = recipientStore.getInvalidRecipients();

		if (!Ext.isEmpty(invalid)) {
			// Invalid recipients were found, show error to the user
			// and cancel the callbacks as we cannot send the message
			Ext.MessageBox.show({
				title: _('Unresolved recipients'),
				msg: _('Not all recipients could be resolved'),
				cls: Ext.MessageBox.WARNING_CLS,
				buttons: Ext.MessageBox.OK
			});
			callback(false);
		} else if(!Ext.isEmpty(unresolved)) {
			// Unresolved recipients were found, try to resolve them, and have the event handler
			// call this function recursively so we can check again.
			this.mon(recipientStore, 'resolved', this.validateResolvedRecipients.createDelegate(this, [ callback ], false), this, { single : true });
			recipientStore.resolve(unresolved, { cancelPreviousRequest : true });
		} else {
			// No invalid or unresolved recipients, we can continue
			// the callback queue to send the message.
			callback(true);
		}
	},

	/**
	 * Callback function for the {@link #sendValidationQueue} which is called when the queue has been
	 * completed. If the queue ended successfully then the {@link #record} will get the
	 * {@link Zarafa.core.data.IPMRecord#addMessageAction 'send' message action} and will then
	 * {@link #saveRecord save the message} in order to send.
	 * @param {Boolean} success True if the queue ended successfully
	 * @private
	 */
	onCompleteValidateSendRecord : function(success)
	{
		if (success) {
			this.record.addMessageAction('send', true);
			if (this.saveRecord() !== false) {
				this.fireEvent('sendrecord', this, this.record);
			}
		} else {
			this.isSending = false;
		}
	}
});

Ext.reg('zarafa.messagecontentpanel', Zarafa.core.ui.MessageContentPanel);
