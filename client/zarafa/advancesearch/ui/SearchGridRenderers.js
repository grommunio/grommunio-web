Ext.namespace('Zarafa.advancesearch.ui');

/**
 * @class Zarafa.advancesearch.ui.SearchGridRenderers
 * Methods of this object can be used as renderers for search grid panels, to render
 * cells in custom format according to data type
 * @singleton
 */
Zarafa.advancesearch.ui.SearchGridRenderers = {

	/**
	 * Render the subject and body information of record
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	subjectWithBodyColumn: function (value, p, record)
	{
		p.css = 'search-data';

		if (Ext.isEmpty(value)) {
			// if value is empty then add extra css class for empty cell
			p.css += ' zarafa-grid-empty-cell';
		}

		var messageClass = record.get('message_class');

		var subject = '';
		var body = '';

		switch (messageClass) {
			case 'IPM.Contact':
				subject = Zarafa.advancesearch.ui.SearchGridRenderers.phoneNumber(record.get('home_telephone_number'), {}, record);
				body = Ext.util.Format.htmlEncode(record.get('email_address_1'));
				break;
			case 'IPM.Task':
				body = Ext.util.Format.htmlEncode(record.get('body'));
				break;
			case 'IPM.StickyNote':
				subject = Ext.util.Format.htmlEncode(record.get('body'));
				break;
			default:
				//case 'IPM.Note':
				//case 'IPM.Appointment':
				//case 'IPM.Schedule':
				subject = Ext.util.Format.htmlEncode(record.get('subject'));
				body = Ext.util.Format.htmlEncode(record.get('body'));
				break;
		}
		return '<div>' + ( subject ? '<span class="subject">' + subject + '</span>' : '' ) + ( body ? '<span class="body">' + body + '</span>' : '' ) + '</div>';
	},

	/**
	 * Render the name information of record
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	nameColumn: function (value, p, record)
	{
		var messageClass = record.get('message_class');
		var userRecord = false;
		var isItemSentByUser = Ext.isFunction(record.senderIsReceiver) ? !record.senderIsReceiver() && record.senderIsUser() : false;

		if (isItemSentByUser && !Ext.isEmpty(record.get('display_to'))) {
			value = record.get('display_to');
		} else {
			value = record.get('sent_representing_name');
		}

		if (Ext.isEmpty(value) && Ext.isFunction(record.getSender)) {
			value = record.get('sender_name');
			userRecord = record.getSender();
		} else if (Ext.isFunction(record.getSentRepresenting)) {
			userRecord = record.getSentRepresenting();
		}

		switch (messageClass) {
			case 'IPM.Contact':
				return Ext.util.Format.htmlEncode(record.get('display_name'));
			case 'IPM.StickyNote':
				return Ext.util.Format.htmlEncode(record.get('subject'));
			case 'IPM.Schedule.Meeting.Request':
				value = _('With') + ': ' + value;
				break;
			case 'IPM.TaskRequest':
				if (!isItemSentByUser) {
					value = record.get('display_to');
				}
				break;
			case 'IPM.Note':
				if (isItemSentByUser) {
					value = _('To') + ': ' + value;
				}
		}
		var userName = Ext.util.Format.htmlEncode(value);
		return Zarafa.common.ui.grid.Renderers.presenceStatus(userName, p, userRecord);
	},

	/**
	 * Render the date field.
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	dateColumn: function (value, p, record)
	{
		p.css = 'search-date';

		var date = '';
		if (Ext.isDate(value)) {
			if ( container.getSettingsModel().get('zarafa/v1/main/datetime_display_format') === 'short' ){
				// Add one class that the tooltip can use to recognize a 'nice' date.
				// Add one class so the tooltip can easily get the timestamp of the date.
				p.css += ' k-date-nice k-ts-'+value.getTime();

				date = value.getNiceFormat();
			} else {
				date = value.format(_('d/m/Y'));
			}
		} else if (record.isMessageClass('IPM.Task')){
			date = _('No date');
		}

		return '<table cellpadding=0 cellspacing=0 style="width:100%"><tr>' +
			'<td class="date"><div>' + date + '</div></td>' +
			'</tr></table>';
	},

	/**
	 * Render the phone number field.
	 *
	 * @param {Object} value The data value for the cell.
	 * @param {Object} p An object with metadata
	 * @param {Ext.data.record} record The {Ext.data.Record} from which the data was extracted.
	 * @return {String} The formatted string
	 */
	phoneNumber: function (value, p, record)
	{
		p.css = '';
		var phoneNumberProps = ['business_telephone_number', 'home_telephone_number', 'business_fax_number', 'cellular_telephone_number'];

		var phoneNumberProp = phoneNumberProps.find(function (prop) {
			if (!Ext.isEmpty(record.get(prop))) {
				return true;
			}
		});

		if (phoneNumberProp) {
			return Ext.util.Format.htmlEncode(record.get(phoneNumberProp));
		} else {
			return '';
		}
	}
};
