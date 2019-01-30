/*
 * #dependsFile client/zarafa/calendar/data/SnapModes.js
 * #dependsFile client/zarafa/calendar/data/DragStates.js
 */
Ext.namespace('Zarafa.calendar.ui');

/**
 * @class Zarafa.calendar.ui.CalendarViewDropZone
 * @extends Ext.dd.DropZone
 *
 * A special DropZone which supports dragging appointments over the calendar.
 * The calendar is represented using a special {@link Zarafa.calendar.ui.AbstractDateRangeView}
 * which can visualize the daterange which is selected or will be occupied by the selected
 * appointment.
 */
Zarafa.calendar.ui.CalendarViewDropZone = Ext.extend(Ext.dd.DropZone, {
	/**
	 * @cfg {String} The CSS class returned to the drag source when drop is allowed
	 * while the user has the Ctrl-key pressed (defaults to "x-dd-drop-ok-add").
	 */
	dropAllowedAdd : 'x-dd-drop-ok-add',

	/**
	 * @cfg {Boolean} headerMode True of this DropZone is installed on the header of
	 * the calendar, or in the body. This determines if the {@link Zarafa.calendar.ui.AbstractCalendarView#header}
	 * or {@link Zarafa.calendar.ui.AbstractCalendarView#body} will be used to connect the event handlers.
	 */
	headerMode : false,

	/**
	 * @cfg {Zarafa.calendar.data.SnapModes} selectingSnapMode The snapmode for selections and resizing.
	 * If this is {@link Zarafa.calendar.data.SnapModes#ZOOMLEVEL} then appointments or selections that
	 * are resized are snapped to the time which matches the
	 * {@link Zarafa.calendar.ui.AbstractCalendarView#getZoomLevel zoomlevel}. When this option is
	 * {@link Zarafa.calendar.data.SnapModes#DAY} the time is snapped to the entire day.
	 */
	selectingSnapMode : Zarafa.calendar.data.SnapModes.ZOOMLEVEL,

	/**
	 * @cfg {Zarafa.calendar.data.SnapModes} draggingSnapMode The snapmode for appointments when dragging.
	 * If this is {@link Zarafa.calendar.data.SnapModes#ZOOMLEVEL} then appointments are snapped to the
	 * time which matches the {@link Zarafa.calendar.ui.AbstractCalendarView#getZoomLevel zoomlevel}.
	 * When this option is {@link Zarafa.calendar.data.SnapModes#DAY} the appointments are snapped
	 * to the entire day.
	 */
	draggingSnapMode : Zarafa.calendar.data.SnapModes.ZOOMLEVEL,

	/**
	 * The proxy which must be used to display the selected range.
	 * @property
	 * @type Zarafa.calendar.ui.AbstractDateRangeView
	 * @private
	 */
	proxy : undefined,

	/**
	 * The current Drag & Drop State. This influences the way how the dragged appointment
	 * is being treated (dragging, resizing, selecting).
	 * @property
	 * @type Zarafa.calendar.data.DragStates
	 * @private
	 */
	state : Zarafa.calendar.data.DragStates.NONE,

	/**
	 * The daterange which reflects the size of the selected range. This equals
	 * the DateRange in the {@link #proxy}.
	 * @property
	 * @type Zarafa.core.DateRange
	 * @private
	 */
	dateRange : undefined,

	/**
	 * The {@link Date} object which represents the exact start date on which the user
	 * {@link #onNodeEnter entered} this region.
	 * @property
	 * @type Date
	 * @private
	 */
	initDate : undefined,

	/**
	 * The {@link Zarafa.core.DateRange DateRange} of the selection area on which the
	 * user {@link #onNodeEnter entered} this region.
	 * @property
	 * @type Zarafa.core.DateRange
	 * @private
	 */
	initDateRange : undefined,

	/**
	 * @constructor
	 * @param {Zarafa.calendar.ui.AbstractCalendarView} calendar The calendar on which this Dropzone is installed
	 * @param {Object} config Configuration object
	 */
	constructor : function(calendar, config)
	{
		config = config || {};

		this.calendar = calendar;

		var element = this.calendar.body;
		if (config.headerMode === true) {
			element = this.calendar.header;
		}

		Ext.applyIf(config, {
			ddGroup : 'AppointmentDD'
		});

		Zarafa.calendar.ui.CalendarViewDropZone.superclass.constructor.call(this, element, config);
	},

	/**
	 * Returns a custom data object associated with the DOM node that is the target of the event.
	 * This will return the element on which this DropZone has been installed.
	 * @param {Ext.EventObject} The event
	 * @returns {Object} The custom data
	 * @protected
	 */
	getTargetFromEvent: function(e)
	{
		// Check if the cursor is over the visible part of the
		// element on which this dropzone is installed. For the
		// header this is simple as there is no scrollbar active.
		// For the body, we must check if the cursor is over the
		// hidden part of the body (in which case, the body is
		// not considered the target).
		var element = this.el;
		if (this.headerMode !== true) {
			var parentElement = this.el.parent();

			if (e.getPageY() < parentElement.getTop() || parentElement.getBottom() < e.getPageY()) {
				element = undefined;
			}
		}

		return element;
	},

	/**
	 * Called when the DropZone determines that a {@link Ext.dd.DragSource} has entered a drop node
	 * that has either been registered or detected by a configured implementation of
	 * {@link #getTargetFromEvent}.
	 * This function will disable the {@link Ext.dd.DragZone#proxy} and will let the
	 * local {@link #proxy} handle the visualization.
	 * @param {Ext.Element} target The custom data associated with the drop node (as returned from {@link #getTargetFromEvent}.
	 * @param {Ext.dd.DragSource} The drag source that was dragged over this drop zone
	 * @param {Ext.EventObject} e The event
	 * @param {Object} data An object containing arbitrary data supplied by the drag source
	 * @protected
	 */
	onNodeEnter : function(target, dd, e, data)
	{
		var appointment = data.selections[0];
		var DragStates = Zarafa.calendar.data.DragStates;

		// If the appointment was being resized, but this dropzone is
		// on a different calendar then the dragzone, then we fallback
		// to dragging (as we can't resize from one calendar to another).
		this.state = data.state;
		if (this.state === DragStates.RESIZING_START || this.state === DragStates.RESIZING_DUE || this.state === DragStates.SELECTING) {
			if (this.calendar !== dd.calendar) {
				this.state = DragStates.DRAGGING;
			}
		}

		if (appointment) {
			// We are currently working with an appointment which is either being dragged or resized.
			// Initialize the initDate based on the appointment. Note that in this case we don't need
			// to be very accurate about the date.
			if (data.state === DragStates.RESIZING_START || data.state === DragStates.DRAGGING) {
				this.initDate = appointment.get('startdate');
			} else {
				this.initDate = appointment.get('duedate');
			}

			// The selected range will always be the entire appointment.
			this.initDateRange = new Zarafa.core.DateRange({ startDate : appointment.get('startdate'), dueDate : appointment.get('duedate') });
		} else {
			// We are not working with an appointment, and thus are selecting a daterange.
			// Determine what the basic selection should be based on the current zoomLevel.
			var zoomLevel = this.calendar.getZoomLevel();

			// The initial date is the exact date on which this events starts. Note that
			// for the header events, this date will be moved to the start of the selected
			// day.
			this.initDate = this.calendar.screenLocationToDate(e.getPageX(), e.getPageY());

			var dueDate, startDate;

			// Now we start detecting the range which should be selected by default.
			if (this.snapMode === Zarafa.calendar.data.SnapModes.DAY) {
				// For the snapMode DAY, the initDate will have been rounded to
				// the start of the day (but for safety we ensure that it will be anyway),
				// the dueDate will always be exactly 1 day after the start. This way
				// we select a single day by default.
				startDate = this.initDate.clearTime(true);
				dueDate = startDate.add(Date.DAY, 1);
			} else {
				// For the snapMode ZOOMLEVEL we must select a region the size of the zoomLevel.
				// This is easiest down by using floor() for the initDate to obtain the start,
				// and then add the zoomLevel to it to obtain the dueDate.
				startDate = this.initDate.clone().floor(Date.MINUTE, zoomLevel);
				dueDate = startDate.add(Date.MINUTE, zoomLevel);
			}

			this.initDateRange = new Zarafa.core.DateRange({ startDate : startDate, dueDate : dueDate });
		}

		// Activate the initial range
		this.dateRange = this.initDateRange.clone();

		// Change the function from the prototype to update the scope of the function.
		// This is needed to ensure we can call removeEventListener again with the correct
		// function reference later.
		this.onDragKeyDown = Zarafa.calendar.ui.CalendarViewDropZone.prototype.onDragKeyDown.createDelegate({ dd : dd, dz : this });
		this.onDragKeyUp = Zarafa.calendar.ui.CalendarViewDropZone.prototype.onDragKeyUp.createDelegate({ dd : dd, dz : this });

		// During dragging (onNodeOver) we either apply dropAllowed or dropAllowedAdd based on the Ctrl-key,
		// if the user didn't drag but just presses the button we must also update the icon. For that we
		// have these 2 event handlers.
		Ext.EventManager.on(Ext.getDoc(), 'keydown', this.onDragKeyDown, this);
		Ext.EventManager.on(Ext.getDoc(), 'keyup', this.onDragKeyUp, this);

		// Update the proxy
		this.proxy.setShowTime(this.selectingSnapMode === Zarafa.calendar.data.SnapModes.ZOOMLEVEL);
		this.proxy.setDateRange(this.dateRange);
		this.updateProxy(e.getXY(), data.selections);

		// DragZone is placed on the same calendar or different calendar DropZone,
		// we will disable the default proxy of the DragZone and activate
		// our own as replacement.
        dd.proxy.hide();
        this.proxy.setVisible(true);
	},

	/**
	 * Called while the DropZone determines that a {@link Ext.dd.DragSource} is over a drop node that
	 * has either been registered or detected by a configured implementation of {@link #getTargetFromEvent}.
	 * This function will call {@link #updateProxy} to update the selected range.
	 * @param {Ext.Element} target The custom data associated with the drop node (as returned from {@link #getTargetFromEvent}.
	 * @param {Ext.dd.DragSource} The drag source that was dragged over this drop zone
	 * @param {Ext.EventObject} e The event
	 * @param {Object} data An object containing arbitrary data supplied by the drag source
	 * @protected
	 */
	onNodeOver : function(target, dd, e, data)
	{
		this.updateProxy(e.getXY(), data.selections);

		// If the Crl-key is pressed, return dropAllowedAdd to
		// have the correct icon displayed which represents a copy
		// rather then a move.
		return e.ctrlKey ? this.dropAllowedAdd : this.dropAllowed;
	},

	/**
	 * Called when the DropZone determines that a {@link Ext.dd.DragSource} has been dragged
	 * out of the drop node without dropping.
	 * This function will disable the local {@link #proxy} and hand back the responsibility
	 * of the visualization back to the {@link Ext.dd.DragZone#proxy}.
	 * @param {Ext.Element} target The custom data associated with the drop node (as returned from {@link #getTargetFromEvent}.
	 * @param {Ext.dd.DragSource} The drag source that was dragged over this drop zone
	 * @param {Ext.EventObject} e The event
	 * @param {Object} data An object containing arbitrary data supplied by the drag source
	 * @protected
	 */
	onNodeOut : function(target, dd, e, data)
	{
		// Clear event handlers again
		Ext.EventManager.un(Ext.getDoc(), 'keydown', this.onDragKeyDown, this);
		Ext.EventManager.un(Ext.getDoc(), 'keyup', this.onDragKeyUp, this);

		delete this.initDate;
		delete this.initDateRange;

		this.proxy.setVisible(false);
		dd.proxy.show();
	},

	/**
	 * Event handler which is fired when the user presses a key, this is registered during {@link #onNodeEnter}
	 * and will be released in {@link #onNodeOut} and {@link #onNodeDrop}. When the user presses the Ctrl-key
	 * and the user is allowed to drop the item on this DropZone, we update the icon to {@link #dropAllowedAdd}
	 * to visualize the action will be a copy rather then a move.
	 *
	 * NOTE: This function is called using a special scope. 'this' is an object containing 2 fields,
	 * 'dd' which is the DragZone from where the item is dragged and 'dz' which is the DragZone over which
	 * the item is hovering.
	 *
	 * @param {Ext.EventObject} e The event
	 * @private
	 */
	onDragKeyDown : function(e)
	{
		if (e.ctrlKey || e.keyCode === Ext.EventObject.CONTROL) {
			if (this.dd.proxy.dropStatus === this.dz.dropAllowed) {
				this.dd.proxy.setStatus(this.dz.dropAllowedAdd);
			}
		}
	},

	/**
	 * Event handler which is fired when the user releases a key, this is registered during {@link #onNodeEnter}
	 * and will be released in {@link #onNodeOut} and {@link #onNodeDrop}. When the user releases the Ctrl-key
	 * and the current dropStatus is {@link #dropAllowedAdd} we change it back to {@link #dropAllowed} to visualize
	 * that the action will be a moved.
	 *
	 * NOTE: This function is called using a special scope. 'this' is an object containing 2 fields,
	 * 'dd' which is the DragZone from where the item is dragged and 'dz' which is the DragZone over which
	 * the item is hovering.
	 *
	 * @param {Ext.EventObject} e The event
	 * @private
	 */
	onDragKeyUp : function(e)
	{
		if (e.ctrlKey || e.keyCode === Ext.EventObject.CONTROL) {
			if (this.dd.proxy.dropStatus === this.dz.dropAllowedAdd) {
				this.dd.proxy.setStatus(this.dz.dropAllowed);
			}
		}
	},

	/**
	 * Called when the DropZone determines that a item has been dropped.
	 * This will determine what action has occured and call the appropriate
	 * callback function on the {@link #calendar}.
	 * @param {Ext.Element} target The custom data associated with the drop node (as returned from {@link #getTargetFromEvent}.
	 * @param {Ext.dd.DragSource} The drag source that was dragged over this drop zone
	 * @param {Ext.EventObject} e The event
	 * @param {Object} data An object containing arbitrary data supplied by the drag source
	 * @protected
	 */
	onNodeDrop : function(target, dd, e, data)
	{
		var DragStates = Zarafa.calendar.data.DragStates;
		switch (data.state) {
			case DragStates.SELECTING:
				this.calendar.onSelect(e, this.dateRange);
				break;
			case DragStates.DRAGGING:
				var record = data.target.record;
				if ( record.isMeeting() && record.isMeetingReceived() ) {
					this.showWarningMessageBox(e, dd, data.target, dd.calendar !== this.calendar ? "drop" : "move");
				} else if (dd.calendar !== this.calendar) {
					this.calendar.onDrop(e, dd.calendar, data.target, this.dateRange);
				} else {
					this.calendar.onMove(e, data.target, this.dateRange);
				}
				break;
			case DragStates.RESIZING_START:
			case DragStates.RESIZING_DUE:
				var record = data.target.record;
				if (record.isMeeting() && record.isMeetingReceived() ) {
					this.showWarningMessageBox(e, dd, data.target, "resize");
				} else {
					this.calendar.onResize(e, data.target, this.dateRange);
				}
				break;
		}
	},

	/**
	 * Helper function which show {@link Zarafa.common.dialogs.MessageBox MessageBox}
	 * when attendee is trying to move the meeting.
	 *
	 * @param {Ext.EventObject} event The event
	 * @param {Ext.dd.DragSource} dd The drag source that was dragged over this drop zone
	 * @param {Zarafa.calendar.ui.AppointmentView} appointment The appointment which was dropped
	 * @param {String} action The action can be anything from "move", "drop" or "resize".
	 */
	showWarningMessageBox : function(event, dd, appointment, action)
	{
		var dateRange = this.dateRange;
		Zarafa.common.dialogs.MessageBox.addCustomButtons({
			width: 400,
			title: _('Kopano Webapp'),
			msg : _('Please note that any changes you make will be overwritten when this meeting request is updated by the organizer. Would you like to move this meeting?'),
			icon: Ext.MessageBox.WARNING,
			fn : function(buttonName) {
				if (buttonName === 'move') {
					switch (action) {
						case "move":
							this.calendar.onMove(event, appointment, dateRange);
							break;
						case "drop":
							this.calendar.onDrop(event, dd.calendar, appointment, dateRange);
							break;
						case "resize":
							this.calendar.onResize(event, appointment, dateRange);
							break;
					}
				}
			},
			customButton: [{
				name : 'move',
				text: _('Move')
			}, {
				name : 'cancel',
				text: _('Don\'t move')
			}],
			scope: this
		});
	},

	/**
	 * Recalculate the {@link Zarafa.core.DateRange date values} for the {@link #proxy}. This
	 * will check at which position the mouse is currently hovering, and will update the
	 * start and the dueDate respectively.
	 *
	 * @param {Number|Array} xy The X and Y Coordinates of the cursor position
	 * @param {Zarafa.calendar.AppointmentRecord|Array} The array of currently selected appointments
	 * @private
	 */
	updateProxy : function(xy, selections)
	{
		var selection = !Ext.isEmpty(selections) ? selections[0] : undefined;
		var overDate = this.calendar.screenLocationToDate(xy[0], xy[1]);
		var zoomLevel = this.calendar.getZoomLevel();
		var DragStates = Zarafa.calendar.data.DragStates;
		var moveStart = (this.state === DragStates.SELECTING ||
						 this.state === DragStates.DRAGGING ||
						 this.state === DragStates.RESIZING_START);
		var moveDue = (this.state === DragStates.SELECTING ||
					   this.state === DragStates.DRAGGING ||
					   this.state === DragStates.RESIZING_DUE);
		var startDate = this.dateRange.getStartDate();
		var dueDate = this.dateRange.getDueDate();
		var duration = this.dateRange.getDuration(Date.MINUTE);

		var snapMode;
		// Determine what snapMode we should use to determine what changes
		// need to be made to the start and due date.
		if (this.state === DragStates.DRAGGING){
			snapMode = this.draggingSnapMode;
		} else {
			snapMode = this.selectingSnapMode;
		}

		if(Ext.isDate(overDate)){

			if (snapMode === Zarafa.calendar.data.SnapModes.DAY ) {
				// We must snap the appointment to an entire day
				if (moveStart) {
					// Always floor the startDate to the start of the day
					startDate = overDate.clearTime();

					if (moveDue) {
						// We are moving both the start as well as the dueDate
						// of the selection. In other words we are dragging our selection
						if (!selection) {
							// If we don't have an appointment selected we ensure that the
							// current duration is maintained (without an appointment,
							// the duration is always a single day).
							dueDate = startDate.add(Date.DAY, 1);
						} else if (selection.get('alldayevent')) {
							// We are dragging an allday appointment over the header,
							// simply maintain the duration of the appointment by always
							// updating the dueDate based on the appointment duration.
							dueDate = startDate.add(Date.MINUTE, selection.get('duration'));
						} else {
							// If there is an appointment, but it is an non-allday appointment,
							// we have to resize it to the entire day, as dropping this
							// appointment on the body container will imply a resize of the
							// appointment.
							dueDate = startDate.add(Date.DAY, 1);
						}
					}
				} else {
					// We are only moving the dueDate of the selection. The overDate will always
					// point to the start of the day over which we are hovering, while the dueDate
					// should represent the end of that same day. Hence we always do Date.add().
					dueDate = overDate.add(Date.DAY, 1);
					if (dueDate === startDate) {
						dueDate = dueDate.add(Date.DAY, 1);
					}
				}
			} else if (snapMode === Zarafa.calendar.data.SnapModes.ZOOMLEVEL) {
				// We must snap the appointment to the current zoomLevel
				if (moveStart) {
					// Always floor the startDate to the upper zoomLevel boundary.
					startDate = overDate.floor(Date.MINUTE, zoomLevel);

					if (moveDue) {
						// We are moving both the start as well as the dueDate
						// of the selection. In other words we are dragging our selection
						if (!selection) {
							// If we don't have an appointment selected we ensure that the
							// current duration is maintained (without an appointment,
							// the duration is always the zoomLevel).
							dueDate = startDate.add(Date.MINUTE, zoomLevel);
						} else if (selection.get('alldayevent')) {
							// If there is an appointment, but it is an allday appointment,
							// we have to resize it to the zoomLevel as well, as dropping
							// this appointment on the body container will imply a resize
							// of the appointment.
							dueDate = startDate.add(Date.MINUTE, zoomLevel);
						} else {
							// We are dragging a normal appointment around, we maintain
							// the duration of the appointment by always updating the dueDate
							// based on the appointment duration.
							dueDate = startDate.add(Date.MINUTE, selection.get('duration'));
						}
					}
				} else {
					// We are only moving the dueDate of the selection,
					// round the selection up to the upper limit of the zoomLevel.
					// Note that this will not change the dueDate when the date is
					// an exact multiple of the zoomLevel. This doesn't matter as
					// long as the startDate and dueDate are not equal, as the user
					// will simply have to move an extra pixel to select the next
					// block.
					dueDate = overDate.ceil(Date.MINUTE, zoomLevel);
					if (dueDate === startDate) {
						dueDate = dueDate.add(Date.MINUTE, zoomLevel);
					}
				}
			}else{
				// Get number of minutes since start of day
				var minSinceStartOfDay = startDate.getHours()*60 + startDate.getMinutes();

				// We check whether the overDate is actually at 0:00. If not the DST change happens at
				// midnight. The DST diff fix later on will not work then as it will search between the
				// start of the day and the appointment time. Because 0:00 will become 01:00 it will not
				// detect the DST change between 01:00 and for example 11:00. By taking the number of
				// minutes that were supposed to be between 0:00 and 01:00 and subtract from
				// minSinceStartOfDay, the Date object will calculate the Date correctly. An example of
				// a DST change at 0:00 is the Brazilian DST change.
				var minCorrectionForDSTChangeAtMidNight = overDate.getHours()*60 + overDate.getMinutes();
				// Prevent negative numbers when the DST changes makes 0:15 go back to 23:15
				minSinceStartOfDay = Math.max(0, minSinceStartOfDay - minCorrectionForDSTChangeAtMidNight);

				// Set the startdate to the start of the day we are dragging it to
				startDate = overDate.clone();
				// Add the number of minutes since the start of the day
				startDate = startDate.add(Date.MINUTE, minSinceStartOfDay);
				// Check if there is an DST diff between the start of this new day and time of the
				// appointment on that day. If so we need to add the DST diff, otherwise it will be an
				// hour off on DST change days. If there is no DST diff it will just add 0.
				startDate = startDate.add( Date.MILLI, Date.getDSTDiff(startDate, overDate) );

				// Finally we set the due date based on the start date and duration
				dueDate = startDate.add(Date.MINUTE, duration);
			}
		}

		switch (this.state) {
			// When selecting it is unclear if the user is changing the start or
			// the dueDate of the selection. Here we check if the updated dates
			// gives us a clear picture on the direction where the user is dragging
			// towards. As soon as we have established that we will be using the
			// resize dueDate and startDate handlers.
			case DragStates.SELECTING:
				if (startDate > this.initDate) {
					this.dateRange.set(this.initDateRange.getStartDate(), dueDate);
					this.state = DragStates.RESIZING_DUE;
				} else if (dueDate < this.initDate || snapMode === Zarafa.calendar.data.SnapModes.DAY) {
					this.state = DragStates.RESIZING_START;
					this.dateRange.set(startDate, this.initDateRange.getDueDate());
				}
				break;
			// While dragging we always update the start and dueDate to preserve
			// the duration of the selected appointment.
			case DragStates.DRAGGING:
				this.dateRange.set(startDate, dueDate);
				break;
			// When resizing the startDate of the selection, beware that the user
			// could also be moving his cursor to beyond the dueDate. If this
			// happens, we swap the working state so during next round we will
			// be moving the dueDate.
			case DragStates.RESIZING_START:
				if (startDate >= dueDate) {
					this.state = DragStates.RESIZING_DUE;
					this.dateRange.set(this.initDateRange.getStartDate(), startDate);
				} else {
					this.dateRange.setStartDate(startDate);
				}
				break;
			// When resizing the dueDate of the selection, beware that the user
			// could also be moving his cursor to before the startDate. If this
			// happens, we swap the working state so during next round we will
			// be moving the startDate.
			case DragStates.RESIZING_DUE:
				if (startDate >= dueDate) {
					this.state = DragStates.RESIZING_START;
					this.dateRange.set(dueDate, this.initDateRange.getDueDate());
				} else {
					this.dateRange.setDueDate(dueDate);
				}
				break;
		}
	}
});
