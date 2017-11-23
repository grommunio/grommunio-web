Ext.namespace('Zarafa.calendar');

/**
 * @class Zarafa.calendar.CalendarContextModel
 * @extends Zarafa.core.MultiFolderContextModel
 * 
 * Model class that keeps track of data in the calendar context that is being modified and read by various sources.
 * This includes the current selected date, visible date range (start, due), mode (day, work week, week, month) and 
 * selected folder list. 
 * <p>
 * The date range is recalculated when the active date is set. For instance, when the mode is set to 'week' and the
 * active date is changed to 17th of July, 2009 the range will be set to 13-19 July, 2009. 
 */
Zarafa.calendar.CalendarContextModel = Ext.extend(Zarafa.core.MultiFolderContextModel, {
	/**
	 * The dateRange which is used as restriction for loading appointments
	 * from the selected {@link #folders}. The dateRange will overlap the {@link #date},
	 * as {@link #date} is used which date the user selected, while the {@link #dateRange}
	 * is used to indicate which corresponding range of dates has been loaded. For example,
	 * if the user clicked on January 11 2011, and the current DataMode is {@link Zarafa.calendar.data.DataMode.WEEK week}
	 * then the DateRange will be January 10 to January 16 2011.
	 *
	 * @property
	 * @type Zarafa.core.DateRange
	 */
	dateRange : undefined,

	/**
	 * True if the {@link #dateRange} will not be needed during {@link #load}. This means that the loaded
	 * appointments will not be restricted to a particular date range.
	 * @property
	 * @type Boolean
	 */
	ignoreDateRange : false,

	/**
	 * The {@link Date date} which has been selected by the user. This is used as base date
	 * for the {@link #dateRange} object. See the comment at {@link #dateRange} on how
	 * the values relate to eachother.
	 *
	 * @property
	 * @type Date
	 */
	date : undefined,

	/**
	 * When searching, this property marks the {@link Zarafa.core.ContextModel#getCurrentDataMode datamode}
	 * which was used before {@link #onSearchStart searching started} the datamode was switched to
	 * {@link Zarafa.calendar.data.DataModes#SEARCH}.
	 * @property
	 * @type Mixed
	 * @private
	 */
	oldDataMode : undefined,

	/**
	 * The activeDateRange which contains the start and due date of selected month.For example,
	 * if the user clicked on November 27 2013, then the activeDateRange will be November 1 to November 30 2013.
	 * 
	 * @property
	 * @type Zarafa.core.DateRange
	 */
	activeDateRange : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		if(!Ext.isDefined(config.store)) {
			config.store = new Zarafa.calendar.AppointmentStore();
		}

		Ext.applyIf(config, {
			statefulRecordSelection : true,
			colorScheme: Zarafa.core.ColorSchemes.getColorSchemes(),
			current_data_mode : Zarafa.calendar.data.DataModes.WORKWEEK
		});

		this.date = new Date().clearTime(true);
		this.dateRange = new Zarafa.core.DateRange();
		
		this.addEvents([
			/**
			 * @event datechange
			 * Fires when the selected date is changed.
			 * @param {Zarafa.calendar.CalandarContextModel} model this calendar context model.   
			 * @param {Date} date New configured date.
			 * @param {Date} oldDate Previously configured date
			 */
			'datechange',
			/**
			 * @event daterangechange
			 * Fires when the date range is changed.
			 * @param {Zarafa.calendar.CalandarContextModel} model this calendar context model.   
			 * @param {Zarafa.core.DateRange} newDateRange new date range.
			 * @param {Zarafa.core.DateRange} oldDateRange old date range.
			 */
			'daterangechange',

			/**
			 * @event activate
			 * Fires when select calendar by clicking on calendar tab.
			 * @param {Zarafa.hierarchy.data.MAPIFolderRecord[]} folder which will mark as selected
			 */
			'activate'

		]);

		Zarafa.calendar.CalendarContextModel.superclass.constructor.call(this, config);

		this.on({
			'searchstart' : this.onSearchStart,
			'searchstop' : this.onSearchStop,
			scope : this
		});

		this.calculateDateRange(this.date);
	},

	/**
	 * Enables the context.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder folder to bid on.
	 * @param {Boolean} suspended True to enable the ContextModel {@link #suspendLoading suspended}
	 */
	enable : function(folder, suspended)
	{
		this.default_merge_state = container.getSettingsModel().get('zarafa/v1/contexts/calendar/default_merge_state');

		// Enable the superclass with suspended enabled, so we can safely change the date
		// after the superclass has been enabled.
		Zarafa.calendar.CalendarContextModel.superclass.enable.call(this, folder, true);
		this.setDate(this.date, true);

		// We enabled the superclass as suspended,
		// so time to resume it now.
		if (suspended !== true) {
			this.resumeLoading();
		}
	},

	/**
	 * Create a new {@link Zarafa.core.data.IPMRecord IPMRecord} record  which is associated to this context.
	 * this is a base function to create record. each context will overwrite this function to
	 * create record of that specific context.
	 * @param {Zarafa.core.IPMFolder} folder (optional) The target folder in which the new record must be
	 * created. If this is not provided the default folder will be used.
	 * @param {Zarafa.core.DateRange} dateRange (optional) The {@link Zarafa.core.DateRange DateRange} object
	 * that should be used to get start and due dates for the appointment.
	 * @return {Zarafa.core.data.IPMRecord} record  which is associated to this context.
	 */
	createRecord : function(folder, dateRange)
	{
		folder = folder || this.getDefaultFolder();
		var store;
		if (folder.existsInFavorites()) {
			store = container.getHierarchyStore().getById(folder.get('store_entryid'));
		} else {
			store = folder.getMAPIStore();
		}

		var zoomLevel = container.getSettingsModel().get('zarafa/v1/contexts/calendar/default_zoom_level');
		var defaultPeriod = container.getSettingsModel().get('zarafa/v1/contexts/calendar/default_appointment_period');

		// The default should be the next (rounded up) default Appointment time slot.
		// e.g. When creating a new appointment on 11:55, with a defaultPeriod of 30 minutes,
		// will create an appointment starting on 12:00.
		var startDate = new Date().ceil(Date.MINUTE, zoomLevel);
		// The default should be the default appointment time after the start date.
		var dueDate = startDate.add(Date.MINUTE, defaultPeriod);
		var allDay = false;
		var busyStatus = Zarafa.core.mapi.BusyStatus.BUSY;
		var duration = Date.diff(Date.SECOND, dueDate, startDate);

		// if daterange is provided then use start and due dates from that
		if(dateRange) {
			startDate = dateRange.getStartDate();
			dueDate = dateRange.getDueDate();
			duration = dateRange.getDuration(Date.MINUTE);

			if(dateRange.isAllDay()) {
				allDay = true;
				busyStatus = Zarafa.core.mapi.BusyStatus.FREE;
			}
		}

		var record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Appointment', {
			store_entryid : store.get('store_entryid'),
			parent_entryid : folder.get('entryid'),
			busystatus : busyStatus,
			startdate : startDate,
			duedate : dueDate,
			commonstart : startDate,
			commonend : dueDate,
			// Duration is in minutes, not seconds or millis.
			duration : duration,
			alldayevent : allDay
		});

		return record;
	},

	/**
	 * Loads the store with new data, based on the list of currently selected folders and selected date range.
	 */
	load : function()
	{
		if (this.ignoreDateRange) {
			Zarafa.calendar.CalendarContextModel.superclass.load.call(this);
		} else {
			Zarafa.calendar.CalendarContextModel.superclass.load.call(this, {
				params: {
					restriction : {
						startdate : this.dateRange.getStartTime() / 1000,
						duedate : this.dateRange.getDueTime() / 1000
					}
				}
			});
		}
	},
	
	/**
	 * Converts a date to a date range. The calendar context model has a mode that indicates the range
	 * type (day, workweek, week, month). This method calculates the appropriate date range to go with
	 * each mode. For example, if the mode is set to 'week', the range produced from a date is the range
	 * that starts on the first day of the week the input date is in, en ends on the first day of the next.
	 * 
	 * This method is used in conjunction with date pickers. When a user selects a date from the date picker
	 * control, depending on the mode, the calendar should navigate to either the day, workweek, week, or month
	 * that date is in.
	 * 
	 * If the newly calculated date range is different from the previous one, the store is automatically reloaded and
	 * the 'daterangechange' event is fired.
	 * 
	 * TODO this method reloads the store automatically when needed. This behavior is different from adding/removing
	 * selected folders. 
	 * 
	 * @param {Date} date date to set.
	 * @private 
	 */
	calculateDateRange : function(date)
	{
		var oldRange = this.dateRange.clone();
		var oldIgnore = this.ignoreDateRange;

		// Set the time to 12:00, this ensures that
		// we can safely use Date.add(Date.DAY, ..) without having
		// problems when the DST switch is at 00:00 (in Brasil).
		date = date.clone();
		date.setHours(12);

		switch (this.current_data_mode)
		{
			case Zarafa.calendar.data.DataModes.DAY:
				this.dateRange.set(date.clearTime(true), date.add(Date.DAY, 1).clearTime());
				this.ignoreDateRange = false;
				break;
			case Zarafa.calendar.data.DataModes.WORKWEEK:
				// get the first working day of the week.
				var weekStart = container.getSettingsModel().get('zarafa/v1/main/week_start');
				var workingDays = container.getSettingsModel().get('zarafa/v1/main/working_days');
				workingDays.sort();

				// If there are no working days selected, use the weekview like outlook does
				if (Ext.isEmpty(workingDays)) {
					this.setWeekView(date);
					break;
				}

				// The first day of the workweek is the first workday which is equal or higher
				// then the work day of the week (e.g. If my workweek is monday, tuesday, thursday,
				// and my first day of the week is wednesday, then the start of the workweek is
				// thursday). Determining the number of days which must be loaded is also never
				// and exact number, the workingDays array could contain gaps (the user can be
				// free on wednesday), in this case we do include the wednesday into the number
				// of days to load, but let the rendered filter those days out.
				if (weekStart <= workingDays[workingDays.length - 1]) {
					for (var i = 0, len = workingDays.length; i < len; i++) {
						if (workingDays[i] >= weekStart) {
							weekStart = workingDays[i];
							if (i === 0) {
								workingDays = 1 + workingDays[workingDays.length - 1] - workingDays[i];
							} else {
								workingDays = 1 + 7 - (workingDays[i] - workingDays[(i - 1)]);
							}
							break;
						}
					}
				} else {
					// Fix a corner case, if our weekStart is higher then the highest
					// working day, we have to wrap the entire week around to ensure
					// we still generate the full workweek.
					weekStart = workingDays[0];
					workingDays = workingDays[workingDays.length - 1];
				}

				// FIXME: Add exceptions to support the gaps in the workweek

				var start = date.getPreviousWeekDay(weekStart);
				this.dateRange.set(start.clearTime(true), start.add(Date.DAY, workingDays).clearTime());
				this.ignoreDateRange = false;
				break;
			case Zarafa.calendar.data.DataModes.WEEK:
				this.setWeekView(date);
				break;
			case Zarafa.calendar.data.DataModes.MONTH:
				var weekStart = container.getSettingsModel().get('zarafa/v1/main/week_start');

				// get the first and last date of month.
				var startDate = date.getFirstDateOfMonth();
				var dueDate = startDate.add(Date.MONTH, 1).clearTime();

				this.setActiveDateRange(startDate, dueDate);

				// get the visible date range of selected month.
				var visibleStartDate = startDate.getPreviousWeekDay(weekStart);
				var visibleDueDate = dueDate.getNextWeekDay(weekStart); 

				this.dateRange.set(visibleStartDate, visibleDueDate);
				this.ignoreDateRange = false;
				break;
		}
		
		
		if (!oldRange.equals(this.dateRange) || oldIgnore !== this.ignoreDateRange) {
			this.load();
			this.fireEvent('daterangechange', this, this.dateRange, oldRange);
		}
	},

	/**
	 * Function is going to set the date range for week view.
	 * it will show all seven days in calendar.
	 *
	 * @param {Date} date date that has been selected by the user
	 */
	setWeekView : function(date) 
	{
		// get the first working day of the week.
		var weekStart = container.getSettingsModel().get('zarafa/v1/main/week_start');
		var start = date.getPreviousWeekDay(weekStart);
		this.dateRange.set(start.clearTime(true), start.add(Date.DAY, 7).clearTime());
		this.ignoreDateRange = false;
	},

	/**
	 * It will set start and due date of selected month.
	 * 
	 * @param {Date} start the range's start date.
	 * @param {Date} due the range's due date.
	 */
	setActiveDateRange : function(start, due)
	{
		if(!Ext.isObject(this.activeDateRange)) {
			this.activeDateRange = new Zarafa.core.DateRange();
		}
		this.activeDateRange.set(start, due);
	},

	/**
	 * It will return activeDateRange if is set else return dateRange.
	 * Here activeDateRange contains start date of month to last date of selected month as date range and 
	 * dateRange contains all visible days in month view as date range.
	 * 
	 * @return {Zarafa.core.DateRange} will return if activeDateRange is set, otherwise will return visibleDateRange.
	 */
	getActiveDateRange : function()
	{
		if(Ext.isDefined(this.activeDateRange)) {
			return this.activeDateRange;
		} else {
			return this.dateRange;
		}
	},

	/**
	 * @param {Date} date to set. The date range (start, due) will be calculated so that the day, work week,
	 * week, or month selected will contain the given date.
	 * @param {Boolean} init True if this function is called during {@link #enable}
	 */
	setDate : function(date, init)
	{
		var oldDate = this.date;

		// clear time (round to whole days)
		date = date.clearTime(true);

		if (!init && oldDate.getTime() === date.getTime()) {
			return;
		}

		// set date
		this.date = date;
		this.fireEvent('datechange', this, date, this.oldDate);

		this.calculateDateRange(this.date);
	},
	
	/**
	 * Moves the start date forwards or backwards by n days, weeks, or months depending on the current mode. 
	 * Causes the 'datechange' event to be fired.  
	 * @param {Number} direction if set to -1 the date will be moved backwards in time, if set to 1 the date will move forwards.
	 */
	moveDate : function(direction)
	{
		var date = this.date.clone();

		// Set the time to 12:00, this ensures that
		// we can safely use Date.add(Date.DAY, ..) without having
		// problems when the DST switch is at 00:00 (in Brasil).
		date.setHours(12);

		switch (this.current_data_mode) {
			case Zarafa.calendar.data.DataModes.DAY:
				date = date.add(Date.DAY, 1 * direction);
				break;
			case Zarafa.calendar.data.DataModes.WEEK:
			case Zarafa.calendar.data.DataModes.WORKWEEK:
				date = date.add(Date.DAY, 7 * direction);
				break;
			case Zarafa.calendar.data.DataModes.MONTH:
				date = date.add(Date.MONTH, 1 * direction);
				break;
		}

		this.setDate(date.clearTime());
	},
	
	/**
	 * Moves the current date range to the 'next date', which can be the next day, week, or month depending on the current mode.
	 * Causes the 'datechange' event to be fired.  
	 */
	nextDate : function()
	{
		this.moveDate(1);
	},
	
	/**
	 * Moves the current date range to the 'previous date', which can be the previous day, week, or month depending on the current mode.
	 * Causes the 'datechange' event to be fired.  
	 */
	previousDate : function()
	{
		this.moveDate(-1);
	},

	/**
	 * Event handler which is executed right before the {@link #datamodechange}
	 * event is fired. This allows subclasses to initialize the {@link #store}.
	 * This will recalculate the {@link #dateRange} based on the previously configured
	 * {@link #date}.
	 *
	 * @param {Zarafa.calendar.CalendarContextModel} model The model which fired the event.
	 * @param {Zarafa.calendar.data.DataModes} newMode The new selected DataMode.
	 * @param {Zarafa.calendar.data.DataModes} oldMode The previously selected DataMode.
	 * @private
	 */
	onDataModeChange : function(model, newMode, oldMode) 
	{
		Zarafa.calendar.CalendarContextModel.superclass.onDataModeChange.call(this, model, newMode, oldMode);

		if (newMode !== oldMode && oldMode === Zarafa.calendar.data.DataModes.SEARCH) {
			this.stopSearch();
		}

		switch (newMode) {
			case Zarafa.calendar.data.DataModes.SEARCH:
				this.ignoreDateRange = true;
				break;
			case Zarafa.calendar.data.DataModes.ALL:
				this.ignoreDateRange = true;
				this.load();
				break;
			default:
				// call setDate to re-calculate the start and due dates
				this.calculateDateRange(this.date);
				break;
		}

	},
	
	/**
	 * Sets the current mode (one of {@link Zarafa.calendar.data.DataModes DataModes}) and date. This switches between view
	 * types (days, week, month) and sets the start date. The due date is calculated automatically.
	 * 
	 * Fires the {@link #datamodechange} event (but not the {@link #datechange} event).
	 *
	 * @param {Zarafa.calendar.data.DataModes} mode view mode (days, week, month).
	 * @param {Data} date start date. 
	 */
	setModeAndDate : function(mode, date)
	{
		this.date = date.clearTime(true);
		this.setDataMode(mode, true);
	},
	
	/**
	 * See getDateRangeText()
	 * @private
	 */
	getMonthRangeText : function()
	{
		var startDate = this.date.getFirstDateOfMonth();
		return startDate.format(_('F Y'));
	},
	
	/**
	 * Formats the current visible date range as human-readable text. When in day mode a simple date format is used,
	 * i.e. '19 September 2009'. When in month mode the returned text will show the month and year, i.e. 'September 2009'.
	 * <p>
	 * When showing a 'free' date range the formatter looks at which components the start and due dates have in common.
	 * For instance, the first and last days of a week range might lie in the same month (i.e. '13 - 19 July 2009'), 
	 * or they might not (i.e. '28 September - 2 November 2009'). Finally a range may have the start and end dates
	 * in different years, i.e. '28 December 2009 - 1 January 2010'. 
	 *   
	 * @return {String} the current date range as text. 
	 */
	getDateRangeText : function()
	{
		if (this.current_data_mode == Zarafa.calendar.data.DataModes.MONTH) {
			return this.getMonthRangeText();
		} else {
			return this.dateRange.format();
		}
	},

	/**
	 * Event handler for the {@link #searchstart searchstart} event.
	 * This will {@link #setDataMode change the datamode} to {@link Zarafa.calendar.data.DataModes#SEARCH search mode}.
	 * The previously active {@link #getCurrentDataMode view} will be stored in the {@link #oldDataMode} and will
	 * be recovered when the {@link #onSearchStop search is stopped}.
	 * @param {Zarafa.core.ContextModel} model The model which fired the event
	 * @private
	 */
	onSearchStart : function(model)
	{
		if(this.getCurrentDataMode() != Zarafa.calendar.data.DataModes.SEARCH){
			this.oldDataMode = this.getCurrentDataMode();
			this.setDataMode(Zarafa.calendar.data.DataModes.SEARCH);
		}
	},

	/**
	 * Event handler for the {@link #searchstop searchstop} event.
	 * This will {@link #setDataMode change the datamode} to the {@link #oldDataMode previous datamode}.
	 * @param {Zarafa.core.ContextModel} model The model which fired the event
	 * @private
	 */
	onSearchStop : function(model)
	{
		if (this.getCurrentDataMode() === Zarafa.calendar.data.DataModes.SEARCH) {
			this.setDataMode(this.oldDataMode);
		}
		delete this.oldDataMode;
	},

	/**
	 * Set the corresponding folder as active folder in hierarchy.
	 * And will mark the given folder as {@link Zarafa.hierarchy.ui.Tree#selectFolderInTree selected}.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord[]} folder which will mark as selected
	 */
	setActiveFolder : function(folder)
	{
		this.fireEvent('activate', folder, this);
	}
});
