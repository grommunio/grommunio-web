Ext.namespace('Zarafa.calendar.ui');

/**
 * @class Zarafa.calendar.ui.CalendarViewDragZone
 * @extends Ext.dd.DragZone
 *
 * The special DragZone which enables appointments to be dragged
 * from a calendar to a {@link Ext.dd.DropZone}. This class supports
 * dragging and resizing of appointments, but also selecting a
 * daterange in the calendar.
 */
Zarafa.calendar.ui.CalendarViewDragZone = Ext.extend(Ext.dd.DragZone, {
	/**
	 * The calendar on which this DragZone is installed
	 * @property
	 * @type Zarafa.calendar.ui.AbstractCalendarView
	 * @private
	 */
	calendar : undefined,

	/**
	 * The special Element which is displayed when dragging data
	 * over the DragZone.
	 * @property
	 * @type Ext.Element
	 * @private
	 */
	ddel : undefined,

	/**
	 * @cfg {Boolean} headerMode True of this DropZone is installed on the header of
	 * the calendar, or in the body. This determines if the {@link Zarafa.calendar.ui.AbstractCalendarView#header}
	 * or {@link Zarafa.calendar.ui.AbstractCalendarView#body} will be used to connect the event handlers.
	 */
	headerMode : false,

	/**
	 * @constructor
	 * @param {Zarafa.calendar.ui.AbstractCalendarView} calendar The calendar on which this Dragzone is installed
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

		Zarafa.calendar.ui.CalendarViewDragZone.superclass.constructor.call(this, element, config);

		this.ddel = document.createElement('div');
		this.ddel.className = 'x-data-dd-wrap';
	},

	/**
	 * <p>The provided implementation of the getDragData method which collects the data to be dragged from the DataView on mousedown.</p>
	 * <p>This data is available for processing in the {@link Ext.dd.DropZone#onNodeEnter onNodeEnter}, {@link Ext.dd.DropZone#onNodeOver onNodeOver},
	 * {@link Ext.dd.DropZone#onNodeOut onNodeOut} and {@link Ext.dd.DropZone#onNodeDrop onNodeDrop} methods of a cooperating {@link Ext.dd.DropZone DropZone}.</p>
	 * <p>The data object contains the following properties:<ul>
	 * <li><b>calendar</b> : Zarafa.calendar.ui.AbstractCalendarView<div class="sub-desc">The CalendarView from which the data is being dragged.</div></li>
	 * <li><b>ddel</b> : htmlElement<div class="sub-desc">An htmlElement which provides the "picture" of the data being dragged.</div></li>
	 * <li><b>selections</b> : Array<div class="sub-desc">An Array of the selected Records which are being dragged from the DataView.</div></li>
	 * <li><b>target</b : Zarafa.calendar.ui.AppointmentView<div class="sub-desc">The appointment on which the drag action started.</div></li>
	 * </ul></p>
	 * @private
	 */
	getDragData : function(e)
	{
		var sm = this.calendar.selectionModel;
		var origEvent = new Ext.EventObjectImpl(e);
		var appointment = this.getAppointmentFromEvent(e);
		var state = this.getDragStateFromEvent(e, appointment);

		return {
			calendar : this.calendar,
			ddel : this.ddel,
			selections : sm.getSelections(),
			target : appointment,
			state : state,
			origEvent : origEvent
		};
	},

	/**
	 * This function is provided so that it is possible to perform a custom action before the initial
	 * drag event begins and optionally cancel it.
	 * @param {Object} data An object containing arbitrary data to be shared with drop targets
	 * @param {Event} e The event object
	 * @return {Boolean} isValid True if the drag event is valid, else false to cancel
	 * @protected
	 */
	onBeforeDrag : function(data, e)
	{
		var selectedAppointment = data.target;

		// We don't allow dragging of private appointments.
		if (selectedAppointment && selectedAppointment.getRecord().get('access') === 0) {
			return false;
		}

		return true;
	},

	/**
	 * Called before the user starts dragging an item.
	 * @param {Number} x The x coordinate from where the dragging started
	 * @param {Number} y The y coordinate from where the dragging started
	 * @private
	 */
	b4StartDrag : function(x, y)
	{
		Zarafa.calendar.ui.CalendarViewDragZone.superclass.b4StartDrag.apply(this, arguments);

		// ExtJs will make the proxy visible at the end of the b4StartDrag function, but
		// if our parent has a DropZone installed, we hide our proxy by default, as
		// the CalendarViewDropZone will have a custom proxy installed.
		if (this.calendar.enableDD || this.calendar.enableDrop) {
			this.proxy.hide();
		}
	},

	/**
	 * Called when the user starts dragging an item.
	 * @param {Number} x The x coordinate from where the dragging started
	 * @param {Number} y The y coordinate from where the dragging started
	 * @private
	 */
	startDrag : function(x, y)
	{
		Zarafa.calendar.ui.CalendarViewDragZone.superclass.startDrag.apply(this, arguments);

		// ExtJs will make the proxy visible at the end of the startDrag function, but
		// if our parent has a DropZone installed, we hide our proxy by default, as
		// the CalendarViewDropZone will have a custom proxy installed.
		if (this.calendar.enableDD || this.calendar.enableDrop) {
			this.proxy.hide();
		}
	},

	/**
	 * <p>The provided implementation of the onInitDrag method. Sets the <tt>innerHTML</tt> of the drag proxy which provides the "picture"
	 * of the data being dragged.</p>
	 * <p>The <tt>innerHTML</tt> data is found by calling the owning GridPanel's {@link Ext.grid.GridPanel#getDragDropText getDragDropText}.</p>
	 * @param {Number} x The x coordinate from where the dragging started
	 * @param {Number} y The y coordinate from where the dragging started
	 * @return {Boolean} true to continue the drag, false to cancel
	 * @private
	 */
	onInitDrag : function(x, e)
	{
		var data = this.dragData;

		// Check if the dragData contains a origEvent and target (as initialized by getDragData).
		// If this is present, we have to manually call the onMouseDown event handler
		// on the view to ensure that the item we are about to drag is marked as selected.
		//
		// We can't do that in getDragData because of the ordering of the event handlers
		// of both this class as well as the DataView.
		if (data && data.origEvent) {
			var selectedAppointment = data.target;
			var sm = this.calendar.selectionModel;

			if (selectedAppointment) {
				this.calendar.onInitDrag(data.origEvent, selectedAppointment);
			}

			if (!selectedAppointment || !sm.isSelected(selectedAppointment.getRecord())) {
				this.calendar.onMouseDown(data.origEvent, selectedAppointment);

				// The selection has been changed, update the selections array
				data.selections = sm.getSelections();
			}

			delete data.origEvent;
		}

		this.ddel.innerHTML = this.calendar.getDragDropText();
		this.proxy.update(this.ddel);
		// fire start drag?
	},

	/**
	 * An empty function by default, but provided so that you can perform a custom action before the dragged
	 * item is dragged out of the target without dropping, and optionally cancel the onDragOut.
	 * @param {Ext.dd.DragDrop} target The drop target
	 * @param {Event} e The event object
	 * @param {String} id The id of the dragged element
	 * @return {Boolean} isValid True if the drag event is valid, else false to cancel
	 */
	beforeDragOut : function(target, e, id)
	{
		// If we are selecting a range, we want to preserve our drag action,
		// this allows the user to shortly exit the browser while dragging while
		// maintaining he selection.
		return this.dragData.state !== Zarafa.calendar.data.DragStates.SELECTING;
	},

	/**
	 * Event handler that fires when a drag/drop obj gets a mouseup
	 *
	 * When the {@link #dragData} still contains the 'origEvent' field, then this
	 * function was called without that anything has been dragged (normally 'origEvent')
	 * is cleared in {@link #onInitDrag}. In this case we call {@link Zarafa.calendar.ui.AbstractCalendarView#handleMouseDown}
	 * to update the selection inside the calendar.
	 *
	 * @param {Event} e the mouseup event
	 */
	onMouseUp : function(e)
	{
		var data = this.dragData;

		// If the dragData still contains the origEvent and target, then onInitDrag has not been
		// called which means the user only clicked on the row and we must update
		// our selection.
		if (data && data.origEvent) {
			this.calendar.onMouseDown(data.origEvent, data.target);

			delete data.origEvent;
		}

		this.hideProxy();
	},

	/**
	 * An empty immplementation. Implement this to provide behaviour after a repair of an invalid drop. An implementation might highlight
	 * the selected rows to show that they have not been dragged.
	 * @private
	 */
	afterRepair : function()
	{
		this.dragging = false;
	},

	/**
	 * <p>An empty implementation. Implement this to provide coordinates for the drag proxy to slide back to after an invalid drop.</p>
	 * <p>Called before a repair of an invalid drop to get the XY to animate to.</p>
	 * @param {EventObject} e The mouse up event
	 * @return {Array} The xy location (e.g. [100, 200])
	 * @private
	 */
	getRepairXY : function(e, data)
	{
		return false;
	},

	/**
	 * Called when the dragging has ended. This will call the
	 * {@link Zarafa.calendar.ui.AbstractCalendarView#onMouseUp}
	 * on the {@link #calendar} to which the dragged appointment belongs.
	 *
	 * @param {Object} data The data which was used during the drag
	 * @param {Ext.EventObject} e The event object
	 * @private
	 */
	onEndDrag : function(data, e)
	{
		var appointment = data.target;
		this.calendar.onEndDrag(e, appointment);
		this.calendar.onMouseUp(e, appointment);
	},

	/**
	 * Called when an item has been dropped
	 * @param {Ext.dd.DropZone} dd The zone in which the item was dropped
	 * @param {Ext.EventObject} e The event object
	 * @param {String} id The id of the Ext.Element where the item was dropped
	 * @private
	 */
	onValidDrop : function(dd, e, id)
	{
		// fire drag drop?
		this.hideProxy();
	},

	/**
	 * Called when an item has been dropped on an invalid location
	 * @param {Ext.EventObject} e The event object
	 * @param {String} id The id of the Ext.Element where the item was dropped
	 * @private
	 */
	beforeInvalidDrop : function(e, id)
	{
	},

	/**
	 * Search for the {@link Zarafa.calendar.ui.AppointmentView appointment} on which the
	 * given {@link Ext.EventObject event} tool place. This requires {@link Zarafa.calendar.ui.AppointmentView#eventOverBody}
	 * to be true when {@link #headerMode} is false, otherwise {@link Zarafa.calendar.ui.AppointmentView#eventOverHeader} must
	 * be true.
	 * @param {Ext.EventObject} e The event from where we obtain the appointment
	 * @return {Zarafa.calendar.ui.AppointmentView} The appointment on which the event occurred
	 * @private
	 */
	getAppointmentFromEvent : function(e)
	{
		var appointments = this.calendar.appointments;

		for (var i = 0, len = appointments.length; i < len; i++) {
			var app = appointments[i];

			if (this.headerMode !== true) {
				if (app.eventOverBody(e)) {
					return app;
				}
			} else {
				if (app.eventOverHeader(e)) {
					return app;
				}
			}
		}

		return undefined;
	},

	/**
	 * This function checks over which part of the appointment the event took place,
	 * and will return the appropriate {@link Zarafa.calendar.data.DragStates} value.
	 * @param {Ext.EventObject} e The event
	 * @param {Zarafa.calendar.ui.AppointmentView} appointment The appointment to check
	 * @return {Zarafa.calendar.data.DragStates} The Drag State for the current action
	 * @private
	 */
	getDragStateFromEvent : function(e, appointment)
	{
		if (this.headerMode !== true) {
			if (!Ext.isDefined(appointment)) {
				return Zarafa.calendar.data.DragStates.SELECTING;
			} else if (appointment.eventOverBodyStartHandle(e)) {
				return Zarafa.calendar.data.DragStates.RESIZING_START;
			} else if (appointment.eventOverBodyDueHandle(e)) {
				return Zarafa.calendar.data.DragStates.RESIZING_DUE;
			} else {
				return Zarafa.calendar.data.DragStates.DRAGGING;
			}
		} else {
			if (!Ext.isDefined(appointment)) {
				return Zarafa.calendar.data.DragStates.SELECTING;
			} else if (appointment.eventOverHeaderStartHandle(e)) {
				return Zarafa.calendar.data.DragStates.RESIZING_START;
			} else if (appointment.eventOverHeaderDueHandle(e)) {
				return Zarafa.calendar.data.DragStates.RESIZING_DUE;
			} else {
				return Zarafa.calendar.data.DragStates.DRAGGING;
			}
		}
	}
});
