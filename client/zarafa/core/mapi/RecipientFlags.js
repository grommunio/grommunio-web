Ext.namespace('Zarafa.core.mapi');

/**
 * @class Zarafa.core.mapi.RecipientFlags
 * @extends Zarafa.core.Enum
 * 
 * Enumerates the different recipient flags.
 * any combination of these flags can be saved recipient_flags property.
 * 
 * @singleton
 */
Zarafa.core.mapi.RecipientFlags = Zarafa.core.Enum.create({	
	/**
	 * Denotes that the recipient is a sendable attendee of the meeting request.
	 * @property
	 * @type Number
	 */
	recipSendable : 1,
	
	/**
	 * Denotes that the recipient is an organizer of the meeting request.
	 * @property
	 * @type Number
	 */
	recipOrganizer : 2,

	/**
	 * Denotes that the recipient gave a response for the exception of the meeting request.
	 * @property
	 * @type Number
	 */
	recipExceptionalResponse : 16,

	/**
	 * Denotes that the recipient is deleted from the exception of the meeting request.
	 * @property
	 * @type Number
	 */
	recipExceptionalDeleted : 32,

	/**
	 * Denotes that the recipient is deleted from the exception of the meeting request.
	 * @property
	 * @type Number
	 */
	recipOriginal : 256,

	/**
	 * Reserved Flag.
	 * @property
	 * @type Number
	 */
	recipReserved : 512
});