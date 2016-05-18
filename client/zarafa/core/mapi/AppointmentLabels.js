Ext.namespace('Zarafa.core.mapi');

/**
 * @class Zarafa.core.mapi.AppointmentLabels
 * @extends Zarafa.core.Enum
 * 
 * Enumerates the different appointment labels
 * 
 * @singleton
 */
Zarafa.core.mapi.AppointmentLabels = Zarafa.core.Enum.create({

	/**
	 * Default label for appointments
	 *
	 * @property
	 * @type Number
	 */
	NONE : 0,

	/**
	 * Mark appointment as important
	 *
	 * @property
	 * @type Number
	 */
	IMPORTANT : 1,

	/**
	 * Mark appointment as work
	 *
	 * @property
	 * @type Number
	 */
	WORK :  2,

	/**
	 * Mark appointment as personal
	 *
	 * @property
	 * @type Number
	 */
	PERSONAL :  3,

	/**
	 * Mark appointment as holiday
	 *
	 * @property
	 * @type Number
	 */
	HOLIDAY : 4,

	/**
	 * Mark appointment as required
	 *
	 * @property
	 * @type Number
	 */
	REQUIRED : 5,

	/**
	 * Mark appointment as travel required
	 *
	 * @property
	 * @type Number
	 */
	TRAVEL_REQUIRED : 6,

	/**
	 * Mark appointment as prepare required
	 *
	 * @property
	 * @type Number
	 */
	PREPARE_REQUIRED : 7,

	/**
	 * Mark appointment as birthday
	 *
	 * @property
	 * @type Number
	 */
	BIRTHDAY : 8,

	/**
	 * Mark appointment as special day
	 *
	 * @property
	 * @type Number
	 */
	SPECIAL_DATE : 9,

	/**
	 * Mark appointment as phone interview
	 *
	 * @property
	 * @type Number
	 */
	PHONE_INTERVIEW : 10,

	/**
	 * Return the display name for the given Appointment label
	 * @param {Zarafa.core.mapi.AppointmentLabels} label The given appointment label
	 * @return {String} The display name for the appointment label
	 */
	getDisplayName : function(label)
	{
		switch(label) {
			case Zarafa.core.mapi.AppointmentLabels.NONE:
				return _("None");
			case Zarafa.core.mapi.AppointmentLabels.IMPORTANT:
				return _("Important");
			case Zarafa.core.mapi.AppointmentLabels.WORK:
				return _("Work");
			case Zarafa.core.mapi.AppointmentLabels.PERSONAL:
				return _("Personal");
			case Zarafa.core.mapi.AppointmentLabels.HOLIDAY:
				return _("Holiday");
			case Zarafa.core.mapi.AppointmentLabels.REQUIRED:
				return _("Required");
			case Zarafa.core.mapi.AppointmentLabels.TRAVEL_REQUIRED:
				return _("Travel Required");
			case Zarafa.core.mapi.AppointmentLabels.PREPARE_REQUIRED:
				return _("Preparation Required");
			case Zarafa.core.mapi.AppointmentLabels.BIRTHDAY:
				return _("Birthday");
			case Zarafa.core.mapi.AppointmentLabels.SPECIAL_DATE:
				return _("Special Date");
			case Zarafa.core.mapi.AppointmentLabels.PHONE_INTERVIEW:
				return _("Phone Interview");
		}
	}
});
