Ext.namespace('Zarafa.calendar.ui.html');

/**
 * @class Zarafa.calendar.ui.html.AppointmentProxy
 * @extends Zarafa.calendar.ui.AppointmentView
 *
 * A special {@link Zarafa.calendar.ui.AppointmentView} which acts as proxy for the
 * {@link Zarafa.calendar.ui.CalendarViewDropZone} when an appointment is being resized or
 * dragged over the calendar.
 *
 * This will render the selecte area as a grey block with some extra information text.
 */
Zarafa.calendar.ui.html.AppointmentProxy = Ext.extend(Zarafa.calendar.ui.AppointmentView, {

	/**
	 * @cfg {Boolean} showTime initial value of showTime. When true the start and due times are rendered in the view body. Defaults to false.
	 */
	showTime : false,

	/**
	 * The &lt;div&gt; element for the body of the appointment. This element is
	 * created using the {@link #createDiv} function within {@link #createBodyElement}.
	 * @property
	 * @type Array
	 */
	body : undefined,

	/**
	 * The CSS class which must be applied to the {@link #header} element.
	 * This class can be set using {@link #setHeaderClass}.
	 * FIXME: This class doesn't work, as it is overriden by the subclass...
	 * @property
	 * @type String
	 */
	headerClassName : '',

	/**
	 * The CSS class which must be applied to the {@link #body} element.
	 * This class can be set using {@link #setBodyClass}.
	 * FIXME: This class doesn't work, as it is overriden by the subclass...
	 * @property
	 * @type String
	 */
	bodyClassName : '',

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			baseCls : 'zarafa-calendar',
			itemCls : 'selection'
		});

		this.addEvents(
			/**
			 * @event keypress
			 * Fires when a 'keypress' event is detected while this selection range was focussed
			 * @param {Ext.EventObject} event The Ext.EventObject encapsulating the DOM event
			 * @param {HtmlElement} element The target of the event
			 * @param {Object} options The options configuration passed to the addListener call
			 */
			'keypress',
			/**
			 * @event keydown
			 * Fires when a 'keydown' event is detected while this selection range was focussed
			 * @param {Ext.EventObject} event The Ext.EventObject encapsulating the DOM event
			 * @param {HtmlElement} element The target of the event
			 * @param {Object} options The options configuration passed to the addListener call
			 */
			'keydown',
			/**
			 * @event keyup
			 * Fires when a 'keyup' event is detected while this selection range was focussed
			 * @param {Ext.EventObject} event The Ext.EventObject encapsulating the DOM event
			 * @param {HtmlElement} element The target of the event
			 * @param {Object} options The options configuration passed to the addListener call
			 */
			'keyup'
		);

		Zarafa.calendar.ui.html.AppointmentProxy.superclass.constructor.call(this, config);
	},

	/**
	 * Initialises the AppointmentProxy.
	 * @private
	 * @override
	 */
	init : function()
	{
		Zarafa.calendar.ui.html.AppointmentProxy.superclass.init.call(this);

		this.body = [];
	},

	/**
	 * Sets date range. This method does not auto-update.
	 * @param {Zarafa.core.DateRange} dateRange
	 */
	setDateRange : function(dateRange)
	{
		if (this.dateRange) {
			this.mun(this.dateRange, 'update', this.onDateRangeUpdate, this);
		}
		Zarafa.calendar.ui.html.AppointmentProxy.superclass.setDateRange.call(this, dateRange);
		if (this.dateRange) {
			this.mon(this.dateRange, 'update', this.onDateRangeUpdate, this);
		}
	},

	/**
	 * Renders the view.
	 * @param {Ext.Element} container The Ext.Element into which the view must be rendered.
	 */
	render : function(container)
	{
		Zarafa.calendar.ui.html.AppointmentProxy.superclass.render.apply(this, arguments);

		// Relay key events
		this.focusEl.relayEvent('keypress', this);
		this.focusEl.relayEvent('keydown', this);
		this.focusEl.relayEvent('keyup', this);
	},

	/**
	 * Sets the class or classes on the view header element.
	 * @param {String} className class name or class name list
	 */
	setHeaderClass : function(className)
	{
		this.headerClassName = className;
	},

	/**
	 * Sets the class or classes on the view body elements.
	 * @param {String} className class name or class name list
	 */
	setBodyClass : function(className)
	{
		this.bodyClassName = className;
	},

	/**
	 * Toggles whether the view should show the start and due times in the view body.
	 * @param {Boolean} showTime if true the view will show the start and due times in the calendar body.
	 */
	setShowTime : function(showTime)
	{
		this.showTime = showTime;
	},

	/**
	 * Adds text to the view body containing the start and due times of the date range.
	 * @private
	 */
	createTimeText: function ()
	{
		if (this.body.length >= 1) {
			var dateRange = this.getDateRange();
			var startDate = dateRange.getStartDate();
			var dueDate = dateRange.getDueDate();

			var time = String.format('{0} - {1}', startDate.format(_("G:i")), dueDate.format(_("G:i")));

			if (this.getFirstBodyElement().dom.innerHTML !== time) {
				this.getFirstBodyElement().dom.innerHTML = time;
			}
		}
	},

	/**
	 * Removes text from the view body.
	 * @private
	 */
	clearTimeText : function()
	{
		if (this.body.length > 0) {
			this.getFirstBodyElement().dom.innerHTML = '';
		}
	},

	/**
	 * Sets the visibility of the range
	 * @param {Boolean} visible if true the view will be shown, if false it will be hidden
	 */
	setVisible : function(visible)
	{
		Zarafa.calendar.ui.html.AppointmentProxy.superclass.setVisible.call(this, visible);

		if (visible) {
			this.setBodyClass('zarafa-calendar-selection zarafa-calendar-selection-dragging zarafa-calendar-dragproxy-time');
			this.setHeaderClass('zarafa-calendar-selection zarafa-calendar-selection-dragging');
		} else {
			this.setBodyClass('zarafa-calendar-selection');
			this.setHeaderClass('zarafa-calendar-selection');
		}

		//Always show focus element.
		if(this.focusEl) {
			this.focusEl.show();
		}

		if (this.rendered) {
			this.layout();
		}
	},

	/**
	 * Lays out the elements of the view body.
	 * @param {Object[]} bounds array of bounds (left, right, top, bottom) objects.
	 * @private
	 */
	layoutBodyElements : function(bounds)
	{
		// optionally generate time text
		if (this.showTime) {
			this.createTimeText();
		} else {
			this.clearTimeText();
		}

		// resize the body elements to match the bounds
		for (var i=0; i<bounds.length; i++) {
			this.body[i].dom.className = this.bodyClassName;
			this.body[i].setLeftTop(bounds[i].left, bounds[i].top);
			this.body[i].setSize(bounds[i].right - bounds[i].left, bounds[i].bottom - bounds[i].top);
		}
	},

	/**
	 * Event handler which is fired when the {@link #dateRange} is updated.
	 * When the component is rendered and visible, then this will relayout
	 * the view.
	 * @param {Zarafa.core.DateRange} dateRange the changed daterange
	 */
	onDateRangeUpdate : function(dateRange)
	{
		if (this.rendered && this.isVisible()) {
			this.layout();
		}
	},

	/**
	 * Date ranges may change dynamically, for instance when a selection is dragged or when an appointment is resized.
	 * In such cases the view that represents the range must dynamically add and remove 'boxes' as the range may span
	 * a variable number of days in both the header and body.
	 * <p>
	 * This method adds a single such 'box' by creating a new &lt;div&gt; element and attaching events to it.
	 * The method {@link #destroyBodyElement} should remove any elements created with this method.
	 * @private
	 * @override
	 */
	createBodyElement : function()
	{
		var calendarBody = this.parentView.getCalendarBody();

		var element = this.createDiv(calendarBody, 'body');
		this.mon(element, 'contextmenu', this.onContextMenu, this);
		this.mon(element, 'dblclick', this.onDoubleClick, this);
	},

	/**
	 * This function will cleanup any elements created with {@link #createBodyElement}.
	 * @private
	 * @override
	 */
	destroyBodyElement : function()
	{
		var element = this.body.pop();
		this.mun(element, 'contextmenu', this.onContextMenu, this);
		this.mun(element, 'dblclick', this.onDoubleClick, this);
		this.remove(element);
	},

	/**
	 * Creates elements to represent the range when shown in the header.
	 * @private
	 */
	createHeader : function()
	{
		this.createDiv(this.parentView.getCalendarHeader(), 'header');
		this.mon(this.header, 'contextmenu', this.onContextMenu, this);
		this.mon(this.header, 'dblclick', this.onDoubleClick, this);
	},

	/**
	 * Destroys the header element(s).
	 * @private
	 */
	destroyHeader : function()
	{
		this.mun(this.header, 'contextmenu', this.onContextMenu, this);
		this.mun(this.header, 'dblclick', this.onDoubleClick, this);
		this.remove(this.header);

		this.header = undefined;
	},

	/**
	 * Lays out the header element of the view.
	 * @private
	 */
	layoutInHeader : function()
	{
		// Get the bounds of the header from the parent calendar.
		var bounds = this.parentView.dateRangeToHeaderBounds(this.getDateRange());

		// If header doesn't exist yet, create it
		if (!this.header) {
			this.createHeader();
		}

		// If body exists, destroy it
		while (this.body.length) {
			this.destroyBodyElement();
		}

		this.header.dom.className = this.headerClassName;

		this.header.setLeftTop(bounds.left, bounds.top);
		this.header.setSize(bounds.right - bounds.left, this.parentView.getAppointmentHeaderheight());
	},

	/**
	 * Lays out the body of the view.
	 * @private
	 * @override
	 */
	layoutInBody : function()
	{
		var bounds = this.parentView.dateRangeToBodyBounds(this.dateRange);

		// If the header exists, destroy it
		if (this.header) {
			this.destroyHeader();
		}

		// make sure the number of DIV elements we have allocated matches the size of the
		// bounds array
		while (this.body.length < bounds.length) {
			this.createBodyElement();
		}
		while (this.body.length > bounds.length) {
			this.destroyBodyElement();
		}

		// Lay out the body elements to match the bounds
		this.layoutBodyElements(bounds);
	},

	/**
	 * Layout method. We override this here to change the default behavior where
	 * the range is only shown on the body if the duration is less than 24 hours.
	 * During appointment dragging and resizing it looks weird if the range is
	 * shown on the header only i such a case.
	 * @protected
	 */
	onLayout : function()
	{
		Zarafa.calendar.ui.html.AppointmentProxy.superclass.onLayout.call(this);

		// The selectionRange is updated, make sure we mark
		// this selection as focussed.
		this.focus();
	},

	/**
	 * @return {Ext.Element} first element of the body of the view.
	 */
	getFirstBodyElement : function()
	{
		return this.body[0];
	},

	/**
	 * Handles the onContextMenu event, and refires it on the parent calendar view.
	 * @param {Object} event The event object
	 * @private
	 */
	onContextMenu : function(event)
	{
		this.parentView.fireEvent('contextmenu', this.parentView, event);
	},

	/**
	 * Handles the onDoubleClick event, and refires it on the parent calendar view.
	 * @param {Object} event The event object
	 * @private
	 */
	onDoubleClick : function(event)
	{
		var model = this.parentView.parentView.model;

		model.createRecord(function(record){
			this.parentView.fireEvent('dblclick', this.parentView, event, record);
		}.createDelegate(this, [event], true), this.parentView.getSelectedFolder(), this.getDateRange());
	}
});
