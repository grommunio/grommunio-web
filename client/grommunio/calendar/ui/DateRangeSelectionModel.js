/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.calendar.ui');

/**
 * @class Grommunio.calendar.ui.DateRangeSelectionModel
 * @extends Ext.util.Observable
 *
 * Model that manages the current selection on a calendar panel. The user can change the selection by dragging the mouse
 * across the body of one of the individual calendars. The selection is defined by a date range ({@link Grommunio.core.DateRange
 * DateRange}) and the ID of the folder the selection is currently on. The model provides events so that multiple actors can
 * share the model.
 * <p>
 * The range selection model is used by the individual calendar views to communicate about who has an active selection
 * (no two views can have an active selection at one time) and by the end-user of the {@link Grommunio.calendar.ui.CalendarPanel CalendarPanel}
 * component.
 */
Grommunio.calendar.ui.DateRangeSelectionModel = Ext.extend(Ext.util.Observable, {

	dateRange: undefined,
	calendarView: undefined,
	active: false,

	/**
	 * @constructor
	 * @param config
	 */
	constructor: function(config)
	{
		this.addEvents(
			/**
			 * @event selectionclear
			 * Fired when a range has is cleared.
			 * @param {Grommunio.calendar.ui.DateRangeSelectionModel} model The selection model.
			 * @param {Grommunio.core.DateRange} oldRange the date range of the selection before it was cleared.
			 * @param {Grommunio.calendar.ui.AbstractCalendarView} view the view the range was on before it was cleared.
			 */
			'selectionclear',
			/**
			 * @event selectionset
			 * Fired when a new range is set.
			 * @param {Grommunio.calendar.ui.DateRangeSelectionModel} model The selection model.
			 * @param {Grommunio.core.DateRange} range new date range.
			 * @param {Grommunio.calendar.ui.AbstractCalendarView} view view the range is on.
			 */
			'selectionset',
			/**
			 * @event selectionchange
			 * Fired when a new range is set.
			 * @param {Grommunio.calendar.ui.DateRangeSelectionModel} model The selection model.
			 * @param {Grommunio.core.DateRange} range date range if active, undefined otherwise.
			 * @param {Grommunio.calendar.ui.AbstractCalendarView} view if active, view the range is on, undefined otherwise.
			 * @param {Boolean} active if true the range is inactive, if false it is inactive.
			 */
			'selectionchange'
		);

		Grommunio.calendar.ui.DateRangeSelectionModel.superclass.constructor.call(this, config);
	},

	/**
	 * Clears the selection and sets the selection to 'inactive'.
	 */
	clearSelections: function()
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
	 * @param {Grommunio.core.DateRange} range date range to set
	 * @param {Grommunio.calendar.ui.AbstractCalendarView} calendarView view the range is on
	 */
	set: function(dateRange, calendarView)
	{
		this.dateRange = dateRange;
		this.calendarView = calendarView;
		this.active = true;

		this.fireEvent('selectionset', this, this.dateRange, this.calendarView);
		this.fireEvent('selectionchange', this, this.dateRange, this.calendarView, this.active);
	},

	/**
	 * @return {Grommunio.core.DateRange} selected date range ([start,due>)
	 */
	getDateRange: function()
	{
		return this.dateRange;
	},

	/**
	 * @return {Grommunio.calendar.ui.AbstractCalendarView} the view the selected range is on. If inactive, returns undefined.
	 */
	getCalendarView: function()
	{
		return this.calendarView;
	},

	/**
	 * @return {Boolean} true iff the range is active.
	 */
	isActive: function()
	{
		return this.active;
	}

});
