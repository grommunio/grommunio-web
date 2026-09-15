/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.mail.dialogs');

/**
 * @class Grommunio.mail.dialogs.MailCreateContentPanel
 * @extends Grommunio.core.ui.MessageContentPanel
 * @xtype grommunio.mailcreatecontentpanel
 */
Grommunio.mail.dialogs.MailCreateContentPanel = Ext.extend(Grommunio.core.ui.MessageContentPanel, {
	/**
	 * The {@link Grommunio.mail.MailContextModel} which is obtained using {@link #getContextModel}.
	 * @property
	 * @type Grommunio.mail.MailContextModel
	 */
	model: undefined,

	/**
	 * True if the BCC field should be shown.
	 * @property
	 * @type Boolean
	 */
	showbcc: false,

	/**
	 * @cfg {Boolean} useHtml True to enable the HTML editor in this panel
	 * If not provided, the value will be obtained from the {@link Grommunio.settings.SettingsModel}.
	 */
	useHtml: false,

	/**
	 * True if the From field should be shown.
	 * @property
	 * @type Boolean
	 */
	showfrom: false,

	/**
	 * The queue containing callback functions which can be used to validate the
	 * {@link Grommunio.core.data.IPMRecord} before opening send later dialog. If the queue
	 * completes successfully, the dialog will open, otherwise it will be cancelled.
	 * @property
	 * @type Grommunio.core.data.CallbackQueue
	 * @protected
	 */
	sendLaterValidationQueue: undefined,

	/**
	 * @cfg {Grommunio.addressbook.dialogs.AddressBookContentPanel} ABDialog only available when
	 * user select "Send email" address book context menu item.
	 */
	ABDialog: undefined,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		if (!Ext.isDefined(config.useHtml)) {
			config.useHtml = container.getSettingsModel().get('grommunio/v1/contexts/mail/dialogs/mailcreate/use_html_editor');
		}

		config.plugins = Ext.value(config.plugins, []);
		if (container.getSettingsModel().get('grommunio/v1/contexts/mail/autosave_enable') === true) {
			config.plugins.push({
				ptype: 'grommunio.autosavemessageplugin'
			});
		}

		// Add in some standard configuration data.
		Ext.applyIf(config, {
			// Override from Ext.Component
			xtype: 'grommunio.mailcreatecontentpanel',
			// Override from Ext.Component
			layout: 'fit',
			title: _('Email'),
			recordComponentPluginConfig: Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite: true
			}),
			closeOnSend: true,
			confirmClose: true,
			items: [{
				xtype: 'grommunio.mailcreatepanel',
				ref: 'mainPanel',
				useHtml: config.useHtml,
				tbar:{
					xtype: 'grommunio.mailcreatetoolbar'
				}
			}]
		});

		this.addEvents(
			/**
			 * Fires when the user toggle a button in toolbar.
			 * This event will link the toolbar with mainpanel in panel
			 * @param {Grommunio.core.ui.ContentPanel} contentpanel
			 * @param {Boolean} true if toggle state ie. pressed or else false
			 */
			'bcctoggle',
			/**
			 * Fires when the user toggle a button in toolbar.
			 * This event will link the toolbar with mainpanel in contentpanel
			 * @param {Grommunio.core.ui.ContentPanel} contentpanel
			 * @param {Boolean} true if toggle state ie. pressed or else false
			 */
			'fromtoggle'
		);

		// Call parent constructor
		Grommunio.mail.dialogs.MailCreateContentPanel.superclass.constructor.call(this, config);

		// Initialize the Send Later Validation queue
		// which is used for validating the message before opening send later dialog
		this.createSendLaterValidationQueue();
	},

	/**
	 * If {@link showInfoMask} is enabled, this will display the {@link #savingText} to the user.
	 * @protected
	 * @overridden
	 */
	displayInfoMask: function()
	{
		if (this.showInfoMask === false) {
			return;
		}

		if (this.isSaving && !this.isSending) {
			this.savingEl = container.getNotifier().notify('info.mailsaving', '', _('Saving…'), {
				toolbar: this.mainPanel.getTopToolbar()
			});
		} else {
			Grommunio.mail.dialogs.MailCreateContentPanel.superclass.displayInfoMask.apply(this, arguments);
		}
	},

	/**
	 * If {@link #showInfoMask} is enabled, and {@link #displayInfoMask} has been called, this
	 * will remove the saving notification. When saving has been successful, a new notification
	 * will be shown to display the {@link #savingDoneText} with timestamp.
	 * @param {Boolean} success false to disable the display of {@link #savingDoneText}.
	 * @protected
	 * @overridden
	 */
	hideInfoMask: function(success)
	{
		if (this.showInfoMask === false) {
			return;
		}

		// If there isn't any message action set on the record, then it's just the save mail action.
		if (this.isSaving && !this.isSending) {
			var message = (success) ? String.format(_('Saved at {0}'), this.record.get('last_modification_time').formatDefaultTime()) : _('Saving failed');
			container.getNotifier().notify('info.mailsaved', '', message, {
				toolbar: this.mainPanel.getTopToolbar()
			});
		} else {
			Grommunio.mail.dialogs.MailCreateContentPanel.superclass.hideInfoMask.apply(this, arguments);
		}
	},

	/**
	 * Event which is fired when the {@link #record} has been completely loaded.
	 * This will close the {@link Grommunio.addressbook.dialogs.AddressBookContentPanel AddressBookContentPanel} if
	 * it is open.
	 *
	 * @param {Ext.Container} panel The panel to which the record was set
	 * @param {Grommunio.core.data.MAPIRecord} record The record which was updated
	 * @private
	 */
	onLoadRecord: function(panel, record)
	{
		Grommunio.mail.dialogs.MailCreateContentPanel.superclass.onLoadRecord.apply(this, arguments);

		if (Ext.isDefined(this.ABDialog)) {
			this.ABDialog.close();
		}
	},

	/**
	 * Load record into content panel
	 *
	 * @param {Grommunio.core.data.IPMRecord} record The record to load
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update: function(record, contentReset)
	{
		var hasFrom = false;
		var hasBcc = false;
		/**
		 * Bcc field is shown when either of condition if true:
		 * 1) When user has selected Bcc Field to be shown always OR
		 * 2) When record itself has bcc recipients
		 *
		 * Same way From field is shown when either of condition if true:
		 * 1) When user has selected From Field to be shown always OR
		 * 2) When record has set delegator in sent_representing_* info.
		 */
		if (contentReset) {
			var delegatorFieldStore = this.mainPanel.fromRecipientField.getBoxStore();
			if(!record.userIsStoreOwner()) {
				var delegator = container.getHierarchyStore().getById(record.get('store_entryid'));
				record.setDelegatorInfo(delegator);
			}
			
			// Get the recipient for the From field.
			var delegatorRecord = record.getDefaultFromRecipeint();

			if(Ext.isDefined(delegatorRecord) && delegatorRecord) {
				hasFrom = true;
				// We need to maintain that in from field there should be only one user,
				// So remove earlier added user.
				delegatorFieldStore.removeAll();
				delegatorFieldStore.add(delegatorRecord);
			}
			hasBcc = record.getSubStore('recipients').hasBccRecipients();
			this.fireEvent('bcctoggle', this, this.showbcc || hasBcc, false);
			this.fireEvent('fromtoggle', this, this.showfrom || hasFrom, false);

			if (this.inputAutoFocusPlugin) {
				switch (record.getMessageAction('action_type')) {
					case Grommunio.mail.data.ActionTypes.REPLY:
					case Grommunio.mail.data.ActionTypes.REPLYALL:
					case Grommunio.mail.data.ActionTypes.EDIT_AS_NEW:
						// Automatically place the focus on the body
						this.inputAutoFocusPlugin.setAutoFocus('grommunio.editorfield');
						break;
					case Grommunio.mail.data.ActionTypes.FORWARD:
					case Grommunio.mail.data.ActionTypes.FORWARD_ATTACH:
					/* falls through */
					default:
						this.inputAutoFocusPlugin.setAutoFocus(this.mainPanel.toRecipientField);
						break;
				}
			}
		} else {
			if (record.isSubStoreModifiedSincelastUpdate('recipients')) {
				hasBcc = record.getSubStore('recipients').hasBccRecipients();
				this.fireEvent('bcctoggle', this, this.showbcc || hasBcc, false);
			}

			if (record.isModifiedSinceLastUpdate('sent_representing_email_address')) {
				if(!Ext.isEmpty(record.get('sent_representing_email_address'))) {
					hasFrom = true;
				}

				this.fireEvent('fromtoggle', this, (this.showfrom || hasFrom), false);
			}
		}

		this.updateTitleFromRecord(record);
		this.updateIconFromRecord(record);
	},

	/**
	 * Update this panel's icon class from the record that it contains
	 * First obtains the icon class from a mapping, then calls {@link #setIcon}
	 *
	 * @param {Grommunio.core.data.MAPIRecord} record The record bound to this component
	 * @private
	 */
	updateIconFromRecord: function(record)
	{
		//TODO: create a new icon mapping for tabs
		var iconCls = Grommunio.common.ui.IconClass.getIconClass(record);
		this.setIcon(iconCls);
	},

	/**
	 * When record has been updated, title also has to be - for instance if we have the subject
	 * in the title and the subject changes
	 * Calls {@link #setTitle} this.setTitle in order to update
	 * @param {Grommunio.core.data.MAPIRecord} record The record that has been updated
	 */
	updateTitleFromRecord: function(record)
	{
		var subject = record.get('subject');
		if(!Ext.isEmpty(subject)){
			this.setTitle(subject);
		} else {
			this.setTitle(this.initialConfig.title);
		}
	},

	/**
	 * Register the {@link #stateEvents state events} to the {@link #saveState} callback function.
	 * @private
	 */
	initStateEvents: function()
	{
		Grommunio.mail.dialogs.MailCreateContentPanel.superclass.initStateEvents.call(this);

		this.on('bcctoggle', this.saveState, this);
		this.on('fromtoggle', this.saveState, this);
	},

	/**
	 * Called when bcctoggle or fromtoggle event is fired, if the argument
	 * saveState is true it will save the state of the mailcreatecontentpanel
	 * to grommunio Web user settings.
	 *
	 * @param {Grommunio.mail.dialogs.MailCreateContentPanel} panel the mail create content panel
	 * @param {Boolean} visible visibility of button
	 * @param {Boolean} saveState save the state of the button.
	 */
	saveState: function(panel, visible, saveState)
	{
		if(saveState){
			Grommunio.mail.dialogs.MailCreateContentPanel.superclass.saveState.call(this);
		}
	},

	/**
	 * When {@link #stateful} the State object which should be saved into the
	 * {@link Ext.state.Manager}.
	 * @return {Object} The state object
	 * @protected
	 */
	getState: function()
	{
		var state = Grommunio.mail.dialogs.MailCreateContentPanel.superclass.getState.apply(this, arguments);
		return Ext.apply(state || {}, { showbcc: this.showbcc, showfrom: this.showfrom });
	},

	/**
	 * Saves bcc field's state into settings and fires 'bcctoggle' event to update UI
	 * @param {Boolean} true, if Bcc field is visible else false
	 */
	toggleBccState: function(showBcc)
	{
		this.showbcc = showBcc;
		this.fireEvent('bcctoggle', this, showBcc, true);
	},

	/**
	 * Saves from field's state into settings and fires 'fromtoggle' event to update UI
	 * @param {Boolean} true, if From field is visible else false
	 */
	toggleFromState: function(showFrom)
	{
		this.showfrom = showFrom;
		this.fireEvent('fromtoggle', this, showFrom, true);
	},

	/**
	 * Function gets the {@link Grommunio.mail.MailContextModel MailContextModel} attached to
	 * {@link Grommunio.mail.MailContext MailContext}.
	 * @return {Grommunio.mail.MailContextModel} Mail context model
	 */
	getContextModel: function()
	{
		if(!this.model) {
			var parentFolder = this.get('parent_entryid');

			if(!Ext.isEmpty(parentFolder)) {
				parentFolder = container.getHierarchyStore().getById(parentFolder);
			}

			if(Ext.isEmpty(parentFolder)) {
				parentFolder = container.getHierarchyStore().getDefaultFolder('drafts');
			}

			// now do round of bidding to find context attached to the folder we got
			var context = container.getContextByFolder(parentFolder);
			this.model = context.getModel();
		}

		return this.model;
	},

	/**
	 * Helper function which is used to validate {@link #record} and open the send later dialog
	 */
	sendLaterRecord: function ()
	{
		this.sendLaterValidationQueue.run(this.onCompleteValidateSendLaterRecord, this);
	},

	/**
	 * Create and initialize the {@link #sendLaterValidationQueue}. This will add two validations steps
	 * which must be executed to determine if the message has valid recipients.
	 * @protected
	 */
	createSendLaterValidationQueue: function ()
	{
		this.sendLaterValidationQueue = new Grommunio.core.data.CallbackQueue();

		// Add a validation step to determine if there are recipients
		this.sendLaterValidationQueue.add(this.validateEmptyRecipients, this);
		// Add a validation step to warn about missing attachments when keywords are found
		this.sendLaterValidationQueue.add(this.validateMissingAttachment, this);
		// Add a validation step to determine if all recipients are resolved
		this.sendLaterValidationQueue.add(this.validateResolvedRecipients, this);
	},

	/**
	 * Callback function for the {@link #sendLaterValidationQueue} which is called when the queue has been
	 * completed. If the queue ended successfully then it will call the {@link Grommunio.mail.Actions#openDelayedDeliveryContent}.
	 * @param {Boolean} success True if the queue ended successfully
	 * @private
	 */
	onCompleteValidateSendLaterRecord: function (success)
	{
		if (success) {
			Grommunio.mail.Actions.openDelayedDeliveryContent(this.record, this);
		}
	}
});

Ext.reg('grommunio.mailcreatecontentpanel', Grommunio.mail.dialogs.MailCreateContentPanel);
