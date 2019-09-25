Ext.namespace('Zarafa.core.mapi');

/**
 * @class Zarafa.core.mapi.AppointmentAuxiliaryFlags
 * @extends Zarafa.core.Enum
 *
 * Enumerates the different bit field that describes the auxiliary state of the object.
 *
 * @singleton
 */
Zarafa.core.mapi.AppointmentAuxiliaryFlags = Zarafa.core.Enum.create({
	/**
	 * This flag indicates that the calendar object was copied from another calendar folder.
	 *
	 * @property
	 * @type Number
	 */
	auxApptFlagCopied : 0x00000001,

	/**
	 * This flag on a meeting request indicates that the client or server should send a
	 * meeting response back to the organizer when a response is chosen.
	 *
	 * @property
	 * @type Number
	 */
	auxApptFlagForceMtgResponse : 0x00000002,

	/**
	 * This flag on a meeting request indicates that it was forwarded (including being forwarded
	 * by the organizer), rather than being an invitation from the organizer.
	 *
	 * @property
	 * @type Number
	 */
	auxApptFlagForwarded : 0x00000004
});
