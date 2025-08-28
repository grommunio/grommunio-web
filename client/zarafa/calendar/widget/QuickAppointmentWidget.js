Ext.namespace('Zarafa.calendar.widget');

/**
 * @class Zarafa.calendar.widget.QuickAppointmentWidget
 * @extends Zarafa.core.ui.widget.AbstractQuickItemWidget
 *
 * Widget for creating an Appointment quickly with a minimum set of
 * input fields
 */
Zarafa.calendar.widget.QuickAppointmentWidget = Ext.extend(Zarafa.core.ui.widget.AbstractQuickItemWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			wrapCfg: {
				recordComponentPluginConfig: Ext.applyIf(config.recordComponentPluginConfig || {}, {
					allowWrite: true
				}),
				layout: 'fit',
				items: [{
					xtype: 'form',
					ref: 'formPanel',
					layout: {
						type: 'vbox',
						align: 'stretch'
					},
					border: false,
					bodyStyle: 'background-color: inherit; padding: 5px;',
					defaults: {
						border: false,
						labelLength: 100,
						style: 'padding-bottom: 2px'
					},
					items: [{
						xtype: 'zarafa.compositefield',
						hideLabel: true,
						anchor: '100%',
						items: [{
							xtype: 'textfield',
							flex: 1,
							name: 'subject',
							emptyText: _('Subject') + ':',
							listeners: {
								change: this.onChange,
								scope: this
							}
						}]
					},{
						xtype: 'zarafa.datetimeperiodfield',
						ref: '../datetimePeriod',
						defaultPeriod: container.getSettingsModel().get('zarafa/v1/contexts/calendar/default_appointment_period'),
						timeIncrement: container.getSettingsModel().get('zarafa/v1/contexts/calendar/default_zoom_level'),
						listeners: {
							change: this.onDateRangeFieldChange,
							scope: this
						},
						startFieldConfig: {
							minValue: new Date().clearTime()
						},
						endFieldConfig: {
							minValue: new Date().clearTime()
						}
					},{
						xtype: 'zarafa.compositefield',
						hideLabel: true,
						anchor: '100%',
						items: [{
							xtype: 'checkbox',
							name: 'alldayevent',
							ref: '../../alldayCheck',
							hideLabel: false,
							boxLabel: _('All Day Event'),
							height: 15,
							handler: this.onToggleAllDay,
							scope: this
						}]
					},{
						xtype: 'zarafa.editorfield',
						ref: '../editorField',
						htmlName: 'html_body',
						plaintextName: 'body',
						hideLabel: true,
						flex: 1,
						useHtml: true,
						defaultValue: '',
						listeners: {
							change: this.onBodyChange,
							scope: this
						}
					}]
				}]
			},
			buttons: [{
				text: _('Save'),
				cls: 'zarafa-action',
				style: 'padding-bottom: 5px',
				handler: this.onSave,
				scope: this
			},{
				text: _('Discard'),
				style: 'padding-bottom: 5px',
				handler: this.onDiscard,
				scope: this
			}]
		});

		Zarafa.calendar.widget.QuickAppointmentWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler which is fired when the {@link Zarafa.common.ui.DateRangeField} has been changed.
	 * This will update the start and due date inside the {@link #record} accordingly.
	 * @param {Ext.form.Field} field The field which has changed
	 * @param {Mixed} newValue The new value for the field
	 * @param {Mixed} oldValue The original value for the field
	 * @private
	 */
	onDateRangeFieldChange: function(field, newRange, oldRange)
	{
		this.updateStartDueDate(this.wrap.record, newRange);
	},

	/**
	 * A function called when the checked value changes for the
	 * all day event checkbox.
	 * @param {Ext.form.Checkbox} checkbox The Checkbox being toggled.
	 * @param {Boolean} checked The new checked state of the checkbox.
	 * @private
	 */
	onToggleAllDay: function(checkbox, checked)
	{
		if (this.wrap.record.get('alldayevent') !== checked) {
			var settingsModel = container.getSettingsModel();

			this.wrap.record.beginEdit();
			this.wrap.record.set('alldayevent', checked);
			if (checked) {
				this.updateStartDueDate(this.wrap.record, this.wrap.datetimePeriod.getValue());

				this.wrap.record.set('reminder_minutes', settingsModel.get('zarafa/v1/contexts/calendar/default_allday_reminder_time'));
				this.wrap.record.set('busystatus', Zarafa.core.mapi.BusyStatus.FREE);
			} else {
				var zoomLevel = settingsModel.get('zarafa/v1/contexts/calendar/default_zoom_level');
				var defaultPeriod = settingsModel.get('zarafa/v1/contexts/calendar/default_appointment_period');

				var startDate = new Date();
				if(this.wrap.record.get('startdate')) {
					// use existing date if it is set
					startDate = this.wrap.record.get('startdate').clearTime(true);
				}

				startDate = startDate.ceil(Date.MINUTE, zoomLevel);
				var dueDate = startDate.add(Date.MINUTE, defaultPeriod);

				this.wrap.record.set('reminder_minutes', settingsModel.get('zarafa/v1/contexts/calendar/default_reminder_time'));
				this.wrap.record.set('busystatus', Zarafa.core.mapi.BusyStatus.BUSY);
				this.wrap.record.set('startdate', startDate);
				this.wrap.record.set('duedate', dueDate);
				this.wrap.record.set('commonstart', startDate);
				this.wrap.record.set('commonend', dueDate);
				this.wrap.record.set('duration', (dueDate - startDate) / (60 * 1000));
			}
			this.wrap.record.endEdit();
		}
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
	updateStartDueDate: function(record, daterange)
	{
		var startDate = daterange.getStartDate().clone();
		var dueDate = daterange.getDueDate().clone();

		if (record.get('alldayevent') === true) {
			startDate = startDate.clearTime();
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
	 * Create a new record which must be edited by this widget.
	 * @return {Ext.data.Record} record The record to load into the {@link #wrap}
	 * @protected
	 */
	createRecord: function()
	{
		var folder = container.getHierarchyStore().getDefaultFolder('calendar');
		var context = container.getContextByName('calendar');
		var model = context.getModel();

		return model.createRecord(undefined, folder);
	},

	/**
	 * Updates the widget by loading data from the record into the {@link #wrap}.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record update the panel with.
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 * @protected
	 */
	update: function(record, contentReset)
	{
		if (contentReset === true || record.isModifiedSinceLastUpdate('alldayevent')) {
			if (record.get('alldayevent')) {
				this.wrap.datetimePeriod.setEnabledTimeSelection(false);
			} else {
				this.wrap.datetimePeriod.setEnabledTimeSelection(true);
			}
		}

		this.wrap.formPanel.getForm().loadRecord(record);

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
		// it ends. For the UI, this means we have to subtract 1 day to get
		// the date on which the appointment actually ends for the user.
		if (record.get('alldayevent')) {
			dueDate = dueDate.add(Date.DAY, -1);
		}

		if (startDateUpdate || dueDateUpdate) {
			this.wrap.datetimePeriod.getValue().set(startDate, dueDate);
		}
	},

	/**
	 * Updates the widget by loading data from the record into the {@link #wrap}.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record to update
	 * @protected
	 */
	updateRecord: function(record)
	{
		record.beginEdit();
		this.wrap.formPanel.getForm().updateRecord(record);
		this.updateStartDueDate(record, this.wrap.datetimePeriod.getValue());
		this.onToggleAllDay(this.wrap.alldayCheck, this.wrap.alldayCheck.getValue());
		this.onBodyChange(this.wrap.editorField, this.wrap.editorField.getValue());
		record.endEdit();
	}
});

Zarafa.onReady(function() {
	container.registerWidget(new Zarafa.core.ui.widget.WidgetMetaData({
		name: 'quickappt',
		iconCls: 'icon_widget_new_appointment',
		displayName: _('Quick Appointment'),
		widgetConstructor: Zarafa.calendar.widget.QuickAppointmentWidget
	}));
});
