Ext.namespace('Zarafa.calendar.ui.canvas');

/**
 * @class Zarafa.calendar.ui.canvas.CalendarDaysView
 * @extends Zarafa.calendar.ui.AbstractCalendarDaysView
 *
 * Canvas based implementation of {@link Zarafa.calendar.ui.AbstractCalendarDaysView AbstractCalendarDaysView}.
 * This implementation creates canvas DOM elements for the parent view's header and body. These canvas elements
 * are then used by child appointment views to render to. The Calendar body consist of all normal appointments,
 * while the header will display the allday appointments.
 *
 * The canvas rendering is build in 3 layers. This means that for drawing the header, 3 canvas elements will
 * be used, the same as with the body. In total this means 6 canvas elements are rendered for the calendar.
 *
 * Using layering we can optimize the rendering of the calendar. Whenever an appoint changes, we are not
 * interested in redrawing the complete calendar and all appointments in it (This would become a performance
 * issue for calendars with many appointments). So with 3 layers we can create the following setup:
 *
 *  - Layer 1 : The calendar
 *    This contains the calendar background. For the header this means the background color, and the
 *    name of the date which is being displayed in the color (optionally additional markup is applied
 *    in case the rendered date is 'today'). For the body this means that all timestrips are rendered
 *    into the calendar (using the correct theme color).
 *  - Layer 2 : The appointments
 *    This contains all the appointments which are available in the calendar. None of the appointments
 *    are allowed to overlap with another appointment (The time can obviously overlap, but in that case
 *    the appointments are placed side-by-side inside the same column). Whenever a single appointment
 *    changes, we only have to redraw that single appointment (since it doesn't overlap with any other
 *    appointment, we can be sure that redrawing the appointment will not affect other appointments).
 *  - Layer 3 : The selections
 *    The most volatile layer which displays appointment outlines (black borders) and dragHandles
 *    (small boxes on the edges), which are positioned exactly on top of an appointment on Layer 2.
 *    Whenever the selection changes, we only require that Layer 3 is cleared an redrawn (or when a
 *    appointment is selected, but no other appointment is deselected, then only the outline will have
 *    to be drawn.
 */
