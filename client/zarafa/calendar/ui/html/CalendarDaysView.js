Ext.namespace('Zarafa.calendar.ui.html');

/**
 * @class Zarafa.calendar.ui.html.CalendarDaysView
 * @extends Zarafa.calendar.ui.AbstractCalendarDaysView
 *
 * HTML based implementation of {@link Zarafa.calendar.ui.AbstractCalendarDaysView AbstractCalendarDaysView}.
 *
 * Using layering we can optimize the rendering of the calendar. Whenever an appoint changes, we are not
 * interested in redrawing the complete calendar and all appointments in it (This would become a performance
 * issue for calendars with many appointments). So with 2 layers we can create the following setup:
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
 */
Zarafa.calendar.ui.html.CalendarDaysView = Ext.extend(Zarafa.calendar.ui.AbstractCalendarDaysView, {
	/**
	 * The element for the top-row in the calendar which contains the
	 * dayname for each individual column, as well as the display for all all-day appointments.
	 * This element is 'layer 1' for the header, containing only the background.
	 * @property
	 * @type Ext.Element
	 */
	headerBackgroundLayer : undefined,

	/**
	 * The element for the top-row in the calendar which contains the
	 * dayname for each individual column, as well as the display for all all-day appointments.
	 * This element contains the appointments and sets the background color of the header.
	 * @property
	 * @type Ext.Element
	 */
	headerAppointmentLayer : undefined,

	/**
	 * The element for the body in the calendar which contains the
	 * timestrips and the appointments.
	 * This element is 'layer 1' for the body, containing only the background.
	 * @property
	 * @type Ext.Element
	 */
	bodyBackground : undefined,

	/**
	 * The element for the body in the calendar which contains the
	 * timestrips and the appointments.
	 * This element is 'layer 2' for the body, containing only the appointments.
	 * @property
	 * @type Ext.Element
	 */
	bodyAppointment : undefined,

	/**
	 * The Appointment over which the cursor is currently hovering.
	 * @property
	 * @type Zarafa.calendar.ui.html.AppointmentDaysView
	 */
	appointmentOver : undefined,

	/**
	 * The &lt;img&gt; element which indicate current time on time strip and
	 * placed at the left of {@link #indicatorLine}.
	 * This element is created using {@link #create} during {@link #render}.
	 * @property
	 * @type Ext.Element
	 */
	indicatorIcon : undefined,

	/**
	 * The &lt;div&gt; element which is used to draw a line on time strip.
	 * This element is created using {@link #createDiv} during {@link #render}.
	 * @property
	 * @type Ext.Element
	 */
	indicatorLine : undefined,

	/**
	 * The task which gets executed every minute in a multi-threaded manner and
	 * draws indicator elements honoring current time.
	 * @property
	 * @type Object
	 */
	indicatorTask : undefined,

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

		Zarafa.calendar.ui.html.CalendarDaysView.superclass.constructor.call(this, config);

		this.on('destroy', this.onDestroy, this);
	},

	/**
	 * Renders the view. Generates the body and header layers.
	 * @param {Ext.Element} container The Ext.Element into which the view must be rendered.
	 * @private
	 * @override
	 */
	render: function(container)
	{
		Zarafa.calendar.ui.html.CalendarDaysView.superclass.render.call(this, container);

		this.dayPositions = this.calculateDayLayoutPositions();

		this.headerBackgroundLayer = this.header.createChild({cls: 'k-html-header-background'});
		this.headerAppointmentLayer = this.header.createChild({cls: 'k-html-header-appointment'});

		this.bodyBackground = this.body.createChild({cls: 'k-html-body-background'});
		this.bodyAppointment = this.body.createChild({cls: 'k-html-body-appointment'});

		// Hook mouse events to the selection layers
		this.mon(this.getHeaderAppointmentLayer(), {
			'contextmenu': this.onBodyContextMenu,
			scope: this
		});
		this.mon(this.getBodyAppointmentLayer(), {
			'contextmenu': this.onBodyContextMenu,
			scope: this
		});

		// Create current-time indicator, line and icon
		this.create({tag : 'img', src : Ext.BLANK_IMAGE_URL}, this.parentView.scrollable, 'indicatorIcon', 'icon_indicator_calendar k-calendar-timestrip-indicator-icon');
		this.createDiv(this.parentView.scrollable, 'indicatorLine', 'k-calendar-timestrip-indicator-line');
	},

	/**
	 * Handler which executes once the {@link Ext.Component} gets destroyed.
	 * This will stop the {@link #indicatorTask}.
	 * @param {Ext.Component} component The component which gets destroyed
	 * must be created.
	 * @private
	 */
	onDestroy : function(component)
	{
		if(this.indicatorTask){
			Ext.TaskMgr.stop(this.indicatorTask);
		}
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
		return new Zarafa.calendar.ui.html.AppointmentDaysView({
			parentView: this,
			record : record,
			calendarColorScheme : this.calendarColorScheme
		});
	},

	/**
	 * Removes a child view from this view.
	 * @param {Zarafa.core.ui.View} child child view to be removed
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

		return Zarafa.calendar.ui.html.CalendarDaysView.superclass.removeChildView.apply(this, arguments);
	},

	/**
	 * Create an Appointment Proxy object which can represent the selected time slot
	 * @return Zarafa.calendar.ui.html.AppointmentProxy
	 * @protected
	 */
	createAppointmentProxy : function()
	{
		return new Zarafa.calendar.ui.html.AppointmentProxy({ showTime : true });
	},

	/**
	 * Returns the element which must be used to draw Appointments for the body ({@link #bodyAppointment Layer2}).
	 * @return {Ext.Element} The calendar body element
	 */
	getBodyAppointmentLayer : function()
	{
		return this.bodyAppointment;
	},

	/**
	 * Returns the {@link #headerAppointmentLayer element} which must be used to draw Appointments for the header.
	 * @return {Ext.Element} The calendar header element
	 */
	getHeaderAppointmentLayer : function()
	{
		return this.headerAppointmentLayer;
	},

	/**
	 * Basically draws the rendered header. Creates the CSS grid columns for the calendar header.
	 * Sets the background color. Sets the text on the headers for each day.
	 * The header title is generated using the {@link #getDayHeaderTitle} function.
	 *
	 * @param {Array} dayPositions The array of {@link Zarafa.calendar.data.DayLayoutPosition LayoutPositions} for the various days.
	 * @private
	 */
	drawHeader: function(dayPositions)
	{
		// Resize the header
		var width = this.header.getWidth();
		var height = this.header.getHeight();
		this.headerBackgroundLayer.setSize(width, height);
		this.headerBackgroundLayer.dom.innerHTML = '';
		this.headerAppointmentLayer.setSize(width, height);
		this.headerAppointmentLayer.dom.innerHTML = '';

		// Set the background color
		this.headerBackgroundLayer.setStyle({
			'background-color': this.calendarColorScheme.header
		});

		// Check if we have a light or dark color
		var isDarkColor = Zarafa.core.ColorSchemes.isDark(this.calendarColorScheme.base);
		if ( isDarkColor ){
			this.headerBackgroundLayer.addClass('k-dark');
		} else {
			this.headerBackgroundLayer.removeClass('k-dark');
		}

		// Set the correct number of css grid columns for the header, with the correct width
		var gridTemplateColumns = dayPositions.map(function(pos) {
			return (100/dayPositions.length) + '% ';
		}).join(' ');
		this.headerBackgroundLayer.setStyle({
			'grid-template-columns': gridTemplateColumns,
			'msGridColumns': gridTemplateColumns
		});

		// Create a new div (column) for every day
		dayPositions.forEach(function(pos, i) {
			var className = 'k-day-'+i + (pos.today ? ' k-today k-active-border' : '');
			if ( dayPositions[i+1] && dayPositions[i+1].today ) {
				className += ' k-active-border';
			}
			this.headerBackgroundLayer.createChild({
				cls: className,
				style: '-ms-grid-column: ' + (i+1),
				html: '<div class="k-cal-header-title">' + this.getDayHeaderTitle(pos.date, pos.right - pos.left) + '</div>'
			});
		}, this);
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
		//var todayPosition;
		var width = this.body.getWidth();
		var height = this.body.getHeight();
		this.bodyBackground.setSize(width, height);
		this.bodyBackground.dom.innerHTML = '';
		this.bodyAppointment.setSize(width, height);
		this.bodyAppointment.dom.innerHTML = '';

		var unitHeight = this.parentView.timeUnitHeight;
		var numLines = Math.round(height / unitHeight);
		var workStart = (this.parentView.firstWorkingHour / 60) * (numLines/24) + 1; // grid numbering starts at 1, so add 1
		var workEnd = (this.parentView.lastWorkingHour / 60) * (numLines/24) + 1; // grid numbering starts at 1, so add 1

		var templateColumns = '';
		for ( var col=0; col<dayPositions.length; col++) {
			templateColumns += 'calc(100%/' + dayPositions.length + ') ';
		}
		var rowColumns = '';
		for ( var row=0; row<numLines; row++) {
			rowColumns += 'calc(100%/' + numLines + ') ';
		}
		this.bodyBackground.setStyle({
			'grid-template-rows': rowColumns,
			'grid-template-columns': templateColumns,
			'msGridRows': rowColumns,
			'msGridColumns': templateColumns
		});
		this.bodyAppointment.setStyle({
			'grid-template-columns': templateColumns,
			'msGridColumns': templateColumns
		});

		// draw the lines of the background
		var html = '';
		for (var i = 0, len = dayPositions.length; i < len; i++) {
			var pos = dayPositions[i];
			var nextDay = dayPositions[i+1];

			for ( var h=0; h<numLines; h++ ) {
				// Add a cell to the grid
				var className = 'k-day-' + i + ' k-line-' + h + (dayPositions[i].today ? ' k-today' : '');
				var style = 'grid-column: ' + (i+1) + ' / ' + (i+1) + '; ' +
							'-ms-grid-column:' + (i+1) + ';' +
							'-ms-grid-column-span: 1;' +
							'grid-row:' + (h+1) + ' / ' + (h+1) + '; ' +
							'-ms-grid-row:' + (h+1) + ';' +
							'-ms-grid-row-span: 1;' +
							'border-bottom-color:' + this.calendarColorScheme.linenormal + ';';

				// Draw a border in active color around today
				// TODO(Ronald): Update JSON themes and core themes and example theme
				if ( pos.today || (nextDay && nextDay.today) ) {
					className += ' k-active-border';
				} else {
					style += ' border-color:' + this.calendarColorScheme.linenormal + ';';
				}

				// draw a lighter shade of background for days that are working days
				if (pos.workingDay && h+1>=workStart && h+1<workEnd) {
					style += ' background-color: ' + this.calendarColorScheme.stripworking + ';';
				} else {
					style += ' background-color: ' + this.calendarColorScheme.stripnormal + ';';
				}

				html += '<div class="' + className + '" style="' + style + '"></div>';
			}
		}
		this.bodyBackground.dom.innerHTML = html;
	},

	/**
	 * Draws thin line over calendar. The line indicates current-time.
	 * @private
	 */
	drawCurrentTimeIndicator : function()
	{
		if (!this.parentView) {
			return;
		}

		// Layout current-time indicator components based on current date and time
		var totalHeight = this.parentView.numHours * this.parentView.getHourHeight();
		var verticalPosition = Math.floor(this.getDateVerticalPosition(new Date()) * totalHeight);

		// Minus 6 pixel because current-time denoted by the middle of icon
		// And the size of icon is 12x12 pixels
		this.indicatorIcon.setTop(verticalPosition - 6);
		this.indicatorLine.setWidth(this.width + this.leftOffset);

		// Minus 0.5 pixel because the 1px-thick-line should positioned exactly in middle of icon
		this.indicatorLine.setTop(verticalPosition - 0.5);
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
		// Calculate the x,y position of the mouse relative the the body layer.
		var element = this.getHeaderActionLayer();
		var x = event.getPageX() - element.getX();
		var y = event.getPageY() - element.getY();

		// If the y-position is out of range, return false.
		if (y > this.parentView.headerTextHeight) {
			return false;
		}

		return (!Ext.isEmpty(this.screenLocationToDate(x, y)));
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
	 * Event handler for the right-button mouse click event on the calendar body.
	 * The contextmenu event of appointments will be handled by the AppointmentView.
	 * @param {Ext.EventObject} event ExtJS event object
	 * @private
	 */
	onBodyContextMenu : function(event)
	{
		var xy = event.getXY();
		var range = this.screenLocationToDateRange(xy[0], xy[1]);

		// Fire the calendar's context menu event.
		this.fireEvent('contextmenu', this, event, null, range);
	},

	/**
	 * Event handler which is fired when the {@link #selectionModel} fires the
	 * {@link Zarafa.calendar.ui.AppointmentSelectionModel#appointmentdeselect appointmentdeselect} event.
	 *
	 * @param {Zarafa.calendar.ui.AppointmentSelectionModel} selectionModel The selection model which fired the event.
	 * @param {Zarafa.core.data.IPMRecord} record The record which was deselected.
	 * @private
	 * @override
	 */
	onAppointmentDeselect : function(selectionModel, record)
	{
		Zarafa.calendar.ui.html.CalendarDaysView.superclass.onAppointmentDeselect.call(this, selectionModel, record);

		var appointment = this.findAppointment(record);
		if ( appointment ) {
			appointment.setSelected(false);
		}
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
		Zarafa.calendar.ui.html.CalendarDaysView.superclass.onLayout.call(this);

		var dayPositions = this.calculateDayLayoutPositions();

		this.container.removeClass('k-calendar-month-view');
		this.container.removeClass('k-calendar-day-view-1-days');
		this.container.removeClass('k-calendar-day-view-5-days');
		this.container.removeClass('k-calendar-day-view-7-days');
		if ( dayPositions.length <= 7 ) {
			this.container.addClass('k-calendar-day-view-' + dayPositions.length + '-days');
		}

		this.drawHeader(dayPositions);
		this.drawBody(dayPositions);

		if ( this.getDateRange().containsDate(new Date()) ) {
			this.setIndicatorDisplayed(true);
			this.drawCurrentTimeIndicator();

			if (!Ext.isDefined(this.indicatorTask)) {
				this.indicatorTask = Ext.TaskMgr.start({
					run : function(){
						this.drawCurrentTimeIndicator();
					},
					scope : this,
					interval : 60000
				});
			}
		} else {
			this.setIndicatorDisplayed(false);

			if (this.indicatorTask) {
				Ext.TaskMgr.stop(this.indicatorTask);
			}
		}
	},

	/**
	 * Hides or shows {@link #indicatorIcon} and {@link #indicatorLine}.
	 * @param {Boolean} value True to display the element, false otherwise.
	 */
	setIndicatorDisplayed : function(value)
	{
		this.indicatorIcon.setDisplayed(value);
		this.indicatorLine.setDisplayed(value);
	}
});
