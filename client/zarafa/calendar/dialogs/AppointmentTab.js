Ext.namespace('Zarafa.calendar.dialogs');

/**
 * @class Zarafa.calendar.dialogs.AppointmentTab
 * @extends Ext.form.FormPanel
 * @xtype zarafa.appointmenttab
 * 
 * Main tab in the {@link Zarafa.calendar.dialogs.AppointmentPanel}
 * that is used to create Appointments and Meeting Requests.
 */
Zarafa.calendar.dialogs.AppointmentTab = Ext.extend(Ext.form.FormPanel, {
	/**
	 * @cfg {String} trackingInfoString string which must be displayed in the dialog
	 * if any attendee has responded to the meeting request in {@link Zarafa.core.data.IPMRecord record}
	 */
	trackingInfoString : pgettext('calendar.dialog', '{0} attendees accepted, {1} tentatively accepted, {2} declined.'),

	/**
	 * @cfg {String} proposedTimeInfoString string which must be displayed in the dialog
	 * if there is any counter proposal for change in meeting time set in {@link Zarafa.core.data.IPMRecord record}
	 */
	proposedTimeInfoString : pgettext('calendar.dialog', '{0} attendees proposed a new time for this meeting. Click the Scheduling tab for details.'),

	/**
	 * @cfg {String} proposeNewTimeInfoString string which must be displayed in the dialog
	 * if there is any counter proposal for change in meeting time set in {@link Zarafa.core.data.IPMRecord record}
	 */
	proposeNewTimeInfoString : pgettext('calendar.dialog', 'You proposed a new time for this meeting on {0}'),

	/**
	 * @cfg {String} proposeNewTimeDelegateInfoString string which must be displayed in the dialog
	 * if there is any counter proposal for change in meeting time set in {@link Zarafa.core.data.IPMRecord record}
	 * and meeting is proposed by delegate
	 */
	proposeNewTimeDelegateInfoString : pgettext('calendar.dialog', '{0} proposed a new time for this meeting on {1}'),

	/**
	 * @cfg {String} acceptedInfoString string which must be displayed in the dialog
	 * if meeting accepted time set in {@link Zarafa.core.data.IPMRecord record}
	 */
	acceptedInfoString : pgettext('calendar.dialog', 'Accepted on {0}'),

	/**
	 * @cfg {String} acceptedDelegateInfoString string which must be displayed in the dialog
	 * if meeting accepted time set in {@link Zarafa.core.data.IPMRecord record}
	 * and meeting is accepted by delegate
	 */
	acceptedDelegateInfoString : pgettext('calendar.dialog', 'Accepted by {0} on {1}'),

	/**
	 * @cfg {String} tentativeInfoString string which must be displayed in the dialog
	 * if meeting tentatively accepted time set in {@link Zarafa.core.data.IPMRecord record}
	 */
	tentativeInfoString : pgettext('calendar.dialog', 'Tentatively Accepted on {0}'),

	/**
	 * @cfg {String} tentativeDelegateInfoString string which must be displayed in the dialog
	 * if meeting tentatively accepted time set in {@link Zarafa.core.data.IPMRecord record}
	 * and meeting is accepted by delegate
	 */
	tentativeDelegateInfoString : pgettext('calendar.dialog', 'Tentatively Accepted by {0} on {1}'),

	/**
	 * @cfg {String} elapsedTimeInfoString string which must be displayed in the dialog
	 * if meeting time set in {@link Zarafa.core.data.IPMRecord record} is already elapsed.
	 */
	elapsedTimeInfoString : pgettext('calendar.dialog', 'This appointment occurs in the past.'),

	/**
	 * @cfg {String} responseRequiredString string which must be displayed in the dialog
	 * if meeting accepted time set in {@link Zarafa.core.data.IPMRecord record} is empty.
	 * which means that, meeting request is not responded yet
	 */
	responseRequiredString : pgettext('calendar.dialog', 'Please respond.'),

	/**
	 * @cfg {String} noResponseReceivedString string which must be displayed in the dialog
	 * if no recipient has responded to meeting request
	 */
	noResponseReceivedString : pgettext('calendar.dialog', 'No responses have been received for this meeting.'),

	/**
	 * @cfg {String} meetingCanceledString string which must be displayed in the dialog
	 * if meeting has been canceled.
	 */
	meetingCanceledString : pgettext('calendar.dialog', 'Meeting has been canceled.'),

	/**
	 * @cfg {String} meetingUnsentString string which must be displayed in the dialog
	 * if meeting has not yet been sent.
	 */
	meetingUnsentString : pgettext('calendar.dialog', 'Invitations have not been sent for this meeting.'),

	/**
	 * @cfg {String} meetingOverwrittenString string which must be displayed in the dialog
	 * to inform the user his changes will be overwritten when the meeting organizer updates
	 * the meeting.
	 */
	meetingOverwrittenString : pgettext('calendar.dialog', 'Please note that any changes you make will be overwritten when this meeting request is updated by the organizer'),

	/**
	 * Property which is set to true when user changes location manually, If user has
	 * changed/set location manually. {@link updateLocation} function will use this
	 * property to chech whether has changed location or not, if this property is false
	 * then it will change location generated using recipients without any confirmation.
	 * @property
	 * @type Boolean
	 * @private
	 */
	hasUserSetLocation : false,

	/**
	 * @constructor
	 * @param {Object} config
	 */
	constructor : function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		Ext.applyIf(config, {
			xtype: 'zarafa.appointmenttab',
			cls: 'zarafa-appointmentcreatetab',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			border: false,
			labelPad: 0,
			items: [
				this.createExtraInfoPanel(),	
				this.createMeetingOrganizerPanel(),	
				this.createRecipientPanel(),
				this.createSubjectPanel(),
				this.createLocationPanel(),
				this.createDateTimePanel(),
//				this.createRecurrencePanel(),
//				this.createReminderPanel(),
				this.createAttachmentsPanel(),
				this.createBodyPanel()
			]
		});

		Zarafa.calendar.dialogs.AppointmentTab.superclass.constructor.call(this, config);
	},

	/**
	 * Create the {@link Ext.Panel panel} containing the information about response from attendees
	 * and some extra information regarding meeting item.
	 * @return {Object} Configuration object for the panel containing the fields
	 * @private
	 */
	createExtraInfoPanel : function()
	{	
		return {
			xtype: 'container',
			cls: 'zarafa-calendar-appointment-extrainfo',
			ref: 'extraInfoPanel',
			autoHeight: true,
			hidden: true
		};
	},

	/**
	 * Create the {@link Ext.Panel panel} containing the information about meeting organizer
	 * @return {Object} Configuration object for the panel containing the fields
	 * @private
	 */
	createMeetingOrganizerPanel : function()
	{	
		return {
			xtype: 'panel',
			ref: 'meetingOrganizerPanel',
			layout: 'form',
			autoHeight: true,
			border: false,
			items: [{
				xtype: 'displayfield',
				ref: '../meetingOrganizerField',
				fieldLabel: _('Organizer'),
				htmlEncode : true,
				flex: 1
			}],
			hidden: true
		};
	},

	/**
	 * Create the {@link Zarafa.common.ui.RecipientField RecipientField}
	 * where the recipients for the Meeting requests can be selected
	 * @return {Object} Configuration object for the panel containing the composite field
	 * @private
	 */
	createRecipientPanel : function()
	{
		return {
			xtype : 'zarafa.resizablecompositefield',
			cls : 'field-to',
			ref: 'recipientPanel',
			anchor : '100%',
			autoHeight: false,
			items: [{
				xtype: 'button',
				autoHeight: true,
				text: _('To') + ':',
				handler: this.showRecipientContent,
				scope: this
			},{
				xtype: 'zarafa.recipientfield',
				plugins : [ 'zarafa.recordcomponentupdaterplugin' ],
				flex: 1
			}]
		};
	},

	/**
	 * Create the {@link Ext.Panel panel} containing the form element
	 * to set the subject
	 * @return {Object} Configuration object for the panel containing the fields
	 * @private
	 */
	createSubjectPanel : function()
	{
		return {
			xtype: 'panel',
			cls: 'subject-panel',
			layout: 'form',
			labelWidth: 84,
			labelAlign: 'left',
			autoHeight: true,
			border: false,
			items: [{
				xtype: 'textfield',
				name: 'subject',
				fieldLabel: _('Subject'),
				anchor: '100%',
				listeners: {
					change: this.onFieldChange,
					scope: this
				}	
			}]
		};
	},

	/**
	 * Create the {@link Ext.Panel panel} containing the form element
	 * to set the location
	 * @return {Object} Configuration object for the panel containing the fields
	 * @private
	 */
	createLocationPanel : function()
	{
		return {
			xtype: 'panel',
			cls: 'location-panel',
			layout: 'form',
			labelWidth: 84,
			labelAlign: 'left',
			autoHeight: true,
			border: false,
			items: [{
				xtype: 'textfield',
				name: 'location',
				fieldLabel: _('Location'),
				anchor: '100%',
				enableKeyEvents: true,
				listeners: {
					change: this.onFieldChange,
					keypress: this.onLocationKeyPress,
					scope: this
				}	
			}]
		};
	},
	
	/**
	 * Create the {@link Ext.Panel panel} containing the following elements
	 * in a table layout: the date panel, recurrence panel, busy status panel,
	 * reminder panel, and the label panel.
	 * @return {Object} Configuration object for the panel containing the fields
	 * @private
	 */
	createDateTimePanel : function()
	{
		return {
			xtype: 'panel',
			cls: 'datetime-panel',
			border: false,
			autoHeight: true,
			layout: {
				type: 'table',
				columns: 2
			},
			items : [
				{
					xtype: 'panel',
					border: false,
					items: [
						this.createDatePanel(),
						this.createRecurrencePanel()
					]
				},
				this.createBusyStatusPanel(),
				
				this.createReminderPanel(),
				this.createLabelPanel()
			]
		};
	},

	/**
	 * Create the {@link Ext.Panel Panel} containing the
	 * {@link Zarafa.common.ui.DateTimePeriodField DateTimePeriodField}.
	 * @return {Object} Configuration object for the panel with time selection fields
	 * @private
	 */
	createDatePanel : function()
	{
		return {
			xtype: 'panel',
			cls: 'date-panel',
			layout: {
				type: 'table',
				columns: 3
			},
			ref: '../../datePanel',
			autoHeight: true,
			autoWidth: true,
			border: false,
			items: [{
				xtype: 'zarafa.datetimeperiodfield',
				ref: '../../../datetimePeriod',
				defaultPeriod: container.getSettingsModel().get('zarafa/v1/contexts/calendar/default_appointment_period'),
				defaultPeriodType : Date.MINUTE,
				timeIncrement: container.getSettingsModel().get('zarafa/v1/contexts/calendar/default_zoom_level'),
				width: 585,
				allowEqualValue : true,
				layout: 'hbox',
				listeners: {
					change: this.onDateRangeFieldChange,
					scope: this
				},
				startFieldConfig: {
					fieldLabel: _('Time'),
					labelWidth: 83,
					
					cls: 'from-field'
				},
				endFieldConfig: {
					fieldLabel: _('until'),
					labelWidth: 84,
					cls: 'to-field'
				}
			},{
				xtype: 'spacer',
				width: 10
			},{
				xtype: 'panel',
				border: false,
				items: [{
					xtype: 'checkbox',
					name: 'alldayevent',
					boxLabel: _('All Day Event'),
					handler: this.onToggleAllDay,
					scope: this
				}]
			}]
		};
	},

	/**
	 * Create the {@link Ext.Panel Panel} containing the form fields
	 * for displaying the recurrence information.
	 * @return {Object} Configuration object for the panel with recurrence fields
	 * @private
	 */
	createRecurrencePanel : function()
	{
		return {
			xtype: 'panel',
			cls: 'recurrence-panel',
			ref: '../../recurrencePanel',
			layout: 'form',
			autoHeight: true,
			border: false,
			items: [{
				xtype: 'displayfield',
				ref: '../../../recurrencePatternField',
				fieldLabel: _('Recurrence'),
				htmlEncode : true
			}]
		};
	},

	/**
	 * Create the {@link Ext.Panel Panel} containing the form fields
	 * for setting the reminder information.
	 * @return {Object} Configuration object for the panel with reminder fields
	 * @private
	 */
	createReminderPanel : function()
	{
		var reminderStore = {
			xtype: 'jsonstore',
			fields: ['name', 'value'],
			data : Zarafa.calendar.data.ReminderPeriods
		};

		return {
			xtype: 'panel',
			cls: 'reminder-panel',
			autoHeight: true,
			border: false,
			items: [{
				xtype: 'zarafa.compositefield',
				autoHeight: true,
				items: [{
					xtype: 'checkbox',
					name: 'reminder',
					boxLabel: _('Reminder') + ':',
					width: 78,
					handler: this.onToggleReminder,
					scope: this
				},{
					xtype: 'combo',
					ref: '../../../comboReminder',
					name: 'reminder_minutes',
					store: reminderStore,
					mode: 'local',
					triggerAction: 'all',
					displayField: 'name',
					valueField: 'value',
					lazyInit: false,
					forceSelection: true,
					editable: false,
					swidth: 150,
					listeners: {
						select: this.onFieldSelect,
						scope: this
					}
				}]
			}]
		};
	},
	
	/**
	 * Create the {@link Ext.Panel Panel} containing the form fields
	 * for setting the busy status.
	 * @return {Object} Configuration object for the panel with reminder fields
	 * @private
	 */
	createBusyStatusPanel : function()
	{
		var busyStore = {
			xtype: 'jsonstore',
			fields: ['name', 'value'],
			data : Zarafa.calendar.data.BusyStatus
		};

		return {
			xtype: 'panel',
			cls: 'busystatus-panel',
			layout: 'form',
			autoHeight: true,
			border: false,
			labelAlign: 'left',
			items: [{
				xtype: 'combo',
				ref: '../../comboBusyStatus',
				name: 'busystatus',
				fieldLabel: _('Busy Status'),
				store: busyStore,
				mode: 'local',
				triggerAction: 'all',
				displayField: 'name',
				valueField: 'value',
				lazyInit: false,
				forceSelection: true,
				editable: false,
				listeners: {
					select: this.onFieldSelect,
					scope: this
				}
			}]
		};
	},
	
	/**
	 * Create the {@link Ext.Panel Panel} containing the form fields
	 * for setting a label on the appointment.
	 * @return {Object} Configuration object for the panel with reminder fields
	 * @private
	 */
	createLabelPanel : function()
	{
		var labelStore = {
			xtype: 'jsonstore',
			fields: ['name', 'value'],
			data : Zarafa.calendar.data.AppointmentLabels
		};

		return {
			xtype: 'panel',
			cls: 'label-panel',
			layout: 'form',
			autoHeight: true,
			border: false,
			labelAlign: 'left',
			items: [{
				xtype: 'combo',
				name: 'label',
				fieldLabel: _('Label'),
				store: labelStore,
				mode: 'local',
				triggerAction: 'all',
				displayField: 'name',
				valueField: 'value',
				lazyInit: false,
				forceSelection: true,
				editable: false,
				autoSelect: true,
				tpl: new Ext.XTemplate(
					'<tpl for=".">',
						'<div class="x-combo-list-item zarafa-calendar-appointment-{[this.getCSSLabel(values.value)]}">',
							'{name}',
						'</div>',
					'</tpl>',
					{
						getCSSLabel : function(label)
						{
							label = Zarafa.core.mapi.AppointmentLabels.getName(label);
							label = label.toLowerCase();
							label = label.replace('_', '-');
							return 'label-' + label;
						}
					}),
				listeners: {
					select: this.onFieldSelect,
					scope: this
				}
			}]
		};
	},

	/**
	 * Create the {@link Ext.Panel Panel} which contains all attachment selection fields
	 * @return {Object} configuration object for the panel containing the attachment fields
	 * @private
	 */
	createAttachmentsPanel : function()
	{
		return {
			xtype: 'zarafa.resizablecompositefield',
			hideLabel: true,
			anchor: '100%',
			cls: 'zarafa-appointmentcreatepanel-field-attachments',
			autoHeight: true,
			items: [{
				// FIXME: Remove after WA-4880 is implemented
				xtype : 'button',
				ref : '../occurenceAttachmentsButton',
				text : _('Attachments') + ':',
				width: 100,
				handler: function() {
					Ext.MessageBox.show({
						title : _('Warning'),
						msg : _('Attachments cannot be modified for a single occurence'),
						buttons: Ext.Msg.OK,
						icon: Ext.MessageBox.WARNING
					});
				}
			},{
				xtype: 'zarafa.attachmentbutton',
				ref : '../normalAttachmentsButton', // FIXME: Remove after WA-4880 is implemented
				plugins : [ 'zarafa.recordcomponentupdaterplugin' ],
				text: _('Attachments') + ':',
				autoHeight: true,
				width: 100
			},{
				xtype: 'spacer',
				width: 5
			},{
				xtype: 'zarafa.attachmentfield',
				plugins : [ 'zarafa.recordcomponentupdaterplugin' ],
				ref : '../attachField',
				flex: 1,
				hideLabel: true
			}]
		};
	},

	/**
	 * Create the {@link Ext.Panel Panel} containing the
	 * {@link Zarafa.common.ui.htmleditor.HtmlEditor HtmlEditor} form field.
	 * @return {Object} Configuration object containing the HtmlEditor
	 * @private
	 */
	createBodyPanel : function()
	{
		return {
			xtype: 'panel',
			cls: 'body-panel',
			layout: 'fit',
			border: false,
			flex: 1,
			autoHeight: false,
			items: [{
				xtype: 'zarafa.editorfield',
				ref: '../editorField',
				hideLabel: true,
				flex: 1,
				useHtml: false,
				listeners: {
					// Use the afterlayout event to place the placeholder attribute
					afterlayout: function(){
						this.editorField.getEditor().getEl().set({
							placeholder: _('Type your message here...')
						});
					},
					change: this.onBodyChange,
					scope: this
				}
			}]
		};
	},

	/**
	 * Event is fired when keypress event is fired on location field, ie. user changes location manually
	 * @param {HtmlElement} element The target of the event
	 * @param {Ext.EventObject} event The Ext.EventObject encapsulating the DOM event
	 */
	onLocationKeyPress : function(element, event)
	{
		this.hasUserSetLocation = true;
	},

	/**
	 * Enable/disable/hide/unhide all {@link Ext.Component Components} within the {@link Ext.Panel Panel}
	 * using the given {@link Zarafa.core.data.IPMRecord IPMRecord}.
	 * @param {Zarafa.core.data.IPMRecord} record The record to update the panel with
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 * @private
	 */
	updateUI : function(record, contentReset)
	{
		var layout = false;

		if (contentReset === true || record.isModifiedSinceLastUpdate('meeting')) {
			switch (record.get('meeting')) {
				case Zarafa.core.mapi.MeetingStatus.NONMEETING:
				/* falls through */
				default:
					this.dialog.closeOnSave = true;
					this.dialog.closeOnSend = false;
					this.recipientPanel.setVisible(false);
					break;
				case Zarafa.core.mapi.MeetingStatus.MEETING:
					this.dialog.closeOnSave = false;
					this.dialog.closeOnSend = true;
					this.recipientPanel.setVisible(true);
					break;
				case Zarafa.core.mapi.MeetingStatus.MEETING_RECEIVED:
				case Zarafa.core.mapi.MeetingStatus.MEETING_CANCELED:
				case Zarafa.core.mapi.MeetingStatus.MEETING_RECEIVED_AND_CANCELED: 
					// here we ensure that response status,is nither none nor organizer 
					if(record.get('responsestatus') != Zarafa.core.mapi.ResponseStatus.RESPONSE_NONE || record.get('responsestatus') != Zarafa.core.mapi.ResponseStatus.RESPONSE_ORGANIZED) {
						this.meetingOrganizerPanel.setVisible(true);
						this.recipientPanel.setVisible(false);
					}
					break;
			}

			layout = true;
		}

		if (contentReset === true || record.isModifiedSinceLastUpdate('alldayevent')) {
			if (record.get('alldayevent')) {
				this.datetimePeriod.setEnabledTimeSelection(false);
				// For allday events, we only allow selections of entire days
				this.datetimePeriod.defaultPeriod = 1;
				this.datetimePeriod.defaultPeriodType = Date.DAY;
			} else {
				this.datetimePeriod.setEnabledTimeSelection(true);
				// For normal events, we have to configure the normal period options again
				this.datetimePeriod.defaultPeriod = container.getSettingsModel().get('zarafa/v1/contexts/calendar/default_appointment_period');
				this.datetimePeriod.defaultPeriodType = Date.MINUTE;
			}
		}

		if (contentReset === true || record.isModifiedSinceLastUpdate('reminder')) {
			if (record.get('reminder')) {
				this.comboReminder.enable();
			} else {
				this.comboReminder.disable();
			}
		}

		if (contentReset === true || record.isModifiedSinceLastUpdate('recurring')) {
			if (record.get('recurring') && Ext.isEmpty(record.get('basedate'))) {
				this.datePanel.setVisible(false);
				this.recurrencePanel.setVisible(true);
			} else {
				this.datePanel.setVisible(true);
				this.recurrencePanel.setVisible(false);
				this.recurrencePatternField.setValue('');
			}

			layout = true;
		}

		// FIXME: Remove after WA-4880 is implemented
		if (contentReset === true) {
			if (record.isRecurringOccurence()) {
				this.occurenceAttachmentsButton.setVisible(true);
				this.normalAttachmentsButton.setVisible(false);

				this.attachField.setEditable(false);
			} else {
				this.occurenceAttachmentsButton.setVisible(false);
				this.normalAttachmentsButton.setVisible(true);

				this.attachField.setEditable(true);
			}

			layout = true;
		}

		if (contentReset === true || record.isModifiedSinceLastUpdate('reminder')) {
			if (record.get('alldayevent')) {
				this.comboReminder.setValue(container.getSettingsModel().get('zarafa/v1/contexts/calendar/default_allday_reminder_time'));
				this.comboBusyStatus.setValue(Zarafa.core.mapi.BusyStatus.FREE);
			} else {
				this.comboReminder.setValue(container.getSettingsModel().get('zarafa/v1/contexts/calendar/default_reminder_time'));
				this.comboBusyStatus.setValue(Zarafa.core.mapi.BusyStatus.BUSY);
			}
		}

		if (layout) {
			this.doLayout();
		}
	},

	/**
	 * Update the {@link Ext.Panel Panel} with the given {@link Zarafa.core.data.IPMRecord IPMRecord}
	 * @param {Zarafa.core.data.IPMRecord} record The record to update the panel with
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
		this.record = record;
		this.updateUI(record, contentReset);
		this.getForm().loadRecord(record);

		var startDate = record.get('startdate');
		var startDateUpdate = false;
		if (Ext.isDate(startDate)) {
			startDate = startDate.clone();
			startDateUpdate = contentReset || record.isModifiedSinceLastUpdate('startdate');
		}
		var dueDate = record.get('duedate');
		var dueDateUpdate = false;
		if (Ext.isDate(dueDate)) {
			dueDate = dueDate.clone();
			dueDateUpdate = contentReset || record.isModifiedSinceLastUpdate('duedate');
		}

		// For all day events we store the due date as 00:00 on the day after
		// it ends. For the UI, this means we have to substract 1 day to get
		// the date on which the appointment actually ends for the user.
		if (record.get('alldayevent')) {
			startDate.clearTime();

			// Set time to 12:00 when using Date.add(Date.DAY)
			// to prevent problems with DST switches at 00:00
			// (like in Brasil).
			dueDate.setHours(12);
			dueDate = dueDate.add(Date.DAY, -1).clearTime();
		}

		if (startDateUpdate || dueDateUpdate) {
			this.datetimePeriod.getValue().set(startDate, dueDate);
		}

		if (contentReset && record.isOpened()) {
			this.editorField.setValue(record.getBody(this.editorField.isHtmlEditor()));
		}

		this.updateExtraInfoPanel();
		
		if (contentReset === true || record.isModifiedSinceLastUpdate('recurring_pattern')) {
			this.recurrencePatternField.setValue(record.get('recurring_pattern'));
		}

		/*
		 * When any property with reminder is changed then we need
		 * to update reminder_time and flagdueby aswell, When
		 * 1) flagdueby is changed
		 * 2) reminder minutes is changed
		 * 3) startdate is changed
		 */
		if (record.get('reminder') === true) {
			if(!record.get('flagdueby') || record.isModifiedSinceLastUpdate('reminder_minutes') || record.isModifiedSinceLastUpdate('startdate')) {
				var reminderDate;

				if (record.isRecurring() || record.isRecurringOccurence()) {
					reminderDate = record.get('startdate_recurring');
				}

				if (!reminderDate) {
					reminderDate = record.get('startdate');
				}

				if (Ext.isDate(reminderDate)) {
					record.set('reminder_time', reminderDate.clone());
					record.set('flagdueby', reminderDate.add(Date.MINUTE, -record.get('reminder_minutes')));
				}
			}
		}

		if(record.isOpened() && record.isSubStoreModifiedSincelastUpdate('recipients')) {
			var recipients = record.updateSubStoreModifications.recipients;
			
			// Check if changes (Added/Removed/Updated) are room resource
			if(recipients && recipients.changes) {
				var changedRecipients = recipients.changes;
				var isResouceChanged = false;

				for(var i = 0; i < changedRecipients.length; i++) {
					if(changedRecipients[i].get('display_type_ex') === Zarafa.core.mapi.DisplayTypeEx.DT_ROOM) {
						isResouceChanged = true;
						break;
					}
				}

				if(isResouceChanged) {
					this.updateLocation();
				}
			}
		}
	},

	/**
	 * Function updates the location in the {@link Zarafa.core.data.IPMRecord record}
	 * It uses {@link Zarafa.core.mapi.DisplayTypeEx.DT_ROOM room} resources to
	 * generate location from the recipient table.
	 * 
	 * @private
	 */
	updateLocation : function()
	{
		var locations = [];
		var recipientStore = this.record.getSubStore('recipients');

		// Create location suggestion string using room resources of the recipient store
		recipientStore.each(function(recipient) {
			if (recipient.get('display_type_ex') === Zarafa.core.mapi.DisplayTypeEx.DT_ROOM){
				var name = recipient.get('display_name');

				if (!Ext.isEmpty(name)) {
					locations.push(name);
				}
			}
		});

		var locationSuggestion = locations.join('; ');
		var meetingLocation = this.record.get('location');

		// If suggested location and current location is same then no need to set/suggest.
		if(meetingLocation == locationSuggestion) {
			return;
		}

		if(this.hasUserSetLocation === false || Ext.isEmpty(meetingLocation) || meetingLocation.toUpperCase() == locationSuggestion.toUpperCase()) {
			// If user haven't changed location by himself or record's location is empty or
			// it is already suggested location in different case(upper/lower) then set it.
			this.doSetLocation(locationSuggestion);
		} else {
			//If suggested location seems different then ask user whether want to use suggested location or not.
			Ext.MessageBox.show({
				title: _('Kopano WebApp'),
				msg: String.format(_('Do you want to update the location "{0}" with the new location "{1}"?'), Ext.util.Format.htmlEncode(meetingLocation), Ext.util.Format.htmlEncode(locationSuggestion)),
				buttons: Ext.Msg.YESNO,
				icon: Ext.MessageBox.WARNING,
				fn: this.setLocation,
				locationSuggestion: locationSuggestion,
				scope: this
			});
		}
	},

	/**
	 * Function sets location that is suggested to the user if user confirms.
	 * 
	 * @param {String} buttonId The ID of the button pressed, here 'yes' or 'no'
	 * @param {String} text String Value of the input field if either prompt
	 * @param {Object} opt The config object passed to the messagebox.
	 * 
	 * @private
	 */
	setLocation : function(button, text, opt)
	{
		if(button == "yes") {
			this.doSetLocation(opt.locationSuggestion);
		}
	},

	/**
	 * Function sets location which is given as suggestion is passed to the function.
	 * Function also clears {@link hasUserSetLocation} flag as we have overwritten
	 * user changed location with our generated location string so from next time this
	 * should not be considered as user change
	 * @param {String} locationString String value of the location.
	 * 
	 * @private
	 */
	doSetLocation : function(locationString)
	{
		this.record.set('location', locationString);

		// We have automatically changed location, so this flag needs to be cleared.
		this.hasUserSetLocation = false;
	},

	/**
	 * Update the {@link Zarafa.core.data.IPMRecord IPMRecord} with the data from the {@link Ext.Panel Panel}.
	 * @param {Zarafa.core.data.IPMRecord} record The record which has to be updated
	 */
	updateRecord : function(record)
	{
		record.beginEdit();
		this.getForm().updateRecord(record);
		this.updateStartDueDate(record, this.datetimePeriod.getValue());

		/*
		 * When any property with reminder is changed then we need
		 * to update reminder_time and flagdueby aswell, When
		 * 1) flagdueby is changed
		 * 2) reminder minutes is changed
		 * 3) startdate is changed
		 */
		if (record.get('reminder') === true) {
			if(!record.get('flagdueby') || record.isModifiedSinceLastUpdate('reminder_minutes') || record.isModifiedSinceLastUpdate('startdate')) {
				var reminderDate;

				if (record.isRecurring() || record.isRecurringOccurence()) {
					reminderDate = record.get('startdate_recurring');
				}

				if (!reminderDate) {
					reminderDate = record.get('startdate');
				}

				if (Ext.isDate(reminderDate)) {
					record.set('reminder_time', reminderDate.clone());
					record.set('flagdueby', reminderDate.add(Date.MINUTE, -record.get('reminder_minutes')));
				}
			}
		}

		this.onBodyChange(this.editorField.getEditor(), this.editorField.getValue());

		record.endEdit();
	},

	/**
	 * Event handler which is fired when a field has been changed.
	 * This will update the corresponding field inside the {@link Zarafa.core.data.IPMRecord record}.
	 * @param {Ext.form.Field} field The field which has changed
	 * @param {Mixed} newValue The new value for the field
	 * @param {Mixed} oldValue The original value for the field
	 * @private
	 */
	onFieldChange : function(field, newValue, oldValue)
	{
		this.record.set(field.getName(), newValue);
	},

	/**
	 * Event handler which is triggered when one of the Input fields
	 * has been changed by the user. It will validate the new value,
	 * and if correct, will apply it to the {@link Zarafa.core.data.IPMRecord record}.
	 * @param {Ext.form.Field} field The {@link Ext.form.Field field} which was changed.
	 * @param {Mixed} newValue The new value
	 * @param {Mixed} oldValue The old value
	 * @private
	 */
	onBodyChange : function(field, newValue, oldValue)
	{
		var record = this.record;
		var isHtmlEditor = field instanceof Ext.form.HtmlEditor;

		record.beginEdit();
		record.setBody(newValue, isHtmlEditor);
		record.endEdit();
	},

	/**
	 * Event handler which is fired when a combobox selection has changed.
	 * This will update the corresponding field inside the {@link Zarafa.core.data.IPMRecord record}
	 * @param {Ext.form.ComboBox} combo The combobox which was selected
	 * @param {Ext.data.Record} record The selected record
	 * @param {Number} index The index of the selected record
	 * @private
	 */
	onFieldSelect : function(combo, record, index)
	{
		this.record.set(combo.getName(), record.get(combo.valueField));
	},

	/**
	 * Event handler which is fired when the {@link Zarafa.common.ui.DateRangeField} has been changed.
	 * This will update the start and due date inside the {@link #record} accordingly.
	 * @param {Ext.form.Field} field The field which has changed
	 * @param {Mixed} newValue The new value for the field
	 * @param {Mixed} oldValue The original value for the field
	 * @private
	 */
	onDateRangeFieldChange : function(field, newRange, oldRange)
	{
		this.updateStartDueDate(this.record, newRange);
	},

	/**
	 * Update the 'startdate' and 'duedate' in the given record from
	 * the given daterange. When the appointment is an allday event, then
	 * the times are always set to midnight. However when selecting
	 * the duedate the user selects on which day the appointment
	 * ends, so in reality the appointment ends on 00:00 hours on
	 * the following day.
	 * @param {Zarafa.core.data.MAPIRecord} record the Record to update
	 * @param {Zarafa.core.DateRange} daterange the Daterange to apply
	 * @private
	 */
	updateStartDueDate : function(record, daterange)
	{
		var startDate = daterange.getStartDate().clone();
		var dueDate = daterange.getDueDate().clone();

		if (record.get('alldayevent') === true) {
			startDate = startDate.clearTime();
			// Set time to 12:00 when using Date.add(Date.DAY)
			// to prevent problems with DST switches at 00:00
			// (like in Brasil).
			dueDate.setHours(12);
			dueDate = dueDate.add(Date.DAY, 1).clearTime();
		}

		record.beginEdit();
		record.set('startdate', startDate);
		record.set('duedate', dueDate);
		record.set('commonstart', startDate);
		record.set('commonend', dueDate);
		record.set('duration', (dueDate - startDate) / (60 * 1000));
		record.endEdit();
	},

	/**
	 * A function called when the checked value changes for the
	 * reminder checkbox.
	 * @param {Ext.form.Checkbox} checkbox The Checkbox being toggled.
	 * @param {Boolean} checked The new checked state of the checkbox.
	 * @private
	 */
	onToggleReminder : function(checkbox, checked)
	{
		this.record.set('reminder', checked);
	},

	/**
	 * A function called when the checked value changes for the
	 * all day event checkbox.
	 * @param {Ext.form.Checkbox} checkbox The Checkbox being toggled.
	 * @param {Boolean} checked The new checked state of the checkbox.
	 * @private
	 */
	onToggleAllDay : function(checkbox, checked)
	{
		if (this.record.get('alldayevent') !== checked) {
			this.record.beginEdit();
			this.record.set('alldayevent', checked);
			if (checked) {
				this.updateStartDueDate(this.record, this.datetimePeriod.getValue());

				this.record.set('reminder_minutes', container.getSettingsModel().get('zarafa/v1/contexts/calendar/default_allday_reminder_time'));
				this.record.set('busystatus', Zarafa.core.mapi.BusyStatus.FREE);
			} else {
				var zoomLevel = container.getSettingsModel().get('zarafa/v1/contexts/calendar/default_zoom_level');
				var defaultPeriod = container.getSettingsModel().get('zarafa/v1/contexts/calendar/default_appointment_period');

				var startDate = new Date();
				if(this.record.get('startdate')) {
					// use existing date if it is set
					startDate = this.record.get('startdate').clearTime(true);
				}

				startDate = startDate.ceil(Date.MINUTE, zoomLevel);
				var dueDate = startDate.add(Date.MINUTE, defaultPeriod);

				this.record.set('reminder_minutes', container.getSettingsModel().get('zarafa/v1/contexts/calendar/default_reminder_time'));
				this.record.set('busystatus', Zarafa.core.mapi.BusyStatus.BUSY);
				this.record.set('startdate', startDate);
				this.record.set('duedate', dueDate);
				this.record.set('commonstart', startDate);
				this.record.set('commonend', dueDate);
				this.record.set('duration', (dueDate - startDate) / (60 * 1000));
			}
			this.record.endEdit();
		}
	},
	
	/**
	 * Function will open AddressBook dialog to add attendees
	 * @private
	 */
	showRecipientContent : function()
	{
		Zarafa.calendar.Actions.openRecipientSelectionContent(this.record, { defaultRecipientType : Zarafa.core.mapi.RecipientType.MAPI_TO });
	},

	/**
	 * Function will update the {@link #extraInfoPanel} with extra information that should be shown 
	 * for the meeting item.
	 * @private
	 */
	updateExtraInfoPanel : function()
	{
		// clear the previous contents
		var el = this.extraInfoPanel.getEl();
		if(Ext.isDefined(el.dom)) {
			el.dom.innerHTML = '';
		}

		var visible = this.setOldAppointmentInfo(el);

		if(this.record.isRecurringOccurence()){
			visible = (this.setRecurrencePatternInfo(el) === true) ? true : visible;
		}

		if(this.record.isMeeting()) {
			if(!this.record.phantom) {
				if (this.record.isMeetingOrganized()) {
					// set information for organizer
					if (!this.record.isMeetingSent()) {
						visible = (this.setMeetingUnsentInfo(el) === true) ? true : visible;
					} else {
						visible = (this.setMeetingResponseInfo(el) === true) ? true : visible;
					}
				} else {
					var responseStatus = this.record.get('responsestatus');

					if(responseStatus !== Zarafa.core.mapi.ResponseStatus.RESPONSE_NONE) {
						this.setOrganizerInfo();
						visible = (this.setMeetingOverwrittenInfo(el) === true) ? true : visible;
					}

					if (this.record.isMeetingCanceled()) {
						// set information for canceled meeting in attendee's calendar
						visible = (this.setMeetingCanceledInfo(el) === true) ? true : visible;
					} else if (this.record.isMeetingResponseRequired()) {
						// set information for attendees
						visible = (this.setReplyTimeInfo(responseStatus, el) === true) ? true : visible;
					}
				}
			}
		}

		this.extraInfoPanel.setVisible(visible);
		this.doLayout();
	},

	/**
	 * Function will display message regarding response's from attendee(s) in the dialog
	 * thus will update the status of attendee(s) to meeting organizer
	 * @param {HtmlElement} HTML element
	 * @return Boolean true if new component is added in {@link #extraInfoPanel} else false.
	 * @private
	 */
	setMeetingResponseInfo : function(el)
	{
		// check for meeting items which are not sent yet
		if(this.record.isMeetingSent()) {
			return false;
		}

		var accepted = 0, tentative = 0, declined = 0, numProposingAttendees = 0;
		var recipientStore = this.record.getRecipientStore();

		recipientStore.each(
			function (recipient) {
				switch(recipient.get('recipient_trackstatus'))
				{
					case Zarafa.core.mapi.RecipientTrackStatus.RECIPIENT_TRACKSTATUS_TENTATIVE: // tentative
						tentative++;
						break;
					case Zarafa.core.mapi.RecipientTrackStatus.RECIPIENT_TRACKSTATUS_ACCEPTED: //accepted
						accepted++;
						break;
					case Zarafa.core.mapi.RecipientTrackStatus.RECIPIENT_TRACKSTATUS_DECLINED: //decline
						declined++;
						break;
				}

				if(recipient.get('proposednewtime')) {
					numProposingAttendees++;
				}
			}, this);

		if(accepted !== 0 || tentative !== 0 || declined !== 0) {
			// set response string
			var trackString = String.format(this.trackingInfoString, accepted, tentative, declined);
			el.createChild({tag: 'div', html: trackString});

			if(this.record.get('counter_proposal') && numProposingAttendees !== 0) {
				var proposeString = String.format(this.proposedTimeInfoString, numProposingAttendees);
				el.createChild({tag: 'div', html: proposeString});
			}
		} else {
			// set no response string
			el.createChild({tag: 'div', html: this.noResponseReceivedString });
		}

		return true;
	},
	
	/**
	 * Function will display message regarding request accepted time for an attendee
	 * @param {Zarafa.core.mapi.ResponseStatus} responseStatus for the meeting
	 * @param {HtmlElement} HTML element
	 * @return Boolean true if new component is added in {@link #extraInfoPanel} else false.
	 * @private
	 */
	setReplyTimeInfo : function(responseStatus,el)
	{
		var responseString = '';
		var replyTime = this.record.get('reply_time');
		var replyName = this.record.get('reply_name');
		var dueDate = this.record.get('duedate');

		if(responseStatus !== Zarafa.core.mapi.ResponseStatus.RESPONSE_NOT_RESPONDED) {
			// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
			replyTime = Ext.isDate(replyTime) ? replyTime.format(_('jS F Y G:i')) : _('None');
		
			if(this.record.get('counter_proposal')) {
				if(!Ext.isEmpty(replyName)) {
					responseString = String.format(this.proposeNewTimeDelegateInfoString, replyName, replyTime);
				} else {
					responseString = String.format(this.proposeNewTimeInfoString, replyTime);
				}
			} else {
				switch(responseStatus) {
					case Zarafa.core.mapi.ResponseStatus.RESPONSE_ACCEPTED :
						if(!Ext.isEmpty(replyName)) {
							responseString = String.format(this.acceptedDelegateInfoString, replyName, replyTime);
						} else {
							responseString = String.format(this.acceptedInfoString, replyTime);
						}
						break;
					case Zarafa.core.mapi.ResponseStatus.RESPONSE_TENTATIVE :
						if(!Ext.isEmpty(replyName)) {
							responseString = String.format(this.tentativeDelegateInfoString, replyName, replyTime);
						} else {
							responseString = String.format(this.tentativeInfoString, replyTime);
						}
						break;
				}
			}
		} else {
			// Meeting is in future, but not replied yet
			if(Ext.isDate(dueDate) && dueDate.getTime() >= (new Date().getTime())) {
				responseString = this.responseRequiredString;
			}
		}
		
		if(!Ext.isEmpty(responseString)) {
			el.createChild({tag: 'div', html: responseString});
			return true;
		}
		
		return false;
	},

	/**
	 * Function will set information string to show that appointment occurs in past.
	 * @param {HtmlElement} HTML element
	 * @return Boolean true if new component is added in {@link #extraInfoPanel} else false.
	 * @private
	 */
	setOldAppointmentInfo : function(el)
	{
		if(this.record.isAppointmentInPast()) {
			el.createChild({tag: 'div', html: this.elapsedTimeInfoString});

			return true;
		}

		return false;
	},

	/**
	 * Function will add information regarding organizer of the meeting.
	 * @private
	 */
	setOrganizerInfo : function()
	{
		this.meetingOrganizerField.setValue(this.record.getSenderString());
	},

	/**
	 * Function will set information string to show that meeting is canceled in the attendee's calendar.
	 * @param {HtmlElement} HTML element
	 * @return Boolean true if new component is added in {@link #extraInfoPanel} else false.
	 * @private
	 */
	setMeetingCanceledInfo : function(el)
	{
		el.createChild({tag: 'div', html: this.meetingCanceledString});
		return true;
	},

	/**
	 * Function will set information string to show that meeting invites have not yet been sent.
	 * @param {HtmlElement} HTML element
	 * @return Boolean true if new component is added in {@link #extraInfoPanel} else false.
	 * @private
	 */
	setMeetingUnsentInfo : function(el)
	{
		el.createChild({tag : 'div', html: this.meetingUnsentString});
		return true;
	},

	/**
	 * Function will set the information string to show that changes made by attendee will
	 * be overwritten when the meeting request is updated by the organizer.
	 * @param {HtmlElement} HTML element
	 * @return Boolean true if new component is added in {@link #extraInfoPanel} else false.
	 * @private
	 */
	setMeetingOverwrittenInfo : function(el)
	{
		el.createChild({tag : 'div', html: this.meetingOverwrittenString});
		return true;
	},

	/**
	 * Function will set information string to show the recurring pattern the occurrence is part of.
	 * @param {HtmlElement} HTML element
	 * @return Boolean true if new component is added in {@link #extraInfoPanel} else false.
	 * @private
	 */
	setRecurrencePatternInfo: function(el)
	{
		el.createChild({tag: 'div', html: Ext.util.Format.htmlEncode(this.record.get('recurring_pattern'))});
		return true;
	}
});

Ext.reg('zarafa.appointmenttab', Zarafa.calendar.dialogs.AppointmentTab);
