Ext.namespace('Zarafa.calendar.printer');

/**
 * @class Zarafa.calendar.printer.DaysViewRenderer
 * @extends Zarafa.calendar.printer.AbstractViewRenderer
 *
 * Prints single day calendar overview.
 * Also it serves as baseclass to be used to print other calendar appointments.
 */
Zarafa.calendar.printer.MonthViewRenderer = Ext.extend(Zarafa.calendar.printer.AbstractViewRenderer, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};
		Zarafa.calendar.printer.MonthViewRenderer.superclass.constructor.call(this, config);
	},

	/**
	 * Prepares data suitable for use in an XTemplate from the component
	 * @param {Ext.Component} component The component to acquire data from
	 * @return {Array} An empty array (override this to prepare your own data)
	 */
	prepareData: function(context)
	{
		var data = {
			fullname: Ext.util.Format.htmlEncode(container.getUser().getDisplayName())
		};
		var model = context.getModel();
		var dateRange = model.dateRange;
		var numDays = dateRange.getDuration(Date.DAY);
		var startDate = dateRange.getStartDate().clone();

		// Obtain the calendar name
		var folders = model.getFolders();
		var foldersData = [];
		var folderColor;
		for (var i = 0; i < folders.length; ++i) {
			folderColor = model.getColorScheme(folders[i].get('entryid')).base;
			if (folders[i].getMAPIStore().get('display_name') === container.getUser().getDisplayName()) {
				foldersData.push({folderName : folders[i].get('display_name'), folderColor : folderColor});
			} else {
				foldersData.push({folderName : folders[i].get('display_name') + ' ' + _('of') + ' ' + folders[i].getMAPIStore().get('display_name'), folderColor : folderColor});
			}
		}
		data['folderList'] = foldersData;

		var days = [];
		for (var i = 0; i < 7; ++i) {
			days.push({"day": startDate.add(Date.DAY,i).format("l")});
		}

		data["days"] = days;
		data["weeks"] = this.prepareCalendarDays(startDate, numDays, model);
		data["current_month"] = model.getMonthRangeText();
		data["currenttime"] = new Date();
		return data;
	},

	/**
	 * Helper function prepare the nested array which contains the
	 * weeks and days information which we need to render in calendar.
	 * @param {Date} startDate The start date of {@link Zarafa.core.DateRange DateRange}.
	 * @param {Number} numDays The number of days belongs to selected {@link Zarafa.core.DateRange DateRange}.
	 * @param {Zarafa.calendar.CalendarContextModel} model The {@link Zarafa.calendar.CalendarContextModel CalendarContextModel}.
	 * @return {Array} nested array which contains the weeks and days information.
	 */
	prepareCalendarDays: function(startDate, numDays, model)
	{
		var weeks = [];
		var appointments = this.prepareAppointments(model);

		var weekStartDate = startDate;
		for(var i = 0; i < numDays / 7; ++i) {
			var week = [];
			var maxDayAppointments = 0;
			for(var j = 0; j < 7; ++j) {
				var date = weekStartDate.add(Date.DAY, j);
				var result = this.findAppointmentsByDate(appointments, date);
				// push day into week array.
				week.push({
					"date": this.getFormattedDate(date, startDate),
					"appointments": result.items,
				});
				if (result.items.length > maxDayAppointments) {
					maxDayAppointments = result.items.length;
				}
			}

			weekStartDate = date.add(Date.DAY, 1);
			weeks.push({
				"week": week,
				"maxDayAppointments": Math.max(100, (maxDayAppointments + 1) * 25)
			});
		}

		return weeks;
	},

	/**
	 * Function which prepare the an array of appointments which used in {@link #findAppointmentsByDate} to prepare the
	 * appointment bounds.
	 * @param {Zarafa.calendar.CalendarContextModel} model The {@link Zarafa.calendar.CalendarContextModel CalendarContextModel}.
	 * @return {Array} an appointments of selected month.
	 */
	prepareAppointments: function(model)
	{
		var appointments = [];
		var dateRange = new Zarafa.core.DateRange();
		var records = model.getStore().getRange();

		records.forEach(function (record) {
			var startDate = record.get('startdate').clone();
			var status = record.get('busystatus');

			dateRange = dateRange.set( startDate,  record.get('duedate').clone(), true, true);
			var text = dateRange.isAllDay() ? record.get("subject") : record.get('startdate').formatDefaultTime() + " " + record.get("subject");

			var location = record.get('location');
			if (!Ext.isEmpty(location)) {
				text += " (" + location + ")";
			}

			var entryID = record.get('parent_entryid');
			var colorScheme = model.getColorScheme(entryID);
			var folderColor = colorScheme.base;

			if (dateRange.getNumDays() > 1) {
				for(var i = 0; i < dateRange.getNumDays(); ++i) {
					var date = startDate.add(Date.DAY, i).clearTime(true).getTime();
					appointments.push({startDate: date, color: folderColor, text: text, busyStatus: status});
				}
			}
			else {
				appointments.push({startDate: startDate.clearTime(true).getTime(), color: folderColor, text: text, busyStatus: status});
			}
		}, this);

		return appointments;
	},

	/**
	 * Helper function which is used to find and prepare an appointment bounds which help to
	 * render the appointment in calendar.
	 *
	 * @param {Zarafa.calendar.AppointmentRecord} records The {@link Zarafa.calendar.AppointmentRecord AppointmentRecord}
	 * which are going to render in calendar.
	 * @param {Date} date The Date of the month for which we have to prepare the appointment bounds.
	 * @return {Object} an object contains an appointment bounds which belongs to selected date.
	 */
	findAppointmentsByDate: function(records, date)
	{
		var items = [];
		var appointments = records.filter(function (record) {
			return record.startDate === date.getTime();
		}, this);

		if (!Ext.isEmpty(appointments)) {
			var topPosition = 25;
			var maxAppointment = 50;

			for (var i = 0; i < appointments.length; ++i) {
				// Stop the loop when maximum amount of appointments is reached.
				// In practice this will never be the case, due to high maximum and resizable print output.
				if (i > maxAppointment - 1) {
					break;
				}

				var item = {};
				item["appointment"] = {
					text: appointments[i].text,
					top: topPosition * (i + 1),
					color: appointments[i].color,
					busyStatus: this.getAppointmentStatus(appointments[i].busyStatus)
				};
				items.push(item);
			}
		}
		return {"items": items};
	},

	/**
	 * Function which is used to prepare the svg image based on the an appointment status.
	 *
	 * @param {Zarafa.core.mapi.BusyStatus} busyStatus the {@link Zarafa.core.mapi.BusyStatus busyStatus} of an appointment.
	 * @return {String} return the svg icon which used to indicate the status of an appointment.
	 */
	getAppointmentStatus: function(busyStatus)
	{
		switch (busyStatus) {
			case Zarafa.core.mapi.BusyStatus.FREE:
				return '<svg width="7" height="20" class="k-appointment-status">'
					+ '<rect x="0" y="0" rx="1" ry="1" width="7" height="20" style="fill:none; stroke:#FFF; stroke-width:1;" /> ' +
					+'</svg>';
			case Zarafa.core.mapi.BusyStatus.BUSY:
				return '<svg width="7" height="20" class="k-appointment-status">'
					+ '<rect x="0" y="0" rx="5" ry="1" width="7" height="20" style="fill:#0000FF; stroke:#0000FF; stroke-width:1;" /> ' +
					+'</svg>';
			case Zarafa.core.mapi.BusyStatus.OUTOFOFFICE:
				return '<svg width="7" height="20" class="k-appointment-status">'
					+ '<rect x="0" y="0" rx="5" ry="1" width="7" height="20" style="fill:#912787; stroke:#912787; stroke-width:0;" /> ' +
					+'</svg>';
			case Zarafa.core.mapi.BusyStatus.TENTATIVE:
				return '<svg width="7" height="20" class="k-appointment-status">'
					+ '<defs>'
					+   '<pattern id="tentative" patternUnits="userSpaceOnUse" width="3" height="1" patternTransform="rotate(30)">'
					+	'<rect width="1" height="20" fill="#0000FF" style="stroke-width:0;"/>'
					+   '</pattern>'
					+ '</defs>'
					+ '<rect style="fill: url(#tentative);" x="0" y="0" rx="1" ry="1" width="7" height="20" ></rect>'
					+ '</svg>';
		}
	},

	/**
	 * Helper function which used to show the formatted date in calendar.
	 *
	 * @param {Date} date The Date which belongs to month.
	 * @param {Date} startDate The start date of date range.
	 * @return {String} return formatted date.
	 */
	getFormattedDate: function(date, startDate)
	{
		if (date.getTime() === startDate.getTime() || date.getTime() === date.getFirstDateOfMonth().getTime()) {
			return date.format(_('M j'));
		}
		return date.format(_('j'));
	},

	/**
	 * Returns the HTML that will be placed into the <body> part of the print window.
	 * @return {String} The HTML fragment to place inside the print window's <body> element
	 */
	generateBodyTemplate: function()
	{
		return '<table class="k-calendar-header" cellpadding=0 cellspacing=0>\n'
			+		'<tr><td align="left" style="font-size: large;">{current_month}</td>'
			+		'<td align="center">' +_('An overview of') + ' {fullname} '
			+ 		'<tpl for="folderList">'
			+				'<span class="circle" style="background-color: {values.folderColor};"></span>'
			+				'<span>{values.folderName}</span>'
			+			'</tpl>'
			+ 	'</td>'
			+		'<td align="center" valign="top" width="10%"><div id="datepicker_left"></div></td>'
			+		'<td align="center" valign="top" width="10%"><div id="datepicker_right"></div></td></tr>\n'
			+	'</table>\n'

			+'<table class="k-calendar-days">'
			+	'<tr style="height:5px;">'
			// # TRANSLATORS: See http://docs.sencha.com/extjs/3.4.0/#!/api/Date for the meaning of these formatting instructions
			+		'<tpl for="days"><th class="date-header-days">{values.day}</th></tpl>'
			+	'</tr>'
			+ '<tpl for="weeks">'
			+	'<tr height="{values.maxDayAppointments}">'
			+		'<tpl for="values.week">'
			+			'<td style="position: relative;">'
			+				'<span class="k-day">'
			+					'{values.date}'
			+				'</span>'
			+				'<tpl for="values.appointments">'
			+					'<div class="k-appointment" style="top:{values.appointment.top}px; border:1px solid {values.appointment.color};">'
			+						'{values.appointment.busyStatus}'
			+						'<p style="padding-left: 10px; text-overflow: ellipsis; white-space: nowrap; overflow: hidden; ">'
			+							'{values.appointment.text}'
			+						'</p>'
			+					'</div>'
			+				'</tpl>'
			+			'</td>'
			+		'</tpl>'
			+	'</tr>'
			+ '</tpl>'
			+ '</table>\n'

			// skipping page nr for now
			+'<table id="bottom">'
			+	'<tr>'
			+		'<td class="nowrap" align="left">{fullname}</td>'
			// # TRANSLATORS: See http://docs.sencha.com/extjs/3.4.0/#!/api/Date for the meaning of these formatting instructions
			+		'<td class="nowrap" align="right">{currenttime:formatDefaultTimeString("' + _("l jS F Y {0}") + '")}</td>'
			+	'</tr>'
			+'</table>\n';
	}
});
