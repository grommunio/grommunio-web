// -*- coding: utf-8; indent-tabs-mode: nil -*-
Ext.namespace('Zarafa.task.printer');

/**
 * @class Zarafa.calendar.task.TaskListViewRenderer
 * @extends Zarafa.common.printer.renderers.BaseRenderer
 *
 * Prints a list of all tasks in a folder
 */
Zarafa.task.printer.TaskListViewRenderer = Ext.extend(Zarafa.common.printer.renderers.BaseRenderer, {
	/**
	 * @property customStylesheetPath
	 * @type String
	 * The path at which the print stylesheets can be found for this renderer
	 */
	customStylesheetPath: 'client/resources/css/external/print.task.css',

	/**
	 * Generate the XTemplate HTML text for printing a task list.
	 * This prints every task given in the context view.
	 * @param {Zarafa.task.TaskContext} context The task view in the webapp
	 * @return {String} The HTML for the XTemplate to print
	 */
	generateBodyTemplate: function(context) {
		var html = '';

		// +----------------------------------------------------+
		// | priority | % complete | due date | subject | owner |
		// ....
		// +----------------------------------------------------+
		// [name]               [page nr]            [print date]

		html += '<table id="tasks" class="task-list" cellpadding=0 cellspacing=0>\n';

		html += '<tr class="nowrap">'
			+ '<th>' + _('Priority') + '</th>'
			+ '<th>' + _('% Completed') + '</th>'
			+ '<th class="wrap fullwidth">' + _('Subject') + '</th>'
			+ '<th>' + _('Owner') + '</th>'
			+ '<th>' + _('Due date') + '</th>'
			+ '</tr>\n';

		// date format l jS F == Monday 1st January
		html += '<tpl for="tasks">'
			+ '<tr class="nowrap">'
			+ '<td>{values.data.importance:importanceString}</td>'
			+ '<td>{values.data.percent_complete:percentage(0)}</td>'
			+ '<td class="wrap fullwidth">{values.data.subject:htmlEncode}</td>'
			+ '<td>{values.data.owner:htmlEncode}</td>'
			// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
			+ '<td>{values.data.duedate:date("' + _("l jS F Y") + '")}</td>'
			+ '</tr>\n'
			+ '</tpl>';

		html += '</table>\n';

		// skipping page nr for now
		html += '<table id="bottom">'
		+ '<tr>'
		+ '<td class="nowrap" align=left>{fullname:htmlEncode}</td>'
		// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
		+ '<td class="nowrap" align=right>{currenttime:date("' + _("l jS F Y G:i") + '")}</td>'
		+ '</tr>'
		+ '</table>\n';
		return html;
	},

	/**
	 * Returns the data for the XTemplate used in generateBodyTemplate()
	 * @param {Zarafa.task.TaskContext} context The task view in the webapp
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
