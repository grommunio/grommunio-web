Ext.namespace('Zarafa.calendar.data');

/**
 * @class Zarafa.calendar.data.AppointmentBounds
 * @extends Object
 *
 * The configuration object for appointments as used in the
 * {@link Zarafa.calendar.ui.AbstractDateRangeView DateRangeView}
 * for configuration of the individual bodies or the header
 * of an appointment.
 */
Zarafa.calendar.data.AppointmentBounds = Ext.extend(Object, {
	/**
	 * @constructor
	 * @param {Object} config Configrution object
	 */
	constructor : function(config)
	{
		Ext.apply(this, config);
	},

	/**
	 * The left offset for the element from the left-side of the container
	 * in which this element is being rendered.
	 * @property
	 * @type Number
	 */
	left : 0,

	/**
	 * The right offset for the element from the right-side of the container
	 * in which this element is being rendered.
	 * @property
	 * @type Number
	 */
	right : 0,

	/**
	 * The top offset for the element from the top-side of the container
	 * in which this element is being rendered.
	 * @property
	 * @type Number
	 */
	top : 0,

	/**
	 * The bottom offset for the element from the bottom-side of the container
	 * in which this element is being rendered.
	 * @property
	 * @type Number
	 */
	bottom : 0,

	/**
	 * This indicates if this is the first {@link Zarafa.calendar.data.AppointmentBounds bound}
	 * for an {@link Zarafa.calendar.ui.AppointmentView appointment}. This implies that _if_ this
	 * is true, it will be the first element of an array, but at the same time it does not
	 * guarentee that a bound is present in the array with the {@link #firstBox} is present.
	 * This could occur when an appointment overlaps the start of the current view (in other words,
	 * the start date of the appointment is _before_ the first visible day in our view).
	 * @property
	 * @type Boolean
	 */
	firstBox : false,

	/**
	 * This indicates if this is the last {@link Zarafa.calendar.data.AppointmentBounds bound}
	 * for an {@link Zarafa.calendar.ui.AppointmentView appointment}. This implies that _if_ this
	 * is true, it will be the last element of an array, but at the same time it does not
	 * guarentee that a bound is present in the array with the {@link #lastBox} is present.
	 * This could occur when an appointment overlaps the end of the current view (in other words,
	 * the due date of the appointment is _after_ the last visible day in our view).
	 * @property
	 * @type Boolean
	 */
	lastBox : false
});
