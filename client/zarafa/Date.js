/**
 * @class Date
 *
 * The date parsing and formatting syntax contains a subset of
 * <a href="http://www.php.net/date">PHP's date() function</a>, and the formats that are
 * supported will provide results equivalent to their PHP versions.
 *
 * The following is a list of all currently supported formats:
 * <pre>
Format  Description                                                               Example returned values
------  -----------------------------------------------------------------------   -----------------------
  d     Day of the month, 2 digits with leading zeros                             01 to 31
  D     A short textual representation of the day of the week                     Mon to Sun
  j     Day of the month without leading zeros                                    1 to 31
  l     A full textual representation of the day of the week                      Sunday to Saturday
  N     ISO-8601 numeric representation of the day of the week                    1 (for Monday) through 7 (for Sunday)
  S     English ordinal suffix for the day of the month, 2 characters             st, nd, rd or th. Works well with j
  w     Numeric representation of the day of the week                             0 (for Sunday) to 6 (for Saturday)
  z     The day of the year (starting from 0)                                     0 to 364 (365 in leap years)
  W     ISO-8601 week number of year, weeks starting on Monday                    01 to 53
  F     A full textual representation of a month, such as January or March        January to December
  m     Numeric representation of a month, with leading zeros                     01 to 12
  M     A short textual representation of a month                                 Jan to Dec
  n     Numeric representation of a month, without leading zeros                  1 to 12
  t     Number of days in the given month                                         28 to 31
  L     Whether it's a leap year                                                  1 if it is a leap year, 0 otherwise.
  o     ISO-8601 year number (identical to (Y), but if the ISO week number (W)    Examples: 1998 or 2004
  belongs to the previous or next year, that year is used instead)
  Y     A full numeric representation of a year, 4 digits                         Examples: 1999 or 2003
  y     A two digit representation of a year                                      Examples: 99 or 03
  a     Lowercase Ante meridiem and Post meridiem                                 am or pm
  A     Uppercase Ante meridiem and Post meridiem                                 AM or PM
  g     12-hour format of an hour without leading zeros                           1 to 12
  G     24-hour format of an hour without leading zeros                           0 to 23
  h     12-hour format of an hour with leading zeros                              01 to 12
  H     24-hour format of an hour with leading zeros                              00 to 23
  i     Minutes, with leading zeros                                               00 to 59
  s     Seconds, with leading zeros                                               00 to 59
  u     Decimal fraction of a second                                              Examples:
        (minimum 1 digit, arbitrary number of digits allowed)                     001 (i.e. 0.001s) or
                                                                                  100 (i.e. 0.100s) or
                                                                                  999 (i.e. 0.999s) or
                                                                                  999876543210 (i.e. 0.999876543210s)
  O     Difference to Greenwich time (GMT) in hours and minutes                   Example: +1030
  P     Difference to Greenwich time (GMT) with colon between hours and minutes   Example: -08:00
  T     Timezone abbreviation of the machine running the code                     Examples: EST, MDT, PDT ...
  Z     Timezone offset in seconds (negative if west of UTC, positive if east)    -43200 to 50400
  c     ISO 8601 date
        Notes:                                                                    Examples:
        1) If unspecified, the month / day defaults to the current month / day,   1991 or
           the time defaults to midnight, while the timezone defaults to the      1992-10 or
           browser's timezone. If a time is specified, it must include both hours 1993-09-20 or
           and minutes. The "T" delimiter, seconds, milliseconds and timezone     1994-08-19T16:20+01:00 or
           are optional.                                                          1995-07-18T17:21:28-02:00 or
        2) The decimal fraction of a second, if specified, must contain at        1996-06-17T18:22:29.98765+03:00 or
           least 1 digit (there is no limit to the maximum number                 1997-05-16T19:23:30,12345-0400 or
           of digits allowed), and may be delimited by either a '.' or a ','      1998-04-15T20:24:31.2468Z or
        Refer to the examples on the right for the various levels of              1999-03-14T20:24:32Z or
        date-time granularity which are supported, or see                         2000-02-13T21:25:33
        http://www.w3.org/TR/NOTE-datetime for more info.                         2001-01-12 22:26:34
  U     Seconds since the Unix Epoch (January 1 1970 00:00:00 GMT)                1193432466 or -2138434463
  M$    Microsoft AJAX serialized dates                                           \/Date(1238606590509)\/ (i.e. UTC milliseconds since epoch) or
                                                                                  \/Date(1238606590509+0800)\/
</pre>
 *
 * Example usage (note that you must escape format specifiers with '\\' to render them as character literals):
 * <pre><code>
// Sample date:
// 'Wed Jan 10 2007 15:05:01 GMT-0600 (Central Standard Time)'

var dt = new Date('1/10/2007 03:05:01 PM GMT-0600');
document.write(dt.format('Y-m-d'));                           // 2007-01-10
document.write(dt.format('F j, Y, g:i a'));                   // January 10, 2007, 3:05 pm
document.write(dt.format('l, \\t\\he jS \\of F Y h:i:s A'));  // Wednesday, the 10th of January 2007 03:05:01 PM
</code></pre>
 *
 * Here are some standard date/time patterns that you might find helpful.  They
 * are not part of the source of Date.js, but to use them you can simply copy this
 * block of code into any script that is included after Date.js and they will also become
 * globally available on the Date object.  Feel free to add or remove patterns as needed in your code.
 * <pre><code>
Date.patterns = {
    ISO8601Long:"Y-m-d H:i:s",
    ISO8601Short:"Y-m-d",
    ShortDate: "d/m/Y",
    LongDate: "l jS F Y",
    FullDateTime: "l jS F Y G:i:s",
    MonthDay: "jS F",
    ShortTime: "G:i",
    LongTime: "G:i:s",
    SortableDateTime: "Y-m-d\\TH:i:s",
    UniversalSortableDateTime: "Y-m-d H:i:sO",
    YearMonth: "F, Y"
};
</code></pre>
 *
 * Example usage:
 * <pre><code>
var dt = new Date();
document.write(dt.format(Date.patterns.ShortDate));
</code></pre>
 * <p>Developer-written, custom formats may be used by supplying both a formatting and a parsing function
 * which perform to specialized requirements. The functions are stored in {@link #parseFunctions} and {@link #formatFunctions}.</p>
 * #core
 */
