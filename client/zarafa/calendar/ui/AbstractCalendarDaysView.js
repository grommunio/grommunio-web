Ext.namespace('Zarafa.calendar.ui');

/**
 * @class Zarafa.calendar.ui.AbstractCalendarDaysView
 * @extends Zarafa.calendar.ui.AbstractCalendarView
 *
 * The DaysView is used to display one or more days in columns next to eachother. This is usually limited to 7 days,
 * altough more days are supported. For an overview of a large number of days, the {@link Zarafa.calendar.ui.AbstractCalendarBoxView BoxView}
 * is however more recommended
 */
Zarafa.calendar.ui.AbstractCalendarDaysView = Ext.extend(Zarafa.calendar.ui.AbstractCalendarView, {
	/**
	 * Array of configuration {@link Zarafa.calendar.data.DayLayoutPosition DayLayoutPositions} within this view.
	 * @property
	 * @type Array
	 */
	dayLayoutPositions : [],

	/**
	 * The number of rows which are needed to display all all-day appointments
	 * for the given day.
	 * This property is calculated in {@link #calculateHeaderOverlaps}  (called by {@link #onBeforeLayout}) and used in
	 * {@link getDesiredHeaderHeight} to calculate the number of rows inside the {@link #header}.
	 * @property
	 * @type Number
	 */
	rowCount : 1,

	/**
	 * The format which must be passed to the {@link Date#format} function when
	 * the width of the dayHeader is smaller then the configured
	 * {@link Zarafa.calendar.ui.CalendarMultiView#minHeaderDayTextWidth minHeaderDayTextWidth}.
	 * If there is sufficient width, then {@link #longDayHeaderFormat} will be used.
	 * @property
	 * @type String
	 */
	// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
	shortDayHeaderFormat : _('jS'),

	/**
	 * The format which must be passed to the {@link Date#format} function when
	 * the width of the dayHeader is greater then the configured
	 * {@link Zarafa.calendar.ui.CalendarMultiView#minHeaderDayTextWidth minHeaderDayTextWidth}.
	 * If there is not sufficient width, then {@link #shortDayHeaderFormat} will be used.
	 * @property
	 * @type String
	 */
	// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
	longDayHeaderFormat : _('l jS F'),

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// Add 1 pixel to the left margin, this prevents the appointment
			// to overlap with the border.
			appointmentBodyLeftMargin : 1
		});

		Zarafa.calendar.ui.AbstractCalendarDaysView.superclass.constructor.call(this, config);
	},

	/**
	 * The {@link Zarafa.calendar.ui.CalendarMultiView CalendarMultiView} view has a header area that automatically
	 * resizes when its child views require more space.
	 * @return {Number} height in pixels the calendar view needs to properly lay out its header.
	 */
	getDesiredHeaderHeight : function()
	{
		// this.rowCount has been calculated in onBeforeLayout, so by the time this function is called it
		// should be up to date
		return Math.max(this.rowCount || 1, 1) * this.parentView.headerItemHeight + this.parentView.headerTextHeight;
	},

	/**
	 * Determines the height of the calendar header in which appointments can be positioned.
	 * @return {Number} height in pixels of the appointment header area
	 */
	getAppointmentHeaderheight : function()
	{
		return this.header.getHeight() - this.parentView.headerTextHeight;
	},

	/**
	 * Tests if the date range should be laid out in the header, which is when a range spans 24 hours or more.
	 * @return {Boolean} true if the date range represents 24 hours or more, false otherwise.
	 */
	isHeaderRange : function(dateRange)
	{
		return dateRange.getDuration(Date.DAY) >= 1;
	},

	/**
	 * Determine the Header Text which must be displayed for the given {@link Date}. If the
	 * available width for the header is sufficiently large (The width is greater then
	 * {@link Zarafa.calendar.ui.CalendarMultiView#minHeaderDayTextWidth minHeaderDayTextWidth})
	 * then the {@link #longDayHeaderFormat} will be used for fomatting the date. Otherwise the
	 * {@link #shortDayHeaderFormat} will be used.
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
	 * This calculates the positions of each day which must be rendered into this view.
	 * This initializes the {@link #dayLayoutPositions} array containing all the positioning information.
	 * @return {Array} The array of {@link Zarafa.calendar.data.DayLayoutPosition dayLayoutPositions}
	 * @private
	 */
	calculateDayLayoutPositions : function()
	{
		var todayTime = (new Date()).clearTime().getTime();
		var firstDay = this.getDateRange().getStartDate();
		var numDays = this.getDateRange().getNumDays();

		var headerWidth = (this.body.getWidth()-1) / numDays;

		// Because of DST switches at 00:00 in Brasil, ensure
		// we are using a safe time to perform the "add" action
		firstDay = firstDay.clone();
		firstDay.setHours(12);

		// calculate header positions (left, right)
		this.dayLayoutPositions = [];
		for (var i = 0; i < numDays; i++) {
			var date = firstDay.add(Date.DAY, i).clearTime();
			var workingDay = (this.parentView.workingDays.indexOf(date.getDay()) >= 0);

			this.dayLayoutPositions.push(new Zarafa.calendar.data.DayLayoutPosition({
				left : Math.round(i * headerWidth),
				right : Math.round((i+1) * headerWidth) + 1,
				date: date, // Make sure we select the start of the day
				today : (todayTime == date.getTime()),
				workingDay : workingDay
			}));
		}

		return this.dayLayoutPositions;
	},

	/**
	 * Calculate the {@link Date date} within this view based on the
	 * X & Y coordinates. This uses the {@link #dayLayoutPositions} to
	 * determine which day & time matches the XY coordinates.
	 *
	 * @param {Number} x horizontal component of the location
	 * @param {Number} y vertical component of the location
	 * @return {Date} a Date object that corresponds to the given location
	 * @private
	 */
	locationToDate : function(x, y)
	{
		var numDays = this.getDateRange().getNumDays();
		var stripHeight = this.parentView.numHours * this.parentView.getHourHeight();

		// determine the day they mouse is over (horizontal position)
		var day;
		if (x < this.dayLayoutPositions[0].left) {
			day = 0;
		} else if (x > this.dayLayoutPositions[numDays - 1].right) {
			day = numDays - 1;
		} else {
			for (var i = 0; i < this.dayLayoutPositions.length; i++) {
				if (x >= this.dayLayoutPositions[i].left && x<=this.dayLayoutPositions[i].right) {
					day = i;
					break;
				}
			}
		}

		// Get the start date of the visible range
		var startDate = this.getDateRange().getStartDate();

		// Our first action is to move the date to the correct day,
		// we do this at 12:00 so we don't need to worry about the
		// DST switch at 00:00
		var date = startDate.clone();
		date.setHours(12);
		date = date.add(Date.DAY, day).clearTime();

		// determine time in milliseconds (vertical position)
		var time = (y / stripHeight) * Date.dayInMillis;

		// In some cases, the day might not start at 00:00, this could
		// occur in Brasil for example where the DST switch occurs at
		// midnight. At that moment 00:00 -> 01:00 doesn't exist. We
		// must compensate for this alternative start of the day by reducing
		// the time offset with the minutes which we skipped at midnight.
		if (time > 0) {
			time -= ((date.getHours() * 60 * 60) + (date.getMinutes() * 60)) * 1000;
		}

		// return a new Date object with the appropriate time
		return date.add(Date.MILLI, time);
	},

	/**
	 * Converts a location in page coordinates to a corresponding date.
	 * @param {Number} x horizontal component of the location
	 * @param {Number} y vertical component of the location
	 * @return {Date} a Date object that corresponds to the given location
	 */
	screenLocationToDate : function(x, y)
	{
		// get height / width of header's parent as that container is scrollable and
		// will give proper viewable height / width for comparison
		if (Zarafa.core.Util.inside(this.header.parent().getBox(), x, y)) {
			return this.locationToDate(x - this.header.getX(), 0);
		} else {
			return this.locationToDate(x - this.body.getX(), y - this.body.getY());
		}
	},

	/**
	 * Converts a location in page coordinates to a corresponding daterange.
	 * @param {Number} x horizontal component of the location
	 * @param {Number} y vertical component of the location
	 * @return {Zarafa.core.DateRange} A DateRange object that corresponds to the given location
	 */
	screenLocationToDateRange : function(x, y)
	{
		// get height / width of header's parent as that container is scrollable and
		// will give proper viewable height / width for comparison
		var date;
		if (Zarafa.core.Util.inside(this.header.parent().getBox(), x, y)) {
			// Both the start and dueDate need a clearTime() call, this
			// is in case of DST switches for Brasil where 00:00 doesn't exist
			// and clearTime() will return 01:00.
			date = this.locationToDate(x - this.header.getX(), 0).clearTime();
			var dueDate = date.clone();
			dueDate.setHours(12);
			dueDate = dueDate.add(Date.DAY, 1).clearTime();

			return new Zarafa.core.DateRange({ startDate : date, dueDate : dueDate });
		} else {
			date = this.locationToDate(x - this.body.getX(), y - this.body.getY());
			var snapSize = this.getZoomLevel() * 60 * 1000;
			var snap = date.getTime() - (date.getTime() % snapSize);

			return new Zarafa.core.DateRange({ startDate : new Date(snap), dueDate : new Date(snap + snapSize) });
		}
	},

	/**
	 * Convenience method that maps a Date to a number representing a day column
	 * on the current calendar (ranging from [0..numdays-1]).
	 * @param {Date} date date
	 * @param {Number} The day number in this view.
	 * @private
	 */
	getDayColumn : function(date)
	{
		var start = this.getDateRange().getStartDate();

		// We use the Ext clearTime() extension of Date() to account for
		// differences in DST. We pass true to get a clone of the passed
		// date, so we don't overwrite the original date.
		start = start.clearTime(true);
		date = date.clearTime(true);

		return Math.floor(Date.diff(Date.DAY, date, start));
	},

	/**
	 * Calculate the vertical position of the provided date on a given day column.
	 * @param {Date} date The date to calculate
	 * @private
	 */
	getDateVerticalPosition : function(date)
	{
		var timeZoneOffset = date.getTimezoneOffset() * 60 * 1000;
		return ((date.getTime() - timeZoneOffset) % Date.dayInMillis) / Date.dayInMillis;
	},

	/**
	 * Calculate the height of a time duration on a day column
	 * @param {Number} time The duration
	 * @private
	 */
	getRangeVerticalHeight : function(daterange)
	{
		// This is DST safe, as we render 24 hours regardless of the DST which might
		// occur on this particular day.
		var stripHeight = this.parentView.numHours * this.parentView.getHourHeight();
		var duration = daterange.getDuration();
		duration += Date.getDSTDiff(daterange.getStartDate(), daterange.getDueDate());
		return (duration * stripHeight) / Date.dayInMillis;
	},

	/**
	 * Converts a date range ([startDate, dueDate>) to zero or more (left, right, top, bottom) bounds objects.
	 * This method is used to lay out appointments (and proxies) on the calendar body.
	 * @param {Zarafa.core.DateRange} dateRange date range
	 * @param {Number} column (optional) when several appointments are overlapping a column may be assigned
	 * @param {Number} columnCount (optional) the number of overlapping appointments in an overlap dependency graph
	 * @param {Boolean} useMargin (optional) True to apply a right margin to the appointments to prevent them from
	 * filling up the entire width of a daybox.
	 * @return {Array} Array of {@link Zarafa.calendar.data.AppointmentBounds Bounds} which are used
	 * to position all the body elements.
	 */
	dateRangeToBodyBounds : function(dateRange, column, columnCount, useMargin)
	{
		var ret = [];
		var numDays = this.dayLayoutPositions.length;
		var stripHeight = this.parentView.numHours * this.parentView.getHourHeight();
		var leftMargin = useMargin ? this.appointmentBodyLeftMargin : 0;
		var rightMargin = useMargin ? this.appointmentBodyRightMargin : 0;

		// TODO
		var startDate = dateRange.getStartDate();
		var dueDate = dateRange.getDueDate();

		// Apply default values
		column = column || 0;
		columnCount = columnCount || 1;

		// if dueDate>=startDate, return false. We don't swap the dates here to force a valid
		// bounds array because that should be handled in the caller
		if (dueDate.getTime() <= startDate.getTime()) {
			return [];
		}

		var startDay = this.getDayColumn(startDate);
		var dueDay = this.getDayColumn(dueDate);

		// the date is outside the calendar range, return empty bounds array.
		// IMPORTANT: This checks only if _both_ start and due date are out of bounds.
		// It could still happen that the startDate is out of bounds, while the dueDate
		// is positioned within the view (or vice versa). In both cases we will create
		// a bound for the appointment, we will check what the exact case is later
		// during the construction of the Zarafa.calendar.data.AppointmentBounds objects.
		if (dueDay < 0 || startDay >= numDays) {
			return [];
		}

		var startDatePos = Math.floor(this.getDateVerticalPosition(startDate) * stripHeight);
		var dueDatePos = Math.floor(this.getDateVerticalPosition(dueDate) * stripHeight);

		// move the top of each box one pixel up. This is because we want both the top line and bottom line of
		// each appointment box to line up over the horizontal hour lines
		startDatePos--;

		if (startDay == dueDay)
		{
			// The startDay is the same as the dueDay, we already checked that
			// both values fall within the current view boundaries, so all that
			// is left to be done is creating a single Zarafa.calendar.data.AppointmentBounds
			// object which is both our first, as well as the lastBox.

			// Calculate the columnWidth, this is the total available space within the dayColumn
			// which is usable for this appointment. The width depends on a few factors:
			//  1) The width of the dayColumn itself
			//  2) The margins which are applied to the dayColumn (both left, and right).
			//  3) The number of appointments which overlap, each appointment will then be positioned
			//     into a subcolumn inside the dayColumn. The number of these columns is indicated by
			//     the columnCount.
			var columnWidth = (this.dayLayoutPositions[startDay].right - this.dayLayoutPositions[startDay].left - 1 - rightMargin - leftMargin) / columnCount;

			// Calculate the left position of the appointment, this is the position
			// of the dayColumn plus the leftMargin, and the offset depending on the number
			// of subcolumns.
			var left = this.dayLayoutPositions[startDay].left + (columnWidth * column) + leftMargin + 1;

			ret.push(new Zarafa.calendar.data.AppointmentBounds({
				left : Math.round(left),
				right : Math.round(left + columnWidth),
				top : startDatePos,
				bottom : dueDatePos,
				firstBox : true,
				lastBox : true
			}));
		}
		else
		{
			// add a bounds object for the first day.
			if (startDay >= 0)
			{
				var columnWidth = (this.dayLayoutPositions[startDay].right - this.dayLayoutPositions[startDay].left - 1 - rightMargin - leftMargin) / columnCount;
				var left = this.dayLayoutPositions[startDay].left + (columnWidth * column) + leftMargin;
				ret.push(new Zarafa.calendar.data.AppointmentBounds({
					left : Math.round(left),
					right : Math.round(left + columnWidth),
					top : startDatePos,
					bottom : stripHeight,
					firstBox : true
				}));
			}

			// for every day that is spanned completely by the appointment, return a bounds object that spans
			// that day strip
			for (var i = Math.max(startDay + 1, 0); i <= Math.min(dueDay - 1, numDays - 1); i++)
			{
				var columnWidth = (this.dayLayoutPositions[i].right - this.dayLayoutPositions[i].left - 1 - rightMargin - leftMargin) / columnCount;
				var left = this.dayLayoutPositions[i].left + (columnWidth * column) + leftMargin;
				ret.push(new Zarafa.calendar.data.AppointmentBounds({
					left : Math.round(left),
					right : Math.round(left + columnWidth),
					top : -1,
					bottom : stripHeight
				}));
			}

			// add a bounds object for the last day. If the appointment starts and ends on the same day
			// this will be the only item in the bounds array
			// The check 'dueDatePos>0' handles a corner case where an appointment is exactly 24 hours long
			// (even though this shouldn't be displayed in the body anyway).
			if (dueDay < numDays && dueDatePos > 0)
			{
				var columnWidth = (this.dayLayoutPositions[dueDay].right - this.dayLayoutPositions[dueDay].left - 1 - rightMargin - leftMargin) / columnCount;
				var left = this.dayLayoutPositions[dueDay].left + (columnWidth * column) + leftMargin;

				// This is the last bound for the appointment which represents the
				// due date of the appointment. Note that this is not automatically the
				// case since the appointments due date might fall _after_ the last visible
				// date in our view.
				ret.push(new Zarafa.calendar.data.AppointmentBounds({
					left : Math.round(left),
					right : Math.round(left + columnWidth),
					top : -1,
					bottom : dueDatePos,
					lastBox : true
				}));
			}

		}

		return ret;
	},

	/**
	 * Converts a date range ([startDate, dueDate>) a (left, right, top, bottom) box.
	 * This method is used to lay out appointments (and proxies) on the calendar header.
	 * @param {Zarafa.core.DateRange} dateRange date range
	 * @param {Number} column (optional) when several appointments are overlapping a column may be assigned
	 * @param {Number} columnCount (optional) the number of overlapping appointments in an overlap dependency graph
	 * @param {Boolean} useMargin (optional) True to apply margins to the appointments to prevent them
	 * from filling up the entire width of the header (This applies {@link #appointmentHeaderLeftMargin} and
	 * {@link #appointmentHeaderRightMargin}).
	 * @return {Array} Array of {@link Zarafa.calendar.data.AppointmentBounds Bounds} which are used
	 * to position the header element.
	 */
	dateRangeToHeaderBounds : function(dateRange, row, rowCount, useMargin)
	{
		var numDays = this.dayLayoutPositions.length;
		var leftMargin = useMargin ? this.appointmentHeaderLeftMargin :0;
		var rightMargin = useMargin ? this.appointmentHeaderRightMargin :0;
		var top = this.parentView.headerTextHeight;

		var startDate = dateRange.getStartDate();
		var dueDate = dateRange.getDueDate();

		// TODO
		var startDay = this.getDayColumn(startDate);
		var dueDay = this.getDayColumn(dueDate);

		// Apply default values
		row = row || 0;
		rowCount = rowCount || this.rowCount;

		// Handles a corner case where the appointment ends at exactly 00:00 the next day,
		// which means that the appointment is actually the end of the previous day. Note that
		// we cannot use clearTime() here in case of DST switches in Brasil where 00:00 doesn't
		// exist and clearTime() will return 01:00
		if (dueDate.clearTime(true).getTime() === dueDate.getTime()) {
			dueDay--;
		}

		// the date is outside the calendar range, return empty bounds array.
		if (dueDay < 0 || startDay >= numDays) {
			return [];
		}

		// We now have 4 possible cases:
		// 1) The start date does not fall within the visible range,
		//    which means that this isn't the firstBox, and the leftMargin
		//    should not be applied.
		// 2) The start and due date fall within the range, so the box
		//    is the firstBox and lastBox, and all margins must be applied.
		// 3) The due date does not fall within the visible range,
		//    which means that this isn't the lastBox, and the right
		//    Margin should not be applied.
		// 4) The start and due data both fall outside of the range, so the box
		//    is actually a middleBox, and none of the margins must be applied.
		if (startDay < 0 && dueDay >= numDays) {
			// case (4)
			// This is a middleBox which is drawn, both the firstBox as lastBox fall outside of the range.
			// Our left position is the most-left position (the first dayColumn), the right position is the
			// most-right position (the last dayColumn). This will ensure that the appointment will stretch
			// the entire length of all columns.
			return new Zarafa.calendar.data.AppointmentBounds({
				left : this.dayLayoutPositions[0].left,
				right : this.dayLayoutPositions[numDays - 1].right,
				top : top + row * this.parentView.headerItemHeight,
				bottom : top + (row + rowCount) * this.parentView.headerItemHeight
			});
		} else if (startDay < 0) {
			// case (1)
			// This is the lastBox which is drawn, but not the firstBox (the firstBox is out of range).
			// Our left position is the most-left position (the first dayColumn). This will ensure that
			// the appointment will stretch from the first visible day until the due date.
			return new Zarafa.calendar.data.AppointmentBounds({
				left : this.dayLayoutPositions[0].left,
				right : this.dayLayoutPositions[dueDay].right - rightMargin,
				top : top + row * this.parentView.headerItemHeight,
				bottom : top + (row + rowCount) * this.parentView.headerItemHeight,
				lastBox : true
			});
		} else if (dueDay >= numDays) {
			// case (3)
			// This is the firstBox which is drawn, but not the lastBox (the lastBox is out of range).
			// Our right position is the most-right position (the last dayColumn). This will ensure that
			// the appointment will stretch from the start date to the last visible day.
			return new Zarafa.calendar.data.AppointmentBounds({
				left : this.dayLayoutPositions[startDay].left + leftMargin,
				right : this.dayLayoutPositions[numDays - 1].right,
				top : top + row * this.parentView.headerItemHeight,
				bottom : top + (row + rowCount) * this.parentView.headerItemHeight,
				firstBox : true
			});
		} else {
			// case (2)
			// This is both the firstBox as well as the lastBox (everythhing is within the range).
			// The left and right position is read from the positions from the correct dayColumns
			// with padding applied.
			return new Zarafa.calendar.data.AppointmentBounds({
				left : this.dayLayoutPositions[startDay].left + leftMargin,
				right : this.dayLayoutPositions[dueDay].right - rightMargin,
				top : top + row * this.parentView.headerItemHeight,
				bottom : top + (row + rowCount) * this.parentView.headerItemHeight,
				firstBox : true,
				lastBox : true
			});
		}
	},

	/**
	 * Splits a set of {@link Zarafa.calendar.ui.Appointment Appointment} objects into overlapping clusters.
	 * @param {Zarafa.calendar.ui.Appointment|Array} appointment The appointment list
	 * @return {Zarafa.calendar.ui.Appointment|Array} clusters The matrix of appointments
	 */
	getAppointmentClusters : function(appointments)
	{
		// sort appointments by start date
		appointments.sort(this.appointmentCompare);

		// find connected graphs (clusters) of appointments and determine the maximum column number among them
		// TODO clean up this code
		var cluster = [], clusters = [];
		var clusterDueDate = 0;
		for (var i=0, appointment; appointment=appointments[i]; i++) {
			var startDate = appointment.getDateRange().getStartTime();
			var dueDate = appointment.getAdjustedDateRange().getDueTime();

			if (cluster.length === 0) {
				clusterDueDate = dueDate;
				cluster.push(appointment);
			} else if (startDate < clusterDueDate) {
				clusterDueDate = Math.max(dueDate, clusterDueDate);
				cluster.push(appointment);
			} else {
				clusters.push(cluster);

				// start new cluster
				cluster = [ appointment ];
				clusterDueDate = dueDate;
			}
		}
		if (cluster.length > 0) {
			clusters.push(cluster);
		}

		return clusters;
	},

	/**
	 * Appointments that span less than 24 hours are laid out in the body of the view. This method calculates
	 * how these appointments overlap in time and assigns slots (columns) to each appointment.
	 * <p>
	 * The appointments are first split up into clusters of overlapping appointments. Each cluster is then
	 * treated individually, using a simple greedy coloring algorithm. The number of required slots for each
	 * cluster is added to each appointment in the form of a 'slotCount' property. This property is then used
	 * to scale the appointments properly in the layout phase.
	 *
	 * @return {Number} the number of appointment rows needed to accommodate all appointments
	 * @private
	 */
	calculateBodyOverlaps : function()
	{
		// Make a list of appointments that are displayed on the calendar body
		var bodyAppointments = [];
		Ext.each(this.appointments, function(appointment) {
			if (!this.isHeaderRange(appointment.getDateRange())) {
				bodyAppointments.push(appointment);
			}
		}, this);

		var clusters = this.getAppointmentClusters(bodyAppointments);

		Ext.each(clusters, this.doGreedyColoring, this);
	},

	/**
	 * Appointments that span over 24 hours are laid out in the header of the view. This method calculates
	 * how these appointments overlap in time and assigns slots (rows) to each appointment. The same greedy
	 * coloring algorithm is used as in calculateBodyOverlaps().
	 * @private
	 */
	calculateHeaderOverlaps : function()
	{
		// Make a list of appointments that are displayed in the calendar header area
		var headerAppointments = [];
		Ext.each(this.appointments, function(appointment) {
			if (this.isHeaderRange(appointment.getDateRange())) {
				headerAppointments.push(appointment);
			}
		}, this);

		this.doGreedyColoring(headerAppointments, true);

		this.rowCount = (headerAppointments.length>0) ? headerAppointments[0].slotCount : 0;
	},

	/**
	 * Called by the {@link #parentView} when the {@link Zarafa.core.data.IPMStore#load load} event
	 * has been fired from the appointment {@link Zarafa.calendar.ui.CalendarMultiView#store store}.
	 * After all appointments have been added to the calendar, the {@link #calculateBodyOverlaps body overlaps}
	 * and {@link #calculateHeaderOverlaps header overlaps} will be recalculated.
	 * @param {Zarafa.core.data.IPMStore} store store that fired the event.
	 * @param {Zarafa.core.data.IPMRecord[]} records loaded record set
	 * @param {Object} options the options (parameters) with which the load was invoked.
	 */
	onAppointmentsLoad : function(store, records, options)
	{
		Zarafa.calendar.ui.AbstractCalendarDaysView.superclass.onAppointmentsLoad.apply(this, arguments);

		// Appointments have been loaded, we must recalculate the overlaps in the body and header
		this.calculateBodyOverlaps();
		this.calculateHeaderOverlaps();
	},

	/**
	 * Adds a new appointment to the view.
	 * Depending if it is an allday appointment, the {@link #calculateBodyOverlaps body overlaps}
	 * or {@link #calculateHeaderOverlaps header overlaps} will be recalculated.
	 * @param {Ext.data.Record} record a record with the appointment data
	 * @param {Boolean} layout (optional) if true layout() will be called after the appointment was added. Defaults to true.
	 * @return {Boolean} True if an appointment was added, false otherwise.
	 */
	addAppointment : function(record, layout)
	{
		var added = Zarafa.calendar.ui.AbstractCalendarDaysView.superclass.addAppointment.apply(this, arguments);
		if ( !added ){
			return false;
		}

		if (record.get('alldayevent')) {
			this.calculateHeaderOverlaps();
		} else {
			this.calculateBodyOverlaps();
		}

		return true;
	},

	/**
	 * Removes an appointment from the view.
	 * Depending if it is an allday appointment, the {@link #calculateBodyOverlaps body overlaps}
	 * or {@link #calculateHeaderOverlaps header overlaps} will be recalculated.
	 * @param {Ext.data.Record} record appointment record
	 * @param {Boolean} layout (optional) if true layout() will be called after the appointment was added. Defaults to true.
	 * @return {Boolean} true if an appointment was removed, false otherwise (the appointment was not found in this view)
	 */
	removeAppointment : function(record, layout)
	{
		Zarafa.calendar.ui.AbstractCalendarDaysView.superclass.removeAppointment.apply(this, arguments);
		if (record.get('alldayevent')) {
			this.calculateHeaderOverlaps();
		} else {
			this.calculateBodyOverlaps();
		}
	},

	/**
	 * Called before the calendar will be layed out.
	 * This will recalculate the {@link #calculateBodyOverlaps body} and {@link #calculateHeaderOverlaps header overlaps}.
	 * @protected.
	 */
	onBeforeLayout : function()
	{
		Zarafa.calendar.ui.AbstractCalendarDaysView.superclass.onBeforeLayout.apply(this, arguments);

		this.calculateBodyOverlaps();
		this.calculateHeaderOverlaps();
	}
});
