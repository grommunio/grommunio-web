Ext.namespace('Zarafa.core.mapi');

/**
 * @class Zarafa.core.mapi.ResponseStatus
 * @extends Zarafa.core.Enum
 * 
 * @singleton
 */
Zarafa.core.mapi.ResponseStatus = Zarafa.core.Enum.create({
	/**
	 * Denotes that no response is required
	 * @property
	 * @type Number
	 */
	RESPONSE_NONE		: 0,

	/**
	 * Denotes that the message belongs to meeting organizer
	 * @property
	 * @type Number
	 */
	RESPONSE_ORGANIZED	: 1,

	/**
	 * Denotes that attendee has tentatively accepted the meeting request
	 * @property
	 * @type Number
	 */
	RESPONSE_TENTATIVE	: 2,

	/**
	 * Denotes that attendee has accepted the meeting request
	 * @property
	 * @type Number
	 */
	RESPONSE_ACCEPTED	: 3,
	/**
	 * Denotes that attendee has declined the meeting request
	 * @property
	 * @type Number
	 */
	RESPONSE_DECLINED	: 4,

	/**
	 * Denotes that attendee has not yet responded to the meeting request
	 * @property
	 * @type Number
	 */
	RESPONSE_NOT_RESPONDED	: 5,

	/**
	 * Return the display name for the given Response Status
	 * @param {Zarafa.core.mapi.ResponseStatus} responsestatus The given response status
	 * @return {String} The display name for the response status
	 */
	getDisplayName : function(responsestatus)
	{
		switch (responsestatus) {
			case Zarafa.core.mapi.ResponseStatus.RESPONSE_ORGANIZED:
				return _('Organizer');
			case Zarafa.core.mapi.ResponseStatus.RESPONSE_NONE:
				return _('No response');
			case Zarafa.core.mapi.ResponseStatus.RESPONSE_NOT_RESPONDED:
				return _('Not responded');
			case Zarafa.core.mapi.ResponseStatus.RESPONSE_TENTATIVE:
				return _('Tentative');
			case Zarafa.core.mapi.ResponseStatus.RESPONSE_ACCEPTED:
				return _('Accepted');
			case Zarafa.core.mapi.ResponseStatus.RESPONSE_DECLINED:
				return _('Declined');
		}
		return '';
	}
});
