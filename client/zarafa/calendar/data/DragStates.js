Ext.namespace('Zarafa.calendar.data');

/**
 * @class Zarafa.calendar.data.DragStates
 * @extends Zarafa.core.Enum
 *
 * Enum containing the different Drag & Drop states for the
 * {@link Zarafa.calendar.ui.CalendarViewDragZone Drag}&{@link Zarafa.calendar.ui.CalendarViewDropZone Drop}
 * support in the {@link Zarafa.calendar.ui.AbstractCalendarView calendar}.
 * 
 * @singleton
 */
Zarafa.calendar.data.DragStates = Zarafa.core.Enum.create({
	/**
	 * No active D&D state
	 * @property
	 * @type Number
	 */
	NONE : 0,

	/**
	 * D&D proxy is currently dragging an item
	 * @property
	 * @type Number
	 */
	DRAGGING : 1,

	/**
	 * D&D proxy is currently selecting a date range
	 * @property
	 * @type Number
	 */
	SELECTING : 2,

	/**
	 * D&D proxy is resizing an item at the start of
	 * the appointment
	 * @property
	 * @type Number
	 */
	RESIZING_START : 3,

	/**
	 * D&D proxy is resizing an item at the end of
	 * the appointment
	 * @property
	 * @type Number
	 */
	RESIZING_DUE : 4
});
