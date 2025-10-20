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
	downloadFrame: undefined,

	/**
	 * The array holding broken eml files, if found.
	 * @property
	 * @type Array
	 */
	brokenFiles: undefined,

	/**
	 * Total number of files selected by user to upload.
	 * @property
	 * @type Number
	 */
	totalFiles: undefined,

	/**
	 * Defines if the imported item should be shown after import.
	 * @property
	 * @type Boolean
	 */
	showImported: false,

	/**
	 * Defines if the imported item is a single or multiple ICS or VCF file.
	 * @property
	 * @type Boolean
	 */
	isSingleImport: false,

	/**
	 * Open a {@link Zarafa.common.dialogs.CopyMoveContentPanel CopyMoveContentPanel} for
	 * copying or moving {@link Zarafa.core.data.IPMRecord records} to the
	 * preferred destination folder.
	 *
	 * @param {Zarafa.core.data.IPMRecord} records The record which must be copied or moved.
	 * @param {Object} config (optional) Configuration object to create the ContentPanel
	 */
	openCopyMoveContent: function(records, config)
	{
		config = Ext.applyIf(config || {}, {
			modal: true
		});
		var componentType = Zarafa.core.data.SharedComponentType['common.dialog.copymoverecords'];
		Zarafa.core.data.UIFactory.openLayerComponent(componentType, records, config);
	},

	/**
	 * Ensure that the given records remain operable by reattaching them to the provided store when needed.
	 *
	 * @param {Zarafa.core.data.MAPIRecord/Zarafa.core.data.MAPIRecord[]} records The record or records to normalize.
	 * @param {Zarafa.core.data.MAPIStore} store The store that should own the records.
	 * @return {Zarafa.core.data.MAPIRecord[]} Array containing the resolved records, excluding falsy entries.
	 */
	resolveRecords: function(records, store)
	{
		if (!Ext.isArray(records)) {
			records = Ext.isDefined(records) ? [ records ] : [];
		}

		var resolved = [];

		for (var i = 0, len = records.length; i < len; i++) {
			var record = records[i];

			if (!record) {
				continue;
			}

			if (store) {
				var storeEntryId = store.storeEntryId;

				if (!storeEntryId && Ext.isDefined(store.folder) && store.folder) {
					storeEntryId = store.folder.get('store_entryid');
				}

				if (!storeEntryId && Ext.isFunction(store.getFolder)) {
					var storeFolder = store.getFolder();
					if (storeFolder) {
						storeEntryId = storeFolder.get('store_entryid');
					}
				}

				var recordStore = Ext.isFunction(record.getStore) ? record.getStore() : record.store;

				if (!recordStore) {
					var storeRecord = Ext.isFunction(store.getById) ? store.getById(record.id) : undefined;

					if (storeRecord) {
						record = storeRecord;
						records[i] = storeRecord;
						recordStore = Ext.isFunction(storeRecord.getStore) ? storeRecord.getStore() : store;
					} else if (Ext.isFunction(record.join)) {
						record.join(store);
						recordStore = Ext.isFunction(record.getStore) ? record.getStore() : store;
					} else {
						record.store = store;
						recordStore = store;
					}
				}

				if (!recordStore) {
					record.store = store;
				}

				if (storeEntryId && (!Ext.isFunction(record.get) || Ext.isEmpty(record.get('store_entryid')))) {
					if (record.data) {
						record.data.store_entryid = storeEntryId;
					} else if (Ext.isFunction(record.set)) {
						record.set('store_entryid', storeEntryId);
					}
				}
			}

			resolved.push(record);
		}

		return resolved;
	},

	/**
	 * Opens a {@link Zarafa.common.recurrence.dialogs.RecurrenceContentPanel RecurrenceContentPanel} for configuring
	 * the recurrence of the given {@link Zarafa.core.data.IPMRecord record}.
	 *
	 * @param {Zarafa.core.data.IPMRecord} records The record for which the recurrence must be configured.
	 * @param {Object} config Configuration object
	 */
	openRecurrenceContent: function(records, config)
	{
		if (Array.isArray(records) && !Ext.isEmpty(records)) {
			records = records[0];
		}

		config = Ext.applyIf(config || {}, {
			autoSave: true,
			modal: true
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
	openCategoriesMenu: function(records, position)
	{
		Zarafa.core.data.UIFactory.openContextMenu(Zarafa.core.data.SharedComponentType['common.contextmenu.categories'], records, {
			position: position
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
	openFlagsMenu: function(records, position, shadowEdit)
	{
		if (!Ext.isArray(records)) {
			records = [ records ];
		}

		var component = Zarafa.core.data.SharedComponentType['common.contextmenu.flags'];
		Zarafa.core.data.UIFactory.openContextMenu(component, records, {
			position: position,
			shadowEdit: shadowEdit,
			store: records[0].getStore()
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
	openCustomFlagContent: function(records, config)
	{
		config = Ext.applyIf(config || {}, {
			modal: true,
			resizable: false
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
	openCategoriesContent: function(records, config)
	{
		if (!Array.isArray(records)) {
			records = [ records ];
		}

		config = Ext.applyIf(config || {}, {
			autoSave: true,
			modal: true
		});

		// Callback function added in config object if
		// selected records is belongs to search store.
		var store = records[0].getStore();
		if(Ext.isFunction(store.isAdvanceSearchStore) && store.isAdvanceSearchStore()) {
			config.callback = function() {
				Ext.each(records, function(record) {
					var foundRecord = this.record.find(function(rec) {
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
	openNewCategoryContent: function(config)
	{
		config = Ext.applyIf(config || {}, {
			modal: true
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
	openRenameCategoryContent: function(config)
	{
		config = Ext.applyIf(config || {}, {
			modal: true
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
	openAttachItemSelectionContent: function(record, config)
	{
		config = Ext.applyIf(config || {}, {
			modal: true
		});

		var componentType = Zarafa.core.data.SharedComponentType['common.attachment.dialog.attachitem'];
		Zarafa.core.data.UIFactory.openLayerComponent(componentType, record, config);
	},

	/**
	 * Opens a {@link Zarafa.core.ui.widget.WidgetContentPanel}
	 * for inserting widgets into the {@link Zarafa.core.ui.widget.WidgetPanel}
	 * @param {Object} config (optional) Configuration object for creating the ContentPanel
	 */
	openWidgetsContent: function(config)
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
	openViewRecipientContent: function(recipient, config)
	{
		if (recipient.isResolved()) {
			if (recipient.isPersonalContact() || recipient.isSharedRecord()) {
				// A personal contact needs to be converted to a contact so the correct panel can be shown.
				recipient = recipient.convertToContactRecord();
				// FIXME: We put the abRecord into the ShadowStore to be able
				// to open it, and obtain all details. However, we also need to
				// find a point where we can remove it again.
				container.getShadowStore().add(recipient);
			} else if (recipient.isPersonalDistList() || recipient.isSharedRecord(Zarafa.core.mapi.ObjectType.MAPI_DISTLIST)) {
				// A personal distlist needs to be converted to a distlist so the correct dialog can be shown.
				recipient = recipient.convertToDistListRecord();
				// FIXME: We put the abRecord into the ShadowStore to be able
				// to open it, and obtain all details. However, we also need to
				// find a point where we can remove it again.
				container.getShadowStore().add(recipient);
			} else if (!recipient.isOneOff() && recipient.get('address_type') !== 'ZARAFA') {
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

			config = Ext.applyIf(config || {}, { manager: Ext.WindowMgr });
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
	openDelegatePermissionContent: function(record, config)
	{
		if(!record) {
			// can not continue without a record
			return;
		}

		config = config || {};
		Ext.apply(config, {
			modal: true
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
	openSendAsRecipientContent: function(record, config)
	{
		var componentType = Zarafa.core.data.SharedComponentType['common.managecc.dialog.managecceditcontentpanel'];
		this.openEditRecipientContent(componentType, record, config);
	},

	/**
	 * Opens a {@link @link Zarafa.common.sendas.dialogs.SendAsEditContentPanel SendAsEditContentPanel} Or
	 * {@link Zarafa.common.manageCc.dialogs.ManageCcEditContentPanel ManageCcEditContentPanel} Or
	 * {@link Zarafa.common.recipientfield.ui.EditRecipientContentPanel EditRecipientContentPanel} for editing
	 * user name and email address for a sendAs, manageCc and external recipients respectively.
	 *
	 * @param {Number} componentType A component type taken from the enumeration {@link Zarafa.core.data.SharedComponentType}
	 * @param {Zarafa.core.data.MAPIRecord} record The record(s) loaded in the component
	 * @param {Object} config Configuration object
	 */
	openEditRecipientContent: function(componentType, record, config)
	{
		if(!record) {
			// can not continue without a record
			return;
		}

		config = config || {};
		Ext.apply(config, {
			modal: true
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
	openRulesEditContent: function(record, config)
	{
		if(!record) {
			// can not continue without a record
			return;
		}

		config = Ext.apply(config || {}, {
			modal: true
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
	openSaveEmlDialog: function(records, allAsZip)
	{
		records = [].concat(records);

		var downloadComponent;
		if(!allAsZip) {
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
	 * Opens a PrintDialog for printing the contents of the given object(s).
	 * @param {Zarafa.core.data.MAPIRecord|Zarafa.core.Context} objectToPrint The record(s)
	 * that will be printed, or the context for which the items in the store will be printed.
	 */
	openPrintDialog: function(objectToPrint)
	{
		if (Ext.isEmpty(objectToPrint)) {
			return;
		} else if (Array.isArray(objectToPrint)) {
			if (objectToPrint.length > 1) {
				Ext.MessageBox.alert(_('Print'), _('Printing of multiple items has not been implemented.'));
				return;
			}

			// We only need the first record
			objectToPrint = objectToPrint[0];
		}

		var openHandler = function (store, objectToPrint) {
			if (store) {
				if (this !== objectToPrint) {
					return;
				}
				store.un('open', openHandler, objectToPrint);
			}

			var componentType = Zarafa.core.data.SharedComponentType['common.printer.renderer'];
			var component = container.getSharedComponent(componentType, objectToPrint);
			if (component) {
				var renderer = new component();
				renderer.print(objectToPrint);
			} else if (objectToPrint instanceof Zarafa.core.data.MAPIRecord) {
				Ext.MessageBox.alert(
					_('Print'),
					_('Printing of this item is not yet available') + '\n' + _('Item type: ') + objectToPrint.get('message_class')
				);
			} else {
				Ext.MessageBox.alert(
					_('Print'),
					_('Printing of this view is not yet available')
				);
			}
		};

		if (objectToPrint instanceof Zarafa.core.data.MAPIRecord && !objectToPrint.isOpened()) {
			objectToPrint.getStore().on('open', openHandler, objectToPrint);
			objectToPrint.open();
		} else {
			openHandler(undefined, objectToPrint);
		}
	},

	/**
	 * Opens a {@link Zarafa.common.checknames.dialogs.CheckNamesContentPanel CheckNamesContentPanel}
	 *
	 * @param {Array} array of checkNames
	 * @param {Zarafa.core.data.IPMRecipientRecord} recipientrecord
	 * @param {Object} config (optional) Configuration object for creating the content panel
	 */
	openCheckNamesContent: function(checkNamesData, recipientRecord, config)
	{
		var componentType = Zarafa.core.data.SharedComponentType['common.dialog.checknames'];
		config = Ext.applyIf(config || {}, {
			checkNamesData: checkNamesData,
			modal: true
		});
		Zarafa.core.data.UIFactory.openLayerComponent(componentType, recipientRecord, config);
	},

	/**
	 * Opens a {@link Zarafa.common.reminder.dialogs.ReminderContentPanel remindercontentpanel}
	 * @param {Zarafa.common.reminder.ReminderRecord} records Records for which the reminder content panel will be displayed.
	 * @param {Object} config (optional) Configuration object
	 */
	openReminderContent: function(records, config)
	{
		var componentType = Zarafa.core.data.SharedComponentType['common.dialog.reminder'];
		var component = container.getSharedComponent(componentType, records);

		if ( window.showReminderPanelInPopout ) {
			config = Ext.applyIf(config || {}, {
				layerType: 'separateWindows',
				width: 450,
				height: 500
			});
		} else {
			config = Ext.applyIf(config || {}, {
				modal: false,
				manager: Ext.WindowMgr
			});
		}

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
				Zarafa.core.BrowserWindowMgr.getOwnerWindow(reminderDialog).focus();
				reminderDialog.focus();
			} else {
				// no reminders to show, close existing dialog
				reminderDialog.close();
			}
		}
	},

	/**
	 * Function will dismiss the record and open it.
	 * @param {Zarafa.common.reminder.data.ReminderRecord|Zarafa.common.reminder.data.ReminderRecord[]} record
	 * The reminder record/records which should be opened.
	 * @param {Object} config configuration object.
	 */
	openReminderRecord: function(record, config)
	{
		config = config || {};
		var store = record.getStore();
		if (record) {
			store.dismissReminders(record, true);
		}

		// Set the focus to the main window because the reminder panel
		// could be shown in a separate window in DeskApp
		if (Zarafa.isDeskApp && window.global && window.global.DA && window.global.DA.winWebApp) {
			window.global.DA.winWebApp.focus();
		}
	},

	/**
	 * Opens a {@link Zarafa.common.dialogs.MessageBox.select MessageBox} for
	 * selecting if either a recurrence or the entire series must be opened for the Recurring
	 * Message.
	 *
	 * @param {Function} handler The handler which is invoked with the selected value
	 * from the dialog. This function only takes one argument and is either 'recurrence_occurrence'
	 * when the single-occurrence was selected or 'recurrence_series' when the series was selected.
	 * @param {Object} scope (optional) The scope on which the handler must be invoked.
	 */
	// TODO: Merge with deleteRecurringSelectionContentPanel
	openRecurringSelectionContent: function(record, handler, scope)
	{
		var title = _('Recurring Message');
		var text = _('This is a recurring message. Do you want to open only this occurrence or the series?');

		if (record.isMessageClass('IPM.Appointment', true)) {
			if (record.get('meeting') == Zarafa.core.mapi.MeetingStatus.NONMEETING) {
				title = _('Recurring Appointment');
				text = _('This is a recurring appointment. Do you want to open only this occurrence or the series?');
			} else {
				title = _('Recurring Meeting Request');
				text = _('This is a recurring meeting request. Do you want to open only this occurrence or the series?');
			}
		} else if (record.isMessageClass('IPM.TaskRequest', true)) {
			title = _('Recurring Task Request');
			text = _('This is a recurring task request. Do you want to open only this occurrence or the series?');
		}

		Zarafa.common.dialogs.MessageBox.select(
			title, text, handler, scope, [{
				boxLabel: _('Open this occurrence'),
				id: 'recurrence_occurrence',
				name: 'select',
				checked: true
			},{
				boxLabel: _('Open the series'),
				id: 'recurrence_series',
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
	 * from the dialog. This function only takes one argument and is either 'recurrence_occurrence'
	 * when the single-occurrence was selected or 'recurrence_series' when the series was selected.
	 * @param {Object} scope (optional) The scope on which the handler must be invoked.
	 */
	copyRecurringSelectionContent: function(record, handler, scope)
	{
		var title = _('Paste Recurring {0}');
		var text = _('This is a recurring {0}. Do you want to paste only this occurrence or the series?');

		var msgText = _('message');
		if (record.isMessageClass('IPM.Appointment', true)) {
			msgText = record.isMeeting() ? _('meeting request') : _('appointment');
		}

		title = String.format(title,Ext.util.Format.capitalize(msgText));
		text = String.format(text, msgText);

		Zarafa.common.dialogs.MessageBox.select(
			title, text, handler, scope, [{
				boxLabel: _('Paste this occurrence only'),
				id: 'recurrence_occurrence',
				name: 'select',
				checked: true,
				showButtonText: 'ok',
				hideButtonText: 'next'
			},{
				boxLabel: _('Paste the series…'),
				id: 'recurrence_series',
				name: 'select',
				showButtonText: 'next',
				hideButtonText: 'ok'
			}],
			undefined,
			[{
				text: _('Ok'),
				name: 'ok'
			}, {
				text: _('Cancel'),
				name: 'cancel'
			}]
		);
	},

	/**
	 * Opens a {@link Zarafa.common.dialogs.MessageBox.select MessageBox} for
	 * selecting if either a recurrence or the entire series must be deleted.
	 *
	 * @param {Function} handler The handler which is invoked with the selected value
	 * from the dialog. This function only takes one argument and is either 'recurrence_occurrence'
	 * when the single-occurrence was selected or 'recurrence_series' when the series was selected.
	 * @param {Object} scope (optional) The scope on which the handler must be invoked.
	 */
	// TODO: Merge with openRecurringSelectionContentPanel
	deleteRecurringSelectionContent: function(record, handler, scope)
	{
		var title = _('Recurring Message');
		var text = _('This is a recurring message. Do you want to delete only this occurrence or the series?');

		if (record.isMessageClass('IPM.Appointment', true)) {
			if (record.get('meeting') == Zarafa.core.mapi.MeetingStatus.NONMEETING) {
				title = _('Recurring Appointment');
				text = _('This is a recurring appointment. Do you want to delete only this occurrence or the series?');
			} else {
				title = _('Recurring Meeting Request');
				text = _('This is a recurring meeting request. Do you want to delete only this occurrence or the series?');
			}
		} else if (record.isMessageClass('IPM.TaskRequest', true)) {
			title = _('Recurring Task Request');
			text = _('This is a recurring task request. Do you want to delete only this occurrence or the series?');
		}

		Zarafa.common.dialogs.MessageBox.select(
			title, text, handler, scope, [{
				boxLabel: _('Delete this occurrence'),
				id: 'recurrence_occurrence',
				name: 'select',
				checked: true
			},{
				boxLabel: _('Delete the series'),
				id: 'recurrence_series',
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
	deleteMeetingRequestConfirmationContent: function(record, handler, scope)
	{
		var title = _('Confirm Delete');
		var acceptedText = _('This "{0}" meeting was already accepted.');
		var noResponsedText = _('You have not responded to the meeting request "{0}".');

		var text;
		if(record.get('responsestatus') == Zarafa.core.mapi.ResponseStatus.RESPONSE_NOT_RESPONDED) {
			text = String.format(noResponsedText, record.get('subject'));
		} else {
			text = String.format(acceptedText, record.get('subject'));
		}

		Zarafa.common.dialogs.MessageBox.select(
			title, text, handler, scope, [{
				boxLabel: _('Delete and send a response to the meeting organizer'),
				id: 'sendResponseOnDelete',
				name: 'select',
				checked: true
			},{
				boxLabel: _('Delete without sending'),
				id: 'noResponseOnDelete',
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
	 * @param {Boolean} askOcc (private) False to prevent a dialog to appear to ask if the occurrence or series must
	 * be deleted
	 * @param {Boolean} softDelete (optional) true to directly soft delete record(s) skipping deleted-items
	 * folder, false otherwise
	 *
	 * FIXME: This introduces Calendar-specific and To-do list (Task)-specific actions into the Common Context,
	 * but there is no clean solution for this at this time. But we need to split this up into context-specific
	 * actions while maintaining this single-entrypoint for deleting records.
	 */
	deleteRecords: function(records, askOcc, softDelete)
	{
		if (Ext.isEmpty(records)) {
			return;
		}
		if (!Array.isArray(records)) {
			records = [ records ];
		}

		// entryId is undefined if store is shadow store object.
		var folderEntryid = records[0].getStore().entryId;
		var folder = container.getHierarchyStore().getFolder(folderEntryid);

		// Check if the records are deleted from the todolist
		if (folder && folder.isTodoListFolder()) {
			Zarafa.task.Actions.deleteRecordsFromTodoList(records);
			return;
		}
		if (Zarafa.core.EntryId.compareEntryIds(records[0].get('parent_entryid'), folderEntryid) === false) {
			folderEntryid = records[0].get('parent_entryid');
			folder = container.getHierarchyStore().getFolder(folderEntryid);
		}

		if (folder && folder.hasDeleteOwnRights() === false) {
			Ext.MessageBox.show({
				title : _('Insufficient permissions'),
				msg : _("You have insufficient privileges to delete items in this folder."),
				cls: Ext.MessageBox.ERROR_CLS,
				buttons: Ext.MessageBox.OK
			});
			return;
		}

		this.doDeleteRecords(records, askOcc, softDelete);
	},

	/**
	 * Deletes all {@link Zarafa.core.data.IPMRecord records} from the {@link Zarafa.core.data.IPMStore store}.
	 * If any of the given {@link Zarafa.core.data.IPMRecord records} is an recurring item, then
	 * a {@link Zarafa.common.dialogs.MessageBox.select MessageBox} will be prompted which lets the user
	 * select between the series or the single occurrence.
	 * All given {@link Zarafa.core.data.IPMRecord records} must be located in the same
	 * {@link Zarafa.core.data.IPMStore store}.
	 *
	 * @param {Array} records The array of records which must be deleted.
	 * @param {Boolean} askOcc (private) False to prevent a dialog to appear to ask if the occurrence or series must
	 * be deleted
	 * @param {Boolean} softDelete (optional) true to directly soft delete record(s) skipping deleted-items
	 * folder, false otherwise
	 *
	 * FIXME: This introduces Calendar-specific actions into the Common Context, but there is no clean solution
	 * for this at this time. But we need to split this up into context-specific actions while maintaining this
	 * single-entrypoint for deleting records.
	 */
	doDeleteRecords: function(records, askOcc, softDelete)
	{
		var store;
		var saveRecords = [];

		for (var i = 0, len = records.length; i < len; i++) {
			var record = records[i];
			store = record.getStore();

			// Check if the item is recurring, and if we need to ask the user
			// if the occurrence or series must be deleted
			var deleteRecurring = Ext.isFunction(record.isRecurringOccurrence) && record.isRecurringOccurrence() && askOcc !== false;

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
						title: _('Notify recipients'),
						msg: _('A cancellation message will be sent to all recipients, do you wish to continue?'),
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
			} else if (!record.isRead() && record.needsNonReadReceipt() &&
			    (softDelete || record.isInDeletedItems())) {
				switch (container.getSettingsModel().get("zarafa/v1/contexts/mail/readreceipt_handling")) {
				case 'never':
					store.remove(record, undefined, false);
					saveRecords.push(record);
					break;
				case 'always':
					store.remove(record, undefined, true);
					saveRecords.push(record);
					break;
				case 'ask':
				default:
					Ext.MessageBox.show({
						title: _("Notify sender"),
						msg: String.format(_("{0} has requested a notification be sent when message \"{1}\" is deleted without having been read. Do you want to send a receipt?"),
						     record.get("sender_name") || record.get("sender_email_address"),
						     record.get("subject")),
						buttons: Ext.MessageBox.YESNOCANCEL,
						fn: this.deleteWithNonReadReceipt,
						scope: record,
						softDelete: softDelete
					});
					saveRecords.push(record);
					break;
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
		if (store.totalLoadedRecord && records.length === store.totalLoadedRecord)
			store.showLoadMask();
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
	declineTask: function (buttonClicked, radio)
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
	deleteAssignedTaskConfirmationContent: function (record, handler, scope)
	{
		var title = _('Delete Incomplete Task');
		var text = _('The task "{0}" has not been completed. What do you want to do?');

		text = String.format(text, record.get('subject'));

		Zarafa.common.dialogs.MessageBox.select(
			title, text, handler, scope, [{
				boxLabel: _('Decline and delete'),
				id: 'declineAndDelete',
				name: 'select',
				checked: true
			},{
				boxLabel: _('Mark complete and delete'),
				id: 'completeAndDelete',
				name: 'select'
			},{
				boxLabel: _('Delete'),
				id: 'delete',
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
	deleteRecurringItem: function(record) {
		Zarafa.common.Actions.deleteRecurringSelectionContent(record, function(button, radio) {
			if (button != 'ok') {
				return;
			}

			if (radio.id != 'recurrence_series') {
				record = record.convertToOccurrenceRecord();
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
	cancelInvitation: function(buttonClicked, text)
	{
		if (buttonClicked == 'yes') {
			// Here scope is record so this refers to Appointment Record.
			this.cancelInvitation();
		}
	},

	/**
	 * Function displays a dialog for non read notify confirmation.
	 * @param {String} buttonClicked The ID of the button pressed,'yes', 'no' or 'cancel'
	 * @param {String} text Value of the input field, not used here
	 * @param {Object} opt The config object passed to the messagebox
	 */
	deleteWithNonReadReceipt: function(buttonClicked, text, opt) {
		if (buttonClicked == "cancel")
			return;
		// @this is a record
		if (opt?.softDelete) {
			this.addMessageAction("soft_delete", "1");
		}
		var non_read_notify = buttonClicked == "yes" ? "1" : "0";
		this.addMessageAction("non_read_notify", non_read_notify);
		var store = this.getStore();
		store.remove(this);
		store.save(this);
	},

	/**
	 * Function declines a Meeting invitation and sends Meeting Decline message.
	 *
	 * @param {String} buttonClicked The ID of the button pressed,
	 * here, one of: ok cancel.
	 * @param {Ext.form.Radio} radio The Radio which was selected by the user.
	 * @private
	 */
	declineInvitation: function(buttonClicked, radio)
	{
		if (buttonClicked == 'ok') {
			// Here scope is record so this refers to Appointment Record.
			var sendUpdateFlag = (radio.id == 'sendResponseOnDelete') ? true : false;
			this.declineMeeting(sendUpdateFlag);
		}
	},

	/**
	 * Opens a {@link Zarafa.common.restore.ui.RestoreContentPanel restoreContentPanel}
	 *
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder folder that is loaded for the new context
	 * @param {Object} config (optional) Configuration object for creating the content panel
	 */
	openRestoreContent: function(folder, config)
	{
		var componentType = Zarafa.core.data.SharedComponentType['common.dialog.restoreitems'];
		config = Ext.applyIf(config || {}, {
			folder: folder
		});
		Zarafa.core.data.UIFactory.openLayerComponent(componentType, undefined, config);
	},

	/**
	 * Opens attachment dialog.
	 *
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder folder that is loaded for the new context
	 * @param {Object} config (optional) Configuration object for creating the content panel
	 */
	openImportContent: function(folder, config)
	{
		config = Ext.applyIf(config || {}, {
			callback: this.importItemCallback.createDelegate(this, [ folder ], 1),
			multiple: true,
			accept: '.eml',
			scope: this
		});

		var attachComponent = new Zarafa.common.attachment.ui.UploadAttachmentComponent(config);
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
	openABUserSelectionContent: function(config)
	{
		var componentType = Zarafa.core.data.SharedComponentType['addressbook.dialog.abuserselection'];
		config = Ext.applyIf(config || {}, {
			modal: true
		});

		Zarafa.core.data.UIFactory.openLayerComponent(componentType, undefined, config);
	},

	/**
	 * Callback function for {@link Zarafa.addressbook.dialogs.ABUserSelectionContent AddressBook}
	 * This callback is used in {@link Zarafa.common.sendas.ui.SendAsPanel SendAsPanel}
	 * and {@link Zarafa.common.manageCc.ui.ManageCcPanel ManageCcPanel} to display a message
	 * that recipeint already exists if selected recipeint from adressbook is already present in the store.
	 * @param {Ext.data.Record} record user selected from AddressBook
	 * @private
	 */
	abCallBack: function(records)
	{
		var store = this.getStore();
		// find rowid value
		var data = Ext.pluck(store.getRange(), 'data');
		var rowId = Ext.max(Ext.pluck(data, 'rowid')) || 0;

		var duplicate = [];
		for (var i = 0; i < records.length; i++) {
			var record = records[i];
			if (store.isRecipientExists(record)) {
				duplicate.push(record.get('display_name'));
				continue;
			}

			var recipientType;
			if (store.customObjectType === Zarafa.core.data.RecordCustomObjectType.ZARAFA_CC_RECIPIENT) {
				recipientType = Zarafa.core.mapi.RecipientType.MAPI_CC;
			}
			var recipientRecord = record.convertToRecipient(recipientType, store.customObjectType);
			recipientRecord.set('rowid', ++rowId);

			store.add(recipientRecord);
		}

		// Show warning message box.
		if (!Ext.isEmpty(duplicate)) {
			if (duplicate.length > 1) {
				var msg = _('Following recipients are already exists');
				msg += '<br>' + duplicate.map(function (item) {
					return '<br>' + item;
				});

				return Ext.Msg.alert(_('Duplicate recipients'), msg);
			}
			Ext.Msg.alert(_('Duplicate recipient'), _('Recipient already exists.'));
		}
	},

	/**
	 * Opens a {@link Zarafa.addressbook.dialog.ABMultiUserSelectionContentPanel ABMultiUserSelectionContentPanel}
	 *
	 * @param {Object} config Configuration object for the dialog
	 */
	openABUserMultiSelectionContent: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			modal: true,
			convert: function(user) { return user; }
		});

		var componentType = Zarafa.core.data.SharedComponentType['addressbook.dialog.abmultiuserselection'];
		Zarafa.core.data.UIFactory.openLayerComponent(componentType, undefined, config);
	},

	/**
	 * Mark the given messages as read or unread. When a read receipt was requested
	 * for this message, the settings are consulted to see if we must automatically
	 * send the receipt or not, or if we should ask the user.
	 *
	 * @param {Zarafa.core.data.IPMRecord/Array} records The record or records which must
	 * be marked as read.
	 * @param {Boolean} read (optional) False to mark the messages as unread, otherwise
	 * the message will be marked as read.
	 */
	markAsRead: function(records, read)
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
			if (read !== true || !record.needsReadReceipt()) {
				record.setReadFlags(read);
				saveRecords.push(record);
				continue;
			}
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
				Ext.MessageBox.show({
					title: _('Notify sender'),
					msg: _('The sender of this email has requested a read receipt. Do you wish to notify the sender?'),
					buttons: Ext.MessageBox.YESNO,
					fn: // This function will execute when user provide some inputs,
					// So other external changes should not affect the record.
					function(buttonClicked) {
					// If the mailgrid has reloaded, retrieve the newly updated record.
						var resolved = Zarafa.common.Actions.resolveRecords([this], store);
						var targetRecord = resolved.length > 0 ? resolved[0] : this;

						if (!targetRecord) {
							return;
						}

						targetRecord.setReadFlags(read);
						targetRecord.addMessageAction('send_read_receipt', buttonClicked !== 'no');
						targetRecord.save();
					},
					scope: record
				});
				break;
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
	downloadAttachment: function(record, allAsZip)
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
	openRulesWordsEditContent: function(config)
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
		var modal = false;
		if(record.isEmbeddedMessage()) {
			// if we are going to open embedded message then we need to first convert it into mail record
			record = record.convertToIPMRecord();
		} else {
			modal = Zarafa.common.Actions.isSupportedDocument(record.get("name"));
		}

		config = Ext.applyIf(config||{}, {
			modal: modal,
			autoResize: true
		});

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
			modal: true
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
	 * @param {Boolean} suppressException true to suppress popup of exception
	 * the Content Panel.
	 */
	openMessageContent: function(records, config, suppressException)
	{
		Ext.each(records, function(record) {
			if (suppressException) {
				record.suppressException();
			}
			if (record.isUnsent() && !record.isFaultyMessage()) {
				Zarafa.core.data.UIFactory.openCreateRecord(record, config);
			} else {
				if(record.isMessageClass('IPM.TaskRequest', true)) {
					record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Task', {
						entryid: record.get('entryid'),
						store_entryid: record.get('store_entryid'),
						parent_entryid: record.get('parent_entryid'),
						task_goid: record.get('task_goid')
					}, record.get('entryid'));
					record.addMessageAction('open_task', true);
				}
				// When a message has been opened before and the body has been
				// cleared (e.g. after closing a tab in Firefox), the record is
				// still marked as opened and won't be reloaded automatically.
				// Force a reload when no body content is available.
				if (record.isOpened() && Ext.isEmpty(record.get('body')) && Ext.isEmpty(record.get('html_body'))) {
					record.open({forceLoad: true});
				}
				Zarafa.core.data.UIFactory.openViewRecord(record, config);
			}
		});
	},

	/**
	 * Helper function which used to get the all recipient based or the recipient type. The recipient type can be
	 * {@link Zarafa.core.mapi.RecipientType.MAPI_TO To}, {@link Zarafa.core.mapi.RecipientType.MAPI_CC Cc} or
	 * {@link Zarafa.core.mapi.RecipientType.MAPI_BCC BCc}.
	 *
	 * @param {Zarafa.core.data.IPMRecipientStore} store The {@link Zarafa.core.data.IPMRecipientStore store} which contains the recipients.
	 * @param {Number} recipientType The recipientType it can be {@link Zarafa.core.mapi.RecipientType.MAPI_TO To},
	 * {@link Zarafa.core.mapi.RecipientType.MAPI_CC Cc} or {@link Zarafa.core.mapi.RecipientType.MAPI_BCC BCc}.
	 *
	 * @returns {Zarafa.core.dat.IPMRecipientRecord[]} same record type of records from given store.
	 */
	getRecipientsByType: function(store, recipientType)
	{
		return store.getRange().filter(function(item) {
			return item.get('recipient_type') === recipientType;
		}, this);
	},

	/**
	 * Check if the given file is either a PDF file or a ODF file.
	 *
	 * @param path
	 * @returns {boolean}
	 * @private
	 */
	isSupportedDocument: function (path)
	{
		return path.match(/^.*\.(pdf|od[tps]|jpg|jpeg|png|bmp|gif|mp4|mp3|ogg|webm|wav)$/i) ? true : false;
	},

	/**
	 * Helper function which check files previewer is enabled by
	 * admin as well as by user.
	 *
	 * @return true to file previewer is enabled by the admin and user else false.
	 */
	isFilePreviewerEnabled: function ()
	{
		if (!container.getServerConfig().isFilePreviewerEnabled()) {
			return false;
		}
		// First of all check if filepreviewer plugin settings available else check main settings.
		return container.getSettingsModel().getOneOf('zarafa/v1/plugins/filepreviewer/enable', 'zarafa/v1/main/file_previewer/enable');
	},

	/**
	 * Copy email address(es) of the given recipient or type of recipient.
	 *
	 * @param {Zarafa.core.dat.IPMRecipientRecord} record The record is resolved
	 * @param {Zarafa.core.data.IPMRecipientStore} store The {@link Zarafa.core.data.IPMRecipientStore store} which contains the recipients.
	 * @param {Boolean} copyAll The copyAll true to copy all the recipients from TO,Cc or BCc fields
	 */
	copyEmailAddress: function (record, store, copyAll)
	{
		var email;
		if (copyAll) {
			var recipients = this.getRecipientsByType(store, record.get('recipient_type'));
			email = recipients.map(function(item) {
				return item.get('smtp_address') || item.get('email_address');
			}).join(',');

		} else {
			email = record.get('smtp_address') || record.get('email_address');
			if(Ext.isEmpty(email)) {
				return;
			}
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
	onEmailRecipient: function(recipient)
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
	importItemCallback: function(files, folder, show)
	{
		Zarafa.common.Actions.brokenFiles = [];
		Zarafa.common.Actions.totalFiles = files.length;
		Zarafa.common.Actions.showImported = show === true;
		this.readFiles(files, folder);
	},

	/**
	 * Proxy callback for import action
	 * @param {Object} response The response received
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The selected folder
	 * @protected
	 */
	importDone: function(response, folder)
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
				'entryid': response.items,
				'parent_entryid': folder.get('entryid'),
				'store_entryid': folder.get('store_entryid')
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
	readFiles: function(files, folder, index)
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

		// Make sure we are processing only eml and ics/vcs files for broken check
		if (!this.isEmlFile(files[index]) && !this.isICSFile(files[index]) && !this.isVCFFile(files[index])) {
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
	checkBroken: function(e, files, index, folder)
	{
		var fileContent = e.target.result;
		var rawHeaderRegEx = /([^\n^:]+:)/g;

		// Get header part to process further
		var splittedContent = fileContent.split("/\r?\n\r?\n/");
		var indexOfAttachment = splittedContent[0].indexOf('Content-Disposition: attachment;');
		if (indexOfAttachment !== -1) {
			splittedContent = splittedContent[0].substr(0, indexOfAttachment);
		} else {
			splittedContent = splittedContent[0];
		}

		var rawHeaders = splittedContent.match(rawHeaderRegEx);

		// Restrict the eml files to import in calendar folder.
		var invalidImportingFolder = (this.isEmlFile(files[index]) && folder.isCalendarFolder()) ||
			(this.isEmlFile(files[index]) && folder.isContactFolder())||
			(this.isICSFile(files[index]) && !folder.isCalendarFolder()) ||
			(this.isICSFile(files[index]) && folder.isContactFolder()) ||
			(this.isVCFFile(files[index]) && !folder.isContactFolder());

		// Compare if necessary headers are present or not
		if (Ext.isEmpty(rawHeaders) || invalidImportingFolder) {
			this.brokenFiles.push(files[index]);
		} else if (this.isICSFile(files[index])) {
			splittedContent = splittedContent.toUpperCase();

			// Check if the file contains multiple events in single ics, if yes, validate each and every event.
			splittedContent = splittedContent.trim().split(/^\n$/gm);
			// If there is a single event in ics, we need to set the isSingleImport flag to true.
			if (splittedContent.length === 1) {
				this.isSingleImport = true;
			}
			splittedContent.forEach(function(contact) {
				this.isBrokenICSVCS(files[index], contact);
			}, this);
		} else if (this.isVCFFile(files[index])) {
			splittedContent = splittedContent.toUpperCase();

			// Check if the file contains multiple vCards, if yes, validate each and every vCard.
			splittedContent = splittedContent.trim().split(/^\n$/gm);

			// If there is a single vCard, we need to set the isSingleImport flag to true.
			if (splittedContent.length === 1) {
				this.isSingleImport = true;
			}
			splittedContent.forEach(function(contact) {
				// We need to check for the rawHeaders in each and every vCard, for proper validation
				rawHeaders = contact.match(rawHeaderRegEx);
				this.isBrokenVCF(files[index], contact, rawHeaders);
			}, this);
		} else if (!this.isVCFFile(files[index]) && (rawHeaders.indexOf('From:') === -1 || rawHeaders.indexOf('Date:') === -1)) {
			this.brokenFiles.push(files[index]);
		}

		index++;
		this.readFiles(files, folder, index);
	},

	/**
	 * Helper function to check selected ics/vcs file(s) is valid or not.
	 *
	 * @param {Object} file The file is contains file information.
	 * @param {String} splittedContent The formatted content of ics/vcs file.
	 * @param {Array} rawHeaders The keys array of ics/vcs file contains.
	 */
	isBrokenICSVCS: function(file, splittedContent)
	{
		if (splittedContent.search(/VCALENDAR(\r\n|\n|\r)/) === -1) {
			this.brokenFiles.push(file);
		}
	},

	/**
	 * Helper function to check if the selected vcf file is valid or not.
	 *
	 * @param {Object} file The file which contains file information.
	 * @param {String} splittedContent The formatted content of vcf file.
	 * @param {Array} rawHeaders The keys array in the vcf file.
	 */
	isBrokenVCF: function(file, splittedContent, rawHeaders)
	{
		// Every vcf file should start and end with the 'BEGIN:VCARD' and 'END:VCARD' property respectively.
		var begin = splittedContent.match('BEGIN:VCARD');
		var end = splittedContent.match('END:VCARD');

		// The version of the vCard is required and it should be specified immediately after 'BEGIN:' property.
		var hasVersion = this.isPropertyExists(rawHeaders, ['VERSION:']) && (rawHeaders.indexOf('VERSION:') === 1);

		// If any of the above mentioned properties are not present, we consider
		// the vCard to be invalid.
		if (!begin || !end || !hasVersion) {
			this.brokenFiles.push(file);
		}
	},

	/**
	 * Function checks if the given property(s) is present in the given key array or not.
	 * @param {Array} rawHeaders The keys array of ics/vcs file contains.
	 * @param {Array/String} propertyName The property(s) in the rawHeader
	 * @return {boolean} exists True if any property exists, false otherwise.
	 */
	isPropertyExists: function(rawHeaders, propertyName)
	{
		var exists = false;
		if (!Array.isArray(propertyName)) {
			propertyName = [ propertyName ];
		}
		propertyName.forEach(function (property) {
			if (rawHeaders.indexOf(property) === -1) {
				return;
			}
			exists = true;
		});
		return exists;
	},

	/**
	 * Helper function to import selected files in given {@link Zarafa.hierarchy.data.MAPIFolderRecord}.
	 * Or raise proper error message box describing broken files.
	 *
	 * @param {Object/Array} files The files is contains file information.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder folder to which files needs to be imported.
	 */
	importFiles: function(files, folder)
	{
		if (this.brokenFiles.length > 0) {
			if (this.brokenFiles.length > 1) {
				// Show list if there is more than one broken-file
				var componentType = Zarafa.core.data.SharedComponentType['hierarchy.dialog.brokenfiles'];
				Zarafa.core.data.UIFactory.openLayerComponent(componentType, this.brokenFiles, {'modal': true});
			} else {
				Zarafa.common.dialogs.MessageBox.addCustomButtons({
					title: _('Import error'),
					msg: String.format(_('Unable to import "{0}". The file is not valid'), this.brokenFiles[0].name),
					cls: Ext.MessageBox.ERROR_CLS,
					fn: Ext.emptyFn,
					customButton: [{
						text: _('Close'),
						name: 'cancel'
					}],
					scope: this
				});
			}

			// if all files are broken then avoid making import request to server
			if (this.brokenFiles.length === files.length) {
				return;
			}
		}

		var request = container.getRequest();
		var responseHandler = new Zarafa.core.data.AbstractResponseHandler({
			doImport: this.importDone.createDelegate(this, [folder], true)
		});

		var filesData = new FormData();

		if (Array.isArray(files) || files instanceof FileList) {
			for (var i = 0, len = files.length; i < len; i++) {
				// Prevent broken files to be sent to server
				if (this.brokenFiles.indexOf(files[i]) === -1) {
					filesData.append('attachments[]', files[i]);
					// Need to pass 1 and 0 because on php side we get all formData in
					// string so 'false' can break the import eml feature.
					filesData.append('has_icsvcs_file', this.isICSFile(files[i]) ? 1: 0);
					filesData.append('is_single_import', this.isSingleImport ? 1: 0);
				}
			}

		} else {
			filesData.append('attachments', files);
			// Need to pass 1 and 0 because on php side we get all formData in
			// string so 'false' can break the import eml feature.
			filesData.append('has_icsvcs_file', this.isICSFile(files[i]) ? 1: 0);
			filesData.append('is_single_import', this.isSingleImport ? 1: 0);
		}

		var url = container.getBaseURL();
		url = Ext.urlAppend(url, 'dialog_attachments=' + Zarafa.generateId(32));
		url = Ext.urlAppend(url, 'load=upload_attachment');
		url = Ext.urlAppend(url, 'destination_folder=' + folder.get('entryid'));
		url = Ext.urlAppend(url, 'store=' + folder.get('store_entryid'));
		url = Ext.urlAppend(url, 'import=true');
		// For the normal attachment we concatenate the attachment id with attachment name
		// which will be extracted by upload_attachment module but here we are importing
		// some items like ics, eml, etc. so we don't need to concat the attach id with attachment name
		// so just pass the ignore_extract_attachid flag in request.
		url = Ext.urlAppend(url, 'ignore_extract_attachid=true');

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
	isEmlFile: function (file)
	{
		if (!Ext.isEmpty(file.type)) {
			return file.type === 'message/rfc822';
		} else {
			var i = file.name.lastIndexOf('.');
			if (i === -1) {
				return false;
			}
			return file.name.substr(i + 1) === 'eml';
		}
	},

	/**
	 * Helper function to check if given file is of ics or vcs type or not.
	 * This is required as there is no file type available at all in case of IE11 and edge.
	 * @param {Object} file The file to be checked.
	 * @return {Boolean} True if the file is of type ics or vcs. false otherwise.
	 */
	isICSFile: function (file)
	{
		if (!Ext.isEmpty(file.type)) {
			return file.type === 'text/calendar';
		} else {
			var i = file.name.lastIndexOf('.');
			if (i === -1) {
				return false;
			}
			var extension = file.name.substr(i + 1);
			return extension === 'ics' || extension === 'vcs';
		}
	},

	/**
	 * Helper function to check if given file is of vcf type or not.
	 * This is required as there is no file type available at all in case of IE11 and edge.
	 *
	 * @param {Object} file The file to be checked.
	 * @return {Boolean} True if the file is of type vcf. false otherwise.
	 */
	isVCFFile: function(file)
	{
		if (!Ext.isEmpty(file.type)) {
			// windows system somehow show the file type to x-vcard.
			return file.type === 'text/vcard' || file.type === 'text/x-vcard';
		} else {
			var i = file.name.lastIndexOf('.');
			if (i === -1) {
				return false;
			}
			return file.name.substr(i + 1) === 'vcf';
		}
	},

	/**
	 * Helper function which show the {@link Zarafa.common.dialogs.MessageBox#addCustomButtons MessageBox} to ask user to
	 * copy instead of move records due to lack of record access or folder rights.
	 *
	 * @param {Zarafa.core.data.MAPIRecord[]} records The records which is going to copy in targeted folder.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} targetFolder The target folder on which records is going to copy.
	 * @param {Zarafa.core.data.ListModuleStore} store The which contains the records.
	 * @param {String} message The message which we show in message box.
	 * @param {Object} scope The scope in which this function was called.
	 * @param {Function} callBack function which needs to be called after performing copy action.
	 * @param {Object} options optional config items.
	 */
	showMessageBox: function(records, targetFolder, store, message, scope, callBack, options)
	{
		if (!Ext.isDefined(message)) {
			if (records.length > 1) {
				message = _("You have insufficient privileges to move these items. Would you like to copy instead?");
			} else {
				message = _("You have insufficient privileges to move this item. Would you like to copy instead?");
			}
		}

		var title = _('Insufficient privileges');
		var actionButton = _('Copy');
		if (!Ext.isEmpty(options)) {
			title = Ext.isDefined(options.title) ? options.title : title;
			actionButton = Ext.isDefined(options.actionBtn) ? options.actionBtn : actionButton;
		}

		records = this.resolveRecords(records, store);
		if (Ext.isEmpty(records)) {
			return;
		}

		Zarafa.common.dialogs.MessageBox.addCustomButtons({
			title: title,
			msg: message,
			cls: Ext.MessageBox.WARNING_CLS,
			width:400,
			dialog: this.dialog,
			fn: function(button) {
				if (button === 'cancel') {
					return;
				}

				var actionableRecords = Zarafa.common.Actions.resolveRecords(records, store);

				Ext.each(actionableRecords, function(record) {
					if (!record) {
						return;
					}

					var fnName = button + "To";
					if (Ext.isFunction(record[fnName])) {
						record[fnName](targetFolder);
					} else if (Ext.isFunction(record.copyTo)) {
						record.copyTo(targetFolder);
					}
				}, this);

				if (store && Ext.isFunction(store.save)) {
					store.save(actionableRecords);
				}

				if (this.dialog) {
					this.dialog.close();
				}

				if (Ext.isFunction(callBack)) {
					callBack.call(this);
				}
			},
			customButton: [{
				text: actionButton,
				name: actionButton.toLowerCase()
			}, {
				text: _('Cancel'),
				name: 'cancel'
			}],
			scope: Ext.isDefined(scope) ? scope : this
		});
	},

	/**
	 * Check if browser has permissions to show notifications
	 * @return {Boolean} true if permissions are granted to show desktop notifications else false
	 */
	hasPermission: function ()
	{
		var PERMISSION =['granted', 'default', 'denied'];
		if (!Ext.isDefined(window.Notification)) {
			console.error('Browser doesn\'t support notifications');
			return;
		}

		var permission = 'default';
		if (Ext.isFunction(Notification.checkPermission)) {
			permission = PERMISSION[Notification.checkPermission()];
		} else if (Ext.isFunction(Notification.permissionLevel)) {
			permission = Notification.permissionLevel();
		} else if (Notification.permission) {
			permission = Notification.permission;
		}

		if (permission === 'granted') {
			return true;
		}

		return false;
	},

	/**
	 * Ask for permissions to show notifications
	 * In chrome this function will only work when you call it based on some user action
	 * like click of a button
	 * @param {Function} callback callback function that will be called after user has
	 * granted/rejected permission request
	 */
	authorize: function (callback)
	{
		if (!Ext.isDefined(window.Notification)) {
			console.error('Browser doesn\'t support notifications');
			return;
		}

		if (Ext.isFunction(Notification.requestPermission)) {
			var promise = Notification.requestPermission();
			if (Ext.isFunction(callback)) {
				promise.then(function(perm) {
					// chrome doesn't give us current permission level, so default to granted if permission level is passed.
					callback.apply(this, [perm ? perm : 'granted']);
				});
			}
		}
	},

	/**
	 * Function will show a desktop notification
	 * @param {String} title title to use when showing desktop notifications
	 * @param {Object} options object containing below key value pairs to provide extra information
	 * for the desktop notifications
	 * 		- icon: icon to show in desktop notifications
	 * 		- body: message to display
	 *		- tag: tag to group same type of notifications so multiple notifications
	 *				will not be showed multiple times
	 * @param {Object} handlers object containing handler function that can be registered on instance of
	 * notification object
	 * 		- possible handlers are click, show, error, close
	 */
	notify: function (title, options, handlers)
	{
		if (!Ext.isDefined(window.Notification)) {
			console.error('Browser doesn\'t support notifications');
			return;
		}

		if (!this.hasPermission()) {
			console.error('Permission is denied to show desktop notifications');
			return;
		}

		var notification = new Notification(title, {
			icon: options.icon,
			body: options.body,
			requireInteraction: true
		});

		// Note: Due to desktopnotifications has been moved into webapp core,
		// we first need to check if user plugin settings are still available.
		// Apply desktop notifications plugin settings if its available.
		// Otherwise use webapp main settings.
		var settingsModel = container.getSettingsModel();
		var pluginBasePath = 'zarafa/v1/plugins/desktopnotifications/';
		var isPlugInEnabled = Ext.isDefined(settingsModel.get(pluginBasePath+'enable'));
		var baseSettingPath = isPlugInEnabled ? pluginBasePath : 'zarafa/v1/main/desktop_notification/';
		if (settingsModel.get(baseSettingPath + 'autohide_enable')) {
			var sleepTime = settingsModel.get(baseSettingPath + 'autohide_time') * 1000;
			notification.addEventListener("show", function () {
				setTimeout(function () {
					notification.close();
				}, sleepTime);
			});
		}

		if (handlers) {
			for (var key in handlers) {
				notification['on' + key] = handlers[key];
			}
		}

		// Give audio feedback
		if (!settingsModel.get(baseSettingPath + 'disable_sound')) {
			this.audioTag = Ext.getBody().createChild({
				tag: 'audio',
				type: 'audio/webm',
				src: 'plugins/desktopnotifications/resources/audio.webm',
				autoplay: true
			});

			// destroy audio element when playback is completed
			this.audioTag.on('ended', function () {
				Ext.destroy(this.audioTag);
				delete this.audioTag;
			}, this);
		}
	}
};
