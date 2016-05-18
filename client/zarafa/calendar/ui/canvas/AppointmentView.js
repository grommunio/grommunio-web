Ext.namespace('Zarafa.calendar.ui.canvas');

/**
 * @class Zarafa.calendar.ui.canvas.AppointmentView
 * @extends Zarafa.calendar.ui.AppointmentView
 *
 * The {@link Zarafa.calendar.ui.AppointmentView AppointmentView} class is designed to allow for dynamic creation and
 * destruction of HTML elements as required. Since the canvas based implementations of appointment views don't require
 * HTML elements but instead render directly to the canvas of the calendar view, these functions are needed. This class
 * overrides the default implementation of these methods with empty ones.
 */
Zarafa.calendar.ui.canvas.AppointmentView = Ext.extend(Zarafa.calendar.ui.AppointmentView, {
	/**
	 * @cfg {Number} dragHandleWidth width in pixels of the left and right drag handles.
	 */
	dragHandleWidth : 6,

	/**
	 * @cfg {Number} dragHandleHeight height in pixels of the top and bottom drag handles.
	 */
	dragHandleHeight : 6,

	/**
	 * The opacity used to blur the appointment to the background when it is not part of the active
	 * Calendar. It is set in a value between 0 and 1.
	 * @property
	 * @type Number
	 */
	opacityNonActiveAppointment : 0.4,

	/**
	 * @constructor
	 * @param {Object} config configuration object (optional)
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			baseCls : 'zarafa-calendar',
			itemCls : 'appointment'
		});

		Zarafa.calendar.ui.canvas.AppointmentView.superclass.constructor.call(this, config);
	},

	/**
	 * Calculates the (x,y) position of a mouse event relative to the top left of the header element of the parent calendar.
	 * The result is returned as an (x,y) tuple, meaning that the result will have an 'x' and 'y' property containing the
	 * horizontal and vertical positions respectively.
	 * @param {Ext.EventObject} event mouse event
	 * @return {Object} an (x, y) tuple containing the position of the mouse event relative to the calendar header.
	 * @private
	 */
	getEventHeaderPosition : function(event)
	{
		var canvas = this.parentView.getCalendarHeader();
		return {
			x : event.getPageX() - canvas.getX(),
			y : event.getPageY() - canvas.getY()
		};
	},

	/**
	 * Calculates the (x,y) position of a mouse event relative to the top left of the body element of the parent calendar.
	 * The result is returned as an (x,y) tuple, meaning that the result will have an 'x' and 'y' property containing the
	 * horizontal and vertical positions respectively.
	 * @param {Ext.EventObject} event mouse event
	 * @return {Object} an (x, y) tuple containing the position of the mouse event relative to the calendar body.
	 * @private
	 */
	getEventBodyPosition : function(event)
	{
		var canvas = this.parentView.getCalendarBody();
		return {
			x : event.getPageX() - canvas.getX(),
			y : event.getPageY() - canvas.getY()
		};
	},

	/**
	 * Determines if the given position  for an event, is over the given
	 * element.
	 * @param {Object} eventPosition An {x, y} tuple containing the coordinates
	 * of the position on which the event took place.
	 * @param {Object} elementPosition The { left, right, top, bottom } settings
	 * for the position of the element which we want to check
	 * @return {Boolean} True if eventPosition is inside elementPosition
	 * @private
	 */
	isEventOverElement : function(eventPosition, elementPosition)
	{
		return (
			eventPosition.x >= elementPosition.left &&
			eventPosition.x <= elementPosition.right &&
			eventPosition.y >= elementPosition.top &&
			eventPosition.y <= elementPosition.bottom
		);
	},

	/**
	 * Draws a 5x5 pixel white box with black outline.
	 * @param {CanvasRenderingContext2D} context canvas drawing context.
	 * @param {Number} x horizontal position
	 * @param {Number} y vertical position
	 * @private
	 */
	drawDragHandle : function(context, x, y)
	{
		context.save();

		context.strokeStyle = 'black';
		context.fillStyle = 'white';
		context.lineWidth = 1;

		context.fillRect(x - 2, y - 2, 4, 4);
		context.strokeRect(x - 2, y - 2, 4, 4);

		context.restore();
	}
});
