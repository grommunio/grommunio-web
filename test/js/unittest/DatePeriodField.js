/*
 * Test the Zarafa.common.ui.DatePeriodField component.
 */
describe("DatePeriodField", function() {
	var field;
	var dateRange;
	var initStartDate;
	var initDueDate;
	container = new Zarafa.core.Container();

	beforeEach(function() {
		// Don't default to the current day.
		// There could be a bug which resets the date back to today.
		initStartDate = (new Date()).clearTime(true).add(Date.DAY, 1);
		initDueDate = initStartDate.add(Date.DAY, 1);

		dateRange = new Zarafa.core.DateRange({ allowBlank : true, startDate : initStartDate, dueDate : initDueDate });

		field = new Zarafa.common.ui.DatePeriodField({
			allowBlank : true,
			defaultValue : dateRange
		});

		field.render(Ext.getBody());
	});

	afterEach(function() {
		field.destroy();
	});

	/*
	 * Test if the Component can also be setup without using any default values.
	 * We do a quick test to see if the component can be rendered, and if so,
	 * check if we can obtain the (empty) values.
	 */
	describe('Empty', function() {
		var emptyFieldFn;
		var field;

		beforeEach(function() {
			emptyFieldFn = function() {
				field = new Zarafa.common.ui.DatePeriodField({
					allowBlank : true
				});

				field.render(Ext.getBody());

				return field;
			};
		});

		afterEach(function() {
			field.destroy();
		});

		it('can render the component without a default value', function() {
			expect(emptyFieldFn).not.toThrow();
		});

		it('will create an empty daterange when no default value is provided', function() {
			expect(emptyFieldFn().getValue()).toEqual(jasmine.any(Zarafa.core.DateRange));
		});

		it('DateRange will contain empty start date', function() {
			expect(emptyFieldFn().getValue().getStartDate()).toBeNull();
		});

		it('DateRange will contain empty due date', function() {
			expect(emptyFieldFn().getValue().getDueDate()).toBeNull();
		});
	});

	/*
	 * Test if all values are correctly setup. In other words,
	 * is the value of the correct type and can we modify it like
	 * we want it to.
	 */
	describe('Values', function() {
		var emptyField;

		beforeEach(function() {
			emptyField = new Zarafa.common.ui.DatePeriodField({
				allowBlank : true
			});

			emptyField.render(Ext.getBody());
		});

		afterEach(function() {
			emptyField.destroy();
		});

		it('has a value of type DateRange', function() {
			expect(field.getValue()).toEqual(jasmine.any(Zarafa.core.DateRange));
		});

		it('can set due date when start / due dates are empty', function() {
			emptyField.onEndSelect(emptyField.endField, initDueDate);

			expect(emptyField.getValue().getStartDate()).toBeNull();
			expect(emptyField.getValue().getDueDate()).toEqual(initDueDate);
		});

		it('will set due date automatically when setting start date when start / due dates are empty', function() {
			emptyField.onStartSelect(emptyField.endField, initStartDate);

			expect(emptyField.getValue().getStartDate()).toEqual(initStartDate);
			expect(emptyField.getValue().getDueDate()).toEqual(initStartDate);
		});

		it('will set start date when due date is not empty, and start date is less then due date', function() {
			var newStartDate = initStartDate.add(Date.DAY, 1);
			var newDueDate = initDueDate.add(Date.DAY, 2);

			emptyField.getValue().setDueDate(newDueDate);

			emptyField.onStartSelect(emptyField.endField, newStartDate);

			expect(emptyField.getValue().getStartDate()).toEqual(newStartDate);
			expect(emptyField.getValue().getDueDate()).toEqual(newDueDate);
		});

		it('will change due date automatically when setting start date which is greater then due date when start date is empty', function() {
			var newStartDate = initDueDate.add(Date.DAY, 1);
			emptyField.getValue().setDueDate(initDueDate);

			emptyField.onStartSelect(emptyField.endField, newStartDate);

			expect(emptyField.getValue().getStartDate()).toEqual(newStartDate);
			expect(emptyField.getValue().getDueDate()).toEqual(newStartDate);
		});

		it('will set start date as empty when StartDateField is cleared', function() {
			field.onStartSelect(field.startField, undefined);

			expect(field.getValue().getStartDate()).toBeNull();
		});

		it('will set due date as empty when DueDateField is cleared', function() {
			field.onEndSelect(field.endField, undefined);

			expect(field.getValue().getDueDate()).toBeNull();
		});

		it('will set start date as empty when DueDateField is cleared', function() {
			field.onEndSelect(field.endField, undefined);

			expect(field.getValue().getStartDate()).toBeNull();
		});

		it('preserves the duration when increasing the start date', function() {
			var value = field.getValue();
			var expectedDuration = value.getDuration();

			field.onStartSelect(field.startField, initStartDate.add(Date.DAY, 5));

			expect(value.getDuration()).toEqual(expectedDuration);
		});

		it('preserves the duration when decreasing the start date', function() {
			var expectedDuration = field.getValue().getDuration();

			field.onStartSelect(field.startField, initStartDate.add(Date.DAY, -5));

			expect(field.getValue().getDuration()).toEqual(expectedDuration);
		});

		it('changes the duration when increasing the due date', function() {
			var value = field.getValue();
			var start = new Date();
			var end = new Date();
			start.setMilliseconds(value.getDuration());
			var expectedDuration = value.getDuration() + (5 * Date.dayInMillis);
			end.setMilliseconds(expectedDuration);
			expectedDuration += Date.getDSTDiff(end, start);
			field.onEndSelect(field.endField, initDueDate.add(Date.DAY, 5));

			expect(value.getDuration()).toEqual(expectedDuration);
		});

		it('changes the duration when decreasing the due date', function() {
			var start = initStartDate.add(Date.DAY, -10);
			var due = initDueDate.add(Date.DAY, -5);
			var expectedDuration = (6 * Date.dayInMillis) - Date.getDSTDiff(start, due);

			// set start date to safe value so it will not change when changing due date, otherwise duration will be changed
			field.getValue().setStartDate(start);
			field.onEndSelect(field.endField, due);

			expect(field.getValue().getDuration()).toEqual(expectedDuration);
		});

		it('changes the start date when decreasing the due date when due date is lesser then start date', function() {
			var expectedDuration = field.getValue().getDuration();
			var newDueDate = initStartDate.add(Date.DAY, -5);
			var expectedStartDate = newDueDate.add(Date.MILLI, -field.getValue().getDuration());

			field.onEndSelect(field.endField, newDueDate);

			expect(field.getValue().getDuration()).toEqual(expectedDuration);
			expect(field.getValue().getStartDate()).toEqual(expectedStartDate);
		});

		it('changes the due date when increasing the start date when start date is greater then due date', function() {
			var expectedDuration = field.getValue().getDuration();
			var newStartDate = initDueDate.add(Date.DAY, 5);
			var expectedDueDate = newStartDate.add(Date.MILLI, field.getValue().getDuration());

			field.onStartSelect(field.startField, newStartDate);

			expect(field.getValue().getDuration()).toEqual(expectedDuration);
			expect(field.getValue().getDueDate()).toEqual(expectedDueDate);
		});

		it('value of StartDateField is changed when changing start date in DateRange', function() {
			var origValue = field.startField.getValue();

			field.getValue().setStartDate(initStartDate.add(Date.DAY, -5));

			expect(field.startField.getValue()).not.toEqual(origValue);
		});

		it('value of DueDateField is changed when changing due date in DateRange', function() {
			var origValue = field.endField.getValue();

			field.getValue().setDueDate(initDueDate.add(Date.DAY, 5));

			expect(field.endField.getValue()).not.toEqual(origValue);
		});
	});

	/*
	 * Test if all events are working for the DatePeriodField.
	 * Whenever the DateRange or one of the DateField has been changed
	 * the 'change' event must be fired.
	 *
	 * For checking if an event has been fired with add
	 * a spy on the DateRange.fireEvent() function.
	 */
	describe('Events', function() {

		beforeEach(function() {
			spyOn(dateRange, 'fireEvent').and.callThrough();
			spyOn(field, 'fireEvent').and.callThrough();
		});

		it('fires the \'change\' event after changing the start DateField', function() {
			var origValue = field.startField.getValue();

			field.startField.fireEvent('change', field.startField, origValue.add(Date.DAY, -1), origValue);

			expect(field.fireEvent.calls.mostRecent().args[0]).toEqual('change');
		});

		it('does not fire the \'change\' event after setting start date value same in StartDateField', function() {
			var origValue = field.getValue().getStartDate();

			field.startField.fireEvent('change', field.startField, origValue, origValue);

			expect(field.fireEvent.calls.argsFor(0)[0]).not.toEqual('change');
		});

		it('fires the \'change\' event after changing the due DateField', function() {
			var origValue = field.endField.getValue();

			field.endField.fireEvent('change', field.endField, origValue.add(Date.DAY, -1), origValue);

			expect(field.fireEvent.calls.argsFor(0)[0]).toEqual('change');
		});

		it('does not fire the \'change\' event after setting due date value same in DueDateField', function() {
			var origValue = field.getValue().getDueDate();

			field.endField.fireEvent('change', field.endField, origValue, origValue);

			expect(field.fireEvent.calls.argsFor(0)[0]).not.toEqual('change');
		});

		it('does not fire the \'change\' event after changing the DateRange', function() {
			dateRange.setDuration(500);

			expect(field.fireEvent.calls.argsFor(0)[0]).not.toEqual('change');
		});

		it('fires the \'update\' event in the DateRange after changing the StartDateField', function() {
			field.onStartSelect(field.startField, (new Date()).add(Date.DAY, 4));

			expect(dateRange.fireEvent.calls.mostRecent().args[0]).toEqual('update');
		});

		it('fires the \'update\' event in the DateRange after changing the DueDateField', function() {
			field.onEndSelect(field.endField, (new Date()).add(Date.DAY, 6));

			expect(dateRange.fireEvent.calls.mostRecent().args[0]).toEqual('update');
		});

		it('does not fire the \'change\' event after setting the value programmatically', function() {
			field.setValue(new Zarafa.core.DateRange({ allowBlank : true }));

			expect(field.fireEvent.calls.argsFor(0)[0]).not.toEqual('change');

		});
	});

});
