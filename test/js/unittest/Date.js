/*
 * Test the Date extensions
 *
 * Some tests are disabled for Firefox (gecko) due to the following bug:
 * https://bugzilla.mozilla.org/show_bug.cgi?id=883775
 */
describe('Date', function() {
	const format = 'D M d Y H:i:s \\G\\M\\TO';

	describe('add', function() {
		/*
		 * Test switching from winter to summer time.
		 *
		 */
		describe('Change to Summer Time', function() {
			it('can add milliseconds to a date', function() {
				// The Dutch date on which we start daylight saving in 2017
				const value = new Date('Mar 26 2017 01:00:00');

				expect(value.add(Date.MILLI, 30 * 60 * 1000).format(format)).toEqual('Sun Mar 26 2017 01:30:00 GMT+0100');
				expect(value.add(Date.MILLI, 60 * 60 * 1000).format(format)).toEqual('Sun Mar 26 2017 03:00:00 GMT+0200');
				expect(value.add(Date.MILLI, 90 * 60 * 1000).format(format)).toEqual('Sun Mar 26 2017 03:30:00 GMT+0200');
				expect(value.add(Date.MILLI, 120 * 60 * 1000).format(format)).toEqual('Sun Mar 26 2017 04:00:00 GMT+0200');
			});

			it('can add seconds to a date', function() {
				// The Dutch date on which we start daylight saving in 2017
				const value = new Date('Mar 26 2017 01:00:00');

				expect(value.add(Date.SECOND, 30 * 60).format(format)).toEqual('Sun Mar 26 2017 01:30:00 GMT+0100');
				expect(value.add(Date.SECOND, 60 * 60).format(format)).toEqual('Sun Mar 26 2017 03:00:00 GMT+0200');
				expect(value.add(Date.SECOND, 90 * 60).format(format)).toEqual('Sun Mar 26 2017 03:30:00 GMT+0200');
				expect(value.add(Date.SECOND, 120 * 60).format(format)).toEqual('Sun Mar 26 2017 04:00:00 GMT+0200');
			});

			it('can add minutes to a date', function() {
				// The Dutch date on which we start daylight saving in 2017
				var value = new Date('Mar 26 2017 01:00:00');

				expect(value.add(Date.MINUTE, 30).format(format)).toEqual('Sun Mar 26 2017 01:30:00 GMT+0100');
				expect(value.add(Date.MINUTE, 60).format(format)).toEqual('Sun Mar 26 2017 03:00:00 GMT+0200');
				expect(value.add(Date.MINUTE, 90).format(format)).toEqual('Sun Mar 26 2017 03:30:00 GMT+0200');
				expect(value.add(Date.MINUTE, 120).format(format)).toEqual('Sun Mar 26 2017 04:00:00 GMT+0200');
			});

			it('can add hours to a date', function() {
				// The Dutch date on which we start daylight saving in 2017
				var value = new Date('Mar 26 2017 00:00:00');

				expect(value.add(Date.HOUR, 1).format(format)).toEqual('Sun Mar 26 2017 01:00:00 GMT+0100');
				expect(value.add(Date.HOUR, 2).format(format)).toEqual('Sun Mar 26 2017 03:00:00 GMT+0200');
				expect(value.add(Date.HOUR, 3).format(format)).toEqual('Sun Mar 26 2017 04:00:00 GMT+0200');
			});

			xit('can add days to a date', function() {
				var value = new Date('Mar 26 2017 02:00:00');

				// First value is technically incorrect, but see Date::add() documentation for acceptance
				expect(value.add(Date.DAY, 1).format(format)).toEqual('Sun Mar 26 2017 01:00:00 GMT+0100');
				expect(value.add(Date.DAY, 2).format(format)).toEqual('Mon Mar 27 2017 02:00:00 GMT+0200');
			});

			xit('can add months to a date', function() {
				var value = new Date('Feb 26 2017 02:00:00');

				// First value is technically incorrect, but see Date::add() documentation for acceptance
				expect(value.add(Date.MONTH, 1).format(format)).toEqual('Sun Mar 26 2017 01:00:00 GMT+0100');
				expect(value.add(Date.MONTH, 2).format(format)).toEqual('Wed Apr 26 2017 02:00:00 GMT+0200');
			});

			xit('can add a year to a date', function() {
				var value = new Date('Mar 26 2017 02:00:00');

				// First value is technically incorrect, but see Date::add() documentation for acceptance
				expect(value.add(Date.YEAR, 1).format(format)).toEqual('Sun Mar 26 2017 01:00:00 GMT+0100');
				expect(value.add(Date.YEAR, 2).format(format)).toEqual('Tue Mar 27 2018 02:00:00 GMT+0200');
			});
		});

		/*
		 * Test switching from summer to winter time.
		 */
		describe('Change to Winter Time', function() {
			it('can add milliseconds to a date', function() {
				// The Dutch date on which we end daylight saving in 2017
				var value = new Date('Oct 29 2017 01:00:00');

				expect(value.add(Date.MILLI, 30 * 60 * 1000).format(format)).toEqual('Sun Oct 29 2017 01:30:00 GMT+0200');
				expect(value.add(Date.MILLI, 60 * 60 * 1000).format(format)).toEqual('Sun Oct 29 2017 02:00:00 GMT+0200');
				expect(value.add(Date.MILLI, 90 * 60 * 1000).format(format)).toEqual('Sun Oct 29 2017 02:30:00 GMT+0200');
				expect(value.add(Date.MILLI, 120 * 60 * 1000).format(format)).toEqual('Sun Oct 29 2017 02:00:00 GMT+0100');
				expect(value.add(Date.MILLI, 150 * 60 * 1000).format(format)).toEqual('Sun Oct 29 2017 02:30:00 GMT+0100');
				expect(value.add(Date.MILLI, 180 * 60 * 1000).format(format)).toEqual('Sun Oct 29 2017 03:00:00 GMT+0100');
			});

			it('can add seconds to a date', function() {
				// The Dutch date on which we end daylight saving in 2017
				var value = new Date('Oct 29 2017 01:00:00');

				expect(value.add(Date.SECOND, 30 * 60).format(format)).toEqual('Sun Oct 29 2017 01:30:00 GMT+0200');
				expect(value.add(Date.SECOND, 60 * 60).format(format)).toEqual('Sun Oct 29 2017 02:00:00 GMT+0200');
				expect(value.add(Date.SECOND, 90 * 60).format(format)).toEqual('Sun Oct 29 2017 02:30:00 GMT+0200');
				expect(value.add(Date.SECOND, 120 * 60).format(format)).toEqual('Sun Oct 29 2017 02:00:00 GMT+0100');
				expect(value.add(Date.SECOND, 150 * 60).format(format)).toEqual('Sun Oct 29 2017 02:30:00 GMT+0100');
				expect(value.add(Date.SECOND, 180 * 60).format(format)).toEqual('Sun Oct 29 2017 03:00:00 GMT+0100');
			});

			it('can add minutes to a date', function() {
				// The Dutch date on which we end daylight saving in 2017
				var value = new Date('Oct 29 2017 01:00:00');

				expect(value.add(Date.MINUTE, 30).format(format)).toEqual('Sun Oct 29 2017 01:30:00 GMT+0200');
				expect(value.add(Date.MINUTE, 60).format(format)).toEqual('Sun Oct 29 2017 02:00:00 GMT+0200');
				expect(value.add(Date.MINUTE, 90).format(format)).toEqual('Sun Oct 29 2017 02:30:00 GMT+0200');
				expect(value.add(Date.MINUTE, 120).format(format)).toEqual('Sun Oct 29 2017 02:00:00 GMT+0100');
				expect(value.add(Date.MINUTE, 150).format(format)).toEqual('Sun Oct 29 2017 02:30:00 GMT+0100');
				expect(value.add(Date.MINUTE, 180).format(format)).toEqual('Sun Oct 29 2017 03:00:00 GMT+0100');
			});

			it('can add hours to a date', function() {
				// The Dutch date on which we end daylight saving in 2017
				var value = new Date('Oct 29 2017 00:00:00');

				expect(value.add(Date.HOUR, 1).format(format)).toEqual('Sun Oct 29 2017 01:00:00 GMT+0200');
				expect(value.add(Date.HOUR, 2).format(format)).toEqual('Sun Oct 29 2017 02:00:00 GMT+0200');
				expect(value.add(Date.HOUR, 3).format(format)).toEqual('Sun Oct 29 2017 02:00:00 GMT+0100');
				expect(value.add(Date.HOUR, 4).format(format)).toEqual('Sun Oct 29 2017 03:00:00 GMT+0100');
			});

			xit('can add days to a date', function() {
				// The Dutch date on which we end daylight saving in 2017
				var value = new Date('Oct 29 2017 02:00:00');

				// First value is technically incorrect, but see Date::add() documentation for acceptance
				expect(value.add(Date.DAY, 1).format(format)).toEqual('Sun Oct 29 2017 02:00:00 GMT+0100');
				expect(value.add(Date.DAY, 2).format(format)).toEqual('Mon Oct 30 2017 02:00:00 GMT+0100');
			});

			xit('can add months to a date', function() {
				var value = new Date('Sep 30 2017 02:00:00');

				// First value is technically incorrect, but see Date::add() documentation for acceptance
				expect(value.add(Date.MONTH, 1).format(format)).toEqual('Sun Oct 29 2017 02:00:00 GMT+0100');
				expect(value.add(Date.MONTH, 2).format(format)).toEqual('Wed Nov 29 2017 02:00:00 GMT+0100');
			});

			xit('can add a year to a date', function() {
				var value = new Date('Oct 29 2016 02:00:00');

				// First value is technically incorrect, but see Date::add() documentation for acceptance
				expect(value.add(Date.YEAR, 1).format(format)).toEqual('Sun Oct 30 2017 02:00:00 GMT+0100');
				expect(value.add(Date.YEAR, 2).format(format)).toEqual('Tue Oct 30 2018 02:00:00 GMT+0100');
			});
		});
	});

	describe('substract', function() {
		/*
		 * Test switching from winter to summer time.
		 */
		describe('Change to Summer Time', function() {
			it('can substract milliseconds from a date', function() {
				// The Dutch date on which we start daylight saving in 2017
				var value = new Date('Mar 26 2017 04:00:00');

				expect(value.add(Date.MILLI, -30 * 60 * 1000).format(format)).toEqual('Sun Mar 26 2017 03:30:00 GMT+0200');
				expect(value.add(Date.MILLI, -60 * 60 * 1000).format(format)).toEqual('Sun Mar 26 2017 03:00:00 GMT+0200');
				expect(value.add(Date.MILLI, -90 * 60 * 1000).format(format)).toEqual('Sun Mar 26 2017 01:30:00 GMT+0100');
				expect(value.add(Date.MILLI, -120 * 60 * 1000).format(format)).toEqual('Sun Mar 26 2017 01:00:00 GMT+0100');
				expect(value.add(Date.MILLI, -150 * 60 * 1000).format(format)).toEqual('Sun Mar 26 2017 00:30:00 GMT+0100');
				expect(value.add(Date.MILLI, -180 * 60 * 1000).format(format)).toEqual('Sun Mar 26 2017 00:00:00 GMT+0100');
			});

			it('can substract seconds from a date', function() {
				// The Dutch date on which we start daylight saving in 2017
				var value = new Date('Mar 26 2017 04:00:00');

				expect(value.add(Date.SECOND, -30 * 60).format(format)).toEqual('Sun Mar 26 2017 03:30:00 GMT+0200');
				expect(value.add(Date.SECOND, -60 * 60).format(format)).toEqual('Sun Mar 26 2017 03:00:00 GMT+0200');
				expect(value.add(Date.SECOND, -90 * 60).format(format)).toEqual('Sun Mar 26 2017 01:30:00 GMT+0100');
				expect(value.add(Date.SECOND, -120 * 60).format(format)).toEqual('Sun Mar 26 2017 01:00:00 GMT+0100');
				expect(value.add(Date.SECOND, -150 * 60).format(format)).toEqual('Sun Mar 26 2017 00:30:00 GMT+0100');
				expect(value.add(Date.SECOND, -180 * 60).format(format)).toEqual('Sun Mar 26 2017 00:00:00 GMT+0100');
			});

			it('can substract minutes from a date', function() {
				// The Dutch date on which we start daylight saving in 2017
				var value = new Date('Mar 26 2017 04:00:00');

				expect(value.add(Date.MINUTE, -30).format(format)).toEqual('Sun Mar 26 2017 03:30:00 GMT+0200');
				expect(value.add(Date.MINUTE, -60).format(format)).toEqual('Sun Mar 26 2017 03:00:00 GMT+0200');
				expect(value.add(Date.MINUTE, -90).format(format)).toEqual('Sun Mar 26 2017 01:30:00 GMT+0100');
				expect(value.add(Date.MINUTE, -120).format(format)).toEqual('Sun Mar 26 2017 01:00:00 GMT+0100');
				expect(value.add(Date.MINUTE, -150).format(format)).toEqual('Sun Mar 26 2017 00:30:00 GMT+0100');
				expect(value.add(Date.MINUTE, -180).format(format)).toEqual('Sun Mar 26 2017 00:00:00 GMT+0100');
			});

			it('can substract hours from a date', function() {
				var value = new Date('Mar 26 2017 04:00:00');

				expect(value.add(Date.HOUR, -1).format(format)).toEqual('Sun Mar 26 2017 03:00:00 GMT+0200');
				expect(value.add(Date.HOUR, -2).format(format)).toEqual('Sun Mar 26 2017 01:00:00 GMT+0100');
				expect(value.add(Date.HOUR, -3).format(format)).toEqual('Sun Mar 26 2017 00:00:00 GMT+0100');
			});

			xit('can substract days from a date', function() {
				var value = new Date('Mar 27 2017 02:00:00');

				// First value is technically incorrect, but see Date::add() documentation for acceptance
				expect(value.add(Date.DAY, -1).format(format)).toEqual('Sun Mar 26 2017 01:00:00 GMT+0100');
				expect(value.add(Date.DAY, -2).format(format)).toEqual('Sat Mar 25 2017 02:00:00 GMT+0100');
			});

			xit('can substract months from a date', function() {
				var value = new Date('Apr 27 2017 02:00:00');

				// First value is technically incorrect, but see Date::add() documentation for acceptance
				expect(value.add(Date.MONTH, -1).format(format)).toEqual('Sun Mar 27 2017 01:00:00 GMT+0100');
				expect(value.add(Date.MONTH, -2).format(format)).toEqual('Sun Feb 27 2017 02:00:00 GMT+0100');
			});

			xit('can substract a year from a date', function() {
				var value = new Date('Mar 27 2018 02:00:00');

				// First value is technically incorrect, but see Date::add() documentation for acceptance
				expect(value.add(Date.YEAR, -1).format(format)).toEqual('Sun Mar 27 2017 01:00:00 GMT+0100');
				expect(value.add(Date.YEAR, -2).format(format)).toEqual('Sat Mar 27 2016 02:00:00 GMT+0100');
			});
		});

		/*
		 * Test switching from summer to winter time.
		 */
		describe('Change to Winter Time', function() {

			it('can substract milliseconds from a date', function() {
				// The Dutch date on which we end daylight saving in 2017
				var value = new Date('Oct 29 2017 04:00:00');

				expect(value.add(Date.MILLI, -30 * 60 * 1000).format(format)).toEqual('Sun Oct 29 2017 03:30:00 GMT+0100');
				expect(value.add(Date.MILLI, -60 * 60 * 1000).format(format)).toEqual('Sun Oct 29 2017 03:00:00 GMT+0100');
				expect(value.add(Date.MILLI, -90 * 60 * 1000).format(format)).toEqual('Sun Oct 29 2017 02:30:00 GMT+0100');
				expect(value.add(Date.MILLI, -120 * 60 * 1000).format(format)).toEqual('Sun Oct 29 2017 02:00:00 GMT+0100');
				expect(value.add(Date.MILLI, -150 * 60 * 1000).format(format)).toEqual('Sun Oct 29 2017 02:30:00 GMT+0200');
				expect(value.add(Date.MILLI, -180 * 60 * 1000).format(format)).toEqual('Sun Oct 29 2017 02:00:00 GMT+0200');
			});

			it('can substract seconds from a date', function() {
				// The Dutch date on which we end daylight saving in 2017
				var value = new Date('Oct 29 2017 04:00:00');

				expect(value.add(Date.SECOND, -30 * 60).format(format)).toEqual('Sun Oct 29 2017 03:30:00 GMT+0100');
				expect(value.add(Date.SECOND, -60 * 60).format(format)).toEqual('Sun Oct 29 2017 03:00:00 GMT+0100');
				expect(value.add(Date.SECOND, -90 * 60).format(format)).toEqual('Sun Oct 29 2017 02:30:00 GMT+0100');
				expect(value.add(Date.SECOND, -120 * 60).format(format)).toEqual('Sun Oct 29 2017 02:00:00 GMT+0100');
				expect(value.add(Date.SECOND, -150 * 60).format(format)).toEqual('Sun Oct 29 2017 02:30:00 GMT+0200');
				expect(value.add(Date.SECOND, -180 * 60).format(format)).toEqual('Sun Oct 29 2017 02:00:00 GMT+0200');
			});

			it('can substract minutes from a date', function() {
				// The Dutch date on which we end daylight saving in 2017
				var value = new Date('Oct 29 2017 04:00:00');

				expect(value.add(Date.MINUTE, -30).format(format)).toEqual('Sun Oct 29 2017 03:30:00 GMT+0100');
				expect(value.add(Date.MINUTE, -60).format(format)).toEqual('Sun Oct 29 2017 03:00:00 GMT+0100');
				expect(value.add(Date.MINUTE, -90).format(format)).toEqual('Sun Oct 29 2017 02:30:00 GMT+0100');
				expect(value.add(Date.MINUTE, -120).format(format)).toEqual('Sun Oct 29 2017 02:00:00 GMT+0100');
				expect(value.add(Date.MINUTE, -150).format(format)).toEqual('Sun Oct 29 2017 02:30:00 GMT+0200');
				expect(value.add(Date.MINUTE, -180).format(format)).toEqual('Sun Oct 29 2017 02:00:00 GMT+0200');
			});

			it('can substract hours from a date', function() {
				// The Dutch date on which we end daylight saving in 2017
				var value = new Date('Oct 29 2017 04:00:00');

				expect(value.add(Date.HOUR, -1).format(format)).toEqual('Sun Oct 29 2017 03:00:00 GMT+0100');
				expect(value.add(Date.HOUR, -2).format(format)).toEqual('Sun Oct 29 2017 02:00:00 GMT+0100');
				expect(value.add(Date.HOUR, -3).format(format)).toEqual('Sun Oct 29 2017 02:00:00 GMT+0200');
				expect(value.add(Date.HOUR, -4).format(format)).toEqual('Sun Oct 29 2017 01:00:00 GMT+0200');
			});

			it('can subtract days from a date', function() {
				var value = new Date('Oct 30 2017 03:00:00');

				// First value is technically incorrect, but see Date::add() documentation for acceptance
				expect(value.add(Date.DAY, -1).format(format)).toEqual('Sun Oct 29 2017 03:00:00 GMT+0100');
				expect(value.add(Date.DAY, -2).format(format)).toEqual('Sat Oct 28 2017 03:00:00 GMT+0200');
			});

			it('can substract months from a date', function() {
				var value = new Date('Nov 30 2017 02:00:00');

				// First value is technically incorrect, but see Date::add() documentation for acceptance
				expect(value.add(Date.MONTH, -1).format(format)).toEqual('Mon Oct 30 2017 02:00:00 GMT+0100');
				expect(value.add(Date.MONTH, -2).format(format)).toEqual('Sat Sep 30 2017 02:00:00 GMT+0200');
			});

			it('can substract a year from a date', function() {
				var value = new Date('Mar 27 2017 02:00:00');

				// First value is technically incorrect, but see Date::add() documentation for acceptance
				expect(value.add(Date.YEAR, -1).format(format)).toEqual('Sun Mar 27 2016 03:00:00 GMT+0200');
				expect(value.add(Date.YEAR, -2).format(format)).toEqual('Fri Mar 27 2015 02:00:00 GMT+0100');
			});
		});
	});

	/**
	 * Test that we can step to a given weekday
	 */
	describe('Stepping', function() {

		it('can step to tomorrow', function() {
			var value = new Date('Jul 27 2017 16:00:00');
			expect(value.getNextWeekDay()).toEqual(new Date('Jul 28 2017 16:00:00'));
		});

		it('can step to the next friday', function() {
			var value = new Date('Jan 01 2017 16:00:00');

			// Go over all months to get various possibilities for stepping.
			expect(value.getNextWeekDay(5)).toEqual(new Date('Jan 06 2017 16:00:00'));
			value = value.add(Date.MONTH, 1);
			expect(value.getNextWeekDay(5)).toEqual(new Date('Feb 03 2017 16:00:00'));
			value = value.add(Date.MONTH, 1);
			expect(value.getNextWeekDay(5)).toEqual(new Date('Mar 03 2017 16:00:00'));
			value = value.add(Date.MONTH, 1);
			expect(value.getNextWeekDay(5)).toEqual(new Date('Apr 07 2017 16:00:00'));
			value = value.add(Date.MONTH, 1);
			expect(value.getNextWeekDay(5)).toEqual(new Date('May 05 2017 16:00:00'));
			value = value.add(Date.MONTH, 1);
			expect(value.getNextWeekDay(5)).toEqual(new Date('Jun 02 2017 16:00:00'));
			value = value.add(Date.MONTH, 1);
			expect(value.getNextWeekDay(5)).toEqual(new Date('Jul 07 2017 16:00:00'));
			value = value.add(Date.MONTH, 1);
			expect(value.getNextWeekDay(5)).toEqual(new Date('Aug 04 2017 16:00:00'));
			value = value.add(Date.MONTH, 1);
			expect(value.getNextWeekDay(5)).toEqual(new Date('Sep 01 2017 16:00:00'));
			value = value.add(Date.MONTH, 1);
			expect(value.getNextWeekDay(5)).toEqual(new Date('Oct 06 2017 16:00:00'));
			value = value.add(Date.MONTH, 1);
			expect(value.getNextWeekDay(5)).toEqual(new Date('Nov 03 2017 16:00:00'));
			value = value.add(Date.MONTH, 1);
			expect(value.getNextWeekDay(5)).toEqual(new Date('Dec 01 2017 16:00:00'));
		});

		it('can step from non-DST to next DST monday correctly', function() {
			var value = new Date('Mar 26 2017 00:00:00');
			expect(value.getNextWeekDay(1)).toEqual(new Date('Mar 27 2017 00:00:00'));
		});

		it('can step from DST to next non-DST monday correctly', function() {
			var value = new Date('Oct 29 2017 00:00:00');
			expect(value.getNextWeekDay(1)).toEqual(new Date('Oct 30 2017 00:00:00'));
		});

		it('can step to yesterday', function() {
			var value = new Date('Jul 27 2017 16:00:00');
			expect(value.getPreviousWeekDay()).toEqual(new Date('Jul 26 2017 16:00:00'));
		});

		it('can step to the prev friday', function() {
			var value = new Date('Jan 01 2017 16:00:00');

			// Go over all months to get various possibilities for stepping.
			expect(value.getPreviousWeekDay(5)).toEqual(new Date('Dec 30 2016 16:00:00'));
			value = value.add(Date.MONTH, 1);
			expect(value.getPreviousWeekDay(5)).toEqual(new Date('Jan 27 2017 16:00:00'));
			value = value.add(Date.MONTH, 1);
			expect(value.getPreviousWeekDay(5)).toEqual(new Date('Feb 24 2017 16:00:00'));
			value = value.add(Date.MONTH, 1);
			expect(value.getPreviousWeekDay(5)).toEqual(new Date('Mar 31 2017 16:00:00'));
			value = value.add(Date.MONTH, 1);
			expect(value.getPreviousWeekDay(5)).toEqual(new Date('Apr 28 2017 16:00:00'));
			value = value.add(Date.MONTH, 1);
			expect(value.getPreviousWeekDay(5)).toEqual(new Date('May 26 2017 16:00:00'));
			value = value.add(Date.MONTH, 1);
			expect(value.getPreviousWeekDay(5)).toEqual(new Date('Jun 30 2017 16:00:00'));
			value = value.add(Date.MONTH, 1);
			expect(value.getPreviousWeekDay(5)).toEqual(new Date('Jul 28 2017 16:00:00'));
			value = value.add(Date.MONTH, 1);
			expect(value.getPreviousWeekDay(5)).toEqual(new Date('Sep 01 2017 16:00:00'));
			value = value.add(Date.MONTH, 1);
			expect(value.getPreviousWeekDay(5)).toEqual(new Date('Sep 29 2017 16:00:00'));
			value = value.add(Date.MONTH, 1);
			expect(value.getPreviousWeekDay(5)).toEqual(new Date('Oct 27 2017 16:00:00'));
			value = value.add(Date.MONTH, 1);
			expect(value.getPreviousWeekDay(5)).toEqual(new Date('Dec 01 2017 16:00:00'));
		});

		it('can step from non-DST to previous DST sunday correctly', function() {
			var value = new Date('Mar 26 2017 00:00:00');
			expect(value.getPreviousWeekDay(0)).toEqual(new Date('Mar 26 2017 00:00:00'));
		});

		it('can step from DST to previous non-DST sunday correctly', function() {
			var value = new Date('Oct 29 2017 00:00:00');
			expect(value.getPreviousWeekDay(0)).toEqual(new Date('Oct 29 2017 00:00:00'));
		});
	});

	/*
	 * Test that the Date.round() function is working
	 */
	describe('Rounding', function() {

		it('does not round when the date is already rounded', function() {
			var value = new Date('Jul 27 2017 16:00:00');
			expect(value.round(Date.MINUTE, 30).format('G:i:s')).toEqual('16:00:00');

			value = new Date('Jul 27 2017 16:00:00');
			expect(value.round(Date.SECOND, 30).format('G:i:s')).toEqual('16:00:00');

			value = new Date('Jul 27 2017 16:00:00');
			expect(value.round(Date.HOUR, 16).format('G:i:s')).toEqual('16:00:00');
		});

		it('can round the time up to an half-hour', function() {
			var value = new Date('Jul 27 2017 16:47:02');
			expect(value.round(Date.MINUTE, 30).format('G:i:s')).toEqual('17:00:00');
		});

		it('can round the time down to an half-hour', function() {
			var value = new Date('Jul 27 2017 16:44:02');
			expect(value.round(Date.MINUTE, 30).format('G:i:s')).toEqual('16:30:00');
		});

	});

	/*
	 * Test that the Date.ceil() function is working
	 */
	describe('Ceil', function() {

		it('does not ceil when the date is already ceiled', function() {
			var value = new Date('Jul 27 2017 16:00:00');
			expect(value.ceil(Date.MINUTE, 30).format('G:i:s')).toEqual('16:00:00');

			value = new Date('Jul 27 2017 16:00:00');
			expect(value.ceil(Date.SECOND, 30).format('G:i:s')).toEqual('16:00:00');

			value = new Date('Jul 27 2017 16:00:00');
			expect(value.ceil(Date.HOUR, 16).format('G:i:s')).toEqual('16:00:00');
		});

		it('can ceil the time to an half-hour', function() {
			var value = new Date('Jul 27 2017 16:44:02');
			expect(value.ceil(Date.MINUTE, 30).format('G:i:s')).toEqual('17:00:00');
		});

	});

	/*
	 * Test that the Date.floor() function is working
	 */
	describe('Floor', function() {

		it('does not floor when the date is already ceiled', function() {
			var value = new Date('Jul 27 2017 16:00:00');
			expect(value.floor(Date.MINUTE, 30).format('G:i:s')).toEqual('16:00:00');

			value = new Date('Jul 27 2017 16:00:00');
			expect(value.floor(Date.SECOND, 30).format('G:i:s')).toEqual('16:00:00');

			value = new Date('Jul 27 2017 16:00:00');
			expect(value.floor(Date.HOUR, 16).format('G:i:s')).toEqual('16:00:00');
		});

		it('can floor the time to an half-hour', function() {
			var value = new Date('Jul 27 2017 16:47:02');
			expect(value.floor(Date.MINUTE, 30).format('G:i:s')).toEqual('16:30:00');
		});
	});

	/*
	 * Test that the Date.diff() function is working
	 */
	describe('Diff', function() {

		it('can calculate the correct time difference in milliseconds', function() {
			var a = new Date();
			var b = a.add(Date.SECOND, 65);

			// Compensate for potential DST switch
			b = b.add(Date.MILLI, Date.getDSTDiff(a, b));

			expect(Date.diff(Date.MILLI, b, a)).toEqual(65 * 1000);
		});

		it('can calculate the correct time difference in seconds', function() {
			var a = new Date();
			var b = a.add(Date.MINUTE, 65);

			// Compensate for potential DST switch
			b = b.add(Date.MILLI, Date.getDSTDiff(a, b));

			expect(Date.diff(Date.SECOND, b, a)).toEqual(65 * 60);
		});

		it('can calculate the correct time difference in minutes', function() {
			var a = new Date();
			var b = a.add(Date.HOUR, 65);

			// Compensate for potential DST switch
			b = b.add(Date.MILLI, Date.getDSTDiff(a, b));

			// Substract or add dst changes
			expect(Date.diff(Date.MINUTE, b, a)).toEqual((65 * 60) + (Date.getDSTDiff(a, b) / 1000 / 60));
		});

		it('can calculate the correct time difference in hours', function() {
			var a = new Date();
			var b = a.add(Date.DAY, 65);

			// Compensate for potential DST switch
			b = b.add(Date.MILLI, Date.getDSTDiff(a, b));

			expect(Date.diff(Date.HOUR, b, a)).toEqual(65 * 24);
		});

		it('can calculate the correct time difference in days', function() {
			var a = new Date();
			var b = a.add(Date.DAY, 65);

			// No compensation for potential DST switch, as Date.DAY is
			// not intended to be as accurate.

			expect(Date.diff(Date.DAY, b, a)).toEqual(65);
		});

		/*
		 * Test switching from winter to summer time.
		 */
		describe('Change to Summer Time', function() {

			it('can correctly calculate the time difference over a DST switch', function() {
				var a = new Date('Mar 26 2017 01:00:00');
				var b = a.add(Date.HOUR, 3);

				expect(Date.diff(Date.HOUR, b, a)).toEqual(3);
			});
		});

		/*
		 * Test switching from summer to winter time.
		 */
		describe('Change to Winter Time', function() {

			it('can correctly calculate the time difference over a DST switch', function() {
				var a = new Date('Oct 29 2017 01:00:00');
				var b = a.add(Date.HOUR, 3);

				expect(Date.diff(Date.HOUR, b, a)).toEqual(3);
			});
		});
	});

	/*
	 * Test the timezone structure which can be obtained from the Date.
	 */
	describe('Timezone', function() {

		it('can obtain the timezone structure', function() {
			var tz = Date.getTimezoneStruct();
			expect(tz).toBeDefined();
			expect(tz.timezone).toBeDefined();
		});

		// Can't really add more tests as we a browser in timezone A cannot calculate
		// the daylight saving switches for timezone B.

	});

	/*
	 * Test the conversion to and from UTC
	 */
	describe('UTC', function() {

		/*
		 * Test switching from winter to summer time.
		 */
		describe('Change to Summer Time', function() {

			it('can convert a non-DST date to UTC', function() {
				// The Dutch date on which we start daylight saving in 2017
				var date = new Date(2017, 2, 26, 1, 0);

				expect(date.toUTC().format(format)).toEqual('Sun Mar 26 2017 00:00:00 GMT+0100');
			});

			it('can convert a DST date to UTC', function() {
				// The Dutch date on which we start daylight saving in 2017
				var date = new Date(2017, 2, 26, 3, 0);

				expect(date.toUTC().format(format)).toEqual('Sun Mar 26 2017 01:00:00 GMT+0100');
			});

			it('can convert a UTC date to a non-DST date', function() {
				var date = new Date(2017, 2, 26, 0, 0);

				expect(date.fromUTC().format(format)).toEqual('Sun Mar 26 2017 01:00:00 GMT+0100');
			});

			it('can convert a UTC date to a DST date', function() {
				var date = new Date(2017, 2, 26, 1, 0);

				expect(date.fromUTC().format(format)).toEqual('Sun Mar 26 2017 03:00:00 GMT+0200');
			});
		});

		/*
		 * Test switching from summer to winter time.
		 */
		describe('Change to Winter Time', function() {

			it('can convert a DST date to UTC', function() {
				// The Dutch date on which we end daylight saving in 2017
				var date = new Date(2017, 9, 29, 1, 0);

				expect(date.toUTC().format(format)).toEqual('Sat Oct 28 2017 23:00:00 GMT+0200')
			});

			xit('can convert a non-DST date to UTC', function() {
				// The Dutch date on which we end daylight saving in 2017
				var date = new Date(2017, 9, 29, 3, 0);

				expect(date.toUTC().format(format)).toEqual('Sun Oct 28 2017 02:00:00 GMT+0100');
			});

			it('can convert a UTC date to a DST date', function() {
				var date = new Date(2017, 9, 29, 0, 0);

				expect(date.fromUTC().format(format)).toEqual('Sun Oct 29 2017 02:00:00 GMT+0200');
			});

			it('can convert a UTC date to a non-DST date', function() {
				var date = new Date(2017, 9, 29, 1, 0);

				expect(date.fromUTC().format(format)).toEqual('Sun Oct 29 2017 02:00:00 GMT+0100');
			});
		});
	});
});