Zarafa.calendar.ui.canvas.CalendarDaysView = Ext.extend(Zarafa.calendar.ui.AbstractCalendarDaysView, {
	/**
	 * The &lt;canvas&gt; element for the top-row in the calendar which contains the
	 * dayname for each individual column, as well as the display for all all-day appointments.
	 * This element is 'layer 1' for the header, containing only the background.
	 * @property
	 * @type Ext.Element
	 */
	headerBackgroundCanvas : undefined,

	/**
	 * The &lt;canvas&gt; element for the top-row in the calendar which contains the
	 * dayname for each individual column, as well as the display for all all-day appointments.
	 * This element is 'layer 2' for the header, containing only the appointments.
	 * @property
	 * @type Ext.Element
	 */
	headerAppointmentCanvas : undefined,

	/**
	 * The &lt;canvas&gt; element for the top-row in the calendar which contains the
	 * dayname for each individual column, as well as the display for all all-day appointments.
	 * This element is 'layer 3' for the header, containing only the selections.
	 * @property
	 * @type Ext.Element
	 */
	headerSelectionCanvas : undefined,

	/**
	 * The &lt;canvas&gt; element for the body in the calendar which contains the
	 * timestrips and the appointments.
	 * This element is 'layer 1' for the body, containing only the background.
	 * @property
	 * @type Ext.Element
	 */
	bodyBackgroundCanvas : undefined,

	/**
	 * The &lt;canvas&gt; element for the body in the calendar which contains the
	 * timestrips and the appointments.
	 * This element is 'layer 2' for the body, containing only the appointments.
	 * @property
	 * @type Ext.Element
	 */
	bodyAppointmentCanvas : undefined,

	/**
	 * The &lt;canvas&gt; element for the body in the calendar which contains the
	 * timestrips and the appointments.
	 * This element is 'layer 3' for the body, containing only the selections.
	 * @property
	 * @type Ext.Element
	 */
	bodySelectionCanvas : undefined,

	/**
	 * The Appointment over which the cursor is currently hovering.
	 * @property
	 * @type Zarafa.calendar.ui.canvas.AppointmentDaysView
	 */
	appointmentOver : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			baseCls : 'zarafa-calendar',
			enableDD : true,
			ddGroup : 'dd.mapiitem'
		});

		Zarafa.calendar.ui.canvas.CalendarDaysView.superclass.constructor.call(this, config);
	},

	/**
	 * Renders the view. Generates the body and header layers.
	 * @param {Ext.Element} container The Ext.Element into which the view must be rendered.
	 * @private
	 * @override
	 */
	render : function(container)
	{
		// Parent render.
		Zarafa.calendar.ui.canvas.CalendarDaysView.superclass.render.call(this, container);
		
		this.create('canvas', this.header, 'headerBackgroundCanvas', 'zarafa-canvas zarafa-canvas-layer-1 zarafa-canvas-header-background');
		this.create('div', this.headerBackgroundCanvas, 'headerBackgroundCanvasStylingElement', 'zarafa-styling-element');
		this.create('div', this.headerBackgroundCanvas, 'headerBackgroundCanvasStylingElementActive', 'zarafa-styling-element-active');
		this.create('canvas', this.header, 'headerAppointmentCanvas', 'zarafa-canvas zarafa-canvas-layer-2 zarafa-canvas-header-appointment');
		this.create('canvas', this.header, 'headerSelectionCanvas', 'zarafa-canvas zarafa-canvas-layer-3 zarafa-canvas-header-selection');

		this.create('canvas', this.body, 'bodyBackgroundCanvas', 'zarafa-canvas zarafa-canvas-layer-1 zarafa-canvas-body-background');
		this.create('canvas', this.body, 'bodyAppointmentCanvas', 'zarafa-canvas zarafa-canvas-layer-2 zarafa-canvas-body-appointment');
		this.create('canvas', this.body, 'bodySelectionCanvas', 'zarafa-canvas zarafa-canvas-layer-3 zarafa-canvas-body-selection');

		// Hook mouse events to the canvas objects.
		this.mon(this.getHeaderActionCanvas(), {
			'mousemove': this.onHeaderMove,
			'mouseout': this.onHeaderOut,
			'dblclick': this.onHeaderDblClick,
			'contextmenu': this.onHeaderContextMenu,
			'click': this.onHeaderClick,
			scope: this
		});

		this.mon(this.getBodyActionCanvas(), {
			'mousemove': this.onBodyMove,
			'mouseout': this.onBodyOut,
			'dblclick': this.onBodyDblClick,
			'contextmenu': this.onBodyContextMenu,
			scope: this
		});
	},

	/**
	 * Create a new {@link Zarafa.calendar.ui.AppointmentView Appointment} object
	 * for the given {@link Zarafa.core.data.IPMRecord record}.
	 * @param {Zarafa.core.data.IPMRecord} record The record for which the AppointmentView
	 * must be created.
	 * @private
	 */
	createAppointment : function(record)
	{
		return new Zarafa.calendar.ui.canvas.AppointmentDaysView({
			parentView: this,
			record : record,
			calendarColorScheme : this.calendarColorScheme
		});
	},

	/**
	 * Removes a child view from this view.
	 * @param {Zarafa.core.ui.View} child child view to be added
	 * @param {Boolean} destroy if true, destroy the child view
	 * @override
	 */
	removeChildView : function(child, destroy)
	{
		// If the childview was the appointment we are hovering over,
		// we need to reset the appointmentOver property.
		if (this.appointmentOver && this.appointmentOver === child) {
			this.fireEvent('appointmentmouseout', this, this.appointmentOver.getRecord());
			this.appointmentOver = false;
		}

		return Zarafa.calendar.ui.canvas.CalendarDaysView.superclass.removeChildView.apply(this, arguments);
	},

	/**
	 * Create an Appointment Proxy object which can represent the selected text
	 * Must be implemented by the subclasses.
	 * @return Zarafa.calendar.ui.AbstractDateRangeView
	 * @protected
	 */
	createAppointmentProxy : function()
	{
		return new Zarafa.calendar.ui.canvas.AppointmentProxy({ showTime : true });
	},

	/**
	 * Returns the canvas element on which all user-interactions for the body take place.
	 * This is the element on which event handlers are being attached.
	 * @return {Ext.Element} The calendar body element.
	 */
	getBodyActionCanvas : function()
	{
		return this.bodySelectionCanvas;
	},

	/**
	 * Returns the canvas element which must be used to draw Appointments for the body ({@link #bodyAppointmentCanvas Layer2}).
	 * @return {Ext.Element} The calendar body element
	 */
	getBodyAppointmentCanvas : function()
	{
		return this.bodyAppointmentCanvas;
	},

	/**
	 * Returns the canvas element which must be used to draw Appointment Selections for the body ({@link #bodySelectionCanvas Layer3}).
	 * @return {Ext.Element} The calendar body element
	 */
	getBodySelectionCanvas : function()
	{
		return this.bodySelectionCanvas;
	},

	/**
	 * Returns the canvas element on which all user-interactions for the header take place.
	 * This is the element on which event handlers are being attached.
	 * @return {Ext.Element} The calendar header element.
	 */
	getHeaderActionCanvas : function()
	{
		return this.headerSelectionCanvas;
	},

	/**
	 * Returns the canvas element which must be used to draw Appointments for the header ({@link #headerAppointmentCanvas Layer2}).
	 * @return {Ext.Element} The calendar header element
	 */
	getHeaderAppointmentCanvas : function()
	{
		return this.headerAppointmentCanvas;
	},

	/**
	 * Returns the canvas element which must be used to draw Appointment Selections for the header ({@link #headerSelectionCanvas Layer3}).
	 * @return {Ext.Element} The calendar header element
	 */
	getHeaderSelectionCanvas : function()
	{
		return this.headerSelectionCanvas;
	},

	/**
	 * Sets the text on the headers for each day. The header title is generated using the {@link #getDayHeaderTitle} function.
	 * @param {Array} dayPositions The array of {@link Zarafa.calendar.data.DayLayoutPosition LayoutPositions} for the various days.
	 * @private
	 */
	drawHeader : function(dayPositions)
	{
		var todayPosition;
		var width = this.header.getWidth();
		var height = this.header.getHeight();

		// First resize the canvas elements for the header, this will effectively clear
		// all the contents and make them available for drawing the new contents into it.
		Zarafa.resizeCanvas(this.headerBackgroundCanvas, width, height);
		Zarafa.resizeCanvas(this.headerAppointmentCanvas, width, height);
		Zarafa.resizeCanvas(this.headerSelectionCanvas, width, height);

		// Draw the calendar onto the background.
		var context = this.headerBackgroundCanvas.dom.getContext("2d");
		context.save();

		// draw background in one color
		context.fillStyle = this.calendarColorScheme.header;
		context.fillRect(0, 0, width, height);

		for (var i = 0, len = dayPositions.length; i < len; i++) {
			var pos = dayPositions[i];
			if (pos.today) {
				todayPosition = pos;
			}
		}

		var textHeight = this.parentView.headerTextHeight;
		if (Ext.isDefined(todayPosition)) {
			var left = todayPosition.left;
			var right = todayPosition.right;

			context.fillStyle = this.headerBackgroundCanvasStylingElementActive.getStyle('background-color');
			context.fillRect(left, 0, right - left - 1, textHeight);

			context.strokeStyle = this.headerBackgroundCanvasStylingElementActive.getStyle('background-color');
			context.strokeRect(left + 0.5, 0.5, right - left - 1, height);
		}

		// Let's get some styling from the css styling of the canvas
		context.fillStyle = this.headerBackgroundCanvasStylingElement.getStyle('color');
		context.setFont(this.headerBackgroundCanvasStylingElement.getStyle('font'));
		
		for (var i = 0, len = dayPositions.length; i < len; i++) {
			var pos = dayPositions[i];
			var dayWidth = pos.right - pos.left;
			var headerText = this.getDayHeaderTitle(pos.date, dayWidth);
			var headerTextLength = context.textWidth(headerText);

			// Truncate header text if column width is less than the width of header text
			var diff = headerTextLength - dayWidth - this.headerBackgroundCanvasStylingElement.getPadding('lr');
			if (diff > 0) {
				// Here diff will be divided by font size, to obtain average width which is required to
				// approximately count the number of characters to truncate. And additional 2 is there
				// to truncate two more characters to leave some space on both the side of header text.
				headerText = Ext.util.Format.substr(headerText, 0, headerText.length - (diff/context.getFontSize() + 2));
				headerTextLength = context.textWidth(headerText);
			}
			
			if ( pos.today ) {
				context.save();
				context.fillStyle = this.headerBackgroundCanvasStylingElementActive.getStyle('color');
				context.setFont(this.headerBackgroundCanvasStylingElementActive.getStyle('font'));
			}

			// draw the text from the left of the column using the padding provided by the css
			context.drawText(headerText, pos.left + this.headerBackgroundCanvasStylingElement.getPadding('l'), (textHeight+context.getFontSize())/2 - 2);

			if ( pos.today ) {
				context.restore();
			}
		}

		context.restore();
	},

	/**
	 * Draws the calendar body. The body consists of dayStrips which indicate the borders
	 * between the different strips, the workingHours, and the horizontal lines indicating
	 * the time strips.
	 * @param {Array} dayPositions The array of {@link Zarafa.calendar.data.DayLayoutPosition LayoutPositions} for the various days.
	 * @private
	 */
	drawBody : function(dayPositions)
	{
		var todayPosition;
		var hourHeight = this.parentView.getHourHeight();
		// fistWorkingHour and lastWorkingHour are expressed in minutes,
		// so divide by 60 to get the number of hours. We don't need to
		// round the value because that way we can support having time
		// which is not an entire hour (9:30 for example).
		var workingBottom = (this.parentView.firstWorkingHour / 60) * hourHeight;
		var workingTop = (this.parentView.lastWorkingHour / 60) * hourHeight;
		var width = this.body.getWidth();
		var height = this.body.getHeight();

		// First resize the canvas elements for the body, this will effectively clear
		// all the contents and make them available for drawing the new contents into it.
		Zarafa.resizeCanvas(this.bodyBackgroundCanvas, width, height);
		Zarafa.resizeCanvas(this.bodyAppointmentCanvas, width, height);
		Zarafa.resizeCanvas(this.bodySelectionCanvas, width, height);

		// Draw the calendar onto the background.
		var context = this.bodyBackgroundCanvas.dom.getContext("2d");
		context.save();

		// draw background in one color
		context.fillStyle = this.calendarColorScheme.stripnormal;
		context.fillRect(0, 0, width, height);

		// draw a lighter shade of background for days that are working days
		context.fillStyle = this.calendarColorScheme.stripworking;
		for (var i = 0, len = dayPositions.length; i < len; i++) {
			var pos = dayPositions[i];

			if (pos.workingDay) {
				context.fillRect(pos.left, workingTop, pos.right - pos.left, workingBottom - workingTop);
			}
		}

		// draw horizontal grid lines at fixed time intervals
		var unitHeight = this.parentView.timeUnitHeight;
		var numLines = Math.round(height / unitHeight);
		for (var i = 0; i < numLines; i++) {
			context.strokeStyle = this.calendarColorScheme.linenormal;

			var y = (i + 1) * unitHeight - 1;
			context.strokeLine(0, y + 0.5, width, y + 0.5);
		}

		// draw vertical lines to visually separate the different day strips
		context.strokeStyle = this.calendarColorScheme.linenormal;
		for (var i = 0, len = dayPositions.length; i < len; i++) {
			var pos = dayPositions[i];

			context.strokeLine(pos.left + 0.5, 0, pos.left + 0.5, height);

			if (pos.today) {
				todayPosition = pos;
			}
		}
		context.strokeLine(width - 0.5, 0, width - 0.5, height);

		// Draw extra lines if one of the days on the screen is today
		if (Ext.isDefined(todayPosition)) {
			// Get the color from the hidden styling element, so it can be set in the css files
			context.strokeStyle = this.headerBackgroundCanvasStylingElementActive.getStyle('background-color');
			context.strokeLine(todayPosition.left + 0.5, 0, todayPosition.left + 0.5, height);
			context.strokeLine(todayPosition.right - 0.5, 0, todayPosition.right - 0.5, height);
		}

		context.restore();
	},

	/**
	 * Tests if a given mouse event is over a header. Used to implement the functionality where the user clicks
	 * on the header of a day strip zoom to that day.
	 * @param {Ext.EventObject} event ExtJS event object
	 * @return {Boolean} True iff the user clicked on the header area
	 * @private
	 */
	eventInHeader : function(event)
	{
		// Calculate the x,y position of the mouse relative the the body canvas.
		var element = this.getHeaderActionCanvas();
		var x = event.getPageX() - element.getX();
		var y = event.getPageY() - element.getY();

		// If the y-position is out of range, return false.
		if (y > this.parentView.headerTextHeight) {
			return false;
		}

		return (!Ext.isEmpty(this.screenLocationToDate(x, y)));
	},

	/**
	 * Determine over which area of the {@link Zarafa.calendar.ui.canvas.AppointmentDaysView appointment}
	 * the given {@link Ext.EventObject event} took place, and which cursor type corresponds to that location.
	 *
	 * @param {Zarafa.calendar.ui.canvas.AppointmentDaysView} appointment The appointment to check
	 * @param {Ext.EventObject} event The event object
	 * @return {String} The cursor type
	 * @private
	 */
	getCursorForBodyAppointment : function(appointment, event)
	{
		if (appointment.eventOverBodyStartHandle(event)) {
			return 'n-resize';
		} else if (appointment.eventOverBodyDueHandle(event)) {
			return 's-resize';
		} else {
			return 'move';
		}
	},

	/**
	 * Event handler for the mouse move event on the calendar body. Checks if the mouse is over an appointment
	 * and adjusts the cursor accordingly.
	 * @param {Ext.EventObject} event ExtJS event object
	 * @private
	 */
	onBodyMove : function(event)
	{
		var cursor = 'default';
		var over = false;

		// Check if the event is over an appointment.
		// Our first check should be if we are still over the same
		// appointment as before. If that is not the case, we should
		// loop over all appointments to look for the appointment we
		// are currently hovering over.
		if (this.appointmentOver && this.appointmentOver.eventOverBody(event)) {
			// We are still over the same appointment as before,
			// we don't need to search any further.
			over = this.appointmentOver;
		} else {
			// We can break the loop as soon as we find the first appointment
			// on which we are hovering. Since appointments do not overlap,
			// we cannot be hovering over multiple appointments at the same time.
			for (var i = 0, len = this.appointments.length; i < len; i++) {
				var appointment = this.appointments[i];

				// The body start and due handlers are placed over the body,
				// so it is not possible for the mouse to be over the start handle,
				// but not over the body. We can thus add a quick check to
				// see if the event is over the body, and only then determine
				// over which part of the body the mouse is actually over.
				if (appointment.eventOverBody(event)) {
					over = appointment;
					break;
				}
			}
		}

		if (over) {
			// Determine which cursor should be used for the current
			// position over the given appointment
			cursor = this.getCursorForBodyAppointment(over, event);
		}

		// Check if the cursor is hovering over a different appointment then before.
		// Fire appointment mouse events only if not dragging at the moment.
		if (this.appointmentOver !== over
			&& (!this.bodyDragZone || this.bodyDragZone.dragging === false)
			&& (!this.headerDragZone || this.headerDragZone.dragging === false)) {

			// We previously were hovering over an appointment,
			// so fire the appointmentmouseout event
			if (this.appointmentOver) {
				this.fireEvent('appointmentmouseout', this, this.appointmentOver.getRecord(), event);
			}

			// Update the reference for next time.
			this.appointmentOver = over;

			// We are hovering over a different appointment,
			// so fire the appointmentmouseover event
			if (over) {
				this.fireEvent('appointmentmouseover', this, over.getRecord(), event);
			}
		}

		this.getBodyActionCanvas().dom.style.cursor = cursor;
	},

	/**
	 * Event handler for the mouse out event on the calendar body.
	 * Checks if we were previously over an appointment, and fire the 'appointmentmouseout'
	 * event in that case.
	 * @param {Ext.EventObject} event ExtJS event object
	 * @private
	 */
	onBodyOut : function(event)
	{
		if (this.appointmentOver && !this.appointmentOver.eventOverBody(event)) {
			this.fireEvent('appointmentmouseout', this, this.appointmentOver.getRecord(), event);
			this.appointmentOver = false;
		}
	},

	/**
	 * Determine over which area of the {@link Zarafa.calendar.ui.canvas.AppointmentDaysView appointment}
	 * the given {@link Ext.EventObject event} took place, and which cursor type corresponds to that location.
	 *
	 * @param {Zarafa.calendar.ui.canvas.AppointmentDaysView} appointment The appointment to check
	 * @param {Ext.EventObject} event The event object
	 * @return {String} The cursor type
	 * @private
	 */
	getCursorForHeaderAppointment : function(appointment, event)
	{
		if (appointment.eventOverHeaderStartHandle(event)) {
			return 'w-resize';
		} else if (appointment.eventOverHeaderDueHandle(event)) {
			return 'e-resize';
		} else {
			return 'move';
		}
	},

	/**
	 * Event handler for the mouse move event on the calendar header. Checks if the mouse is over an appointment
	 * or day text header and adjusts the cursor accordingly.
	 * @param {Ext.EventObject} event ExtJS event object
	 * @private
	 */
	onHeaderMove : function(event)
	{
		var cursor = 'default';
		var over = false;

		// Determine if the event is over the header area, if
		// that is the case, we can be 100% sure that the event didn't
		// occur over any appointment.
		if (this.eventInHeader(event)) {
			cursor = 'pointer';
		} else {
			// Check if the event is over an appointment.
			// Our first check should be if we are still over the same
			// appointment as before. If that is not the case, we should
			// loop over all appointments to look for the appointment we
			// are currently hovering over.
			if (this.appointmentOver && this.appointmentOver.eventOverHeader(event)) {
				// We are still over the same appointment as before,
				// we don't need to search any further.
				over = this.appointmentOver;
			} else {
				// We can break the loop as soon as we find the first appointment
				// on which we are hovering. Since appointments do not overlap,
				// we cannot be hovering over multiple appointments at the same time.
				for (var i = 0, len = this.appointments.length; i < len; i++) {
					var appointment = this.appointments[i];

					// The body start and due handlers are placed over the body,
					// so it is not possible for the mouse to be over the start handle,
					// but not over the body. We can thus add a quick check to
					// see if the event is over the body, and only then determine
					// over which part of the body the mouse is actually over.
					if (appointment.eventOverHeader(event)) {
						over = appointment;
						break;
					}
				}
			}
		}

		if (over) {
			// Determine which cursor should be used for the current
			// position over the given appointment
			cursor = this.getCursorForHeaderAppointment(over, event);
		}

		// Check if the cursor is hovering over a different appointment then before.
		if (this.appointmentOver !== over) {
			// We previously were hovering over an appointment,
			// so fire the appointmentmouseout event
			if (this.appointmentOver) {
				this.fireEvent('appointmentmouseout', this, this.appointmentOver.getRecord(), event);
			}

			// Update the reference for next time.
			this.appointmentOver = over;

			// We are hovering over a different appointment,
			// so fire the appointmentmouseover event
			if (over) {
				this.fireEvent('appointmentmouseover', this, over.getRecord(), event);
			}
		}

		this.getHeaderActionCanvas().dom.style.cursor = cursor;
	},

	/**
	 * Event handler for the mouse out event on the calendar header.
	 * Checks if we were previously over an appointment, and fire the 'appointmentmouseout'
	 * event in that case.
	 * @param {Ext.EventObject} event ExtJS event object
	 * @private
	 */
	onHeaderOut : function(event)
	{
		if (this.appointmentOver && !this.appointmentOver.eventOverBody(event)) {
			this.fireEvent('appointmentmouseout', this, this.appointmentOver.getRecord(), event);
			this.appointmentOver = false;
		}
	},

	/**
	 * Event handler for the mouse click event on the calendar header. If the user clicks on one of the day texts (the upper part
	 * of a header box where the date and day of the week is displayed) the calendar should zoom to that date.
	 * @param {Ext.EventObject} event ExtJS event object
	 * @private
	 */
	onHeaderClick : function(event)
	{
		if (this.eventInHeader(event)) {
			var xy = event.getXY();
			var date = this.screenLocationToDate(xy[0], xy[1]);
			this.fireEvent('dayclick', this, date);
		}
	},

	/**
	 * Generic event handler for the mousemove event, this will check over which part of
	 * the calendar the event has occurred, and will call {@link #onHeaderMove} or
	 * {@link #onBodyMove} respectively.
	 * @param {Ext.EventObject} event The event object
	 */
	onMouseMove : function(event)
	{
		var header = {
			x : this.header.getX(),
			y : this.header.getY(),
			width : this.header.getWidth(),
			height : this.header.getHeight()
		};

		if (Zarafa.core.Util.inside(header, event.getPageX(), event.getPageY())) {
			this.onHeaderMove(event);
		} else {
			this.onBodyMove(event);
		}
	},

	/**
	 * This will determine on which {@link Zarafa.core.data.IPMRecord record}
	 * the event was fired.
	 * @param {Ext.EventObject} event The event for which the selection must be updated.
	 * @return {Zarafa.core.data.IPMRecord} The record (if any) on which
	 * the event was fired.
	 * @private
	 */
	getRecordForHeaderEvent : function(event)
	{
		// Check if the mouse is over one of the appointments.
		for (var i = 0, len = this.appointments.length; i < len; i++) {
			var appointment = this.appointments[i];
			if (appointment.eventOverHeader(event)) {
				return appointment.getRecord();
			}
		}
	},

	/**
	 * Event handler for the doubleclick event
	 * @param {Ext.EventObject} event ExtJS event object
	 * @private
	 */
	onHeaderDblClick : function(event)
	{
		var record = this.getRecordForHeaderEvent(event);

		// Fire dblclick event
		this.fireEvent('dblclick', this, event, record);
	},

	/**
	 * Event handler for the right-button mouse click event on the calendar header. It checks to see if there's
	 * an appointment under the mouse.
	 * @param {Ext.EventObject} event ExtJS event object
	 * @private
	 */
	onHeaderContextMenu : function(event)
	{
		var record = this.getRecordForHeaderEvent(event);
		var range;

		if (!record) {
			var xy = event.getXY();
			range = this.screenLocationToDateRange(xy[0], xy[1]);
		}

		// Fire the calendar's context menu event.
		this.fireEvent('contextmenu', this, event, record, range);
	},

	/**
	 * This will determine on which {@link Zarafa.core.data.IPMRecord record}
	 * the event was fired.
	 * @param {Ext.EventObject} event The event for which the selection must be updated.
	 * @return {Zarafa.core.data.IPMRecord} The record (if any) on which
	 * the event was fired.
	 * @private
	 */
	getRecordForBodyEvent : function(event)
	{
		// Check if the mouse is over one of the appointments.
		for (var i = 0, len = this.appointments.length; i < len; i++) {
			var appointment = this.appointments[i];
			if (appointment.eventOverBody(event)) {
				return appointment.getRecord();
			}
		}
	},

	/**
	 * Event handler for the doubleclick event
	 * @param {Ext.EventObject} event ExtJS event object
	 * @private
	 */
	onBodyDblClick : function(event)
	{
		// Update selection models
		var record = this.getRecordForBodyEvent(event);

		// Fire dblclick event
		this.fireEvent('dblclick', this, event, record);
	},

	/**
	 * Event handler for the right-button mouse click event on the calendar body. It checks to see if there's
	 * an appointment under the mouse.
	 * @param {Ext.EventObject} event ExtJS event object
	 * @private
	 */
	onBodyContextMenu : function(event)
	{
		var record = this.getRecordForBodyEvent(event);
		var range;

		if (!record) {
			var xy = event.getXY();
			range = this.screenLocationToDateRange(xy[0], xy[1]);
		}

		// Fire the calendar's context menu event.
		this.fireEvent('contextmenu', this, event, record, range);
	},

	/**
	 * Event handler which is fired when the {@link #selectionModel} fires the
	 * {@link Zarafa.calendar.ui.AppointmentSelectionModel#appointmentdeselect appointmentdeselect} event.
	 * This will clear the 3rd layers ({@link #bodySelectionCanvas} and {@link #headerSelectionCanvas},
	 * and will force an update for all previously selected records, which need to redraw their
	 * selection outline.
	 * @param {Zarafa.calendar.ui.AppointmentSelectionModel} selectionModel The selection model which fired the event.
	 * @param {Zarafa.core.data.IPMRecord} oldRecord The record which was deselected.
	 * @private
	 * @override
	 */
	onAppointmentDeselect : function(selectionModel, oldRecord)
	{
		var oldAppointment = this.findAppointment(oldRecord);

		Zarafa.calendar.ui.canvas.CalendarDaysView.superclass.onAppointmentDeselect.call(this, selectionModel, oldRecord);

		// Resize the selection canvas elements, this forces it to be cleared (event when the size did not change).
		// Note that we only have to redraw the canvas element, on which the appointment was previously drawn.
		if (oldAppointment) {
			var isHeader = oldAppointment.isHeaderRange();
			var canvas = isHeader ? this.headerSelectionCanvas : this.bodySelectionCanvas;

			Zarafa.resizeCanvas(canvas, canvas.getWidth(), canvas.getHeight());

			if (selectionModel.hasSelection()) {
				for (var i = 0, len = this.appointments.length; i < len; i++) {
					var appointment = this.appointments[i];

					// Only redraw the selection outline, if the appointment
					// is located on the canvas which we just cleared.
					if (isHeader == appointment.isHeaderRange()) {
						appointment.setSelected(appointment.isSelected());
					}
				}
			}
		}
	},

	/**
	 * Event handler which is fired when the {@link #selectionModel} fires the
	 * {@link Zarafa.calendar.ui.AppointmentSelectionModel#selectionclear selectionclear} event.
	 * This will clear the 3rd layers ({@link #bodySelectionCanvas} and {@link #headerSelectionCanvas}.
	 * @param {Zarafa.calendar.ui.AppointmentSelectionModel} selectionModel The selection model which fired the event.
	 * @private
	 * @override
	 */
	onAppointmentSelectionClear : function(selectionModel)
	{
		Zarafa.calendar.ui.canvas.CalendarDaysView.superclass.onAppointmentSelectionClear.call(this, selectionModel);

		// Resize the selection canvas elements, this forces it to be cleared (event when the size did not change).
		Zarafa.resizeCanvas(this.bodySelectionCanvas, this.bodySelectionCanvas.getWidth(), this.bodySelectionCanvas.getHeight());
		Zarafa.resizeCanvas(this.headerSelectionCanvas, this.headerSelectionCanvas.getWidth(), this.headerSelectionCanvas.getHeight());
	},

	/**
	 * Lays out the view. This function is called after {@link #render} and is used
	 * to update the view to the latest situation. When an appointment, or setting
	 * has been changed, the {@link #layout} function must change the look to reflect
	 * the new changes.
	 * @protected
	 */
	onLayout : function()
	{
		Zarafa.calendar.ui.canvas.CalendarDaysView.superclass.onLayout.call(this);

		// Check if we have a light or dark color
		var isDarkColor = Zarafa.core.ColorSchemes.getLuma(this.calendarColorScheme.base) < 155;
		if ( !isDarkColor ){
			this.headerBackgroundCanvasStylingElement.addClass('light-background');
		} else {
			this.headerBackgroundCanvasStylingElement.removeClass('light-background');
		}
		
		var dayPositions = this.calculateDayLayoutPositions();

		this.drawHeader(dayPositions);
		this.drawBody(dayPositions);
	}
});
