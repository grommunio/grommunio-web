/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// -*- coding: utf-8; indent-tabs-mode: nil -*-
Ext.namespace('Grommunio.calendar.printer');

/**
 * @class Grommunio.calendar.printer.DaysViewRenderer
 * @extends Grommunio.calendar.printer.AbstractViewRenderer
 *
 * Prints single day calendar overview.
 * Also it serves as baseclass to be used to print other calendar appointments.
 */
Grommunio.calendar.printer.DaysViewRenderer = Ext.extend(Grommunio.calendar.printer.AbstractViewRenderer, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			timeStyle : 'width:10%;'
		});

		Grommunio.calendar.printer.DaysViewRenderer.superclass.constructor.call(this, config);
	},

	/**
	 * Function which is used to prepare the svg image based on the an appointment status.
	 *
	 * @param {Grommunio.core.mapi.BusyStatus} busyStatus the {@link Grommunio.core.mapi.BusyStatus busyStatus} of an appointment.
	 * @return {String} return the svg icon which used to indicate the status of an appointment.
	 */
	getAppointmentStatus: function(busyStatus)
	{
		switch (busyStatus) {
			case Grommunio.core.mapi.BusyStatus.FREE:
				return '<svg width="7" height="20" class="k-appointment-status">' +
					'<rect x="0" y="0" rx="1" ry="1" width="7" height="20" style="fill:none; stroke:#FFF; stroke-width:1;" /> ' +
					+'</svg>';
			case Grommunio.core.mapi.BusyStatus.BUSY:
				return '<svg width="7" height="20" class="k-appointment-status">' +
					'<rect x="0" y="0" rx="5" ry="1" width="7" height="20" style="fill:#0000FF; stroke:#0000FF; stroke-width:1;" /> ' +
					+'</svg>';
			case Grommunio.core.mapi.BusyStatus.OUTOFOFFICE:
				return '<svg width="7" height="20" class="k-appointment-status">' +
					'<rect x="0" y="0" rx="5" ry="1" width="7" height="20" style="fill:#912787; stroke:#912787; stroke-width:0;" /> ' +
					+'</svg>';
			case Grommunio.core.mapi.BusyStatus.WORKINGELSEWHERE:
				return '<svg width="7" height="20" class="k-appointment-status">' +
					'<rect x="0" y="0" rx="5" ry="1" width="7" height="20" style="fill:#5b9bd5; stroke:#5b9bd5; stroke-width:0;" /> ' +
					+'</svg>';
			case Grommunio.core.mapi.BusyStatus.TENTATIVE:
				return '<svg width="7" height="20" class="k-appointment-status">' +
					'<defs>'   +
					'<pattern id="tentative" patternUnits="userSpaceOnUse" width="3" height="1" patternTransform="rotate(30)">'	+
					'<rect width="1" height="20" fill="#0000FF" style="stroke-width:0;"/>'   +
					'</pattern>' +
					'</defs>' +
					'<rect style="fill: url(#tentative);" x="0" y="0" rx="1" ry="1" width="7" height="20" ></rect>' +
					'</svg>';
		}
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
		var daterange = model.dateRange;
		var numDays = daterange.getDuration(Date.DAY);

		var startDate = daterange.getStartDate().clone();
		var dueDate = daterange.getDueDate().clone();

		// Obtain the calendar name
		var folders = model.getFolders();
		var foldernames = [];
		for (var i = 0; i < folders.length; i++) {
			if (folders[i].getMAPIStore().get('display_name') === container.getUser().getDisplayName()) {
				foldernames.push(folders[i].get('display_name'));
			} else {
				// TRANSLATORS: {0} is a folder name, {1} the name of the mailbox it lives in
				foldernames.push(String.format(_('{0} of {1}'), folders[i].get('display_name'), folders[i].getMAPIStore().get('display_name')));
			}
		}
		data['foldernames'] = foldernames.join(', ');

		// Set the startDate to 12:00 to be able to call Date.add(Date.DAY, ..)
		// safely for DST switches at 00:00 in Brasil.
		startDate.setHours(12);
		dueDate.setHours(12);

		// Obtain the daterange information, subtract 1 day from duedate
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

		// If there are no items, no point in continuing, so return the data.
		if (items.length === 0) {
			return data;
		}

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

			// Obtain the subject
			var subject = items[i].get('subject');
			subject = Ext.isString(subject) && !Ext.isEmpty(subject) ? subject : ' ';

			// Obtain the folderlocation
			var folderLocation = '';
			// If only 1 folder is printed, we do not show the folderlocation
			// else we do print the location of the item
			if (foldernames.length > 1) {

				var store = container.getHierarchyStore();
				var calendarFolder = store.getFolder(items[i].get('parent_entryid')).get('display_name');
				var storeName = store.getFolder(items[i].get('parent_entryid')).getMAPIStore().get('display_name');
				if (storeName != container.getUser().getDisplayName()) {
					folderLocation = '- ' + String.format(_('{0} of {1}'), calendarFolder, storeName);
				}
			}

			// Obtain the location of the appointment/meeting
			var location = items[i].get('location');
			location = Ext.isString(location) && !Ext.isEmpty(location) ? ' ' + String.format(_('Location: {0}'), location) : ' ';

			var showDays = Math.floor(Date.diff(Date.DAY, showEnd, showStart));
			var allday = items[i].get('alldayevent');
			if (allday) {
				// allday events end on midnight the next day, so deduct
				// one, since we only deal in days here.
				if (showEnd === end) {
					showDays--;
				}
			}

			// Set allday or normal class
			var append = '<tr class="calendar-'+ (allday ? 'allday' : 'normal') + '">';

			// Add the time of the appointment if it's not an all day event
			if (!allday) {

				// l = Monday
				// jS = 1rd
				// F = January M = Jan
				// Y
				// {0] 12/24 hour

				var multiDay = start.getDayOfYear() !== end.getDayOfYear();
				var multiYear = start.getYear() !== end.getYear();

				// Multi day and multi year format
				var timeFormat = container.settingsModel.get('grommunio/v1/main/datetime_time_format');
				var multiTimeFormat;

				// Todo check if multiday can be shown in different days (works for multi year)
				if (multiDay && !multiYear) {
					multiTimeFormat = _('j M {0}'); // TODO check correct dateformat for English
				} else if (multiYear) {
					multiTimeFormat = _('l jS M Y {0}');
				} else {
					multiTimeFormat = timeFormat;
				}

				append += '<td width=7 valign="center">' + this.getAppointmentStatus(items[i].get('busystatus')) + '</td>' +
					'<td class="nowrap" style="' + this.timeStyle + '">' +
					start.formatDefaultTime(multiTimeFormat) + ' - ' + end.formatDefaultTime(multiTimeFormat) + '</td>';
			}

			// Add string before all day appointment
			// to indicate appointment last an entire day
			if (allday) {
				subject = String.format(_('All day: {0}'), subject);
			}
			append += '<td class="calendar-item" colspan='+ (allday ? '3' : '2') +'>' +
				Ext.util.Format.htmlEncode(subject) + Ext.util.Format.htmlEncode(location) + '<i class="folder-location">'+Ext.util.Format.htmlEncode(folderLocation) + '</i></td></tr>';

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
	generateBodyTemplate: function()
	{
		/* +---------------------------------------------------------------+
		 * | Overview of {fullname}     | datepicker_left datepicker_right |
		 * | {foldernames}              | datepicker_left datepicker_right |
		 * | Day                        |                                  |
		 * +---------------------------------------------------------------+
		 * +---------------------------------------------------------------+
		 * |                              day                              |
		 * +---------------------------------------------------------------+
		 * |                                                               |
		 * |                                                               |
		 * |                                                               |
		 * +---------------------------------------------------------------+
		 *
		 * Printed by {fullname} at {date}
		 */

		return '<table class="print-calendar" cellpadding=0 cellspacing=0>\n'	+
			'<tr style="height:10%;"><td colspan=2>'		+
			'<table id="top">\n'			+
			'<tr><td align="center">' +_('An overview of') + ' {fullname} {foldernames}</td>'			+
			'<td align="center" rowspan="2"valign="top" width="10%"><div id="datepicker_left"></div></td>'			+
			'<td align="center" rowspan="2" valign="top" width="10%"><div id="datepicker_right"></div></td></tr>\n'			+
			'<tr><td align="left" valign="top" style="font-size: large;">{startdate:date("' + _("l jS F Y") + '")}</td></tr>\n'		+
			'</table>\n' +
			'</td></tr>\n'	+
			'<tr style="height:40px;">'		+
				// # TRANSLATORS: See http://docs.sencha.com/extjs/3.4.0/#!/api/Date for formatting instructions
			'<th class="date-header-center">{date1:date("' + _("l jS F") + '")}</th>'	+
				// # TRANSLATORS: See http://docs.sencha.com/extjs/3.4.0/#!/api/Date for formatting instructions
			'</tr>\n'	+
			'<tr style="height:90%;">'		+
			'<td valign="top"><table id="date1">{date1_table_data}</table></td>'	+
			'</tr>\n'	+
			'</tr>\n</table>\n' +
			// Bottom name and print date
			'<table class="bottom">'		+
			'<tr>'			+
						// # TRANSLATORS: See http://docs.sencha.com/extjs/3.4.0/#!/api/Date for formatting instructions
						// TRANSLATORS: {0} is the name of the user printing, {1} the current date and time
			'<td>' + String.format(_('Printed by {0} at {1}'), '{fullname}', '{currenttime:formatDefaultTimeString("' + _("l jS F Y {0}") + '")}') + '</td>'		+
			'</tr>' +
			'</table>';
	}
});
