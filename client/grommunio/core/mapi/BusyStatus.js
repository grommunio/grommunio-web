Ext.namespace('Grommunio.core.mapi');

/**
 * @class Grommunio.core.mapi.BusyStatus
 * @extends Grommunio.core.Enum
 *
 * Enumerates the different busy status types.
 *
 * @singleton
 */
Grommunio.core.mapi.BusyStatus = Grommunio.core.Enum.create({
	/**
	 * Denotes that the owner/participants don't have freebusy information for the
	 * given time.
	 * @property
	 * @type Number
	 */
	UNKNOWN: -1,

	/**
	 * Denotes that the owner/participants is/are free for the duration of the appointment.
	 * @property
	 * @type Number
	 */
	FREE: 0,

	/**
	 * Denotes that the appointment has been tentatively accepted.
	 * @property
	 * @type Number
	 */
	TENTATIVE: 1,

	/**
	 * Denotes that the owner/participants is/are busy for the duration of the appointment.
	 * @property
	 * @type Number
	 */
	BUSY: 2,

	/**
	 * Denotes that the owner/participants is/are out of office for the duration of the appointment.
	 * @property
	 * @type Number
	 */
	OUTOFOFFICE: 3,

	/**
	 * Denotes that the owner/participants is/are working elsewhere for the duration of the appointment.
	 * @property
	 * @type Number
	 */
	WORKINGELSEWHERE: 4,

	/**
	 * Denotes that there is no data regarding the owner/participants status for the duration of appointment.
	 * @property
	 * @type Number
	 */
	BLUR: 5,

	/**
	 * Return the display name for the given busy status
	 * @param {Grommunio.core.mapi.BusyStatus} busystatus The given busy Status
	 * @return {String} The display name for the busy status
	 */
	getDisplayName: function(busystatus)
	{
		switch (busystatus) {
			case Grommunio.core.mapi.BusyStatus.UNKNOWN:
				return _('Unknown');
			case Grommunio.core.mapi.BusyStatus.FREE:
				return _('Free');
			case Grommunio.core.mapi.BusyStatus.TENTATIVE:
				return _('Tentative');
			case Grommunio.core.mapi.BusyStatus.BUSY:
				return _('Busy');
			case Grommunio.core.mapi.BusyStatus.OUTOFOFFICE:
				return _('Out of Office');
			case Grommunio.core.mapi.BusyStatus.WORKINGELSEWHERE:
				return _('Working Elsewhere');
			case Grommunio.core.mapi.BusyStatus.BLUR:
				return _('No Information');
		}
	}
});
