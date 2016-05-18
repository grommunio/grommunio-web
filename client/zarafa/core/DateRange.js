Ext.namespace('Zarafa.core');

/**
 * @class Zarafa.core.DateRange
 * @extends Ext.util.Observable
 * 
 * Represents a date range defined by a start and due date. The start date is inclusive, while the due date is exclusive. For example,
 * to denote an appointment that lasts all day on July 1st, 2010 one would write this as (00:00 July 1st 2010, 00:00 July 2nd 2010).
 * In sort, the range is defined as [startDate, dueDate>.
 * <p>
 * This class encapsulates such ranges because they are used often in especially the calendering components.
 */
Zarafa.core.DateRange = Ext.extend(Ext.util.Observable, {
	/**
	 * @cfg {Date} startDate start date for this {@link Zarafa.core.DateRange DateRange}.
	 * use {@link #getStartDate} and {@link #setStartDate} to modify this value.
	 */
	startDate : null,

	/**
	 * @cfg {Date} dueDate due date for this {@link Zarafa.core.DateRange DateRange}.
	 * use {@link #getDueDate} and {@link #setDueDate} to modify this value.
	 */
	dueDate : null,

	/**
	 * @cfg {Boolean} allowBlank Specifies empty dates are accepted by this {@link Zarafa.core.DateRange DateRange},
	 * if {@link #allowBlank} is true then only we can use empty start/due dates in {@link Zarafa.core.DateRange DateRange}.
	 * otherwise {@link #startDate} and {@link #dueDate} will be initialized with current dates.
	 */
	allowBlank : false,

	/**
	 * @constructor
	 * @param {Date} startDate (optional) start date
	 * @param {Date} dueDate (optional) due date
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			allowBlank : this.allowBlank
		});

		if(config.allowBlank) {
			// if allowBlank is true then we should initialize start / due date with undefined
			// but this should only be done when start / due dates are not provided in the configs hence used Ext.applyIf
			// there is a restriction that start date can not exist without due date, so we will be initializing due date
			// same as start date if only start date is provided
			Ext.applyIf(config, {
				startDate : null,
				dueDate : config.startDate ? config.startDate.clone() : null
			});
		} else {
			// if allowBlank is false then we should initialize start / due date with current dates
			Ext.applyIf(config, {
				startDate : new Date(),
				dueDate : config.startDate ? config.startDate.clone() : new Date()
			});
		}

		Ext.apply(this, config);

		// Precondition
		if (Ext.isDate(this.startDate) && Ext.isDate(this.dueDate) && (this.getStartTime() > this.getDueTime())) {
			throw 'Invalid date range, start date is after due date';
		}

		this.addEvents(
			/**
			 * @event update
			 * Fires when the daterange is modified.
			 * @param {Zarafa.core.DateRange} newRange The changed daterange object
			 * @param {Zarafa.core.DateRange} oldRange The orignal daterange values (clone of the daterange object,
			 * prior of the change).
			 */
			'update'
		);

		Zarafa.core.DateRange.superclass.constructor.call(this);
	},
	
	/**
	 * @return {Date} the range's start date.
	 */
	getStartDate : function()
	{
		return this.startDate;
	},
	
	/**
	 * @return {Date} the range's due date.
	 */
	getDueDate : function()
	{
		return this.dueDate;
	},
	
	/**
	 * Sets the range start date.
	 * @param {Date} startDate the range's start date.
	 * @param {Boolean} silence When set to true it will not throw an start date after due date error.
	 * @param {Boolean} ignoreUpdate When set to true it will not fire the update event.
	 * @return {Zarafa.core.DateRange} this date range
	 */
	setStartDate : function(startDate, silence, ignoreUpdate)
	{
		var original = null;

		// make sure that you are saving null when no valid date is passed
		startDate = Ext.isDate(startDate) ? startDate : null;

		// Preconditions
		if (!this.allowBlank && !Ext.isDate(startDate)) {
			throw 'Cannot set DateRange start to undefined';
		} else if (Ext.isDate(this.dueDate) && Ext.isDate(startDate) && startDate.getTime() > this.getDueTime() && !silence) {
			throw 'Cannot set DateRange start date to after its due date';
		}

		// No update event when new value equals old value
		ignoreUpdate = ignoreUpdate || (Ext.isDate(this.startDate) && Ext.isDate(startDate) && this.getStartTime() == startDate.getTime());

		if (!ignoreUpdate)
			original = this.clone();

		this.startDate = startDate;

		if(!ignoreUpdate) {
			this.fireEvent("update", this, original);
		}

		return this;
	},
	
	/**
	 * Sets the range due date.
	 * @param {Date} dueDate the range's due date.
	 * @param {Boolean} silence When set to true it will not throw an start date after due date error.
	 * @param {Boolean} ignoreUpdate When set to true it will not fire the update event.
	 * @return {Zarafa.core.DateRange} this date range
	 */
	setDueDate : function(dueDate, silence, ignoreUpdate)
	{
		var original = null;

		// make sure that you are saving null when no valid date is passed
		dueDate = Ext.isDate(dueDate) ? dueDate : null;

		// Precondition
		if (!this.allowBlank && !Ext.isDate(dueDate)) {
			throw 'Cannot set DateRange due date to undefined';
		} else if (Ext.isDate(this.startDate) && Ext.isDate(dueDate) && dueDate.getTime() < this.getStartTime() && !silence) {
			throw 'Cannot set DateRange due date to before its start date';
		}

		// No update event when new value equals old value
		ignoreUpdate = ignoreUpdate || (Ext.isDate(this.dueDate) && Ext.isDate(dueDate) && this.getDueTime() == dueDate.getTime());

		if (!ignoreUpdate)
			original = this.clone();

		this.dueDate = dueDate;

		if(!ignoreUpdate) {
			this.fireEvent("update", this, original);
		}

		return this;
	},
	
	/**
	 * Sets the start and due dates.
	 * @param {Date} startDate the range's start date.
	 * @param {Date} dueDate the range's due date.
	 * @param {Boolean} silence When set to true it will not throw an start date after due date error.
	 * @param {Boolean} ignoreUpdate When set to true it will not fire the update event.
	 * @return {Zarafa.core.DateRange} this date range
	 */
	set : function(startDate, dueDate, silence, ignoreUpdate)
	{
		var original = null;

		// make sure that you are saving null when no valid date is passed
		startDate = Ext.isDate(startDate) ? startDate : null;
		dueDate = Ext.isDate(dueDate) ? dueDate : null;

		// Precondition
		if (!this.allowBlank && !Ext.isDate(startDate)) {
			throw 'Cannot set DateRange start to undefined';
		}

		if (!this.allowBlank && !Ext.isDate(dueDate)) {
			throw 'Cannot set DateRange due date to undefined';
		}

		if (Ext.isDate(startDate) && Ext.isDate(dueDate) && startDate.getTime() > dueDate.getTime() && !silence) {
			throw 'Invalid date range, start date is after due date';
		}

		ignoreUpdate = ignoreUpdate || (Ext.isDate(startDate) && Ext.isDate(dueDate) && (startDate.getTime() == this.getStartTime()) && (dueDate.getTime() == this.getDueTime()));

		if (!ignoreUpdate)
			original = this.clone();

		// don't fire update event from these functions
		this.setStartDate(startDate, true, true);
		this.setDueDate(dueDate, true, true);

		if (!ignoreUpdate) {
			this.fireEvent("update", this, original);
		}

		return this;
	},

	/**
	 * @return {Number} the range's start time in milliseconds since epoch, GMT.
	 */
	getStartTime : function()
	{
		return (Ext.isDate(this.startDate) && this.startDate.getTime()) || this.startDate;
	},
	
	/**
	 * @return {Number} the range's due time in milliseconds since epoch, GMT.
	 */
	getDueTime : function()
	{
		return (Ext.isDate(this.dueDate) && this.dueDate.getTime()) || this.dueDate;
	},

	/**
	 * Sets the range start time.
	 * @param {Number} startTime the range's start time.
	 * @param {Boolean} silence When set to true it will not throw an start date after due date error.
	 * @param {Boolean} ignoreUpdate When set to true it will not fire the update event.
	 * @return {Zarafa.core.DateRange} this date range
	 */
	setStartTime : function(startTime, silence, ignoreUpdate)
	{
		var original = null;

		// Preconditions
		if (!this.allowBlank && !startTime) {
			throw 'Cannot set DateRange start to undefined';
		} else if (Ext.isDate(this.dueDate) && startTime > this.dueDate.getTime() && !silence) {
			throw 'Cannot set DateRange start date to after its due date';
		}

		// No update event when new value equals old value
		ignoreUpdate = ignoreUpdate || (this.getStartTime() == startTime);

		if (!ignoreUpdate)
			original = this.clone();

		if (!Ext.isEmpty(startTime)) {
			this.startDate = new Date(startTime);
		} else {
			this.startDate = null;
		}

		if(!ignoreUpdate) {
			this.fireEvent("update", this, original);
		}

		return this;
	},

	/**
	 * Sets the range due time.
	 * @param {Number} dueTime the range's due time.
	 * @param {Boolean} silence When set to true it will not throw an start date after due date error.
	 * @param {Boolean} ignoreUpdate When set to true it will not fire the update event.
	 * @return {Zarafa.core.DateRange} this date range
	 */
	setDueTime : function(dueTime, silence, ignoreUpdate)
	{
		var original = null;

		// Precondition
		if (!this.allowBlank && !dueTime) {
			throw 'Cannot set DateRange due date to undefined';
		} else if (Ext.isDate(this.startDate) && dueTime < this.startDate.getTime() && !silence) {
			throw 'Cannot set DateRange due date to before its start date';
		}

		// No update event when new value equals old value
		ignoreUpdate = ignoreUpdate || (this.getDueTime() == dueTime);

		if (!ignoreUpdate)
			original = this.clone();

		if (!Ext.isEmpty(dueTime)) {
			this.dueDate = new Date(dueTime);
		} else {
			this.dueDate = null;
		}

		if(!ignoreUpdate) {
			this.fireEvent("update", this, original);
		}

		return this;
	},

	/**
	 * Sets the start and due times.
	 * @param {Number} startDate the range's start time.
	 * @param {Number} dueDate the range's due time.
	 * @param {Boolean} silence When set to true it will not throw an start date after due date error.
	 * @param {Boolean} ignoreUpdate When set to true it will not fire the update event.
	 * @return {Zarafa.core.DateRange} this date range
	 */
	setTime : function(startTime, dueTime, silence, ignoreUpdate)
	{
		var original = null;

		// Precondition
		if(!startTime || !dueTime) {
			if (!this.allowBlank && !startTime) {
				throw 'Cannot set DateRange start to undefined';
			}

			if (!this.allowBlank && !dueTime) {
				throw 'Cannot set DateRange due date to undefined';
			}
		} else if (startTime > dueTime && !silence) {
			throw 'Invalid date range, start date is after due date';
		}

		ignoreUpdate = ignoreUpdate || ((startTime == this.getStartTime()) && (dueTime == this.getDueTime()));

		if (!ignoreUpdate)
			original = this.clone();

		this.setStartTime(startTime, true, true);
		this.setDueTime(dueTime, true, true);

		if (!ignoreUpdate) {
			this.fireEvent("update", this, original);
		}

		return this;
	},

	/**
	 * @param {String} interval (optional) A valid date interval enum value.
	 * @return {Number} the range's duration in milliseconds
	 */
	getDuration : function(interval)
	{
		if (Ext.isDate(this.dueDate) && Ext.isDate(this.startDate)) {
			return Date.diff(interval || Date.MILLI, this.dueDate, this.startDate);
		}

		return 0;
	},

	/**
	 * @param {Number} duration the new duration of the range in milliseconds.
	 * @param {Boolean} ignoreUpdate When set to true it will not fire the update event.
	 * @return {Zarafa.core.DateRange} this date range
	 */
	setDuration : function(duration, ignoreUpdate)
	{
		var original = null;

		if(!Ext.isDate(this.startDate)) {
			// if no start date is provided then we can't set duration
			throw 'Cannot set duration when start date is not specified';
		}

		// No update event when new value equals old value
		ignoreUpdate = ignoreUpdate || (this.getDuration() == duration);

		if (!ignoreUpdate)
			original = this.clone();

		this.dueDate = new Date(this.getStartTime() + duration);

		if (!ignoreUpdate) {
			this.fireEvent("update", this, original);
		}

		return this;
	},
	
	/**
	 * Calculates the number of days spanned by this appointment, rounded to whole days. The function
	 * assumes that the range is an all day range. Even so, the rounding is still required to deal with
	 * date ranges that start and end in different time zones.
	 * 
	 * @return {Number} the number of days spanned by this appointment, rounded to whole days. 
	 */
	getNumDays : function()
	{
		var duration = this.getDuration(Date.DAY);
		if (Ext.isDefined(duration)) {
			return Math.round(duration);
		} else {
			return 0;
		}
	},
	
	/**
	 * Expands the range so that both the start and due times are multiples of the 'timeSlice' parameter. The start
	 * date is moved back, the due date is moved forward. Since this method does not care about time zones the value
	 * of 'timeSlice' is assumed to be <= 60 minutes.
	 * 
	 * @param {Number} timeSlice the time slice to 'snap' to.
	 * @return {Zarafa.core.DateRange} this date range
	 */
	expand : function(timeSlice)
	{
		var original = this.clone();

		if(Ext.isDate(this.startDate)) {
			this.startDate = new Date(this.getStartTime() - this.getStartTime() % timeSlice); 
		}

		if(Ext.isDate(this.dueDate)) {
			this.dueDate = new Date(this.getDueTime() + timeSlice - this.getDueTime() % timeSlice);
		}

		// only fire event if anything has changed
		if(Ext.isDate(this.startDate) || Ext.isDate(this.dueDate)) {
			this.fireEvent("update", this, original);
		}

		return this;
	},
	
	/**
	 * Deep-clones the date range.
	 * @return {Zarafa.core.DateRange} a clone of this date range.
	 */
	clone : function()
	{
		return new Zarafa.core.DateRange({
			startDate : Ext.isDate(this.startDate) ? new Date(this.getStartTime()) : undefined,
			dueDate : Ext.isDate(this.dueDate) ? new Date(this.getDueTime()) : undefined,
			allowBlank : this.allowBlank
		});
	},

	/**
	 * Test this date range for equality against another date range.
	 * @param {Zarafa.core.DateRange} otherRange a date range to compare with.
	 * @return {Boolean} true if this range equals the given other range.
	 */
	equals : function(otherRange)
	{
		if (!otherRange) {
			return false;
		}

		if(this.getStartTime() !== otherRange.getStartTime()) {
			// start dates don't match
			return false;
		}

		if(this.getDueTime() !== otherRange.getDueTime()) {
			// due dates don't match
			return false;
		}

		// both start/due dates matches
		return true;
	},
	
	/**
	 * Compares two date ranges for order. If range A comes before B, the function returns -1. If B comes before
	 * A, the function returns 1. If both are equal, this function returns 0. This functionality is equivalent
	 * to Java's Comparable interface.
	 * 
	 * Comparison is based on the range start. If the start dates are equal, further distinction is made by
	 * due date, with earlier due dates coming first.
	 * 
	 * Undefined dates will be considered as zero and compared.
	 * 
	 * @param {Zarafa.core.DateRange} otherRange Date range to compare with.
	 * @return {Number} If this range 'comes before' otherRange, the funtion returns -1. If this range 'comes
	 * after' otherRange, return 1. Otherwise return 0.
	 *   
	 */
	compare : function(otherRange)
	{
		// Compare start times.
		var aStartTime = this.getStartTime() || 0;
		var bStartTime = otherRange.getStartTime() || 0;

		if (aStartTime !== bStartTime)
			return aStartTime > bStartTime ? 1 : -1;

		// If start times are equal, compare due times.
		var aDueTime = this.getDueTime() || 0;
		var bDueTime = otherRange.getDueTime() || 0;

		if (aDueTime !== bDueTime)
			return aDueTime > bDueTime ? 1 : -1;
		
		// If ranges are equal, return 0.
		return 0;
	},
	
	/**
	 * Tests whether the date range is a so-called 'all day' range,
	 * meaning that start and due date duration time is more then one day(24 hours).
	 * @return {Boolean} true if the range is an all day range.
	 */
	isAllDay : function()
	{
		if(Ext.isDate(this.startDate) && Ext.isDate(this.dueDate) && !this.isZeroMinuteRange()) {
			return (this.startDate.clearTime(true).getTime() === this.getStartTime())
			&& (this.dueDate.clearTime(true).getTime() === this.getDueTime());
		}

		return false;
	},

	/**
	 * Tests whether the date range is a 0 minute.
	 * @return {Boolean} true if the range duration is 0 minute.
	 */
	isZeroMinuteRange : function()
	{
		return (this.dueDate.getTime() === this.startDate.getTime());
	},

	/**
	 * @return {Boolean} true if this date range overlaps with the other date range.
	 */
	overlaps : function(other)
	{
		var start1 = this.getStartTime(); 
		var due1 = this.getDueTime(); 
		var start2 = other.getStartTime();
		var due2 = other.getDueTime();

		return (start1 >= start2 && start1 < due2) || (start2 >= start1 && start2 < due1);
	},
	
	/**
	 * @param {Zarafa.core.DateRange} range date range to check against.
	 * @return {Boolean} true if this date range is inside the given date range.
	 */
	inside : function(range)
	{
		if(this.getStartTime() && range.getStartTime() && this.getDueTime() && range.getDueTime()) {
			return this.getStartTime() >= range.getStartTime() && this.getDueTime() <= range.getDueTime();
		}

		return false;
	},
	
	/**
	 * @param {Date} date the date to test.
	 * @return {Boolean} true if the give date is inside this date range.
	 */
	containsDate : function(date)
	{
		return this.getStartTime() <= date.getTime() && this.getDueTime() > date.getTime();
	},
	
	/**
	 * Formats the current visible date range as human-readable text. The formatter looks at which components the
	 * start and due dates have in common.
	 * For instance, the first and last days of a week range might lie in the same month (i.e. '13 - 19 July 2009'), 
	 * or they might not (i.e. '28 September - 2 November 2009'). Finally a range may have the start and end dates
	 * in different years, i.e. '28 December 2009 - 1 January 2010'. 
	 *   
	 * @return {String} the current date range as text. 
	 */
	format : function()
	{
		var startDate = this.startDate;
		var dueDate = this.dueDate;

		if(!Ext.isDate(startDate) || !Ext.isDate(dueDate)) {
			return '';
		}

		// If the due date is _exactly_ midnight, we must assume the last day of the period
		// is the previous day. So decrease the duedate with a day (making sure the duedate
		// does not move before the startDate).
		if (dueDate.getTime() === dueDate.clearTime(true).getTime()) {
			// Move to the previous day, use 12:00 as starting hour,
			// to prevent problems when the DST swithes at 00:00 (e.g. in Brasil).
			// We don't need to restore to the original time, as the string
			// which we are going to ignore doesn't contain a time representation.
			dueDate = dueDate.clone();
			dueDate.setHours(12);
			dueDate = dueDate.add(Date.DAY, -1);

			if (dueDate.getTime() < startDate.getTime())
				dueDate = startDate;
		}

		// The startDate and duedate are in completely different years.
		// Format the full date strings for both dates.
		if (startDate.getYear() != dueDate.getYear()) {
			// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
			return String.format('{0} - {1}', startDate.format(_('jS F Y')), dueDate.format(_('jS F Y')));
		}

		// The startDate and dueDate are in different months.
		// Format the date strings with the year in common.
		if (startDate.getMonth() != dueDate.getMonth()) {
			// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
			return String.format('{0} - {1} {2}', startDate.format(_('jS F')), dueDate.format(_('jS F')), startDate.format(_('Y')));
		}

		// The startDate and dueDate are on different days.
		// Format the date strings with the month and year in common.
		if (startDate.getDate() != dueDate.getDate()) {
			// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
			return String.format('{0} - {1} {2}', startDate.format(_('jS')), dueDate.format(_('jS')), startDate.format(_('F Y')));
		}

		// The startDate and dueDate are on the same day.
		// Format the date string with everything in common.
		// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
		return startDate.format(_('jS F Y'));
	}
});
