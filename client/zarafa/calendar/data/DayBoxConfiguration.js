Ext.namespace('Zarafa.calendar.data');

/**
 * @class Zarafa.calendar.data.DayBoxConfiguration
 * @extends Object
 *
 * The configuration object for DayBoxes as used in the
 * {@link Zarafa.calendar.ui.AbstractCalendarBoxView CalendarBoxView}
 * for configuration of the individual DayBoxes.
 */
Zarafa.calendar.data.DayBoxConfiguration = Ext.extend(Object, {
	/**
	 * @constructor
	 * @param {Object} config Configrution object
	 */
	constructor : function(config)
	{
		Ext.apply(this, config);
	},

	/**
	 * The left offset for the DayBox from the left-side of the container
	 * in which this DayBox is being rendered.
	 * @property
	 * @type Number
	 */
	left : 0,

	/**
	 * The right offset for the DayBox from the right-side of the container
	 * in which this DayBox is being rendered.
	 * @property
	 * @type Number
	 */
	right : 0,

	/**
	 * The top offset for the DayBox from the top-side of the container
	 * in which this DayBox is being rendered.
	 * @property
	 * @type Number
	 */
	top : 0,

	/**
	 * The bottom offset for the DayBox from the bottom-side of the container
	 * in which this DayBox is being rendered.
	 * @property
	 * @type Number
	 */
	bottom : 0,

	/**
	 * The date which is being displayed within this DayBox.
	 * @property
	 * @type Date
	 */
	date : undefined,

	/**
	 * Indicates if {@link #date} is today.
	 * @property
	 * @type Boolean
	 */
	today : false,

	/**
	 * Indicates if the {@link #date} is a working day.
	 * @property
	 * @type Boolean
	 */
	workingDay : false,

	/**
	 * The {@link Zarafa.core.mapi.BusyStatus BusyStatus} which is active on this day.
	 * This value depends on the allday events which might be scheduled for this {@link #date}.
	 * @property
	 * @type Zarafa.core.mapi.BusyStatus
	 */
	busyStatus : undefined,

	/**
	 * True if there are more appointments then which can be rendered into this DayBox.
	 * @property
	 * @type Boolean
	 */
	overflow : false,

	/**
	 * True if this DayBox must be rendered as active. And non-active DayBox means that
	 * it is being rendered but the day which is represented by this box does not fall
	 * within the requested {@link Zarafa.core.DateRange daterange} for which the appointments
	 * have been requested.
	 *
	 * and the appointments for this day have been loaded. It can be
	 * false if this is a day whi
	 * @property
	 * @type Boolean
	 */
	active : false
});
