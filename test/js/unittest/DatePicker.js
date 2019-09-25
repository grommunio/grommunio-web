/*
 * Test the Zarafa.calendar.ui.DatePicker component.
 */
describe("DatePicker", function() {
	/*
	 * create and return an object of Zarafa.calendar.ui.DatePicker class
	 */
	var getPickerObj = function (startday) {
		startday = startday || 1;
		return new Zarafa.calendar.ui.DatePicker({
			showWeekNumber : true,
			startDay: startday,
			renderTo : Ext.getBody(),
		});
	};

	/*
	 * Test if the week number column is layed out correctly in date picker.
	 */
	describe('Layout and UI', function() {
		var datePickerObj;

		beforeEach(function() {
			datePickerObj = getPickerObj();
		});

		afterEach(function() {
			datePickerObj.destroy();
		});

		/*
		 * Test if the week number is displayed correctly in date picker.
		 */
		describe('Week number', function() {
			var currentMonthStart;

			beforeEach(function() {
				currentMonthStart = datePickerObj.getValue().getFirstDateOfMonth();
			});

			it('should display week number column in date picker properly', function() {
				expect(datePickerObj.showWeekNumber).toBeTruthy();
				expect(datePickerObj.el.query('table.x-date-inner thead tr th').length).toEqual(8);
				expect(datePickerObj.el.query('td.x-date-weeknumber').length).toEqual(6);
			});

			it('should display proper values in week number column', function() {
				var firstWeekElement = datePickerObj.el.query('td.x-date-weeknumber a em span');

				// check all the week number values
				for (var i = 0; i < firstWeekElement.length; i++) {
					expect(parseInt(firstWeekElement[i].textContent), 10).toEqual(currentMonthStart.getWeekOfYear());
					currentMonthStart = currentMonthStart.add(Date.DAY, 7);
				}
			});

			it('should display proper values in week number column while shift to the previous month', function() {
				// Navigate to the previous month in date picker
				datePickerObj.showPrevMonth();

				var firstWeekElement = datePickerObj.el.query('td.x-date-weeknumber a em span');
				var monthStartDate = currentMonthStart.add(Date.MONTH, -1).getFirstDateOfMonth();

				// check all the week number values in previous month
				for (var i = 0; i < firstWeekElement.length; i++) {
					expect(parseInt(firstWeekElement[i].textContent), 10).toEqual(monthStartDate.getWeekOfYear());
					monthStartDate = monthStartDate.add(Date.DAY, 7);
				}
			});

			it('should display proper values in week number column while shift to the next month', function() {
				// Navigate to the next month in date picker
				datePickerObj.showNextMonth();

				var monthStartDate = currentMonthStart.add(Date.MONTH, 1).getFirstDateOfMonth();
				var firstWeekElement = datePickerObj.el.query('td.x-date-weeknumber a em span');

				// check all the week number values in next month
				for (var i = 0; i < firstWeekElement.length; i++) {
					expect(parseInt(firstWeekElement[i].textContent), 10).toEqual(monthStartDate.getWeekOfYear());
					monthStartDate = monthStartDate.add(Date.DAY, 7);
				}
			});
		});
	});

	/*
	 * Test if the setting related to date picker is working correctly.
	 */
	describe('Setting', function() {
		var datePickerObj;

		afterEach(function() {
			datePickerObj.destroy();
		});

		it('should display values in week number column properly while change week start day setting', function() {
			datePickerObj = getPickerObj(3);

			var currentMonthStart = datePickerObj.getValue().getFirstDateOfMonth();
			var firstWeekElement = datePickerObj.el.query('td.x-date-weeknumber a em span');

			// check all the week number values
			for (var i = 0; i < firstWeekElement.length; i++) {
				expect(parseInt(firstWeekElement[i].textContent), 10).toEqual(currentMonthStart.getWeekOfYear());
				currentMonthStart = currentMonthStart.add(Date.DAY, 7);
			}
		});

		it('should display week start day as it configured in setting', function() {
			datePickerObj = getPickerObj(3);

			// get second column from week columns as first column will have label for week number
			var firstWeekDay = datePickerObj.el.query('table.x-date-inner tr th span')[1];

			// check the week start day
			expect(firstWeekDay.textContent).toEqual('W');
			expect(datePickerObj.startDay).toEqual(3);
		});

		it('should display \'Sunday\' as default start week while week start day setting is improper', function() {
			datePickerObj = getPickerObj(10);

			// get second column from week columns as first column will have label for week number
			var firstWeekDay = datePickerObj.el.query('table.x-date-inner tr th span')[1];

			// check the week start day
			expect(firstWeekDay.textContent).toEqual('S');
			expect(datePickerObj.startDay).toEqual(0);
		});
	});
});
