Ext.namespace('Zarafa.calendar.ui');

/**
 * @class Zarafa.calendar.ui.CalendarContextMenu
 * @extends Zarafa.core.ui.menu.ConditionalMenu
 * @xtype zarafa.calendarcontextmenu
 *
 * Extend {@link Zarafa.core.ui.menu.ConditionalMenu ConditionalMenu} to add the
 * {@link Zarafa.core.ui.menu.ConditionalItems ConditionalItems} for the
 * CalendarContext.
 */
Zarafa.calendar.ui.CalendarContextMenu = Ext.extend(Zarafa.core.ui.menu.ConditionalMenu, {
	// Insertion points for this class
	/**
	 * @insert context.calendar.contextmenu.actions
	 * Insertion point for adding actions menu items into the context menu
	 * @param {Zarafa.calendar.ui.CalendarContextMenu} contextmenu This contextmenu
	 */
	/**
	 * @insert context.calendar.contextmenu.options
	 * Insertion point for adding options menu items into the context menu
	 * @param {Zarafa.calendar.ui.CalendarContextMenu} contextmenu This contextmenu
	 */

	/**
	 * @cfg {Zarafa.calendar.ui.CalendarPanel} The calendar panel for which this context
	 * menu is shown
	 */
	calendarPanel: null,

	/**
	 * @cfg {Zarafa.core.data.IPMRecord[]} The records on which this context menu acts
	 */
	records: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		if (Ext.isDefined(config.records) && !Array.isArray(config.records)) {
			config.records = [ config.records ];
		}

		config = Ext.applyIf(config, {
			items: [
				this.createContextActionItems(),
				{ xtype: 'menuseparator' },
				container.populateInsertionPoint('context.calendar.contextmenu.actions', this),
				{ xtype: 'menuseparator' },
				this.createContextOptionsItems(config.records),
				{ xtype: 'menuseparator' },
				container.populateInsertionPoint('context.calendar.contextmenu.options', this)
			],
			listeners: {
				scope: this,
				mouseover: this.onMouseover
			}
		});

		Zarafa.calendar.ui.CalendarContextMenu.superclass.constructor.call(this, config);
	},

	/**
	 * Create the Action context menu items
	 * @return {Zarafa.core.ui.menu.ConditionalItem[]} The list of Action context menu items
	 * @private
	 */
	createContextActionItems : function()
	{
		return [{
			xtype : 'zarafa.conditionalitem',
			iconCls : 'icon_create_appointment',
			text : _('New Appointment'),
			beforeShow : this.beforeShowPhantom,
			meetingRequest: false,
			handler : this.onCreate,
			scope: this
		},{
			xtype : 'zarafa.conditionalitem',
			iconCls : 'icon_create_meeting_request',
			text : _('New Meeting Request'),
			beforeShow : this.beforeShowPhantom,
			meetingRequest: true,
			handler : this.onCreate,
			scope: this
		},{
			xtype : 'zarafa.conditionalitem',
			iconCls : 'icon_open',
			text : _('Open'),
			beforeShow : this.beforeShowNonPhantom,
			handler : this.onOpen,
			scope: this
		},{
			xtype : 'zarafa.conditionalitem',
			text : _('Copy/Move'),
			iconCls : 'icon_copy',
			beforeShow : this.beforeShowNonPhantom,
			hideOnDisabled : false,
			handler: this.onCopyMove,
			scope: this
		},{
			xtype : 'zarafa.conditionalitem',
			iconCls : 'icon_delete',
			text : _('Delete'),
			beforeShow : this.beforeShowNonPhantom,
			handler : this.onDelete,
			scope: this
		},{
			xtype: 'menuseparator'
		},{
			xtype : 'zarafa.conditionalitem',
			ref : 'acceptButton',
			text: _('Accept'),
			hidden : true,
			iconCls: 'icon_calendar_appt_accept',
			beforeShow : this.beforeShowOnMeeting,
			responseStatus : Zarafa.core.mapi.ResponseStatus.RESPONSE_ACCEPTED,
			scope: this
		},{
			xtype : 'zarafa.conditionalitem',
			ref : 'tentativeButton',
			text : _('Tentative'),
			hidden : true,
			iconCls : 'icon_appt_meeting_tentative',
			beforeShow : this.beforeShowOnMeeting,
			responseStatus : Zarafa.core.mapi.ResponseStatus.RESPONSE_TENTATIVE,
			scope: this
		},{
			xtype : 'zarafa.conditionalitem',
			ref : 'declineButton',
			text : _('Decline'),
			iconCls: 'icon_calendar_appt_cancelled',
			hidden : true,
			beforeShow : this.beforeShowOnMeeting,
			responseStatus : Zarafa.core.mapi.ResponseStatus.RESPONSE_DECLINED,
			scope: this
		},{
			xtype : 'zarafa.conditionalitem',
			ref : 'proposeNewTimeButton',
			text : _('Propose New Time'),
			proposeNewTime : true,
			hidden : true,
			iconCls : 'icon_calendar_appt_newtime',
			beforeShow : this.beforeShowOnMeeting,
			scope: this
		}];
	},

	/**
	 * Create the Option context menu items
	 * @param {Zarafa.core.data.IPMRecord[]} records The records on which this menu acts
	 * @return {Zarafa.core.ui.menu.ConditionalItem[]} The list of Option context menu items
	 * @private
	 */
	createContextOptionsItems : function(records)
	{
		return [{
			xtype : 'zarafa.conditionalitem',
			cls: 'k-unclickable',
			iconCls : 'icon_categories',
			text : _('Categories'),
			hideOnClick: false,
			beforeShow : this.beforeShowNonPhantom,
			menu: this.createSubCategories(records)
		},{
			xtype : 'zarafa.conditionalitem',
			iconCls : 'icon_busystatus',
			text : _('Show as'),
			beforeShow : this.beforeShowNonPhantom,
			menu : {
				xtype: 'zarafa.conditionalmenu',
				items: this.createBusyStatusItems()
			}
		}];
	},

	/**
	 * Create the sub context menu items for categories only if records are supplied.
	 * @param {Zarafa.core.data.IPMRecord[]} records The records on which this menu acts
	 * @return {Object} The object of Options containing {@link Zarafa.common.categories.ui.CategoriesContextMenu}
	 * @private
	 */
	createSubCategories : function(records)
	{
		if (records) {
			return {
				xtype: 'zarafa.categoriescontextmenu',
				records: records
			};
		}
	},

	/**
	 * Create the Busy status context submenu items
	 * @return {Zarafa.core.ui.menu.ConditionalItem[]} The list of Busy status context submenu items
	 * @private
	 */
	createBusyStatusItems : function()
	{
		return [{
			xtype : 'zarafa.conditionalitem',
			iconCls : 'icon_busystatus_free',
			text : Zarafa.core.mapi.BusyStatus.getDisplayName(Zarafa.core.mapi.BusyStatus.FREE),
			busyStatus : Zarafa.core.mapi.BusyStatus.FREE,
			handler : this.onSetBusyStatus,
			scope: this
		},{
			xtype : 'zarafa.conditionalitem',
			iconCls : 'icon_busystatus_tentative',
			text : Zarafa.core.mapi.BusyStatus.getDisplayName(Zarafa.core.mapi.BusyStatus.TENTATIVE),
			busyStatus: Zarafa.core.mapi.BusyStatus.TENTATIVE,
			handler : this.onSetBusyStatus,
			scope: this
		},{
			xtype : 'zarafa.conditionalitem',
			iconCls : 'icon_busystatus_busy',
			text : Zarafa.core.mapi.BusyStatus.getDisplayName(Zarafa.core.mapi.BusyStatus.BUSY),
			busyStatus: Zarafa.core.mapi.BusyStatus.BUSY,
			handler : this.onSetBusyStatus,
			scope: this
		},{
			xtype : 'zarafa.conditionalitem',
			iconCls : 'icon_busystatus_outofoffice',
			text : Zarafa.core.mapi.BusyStatus.getDisplayName(Zarafa.core.mapi.BusyStatus.OUTOFOFFICE),
			busyStatus: Zarafa.core.mapi.BusyStatus.OUTOFOFFICE,
			handler : this.onSetBusyStatus,
			scope: this
		}];
	},

	/**
	 * Open the {@link Zarafa.common.dialogs.CopyMoveContentPanel CopyMoveContentPanel} for copying
	 * or moving the currently selected appointment/meeting requests.
	 * @private
	 */
	onCopyMove : function()
	{
		Zarafa.common.Actions.openCopyMoveContent(this.records);
	},

	/**
	 * Makes the given menuitem invisible when any of the records is not a phantom record.
	 * @param {Zarafa.core.ui.menu.MenuItem} item The item which is being tested
	 * @param {Zarafa.core.data.MAPIRecord[]} records The records on which this context
	 * menu is operating.
	 * @private
	 */
	beforeShowPhantom : function(item, records)
	{
		var hasNonPhantoms = false;
		if (records) {
			for (var i = 0, len = records.length; i < len; i++) {
				if (records[i].phantom === false) {
					hasNonPhantoms = true;
				}
			}
		}
		item.setVisible(!hasNonPhantoms);
	},

	/**
	 * Makes the given menuitem invisible when any of the records is a phantom record.
	 * @param {Zarafa.core.ui.menu.MenuItem} item The item which is being tested
	 * @param {Zarafa.core.data.MAPIRecord[]} records The records on which this context
	 * menu is operating.
	 * @private
	 */
	beforeShowNonPhantom : function(item, records)
	{
		var hasPhantoms = false;
		if (records) {
			for (var i = 0, len = records.length; i < len; i++) {
				if (records[i].phantom === true) {
					hasPhantoms = true;
				}
			}
			item.setVisible(!hasPhantoms);
		} else {
			item.setVisible(false);
		}
	},

	/**
	 * Makes the given menuitem invisible when record is appointment or login user is organizer of meeting.
	 * @param {Zarafa.core.ui.menu.MenuItem} item The item which is being tested
	 * @param {Zarafa.core.data.MAPIRecord[]} records The records on which this context
	 * menu is operating.
	 * @private
	 */
	beforeShowOnMeeting : function(item, records)
	{
		// If user has select more then one record then we should not have to show the menu items.
		if(!records || records.length > 1){
			return;
		}

		var record = records[0];
		var isProposeButton = Ext.isDefined(item.proposeNewTime) && item.proposeNewTime;

		// if record is received meeting then show all buttons (accept/decline/ tentatively accept) in context menu
		if(record.isMeetingReceived()) {
			item.setVisible(true);
		}

		// if selected record is received simple meeting request then set the handler on each button.
		if(record.isMeetingReceived() && !(record.isRecurringOccurence() || record.get('recurring'))) {
			if(isProposeButton) {
				item.setHandler(this.openProposeNewTimeContent, this);
			} else {
				item.setHandler(this.openSendConfirmationContent, this);
			}
		}

		if(record.isMeetingReceived() && (record.isRecurringOccurence() || record.get('recurring'))) {
			// Add sub menu item while selected received meeting request is recurring.
			// it will show the two sub menu items which provide facility to user to accept, tentatively accept,
			// decline recurring series or occurrence and allow user to propose new time for single occurrence
			// of recurring meeting request.
			item.menu = new Ext.menu.Menu({
				items: [{
					xtype : 'zarafa.conditionalitem',
					text : item.text +' '+ _('Occurrence'),
					responseStatus : item.responseStatus,
					beforeShow : function(item, records) {
						if(isProposeButton) {
							item.setHandler(this.openProposeNewTimeContent, this);
						} else {
							item.setHandler(this.openSendConfirmationContent, this);
						}
					},
					scope : this
				},{
					xtype : 'zarafa.conditionalitem',
					text : item.text +' '+ _('Series'),
					name : 'recurring',
					beforeShow : function(item, records) {
						if(isProposeButton) {
							item.setVisible(false);
						} else {
							item.setHandler(this.openSendConfirmationContent, this);
						}
					},
					responseStatus : item.responseStatus,
					isProposeButton : isProposeButton,
					scope : this
				}],
				scope : this
			});
		}
	},

	/**
	 * Event handler for the mouseover event of this menu. Will make sure that any
	 * open tooltip is closed.
	 */
	onMouseover : function()
	{
		// In the list view there is no calendarPanel (and no tooltip)
		if ( this.calendarPanel ){
			this.calendarPanel.getView().getTooltipInstance().hide(0);
		}
	},

	/**
	 * Opens the Propose New Time Content Panel
	 * @param {Ext.Button} button The clicked button
	 * @param {EventObject} eventObject The click event object
	 * @private
	 */
	openProposeNewTimeContent : function(button, eventObject)
	{
		var record;
		if(Array.isArray(this.records)) {
			record = this.records[0];
		}

		if (record.get('appointment_not_found')) {
			Ext.MessageBox.show({
				title: _('Kopano WebApp'),
				msg :_('This appointment has been moved or deleted, do you want to continue?'),
				icon: Ext.MessageBox.WARNING,
				record: record,
				fn: this.onProposeNewTimeAppointmentNotFoundConfirmation.createDelegate(this, [record], 1),
				scope: this,
				buttons: Ext.MessageBox.YESNO
			});
		} else {
			Zarafa.calendar.Actions.openProposeNewTimeContent(record);
		}
	},

	/**
	 * Callback function for {@link #openProposeNewTimeContent}, which openes a {@link Ext.MessageBox} if
	 * the appointment is not found in the calendar, but we still wants to propose a new time.
	 * @param {String} button The button which was clicked by the user
	 * @param {Zarafa.core.data.MAPIRecord} record The record on which this context
	 * @private
	 */
	onProposeNewTimeAppointmentNotFoundConfirmation : function(button, record)
	{
		if (button === 'yes') {
			Zarafa.calendar.Actions.openProposeNewTimeContent(record);
		}
	},

	/**
	 * Opens a {@link Zarafa.calendar.dialogs.SendMeetingRequestConfirmationContentPanel SendMeetingRequestConfirmationContentPanel}
	 * if meeting was recurring occurrence then remove the basedate.
	 * @param {Ext.Button} button button object.
	 * @param {EventObject} eventObject The click event object.
	 * @private
	 */
	openSendConfirmationContent : function(button, eventObject)
	{
		var record;
		if(Array.isArray(this.records)) {
			record = this.records[0];
		} else {
			return;
		}

		if (record.get('appointment_not_found')) {
			Ext.MessageBox.show({
				title: _('Kopano WebApp'),
				msg :_('This appointment has been moved or deleted, do you want to continue?'),
				icon: Ext.MessageBox.WARNING,
				record: record,
				fn: this.onRespondAppointmentNotFoundConfirmation.createDelegate(this, [ button.responseStatus, record ], 1),
				scope: this,
				buttons: Ext.MessageBox.YESNO
			});
		} else {
			Zarafa.calendar.Actions.openSendConfirmationContent(record, {
					responseType : button.responseStatus,
					buttonName : button.name
			});
		}
	},

	/**
	 * Callback function for {@link #openSendConfirmationContent}, which openes a {@link Ext.MessageBox} if
	 * the appointment is not found in the calendar, but we still want to accept it.
	 * @param {String} button The button which was clicked by the user
	 * @param {Zarafa.core.mapi.ResponseStatus} responseType The response type which was selected by the user
	 * @param {Zarafa.core.data.MAPIRecord} record The record on which this context
	 * @private
	 */
	onRespondAppointmentNotFoundConfirmation : function(button, responseType, record)
	{
		if (button === 'yes') {
			Zarafa.calendar.Actions.openSendConfirmationContent(record, { responseType : responseType });
		}
	},

	/**
	 * Open the categories dialog for all selected records
	 * @param {Zarafa.core.ui.menu.ConditionalItem} button The selected menuitem
	 */
	onCategories : function(button)
	{
		Zarafa.common.Actions.openCategoriesContent(this.records);
	},

	/**
	 * Set the busy state for all selected records
	 * @param {Zarafa.core.ui.menu.ConditionalItem} button The selected menuitem
	 */
	onSetBusyStatus : function(button)
	{
		var store;
		var records = this.records;

		Ext.each(records, function(record) {
			store = record.getStore();
			record.set('busystatus', button.busyStatus);
		}, this);

		store.save(records);
	},

	/**
	 * Open the selected record
	 * @param {Zarafa.core.ui.menu.ConditionalItem} button The selected menuitem
	 */
	onOpen : function(open)
	{
		Zarafa.calendar.Actions.openAppointmentContent(this.records);
	},

	/**
	 * Delete all selected records
	 * @param {Zarafa.core.ui.menu.ConditionalItem} button The selected menuitem
	 */
	onDelete : function(button)
	{
		Zarafa.common.Actions.deleteRecords(this.records);
	},

	/**
	 * Create a new appointment / meeting request
	 * @param {Zarafa.core.ui.menu.ConditionalItem} button The selected menuitem
	 */
	onCreate : function(button)
	{
		if (!this.records) {
			var model = this.calendarPanel.model;
			var calendarView = this.calendarPanel.getView();
			var activeCalendar = calendarView.rangeSelectionModel.calendarView;
			var rangeModel = this.calendarPanel.getRangeSelectionModel();

			model.createRecord(function(record){
				this.openContent(button, [record]);
			}.createDelegate(this, [button], true), activeCalendar.getSelectedFolder(), rangeModel.dateRange);
		} else {
			this.openContent(button, this.records);
		}
	},

	/**
	 * Helper function to open dialog for new appointment / meeting request.
	 * @param {Zarafa.core.ui.menu.ConditionalItem} button The selected menuitem
	 * @param {Zarafa.core.data.MAPIRecord[]} records The records on which this contextmenu gets opened
	 */
	openContent : function(button, records)
	{
		if (button.meetingRequest) {
			for (var i = 0, len = records.length; i < len; i++) {
				var record = records[i];
				// Change meeting status only if it is not a meeting, otherwise leave as it is (in order not to overwrite old meeting status)
				if (record.get('meeting') === Zarafa.core.mapi.MeetingStatus.NONMEETING) {
					record.convertToMeeting();
				}
			}
			Zarafa.calendar.Actions.openMeetingRequestContent(records);
		} else {
			Zarafa.calendar.Actions.openAppointmentContent(records);
		}
	}
});

Ext.reg('zarafa.calendarcontextmenu', Zarafa.calendar.ui.CalendarContextMenu);
