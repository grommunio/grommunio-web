/*
 * Test the Zarafa.common.ui.DateTimeField component.
 */
describe("DateTimeField", function() {
	var field;
	var dateComponent;
	var timeComponent;
	var timePlugin;
	const fieldSetValue = function(field, value) {
		if(field instanceof Zarafa.common.ui.EditorField) {
			field = field.getLayout().activeItem;
		}
		field.onFocus();
		field.setValue(value);
		if (field.mimicBlur) {
			field.mimicBlur({ target : Ext.getBody().dom });
		} else {
			field.onBlur();
		}
	};

	beforeEach(function() {
		// Don't default to the current day, during our test
		// 'can render the component with the default value' we want
		// to know if the defaultValue is preserved correctly. There
		// could be a bug which resets the date back to today.
		var initDate = (new Date()).clearSeconds(true).add(Date.DAY, 1);

		// Force the hours to be 2PM this prevents issues during
		// tests when this date (or minValue or maxValue) will wrap around midnight.
		initDate.setHours(14);

		field = new Zarafa.common.ui.DateTimeField({
			defaultValue: initDate,
			dateFormat: 'd-m-Y',
			timeFormat: 'G:i',
			timeIncrement: 15,
			// We don't just move the dates, but also add a small time adjustment
			// which we need for testing corner cases
			minValue: initDate.add(Date.HOUR, -60),
			maxValue: initDate.add(Date.HOUR, 60)
		});

		// A Ext.form.CompositeField must have a parent in order
		// to be able to render all child elements.
		var container = new Ext.Container({ items : [ field ] });
		container.render(Ext.getBody());

		dateComponent = field.items.get(0);
		timeComponent = field.items.get(1);
		timePlugin = timeComponent.plugins[0];
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
				field = new Zarafa.common.ui.DateTimeField({
					dateFormat: 'd-m-Y',
					timeFormat: 'G:i',
					timeIncrement: 15
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
			expect(emptyFieldFn().getValue()).toBeNull();
		});

		it('has an empty DOM value without a default value', function() {
			var field = emptyFieldFn();
			expect(field.items.get(0).getRawValue()).toEqual('');
			expect(field.items.get(1).getRawValue()).toEqual('');
		});

		it('can change the date', function() {
			var doAction = function() {
				var dateField = emptyFieldFn().items.get(0);
				dateField.setValue(new Date());
				dateField.fireEvent('select', dateField, new Date());
			};
			expect(doAction).not.toThrow();
		});

		it('can change the time', function() {
			var doAction = function() {
				var timeField = emptyFieldFn().items.get(1);
				timeField.plugins[0].onSpinUp();
			};
			expect(doAction).not.toThrow();
		});
	});

	/*
	 * Test if all values are correctly setup. In other words,
	 * is the value of the correct type and can we modify it like
	 * we want it to.
	 */
	describe('Values', function() {

		it('has a value of type Date', function() {
			expect(field.getValue()).toEqual(jasmine.any(Date));
		});

		it('can render the component with the default value', function() {
			expect(field.getValue()).toEqual(field.defaultValue);
		});

		it('has a DOM value for the time which represents the real value', function() {
			var expectedTimeDOM = field.getValue().format(field.timeFormat);
			expect(timeComponent.getRawValue()).toEqual(expectedTimeDOM);
		});

		it('has a DOM value for the date which represents the real value', function() {
			var expectedDateDOM = field.getValue().format(field.dateFormat);
			expect(dateComponent.getRawValue()).toEqual(expectedDateDOM);
		});

		it('can update the DOM value for the time with setValue() using Date object', function() {
			var expectedDate = new Date().add(Date.DAY, 1);
			var expectedTimeDOM = expectedDate.format(field.timeFormat);
			field.setValue(expectedDate);
			expect(timeComponent.getValue().format(field.timeFormat)).toEqual(expectedTimeDOM);
		});

		it('can update the DOM value for the date with setValue() using Date object', function() {
			var expectedDate = new Date().add(Date.DAY, 1);
			var expectedDateDOM = expectedDate.format(field.dateFormat);
			field.setValue(expectedDate);
			expect(dateComponent.getValue().format(field.dateFormat)).toEqual(expectedDateDOM);
		});

		it('will increment the day when spinning the time 24 hours up', function() {
			var oldDate = field.getValue();
			var expectedDate = oldDate.add(Date.DAY, 1);

			var dst = Date.getDSTDiff(expectedDate, oldDate);
			expectedDate = expectedDate.add(Date.MILLI, dst);

			for (var i = 0; i < 24; i++) {
				timePlugin.onSpinUpAlternate();
			}

			expect(field.getValue()).toEqual(expectedDate);
		});

		it('will decrement the day when spinning the time 24 hours down', function() {
			var oldDate = field.getValue();
			var expectedDate = oldDate.add(Date.DAY, -1);

			var dst = Date.getDSTDiff(expectedDate, oldDate);
			expectedDate = expectedDate.add(Date.MILLI, dst);

			for (var i = 0; i < 24; i++) {
				timePlugin.onSpinDownAlternate();
			}

			expect(field.getValue()).toEqual(expectedDate);
		});

		it('is limited to the maximum value while changing the time', function() {
			for (var i = 0; i < 72; i++) {
				timePlugin.onSpinUpAlternate();
			}
			expect(field.getValue()).toEqual(field.maxValue);
		});

		it('is limited to the minimum value while changing the time', function() {
			for (var i = 0; i < 72; i++) {
				timePlugin.onSpinDownAlternate();
			}
			expect(field.getValue()).toEqual(field.minValue);
		});

		it('will update the value when a date has been selected', function() {
			var expectedValue = field.getValue().add(Date.DAY, 1);
			dateComponent.setValue(expectedValue);
			dateComponent.fireEvent('select', dateComponent, expectedValue);
			expect(field.getValue()).toEqual(expectedValue);
		});

		it('will ignore time changes made through the date selection', function() {
			var setValue = field.getValue().add(Date.HOUR, 26);
			var expectedValue = field.getValue().add(Date.HOUR, 24);
			dateComponent.setValue(setValue);
			dateComponent.fireEvent('select', dateComponent, setValue);
			expect(field.getValue()).toEqual(expectedValue);
		});

		it('is limited to the maximum value while changing the date', function() {
			var initValue = field.maxValue.clone();
			// set time to something later then the maximum time from the maxValue.
			// We must prevent a wrap to a different day!
			initValue = initValue.add(Date.HOUR, (24 - initValue.getHours()) / 2);
			initValue = initValue.add(Date.MINUTE, (60 - initValue.getMinutes()) / 2);
			// set the Day to something earlier then the maximum day from the the maxValue
			initValue = initValue.add(Date.DAY, -1);
			field.setValue(initValue);
			// Select the Date to equal maxValue. This will trigger a time & date combination
			// which is later then the maxValue.
			dateComponent.setValue(field.maxValue.clone());
			dateComponent.fireEvent('select', dateComponent, dateComponent.getValue());
			expect(field.getValue()).toEqual(field.maxValue);
		});

		it('is limited to the minumum value while changing the date', function() {
			var initValue = field.minValue.clone();
			// set time to something later then the maximum time from the maxValue.
			// We must prevent a wrap to a different day!
			initValue = initValue.add(Date.HOUR, - (initValue.getHours() / 2));
			initValue = initValue.add(Date.MINUTE, - (initValue.getMinutes() / 2));
			// set the Day to something later then the minumum day from the the minValue
			initValue = initValue.add(Date.DAY, 1);
			field.setValue(initValue);
			// Select the Date to equal minValue. This will trigger a time & date combination
			// which is earlier then the minValue.
			dateComponent.setValue(field.minValue.clone());
			dateComponent.fireEvent('select', dateComponent, dateComponent.getValue());
			expect(field.getValue()).toEqual(field.minValue);
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

			beforeEach(function() {
				// The Dutch date on which we start daylight saving in 2017
				const initDate = new Date(2017, 3, 26, 2, 0);

				field.setValue(initDate);
				field.minValue = initDate.add(Date.HOUR, -60);
				field.maxValue = initDate.add(Date.HOUR, 60);
			});

			it('is limited to the maximum value while changing the date', function() {
				var initValue = field.maxValue.clone();
				// set time to something later then the maximum time from the maxValue.
				// We must prevent a wrap to a different day!
				initValue = initValue.add(Date.HOUR, (24 - initValue.getHours()) / 2);
				initValue = initValue.add(Date.MINUTE, (60 - initValue.getMinutes()) / 2);
				// set the Day to something earlier then the maximum day from the the maxValue
				initValue = initValue.add(Date.DAY, -1);
				field.setValue(initValue);
				// Select the Date to equal maxValue. This will trigger a time & date combination
				// which is later then the maxValue.
				dateComponent.setValue(field.maxValue.clone());
				dateComponent.fireEvent('select', dateComponent, dateComponent.getValue());
				expect(field.getValue()).toEqual(field.maxValue);
			});

			it('is limited to the minumum value while changing the date', function() {
				var initValue = field.minValue.clone();
				// set time to something later then the maximum time from the maxValue.
				// We must prevent a wrap to a different day!
				initValue = initValue.add(Date.HOUR, - (initValue.getHours() / 2));
				initValue = initValue.add(Date.MINUTE, - (initValue.getMinutes() / 2));
				// set the Day to something later then the minumum day from the the minValue
				initValue = initValue.add(Date.DAY, 1);
				field.setValue(initValue);
				// Select the Date to equal minValue. This will trigger a time & date combination
				// which is earlier then the minValue.
				dateComponent.setValue(field.minValue.clone());
				dateComponent.fireEvent('select', dateComponent, dateComponent.getValue());
				expect(field.getValue()).toEqual(field.minValue);
			});
		});

		/*
		 * Test switching from summer to winter time.
		 */
		describe('Winter Time', function() {

			beforeEach(function() {
				// The Dutch date on which we end daylight saving in 2017
				const initDate = new Date(2017, 10, 29, 3, 0);

				field.setValue(initDate);
				field.minValue = initDate.add(Date.HOUR, -60);
				field.maxValue = initDate.add(Date.HOUR, 60);
			});

			it('is limited to the maximum value while changing the date', function() {
				var initValue = field.maxValue.clone();
				// set time to something later then the maximum time from the maxValue.
				// We must prevent a wrap to a different day!
				initValue = initValue.add(Date.HOUR, (24 - initValue.getHours()) / 2);
				initValue = initValue.add(Date.MINUTE, (60 - initValue.getMinutes()) / 2);
				// set the Day to something earlier then the maximum day from the the maxValue
				initValue = initValue.add(Date.DAY, -1);
				field.setValue(initValue);
				// Select the Date to equal maxValue. This will trigger a time & date combination
				// which is later then the maxValue.
				dateComponent.setValue(field.maxValue.clone());
				dateComponent.fireEvent('select', dateComponent, dateComponent.getValue());
				expect(field.getValue()).toEqual(field.maxValue);
			});

			it('is limited to the minumum value while changing the date', function() {
				var initValue = field.minValue.clone();
				// set time to something later then the maximum time from the maxValue.
				// We must prevent a wrap to a different day!
				initValue = initValue.add(Date.HOUR, - (initValue.getHours() / 2));
				initValue = initValue.add(Date.MINUTE, - (initValue.getMinutes() / 2));
				// set the Day to something later then the minumum day from the the minValue
				initValue = initValue.add(Date.DAY, 1);
				field.setValue(initValue);
				// Select the Date to equal minValue. This will trigger a time & date combination
				// which is earlier then the minValue.
				dateComponent.setValue(field.minValue.clone());
				dateComponent.fireEvent('select', dateComponent, dateComponent.getValue());
				expect(field.getValue()).toEqual(field.minValue);
			});
		});
	});

	/*
	 * Test if all events are working for the DateTimeField.
	 * Whenever the Date or Time has been changed the 'change' event must
	 * be fired.
	 *
	 * For checking if an event has been fired with add
	 * a spy on the DateRange.fireEvent() function.
	 */
	describe('Events', function() {

		beforeEach(function() {
			spyOn(field, 'fireEvent').and.callThrough();
		});

		it('fires the \'change\' event after changing the time', function() {
			timeComponent.fireEvent('change', timeComponent, new Date(), timeComponent.getValue());
			expect(field.fireEvent.calls.argsFor(0)[0]).toEqual('change');
		});

		it('fires the \'change\' event after spinning the time', function() {
			timePlugin.onSpinUp();
			expect(field.fireEvent.calls.argsFor(0)[0]).toEqual('change');
		});

		it('fires the \'change\' event after changing the date', function() {
			dateComponent.fireEvent('change', dateComponent, new Date(), dateComponent.getValue());
			expect(field.fireEvent.calls.argsFor(0)[0]).toEqual('change');
		});

		it('fires the \'change\' event after selecting the date', function() {
			dateComponent.fireEvent('select', dateComponent, new Date());
			expect(field.fireEvent.calls.argsFor(0)[0]).toEqual('change');
		});

		it('does not fire the \'change\' event after setting the value programmatically', function() {
			field.setValue(new Date());
			expect(field.fireEvent.calls.argsFor(0)[0]).not.toEqual('change');
		});

		it('does fire the \'change\' event after a new value was typed in', function() {
			fieldSetValue(field, new Date());
			expect(field.fireEvent.calls.argsFor(2)[0]).toEqual('change');
		});
	});

});
