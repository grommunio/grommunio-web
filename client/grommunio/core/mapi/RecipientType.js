Ext.namespace('Grommunio.core.mapi');

/**
 * @class Grommunio.core.mapi.RecipientType
 * @extends Grommunio.core.Enum
 *
 * Enumerates the different recipient types.
 *
 * @singleton
 */
Grommunio.core.mapi.RecipientType = Grommunio.core.Enum.create({
	/**
	 * Denotes that the recipient is the originator of the meeting request.
	 * @property
	 * @type Number
	 */
	MAPI_ORIG: 0,

	/**
	 * Denotes that the recipient is a required attendee of the meeting request.
	 * @property
	 * @type Number
	 */
	MAPI_TO: 1,

	/**
	 * Denotes that the recipient is an optional attendee of the meeting request.
	 * @property
	 * @type Number
	 */
	MAPI_CC: 2,

	/**
	 * Denotes that the recipient is a resource of the meeting request.
	 * @property
	 * @type Number
	 */
	MAPI_BCC: 3
});
