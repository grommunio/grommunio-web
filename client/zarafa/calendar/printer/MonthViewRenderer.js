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
	 * @cfg {String} folderColor The color of the selected calendar folder.
	 */
	folderColor : '#FFF',

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
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

		var colorScheme = model.getColorScheme(model.getDefaultFolder().id);
		this.folderColor = colorScheme.base;
		var days = [];
		for (var i = 0; i < 7; i++) {
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
	prepareCalendarDays : function(startDate, numDays, model)
	{
		var weeks = [];
		var appointments = this.prepareAppointments(model);

		var weekStartDate = startDate;
		for(var i = 0; i < numDays / 7; i++) {
			var week = [];
			for(var j = 0; j < 7; j++) {
				var date = weekStartDate.add(Date.DAY, j);
				var result = this.findAppointmentsByDate(appointments, date);
				// push day into week array.
				week.push({
					"date": this.getFormattedDate(date, startDate),
					"appointments" : result.items,
					"overflowAppointment" : result.overflowAppointment,
					"color" : this.folderColor
				});
			}

			weekStartDate = date.add(Date.DAY, 1);
			weeks.push({"week":week});
		}

		return weeks;
	},

	/**
	 * Function which prepare the an array of appointments which used in {@link #findAppointmentsByDate} to prepare the
	 * appointment bounds.
	 * @param {Zarafa.calendar.CalendarContextModel} model The {@link Zarafa.calendar.CalendarContextModel CalendarContextModel}.
	 * @return {Array} an appointments of selected month.
	 */
	prepareAppointments : function(model)
	{
		var appointments = [];
		var dateRange = new Zarafa.core.DateRange();
		var records = model.getStore().getRange();
		records.forEach(function (record) {
			var startDate = record.get('startdate').clone();
			var status = record.get('busystatus');

			dateRange = dateRange.set( startDate,  record.get('duedate').clone(), true, true);
			var text = dateRange.isAllDay() ? record.get("subject") : record.get('startdate').format( _('G:i')) + " " + record.get("subject");

			var location = record.get('location');
			if (!Ext.isEmpty(location)) {
				text += " (" + location + ")";
			}

			if(dateRange.getNumDays() > 1) {
				for(var i = 0; i < dateRange.getNumDays(); i++) {
					var date = startDate.add(Date.DAY, i).clearTime(true).getTime();
					appointments.push({startDate : date, text: text, busyStatus: status});
				}
			} else {
				appointments.push({startDate : startDate.clearTime(true).getTime(), text:text, busyStatus: status});
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
	findAppointmentsByDate : function(records, date)
	{
		var items = [];
		var overflowAppointment = false;

		var appointments = records.filter(function (record) {
			return record.startDate === date.getTime();
		}, this);

		if (!Ext.isEmpty(appointments)) {
			var bottomPosition = 25;
			var maxAppointment = 3;
			var marginBottom = 10;
			overflowAppointment = appointments.length > maxAppointment;

			for(var i = 0; i < appointments.length; i++) {
				if (i > maxAppointment - 1) {
					break;
				}

				var bottom = bottomPosition;
				if (overflowAppointment) {
					bottom = i === 0 ? marginBottom : (bottomPosition * i) + marginBottom;
				} else {
					bottom = bottomPosition * i;
				}

				var item = {};
				item["appointment"] = {
					text : appointments[i].text,
					bottom: bottom,
					color : this.folderColor,
					busyStatus : this.getAppointmentStatus(appointments[i].busyStatus)
				};
				items.push(item);
			}
		}
		return {"items" : items, "overflowAppointment": overflowAppointment};
	},

	/**
	 * Function which is used to prepare the svg image based on the an appointment status.
	 *
	 * @param {Zarafa.core.mapi.BusyStatus} busyStatus the {@link Zarafa.core.mapi.BusyStatus busyStatus} of an appointment.
	 * @return {String} return the svg icon which used to indicate the status of an appointment.
	 */
	getAppointmentStatus : function(busyStatus)
	{
		switch (busyStatus) {
			case Zarafa.core.mapi.BusyStatus.FREE:
				return '<svg width="7" height="20" class="k-appointment-status">'
					+ '<rect x="0" y="0" rx="1" ry="1" width="7" height="20" style="fill:none; stroke:' + this.folderColor + '; stroke-width:1; opacity:0.5;" /> ' +
					+'</svg>';
			case Zarafa.core.mapi.BusyStatus.BUSY:
				return '<svg width="7" height="20" class="k-appointment-status">'
					+ '<rect x="0" y="0" rx="5" ry="1" width="7" height="20" style="fill:' + this.folderColor + '; stroke:' + this.folderColor + '; stroke-width:1;opacity:0.5;" /> ' +
					+'</svg>';
			case Zarafa.core.mapi.BusyStatus.OUTOFOFFICE:
				return '<svg width="7" height="20" class="k-appointment-status">'
					+ '<rect x="0" y="0" rx="5" ry="1" width="7" height="20" style="fill:#912787; stroke:#912787; stroke-width:0; opacity:0.5" /> ' +
					+'</svg>';
			case Zarafa.core.mapi.BusyStatus.TENTATIVE:
				return '<svg width="7" height="20" class="k-appointment-status">'
					+ '<defs>'
					+   '<pattern id="tentative" patternUnits="userSpaceOnUse" width="10" height="10">'
					+       '<rect width="10" height="10" fill="white" style="stroke-width:0; opacity:0.5"/>'
					+       '<path d="M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2" stroke=' + this.folderColor + ' stroke-width="2"/>'
					+   '</pattern>'
					+ '</defs>'
					+ '<rect style="fill: url(#tentative)' + this.folderColor + ';" x="0" y="0" rx="1" ry="1" width="7" height="20" ></rect>'
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
	getFormattedDate : function(date, startDate)
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
	generateBodyTemplate : function()
	{
		var html = '<table class="k-calendar-header" cellpadding=0 cellspacing=0>\n';

		html += '<tr ><td><table id="top">\n';

		html += '<tr><td align="left" style="font-size: large;">{current_month}</td>'
			+ '<td align="center" valign="top" width="10%" rowspan=3><div id="datepicker_left"></div></td>'
			+ '<td align="center" valign="top" width="10%" rowspan=3><div id="datepicker_right"></div></td></tr>\n';
		html += '</table></td></tr></table>\n';

		html += '<table class="k-calendar-days">'
			+ '<tr style="height:5px;">'
			// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
			+   '<tpl for="days"><th class="date-header-days">{values.day}</th></tpl>'
			+ '</tr>'
			+ '<tpl for="weeks">'
			+	'<tr height="100">'
			+		'<tpl for="values.week">'
			+			'<td style="position: relative;">'
			+				'<span>'
			+					'{values.date}'
			+				'</span>'
			+               '<tpl for="values.appointments">'
			+                   '<div class = "k-appointment" style="bottom:{values.appointment.bottom}px; border:1px solid {values.appointment.color}; ">'
			+                       '{values.appointment.busyStatus}'
			+                       '<p style="padding-left: 10px; text-overflow: ellipsis; white-space: nowrap; overflow: hidden; ">'
			+                           '{values.appointment.text}'
			+                       '</p>'
			+                   '</div>'
			+				'</tpl>'
			+               '<tpl if="values.overflowAppointment">'
			+                   '<div class = "k-overflow-indicator" style="color : {values.color};" >'
			+                       '&#x25BC;'
			+                    '</div>'
			+               '</tpl>'
			+			'</td>'
			+		'</tpl>'
			+	'</tr>'
			+ '</tpl>'
			+ '</table>\n';

		// skipping page nr for now
		html += '<table id="bottom">'
			+ '<tr>'
			+ '<td class="nowrap" align="left">{fullname}</td>'
			// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
			+ '<td class="nowrap" align="right">{currenttime:date("' + _("l jS F Y G:i") + '")}</td>'
			+ '</tr>'
			+ '</table>\n';

		return html;
	}
});