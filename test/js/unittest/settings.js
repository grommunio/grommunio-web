describe('SettingsModel', function() {
  var settingsModel;

	beforeEach(function() {
    container = new Zarafa.core.Container();
		settingsModel = container.getSettingsModel();

		// Add some extra data to the defaults
		settingsModel.defaults['test'] = { 'my_default_setting' : true };
	});

	afterEach(function() {
	});

  describe('Initialize', function() {

    it('can initialize the model with only default values', function() {
			settingsModel.initialize();
			expect(settingsModel.get('test/my_default_setting')).toBeTruthy();
		});

		it('can initialize the model with extra non-default values', function() {
			settingsModel.initialize({
				'test' : {
					'my_non_default_setting' : true
				}
			});
			expect(settingsModel.get('test/my_non_default_setting')).toBeTruthy();
		});

		it('can override a default setting with non-default value', function() {
			settingsModel.initialize({
				'test' : {
					'my_default_setting' : false
				}
			});
			expect(settingsModel.get('test/my_default_setting')).toBeFalsy();
		});
  });

	/*
	 * Test obtaining a Setting from the model.
	 */
	describe('Read', function() {
		beforeEach(function() {
			settingsModel.initialize({
				'test' : {
					'value1' : 1,
					'value2' : 'test'
				}
			});
		});

		it('can obtain a setting as single value', function() {
			expect(settingsModel.get('test/value1')).toEqual(1);
		});

		it('can obtain a setting as a Javascript object', function() {
			expect(settingsModel.get('test', true)).toEqual({ 'value1' : 1, 'value2' : 'test', 'my_default_setting' : true });
		});

		it('does not throw an exception when requesting a non existing setting', function() {
			expect(function() { settingsModel.get('test/nothing'); }).not.toThrow();
		});

		it('cannot obtain a Date object after saving it into the settings', function() {
			const date = new Date();
			const origDate = date.clone();
			settingsModel.set('datetest', date);

			const newDate = settingsModel.get('datetest');
			date.setHours(date.getHours() + 5);

			expect(newDate).toEqual(origDate);
			expect(newDate).not.toEqual(date);
		});

		it('cannot obtain an Array object after saving it into the settings', function() {
			const array = [ 6 ];
			const origArray = array.clone();
			settingsModel.set('arraytest', array);

			const newArray = settingsModel.get('arraytest');
			array.push(5);

			expect(newArray).toEqual(origArray);
			expect(newArray).not.toEqual(array);
		});

		it('cannot obtain an Object object after saving it into the settings', function() {
			const object = { 'a' : 4 };
			const origObject = Ext.apply({}, object);
			settingsModel.set('objecttest', object);

			const newObject = settingsModel.get('objecttest', true);
			object['b'] = 5;

			expect(newObject).toEqual(origObject);
			expect(newObject).not.toEqual(object);
		});
	});

	/*
	 * Test changing a Setting in the model.
	 */
	describe('Write', function() {
		beforeEach(function() {
			spyOn(settingsModel, 'execute');

			settingsModel.initialize({
				'test' : {
					'value1' : 1,
					'value2' : 'test'
				}
			});
		});

		it('can add a new setting with a single value', function() {
			settingsModel.set('test/value3', 4);
			expect(settingsModel.get('test/value3')).toEqual(4);
			expect(settingsModel.get('test', true)).toEqual({ 'value1' : 1, 'value2' : 'test', 'value3' : 4, 'my_default_setting' : true });
		});

		it('can add new settings using a javascript object', function() {
			settingsModel.set('test/sub', { 'value4' : 6, 'value5' : 7 });
			expect(settingsModel.get('test/sub/value4')).toEqual(6);
			expect(settingsModel.get('test/sub/value5')).toEqual(7);
			expect(settingsModel.get('test', true)).toEqual({ 'value1' : 1, 'value2' : 'test', 'sub' : { 'value4' : 6, 'value5' : 7 }, 'my_default_setting' : true });
		});

		it('can modify an existing setting', function() {
			settingsModel.set('test/value1', 2);
			expect(settingsModel.get('test/value1')).toEqual(2);
			expect(settingsModel.get('test', true)).toEqual({ 'value1' : 2, 'value2' : 'test', 'my_default_setting' : true });
		});

		it('can modify existing settings using a javascript object', function() {
			settingsModel.set('test', { 'value1' : 2, 'value3' : 4 });
			expect(settingsModel.get('test/value1')).toEqual(2);
			expect(settingsModel.get('test/value3')).toEqual(4);
			expect(settingsModel.get('test', true)).toEqual({ 'value1' : 2, 'value3' : 4 });
		});

		it('can modify existing settings while preserving other settings using a javascript object', function() {
			settingsModel.set('test', { 'value1' : 2, 'value2' : 'test' });
			expect(settingsModel.get('test/value1')).toEqual(2);
			expect(settingsModel.get('test/value2')).toEqual('test');
			expect(settingsModel.get('test', true)).toEqual({ 'value1' : 2, 'value2' : 'test' });
		});

		it('will send a single request to the server when adding settings using a javascript object', function() {
			settingsModel.set('test', { 'value1' : 2, 'value2' : 'bla', 'my_default_setting' : false });
			expect(settingsModel.execute.calls.mostRecent().args[0]).toEqual('set');
			expect(settingsModel.execute.calls.count()).toEqual(1);
		});

		it('can delete a setting from the settings table', function() {
			settingsModel.set('test/sub', { 'value4' : 6, 'value5' : 7 });
			settingsModel.remove('test/sub');
			expect(settingsModel.get('test/sub/value4')).not.toBeDefined();
		});

		it('can delete multiple settings using a partial path', function() {
			settingsModel.remove('test');
			expect(settingsModel.get('test/value1')).not.toBeDefined();
			expect(settingsModel.get('test/value2')).not.toBeDefined();
		});

		it('will send a single request to the server when deleting multiple settings at once', function() {
			settingsModel.remove('test');
			expect(settingsModel.execute.calls.count()).toEqual(1);
		});

		it('does not throw an error when an unexisting setting is deleted', function() {
			expect(function() { settingsModel.remove('test/nothing'); }).not.toThrow();
		});

		it('cannot edit a Date object after saving it into the settings', function() {
			const date = new Date();
			const origDate = date.clone();
			settingsModel.set('datetest', date);

			date.setHours(date.getHours() + 5);
			const newDate = settingsModel.get('datetest');

			expect(newDate).toEqual(origDate);
			expect(newDate).not.toEqual(date);
		});

		it('cannot edit an Array object after saving it into the settings', function() {
			const array = [ 6 ];
			const origArray = array.clone();
			settingsModel.set('arraytest', array);

			array.push(5);
			const newArray = settingsModel.get('arraytest');

			expect(newArray).toEqual(origArray);
			expect(newArray).not.toEqual(array);
		});

		it('cannot edit an Object object after saving it into the settings', function() {
			const object = { 'a' : 4 };
			const origObject = Ext.apply({}, object);
			settingsModel.set('objecttest', object);

			object['b'] = 5;
			const newObject = settingsModel.get('objecttest', true);

			expect(newObject).toEqual(origObject);
			expect(newObject).not.toEqual(object);
		});
	});

	/*
	 * Test that we can restore default values into the settings
	 */
	describe('Restore', function() {
		beforeEach(function() {
			settingsModel.initialize({
				'test' : {
					'value1' : 1,
					'value2' : 'test',
					'my_default_setting' : false
				}
			});
		});

		it('can restore a single setting', function() {
			settingsModel.restore('test/my_default_setting');
			expect(settingsModel.get('test/my_default_setting')).toBeTruthy();
		});

		it('can restore a group of settings', function() {
			settingsModel.restore('test');
			expect(settingsModel.get('test', true)).toEqual({ 'my_default_setting' : true });
		});

	});

	/*
	 * Test that all events are send at the correct moment
	 */
	describe('Events', function() {
		beforeEach(function() {
      jasmine.addMatchers(customMatchers);
			spyOn(settingsModel, 'execute');
			spyOn(settingsModel, 'fireEvent');

			settingsModel.initialize({
				'test' : {
					'value1' : 1,
					'value2' : 'test'
				}
			});
		});

		it('will fire the \'set\' event when changing a setting', function() {
			settingsModel.set('test/value1', 2);
			expect(settingsModel.fireEvent.calls.mostRecent().args[0]).toEqual('set');
		});

		it('will fire the \'set\' event only once when setting an object', function() {
			settingsModel.set('test', { 'value1' : 2, 'value2' : 'bla', 'my_default_setting' : false });
			expect(settingsModel.fireEvent.calls.mostRecent().args[0]).toEqual('set');
			expect(settingsModel.fireEvent.calls.count()).toEqual(1);
		});

		it('will fire the \'set\' event after restoring settings', function() {
			settingsModel.restore('test');
			expect(settingsModel.fireEvent).toHaveBeenCalledWithFirstArgument('set');
		});

		it('will fire the \'set\' event only after completing the transaction', function() {
			settingsModel.beginEdit();
			settingsModel.set('test/value1', 2);
			settingsModel.set('test/value1', 3);
			expect(settingsModel.fireEvent).not.toHaveBeenCalledWithFirstArgument('set');
			settingsModel.endEdit();
			expect(settingsModel.fireEvent).toHaveBeenCalledWithFirstArgument('set');
		});

		it('will fire the \'remove\' event when deleting a setting', function() {
			settingsModel.remove('test/value1');
			expect(settingsModel.fireEvent).toHaveBeenCalledWithFirstArgument('remove');
		});

		it('will not fire the \'remove\' event for settings which didn\'t exist', function() {
			settingsModel.remove('nowhere');
			expect(settingsModel.fireEvent).not.toHaveBeenCalledWithFirstArgument('set');
		});

		it('will fire the \'remove\' event only once when deleting an object', function() {
			settingsModel.remove('test');
			expect(settingsModel.fireEvent).toHaveBeenCalledWithFirstArgument('remove');
			expect(settingsModel.fireEvent.calls.count()).toEqual(1);
		});

		it('will fire the \'remove\' event after restoring settings', function() {
			settingsModel.restore('test');
			expect(settingsModel.fireEvent).toHaveBeenCalledWithFirstArgument('remove');
		});

		it('will fire the \'remove\' event only after completing the transaction', function() {
			settingsModel.beginEdit();
			settingsModel.remove('test/value1');
			settingsModel.remove('test/value2');
			expect(settingsModel.fireEvent).not.toHaveBeenCalledWithFirstArgument('remove');
			settingsModel.endEdit();
			expect(settingsModel.fireEvent).toHaveBeenCalledWithFirstArgument('remove');
		});
  });
});
