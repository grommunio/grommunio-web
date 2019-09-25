Ext.namespace('Zarafa.calendar.dialogs');

/**
 * @class Zarafa.calendar.dialogs.AppointmentContentPanel
 * @extends Zarafa.core.ui.MessageContentPanel
 * @xtype zarafa.appointmentcontentpanel
 */
Zarafa.calendar.dialogs.AppointmentContentPanel = Ext.extend(Zarafa.core.ui.MessageContentPanel, {
	/**
	 * @cfg {Object} newAppointmentProps The object containing all properties which must be applied
	 * to the {@link #record} when it has been opened. These properties will be applied during {@link #update}.
	 */
	newAppointmentProps : undefined,

	/**
	 * @cfg {Number} activeTab number, the tab which should be active in {Zarafa.calendar.dialogs.AppointmentPanel tabs}
	 * 0 opens Appointment tab{@link Zarafa.calendar.dialogs.AppointmentTab}, this is defaultValue, we also want this tab when we accept any proposed time from attendee,
	 * 1 opens Freebusy tab{@link Zarafa.calendar.dialogs.FreebusyTab}, we want this tab to be opened when we view all propsed time from Attendees
	 * 2 opens Tracking tab{@link Zarafa.calendar.dialogs.TrackingTab}
	 */
	activeTab : undefined,

	/**
	 * True if record properties were changed. This is updated in {@link #onUpdateRecord},
	 * and used in {@link #validateBusyRecipients} to determine if a message should be send
	 * to all attendees or not.
	 * @property
	 * @type Boolean
	 * @private
	 */
	isPropertyChanged : false,

	/**
	 * True if record attendees were changed. This is updated in {@link #onUpdateRecord},
	 * and used in {@link #validateBusyRecipients} to determine if a message should be send
	 * to all attendees or not.
	 * @property
	 * @type Boolean
	 * @private
	 */
	isRecipientChanged : false,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		// Add in some standard configuration data.
		config = config || {};

		if (Ext.isDefined(config.activeTab)) {
			this.activeTab = config.activeTab;
		}

		Ext.applyIf(config, {
			// Override from Ext.Component
			xtype : 'zarafa.appointmentcontentpanel',
			// Override from Ext.Component
			layout : 'fit',
			cls: 'k-apptcreatepanel',
			recordComponentPluginConfig : Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite : true
			}),
			// Override from Zarafa.core.ui.RecordContentPanel
			title : _('Appointment'),
			confirmClose : true,
			items: [{
				xtype: 'zarafa.appointmentpanel',
				activeTab : this.activeTab,
				tbar: {
					xtype: 'zarafa.appointmenttoolbar'
				}
			}]
		});

		// Call parent constructor
		Zarafa.calendar.dialogs.AppointmentContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Create and initialize the {@link #sendValidationQueue}. This will add various
	 * validation steps which must be executed to determine if the message can be send.
	 * @protected
	 */
	createSendValidationQueue : function()
	{
		Zarafa.calendar.dialogs.AppointmentContentPanel.superclass.createSendValidationQueue.apply(this, arguments);

		// Add a validation step when a meeting will be send,
		// it should check if only recipients were changed or not.
		// And ask if the user wants to send an update to all recipients.
		this.sendValidationQueue.add(this.validateSendUpdateToRecipients, this);

		// Add a validation step when a meeting will be send,
		// it should check if one of the recipients is busy
		this.sendValidationQueue.add(this.validateBusyRecipients, this);
	},

	/**
	 * Update the components with the given record.
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The record to update in this component
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
		this.updateTitleFromRecord(record, contentReset);
		if(contentReset){
			this.updateIconFromRecord(record);
		}

		if (record.isOpened()) {
			if (contentReset || record.isModifiedSinceLastUpdate('meeting')) {
				record.updateMeetingRecipients();

				switch (record.get('meeting')) {
					case Zarafa.core.mapi.MeetingStatus.MEETING:
						if(!Ext.isDefined(this.initialConfig.closeOnSave)) {
							this.closeOnSave = false;
						}
						if(!Ext.isDefined(this.initialConfig.closeOnSend)) {
							this.closeOnSend = true;
						}
						break;
					case Zarafa.core.mapi.MeetingStatus.MEETING_RECEIVED:
						if(!Ext.isDefined(this.initialConfig.closeOnSave)) {
							this.closeOnSave = true;
						}
						if(!Ext.isDefined(this.initialConfig.closeOnSend)) {
							this.closeOnSend = true;
						}
						break;
					case Zarafa.core.mapi.MeetingStatus.NONMEETING:
					/* falls through */
					default:
						if(!Ext.isDefined(this.initialConfig.closeOnSave)) {
							this.closeOnSave = true;
						}
						if(!Ext.isDefined(this.initialConfig.closeOnSend)) {
							this.closeOnSend = false;
						}
						break;
				}
			}

			// we need to set these properties only when record is opened
			// so server response will not overwrite these properties
			if (this.newAppointmentProps) {
				record.beginEdit();

				Ext.iterate(this.newAppointmentProps, record.set, record);

				// After applying these properties should be deleted
				// to prevent them from being reapplied.
				delete this.newAppointmentProps;

				record.endEdit();
			}

			var recipientStore = record.getSubStore('recipients');
			if (recipientStore && record.isMeetingOrganized()) {
				this.mon(recipientStore, 'resolved', this.setRecipientTypeOnResolve, this);
			}
		}
	},

	/**
	 * Update this panel's icon class from the record that it contains
	 * First obtains the icon class from a mapping, then calls {@link #setIcon}
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The record bound to this component
	 * @private
	 */
	updateIconFromRecord : function(record)
	{
		//TODO: create a new icon mapping for tabs
		var iconCls = Zarafa.common.ui.IconClass.getIconClass(record);
		this.setIcon(iconCls);
	},

	/**
	 * When record has been updated, title also has to be - for instance if we have the subject
	 * in the title and the subject changes
	 * Calls {@link #setTitle} this.setTitle in order to update
	 * @param {Zarafa.core.data.MAPIRecord} record The record that has been updated
	 */
	updateTitleFromRecord : function(record)
	{
		var subject = record.get('subject');
		if(!Ext.isEmpty(subject)){
			this.setTitle(subject);
		} else {
			if(record.get('meeting') == Zarafa.core.mapi.MeetingStatus.NONMEETING){
				this.setTitle(this.initialConfig.title);
			} else {
				this.setTitle(_('Meeting'));
			}
		}
	},

	/**
	 * Function is used to automatically set recipient_type property value to
	 * {@link Zarafa.core.mapi.RecipientType#MAPI_BCC} to mark it as a resource if it is a room or equipment.
	 * This can be chekced by using display_type and display_type_ex properties. This function is called when
	 * {@link Zarafa.core.data.IPMRecipientStore IPMRecipientStore} fires 'resolved' event.
	 * @param {Zarafa.core.data.IPMRecipientStore} store store which fired the 'resolved' event.
	 * @param {Zarafa.core.data.IPMRecipientRecord[]} records records which are in the response of resolve request.
	 */
	setRecipientTypeOnResolve : function(store, records)
	{
		for(var index = 0; index < records.length; index++) {
			var record = records[index];
			var displayTypeEx = record.get('display_type_ex');

			/**
			 * user type --> PR_DISPLAY_TYPE_EX value
			 * active user --> DT_MAILUSER | DTE_FLAG_ACL_CAPABLE
			 * non-active user --> DT_MAILUSER
			 * room --> DT_ROOM
			 * equipment --> DT_EQUIPMENT
			 * contact --> DT_REMOTE_MAILUSER
			 */
			switch (displayTypeEx) {
				case Zarafa.core.mapi.DisplayTypeEx.DT_EQUIPMENT:
				case Zarafa.core.mapi.DisplayTypeEx.DT_ROOM:
					record.set('recipient_type', Zarafa.core.mapi.RecipientType.MAPI_BCC);
					break;
			}
		}
	},

	/**
	 * Fired when the {@link #updaterecord} event has been fired. If {@link #showSavingMask} is enabled,
	 * this will display the {@link #savingText} to indicate the saving is in progress.
	 *
	 * @param {Zarafa.core.ui.RecordContentPanel} contentpanel The record which fired the event
	 * @param {String} action write Action that ocurred. Can be one of
	 * {@link Ext.data.Record.EDIT EDIT}, {@link Ext.data.Record.REJECT REJECT} or
	 * {@link Ext.data.Record.COMMIT COMMIT}
	 * @param {Zarafa.core.data.IPMRecord} record The record which was updated
	 * @private
	 * @overridden
	 */
	onUpdateRecord : function(contentpanel, action, record)
	{
		if (action === Ext.data.Record.COMMIT) {
			// If the record is a meeting request that has been sent successfully and contains resources
			// then we have to notify the user of the successfullness of the action.
			if(record.isMeetingOrganized() && this.isSending === true) {
				if(record.getRecipientStore().findExact('recipient_type', Zarafa.core.mapi.RecipientType.MAPI_BCC) !== -1){
					// If the server lets the client now the appointment has been booked (resources) then notify the user.
					if(record.getActionResponse('resources_booked')){
						container.getNotifier().notify('info.meeting', pgettext('calendar.dialog', 'Resources have been planned'));
					}
				}
			}

			// Reset the trackers for record modifications
			this.isPropertyChanged = false;
			this.isRecipientChanged = false;
		} else {
			// Determine which changes were made to the record,
			// we need this for validateSendUpdateToRecipients() which
			// needs to differentiate between changes made to only recipients
			// or properties.
			if (record.updateModifications && Object.keys(record.updateModifications).length > 0) {
				this.isPropertyChanged = true;
			}
			if (record.updateSubStoreModifications) {
				if (record.updateSubStoreModifications.recipients) {
					// If recipients object is present, recipients have changed.
					this.isRecipientChanged = true;
				} else if(record.updateSubStoreModifications.attachments) {
					// if attachment object is present, attachment have changed.
					this.isPropertyChanged = true;
				}

				// Recipient and another substore might have changed...
				if (Object.keys(record.updateSubStoreModifications).length > 1) {
					this.isPropertyChanged = true;
				}
			}
		}


		Zarafa.calendar.dialogs.AppointmentContentPanel.superclass.onUpdateRecord.apply(this, arguments);
	},

	/**
	 * Save all changes made to the {@link #record} to the server.
	 * @param {Boolean} storeSave (optional) False to only update the record,
	 * but not save the changes to the store.
	 * @return {Boolean} false if the record could not be saved
	 * @protected
	 */
	saveRecord : function(storeSave)
	{
		// Before saving a meeting request, check if the attendees were already
		// invited. If they are, then we _must_ send a meeting update to those
		// attendees. If the organizer doesn't want that, we will not save
		// anything. Inform the user about this!
		//
		// TODO:also need to add check for any modification/changes in record data,
		// so that send is only done when there is any change in the data by the organizer
		var record = this.record;

		if (record.isMeetingSent() && !record.isAppointmentInPast() && record.getMessageAction('send') !== true) {

			 if (!this.isOnlyOrganizerPropertiesChanged(record)) {

				// Determine if organizer related properties were only changed
				// then no need to send message to all attendees
				Ext.MessageBox.show({
					title: _('Send update'),
					msg: _('An update message will be sent to all recipients, do you wish to continue?'),
					cls: Ext.MessageBox.WARNING_CLS,
					fn: this.sendMeetingUpdate,
					scope: this,
					buttons: Ext.MessageBox.YESNO
				});
				// The user is confronted with a messagebox, lets not yet
				// save the appointment be wait for his answer.
				return;
			} else if(this.isRecipientChanged){
				// Inform the user about the update must be send to only the added and removed attendees or to everybody.
				// so,that send is only done when there is any change in attendees only.

				this.sendRecord();
				return;
			}
		}

		return Zarafa.calendar.dialogs.AppointmentContentPanel.superclass.saveRecord.apply(this, arguments);
	},

	/**
	 * Save all changes made to the {@link #record} and send
	 * the message to the specified recipients.
	 */
	sendRecord : function()
	{
		if(!this.record.isMeeting()) {
			// can not send a non meeting record
			return;
		}

		return Zarafa.calendar.dialogs.AppointmentContentPanel.superclass.sendRecord.apply(this, arguments);
	},

	/**
	 * Callback function from {@link Ext.MessageBox#show} which checks if the
	 * organizer wants to send an update to the attendees regarding the changes in meeting item
	 * If yes then send update to the attendees regarding the changes and
	 * If No then save changes without sending update to attendees.
	 * @param {String} button button text which was pressed.
	 * @private
	 */
	sendMeetingUpdate : function(button)
	{
		if (button == 'yes') {
			// The user wants to send the record
			this.sendRecord();
		}
	},

	/**
	 * Validation function for the {@link #sendValidationQueue} to check if the Meeting
	 * can be send to the attendees.
	 *
	 * This checks if the meeting has been sent to the attendees before, and will ask the user
	 * if the update must be send to only the added and removed attendees or to everybody.
	 *
	 * @param {Function} callback The callback to call to continue in the queue
	 * @private
	 */
	validateSendUpdateToRecipients : function(callback)
	{
		if (this.record.get('request_sent') && !this.isPropertyChanged && this.isRecipientChanged) {
			Zarafa.common.dialogs.MessageBox.select(
				_('Send update to attendees'),
				_('You have made changes to the list of attendees, Choose one of the following') + ':',
				function(button, radio) {
					if (button === 'ok') {
						if (radio.id == 'sendModified') {
							this.record.addMessageAction('send_update', 'modified');
						} else {
							this.record.addMessageAction('send_update', 'all');
						}
						callback(true);
					} else {
						callback(false);
					}
				}, this,
				[{
					boxLabel: _('Send updates to only added or deleted attendees.'),
					id : 'sendModified',
					name: 'select',
					checked: true
				},{
					boxLabel: _('Send updates to all attendees.'),
					id : 'sendAll',
					name: 'select'
				}]
			);
		} else {
			callback(true);
		}
	},

	/**
	 * Validation function for the {@link #sendValidationQueue} to check if the Meeting
	 * can be send to the attendees.
	 *
	 * This validates if all attendees which were added into the FreebusyPanel
	 * are all available during the given start and duedate.
	 *
	 * @param {Function} callback The callback to call to continue in the queue
	 * @private
	 */
	validateBusyRecipients : function(callback)
	{
		var freebusyPanel = this.findByType('zarafa.freebusypanel')[0];
		var record = this.record;
		var busy = false;

		if (freebusyPanel) {
			busy = freebusyPanel.getModel().checkAttendeesBusyStatus(record.get('startdate'), record.get('duedate'), record.get('request_sent'));
		}

		if (busy) {
			Ext.MessageBox.show({
				title: _('Busy attendees'),
				msg: _('One or more attendees are busy. Are you sure to invite?'),
				buttons: Ext.MessageBox.YESNO,
				fn: function (buttonClicked) {
					// If the user pressed "yes" we can continue with the validation
					// If not, sending will be stopped.
					callback(buttonClicked == 'yes');
				},
				scope: this
			});
		} else {
			// The freebusy panel couldn't be found,
			// lets not make this block sending the meeting request.
			callback(true);
		}
	},

	/**
	 * Function which is use to determine that only organizer related properties of record were changed.
	 * Some set of properties like label,body,categories,etc.
	 * if those properties were only changed then no need to send message to all attendees
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record which was updated
	 * @returns {boolean} true if only organizer related properties changed, false otherwise
     */
	isOnlyOrganizerPropertiesChanged: function (record)
	{
		var isOrganizerPropertiesChanged = true;
		var organizerProperties = ['body' ,'html_body' , 'categories' , 'label' , 'busystatus', 'private', 'reminder', 'isHTML', 'sensitivity','importance','hasattach','attach_num','flagdueby','reminder_minutes'];
		Ext.iterate(record.modified, function (property) {
			if (organizerProperties.indexOf(property) < 0 && record.data[property] != record.modified[property]) {
				isOrganizerPropertiesChanged = false;
				return false;
			}
		});
		if(isOrganizerPropertiesChanged){
			// we need this for validateSendUpdateToRecipients() which
			// needs to differentiate between changes made to only organizer related properties

			this.isPropertyChanged = false;
		}
		return isOrganizerPropertiesChanged;
	}
});

Ext.reg('zarafa.appointmentcontentpanel', Zarafa.calendar.dialogs.AppointmentContentPanel);
