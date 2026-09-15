/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.mail');

/**
 * @class Grommunio.mail.Actions
 * Common actions which can be used within {@link Ext.Button buttons}
 * or other {@link Ext.Component components} with action handlers.
 * @singleton
 */
Grommunio.mail.Actions = {
	/**
	 * Open a Panel in which a new {@link Grommunio.core.data.IPMRecord record} can be
	 * further edited.
	 *
	 * @param {Grommunio.mail.MailContextModel} model Context Model object that will be used
	 * to {@link Grommunio.mail.MailContextModel#createRecord create} the email.
	 * @param {Object} config (optional) Configuration object used to create
	 * the Content Panel.
	 */
	openCreateMailContent: function(model, config)
	{
		var record = model.createRecord();
		Grommunio.core.data.UIFactory.openCreateRecord(record, config);
	},

	/**
	 * Opens a {@link Grommunio.mail.ui.MailCreatePanel MailCreatePanel} for the given non-recipient
	 * objects. This will convert the object into a valid Recipient Record and add it to the new mail.
	 *
	 * @param {Grommunio.mail.MailContextModel} model mail context model,
	 * model object that will be used to create a new {@link Grommunio.core.data.IPMRecord IPMRecord}
	 * @param {Grommunio.core.data.MAPIRecord} contacts The records to convert to recipients.
	 * @param {Object} config (optional) Configuration object used to create
	 * the Content Panel.
	 */
	openCreateMailContentForContacts: function(model, contacts, config)
	{
		var mailRecord = model.createRecord();
		var recipientStore = mailRecord.getRecipientStore();
		var tasks = [];

		contacts = Array.isArray(contacts) ? contacts : [ contacts ];
		for (var i = 0, len = contacts.length; i < len; i++) {
			var contact = contacts[i];

			if (contact.isOpened()) {
				// The contact is opened and contains all the information which we need
				var recipient = contact.convertToRecipient(Grommunio.core.mapi.RecipientType.MAPI_TO, true);
				recipientStore.add(recipient);
			} else {
				// The contact is not opened yet, register a task to open the contact once
				// the panel has been opened.
				tasks.push({
					/* By encapsulating the task function it is possible to get the contact object
					* into the scope of the task function. When you add more tasks the contact
					* reference changes and without this encapsulation it will change the contact in
					* all the previously added task functions as well.
					*/
					fn: function(){
						// This contactRecord becomes a private variable, not changeable outside.
						var contactRecord = contact;
						return function(panel, record, task, callback) {
							var fn = function(store, record) {
								if (record === contactRecord) {
									store.un('open', fn, task);
									var recipient = contactRecord.convertToRecipient(Grommunio.core.mapi.RecipientType.MAPI_TO, true);
									recipientStore.add(recipient);
									callback();
								}
							};

							contactRecord.getStore().on('open', fn, task);
							contactRecord.open();
						};
					// This triggers the encapsulation and returns the task function
					}()
				});
			}
		}

		config = Ext.applyIf(config || {}, {
			recordComponentPluginConfig: {
				loadTasks: tasks
			}
		});

		Grommunio.core.data.UIFactory.openCreateRecord(mailRecord, config);
	},

	/**
	 * Opens a {@link Grommunio.mail.ui.MailCreatePanel MailCreatePanel} for the
	 * given {@link Grommunio.core.data.IPMRecord record} using the {@link Grommunio.mail.data.ActionTypes actionType}
	 * to format the message.
	 *
	 * @param {Grommunio.core.data.IPMRecord|Grommunio.core.data.IPMRecord[]} record The record to which will be responded.
	 * @param {Grommunio.mail.MailContextModel} model mail context model,
	 * model object that will be used to create a new {@link Grommunio.core.data.IPMRecord IPMRecord}
	 * @param {Grommunio.mail.data.ActionTypes} actionType The action type of this response.
	 * @param {Object} config (optional) Configuration object used to create
	 * the Content Panel.
	 */
	openCreateMailResponseContent: function(records, model, actionType, config)
	{
		if (!Array.isArray(records)) {
			records = [records];
		}

		var response;

		for (var i = 0; i < records.length; i++) {
			var record = records[i];

			if (record.isFaultyMessage()) {
				// can not reply/forward to faulty record
				continue;
			}

			if (actionType === Grommunio.mail.data.ActionTypes.FORWARD_ATTACH) {
				response = model.createResponseRecord(record, actionType, response, config);
			} else {
				// let, not var: each record needs its own pair, because each handler
				// unregisters itself by name when it fires.
				let openHandler = function(store, record) {
					// This function will called in the scope of the record for
					// whom the event handler was registered.
					if (this !== record) {
						return;
					}

					if (actionType === Grommunio.mail.data.ActionTypes.FORWARD_ATTACH) {
						response = model.createResponseRecord(record, actionType, response, config);
					} else {
						store.un('open', openHandler, record);
						store.un('exception', failHandler, record);
						Grommunio.mail.Actions.openReadyMailResponse(record, model, actionType, config);
					}
				};

				// Stop listening if this record's open/reload fails, otherwise the
				// handler leaks and a later successful open would build an
				// unexpected second compose window. The store's 'exception' fires
				// for every record on it, so match on the failed record.
				let failHandler = function(proxy, type, action, options, response, args) {
					if (action !== Ext.data.Api.actions.open) {
						return;
					}
					var failed = args ? args.sendRecords : null;
					if (failed !== this && !(Array.isArray(failed) && failed.indexOf(this) !== -1)) {
						return;
					}
					this.getStore().un('open', openHandler, this);
					this.getStore().un('exception', failHandler, this);
				};

				// An opened record which carries no body must be loaded again,
				// otherwise the quote is built from an empty body and the reply
				// ends up containing only the quoted header. See
				// Grommunio.core.data.IPMRecord#isBodyMissing.
				if (record.isOpened() && !record.isBodyMissing()) {
					Grommunio.mail.Actions.openReadyMailResponse(record, model, actionType, config);
				} else {
					var store = record.getStore();
					store.on('open', openHandler, record);
					store.on('exception', failHandler, record);
					if (record.isOpened()) {
						// Flagged as opened, so a plain open() would return early.
						record.reloadBody();
					} else {
						record.open();
					}
				}
			}
		}

		if (actionType === Grommunio.mail.data.ActionTypes.FORWARD_ATTACH) {
			Grommunio.core.data.UIFactory.openCreateRecord(response, config);
		}
	},

	/** Wait for local decryption and attachment uploads before quoting a message. */
	openReadyMailResponse: function(record, model, actionType, config)
	{
		if (record.browserResponsePending) { return; }
		var info = record.get('pgp');
		var open = function() {
			var response = model.createResponseRecord(record, actionType, undefined, config);
			if (response.browserAttachmentsReady) {
				return response.browserAttachmentsReady.then(function() { Grommunio.core.data.UIFactory.openCreateRecord(response, config); });
			}
			Grommunio.core.data.UIFactory.openCreateRecord(response, config);
		};
		if (!info || info.unverifiable) { return open(); }
		record.browserResponsePending = true;
		var transport = Grommunio.plugins && Grommunio.plugins.pgp && Grommunio.plugins.pgp.PgpTransport;
		var ready = Promise.resolve().then(function() {
			if (!transport) { throw new Error(_('Enable OpenPGP before replying to this protected message.')); }
			return transport.open(record);
		});
		return ready.then(function() {
			var status = record.get('pgp') || {};
			if (status.encrypted && !status.decrypted && status.locked) { return transport.unlockAndOpen(record); }
		}).then(function() {
			var status = record.get('pgp') || {};
			if (status.error || status.pending || (status.encrypted && !status.decrypted)) {
				throw new Error(_('The protected message could not be opened. No reply or forward was created.'));
			}
			return open();
		}).catch(function(error) {
			if (!error.cancelled) { container.getNotifier().notify('info.saved', _('Unable to open response'), Ext.util.Format.htmlEncode(error.message)); }
		}).then(function() { record.browserResponsePending = false; });
	},

	/**
	 * Opens a MailOptionsPanel. For displaying advanced options for the given {@link Grommunio.core.data.IPMRecord records}.
	 *
	 * @param {Grommunio.core.data.IPMRecord} records The record, or records for which the options are requested
	 * @param {Object} config (optional) Configuration object used to create
	 * the Content Panel.
	 */
	openMailOptionsContent: function(records, config)
	{
		if (Array.isArray(records) && !Ext.isEmpty(records)) {
			records = records[0];
		}

		config = Ext.applyIf(config || {}, {
			modal: true
		});

		var componentType = Grommunio.core.data.SharedComponentType['mail.dialog.options'];
		Grommunio.core.data.UIFactory.openLayerComponent(componentType, records, config);
	},

	/**
	 * Opens a {@link Grommunio.addressbook.dialogs.ABMultiUserSelectionContentPanel ABMultiUserSelectionContentPanel}
	 * for configuring the categories of the given {@link Grommunio.core.data.IPMRecord records}.
	 *
	 * @param {Grommunio.core.data.IPMRecord} records The record, or records for which the categories
	 * must be configured
	 * @param {Object} config (optional) Configuration object used to create
	 * the Content Panel.
	 */
	openRecipientSelectionContent: function(records, config)
	{
		if (Array.isArray(records) && !Ext.isEmpty(records)) {
			records = records[0];
		}

		// Create a copy of the record, we don't want the changes
		// to be activated until the user presses the Ok button.
		var copy = records.copy();
		var store = copy.getSubStore('recipients');
		copy.isModalDialogRecord = true;
		Grommunio.common.Actions.openABUserMultiSelectionContent({
			callback: function() {
				records.applyData(copy);
			},
			convert: function(user, field) {
				return user.convertToRecipient(field ? field.defaultRecipientType : config.defaultRecipientType);
			},
			store: store,
			selectionCfg: [{
				xtype: 'grommunio.recipientfield',
				fieldLabel: _('To') + ':',
				boxStore: store,
				filterRecipientType: Grommunio.core.mapi.RecipientType.MAPI_TO,
				defaultRecipientType: Grommunio.core.mapi.RecipientType.MAPI_TO,
				flex: 1
			},{
				xtype: 'grommunio.recipientfield',
				fieldLabel: _('CC') + ':',
				boxStore: store,
				filterRecipientType: Grommunio.core.mapi.RecipientType.MAPI_CC,
				defaultRecipientType: Grommunio.core.mapi.RecipientType.MAPI_CC,
				flex: 1
			},{
				xtype: 'grommunio.recipientfield',
				fieldLabel: _('BCC') + ':',
				boxStore: store,
				filterRecipientType: Grommunio.core.mapi.RecipientType.MAPI_BCC,
				defaultRecipientType: Grommunio.core.mapi.RecipientType.MAPI_BCC,
				flex: 1
			}]
		});
	},

	/**
	 * Open a Panel in which the {@link Grommunio.core.data.IPMRecord record}
	 * can be viewed, or further edited with pre-chosen layer as separateWindows..
	 * Prepare record instance based on original record.
	 *
	 * @param {Grommunio.core.data.IPMRecord} records The records to open
	 * @param {Grommunio.core.ui.MessageContentPanel} dialog which contains the record.
	 */
	popoutMailContent: function(record, dialog) {
		var copy;

		// First create the exact same copy of record avoiding cheap copy.
		copy = Grommunio.core.data.RecordFactory.createRecordObjectByRecordData(record.data, record.id);
		copy.idProperties = record.idProperties.clone();
		copy.phantom = record.phantom;
		copy.dirty = record.dirty;
		copy.modified = record.modified;
		copy.applyData(record, false);

		// We must have to retain "id" of attachment-substore of original record to access attachments.
		var attachmentStoreId = record.getAttachmentStore().getId();
		copy.getAttachmentStore().setId(attachmentStoreId);

		var configObj = {
			layerType: 'separateWindows',
			isRecordChangeByUser: dialog.recordComponentPlugin.isChangedByUser
		};

		if(!record.phantom){
			// Add the copied record into the shadow store as the old record will be removed from the same,
			// when the tab gets closed, and store is required to attach necessary events for some functionality like markAsRead etc.
			container.getShadowStore().add(copy);

			// Prevent that RecordComponentPlugin's setRecord adds the record into the shadow store again
			// as we already add the record into shadow store in the line above.
			configObj.recordComponentPluginConfig = { useShadowStore: false };
		}

		// Close the existing tab for which a new separate browser window is created
		dialog.fireEvent('close', dialog);
		Grommunio.core.data.ContentPanelMgr.unregister(dialog);

		// Use newly created copy of original record to load into separate browser window
		Grommunio.common.Actions.openMessageContent(copy, configObj);
	},

    /**
     * Open a {@link Grommunio.mail.dialogs.DelayDeliveryContentPanel DelayDeliveryContentPanel} for
     * set DEFERRED_SEND_TIME property  in new created mail base on enter Date and Time
     *
     * @param {Grommunio.core.data.IPMRecord} record mail record
     * @param {Grommunio.core.ui.MessageContentPanel} dialog which contains the record.
     */
    openDelayedDeliveryContent: function (record, dialog)
	{
        Grommunio.core.data.UIFactory.openLayerComponent(Grommunio.core.data.SharedComponentType['mail.dialog.delayeddelivery'], record, {
            manager: Ext.WindowMgr,
            modal: true,
            mailPanel: dialog,
            resizable: false,
            scope: this
        });
	},

	/**
	 * Function will redirect to signature widget which belongs to {@link Grommunio.mail.settings.SettingsSignaturesWidget SettingsSignaturesWidget}.
	 */
	redirectToSignatureWidget: function()
	{
		if (Grommunio.core.BrowserWindowMgr.isMainWindowActive() === false){
			Grommunio.core.BrowserWindowMgr.switchFocusToMainWindow();
		}

		var context = container.getCurrentContext();
		if (context.getName() === "settings") {
			var tabPanel = container.getTabPanel();
			context.defaultActiveTab = 1;
			context.scrollToSignatureWidget = true;
			tabPanel.setActiveTab("grommunio-mainpanel-content");
		} else {
			context = container.getContextByName('settings');
			// defaultActiveTab = 1 is mail tab
			context.defaultActiveTab = 1;
			context.scrollToSignatureWidget = true;
			container.switchContext(context);
		}
	}
};
