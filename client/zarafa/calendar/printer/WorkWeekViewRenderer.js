// -*- coding: utf-8; indent-tabs-mode: nil -*-
Ext.namespace('Zarafa.calendar.printer');

/**
 * @class Zarafa.calendar.printer.WorkWeekViewRenderer
 * @extends Zarafa.calendar.printer.DaysViewRenderer
 *
 * Prints a single workweek calendar overview
 */
Zarafa.calendar.printer.WorkWeekViewRenderer = Ext.extend(Zarafa.calendar.printer.DaysViewRenderer, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			timeStyle: 'width:33%;'
		});

		Zarafa.calendar.printer.WorkWeekViewRenderer.superclass.constructor.call(this, config);
	},

	/**
	 * Returns the HTML that will be placed into the <body> part of the print window.
	 * @param {Ext.Component} component The component to render
	 * @return {String} The HTML fragment to place inside the print window's <body> element
	 */
	generateBodyTemplate: function(context) {
		/* +---------------------------------------------------------------+
		 * | Overview of {fullname}     | datepicker_left datepicker_right |
		 * | {foldernames}              | datepicker_left datepicker_right |
		 * | Start day - end day        |                                  |
		 * +---------------------------------------------------------------+
		 * +---------------------------------------------------------------+
		 * |             day 1             |             day 2             |
		 * +---------------------------------------------------------------+
		 * |                               |                               |
		 * |                               |                               |
		 * |                               |                               |
		 * +---------------------------------------------------------------+
		 * |             day 3             |             day 4             |
		 * +---------------------------------------------------------------+
		 * |                               |                               |
		 * |                               |                               |
		 * |                               |                               |
		 * +---------------------------------------------------------------+
		 * |             day 5             |                               |
		 * +---------------------------------------------------------------+
		 * |                               |                               |
		 * |                               |                               |
		 * |                               |                               |
		 * +---------------------------------------------------------------+
		 *
		 * Printed by {fullname} at {date}
		 */

				return '<table class="print-calendar" cellpadding=0 cellspacing=0>\n'
			+	'<tr style="height:10%;"><td colspan=2>'
			+		'<table id="top">\n'
			+			'<tr><td align="center">' +_('An overview of') + ' {fullname} {foldernames}</td>'
			+			'<td align="center" rowspan="2"valign="top" width="10%"><div id="datepicker_left"></div></td>'
			+			'<td align="center" rowspan="2" valign="top" width="10%"><div id="datepicker_right"></div></td></tr>\n'
			+			'<tr><td align="left" valign="top" style="font-size: large;">'
			+				'{startdate:date("' + _("l jS F Y") + '")} - {duedate:date("' + _("l jS F Y") + '")}'
			+			'</td></tr>\n'
			+		'</table>\n'
			+ '</td></tr>\n'
			+	'<tr style="height:40px;">'
				// # TRANSLATORS: See http://docs.sencha.com/extjs/3.4.0/#!/api/Date for formatting instructions
			+		'<th class="date-header-center">{date1:date("' + _("l jS F") + '")}</th>'
				// # TRANSLATORS: See http://docs.sencha.com/extjs/3.4.0/#!/api/Date for formatting instructions
			+		'<th class="date-header-center">{date2:date("' + _("l jS F") + '")}</th>'
			+	'</tr>\n'
			+	'<tr style="height:20%;">'
			+		'<td valign="top"><table id="date1">{date1_table_data}</table></td>'
			+		'<td valign="top"><table id="date2">{date2_table_data}</table></td>'
			+	'</tr>\n'
			+	'<tr style="height:40px;">'
				// # TRANSLATORS: See http://docs.sencha.com/extjs/3.4.0/#!/api/Date for formatting instructions
			+		'<th class="date-header-center">{date3:date("' + _("l jS F") + '")}</th>'
				// # TRANSLATORS: See http://docs.sencha.com/extjs/3.4.0/#!/api/Date for formatting instructions
			+		'<th class="date-header-center">{date4:date("' + _("l jS F") + '")}</th>'
			+	'</tr>\n'
			+	'<tr style="height:20%;">'
			+		'<td valign="top"><table id="date3">{date3_table_data}</table></td>'
			+		'<td valign="top"><table id="date4">{date4_table_data}</table></td>'
			+	'</tr>\n'
			+	'<tr style="height:40px;">'
				// # TRANSLATORS: See http://docs.sencha.com/extjs/3.4.0/#!/api/Date for formatting instructions
			+		'<th class="date-header-center">{date5:date("' + _("l jS F") + '")}</th>'
			+	'</tr>\n'
			+	'<tr style="height:20%;">'
			+		'<td valign="top"><table id="date5">{date5_table_data}</table></td>'
			+	'</tr>\n</table>\n'
			// Bottom name and print date
			+ '<table class="bottom">'
			+		'<tr>'
						// # TRANSLATORS: See http://docs.sencha.com/extjs/3.4.0/#!/api/Date for formatting instructions
			+			'<td>'+_('Printed by') + ' {fullname} ' + _('at') + ' {currenttime:formatDefaultTimeString("' + _("l jS F Y {0}") + '")}</td>'
			+		'</tr>'
			+ '</table>';
	}
});
