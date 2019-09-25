Ext.namespace('Zarafa.common.recurrence.dialogs');

/**
 * @class Zarafa.common.recurrence.dialogs.RecurrencePanel
 * @extends Ext.Panel
 * @xtype zarafa.recurrencepanel
 * 
 * Panel that is used to create Recurrences
 */
Zarafa.common.recurrence.dialogs.RecurrencePanel = Ext.extend(Ext.Panel, {
	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		config = Ext.applyIf(config, {
			xtype: 'zarafa.recurrencepanel',
			layout: 'form',
			border: false,
			defaults: {
				border: false,
				bodyStyle: 'padding: 10px;'
			},
			items : [
				this.createTimePanel(),
				this.createRecurrencePanel(),
				this.createRangePanel()
			]
		});

		Zarafa.common.recurrence.dialogs.RecurrencePanel.superclass.constructor.call(this, config);
	},

	/**
	 * Creates the Time panel in which the user can select the message time.
	 * @return {Object} The configuration object for the Time
	 * @private
	 */
	createTimePanel : function()
	{
		return {
			xtype: 'panel',
			title: _('Time'),
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			anchor: '100%',
			height: 100,
			items: [{
				xtype: 'displayfield',
				ref: '../timeperiodLabel',
				htmlEncode : true,
				hideLabel : true,
				height: 20
			},{
				xtype: 'panel',	
				layout: 'hbox',
				anchor: '100% 100%',
				border: false,
				bodyStyle: 'background-color: inherit;',
				items: [{
					xtype: 'zarafa.timeperiodfield',
					ref: '../../timeperiodField',
					layout: 'hbox',
					defaultPeriod : 30,
					defaultPeriodType : Date.MINUTE,
					flex: 0.7,
					spacerConfig: {
						width: 5
					},
					listeners: {
						change : this.onDurationChange,
						scope: this
					}
				},{
					xtype: 'spacer',
					width: 5
				},{
					xtype: 'container',
					flex: 0.3,
					border: false,
					style: 'background-color: inherit;',
					items: [{
						xtype: 'checkbox',
						ref: '../../../alldayCheckbox',
						name: 'alldayevent',
						boxLabel: _('All Day Event'),
						handler: this.onToggleAllDay,
						scope: this
					}]
				}]
			}]
		};
	},

	/**
	 * Creates the recurrence recurrence pattern panel, in which the user can configure
	 * the recurrence pattern (daily/weekly/monhtly/yearly) for this message.
	 * @return {Object} The configuration object for the Recurrence Pattern
	 * @private
	 */
	createRecurrencePanel : function()
	{
		return {
			xtype: 'panel',
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			title: _('Recurrence pattern'),
			anchor: '100%',
			height: 150,
			items: [{
				xtype: 'radiogroup',
				ref: '../recurrencePatternSelect',
				width: 100,
				border: false,
				columns: 1,
				items: [{
					boxLabel: _('Daily'),
					name: 'pattern',
					targetId: 'card-daily',
					patternValue : Zarafa.common.recurrence.data.RecurrenceType.DAILY,
					handler: this.onSwitchRecurrenceView,
					scope: this
				},{
					boxLabel: _('Weekly'),
					name: 'pattern',
					targetId: 'card-weekly',
					patternValue : Zarafa.common.recurrence.data.RecurrenceType.WEEKLY,
					handler: this.onSwitchRecurrenceView,
					scope: this
				},{
					boxLabel: _('Monthly'),
					name: 'pattern',
					targetId: 'card-monthly',
					patternValue : Zarafa.common.recurrence.data.RecurrenceType.MONTHLY,
					handler: this.onSwitchRecurrenceView,
					scope: this
				},{
					boxLabel: _('Yearly'),
					name: 'pattern',
					targetId: 'card-yearly',
					patternValue : Zarafa.common.recurrence.data.RecurrenceType.YEARLY,
					handler: this.onSwitchRecurrenceView,
					scope: this
				}]
			},{
				xtype: 'panel',
				ref: '../recurrencePattern',
				layout: 'card',
				flex: 1,
				border: true,
				bodyStyle: 'background-color: inherit; border-style: none none none solid; padding: 0px 10px 0px 10px',
				defaults: {
					border: false,
					bodyStyle: 'background-color: inherit;',
					autoHeight: true
				},
				items: [{
					xtype: 'zarafa.recurrencedailypanel',
					id: 'card-daily'
				},{
					xtype: 'zarafa.recurrenceweeklypanel',
					id: 'card-weekly'
				},{
					xtype: 'zarafa.recurrencemonthlypanel',
					id: 'card-monthly'
				},{
					xtype: 'zarafa.recurrenceyearlypanel',
					id: 'card-yearly'
				}]
			}]
		};
	},

	/**
	 * Creates the recurrence recurrence pattern panel, in which the user can configure
	 * the recurrence range for this message.
	 * @return {Object} The configuration object for the Recurrence Range
	 * @private
	 */
	createRangePanel : function()
	{
		return {
			xtype: 'panel',
			layout: 'column',
			title: _('Range of recurrence'),
			anchor: '100%',
			items: [{
				xtype: 'panel',
				layout: 'form',
				columnWidth: 0.5,
				border: false,
				items: [{
					xtype: 'datefield',
					ref: '../../startDateField',
					name: 'recurrence_start',
					fieldLabel: _('Start'),
					// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
					format : _('d/m/Y'),
					listeners: {
						select: this.onUTCFieldChange,
						change: this.onUTCFieldChange,
						scope: this
					}
				}]
			},{
				xtype: 'panel',
				layout: 'form',
				ref: '../endPatternPanel',
				columnWidth: 0.5,
				border: false,
				bodyStyle: 'background-color: inherit;',
				defaults: {
					anchor :'100%',
					border: false,
					bodyStyle: 'background-color: inherit;',
					defaults: {
						height: 25,
						labelWidth: 75
					}
				},
				items: [{
					xtype: 'panel',
					layout: 'hbox',
					items: [{
						xtype: 'radio',
						name: 'recurrence_term',
						endTerm: Zarafa.common.recurrence.data.RecurrenceEnd.NEVER,
						hideLabel: true,
						width: 25,
						listeners : {
							check : this.onSwitchRecurrenceTerm,
							scope : this
						}
					},{
						xtype: 'displayfield',
						value: _('No end date'),
						hideLabel : true
					}]
				},{
					xtype: 'panel',
					layout: 'column',
					items: [{
						xtype: 'radio',
						name: 'recurrence_term',
						endTerm: Zarafa.common.recurrence.data.RecurrenceEnd.N_OCCURENCES,
						hideLabel: true,
						width: 25,
						listeners : {
							check : this.onSwitchRecurrenceTerm,
							scope : this
						}
					},{
						xtype: 'zarafa.compositefield',
						plugins: [ 'zarafa.splitfieldlabeler' ],
						fieldLabel: _('End after {A} occurrences'),
						labelWidth: 160,
						items: [{
							xtype: 'zarafa.spinnerfield',
							plugins: [ 'zarafa.numberspinner' ],
							ref: '../../../../endOccurencesSpinner',
							name : 'recurrence_numoccur',
							labelSplitter: '{A}',
							allowNegative: false,
							minValue: 1,
							width: 50,
							listeners: {
								change: this.onFieldChange,
								scope: this
							}
						}]
					}]
				},{
					xtype: 'panel',
					layout: 'column',
					items: [{
						xtype: 'radio',
						name: 'recurrence_term',
						endTerm: Zarafa.common.recurrence.data.RecurrenceEnd.ON_DATE,
						hideLabel: true,
						width: 25,
						listeners : {
							check : this.onSwitchRecurrenceTerm,
							scope : this
						}
					},{
						xtype: 'zarafa.compositefield',
						plugins: [ 'zarafa.splitfieldlabeler' ],
						fieldLabel: _('End by {A}'),
						labelWidth: 80,
						combineErrors: false,
						items: [{
							xtype: 'datefield',
							ref: '../../../../endOnDateField',
							name: 'recurrence_end',
							width: 120,
							labelSplitter: '{A}',
							// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
							format : _('d/m/Y'),
							listeners: {
								select: this.onUTCFieldChange,
								change: this.onUTCFieldChange,
								scope: this
							}
						}]
					}]
				}]
			}]
		};
	},

	/**
	 * Event handler which is fired when either the All Day checkbox has been
	 * checked, or when the timeDuration field has been updated. In noth situations
	 * the label belonging to the field will be updated to reflect the new duration.
	 * @private
	 */
	updateDurationLabel : function()
	{
		if (!this.record) {
			return;
		}

		var duration = Math.floor(this.timeperiodField.getValue().getDuration(Date.MINUTE));
		var days = Math.floor(duration / (24 * 60));
		duration %= (24 * 60);
		var hours = Math.floor(duration / 60);
		duration %= 60;
		var minutes = Math.floor(duration);	

		// # TRANSLATORS: This informs the user what the exact duration of the appointment is. Where {D} represents the days, {H} the hours and {M} the minutes.
		// # For example: 'Occurence duration: 1 day 2 hours 45 minutes', or when the appointment is shorter then 1 day: 'Occurence duration: 1 hour'
		var label = _('Occurrence duration: {D} {H} {M}');
		if (days > 0) {
			label = label.replace('{D}', String.format(ngettext('{0} day', '{0} days', days), days));
		} else {
			label = label.replace('{D} ', '');
		}
		if (hours > 0) {
			label = label.replace('{H}', String.format(ngettext('{0} hour', '{0} hours', hours), hours));
		} else {
			label = label.replace('{H} ', '');
		}
		if (minutes > 0) {
			label = label.replace('{M}', String.format(ngettext('{0} minute', '{0} minutes', minutes), minutes));
		} else {
			label = label.replace('{M}', '');
		}

		this.timeperiodLabel.setValue(label);
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
	 * Event handler which is fired when the recurrence start or end date has
	 * been changed. This will convert the value to the UTC start of the day,
	 * and update the record.
	 * @param {Ext.form.Field} field The field which has changed
	 * @param {Mixed} newValue The new value for the field
	 * @param {Mixed} oldValue The original value for the field
	 * @private
	 */
	onUTCFieldChange : function(field, newValue, oldValue)
	{
		// The field is represented in UTC time,
		// so convert it to local to get the time for the property
		this.record.set(field.getName(), newValue.fromUTC());
	},

	/**
	 * Event handler which is fired when the duration field has been updated.
	 * This will calculate the correct startocc and endocc values, and updates the record.
	 * @param {Ext.form.Field} field The field which has changed
	 * @param {Mixed} newValue The new value for the field
	 * @param {Mixed} oldValue The original value for the field
	 * @private
	 */
	onDurationChange : function(field, newValue, oldValue)
	{
		var startOcc = (newValue.getStartDate().getHours() * 60) + newValue.getStartDate().getMinutes();
		var endOcc = startOcc + newValue.getDuration(Date.MINUTE);

		this.record.beginEdit();
		this.record.set('recurrence_startocc', startOcc);
		this.record.set('recurrence_endocc', endOcc);
		this.record.endEdit();
	},

	/**
	 * Event handler which is fired when the Recurrence End radio button
	 * has been toggled. This will change the recurrence term status.
	 *
	 * @param {Ext.form.Radio} radio The radio which has changed
	 * @param {Boolean} checked True if the radio was checked
	 * @private
	 */
	onSwitchRecurrenceTerm : function(radio, checked)
	{
		if (checked) {
			this.record.set('recurrence_term', radio.endTerm);
		}
	},

	/**
	 * Event handler which is fired when a checkbox has been toggled
	 * to switch the recurrence pattern. This will change the recurrence
	 * pattern panel to the selected type.
	 *
	 * @param {Ext.form.CheckBox} checkbox The checkbox which was changed
	 * @param {Boolean} Checked True if the checkbox was checked
	 * @private
	 */
	onSwitchRecurrenceView : function(checkbox, checked)
	{
		if (checked) {
			this.record.set('recurrence_type', checkbox.patternValue);
			this.recurrencePattern.getLayout().setActiveItem(checkbox.targetId);
			this.recurrencePattern.doLayout();
		}
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
		// When the user already has an appointment that last a more then a day, we should
		// round the end of the occurences up to a whole number of days.
		var days = Math.ceil(this.timeperiodField.getValue().getDuration(Date.MINUTE) / 1440);

		this.record.beginEdit();
		this.record.set('alldayevent', checked);
		this.record.set('recurrence_startocc', 0);
		this.record.set('recurrence_endocc', days * 1440);
		this.record.endEdit();
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

		if (contentReset === true || record.isModifiedSinceLastUpdate('alldayevent')) {
			if (record.get('alldayevent')) {
				this.timeperiodField.disable();
			} else {
				this.timeperiodField.enable();
			}
		}

		if (contentReset === true || record.isModifiedSinceLastUpdate('message_class')) {
			if (record.isMessageClass('IPM.TaskRequest', true)) {
				this.alldayCheckbox.hide();
			} else {
				this.alldayCheckbox.show();
			}

			layout = true;
		}

		if (layout) {
			this.doLayout();
		}
	},

	/**
	 * Panel updater. This will initialize all UI components inside the panel with
	 * the data from the {@link Zarafa.core.data.IPMRecord record}.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record used to update the panel
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
		this.record = record;
		this.updateUI(record, contentReset);

		var type = record.get('recurrence_type');
		this.recurrencePatternSelect.items.each(function(radio) {
			radio.setValue(radio.patternValue == type);
		});

		var startDate = record.get('recurrence_start');
		if (startDate) {
			// The start date is an UTC representation
			startDate = startDate.toUTC();
		} else {
			startDate = new Date().clearTime();
		}
		var endDate = record.get('recurrence_end');
		if (endDate) {
			// The end date is an UTC representation
			endDate = endDate.toUTC();
		} else {
			endDate = startDate.clone();
		}
		var startOcc = record.get('recurrence_startocc');
		var endOcc = record.get('recurrence_endocc');

		// We construct a startTime based on the first day of the year,
		// this guarentees that we are absolutely DST safe, and any time
		// can be selected.
		var startTime = new Date().clearTime();
		startTime.setDate(1);
		startTime.setMonth(0);
		startTime.setHours(startOcc / 60);
		startTime.setMinutes(startOcc % 60);

		// We construct a endTime based on the first day of the year,
		// this guarentees that we are absolutely DST safe, and any time
		// can be selected.
		var endTime = new Date().clearTime();
		endTime.setDate(1);
		endTime.setMonth(0);
		endTime.setHours(endOcc / 60);
		endTime.setMinutes(endOcc % 60);

		this.startDateField.setValue(startDate);
		this.timeperiodField.getValue().set(startTime, endTime);

		if(contentReset === true || record.isModifiedSinceLastUpdate('recurrence_startocc') || record.isModifiedSinceLastUpdate('recurrence_endocc')) {
			this.updateDurationLabel();
		}

		var endTerm = record.get('recurrence_term');
		Ext.each(this.endPatternPanel.findByType('radio'), function(radio) {
			radio.setValue(radio.endTerm == endTerm);
		});

		switch (endTerm) {
			case Zarafa.common.recurrence.data.RecurrenceEnd.NEVER:
				// Only apply default values at the first update
				if (contentReset === true) {
					this.endOccurencesSpinner.setValue(10);
				}
				if (contentReset === true || (record.isModifiedSinceLastUpdate('recurrence_start') && startDate > this.endOnDateField.getValue())) {
					this.endOnDateField.setValue(startDate.clearTime(true));
				}
				break;
			case Zarafa.common.recurrence.data.RecurrenceEnd.N_OCCURENCES:
				// Only apply default values at the first update
				if (contentReset === true || record.isModifiedSinceLastUpdate('recurrence_numoccur')) {
					this.endOccurencesSpinner.setValue(record.get('recurrence_numoccur'));
				}
				if (contentReset === true) {
					this.endOnDateField.setValue(startDate.clearTime(true));
				}
				break;
			case Zarafa.common.recurrence.data.RecurrenceEnd.ON_DATE:
				// Only apply default values at the first update
				if (contentReset === true) {
					this.endOccurencesSpinner.setValue(10);
				}
				if (contentReset === true || record.isModifiedSinceLastUpdate('recurrence_end')) {
					this.endOnDateField.setValue(endDate.clearTime(true));
				}
				break;
		}

		this.alldayCheckbox.setValue(record.get('alldayevent'));
	},

	/**
	 * Record updater. This will update the record with all data from the UI components
	 * inside the Panel.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record to update
	 * @private
	 */
	updateRecord : function(record)
	{
		record.beginEdit();

		var pattern = this.recurrencePatternSelect.getValue();
		if (pattern) {
			record.set('recurrence_type', pattern.patternValue);
		} else {
			record.set('recurrence_type', Zarafa.common.recurrence.data.RecurrenceType.NONE);
		}

		// The start is represented in UTC time,
		// so convert it to local to get the time for the property
		record.set('recurrence_start', this.startDateField.getValue().fromUTC());

		Ext.each(this.endPatternPanel.findByType('radio'), function(radio) {
			if (radio.getValue()) {
				record.set('recurrence_term', radio.endTerm);
				return false;
			}
		});

		switch (record.get('recurrence_term')) {
			case Zarafa.common.recurrence.data.RecurrenceEnd.NEVER:
				record.set('recurrence_numoccur', undefined);
				// The end is represented in UTC time,
				// so convert it to local to get the time for the property
				record.set('recurrence_end', new Date('Jan 01 4501').fromUTC());
				break;
			case Zarafa.common.recurrence.data.RecurrenceEnd.N_OCCURENCES:
				record.set('recurrence_numoccur', this.endOccurencesSpinner.getValue());
				// The end is represented in UTC time,
				// so convert it to local to get the time for the property
				record.set('recurrence_end', new Date('Jan 01 4501').fromUTC());
				break;
			case Zarafa.common.recurrence.data.RecurrenceEnd.ON_DATE:
				record.set('recurrence_numoccur', undefined);
				// The end is represented in UTC time,
				// so convert it to local to get the time for the property
				record.set('recurrence_end', this.endOnDateField.getValue().fromUTC());
				break;
		}

		// The recurrence_start and the time values might have changed, time
		// to update the appointment data now as well.
		record.set('alldayevent', this.alldayCheckbox.getValue());

		var timeRange = this.timeperiodField.getValue();
		var startOcc = (timeRange.getStartDate().getHours() * 60) + timeRange.getStartDate().getMinutes();
		var endOcc = startOcc + timeRange.getDuration(Date.MINUTE);

		record.set('recurrence_startocc', startOcc);
		record.set('recurrence_endocc', endOcc);

		var startDate = this.startDateField.getValue();
		var dueDate = startDate.clone();

		// Small workaround for allday appointments, in Brasil the DST occurs at 00:00,
		// which means for allday events, that we might think the appointment should start
		// at 01:00, but that might be because that is the start of the actual day. Hence
		// we need to correct the startOcc here for that.
		if (record.get('alldayevent') && startDate.clearTime(true).getTime() === startDate.getTime()) {
			var offset = startDate.getHours() * 60;
			startOcc -= offset;
			endOcc -= offset;
		}

		startDate = startDate.add(Date.MINUTE, startOcc);
		record.set('startdate', startDate);
		record.set('commonstart', startDate);

		dueDate = dueDate.add(Date.MINUTE, endOcc);
		record.set('duedate', dueDate);
		record.set('commonend', dueDate);

		record.endEdit();
	}
});

Ext.reg('zarafa.recurrencepanel', Zarafa.common.recurrence.dialogs.RecurrencePanel);
