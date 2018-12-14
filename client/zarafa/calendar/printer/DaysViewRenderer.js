// -*- coding: utf-8; indent-tabs-mode: nil -*-
Ext.namespace('Zarafa.calendar.printer');

/**
 * @class Zarafa.calendar.printer.DaysViewRenderer
 * @extends Zarafa.calendar.printer.AbstractViewRenderer
 *
 * Prints single day calendar overview.
 * Also it serves as baseclass to be used to print other calendar appointments.
 */
Zarafa.calendar.printer.DaysViewRenderer = Ext.extend(Zarafa.calendar.printer.AbstractViewRenderer, {

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
		var daterange = model.dateRange;
		var numDays = daterange.getDuration(Date.DAY);

		var startDate = daterange.getStartDate().clone();
		var dueDate = daterange.getDueDate().clone();

		// Set the startDate to 12:00 to be able to call Date.add(Date.DAY, ..)
		// safely for DST switches at 00:00 in Brasil.
		startDate.setHours(12);
		dueDate.setHours(12);

		// Obtain the daterange information, substract 1 day from duedate
		// as it is set to 00:00 of the day _after_ the duedate.
		data['currenttime'] = new Date();
		data['startdate'] = startDate.clearTime();
		data['duedate'] = dueDate.add(Date.DAY, -1).clearTime();

		for (var i = 0, len = numDays; i < len; i++) {
			var key = 'date' + (i + 1);
			data[key] = startDate.add(Date.DAY, i).clearTime();
			data[key + '_table_data'] = '';
		}

		var items = model.getStore().getRange();
		var offset = startDate.getDay();
		for (var i = 0, len = items.length; i < len; i++) {
			var start = items[i].get('commonstart');
			var end = items[i].get('commonend');
			if (!Ext.isDate(start) || !Ext.isDate(end)) {
				continue;
			}

			// Check if the appointment fits into the range,
			// if it doesn't bind the limits to the printed range.
			var showStart = start;
			if (start < startDate) {
				showStart = startDate.clone();
			}
			var showEnd = end;
			if (end > dueDate) {
				showEnd = dueDate.clone();
			}

			var subject = items[i].get('subject');
			if (!Ext.isString(subject)) {
				subject = '';
			}

			var location = items[i].get('location');
			location = Ext.isString(location) && !Ext.isEmpty(location) ? ' ' + _('Location: ') + location : ' ';

			var timeformat;
			var showDate = start.getDayOfYear() !== end.getDayOfYear() || start.getYear() !== end.getYear();
			if (showDate) {
				// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
				timeformat = _('jS F Y G:i');
			} else {
				// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
				timeformat = _('G:i');
			}

			var showDays = Math.floor(Date.diff(Date.DAY, showEnd, showStart));
			var allday = items[i].get('alldayevent');
			if (allday) {
				// allday events end on midnight the next day, so deduct
				// one, since we only deal in days here.
				if (showEnd === end) {
					showDays--;
				}
			}

			var append = '<tr class="calendar-'+ (allday ? 'allday' : 'normal') + '">';
			if (!allday) {
				append += '<td class="nowrap" style="' + this.timeStyle + '">'
					+ start.format(timeformat) + ' - ' + (showDate ? '<br>' : '')
					+ end.format(timeformat) + '</td>';
			}
			append += '<td class="calendar-item" colspan='+ (allday ? '2' : '1') +'>'
				+ Ext.util.Format.htmlEncode(subject) + Ext.util.Format.htmlEncode(location) + '</td></tr>';

			var startday = showStart.getDay();
            if (startday < offset) {
                startday += 7;
            }
            startday -= (offset - 1);
			for (var n = 0; n <= showDays && n < numDays; n++) {
				data['date' + (startday + n) + '_table_data'] += append;
			}
		}
		return data;
	},

	/**
	 * Returns the HTML that will be placed into the <body> part of the print window.
	 * @return {String} The HTML fragment to place inside the print window's <body> element
	 */
	generateBodyTemplate : function()
	{
		var html = '';

		/* +--------------------------------------------+
		 * | Kopano WebApp     |                        |
		 * | Calendar : [name] |      date pick         |
		 * | start time        |      this month        |
		 * |                   |                        |
		 * +--------------------------------------------+
		 *
		 * +--------------------------------------------+
		 * |                     day                    |
		 * +--------------------------------------------+
		 * |                                            |
		 * |                                            |
		 * |                                            |
		 * |                                            |
		 * |                                            |
		 * |                                            |
		 * |                                            |
		 * |                                            |
		 * |                                            |
		 * +--------------------------------------------+
		 *
		 * +--------------------------------------------+
		 * |                                            |
		 * | [name]         [page nr]      [print date] |
		 * |                                            |
		 * +--------------------------------------------+
		 */
		html += '<table class="print-calendar" cellpadding=0 cellspacing=0>\n';

		html += '<tr style="height:10%;"><td><table id="top">\n';

		html += '<tr><td align="left">' + container.getServerConfig().getWebappTitle() + '</td>'
			 + '<td align="center" valign="top" width="20%" rowspan=3><div id="datepicker_left"></div></td></tr>'
			 + '<tr><td align="left">' + _('Calendar') + ' : ' + '{fullname} </td></tr>\n';

		// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
		html += '<tr><td align="left" width="80%">{startdate:date("' + _("l jS F Y") + '")}</td></tr>\n';
		html += '</table></td></tr>\n';

		// date format l jS F == Monday 1st January
		html += ''
			+ '<tr style="height:30px;">'
			// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
			+ '  <th class="date-header-center">{date1:date("' + _("l jS F") + '")}</th>'
			+ '</tr>'
			+ '<tr style="height:90%;">'
			+ '  <td valign="top"><table id="date1">{date1_table_data}</table></td>'
			+ '</tr>'
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
