Ext.namespace('Zarafa.common.categories.data');
/**
 * @class Zarafa.common.categories.data.CategoriesStore
 * @extends Ext.data.ArrayStore
 * @xtype zarafa.categoriesstore
 * 
 * Store which will get the records from setting and insertion 
 * points which has user-defined categories.
 */
Zarafa.common.categories.data.CategoriesStore = Ext.extend(Ext.data.ArrayStore, {
	// Insertion points for this class
	/**
	 * @insert main.categories
	 * can be used to add extra user-defined categories by 3rd party plugins
	 */
	
	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};	
		var categories = [];

		categories = categories.concat(container.getSettingsModel().get('zarafa/v1/main/categories'));
		categories = categories.concat(container.populateInsertionPoint('main.categories'));
		
		for (var i = 0; i < categories.length; i++) {
			if (!Ext.isArray(categories[i])) {
				categories[i] = [ categories[i] ];
			}
		}
		
		Ext.applyIf(config, {
			fields : ['category'],
			data: categories
		});
		
		Ext.apply(this, config);
		
		Zarafa.common.categories.data.CategoriesStore.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.categoriesstore', Zarafa.common.categories.data.CategoriesStore);
