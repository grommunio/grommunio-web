Ext.namespace('Zarafa.calendar');

/**
 * @class Zarafa.calendar.Actions
 * Common actions which can be used within {@link Ext.Button buttons}
 * or other {@link Ext.Component components} with action handlers.
 * @singleton
 */
Zarafa.calendar.Actions = {
	/**
	 * Opens a {@link Zarafa.calendar.dialogs.AppointmentContentPanel AppointmentContentPanel} for
	 * viewing an appointment.
	 *
	 * @param {Zarafa.core.data.IPMRecord} records The record, or records to which will be responded.
	 * @param {Object} config (optional) configuration object used to create the ContentPanel
	 */
	openAppointmentContent : function(records, config)
	{
		Ext.each(records, function(record) {
			// If the appointment is a series, then we need to ask the user
			// if he wants to open the occurence or the series.
			if (Ext.isDefined(record.isRecurringOccurence) && record.isRecurringOccurence()) {
				Zarafa.common.Actions.openRecurringSelectionContent(record, function(button, radio) {
					// Action cancelled.
					if (button != 'ok') {
						return;
					}

					// Convert the record to the requested type
					if (radio.id !== 'recurrence_series') {
						record = record.convertToOccurenceRecord();
					} else {
						record = record.convertToSeriesRecord();
					}

					Zarafa.core.data.UIFactory.openViewRecord(record, config);
				});
			} else {
				Zarafa.core.data.UIFactory.openViewRecord(record, config);
			}
		}, this);
	},

	/**
	 * Opens a {@link Zarafa.calendar.dialogs.AppointmentContentPanel AppointmentContentPanel} for creating a new appointment
	 *
	 * @param {Zarafa.calendar.CalendarContextModel} model The context model, which is used to create a new record. The record is blank but contains default values, etc.
	 * @param {Object} config (optional) Configuration object used to create the ContentPanel
	 */
	openCreateAppointmentContent : function(model, config)
	{
		var record = model.createRecord();
		Zarafa.core.data.UIFactory.openCreateRecord(record, config);
	},

	/**
	 * Open a Panel in which the {@link Zarafa.core.data.IPMRecord meeting request}
	 * can be viewed, or further edited.
	 *
	 * @param {Zarafa.core.data.IPMRecord} records The records to open
	 * @param {Object} config (optional) Configuration object used to create
	 * the Content Panel.
	 */
	openMeetingRequestContent : function(records, config)
	{
		// Simple wrapper around openAppointmentContent
		Zarafa.calendar.Actions.openAppointmentContent(records, config);
	},

	/**
	 * Open a Panel in which a new {@link Zarafa.core.data.IPMRecord meeting request} can be
	 * further edited.
	 *
	 * @param {Zarafa.calendar.CalendarContextModel} model Context Model object that will be used
	 * to {@link Zarafa.calendar.CalendarContextModel#createRecord create} the Task.
	 * @param {Object} config (optional) Configuration object used to create
	 * the Content Panel.
	 */
	openCreateMeetingRequestContent : function(model, config)
	{
		var record = model.createRecord();
		record.convertToMeeting();
		Zarafa.core.data.UIFactory.openCreateRecord(record, config);
 	},

	/**
	 * Opens a {@link Zarafa.calendar.dialogs.AppointmentContentPanel AppointmentContentPanel} that will
	 * have start and end date changed to proposedd times so an update can be sent to all attendees.
	 *
	 * @param {Zarafa.core.data.IPMRecord} records The record, or records to which will be responded.
	 * @param {Object} config (optional) Configuration object used to create the ContentPanel
	 */
	openAppointmentContentToAcceptProposal : function(records, config)
	{
		if (Ext.isArray(records)) {
			records = records[0];
		}

		var appointmentRecord = records.convertToAppointmentRecord(false);

		if(!Ext.isDefined(appointmentRecord)) {
			container.getNotifier().notify('error.proposal', _('Error'), _('Could not accept proposal as this meeting is not available in calendar; It may have been moved or deleted.'));
			return;
		}

		config = Ext.applyIf(config || {}, {
			useShadowStore: true,
			activeTab : 0,

			/*
			 * when we are actually accepting a proposal then we need to pass the proposed time data
			 * to appointment dialog so it can set that data after record is opened and all the data is loaded
			 * in the record
			 */
			newAppointmentProps : {
				// Apply the new time and duration
				'startdate' : records.get('proposed_start_date'),
				'duedate' : records.get('proposed_end_date'),
				'commonstart' : records.get('proposed_start_date'),
				'commonend' : records.get('proposed_end_date'),
				'duration' : records.get('proposed_duration'),
				// Reset the counter_proposal property to prevent
				// the "Proposal grid" from appearing inside the dialog.
				'counter_proposal' : false
			}
		});

		Zarafa.core.data.UIFactory.openCreateRecord(appointmentRecord, config);
	},

	/**
	 * Opens a {@link Zarafa.calendar.dialogs.AppointmentContentPanel AppointmentContentPanel} which
	 * will be opened in scheduling tab and will show all all proposed time in proposed time grid.
	 *
	 * @param {Zarafa.core.data.IPMRecord} records The record, or records to which will be responded.
	 * @param {Object} config (optional) Configuration object used to create the ContentPanels
	 */
	openAppointmentContentToViewAllProposals : function(records, config)
	{
		if (Ext.isArray(records)) {
			records = records[0];
		}

		var appointmentRecord = records.convertToAppointmentRecord();

		if(!Ext.isDefined(appointmentRecord)) {
			// @FIXME what if delegate doesn't have shared store open then we should give him a different message
			container.getNotifier().notify('error.proposal', _('Error'), _('Could not view proposal as this meeting is not available in calendar; It may have been moved or deleted.'));
			return;
		}

		config = Ext.applyIf(config || {}, {
			useShadowStore: true,
			activeTab : 1
		});
		Zarafa.core.data.UIFactory.openCreateRecord(appointmentRecord, config);
	},
	
	/**
	 * Opens a {@link Zarafa.calendar.dialogs.ProposeNewTimeContentPanel ProposeNewTimeContentPanel} for
	 * proposing new time for Meeting Request.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record, for which propose new time content panel
	 * is going to open.
	 * @param {Object} config (optional) Configuration object used to create the ContentPanel
	 */
	openProposeNewTimeContent : function(record, config)
	{
		
		config = Ext.applyIf(config || {}, {
			autoSave : false,
			modal: true
		});
		var componentType = Zarafa.core.data.SharedComponentType['calendar.dialogs.proposenewtimecontentpanel'];
		Zarafa.core.data.UIFactory.openLayerComponent(componentType, record, config);
	},
	
	/**
	 * Opens a {@link Zarafa.addressbook.dialogs.ABMultiUserSelectionContentPanel ABMultiUserSelectionContentPanel}
	 * for configuring the categories of the given {@link Zarafa.core.data.IPMRecord records}.
	 *
	 * @param {Zarafa.core.data.IPMRecord} records The record, or records for which the categories
	 * must be configured
	 * @param {Object} config (optional) Configuration object used to create the ContentPanel
	 */
	openRecipientSelectionContent : function(records, config)
	{
		if (Ext.isArray(records) && !Ext.isEmpty(records)) {
			records = records[0];
		}

		// Create a copy of the record, we don't want the changes
		// to be activated until the user presses the Ok button.
		var copy = records.copy();
		var store = copy.getSubStore('recipients');

		Zarafa.common.Actions.openABUserMultiSelectionContent({
			callback : function() {
				records.applyData(copy);
			},
			convert : function(user, field) {
				return user.convertToRecipient(field ? field.defaultRecipientType : config.defaultRecipientType);
			},
			store : store,
			selectionCfg : [{
				xtype : 'zarafa.recipientfield',
				fieldLabel : _('Required') + ':',
				height : 50,
				boxStore : store,
				filterRecipientType: Zarafa.core.mapi.RecipientType.MAPI_TO,
				defaultRecipientType: Zarafa.core.mapi.RecipientType.MAPI_TO,
				flex : 1
			},{
				xtype : 'zarafa.recipientfield',
				fieldLabel : _('Optional') + ':',
				height : 50,
				boxStore : store,
				filterRecipientType: Zarafa.core.mapi.RecipientType.MAPI_CC,
				defaultRecipientType: Zarafa.core.mapi.RecipientType.MAPI_CC,
				flex : 1
			},{
				xtype : 'zarafa.recipientfield',
				fieldLabel : _('Resource') + ':',
				height : 50,
				boxStore : store,
				filterRecipientType: Zarafa.core.mapi.RecipientType.MAPI_BCC,
				defaultRecipientType: Zarafa.core.mapi.RecipientType.MAPI_BCC,
				flex : 1
			}]
		});
	},
	
	/**
	 * Opens a {@link Zarafa.calendar.dialogs.SendMeetingRequestConfirmationContentPanel}
	 * @param {Ext.data.Record} record The record, or records, for which the categories must be configured
	 * @param {Object} config (optional) Configuration object used to create the ContentPanel
	 */
	openSendConfirmationContent : function(record, config)
	{
		config = Ext.applyIf(config || {}, {
			record : record,
			modal : true
		});
		var componentType = Zarafa.core.data.SharedComponentType['calendar.dialogs.sendmeetingrequestconfirmation'];
		Zarafa.core.data.UIFactory.openLayerComponent(componentType, record, config);
	},

	/**
	 * Opens a {@link Zarafa.calendar.dialogs.SendMeetingRequestCancellationContentPanel}
	 * @param {Ext.data.Record} record
	 * @param {Object} config (optional) Configuration object used to create the ContentPanel
	 */
	openSendCancellationContent : function(record, config)
	{
		config = Ext.applyIf(config || {}, {
			record : record,
			modal : true
		});
		var componentType = Zarafa.core.data.SharedComponentType['calendar.dialogs.sendmeetingrequestcancellation'];
		Zarafa.core.data.UIFactory.openLayerComponent(componentType, record, config);
	},

	/**
	 * Function opens default calendar folder in the {@link Zarafa.calendar.CalendarContext CalendarContext}.
	 * it will also load day view containing the {@link Zarafa.core.data.IPMRecord IPMRecord}.
	 * 
	 * @param {Zarafa.core.data.IPMRecord} record A Meeting Request record
	 * which should be shown in calendar in day view.
	 * @param {Object} config (optional) Configuration object used to create the ContentPanel
	 */
	showMeetingInCalendar : function(record, config)
	{
		var mapiStoreRecord, mapiFolderRecord;

		// Get correspondent appointment's store from the record.
		var mapiStoreId = record.get('appointment_store_entryid');
		if(mapiStoreId) {
			mapiStoreRecord = container.getHierarchyStore().getById(mapiStoreId);
		}

		if(!mapiStoreRecord) {
			/*
			 * If we don't have correspondent appointment's store then get user id from one of this
			 * 1) received_representing_entryid, Meeting request reciever's id for delegate
			 * 2) received_by_entryid, Meeting request reciever's id
			 * 3) sent_representing_entryid, if it is in sent items, then delegator's id,
			 *    where delegator is organizer
			 * 4) sender_entryid, if it is in sent items, then organizer's id
			 * and then open correpondent user's store.
			 */
			var ownerEntryId = record.get('received_representing_entryid') || record.get('received_by_entryid') || record.get('sent_representing_entryid') || record.get('sender_entryid');
			mapiStoreRecord = container.getHierarchyStore().getStoreByOwnerEntryId(ownerEntryId);
			if(!Ext.isDefined(mapiStoreRecord)) {
				container.getNotifier().notify('error', _('Error'), _('Could not open store.'));
				return;
			}
		}

		// Get correspondent appointment's calendar folder from the record.
		var mapiFolderId = record.get('appointment_parent_entryid');
		if(mapiFolderId) {
			mapiFolderRecord = mapiStoreRecord.getFolder(mapiFolderId);
		}

		// If we can't find appointment's calendar folder then
		// get the default calendar folder of the store.
		if(!mapiFolderRecord) {
			mapiFolderRecord = mapiStoreRecord.getDefaultFolder('calendar');
			if(!Ext.isDefined(mapiFolderRecord)) {
				container.getNotifier().notify('error', _('Error'), _('Could not open default calendar folder.'));
				return;
			}
		}

		// Obtain the context & contextModel
		var context = container.getContextByFolder(mapiFolderRecord);
		var model = context.getModel();

		// Enable the context, but keep is suspended to prevent loading data
		container.switchContext(context, mapiFolderRecord, true);

		// define which view to load
		context.switchView(Zarafa.calendar.data.Views.BLOCKS, Zarafa.calendar.data.ViewModes.DAYS);

		// define which date range to load
		var appointmentDate = record.get('appointment_startdate') || record.get('appointment_basedate');
		model.setDataMode(Zarafa.calendar.data.DataModes.DAY);
		model.setDate(appointmentDate);

		// We are done initializing the context & model.
		// Time to start loading
		model.resumeLoading();
	}
};
