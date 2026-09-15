/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.categories.data');
/**
 * @class Grommunio.common.categories.data.CategoriesStore
 * @extends Ext.data.ArrayStore
 * @xtype grommunio.categoriesstore
 *
 * Store which will get the records from setting and insertion
 * points which has user-defined categories.
 */
Grommunio.common.categories.data.CategoriesStore = Ext.extend(Ext.data.ArrayStore, {
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
	settingsKey: 'grommunio/main/categories',

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};
		var categories = [];

		// Source the categories from, in order: an explicit categoriesData array,
		// the per-mailbox list for config.storeEntryId (the Outlook-compatible
		// list in that mailbox), or the per-user WebApp settings. The admin
		// additional categories and insertion points below are applied on top.
		var storedCategories = config.categoriesData;
		if ( !storedCategories && config.storeEntryId && Grommunio.common.categories.CategoryListManager ) {
			storedCategories = Grommunio.common.categories.CategoryListManager.getCategoriesData(config.storeEntryId);
			if ( storedCategories === null ) {
				// That mailbox's list is not loaded: fall back to the per-user
				// list AND edit that one. Keeping the per-mailbox save target
				// would overwrite the mailbox's real list with the fallback.
				delete config.storeEntryId;
			}
		}
		if ( !storedCategories ) {
			storedCategories = container.getPersistentSettingsModel().get(this.settingsKey);
		}
		delete config.categoriesData;
		if ( storedCategories ) {
			categories = categories.concat(storedCategories);
		}
		categories = categories.concat(container.populateInsertionPoint('main.categories'));

		// Add additional categories defined by the admin. They are already defined by the default
		// persistent settings, but the user might have removed/changed them and since KW-2841 we
		// always want to have those categories available
		var additionalCategories = container.getServerConfig().getAdditionalDefaultCategories() || [];
		var newAdditionalCategories = additionalCategories.filter(function(category) {
			return !categories.some(function(c) {
				return c.name === category.name;
			});
		});

		// Remove stored additional categories that are not present in the configured additional categories
		categories = categories.filter(function(category) {
			return !category.additional ||
					additionalCategories.some(function(additionalCategory) {
						return additionalCategory.name === category.name;
					});
		});

		// Add new additional categories
		categories = categories.concat(newAdditionalCategories);

		categories = categories.filter(function(category){
							return Ext.isObject(category);
						}).map(function(category){
							return [
								category.name,
								category.color,
								category.standardIndex,
								additionalCategories.some(function(c) { return c.name === category.name; }),
								category.quickAccess===true,
								Ext.isDefined(category.sortIndex) ? category.sortIndex : 100000,
								true,
								category.used,
								category.guid
							];
						});

		Ext.applyIf(config, {
			fields: ['category', 'color', 'standardIndex', 'additional', 'quickAccess', 'sortIndex', 'stored', 'used', 'guid'],
			data: categories
		});

		Ext.apply(this, config);

		Grommunio.common.categories.data.CategoriesStore.superclass.constructor.call(this, config);
	},

	/**
	 * Will add the categories that are set on the passed records and that do not yet exist
	 * in this store to this store.
	 * @param {Grommunio.core.data.MAPIRecord} mapiRecords The records of which the categories
	 * will be added to this store.
	 */
	addCategoriesFromMapiRecords: function(mapiRecords)
	{
		var categories = Grommunio.common.categories.Util.getAllCategories(mapiRecords);
		categories.forEach(function(category){
			if ( this.findExactCaseInsensitive('category', category) === -1 ){
				// Add the category to the store
				this.add(new this.recordType({
					category: category,
					color: Grommunio.common.categories.Util.defaultCategoryColor,
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
	addCategory: function(category, color, quickAccess)
	{
		this.add(new this.recordType({
			category: category,
			color: color ? '#'+color : Grommunio.common.categories.Util.defaultCategoryColor,
			quickAccess: !!quickAccess,
			stored: true
		}));
	},

	/**
	 * Saves the categories in the store. For a per-mailbox store (one created
	 * with a storeEntryId) the whole list is written to that mailbox's master
	 * category list via {@link Grommunio.common.categories.CategoryListManager};
	 * otherwise it is saved to the per-user WebApp settings.
	 */
	save: function()
	{
		// Only save categories that were already stored before, or that have
		// been pinned or were given a color by the user. One-off categories
		// merely present on the selected records stay out of the list.
		var persistable = this.getRange().filter(function(categoryRecord){
			return 	categoryRecord.get('stored') ||
					categoryRecord.get('quickAccess') ||
					categoryRecord.get('color')!==Grommunio.common.categories.Util.defaultCategoryColor;
		});

		if ( this.storeEntryId && Grommunio.common.categories.CategoryListManager ) {
			var mailboxCategories = persistable.map(function(categoryRecord){
				return {
					name: categoryRecord.get('category'),
					color: categoryRecord.get('color'),
					standardIndex: categoryRecord.get('standardIndex'),
					quickAccess: categoryRecord.get('quickAccess'),
					sortIndex: categoryRecord.get('sortIndex'),
					used: categoryRecord.get('used'),
					guid: categoryRecord.get('guid')
				};
			});
			Grommunio.common.categories.CategoryListManager.save(this.storeEntryId, mailboxCategories);
			return;
		}

		var categories = persistable.map(function(categoryRecord){
			return {
				name: categoryRecord.get('category'),
				color: categoryRecord.get('color'),
				standardIndex: categoryRecord.get('standardIndex'),
				quickAccess: categoryRecord.get('quickAccess'),
				sortIndex: categoryRecord.get('sortIndex'),
				used: categoryRecord.get('used'),
				additional: categoryRecord.get('additional')
			};
		});

		container.getPersistentSettingsModel().set(this.settingsKey, categories, true);
	},

	/**
	 * Finds the index of the first matching Record in this store by a specific field value.
	 * Matches case-insensitive.
	 * @param {String} fieldName The field that should be used to match the record
	 * @param {String} value The value that should be used to match the records
	 *
	 * @return {Number} The index of the first matching record or -1 if no match was found
	 */
	findExactCaseInsensitive: function(fieldName, value)
	{
		return this.findBy(function(category, index){
			return category.get(fieldName).toLowerCase() === value.toLowerCase();
		}, this);
	}
});

Ext.reg('grommunio.categoriesstore', Grommunio.common.categories.data.CategoriesStore);
