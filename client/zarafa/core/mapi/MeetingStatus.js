Ext.namespace('Zarafa.core.mapi');

/**
 * @class Zarafa.core.mapi.MeetingStatus
 * @extends Zarafa.core.Enum
 * 
 * @singleton
 */
Zarafa.core.mapi.MeetingStatus = Zarafa.core.Enum.create({
	/**
	 * Denotes that the message is no meeting
	 * @property
	 * @type Number
	 */
	NONMEETING	: 0,

	/**
	 * Denotes that the message is a meeting
	 * @property
	 * @type Number
	 */
	MEETING		: 1,

	/**
	 * Denotes that the meeting was received by the recipients
	 * @property
	 * @type Number
	 */
	MEETING_RECEIVED	: 3,

	/**
	 * Denotes that the meeting is canceled
	 * @property
	 * @type Number
	 */
	MEETING_CANCELED	: 5,
	/**
	 * Denotes that the scheduled meeting has been canceled but still appears on the user's calendar.
	 * @property
	 * @type Number
	 */
	MEETING_RECEIVED_AND_CANCELED	: 7,

	/**
	 * Return the display name for the given Meeting Status
	 * @param {Zarafa.core.mapi.MeetingStatus} meetingstatus The given meeting status
	 * @return {String} The display name for the meeting status
	 */
	getDisplayName : function(meetingstatus)
	{
		switch (meetingstatus) {
			case Zarafa.core.mapi.MeetingStatus.NONMEETING:
				return '';
			case Zarafa.core.mapi.MeetingStatus.MEETING:
				return _('Meeting');
			case Zarafa.core.mapi.MeetingStatus.MEETING_RECEIVED:
				return _('Received');
			case Zarafa.core.mapi.MeetingStatus.MEETING_CANCELED:
			case Zarafa.core.mapi.MeetingStatus.MEETING_RECEIVED_AND_CANCELED:
				return _('Canceled');
		}
		return '';
	}
});
