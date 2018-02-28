Ext.namespace('Zarafa.common.flags');

/**
 * @class Zarafa.common.flags.Util
 * @extends Object
 *
 * Collection of common functions to handle flags
 */
Zarafa.common.flags.Util = {
	/**
	 * Number of the last working day of the week as set in the user's settings. 0 for Sunday,
	 * 1 for Monday, etc.
	 *
	 * @type Number
	 * @property
	 * @private
	 */
	lastWorkingDay : undefined,

	/**
	 * Number of the first working day of the week as set in the user's settings. 0 for Sunday,
	 * 1 for Monday, etc.
	 *
	 * @type Number
	 * @property
	 * @private
	 */
	firstWorkingDay : undefined,

	/**
	 * The start of the working day of the user in minutes after 0:00 am.
	 *
	 * @type Number
	 * @property
	 * @private
	 */
	startWorkingHour : undefined,

	/**
	 * Base flag properties
	 *
	 * @return {Object} Object with base properties.
	 */
	getFlagBaseProperties : function()
	{
		return {
			flag_icon: 		Zarafa.core.mapi.FlagIcon.red,
			flag_request: 		'Follow up',
			flag_status: 		Zarafa.core.mapi.FlagStatus.flagged,
			flag_complete_time:	null,
			reminder:		true
			// TODO: Do we need to set is_marked_as_task for Outlook???
			// (here and in the functions below)
		};
	},

	/**
	 * Returns the properties and their values that should be set on a record to
	 * flag without a date.
	 *
	 * @return {Object} Object with property/value as key/value pairs.
	 */
	getFlagPropertiesNoDate : function()
	{
		return {
			startdate :         null,
			duedate :           null,
			reminder:		false,
			reminder_time:		null,
			flag_due_by:		null
		};
	},

	/**
	 * Returns the properties and their values that should be set on a record to
	 * flag it for today and add a reminder when due.
	 *
	 * @return {Object} Object with property/value as key/value pairs.
	 */
	getFlagPropertiesToday : function()
	{
		var now = new Date();
		var date = now.clone().setToNoon();

		var reminderTime = now.clone().add(Date.HOUR, 1);
		// Make sure it will not be set tomorrow
		if ( reminderTime.getDay() !== now.getDay() ){
			reminderTime = now;
			reminderTime.setHours(23);
			reminderTime.setMinutes(59);
			reminderTime.setSeconds(59);
		}

		return {
			startdate :         date,
			duedate :           date,
			reminder_time:		reminderTime,
			flag_due_by:		reminderTime
		};
	},

	/**
	 * Returns the properties and their values that should be set on a record to
	 * flag it for tomorrow and add a reminder when due.
	 *
	 * @return {Object} Object with property/value as key/value pairs.
	 */
	getFlagPropertiesTomorrow : function()
	{
		var date = new Date().add(Date.DAY, 1).setToNoon();

		var reminderTime = this.getReminderTimeForDate(date);

		return {
			startdate :         date,
			duedate :           date,
			reminder_time:		reminderTime,
			flag_due_by:		reminderTime
		};
	},

	/**
	 * Returns the properties and their values that should be set on a record to
	 * flag it for this week and add a reminder when due.
	 *
	 * @return {Object} Object with property/value as key/value pairs.
	 */
	getFlagPropertiesThisWeek : function()
	{
		// Make sure the firstWorkingDay and lastWorkingDay properties are set
		this.retrieveWorkingDays();

		var today = new Date().setToNoon();
		var startDate;
		var dueDate;

		// If the work week has not started yet, set the start date to the first working day,
		// otherwise set it to today
		if ( today.getDay() < this.firstWorkingDay ) {
			startDate = today.clone().add(Date.DAY, this.firstWorkingDay - today.getDay());
		} else {
			startDate = today;
		}

		// If the work week has not ended yet, set the due date to the last working day,
		// otherwise set it to today
		if ( this.lastWorkingDay > today.getDay() ) {
			dueDate = today.clone().add(Date.DAY, this.lastWorkingDay - today.getDay());
		} else {
			dueDate = today;
		}

		// The reminder time will be set to the start of the work day at the due date,
		// unless that has already passed. Then it will be set to 1 hour from now.
		var reminderTime = this.getReminderTimeForDate(dueDate);
		var now = new Date();
		var nowPlus1 = now.add(Date.HOUR, 1);
		if ( reminderTime < nowPlus1 ){
			reminderTime = nowPlus1;
			// Make sure it will not be set tomorrow
			if ( reminderTime.getDay() !== now.getDay() ){
				reminderTime = now;
				reminderTime.setHours(23);
				reminderTime.setMinutes(59);
				reminderTime.setSeconds(59);
			}
		}

		return {
			startdate :         startDate,
			duedate :           dueDate,
			reminder_time:		reminderTime,
			flag_due_by:		reminderTime
		};
	},

	/**
	 * Returns the properties and their values that should be set on a record to
	 * flag it for next week and add a reminder when due.
	 *
	 * @return {Object} Object with property/value as key/value pairs.
	 */
	getFlagPropertiesNextWeek : function()
	{
		// Make sure the firstWorkingDay and lastWorkingDay properties are set
		this.retrieveWorkingDays();

		var today = new Date().setToNoon();
		var startDate = today.add(Date.DAY, 7 + this.firstWorkingDay - today.getDay());
		var dueDate = startDate.add(Date.DAY, this.lastWorkingDay - this.firstWorkingDay);

		var reminderTime = this.getReminderTimeForDate(dueDate);

		return {
			startdate :         startDate,
			duedate :           dueDate,
			reminder_time:		reminderTime,
			flag_due_by:		reminderTime
		};
	},

	/**
	 * Returns the properties and their values that should be set on a record to
	 * flag it as complete.
	 *
	 * @return {Object} Object with property/value as key/value pairs.
	 */
	getFlagPropertiesComplete : function()
	{
		return {
			flag_icon: 			Zarafa.core.mapi.FlagIcon.clear,
			flag_complete_time:	new Date(),
			complete:			true,
			flag_request: 		'',
			flag_status: 		Zarafa.core.mapi.FlagStatus.completed,
			reminder:		false
		};
	},

	/**
	 * Returns the properties and their values that should be set on a record to
	 * remove the flag and reminder.
	 *
	 * @return {Object} Object with property/value as key/value pairs.
	 */
	getFlagPropertiesRemoveFlag : function()
	{
		return {
			flag_icon: 			Zarafa.core.mapi.FlagIcon.clear,
			flag_request: 		'',
			flag_status: 		Zarafa.core.mapi.FlagStatus.cleared,
			reminder:		false,
			startdate :         null,
			duedate :           null,
			reminder_time:		null,
			flag_due_by:		null
		};
	},

	/**
	 * Retrieves the values for {#firstWorkingDay} and {#lastWorkingDay}.
	 */
	retrieveWorkingDays : function()
	{
		if ( !this.firstWorkingDay ) {
			// Set it to Monday and Friday if no working days are defined by the user
			var workingDays = container.getSettingsModel().get('zarafa/v1/main/working_days') || [1, 5];
			workingDays.sort();

			this.firstWorkingDay = workingDays[0];
			this.lastWorkingDay = workingDays[workingDays.length-1];
		}
	},

	/**
	 * Returns a date object that is set at the starting work time of the user of the given day.
	 *
	 * @param {Date} date The date object of which the day must be used to set the reminder.
	 * @return {Date} The date object of the reminder
	 */
	getReminderTimeForDate : function(date)
	{
		var reminderTime = date.clone();
		var startWorkingHours = parseInt(container.getSettingsModel().get('zarafa/v1/main/start_working_hour'), 10);
		reminderTime.setHours(parseInt(startWorkingHours/60, 10));
		reminderTime.setMinutes(startWorkingHours%60);
		reminderTime.clearSeconds();

		return reminderTime;
	},

	/**
	 * Returns configured flag from given record.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record for which configured flag needs to be identified.
	 * @return {String/Boolean} Configured flag if any, false otherwise
	 */
	getConfiguredFlag : function(record)
	{
		var configuredFlag = '';
		var flagStatus = record.get('flag_status');
		if (flagStatus !== Zarafa.core.mapi.FlagStatus.flagged) {
			return false;
		}

		var taskStartDate = record.get('startdate');
		var taskDueDate = record.get('duedate');
		var todayNoon = new Date().clone().setToNoon();
		var tomorrowNoon = new Date().add(Date.DAY, 1).setToNoon();

		if (taskStartDate === null || taskDueDate === null) {
			return 'no_date';
		}

		taskStartDate = taskStartDate.getTime();
		taskDueDate = taskDueDate.getTime();
		if (taskStartDate === todayNoon.getTime() && taskDueDate === todayNoon.getTime()) {
			configuredFlag = _('today');
		} else if (taskStartDate === tomorrowNoon.getTime() && taskDueDate === tomorrowNoon.getTime()) {
			configuredFlag = _('tomorrow');
		} else {
			var thisWeekProps = this.getFlagPropertiesThisWeek();
			if (taskStartDate === thisWeekProps.startdate.getTime() && taskDueDate === thisWeekProps.duedate.getTime()) {
				configuredFlag = _('this week');
			} else {
				var nextWeekProps = this.getFlagPropertiesNextWeek();
				if (taskStartDate === nextWeekProps.startdate.getTime() && taskDueDate === nextWeekProps.duedate.getTime()) {
					configuredFlag = _('next week');
				}
			}
		}

		return configuredFlag;
	},

	/**
	 * Will update the categories of records with old-style flags to real categories. (e.g. a red flag will
	 * become a real red category)
	 * @param {Zarafa.core.data.IPMRecord[]} records The records which categories update with old-style flags
	 * to real categories.
	 */
	updateCategories : function(records)
	{
		if (!Array.isArray(records)) {
			records = [records];
		}
		records.forEach(function(record){
			const flagStatus = record.get('flag_status');
			const flagRequest = record.get('flag_request');
			if ( flagStatus===Zarafa.core.mapi.FlagStatus.flagged && flagRequest!=='Follow up'){
				const categories = Zarafa.common.categories.Util.getCategories(record);
				Zarafa.common.categories.Util.setCategories(record, categories);
			}
		});
	}
};
