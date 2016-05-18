Ext.namespace("Zarafa.core.mapi");

/**
 * @class Zarafa.core.mapi.IconIndex
 * @extends Zarafa.core.Enum
 * 
 * Enumerates all Icon Index values
 *
 * @singleton
 */
Zarafa.core.mapi.IconIndex = Zarafa.core.Enum.create({
	// mail
	'mail_stubbed' : 0x00000002,
	'mail_read' : 0x00000100,
	'mail_unread' : 0x00000101,
	'mail_submitted' : 0x00000102,
	'mail_unsent' : 0x00000103,
	'mail_receipt' : 0x00000104,
	'mail_replied' : 0x00000105,
	'mail_forwarded' : 0x00000106,
	'mail_remote' : 0x00000107,
	'mail_delivery_receipt' : 0x00000108,
	'mail_read_receipt' : 0x00000109,
	'mail_nondelivery_receipt' : 0x0000010a,
	'mail_nonread_receipt' : 0x0000010b,
	'mail_recall_s' : 0x0000010c,
	'mail_recall_f' : 0x0000010d,
	'mail_tracking' : 0x0000010e,
	'mail_oof' : 0x0000011b,
	'mail_recall' : 0x0000011c,
	'mail_tracked' : 0x00000130,

	// contact
	'contact_user' : 0x00000200,
	'contact_distlist' : 0x00000202,

	// sticky notes
	'note_blue' : 0x00000300,
	'note_green' : 0x00000301,
	'note_pink' : 0x00000302,
	'note_yellow' : 0x00000303,
	'note_white' : 0x00000304,

	// appointment
	'appt_appointment' : 0x00000400,
	'appt_recurring' : 0x00000401,
	'appt_meeting_single' : 0x00000402,
	'appt_meeting_recurring' : 0x00000403,
	'appt_meeting_request' : 0x00000404,
	'appt_meeting_accept' : 0x00000405,
	'appt_meeting_decline' : 0x00000406,
	'appt_meeting_tentative' : 0x00000407,
	'appt_meeting_cancel' : 0x00000408,
	'appt_meeting_outofdate' : 0x00000409,
	'appt_meeting_forward' : 0x0000040b,

	// task
	'task_normal' : 0x00000500,
	'task_recurring' : 0x00000501,
	'task_assignee' : 0x00000502,
	'task_assigner' : 0x00000503,

	// journal
	'journal_conversation' : 0x00000601,
	'journal_document' : 0x00000612,
	'journal_email' : 0x00000602,
	'journal_fax' : 0x00000609,
	'journal_letter' : 0x0000060c,
	'journal_meeting' : 0x00000613,
	'journal_meeting_cancel' : 0x00000614,
	'journal_meeting_request' : 0x00000603,
	'journal_meeting_response' : 0x00000604,
	'journal_access' : 0x00000610,
	'journal_excel' : 0x0000060e,
	'journal_powerpoint' : 0x0000060f,
	'journal_word' : 0x0000060d,
	'journal_note' : 0x00000608,
	'journal_phone_call' : 0x0000060a,
	'journal_remote_session' : 0x00000615,
	'journal_task' : 0x0000060b,
	'journal_task_request' : 0x00000606,
	'journal_task_response' : 0x00000607,
	'journal_other' : 0x00000003,

	/**
	 * Gets icon class based on icon index value
	 * @param {Number} id icon index value
	 * @param {String} prefix prefix to add before class name
	 * @return {String} icon class
	 */
	getClassName : function(id, prefix)
	{
		if (Ext.isEmpty(prefix)) {
			prefix = 'icon';
		}

		// only allow numbers
		if(!Ext.isNumber(id)) {
			id = parseInt(id, 10);
		}

		if (!Ext.isNumber(id)) {
			return '';
		}

		var className = this.getName(id);

		if(!Ext.isEmpty(className)) {
			return prefix + '_' + className;
		}

		return '';
	}
});
