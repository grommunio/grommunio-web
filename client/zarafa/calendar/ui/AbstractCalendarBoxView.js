Ext.namespace('Zarafa.calendar.ui');

/**
 * @class Zarafa.calendar.ui.AbstractCalendarBoxView
 * @extends Zarafa.calendar.ui.AbstractCalendarView
 *
 * The main calendar showing appointments as boxed (see {@link Zarafa.calendar.ui.AbstractCalendarBoxView BoxView}.
 * A {@link Zarafa.calendar.ui.CalendarPanel CalendarPanel} may show several individual calendars,
 * each represented by a subclass of {@link Zarafa.calendar.ui.AbstractCalendarBoxView AbstractCalendarBoxView}.
 *
 * The BoxView is used to display multiple weeks in a single view (e.g. a month). For displaying only a few days,
 * it is recommended to use the {@link Zarafa.calendar.ui.AbstractCalendarDaysView DaysView} instead.
 * The days which have been loaded will not always match the days which are visible in the view. This is because
 * the view will only display whole weeks, while in a monthview, the first day of the month might be in the middle
 * of the week. Hence some extra days will be rendered into the view which are marked as inactive. These days do not
 * contain any appointments, and will be displayed differently than active days, to clearly show their special status.
 */
Zarafa.calendar.ui.AbstractCalendarBoxView = Ext.extend(Zarafa.calendar.ui.AbstractCalendarView, {
	/**
	 * Array of {@link Zarafa.calendar.data.DayBoxConfiguration configuration} objects for the
	 * Day positions within this view. 
	 * @property
	 * @type Array
	 */
	dayBoxConfigurations : undefined,

	/**
	 * @cfg {Number} firstDayOfWeek The day number of the first day of the week (0: sunday, 1: monday, ...)
	 * This day will be shown as the left column.
	 */
	firstDayOfWeek : 1,

	/**
	 * @cfg {Number} dayHeaderHeight The height of the Box Header (containing the date)
	 */
	dayHeaderHeight : 24,

	/**
	 * @cfg {Number} headerHeight The height of the Calendar Header (containing the column title).
	 */
	headerHeight : 30,

	/**
	 * @cfg {Number} appointmentHeight The height of an appointment within the calendar view.
	 */
	appointmentHeight : 30,

	/**
	 * @cfg {Number} expandThreshold The threshold in pixels which must remain empty at the bottom of
	 * box. If there are more appointments that should be visible in that box, they will not be rendered.
	 */
	expandThreshold : 10,

	/**
	 * The number of days per week.
	 * @property
	 * @type Number
	 */
	numDaysInWeek : 7,

	/**
	 * The format which must be passed to the {@link Date#format} function when
	 * the width of the dayHeader is smaller then the configured
	 * {@link Zarafa.calendar.ui.CalendarMultiView#minHeaderDayTextWidth minHeaderDayTextWidth}.
	 * If there is sufficient width, then {@link #longDayHeaderFormat} will be used.
	 * @property
	 * @type String
	 */
	// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
	shortDayHeaderFormat : _('l'),

	/**
	 * The format which must be passed to the {@link Date#format} function when
	 * the width of the dayHeader is greater then the configured
	 * {@link Zarafa.calendar.ui.CalendarMultiView#minHeaderDayTextWidth minHeaderDayTextWidth}.
	 * If there is not sufficient width, then {@link #shortDayHeaderFormat} will be used.
	 * @property
	 * @type String
	 */
	// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
	longDayHeaderFormat : _('l'),

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		// If not explicitely configured, the firstDayOfWeek is determined
		// by the Settings option.
		if (!Ext.isDefined(config.firstDayOfWeek)) {
			config.firstDayOfWeek = container.getSettingsModel().get('zarafa/v1/main/week_start');
		}

		Ext.applyIf(config, {
			appointmentBodyLeftMargin : 6,
			appointmentBodyRightMargin : 6
		});

		// If Drag & Drop is enabled by the enableDD option, we must split it up
		// to only enable Drag & Drop for the body element, as we have no functional
		// Drag & Drop support for the header of this view.
		if (config.enableDD === true) {
			Ext.apply(config, {
				enableDD : false,
				enableBodyDD : true
			});
		}

		Zarafa.calendar.ui.AbstractCalendarBoxView.superclass.constructor.call(this, config);
	},

	/**
	 * The {@link Zarafa.calendar.ui.CalendarMultiView CalendarMultiView} view has a header area that automatically
	 * resizes when its child views require more space. In the days view for instance, appointments that span
	 * more than 24 hours are laid out in the header. 
	 * @return {Number} height in pixels the calendar view needs to properly lay out its header.
	 */
	getDesiredHeaderHeight : function()
	{
		return this.headerHeight;
	},

	/**
	 * Determine the Header Text which must be displayed for the given column.
	 * This will apply the {@link #dayHeaderFormat}.
	 * @param {Date} date The date for which the header title is requested
	 * @param {Number} width The available width for the header
	 * @private
	 */
	getDayHeaderTitle : function(date, width)
	{
		var dateFormat;

		if (width >= this.parentView.minHeaderDayTextWidth) {
			dateFormat = this.longDayHeaderFormat;
		} else {
			dateFormat = this.shortDayHeaderFormat;
		}

		return date.format(dateFormat);
	},

	/**
	 * Converts a location in page coordinates to a corresponding date.
	 * @param {Number} x horizontal component of the location   
	 * @param {Number} y vertical component of the location
	 * @return {Date} a Date object that corresponds to the given location   
	 */
	screenLocationToDate : function(x, y)
	{
		var bodyX = x - this.body.getLeft();
		var bodyY = y - this.body.getTop();

		for (var i=0, configuration; configuration=this.dayBoxConfigurations[i]; i++) {
			if (bodyX>configuration.left && bodyX<=configuration.right && bodyY>configuration.top && bodyY<=configuration.bottom)
			{
				// Check if the location is in the left or right half of the box. If it's in the right half
				// the location is actually closer to the date of the next box (next day), so we'll return 
				// the date plus one day instead.
				// return (configuration.right-bodyX < bodyX-configuration.left) ? configuration.date.add(Date.DAY, 1) : configuration.date;
				return configuration.date;
			}
		}

		return null;
	},

	/**
	 * Converts a location in page coordinates to a corresponding daterange.
	 * @param {Number} x horizontal component of the location   
	 * @param {Number} y vertical component of the location
	 * @return {Zarafa.core.DateRange} A DateRange object that corresponds to the given location
	 */
	screenLocationToDateRange : function(x, y)
	{
		// Both the start and dueDate need a clearTime() call, this
		// is in case of DST switches for Brasil where 00:00 doesn't exist
		// and clearTime() will return 01:00.
		var date = this.screenLocationToDate(x, y);

		// check for the valid date object
		if (Ext.isDate(date)) {
			date.setHours(12);
			var dueDate = date.add(Date.DAY, 1);

			return new Zarafa.core.DateRange({ startDate : date.clearTime(), dueDate : dueDate.clearTime() });
		}

		return null;
	},

	/**
	 * Converts a date range ([startDate, dueDate>) to zero or more (left, right, top, bottom) bounds objects.
	 * This method is used to lay out appointments (and proxies) on the calendar body.
	 * @param {Zarafa.core.DateRange} dateRange date range  
	 * @param {Number} column (optional) when several appointments are overlapping a column may be assigned
	 * @param {Number} columnCount (optional) the number of overlapping appointments in an overlap dependency graph
	 * @param {Boolean} useMargin (optional) True to apply a right margin to the appointments to prevent them from
	 * filling up the entire width of a daybox.
	 */
	dateRangeToBodyBounds : function(dateRange, slot, slotCount, useMargin)
	{
		var visible = this.getVisibleDateRange();
		var visibleWeeks = this.getVisibleWeekCount(visible);
		var fill = slot === undefined;
		slot = slot || 0;
		
		var weekStart = visible.getStartDate();
		var startDate = dateRange.getStartDate();
		var dueDate  = dateRange.getDueDate();

		// To determine the number of days between the 2 dates.
		// To improve the result we should force both dates to be
		// around the same time. This prevents problems when the
		// start of the date variable is on a DST day where (in case
		// of Brasil) the DST switch occurs on midnight. Causing
		// a off-by-one error in the Math.floor(Date.diff()) line.
		weekStart = weekStart.clone();
		weekStart.setHours(12);
		startDate = startDate.clone();
		startDate.setHours(12);
		dueDate = dueDate.clone();
		dueDate.setHours(12);

		var ret = [];
		var leftMargin = useMargin ? this.appointmentBodyLeftMargin : 0;
		var rightMargin = useMargin ? this.appointmentBodyRightMargin : 0;

		for (var i=0; i<visibleWeeks; i++)
		{
			var weekDue = weekStart.add(Date.DAY, this.numDaysInWeek);
			weekDue.setHours(12);

			var startDay = Math.floor(Date.diff(Date.DAY, startDate, weekStart));
			var dueDay = Math.floor(Date.diff(Date.DAY, dueDate, weekStart));

			// Handles a corner case where the appointment ends at exactly 00:00 the next day,
			// which means that the appointment is actually the end of the previous day.
			var origDue = dateRange.getDueDate();
			if (origDue.getTime() == origDue.clearTime(true).getTime()) {
				// Here it will check that appointment is not 0 minute appointment.
				if(!dateRange.isZeroMinuteRange()) {
					dueDay--;
				}
			}

			startDay = Math.max(startDay, 0);
			dueDay = Math.min(dueDay, 6);
			
			if (startDay<7 && dueDay>=0)
			{
				var startdayBoxConfigurations = this.dayBoxConfigurations[i*7 + startDay];
				var duedayBoxConfigurations = this.dayBoxConfigurations[i*7 + dueDay];
				
				var top = startdayBoxConfigurations.top + this.dayHeaderHeight + this.appointmentHeight * slot - 3*slot;
				var bottom = fill ? startdayBoxConfigurations.bottom : top + this.appointmentHeight;
				
				if (fill || bottom < startdayBoxConfigurations.bottom - this.expandThreshold)
					ret.push({
						left : startdayBoxConfigurations.left + leftMargin + 1,
						right : duedayBoxConfigurations.right - rightMargin - 1,
						top : top,
						bottom : bottom,
						firstBox : true,
						lastBox : true
					});
			}

			weekStart = weekDue;

			if (weekStart > dueDate) {
				break;
			}
		}

		return ret;
	},

	/**
	 * Find all {@link Zarafa.calendar.ui.AppointmentView appointments} which
	 * fall within the given {@link Zarafa.core.DateRange dateRange}.
	 * @param {Zarafa.core.DateRange} The daterange for which the appointments are sought.
	 * @return {Array} The array of {@link Zarafa.calendar.ui.AppointmentView appointments}.
	 */
	findAppointmentsByRange : function(dateRange)
	{
		var ret = [];
		for (var i=0, appointment; appointment=this.appointments[i]; i++) {
			if (dateRange.inside(appointment.getDateRange())) {
				ret.push(appointment);
			}
		}
		
		return ret;
	},

	/**
	 * Find the {@link Zarafa.calendar.ui.AppointmentView appointment} with the highest
	 * {@link Zarafa.calendar.ui.AppointmentView#slot slot} value. within the given
	 * {@link Zarafa.core.DateRange dateRange}.
	 * @param {Zarafa.core.DateRange} The daterange for which the appointments are sought.
	 * @return {Number} The highest slot value
	 */
	maxSlotInRange : function(dateRange)
	{
		var ret = 0;

		for (var i=0, appointment; appointment=this.appointments[i]; i++) {
			if (dateRange.overlaps(appointment.getDateRange())) {
				ret = Math.max(ret, appointment.slot);
			}
		}
		
		return ret;
	},

	/**
	 * Return the {@link Zarafa.core.DateRange dateRange} of the period
	 * which is visible within this calendar view. This might be a larger
	 * number of days, as the loaded dateRange might start (or end) in the middle
	 * of the week. But the BoxView could show the entire week instead, meaning
	 * that extra boxes will have been rendered.
	 * @return {Zarafa.core.DateRange} The visible daterange
	 */
	getVisibleDateRange : function()
	{
		// Detect the Date of the first day of the week for the start date of the loaded range
		var visibleStart = this.getStartDate().getPreviousWeekDay(this.firstDayOfWeek);
		// Detect the Date of the last day of the week for the due date of the loaded range     
		var visibleDue = this.getDueDate().getNextWeekDay(this.firstDayOfWeek);	
		return new Zarafa.core.DateRange({ startDate : visibleStart, dueDate : visibleDue });
	},

	/**
	 * Return the number of visible weeks (See {@link #getVisibleDateRange}.
	 * @param {Zarafa.core.DateRange} range (optional) The daterange for which the number of weeks must be calculated,
	 * if not provided, then {@link #getVisibleDateRange} will be used.
	 * @return {Number} The number of visible weeks
	 */
	getVisibleWeekCount : function(range)
	{
		range = range || this.getVisibleDateRange();
		return Math.round(Date.diff(Date.DAY, range.getDueDate(), range.getStartDate()) / 7);
	},

	/**
	 * Initializes and returns the {@link #dayBoxConfigurations} array.
	 * @param {Number} height The height over which all the dayboxes must be spread
	 * @return {Array} The {@link Zarafa.calendar.data.DayBoxConfiguration DayBox} Configuration objects
	 */
	calculateDayBoxConfigurations : function(height)
	{
		if (!height) {
			height = this.body.getHeight();
		}

		var visibleRange = this.getVisibleDateRange();
		var visibleWeeks = this.getVisibleWeekCount(visibleRange);
		this.dayBoxConfigurations = [];
		var dayWidth = (this.body.getWidth()-1) / this.numDaysInWeek;
		var dayHeight = (height-1) / visibleWeeks;

		// Set the hours to 12 so we can safely use Date.add(Date.DAY, ...)
		// for cases where the DST switch occurs at 00:00 (like in Brasil).
		var firstVisibleDay = visibleRange.getStartDate().clone();
		firstVisibleDay.setHours(12);
		var todayTime = (new Date()).clearTime().getTime();

		for (var i=0; i<visibleWeeks; i++) {
			for (var j=0; j<this.numDaysInWeek; j++)
			{
				var busyStatus = 0;
				var date = firstVisibleDay.add(Date.DAY, (i * this.numDaysInWeek) + j);
				var dueDate = date.add(Date.DAY, 1);

				date.clearTime();
				dueDate.clearTime();

				var dayRange = new Zarafa.core.DateRange({ startDate : date, dueDate : dueDate });
				var workingDay = (this.parentView.workingDays.indexOf(date.getDay()) >= 0);
				var appointments = this.findAppointmentsByRange(dayRange);

				Ext.each(appointments, function(appointment) {
					var appointmentStatus = appointment.getRecord().get('busystatus');
					busyStatus = Math.max(busyStatus, appointmentStatus);
				});

				var boxHeight = Math.round((i+1) * dayHeight) + 1 - Math.round(i * dayHeight);
				var overflowSlot = Math.floor((boxHeight - this.headerHeight - this.expandThreshold) / this.appointmentHeight);

				// Here it will get the first and last date of selected month.
				var activeDateRange = this.contextModel.getActiveDateRange();

				this.dayBoxConfigurations.push(new Zarafa.calendar.data.DayBoxConfiguration({
					left : Math.round(j * dayWidth),
					right : Math.round((j+1) * dayWidth) + 1,
					top : Math.round(i * dayHeight),
					bottom : Math.round((i+1) * dayHeight) + 1,
					date : date,
					today : todayTime == date.getTime(),
					workingDay : workingDay, 
					busyStatus : busyStatus,
					overflow : this.maxSlotInRange(dayRange) >= overflowSlot,
					active : date.getTime() >= activeDateRange.getStartDate().getTime() && date.getTime() < activeDateRange.getDueDate().getTime()
				}));
			}
		}

		return this.dayBoxConfigurations;
	}
});
