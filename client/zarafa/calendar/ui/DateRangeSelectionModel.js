Ext.namespace('Zarafa.calendar.ui');

/**
 * @class Zarafa.calendar.ui.DateRangeSelectionModel
 * @extends Ext.util.Observable
 * 
 * Model that manages the current selection on a calendar panel. The user can change the selection by dragging the mouse
 * across the body of one of the individual calendars. The selection is defined by a date range ({@link Zarafa.core.DateRange 
 * DateRange}) and the ID of the folder the selection is currently on. The model provides events so that multiple actors can
 * share the model. 
 * <p>
 * The range selection model is used by the individual calendar views to communicate about who has an active selection
 * (no two views can have an active selection at one time) and by the end-user of the {@link Zarafa.calendar.ui.CalendarPanel CalendarPanel}
 * component.   
 */
Zarafa.calendar.ui.DateRangeSelectionModel = Ext.extend(Ext.util.Observable, {

	dateRange : undefined,
	calendarView : undefined,
	active : false,

	/**
	 * @constructor
	 * @param config
	 */
	constructor : function(config)
	{
		this.addEvents(
			/**
			 * @event selectionclear
			 * Fired when a range has is cleared.
			 * @param {Zarafa.calendar.ui.DateRangeSelectionModel} model The selection model.
			 * @param {Zarafa.core.DateRange} oldRange the date range of the selection before it was cleared. 
			 * @param {Zarafa.calendar.ui.AbstractCalendarView} view the view the range was on before it was cleared.
			 */
			'selectionclear',
			/**
			 * @event selectionset
			 * Fired when a new range is set.
			 * @param {Zarafa.calendar.ui.DateRangeSelectionModel} model The selection model.
			 * @param {Zarafa.core.DateRange} range new date range.
			 * @param {Zarafa.calendar.ui.AbstractCalendarView} view view the range is on.
			 */
			'selectionset',
			/**
			 * @event selectionchange
			 * Fired when a new range is set.
			 * @param {Zarafa.calendar.ui.DateRangeSelectionModel} model The selection model.
			 * @param {Zarafa.core.DateRange} range date range if active, undefined otherwise. 
			 * @param {Zarafa.calendar.ui.AbstractCalendarView} view if active, view the range is on, undefined otherwise.
			 * @param {Boolean} active if true the range is inactive, if false it is inactive.
			 */
			'selectionchange'
		);

		Zarafa.calendar.ui.DateRangeSelectionModel.superclass.constructor.call(this, config);
	},
	
	/**
	 * Clears the selection and sets the selection to 'inactive'.
	 */
	clearSelections : function()
	{
		var oldDateRange = this.dateRange;
		var oldCalendar = this.calendarView;
		
		this.dateRange = undefined;
		this.calendarView = undefined;
		this.active = false;
		
		this.fireEvent('selectionclear', this, oldDateRange, oldCalendar);
		this.fireEvent('selectionchange', this, this.dateRange, this.calendarView, this.active);
	},
	
	/**
	 * Sets the selection to the given date range and calendar view.
	 * @param {Zarafa.core.DateRange} range date range to set
	 * @param {Zarafa.calendar.ui.AbstractCalendarView} calendarView view the range is on
	 */
	set : function(dateRange, calendarView)
	{
		this.dateRange = dateRange;
		this.calendarView = calendarView;
		this.active = true;
		
		this.fireEvent('selectionset', this, this.dateRange, this.calendarView);
		this.fireEvent('selectionchange', this, this.dateRange, this.calendarView, this.active);
	},
	
	/**
	 * @return {Zarafa.core.DateRange} selected date range ([start,due>)
	 */
	getDateRange : function()
	{
		return this.dateRange;
	},
	
	/**
	 * @return {Zarafa.calendar.ui.AbstractCalendarView} the view the selected range is on. If inactive, returns undefined.
	 */
	getCalendarView : function()
	{
		return this.calendarView;
	},
	
	/**
	 * @return {Boolean} true iff the range is active.
	 */
	isActive : function()
	{
		return this.active;
	}
	
});
