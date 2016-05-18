Ext.namespace('Zarafa.calendar.attachitem');

/**
 * @class Zarafa.calendar.attachitem.AttachCalendarRenderer
 * @extends Zarafa.common.attachment.dialogs.AttachItemBaseRenderer
 *
 * Renderer that can be used to get text data from {@link Zarafa.calendar.AppointmentRecord AppointmentRecord}.
 */
Zarafa.calendar.attachitem.AttachCalendarRenderer = Ext.extend(Zarafa.common.attachment.dialogs.AttachItemBaseRenderer, {
	/**
	 * Constructor will intialize default properties
	 * @param {Object} config configuration object
	 */
	constructor : function(config)
	{
		Zarafa.calendar.attachitem.AttachCalendarRenderer.superclass.constructor.call(this, config);

		Ext.apply(this.labels, {
			'from' : _('Organizer'),
			'location' : _('Where'),
			'display_to' : _('Required Attendee'),
			'display_cc' : _('Optional Attendee'),
			'display_bcc' : _('Resource'),
			'busystatus' : _('Show Time As'),
			'startdate' : _('Start Date'),
			'duedate' : _('End Date'),
			'recurring_pattern' : _('Recurrence pattern'),
			'alldayevent' : _('All Day Event')
		});
	},

	/**
	 * Function should be used to generate template which can be used by {@link #generateText} to add data into template and return the string that is generated.
	 * This will generate template for the html format only.
	 * @return {String} The HTML for the XTemplate to use
	 */
	generateHTMLTemplate : function()
	{
		var html = '';

		html += this.addHTMLRowGroup({
			'subject' : '{subject:htmlEncode}',
			'location' : '{location:htmlEncode}'
		});

		html += this.addHTMLRowGroup({
			// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
			'startdate' : '{startdate:date("' + _("l jS F Y G:i") + '")}',
			// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
			'duedate' : '{duedate:date("' + _("l jS F Y G:i") + '")}',
			'busystatus' : '{busystatus:busyStatusString}',
			'alldayevent' : '{alldayevent}'
		});

		html += this.addHTMLRowGroup({
			'from' : '{from:htmlEncode}'
		});

		html += this.addHTMLRowGroup({
			'meeting' : {
				'display_to' : '{display_to:htmlEncode}',
				'display_cc' : '{display_cc:htmlEncode}',
				'display_bcc' : '{display_bcc:htmlEncode}'
			}
		});

		html += this.addHTMLRowGroup({
			'recurring' : {
				'recurring_pattern' : '{recurring_pattern:htmlEncode}'
			}
		});

		html += this.addHTMLRowGroup({
			'categories' : '{categories:htmlEncode}',
			'sensitivity' : '{sensitivity:sensitivityString}',
			'importance' : '{importance:importanceString}'
		});

		html += this.addHTMLRow('attachment_names', '{attachment_names:htmlEncode}');
		html += '{body}';

		return html;
	},

	/**
	 * Function should be used to generate template which can be used by {@link #generateText} to add data into template and return the string that is generated.
	 * This will generate template for the plain text format only.
	 * @return {String} The HTML for the XTemplate to use
	 */
	generatePlainTemplate : function()
	{
		var html = '';

		html += this.addPlainRowGroup({
			'subject' : '{subject}',
			'location' : '{location}'
		});

		html += this.addPlainRowGroup({
			// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
			'startdate' : '{startdate:date("' + _("l jS F Y G:i") + '")}',
			// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
			'duedate' : '{duedate:date("' + _("l jS F Y G:i") + '")}',
			'busystatus' : '{busystatus:busyStatusString}',
			'alldayevent' : '{alldayevent}'
		});

		html += this.addPlainRowGroup({
			'from' : '{from}'
		});

		html += this.addPlainRowGroup({
			'meeting' : {
				'display_to' : '{display_to}',
				'display_cc' : '{display_cc}',
				'display_bcc' : '{display_bcc}'
			}
		});

		html += this.addPlainRowGroup({
			'recurring' : {
				'recurring_pattern' : '{recurring_pattern}'
			}
		});

		html += this.addPlainRowGroup({
			'categories' : '{categories}',
			'sensitivity' : '{sensitivity:sensitivityString}',
			'importance' : '{importance:importanceString}'
		});

		html += this.addPlainRow('attachment_names', '{attachment_names}');
		html += '{body}';

		return html;
	},

	/**
	 * Prepares data suitable for use in an XTemplate from the record.
	 * @param {Zarafa.core.data.IPMRecord} record The record to aquire data from.
	 * @return {Array} An array of data which is customized for our purpose.
	 */
	prepareData : function(record)
	{
		var data = Zarafa.calendar.attachitem.AttachCalendarRenderer.superclass.prepareData.apply(this, arguments);

		if(!record.isMeeting()) {
			delete data['meeting'];
		}

		if(!record.get('recurring')) {
			delete data['recurring'];
		}

		if(!record.get('alldayevent')) {
			delete data['alldayevent'];
		}

		if(record.get('busystatus') === Zarafa.core.mapi.BusyStatus.BUSY) {
			delete data['busystatus'];
		}

		// for meeting request record there are differences in property names
		if(record.isMessageClass('IPM.Schedule.Meeting', true)) {
			var startDate = record.get('appointment_startdate');
			if(Ext.isDate(startDate)) {
				data['startdate'] = startDate;
			}

			var dueDate = record.get('appointment_duedate');
			if(Ext.isDate(dueDate)) {
				data['duedate'] = dueDate;
			}

			var recurring = record.get('appointment_recurring');
			if(!recurring) {
				data['recurring'] = recurring;
				data['recurring_pattern'] = record.get('appointment_recurring_pattern');
			}
		}

		return data;
	}
});