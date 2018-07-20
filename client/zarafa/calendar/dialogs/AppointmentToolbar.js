Ext.namespace('Zarafa.calendar.dialogs');

/**
 * @class Zarafa.calendar.dialogs.AppointmentToolbar
 * @extends Zarafa.core.ui.ContentPanelToolbar
 * @xtype zarafa.appointmenttoolbar
 */
Zarafa.calendar.dialogs.AppointmentToolbar = Ext.extend(Zarafa.core.ui.ContentPanelToolbar, {
	// Insertion points for this class, insertion points are registered in {Zarafa.core.ui.Toolbar}
	/**
	 * @insert context.calendar.appointmentcontentpanel.toolbar.actions
	 * Insertion point for the Actions buttons in the Appointment ContentPanel Toolbar
	 * @param {Zarafa.calendar.dialogs.AppointmentToolbar} toolbar This toolbar
	 */
	/**
	 * @insert context.calendar.appointmentcontentpanel.toolbar.options
	 * Insertion point for the Options button in the Appointment Content Panel Toolbar
	 * @param {Zarafa.calendar.dialogs.AppointmentToolbar} toolbar This toolbar
	 */

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		Ext.applyIf(config, {
			insertionPointBase: 'context.calendar.appointmentcontentpanel',
			actionItems: this.createActionButtons(),
			optionItems: this.createOptionButtons()
		});

		Zarafa.calendar.dialogs.AppointmentToolbar.superclass.constructor.call(this, config);
		this.mon(this.saveMeeting,'beforeshow',this.onSaveButtonBeforeShow,this);
	},

	/**
	 * Create all buttons which should be added by default the the `Actions` buttons.
	 * These buttons are used to send, save and add attachments to the message. And it contains
	 * also buttons to check the recipient names or add a signature.
	 *
	 * @return {Array} The {@link Ext.Button Button} elements which should be added
	 * in the Actions section of the {@link Ext.Toolbar Toolbar}.
	 * @private
	 */
	createActionButtons : function()
	{
		return [{
			xtype : 'zarafa.meetingrequestbuttons'
		},{
			xtype: 'button',
			overflowText: _('Send'),
			text: _('Send'),
			tooltip: _('Send') + ' (Ctrl + Enter)',
			iconCls : 'icon_send_white',
			cls: 'button_sendMail zarafa-action',
			ref: 'sendInvitation',
			handler: this.onSendButton,
			scope: this
		},{
			xtype: 'button',
			text : _('Save')+' & '+_('Close'),
			overflowText: _('Save')+' & '+_('Close'),
			tooltip: _('Save')+' & '+_('Close') + ' (Ctrl + S)',
			cls : 'zarafa-action',
			iconCls : 'icon_save_white',
			ref : 'saveAppointment',
			handler: this.onSaveButton,
			scope: this
		},{
			xtype: 'button',
			overflowText: _('Save'),
			tooltip: _('Save') + ' (Ctrl + S)',
			cls: 'tb-calendar-btn-save',
			iconCls: 'icon_floppy',
			ref : 'saveMeeting',
			handler: this.onSaveButton,
			scope: this
		},{
			xtype: 'button',
			overflowText: _('Delete'),
			tooltip: _('Delete'),
			cls: 'tb-calendar-btn-delete',
			iconCls: 'icon_delete',
			ref: 'deleteAppointment',
			handler: this.onDeleteButton,
			scope: this
		},{
			xtype: 'zarafa.attachmentbutton',
			plugins : [ 'zarafa.recordcomponentupdaterplugin' ],
			ref: 'normalAttachmentsButton', // FIXME: Remove after WA-4880 is implemented
			overflowText: _('Add attachment'),
			tooltip: _('Add attachment'),
			cls: 'tb-calendar-btn-add-attachment',
			iconCls : 'icon_paperclip',
			// Add a listener to the component added event to set use the correct update function when the toolbar overflows
			// (i.e. is too wide for the panel) and Ext moves the button to a menuitem.
			listeners : {
				added : this.onAttachmentButtonAdded,
				scope : this
			}
		},{
			// FIXME: Remove after WA-4880 is implemented
			xtype: 'button',
			disabled: true,
			ref: 'occurenceAttachmentsButton',
			overflowText: _('Add attachment'),
			tooltip: _('Attachments cannot be modified for a single occurence'),
			cls: 'tb-calendar-btn-occurence-attachment',
			iconCls: 'icon_paperclip'
		},{
			xtype: 'button',
			overflowText: _('Print'),
			tooltip: _('Print'),
			cls: 'tb-calendar-btn-print',
			iconCls: 'icon_print',
			handler: function() {
				Zarafa.common.Actions.openPrintDialog(this.record);
			},
			scope: this
		},{
			xtype: 'button',
			overflowText: _('Check names'),
			tooltip: _('Check names'),
			cls: 'tb-calendar-btn-checknames',
			iconCls: 'icon_checknames',
			ref: 'checkNames',
			handler: this.onCheckNamesButton,
			scope: this
		}];
	},

	/**
	 * Event listener for the added event of the {@link Zarafa.common.attachment.ui.AttachmentButton attachmentButton}
	 * Adds the update function to the item when Ext converts the button to a menu item
	 * (which happens when the toolbar overflows, i.e. is too wide for the containing panel)
	 *
	 * @param {Ext.Component} item The item that was added. This can be a {@link Zarafa.common.attachment.ui.AttachmentButton}
	 * or a {@link Ext.menu.Item}
	 */
	onAttachmentButtonAdded : function(item)
	{
		if ( item.isXType('menuitem') ){
			// Set the update function to the update function of the original button
			// otherwise the Ext.Component.update function would be called by the recordcomponentupdaterplugin
			item.update = Zarafa.common.attachment.ui.AttachmentButton.prototype.update.createDelegate(this.normalAttachmentsButton);
		}
	},

	/**
	 * Create all buttons which should be added by default the the `Options` buttons.
	 * This contains the buttons to set the message options like priority and read receipt.
	 *
	 * @return {Array} The {@link Ext.Button Button} elements which should be
	 * added in the Options section of the {@link Ext.Toolbar Toolbar}.
	 * @private
	 */
	createOptionButtons : function()
	{
		return [{
			xtype: 'button',
			text: _('Recurrence'),
			overflowText: _('Recurrence'),
			cls: 'tb-calendar-btn-recurrence',
			iconCls: 'icon_recurrence',
			ref: 'recurrence',
			handler: this.onSetRecurrence,
			scope: this
		},{
			xtype: 'button',
			text: _('Invite attendees'),
			overflowText: _('Invite attendees'),
			cls: 'tb-calendar-btn-ivite-attendees',
			iconCls: 'icon_invite_attendees',
			ref: 'inviteAttendees',
			handler: this.onSetMeetingRequest,
			scope: this
		},{
			xtype: 'button',
			text: _('Cancel invitation'),
			overflowText: _('Cancel invitation'),
			cls: 'tb-calendar-btn-cancel',
			iconCls: 'icon_calendar_appt_cancelled',
			ref: 'cancelInvitation',
			handler: this.onCancelMeetingRequest,
			scope: this
		},{
			xtype: 'button',
			overflowText: _('High priority'),
			tooltip: _('Mark this appointment as high priority'),
			cls: 'tb-calendar-btn-high-priority',
			iconCls: 'icon_priority_high',
			ref: 'highPriority',
			toggleGroup: 'priorityGroup',
			importance: Zarafa.core.mapi.Importance.URGENT,
			enableToggle : true,
			toggleHandler: this.onPriorityGroupToggle,
			scope: this
		},{
			xtype: 'button',
			overflowText: _('Low priority'),
			tooltip: _('Mark this appointment as low priority'),
			cls: 'tb-calendar-btn-low-priority',
			iconCls: 'icon_priority_low',
			ref: 'lowPriority',
			toggleGroup: 'priorityGroup',
			importance: Zarafa.core.mapi.Importance.NONURGENT,
			enableToggle : true,
			toggleHandler: this.onPriorityGroupToggle,
			scope: this
		},{
			xtype: 'button',
			overflowText: _('Categories'),
			tooltip: _('Open the categories dialog'),
			cls: 'tb-calendar-btn-categories',
			iconCls: 'icon_categories',
			handler: this.onCategories,
			scope: this
		},{
			xtype: 'button',
			overflowText: _('Private'),
			tooltip: _('Mark this appointment as private'),
			cls: 'tb-calendar-btn-private',
			iconCls: 'icon_private',
			ref: 'setPrivate',
			enableToggle : true,
			toggleHandler: this.onPrivateGroupToggle,
			scope: this
		}];
	},

	/**
	 * Event handler which is called when the "Recurrence" button has been pressed.
	 * This will open the {@link Zarafa.common.recurrence.dialogs.RecurrenceContentPanel RecurrenceContentPanel}.
	 * @private
	 */
	onSetRecurrence : function()
	{
		Zarafa.common.Actions.openRecurrenceContent(this.record, { autoSave : false });
	},

	/**
	 * Event handler which is called when the "Invite Attendees" button has
	 * been pressed. This will update the "meeting" state of the record which
	 * will trigger the update of all UI components.
	 * @private
	 */
	onSetMeetingRequest : function()
	{
		this.record.convertToMeeting();
	},

	/**
	 * Event handler which is called when the "Cancel invitation" button has
	 * been pressed. This will update the "meeting" state of the record which
	 * will trigger the update of all UI components.
	 * @private
	 */
	onCancelMeetingRequest : function()
	{
		if (this.record.isMeetingSent()) {
			if (this.record.isAppointmentInPast()) {
				this.dialog.deleteRecord();
			} else {
				Zarafa.calendar.Actions.openSendCancellationContent(this.record);
			}
		} else {
			this.record.convertToAppointment();
		}
	},

	/**
	 * Event handler which is called when one of the PriorityGroup buttons
	 * have been toggled. If this is the case, the importance is updated,
	 * if the button is untoggled, then all buttons in the prioritygroup
	 * are untoggled and the normal importance is applied. Otherwise the
	 * importance which belongs to the button is applied.
	 *
	 * @param {Ext.Button} button The button from the PriorityGroup which was pressed
	 * @private
	 */
	onPriorityGroupToggle : function(button)
	{
		if (button.pressed) {
			this.record.set('importance', button.importance);
		} else {
			this.record.set('importance', Zarafa.core.mapi.Importance.NORMAL);
		}
	},

	/**
	 * Event handler which is called when the user pressed the 'Categories' button.
	 * This will open the {@link Zarafa.common.categories.dialogs.CategoriesContentPanel CategoriesContentPanel}.
	 * @private
	 */
	onCategories : function()
	{
		Zarafa.common.Actions.openCategoriesContent(this.record, {autoSave : false});
	},

	/**
	 * Event handler which is called when the PrivateGroup button
	 * has been toggled. If this is the case 'private' is updated.
	 *
	 * @param {Ext.Button} button The button which was toggled
	 * @private
	 */
	onPrivateGroupToggle : function(button)
	{
		this.record.beginEdit();
		this.record.set('private', button.pressed);
		if (button.pressed) {
			this.record.set('sensitivity', Zarafa.core.mapi.Sensitivity['PRIVATE']);
		} else {
			this.record.set('sensitivity', Zarafa.core.mapi.Sensitivity['NONE']);
		}
		this.record.endEdit();
	},

	/**
	 * Event handler when the "Check Names" button has been pressed.
	 * This will {@link Zarafa.core.data.IPMRecipient#resolve resolve} all recipients.
	 *
	 * @param {Ext.Button} button The button which has been pressed
	 * @private
	 */
	onCheckNamesButton : function(button)
	{
		this.record.getRecipientStore().resolve(undefined, { cancelPreviousRequest : true });
	},

	/**
	 * Event handler when the "Send" button has been pressed.
	 * This will {@link Zarafa.core.data.MessageContentPanel#sendRecord send} the given record.
	 *
	 * @param {Ext.Button} button The button which has been pressed
	 * @private
	 */
	onSendButton : function(button)
	{
		this.dialog.sendRecord();
	},

	/**
	 * Event handler when the "Save" button has been pressed.
	 * This will {@link Zarafa.core.data.RecordContentPanel#saveRecord save} the given record.
	 * it also checks whether the meesage is a meeting, and iff to will send the changes to attendees aswell
	 * @param {Ext.Button} button The button which has been pressed
	 * @private
	 */
	onSaveButton : function(button)
	{
		this.dialog.saveRecord();
	},

	/**
	 * Event handler when the "Delete" button has been pressed.
	 * This will {@link Zarafa.core.data.RecordContentPanel#deleteRecord delete} the given record.
	 *
	 * @param {Ext.Button} button The button which has been pressed
	 * @private
	 */
	onDeleteButton : function(button)
	{
		this.dialog.deleteRecord();
	},


	/**
	 * Event handler which called when the 'Save' button is ready to show.
	 * This will update the tooltip if the record is received meeting request
	 * @param {Ext.Button} button The button which has been pressed
	*/
	onSaveButtonBeforeShow : function(button)
	{
		if(this.record.isMeetingReceived()) {
			button.setTooltip(_('Save') + ' (Ctrl + S)');
		}
	},

	/**
	 * Updates the toolbar by updating the Toolbar buttons based on the settings
	 * from the {@link Zarafa.core.data.IPMRecord record}.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record update the panel with.
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
		var layout = false;

		this.record = record;

		if(record.isSubMessage()) {
			// hide all buttons which is used to save changes
			this.sendInvitation.setVisible(false);
			this.saveAppointment.setVisible(false);
			this.saveMeeting.setVisible(false);
			this.checkNames.setVisible(false);
			this.deleteAppointment.setVisible(false);
			this.inviteAttendees.setVisible(false);
			this.cancelInvitation.setVisible(false);
			this.setPrivate.setVisible(false);
			this.highPriority.setVisible(false);
			this.lowPriority.setVisible(false);

			layout = true;
		} else {
			this.setPrivate.setVisible(true);
			this.highPriority.setVisible(true);
			this.lowPriority.setVisible(true);

			// Only enable delete button when it is not a phantom
			this.deleteAppointment.setDisabled(record.phantom === true);

			if (contentReset === true || record.isModifiedSinceLastUpdate('recurring')) {
				if (Ext.isEmpty(record.get('basedate'))) {
					this.recurrence.setVisible(true);
				} else {
					this.recurrence.setVisible(false);
				}
				layout = true;
			}

			if (contentReset === true || record.isModifiedSinceLastUpdate('meeting')) {
				switch (record.get('meeting')) {
					case Zarafa.core.mapi.MeetingStatus.NONMEETING:
					/* falls through */
					default:
						this.sendInvitation.setVisible(false);
						this.saveAppointment.setVisible(true);
						this.saveMeeting.setVisible(false);
						this.deleteAppointment.setVisible(true);
						this.checkNames.setVisible(false);
						this.inviteAttendees.setVisible(true);
						this.cancelInvitation.setVisible(false);
						break;
					case Zarafa.core.mapi.MeetingStatus.MEETING:
						this.sendInvitation.setVisible(true);
						this.saveAppointment.setVisible(false);
						this.saveMeeting.setVisible(true);
						this.deleteAppointment.setVisible(false);
						this.checkNames.setVisible(true);
						this.inviteAttendees.setVisible(false);
						this.cancelInvitation.setVisible(true);
						break;
					case Zarafa.core.mapi.MeetingStatus.MEETING_RECEIVED:
					case Zarafa.core.mapi.MeetingStatus.MEETING_CANCELED:
					case Zarafa.core.mapi.MeetingStatus.MEETING_RECEIVED_AND_CANCELED:
						this.sendInvitation.setVisible(false);
						this.saveAppointment.setVisible(false);
						this.saveMeeting.setVisible(true);
						this.deleteAppointment.setVisible(true);
						this.checkNames.setVisible(false);
						this.inviteAttendees.setVisible(false);
						this.cancelInvitation.setVisible(false);
						break;
				}

				layout = true;
			}

			if (contentReset === true || record.isModifiedSinceLastUpdate('importance')) {
				switch (record.get('importance')) {
				case Zarafa.core.mapi.Importance.URGENT:
					this.highPriority.toggle(true, true);
					break;
				case Zarafa.core.mapi.Importance.NONURGENT:
					this.lowPriority.toggle(true, true);
					break;
				default:
					break;
				}
			}

			if (contentReset === true || record.isModifiedSinceLastUpdate('private')) {
				this.setPrivate.toggle(record.get('private'), true);
			}
		}

		// FIXME: Remove after WA-4880 is implemented
		if (contentReset === true) {
			if (record.isRecurringOccurence()) {
				this.occurenceAttachmentsButton.setVisible(true);
				this.normalAttachmentsButton.setVisible(false);
			} else {
				this.occurenceAttachmentsButton.setVisible(false);
				this.normalAttachmentsButton.setVisible(true);
			}

			layout = true;
		}

		if (layout === true) {
			this.doLayout();
		}
	}
});

Ext.reg('zarafa.appointmenttoolbar', Zarafa.calendar.dialogs.AppointmentToolbar);
