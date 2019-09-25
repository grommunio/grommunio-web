/*
 * Test the Zarafa.common.ui.DateTimePeriodField component.
 */
describe("DateTimePeriodField", function() {
	var field;
	var daterange;
	var startDateTimeField;
	var startDateComponent;
	var startTimeComponent;
	var startTimePlugin;
	var dueDateTimeField;
	var dueDateComponent;
	var dueTimeComponent;
	var dueTimePlugin;
  container = new Zarafa.core.Container();
	const initDate = (new Date()).clearSeconds(true).add(Date.DAY, 1);

	beforeEach(function() {
		// Don't default to the current day.
		// There could be a bug which resets the date back to today.

		daterange = new Zarafa.core.DateRange({ startDate : initDate, dueDate : initDate.add(Date.DAY, 1) });

		field = new Zarafa.common.ui.DateTimePeriodField({
			defaultValue: daterange,
			defaultPeriod: 30,
			defaultPeriodType: Date.MINUTE,
			timeIncrement: 60
		});

		field.render(Ext.getBody());

		startDateTimeField = field.get(0);
		startDateComponent = startDateTimeField.items.get(0);
		startTimeComponent = startDateTimeField.items.get(1);
		startTimePlugin = startTimeComponent.plugins[0];
		dueDateTimeField = field.get(1);
		dueDateComponent = dueDateTimeField.items.get(0);
		dueTimeComponent = dueDateTimeField.items.get(1);
		dueTimePlugin = dueTimeComponent.plugins[0];
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
				field = new Zarafa.common.ui.DateTimePeriodField({
					timeIncrement: 60
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

		it('returns \'undefined\' without a default value', function() {
			expect(emptyFieldFn().getValue()).not.toBeDefined();
		});
	});

	/*
	 * Test if all values are correctly setup. In other words,
	 * is the value of the correct type and can we modify it like
	 * we want it to.
	 */
	describe('Values', function() {

		it('has a value of type DateRange', function() {
			expect(field.getValue()).toEqual(jasmine.any(Zarafa.core.DateRange));
		});

		it('preserves the duration when increasing the start date', function() {
			var expectedDuration = field.getValue().getDuration();
			startTimePlugin.onSpinUpAlternate();
			expect(field.getValue().getDuration()).toEqual(expectedDuration);
		});

		it('preserves the duration when decreasing the start date', function() {
			var expectedDuration = field.getValue().getDuration();
			startTimePlugin.onSpinDownAlternate();
			expect(field.getValue().getDuration()).toEqual(expectedDuration);
		});

		it('changes to duration when increasing the due date', function() {
			var expectedDuration = field.getValue().getDuration() + (60 * 60 * 1000);
			dueTimePlugin.onSpinUpAlternate();
			expect(field.getValue().getDuration()).toEqual(expectedDuration);
		});

		it('changes to duration when decreasing the due date', function() {
			var expectedDuration = field.getValue().getDuration() - (60 * 60 * 1000);
			dueTimePlugin.onSpinDownAlternate();
			expect(field.getValue().getDuration()).toEqual(expectedDuration);
		});

		it('limits the duration to the minimum value', function() {
			for (var i = 0; i < 48; i++)
				dueTimePlugin.onSpinDownAlternate();
			expect(field.getValue().getDuration()).toEqual(30 * 60 * 1000);
		});
	});

	/*
	 * Perform some of the above tests again, but now around the DST switches.
	 * Obviously this is a period where we weird things are happening with the time,
	 * and thus we need to test if all our assumptions hold around this time.
	 */
	describe('Daylight Saving', function() {

		/*
		 * Test switching from winter to summer time.
		 */
		describe('Summer Time', function() {
			// The Dutch date on which we start daylight saving in 2017
			const  initDate = new Date(2017, 3, 26, 2, 0);

			beforeEach(function() {
				field.getValue().set(initDate, initDate.add(field.defaultPeriodType, field.defaultPeriod));
			});

			it('preserves the duration when increasing the start date', function() {
				const expectedDuration = field.getValue().getDuration();
				startTimePlugin.onSpinUpAlternate();
				expect(field.getValue().getDuration()).toEqual(expectedDuration);
			});

			it('preserves the duration when decreasing the start date', function() {
				startTimePlugin.onSpinUpAlternate();
				const expectedDuration = field.getValue().getDuration();
				startTimePlugin.onSpinDownAlternate();
				expect(field.getValue().getDuration()).toEqual(expectedDuration);
			});
		});

		/*
		 * Test switching from summer to winter time.
		 */
		describe('Winter Time', function() {
			// The Dutch date on which we end daylight saving in 2017
			const initDate = new Date(2017, 10, 29, 3, 0);

			beforeEach(function() {
				field.getValue().set(initDate, initDate.add(field.defaultPeriodType, field.defaultPeriod));
			});

			it('preserves the duration when increasing the start date', function() {
				const expectedDuration = field.getValue().getDuration();
				startTimePlugin.onSpinUpAlternate();
				expect(field.getValue().getDuration()).toEqual(expectedDuration);
			});

			it('preserves the duration when decreasing the start date', function() {
				startTimePlugin.onSpinUpAlternate();
				const expectedDuration = field.getValue().getDuration();
				startTimePlugin.onSpinDownAlternate();
				expect(field.getValue().getDuration()).toEqual(expectedDuration);
			});

		});
	});

	/*
	 * Test if all events are working for the DateTimePeriodField.
	 * Whenever the DateRange or one of the DateTimeField has been changed
	 * the 'change' event must be fired.
	 *
	 * For checking if an event has been fired with add
	 * a spy on the DateRange.fireEvent() function.
	 */
	describe('Events', function() {

		beforeEach(function() {
			spyOn(field, 'fireEvent').and.callThrough();
		});

		it('fires the \'change\' event after changing the DateTimeField', function() {
			const origValue = startDateTimeField.getValue();
			startDateTimeField.fireEvent('change', startDateTimeField, origValue.add(Date.DAY, -1), origValue);
			expect(field.fireEvent.calls.argsFor(0)[0]).toEqual('change');
		});

		it('does not fire the \'change\' event after changing the DateRange', function() {
			daterange.setDuration(500);
			expect(field.fireEvent.calls.argsFor(0)[0]).not.toEqual('change');
		});

		it('fires the \'update\' event in the DateRange after changing the DateTimePeriodField', function() {
			spyOn(daterange, 'fireEvent').and.callThrough();
			field.getValue().set((new Date()).add(Date.DAY, 4), (new Date()).add(Date.DAY, 6));
			expect(daterange.fireEvent.calls.argsFor(0)[0]).toEqual('update');
		});

		it('fires the \'update\' event in the DateRange after changing the DateTimeField', function() {
			spyOn(daterange, 'fireEvent').and.callThrough();
			const origValue = startDateTimeField.getValue();
			startDateTimeField.fireEvent('change', startDateTimeField, origValue.add(Date.DAY, -1), origValue);
			expect(daterange.fireEvent.calls.argsFor(0)[0]).toEqual('update');
		});

		it('does not fire the \'change\' event after setting the value programmatically', function() {
			field.setValue(new Zarafa.core.DateRange({ startDate : new Date(), dueDate : new Date().add(Date.DAY, 1) }));
			expect(field.fireEvent.calls.argsFor(0)[0]).not.toEqual('change');
		});
	});
});
