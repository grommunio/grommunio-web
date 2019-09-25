Ext.namespace('Zarafa.calendar.dialogs');

/**
 * @class Zarafa.calendar.dialogs.FreebusyTab
 * @extends Ext.form.FormPanel
 * @xtype zarafa.freebusytab
 *
 * Freebusy tab in the {@link Zarafa.calendar.dialogs.AppointmentPanel}
 * that is used to create Appointments and Meeting Requests.
 */
Zarafa.calendar.dialogs.FreebusyTab = Ext.extend(Ext.form.FormPanel, {
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
			xtype: 'zarafa.freebusytab',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			border: false,
			defaults: {
				border: false
			},
			items: [
				this.createCounterProposalPanel(),
				this.createFreebusyPanel()
			]
		});

		Zarafa.calendar.dialogs.FreebusyTab.superclass.constructor.call(this, config);

		this.on('activate', this.onActivate, this);
	},

	/**
	 * Create the {@link Zarafa.calendar.dialogs.CounterProposalGrid CounterProposalGrid} object.
	 * @return {Object} The configuration object for the freebusy panel
	 * @private
	 */
	createCounterProposalPanel : function()
	{
		return {
			xtype: 'zarafa.counterproposalgrid',
			ref: 'counterproposalpanel',
			hidden: true,
			listeners : {
				scope : this,
				show : this.onProposalGridVisible
			}
		};
	},

	/**
	 * Create the {@link Zarafa.common.freebusy.ui.FreebusyPanel FreebusyPanel} object.
	 * @return {Object} The configuration object for the freebusy panel
	 * @private
	 */
	createFreebusyPanel : function()
	{
		return {
			xtype: 'zarafa.freebusypanel',
			cls: 'zarafa-freebusy-panel',
			ref: 'freebusyPanel',
			flex: 1,
			modelConfig: {
				listeners: {
					selectorrangeupdate: this.onSelectorRangeUpdate,
					scope: this
				}
			},
			items: [
				this.createOptionsPanel()
			]
		};
	},

	/**
	 * Create the {@link Ext.Panel Panel} containing the form fields which are used
	 * to control the {@link Zarafa.common.freebusy.ui.FreebusyPanel FreebusyPanel}.
	 * @return {Object} The configuration object for the Freebusy Options fields
	 * @private
	 */
	createOptionsPanel : function()
	{
		return {
			xtype: 'panel',
			region: 'north',
			layout: 'column',
			cls: 'zarafa-freebusy-datetime-toolbar',
			border: false,
			autoHeight: true,
			items: [{
				xtype: 'zarafa.datetimeperiodfield',
				ref: '../../datetimePeriod',
				defaultPeriod: container.getSettingsModel().get('zarafa/v1/contexts/calendar/default_appointment_period'),
				defaultPeriodType : Date.MINUTE,
				timeIncrement: container.getSettingsModel().get('zarafa/v1/contexts/calendar/default_zoom_level'),
				allowEqualValue : true,
				layout: 'hbox',
				listeners: {
					change: this.onDateRangeFieldChange,
					afterrender : this.onDateRangeFieldAfterRender,
					scope: this
				},
				startFieldConfig: {
					fieldLabel: _('Time'),
					labelConfig : {
						cls: 'label-startfield'
					}
				},
				endFieldConfig: {
					fieldLabel: _('until')
				},
				spacerConfig: {
					width: 10
				}
			},{
				xtype: 'checkbox',
				ref: '../../workingHoursCheckbox',
				boxLabel: _('Show only working hours'),
				handler: this.onOnlyWorkingHours,
				scope: this
			}]
		};
	},

	/**
	 * Event handler which is triggered when counter proposal grid is shown and it will
	 * re-layout {@link Zarafa.calendar.dialogs.FreebusyTab FreebusyTab} to show
	 * {@link Zarafa.calendar.dialogs.CounterProposalGrid CounterProposalGrid} at proper place.
	 * @param {Ext.Component} component Here Panel as a component
	 * @private
	 */
	onProposalGridVisible : function(component)
	{
		this.doLayout();
	},

	/**
	 * Automatically called by superclass on render
	 * This will initialize the {@link Ext.form.CheckBox checkbox} for
	 * toggling the visibility of the non-working hours.
	 * @param {Ext.Container} container The container into which the element is rendered
	 * @param {Number} position The position within the container
	 * @private
	 */
	onRender : function(container, position)
	{
		Zarafa.calendar.dialogs.FreebusyTab.superclass.onRender.call(this, container, position);

		var model = this.freebusyPanel.getModel();
		this.workingHoursCheckbox.setValue(model.showOnlyWorkingHours());

		this.mon(model, 'showworkinghourschange', this.onShowWorkingHoursChange, this);
	},

	/**
	 * Event handler which is triggered when this tab is activated. This will mark
	 * the appointment as meeting request.
	 * @param {Ext.Panel} panel The panel which raised the event
	 * @private
	 */
	onActivate : function(panel)
	{
		// set the meeting status to meeting only when a new Meeting is being or if the organizer has opened the meeting
		if(this.record && !this.record.isMeeting() && this.record.get('responsestatus') === Zarafa.core.mapi.ResponseStatus.RESPONSE_NONE) {
			this.record.convertToMeeting();
		}

		this.freebusyPanel.scrollTimelineToSelection();
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

		if (contentReset === true) {
			this.freebusyPanel.setEditable(!record.isMeetingReceived());
		}

		if (startDateUpdate || dueDateUpdate) {
			this.datetimePeriod.getValue().set(startDate, dueDate);
		}

		if (record.isOpened()) {
			if (contentReset === true || startDateUpdate || dueDateUpdate) {
				this.freebusyPanel.getModel().selectRange(record.get('startdate'), record.get('duedate'));
			}

			if (contentReset === true) {
				this.freebusyPanel.getModel().setUserStore(record.getRecipientStore());
			}
		}
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
		record.endEdit();
	},

	/**
	 * Event handler for when the {@link Zarafa.common.freebusy.ui.FreebusyPanel}
	 * fires the {@link Zarafa.common.freebusy.ui.FreebusyPanel#selectorrangeupdate}
	 * event. This will update the startdate and duedate in the {@link #record}
	 * accordingly.
	 * @param {Zarafa.core.DateRange} newRange The new daterange which was selected
	 * @param {Zarafa.core.DateRange} oldRange The old daterange which was selected
	 * @private
	 */
	onSelectorRangeUpdate : function(newRange, oldRange)
	{
		this.record.beginEdit();
		// Only when the selectorRange is updated we have a valid point
		// for toggling the alldayevent property as only then the user
		// can indicate he doesn't want to allday event. Note that we
		// only support disabling the alldayevent property through the
		// selectorrange.
		if (this.record.get('alldayevent') === true && !newRange.isAllDay()) {
			this.record.set('alldayevent', false);
		}
		this.updateRecurringInfo(this.record, newRange);
		this.updateStartDueDate(this.record, newRange);
		this.record.endEdit();
	},

	/**
	 * Update the 'recurrence_startocc' and 'recurrence_endocc' in the given record from
	 * the given daterange. When appointment is recurring meeting request then
	 * update the necessary recurring information of meeting request.
	 * 
	 * @param {Zarafa.core.data.MAPIRecord} record the Record to update
	 * @param {Zarafa.core.DateRange} daterange the Daterange to apply
	 * @private
	 */
	updateRecurringInfo : function(record, daterange)
	{
		var startDate = daterange.getStartDate().clone();

		if (record.get('alldayevent') === true) {
			startDate = startDate.clearTime();
		}
		
		// Add some necessary properties while time information of
		// recurring meeting gets updated from scheduler.
		if(record.isRecurring() && record.isMeeting()) {
			record.updateTimezoneInformation();
			var startOcc = (startDate.getHours() * 60) + startDate.getMinutes();
			var endOcc = startOcc + daterange.getDuration(Date.MINUTE);
			record.beginEdit();
			record.set('recurring_reset', true);
			record.set('recurrence_startocc', startOcc);
			record.set('recurrence_endocc', endOcc);
			record.set('recurrence_start', startDate.clearTime(true).fromUTC());
			record.set('recurring_pattern', record.generateRecurringPattern());
			record.endEdit();
		}
	},

	/**
	 * Event handler which is fired when the {@link Zarafa.common.ui.DateRangeField} has been changed.
	 * This will update the start and due date inside the {@link #record} accordingly.
	 * @param {Ext.form.Field} field The field which has changed
	 * @param {Zarafa.core.DateRange} newRange The new daterange which was selected
	 * @param {Zarafa.core.DateRange} oldRange The old daterange which was selected
	 * @private
	 */
	onDateRangeFieldChange : function(field, newRange, oldRange)
	{
		this.updateRecurringInfo(this.record, newRange);
		this.updateStartDueDate(this.record, newRange);
	},


	/**
	 * Event handler which is fired when the {@link Zarafa.common.ui.DateRangeField} has been rendered.
	 * This will set width of field.
	 * @param {Ext.form.Field} field The field which is render
     */
	onDateRangeFieldAfterRender : function(field)
	{
		// Somehow before update() the static width is not applied and component is not displayed 
		// and after onUpdateRecord() it is displayed with current date and time
		// So, need to set after DateRangeField successfully rendered
		field.setWidth(550);
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
	 * Event handler which is triggered when the "hideNonWorkingHours" option from
	 * the {@link Zarafa.common.freebusy.data.FreebusyModel FreebusyModel} has been
	 * changed. This will update the 'Show only working hours' checkbox accordingly.
	 * @param {Boolean} hideNonWorkingHours
	 * @private
	 */
	onShowWorkingHoursChange : function(hideNonWorkingHours)
	{
		this.workingHoursCheckbox.setValue(hideNonWorkingHours);
	},

	/**
	 * Event handler which is triggered when the 'Show only working hours'
	 * checkbox was checked.
	 * @param {Ext.form.CheckBox} checkbox The checkbox which was checked
	 * @param {Boolean} The current state of the checkbox
	 * @private
	 */
	onOnlyWorkingHours : function(checkbox, checked)
	{
		var model = this.freebusyPanel.getModel();
		model.hideNonWorkingHours(checked);
	}
});

Ext.reg('zarafa.freebusytab', Zarafa.calendar.dialogs.FreebusyTab);
