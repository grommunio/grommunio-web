describe('CategoriesStore', function() {
	window.persistentsettings = {
		kopano : {
			main : {
				categories : [{
					'name' : _('Red'),
					'color' : '#e40023',
					'standardIndex' : 6,
					'quickAccess' : true,
					'sortIndex' : 0,
					'used' : false
				}]
			}
		}
	};
	var categoriesStore;

	beforeEach(function() {
		container = new Zarafa.core.Container();
		container.setServerConfig({});
	});

	afterEach(function() {
		categoriesStore.destroy();
	});

	it('No categories by default', function() {
		categoriesStore = new Zarafa.common.categories.data.CategoriesStore();
		expect(categoriesStore.findExactCaseInsensitive('category', 'red')).toEqual(-1);
	});

	it('can load persistentsettings', function() {
		container.getPersistentSettingsModel().initialize(window.persistentsettings);
		categoriesStore = new Zarafa.common.categories.data.CategoriesStore();
		expect(categoriesStore.findExactCaseInsensitive('category', 'red')).not.toEqual(-1);
	});

	it('can add category', function() {
		categoriesStore = new Zarafa.common.categories.data.CategoriesStore();
		categoriesStore.addCategory('black', '#fffff', false);
		expect(categoriesStore.findExactCaseInsensitive('category', 'black')).not.toEqual(-1);
	});
});
