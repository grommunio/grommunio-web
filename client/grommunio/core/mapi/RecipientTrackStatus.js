Ext.namespace('Grommunio.core.mapi');

/**
 * @class Grommunio.core.mapi.RecipientTrackStatus
 * @extends Grommunio.core.Enum
 * 
 * @singleton
 */
Grommunio.core.mapi.RecipientTrackStatus = Grommunio.core.Enum.create({
	/**
	 * Denotes that attendee has not replied to meeting request yet.
	 * @property
	 * @type Number
	 */
	RECIPIENT_TRACKSTATUS_NONE		: 0,

	/**
	 * Denotes that attendee has tentatively accepted the meeting request
	 * @property
	 * @type Number
	 */
	RECIPIENT_TRACKSTATUS_TENTATIVE	: 2,

	/**
	 * Denotes that attendee has accepted the meeting request
	 * @property
	 * @type Number
	 */
	RECIPIENT_TRACKSTATUS_ACCEPTED	: 3,
	/**
	 * Denotes that attendee has declined the meeting request
	 * @property
	 * @type Number
	 */
	RECIPIENT_TRACKSTATUS_DECLINED	: 4
});
