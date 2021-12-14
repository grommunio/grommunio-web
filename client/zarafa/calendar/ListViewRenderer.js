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

		/*
		 * +----------------------------------------------------+
		 * | priority | % complete | due date | subject | owner |
		 * ....
		 * +----------------------------------------------------+
		 * [name]                                    [print date]
		 */

		var html = '<div id="k-listview">'

			// Div with calendar name
			+ '<div id="k-name">'
			+	'<tr><td>' + _('An overview of') + ': ' + '{foldernames} </td><tr>'
			+ '</div>'
			+ '<table id="k-printlist" cellpadding=0 cellspacing=0>'
			+ 	'<tr>'
			+		'<th>' + _('Subject') + '</th>'
			+		'<th>' + _('Start') + '</th>'
			+		'<th>' + _('End') + '</th>'
			+		'<th>' + _('Duration') + '</th>'
			+		'<th>' + _('Location') + '</th>'
			+		'<th>' + _('Categories') + '</th>'
			+	'</tr>'
			// date format l jS F = Monday 1st January
			+ 	'<tpl for="appointments">'
			+		'<tr>'
			+			'<td>{values.data.subject:htmlEncode}</td>'
						// # TRANSLATORS: See http://docs.sencha.com/extjs/3.4.0/#!/api/Date for the meaning of these formatting instructions
			+			'<td>{values.data.startdate:formatDefaultTimeString("' + _("l jS F Y {0}") + '")}</td>'
						// # TRANSLATORS: See http://docs.sencha.com/extjs/3.4.0/#!/api/Date for the meaning of these formatting instructions
			+			'<td>{values.data.duedate:formatDefaultTimeString("' + _("l jS F Y {0}") + '")}</td>'
			+			'<td>{[Ext.util.Format.duration(values.data.duration, 1)]}</td>'
			+			'<td>{values.data.location:htmlEncode}</td>'
			+			'<td>{values.data.categories:htmlEncode}</td>'
			+		'</tr>'
			+	'</tpl>'
			+'</table>'

			// Bottom table with username and date
			+ '<table id="k-printlistbottom">'
			+	'<tr>'
					// # TRANSLATORS: See http://docs.sencha.com/extjs/3.4.0/#!/api/Date for the meaning of these formatting instructions
     	        	+		'<td class="nowrap" align="left">'+_('Printed by') + ' ' + '{fullname}' + ' '+_('at') + ' ' + '{currenttime:formatDefaultTimeString("' + _("l jS F Y {0}") + '")}</td>'
			+	'</tr>'
			+ '</table>'
		+ '</div>';

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

		// Obtain the calendar name
        var folders = model.getFolders();
        var foldernames = [];
        for (var i = 0; i < folders.length; i++) {
            if (folders[i].getMAPIStore().get('display_name') === container.getUser().getDisplayName()) {
                foldernames.push(folders[i].get('display_name'));
            } else {
                foldernames.push(folders[i].get('display_name') + ' ' + _('of') + ' ' + folders[i].getMAPIStore().get('display_name'));
            }
        }

        data['foldernames'] = foldernames.join(', ');

		return data;
	}
});
