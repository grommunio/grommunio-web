/*
 * This file contains the unit tests for the Zarafa.common.categories.Util object.
 * The following methods of the object are tested:
 * - Zarafa.common.categories.Util.loadCategoriesStore
 * - Zarafa.common.categories.Util.getCategories
 * - Zarafa.common.categories.Util.setCategories
 * - Zarafa.common.categories.Util.addCategory
 * - Zarafa.common.categories.Util.getCommonCategories
 * - Zarafa.common.categories.Util.getAllCategories
 * - Zarafa.common.categories.Util.removeCategory
 * - Zarafa.common.categories.Util.getCategoryNameByFlagColor
 * - Zarafa.common.categories.Util.getCategoryColor
 * - Zarafa.common.categories.Util.getCategoryFromHtmlEncoded
 * - Zarafa.common.categories.Util.updateStoresAfterCategoryUpdate
 *
 * Every method has its own 'describe' block with 'it' specs.
 */
describe('Zarafa.common.categories.Util', function() {
    const initializePersistentSettings = () => {
        container.getPersistentSettingsModel().initialize({
    		kopano : {
    			main : {
    				categories : [{
    					'name' : 'Red',
    					'color' : '#e40023',
    					'standardIndex' : 6,
    					'quickAccess' : true,
    					'sortIndex' : 0,
    					'used' : false
                    }, {
                		'name' : 'Orange',
                		'color' : '#f99406',
                		'standardIndex' : 2,
                		'quickAccess' : true,
                		'sortIndex' : 1,
                		'used' : false
                    }, {
                		'name' : 'Black & Blue',
                		'color' : '#000000',
                		'quickAccess' : false,
                		'sortIndex' : 2,
                		'used' : false
                    }],
					merged_categories : {
						4 : "Orange" // yellow (2) is merged to orange
					}
    			}
    		}
        });
    };

    // Function to mock some records
    const categories = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange'];
    const createRecords = count => Array(count).fill(1).map((r,i) =>
        Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass(
            'IPM',
            {
                categories: categories[i % categories.length]
            }
        )
    );

    var categoriesStore;

    beforeEach(function(){
		container = new Zarafa.core.Container();
		container.setServerConfig({});
        initializePersistentSettings();

	    // Make sure we don't try to send anything to the server
	    container.getPersistentSettingsModel().save = () => {};

		categoriesStore = new Zarafa.common.categories.data.CategoriesStore();
    });
	afterEach(function() {
		categoriesStore.destroy();
	});

    describe('loadCategoriesStore', function(){
        it('should update the categoriesStore', function(){
            Zarafa.common.categories.Util.loadCategoriesStore();
            expect(Zarafa.common.categories.Util.categoriesStore.getRange().length).toEqual(3);

            const categoriesStore = new Zarafa.common.categories.data.CategoriesStore();
            categoriesStore.addCategory('MyTestCategory', '333333', true);
            categoriesStore.save();
            Zarafa.common.categories.Util.loadCategoriesStore();
            expect(Zarafa.common.categories.Util.categoriesStore.getRange().length).toEqual(4);
        });
    });

    describe('getCategories', function(){
        it('should return all categories on a record as an array', function(){
            const record = createRecords(1)[0];
            record.set('categories', 'Red; Blue; Green; Some random category;');
            const categories = Zarafa.common.categories.Util.getCategories(record);

            expect(Array.isArray(categories)).toBeTruthy();
            expect(categories.length).toEqual(4);
        });

        it('should have no problem when there the categories value does not end with a semi-colon', function(){
            const record = createRecords(1)[0];
            record.set('categories', 'Red; Blue; Green; Some random category');
            const categories = Zarafa.common.categories.Util.getCategories(record);

            expect(Array.isArray(categories)).toBeTruthy();
            expect(categories.length).toEqual(4);
        });

        it('should return an empty array when the record has no categories', function(){
            const record = createRecords(1)[0];
            record.set('categories', undefined);
            const categories = Zarafa.common.categories.Util.getCategories(record);

            expect(Array.isArray(categories)).toBeTruthy();
            expect(categories.length).toEqual(0);
        });

        it('should add an old style flag to the category list', function(){
            const record = createRecords(1)[0];
            record.set('flag_status', Zarafa.core.mapi.FlagStatus.flagged);
            record.set('flag_icon', Zarafa.core.mapi.FlagIcon.orange);
            const categories = Zarafa.common.categories.Util.getCategories(record);

            expect(Array.isArray(categories)).toBeTruthy();
            expect(categories.length).toEqual(2);
            expect(categories.some(c => c==='Orange')).toBeTruthy();
        });

        it('should not add an Follow-up flag to the category list', function(){
            const record = createRecords(1)[0];
            record.set('flag_status', Zarafa.core.mapi.FlagStatus.flagged);
            record.set('flag_request', 'Follow up');
            record.set('flag_icon', Zarafa.core.mapi.FlagIcon.orange);
            const categories = Zarafa.common.categories.Util.getCategories(record);

            expect(Array.isArray(categories)).toBeTruthy();
            expect(categories.length).toEqual(1);
            expect(categories.some(c => c==='Orange')).toBeFalsy();
        });

        it('should add old style labels to the category list', function(){
            const record = createRecords(1)[0];
            record.set('label', Zarafa.core.mapi.AppointmentLabels.TRAVEL_REQUIRED);
            const categories = Zarafa.common.categories.Util.getCategories(record);

            expect(Array.isArray(categories)).toBeTruthy();
            expect(categories.length).toEqual(2);
            expect(categories.some(c => c.toLowerCase() ==='travel required')).toBeTruthy();
        });

        it('should use names from the category list to avoid case-sensitivity issues', function(){
            const record = createRecords(1)[0];
            record.set('categories', 'reD; oRaNgE;');
            const categories = Zarafa.common.categories.Util.getCategories(record);

            expect(Array.isArray(categories)).toBeTruthy();
            expect(categories.length).toEqual(2);
            expect(categories.some(c => c==='Red')).toBeTruthy();
            expect(categories.some(c => c==='Orange')).toBeTruthy();
            expect(categories.some(c => c==='reD')).toBeFalsy();
            expect(categories.some(c => c==='oRaNgE')).toBeFalsy();
        });
    });

    describe('setCategories', function(){
        it('should set all given categories on the given records', function(){
            const records = createRecords(2);
            Zarafa.common.categories.Util.setCategories(records, ['Green', 'Yellow']);

            records.forEach( record => {
                const categories = Zarafa.common.categories.Util.getCategories(record);
                expect(categories.length).toEqual(2);
                expect(categories.some(c => c==='Green')).toBeTruthy();
                expect(categories.some(c => c==='Yellow')).toBeTruthy();
            });
        });

        it('should save the store once when asked', function(){
            const shadowStore =  container.getShadowStore();
            const records = createRecords(2);
            shadowStore.add(records);
            shadowStore.save = () => {};
            spyOn(shadowStore, 'save');

            Zarafa.common.categories.Util.setCategories(records, ['Green', 'Yellow'], true);
            expect(shadowStore.save).toHaveBeenCalled();

			// save will be called once for every store
            expect(shadowStore.save.calls.count()).toEqual(1);
        });
    });

    describe('addCategory', function(){
        it('should add the given category to the given records', function(){
            const records = createRecords(2);
            Zarafa.common.categories.Util.addCategory(records, 'Green');

            records.forEach( record => {
                const categories = Zarafa.common.categories.Util.getCategories(record);
                expect(categories.length).toEqual(2);
                expect(categories.some(c => c==='Green')).toBeTruthy();
            });
        });

        it('should convert labels to categories when adding the given category to the given records', function(){
            const records = createRecords(2);
            records.forEach(r => r.set('label', Zarafa.core.mapi.AppointmentLabels.TRAVEL_REQUIRED));
            Zarafa.common.categories.Util.addCategory(records, 'Green');

            records.forEach( record => {
                const categories = Zarafa.common.categories.Util.getCategories(record);
                expect(categories.length).toEqual(3);
                expect(categories.some(c => c==='Green')).toBeTruthy();
                expect(categories.some(c => c.toLowerCase() === 'travel required')).toBeTruthy();
            });
        });

        it('should save the store when asked', function(){
            const shadowStore =  container.getShadowStore();
            const records = createRecords(2);
            shadowStore.add(records);
            shadowStore.save = () => {};
            spyOn(shadowStore, 'save');

            Zarafa.common.categories.Util.addCategory(records, 'Green', true);
            expect(shadowStore.save).toHaveBeenCalled();

			// save will be called once for every record
            expect(shadowStore.save.calls.count()).toEqual(2);
        });
    });

    describe('getCommonCategories', function(){
        it('should return an empty array when the records have no categories in common', function(){
            const records = createRecords(3);
            const categories = Zarafa.common.categories.Util.getCommonCategories(records);

            expect(Array.isArray(categories)).toBeTruthy();
            expect(categories.length).toEqual(0);
        });

        it('should return the common categories of multiple records in an array', function(){
            const records = createRecords(3);
            Zarafa.common.categories.Util.addCategory(records, 'Green');
            Zarafa.common.categories.Util.addCategory(records, 'Orange');
            const categories = Zarafa.common.categories.Util.getCommonCategories(records);

            expect(Array.isArray(categories)).toBeTruthy();
            expect(categories.length).toEqual(2);
            expect(categories.some(c => c==='Green')).toBeTruthy();
            expect(categories.some(c => c==='Orange')).toBeTruthy();
            expect(categories.some(c => c==='Red')).toBeFalsy();
        });
    });

    describe('getAllCategories', function(){
        it('should return all categories that are set on the given records', function(){
            const records = createRecords(2);
            const categories = Zarafa.common.categories.Util.getAllCategories(records);

            expect(Array.isArray(categories)).toBeTruthy();
            expect(categories.length).toEqual(2);
            expect(categories.some(c => c==='Red')).toBeTruthy();
            expect(categories.some(c => c==='Blue')).toBeTruthy();
        });

        it('should return all categories that are set on the given records without duplicates', function(){
            const records = createRecords(2);
            Zarafa.common.categories.Util.addCategory([records[1]], 'Red');
            const categories = Zarafa.common.categories.Util.getAllCategories(records);

            expect(Array.isArray(categories)).toBeTruthy();
            expect(categories.length).toEqual(2);
            expect(categories.some(c => c==='Red')).toBeTruthy();
            expect(categories.some(c => c==='Blue')).toBeTruthy();
        });
    });

    describe('removeCategory', function(){
        it('should remove the given category from all given records', function(){
            const records = createRecords(3);
            Zarafa.common.categories.Util.addCategory([records[1]], 'Red');
            Zarafa.common.categories.Util.removeCategory(records, 'Red');

            records.forEach( record => {
                const categories = Zarafa.common.categories.Util.getCategories(record);

                expect(Array.isArray(categories)).toBeTruthy();
                expect(categories.some(c => c==='Red')).toBeFalsy();
            });
        });

        it('should update an old style flag to a no-date follow-up flag when the corresponding category is removed', function(){
            const records = createRecords(1);
            records[0].set('flag_status', Zarafa.core.mapi.FlagStatus.flagged);
            records[0].set('flag_icon', Zarafa.core.mapi.FlagIcon.orange);
            let categories = Zarafa.common.categories.Util.getAllCategories(records);

            expect(Array.isArray(categories)).toBeTruthy();
            expect(categories.length).toEqual(2);
            expect(categories.some(c => c==='Red')).toBeTruthy();
            expect(categories.some(c => c==='Orange')).toBeTruthy();

            Zarafa.common.categories.Util.removeCategory(records, 'Orange');
            categories = Zarafa.common.categories.Util.getAllCategories(records);

            expect(Array.isArray(categories)).toBeTruthy();
            expect(categories.length).toEqual(1);
            expect(categories.some(c => c==='Red')).toBeTruthy();
            expect(categories.some(c => c==='Orange')).toBeFalsy();

            expect(records[0].get('flag_request')).toEqual('Follow up');
            expect(records[0].get('startdate')).toEqual(null);
            expect(records[0].get('duedate')).toEqual(null);
        });

        it('should remove an old style label when the corresponding category is removed', function(){
            const records = createRecords(1);
            records[0].set('label', Zarafa.core.mapi.AppointmentLabels.TRAVEL_REQUIRED);
            let categories = Zarafa.common.categories.Util.getAllCategories(records);

            expect(Array.isArray(categories)).toBeTruthy();
            expect(categories.length).toEqual(2);
            expect(categories.some(c => c==='Red')).toBeTruthy();
            expect(categories.some(c => c.toLowerCase() === 'travel required')).toBeTruthy();

            Zarafa.common.categories.Util.removeCategory(records, 'Travel Required');
            categories = Zarafa.common.categories.Util.getAllCategories(records);

            expect(Array.isArray(categories)).toBeTruthy();
            expect(categories.length).toEqual(1);
            expect(categories.some(c => c==='Red')).toBeTruthy();
            expect(categories.some(c => c==='Travel Required')).toBeFalsy();

            expect(records[0].get('label')).toEqual(Zarafa.core.mapi.AppointmentLabels.NONE);
        });

        it('should save the store when asked', function(){
            const shadowStore =  container.getShadowStore();
            const records = createRecords(2);
            shadowStore.add(records);
            shadowStore.save = () => {};
            spyOn(shadowStore, 'save');

            Zarafa.common.categories.Util.removeCategory(records, 'Red', true);
            expect(shadowStore.save).toHaveBeenCalled();

			// save will be called once for every record
            expect(shadowStore.save.calls.count()).toEqual(2);
        });
    });

    describe('getCategoryNameByFlagColor', function(){
        it('should return the correct category name', function(){
			const color = Zarafa.common.categories.Util.getCategoryNameByFlagColor(Zarafa.core.mapi.FlagIcon.red);
			expect(color).toEqual('Red');
        });

        it('should return the correct category name for a merged category', function(){
			const color = Zarafa.common.categories.Util.getCategoryNameByFlagColor(Zarafa.core.mapi.FlagIcon.yellow);
			// Note: Yellow is merged to Orange here.
			expect(color).toEqual('Orange');
        });
	});

    describe('getCategoryColor', function(){
        it('should return the correct color for an existing category', function(){
			const color = Zarafa.common.categories.Util.getCategoryColor('Red');
			expect(color).toEqual('#e40023');
        });

        it('should return the correct color for a merged category', function(){
			const color = Zarafa.common.categories.Util.getCategoryColor("Orange");
			// Note: Yellow is merged to Orange here.
			expect(color).toEqual('#f99406');
        });

        it('should return the default color for an unknown category', function(){
			const color = Zarafa.common.categories.Util.getCategoryColor("Some random category");
			expect(color).toEqual(Zarafa.common.categories.Util.defaultCategoryColor);
        });
	});

    describe('getCategoryFromHtmlEncoded', function(){
        it('should return the correct category for an htmlEncoded category', function(){
            const records = createRecords(1);
			Zarafa.common.categories.Util.addCategory(records, 'Black & Blue');
			const category = Zarafa.common.categories.Util.getCategoryFromHtmlEncoded(Ext.util.Format.htmlEncode('Black & Blue'), records);
			expect(category).toEqual('Black & Blue');
        });
	});

    describe('updateStoresAfterCategoryUpdate', function(){
		beforeEach( () => {
			// Jasmine has troubles with closures in double describe blocks,
			// so we'll abuse the window object for this
			window.h = { onStoreUpdate : () => {} };
			spyOn(window.h, 'onStoreUpdate');
		});

        it('should make stores with records with categories send an update event', function(){
			const store = new Zarafa.core.data.IPMStore();
			store.on('update', window.h.onStoreUpdate);
            const record = createRecords(1)[0];
			store.add(record);

			Zarafa.common.categories.Util.updateStoresAfterCategoryUpdate();
			expect(window.h.onStoreUpdate).toHaveBeenCalled();
        });
	});
});
