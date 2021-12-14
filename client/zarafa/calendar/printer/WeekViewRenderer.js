// -*- coding: utf-8; indent-tabs-mode: nil -*-
Ext.namespace('Zarafa.calendar.printer');

/**
 * @class Zarafa.calendar.printer.WeekViewRenderer
 * @extends Zarafa.calendar.printer.DaysViewRenderer
 *
 * Prints a single week calendar overview
 */
Zarafa.calendar.printer.WeekViewRenderer = Ext.extend(Zarafa.calendar.printer.DaysViewRenderer, {

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

		Zarafa.calendar.printer.WeekViewRenderer.superclass.constructor.call(this, config);
	},

	/**
	 * Returns the HTML that will be placed into the <body> part of the print window.
	 * @param {Ext.Component} component The component to render
	 * @return {String} The HTML fragment to place inside the print window's <body> element
	 */
	generateBodyTemplate: function(context) {

		/* +--------------------------------------------------------------+
		 * | Overview of {fordernames} | datepicker_left datepicker_right |
		 * +--------------------------------------------------------------+
		 *
		 * +-----------------------------------------------+
		 * |	     day 1         |        day 2          |
		 * +-----------------------------------------------+
		 * |			           |         			   |
		 * |        			   |			           |
		 * |		         	   |			           |
		 * +-----------------------------------------------+
		 * |         day 3         |        day 4          |
		 * +-----------------------------------------------+
		 * |                       |                       |
		 * |			           |                       |
		 * |			           |                       |
		 * +-----------------------------------------------+
		 * |         day 5         |        day 6          |
		 * +-----------------------------------------------+
		 * |                       |                       |
		 * |                       |                       |
		 * +-----------------------------------------------+
		 * |                    day 7                      |
		 * +-----------------------------------------------|
		 * |                                               |
		 * |                                               |
		 * +-----------------------------------------------+
		 *
		 * Printed by {fullname} at {date}
		 */
		var html = '<div id="print-calendar">'

			// Top div
			+ '<div id="top">'
			+	'<div id="top-calendar-info">'
			+		'<table>'
			+			'<tr><td>' + _('An overview of') + ': {foldernames} </td></tr>'
			+		'</table>'
			+ 	'</div>'
			// Datepicker_left is current month. Datepicker_right is next month.
			+ 	'<div id="top-calendar-datepicker">'
			+		'<tr float="right"><td><div id="datepicker_left"></div></td></tr>'
			+		'<tr float="right"><td><div id="datepicker_right"></div></td></tr>'
			+ 	'</div>'
			+ '</div>'

			// Middle table row
			// Every day is inside a table so we can re-use thead
			+ '<div id="middle">'
			+	'<table class="k-week-view">'
			+		'<thead>'
			+			'<tr>'
							// # TRANSLATORS: See http://docs.sencha.com/extjs/3.4.0/#!/api/Date for formatting instructions
			+				'<th class="date-header-center">{date1:date("' + _("l jS F") + '")}</th>'
							// # TRANSLATORS: See http://docs.sencha.com/extjs/3.4.0/#!/api/Date for formatting instructions
			+				'<th class="date-header-center">{date2:date("' + _("l jS F") + '")}</th>'
			+			'</tr>'
			+		'</thead>'
			+		'<tbody>'
			+			'<tr>'
			+				'<td><table id="date1">{date1_table_data}</table></td>'
			+				'<td><table id="date2">{date2_table_data}</table></td>'
			+			'</tr>'
			+		'</tbody>'
			+	'</table>'
			+	'<table class="k-week-view">'
			+		'<thead>'
			+			'<tr>'
							// # TRANSLATORS: See http://docs.sencha.com/extjs/3.4.0/#!/api/Date for formatting instructions
			+				'<th class="date-header-center">{date3:date("' + _("l jS F") + '")}</th>'
							// # TRANSLATORS: See http://docs.sencha.com/extjs/3.4.0/#!/api/Date for formatting instructions
			+				'<th class="date-header-center">{date4:date("' + _("l jS F") + '")}</th>'
			+			'</tr>'
			+		'</thead>'
			+		'<tbody>'
			+			'<tr>'
			+				'<td><table id="date3">{date3_table_data}</table></td>'
			+				'<td><table id="date4">{date4_table_data}</table></td>'
			+			'</tr>'
			+		'</tbody>'
			+	'</table>'
			+	'<table class="k-week-view">'
			+		'<thead>'
			+			'<tr>'
							// # TRANSLATORS: See http://docs.sencha.com/extjs/3.4.0/#!/api/Date for formatting instructions
			+				'<th class="date-header-center">{date5:date("' + _("l jS F") + '")}</th>'
							// # TRANSLATORS: See http://docs.sencha.com/extjs/3.4.0/#!/api/Date for formatting instructions
			+				'<th class="date-header-center">{date6:date("' + _("l jS F") + '")}</th>'
			+			'</tr>'
			+		'</thead>'
			+		'<tbody>'
			+			'<tr>'
			+				'<td><table id="date5">{date5_table_data}</table></td>'
			+				'<td><table id="date6">{date6_table_data}</table></td>'
			+			'</tr>'
			+		'</tbody>'
			+	'</table>'
			+	'<table class="k-week-view">'
			+		'<thead>'
			+			'<tr>'
						// # TRANSLATORS: See http://docs.sencha.com/extjs/3.4.0/#!/api/Date for formatting instructions
			+				'<th class="date-header-center">{date7:date("' + _("l jS F") + '")}</th>'
			+			'</tr>'
			+		'</thead>'
			+		'<tbody>'
			+			'<tr>'
			+				'<td><table id="date7">{date7_table_data}</table></td>'
			+			'</tr>'
			+		'</tbody>'
			+	'</table>'
			+ '</div>'

			// Bottom name and print date
			+ '<table class="bottom">'
			+		'<tr>'
						// # TRANSLATORS: See http://docs.sencha.com/extjs/3.4.0/#!/api/Date for formatting instructions
			+			'<td>'+_('Printed by') + ' {fullname} ' + _('at') + ' {currenttime:formatDefaultTimeString("' + _("l jS F Y {0}") + '")}</td>'
			+		'</tr>'
			+ '</table>'
		+'</div>';

		return html;
	}
});
