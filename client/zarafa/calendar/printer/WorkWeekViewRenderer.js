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
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			timeStyle : 'width:10%;'
		});

		Zarafa.calendar.printer.WorkWeekViewRenderer.superclass.constructor.call(this, config);
	},

	/**
	 * Returns the HTML that will be placed into the <body> part of the print window.
	 * @param {Ext.Component} component The component to render
	 * @return {String} The HTML fragment to place inside the print window's <body> element
	 */
	generateBodyTemplate: function(context) {
		var html = '';

		// +--------------------------------------------+
		// | start time -     | date pick  | date pick  |
		// | end time         | this month | next month |
		// +--------------------------------------------+
		/*
		 * +--------------------------------------------+
		 * |                     day 1                  |
		 * +--------------------------------------------+
		 * |                                            |
		 * |                                            |
		 * |                                            |
		 * +--------------------------------------------+
		 * |                     day 2                  |
		 * +--------------------------------------------+
		 * |                                            |
		 * |                                            |
		 * |                                            |
		 * +--------------------------------------------+
		 * |                     day 3                  |
		 * +--------------------------------------------+
		 * |                                            |
		 * |                                            |
		 * |                      ...                   |
		 * +-----------------------------------------------+
		 */
		// [name]           [page nr]        [print date]
		html += '<table class="print-calendar" cellpadding=0 cellspacing=0>\n';

		html += '<tr style="height:10%;"><td><table id="top">\n';
		// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
		html += '<tr><td align="left" width="60%">{startdate:date("' + _("l jS F Y") + '")} -</td>'
			+ '<td align="center" valign="top" width="20%" rowspan=2><div id=datepicker_left></div></td>'
			+ '<td align="center" valign="top" width="20%" rowspan=2><div id=datepicker_right></div></td></tr>';
		// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
		html += '<tr><td align=left>{duedate:date("' + _("l jS F Y") + '")}</tr>';
		html += '</table></td></tr>\n';

		// date format l jS F == Monday 1st January
		html += ''
			+ '<tr style="height:30px;">'
			// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
			+ '  <th class="date-header-center">{date1:date("' + _("l jS F") + '")}</th>'
			+ '</tr>'
			+ '<tr style="height:10%;">'
			+ '  <td valign="top"><table id="date1">{date1_table_data}</table></td>'
			+ '</tr>'
			+ '<tr style="height:30px;">'
			// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
			+ '  <th class="date-header-center">{date2:date("' + _("l jS F") + '")}</th>'
			+ '</tr>'
			+ '<tr style="height:10%;">'
			+ '  <td valign="top"><table id="date2">{date2_table_data}</table></td>'
			+ '</tr>'
			+ '<tr style="height:30px;">'
			// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
			+ '  <th class="date-header-center">{date3:date("' + _("l jS F") + '")}</th>'
			+ '</tr>'
			+ '<tr style="height:10%;">'
			+ '  <td valign="top"><table id="date3">{date3_table_data}</table></td>'
			+ '</tr>'
			+ '<tr style="height:30px;">'
			// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
			+ '  <th class="date-header-center">{date4:date("' + _("l jS F") + '")}</th>'
			+ '</tr>'
			+ '<tr style="height:10%;">'
			+ '  <td valign="top"><table id="date4">{date4_table_data}</table></td>'
			+ '</tr>'
			+ '<tr style="height:30px;">'
			// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
			+ '  <th class="date-header-center">{date5:date("' + _("l jS F") + '")}</th>'
			+ '</tr>'
			+ '<tr style="height:10%;">'
			+ '  <td valign="top"><table id="date5">{date5_table_data}</table></td>'
			+ '</tr>';

		html += '</table>';

		// skipping page nr for now
		html += '<table id="bottom">'
			+ '<tr>'
			+ '<td class="nowrap" align=left>{fullname:htmlEncode}</td>'
			// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
			+ '<td class="nowrap" align=right>{currenttime:date("' + _("l jS F Y G:i") + '")}</td>'
			+ '</tr>'
			+ '</table>\n';

		return html;
	}
});