Ext.apply(Date.prototype, {
	/**
	 * Provides a convenient method for performing basic date arithmetic. This method
	 * does not modify the Date instance being called - it creates and returns
	 * a new Date instance containing the resulting date value.
	 *
	 * Examples:
	 * <pre><code>
		// Basic usage:
		var dt = new Date('10/29/2006').add(Date.DAY, 5);
		document.write(dt); //returns 'Fri Nov 03 2006 00:00:00'

		// Negative values will be subtracted:
		var dt2 = new Date('10/1/2006').add(Date.DAY, -5);
		document.write(dt2); //returns 'Tue Sep 26 2006 00:00:00'

		// You can even chain several calls together in one line:
		var dt3 = new Date('10/1/2006').add(Date.DAY, 5).add(Date.HOUR, 8).add(Date.MINUTE, -30);
		document.write(dt3); //returns 'Fri Oct 06 2006 07:30:00'
	 * </code></pre>
	 *
	 * Furthermore, changes to {@link Date#HOUR hours}, {@link Date#MINUTE minutes},
	 * {@link Date#SECOND seconds} and {@link Date#MILLI milliseconds} are treated more accurately
	 * regarding DST changes then the {@link Date#DAY days}, {@link Date#MONTH months} and {@link Date#YEAR years}
	 * changes. When changing the time the standard is applied, which means that if the DST kicks in at 2AM,
	 * and the time becomes 3AM. Doing new Date('Mar 25 2012 01:00').add(Date.HOUR, 1) will be 'Mar 25 2012 03:00'.
	 * However when changing the date, we will use the JS behavior, which means that
	 * new Date('Mar 24 2012 02:00').add(Date.DAY, 1) could become 'Mar 25 2012 01:00' as JS will not correctly
	 * move the time correctly passed the DST switch.
	 *
	 * @param {String} interval A valid date interval enum value.
	 * @param {Number} value The amount to add to the current date.
	 * @return {Date} The new Date instance.
	 */
	add : function(interval, value)
	{
		var d = this.clone();
		if (!interval || value === 0) {
			return d;
		}

		switch(interval.toLowerCase()) {
			// Changing the time is done more accuretely then
			// changing the date. This is because we have to work
			// around DST issues (which we don't care for when
			// changing the day). In JS, we have the following
			// scenario at the following date: Mar 25 2012.
			// At 2:00:00 the DST kicks in and the time will be
			//     Mar 25 2012 03:00:00
			// However, when using setMilliseconds, setSeconds,
			// setMinutes or setHours, JS decides to wrap back
			// to:
			// 	Mar 25 2012 01:00:00
			// How can this go wrong, take the following date:
			//      a = new Date('Mar 25 2012 01:45:00')
			// add 30 minutes to it
			//      a.setMinutes(a.getMinutes() + 30)
			// we expect the time to be 03:15:00 however JS
			// decides to fall back to 01:15:00.
			// To fix this correctly, we have to work using timestamps
			// as JS is able to correctly step over the DST switch.
			case Date.HOUR:
				// Convert value to minutes
				value *= 60;
				/* falls through */
			case Date.MINUTE:
				// Convert value to seconds
				value *= 60;
				/* falls through */
			case Date.SECOND:
				// Convert value to milliseconds
				value *= 1000;
				/* falls through */
			case Date.MILLI:
				d = new Date(d.getTime() + value);
				break;
			// Changing the date is done with less accuracy,
			// basically we don't care if we come at exactly
			// the same time as before. If the JS decides to
			// perform weird tricks, then so be it.
			case Date.DAY:
				d.setDate(this.getDate() + value);
				break;
			case Date.MONTH:
				var day = this.getDate();
				if (day > 28) {
					day = Math.min(day, this.getFirstDateOfMonth().add(Date.MONTH, value).getLastDateOfMonth().getDate());
				}
				d.setDate(day);
				d.setMonth(this.getMonth() + value);
				break;
			case Date.YEAR:
				d.setFullYear(this.getFullYear() + value);
				break;
		}
		return d;
	},

	/**
	 * This should be called if the Date() object represents a UTC date, and we want to obtain
	 * the time it represents in UTC shown as if it was the localtime. This implies that:
	 *
	 * 00:00 UTC (01:00 GMT+0100) will be converted to 00:00 GMT+0100 (23:00 UTC)
	 *
	 * @return {Date} The UTC date
	 */
	toUTC : function()
	{
		var utc = new Date(this.getTime() + (this.getTimezoneOffset() * 60000));

		// Obtain the DST difference which might have occured during conversion,
		// if there was a difference it must be applied to the utc date accordingly.
		utc.setMilliseconds(utc.getMilliseconds() + Date.getDSTDiff(utc, this));

		return utc;
	},

	/**
	 * This should be called if the Date() was obtained using {@link #toUTC}, and we want
	 * to convert the date back to the local representation.
	 *
	 * 00:00 GMT+0100 (23:00 UTC) with be converted to 00:00 UTC (01:00 GMT+0100) 
	 *
	 * @return {Date} The local-time date
	 */
	fromUTC : function()
	{
		return new Date(this.getTime() - (this.getTimezoneOffset() * 60000));
	},

	/**
	 * Get the next given weekday starting from this date. If the current date is this weekday,
	 * then the current day will be returned.
	 * @param {Number} weekday The day in the week to skip to (0: Sunday -  6: Saturday). If
	 * not given, tomorrow will be returned.
	 * @return {Date} this or the clone
	 */
	getNextWeekDay : function(weekday)
	{
		var currentday = this.getDay();

		if (!Ext.isDefined(weekday)) {
			return this.add(Date.DAY, 1);
		} else if (weekday < currentday) {
			return this.add(Date.DAY, 7 - (currentday - weekday));
		} else {
			return this.add(Date.DAY, weekday - currentday);
		}
	},

	/**
	 * Get the previous given weekday starting from this date. If the current date is this weekday,
	 * then the current day will be returned.
	 * @param {Number} weekday The day in the week to skip to (0: Sunday -  6: Saturday). If
	 * not given, yesterday will be returned.
	 * @return {Date} this or the clone
	 */
	getPreviousWeekDay : function(weekday)
	{
		var currentday = this.getDay();

		if (!Ext.isDefined(weekday)) {
			return this.add(Date.DAY, -1);
		} else if (weekday <= currentday) {
			return this.add(Date.DAY, weekday - currentday);
		} else {
			return this.add(Date.DAY, -7 + (weekday - currentday));
		}
	},

	/**
	 * Get the next given working weekday starting from the date passed as argument or
	 * current date in case no argument was provided.
	 * @param {Date} currentDate (Optional) The date for which next working day should be returned
	 * @return {Date} Date fall on the next working day
	 */
	getNextWorkWeekDay : function(currentDate)
	{
		currentDate = currentDate || new Date();
		var nextDate = currentDate.getNextWeekDay();
		var workingDaysList = container.getSettingsModel().get('zarafa/v1/main/working_days');
		if (workingDaysList.indexOf(nextDate.getDay()) !== -1 ) {
			return nextDate;
		} else {
			return this.getNextWorkWeekDay(nextDate);
		}
	},

	/**
	 * Attempts to clear all Second and millisecond time information from this Date by rounding the time down
	 * to the current minute.
	 * @param {Boolean} clone true to create a clone of this date, clear the time and return it (defaults to false).
	 * @return {Date} this or the clone.
	 */
	clearSeconds : function(clone) 
	{
		if (clone) {
			return this.clone().clearSeconds();
		}

		// clear seconds
		this.setSeconds(0);
		this.setMilliseconds(0);

		return this;
	},

	/**
	 * Round the number of milliseconds/seconds/minutes or hours depending on the given value.
	 * Note that days, months and years cannot be rounded.
	 *
	 * Example of rounding:
	 *  9:12   round to 30	-> 9:00
	 *  9:17   round to 30	-> 9:30
	 *
	 * @param {String} field The field to round (e.g. {@link Date.MINUTE}, {@link Date.SECOND}, etc.)
	 * @param {Number} roundTimeValue The number of minutes to round the time to.
	 * @return {Date} this date
	 */
	round : function(field, roundTimeValue)
	{
		// For each field we have a slightly different approach.
		// In all cases, if the field-value is already rounded,
		// then we don't need to do anything.
		// The calculation for the rounded value looks a bit weird, but
		// it is a bit more optimal then calling this.floor() or this.ceiling().
		// For seconds or higher units, we set all smaller units to 0,
		// to correctly round of the entire time.
		var value;
		switch (field) {
			case Date.MILLI:
				value = this.getMilliseconds();
				if (value % roundTimeValue > 0) {
					this.setMilliseconds(value - (value % roundTimeValue) + (((value % roundTimeValue) >= (roundTimeValue / 2)) * roundTimeValue));
				}
				break;
			case Date.SECOND:
				value = this.getSeconds();
				if (value % roundTimeValue > 0) {
					this.setSeconds(value - (value % roundTimeValue) + (((value % roundTimeValue) >= (roundTimeValue / 2)) * roundTimeValue));
				}
				this.setMilliseconds(0);
				break;
			case Date.MINUTE:
				value = this.getMinutes();
				if (value % roundTimeValue > 0) {
					this.setMinutes(value - (value % roundTimeValue) + (((value % roundTimeValue) >= (roundTimeValue / 2)) * roundTimeValue));
				}
				this.setSeconds(0);
				this.setMilliseconds(0);
				break;
			case Date.HOUR:
				value = this.getHours();
				if (value % roundTimeValue > 0) {
					this.setHours(value - (value % roundTimeValue) + (((value % roundTimeValue) >= (roundTimeValue / 2)) * roundTimeValue));
				}
				this.setMinutes(0);
				this.setSeconds(0);
				this.setMilliseconds(0);
				break;
		}

		return this;
	},

	/**
	 * Function to ceil timings according to the passed ceil milliseconds, seconds, minutes or hours.
	 * Note that days, months and years cannot be ceiled.
	 * @param {String} field The field to ceil (e.g. {@link Date.MINUTE}, {@link Date.SECOND}, etc.)
	 * @param date ceilTimeValue date time which needs to be ceil (5/10/15/30/60 or so on)
	 * @return number Time number which is unixtimestamp of time.
	 *
	 * Example to understand what the code is actually suppose to do.
	 *	9:12	5min		ceil-9:15
	 *			10min		ceil-9.20
	 *			15min		ceil-9.15
	 *			30min		ceil-9.30
	 *			1hr/60min	ceil-10.00
	 *
	 */ 
	ceil : function(field, ceilTimeValue)
	{
		// For each field we have a slightly different approach.
		// In all cases, if the field-value is already rounded to the
		// given ceiling then we don't need to do anything.
		// For seconds or higher units, we set all smaller units to 0,
		// to correctly round of the entire time.
		var value;
		switch (field) {
			case Date.MILLI:
				value = this.getMilliseconds();
				if (value % ceilTimeValue > 0) {
					this.setMilliseconds(value - (value % ceilTimeValue) + ceilTimeValue);
				}
				break;
			case Date.SECOND:
				value = this.getSeconds();
				if (value % ceilTimeValue > 0) {
					this.setSeconds(value - (value % ceilTimeValue) + ceilTimeValue);
				}
				this.setMilliseconds(0);
				break;
			case Date.MINUTE:
				value = this.getMinutes();
				if (value % ceilTimeValue > 0) {
					this.setMinutes(value - (value % ceilTimeValue) + ceilTimeValue);
				}
				this.setSeconds(0);
				this.setMilliseconds(0);
				break;
			case Date.HOUR:
				value = this.getHours();
				if (value % ceilTimeValue > 0) {
					this.setHours(value - (value % ceilTimeValue) + ceilTimeValue);
				}
				this.setMinutes(0);
				this.setSeconds(0);
				this.setMilliseconds(0);
				break;
		}

		return this;
	},

	/**
	 * Function to floor timings according to the passed floor milliseconds, seconds, minutes or hours.
	 * Note that days, months and years cannot be floored.
	 * @param {String} field The field to floor (e.g. {@link Date.MINUTE}, {@link Date.SECOND}, etc.)
	 * @param {Number} floorTimeValue date time which needs to be floor (5/10/15/30/60 or so on)
	 * @return {Date} This Date object
	 *
	 * Example to understand what the code is actually suppose to do.
	 *	9:12	5min		floor-9.10
	 *			10min		floor-9.10
	 *			15min		floor-9.00
	 *			30min		floor-9.00
	 *			1hr/60min	floor-9.00
	 *
	 */ 
	floor : function(field, floorTimeValue)
	{
		// For each field we have a slightly different approach.
		// In all cases, if the field-value is already rounded to the
		// given floor then we don't need to do anything.
		// For seconds or higher units, we set all smaller units to 0,
		// to correctly round of the entire time.
		var value;
		switch (field) {
			case Date.MILLI:
				value = this.getMilliseconds();
				if (value % floorTimeValue > 0) {
					this.setMilliseconds(value - (value % floorTimeValue));
				}
				break;
			case Date.SECOND:
				value = this.getSeconds();
				if (value % floorTimeValue > 0) {
					this.setSeconds(value - (value % floorTimeValue));
				}
				this.setMilliseconds(0);
				break;
			case Date.MINUTE:
				value = this.getMinutes();
				if (value % floorTimeValue > 0) {
					this.setMinutes(value - (value % floorTimeValue));
				}
				this.setSeconds(0);
				this.setMilliseconds(0);
				break;
			case Date.HOUR:
				value = this.getHours();
				if (value % floorTimeValue > 0) {
					this.setHours(value - (value % floorTimeValue));
				}
				this.setMinutes(0);
				this.setSeconds(0);
				this.setMilliseconds(0);
				break;
		}

		return this;
	},

	/**
	 * Get the week number of the month (1 to 5)
	*/
	getWeekOfMonth : function()
	{
		// get current week number in year
		var currentWeek = this.getWeekOfYear();

		// get month's first week number in year
		var monthStartDate = this.add(Date.DAY, -(this.getDate() - 1));
		var monthStartWeek = monthStartDate.getWeekOfYear();

		return currentWeek - monthStartWeek + 1; 
	}
});

