Ext.namespace('Zarafa.common');

/**
 * @class Zarafa.common.Actions
 * Common actions which can be used within {@link Ext.Button buttons}
 * or other {@link Ext.Component components} with action handlers.
 * @singleton
 */
Zarafa.common.Actions = {
	/**
	 * The internal 'iframe' which is hidden from the user, which is used for downloading
	 * attachments. See {@link #doOpen}.
	 * @property
	 * @type Ext.Element
	 */
	downloadFrame : undefined,

	/**
	 * The array holding broken eml files, if found.
	 * @property
	 * @type Array
	 */
	brokenFiles : undefined,

	/**
	 * Total number of files selected by user to upload.
	 * @property
	 * @type Number
	 */
	totalFiles : undefined,

	/**
	 * Defines if the imported item should be shown after import.
	 * @property
	 * @type Boolean
	 */
	showImported : false,

	/**
	 * Open a {@link Zarafa.common.dialogs.CopyMoveContentPanel CopyMoveContentPanel} for
	 * copying or moving {@link Zarafa.core.data.IPMRecord records} to the
	 * preferred destination folder.
	 *
	 * @param {Zarafa.core.data.IPMRecord} records The record which must be copied or moved.
	 * @param {Object} config (optional) Configuration object to create the ContentPanel
	 */
	openCopyMoveContent : function(records, config)
	{
		config = Ext.applyIf(config || {}, {
			modal : true
		});
		var componentType = Zarafa.core.data.SharedComponentType['common.dialog.copymoverecords'];
		Zarafa.core.data.UIFactory.openLayerComponent(componentType, records, config);
	},

	/**
	 * Opens a {@link Zarafa.common.recurrence.dialogs.RecurrenceContentPanel RecurrenceContentPanel} for configuring
	 * the recurrence of the given {@link Zarafa.core.data.IPMRecord record}.
	 *
	 * @param {Zarafa.core.data.IPMRecord} records The record for which the recurrence must be configured.
	 * @param {Object} config Configuration object
	 */
	openRecurrenceContent : function(records, config)
	{
		if (Array.isArray(records) && !Ext.isEmpty(records)) {
			records = records[0];
		}

		config = Ext.applyIf(config || {}, {
			autoSave : true,
			modal : true
		});

		var componentType = Zarafa.core.data.SharedComponentType['common.dialog.recurrence'];
		Zarafa.core.data.UIFactory.openLayerComponent(componentType, records, config);
	},

	/**
	 * Opens the {@link Zarafa.common.categories.ui.CategoriesContextMenu CategoriesContextMenu} for
	 * the given {@link Zarafa.core.data.IPMRecord records}.
	 *
	 * @param {Zarafa.core.data.IPMRecord} records The record, or records for which the categories
	 * menu will be shown.
	 * @param {Array} position An array with the [x, y] position where the menu will be shown.
	 */
	openCategoriesMenu : function(records, position)
	{
		Zarafa.core.data.UIFactory.openContextMenu(Zarafa.core.data.SharedComponentType['common.contextmenu.categories'], records, {
			position : position
		});
	},

	/**
	 * Opens the {@link Zarafa.common.flags.ui.FlagsMenu FlagsMenu} for
	 * the given {@link Zarafa.core.data.IPMRecord records}.
	 *
	 * @param {Zarafa.core.data.IPMRecord} records The record, or records for which the flags
	 * menu will be shown.
	 * @param {Array} position An array with the [x, y] position where the menu will be shown.
	 * @param {Boolean} shadowEdit True to create copy of this record and push it to ShadowStore.
	 */
	openFlagsMenu : function(records, position, shadowEdit)
	{
		if (!Ext.isArray(records)) {
			records = [ records ];
		}

		var component = Zarafa.core.data.SharedComponentType['common.contextmenu.flags'];
		Zarafa.core.data.UIFactory.openContextMenu(component, records, {
			position : position,
			shadowEdit : shadowEdit,
			store : records[0].getStore()
		});
	},

	/**
	 * Opens a {@link Zarafa.common.flag.dialogs.CustomFlagContentPanel CustomFlagContentPanel} for set
	 * the custom flag and reminder to given {@link Zarafa.core.data.IPMRecord records}.
	 *
	 * @param {Zarafa.core.data.IPMRecord} records The record, or records for which the custom
	 * flag or/and reminder going to set.
	 * @param {Object} config (optional) Configuration object for creating the ContentPanel
	 */
	openCustomFlagContent : function(records, config)
	{
		config = Ext.applyIf(config || {}, {
			modal : true,
			resizable : false
		});
		var componentType = Zarafa.core.data.SharedComponentType['common.flags.dialogs.customflag'];
		Zarafa.core.data.UIFactory.openLayerComponent(componentType, records, config);
	},

	/**
	 * Opens a {@link Zarafa.common.categories.dialogs.CategoriesContentPanel CategoriesContentPanel} for configuring
	 * the categories of the given {@link Zarafa.core.data.IPMRecord records}.
	 *
	 * @param {Zarafa.core.data.IPMRecord} records The record, or records for which the categories
	 * must be configured
	 * @param {Object} config (optional) Configuration object for creating the ContentPanel
	 */
	openCategoriesContent : function(records, config)
	{
		if (!Array.isArray(records)) {
			records = [ records ];
		}

		config = Ext.applyIf(config || {}, {
			autoSave : true,
			modal : true
		});

		// Callback function added in config object if
		// selected records is belongs to search store.
		var store = records[0].getStore();
		if(Ext.isFunction(store.isAdvanceSearchStore) && store.isAdvanceSearchStore()) {
			config.callback = function() {
				Ext.each(records, function(record){
					var foundRecord = this.record.find(function(rec){
						return rec.get('entryid') === record.get('entryid');
					});
					record.applyData(foundRecord);
				}, this);
			};
		}

		var componentType = Zarafa.core.data.SharedComponentType['common.dialog.categories'];
		Zarafa.core.data.UIFactory.openLayerComponent(componentType, records, config);
	},

	/**
	 * Opens a {@link Zarafa.common.categories.dialogs.NewCategoryPanel NewCategoryPanel} for creating
	 * a new category.
	 *
	 * @param {Object} config (optional) Configuration object for creating the NewCategoryPanel
	 */
	openNewCategoryContent : function(config)
	{
		config = Ext.applyIf(config || {}, {
			modal : true
		});
		var componentType = Zarafa.core.data.SharedComponentType['common.categories.dialogs.newcategory'];
		Zarafa.core.data.UIFactory.openLayerComponent(componentType, undefined, config);
	},

	/**
	 * Opens a {@link Zarafa.common.categories.dialogs.RenameCategoryPanel RenameCategoryPanel} for renaming
	 * a standard category.
	 *
	 * @param {Object} config (optional) Configuration object for renaming the {@link Zarafa.common.categories.dialogs.RenameCategoryPanel RenameCategoryPanel}.
	 */
	openRenameCategoryContent : function(config)
	{
		config = Ext.applyIf(config || {}, {
			modal : true
		});
		var componentType = Zarafa.core.data.SharedComponentType['common.categories.dialogs.renamecategory'];
		Zarafa.core.data.UIFactory.openLayerComponent(componentType, undefined, config);
	},

	/**
	 * Opens a {@link Zarafa.common.attachment.dialogs.AttachItemContentPanel Attach Item Content Panel} which is used
	 * to attach an item as embedded attachment to a message.
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record record that will be used to add embedded attachment
	 * @param {Object} config (optional) Configuration object for creating the ContentPanel
	 */
	openAttachItemSelectionContent : function(record, config)
	{
		config = Ext.applyIf(config || {}, {
			modal : true
		});

		var componentType = Zarafa.core.data.SharedComponentType['common.attachment.dialog.attachitem'];
		Zarafa.core.data.UIFactory.openLayerComponent(componentType, record, config);
	},

	/**
	 * Opens a {@link Zarafa.core.ui.widget.WidgetContentPanel}
	 * for inserting widgets into the {@link Zarafa.core.ui.widget.WidgetPanel}
	 * @param {Object} config (optional) Configuration object for creating the ContentPanel
	 */
	openWidgetsContent : function(config)
	{
		var componentType = Zarafa.core.data.SharedComponentType['common.dialog.widgets'];
		Zarafa.core.data.UIFactory.openLayerComponent(componentType, undefined, config);
	},

	/**
	 * Will open the View ContentPanel for a recipient, before opening the recipient it will
	 * first check the exact type of the recipient to see if it is an AddressBook item
	 * or personal contact. If either of those two the record is converted to assure the
	 * correct panel is opened.
	 * @param {Zarafa.core.data.IPMRecipientRecord} recipient The recipient which must be opened
	 * @param {Object} config configuration object.
	 */
	openViewRecipientContent : function(recipient, config)
	{
		if (recipient.isResolved()) {
			if (recipient.isPersonalContact()) {
				// A personal contact needs to be converted to a contact so the correct panel can be shown.
				recipient = recipient.convertToContactRecord();
				// FIXME: We put the abRecord into the ShadowStore to be able
				// to open it, and obtain all details. However, we also need to
				// find a point where we can remove it again.
				container.getShadowStore().add(recipient);
			} else if (recipient.isPersonalDistList()) {
				// A personal distlist needs to be converted to a distlist so the correct dialog can be shown.
				recipient = recipient.convertToDistListRecord();
				// FIXME: We put the abRecord into the ShadowStore to be able
				// to open it, and obtain all details. However, we also need to
				// find a point where we can remove it again.
				container.getShadowStore().add(recipient);
			} else if (!recipient.isOneOff()) {
				// A addressbook item needs to be converted to a AddressBook record so the correct dialog is shown.
				recipient = recipient.convertToABRecord();
				// FIXME: We put the abRecord into the ShadowStore to be able
				// to open it, and obtain all details. However, we also need to
				// find a point where we can remove it again.
				container.getShadowStore().add(recipient);

				// Passed user name in message action. which is use into error message
				// which is log into error log in case if recipient is AddressBook contact
				// and it is already deleted from server and still user trying to show details.
				recipient.addMessageAction("username", recipient.get('display_name'));
			}

			config = Ext.applyIf(config || {}, { manager : Ext.WindowMgr });
			Zarafa.core.data.UIFactory.openViewRecord(recipient, config);
		}
	},

	/**
	 * Opens a {@link Zarafa.common.delegates.dialogs.DelegatePermissionContentPanel DelegatePermissionContentPanel} for editing
	 * delegate permissions of a single delegate
	 * @param {Zarafa.common.delegates.data.DelegateRecord} delegateRecord record that should be opened in
	 * {@link Zarafa.common.delegates.dialogs.DelegatePermissionContentPanel DelegatePermissionContentPanel}.
	 * @param {Object} config configuration object that should be passed to {@link Zarafa.common.delegates.dialogs.DelegatePermissionContentPanel DelegatePermissionContentPanel}.
	 */
	openDelegatePermissionContent : function(record, config)
	{
		if(!record) {
			// can not continue without a record
			return;
		}

		config = config || {};
		Ext.apply(config, {
			modal : true
		});

		Zarafa.core.data.UIFactory.openCreateRecord(record, config);
	},

 	/**
	 * Opens a {@link @link Zarafa.common.sendas.dialogs.SendAsEditContentPanel SendAsEditContentPanel} for editing
	 * user name and email address of a sendAs.
	 * @param {Ext.data.Record} record record that should be opened in
	 * {@link Zarafa.common.sendas.dialogs.SendAsEditContentPanel SendAsEditContentPanel}.
	 * @param {Object} config configuration object that should be passed to {@link Zarafa.common.sendas.dialogs.SendAsEditContentPanel SendAsEditContentPanel}.
	 */
	openSendAsRecipientContent : function(record, config)
	{
		if(!record) {
			// can not continue without a record
			return;
		}
		var componentType = Zarafa.core.data.SharedComponentType['common.sendas.dialog.sendaseditcontentpanel'];

		config = config || {};
		Ext.apply(config, {
			modal : true
		});

		Zarafa.core.data.UIFactory.openLayerComponent(componentType, record, config);
	},

	/**
	 * Opens a {@link Zarafa.common.rules.dialogs.RulesEditContentPanel RulesEditContentPanel} for editing
	 * a single {@link Zarafa.common.rules.data.RulesRecord RulesRecord}.
	 * @param {Zarafa.common.rules.data.RulesRecord} record record to edit in
	 * {@link Zarafa.common.rules.dialogs.RulesEditContentPanel RulesEditContentPanel}.
	 * @param {Object} config config object that will be passed to {@link Zarafa.core.data.UIFactoryLayer UIFactoryLayer}.
	 */
	openRulesEditContent : function(record, config)
	{
		if(!record) {
			// can not continue without a record
			return;
		}

		config = Ext.apply(config || {}, {
			modal : true
		});

		Zarafa.core.data.UIFactory.openCreateRecord(record, config);
	},

	/**
	 * Will create an object of {@link Zarafa.common.attachment.ui.AttachmentDownloader AttachmentDownloader}
	 * and call {@link Zarafa.common.attachment.ui.AttachmentDownloader#downloadMessage} method to start download the message as file
	 * by setting the dialogFrame's location to the download URL of the given {@link Zarafa.core.data.IPMRecord records}.
	 * @param {Zarafa.core.data.IPMRecord} records The record, or records which user want to save as file.
	 * @param {Boolean} allAsZip (optional) True to downloading all the attachments as ZIP
	 */
	openSaveEmlDialog : function(records, allAsZip)
	{
		records = [].concat(records);

		var downloadComponent;
		if(!allAsZip){
			for (var i = 0; i < records.length; i++) {
				var record = records[i];
				// Create separate iframe for each url to handle requests individually
				downloadComponent = new Zarafa.common.attachment.ui.AttachmentDownloader();
				downloadComponent.downloadItem(record.getDownloadMessageUrl(false));
			}
		} else {
			downloadComponent = new Zarafa.common.attachment.ui.AttachmentDownloader();
			downloadComponent.downloadMessageAsZip(records);
		}
	},

	/**
	 * Opens a PrintDialog for printing the contents of the given {@link Zarafa.core.data.IPMRecord records}.
	 *
	 * @param {Zarafa.core.data.IPMRecord} records The record, or records for which the print will be displayed.
	 * @param {Object} config (optional) Configuration object
	 */
	openPrintDialog: function(records, config)
	{
		if (Ext.isEmpty(records)) {
			return;
		} else if (Array.isArray(records)) {
			if (records.length > 1) {
				Ext.MessageBox.alert(_('Print'), _('Printing of multiple items has not been implemented.'));
				return;
			} else {
				// We only need the first record
				records = records[0];
			}
		}

		var openHandler = function (store, record) {
			if (store) {
				if (this !== record) {
					return;
				}
				store.un('open', openHandler, record);
			}

			var componentType = Zarafa.core.data.SharedComponentType['common.printer.renderer'];
			var component = container.getSharedComponent(componentType, record);
			if (component) {
				var renderer = new component();
				renderer.print(record);
			} else  {
				if (record instanceof Zarafa.core.data.MAPIRecord) {
					Ext.MessageBox.alert(_('Print'), _('Printing of this item is not yet available') + '\n' + _('Item type: ') + record.get('message_class'));
				} else {
					Ext.MessageBox.alert(_('Print'), _('Printing of this view is not yet available'));
				}
			}
		};

		if (records instanceof Zarafa.core.data.MAPIRecord && !records.isOpened()) {
			records.getStore().on('open', openHandler, records);
			records.open();
		} else {
			openHandler(undefined, records);
		}
	},

	/**
	 * Opens a {@link Zarafa.common.checknames.dialogs.CheckNamesContentPanel CheckNamesContentPanel}
	 *
	 * @param {Array} array of checkNames
	 * @param {Zarafa.core.data.IPMRecipientRecord} recipientrecord
	 * @param {Object} config (optional) Configuration object for creating the content panel
	 */
	openCheckNamesContent : function(checkNamesData, recipientRecord, config)
	{
		var componentType = Zarafa.core.data.SharedComponentType['common.dialog.checknames'];
		config = Ext.applyIf(config || {}, {
			checkNamesData : checkNamesData,
			modal: true
		});
		Zarafa.core.data.UIFactory.openLayerComponent(componentType, recipientRecord, config);
	},

	/**
	 * Opens a {@link Zarafa.common.reminder.dialogs.ReminderContentPanel remindercontentpanel}
	 * @param {Zarafa.common.reminder.ReminderRecord} records Records for which the reminder content panel will be displayed.
	 * @param {Object} config (optional) Configuration object
	 */
	openReminderContent : function(records, config)
	{
		var componentType = Zarafa.core.data.SharedComponentType['common.dialog.reminder'];
		var component = container.getSharedComponent(componentType, records);

		config = Ext.applyIf(config || {}, {
			modal : false,
			manager : Ext.WindowMgr
		});

		// check if panel is already open
		var contentPanelInstances = Zarafa.core.data.ContentPanelMgr.getContentPanelInstances(component);

		// there can be no reminder dialog or only one reminder dialog
		// multiple reminder dialogs are not allowed
		if(contentPanelInstances.getCount() === 0) {
			// create a new reminder dialog, if there are any reminders to show
			if(records.length > 0) {
				Zarafa.core.data.UIFactory.openLayerComponent(componentType, records, config);
			}
		} else if (contentPanelInstances.getCount() === 1) {
			// we already have a reminder dialog open, use it
			var reminderDialog = contentPanelInstances.first();

			if(records.length > 0) {
				// there are reminders to show, so give focus to existing reminder dialog
				reminderDialog.focus();
			} else {
				// no reminders to show, close existing dialog
				reminderDialog.close();
			}
		}
	},

	/**
	 * Function will first convert the {@link Zarafa.common.reminder.ReminderRecord ReminderRecord} to an
	 * {@link Zarafa.core.data.IPMRecord IPMRecord} based on its message_class property and then pass that
	 * {@link Zarafa.core.data.IPMRecord IPMRecord} to {@link Zarafa.core.ui.ContentPanel ContentPanel} to open it.
	 * @param {Zarafa.common.reminder.data.ReminderRecord|Zarafa.common.reminder.data.ReminderRecord[]} record
	 * The reminder record/records which should be opened.
	 * @param {Object} config configuration object.
	 */
	openReminderRecord: function(record, config)
	{
		config = config || {};
		var store = record.getStore();
		var dismissReminders = record;
		// convert reminder record to proper ipmrecord
		record = record.convertToIPMRecord();
		if (record) {
			Zarafa.core.data.UIFactory.openViewRecord(record, config);
			store.dismissReminders(dismissReminders);
		}
	},

	/**
	 * Opens a {@link Zarafa.common.dialogs.MessageBox.select MessageBox} for
	 * selecting if either a recurrence or the entire series must be opened for the Recurring
	 * Message.
	 *
	 * @param {Function} handler The handler which is invoked with the selected value
	 * from the dialog. This function only takes one argument and is either 'recurrence_occurence'
	 * when the single-occurence was selected or 'recurrence_series' when the series was selected.
	 * @param {Object} scope (optional) The scope on which the handler must be invoked.
	 */
	// TODO: Merge with deleteRecurringSelectionContentPanel
	openRecurringSelectionContent : function(record, handler, scope)
	{
		var title = _('Recurring Message');
		var text =  _('This is a recurring message. Do you want to open only this occurrence or the series?');

		if (record.isMessageClass('IPM.Appointment', true)) {
			if (record.get('meeting') == Zarafa.core.mapi.MeetingStatus.NONMEETING) {
				title = _('Recurring Appointment');
				text =  _('This is a recurring appointment. Do you want to open only this occurrence or the series?');
			} else {
				title = _('Recurring Meeting Request');
				text =  _('This is a recurring meeting request. Do you want to open only this occurrence or the series?');
			}
		} else if (record.isMessageClass('IPM.TaskRequest', true)) {
			title = _('Recurring Task Request');
			text =  _('This is a recurring task request. Do you want to open only this occurrence or the series?');
		}

		Zarafa.common.dialogs.MessageBox.select(
			title, text, handler, scope, [{
				boxLabel: _('Open this occurrence'),
				id : 'recurrence_occurence',
				name: 'select',
				checked: true
			},{
				boxLabel: _('Open the series'),
				id : 'recurrence_series',
				name: 'select'
			}]
		);
	},

	/**
	 * Opens a {@link Zarafa.common.dialogs.MessageBox.select MessageBox} for
	 * selecting if either a recurrence or the entire series must be paste for the Recurring
	 * appointment/meeting.
	 *
	 * @param {Function} handler The handler which is invoked with the selected value
	 * from the dialog. This function only takes one argument and is either 'recurrence_occurence'
	 * when the single-occurence was selected or 'recurrence_series' when the series was selected.
	 * @param {Object} scope (optional) The scope on which the handler must be invoked.
	 */
	copyRecurringSelectionContent : function(record, handler, scope)
	{
		var title = _('Paste Recurring {0}');
		var text =  _('This is a recurring {0}. Do you want to paste only this occurrence or the series?');

		var msgText = _('message');
		if (record.isMessageClass('IPM.Appointment', true)) {
			msgText = record.isMeeting() ? _('meeting request') : _('appointment');
		}

		title = String.format(title,Ext.util.Format.capitalize(msgText));
		text =  String.format(text, msgText);

		Zarafa.common.dialogs.MessageBox.select(
			title, text, handler, scope, [{
				boxLabel: _('Paste this occurrence only'),
				id : 'recurrence_occurence',
				name: 'select',
				checked: true,
				showButtonText : 'ok',
				hideButtonText : 'next'
			},{
				boxLabel: _('Paste the series...'),
				id : 'recurrence_series',
				name: 'select',
				showButtonText : 'next',
				hideButtonText : 'ok'
			}],
			undefined,
			[{
				text : _('Ok'),
				name : 'ok'
			}, {
				text : _('Cancel'),
				name : 'cancel'
			}]
		);
	},

	/**
	 * Opens a {@link Zarafa.common.dialogs.MessageBox.select MessageBox} for
	 * selecting if either a recurrence or the entire series must be deleted.
	 *
	 * @param {Function} handler The handler which is invoked with the selected value
	 * from the dialog. This function only takes one argument and is either 'recurrence_occurence'
	 * when the single-occurence was selected or 'recurrence_series' when the series was selected.
	 * @param {Object} scope (optional) The scope on which the handler must be invoked.
	 */
	// TODO: Merge with openRecurringSelectionContentPanel
	deleteRecurringSelectionContent : function(record, handler, scope)
	{
		var title = _('Recurring Message');
		var text =  _('This is a recurring message. Do you want to delete only this occurrence or the series?');

		if (record.isMessageClass('IPM.Appointment', true)) {
			if (record.get('meeting') == Zarafa.core.mapi.MeetingStatus.NONMEETING) {
				title = _('Recurring Appointment');
				text =  _('This is a recurring appointment. Do you want to delete only this occurrence or the series?');
			} else {
				title = _('Recurring Meeting Request');
				text =  _('This is a recurring meeting request. Do you want to delete only this occurrence or the series?');
			}
		} else if (record.isMessageClass('IPM.TaskRequest', true)) {
			title = _('Recurring Task Request');
			text =  _('This is a recurring task request. Do you want to delete only this occurrence or the series?');
		}

		Zarafa.common.dialogs.MessageBox.select(
			title, text, handler, scope, [{
				boxLabel: _('Delete this occurrence'),
				id : 'recurrence_occurence',
				name: 'select',
				checked: true
			},{
				boxLabel: _('Delete the series'),
				id : 'recurrence_series',
				name: 'select'
			}]
		);
	},

	/**
	 * Opens a {@link Zarafa.common.dialogs.MessageBox.select MessageBox} for
	 * selecting if either a update need to be send to meeting Organizer or silently deleted items.
	 *
	 * @param {Function} handler The handler which is invoked with the selected value
	 * from the dialog. This function only takes one argument and is either 'sendResponseOnDelete'
	 * when the delete and response was selected or 'onResponseOnDelete' when the delete without response was selected.
	 * @param {Object} scope (optional) The scope on which the handler must be invoked.
	 */
	// TODO: may be Merge with deleteRecurringSelectionContentPanel
	deleteMeetingRequestConfirmationContent : function(record, handler, scope)
	{
		var title = _('Confirm Delete');
		var acceptedText = _('This "{0}" meeting was already accepted.');
		var noResponsedText = _('You have not responded to the meeting request "{0}".');

		var text;
		if(record.get('responsestatus') == Zarafa.core.mapi.ResponseStatus.RESPONSE_NOT_RESPONDED){
			text = String.format(noResponsedText, record.get('subject'));
		}else{
			text = String.format(acceptedText, record.get('subject'));
		}

		Zarafa.common.dialogs.MessageBox.select(
			title, text, handler, scope, [{
				boxLabel: _('Delete and send a response to the meeting organizer'),
				id : 'sendResponseOnDelete',
				name: 'select',
				checked: true
			},{
				boxLabel: _('Delete without sending'),
				id : 'noResponseOnDelete',
				name: 'select'
			}]
		);
	},

	/**
	 * Deletes all {@link Zarafa.core.data.IPMRecord records} from the {@link Zarafa.core.data.IPMStore store}.
	 * If the records are deleted from the To-do list the deleting is delegated to
	 * {@link Zarafa.task.Actions.deleteRecordsFromTodoList} otherwise it is delegated to {#doDeleteRecords}
	 *
	 * @param {Array} records The array of records which must be deleted.
	 * @param {Boolean} askOcc (private) False to prevent a dialog to appear to ask if the occurence or series must
	 * be deleted
	 * @param {Boolean} softDelete (optional) true to directly soft delete record(s) skipping deleted-items
	 * folder, false otherwise
	 *
	 * FIXME: This introduces Calendar-specific and To-do list (Task)-specific actions into the Common Context,
	 * but there is no clean solution for this at this time. But we need to split this up into context-specific
	 * actions while maintaining this single-entrypoint for deleting records.
	 */
	deleteRecords : function(records, askOcc, softDelete)
	{
		if (Ext.isEmpty(records)) {
			return;
		}
		if (!Array.isArray(records)) {
			records = [ records ];
		}

		// Check if the records are deleted from the todolist
		var recordsFolderEntryid = records[0].getStore().entryId;
		var folder = container.getHierarchyStore().getFolder(recordsFolderEntryid);
		if ( folder && folder.isTodoListFolder() ){
			Zarafa.task.Actions.deleteRecordsFromTodoList(records);
		} else {
			this.doDeleteRecords(records, askOcc, softDelete);
		}
	},

	/**
	 * Deletes all {@link Zarafa.core.data.IPMRecord records} from the {@link Zarafa.core.data.IPMStore store}.
	 * If any of the given {@link Zarafa.core.data.IPMRecord records} is an recurring item, then
	 * a {@link Zarafa.common.dialogs.MessageBox.select MessageBox} will be prompted which lets the user
	 * select between the series or the single occurence.
	 * All given {@link Zarafa.core.data.IPMRecord records} must be located in the same
	 * {@link Zarafa.core.data.IPMStore store}.
	 *
	 * @param {Array} records The array of records which must be deleted.
	 * @param {Boolean} askOcc (private) False to prevent a dialog to appear to ask if the occurence or series must
	 * be deleted
	 * @param {Boolean} softDelete (optional) true to directly soft delete record(s) skipping deleted-items
	 * folder, false otherwise
	 *
	 * FIXME: This introduces Calendar-specific actions into the Common Context, but there is no clean solution
	 * for this at this time. But we need to split this up into context-specific actions while maintaining this
	 * single-entrypoint for deleting records.
	 */
	doDeleteRecords : function(records, askOcc, softDelete)
	{
		var store;
		var saveRecords = [];

		for (var i = 0, len = records.length; i < len; i++) {
			var record = records[i];
			store = record.getStore();

			// Check if the item is recurring, and if we need to ask the user
			// if the occurence or series must be deleted
			var deleteRecurring = Ext.isFunction(record.isRecurringOccurence) && record.isRecurringOccurence() && askOcc !== false;

			// Meeting and task requests are always deleted as normal,
			// we don't care for the recurring state of the record.
			var messageClass = record.get('message_class');
			if (Zarafa.core.MessageClass.isClass(messageClass, 'IPM.Schedule.Meeting', true) ||
				Zarafa.core.MessageClass.isClass(messageClass, 'IPM.TaskRequest', true)) {
					deleteRecurring = false;
			}

			if (deleteRecurring) {
				// Deleting an recurring series requires a confirmation dialog.
				this.deleteRecurringItem(record);
			} else if (Ext.isFunction(record.isMeeting) && record.isMeeting() && !record.isAppointmentInPast() && !record.isMeetingCanceled()) {
				// delete action on future meeting items
				if (record.isMeetingSent()) {
					// We are the organizer of the meeting, so lets ask if the recipients should be notified.
					Ext.MessageBox.show({
						title: _('Kopano WebApp'),
						msg : _('A cancellation message will be sent to all recipients, do you wish to continue?'),
						icon: Ext.MessageBox.WARNING,
						fn: this.cancelInvitation,
						scope: record,
						buttons: Ext.MessageBox.YESNO
					});
				} else if (record.isMeetingResponseRequired() && !record.isCopied()) {
					// We are the attendee of the meeting, lets ask if we should inform the organizer
					this.deleteMeetingRequestConfirmationContent(record, this.declineInvitation, record);
				} else {
					// We are neither, we don't care, just delete the thing
					store.remove(record);
					saveRecords.push(record);
				}
			} else if (record.isMessageClass('IPM.TaskRequest') || (Ext.isFunction(record.isTaskReceived) && record.isTaskReceived())) {
				// If task is assigned task by assigner and it is not completed then
				// ask for the user conformation like "Delete", "Mark complete and delete"
				// or "Mark decline and delete" and if task is already completed then we dont
				// require any confirmation from user.
				if (!record.get('complete')) {
					this.deleteAssignedTaskConfirmationContent(record, this.declineTask, record);
				} else {
					store.remove(record);
					saveRecords.push(record);
				}
			} else {
				// normal delete action
				store.remove(record);
				saveRecords.push(record);
			}
		}

		if(!Ext.isEmpty(saveRecords)) {
			// Check if records are required to be soft deleted
			if (softDelete === true) {
				Ext.each(saveRecords, function(saveRecord) {
					saveRecord.addMessageAction('soft_delete', true);
				}, this);
			}
			store.save(saveRecords);
		}

		// If number of delete records equal to total loaded records then show load mask until server send success response.
		if(store.totalLoadedRecord) {
			if (records.length === store.totalLoadedRecord) {
				store.showLoadMask();
			}
		}
	},

	/**
	 * Function delete an assigned task and sends decline/complete task response message to assigner.
	 * function was triggered in scope of the {@link Zarafa.task.TaskRecord TaskRecord}.
	 *
	 * @param {String} buttonClicked The ID of the button pressed,
	 * here, one of: ok cancel.
	 * @param {Ext.form.Radio} radio The Radio which was selected by the user.
	 * @private
	 */
	declineTask : function (buttonClicked, radio)
	{
		if (buttonClicked === 'ok') {
			this.deleteIncompleteTask(radio.id);
		}
	},

	/**
	 * Opens a {@link Zarafa.common.dialogs.MessageBox.select MessageBox} for
	 * selecting if decline and delete, complete and delete task response
	 * need to be sent to task assigner or silently deleted items.
	 *
	 * @param {Function} handler The handler which is invoked with the selected value
	 * from the dialog. This function only takes one argument and is either 'declineAndDelete'
	 * when the delete task and send decline response to assignor , 'completeAndDelete'
	 * when the delete task and send complete task response to assigner or 'delete'
	 * when the delete task without sending any response to assigner.
	 *
	 * @param {Object} scope (optional) The scope on which the handler must be invoked.
	 */
	deleteAssignedTaskConfirmationContent : function (record, handler, scope)
	{
		var title = _('Delete Incomplete Task');
		var text = _('The task "{0}" has not been completed. What do you want to do?');

		text = String.format(text, record.get('subject'));

		Zarafa.common.dialogs.MessageBox.select(
			title, text, handler, scope, [{
				boxLabel: _('Decline and delete'),
				id : 'declineAndDelete',
				name: 'select',
				checked: true
			},{
				boxLabel: _('Mark complete and delete'),
				id : 'completeAndDelete',
				name: 'select'
			},{
				boxLabel: _('Delete'),
				id : 'delete',
				name: 'select'
			}]
		);
	},

	/**
	 * Function which prompt user with deleting for recurring Meeting or normal recurring
	 * appointment and also manages sending response to meeting organizer.
	 *
	 * @param {Ext.data.Record} record that must be deleted
	 * @private
	 */
	deleteRecurringItem : function(record){
		Zarafa.common.Actions.deleteRecurringSelectionContent(record, function(button, radio) {
			if (button != 'ok') {
				return;
			}

			if (radio.id != 'recurrence_series') {
				record = record.convertToOccurenceRecord();
			} else {
				record = record.convertToSeriesRecord();
			}
			container.getShadowStore().add(record);

			Zarafa.common.Actions.deleteRecords(record, false);
		}, this);
	},

	/**
	 * Function cancels Meeting invitation and sends Meeting Cancellation message.
	 *
	 * @param {String} buttonClicked The ID of the button pressed,
	 * @param {String} text Value of the input field, not useful here
	 * @private
	 */
	cancelInvitation : function(buttonClicked, text)
	{
		if (buttonClicked == 'yes') {
			// Here scope is record so this refers to Appointment Record.
			this.cancelInvitation();
		}
	},

	/**
	 * Function declines a Meeting invitation and sends Meeting Decline message.
	 *
	 * @param {String} buttonClicked The ID of the button pressed,
	 * here, one of: ok cancel.
	 * @param {Ext.form.Radio} radio The Radio which was selected by the user.
	 * @private
	 */
	declineInvitation : function(buttonClicked, radio)
	{
		if (buttonClicked == 'ok') {
			// Here scope is record so this refers to Appointment Record.
			var sendUpdateFlag = (radio.id == 'sendResponseOnDelete') ? true: false;
			this.declineMeeting(sendUpdateFlag);
		}
	},

	/**
	 * Opens a {@link Zarafa.common.restore.ui.RestoreContentPanel restoreContentPanel}
	 *
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder folder that is loaded for the new context
	 * @param {Object} config (optional) Configuration object for creating the content panel
	 */
	openRestoreContent : function(folder, config)
	{
		var componentType = Zarafa.core.data.SharedComponentType['common.dialog.restoreitems'];
		config = Ext.applyIf(config || {}, {
			folder : folder
		});
		Zarafa.core.data.UIFactory.openLayerComponent(componentType, undefined, config);
	},

	/**
	 * Opens attachment dialog.
	 *
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder folder that is loaded for the new context
	 * @param {Object} config (optional) Configuration object for creating the content panel
	 */
	openImportEmlContent : function(folder, config)
	{
		var attachComponent = new Zarafa.common.attachment.ui.UploadAttachmentComponent({
			callback : this.importEmlCallback.createDelegate(this, [ folder ], 1),
			multiple : true,
			accept : '.eml',
			scope : this
		});

		attachComponent.openAttachmentDialog();
	},

	/**
	 * Opens a {@link Zarafa.addressbook.dialogs.ABUserSelectionContentPanel ABUserSelectionContentPanel}
	 *
	 * @param {Object} config Configuration object. For AB this normally includes:
	 * 	callback - Callback function to be called with the user selected in the ContentPanel
	 * 	hideContactsFolders - Restriction that has to be applied on the hierarchy of the Addressbook
	 * 	listRestriction - Restriction that has to be applied on the contents of the Addressbook
	 */
	openABUserSelectionContent : function(config)
	{
		var componentType = Zarafa.core.data.SharedComponentType['addressbook.dialog.abuserselection'];
		config = Ext.applyIf(config || {}, {
			modal : true
		});

		Zarafa.core.data.UIFactory.openLayerComponent(componentType, undefined, config);
	},

	/**
	 * Opens a {@link Zarafa.addressbook.dialog.ABMultiUserSelectionContentPanel ABMultiUserSelectionContentPanel}
	 *
	 * @param {Object} config Configuration object for the dialog
	 */
	openABUserMultiSelectionContent : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			modal : true,
			convert : function(user) { return user; }
		});

		var componentType = Zarafa.core.data.SharedComponentType['addressbook.dialog.abmultiuserselection'];
		Zarafa.core.data.UIFactory.openLayerComponent(componentType, undefined, config);
	},

	/**
	 * Mark the given messages as read or unread. When a read receipt was requested
	 * for this message, the setttings are consulted to see if we must automatically
	 * send the receipt or not, or if we should ask the user.
	 *
	 * @param {Zarafa.core.data.IPMRecord/Array} records The record or records which must
	 * be marked as read.
	 * @param {Boolean} read (optional) False to mark the messages as unread, otherwise
	 * the message will be marked as read.
	 */
	markAsRead : function(records, read)
	{
		records = !Array.isArray(records) ? [ records ] : records;
		read = !Ext.isDefined(read) ? true : read;

		var saveRecords = [];

		for (var i = 0, len = records.length; i < len; i++) {
			var record = records[i];

			// If the read status already matches the desired state,
			// we don't need to do anything.
			if (read === record.isRead()) {
        continue;
      }

      if (read === true && record.needsReadReceipt()) {
					switch (container.getSettingsModel().get('zarafa/v1/contexts/mail/readreceipt_handling')) {
						case 'never':
							record.setReadFlags(read);
							// Never send a read receipt.
							record.addMessageAction('send_read_receipt', false);

							saveRecords.push(record);
							break;
						case 'always':
							record.setReadFlags(read);
							// Always send a read receipt.
							record.addMessageAction('send_read_receipt', true);

							saveRecords.push(record);
							break;
						case 'ask':
						/* falls through*/
						default:
							const store = record.getStore();
							// Ask if a read receipt must be send.
							Ext.MessageBox.confirm(_('Kopano WebApp'), _('The sender of this message has asked to be notified when you read this message. Do you wish to notify the sender?'),
								// This function will execute when user provide some inputs,
								// So other external changes should not affect the record.
								function(buttonClicked) {
									// If the mailgrid has reloaded, retrieve the newly updated record.
									var record = this;
									if (!record.getStore()) {
										record = store.getById(record.id);
									}
									record.setReadFlags(read);
									record.addMessageAction('send_read_receipt', buttonClicked !== 'no');
									record.save();
								}, record);
							break;
					}
				} else {
				record.setReadFlags(read);
				saveRecords.push(record);
				}
			}

		if (!Ext.isEmpty(saveRecords)) {
			saveRecords[0].store.save(saveRecords);
		}
	},

	/**
	 * Will start the download by setting the dialogFrame's location to the download URL of the file.
	 *
	 * @param {Zarafa.core.data.IPMAttachmentRecord} records The record of the file to be downloaded
	 * @param {Boolean} allAsZip (optional) True to downloading all the attachments as ZIP
	 */
	downloadAttachment : function(record, allAsZip)
	{
		if (this.downloadFrame) {
			// If download frame is not available in active browser window then
			// create new download frame under active browser window.
			if (!Ext.getBody().contains(this.downloadFrame.getEl().dom)) {
				this.downloadFrame = new Zarafa.common.attachment.ui.AttachmentDownloader();
			}
		} else {
			this.downloadFrame = new Zarafa.common.attachment.ui.AttachmentDownloader();
		}

		this.downloadFrame.checkForEmbeddedAttachments(record, allAsZip);
	},

	/**
	 * Opens a {@link Zarafa.common.rules.dialogs.RulesWordsEditContentPanel}
	 *
	 * @param {Object} config Configuration object for the dialog
	 */
	openRulesWordsEditContent : function(config)
	{
		var componentType = Zarafa.core.data.SharedComponentType['common.rules.dialog.ruleswordsedit'];
		Zarafa.core.data.UIFactory.openLayerComponent(componentType, undefined, config);
	},

	/**
	 * Function is used to download attachments, for embedded message attachments additionally it will
	 * convert the {@link Zarafa.core.data.IPMAttachmentRecord IPMAttachmentRecord} to {@link Zarafa.core.data.IPMRecord IPMRecord}
	 * and then will pass it to {@link Zarafa.core.ui.ContentPanel ContentPanel} to open it.
	 * @param {Zarafa.core.data.IPMAttachmentRecord} record The attachment record which should be opened.
	 * @param {Object} config configuration object.
	 */
	openAttachmentRecord: function(record, config)
	{
		if(record.isEmbeddedMessage()) {
			// if we are going to open embedded message then we need to first convert it into mail record
			record = record.convertToIPMRecord();
		}

		if(record) {
			Zarafa.core.data.UIFactory.openViewRecord(record, config);
		}
	},

	/**
	 * Raised a dialog to choose destination folder to import attachments.
	 * @param {Zarafa.core.data.IPMAttachmentRecord} record The attachment record which should be imported.
	 * @param {Object} config configuration object.
	 */
	importToFolder: function(record, config)
	{
		config = Ext.applyIf(config || {}, {
			modal : true
		});
		var componentType = Zarafa.core.data.SharedComponentType['common.attachment.dialog.importtofolder'];
		Zarafa.core.data.UIFactory.openLayerComponent(componentType, record, config);
	},

	/**
	 * Open a Panel in which the {@link Zarafa.core.data.IPMRecord record}
	 * can be viewed, or further edited.
	 *
	 * @param {Zarafa.core.data.IPMRecord} records The records to open
	 * @param {Object} config (optional) Configuration object used to create
	 * the Content Panel.
	 */
	openMessageContent : function(records, config)
	{
		Ext.each(records, function(record) {
			if (record.isUnsent() && !record.isFaultyMessage()) {
				Zarafa.core.data.UIFactory.openCreateRecord(record, config);
			} else {
				if(record.isMessageClass('IPM.TaskRequest', true)) {
					record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Task', {
						entryid : record.get('entryid'),
						store_entryid : record.get('store_entryid'),
						parent_entryid : record.get('parent_entryid'),
						task_goid : record.get('task_goid')
					}, record.get('entryid'));
					record.addMessageAction('open_task', true);
				}
				Zarafa.core.data.UIFactory.openViewRecord(record, config);
			}
		});
	},

	/**
	 * Copy email address of the given recipient.
	 *
	 * @param {Zarafa.core.dat.IPMRecipientRecord} record The record is resolved
	 * recipient.
	 */
	copyEmailAddress : function (record)
	{
		var email = record.get('smtp_address') || record.get('email_address');
		if(Ext.isEmpty(email)) {
			return;
		}
		Zarafa.core.Util.copyToClipboard(email);
	},

	/**
	 * It will create a new {@link Zarafa.core.data.MAPIRecord mail record}
	 * and generate new phantom recipient for new mail. Then
	 * it will open a new MailCreate ContentPanel for the new mail
	 *
	 * @param {Zarafa.core.dat.IPMRecipientRecord} record The record is recipient record
	 * @private
	 */
	onEmailRecipient : function(recipient)
	{
		var folder = container.getHierarchyStore().getDefaultFolder('drafts');
		var context = container.getContextByFolder(folder);
		var model = context.getModel();

		var record = model.createRecord(folder);

		var recipientStore = record.getRecipientStore();
		var recipientRecord = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RECIPIENT, recipient.data);

		// Make sure the recipient is of type MAPI_TO, the original recipient might have
		// been a CC or BCC. But now we want to directly email him.
		recipientRecord.set('recipient_type', Zarafa.core.mapi.RecipientType.MAPI_TO);

		recipientStore.add(recipientRecord);

		Zarafa.core.data.UIFactory.openCreateRecord(record);
	},

	/**
	 * Callback function for {@link Zarafa.common.attachment.ui.UploadAttachmentComponent}.
	 * which is going to call necessary helper function.
	 * 
	 * @param {Object/Array} files The files is contains file information.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder folder to which files needs to be imported.
	 * @param {Boolean} show Open the imported item
	 */
	importEmlCallback : function(files, folder, show)
	{
		this.brokenFiles = [];
		this.totalFiles = files.length;
		this.showImported = show === true;
		this.readFiles(files, folder);
	},

	/**
	 * Proxy callback for import action
	 * @param {Object} response The response received
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The selected folder
	 * @protected
	 */
	importDone : function(response, folder)
	{
		if (response.success === true) {
			if ( this.showImported !== true ) {
			   container.getNotifier().notify('info.import', _('Import'), String.format(_('Successfully imported item(s) to {0}'), folder.get('display_name')));
			}
		} else {
			container.getNotifier().notify('info.import', _('Import'), String.format(_('Failed to import item(s) to {0}'), folder.get('display_name')));
		}

		if ( this.showImported === true && Ext.isDefined(response.items)) {
			var record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Note', {
				'entryid' : response.items,
				'parent_entryid' : folder.get('entryid'),
				'store_entryid' : folder.get('store_entryid')
			});

			record.opened = false;
			Zarafa.core.data.UIFactory.openViewRecord(record);
		}
	},

	/**
	 * Helper function to read selected files.
	 * This will be executed recursively to read files synchronously.
	 * @param {Object/Array} files The files is contains file information.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder folder to which files needs to be imported.
	 * @param {Number} index Index of the file to process.
	 */
	readFiles : function(files, folder, index)
	{
		// Terminate the recursive calls and import the files
		if (index === this.totalFiles) {
			this.importFiles(files, folder);
			return;
		}

		// Start with first file if this is the first call
		if (index === undefined) {
			index = 0;
		}

		// Make sure we are processing only eml files for broken check
		if (!this.isEmlFile(files[index])) {
			this.brokenFiles.push(files[index]);
			index++;
			this.readFiles(files, folder, index);
		} else {
			var reader = new FileReader();
			reader.onload = this.checkBroken.createDelegate(this, [ files, index, folder ], true);
			reader.readAsText(files[index]);
		}
	},

	/**
	 * Handler for the load event of FileReader.
	 * Check if the file is broken or not. Prepares an array containing
	 * all the broken files, if found.
	 * 
	 * @param {Ext.EventObject} e The event object.
	 * @param {Object/Array} files The files is contains file information.
	 * @param {Number} index Index of the file to process.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder folder to which files needs to be imported.
	 */
	checkBroken : function(e, files, index, folder)
	{
		var fileContent = e.target.result;

		// Get header part to process further
		var splittedContent = fileContent.split("/\r?\n\r?\n/");
		var indexOfAttachment = splittedContent[0].indexOf('Content-Disposition: attachment;');
		if (indexOfAttachment !== -1) {
			splittedContent = splittedContent[0].substr(0, indexOfAttachment);
		} else {
			splittedContent = splittedContent[0];
		}

		var rawHeaders = splittedContent.match(/([^\n^:]+:)/g);

		// Compare if necessary headers are present or not
		if (Ext.isEmpty(rawHeaders) || rawHeaders.indexOf('From:') === -1 || rawHeaders.indexOf('Date:') === -1) {
			this.brokenFiles.push(files[index]);
		}

		index++;
		this.readFiles(files, folder, index);
	},

	/**
	 * Helper function to import selected files in given {@link Zarafa.hierarchy.data.MAPIFolderRecord}.
	 * Or raise proper error message box describing broken files.
	 * 
	 * @param {Object/Array} files The files is contains file information.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder folder to which files needs to be imported.
	 */
	importFiles : function(files, folder)
	{
		if (this.brokenFiles.length > 0) {
			if (this.brokenFiles.length > 1) {
				// Show list if there is more than one broken-file
				var componentType = Zarafa.core.data.SharedComponentType['hierarchy.dialog.brokenfiles'];
				Zarafa.core.data.UIFactory.openLayerComponent(componentType, this.brokenFiles, {'modal' : true});
			} else {
				Zarafa.common.dialogs.MessageBox.addCustomButtons({
					title: _('Import error'),
					msg : String.format(_('Unable to import {0}. The file is not valid'), this.brokenFiles[0].name),
					icon : Ext.MessageBox.ERROR,
					fn : Ext.emptyFn,
					customButton : [{
						text : _('Close'),
						name : 'cancel'
					}],
					scope : this
				});
			}

			// if all files are broken then avoid making import request to server
			if (this.brokenFiles.length === files.length) {
				return;
			}
		}

		var request = container.getRequest();
		var responseHandler = new Zarafa.core.data.AbstractResponseHandler({
			doImport : this.importDone.createDelegate(this, [folder], true)
		});

		var filesData = new FormData();

		if (Array.isArray(files) || files instanceof FileList) {
			for (var i = 0, len = files.length; i < len; i++) {
				// Prevent broken files to be sent to server
				if (this.brokenFiles.indexOf(files[i]) === -1) {
					filesData.append('attachments[]', files[i]);
				}
			}
		} else {
			filesData.append('attachments', files);
		}

		var url = container.getBaseURL();
		url = Ext.urlAppend(url, 'dialog_attachments=' + Zarafa.generateId(32));
		url = Ext.urlAppend(url, 'load=upload_attachment');
		url = Ext.urlAppend(url, 'destination_folder=' + folder.get('entryid'));
		url = Ext.urlAppend(url, 'store=' + folder.get('store_entryid'));
		url = Ext.urlAppend(url, 'import=true');

		request.reset();
		var requestId = request.addDataRequest('attachments', 'import', filesData, responseHandler);

		url = Ext.urlAppend(url, 'module=attachments');
		url = Ext.urlAppend(url, 'moduleid=' + requestId);
		request.send(url, {});
	},

	/**
	 * Helper function to check if given file is of eml type or not.
	 * This is required as there is no file type available at all in case of IE11 and edge.
	 * @param {Object} file The file to be checked.
	 * @return {Boolean} True if the file is of type eml. false otherwise.
	 */
	isEmlFile : function (file)
	{
		if (!Ext.isEmpty(file.type)) {
			return file.type === 'message/rfc822';
		} else {
			var i = file.name.lastIndexOf('.');
			return file.name.substr(i + 1) === 'eml';
		}
	}
};
