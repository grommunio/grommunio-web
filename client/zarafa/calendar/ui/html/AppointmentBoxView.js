Ext.namespace('Zarafa.calendar.ui.html');

/**
 * @class Zarafa.calendar.ui.html.AppointmentBoxView
 * @extends Zarafa.calendar.ui.AppointmentView
 *
 * Appointment view used in {@link Zarafa.calendar.ui.AbstractCalendarBoxView CalendarBoxView}. It represents each appointment as one
 * or more horizontal rectangles on one or more week rows.
 * <p>
 * The view tries to minimise the number of required HTML elements by using background images to represent the busy status
 * strips on the left side of appointments. The background of each view is implemented using a scaled IMG tag.
 */
Zarafa.calendar.ui.html.AppointmentBoxView = Ext.extend(Zarafa.calendar.ui.AppointmentView, {
	/**
	 * Array of objects containing the {@link Zarafa.calendar.data.AppointmentBounds bounds} for the
	 * {@link #body} elements which are part of the appointment. This field is initialized in
	 * {@link #layoutInBody} using the function
	 * {@link Zarafa.calendar.ui.AbstractCalendarBoxView#dateRangeToBodyBounds dateRangeToBodyBounds}.
	 * @property
	 * @type Array
	 */
	bounds : undefined,

	/**
	 * The main text which will be rendered into the body of the appointment. This field
	 * is initialized using the {@link #mainTextRenderer}.
	 * @property
	 * @type String
	 */
	mainRenderedText : '',

	/**
	 * The subtext which will be rendered alongside the {@link #mainRenderedText}. This field
	 * is initialized using the {@link #subTextRenderer}.
	 * @property
	 * @type String
	 */
	subRenderedText : '',

	/**
	 * This will mark the appointment as selected or unselected.
	 * @param {Boolean} selected True if the appointment should be marked as selected.
	 * @override
	 */
	setSelected : function(selected)
	{
		Zarafa.calendar.ui.html.AppointmentBoxView.superclass.setSelected.call(this, selected);

		if ( Ext.isEmpty(this.appointmentBoxes) ) {
			// Should not happen, but better safe than sorry
			return;
		}

		if (selected) {
			this.appointmentBoxes.forEach(function(appointmentBox) {
				appointmentBox.addClass('k-selected');
			});

			// when selecting appointment set focus also so key shortcuts work properly
			this.focus();
		} else {
			this.appointmentBoxes.forEach(function(appointmentBox) {
				appointmentBox.removeClass('k-selected');
			});
		}
	},

	/**
	 * Tests whether a mouse event is over the body start (left) resize handle.
	 * @param {Ext.EventObject} event event object.
	 * @return {Boolean} true iff the event is over the resize handle.
	 * @override
	 */
	eventOverBodyStartHandle : function(event)
	{
		return Zarafa.calendar.ui.html.AppointmentDaysView.prototype.eventOverStartHandle.call(this, event);
	},

	/**
	 * Tests whether a mouse event is over the body due (right) resize handle.
	 * @param {Ext.EventObject} event event object.
	 * @return {Boolean} true iff the event is over the resize handle.
	 * @override
	 */
	eventOverBodyDueHandle : function(event)
	{
		return Zarafa.calendar.ui.html.AppointmentDaysView.prototype.eventOverDueHandle.call(this, event);
	},

	/**
	 * Tests whether a mouse event is over the appointment when laid out in the calendar body.
	 * @param {Ext.EventObject} event event object.
	 * @return {Boolean} true if the event is over the appointment.
	 * @override
	 */
	eventOverBody : function(event)
	{
		return Zarafa.calendar.ui.html.AppointmentDaysView.prototype.eventOverAppointment.call(this, event);
	},

	/**
	 * Lays out the header elements of the view.
	 * NOTE: this function does nothing as the boxView does not render
	 * any headers for an appointment.
	 * @override
	 * @private
	 */
	layoutInHeader : Ext.emptyFn,

	/**
	 * Creates elements to represent the range when shown in the header.
	 * NOTE: this function does nothing as the boxView does not render
	 * any headers for an appointment.
	 * @private
	 * @override
	 */
	createHeader : Ext.emptyFn,

	/**
	 * Destroys the header elements.
	 * NOTE: this function does nothing as the boxView does not render
	 * any headers for an appointment.
	 * @private
	 * @override
	 */
	destroyHeader : Ext.emptyFn,

	/**
	 * Lays out the body of the view. This will generate the Body bounts using the
	 * function {@link Zarafa.calendar.ui.AbstractCalendarBoxView.dateRangeToBodyBounds dateRangeToBodyBounds},
	 * the bounds will be used for laying out the body elements using {@link #layoutBodyElements}.
	 * @private
	 * @override
	 */
	layoutInBody : function()
	{
		// get an array of bounds (left, right, top, bottom) objects to represent the range on the calendar body
		this.bounds = this.parentView.dateRangeToBodyBounds(this.getDateRange(), this.slot);

		// Draw the body elements to match the bounds
		if (!Ext.isEmpty(this.bounds)) {
			Zarafa.calendar.ui.html.AppointmentDaysView.prototype.layoutAppointment.call(this, this.bounds, this.parentView.bodyAppointmentLayer, true);
		}
	},

	/**
	 * Body start time text renderer. This will return the start time in string which
	 * must be displayed most prominently in the appointment when it has been rendered in the main contents
	 * section of the calendar. This applies to non-all-day appointments and while calender was
	 * {@link Zarafa.calendar.data.DataModes#MONTH month view} mode.
	 * @return {String} The start time text of appointment.
	 * @private
	 */
	startTimeTextRenderer : function()
	{
		return Ext.util.Format.htmlEncode(this.record.get('startdate').format(this.timeFormat));
	},

	/**
	 * Body end time text renderer. This will return the start time in string which
	 * must be displayed most prominently in the appointment when it has been rendered in the main contents
	 * section of the calendar. This applies to non-all-day appointments and while calender was
	 * {@link Zarafa.calendar.data.DataModes#MONTH month view} mode.
	 * @return {String} The end time text of appointment.
	 * @private
	 */
	endTimeTextRenderer : function()
	{
		return Ext.util.Format.htmlEncode(this.record.get('duedate').format(this.timeFormat));
	}
});