Ext.apply(Date, {
	/**
	 * The number milliseconds per day
	 *
	 * @property
	 * @type Number
	 */
	dayInMillis : 24 * 60 * 60 * 1000,

	/**
	 * Calculate the DST difference between the 2 given dates.
	 * The first date serves as base, so when 'date' is not DST, but
	 * the second date is DST then a negative offset is returned. A
	 * positive value is returned when it is the other way around.
	 * When both dates have the same DST offset then this returns 0.
	 * @param {Date} date The base date from where the DST is calculated.
	 * @return {Number} milliseconds The DST difference in milliseconds
	 */
	getDSTDiff : function(a, b)
	{
		return (a.getTimezoneOffset() - b.getTimezoneOffset()) * 60 * 1000;
	},

	/**
	 * Calculates the difference between the 2 given dates.
	 * This applies the {@link #getDSTDiff} if needed to ensure that
	 * it always calculates the correct difference regardless of the DST changes
	 * which might have been made.
	 *
	 * In its absolute basic this function is equal to 'a.getTime() - b.getTime()'.
	 *
	 * @param {String} field The field which indicates the accuracy of the diff (e.g. {@link Date.MINUTE}, {@link Date.SECOND}, etc.)
	 * @param {Date} a The date object
	 * @param {Date} b The date object
	 * @return {Number} The difference between the 2 given dates
	 */
	diff : function(field, a, b)
	{
		var ta = a.getTime();
		var tb = b.getTime();
		var difference = ta-tb;

		switch (field) {
			case Date.DAY:
				// For calculating days we apply the same
				// inaccuracy as Date::add() we are not 100%
				// sure a day lasts 24 hour when DST is in play.
				difference -= Date.getDSTDiff(a, b);
				difference /= 24;
				/* falls through */
			case Date.HOUR:
				difference /= 60;
				/* falls through */
			case Date.MINUTE:
				difference /= 60;
				/* falls through */
			case Date.SECOND:
				difference /= 1000;
				/* falls through */
			case Date.MILLI:
				/* falls through */
			default:
				break;
		}

		return difference;
	},

	/**
	 * Function to getTimezone and all dst props
	 * This is a hard one. To create a recurring appointment, we need to save
	 * the start and end time of the appointment in local time. So if I'm in 
	 * GMT+8, and I want the appointment at 9:00, I will simply save 9*60 = 540
	 * in the startDate. To make this usable for other users in other timezones,
	 * we have to tell the server in which timezone this is. The timezone is normally
	 * defined as a startdate and enddate for DST, the offset in minutes (so GMT+2 is 120)
	 * plus the extra DST offset when DST is in effect. 
	 *
	 * We can't retrieve this directly from the browser, so we assume that the DST change
	 * will occure on a Sunday at 2:00 or 3:00 AM, and simply scan all the sundays in a
	 * year, looking for changes. We then have to guess which bit is DST and which is 'normal'
	 * by assuming that the DST offset will be less than the normal offset. From this we
	 * calculate the start and end dates of DST and the actuall offset in minutes.
	 *
	 * Unfortunately we can't detect the difference between 'the last week of october' and
	 * 'the fourth week of october'. This can cause subtle problems, so we assume 'last week'
	 * because this is most prevalent.
	 * 
	 * Note that this doesn't work for many strange DST changes, see 
	 * http://webexhibits.org/daylightsaving/g.html
	 * @static
	 */
	getTimezoneStruct : function()
	{
		var tzswitch = [],
			switchCount = 0,
			testDate = new Date(),
			tzStruct = {};

		// Clear the time
		testDate.setMonth(0);
		testDate.setDate(1);
		testDate.setMinutes(0);
		testDate.setSeconds(0);
		testDate.setMilliseconds(0);

		// Move to the next sunday
		testDate = testDate.getNextWeekDay(0);

		// Use 5:00 am because any change should have happened by then
		testDate.setHours(5);

		var lastoffset = testDate.getTimezoneOffset();

		for(var weekNr = 0; weekNr < 52; weekNr++) {
			if(testDate.getTimezoneOffset() != lastoffset) {
				// Found a switch
				tzswitch[switchCount] = {
					switchweek : testDate.getWeekOfMonth(),
					switchmonth : testDate.getMonth(),
					offset : testDate.getTimezoneOffset()
				};

				switchCount++;

				// We assume DST is only set or removed once per year
				if(switchCount == 2) {
					break;
				}
					
				lastoffset = testDate.getTimezoneOffset();
			}
			
			// advance one week
			testDate = testDate.add(Date.DAY, 7);
		}
		
		if(switchCount === 0) {
			// No DST in this timezone
			tzStruct = {
				timezone : testDate.getTimezoneOffset(),
				timezonedst : 0,
				dststartday : 0,
				dststartweek : 0,
				dststartmonth : 0,
				dststarthour : 0,
				dstendday : 0,
				dstendweek : 0,
				dstendmonth : 0,
				dstendhour : 0
			};

			return tzStruct;
		} else if(switchCount == 1) {
			// This should be impossible unless DST started somewhere in the year 2000
			// and ended more than a year later. This is an error.
			return tzStruct;
		} else if(switchCount == 2) {
			if(tzswitch[0].offset < tzswitch[1].offset) {
				// Northern hemisphere, eg DST is during Mar-Oct
				tzStruct = {
					timezone : tzswitch[1].offset,
					timezonedst : tzswitch[0].offset - tzswitch[1].offset,
					dststartday : 0, // assume sunday
					dststartweek : tzswitch[0].switchweek == 4 ? 5 : tzswitch[0].switchweek, // assume 'last' week if week = 4
					dststartmonth : tzswitch[0].switchmonth + 1, // javascript months are zero index based
					dststarthour : 2, // Start at 02:00 AM
					dstendday : 0,
					dstendweek : tzswitch[1].switchweek == 4 ? 5 : tzswitch[1].switchweek,
					dstendmonth : tzswitch[1].switchmonth + 1,
					dstendhour : 3
				};

				return tzStruct;
				
			} else {
				// Southern hemisphere, eg DST is during Oct-Mar
				tzStruct = {
					timezone : tzswitch[0].offset,
					timezonedst : tzswitch[1].offset - tzswitch[0].offset,
					dststartday : 0, // assume sunday
					dststartweek : tzswitch[1].switchweek == 4 ? 5 : tzswitch[1].switchweek, // assume 'last' week if week = 4
					dststartmonth : tzswitch[1].switchmonth + 1,
					dststarthour : 2, // Start at 02:00 AM
					dstendday : 0,
					dstendweek : tzswitch[0].switchweek == 4 ? 5 : tzswitch[0].switchweek,
					dstendmonth : tzswitch[0].switchmonth + 1,
					dstendhour : 3
				};
				
				return tzStruct;
			}
		} else {
			// Multi-DST timezone ? This is also an error.
			return tzStruct;
		}
	}
});
