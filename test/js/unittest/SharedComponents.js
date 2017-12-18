/*
 * Test the Shared Components System
 */
describe('SharedComponents', function() {
  beforeAll(function() {
    container = new Zarafa.core.Container();
    container.setServerConfig({always_enabled_plugins: ''});
  });

	/*
	 * Test functions in the Zarafa.core.Container for the Shared Components.
	 */
	describe('Container', function() {

		beforeAll(function() {
			// Create a special Custom TestPlugin class, which we can
			// enable for this unittest.
			const TestPlugin = Ext.extend(Zarafa.core.Plugin, {});

			const metaData = new Zarafa.core.PluginMetaData({
				'name' : 'test',
				'allowUserDisable' : false,
				'pluginConstructor' : TestPlugin
			});
			container.registerPlugin(metaData);
		});

		it('calls bidSharedComponent of each registered plugin', function() {
			const plugin = container.getPluginByName('test');
			spyOn(plugin, 'bidSharedComponent');

			container.getSharedComponent(Zarafa.core.data.SharedComponentType['common.create']);

			expect(plugin.bidSharedComponent).toHaveBeenCalled();
		});

		it('calls getSharedComponent of the highest bidding plugin', function() {
			const plugin = container.getPluginByName('test');

			spyOn(plugin, 'bidSharedComponent').and.returnValue(1);
			spyOn(plugin, 'getSharedComponent');

			container.getSharedComponent(Zarafa.core.data.SharedComponentType['common.create']);

			expect(plugin.getSharedComponent).toHaveBeenCalled();
		});

		it('calls bidSharedComponent of the plugin correctly with the type and record arguments', function() {
			const plugin = container.getPluginByName('test');
			const record = new Ext.data.Record();

			spyOn(plugin, 'bidSharedComponent');

			container.getSharedComponent(Zarafa.core.data.SharedComponentType['common.create'], record);

			expect(plugin.bidSharedComponent).toHaveBeenCalledWith(Zarafa.core.data.SharedComponentType['common.create'], record);
		});

		it('calls getSharedComponent of the plugin correctly with the type and record arguments', function() {
			const plugin = container.getPluginByName('test');
			const record = new Ext.data.Record();

			spyOn(plugin, 'bidSharedComponent').and.returnValue(1);
			spyOn(plugin, 'getSharedComponent');

			container.getSharedComponent(Zarafa.core.data.SharedComponentType['common.create'], record);

			expect(plugin.getSharedComponent).toHaveBeenCalledWith(Zarafa.core.data.SharedComponentType['common.create'], record);
		});

		it('returns undefined when no plugin bids higher than -1', function() {
			const plugin = container.getPluginByName('test');

			spyOn(plugin, 'bidSharedComponent').and.returnValue(-1);

			const value = container.getSharedComponent(Zarafa.core.data.SharedComponentType['common.create']);

			expect(value).toBeUndefined();
		});
	});

	/*
	 * Test the SharedComponentType enumeration.
	 */
	describe('SharedComponentType', function() {

		it('calls bidSharedComponent of each registered plugin', function() {
			Zarafa.core.data.SharedComponentType.addProperty('common.test.sharedcomponent');
			expect(Zarafa.core.data.SharedComponentType['common.test.sharedcomponent']).toBeDefined();
		});
	});
});
