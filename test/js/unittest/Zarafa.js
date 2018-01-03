describe('Zarafa', function() {
	beforeAll(function() {
		container = new Zarafa.core.Container();
		container.setServerConfig({});
	});

	/*
	 * Test if the environment can be initialized properly using the
	 * Zarafa.onReady and Zarafa.fireReady functions.
	 */
	describe('Initialization', function() {
		var fn;

		beforeEach(function() {
			fn = jasmine.createSpy();
		});

		it('can call register a callback function using onReady', function() {
			const doAction = function() {
				Zarafa.onReady(fn, this);
			};

			expect(doAction).not.toThrow();
		});

		it('can invoke the registered callback function using fireReady', function() {
			Zarafa.onReady(fn, this);

			expect(fn).not.toHaveBeenCalled();

			Zarafa.fireReady();

			expect(fn).toHaveBeenCalled();
		});

		it('can invoke a callback function using onReady after fireReady', function() {
			Zarafa.fireReady();

			Zarafa.onReady(fn, this);

			expect(fn).toHaveBeenCalled();
		});	
	});
});
