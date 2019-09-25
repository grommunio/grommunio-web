Ext.namespace('Zarafa.calendar.ui');

/**
 * @class Zarafa.calendar.ui.AbstractDateRangeView
 * @extends Zarafa.core.ui.View
 * 
 * An abstract class that implements common functionality of views that represent [start, due> date ranges on calendars. 
 * These views are child views on a calendar view, and rely on parent view's <code>dateRangeToBodyBounds</code> and 
 * <code>dateRangeToHeaderBounds</code> methods for layout.  When the range spans 24 hours or more the view is automatically
 * laid out on the header of the parent view. 
 * <p>
 * The view uses zero or more so called 'boxes' defined by (left, right, top, bottom) tuples to define the range on the
 * calendar body. As the range changes, boxes may be added or removed dynamically. Each box is represented by one or more
 * HTML elements on the calendar body. The default implementation uses a single <code>DIV</code> element for each box, but
 * it is possible to override the <code>createBodyElement</code> and <code>destroyBodyElement</code> functions to implement
 * your own representations. 
 * <p>
 * The view carries 'slot' information. Multiple ranges (most notably, appointments) may overlap in time. When laid out on the
 * header these appear in separate rows. When laid out in the body, they appear in separate columns. These rows and columns
 * are referred to here as slots, and which slot a range should be laid out in is determined by the parent calendar view 
 * (using greedy graph coloring).
 */
Zarafa.calendar.ui.AbstractDateRangeView = Ext.extend(Zarafa.core.ui.View, {
	/**
	 * Multiple ranges (most notably, appointments) may overlap in time. When laid out on the
	 * header these appear in separate rows. When laid out in the body, they appear in separate columns.
	 * These rows and columns are referred to using a slot number.
	 * @property
	 * @type Number
	 */
	slot : undefined,

	/**
	 * Multiple ranges (most notably, appointments) may overlap in time. When laid out on the
	 * header these appear in separate rows. When laid out in the body, they appear in separate columns.
	 * The total sum of these rows and columns are referred to as the slot Count.
	 * @property
	 * @type Number
	 */
	slotCount : undefined,

	/**
	 * Marks the view as visible. This can be set using {@link #setVisible}.
	 * @property
	 * @type Boolean
	 */
	visible : true,

	/**
	 * Date range.
	 * @property
	 * @type Zarafa.core.DateRange
	 */
	dateRange : undefined,

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
	 * Tests whether a mouse event is over the appointment body.
	 * NOTE: Must be implemented by subclass.
	 * @param {Ext.EventObject} event event object.
	 * @return {Boolean} true iff the event is over the body.
	 */
	eventOverBody : function(event)
	{
		return false;
	},

	/**
	 * Tests whether a mouse event is over the body start resize handle.
	 * NOTE: Must be implemented by subclass.
	 * @param {Ext.EventObject} event event object.
	 * @return {Boolean} true iff the event is over the resize handle.
	 */
	eventOverBodyStartHandle : function(event)
	{
		return false;
	},

	/**
	 * Tests whether a mouse event is over the body Due resize handle.
	 * NOTE: Must be implemented by subclass.
	 * @param {Ext.EventObject} event event object.
	 * @return {Boolean} true iff the event is over the resize handle.
	 */
	eventOverBodyDueHandle : function(event)
	{
		return false;
	},

	/**
	 * Tests whether a mouse event is over the appointment header.
	 * NOTE: Must be implemented by subclass.
	 * @param {Ext.EventObject} event event object.
	 * @return {Boolean} true iff the event is over the header.
	 */
	eventOverHeader : function(event)
	{
		return false;
	},

	/**
	 * Tests whether a mouse event is over the header start resize handle.
	 * NOTE: Must be implemented by subclass.
	 * @param {Ext.EventObject} event event object.
	 * @return {Boolean} true iff the event is over the resize handle.
	 */
	eventOverHeaderStartHandle : function(event)
	{
		return false;
	},

	/**
	 * Tests whether a mouse event is over the header Due resize handle.
	 * NOTE: Must be implemented by subclass.
	 * @param {Ext.EventObject} event event object.
	 * @return {Boolean} true iff the event is over the resize handle.
	 */
	eventOverHeaderDueHandle : function(event)
	{
		return false;
	},

	/**
	 * Sets the visibility of the range 
	 * @param {Boolean} visible if true the view will be shown, if false it will be hidden
	 */
	setVisible : function(visible)
	{
		this.visible = visible;
		for (var i = 0, len = this.elements.length; i < len; i++) {
			this.elements[i].setVisible(visible);
		}
	},
	
	/**
	 * @return {Boolean} true iff the range is visible.
	 */
	isVisible : function()
	{
		return this.visible;
	},
	
	/**
	 * Lays out the header elements of the view.
	 * @private
	 */
	layoutInHeader : Ext.emptyFn,

	/**
	 * Lays out the body of the view.
	 * @private
	 */
	layoutInBody : Ext.emptyFn,

	/**
	 * Lays out the view. If the range represented by this view spans over 24 hours,
	 * the body is made invisible and the header element is shown instead.
	 * If the range is shorter the body is visible and the header invisible.
	 * @protected
	 */
	onLayout : function()
	{
		if (this.visible) {
			if (this.isHeaderRange()) {
				this.layoutInHeader();
			} else {
				this.layoutInBody();
			}
		}

		Zarafa.calendar.ui.AbstractDateRangeView.superclass.onLayout.call(this);
	},	

	/**
	 * Tests if the date range should be laid out in the header, which is when a range spans 24 hours or more.
	 * @return {Boolean} true if the date range represents 24 hours or more, false otherwise.
	 */
	isHeaderRange : function()
	{
		return this.parentView.isHeaderRange(this.getDateRange());
	}
});
