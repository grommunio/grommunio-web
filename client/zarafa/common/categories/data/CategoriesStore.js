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
	 * The settings key that will be used to read and save the categories
	 * @property
	 * @type {String}
	 * @private
	 */
	settingsKey : 'kopano/main/categories',

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};
		var categories = [];

		categories = categories.concat(container.getPersistentSettingsModel().get(this.settingsKey));
		categories = categories.concat(container.populateInsertionPoint('main.categories'));

		categories = categories
						.filter(function(category){
							return Ext.isObject(category);
						})
						.map(function(category){
							return [
								category.name,
								category.color,
								category.standardIndex,
								category.quickAccess===true,
								Ext.isDefined(category.sortIndex) ? category.sortIndex : 100000,
								true,
								category.used
							];
						});

		Ext.applyIf(config, {
			fields : ['category', 'color', 'standardIndex', 'quickAccess', 'sortIndex', 'stored', 'used'],
			data: categories
		});

		Ext.apply(this, config);

		Zarafa.common.categories.data.CategoriesStore.superclass.constructor.call(this, config);
	},

	/**
	 * Will add the categories that are set on the passed records and that do not yet exist
	 * in this store to this store.
	 * @param {Zarafa.core.data.MAPIRecord} mapiRecords The records of which the categories
	 * will be added to this store.
	 */
	addCategoriesFromMapiRecords : function(mapiRecords)
	{
		var categories = Zarafa.common.categories.Util.getAllCategories(mapiRecords);
		categories.forEach(function(category){
			if ( this.findExactCaseInsensitive('category', category) === -1 ){
				// Add the category to the store
				this.add(new this.recordType({
					category: category,
					color: Zarafa.common.categories.Util.defaultCategoryColor,
					sortIndex: 100000,
					stored: false
				}));
			}
		}, this);
	},

	/**
	 * Adds a category to the store.
	 * @param {String} category The name of the category
	 * @param {String} color The color of the category in RGB Hex format
	 * @param {Boolean} quickAccess True if the category should be a 'pinned' category
	 */
	addCategory : function(category, color, quickAccess)
	{
		this.add(new this.recordType({
			category: category,
			color: color ? '#'+color : Zarafa.common.categories.Util.defaultCategoryColor,
			quickAccess: !!quickAccess,
			stored: true
		}));
	},

	/**
	 * Saves the categories in the store into the settings of the user
	 */
	save : function()
	{
		var categories = this.getRange().filter(function(categoryRecord){
			// Only save categories that were already stored before,
			// or that have been pinned or were given a color by the user
			return 	categoryRecord.get('stored') ||
					categoryRecord.get('quickAccess') ||
					categoryRecord.get('color')!==Zarafa.common.categories.Util.defaultCategoryColor;
		}).map(function(categoryRecord){
			return {
				name: categoryRecord.get('category'),
				color: categoryRecord.get('color'),
				standardIndex: categoryRecord.get('standardIndex'),
				quickAccess: categoryRecord.get('quickAccess'),
				sortIndex: categoryRecord.get('sortIndex'),
				used: categoryRecord.get('used')
			};
		});

		container.getPersistentSettingsModel().set(this.settingsKey, categories);
	},

	/**
	 * Finds the index of the first matching Record in this store by a specific field value.
	 * Matches case-insensitive.
	 * @param {String} fieldName The field that should be used to match the record
	 * @param {String} value The value that should be used to match the records
	 *
	 * @return {Number} The index of the first matching record or -1 if no match was found
	 */
	findExactCaseInsensitive : function(fieldName, value)
	{
		return this.findBy(function(category, index){
			return category.get(fieldName).toLowerCase() === value.toLowerCase();
		}, this);
	}
});

Ext.reg('zarafa.categoriesstore', Zarafa.common.categories.data.CategoriesStore);
