Ext.namespace('Zarafa.calendar.ui.canvas');

/**
 * @class Zarafa.calendar.ui.canvas.CalendarBoxView
 * @extends Zarafa.calendar.ui.AbstractCalendarBoxView
 *
 * A canvas-based implementation of the calendar box view. This implementation creates two canvas DOM elements on the parent view's
 * header and body. These canvas elements are then used by child appointment views to render to.
 *
 * Note that this class implements rendering only. Functionality
 * common to both implementations can be found in {@link Zarafa.calendar.ui.AbstractCalendarBoxView AbstractCalendarBoxView}.
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
Zarafa.calendar.ui.canvas.CalendarBoxView = Ext.extend(Zarafa.calendar.ui.AbstractCalendarBoxView, {
	/**
	 * @cfg {Number} expandButtonRadius The radius for the expand button which appears when not
	 * all appointments could be rendered for that particular day. The button is a round button,
	 * with an triangle inside.
	 */
	expandButtonRadius : 8,

	/**
	 * @cfg {Number} expandButtonMargin The margins around the expand button which appears
	 * when not all appointments could be rendered for that particular day. The button is a round button,
	 * with an triangle inside.
	 */
	expandButtonMargin : 2,

	/**
	 * The &lt;canvas&gt; element for the top-row in the calendar which contains the
	 * dayname for each individual column. Since the header does not contain appointments,
	 * we don't need extra layers for displaying the appointments.
	 * @property
	 * @type Ext.Element
	 */
	headerBackgroundCanvas : undefined,

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
	 * @type Zarafa.calendar.ui.canvas.AppointmentBoxView
	 */
	appointmentOver : undefined,

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			baseCls : 'zarafa-calendar',
			enableDD : true,
			ddGroup : 'dd.mapiitem',
			bodyDropConfig : {
				ddGroup : 'dd.mapiitem',
				headerMode : false,
				selectingSnapMode : Zarafa.calendar.data.SnapModes.DAY,
				draggingSnapMode : Zarafa.calendar.data.SnapModes.NONE
			}
		});

		Zarafa.calendar.ui.canvas.CalendarBoxView.superclass.constructor.call(this, config);
	},

	/**
	 * Renders the view. Generates the body and header layers.
	 * @param {Ext.Element} container The Ext.Element into which the view must be rendered.
	 * @private
	 * @override
	 */
	render : function(container)
	{
		Zarafa.calendar.ui.canvas.CalendarBoxView.superclass.render.call(this, container);

		this.create('canvas', this.header, 'headerBackgroundCanvas', 'zarafa-canvas zarafa-canvas-layer-1 zarafa-canvas-header-background');
		
		// Create styling elements. We will take the styles of these elements to draw the canvas.
		// This way we can set these styles in the css files.
		this.create('div', this.headerBackgroundCanvas, 'headerBackgroundCanvasStylingElement', 'zarafa-styling-element');
		this.create('div', this.headerBackgroundCanvas, 'headerBackgroundCanvasStylingElementCurrentDay', 'zarafa-styling-element-current-day');
		this.headerBackgroundCanvasStylingElement.styling = {
			font : this.headerBackgroundCanvasStylingElement.getStyle('font'),
			fontSize : parseInt(this.headerBackgroundCanvasStylingElement.getStyle('font-size'), 10),
			paddingTop : this.headerBackgroundCanvasStylingElementCurrentDay.getPadding('t'),
			paddingLeft : this.headerBackgroundCanvasStylingElementCurrentDay.getPadding('l'),
			paddingRight : this.headerBackgroundCanvasStylingElementCurrentDay.getPadding('r')
		};
		this.headerBackgroundCanvasStylingElementCurrentDay.styling = {
			backgroundColor : this.headerBackgroundCanvasStylingElementCurrentDay.getStyle('background-color'),
			color : this.headerBackgroundCanvasStylingElementCurrentDay.getStyle('color')
		};

		this.create('canvas', this.body, 'bodyBackgroundCanvas', 'zarafa-canvas zarafa-canvas-layer-1');
		this.create('canvas', this.body, 'bodyAppointmentCanvas', 'zarafa-canvas zarafa-canvas-layer-2');
		this.create('canvas', this.body, 'bodySelectionCanvas', 'zarafa-canvas zarafa-canvas-layer-3');

		// Hook mouse events to the body.
		this.mon(this.getBodyActionCanvas(), {
			'mousemove': this.onBodyMove,
			'mouseout': this.onBodyOut,
			'click': this.onBodyClick,
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
		return new Zarafa.calendar.ui.canvas.AppointmentBoxView({
			parentView: this,
			record : record,
			calendarColorScheme : this.calendarColorScheme
		});
	},

	/**
	 * Create an Appointment Proxy object which can represent the selected text
	 * Must be implemented by the subclasses.
	 * @return Zarafa.calendar.ui.AbstractDateRangeView
	 * @protected
	 */
	createAppointmentProxy : function()
	{
		return new Zarafa.calendar.ui.canvas.AppointmentProxy({ showTime : false });
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
	 * The {@link Zarafa.calendar.ui.CalendarMultiView CalendarMultiView} view has a header area that automatically
	 * resizes when its child views require more space. In the days view for instance, appointments that span
	 * more than 24 hours are laid out in the header. This view however has a header with a fixed height.
	 * @return {Number} height in pixels the calendar view needs to properly lay out its header.
	 */
	getDesiredHeaderHeight : function()
	{
		return this.rendered ? parseInt(this.headerBackgroundCanvasStylingElement.getStyle('height'), 10) : 0;
//		return this.headerHeight;
	},

	/**
	 * Sets the text on the headers for each day column. The header title is generated using the {@link #getDayHeaderTitle} function.
	 * @param {Array} dayPositions The array of {@link Zarafa.calendar.data.DayLayoutPosition LayoutPositions} for the various days.
	 * @private
	 */
	drawDayHeaders : function()
	{
		var width = this.header.getWidth();
		var height = this.header.getHeight();

		// First resize the canvas elements for the body, this will effectively clear
		// all the contents and make them available for drawing the new contents into it.
		Zarafa.resizeCanvas(this.headerBackgroundCanvas, width, height);

		// Get context from the canvas.
		var context = this.headerBackgroundCanvas.dom.getContext("2d");
		context.save();

		// Fill the header with the header color.
		context.fillStyle = this.calendarColorScheme.base;
		context.fillRect(0, 0, width, height);

		// Draw a header for each day of the week. We just draw the outlines of each
		// box in the colorscheme's border color and draw text in the center that tells us
		// what day of the week that column represents.
		context.fillStyle = this.headerBackgroundCanvasStylingElement.getStyle('color');
		context.setFont(this.headerBackgroundCanvasStylingElement.getStyle('font'));

		var dayWidth = width / this.numDaysInWeek;
		var startDate = this.getVisibleDateRange().getStartDate().clone();
		var lineWidth = context.lineWidth;

		// Set the startDate to 12:00 to prevent problems when the DST switch
		// occurs at 00:00 (like in Brasil).
		startDate.setHours(12);

		for (var i = 0; i < this.numDaysInWeek; i++) {
			var date = startDate.add(Date.DAY, i).clearTime();
			var left = Math.round(dayWidth * i);
			var right = Math.round(dayWidth * (i + 1)) + lineWidth;
			var boxWidth = right - left;

			// Draw header text
			var text = this.getDayHeaderTitle(date, boxWidth);
			context.drawText(text, left + this.headerBackgroundCanvasStylingElement.getPadding('l'), height - Math.ceil((height-parseInt(this.headerBackgroundCanvasStylingElement.getStyle('font-size')))/2, 10));
		}

		context.restore();
	},

	/**
	 * Draws an expand button. These buttons are shown when there is not enough
	 * space in a day box to show all the appointments for a given day, as a
	 * visual hint to the user that not all information is shown.
	 * The button can be clicked to zoom to that particular day.
	 * @param {CanvasRenderingContext2D} context canvas drawing context.
	 * The context should be positioned at the top-left position of the dayBox.
	 * @param {Object} dayBox day box configuration.
	 * @private
	 */
	drawExpandButton : function(context, dayBox)
	{
		// Calculate daybox position.
		var boxWidth = dayBox.right - dayBox.left;
		var boxHeight = dayBox.bottom - dayBox.top;

		// Determine the centre of the button
		var x = boxWidth - this.expandButtonRadius - this.expandButtonMargin;
		var y = boxHeight - this.expandButtonRadius - this.expandButtonMargin;

		// Draw a white circle with a black border.
//		context.circle(x, y, this.expandButtonRadius);
//		context.fillStyle = 'white';
//		context.fill();
//		context.strokeStyle = 'black';
//		context.stroke();

		// Draw a triangle pointing down
		context.beginPath();
		var radius = this.expandButtonRadius - 2;
		for (var i = 0; i < 4; i++) {
			var x1 = Math.sin(i * 2 / 3 * Math.PI) * radius + x;
			var y1 = Math.cos(i * 2 / 3 * Math.PI) * radius + y;

			if (i === 0) {
				context.moveTo(x1, y1);
			} else {
				context.lineTo(x1, y1);
			}
		}
		context.closePath();

		context.fillStyle = this.calendarColorScheme.base;
		context.fill();
		context.strokeStyle = 'white';
		context.stroke();
	},

	/**
	 * Draws a dayBox in which the appointments for a particular day can be drawn.
	 * @param {CanvasRenderingContext2D} context rendering context.
	 * @param {Object} dayBox day box configuration.
	 * @private
	 */
	drawDayBox : function(context, dayBox)
	{
		var boxWidth = dayBox.right - dayBox.left;
		var boxHeight = dayBox.bottom - dayBox.top;

		// Move the context to the correct position of the dayBox.
		context.save();
		context.translate(dayBox.left, dayBox.top);

		// Draw Header background.
//		var backgroundColor = this.calendarColorScheme.borderInner;
		var backgroundColor = context.convertHexRgbToDecRgba(this.calendarColorScheme.base, 0.2);
		var color;
		if (dayBox.today) {
			backgroundColor = this.headerBackgroundCanvasStylingElementCurrentDay.getStyle('background-color');
			color = this.headerBackgroundCanvasStylingElementCurrentDay.getStyle('color');
			context.setFont(this.headerBackgroundCanvasStylingElementCurrentDay.getStyle('font'));
		} else {
			color = this.headerBackgroundCanvasStylingElement.getStyle('color');
			color = 'black';
			context.setFont(this.headerBackgroundCanvasStylingElement.getStyle('font'));
		}

		context.fillStyle = backgroundColor;
		context.fillRect(0, 0, boxWidth, this.dayHeaderHeight);

		// Draw header text.
		context.fillStyle = color;
		context.drawText(
			dayBox.date.format(_("jS")), 
			this.headerBackgroundCanvasStylingElement.getPadding('l'), 
			this.dayHeaderHeight -  Math.ceil((this.dayHeaderHeight -parseInt(this.headerBackgroundCanvasStylingElement.getStyle('font-size')))/2) - 1
		);

		// Determine the background color of the day box body area.
		if (dayBox.active) {
			switch (dayBox.busyStatus) {
				case Zarafa.core.mapi.BusyStatus.FREE:
					context.fillStyle = 'white';
					break;
				case Zarafa.core.mapi.BusyStatus.BUSY:
					context.fillStyle = '#d7e2f1';
					break;
				case Zarafa.core.mapi.BusyStatus.TENTATIVE:
					context.fillStyle = this.calendarColorScheme.stripnormal;
					break;
				case Zarafa.core.mapi.BusyStatus.OUTOFOFFICE:
					context.fillStyle = '#e7d7ef';
					break;
				default:
					break;
			}
		} else {
			// Set the color for non-active days (in this view these are the days of other months)
			context.fillStyle = context.convertHexRgbToDecRgba(this.calendarColorScheme.base, 0.1);
		}

		context.fillRect(0, this.dayHeaderHeight, boxWidth, boxHeight - this.dayHeaderHeight + 1);

		// If the day box should be rendered tentative (striped) fill the body rect with a dashed pattern fill.
		if (dayBox.busyStatus === Zarafa.core.mapi.BusyStatus.TENTATIVE) {
			context.fillStyle = context.createPattern(Zarafa.calendar.ui.IconCache.getDashedImage(), 'repeat');
			context.fillRect(0, this.dayHeaderHeight, boxWidth, boxHeight - this.dayHeaderHeight + 1);
		}

		// The border around the day box
		context.beginPath();
		if ( dayBox.left ){
			context.moveTo(0.5, boxHeight - 0.5);
			context.lineTo(0.5, 0.5);
		} else {
			context.moveTo(0.5, 0.5);
		}
		if ( dayBox.top ){
			context.lineTo(boxWidth - 0.5, 0.5);
		}
		context.strokeStyle = this.calendarColorScheme.base;
		context.stroke();

		// Draw expand button.
		if (dayBox.overflow) {
			this.drawExpandButton(context, dayBox);
		}

		context.restore();
	},

	/**
	 * Draws the boxes that represent the days in the box view. Each box is drawn using drawDayBox().
	 * @private
	 */
	drawDays : function()
	{
		var todayBox;
		var width = this.body.getWidth();
		var height = this.body.getHeight();

		// First resize the canvas elements for the body, this will effectively clear
		// all the contents and make them available for drawing the new contents into it.
		Zarafa.resizeCanvas(this.bodyBackgroundCanvas, width, height);
		Zarafa.resizeCanvas(this.bodyAppointmentCanvas, width, height);
		Zarafa.resizeCanvas(this.bodySelectionCanvas, width, height);

		// Get canvas drawing context.
		var context = this.bodyBackgroundCanvas.dom.getContext("2d");
		context.save();

		// Draw the individual day boxes. If a day box represents the current day (today) it is drawn with a special
		// header color. Because the outline of that day also needs to be highlighted that day box is stored and later
		// has its outlines repainted.
		for (var i = 0, len = this.dayBoxConfigurations.length; i < len; i++) {
			var dayBox = this.dayBoxConfigurations[i];

			this.drawDayBox(context, dayBox);
			if (dayBox.today) {
				todayBox = dayBox;
			}
		}

		if (Ext.isDefined(todayBox)) {
			var boxWidth = todayBox.right - todayBox.left;
			var boxHeight = todayBox.bottom - todayBox.top;
			var lineWidth = context.lineWidth;
			context.lineWidth = 3;

			context.strokeStyle = this.headerBackgroundCanvasStylingElementCurrentDay.getStyle('background-color');
			context.strokeRect(todayBox.left + (lineWidth / 2), todayBox.top + (lineWidth / 2), boxWidth - lineWidth, boxHeight - lineWidth);
		}

		context.restore();
	},

	/**
	 * Tests if a given mouse event is over a header. Used to implement the
	 * functionality where the user clicks on the header of a day strip zoom to that day.
	 * @param {Ext.EventObject} event ExtJS event object
	 * @return {Boolean} True iff the user clicked on the header area
	 * @private
	 */
	eventInHeader : function(event)
	{
		// Calculate the x,y position of the mouse relative the the body canvas.
		var element = this.getBodyActionCanvas();
		var x = event.getPageX() - element.getX();
		var y = event.getPageY() - element.getY();

		// Check for each day box if the position is inside its header.
		for (var i = 0, len = this.dayBoxConfigurations.length; i < len; i++) {
			var dayBox = this.dayBoxConfigurations[i];

			if (x >= dayBox.left && x <= dayBox.right &&
				y >= dayBox.top && y <= (dayBox.top + this.dayHeaderHeight)) {
					return true;
			}
		}

		return false;
	},

	/**
	 * Tests if a given mouse event is over a daybox. Used to implement the functionality where the
	 * user clicks on the body of a day box.
	 * @param {Ext.EventObject} event ExtJS event object
	 * @return {Boolean} True iff the user clicked on the header area
	 * @private
	 */
	eventInDay : function(event)
	{
		// Calculate the x,y position of the mouse relative the the body canvas.
		var element = this.getBodyActionCanvas();
		var x = event.getPageX() - element.getX();
		var y = event.getPageY() - element.getY();

		// Check for each day box if the position is inside its header.
		for (var i = 0, len = this.dayBoxConfigurations.length; i < len; i++) {
			var dayBox = this.dayBoxConfigurations[i];

			if (x >= dayBox.left && x <= dayBox.right &&
				y >= dayBox.top && y <= dayBox.bottom) {
					return true;
			}
		}

		return false;
	},

	/**
	 * Tests if a given mouse event is over the expand button on a day box.
	 * Used to implement the functionality where the user clicks on an expand
	 * button to zoom to the day.
	 * @param {Ext.EventObject} event ExtJS event object
	 * @return {Boolean} True iff the user clicked on the expand button.
	 * @private
	 */
	eventInExpandButton : function(event)
	{
		// Calculate the x,y position of the mouse relative the the body canvas.
		var element = this.getBodyActionCanvas();
		var x = event.getPageX() - element.getX();
		var y = event.getPageY() - element.getY();

		// Check for each day box if the position is inside the overflow button.
		for (var i = 0, len = this.dayBoxConfigurations.length; i < len; i++) {
			var dayBox = this.dayBoxConfigurations[i];
			var insideBox = (x >= dayBox.left && x <= dayBox.right &&
							 y >= dayBox.top && y <= dayBox.bottom);

			// If the event is not inside this dayBox, we can continue
			// to the next dayBox.
			if (!insideBox) {
				continue;
			}

			// So the event was inside this box, but if it has not overflowed,
			// we can simply return return false now.
			if (!dayBox.overflow) {
				return false;
			}

			// So the event was inside this box, the box is overflown,
			// so we have a chance that the event was on the expand button.
			// Lets do the math.

			// Calculate the offset from the center of the expand button.
			var tx = (dayBox.right - this.expandButtonRadius - this.expandButtonMargin) - x;
			var ty = (dayBox.bottom - this.expandButtonRadius - this.expandButtonMargin) - y;

			// Pythagoras to get the distance from the center.
			var dist = Math.sqrt(tx * tx + ty * ty);

			// Since the button is circular, if the distance is smaller than the circle
			// radius the mouse is over the button.
			return (dist <= this.expandButtonRadius);
		}

		return false;
	},

	/**
	 * Determine over which area of the {@link Zarafa.calendar.ui.canvas.AppointmentBoxView appointment}
	 * the given {@link Ext.EventObject event} took place, and which cursor type corresponds to that location.
	 *
	 * @param {Zarafa.calendar.ui.canvas.AppointmentBoxView} appointment The appointment to check
	 * @param {Ext.EventObject} event The event object
	 * @return {String} The cursor type
	 * @private
	 */
	getCursorForBodyAppointment : function(appointment, event)
	{
		if (appointment.eventOverBodyStartHandle(event)) {
			return 'w-resize';
		} else if (appointment.eventOverBodyDueHandle(event)) {
			return 'e-resize';
		} else {
			return 'move';
		}
	},

	/**
	 * Event handler for the mouse move event on the calendar body. Checks if the mouse is over an appointment or
	 * daybox header/expand button and adjusts the cursor accordingly.
	 * @param {Ext.EventObject} event ExtJS event object
	 * @private
	 */
	onBodyMove : function(event)
	{
		var cursor = 'default';
		var over = false;

		// Determine if the event is over the header area or the expand button,
		// if that is the case, we can be 100% sure that the event didn't
		// occur over any appointment.
		if (this.eventInHeader(event) || this.eventInExpandButton(event)) {
			cursor = 'pointer';
		} else {
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
		}

		if (over) {
			// Determine which cursor should be used for the current
			// position over the given appointment
			cursor = this.getCursorForBodyAppointment(over, event);
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
	 * Event handler for the mouse click event on the calendar body. Appointment mouse down events are handled
	 * by the drag/drop handler, so this only checks for user clicks on day box headers and expand buttons.
	 * @param {Ext.EventObject} event ExtJS event object
	 * @private
	 */
	onBodyClick : function(event)
	{
		if (this.eventInHeader(event) || this.eventInExpandButton(event)) {
			var xy = event.getXY();
			var date = this.screenLocationToDate(xy[0], xy[1]);

			this.fireEvent('dayclick', this, date);
		}
	},

	/**
	 * Generic event handler for the mousemove event, this will check over which part of
	 * the calendar the event has occurred, and will call {@link #onBodyMove}.
	 * @param {Ext.EventObject} event The event object
	 */
	onMouseMove : function(event)
	{
		this.onBodyMove(event);
	},

	/**
	 * This will determine on which {@link Zarafa.core.data.IPMRecord record}
	 * the event was fired.
	 * @param {Ext.EventObject} event The event for which the selection must be updated.
	 * @return {Zarafa.core.data.IPMRecord} The record (if any) on which
	 * the event was fired.
	 * @private
	 */
	getRecordForEvent : function(event)
	{
		// Check if the mouse is over one of the appointments.
		// We can be sure that the event didn't occur on an appointment,
		// if the event didn't even occur inside a dayBox.
		if (this.eventInDay(event)) {
			for (var i = 0, len = this.appointments.length; i < len; i++) {
				var appointment = this.appointments[i];
				if (appointment.eventOverBody(event)) {
					return appointment.getRecord();
				}
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
		var record = this.getRecordForEvent(event);

		// Fire dblclick event
		this.fireEvent('dblclick', this, event, record);
	},

	/**
	 * Event handler for the right-button mouse click event on the calendar body. It checks to see if there's
	 * an appointment under the mouse, and if not selects the day the mouse is over.
	 * @param {Ext.EventObject} event ExtJS event object
	 * @private
	 */
	onBodyContextMenu : function(event)
	{
		var record = this.getRecordForEvent(event);
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
		Zarafa.calendar.ui.canvas.CalendarBoxView.superclass.onAppointmentDeselect.call(this, selectionModel, oldRecord);

		// Resize the selection canvas elements, this forces it to be cleared (event when the size did not change).
		Zarafa.resizeCanvas(this.bodySelectionCanvas, this.bodySelectionCanvas.getWidth(), this.bodySelectionCanvas.getHeight());

		if (selectionModel.hasSelection()) {
			for (var i = 0, len = this.appointments.length; i < len; i++) {
				var appointment = this.appointments[i];
				appointment.setSelected(appointment.isSelected());
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
		Zarafa.calendar.ui.canvas.CalendarBoxView.superclass.onAppointmentSelectionClear.call(this, selectionModel);

		// Resize the selection canvas elements, this forces it to be cleared (event when the size did not change).
		Zarafa.resizeCanvas(this.bodySelectionCanvas, this.bodySelectionCanvas.getWidth(), this.bodySelectionCanvas.getHeight());
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

		return Zarafa.calendar.ui.canvas.CalendarBoxView.superclass.removeChildView.apply(this, arguments);
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
		// Perform greedy coloring on the appointments. This calculates how overlapping appointments are laid out
		// in rows on the view.
		this.doGreedyColoring(this.appointments, true);

		// Parent lay out.
		Zarafa.calendar.ui.canvas.CalendarBoxView.superclass.onLayout.call(this);
		
		// Check if we have a light or dark color scheme
		var isDarkColor = Zarafa.core.ColorSchemes.getLuma(this.calendarColorScheme.base) < 155;
		if ( !isDarkColor ){
			this.headerBackgroundCanvasStylingElement.addClass('light-background');
		} else {
			this.headerBackgroundCanvasStylingElement.removeClass('light-background');
		}
		
		// Update the height of the body.
		var height = this.parentView.scrollable.getHeight();
		this.body.setHeight(height);

		// Calculate the positions of all dayBoxes, and start layout
		// to position the div elements.
		this.calculateDayBoxConfigurations();
		this.drawDayHeaders();
		this.drawDays();
	}
});
