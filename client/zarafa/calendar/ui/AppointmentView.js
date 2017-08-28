Ext.namespace('Zarafa.calendar.ui');

/**
 * @class Zarafa.calendar.ui.AppointmentView
 * @extends Zarafa.calendar.ui.AbstractDateRangeView
 *
 * This view represents a {@link Zarafa.core.data.IPMRecord record} within the
 * {@link Zarafa.calendar.ui.AbstractCalendarView view}.
 */
Zarafa.calendar.ui.AppointmentView = Ext.extend(Zarafa.calendar.ui.AbstractDateRangeView, {
	/**
	 * @cfg {String} timeFormat The time format which must be applied to appointments
	 * when displaying the time period (see {@link Date.format format}).
	 */
	// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
	timeFormat : _('G:i'),

	/**
	 * @cfg {Boolean} stripVisible Enables the BusyStatus strip on the left side of
	 * the appointment. The &lt;div&gt; which is being rendered for this strip contains
	 * the styling to correctly mark the appointment with the given BusyStatus.
	 */
	stripVisible : true,

	/**
	 * @cfg {Number} stripWidth The width of the strip which contains the CSS styling for
	 * marking an appointment with a particular BusyStatus (free, tentative, out of office).
	 * This width is only applied when {@link #stripVisible} is true.
	 */
	stripWidth : 6,

	/**
	 * @cfg {Zarafa.core.data.IPMRecord} The record which is being displayed by this {@link Zarafa.core.ui.View view}.
	 */
	record : undefined,

	/**
	 * Indicates if the this appointment has been selected by the user. This can be
	 * set using {@link #setSelected} and requested using {@link #isSelected}.
	 * @property
	 * @type Boolean
	 */
	selected : false,

	/**
	 * Indicates if the folder in which this appointment lives has been selected by the
	 * user. This indicates that the entire folder (and thus this appointment) is active.
	 * This can be set using {@link #setActive} and requested using
	 * {@link #isActive}.
	 * @property
	 * @type Boolean
	 */
	active : false,

	/**
	 * The adjusted daterange object. This is an alternative to the {@link #dateRange} object.
	 * If the duration of an appointment is short, the height of the appointment view may less
	 * than the minimal height at which we can render appointment views comfortably.
	 * Therefore the 'adjusted date range' of an appointment is defined such that the duration
	 * of the appointment is always at least the parent calendar view's current {@link #zoomLevel}
	 * (which is defined as a time range, for instance 30 minutes).
	 * @property
	 * @type Zarafa.core.DateRange
	 */
	adjustedDateRange : undefined,

	/**
	 * The color scheme set by the {@link Zarafa.calendar.ui.AbstractCalendarView parent calendar View}.
	 * @property
	 * @type Object
	 */
	calendarColorScheme: undefined,

	/**
	 * The element which indicates that the selectionrange is currently focussed by the user.
	 * As long as this element is focussed, the focus on this selection is assumed.
	 * @property
	 * @type Ext.Element
	 */
	focusEl : undefined,

	/**
	 * Initialises the AppointmentView.
	 */
	init : function()
	{
		Zarafa.calendar.ui.AppointmentView.superclass.init.call(this);

		if (this.record) {
			this.updateDateRange(this.record);
		}
	},

	/**
	 * Renders the view.
	 * @param {Ext.Element} container The Ext.Element into which the view must be rendered.
	 */
	render : function(container)
	{
		Zarafa.calendar.ui.AppointmentView.superclass.render.apply(this, arguments);

		// Create the focusElement and relay the important events to this.
		this.create({
			tag : 'a',
			href : '#',
			// Disable tab-index, and position it somewhere where it cannot be seen
			// by the user. This will make the element completely invisible for the
			// user while we can benefit from the focus capabilities.
			tabindex : -1,
			style : 'position: absolute; left:-10000px; top:-10000px;'
		}, this.container, 'focusEl');
	},

	/**
	 * Focuses on the {@link #focusEl}.
	 */
	focus : function()
	{
		if(this.focusEl) {
			this.focusEl.focus();
		}
	},

	/**
	 * Updates the {@link #dateRange} and {@link #adjustedDateRange} objects attached to this
	 * {@link Zarafa.calendar.ui.AbstractDateRangeView view}.
	 * This must be called whenever the {@link #record} has been updated.
	 * @param {Zarafa.core.data.IPMRecord} record The record which must be used to update the {@link #dateRange}.
	 */
	updateDateRange : function(record)
	{
		var range = this.getDateRange();
		var adjustedRange = this.getAdjustedDateRange();
		var start = record.get('startdate');
		var end = record.get('duedate');
		var adjustment = 0;

		if (range) {
			range.set(start, end);
		} else {
			range = new Zarafa.core.DateRange({ startDate : start, dueDate : end });
			this.setDateRange(range);
		}

		adjustment = Math.max(range.getDuration(Date.MINUTE), this.parentView.getZoomLevel());
		end = start.add(Date.MINUTE, adjustment);

		if (adjustedRange) {
			adjustedRange.set(start, end);
		} else {
			adjustedRange = new Zarafa.core.DateRange({ startDate : start, dueDate : end });
			this.setAdjustedDateRange(adjustedRange);
		}
	},

	/**
	 * Sets {@link #adjustedDateRange}. This method does not auto-update.
	 * @param {Zarafa.core.DateRange} dateRange
	 */
	setAdjustedDateRange : function(dateRange)
	{
		this.adjustedDateRange = dateRange;
	},

	/**
	 * Returns the current {@link #adjustedDateRange}.
	 * @return {Zarafa.core.DateRange} dateRange
	 */
	getAdjustedDateRange : function()
	{
		return this.adjustedDateRange;
	},

	/**
	 * Sets whether the appointment is selected. When set to true the appointment will appear on screen with a thick
	 * black border around it. This method does not auto-update, so layout must be called explicitly after setting
	 * this value.
	 * @param {Boolean} selected true iff the appointment is selected.
	 */
	setSelected : function(selected)
	{
		this.selected = selected;
	},

	/**
	 * @return {Boolean} true iff the appointment is selected.
	 */
	isSelected : function()
	{
		return this.selected;
	},

	/**
	 * Sets whether the appointment is active. An active appointment means that the parent folder of the appointment is selected by
	 * the user.  When multiple folders are shown in a single calendar view, only one of them is selected at any given time.
	 * Appointments from that folder are rendered differently to show the distinction.
	 * @param {Boolean} parentFolderSelected true iff the appointment parent folder is selected.
	 */
	setActive : function(active)
	{
		this.active = active;
	},

	/**
	 * @return {Boolean} true iff the appointment is active (parent folder is selected).
	 */
	isActive : function()
	{
		return this.active;
	},

	/**
	 * Icon renderer. This will return an array of icon CSS names which must be rendered
	 * for this appointment. The icons which will be added if the appointment is recurring,
	 * if it it is an meeting request or if a reminder has been set.
	 * @return {Array} The array of strings containing the CSS names for the icons
	 * @private
	 */
	iconRenderer : function()
	{
		var record = this.getRecord();
		var icons = [];

		if (record.get('private') === true) {
			icons.push('private');
		}

		if (record.isRecurringOccurence() === true) {
			if (record.isRecurringException() === true) {
				icons.push('exception');
			} else {
				icons.push('recurring');
			}
		}

		return icons;
	},

	/**
	 * Body main text renderer. This will return the string which must be displayed most
	 * prominently in the appointment when it has been rendered in the main contents
	 * section of the calendar. This applies to non-all-day appointments.
	 * @return {String} The body-header text
	 * @private
	 */
	mainTextRenderer : function()
	{
		return Ext.util.Format.htmlEncode(this.record.get('subject'));
	},

	/**
	 * Body sub text renderer. This will return the string which must be displayed less
	 * prominently in the appointment when it has been rendered in the main contents
	 * section of the calendar. This applies to non-all-day appointments.
	 * @return {String} The body text
	 * @private
	 */
	subTextRenderer : function()
	{
		var location = this.record.get('location');
		if(!Ext.isEmpty(location)) {
			location = '(' + location + ')';
		}

		return Ext.util.Format.htmlEncode(location);
	},

	/**
	 * @return {String} returns the appointment ID.
	 */
	getId : function()
	{
		return this.record.id;
	},

	/**
	 * @return {Ext.data.Record} the appointment record this view presents.
	 */
	getRecord : function()
	{
		return this.record;
	},

	/**
	 * Gets the busy status of the appointment. Is a value from the {@link Zarafa.core.mapi.BusyStatus BusyStatus}
	 * enumeration to indicate the status as free, tentative, busy, and out of office respectively.
	 * @return {Zarafa.core.mapi.BusyStatus} the busy status of the appointment.
	 */
	getBusyStatus : function()
	{
		return this.record.get('busystatus');
	},

	/**
	 * Gets the busy status name of the appointment. This is a lowercase string, which
	 * indicates the status of the appointment as 'free', 'tentative', 'busy' and 'outofoffice'.
	 * @return {String} The lowercase string of the busystatus
	 *
	 */
	getBusyStatusName : function()
	{
		return Zarafa.core.mapi.BusyStatus.getName(this.getBusyStatus()).toLowerCase();
	},

	/**
	 * Gets the label of the appointment.
	 * @return {String} the label of the appointment.
	 */
	getLabel : function()
	{
		return this.record.get('label');
	},

	/**
	 * Indicates if this appointment is an all-day event
	 * @return {Boolean} True if this is an allday event
	 */
	isAllDay : function()
	{
		return this.getDateRange().isAllDay();
	},

	/**
	 * Obtain the stripWidth (See {@link #stripWidth}). The width depends on the
	 * {@link #stripVisible} and {@link #stripWidth} values.
	 * @return {Number} The width of the strip
	 */
	getStripWidth : function()
	{
		return (this.stripVisible) ? this.stripWidth : 0;
	},

	/**
	 * Return the color based on the activity and the categories of the appointment. When the
	 * appointment belongs to a non-active calendar, it will return the color scheme of the
	 * calendar. This color scheme is set in the {@link #calendarColorScheme calendarColorScheme}
	 * property. When the appointment belongs to an active calendar it will return the color of
	 * the last added category. In the case that the appointment has no label the color scheme
	 * of the calendar view it belongs to is used.
	 * @return {Object} The color scheme object
	 */
	getAppointmentColor: function()
	{
		var categories = Zarafa.common.categories.Util.getCategories(this.record);

		// If no category is set then default back to the color scheme of the calendar
		// Note: If a label has been set, then it will have been added as the last
		// category by the getCategories method
		if ( this.isActive() &&  !Ext.isEmpty(categories) ){
			return Zarafa.common.categories.Util.getCategoryColor(categories.pop());
		}

		return this.calendarColorScheme.base;
	}
});
