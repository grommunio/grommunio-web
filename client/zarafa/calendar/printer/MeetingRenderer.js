// -*- coding: utf-8; indent-tabs-mode: nil -*-
Ext.namespace('Zarafa.calendar.printer');

/**
 * @class Zarafa.calendar.printer.MeetingRenderer
 * @extends Zarafa.common.printer.renderers.RecordRenderer
 *
 * A printer for appointments and meeting requests using the same layout as for emails
 *
 * Prints a single meetingrequest email or calendar item
 */
Zarafa.calendar.printer.MeetingRenderer = Ext.extend(Zarafa.common.printer.renderers.RecordRenderer, {
	/**
	 * Generates a template on which prepareData() will be applied to create the HTML body.
	 * @param {zarafa.core.data.MAPIRecord} record the email to print
	 * @return {String} The HTML for the XTemplate to print
	 */
	generateBodyTemplate: function(record) {
		var html = '';
		html += '<b>{fullname}</b>\n';
		html += '<hr>\n';
		html += '<table>\n';
		html += this.addRow(_('Subject'), '{subject}');
		html += this.optionalRow(_('Location'), 'location', '{location}');
		html += this.addRow('', '');   // separator
		// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
		html += this.addRow(_('Start'), '{startdate:date("' + _('l jS F Y G:i') + '")}');
		// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
		html += this.addRow(_('End'), '{enddate:date("' + _('l jS F Y G:i') + '")}');
		// this.optionalRow(_('Show Time As', record, '?');
		html += this.addRow('', '');   // separator
		// outlook always prints Recurrence: (none) .. no clue what it means, and why.
		html += this.optionalRow(_('Recurrence pattern'), 'recurring_pattern', '{recurring_pattern}');
		html += this.optionalRow('', 'recurring_pattern', '');
		html += this.optionalRow(_('Organiser'), 'sender_name', '{sender_name}');
		html += this.optionalRow(_('Meeting status'), 'responsestatus', '{responsestatus:responseStatusString}');
		html += '<tpl if="!Ext.isEmpty(values.sender_name) || !Ext.isEmpty(values.responsestatus)">';
		html += this.addRow('', '');   // separator
		html += '</tpl>';
		// following depends on state of item
		html += this.optionalRow(_('Required Attendees'), 'display_to', '{display_to}');
		html += this.optionalRow(_('Optional Attendees'), 'display_cc', '{display_cc}');
		html += this.optionalRow(_('Resources'), 'display_bcc', '{display_bcc}');
		html += this.addRow('', '');   // separator
		html += this.optionalRow(_('Sensitivity'), 'sensitivity', '{sensitivity:sensitivityString}');
		html += this.optionalRow(_('Importance'), 'importance', '{importance:importanceString}');
		html += '<tpl if="!Ext.isEmpty(values.sensitivity) || !Ext.isEmpty(values.importance)">';
		html += this.addRow('', '');   // separator
		html += '</tpl>';
		html += this.optionalRow(_('Attachments'), 'attachment_names', '{attachment_names}');
		html += '</table><br><p>\n';
		// outlook strips until the ~*~*~... marker.. that's a bit of a hassle
		html += record.getBody(true);
		html += '</p>\n';
		return html;
	},

	/**
	 * Prepares data for any record for use in the XTemplate
	 * @param {Zarafa.core.data.MAPIRecord} record The mapi record to print
	 * @return {Array} Data suitable for use in the XTemplate
	 */
	prepareData: function(record) {
		var data = Zarafa.calendar.printer.MeetingRenderer.superclass.prepareData.apply(this, arguments);
		if (record.isMessageClass('IPM.Schedule', true)) {
			// meeting request has other names for the same properties
			data['startdate'] = data['appointment_startdate'];
			data['enddate'] = data['appointment_duedate'];
			data['location'] = data['appointment_location'];
			data['recurring_pattern'] = data['appointment_recurring_pattern'];
		} else {
			// normal calendar item
			data['startdate'] = data['commonstart'];
			data['enddate'] = data['commonend'];
		}
		return data;
	}
});

