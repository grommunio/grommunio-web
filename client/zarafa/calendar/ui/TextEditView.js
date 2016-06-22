Ext.namespace('Zarafa.calendar.ui');

/**
 * @class Zarafa.calendar.ui.TextEditView
 * @extends Zarafa.core.ui.View
 *
 * The TextEditView shows a text area for a given date range. It is shown automatically when a user selects a
 * date range on the calendar and starts typing. It allows for convenient creation of appointments.
 * <p>
 * Two TextArea HTML components are used, one in the header and one on the body. Only one of them is visible depending
 * on the date range given (>=24 hour appointments are laid out in the header).
 *
 */
Zarafa.calendar.ui.TextEditView = Ext.extend(Zarafa.core.ui.View, {
	/**
	 * Date range.
	 * @property
	 * @type Zarafa.core.DateRange
	 */
	dateRange : undefined,

	/**
	 * @cfg {Number} minimumHeight The minimum height for this view.
	 */
	minimumHeight : 20,

	/**
	 * @constructor
	 * @param {Object} config configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			baseCls: 'zarafa-calendar',
			itemCls: 'textedit'
		});

		this.addEvents(
			/**
			 * Fires when the user is done entering text.
			 * @event textentered
			 * @param {Zarafa.calendar.ui.TextEditView} view source view.
			 * @param {String} text The text that was entered.
			 */
			'textentered',
			/**
			 * Fires when the user cancelled entering text by pressing escape or removing focus from the text area.
			 * @param {Zarafa.calendar.ui.TextEditView} view source view.
			 * @event cancelled
			 */
			'cancelled'
		);

		Zarafa.calendar.ui.TextEditView.superclass.constructor.call(this, config);
	},

	/**
	 * Sets date range. This method does not auto-update.
	 * @param {Zarafa.core.DateRange} dateRange
	 */
	setDateRange : function(dateRange)
	{
		this.dateRange = dateRange;
	},

	/**
	 * Returns the current date range.
	 * @return {Zarafa.core.DateRange} dateRange
	 */
	getDateRange : function()
	{
		return this.dateRange;
	},

	/**
	 * @return {Boolean} true iff the text edit area is visible.
	 */
	isVisible : function()
	{
		return this.visible;
	},

	/**
	 * Renders the view.
	 * @param {Ext.Element} container The Ext.Element into which the view must be rendered.
	 */
	render : function(container)
	{
		this.create('textarea', this.parentView.getCalendarBody(), 'body', this.getClassName('body'));
		this.create('textarea', this.parentView.getCalendarHeader(), 'header', this.getClassName('header'));
		this.header.setSize(2,2);
		this.mon(this.body, 'keypress', this.onKeyPress, this);
		this.mon(this.body, 'keydown', this.onKeyPress, this);
		this.mon(this.body, 'blur', this.onBlur, this);
		this.mon(this.header, 'keypress', this.onKeyPress, this);
		this.mon(this.header, 'keydown', this.onKeyPress, this);
		this.mon(this.header, 'blur', this.onBlur, this);

		Zarafa.calendar.ui.TextEditView.superclass.render.call(this, container);

		this.hide();
	},

	/**
	 * Sets the visibility of a given set elements. This function is used instead of ExtJS's Element.show()/hide() because
	 * for some reason Chrome seemed to crash on hide(). Freaky.
	 * @param {Ext.Element[]} elements elements to show or hide.
	 * @param {Boolean} visible whether to show or hide the elements.
	 * @private
	 */
	makeElementsVisible : function(elements, visible)
	{
		Ext.each(elements, function(element) {
			element.setVisible(visible);
		});
	},

	/**
	 * Hides the view.
	 */
	hide : function()
	{
		if (!this.rendered) {
			return;
		}

		this.makeElementsVisible([this.body, this.header], false);

		this.visible = false;
	},

	/**
	 * Makes the view visible. The proper order is to first set the date range, then call show() which will
	 * automatically lay out the appropriate TextArea component.
	 */
	show : function()
	{
		if (!this.rendered) {
			return;
		}

		this.visible = true;
		this.layout();

	},

	/**
	 * Handles the keypress event.
	 * @param {Ext.EventObject} event ExtJS event object.
	 * @private
	 */
	onKeyPress : function(event)
	{

		// Escape pressed. Blur.
		if (event.keyCode == event.ESC) {
			this.hide();
		}

		// Enter pressed. Fire 'textentered' event.
		if (event.keyCode == event.RETURN) {
			var text = event.browserEvent.target.value;
			event.browserEvent.target.value = '';

			this.hide();

			this.fireEvent('textentered', this, text);
		}

	},

	/**
	 * Handles a blur event (lost focus) from a text area. The view is hidden and a 'cancel' event is fired.
	 * @param {Ext.EventObject} event ExtJS event object.
	 * @private
	 */
	onBlur : function(event)
	{
		var isHeaderRange = this.parentView.isHeaderRange(this.getDateRange());

		if ( (isHeaderRange && event.target==this.header.dom) || (!isHeaderRange && event.target == this.body.dom)) {
			this.hide();
			this.fireEvent('cancelled', this);
		}
	},

	/**
	 * Lays out the body of the view.
	 * @private
	 */
	layoutInBody : function()
	{
		this.makeElementsVisible(this.header, false);

		// get an array of bounds (left, right, top, bottom) objects to represent the range on the calendar body
		var bounds = this.parentView.dateRangeToBodyBounds(this.dateRange);

		if (bounds.length === 0) {
			this.makeElementsVisible(this.body, false);
		} else {
			this.makeElementsVisible(this.body, true);
			this.body.setLeftTop(bounds[0].left, bounds[0].top);
			this.body.setSize(bounds[0].right - bounds[0].left, bounds[0].bottom - bounds[0].top);
		}

	},

	/**
	 * Lays out the header of the view.
	 * @private
	 */
	layoutInHeader : function()
	{
		this.makeElementsVisible(this.body, false);

		// get an array of bounds (left, right, top, bottom) objects to represent the range on the calendar body
		var bounds = this.parentView.dateRangeToHeaderBounds(this.dateRange, this.slot);

		this.makeElementsVisible(this.header, true);
		this.header.setLeftTop(bounds.left, bounds.top);
		this.header.setSize(bounds.right - bounds.left, this.minimumHeight);
	},

	/**
	 * Lays out the view.
	 * @protected
	 */
	onLayout : function()
	{
		if (!this.rendered) {
			return;
		}

		if (this.visible) {
			if (this.parentView.isHeaderRange(this.getDateRange())) {
				this.layoutInHeader();
			} else {
				this.layoutInBody();
			}
		} else {
			this.makeElementsVisible([this.body, this.header], false);
		}

		Zarafa.calendar.ui.TextEditView.superclass.onLayout.call(this);
	},

	/**
	 * Makes the view visible (set the date range first) and sets the appropriate text area control selected - focus is moved
	 * to the text area and the user can immediately start typing.
	 */
	select : function()
	{
		if (!this.rendered) {
			return;
		}

		this.show();

		if (this.parentView.isHeaderRange(this.getDateRange())) {
			this.header.dom.select();
		} else {
			this.body.dom.select();
		}
	}
});
