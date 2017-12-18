/*
 * Test the Zarafa.common.plugins.PercentSpinner plugin.
 */
describe("PercentSpinner", function() {
	var percentPlugin;
	var spinner;

	beforeEach(function() {
		percentPlugin = new Zarafa.common.plugins.PercentSpinner();

		spinner = new Zarafa.common.ui.SpinnerField({
			defaultValue : '50%',
			minValue : 0,
			maxValue : 1,
			incrementValue: 0.1,
			alternateIncrementValue: 0.25,
			plugins: [ percentPlugin ]
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
					minValue : 0,
					maxValue : 1,
					incrementValue: 0.1,
					alternateIncrementValue: 0.25,
					plugins: [{
						ptype: 'zarafa.percentspinner',
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
			expect(emptySpinnerFn().getValue()).not.toBeDefined();
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

		it('has a value of type Number', function() {
			expect(spinner.getValue()).toEqual(jasmine.any(Number));
		});

		it('can render the component with the default value', function() {
			expect(spinner.getValue()).toEqual(0.5);
		});

		it('has a DOM value which represents the real value', function() {
			expect(spinner.getRawValue()).toEqual('50%');
		});

		it('can update the value with setValue() using String object', function() {
			spinner.setValue('15%');
			expect(spinner.getRawValue()).toEqual('15%');
			expect(spinner.getValue()).toEqual(0.15);
		});

		it('can update the value with setValue() using Number object', function() {
			spinner.setValue(0.15);
			expect(spinner.getRawValue()).toEqual('15%');
			expect(spinner.getValue()).toEqual(0.15);
		});
	});

	/*
	 * Test if the spinner actions are correctly working.
	 * We fake the invocation of the spinner handlers, but at least
	 * we can determine if the values are updated correctly.
	 */
	describe('Spinners', function() {

		it('increments percentage on spinUp()', function() {
			var expectedValue = spinner.getValue() + spinner.incrementValue;
			percentPlugin.onSpinUp();
			expect(spinner.getValue()).toEqual(expectedValue);
		});

		it('increments percentage spinUpAlternate()', function() {
			var expectedValue = spinner.getValue() + spinner.alternateIncrementValue;
			percentPlugin.onSpinUpAlternate();
			expect(spinner.getValue()).toEqual(expectedValue);
		});

		it ('decrements percentage on spinDown()', function() {
			var expectedValue = spinner.getValue() - spinner.incrementValue;
			percentPlugin.onSpinDown();
			expect(spinner.getValue()).toEqual(expectedValue);
		});

		it('decrements percentage on spinDownAlternate()', function() {
			var expectedValue = spinner.getValue() - spinner.alternateIncrementValue;
			percentPlugin.onSpinDownAlternate();
			expect(spinner.getValue()).toEqual(expectedValue);
		});

		it('is limited to the maximum value', function() {
        	for (var i = 0; i < 10; i++)
				percentPlugin.onSpinUpAlternate();
			expect(spinner.getValue()).toEqual(spinner.maxValue);
		});

		it('is limited to the minimum value', function() {
        	for (var i = 0; i < 10; i++)
				percentPlugin.onSpinDownAlternate();
			expect(spinner.getValue()).toEqual(spinner.minValue);
		});
	});

	/*
	 * Test if all events are working for the PercentSpinner.
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
			percentPlugin.onSpinUp();
			expect(spinner.fireEvent.calls.argsFor(2)[0]).toEqual('spin');
		});

		it('fires the \'spinup\' event after spinUp()', function() {
			percentPlugin.onSpinUp();
			expect(spinner.fireEvent.calls.mostRecent().args[0]).toEqual('spinup');
		});

		it('fires the \'spin\' event after spinDown()', function() {
			percentPlugin.onSpinDown();
			expect(spinner.fireEvent.calls.argsFor(2)[0]).toEqual('spin');
		});

		it('fires \'spindown\' event after spinDown()', function() {
			percentPlugin.onSpinDown();
			expect(spinner.fireEvent.calls.mostRecent().args[0]).toEqual('spindown');
		});
	});
});
