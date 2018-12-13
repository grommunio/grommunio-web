// -*- coding: utf-8; indent-tabs-mode: nil -*-
Ext.namespace('Zarafa.task.printer');

/**
 * @class Zarafa.task.printer.TaskRenderer
 * @extends Zarafa.common.printer.renderers.RecordRenderer
 *
 * A printer for tasks using the same layout as for emails
 *
 * Prints a single task request or task item
 */
Zarafa.task.printer.TaskRenderer = Ext.extend(Zarafa.common.printer.renderers.RecordRenderer, {

	/**
	 * Generate the XTemplate HTML text for printing a single task item or task request.
	 * @param {Zarafa.core.data.MAPIRecord} record The task item to print
	 * @return {String} The HTML for the XTemplate to print
	 */
	generateBodyTemplate: function(record) {
		var html = '';
		html += '<b>{fullname}</b>\n';
		html += '<hr>\n';
		html += '<table>\n';
		html += this.addRow(_('Subject'), '{subject}');
		// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
		html += this.optionalRow(_('Start'), 'startdate', '{startdate:date("' + _('l d/m/Y') + '")}');
		// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
		html += this.optionalRow(_('Due'), 'duedate', '{duedate:date("' + _('l d/m/Y') + '")}');
		html += this.optionalRow(_('Priority'), 'importance', '{importance:importanceString}');
		html += this.addRow('', '');   // separator
		html += this.addRow(_('Status'), '{status:taskStatusString}');
		html += this.addRow(_('Percent complete'), '{percent_complete:percentage(0)}');
		html += this.addRow('', '');   // separator
		html += this.addRow(_('Total work'), _('{totalwork} hours'));
		html += this.addRow(_('Actual work'), _('{actualwork} hours'));
		html += this.addRow('', '');   // separator
		// outlook always prints Recurrence: (none) .. no clue what it means, and why.
		html += this.optionalRow(_('Recurrence pattern'), 'recurring_pattern', '{recurring_pattern}');
		html += this.optionalRow('', 'recurring_pattern', '');
		html += this.addRow(_('Owner'), '{owner}');
		html += this.addRow('', '');   // separator
		html += this.optionalRow(_('Categories'), 'categories', '{categories}');
		html += this.optionalRow(_('Attachments'), 'attachment_names', '{attachment_names}');
		html += '</table><br><p>\n';
		html += record.getBody(true);
		html += '</p>\n';
		return html;
	}
});

