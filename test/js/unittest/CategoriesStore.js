/*
 * This file contains the unit tests for the Zarafa.common.categories.data.CategoriesStore class.
 * The following methods of the class are tested:
 * - Zarafa.common.categories.data.CategoriesStore.addCategoriesFromMapiRecords
 * - Zarafa.common.categories.data.CategoriesStore.addCategory
 * - Zarafa.common.categories.data.CategoriesStore.save
 * - Zarafa.common.categories.data.CategoriesStore.findExactCaseInsensitive
 *
 * Every method has its own 'describe' block with 'it' specs.
 */
describe('CategoriesStore', function() {
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
                    }]
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

    let categoriesStore;

	beforeEach(function() {
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

	it('can load persistentsettings', function() {
		expect(categoriesStore.findExactCaseInsensitive('category', 'red')).not.toEqual(-1);
	});

    describe('addCategoriesFromMapiRecords', function() {
        it('should add categories from the passed MapiRecords to the store', function(){
            // Don't take the record with the "Red" category
            const records = createRecords(4).slice(1);
            categoriesStore.addCategoriesFromMapiRecords(records);

            expect(categoriesStore.getRange().length).toEqual(4);
        });

        it('should not add existing categories from the passed MapiRecords to the store', function(){
            const records = createRecords(1);
            categoriesStore.addCategoriesFromMapiRecords(records);

            expect(categoriesStore.getRange().length).toEqual(1);
        });

        it('should handle case-sensitivity when adding categories from the passed MapiRecords to the store', function(){
            const records = createRecords(1);
            records[0].set('categories', 'rEd');
            categoriesStore.addCategoriesFromMapiRecords(records);

            expect(categoriesStore.getRange().length).toEqual(1);
        });
    });

    describe('addCategory', function() {
        it('should add a category to the store', function(){
            categoriesStore.addCategory('MyTestCategory', '000000', true);

            expect(categoriesStore.getRange().length).toEqual(2);
            expect(categoriesStore.getAt(1).get('category')).toEqual('MyTestCategory');
            expect(categoriesStore.getAt(1).get('color')).toEqual('#000000');
            expect(categoriesStore.getAt(1).get('quickAccess')).toEqual(true);
            expect(categoriesStore.getAt(1).get('stored')).toEqual(true);
        });

        it('should set default values for color and quickAccess when not given', function(){
            categoriesStore.addCategory('MyTestCategory');
            const defaultColor = Zarafa.common.categories.Util.defaultCategoryColor;

            expect(categoriesStore.getRange().length).toEqual(2);
            expect(categoriesStore.getAt(1).get('category')).toEqual('MyTestCategory');
            expect(categoriesStore.getAt(1).get('color')).toEqual(defaultColor);
            expect(categoriesStore.getAt(1).get('quickAccess')).toEqual(false);
        });
    });

    describe('save', function() {
        it('should save categories into the persistent settings', function(){
            categoriesStore.addCategory('MyTestCategory', '000000', true);
            categoriesStore.save();
            const categories = container.getPersistentSettingsModel().get('kopano/main/categories');

            expect(categories.length).toEqual(2);
            expect(categories[1].name).toEqual('MyTestCategory');
            expect(categories[1].color).toEqual('#000000');
            expect(categories[1].quickAccess).toEqual(true);
        });

        it('should not save categories into the persistent settings that were not stored before and do not have quickAccess', function(){
            const records = createRecords(3);
            categoriesStore.addCategoriesFromMapiRecords(records);
            categoriesStore.save();
            const categories = container.getPersistentSettingsModel().get('kopano/main/categories');

            expect(categories.length).toEqual(1);
        });
    });

    describe('findExactCaseInsensitive', function() {
        it('should find a match for categories with the same name', function(){
            const records = createRecords(5);
            categoriesStore.addCategoriesFromMapiRecords(records);

            expect(categoriesStore.findExactCaseInsensitive('category', 'Blue')).toEqual(1);
        });

        it('should find a match for categories with the same name but different case', function(){
            const records = createRecords(5);
            categoriesStore.addCategoriesFromMapiRecords(records);

            expect(categoriesStore.findExactCaseInsensitive('category', 'bLuE')).toEqual(1);
        });

        it('should return -1 when a matching category is not found', function(){
            const records = createRecords(5);
            categoriesStore.addCategoriesFromMapiRecords(records);

            expect(categoriesStore.findExactCaseInsensitive('category', 'Some random string')).toEqual(-1);
        });
    });
});
