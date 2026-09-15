Ext.namespace('Grommunio.core.mapi');

/**
 * @class Grommunio.core.mapi.MeetingStatus
 * @extends Grommunio.core.Enum
 *
 * @singleton
 */
Grommunio.core.mapi.MeetingStatus = Grommunio.core.Enum.create({
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
	 * @param {Grommunio.core.mapi.MeetingStatus} meetingstatus The given meeting status
	 * @return {String} The display name for the meeting status
	 */
	getDisplayName: function(meetingstatus)
	{
		switch (meetingstatus) {
			case Grommunio.core.mapi.MeetingStatus.NONMEETING:
				return '';
			case Grommunio.core.mapi.MeetingStatus.MEETING:
				return _('Meeting');
			case Grommunio.core.mapi.MeetingStatus.MEETING_RECEIVED:
				return _('Received');
			case Grommunio.core.mapi.MeetingStatus.MEETING_CANCELED:
			case Grommunio.core.mapi.MeetingStatus.MEETING_RECEIVED_AND_CANCELED:
				return _('Canceled');
		}
		return '';
	}
});
