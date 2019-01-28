Ext.namespace('Zarafa.calendar.ui.html');

/**
 * @class Zarafa.calendar.ui.html.CalendarBoxView
 * @extends Zarafa.calendar.ui.AbstractCalendarBoxView
 *
 * HTML based implementation of {@link Zarafa.calendar.ui.AbstractCalendarBoxView AbstractCalendarBoxView}.
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
 *    are allowed to overlap with another appointment (The time can obviously overlap, but
 *    the appointments are placed under each other until the maxium number of appointment that can be
 *    shown is reached. After that an "expand button" is rendered. Whenever a single appointment
 *    changes, we only have to rerender that single appointment (since it doesn't overlap with any other
 *    appointment, we can be sure that redrawing the appointment will not affect other appointments).
 */
Zarafa.calendar.ui.html.CalendarBoxView = Ext.extend(Zarafa.calendar.ui.AbstractCalendarBoxView, {
	/**
	 * The element for the top-row in the calendar which contains the
	 * day name for each individual column. Since the header does not contain appointments,
	 * we don't need extra layers for displaying the appointments.
	 * @property
	 * @type Ext.Element
	 */
	headerBackgroundLayer : undefined,

	/**
	 * The element for the body in the calendar which contains the
	 * timestrips and the appointments.
	 * This element is 'layer 1' for the body, containing only the background.
	 * @property
	 * @type Ext.Element
	 */
	bodyBackgroundLayer : undefined,

	/**
	 * The element for the body in the calendar which contains the
	 * timestrips and the appointments.
	 * This element is 'layer 2' for the body, containing only the appointments.
	 * @property
	 * @type Ext.Element
	 */
	bodyAppointmentLayer : undefined,

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

		Zarafa.calendar.ui.html.CalendarBoxView.superclass.constructor.call(this, config);
	},

	/**
	 * Renders the view. Generates the body and header layers.
	 * @param {Ext.Element} container The Ext.Element into which the view must be rendered.
	 * @private
	 * @override
	 */
	render : function(container)
	{
		Zarafa.calendar.ui.html.CalendarBoxView.superclass.render.call(this, container);

		this.create('div', this.header, 'headerBackgroundLayer', 'k-html-header-background');
		this.create('div', this.body, 'bodyBackgroundLayer', 'k-html-body-background');
		this.create('div', this.body, 'bodyAppointmentLayer', 'k-html-body-appointment');

		this.mon(this.bodyAppointmentLayer, {
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
		return new Zarafa.calendar.ui.html.AppointmentBoxView({
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
		return new Zarafa.calendar.ui.html.AppointmentProxy({ showTime : false });
	},

	/**
	 * Sets the text on the headers for each day column. The header title is generated using the
	 * {@link #getDayHeaderTitle} function.
	 * @private
	 */
	drawDayHeaders : function()
	{
		var width = this.header.getWidth();
		var height = this.header.getHeight();

		// First resize the element of the header and remove the contents
		this.headerBackgroundLayer.setSize(width, height);
		this.headerBackgroundLayer.dom.innerHTML = '';

		// Set the background color
		this.headerBackgroundLayer.setStyle({
			'background-color': this.calendarColorScheme.header
		});

		// Check if we have a light or dark color
		var isDarkColor = Zarafa.core.ColorSchemes.isDark(this.calendarColorScheme.base);
		if ( isDarkColor ){
			this.headerBackgroundLayer.addClass('k-dark');
			this.headerBackgroundLayer.removeClass('k-light');
		} else {
			this.headerBackgroundLayer.addClass('k-light');
			this.headerBackgroundLayer.removeClass('k-dark');
		}

		var startDate = this.getVisibleDateRange().getStartDate().clone();

		// Set the startDate to 12:00 to prevent problems when the DST switch
		// occurs at 00:00 (like in Brasil).
		startDate.setHours(12);

		// Set the correct number of css grid columns for the header, with the correct width
		var gridTemplateColumns = '';
		for (var i = 0; i < this.numDaysInWeek; i++) {
			gridTemplateColumns += (100/this.numDaysInWeek) + '% ';
		}
		this.headerBackgroundLayer.setStyle({
			'grid-template-columns': gridTemplateColumns,
			'msGridColumns': gridTemplateColumns
		});

		// Create a new div (column) for every day
		for (i = 0; i < this.numDaysInWeek; i++) {
			var date = startDate.add(Date.DAY, i).clearTime();
			var text = this.getDayHeaderTitle(date, width/this.numDaysInWeek);
			this.headerBackgroundLayer.createChild({
				cls: 'k-day-' + i,
				style: '-ms-grid-column: ' + (i + 1),
				html: '<div class="k-cal-header-title">' + text + '</div>'
			});
		}
	},

	/**
	 * Draws the boxes that represent the days in the box view.
	 * @private
	 */
	drawDays : function()
	{
		// Clear all the contents of the body
		this.bodyBackgroundLayer.dom.innerHTML = '';
		this.bodyAppointmentLayer.dom.innerHTML = '';

		// Create a css grid to easily create the background of the days
		var visibleRange = this.getVisibleDateRange();
		var visibleWeeks = this.getVisibleWeekCount(visibleRange);
		var templateColumns = '';
		for ( var col=0; col<this.numDaysInWeek; col++) {
			templateColumns += 'calc(100%/' + this.numDaysInWeek + ') ';
		}
		var rowColumns = '';
		for ( var row=0; row<visibleWeeks; row++) {
			rowColumns += 'calc(100%/' + visibleWeeks + ') ';
		}
		this.bodyBackgroundLayer.setStyle({
			'grid-template-rows': rowColumns,
			'grid-template-columns': templateColumns,
			'msGridRows': rowColumns,
			'msGridColumns': templateColumns
		});

		var headerBackgroundColor = Zarafa.core.ColorSchemes.createLightColor(this.calendarColorScheme.base, 1.8);
		var boxWidth = this.bodyAppointmentLayer.getWidth() / this.numDaysInWeek;
		var boxHeight = this.bodyAppointmentLayer.getHeight() / visibleWeeks;
		this.dayBoxConfigurations.forEach(function(dayBox, i) {
			var d = i % this.numDaysInWeek;
			var w = Math.floor(i / this.numDaysInWeek);
			var nextDay = this.dayBoxConfigurations[i+1];
			var className = 'k-day-' + d + ' k-week-' + w;
			if ( dayBox.today ) {
				className += ' k-action-border k-today';
			}
			if ( nextDay && nextDay.today && Math.floor((i+1) / this.numDaysInWeek) === w ) {
				className += ' k-action-border';
			}

			// Determine the background color of the day box body area.
			var bgColor = '';
			if (dayBox.active) {
				switch (dayBox.busyStatus) {
					case Zarafa.core.mapi.BusyStatus.FREE:
						bgColor = 'white';
						break;
					case Zarafa.core.mapi.BusyStatus.BUSY:
						bgColor = '#d7e2f1';
						break;
					case Zarafa.core.mapi.BusyStatus.TENTATIVE:
						bgColor = this.calendarColorScheme.stripnormal;
						className += 'k-status-tentative';
						break;
					case Zarafa.core.mapi.BusyStatus.OUTOFOFFICE:
						bgColor = '#e7d7ef';
						break;
					default:
						break;
				}
			} else {
				// Set the color for non-active days (in this view these are the days of other months)
				bgColor = Zarafa.core.ColorSchemes.createLightColor(this.calendarColorScheme.base, 1.9);
			}

			var cell = this.bodyBackgroundLayer.createChild({
				cls: className,
				html: '',
				style: 'grid-column:' + (d+1) + ' / ' + (d+1) + ';' +
						'-ms-grid-column:' + (d+1) + ';' +
						'-ms-grid-column-span: 1;' +
						'grid-row:' + (w+1) + ' / ' + (w+1) + ';' +
						'-ms-grid-row:' + (w+1) + ';' +
						'-ms-grid-row-span: 1;' +
						'border-color:' + this.calendarColorScheme.header + ';' +
						'background-color:' + bgColor
			});

			var hdr = cell.createChild({
				cls: 'k-header',
				html: dayBox.date.format(_("jS")),
				style: 'background-color:' + headerBackgroundColor
			});
			hdr.on('click', this.onClickToOpenDayView.createDelegate(this, [dayBox.date]), this);

			// TODO: This should be drawn together with the appointment instead of with the background,
			// so we can split it later.
			// Draw expand button. Draw it in the appointment layer so it won't be covered
			// by appointments or selections and we can interact with it
			if (dayBox.overflow) {
				var expandBtn = this.bodyAppointmentLayer.createChild({
					cls: 'k-expand-btn',
					'ext:qtip': _('Switch to day view to see all appointments'),
					'ext:qwidth': 'auto',
					style: 'border-color:' + this.calendarColorScheme.header + ';' +
							'left:' + ((d + 1) * boxWidth - 20) + 'px;' +
							'top:' + ((w + 1) * boxHeight - 20) + 'px;'
				});

				// Add handler
				expandBtn.on('click', this.onClickToOpenDayView.createDelegate(this, [dayBox.date]), this);
			}

		}, this);
	},

	/**
	 * Event handler for the mouse click event on header or the expand button of a day. Will fire the
	 * {#dayclick} event that will be relayed by the parent views until the
	 * {@link Zarafa.calendar.ui.CalendarBlockPanel#onDayCLick onDayCLick} handler will process it.
	 * @param {Date} date The date of the day that needs to be shown
	 */
	onClickToOpenDayView: function(date) {
		this.fireEvent('dayclick', this, date);
	},

	/**
	 * Event handler for the right-button mouse click event on the calendar body.
	 * @param {Ext.EventObject} event ExtJS event object
	 * @private
	 */
	onBodyContextMenu : function(event)
	{
		var xy = event.getXY();
		var range = this.screenLocationToDateRange(xy[0], xy[1]);

		// Fire the calendar's context menu event.
		// Since the user did not click on an appointment (will be handled by the appointment classes),
		// we do not have a record. So we'll pass null
		this.fireEvent('contextmenu', this, event, null, range);
	},

	/**
	 * Event handler which is fired when the {@link #selectionModel} fires the
	 * {@link Zarafa.calendar.ui.AppointmentSelectionModel#appointmentdeselect appointmentdeselect} event.
	 * @param {Zarafa.calendar.ui.AppointmentSelectionModel} selectionModel The selection model which fired the event.
	 * @param {Zarafa.core.data.IPMRecord} record The record which was deselected.
	 * @private
	 * @override
	 */
	onAppointmentDeselect : function(selectionModel, record)
	{
		Zarafa.calendar.ui.html.CalendarBoxView.superclass.onAppointmentDeselect.call(this, selectionModel, record);

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
		// Perform greedy coloring on the appointments. This calculates how overlapping appointments are laid out
		// in rows on the view.
		this.doGreedyColoring(this.appointments, true);

		// Parent layout
		Zarafa.calendar.ui.html.CalendarBoxView.superclass.onLayout.call(this);

		this.container.removeClass('k-calendar-day-view-1-days');
		this.container.removeClass('k-calendar-day-view-5-days');
		this.container.removeClass('k-calendar-day-view-7-days');
		this.container.addClass('k-calendar-month-view');

		// Check if we have a light or dark color scheme
		var isDarkColor = Zarafa.core.ColorSchemes.isDark(this.calendarColorScheme.base);
		if ( isDarkColor ){
			this.headerBackgroundLayer.removeClass('light-background');
		} else {
			this.headerBackgroundLayer.addClass('light-background');
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
