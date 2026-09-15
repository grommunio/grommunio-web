/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// -*- coding: utf-8; indent-tabs-mode: nil -*-
Ext.namespace('Grommunio.task.printer');

/**
 * @class Grommunio.calendar.task.TaskListViewRenderer
 * @extends Grommunio.common.printer.renderers.BaseRenderer
 *
 * Prints a list of all tasks in a folder
 */
Grommunio.task.printer.TaskListViewRenderer = Ext.extend(Grommunio.common.printer.renderers.BaseRenderer, {
	/**
	 * @property customStylesheetPath
	 * @type String
	 * The path at which the print stylesheets can be found for this renderer
	 */
	customStylesheetPath: 'client/resources/css/external/print.list.css',

	/**
	 * Generate the XTemplate HTML text for printing a task list.
	 * This prints every task given in the context view.
	 * @param {Grommunio.task.TaskContext} context The task view in the webapp
	 * @return {String} The HTML for the XTemplate to print
	 */
	generateBodyTemplate: function(context) {
		var html = '';

		// +----------------------------------------------------+
		// | priority | % complete | due date | subject | owner |
		// ....
		// +----------------------------------------------------+
		// [name]                  [print date]

		html += '<table id="k-printlist" cellpadding=0 cellspacing=0>\n';

		html += '<tr>' +
			'<th>' + _('Priority') + '</th>' +
			'<th>' + _('Completed') + '</th>' +
			'<th>' + _('Subject') + '</th>' +
			'<th>' + _('Owner') + '</th>' +
			'<th>' + _('Due date') + '</th>' +
			'</tr>\n';

		// date format l jS F == Monday 1st January
		html += '<tpl for="tasks">' +
			'<tr>' +
			'<td>{values.data.importance:importanceString}</td>' +
			'<td>{values.data.percent_complete:percentage(0)}</td>' +
			'<td>{values.data.subject:htmlEncode}</td>' +
			'<td>{values.data.owner:htmlEncode}</td>' +
			// # TRANSLATORS: See http://docs.sencha.com/extjs/3.4.0/#!/api/Date for the meaning of these formatting instructions
			'<td>{values.data.duedate:date("' + _("l jS F Y") + '")}</td>' +
			'</tr>\n' +
			'</tpl>';

		html += '</table>\n';

		// Bottom table with username and date
		html += '<table id="k-printlistbottom">' +
		'<tr>' +
		'<td>' + String.format(_('Printed by: {0}'), '{fullname:htmlEncode}') + '</td>' +
		// TRANSLATORS: {0} is the date the list was printed on
		'<td class="right">' + String.format(_('Printed on: {0}'),
			// # TRANSLATORS: See http://docs.sencha.com/extjs/3.4.0/#!/api/Date for the meaning of these formatting instructions
			'{currenttime:formatDefaultTimeString("' + _("l jS F Y {0}") + '")}') + '</td>' +
		'</tr>' +
		'</table>\n';
		return html;
	},

	/**
	 * Returns the data for the XTemplate used in generateBodyTemplate()
	 * @param {Grommunio.task.TaskContext} context The task view in the webapp
	 * @return {Object} XTemplate data
	 */
	prepareData: function(context) {
		var data = {
			fullname: container.getUser().getDisplayName()
		};
		var model = context.getModel();

		data['currenttime'] = new Date();
		data['tasks'] = model.getStore().getRange();

		return data;
	}
});
