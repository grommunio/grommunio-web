// -*- coding: utf-8; indent-tabs-mode: nil -*-
Ext.namespace('Zarafa.calendar.printer');

/**
 * @class Zarafa.calendar.printer.ListViewRenderer
 * @extends Zarafa.common.printer.renderers.BaseRenderer
 *
 * Prints a list of all calendar items in a folder
 */
Zarafa.calendar.printer.ListViewRenderer = Ext.extend(Zarafa.common.printer.renderers.BaseRenderer, {
	/**
	 * @property customStylesheetPath
	 * @type String
	 * The path at which the print stylesheets can be found for this renderer
	 */
	customStylesheetPath: 'client/resources/css/external/print.list.css',

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
		// [name]                                    [print date]

		html += '<table id="printlist" cellpadding=0 cellspacing=0>\n';

		html += '<tr>'
			+ '<th>' + _('Subject') + '</th>'
			+ '<th>' + _('Start') + '</th>'
			+ '<th>' + _('End') + '</th>'
			+ '<th>' + _('Duration') + '</th>'
			+ '<th>' + _('Location') + '</th>'
			+ '<th>' + _('Categories') + '</th>'
			+ '</tr>\n';

		// date format l jS F == Monday 1st January
		html += '<tpl for="appointments">'
			+ '<tr>'
			+ '<td>{values.data.subject:htmlEncode}</td>'
			// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
			+ '<td>{values.data.startdate:date("' + _("l jS F Y G:i") + '")}</td>'
			+ '<td>{values.data.duedate:date("' + _("l jS F Y G:i") + '")}</td>'
			+ '<td>{[Ext.util.Format.duration(values.data.duration, 1)]}</td>'
			+ '<td>{values.data.location:htmlEncode}</td>'
			+ '<td>{values.data.categories:htmlEncode}</td>'
			+ '</tr>\n'
			+ '</tpl>';

		html += '</table>\n';
		
		// Bottom table with username and date
		html += '<table id="printlistbottom">'
		+ '<tr>'
		+ '<td>' + _('Printed by: ') +'{fullname:htmlEncode}</td>'
		// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
		+ '<td class="right">' + _('Printed on: ') + '{currenttime:date("' + _("l jS F Y G:i") + '")}</td>'
		+ '</tr>'
		+ '</table>\n';
		return html;
	},

	/**
	 * Returns the data for the XTemplate used in generateBodyTemplate()
	 * @param {Zarafa.calendar.CalendarContext} context The calendar list view in the webapp
	 * @return {Object} XTemplate data
	 */
	prepareData: function(context)
	{
		var data = {};
		var model = context.getModel();
		data['fullname'] = container.getUser().getDisplayName();
		data['currenttime'] = new Date();
		data['appointments'] = model.getStore().getRange();
		
		return data;
	}
});
