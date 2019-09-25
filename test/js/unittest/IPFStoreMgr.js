/*
 * Test the Zarafa.core.data.IPFStoreMgr
 */
describe('IPFStoreMgr', function() {

	/*
	 * Test the registration and deregistration of IPFStores to the IPFStoreMgr
	 */
	describe('Registration', function() {

		it('initially does not have any IPFStores registered', function() {
			expect(Zarafa.core.data.IPFStoreMgr.IPFStores.length).toEqual(0);
		});

		it('registers an IPFStore to the IPFStoreMgr on creation', function() {
			var store = new Zarafa.core.data.IPFStore({
				proxy : new Zarafa.core.data.MAPIProxy()
			});
			var IPFStoreMgrLength = Zarafa.core.data.IPFStoreMgr.IPFStores.length;
			store.destroy();
			expect(IPFStoreMgrLength).toEqual(1);
		});

		it('does not register an standalone IPFStore to the IPFStoreMgr on creation', function() {
			var store = new Zarafa.core.data.IPFStore({
				proxy : new Zarafa.core.data.MAPIProxy(),
				standalone : true
			});
			var IPFStoreMgrLength = Zarafa.core.data.IPFStoreMgr.IPFStores.length;
			store.destroy();
			expect(IPFStoreMgrLength).toEqual(0);
		});

		it('will unregister the IPFStore from the IPFStoreMgr when it is being destroyed', function() {
			var store = new Zarafa.core.data.IPFStore({
				proxy : new Zarafa.core.data.MAPIProxy()
			});
			var IPFStoreMgrLength = Zarafa.core.data.IPFStoreMgr.IPFStores.length;
			store.destroy();
			expect(IPFStoreMgrLength).toEqual(1);
			IPFStoreMgrLength = Zarafa.core.data.IPFStoreMgr.IPFStores.length;
			expect(IPFStoreMgrLength).toEqual(0);
		});

		it('registers the ShadowStore to the IPFStoreMgr on creation', function() {
			var store = new Zarafa.core.data.ShadowStore();
			var IPFStoreMgrLength = Zarafa.core.data.IPFStoreMgr.IPFStores.length;
			store.destroy();
			expect(IPFStoreMgrLength).toEqual(1);
		});

		it('does not register an standalone ShadowStore to the IPFStoreMgr on creation', function() {
			var store = new Zarafa.core.data.ShadowStore({ standalone : true });
			var IPFStoreMgrLength = Zarafa.core.data.IPFStoreMgr.IPFStores.length;
			store.destroy();
			expect(IPFStoreMgrLength).toEqual(0);
		});

		it('will unregister the ShadowStore from the IPFStoreMgr when it is being destroyed', function() {
			var store = new Zarafa.core.data.ShadowStore();
			var IPFStoreMgrLength = Zarafa.core.data.IPFStoreMgr.IPFStores.length;
			store.destroy();
			expect(IPFStoreMgrLength).toEqual(1);
			IPFStoreMgrLength = Zarafa.core.data.IPFStoreMgr.IPFStores.length;
			expect(IPFStoreMgrLength).toEqual(0);
		});
	});

	/*
	 * Test if the IPFStoreMgr and IPFStore register the correct events after registration
	 */
	describe('Events', function() {
		var store;
		var serverOnlyStore;

		beforeEach(function() {
			jasmine.addMatchers(customMatchers);

			store = new Zarafa.core.data.IPFStore({
				proxy : new Zarafa.core.data.MAPIProxy()
			});
			serverOnlyStore = new Zarafa.core.data.IPFStore({
				proxy : new Zarafa.core.data.MAPIProxy(),
				serveronly :  true
			});
		});

		afterEach(function() {
			store.destroy();
			serverOnlyStore.destroy();
		});

		it('registers an event handler for \'beforerecordsave\'', function() {
			expect(Zarafa.core.data.IPFStoreMgr).toHaveRegisteredEventHandler('beforerecordsave', store);
		});

		it('does not register an event handler for \'beforerecordsave\' when only server changes are accepted', function() {
			expect(Zarafa.core.data.IPFStoreMgr).not.toHaveRegisteredEventHandler('beforerecordsave', serverOnlyStore);
		});

		it('registers an event handler for \'afterrecordwrite\'', function() {
			expect(Zarafa.core.data.IPFStoreMgr).toHaveRegisteredEventHandler('afterrecordwrite', store);
		});

		it('registers an event handler for \'afterrecordwrite\' when only server changes are accepted', function() {
			expect(Zarafa.core.data.IPFStoreMgr).toHaveRegisteredEventHandler('afterrecordwrite', serverOnlyStore);
		});

		it('registers an event handler for \'write\' to the IPFStoreMgr', function() {
			expect(store).toHaveRegisteredEventHandler('write', Zarafa.core.data.IPFStoreMgr);
		});

		it('registers an event handler for \'write\' to the IPFStoreMgr when only server changes are accepted', function() {
			expect(serverOnlyStore).toHaveRegisteredEventHandler('write', Zarafa.core.data.IPFStoreMgr);
		});

		it('registers an event handler for \'exception\' to the IPFStoreMgr', function() {
			expect(store).toHaveRegisteredEventHandler('exception', Zarafa.core.data.IPFStoreMgr);
		});

		it('registers an event handler for \'exception\' to the IPFStoreMgr when only server changes are accepted', function() {
			expect(serverOnlyStore).toHaveRegisteredEventHandler('exception', Zarafa.core.data.IPFStoreMgr);
		});

		it('registers an event handler for routing local Store updates to the IPFStoreMgr', function() {
			expect(store).toHaveRegisteredEventHandler('beforesave', Zarafa.core.data.IPFStoreMgr);
			expect(store).toHaveRegisteredEventHandler('save', Zarafa.core.data.IPFStoreMgr);
			expect(store).toHaveRegisteredEventHandler('update', Zarafa.core.data.IPFStoreMgr);
			expect(store).toHaveRegisteredEventHandler('remove', Zarafa.core.data.IPFStoreMgr);
		});

		it('does not register an event handler for routing local Store updates to the IPFStoreMgr when only server changes are accepted', function() {
			expect(serverOnlyStore).not.toHaveRegisteredEventHandler('beforesave', Zarafa.core.data.IPFStoreMgr);
			expect(serverOnlyStore).not.toHaveRegisteredEventHandler('save', Zarafa.core.data.IPFStoreMgr);
			expect(serverOnlyStore).not.toHaveRegisteredEventHandler('update', Zarafa.core.data.IPFStoreMgr);
			expect(serverOnlyStore).not.toHaveRegisteredEventHandler('remove', Zarafa.core.data.IPFStoreMgr);
		});
	});
});
