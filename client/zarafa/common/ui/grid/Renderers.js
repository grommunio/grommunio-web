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
		var conversationCount = record.get('conversation_count');
		var depth = record.get('depth');

		if (conversationCount > 0 && depth === 0) {
			p.css = 'k-conversation_header';

			if (record.store.openedConversationItems && record.store.isConversationOpened(record)) {
				p.css += ' arrow_down_l';
			} else if (record.store.openedConversationItems && !record.store.isConversationOpened(record)) {
				p.css += ' arrow_right_l';
			}
		} else if (depth !== 1) {
			p.css = Zarafa.common.ui.IconClass.getIconClass(record);
		}

		if (Ext.isNumber(depth) && depth > 0) {
			p.css += ' arrow_right_l';
		}

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

		var isHeaderRecord = Ext.isFunction(record.isConversationHeaderRecord) && record.isConversationHeaderRecord(record);
		if (isHeaderRecord) {
			value = Zarafa.common.ui.grid.Renderers.conversationHasAttachement(record);
		}

		p.css = (value === true) ? 'icon_paperclip' : 'icon_noattachment';

		// add extra css class for empty cell
		p.css += ' zarafa-grid-empty-cell';

		return '';
	},


	/**
	 * Helper function that finds if there is a conversation record that has an attachment
	 *
	 * @param {Zarafa.core.data.MessageRecord} headerRecord The header record of a conversation
	 * @return {Boolean} True if a record with an attachment was found, false otherwise
	 */
	conversationHasAttachement(headerRecord) {
		var conversationRecords = headerRecord.store.getConversationItemsFromHeaderRecord(headerRecord);
		return conversationRecords.some(function(r) {
			return r.get('hasattach') && r.get('hide_attachments') !== true;
		});
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
		p.css = value ? 'icon_recurrence' : 'zarafa-grid-empty-cell';
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
		if (Ext.isDefined(record) && !Ext.isEmpty(record.get('reminder_time'))) {
			var reminderTime = record.get('reminder_time');
			var tooltip = String.format(_('Reminder is set on: {0}, {1}'), reminderTime.format(_('d-m-Y')), reminderTime.formatDefaultTime());
			p.attr = 'ext:qtip=\"'+Ext.util.Format.htmlEncode(tooltip)+'\"';
		}
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
		var userName = Zarafa.common.ui.grid.Renderers.name(value, p, record);
		return Zarafa.common.ui.grid.Renderers.presenceStatus(userName, p, record);
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
		var retVal = '';
		var userRecord = false;
		var conversationCount = record.get('conversation_count');
		var depth = record.get('depth');

		if (conversationCount > 0 && depth === 0) {
			// find the records of the conversation
			var store = record.getStore();
			var records = store.getConversationItemsFromHeaderRecord(record);

			// Collect all first names of the senders in this conversation
			return records.filter(function(val, index) {
				for (let i=0; i<index; i++) {
					// We will use the value of sent_representing_name to find unique senders.
					// This means that two persons with the same name in a conversation will be
					// shown as a single name in the header. Checking with email addresses would
					// be better, but this changes for ZARAFA users from the username to the
					// smtp address when a record is opened.
					if (val.get('sent_representing_name') === records[i].get('sent_representing_name')) {
						return false;
					}
				}
				return true;
			}).map(function(val) {
				if (!val) {
					return '';
				}
				return val.get('sent_representing_name').split(' ')[0];
			}).join(', ');
		} else if (depth > 0) {
			retVal = '<span class="k-icon ' + Zarafa.common.ui.IconClass.getIconClass(record) + '"></span>';
		}

		// Check which of the 2 properties must be used
		// FIXME: sent representing seems to be always set...
		value = record.get('sent_representing_name');
		if ( Ext.isEmpty(value) && Ext.isFunction(Ext.isFunction(record.getSender))) {
			value = record.get('sender_name');
			userRecord = record.getSender();
		} else if (Ext.isFunction(record.getSentRepresenting)) {
			userRecord = record.getSentRepresenting();
		}
		var userName = Zarafa.common.ui.grid.Renderers.name(value, p, record);

		return retVal + Zarafa.common.ui.grid.Renderers.presenceStatus(userName, p, userRecord);
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
	
		if (Ext.isDefined(record) && record.get('conversation_count') > 0){
			value = record.get('normalized_subject');
		} 

		return Ext.util.Format.htmlEncode(value);
	},

	/**
	 * Render the cell as Body
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	body : function(value, p, record)
	{
		/**
		 * @FIXME: value must always be record.get('body').
		 * Currently we are getting subject as a value for mailGrid in non compact view
		 * because the dataIndex will remain same for the 'subject' column.
		 */
		p.css = 'mail_body';	
		if(Ext.isEmpty(value)) {
			// if value is empty then add extra css class for empty cell
			p.css += ' zarafa-grid-empty-cell';
		} 
		
		if (Ext.isDefined(record)) {
			//  If header record then display normalized_subject
			if (record.get('conversation_count') > 0) {
				value = record.get('normalized_subject');
			} else { 
				value = record.get('body');
				var indexOfRepliedMail = value.indexOf("-----" + _('Original message') + "-----");
				if (indexOfRepliedMail > 0) {
					value = value.substring(0, indexOfRepliedMail);
				}
			}
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
				return Ext.util.Format.percentage(1, 0);
			}
			return '';
		}
		return Ext.util.Format.percentage(value, 0);
	},

	/**
	 * Render the cell as Date (l d/m/y) string
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 *
	 * @return {String} The formatted string
	 */
	date : function(value, p)
	{
		p.css = 'mail_date';

		if ( !Ext.isDate(value) ){
			return _('None');
		}

		if ( container.getSettingsModel().get('zarafa/v1/main/datetime_display_format') === 'short' ){
			return value.getNiceFormat(false);
		} else {
			return value.format(_('l d/m/Y'));
		}
	},

	/**
	 * Render the cell as Date (l d/m/y) string, where the Date is should be represented in UTC
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata

	 * @return {String} The formatted string
	 */
	utcdate : function(value, p)
	{
		if ( Ext.isDate(value) ){
			value = value.toUTC();
		}

		return Zarafa.common.ui.grid.Renderers.date(value, p);
	},

	/**
	 * Render the cell as date with time (l d/m/Y G:i) when the user has set the long display format
	 * or the 'nice' date when the the short display format has been set.
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @param {Integer} row The row in the grid for which a cell is rendered
	 * @param {Integer} column The column in the grid for which a cell is rendered
	 * @param {Zarafa.mail.MailStore} The store of the grid that is being rendered
	 * @param {Object} meta An object with meta data that can be used by the renderer function
	 *
	 * @return {String} The formatted string
	 */
	datetime : function(value, p, record, row, column, store, meta)
	{
		p.css = 'mail_date';

		if ( meta && meta.css ){
			p.css += ' ' + meta.css;
		}

		// Don't show dates for conversation headers
		if (record.get('depth') === 0 && record.get('conversation_count') > 0) {
			return '';
		}

		// TODO: Ugly hack. We shouldn't use the css property for this
		if (meta && meta.css === 'mail-received' && record.get('depth') > 0 && record.get('folder_name') !== 'inbox') {
			p.css += ' k-from-other-folder';

			// TODO: Above condition should only true when conversation is enabled and record is not belongs to the
			// inbox folder which means it is sent items folder record, as of now we only support conversation in Inbox.
			// We can't use folder.getDisplayName() because when user open the only shared store inbox in conversation view
			// it will throw an error due to unable to find the folder in shared store.
			return _('Sent Items');
		}

		if ( !Ext.isDate(value) ){
			return _('None');
		}

		if ( container.getSettingsModel().get('zarafa/v1/main/datetime_display_format') === 'short' ){
			// Add one class that the tooltip can use to recognize a 'nice' date.
			// Add one class so the tooltip can easily get the timestamp of the date.
			p.css += ' k-date-nice k-ts-'+value.getTime();

			return value.getNiceFormat();
		} else {
			return value.formatDefaultTime(_('l d/m/Y {0}'));
		}
	},

	/**
	 * Render the cell as date with time (l d/m/Y G:i when the user has set the Long display
	 * format, or d-m-Y, G:i when the short format has been set) This renderer should be used
	 * instead of {#datetime} when a time should always be shown, e.g. for the reminder time.
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 *
	 * @return {String} The formatted string
	 */
	dateWithTime : function(value, p)
	{
		p.css = '';

		if ( !Ext.isDate(value) ){
			return _('None');
		}

		if ( container.getSettingsModel().get('zarafa/v1/main/datetime_display_format') === 'short' ){
			// Add one class that the tooltip can use to recognize a 'nice' date.
			// Add one class so the tooltip can easily get the timestamp of the date.
			p.css += ' k-date-nice k-ts-'+value.getTime();
			return value.formatDefaultTime(_('d-m-Y {0}'));
		} else {
			return value.formatDefaultTime(_('l d/m/Y {0}'));
		}
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
		// add extra css class for empty cell
		p.css += 'zarafa-grid-empty-cell';

		var isHeaderRecord = Ext.isFunction(record.isConversationHeaderRecord) && record.isConversationHeaderRecord(record);
		var flagStatus = record.get('flag_status');
		var dueDate = record.get('duedate');
		if (isHeaderRecord) {
			dueDate = Zarafa.common.ui.grid.Renderers.getConversationDueDate(record);
		}

		if ( flagStatus === Zarafa.core.mapi.FlagStatus.completed ){
			p.css += ' icon_flag_complete';
			return '';
		}

		if (
			(isHeaderRecord && Ext.isEmpty(dueDate)) ||
			(!isHeaderRecord && !record.isMessageClass('IPM.Task') && flagStatus!==Zarafa.core.mapi.FlagStatus.flagged)
		){
			p.css += ' icon_flag';
			return '<div class="k-followup-flag"></div>';
		}

		// Now find the color we must show

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
	 * Helper function that finds the first (in time) due date of all records in a conversation
	 *
	 * @param {Zarafa.core.data.MessageRecord} headerRecord The header record of a conversation
	 * @return {Date} The due date of the conversation
	 */
	getConversationDueDate(headerRecord) {
		var conversationDueDate = null;
		var conversationRecords = headerRecord.store.getConversationItemsFromHeaderRecord(headerRecord);
		conversationRecords.forEach(function(r) {
			var flagStatus = r.get('flag_status');
			if (!r.isMessageClass('IPM.Task') && flagStatus !== Zarafa.core.mapi.FlagStatus.flagged) {
				return;
			}

			var dueDate = r.get('duedate');
			if (Ext.isEmpty(conversationDueDate) || dueDate < conversationDueDate) {
				conversationDueDate = dueDate;
			}
		});

		return conversationDueDate;
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
	 * Render the presence status of user along with user name.
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	presenceStatus: function (value, p, record)
	{
		var presenceStatus = Zarafa.core.data.PresenceStatus.UNKNOWN;
		if (record !== false) {
			var user = Zarafa.core.data.UserIdObjectFactory.createFromRecord(record);
			presenceStatus = Zarafa.core.PresenceManager.getPresenceStatusForUser(user);
		}
		return '<span class="zarafa-presence-status ' + Zarafa.core.data.PresenceStatus.getCssClass(presenceStatus) + '">' +
			'<span class="zarafa-presence-status-icon"></span>' + value + '</span>';
	}
};
