Ext.namespace('Zarafa.advancesearch.data');
/**
 * @class Zarafa.advancesearch.data.SearchCategoriesStore
 * @extends Ext.data.ArrayStore
 * @xtype zarafa.searchcategoriesstore
 *
 * Store which will bind with category filter
 * and manage categories which is added in category filter.
 */
Zarafa.advancesearch.data.SearchCategoriesStore = Ext.extend(Ext.data.ArrayStore, {

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor: function (config)
	{
		config = config || {};

		Ext.applyIf(config, {
			fields: ['name', 'backgroundColor', 'colorClass'],
			autoDestroy: true
		});

		Ext.apply(this, config);

		Zarafa.advancesearch.data.SearchCategoriesStore.superclass.constructor.call(this, config);
	},

	/**
	 * Helper function which is use to add categories in to this store.
	 * @param {Array} categories list of categories which will add in category filter.
	 */
	addCategories: function (categories)
	{
		categories.forEach(function (category) {
			if (this.findExactCaseInsensitive('name', category) === -1) {
				// Add the category to the store
				var backgroundColor = Zarafa.common.categories.Util.getCategoryColor(category);
				this.add(new this.recordType({
					name: category,
					backgroundColor: Zarafa.common.categories.Util.getCategoryColor(category),
					colorClass: Zarafa.core.ColorSchemes.getLuma(backgroundColor) < 200 ? 'zarafa-dark' : ''
				}));
			}
		}, this);
	},

	/**
	 * Helper function which is use to remove categories from this store.
	 * @param {Array} categories list of categories which will remove from category filter.
	 */
	removeCategories: function (categories)
	{
		categories.forEach(function (category) {
			this.removeAt(this.findExactCaseInsensitive('name', category));
		}, this);
	},

	/**
	 * Finds the index of the first matching Record in this store by a specific field value.
	 * Matches case-insensitive.
	 * @param {String} fieldName The field that should be used to match the record
	 * @param {String} value The value that should be used to match the records
	 *
	 * @return {Number} The index of the first matching record or -1 if no match was found
	 */
	findExactCaseInsensitive: function (fieldName, value)
	{
		return this.findBy(function (category, index) {
			return category.get(fieldName).toLowerCase() === value.toLowerCase();
		}, this);
	},

	/**
	 * Helper function which is use to get list of categories.
	 * @returns {Array} list of categories which is added in category filter.
	 */
	getCategories: function ()
	{
		var categories = [];
		this.each(function (record) {
			categories.push(record.get('name'));
		});
		return categories;
	}
});

Ext.reg('zarafa.searchcategoriesstore', Zarafa.advancesearch.data.SearchCategoriesStore);
