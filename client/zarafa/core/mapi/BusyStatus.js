Ext.namespace('Zarafa.core.mapi');

/**
 * @class Zarafa.core.mapi.BusyStatus
 * @extends Zarafa.core.Enum
 * 
 * Enumerates the different busy status types. 
 * 
 * @singleton
 */
Zarafa.core.mapi.BusyStatus = Zarafa.core.Enum.create({
	/**
	 * Denotes that the owner/participants don't have freebusy information for the
	 * given time.
	 * @property
	 * @type Number
	 */
	UNKNOWN : -1,

	/**
	 * Denotes that the owner/participants is/are free for the duration of the appointment.  
	 * @property
	 * @type Number
	 */
	FREE : 0,
	
	/**
	 * Denotes that the appointment has been tentatively accepted.  
	 * @property
	 * @type Number
	 */
	TENTATIVE : 1,
	
	/**
	 * Denotes that the owner/participants is/are busy for the duration of the appointment.  
	 * @property
	 * @type Number
	 */
	BUSY : 2,

	/**
	 * Denotes that the owner/participants is/are out of office for the duration of the appointment.  
	 * @property
	 * @type Number
	 */
	OUTOFOFFICE : 3,

	/**
	 * Return the display name for the given busy status
	 * @param {Zarafa.core.mapi.BusyStatus} busystatus The given busy Status
	 * @return {String} The display name for the busy status
	 */
	getDisplayName : function(busystatus)
	{
		switch (busystatus) {
			case Zarafa.core.mapi.BusyStatus.UNKNOWN:
				return _('Unknown');
			case Zarafa.core.mapi.BusyStatus.FREE:
				return _('Free');
			case Zarafa.core.mapi.BusyStatus.TENTATIVE:
				return _('Tentative');
			case Zarafa.core.mapi.BusyStatus.BUSY:
				return _('Busy');
			case Zarafa.core.mapi.BusyStatus.OUTOFOFFICE:
				return _('Out of Office');
		}
	}
});
