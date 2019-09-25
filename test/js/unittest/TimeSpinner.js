/*
 * Test the Zarafa.common.plugins.TimeSpinner plugin.
 */
describe("TimeSpinner", function() {
	var timePlugin;
	var spinner;

	beforeEach(function() {
		// Don't default to the current day, during our test
		// 'can render the component with the default value' we want
		// to know if the defaultValue is preserved correctly. There
		// could be a bug which resets the date back to today.
		var initDate = (new Date()).clearSeconds(true).add(Date.DAY, 1);

		timePlugin = new Zarafa.common.plugins.TimeSpinner({
			format: 'G:i',
			alternateIncrementField : Date.HOUR,
			incrementField: Date.MINUTE
		});

		spinner = new Zarafa.common.ui.SpinnerField({
			defaultValue : initDate,
			minValue : initDate.add(Date.DAY, -2),
			maxValue : initDate.add(Date.DAY, 2),
			incrementValue: 15,
			alternateIncrementValue: 1,
			plugins: [ timePlugin ]
		});

		spinner.render(Ext.getBody());
	});

	afterEach(function() {
		spinner.destroy();
	});

	/*
	 * Test if the Component can also be setup without using any default values.
	 * We do a quick test to see if the component can be rendered, and if so,
	 * check if we can obtain the (empty) values.
	 */
	describe('Empty', function() {
		var emptySpinnerFn;
		var spinner;

		beforeEach(function() {
			emptySpinnerFn = function() {
				spinner = new Zarafa.common.ui.SpinnerField({
					incrementValue: 15,
					alternateIncrementValue: 1,
					plugins: [{
						ptype: 'zarafa.timespinner', 
						format: 'G:i',
						alternateIncrementField : Date.HOUR,
						incrementField: Date.MINUTE	
					}]
				});
				spinner.render(Ext.getBody());
				return spinner;
			};
		});

		afterEach(function() {
			spinner.destroy();
		});

		it('can render the component without a default value', function() {
			expect(emptySpinnerFn).not.toThrow();
		});

		it('returns \'undefined\' without a default value', function() {
			expect(emptySpinnerFn().getValue()).toBeNull();
		});

		it('has an empty DOM value without a default value', function() {
			expect(emptySpinnerFn().getRawValue()).toEqual('');
		});

		it('can execute spinUp()', function() {
			expect(function() { emptySpinnerFn().plugins[0].onSpinUp(); }).not.toThrow();
		});

		it('can execute spinDown()', function() {
			expect(function() { emptySpinnerFn().plugins[0].onSpinDown(); }).not.toThrow();
		});
	});

	/*
	 * Test if all values are correctly setup. In other words,
	 * is the value of the correct type and can we modify it like
	 * we want it to.
	 */
	describe('Values', function() {
		
		it('has a value of type Date', function() {
			expect(spinner.getValue()).toEqual(jasmine.any(Date));
		});

		it('can render the component with the default value', function() {
			expect(spinner.getValue()).toEqual(spinner.defaultValue);
		});

		it('has a DOM value which represents the real value', function() {
			var expectedDOM = spinner.getValue().format(timePlugin.format);
			expect(spinner.getRawValue()).toEqual(expectedDOM);
		});

		it('can update the value with setValue() using String object', function() {
			spinner.setValue('14:15');
			expect(spinner.getRawValue()).toEqual('14:15');
			expect(spinner.getValue().format(timePlugin.format)).toEqual('14:15');
		});

		it('can update the value with setValue() using Date object', function() {
			spinner.setValue(new Date(2017, 12, 13, 14, 15));
			expect(spinner.getRawValue()).toEqual('14:15');
			expect(spinner.getValue().format(timePlugin.format)).toEqual('14:15');
		});
	});

	/*
	 * Test if the spinner actions are correctly working.
	 * We fake the invocation of the spinner handlers, but at least
	 * we can determine if the values are updated correctly.
	 */
	describe('Spinners', function() {

		it('increments time on spinUp()', function() {
			var expectedDate = spinner.getValue().add(timePlugin.incrementField, spinner.incrementValue);
			timePlugin.onSpinUp();
			expect(spinner.getValue()).toEqual(expectedDate);
		});

		it('increments time on spinUpAlternate()', function() {
			var expectedDate = spinner.getValue().add(timePlugin.alternateIncrementField, spinner.alternateIncrementValue);
			timePlugin.onSpinUpAlternate();
			expect(spinner.getValue()).toEqual(expectedDate);
		});

		it ('decrements time on spinDown()', function() {
			var expectedDate = spinner.getValue().add(timePlugin.incrementField, -1 * spinner.incrementValue);
			timePlugin.onSpinDown();
			expect(spinner.getValue()).toEqual(expectedDate);
		});

		it('decrements time on spinDownAlternate()', function() {
			var expectedDate = spinner.getValue().add(timePlugin.alternateIncrementField, -1 * spinner.alternateIncrementValue);
			timePlugin.onSpinDownAlternate();
			expect(spinner.getValue()).toEqual(expectedDate);
		});

		it('is limited to the maximum value', function() {
			for (var i = 0; i < 72; i++)
				timePlugin.onSpinUpAlternate();
			expect(spinner.getValue()).toEqual(spinner.maxValue);
		});

		it('is limited to the minimum value', function() {
			for (var i = 0; i < 72; i++)
				timePlugin.onSpinDownAlternate();
			expect(spinner.getValue()).toEqual(spinner.minValue);
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
				var initDate = new Date(2017, 3, 26, 2, 00);

				spinner.setValue(initDate);
				spinner.minValue = initDate.add(Date.DAY, -2);
				spinner.maxValue = initDate.add(Date.DAY, 2);
			});

			it('is limited to the maximum value', function() {
				for (var i = 0; i < 72; i++)
					timePlugin.onSpinUpAlternate();
				expect(spinner.getValue()).toEqual(spinner.maxValue);
			});

			it('is limited to the minimum value', function() {
				for (var i = 0; i < 72; i++)
					timePlugin.onSpinDownAlternate();
				expect(spinner.getValue()).toEqual(spinner.minValue);
			});
		});

		/*
		 * Test switching from summer to winter time.
		 */
		describe('Winter Time', function() {

			beforeEach(function() {
				// The Dutch date on which we end daylight saving in 2017
				var initDate = new Date(2017, 10, 29, 3, 00);

				spinner.setValue(initDate);
				spinner.minValue = initDate.add(Date.DAY, -2);
				spinner.maxValue = initDate.add(Date.DAY, 2);
			});

			/* Broken test due to DST */
			xit('is limited to the maximum value', function() {
				timePlugin.log = true;
				for (var i = 0; i < 72; i++)
					timePlugin.onSpinUpAlternate();
				timePlugin.log = false;
				expect(spinner.getValue()).toEqual(spinner.maxValue);
			});

			it('is limited to the minimum value', function() {
				for (var i = 0; i < 72; i++)
					timePlugin.onSpinDownAlternate();
				expect(spinner.getValue()).toEqual(spinner.minValue);
			});
		});
	});

	/*
	 * Test if all events are working for the TimeSpinner.
	 * Whenever the spinUp/spinUpAlternate or spinDown/spinDownAlternate
	 * functions are used, the spin/spinUp and spin/spinDown events
	 * must be fired.
	 *
	 * For checking if an event has been fired with add
	 * a spy on the DateRange.fireEvent() function.
	 */
	describe('Events', function() {

		beforeEach(function() {
			spyOn(spinner, 'fireEvent').and.callThrough();
		});

		it('fires the \'spin\' event after spinUp()', function() {
			timePlugin.onSpinUp();
			expect(spinner.fireEvent.calls.argsFor(2)[0]).toEqual('spin');
		});

		it('fires the \'spinup\' event after spinUp()', function() {
			timePlugin.onSpinUp();
			expect(spinner.fireEvent.calls.mostRecent().args[0]).toEqual('spinup');
		});

		it('fires the \'spin\' event after spinDown()', function() {
			timePlugin.onSpinDown();
			expect(spinner.fireEvent.calls.argsFor(2)[0]).toEqual('spin');
		});

		it('fires \'spindown\' event after spinDown()', function() {
			timePlugin.onSpinDown();
			expect(spinner.fireEvent.calls.mostRecent().args[0]).toEqual('spindown');
		});
	});
});
