Ext.namespace('Zarafa.calendar.ui.html');

/**
 * @class Zarafa.calendar.ui.html.AppointmentDaysView
 * @extends Zarafa.calendar.ui.AppointmentView
 *
 * This view represents a {@link Zarafa.core.data.IPMRecord record} within the
 * {@link Zarafa.calendar.ui.AbstractCalendarView view}.
 */
Zarafa.calendar.ui.html.AppointmentDaysView = Ext.extend(Zarafa.calendar.ui.AppointmentView, {

	/**
	 * The opacity used to blur the appointment to the background when it is not part of the active
	 * Calendar. It is set in a value between 0 and 1.
	 * @property
	 * @type Number
	 */
	opacityNonActiveAppointment: 0.4,

	/**
	 * The {@link Ext.Element elements} (boxes) that make up the appointment.
	 */
	appointmentBoxes: [],

	/**
	 * Renders the appointment in its parent view.
	 *
	 * @param {Array} bounds The outer dimensions of the appointment. Can be multiple boxes if spanning multiple days.
	 * @param {Ext.Element} layer The layer in which to render the appointment. Can be the headerAppointmentLayer or
	 * the bodyAppointmentLayer of the parent view.
	 * @param {Boolean} showStartTime True to render the start time of the appointment
	 */
	layoutAppointment: function(bounds, layer, showStartTime) {
		if ( this.appointmentBoxes && this.appointmentBoxes.length ) {
			// We have already layed out the appointment. Let's remove it
			// before we lay out the updated appointment
			this.appointmentBoxes.forEach(function(box) {
				box.remove();
			});
		}

		var color = this.getAppointmentColor();
		// Check if we have a light or dark appointment color
		var isDarkColor = Zarafa.core.ColorSchemes.isDark(color);
		var colorClass = this.isActive() && isDarkColor ? ' k-dark' : ' k-light';
		var activeClass = this.isActive() ? '' : ' k-inactive';
		var stripWidth = this.getStripWidth();
		var titleText = this.mainTextRenderer() + ' '+ this.subTextRenderer();
		var icons = this.iconRenderer();
		var iconsHtml = '';
		icons.forEach(function(icon) {
			var iconClass = this.isActive() && isDarkColor  ? 'icon_'+icon+'_white' : 'icon_'+icon;
			iconsHtml += '<div class="k-icon ' + iconClass + '"></div>';
		}, this);
		if ( iconsHtml ) {
			iconsHtml = '<div class="k-icons">' + iconsHtml + '</div>';
		}

		var busyStatus = this.getBusyStatus();
		switch ( busyStatus ) {
			case Zarafa.core.mapi.BusyStatus.FREE:
				var busyClass = ' k-status-free';
				break;
			case Zarafa.core.mapi.BusyStatus.TENTATIVE:
				busyClass = ' k-status-tentative';
				break;
			case Zarafa.core.mapi.BusyStatus.OUTOFOFFICE:
				busyClass = ' k-status-outofoffice';
				break;
			default :
				busyClass = ' k-status-busy';
				break;
		}

		// Appointments can consist of multiple bounds when spanning multiple days.
		// We'll loop over the bounds to draw all boxes.
		this.appointmentBoxes = [];
		bounds.forEach(function(bound, index) {
			var width = bound.right - bound.left;
			var height = bound.bottom - bound.top;
			var orderClass = '';
			var resizeHandleStart = '';
			var resizeHandleEnd = '';
			if ( index === 0 ) {
				orderClass += ' k-first';
				resizeHandleStart = '<div class="k-resizehandle k-resizehandle-start"></div>';

				if ( showStartTime === true && !this.isAllDay() ) {
					var startTimeText = Ext.util.Format.htmlDecode(this.startTimeTextRenderer());
					//drawTextObject.endTimeText = Ext.util.Format.htmlDecode(this.endTimeTextRenderer());
					titleText = startTimeText + ' ' + titleText;
				}
			}
			if ( index === bounds.length - 1 ) {
				orderClass += ' k-last';
				resizeHandleEnd = '<div class="k-resizehandle k-resizehandle-end"></div>';
			}
			var appointmentBox = layer.createChild({
				cls: 'k-appointment-box' + colorClass + activeClass + orderClass,
				html: resizeHandleStart + resizeHandleEnd + '<div class="k-status'  + busyClass + '" style="width:' + stripWidth + 'px; border-color:' + color + ';"></div>' +
						iconsHtml + '<span class="k-title">' + titleText + '</span>',
				style: 'background-color:' + color + ';' +
						'left:' + (bound.left + 0) + 'px;' +
						'top:' + bound.top + 'px;' +
						'width:' + (width - 2) + 'px;' +
						'height:' + height + 'px;'
			});

			// Relay some events to the parent view
			appointmentBox.on('mouseover', function(event) {
				this.parentView.fireEvent('appointmentmouseover', this.parentView, this.getRecord(), event);
			}, this);
			appointmentBox.on('mouseout', function(event) {
				this.parentView.fireEvent('appointmentmouseout', this.parentView, this.getRecord(), event);
			}, this);
			appointmentBox.on('dblclick', function(event) {
				this.parentView.fireEvent('dblclick', this.parentView, event, this.getRecord());
			}, this);
			appointmentBox.on('contextmenu', function(event) {
				var xy = event.getXY();
				var range = this.parentView.screenLocationToDateRange(xy[0], xy[1]);

				// Fire the calendar's context menu event.
				this.parentView.fireEvent('contextmenu', this, event, this.getRecord(), range);
			}, this);

			this.appointmentBoxes.push(appointmentBox);
		}, this);

		// Make sure we draw the selection outline when the appointment was selected
		if ( this.selected ) {
			this.setSelected(true);
		}
	},

	/**
	 * Lays out the header elements of the view.
	 * @private
	 * @override
	 */
	layoutInHeader: function() {
		// Get the bounds of the header from the parent calendar.
		this.bounds = [this.parentView.dateRangeToHeaderBounds(this.getDateRange(), this.slot, 1, true)];

		this.layoutAppointment(this.bounds, this.parentView.getHeaderAppointmentLayer());
	},

	/**
	 * Renders appointments in the body of the calendar
	 * @private
	 * @override
	 */
	layoutInBody: function() {
		this.bounds = this.parentView.dateRangeToBodyBounds(
			this.getAdjustedDateRange(),
			this.slot,
			this.slotCount,
			false
		);

		var bodyAppointmentLayer = this.parentView.getBodyAppointmentLayer();

		return this.layoutAppointment(this.bounds, bodyAppointmentLayer);
	},

	/**
	 * This will mark the appointment as selected, and will draw the
	 * Selection Outline around the appointment.
	 * @param {Boolean} selected True if the appointment should be marked as selected.
	 * @override
	 */
	setSelected: function(selected)
	{
		Zarafa.calendar.ui.html.AppointmentDaysView.superclass.setSelected.call(this, selected);

		this.appointmentBoxes.forEach(function(appointmentBox) {
			if ( selected ) {
				appointmentBox.addClass('k-selected');

				// when selecting appointment set focus also so key shortcuts work properly
				this.focus();
			} else {
				appointmentBox.removeClass('k-selected');
			}
		}, this);
	},

	/**
	 * Tests whether a mouse event is over the apointment.
	 *
	 * @param {Ext.EventObject} event event object.
	 * @return {Boolean} true if the event is over the appointment.
	 */
	eventOverAppointment: function(event) {
		if ( !event.target ) {
			return false;
		}

		var el = Ext.fly(event.target).findParent('.k-appointment-box');
		if ( !el ) {
			return false;
		}

		if ( Ext.isEmpty(this.appointmentBoxes) ) {
			// This appointment is not visible
			// (in month view, appointments that don't fit in the day anymore
			// will not be renderered)
			return false;
		}

		return this.appointmentBoxes.some(function(appointmentBox){
			return appointmentBox.dom === el;
		});
	},

	/**
	 * Tests whether a mouse event is over an apointment in the header of the calendar.
	 *
	 * @param {Ext.EventObject} event event object.
	 * @return {Boolean} true if the event is over the appointment.
	 * @override
	 */
	eventOverHeader: function(event)
	{
		return this.eventOverAppointment(event);
	},

	/**
	 * Tests whether a mouse event is over an apointment in the body of the calendar.
	 *
	 * @param {Ext.EventObject} event event object.
	 * @return {Boolean} true if the event is over the appointment.
	 * @override
	 */
	eventOverBody: function(event) {
		return this.eventOverAppointment(event);
	},

	/**
	 * Tests whether a mouse event is over the "start resize" handle.
	 *
	 * @param {Ext.EventObject} event event object.
	 * @return {Boolean} true if the event is over the resize handle.
	 */
	eventOverStartHandle: function(event)
	{
		return this.appointmentBoxes[0].down('.k-resizehandle-start', true) === event.target;
	},

	/**
	 * Tests whether a mouse event is over the "due resize" handle.
	 *
	 * @param {Ext.EventObject} event event object.
	 * @return {Boolean} true if the event is over the resize handle.
	 */
	eventOverDueHandle: function(event) {
		return this.appointmentBoxes[this.appointmentBoxes.length - 1].down('.k-resizehandle-end', true) === event.target;
	},

	/**
	 * Tests whether a mouse event is over the header start (left) resize handle.
	 *
	 * @param {Ext.EventObject} event event object.
	 * @return {Boolean} true iff the event is over the resize handle.
	 * @override
	 */
	eventOverHeaderStartHandle: function(event)
	{
		return this.eventOverStartHandle(event);
	},

	/**
	 * Tests whether a mouse event is over the header due (right) resize handle.
	 *
	 * @param {Ext.EventObject} event event object.
	 * @return {Boolean} true iff the event is over the resize handle.
	 * @override
	 */
	eventOverHeaderDueHandle: function(event)
	{
		return this.eventOverDueHandle(event);
	},

	/**
	 * Returns true when the event is over the 'resize start handle' of the appointment.
	 * False otherwise
	 *
	 * TODO(ronald): This should be handled by this component itself.
	 *
	 * @param {EveExt.EventObjectnt} event
	 * @return {Boolean}
	 */
	eventOverBodyStartHandle: function(event) {
		return this.eventOverStartHandle(event);
	},

	/**
	 * Returns true when the event is over the 'resize start handle' of the appointment.
	 * False otherwise
	 *
	 * TODO(Ronald): This should be handled by this component itself.
	 *
	 * @param {EveExt.EventObjectnt} event
	 * @return {Boolean}
	 */
	eventOverBodyDueHandle: function(event) {
		return this.eventOverDueHandle(event);
	}
});
