Ext.namespace('Zarafa.common.ui.grid');

/**
 * @class Zarafa.common.ui.grid.Renderers
 * Methods of this object can be used as renderers for grid panels, to render
 * cells in custom format according to data type
 * @singleton
 */
Zarafa.common.ui.grid.Renderers = {
	/**
	 * Render the cell as Importance
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	importance : function(value, p, record)
	{
		if (value >= 0) {
			p.css = Zarafa.core.mapi.Importance.getClassName(value);
		}

		// add extra css class for empty cell
		p.css += ' zarafa-grid-empty-cell';

		return '';
	},

	/**
	 * Render the cell as Icon
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	icon : function(value, p, record)
	{
		p.css = Zarafa.common.ui.IconClass.getIconClass(record);

		// add extra css class for empty cell
		p.css += ' zarafa-grid-empty-cell';

		return '';
	},

	/**
	 * Render the cell as Attachment
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	attachment : function(value, p, record)
	{
		if (Ext.isDefined(record) && record.get('hide_attachments') === true) {
			return '';
		}

		p.css = (value === true) ? 'icon_attachment' : 'icon_noattachment';

		// add extra css class for empty cell
		p.css += ' zarafa-grid-empty-cell';

		return '';
	},

	/**
	 * Render the cell as Recurrence
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	recurrence : function(value, p, record)
	{
		p.css = value ? 'icon_recurring' : 'zarafa-grid-empty-cell';
		return '';
	},

	/**
	 * Renderer for reminder column
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	reminder : function (value, p, record)
	{
		p.css = value ? 'icon_reminder' : 'zarafa-grid-empty-cell';
		return '';
	},

	/**
	 * Renders the cell as categories view
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	categories : function(value, p, record)
	{
		// Render the categories
		var categories = Zarafa.common.categories.Util.getCategories(record);
		return Zarafa.common.categories.Util.getCategoriesHtml(categories);
	},

	/**
	 * Render the cell as Name
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	name : function(value, p, record)
	{
		p.css = 'mail_from';

		if(Ext.isEmpty(value)) {
			// if value is empty then add extra css class for empty cell
			p.css += ' zarafa-grid-empty-cell';
		}

		return Ext.util.Format.htmlEncode(value);
	},

	/**
	 * Render the cell as Display Name with presence status
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	displayName : function(value, p, record)
	{
		var user = Zarafa.core.data.UserIdObjectFactory.createFromRecord(record);
		var presenceStatus = Zarafa.core.PresenceManager.getPresenceStatusForUser(user);

		return '<span class="zarafa-presence-status '+Zarafa.core.data.PresenceStatus.getCssClass(presenceStatus)+'">' +
				'<span class="zarafa-presence-status-icon"></span>' +
				Zarafa.common.ui.grid.Renderers.name(value, p, record) +
				'</span>';
	},

	/**
	 * Render the cell as Sender
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	sender : function(value, p, record)
	{
		var userRecord = false;
		var presenceStatus = Zarafa.core.data.PresenceStatus.UNKNOWN;
		// Check which of the 2 properties must be used
		// FIXME: sent representing seems to be always set...
		value = record.get('sent_representing_name');
		if ( Ext.isEmpty(value) && Ext.isFunction(Ext.isFunction(record.getSender))) {
			value = record.get('sender_name');
			userRecord = record.getSender();
		} else if (Ext.isFunction(record.getSentRepresenting)) {
			userRecord = record.getSentRepresenting();
		}

		if (userRecord !== false) {
			var user = Zarafa.core.data.UserIdObjectFactory.createFromRecord(userRecord);
			presenceStatus = Zarafa.core.PresenceManager.getPresenceStatusForUser(user);
		}

		return '<span class="zarafa-presence-status '+Zarafa.core.data.PresenceStatus.getCssClass(presenceStatus)+'">' +
					'<span class="zarafa-presence-status-icon"></span>' +
					Zarafa.common.ui.grid.Renderers.name(value, p, record) +
				'</span>';
	},

	/**
	 * Render the cell as Organizer
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	organizer : function(value, p, record)
	{
		// Only render the cell as non-empty if the
		// record is actually a meeting.
		if (Ext.isDefined(record.isMeeting) && record.isMeeting()) {
			return Zarafa.common.ui.grid.Renderers.sender(value, p, record);
		} else {
			// if value is empty then add extra css class for empty cell
			p.css += ' zarafa-grid-empty-cell';
			return '';
		}
	},

	/**
	 * Render the cell as Subject
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	subject : function(value, p, record)
	{
		p.css = 'mail_subject';

		if(Ext.isEmpty(value)) {
			// if value is empty then add extra css class for empty cell
			p.css += ' zarafa-grid-empty-cell';
		}

		return Ext.util.Format.htmlEncode(value);
	},

	/**
	 * Render the cell as text view
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	text : function(value, p, record)
	{
		if(Ext.isEmpty(value)) {
			// if value is empty then add extra css class for empty cell
			p.css = 'zarafa-grid-empty-cell';
		}

		return Ext.util.Format.htmlEncode(value);
	},

	/**
	 * Render the cell as the recipient list.
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	to : function(value, p, record)
	{
		p.css = 'mail_to';

		if(Ext.isEmpty(value)) {
			// if value is empty then add extra css class for empty cell
			p.css += ' zarafa-grid-empty-cell';
		}

		return Ext.util.Format.htmlEncode(value);
	},

	/**
	 * Render the cell as the message size
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	size : function(value, p, record)
	{
		p.css = 'mail_size';

		if(Ext.isEmpty(value)) {
			// if value is empty then add extra css class for empty cell
			p.css += ' zarafa-grid-empty-cell';
		}

		return Ext.util.Format.fileSize(value);
	},

	/**
	 * Renderer for percentage column
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	percentage : function (value, p, record)
	{
		p.css = 'task_percentage';
		if ( isNaN(value) ){
			// 'value' will not be available as there is no 'complete' property while
			// rendering this column for mail record, using 'flag_status' instead.
			if ( record.get('flag_status') === Zarafa.core.mapi.FlagStatus.completed ) {
				return Ext.util.Format.percentage(1);
			}
			return '';
		}
		return Ext.util.Format.percentage(value);
	},

	/**
	 * Render the cell as Date (l d/m/y) string
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	date : function(value, p, record)
	{
		p.css = 'mail_date';

		// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
		return Ext.isDate(value) ? value.format(_('l d/m/Y')) : _('None');
	},

	/**
	 * Render the cell as Date (l d/m/y) string, where the Date is should be represented in UTC
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	utcdate : function(value, p, record)
	{
		p.css = 'mail_date';

		// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
		return Ext.isDate(value) ? value.toUTC().format(_('l d/m/Y')) : _('None');
	},

	/**
	 * Render the cell as Date with Time (l d/m/Y G:i) string
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @param {Integer} row The row in the grid for which a cell is rendered
	 * @param {Integer} column The column in the grid for which a cell is rendered
	 * @param {Zarafa.mail.MailStore} The store of the grid that is being rendered
	 * @param {Object} meta An object with meta data that can be used by the renderer function
	 * @return {String} The formatted string
	 */
	datetime : function(value, p, record, row, column, store, meta)
	{
		p.css = 'mail_date';

		if ( meta && meta.css ){
			p.css += ' ' + meta.css;
		}

		// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
		return Ext.isDate(value) ? value.format(_('l d/m/Y G:i')) : _('None');
	},

	/**
	 * Render the duration field
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	duration : function(value, p, record)
	{
		p.css = 'mail_duration';

		return value ? Ext.util.Format.duration(value, 1) : '';
	},

	/**
	 * Render the duration field by only using the hours annotation.
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	durationHours : function(value, p, record)
	{
		p.css = 'mail_duration';
		if ( !Ext.isDefined(value) ){
			return '';
		}

		return String.format(ngettext('{0} hour', '{0} hours', value), value);
	},

	/**
	 * Render the folder field (converts entryid into foldername).
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	folder : function(value, p, record)
	{
		var folder = container.getHierarchyStore().getFolder(value);
		if (folder) {
			return folder.get('display_name');
		} else {
			return _('Unknown');
		}
	},

	/**
	 * Render the Busy status.
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	busystatus : function(value, p, record)
	{
		return Zarafa.core.mapi.BusyStatus.getDisplayName(value);
	},

	/**
	 * Render the Appointment label.
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	label : function(value, p, record)
	{
		return Zarafa.core.mapi.AppointmentLabels.getDisplayName(value);
	},

	/**
	 * Render the Sensitivity.
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	sensitivity : function(value, p, record)
	{
		return Zarafa.core.mapi.Sensitivity.getDisplayName(value);
	},

	/**
	 * Render the Meeting status.
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	meetingstatus : function(value, p, record)
	{
		return Zarafa.core.mapi.MeetingStatus.getDisplayName(value);
	},

	/**
	 * Render the Recipient Type.
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	recipienttype : function(value, p, record)
	{
		switch (value) {
			case Zarafa.core.mapi.RecipientType.MAPI_TO:
			case Zarafa.core.mapi.RecipientType.MAPI_ORIG:
				if(record.isMeetingOrganizer()) {
					return _('Meeting Organizer');
				}
				return _('Required Attendee');
			case Zarafa.core.mapi.RecipientType.MAPI_BCC:
				return _('Resource');
			case Zarafa.core.mapi.RecipientType.MAPI_CC:
			/* falls through */
			default:
				return _('Optional Attendee');
		}
	},

	/**
	 * Render the Response Status.
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	responsestatus : function(value, p, record)
	{
		return Zarafa.core.mapi.ResponseStatus.getDisplayName(value);
	},

	/**
	 * Render the Follow-up Flag Status.
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	flag : function(value, p, record)
	{
		var flagStatus = record.get('flag_status');

		// add extra css class for empty cell
		p.css += 'zarafa-grid-empty-cell';

		if ( flagStatus === Zarafa.core.mapi.FlagStatus.completed ){
			p.css += ' icon_flag_complete';
			return '';
		}

		if ( !record.isMessageClass('IPM.Task') && flagStatus!==Zarafa.core.mapi.FlagStatus.flagged ){
			p.css += ' icon_flag';
			return '<div class="k-followup-flag"></div>';
		}

		// Now find the color we must show
		var dueDate = record.get('task_due_date') || record.get('duedate');

		if ( !dueDate ){
			p.css += ' icon_flag_red';
			return '';
		}

		// Since we are interested in days and not in the exact time,
		// we will set all times to 12am so it will be easy to compare days
		dueDate.setToNoon();
		var dueDateTimestamp = dueDate.getTime();
		var today = new Date().setToNoon();
		var todayTimestamp = today.getTime();

		// If the due date is today or before today we will show a red flag
		if ( dueDateTimestamp <= todayTimestamp ){
			p.css += ' icon_flag_red';
			return '';
		}

		// If the due date is tomorrow (timestamp difference will be 24 hours),
		// we will show a dark orange flag
		if ( dueDateTimestamp-todayTimestamp === 24*60*60*1000 ){
			p.css += ' icon_flag_orange_dark';
			return '';
		}

		if ( dueDate.inSameWeekAs(today) ){
			p.css += ' icon_flag_orange';
			return '';
		}

		if ( today.inNextWeek(dueDate) ){
			p.css += ' icon_flag_yellow';
			return '';
		}

		p.css += ' icon_flag_red';
		return '';
	},

	/**
	 * Render the dueby field
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	dueBy : function(value, p, record)
	{
		var result = '';

		/*
		 * this one is really ugly hack appointments use reminder_time property to show due by time
		 * and task uses task_duedate property
		 */
		if (Zarafa.core.MessageClass.isClass(record.get('message_class'), 'IPM.Task', true)) {
			value = record.get('task_duedate');
		}

		if (!Ext.isDate(value)) {
			// if somehow no reminder_time/task_duedate property is present then we can't do anything here
			// because showing data from flagdueby property will not be good as it will contain
			// incorrect value
			return result;
		}

		var time1 = value.getTime();
		var time2 = new Date().getTime();

		// get diff in minutes
		var diff = Math.floor(Math.abs(time1 - time2)/60000);

		if(diff === 0) { // Now
			return _('Now');
		} else {
			result = Ext.util.Format.duration(diff);
		}

		if (time1 - time2 < 0){
			return String.format(_('{0} overdue'), result);
		}

		return result;
	},

	/**
	 * Render the Task Status.
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	taskstatus : function(value, p, record)
	{
		return Zarafa.core.mapi.TaskStatus.getDisplayName(value);
	},

	/**
	 * Render the Colors in textual format.
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	colorTextValue : function(value, p, record)
	{
		return Zarafa.core.mapi.NoteColor.getColorText(value);
	},

	/**
	 * Render the name, subject and body information of record
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	dataColumn : function(value, p, record)
	{
		p.css = 'search-data';

		if(Ext.isEmpty(value)) {
			// if value is empty then add extra css class for empty cell
			p.css += ' zarafa-grid-empty-cell';
		}

		var messageClass = record.get('message_class');
		//TODO: give these variables better names
		var name = '';
		var subject = '';
		var body = '';

		switch (messageClass) {
			case 'IPM.Contact':
			case 'IPM.DistList':
				name = Ext.util.Format.htmlEncode(record.get('display_name'));
				subject = Ext.util.Format.htmlEncode(record.get('fileas'));
				//TODO: try to get an emailadress from other fields if this field is empty
				body = Ext.util.Format.htmlEncode(record.get('email_address_1'));
				break;
			case 'IPM.Task':
				name = Ext.util.Format.htmlEncode(record.get('subject'));
				body = Ext.util.Format.htmlEncode(record.get('body'));
				break;
			case 'IPM.StickyNote':
				name = Ext.util.Format.htmlEncode(record.get('subject'));
				subject = Ext.util.Format.htmlEncode(record.get('body'));
				break;
			default:
			//case 'IPM.Note':
			//case 'IPM.Appointment':
			//case 'IPM.Schedule':
				name = Zarafa.common.ui.grid.Renderers.sender(value, p, record);
				subject = Ext.util.Format.htmlEncode(record.get('subject'));
				body = Ext.util.Format.htmlEncode(record.get('body'));
				break;
		}
		return ''+
			'<table cellpadding=0 cellspacing=0 style="width:100%" class="messageclass-data mc-'+messageClass.toLowerCase().replace('.', '')+'">' +
				'<tr>' +
					'<td class="x-grid3-col x-grid3-cell x-grid3-td-0 icon ' + Zarafa.common.ui.IconClass.getIconClass(record) + '"></td>' +
					'<td class="name"><div class="padding">' + name + '</div></td>' +
					'<td class="subject-body"><div class="padding">' + ( subject ? '<span class="subject">'+subject+'</span>' : '' ) + ( body ? '<span class="body">'+body+'</span>' : '' ) + '</div></td>' +
				'</tr>' +
			'</table>';
	},

	/**
	 * Render the date field and attachment icon if record contains attachment.
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	dateColumn : function(value, p, record)
	{
		p.css = 'search-date';

		// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
		var date = Ext.isDate(value) ? value.format(_('d/m/Y')) : '';

		// TODO: make insertionpoint for other icons (reuse mail grid insertionpoint???)
		return '<table cellpadding=0 cellspacing=0 style="width:100%"><tr>' +
					'<td class="date"><div>' + date + '</div></td>' +
					( record.get('hasattach') ? '<td class="icon_attachment" style="width:22px"></td>' : '' ) +
				'</tr></table>';
	}
};
