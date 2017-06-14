Ext.namespace('Zarafa.common.flags.ui');

/**
 * @class Zarafa.common.flags.ui.FlagsMenu
 * @extends Ext.menu.Menu
 * @xtype zarafa.flagsmenu
 *
 * The FlagsMenu is the menu that is shown for flags.
 */
Zarafa.common.flags.ui.FlagsMenu = Ext.extend(Ext.menu.Menu, {
	/**
	 * @cfg {Zarafa.core.data.IPMRecord[]} The records to which the actions in
	 * this menu will apply
	 */
	records : [],

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
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		if ( !Array.isArray(config.records) ){
			config.records = [config.records];
		}

		// Add the records to the shadow store, because otherwise we cannot
		// save them when the mail grid refreshes while we have this context
		// menu open.
		var shadowStore = container.getShadowStore();
		config.records = config.records.map(function(record){
			record = record.copy();
			shadowStore.add(record);
			return record;
		});

		Ext.applyIf(config, {
			xtype: 'zarafa.flagsmenu',
			cls: 'k-flags-menu',
			items: this.createMenuItems(),
			listeners: {
				scope: this,
				destroy: this.onDestroy
			}
		});

		Zarafa.common.flags.ui.FlagsMenu.superclass.constructor.call(this, config);
	},

	/**
	 * Create the menu items that should be shown in the flags menu
	 * @return {Zarafa.core.ui.menu.ConditionalItem[]} The list of menu items of
	 * the flags menu
	 * @private
	 */
	createMenuItems : function()
	{
		return [{
			text: _('Today'),
			iconCls : 'icon_mail_flag_red',
			action: 'today',
			handler: this.setFlag,
			scope: this
		}, {
			text: _('Tomorrow'),
			iconCls : 'icon_mail_flag_orange_dark',
			action: 'tomorrow',
			handler: this.setFlag,
			scope: this
		}, {
			text: _('This week'),
			iconCls : 'icon_mail_flag_orange',
			action: 'this_week',
			handler: this.setFlag,
			scope: this
		}, {
			text: _('Next week'),
			iconCls : 'icon_mail_flag_yellow',
			action: 'next_week',
			handler: this.setFlag,
			scope: this
		}, {
			text: _('No date'),
			iconCls : 'icon_mail_flag_red',
			action: 'no_date',
			handler: this.setFlag,
			scope: this
		}, {
			xtype: 'menuseparator'
		}, {
			text: _('Complete'),
			iconCls : 'icon_flag_complete',
			action: 'complete',
			handler: this.setFlag,
			scope: this
		}, {
			text: _('None'),
			iconCls : 'icon_mail_flag',
			action: 'none',
			handler: this.setFlag,
			scope: this
		}];
	},

	/**
	 * Event handler for the destroy event of the component. Will remove the records that
	 * were copied from the shadow store.
	 */
	onDestroy : function()
	{
		var shadowStore = container.getShadowStore();
		this.records.forEach(function(record){
			shadowStore.remove(record);
		});
	},

	/**
	 * Event handler for the click event of the items in the flag menu. Will set the required properties
	 * on the selected records.
	 *
	 * @param {Zarafa.core.ui.menu.ConditionalItem} menuItem The menu item that was clicked
	 */
	setFlag : function(menuItem)
	{
		var flagProperties = {
			flag_icon: 			Zarafa.core.mapi.FlagIcon.red,
			flag_request: 		'Follow up',
			flag_status: 		Zarafa.core.mapi.FlagStatus.flagged,
			flag_complete_time:	null,
			reminder_set:		true
			// TODO: Do we need to set is_marked_as_task for Outlook???
			// (here and in the functions below)
		};

		switch ( menuItem.action ) {
			case 'no_date':
				Ext.apply(flagProperties, this.getFlagPropertiesNoDate());
				break;
			case 'today':
				Ext.apply(flagProperties, this.getFlagPropertiesToday());
				break;
			case 'tomorrow':
				Ext.apply(flagProperties, this.getFlagPropertiesTomorrow());
				break;
			case 'this_week':
				Ext.apply(flagProperties, this.getFlagPropertiesThisWeek());
				break;
			case 'next_week':
				Ext.apply(flagProperties, this.getFlagPropertiesNextWeek());
				break;
			case 'complete':
				Ext.apply(flagProperties, this.getFlagPropertiesComplete());
				break;
			case 'none':
				Ext.apply(flagProperties, this.getFlagPropertiesRemoveFlag());
				break;
		}

		// Now set the properties an all selected records
		this.records.forEach(function(record){
			record.beginEdit();
			for ( var property in flagProperties ){
				record.set(property, flagProperties[property]);
			}
			record.endEdit();
			record.save();
		}, this);
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
			task_start_date: 	null,
			task_due_date: 		null,
			reminder_set:		false,
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
			task_start_date: 	date,
			task_due_date: 		date,
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
			task_start_date: 	date,
			task_due_date: 		date,
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
			task_start_date: 	startDate,
			task_due_date: 		dueDate,
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
			task_start_date: 	startDate,
			task_due_date: 		dueDate,
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
			flag_request: 		'',
			flag_status: 		Zarafa.core.mapi.FlagStatus.completed,
			reminder_set:		false,
			task_start_date: 	null,
			task_due_date: 		null
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
			reminder_set:		false,
			task_start_date: 	null,
			task_due_date: 		null,
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
	}
});

Ext.reg('zarafa.flagsmenu', Zarafa.common.flags.ui.FlagsMenu);