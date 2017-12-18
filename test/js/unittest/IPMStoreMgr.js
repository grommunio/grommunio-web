/*
 * Test the Zarafa.core.data.IPMStoreMgr
 */
describe('IPMStoreMgr', function() {

	/*
	 * Test the registration and deregistration of IPMStores to the IPMStoreMgr
	 */
	describe('Registration', function() {

		beforeEach(function() {
			Zarafa.core.data.IPMStoreMgr.IPMStores.each(function(store) { store.destroy(); });
		});

		it('initially does not have any IPMStores registered', function() {
			expect(Zarafa.core.data.IPMStoreMgr.IPMStores.length).toEqual(0);
		});

		it('registers an IPMStore to the IPMStoreMgr on creation', function() {
			var store = new Zarafa.core.data.IPMStore({
				proxy : new Zarafa.core.data.IPMProxy()
			});
			var IPMStoreMgrLength = Zarafa.core.data.IPMStoreMgr.IPMStores.length;
			store.destroy();
			expect(IPMStoreMgrLength).toEqual(1);
		});

		it('does not register an standalone IPMStore to the IPMStoreMgr on creation', function() {
			var store = new Zarafa.core.data.IPMStore({
				proxy : new Zarafa.core.data.IPMProxy(),
				standalone : true
			});
			var IPMStoreMgrLength = Zarafa.core.data.IPMStoreMgr.IPMStores.length;
			store.destroy();
			expect(IPMStoreMgrLength).toEqual(0);
		});

		it('will unregister the IPMStore from the IPMStoreMgr when it is being destroyed', function() {
			var store = new Zarafa.core.data.IPMStore({
				proxy : new Zarafa.core.data.IPMProxy()
			});
			var IPMStoreMgrLength = Zarafa.core.data.IPMStoreMgr.IPMStores.length;
			store.destroy();
			expect(IPMStoreMgrLength).toEqual(1);
			IPMStoreMgrLength = Zarafa.core.data.IPMStoreMgr.IPMStores.length;
			expect(IPMStoreMgrLength).toEqual(0);
		});

		it('registers the ShadowStore to the IPMStoreMgr on creation', function() {
			var store = new Zarafa.core.data.ShadowStore();
			var IPMStoreMgrLength = Zarafa.core.data.IPMStoreMgr.IPMStores.length;
			store.destroy();
			expect(IPMStoreMgrLength).toEqual(1);
		});

		it('does not register an standalone ShadowStore to the IPMStoreMgr on creation', function() {
			var store = new Zarafa.core.data.ShadowStore({ standalone : true });
			var IPMStoreMgrLength = Zarafa.core.data.IPMStoreMgr.IPMStores.length;
			store.destroy();
			expect(IPMStoreMgrLength).toEqual(0);
		});

		it('will unregister the ShadowStore from the IPMStoreMgr when it is being destroyed', function() {
			var store = new Zarafa.core.data.ShadowStore();
			var IPMStoreMgrLength = Zarafa.core.data.IPMStoreMgr.IPMStores.length;
			store.destroy();
			expect(IPMStoreMgrLength).toEqual(1);
			IPMStoreMgrLength = Zarafa.core.data.IPMStoreMgr.IPMStores.length;
			expect(IPMStoreMgrLength).toEqual(0);
		});
	});

	xdescribe('InterStore communication', function() {
		var folder1;
		var folder2;
		var store1;
		var record1;
		var remoteStore1;
		var remoteRecord1;
		var store2;
		var record2;

		beforeEach(function() {
			folder1 = Zarafa.test.data.records.getFolderRecord(Zarafa.test.data.Types.TEST_NORMAL_DATA, 1);
			folder2 = Zarafa.test.data.records.getFolderRecord(Zarafa.test.data.Types.TEST_NORMAL_DATA, 2);

			var fakeExecute = function(action, rs, options) {
				var data = [];
				for (var i = 0, len = rs.length; i < len; i++) {
					data.push({
						'entryid' : rs[i].get('entryid'),
						'parent_entryid' : rs[i].get('parent_entryid'),
						'store_entryid' : rs[i].get('store_entryid'),
						'props' : {
							'subject' : rs[i].get('subject')
						}
					});
				}

				this['on' + Ext.util.Format.capitalize(action) + 'Records'](true, rs, data);
				this.fireEvent('write', this, action, data, {}, rs);
			};

			store1 = new Zarafa.mail.MailStore();
			store1.lastOptions = {
				'folder' : [ folder1 ]
			};
			spyOn(store1, 'onNotify').andCallThrough();
			spyOn(store1, 'execute').andCallFake(fakeExecute);

			remoteStore1 = new Zarafa.mail.MailStore();
			remoteStore1.lastOptions = {
				'folder' : [ folder1 ]
			};
			spyOn(remoteStore1, 'onNotify').andCallThrough();
			spyOn(remoteStore1, 'execute').andCallFake(fakeExecute);

			store2 = new Zarafa.mail.MailStore();
			store2.lastOptions = {
				'folder' : [ folder2 ]
			};
			spyOn(store2, 'onNotify').andCallThrough();
			spyOn(store2, 'execute').andCallFake(fakeExecute);

			record1 = Zarafa.test.data.records.getMailRecord(Zarafa.test.data.Types.TEST_NORMAL_DATA, 1);
			record1.set('parent_entryid', folder1.get('entryid'));
			store1.add(record1);

			remoteRecord1 = Zarafa.test.data.records.getMailRecord(Zarafa.test.data.Types.TEST_NORMAL_DATA, 1);
			remoteRecord1.set('parent_entryid', folder1.get('entryid'));
			remoteStore1.add(remoteRecord1);

			record2 = Zarafa.test.data.records.getMailRecord(Zarafa.test.data.Types.TEST_NORMAL_DATA, 2);
			record2.set('parent_entryid', folder2.get('entryid'));
			store2.add(record2);
		});
	});

	/*
	 * Test if the IPMStoreMgr and IPMStore register the correct events after registration
	 */
	describe('Events', function() {
		var store;
		var serverOnlyStore;

		beforeAll(function() {
			jasmine.addMatchers(customMatchers);

			store = new Zarafa.core.data.IPMStore({
				proxy : new Zarafa.core.data.IPMProxy()
			});
			serverOnlyStore = new Zarafa.core.data.IPMStore({
				proxy : new Zarafa.core.data.IPMProxy(),
				serveronly :  true
			});
		});

		afterAll(function() {
			store.destroy();
			serverOnlyStore.destroy();
		});

		it('registers an event handler for \'beforerecordsave\'', function() {
			expect(Zarafa.core.data.IPMStoreMgr).toHaveRegisteredEventHandler('beforerecordsave', store);
		});

		it('does not register an event handler for \'beforerecordsave\' when only server changes are accepted', function() {
			expect(Zarafa.core.data.IPMStoreMgr).not.toHaveRegisteredEventHandler('beforerecordsave', serverOnlyStore);
		});

		it('registers an event handler for \'afterrecordwrite\'', function() {
			expect(Zarafa.core.data.IPMStoreMgr).toHaveRegisteredEventHandler('afterrecordwrite', store);
		});

		it('registers an event handler for \'afterrecordwrite\' when only server changes are accepted', function() {
			expect(Zarafa.core.data.IPMStoreMgr).toHaveRegisteredEventHandler('afterrecordwrite', serverOnlyStore);
		});

		it('registers an event handler for \'write\' to the IPMStoreMgr', function() {
			expect(store).toHaveRegisteredEventHandler('write', Zarafa.core.data.IPMStoreMgr);
		});

		it('registers an event handler for \'write\' to the IPMStoreMgr when only server changes are accepted', function() {
			expect(serverOnlyStore).toHaveRegisteredEventHandler('write', Zarafa.core.data.IPMStoreMgr);
		});

		it('registers an event handler for \'exception\' to the IPMStoreMgr', function() {
			expect(store).toHaveRegisteredEventHandler('exception', Zarafa.core.data.IPMStoreMgr);
		});

		it('registers an event handler for \'exception\' to the IPMStoreMgr when only server changes are accepted', function() {
			expect(serverOnlyStore).toHaveRegisteredEventHandler('exception', Zarafa.core.data.IPMStoreMgr);
		});

		it('registers an event handler for routing local Store updates to the IPMStoreMgr', function() {
			expect(store).toHaveRegisteredEventHandler('beforesave', Zarafa.core.data.IPMStoreMgr);
			expect(store).toHaveRegisteredEventHandler('save', Zarafa.core.data.IPMStoreMgr);
			expect(store).toHaveRegisteredEventHandler('update', Zarafa.core.data.IPMStoreMgr);
			expect(store).toHaveRegisteredEventHandler('remove', Zarafa.core.data.IPMStoreMgr);
		});

		it('does not register an event handler for routing local Store updates to the IPMStoreMgr when only server changes are accepted', function() {
			expect(serverOnlyStore).not.toHaveRegisteredEventHandler('beforesave', Zarafa.core.data.IPMStoreMgr);
			expect(serverOnlyStore).not.toHaveRegisteredEventHandler('save', Zarafa.core.data.IPMStoreMgr);
			expect(serverOnlyStore).not.toHaveRegisteredEventHandler('update', Zarafa.core.data.IPMStoreMgr);
			expect(serverOnlyStore).not.toHaveRegisteredEventHandler('remove', Zarafa.core.data.IPMStoreMgr);
		});
	});
});
