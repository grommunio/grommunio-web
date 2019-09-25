/*
 * Test the DateField.
 */
describe('Date Field', function() {

	/**
	 * Test the week start day in date field.
	 */
	describe('Week start day', function() {
		var dateFieldObj;

		afterEach(function() {
			dateFieldObj.destroy();
		});

		it('Should display week start day as it configured in setting.', function() {
			container.getSettingsModel().set('zarafa/v1/main/week_start', 2);

			// Render the date field and trigger the date picker from date field.
			dateFieldObj = new Ext.form.DateField({
				renderTo : Ext.getBody()
			});

			dateFieldObj.onTriggerClick();

			var weekStartDay = container.getSettingsModel().get('zarafa/v1/main/week_start');
			var firstWeekDay = dateFieldObj.menu.picker.el.query('table.x-date-inner tr th span')[0];

			expect(firstWeekDay.textContent).toEqual('T');
			expect(dateFieldObj.startDay).toEqual(weekStartDay);
		});

		it('Should display \'Sunday\' as default start week while week start day setting is improper.', function() {
			container.getSettingsModel().set('zarafa/v1/main/week_start', 10);

			// Render the date field and trigger the date picker from date field.
			dateFieldObj = new Ext.form.DateField({
				renderTo : Ext.getBody()
			});

			dateFieldObj.onTriggerClick();

			var firstWeekDay = dateFieldObj.menu.picker.el.query('table.x-date-inner tr th span')[0];

			expect(firstWeekDay.textContent).toEqual('S');
			expect(dateFieldObj.startDay).toEqual(0);
		});
	});

	/**
	 * Test the date picker of date field.
	 */
	describe('Date picker', function(){
		var dateFieldObj;

		beforeEach(function() {
			dateFieldObj = new Ext.form.DateField({
				renderTo : Ext.getBody()
			});
		});

		afterEach(function() {
			dateFieldObj.destroy();
		});

		it('Can rendar the date picker without error.', function(){
			var loadDatePicker = function() {
				dateFieldObj.onTriggerClick();
			};

			expect(loadDatePicker).not.toThrow();
		});

		/**
		 * Test the navigation of date picker.
		 */
		describe('Navigation', function() {
			var datePicker;
			var currentDate;

			beforeEach(function(){
				// Trigger date picker from date field.
				dateFieldObj.onTriggerClick();

				datePicker = dateFieldObj.menu.picker;

				currentDate = new Date().clearTime();
			});

			it('Can render next month.', function() {
				datePicker.showNextMonth();

				// Obtains next month and year from current date.
				var nextMonth = currentDate.add(Date.MONTH, 1);

				expect(nextMonth.getTime()).toEqual(datePicker.activeDate.getTime());
			});

			it('Can render previous month.', function() {
				datePicker.showPrevMonth();

				// Obtains previous month and year from current date.
				var prevMonth = currentDate.add(Date.MONTH, -1);

				expect(prevMonth.getTime()).toEqual(datePicker.activeDate.getTime());
			});

			it('should display today\'s date.', function() {
				// Obtain the today button of date picker and simulate the mouse click.
				var todayBtn = datePicker.todayBtn.getEl();
				document.getElementById(todayBtn.id).click();

				expect(currentDate.getTime()).toEqual(datePicker.activeDate.getTime());
			});
		});
	});
});
