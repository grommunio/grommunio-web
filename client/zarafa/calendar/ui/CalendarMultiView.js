Ext.namespace("Zarafa.calendar.ui");

/**
 * @class Zarafa.calendar.ui.CalendarMultiView
 * @extends Zarafa.core.ui.View
 *
 * The CalendarMultiView implements the visual presentation for the {@link Zarafa.calendar.ui.CalendarPanel CalendarPanel}
 * component.
 * <p>
 * A single instance of this view manages several {@link Zarafa.calendar.ui.AbstractCalendarView AbstractCalendarView} views, each showing one
 * or more appointment folders. As folders are added and removed in the store, new views are created and old ones destroyed to reflect these
 * changes. This view also manages the movement of folders from one view to another, merging, and separating.
 * <p>
 * The view provides several areas its child views can draw into, such as a scrollable body area, a tab strip area, and a header area.
 * The individual {@link Zarafa.calendar.ui.AbstractCalendarView AbstractCalendarView} instances are laid out on these areas.
 * <p>
 * The view also manages zero or more time strip views that represent time zones, and are visible when the view is in 'days view' mode.
 * <p>
 * Child views are expected to be subclasses of {@link Zarafa.calendar.ui.AbstractCalendarView AbstractCalendarView}.
 */
Zarafa.calendar.ui.CalendarMultiView = Ext.extend(Zarafa.core.ui.View, {
	/**
	 * @cfg {Zarafa.core.Context} context The context which this view is associated with
	 */
	context : undefined,
	/**
	 * @cfg {Number} tabAreaHeight height in pixels of the tab strip
	 */
	tabAreaHeight : 39,
	/**
	 * @cfg {Number} height of the header text in pixels. This is the day number and friendly day name text (e.g. 'monday', 'tuesday', etc)
	 */
	headerTextHeight : 24,
	/**
	 * @cfg {Number} height of a header appointment in pixels.
	 */
	headerItemHeight : 24,
	/**
	 * @cfg {Number} headerLineHeight height in pixels of the dividing line between the scrollable
	 * body of the calendar view and the header above it.
	 */
	headerLineHeight : 1,
	/**
	 * @cfg {Number} calendarGap number of pixels (horizontally) between multiple calendars
	 */
	calendarGap : 6,
	/**
	 * this is probably always going to be 24. Made it into a property to avoid magic numbers
	 * in the code.
	 * @property
	 * @type Number
	 */
	numHours : 24,
	/**
	 * @cfg {Number} timeStripWidth width in pixels of the time strips on the left of the panel.
	 */
	timeStripWidth : 60,
	/**
	 * @cfg {Number} timeStripGap gap in pixels between timestrips (defaults to 0)
	 */
	timeStripGap : 0,
	/**
	 * The zoomLevel used in this view. This determines how many numbers are reflected by 2 horizontal
	 * lines in the calendar view.
	 *
	 * @property
	 * @type Number
	 */
	zoomLevel : 30,
	/**
	 * The {@link Zarafa.core.ContextModel contextmodel} obtained from the {@link #context}.
	 * @property
	 * @type Zarafa.core.ContextModel
	 */
	model : undefined,
	/**
	 * number of pixels the strips are shifted left by. This is used to obtain black vertical lines between
	 * multiple time strips. Each strip as 'border-left : 1px solid black', and all strips are shifted left
	 * one pixel so that the border of the first time strip is hidden (it's horizonal position is -1).
	 * @property
	 * @type Number
	 */
	timeStripShift : 1,
	/**
	 * @cfg {Number} firstWorkingHour The number of minutes counted from the start of the day which represents
	 * the start of the working hours.
	 */
	firstWorkingHour : 9 * 60,
	/**
	 * @cfg {Number} lastWorkingHour The number of minutes counted from the start of the day which represents
	 * the end of the working hours.
	 */
	lastWorkingHour : 17 * 60,
	/**
	 * @cfg {Array} workingDays The array of working days
	 */
	workingDays : undefined,

	/**
	 * If {@link #showTooltip tooltips are enabled} this will hold the reference to the tooltip
	 * instance to be used on the calendars.
	 *
	 * @property
	 * @type Zarafa.calendar.ui.canvas.ToolTip
	 * @private
	 */
	tooltip : undefined,

	/**
	 * @cfg {Number} tabStrokeHeight height in pixels of the active tab stroke.
	 */
	tabStrokeHeight : 9,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		if (Ext.isDefined(config.context)) {
			if (!Ext.isDefined(config.zoomLevel)) {
				config.zoomLevel = config.context.getZoomLevel();
			}
			if (!Ext.isDefined(config.model)) {
				config.model = config.context.getModel();
			}
		}

		// If not explicitely configured, the workingHours and days are determined
		// by the Settings option.
		if (!Ext.isDefined(config.firstWorkingHour)) {
			config.firstWorkingHour = container.getSettingsModel().get('zarafa/v1/main/start_working_hour');
		}
		if (!Ext.isDefined(config.lastWorkingHour)) {
			config.lastWorkingHour = container.getSettingsModel().get('zarafa/v1/main/end_working_hour');
		}
		if (!Ext.isDefined(config.workingDays)) {
			config.workingDays = container.getSettingsModel().get('zarafa/v1/main/working_days');
		}

		config = Ext.applyIf(config, {
			baseCls : 'zarafa-calendar',

			// zooming constants
			timeUnitHeight : 24,

			// configuration for the individual calendar views
			minHeaderDayTextWidth : 150,
			showBorder : false,
			borderWidth : 1,
			showTimeStrips : true
		});

		this.addEvents(
			/**
			 * @event appointmentcalendardrop
			 * Fires when an appointment is dragged from this calendar component onto another.
			 * @param {Zarafa.calendar.ui.CalendarMultiView} multiview The Calendar MultiView which fired the event
			 * @param {Zarafa.calendar.AppointmentRecord} appointment the appointment record that was dragged
			 * @param {Zarafa.calendar.core.MAPIFolder} sourceFolder source folder
			 * @param {Zarafa.calendar.core.MAPIFolder} targetFolder target folder
			 * @param {Zarafa.core.DateRange} dateRange The new daterange for the appointment
			 * @param {Ext.EventObject} event The original event object
			 */
			'appointmentcalendardrop',
			/**
			 * @event appointmentmouseover
			 * Fires when the mouse is being mover over an appointment.
			 * @param {Zarafa.calendar.ui.CalendarMultiView} multiview The Calendar MultiView which fired the event
			 * @param {Zarafa.calendar.AppointmentRecord} record The appointment over which the mouse is moving
			 * @param {Ext.EventObject} event The original event object
			 */
			'appointmentmouseover',
			/**
			 * @event appointmentmouseover
			 * Fires when the mouse is being mover away from an appointment.
			 * @param {Zarafa.calendar.ui.CalendarMultiView} multiview The Calendar MultiView which fired the event
			 * @param {Zarafa.calendar.AppointmentRecord} record The appointment over which the mouse has moved out
			 * @param {Ext.EventObject} event The original event object
			 */
			'appointmentmouseout',
			/**
			 * @event appointmentmove
			 * Fires when an appointment has been moved.
			 * @param {Zarafa.calendar.ui.CalendarMultiView} multiview The Calendar MultiView which fired the event
			 * @param {Zarafa.calendar.AppointmentRecord} appointment the appointment record that was moved
			 * @param {Zarafa.core.DateRange} dateRange The new daterange for the appointment
			 * @param {Ext.EventObject} event The original event object
			 */
			'appointmentmove',
			/**
			 * @event appointmentresize
			 * Fires when an appointment has been resized. Resizing in this context means that either the start
			 * date or the due date has been changed.
			 * @param {Zarafa.calendar.ui.CalendarMultiView} multiview The Calendar MultiView which fired the event
			 * @param {Zarafa.calendar.AppointmentRecord} appointment the appointment record that was resized
			 * @param {Zarafa.core.DateRange} dateRange The new daterange for the appointment
			 * @param {Ext.EventObject} event The original event object
			 */
			'appointmentresize',
			/**
			 * @event appointmentcreate
			 * Fires when an new appointment should be created.
			 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder MAPI folder the appointment should be created in.
			 * @param {Zarafa.core.DateRange} dateRange Appointment date range.
			 * @param {String} text Appointment text
			 */
			'appointmentcreate',
			/**
			 * @event appointmentinitdrag
			 * Fires when the user starts dragging an appointment in the calendar
			 * @param {Ext.EventObject} event The mouse event
			 * @param {Zarafa.calendar.ui.AppointmentView} appointment The appointment that is being dragged
			 */
			'appointmentinitdrag',
			/**
			 * @event appointmentenddrag
			 * Fires when the user releases a dragged appointment in the calendar
			 * @param {Ext.EventObject} event The mouse event
			 * @param {Zarafa.calendar.ui.AppointmentView} appointment The appointment that was dragged
			 */
			'appointmentenddrag',
			/**
			 * @event contextmenu
			 * Fires when the user right-clicks on the calendar body or on an appointment.
			 * @param {Ext.EventObject} event right-click event.
			 * @param {Ext.data.Record} record (optional) if the user right-clicked on an appointment
			 * this will contain the appointment record, undefined otherwise
			 */
			'contextmenu',
			/**
			 * @event dblclick
			 * Fires when the user double-clicks on on an appointment.
			 * @param {Ext.EventObject} event right-click event.
			 * @param {Ext.data.Record} record appointment record.
			 */
			'dblclick',
			/**
			 * @event dayclick
			 * Fires when a user clicks on the header of a day, or on the expand button in the box view.
			 * @param {Zarafa.core.ui.View} source event source
			 * @param {Date} date date of the day.
			 */
			'dayclick',
			/**
			 * @event calendarclose
			 * Fires when the user closes a calendar using the close icon in the calendar tabs.
			 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder MAPI folder.
			 */
			'calendarclose'
		);

		Zarafa.calendar.ui.CalendarMultiView.superclass.constructor.call(this, config);
	},

	/**
	 * Initialises the view.
	 * @protected
	 */
	init : function()
	{
		// parent init
		Zarafa.calendar.ui.CalendarMultiView.superclass.init.call(this);

		this.calendars = [];
		this.timeStrips = [];

		if (Ext.isDefined(this.context)) {
			this.mon(this.context, 'viewmodechange', this.onViewModeChanged, this);
			this.mon(this.context, 'zoomchange', this.onZoomLevelChanged, this);
		}
		if (Ext.isDefined(this.model)) {
			this.mon(this.model, 'foldermergestatechanged', this.onFolderMergestateChanged, this);
		}

		this.addTimeStrip();
	},

	/**
	 * @return {Zarafa.calendar.ui.AppointmentSelectionModel} selection model.
	 */
	getSelectionModel : function()
	{
		return this.selectionModel;
	},

	/**
	 * @return {Zarafa.calendar.ui.DateRangeSelectionModel} range selection model.
	 */
	getRangeSelectionModel : function()
	{
		return this.rangeSelectionModel;
	},

	/**
	 * Returns the current date range (start, due) of the view.
	 * @return {Zarafa.core.DateRange} Current date range.
	 */
	getDateRange : function()
	{
		return this.model.dateRange;
	},

	/**
	 * Returns the current height of the tab strip in pixels. When there are multiple folders in the view, this will return the default
	 * tab area height, otherwise it will return 0.
	 * @return {Number} height in pixels of the tab strip area.
	 */
	getTabHeight : function()
	{
		return this.showBorder ? this.tabAreaHeight : 0;
	},

	/**
	 * Adds a time strip to the view. Multiple time strips may be added for multiple time zones.
	 * @param {Number} time difference in hours. See {Zarafa.calendar.ui.TimeStripView TimeStripView}.
	 * @param {String} name of the time zone. Will be shown above the time strip.
	 */
	addTimeStrip : function(timeDifference, name)
	{
		// add a view
		var timeStrip = new Zarafa.calendar.ui.TimeStripView({
			timeDifference : timeDifference || 0,
			name : name || ''
		});
		this.addChildView(timeStrip);
		this.timeStrips.splice(0, 0, timeStrip);

		// render the view (adds the neccesairy UI components)
		if (this.rendered)  {
			timeStrip.render(this.container);
			this.layout();
		}
	},

	/**
	 * Removes a time strip from the view.
	 * @param {String} name Time strip name.
	 */
	removeTimeStrip : function(name)
	{
		for (var i=0, strip; strip=this.timeStrips[i]; i++) {
			if (strip.name==name) {
				this.timeStrips.splice(i, 1);
				this.removeChildView(strip, true);
				break;
			}
		}

		// do layout
		this.layout();
	},

	/**
	 * Obtain the singleton instance of the {@link Zarafa.calendar.ui.ToolTip Tooltip}.
	 * @return {Zarafa.calendar.ui.ToolTip} The tooltip
	 */
	getTooltipInstance : function()
	{
		if (!this.tooltip) {
			this.tooltip = new Zarafa.calendar.ui.ToolTip({
				target: this.el,
				view: this
			});
		}

		return this.tooltip;
	},

	/**
	 * Event handler which is fired when the {@link Zarafa.core.Context#viewmodechange viewmodechange}
	 * event has been fired by the {@link #context}. This will update the {@link #showTimeStrips}
	 * and {@link #calendarViewConstructor} which will ensure the calendar to be correctly shown.
	 *
	 * @param {Zarafa.core.Context} context The context which fired the event
	 * @param {Zarafa.calendar.data.ViewModes} viewMode The new viewmode
	 * @param {Zarafa.calendar.data.ViewModes} oldViewMode The previous active viewmode
	 * @private
	 */
	onViewModeChanged : function(context, viewMode, oldViewMode)
	{
		var nameSpace = Zarafa.calendar.ui.canvas;

		if (!this.rendered) {
			return;
		}

		switch (viewMode) {
			case Zarafa.calendar.data.ViewModes.DAYS:
				this.showTimeStrips = true;
				this.calendarViewConstructor = nameSpace.CalendarDaysView;
				this.container.addClass('zarafa-calendar-daysview');
				this.container.removeClass('zarafa-calendar-boxview');
				break;
			case Zarafa.calendar.data.ViewModes.BOX:
				this.showTimeStrips = false;
				this.calendarViewConstructor = nameSpace.CalendarBoxView;
				this.container.removeClass('zarafa-calendar-daysview');
				this.container.addClass('zarafa-calendar-boxview');
				break;
			default:
				this.showTimeStrips = false;
				this.container.removeClass('zarafa-calendar-daysview');
				this.container.removeClass('zarafa-calendar-boxview');
		}

		// We will be changing the calendars array while
		// converting all calendars...
		var calendars = this.calendars.clone();
		for (var i = 0, len = calendars.length; i < len; i++) {
			var calendar = calendars[i];
			var folders = calendar.getFolders();

			if (folders.length > 0) {
				var newCalendar = this.createCalendarView(calendar.groupId, folders);
				newCalendar.setSelectedFolder(calendar.selectedFolder);
			}

			this.removeCalendarView(calendar);
		}

		// All calendars are recreated, this means that we need
		// to reload all data from the store and force it into the UI again.
		if (this.store && this.store.lastOptions && !this.store.isExecuting('list')) {
			this.onLoad(this.store, this.store.getRange(), this.store.lastOptions);
		}
	},

	/**
	 * Event handler which is fired when the {@link #zoomLevel} on the
	 * {@link #context} has been changed. This will update the
	 * {@link #zoomLevel} and will layout the view.
	 * @param {Zarafa.core.Context} context The context which fired the event
	 * @param {Number} zoomLevel The new zoomLevel
	 */
	onZoomLevelChanged : function(context, zoomLevel)
	{
		this.zoomLevel = zoomLevel;
		this.layout();
	},

	/**
	 * Event handler which is triggered when the mergeState has
	 * changed for the folders. This will either merge the contents
	 * of all folders into a single view, or apply grouping to
	 * clearly differentiate between the different folders
	 * @param {Zarafa.core.ContextModel} model The model which raised the event
	 * @param {Boolean} mergeState The current merge state
	 * @private
	 */
	onFolderMergestateChanged : function(model, mergeState)
	{
		// if folder is not present than we cannot proceed for calendar merge
		if (!Ext.isDefined(this.folders)) {
			return;
		}
		this.manageCalendarViews();
	},

	/**
	 * Forwards the 'appointmentcalendardrop' event to the parent calendar panel.
	 * @param {Zarafa.calendar.ui.AbstractCalendarDaysView} calendar The calendar which fired the event
	 * @param {Zarafa.calendar.ui.AbstractCalendarDaysView} source The calendar from where the appointment was dragged
	 * @param {Zarafa.calendar.AppointmentRecord} appointment the appointment record that was dropped
	 * @param {Zarafa.core.DateRange} dateRange The new daterange for the appointment
	 * @param {Ext.EventObject} event The original event object
	 * @private
	 */
	onAppointmentCalendarDrop : function(calendar, source, appointment, dateRange, event)
	{
		this.fireEvent('appointmentcalendardrop', this, appointment, source.getSelectedFolder(), calendar.getSelectedFolder(), dateRange, event);
	},

	/**
	 * Forwards the 'appointmentmouseover' event to the parent calendar panel
	 * @param {Zarafa.calendar.ui.AbstractCalendarDaysView} calendar The calendar which fired the event
	 * @param {Zarafa.calendar.AppointmentRecord} record The appointment over which the mouse is moving
	 * @param {Ext.EventObject} event The original event object
	 * @private
	 */
	onAppointmentMouseOver : function(calendar, appointment, event)
	{
		this.fireEvent('appointmentmouseover', this, appointment, event);
	},

	/**
	 * Forwards the 'appointmentmouseout' event to the parent calendar panel
	 * @param {Zarafa.calendar.ui.AbstractCalendarDaysView} calendar The calendar which fired the event
	 * @param {Zarafa.calendar.AppointmentRecord} record The appointment over which the mouse has moved out
	 * @param {Ext.EventObject} event The original event object
	 * @private
	 */
	onAppointmentMouseOut : function(calendar, appointment, event)
	{
		this.fireEvent('appointmentmouseout', this, appointment, event);
	},

	/**
	 * Forwards the 'appointmentmove' event to the parent calendar panel.
	 * @param {Zarafa.calendar.ui.AbstractCalendarDaysView} calendar The calendar which fired the event
	 * @param {Zarafa.calendar.AppointmentRecord} appointment the appointment record that was moved
	 * @param {Zarafa.core.DateRange} dateRange The new daterange for the appointment
	 * @param {Ext.EventObject} event The original event object
	 * @private
	 */
	onAppointmentMove : function(calendar, appointment, dateRange, event)
	{
		this.fireEvent('appointmentmove', this, appointment, dateRange, event);
	},

	/**
	 * Forwards the 'appointmentresize' event to the parent calendar panel.
	 * @param {Zarafa.calendar.ui.AbstractCalendarDaysView} calendar The calendar which fired the event
	 * @param {Zarafa.calendar.AppointmentRecord} appointment the appointment record that was resized
	 * @param {Zarafa.core.DateRange} dateRange The new daterange for the appointment
	 * @param {Ext.EventObject} event The original event object
	 * @private
	 */
	onAppointmentResize : function(calendar, appointment, dateRange, event)
	{
		this.fireEvent('appointmentresize', this, appointment, dateRange, event);
	},

	/**
	 * Forwards the 'appointmentcreate' event to the parent calendar panel.
	 * @param {Zarafa.calendar.ui.AbstractCalendarView} calendarView Calendar view the appointment belongs to.
	 * @param {Zarafa.core.DateRange} dateRange Date range of the appointment.
	 * @param {String} text Appointment text.
	 * @private
	 */
	onAppointmentCreate : function(calendarView, dateRange, text)
	{
		this.fireEvent('appointmentcreate', this, calendarView.getSelectedFolder(), dateRange, text);
	},

	/**
	 * Handler for the appointmentinitdrag event, forwarded by the {@link Zarafa.calendar.ui.AbstractCalendarDaysView},
	 * originally coming from {@link Zarafa.calendar.ui.CalendarViewDragZone}
	 * initiated from {@link Zarafa.calendar.ui.CalendarViewDragZone}
	 *
	 * @param {Zarafa.calendar.ui.AbstractCalendarView} calendarView Calendar view the appointment was dragged from
	 * @param {Ext.EventObject} event The mouse event
	 * @param {Zarafa.calendar.ui.AppointmentView} The appointment on which the event occurred
	 * @private
	 */
	onAppointmentInitDrag : function(calendarView, event, appointment)
	{
		this.fireEvent('appointmentinitdrag', this, event, appointment);
	},

	/**
	 * Handler for the appointmentenddrag event, forwarded by the {@link Zarafa.calendar.ui.AbstractCalendarDaysView},
	 * initiated from {@link Zarafa.calendar.ui.CalendarViewDragZone}
	 *
	 * @param {Zarafa.calendar.ui.AbstractCalendarView} calendarView Calendar view the appointment was dragged to
	 * @param {Ext.EventObject} event The mouse event
	 * @param {Zarafa.calendar.ui.AppointmentView} The appointment on which the event occurred
	 * @private
	 */
	onAppointmentEndDrag : function(calendarView, event, appointment)
	{
		this.fireEvent('appointmentenddrag', this, event, appointment);
	},

	/**
	 * Delegates the 'contextmenu' event, which fires when the user right-clicks on the panel.
	 * @param {Zarafa.calendar.ui.AbstractCalendarDaysView} calendar Calendar view
	 * @param {Ext.EventObject} event Mouse event object.
	 * @param {Zarafa.core.data.IPMRecord} record If the user right-clicked on an appointment,
	 * this will contain the IPMRecord of the appointment in question. Otherwise undefined.
	 * @param {Zarafa.core.DateRange} range The Datarange on which the contextmenu
	 * was invoked. This is only provided when the event didn't occur on a record.
	 * @private
	 */
	onContextMenu : function(calendar, event, record, range)
	{
		// If the user clicked on an appointment, make that appointment selected.
		// If the user did not click on an appointment, clear the appointment selection
		if (record) {
			// disable context menu on private appointments
			if(record.get('access') === 0) {
				return;
			}

			if (record.phantom !== true) {
				this.rangeSelectionModel.clearSelections();
				this.selectionModel.selectRecord(record, false);
			}
		} else {
			if (range) {
				record = this.model.createRecord(calendar.getSelectedFolder(), range);
				this.rangeSelectionModel.set(range, calendar);
			}

			this.selectionModel.clearSelections();
		}

		this.fireEvent('contextmenu', event, record);
	},

	/**
	 * Delegates the 'dblclick' event, which fires when the user double-clicks on the panel.
	 * @param {Zarafa.calendar.ui.AbstractCalendarDaysView} calendar Calendar view
	 * @param {Ext.EventObject} event Mouse event object
	 * @param {Zarafa.core.data.IPMRecord} record If the user double-clicked on an appointment,
	 * this will contain the IPMRecord of the appointment in question. Otherwise undefined.
	 * @private
	 */
	onDoubleClick : function(calendar, event, record)
	{
		if (record) {
			// disable dblclick on private appointments
			if (record.get('access') === 0) {
				return;
			}

			// If the user clicked on an appointment, make that appointment selected.
			if (record.phantom !== true) {
				this.selectionModel.selectRecord(record, false);
				this.rangeSelectionModel.clearSelections();
			}
		} else {
			this.selectionModel.clearSelections();
		}

		this.fireEvent('dblclick', event, record);
	},

	/**
	 * Delegates the 'dayclick' event, which fires when the user clicks on a day header.
	 * @param {Zarafa.calendar.ui.AbstractCalendarView} source Source calendar view.
	 * @param {Date} date Date of the day that was selected.
	 */
	onDayClick : function(source, date)
	{
		this.fireEvent('dayclick', source, date);
	},

	/**
	 * @return {Number} the height in pixels of a single hour. Depends on the zoom level.
	 */
	getHourHeight : function()
	{
		return (60 / this.zoomLevel) * this.timeUnitHeight;
	},

	/**
	 * Determines the width of the border. If there is more than one folder visible in the view borders are shown
	 * around the views, and this function will return the default border with. Used by the layout mechanism.
	 * @return {Number} Width in pixels of the calendar view borders. If zero, borders should not be shown.
	 */
	getBorderWidth : function()
	{
		return this.showBorder ? this.borderWidth : 0;
	},

	/**
	 * Determines the height in pixels of the tab area. If there is more than one folder visible in the view tabs are shown,
	 * and this function will return the default tab area height. It will return zero otherwise. Used by the layout mechanism.
	 * @return {Number} Height in pixels of the tab area.
	 * @private
	 */
	getTabAreaHeight : function()
	{
		return this.showBorder ? this.tabAreaHeight : 0;
	},

	/**
	 * Determines the height in pixels of the header area by finding the maximum of the vertical space required by
	 * the child views to show all their appointments. Used by the layout mechanism.
	 * @return {Number} Height in pixels of the header area.
	 * @private
	 */
 	getHeaderAreaHeight : function()
	{
		// Find the largest header height for all the child calendar views
		var headerHeight = 0;

		for (var i=0, calendar; calendar=this.calendars[i]; i++) {
			headerHeight = Math.max(headerHeight, calendar.getDesiredHeaderHeight());
		}

		return headerHeight;
	},

	/**
	 * Renders the view. The view will be rendered to the view container.
	 * @param {Ext.Element} container The Ext.Element into which the view must be rendered.
	 */
	render : function(container)
	{
		if (this.rendered) {
			return;
		}

		container.addClass(this.getClassName('body'));

		// Create areas
		this.createDiv(container, 'tab', this.getClassName('tabarea'));
		this.createDiv(container, 'header', this.getClassName('header', undefined, 'scrollable'));
		this.createDiv(container, 'scrollable', this.getClassName('scrollable', undefined, 'zoom-' + this.zoomLevel + 'm'));
		this.createDiv(container, 'bottom', this.getClassName('bottomarea'));

		// Little gray line on top of the time strips
		this.createDiv(container, 'headerLine', this.getClassName('headerLine'));

		this.scrollable.ddScrollConfig = {
			vthresh: 50,
			hthresh: -1,
			frequency: 100,
			increment: 100
		};

		this.header.ddScrollConfig = {
			vthresh: 50,
			hthresh: -1,
			frequency: 100,
			increment: 100
		};

		Zarafa.calendar.ui.CalendarMultiView.superclass.render.call(this, container);

		this.renderChildren();

		// Fake the 'viewmodechange' event, to make sure we initialize the correct view.
		// If the store already has some data loaded, the onViewModeChange will also
		// load this for us into the view.
		this.onViewModeChanged(this.context, this.context.getCurrentViewMode());
	},

	/**
	 * Binds a store to the view, making the view represent the contents of that store and respond to changes in that store.
	 * It hooks event handlers to various events such as load, item CRUD, clear, etc. If the view is already connected to a store,
	 * this store is first unbound by unhooking said event listeners.
	 * <p>
	 * If the new store replaces a previous store, and if that store has its autoDestroy property set to true, that store will
	 * be destroyed.
	 * <p>
	 * @param {Zarafa.core.data.IMPStore} store Store to bind to this view.
	 */
	bindStore : function(store)
	{
		if (this.store == store) {
			return;
		}

		// bind events for the new store
		if (Ext.isDefined(store)) {
			this.mon(store, {
				'beforeload': this.onBeforeLoad,
				'load': this.onLoad,
				'add': this.onAdd,
				'remove': this.onRemove,
				'update': this.onUpdate,
				scope: this
			});
		}

		this.store = store;

		// If the store already contains loaded data, then we must
		// apply all data into the view now.
		if (store && store.lastOptions && !store.isExecuting('list')) {
			this.onLoad(store, store.getRange(), store.lastOptions);
		}
	},

	/**
	 * Release the store which was previously bound using {@link #bindStore}
	 *
	 * @param {Zarafa.core.data.IPMStore} store Store to release from this view.
	 */
	releaseStore : function(store)
	{
		if (Ext.isDefined(store)) {
			this.mun(store, {
				'beforeload': this.onBeforeLoad,
				'load': this.onLoad,
				'add': this.onAdd,
				'remove': this.onRemove,
				'update': this.onUpdate,
				scope: this
			});
		}

		// Destroy the store if autoDestroy is set to true.
		if (store && store.autoDestroy) {
			store.destroy();
		}

		this.store = undefined;
	},

	/**
	 * Positions the DOM elements that make up the four separate areas of the view (tab, header, scrollable (body), bottom).
	 * @param {Boolean} skipResizingScrollPosition True will skip resizing scrollbar position.
	 * @private
	 */
	resizeAreas : function(skipResizingScrollPosition)
	{
		var tabHeight = this.getTabHeight();

		var headerTop = tabHeight;
		var headerHeight = this.getHeaderAreaHeight();
		if(this.showTimeStrips) {
			// limit height of the header area to half of the total height
			// after that scroller will be shown
			headerHeight = Math.min(headerHeight, this.container.getHeight() / 2);
		}
		var scrollableTop = headerTop + headerHeight;
		var scrollableHeight = this.container.getHeight() - scrollableTop - this.getBorderWidth();
		if (this.showTimeStrips) {
			scrollableHeight = Math.min(scrollableHeight, this.getHourHeight() * this.numHours);
		}
		var bottomTop = scrollableHeight + scrollableTop;

		// Set bounds for the tab area
		this.tab.setLeftTop(0, 0);
		this.tab.setSize(this.container.getWidth(), tabHeight);

		// Set bounds for the header area
		this.header.setLeftTop(0, headerTop);
		this.header.setSize(this.container.getWidth(), headerHeight);

		// Set bounds for the scrollable area
		this.scrollable.setLeftTop(0, scrollableTop);
		this.scrollable.setSize(this.container.getWidth(), scrollableHeight);
		// fistWorkingHour and lastWorkingHour are expressed in minutes,
		// so divide by 60 to get the number of hours. We don't need to
		// round the value because that way we can support having time
		// which is not an entire hour (9:30 for example).
		if (this.showTimeStrips && !skipResizingScrollPosition) {
			var targetScrollHeight = (this.firstWorkingHour / 60) * this.getHourHeight();
			this.scrollable.scrollTo('top', targetScrollHeight);
		}

		// Set bounds for the bottom area
		this.bottom.setLeftTop(0, bottomTop);
		this.bottom.setSize(this.container.getWidth(), this.getBorderWidth());

		for (var i=0, timeStrip; timeStrip=this.timeStrips[i]; i++)
		{
			timeStrip.setLeftMargin((this.timeStripWidth + this.timeStripGap) * i - this.timeStripShift);
			timeStrip.setWidth(this.timeStripWidth);
		}

		// Set bounds for the header line area (the little gray line above the
		// time strips)
		var totalTimeStripsWidth = this.showTimeStrips?(this.timeStrips.length * this.timeStripWidth + (this.timeStrips.length-1) * this.timeStripGap - this.timeStripShift):0;
		this.headerLine.setLeftTop(0, scrollableTop - this.headerLineHeight);
		this.headerLine.setSize(totalTimeStripsWidth, this.headerLineHeight);
	},

	/**
	 * Lays out the view, setting the position and size of the individual DOM elements.
	 * It calculates the positions of the child calendar views and calls layout on them.
	 * @protected
	 */
	onLayout : function()
	{
		this.resizeAreas();

		this.scrollable.dom.style.overflowY = this.showTimeStrips ? 'scroll' : 'hidden';
		if(this.showTimeStrips && (this.getHeaderAreaHeight() > this.container.getHeight() / 2)) {
			this.header.dom.style.overflowY = 'scroll';
		} else {
			this.header.dom.style.overflowY = 'hidden';
		}

		if (!this.showTimeStrips) {
			this.scrollable.scrollTo('top', 0);
			this.header.scrollTo('top', 0);
		}

		Ext.dd.ScrollManager.unregister(this.scrollable);
		Ext.dd.ScrollManager.unregister(this.header);
		// Register the scrollable element or not based on the viewMode.
		if(this.context.getCurrentViewMode() === Zarafa.calendar.data.ViewModes.DAYS){
			Ext.dd.ScrollManager.register(this.scrollable);
			Ext.dd.ScrollManager.register(this.header);
		}

		// Layout time strip UI elements
		for (var i=0, timeStrip; timeStrip=this.timeStrips[i]; i++) {
			timeStrip.setVisible(this.showTimeStrips);
		}

		// Layout calendar UI elements
		var totalTimeStripsWidth = this.showTimeStrips?(this.timeStrips.length * this.timeStripWidth + (this.timeStrips.length-1) * this.timeStripGap - this.timeStripShift):0;
		var totalCalendarWidth = this.scrollable.dom.clientWidth - totalTimeStripsWidth - (this.calendars.length - 1) * this.calendarGap;
		var calendarWidth = totalCalendarWidth/this.calendars.length + this.calendarGap;
		for (var i=0, calendar; calendar=this.calendars[i]; i++)
		{
			var left = Math.round(calendarWidth * i + totalTimeStripsWidth);
			var right = Math.round(calendarWidth * (i+1) + totalTimeStripsWidth - this.calendarGap);
			calendar.setActive(this.model.getActiveGroup() == calendar.groupId);
			calendar.setCanMerge(i > 0);
			calendar.setCanClose(this.folders.length>1);
			calendar.setLeftMargin(left);
			calendar.setWidth(right - left);
		}
	},

	/**
	 * Called just after this Calendar multiview has been {@link #layout layed out}.
	 * @protected
	 */
	onAfterLayout : function()
	{
		this.layoutChildren();
	},

	/**
	 * Finds the child calendar view that is currently showing the given folder.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder Folder to find.
	 * @return {Zarafa.calendar.ui.AbstractCalendarView} the calendar view that contains the given folder or undefined if not found.
	 * @private
	 */
	getCalendarViewByFolder : function(folder)
	{
		for (var i=0, calendar; calendar = this.calendars[i]; i++) {
			if (calendar.containsFolder(folder)) {
				return calendar;
			}
		}

		return undefined;
	},

	/**
	 * Creates a new calendar view showing a given folder. The type (days view, box view) depends on
	 * the current value of this.calendarViewConstructor.
	 * @param {String} groupId The group from {@link Zarafa.core.MultiFolderContextModel#getGroupings} for which this calendar is created.
	 * @param {Mixed} folders MAPI folder(s) to show in the newly created calendar view. Can either a single {@link Zarafa.hierarchy.data.MAPIFolderRecord folder} or an array.
	 * @private
	 */
	createCalendarView : function(groupId, folders)
	{
		if (!Ext.isEmpty(folders) && !Array.isArray(folders)) {
			folders = [ folders ];
		}

		var calendarView = new this.calendarViewConstructor({
			selectionModel : this.selectionModel,
			rangeSelectionModel : this.rangeSelectionModel,
			enableDD: this.enableDD,
			groupId : groupId,
			contextModel : this.model
		});

		this.mon(calendarView, {
			'appointmentcalendardrop': this.onAppointmentCalendarDrop,
			'appointmentmouseover': this.onAppointmentMouseOver,
			'appointmentmouseout': this.onAppointmentMouseOut,
			'appointmentmove': this.onAppointmentMove,
			'appointmentresize': this.onAppointmentResize,
			'appointmentcreate': this.onAppointmentCreate,
			'appointmentinitdrag': this.onAppointmentInitDrag,
			'appointmentenddrag': this.onAppointmentEndDrag,
			'contextmenu': this.onContextMenu,
			'dblclick': this.onDoubleClick,
			'dayclick': this.onDayClick,
			'activate': this.onCalendarActivate,
			'merge': this.onCalendarMerge,
			'separate': this.onCalendarSeparate,
			'close': this.onCalendarClose,
			scope: this
		});

		if (folders) {
			Ext.each(folders, calendarView.addFolder, calendarView);
		}

		this.addChildView(calendarView);
		this.calendars.push(calendarView);

		// render the view (adds the neccesairy UI components)
		if (this.rendered) {
			calendarView.render(this.container);
		}

		return calendarView;
	},

	/**
	 * Removes a calendar view, unhooking event handlers and destroying it.
	 * @param {Zarafa.calendar.ui.AbstractCalendarView} calendar calendar to remove
	 * @private
	 */
	removeCalendarView : function(calendar)
	{
		this.calendars.remove(calendar);

		this.mun(calendar, {
			'appointmentcalendardrop': this.onAppointmentCalendarDrop,
			'appointmentmouseover': this.onAppointmentMouseOver,
			'appointmentmouseout': this.onAppointmentMouseOut,
			'appointmentmove': this.onAppointmentMove,
			'appointmentresize': this.onAppointmentResize,
			'appointmentcreate': this.onAppointmentCreate,
			'appointmentinitdrag': this.onAppointmentInitDrag,
			'appointmentenddrag': this.onAppointmentEndDrag,
			'contextmenu': this.onContextMenu,
			'dblclick': this.onDoubleClick,
			'dayclick': this.onDayClick,
			'activate': this.onCalendarActivate,
			'merge': this.onCalendarMerge,
			'separate': this.onCalendarSeparate,
			'close': this.onCalendarClose,
			scope: this
		});

		this.removeChildView(calendar, true);
	},

	/**
	 * Removes folders from calendars that are not in the input folder list. Calendars that become 'empty' (don't display any folders) are removed.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord[]} list of folders.
	 * @private
	 */
	pruneCalendarViews : function(folders)
	{
		// Go over all the calendar views and prune any IDs that are not in the list.
		var calendars = this.calendars.clone();
		for (var i=0, calendar; calendar = calendars[i]; i++) {
			var calendarFolders = calendar.getFolders().clone();
			for (var j=0, calendarFolder; calendarFolder=calendarFolders[j]; j++) {
				if (folders.indexOf(calendarFolder) == -1) {
					this.model.removeFolderFromGroup(calendarFolder, calendar.groupId);
					calendar.removeFolder(calendarFolder);
				}
			}

			// If the view is empty, remove it completely
			this.removeCalendarViewIfEmpty(calendar);
			if (!calendar.isDestroyed) {
				this.updateActiveFolder(calendar);
			}
		}
	},


	/**
	 * Creates new child calendar views to make sure that all the MAPI folders given in the input are represented on screen.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord[]} list of folders.
	 * @private
	 */
	createCalendarViews : function(folders)
	{
		var grouping = this.model.getGroupings();

		// If we find grouping as an empty object, then we need to generate grouping variable again
		// As without grouping variable it won't load the calendar views, and sometime groupings are
		// malformed in settings which will rise this situation
		if(!Ext.isDefined(grouping) || Object.keys(grouping).length === 0) {
			this.model.resetGroupings();
			this.model.applyGrouping();
			grouping = this.model.getGroupings();
		}

		Ext.iterate(grouping, function(key, group) {
			var groupFolders = [];

			if(Ext.isEmpty(group.folders)) {
				// continue looping for other groups
				return true;
			}

			for (var j = 0; j < folders.length; j++) {
				if (group.folders.indexOf(folders[j].get('entryid')) > -1) {
					groupFolders.push(folders[j]);
				}
			}

			if (!Ext.isEmpty(groupFolders)) {
				var folder = groupFolders[0];
				var targetCalendar = this.getCalendarViewByFolder(folder);
				if (targetCalendar) {
					// We have a target calendar, if our folder is the only occupant,
					// then we can re-use the calendar. Otherwise we create a new
					// calendar view and move the folder.
					if (targetCalendar.folders.length > 1) {
						var newCalendar = this.createCalendarView(key);

						this.moveFolder(targetCalendar, newCalendar, folder);
						targetCalendar = newCalendar;
					} else {
						// Check if the groupId is different, if that is the case,
						// deregister the old ID so we can apply the new one.
						if (targetCalendar.groupId !== key) {
							targetCalendar.groupId = key;
						}
					}
				} else {
					// This is a new folder for which no calendar yet exists,
					// create a new calendar view.
					targetCalendar = this.createCalendarView(key, folder);
				}

				// Now have the view into which all folders should be loaded,
				// go over the remaining items in the group.
				for (var j = 1; j < groupFolders.length; j++) {
					var addFolder = groupFolders[j];

					var sourceCalendar = this.getCalendarViewByFolder(addFolder);
					if (sourceCalendar && sourceCalendar !== targetCalendar) {
						// The folder already exists in another calendar view,
						// officially move the folder to the new target (this will
						// cleanup the old calendar if needed).
						this.moveFolder(sourceCalendar, targetCalendar, addFolder);
					} else if (!sourceCalendar) {
						// This is a new folder, so it can be added to the view
						// without problems.
						targetCalendar.addFolder(addFolder);
					}
				}

				targetCalendar.setSelectedFolder(targetCalendar.getFolderById(group.active));
			}
		}, this);
	},

	/**
	 * Sorts the child calendar views. Makes sure that the view are laid out from left to right in the same order
	 * as they appear in the load request (which is the order in which they appear in the folder tree).
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord[]} list of folders. The order of the calendar views will be according to the order of the folders in this list.
	 * @private
	 */
	sortCalendarViews : function(folders)
	{
		var calendars = [];

		// Run over the list of folders and find for each folder a calendar view that goes with it.
		// The views are added in sequence to the calendars list and in this way are ordered in the same
		// way als the folders in the input list. And yeah, I know this is O(n^2), but n is small, so meh :)
		for (var i=0, folder; folder = folders[i]; i++)
		{
			var calendarView = this.getCalendarViewByFolder(folder);
			if (calendarView && calendars.indexOf(calendarView) == -1) {
				calendars.push(calendarView);
			}
		}

		// Sort the tabs on the calendars.
		for (var i=0, calendar; calendar=calendars[i]; i++) {
			calendar.sortFolders(folders);
		}

		this.calendars = calendars;
	},

	/**
	 * Manages the child calendar views. Removes folders from views that are not currently loaded,
	 * and adds new views for folders that are not yet represented.
	 * @private
	 */
	manageCalendarViews : function()
	{
		// Remove calendar views that are not in the folder list.
		this.pruneCalendarViews(this.folders);

		// Add new calendar views for folders that are currently not displayed.
		this.createCalendarViews(this.folders);

		// Sorts the calendars based on the order of their folders in the hierarchy model.
		this.sortCalendarViews(this.folders);
	},

	/**
	 * Handles the {@link Zarafa.core.data.IPMStore#beforeload beforeload} event from the appointment {@link #store store}.
	 * @param {Zarafa.core.data.IPMStore} store store that fired the event.
	 * @param {Object} options the options (parameters) with which the load was invoked.
	 * @private
	 */
	onBeforeLoad : function(store, options)
	{
		if (!this.rendered) {
			return;
		}

		// Call beforeLoad on all child calendars.
		for (var i = 0, len = this.calendars.length; i < len; i++) {
			this.calendars[i].beforeAppointmentsLoad(store, options);
		}

		// Force layout.
		this.layout();
	},

	/**
	 * Called in response to a {@link Zarafa.core.data.IPMStore#load load} event from the appointment {@link #store store}.
	 * @param {Zarafa.core.data.IPMStore} store store that fired the event.
	 * @param {Zarafa.core.data.IPMRecord[]} records loaded record set
	 * @param {Object} options the options (parameters) with which the load was invoked.
	 * @private
	 */
	onLoad : function(store, records, options)
	{
		if (!this.rendered) {
			return;
		}

		this.folders = options.folder || [];
		//always show tab
		this.showBorder = true;
		this.manageCalendarViews();

		// forward the event to the individual calendar views
		for (var i = 0, len = this.calendars.length; i < len; i++) {
			this.calendars[i].onAppointmentsLoad(store, records, options);
		}

		this.layout();
	},

	/**
	 * Called in response to an {@link Zarafa.core.data.IPMStore#add add} event from the appointment {@link #store store}.
	 * @param {Ext.data.Store} store data store
	 * @param {Ext.data.Record} record that was added
	 * @param {String} operation mutation operation key. Equals 'add'
	 * @private
	 */
	onAdd : function(store, record, operation)
	{
		if (Array.isArray(record)) {
			for (var i = 0, len = record.length; i < len; i++) {
				this.onAdd(store, record[i], operation);
			}
			return;
		}

		// forward the event to the individual calendar views
		for (var i = 0, len = this.calendars.length; i < len; i++) {
			this.calendars[i].onAppointmentAdd(store, record, operation);
		}
	},

	/**
	 * Called in response to a {@link Zarafa.core.data.IPMStore#remove remove} event from the appointment {@link #store store}.
	 * @param {Ext.data.Store} store data store
	 * @param {Ext.data.Record} record that was added
	 * @param {String} operation mutation operation key. Equals 'remove'
	 * @private
	 */
	onRemove : function(store, record, operation)
	{
		if (Array.isArray(record)) {
			for (var i = 0, len = record.length; i < len; i++) {
				this.onRemove(store, record[i], operation);
			}
			return;
		}

		// forward the event to the individual calendar views
		for (var i = 0, len = this.calendars.length; i < len; i++) {
			this.calendars[i].onAppointmentRemove(store, record, operation);
		}

		// Resize calendar view after removing record.
		if (record.get('alldayevent') === true && Date.diff(Date.DAY, record.get('duedate'), record.get('startdate')) >= 1) {
			this.resizeAreas(true);
		}
	},

	/**
	 * Called in response to an {@link Zarafa.core.data.IPMStore#update update} event from the appointment {@link #store store}.
	 * @param {Ext.data.Store} store data store
	 * @param {Ext.data.Record} record that was added
	 * @param {String} operation mutation operation key. Equals 'update'
	 * @private
	 */
	onUpdate : function(store, record, operation)
	{
		if (Array.isArray(record)) {
			for (var i = 0, len = record.length; i < len; i++) {
				this.onUpdate(store, record[i], operation);
			}
			return;
		}

		// Forward the event to the individual calendar views.
		for (var i = 0, len = this.calendars.length; i < len; i++) {
			var calendar = this.calendars[i];
			var containsAppointment = calendar.containsAppointment(record);
			var shouldContain = calendar.containsFolderId(record.get('parent_entryid'));

			if (containsAppointment && !shouldContain) {
				calendar.onAppointmentRemove(store, record, operation);
			} else if (!containsAppointment && shouldContain) {
				calendar.onAppointmentAdd(store, record, operation);
			} else {
				this.calendars[i].onAppointmentUpdate(store, record, operation);
			}
		}
	},

	/**
	* Checks if a calendar view is empty and removes it if that's the case. This may happen when a merge or close
	* event removes a folder from a view.
	* @param {Zarafa.calendar.ui.AbstractCalendarView} calendar The calendar to remove.
	* @private
	*/
	removeCalendarViewIfEmpty : function(calendar)
	{
		if (calendar.getFolders().length === 0) {
			this.removeCalendarView(calendar);
		}
	},

	/**
	 * Moves a folder from one calendar view to another. If the source calendar view ends up empty, it is destroyed.
	 * This method does not force a layout, nor register the change to the {@link #model}.
	 * @param {Zarafa.calendar.ui.AbstractCalendarView} sourceCalendar Source calendar view.
	 * @param {Zarafa.calendar.ui.AbstractCalendarView} targetCalendar Target calendar view.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder MAPI folder to move.
	 * @private
	 */
	moveFolder : function(sourceCalendar, targetCalendar, folder)
	{
		// Move the folder to the calendar view that goes before it in the list.
		targetCalendar.addFolder(folder);

		// Move all the appointments from the source calendar view to the target calendar view.
		var records = sourceCalendar.getAppointmentRecords().clone();
		for (var i=0, record; record=records[i]; i++) {
			if (Zarafa.core.EntryId.compareEntryIds(record.get('parent_entryid'), folder.get('entryid'))) {
				sourceCalendar.removeAppointment(record, false);
				targetCalendar.addAppointment(record, false);
			}
		}

		// Sort the tabs of the calendar the folder has moved to.
		targetCalendar.sortFolders(this.folders);
		targetCalendar.setActive(true);
		// Remove the folder from the calendar and remove it from the view if it is now empty.
		sourceCalendar.removeFolder(folder);
		this.removeCalendarViewIfEmpty(sourceCalendar);
		if (!sourceCalendar.isDestroyed) {
			this.updateActiveFolder(sourceCalendar);
			sourceCalendar.setActive(false);
		}
	},

	/**
	 * Merges a folder from one calendar view to another.
	 * If the source calendar view ends up empty, it is destroyed.
	 * This method does not force a layout, but does
	 * {@link Zarafa.calendar.CalendarContextModel#mergeFolderToGroup register}
	 * the change to the {@link #model}.
	 * @param {Zarafa.calendar.ui.AbstractCalendarView} sourceCalendar Source calendar view.
	 * @param {Zarafa.calendar.ui.AbstractCalendarView} targetCalendar Target calendar view.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder MAPI folder to move.
	 * @private
	 */
	mergeFolder : function(sourceCalendar, targetCalendar, folder)
	{
		this.model.mergeFolderToGroup(folder, targetCalendar.groupId, sourceCalendar.groupId);
		this.moveFolder(sourceCalendar, targetCalendar, folder);
	},

	/**
	 * Separates a folder from one calendar view to a new calendar.
	 * If the source calendar view ends up empty, it is destroyed.
	 * This method does not force a layout, but does
	 * {@link Zarafa.calendar.CalendarContextModel#separateFolderFromGroup register}
	 * the change to the {@link #model}.
	 * @param {Zarafa.calendar.ui.AbstractCalendarView} sourceCalendar Source calendar view.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder MAPI folder to move.
	 * @private
	 */
	separateFolder : function(sourceCalendar, folder)
	{
		// Create a new calendar view.
		var newGroupId = this.model.separateFolderFromGroup(folder, sourceCalendar.groupId);
		var newCalendar = this.createCalendarView(newGroupId);

		// Move the folder to the newly created calendar.
		this.moveFolder(sourceCalendar, newCalendar, folder);
	},

	/**
	 * Check the {@link #model} {@link Zarafa.core.MultiFolderContextModel#getGroupings groupings}
	 * to {@link Zarafa.calendar.ui.AbstractCalendarView#setSelectedFolder apply} the new active
	 * folder to the calendar.
	 * @param {Zarafa.calendar.ui.AbstractCalendarView} calendar The calendar to update
	 * @private
	 */
	updateActiveFolder : function(calendar)
	{
		var group = this.model.getGroupings()[calendar.groupId];
		if (group && group.active) {
			calendar.setSelectedFolder(calendar.getFolderById(group.active));
		}
	},

	/**
	 * Handles the {@link Zarafa.calendar.ui.AbstractCalendarView#activate} event
	 * from one of the {@link #calendars calendar views}.
	 * @param {Zarafa.calendar.ui.AbstractCalendarView} calendar event source.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder which was activated
	 * @private
	 */
	onCalendarActivate : function(calendar, folder)
	{
		this.model.activateFolderInGroup(folder, calendar.groupId);
		this.model.setActiveFolder(folder);
		// Only redraw tabs
		for (var i = 0, len = this.calendars.length; i < len; i++) {
			this.calendars[i].setActive(this.model.getActiveGroup() == this.calendars[i].groupId);
			this.calendars[i].layoutTabs();
		}
	},

	/**
	 * Handles a 'merge' event from one of the calendar views.
	 * @param {Zarafa.calendar.ui.AbstractCalendarView} calendar event source.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder folder to merge.
	 * @private
	 */
	onCalendarMerge: function(calendar, folder)
	{
		// Find the index of the calendar view that fired the event in the local calendar view list.
		var calendarIndex = -1;
		for (var i=0, cal; cal=this.calendars[i]; i++) {
			if (cal == calendar) {
				calendarIndex = i;
			}
		}

		// If the calendar view is the first (left most) one, don't do anything and return.
		if (calendarIndex < 1) {
			return;
		}

		var targetCalendar = this.calendars[calendarIndex - 1];
		// Move the folder to the target calendar.
		this.mergeFolder(calendar, targetCalendar, folder);

		this.sortCalendarViews(this.folders);

		this.layout();
	},

	/**
	 * Handles a 'separate' event from one of the calendar views.
	 * @param {Zarafa.calendar.ui.AbstractCalendarView} calendar event source.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder folder to separate.
	 * @private
	 */
	onCalendarSeparate : function(calendar, folder)
	{
		// Check if the calendar view has more than one folder. If it has only one, there is no need to separate
		// as it would have no effect.
		if (calendar.getFolders().length == 1) {
			return;
		}

		// Move the folder to a new calendar.
		this.separateFolder(calendar, folder);

		this.sortCalendarViews(this.folders);

		this.layout();
	},

	/**
	 * Handles a 'close' event from one of the calendar views.
	 * @param {Zarafa.calendar.ui.AbstractCalendarView} calendar event source.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder folder to close.
	 * @private
	 */
	onCalendarClose : function(calendar, folder)
	{
		this.fireEvent('calendarclose', folder);
	},

	/**
	 * Called when the View is being destroyed.
	 * @protected
	 */
	onDestroy : function()
	{
		Zarafa.calendar.ui.CalendarMultiView.superclass.onDestroy.apply(this, arguments);

		if (this.scrollable) {
			Ext.dd.ScrollManager.unregister(this.scrollable);
		}

		if (this.header) {
			Ext.dd.ScrollManager.unregister(this.header);
		}

		// Remove the tooltip when the view is destroyed
		if ( this.tooltip ){
			this.tooltip.destroy();
		}
	}
});
