Ext.namespace('Zarafa.common.categories');

/**
 * @class Zarafa.common.categories.Util
 * @extends Object
 *
 * Collection of common functions to handle categories
 */
Zarafa.common.categories.Util = {
	/**
	 * An instance of the categoryStore class
	 * @property
	 * @type {Zarafa.common.categories.data.CategoriesStore}
	 */
	categoriesStore : null,

	/**
	 * The color that will be used for labels of categories that don't have a color. It is a rbg hex string.
	 * @property
	 * @type {String}
	 */
	defaultCategoryColor : '#BDC3C7',

	/**
	 * The template of the category blocks
	 * @property
	 * @type {Ext.Template/String}
	 */
	categoriesHtmlTemplate :
		'<tpl if="!Ext.isEmpty(values)">' +
			'<tpl for=".">' +
				'<span class="k-category-block {colorClass}" '+
						'<tpl if="!Ext.isEmpty(values.backgroundColor)">style="background-color:{backgroundColor};"</tpl>'+
				'>' +
					'{name}' +
				'</span>' +
			'</tpl>' +
		'</tpl>',

	/**
	 * Will (re)create the {#categoriesStore}, so it will have the latest changes
	 * If any changes are done to the categories, the code that did the change must
	 * call this function!
	 */
	loadCategoriesStore : function()
	{
		this.categoriesStore = new Zarafa.common.categories.data.CategoriesStore();
	},

	/**
	 * Transforms the category property string of a {@link Zarafa.core.data.IPMRecord record}
	 * into an array with strings.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record
	 * @return {String[]} An array of strings, one for each category
	 */
	getCategories : function(record)
	{
		var categories = [];
		if ( !Ext.isEmpty(record.get('categories')) ){
			categories = record.get('categories').replace(/;?\s*$/, '').split('; ');
		}

		// Flags that are not 'follow-up' flags are set before we switched to the new categories/flags and will
		// be shown as categories.
		if ( record.get('flag_status')===Zarafa.core.mapi.FlagStatus.flagged && record.get('flag_request')!=='Follow up' ){
			var flagColor = record.get('flag_icon');
			var flagCategoryName = this.getCategoryNameByFlagColor(flagColor);

			// The flag could already be set as a real category. In that case
			// we will not add it again.
			if ( categories.indexOf(flagCategoryName) === -1 ){
				categories.push(flagCategoryName);
			}
		}

		// Since the new implementation of categories, labels are deprecated and will
		// also be displayed as categories. So if a label was set, we will add it
		// to the categories.
		if ( record.get('label') ) {
			var label = Zarafa.core.mapi.AppointmentLabels.getDisplayName(record.get('label'));
			var index = categories.indexOf(label);
			if ( index > -1 ){
				// The set label is also set as a category. A label will always
				// be added as last category (because that defines the color of
				// an appointment), so we will remove it from the categories first,
				// and then add it as last.
				categories.splice(index, 1);
			}
			categories.push(label);
		}

		// Instantiate the category store only once. If any changes are done to the
		// managed category list, the code that did the change must call {#loadCategoriesStore}!
		if ( !this.categoriesStore ){
			this.loadCategoriesStore();
		}

		// If a category exists in the managed category list we must make sure we will use
		// the name in the list to avoid case sensitivity issues.
		categories = categories.map(function(category){
			var index = this.categoriesStore.findExactCaseInsensitive('category', category);
			if ( index>=0 ){
				return this.categoriesStore.getAt(index).get('category');
			}

			return category;
		}, this);


		return categories;
	},

	/**
	 * Sets the given categories on the given records.
	 *
	 * @param {Zarafa.core.data.IPMRecord[]} records The record(s) on which the
	 * given categories must be set.
	 * @param {String[]} categories An array with the category names that must be
	 * set on the record(s)
	 * @param {Boolean} doSave Set to true to save the records to the backend
	 */
	setCategories : function(records, categories, doSave)
	{
		// Make sure we have a boolean
		doSave = doSave === true;

		var stores = [];

		if ( categories.length>0 ){
			categories = categories.join('; ') + ';';
		} else {
			categories = '';
		}

		Ext.each(records, function(record){
			record.set('categories', categories);
			if ( doSave && record.store && stores.indexOf(record.store)===-1 ){
				stores.push(record.store);
			}
		}, this);

		// Save the changes if requested
		if ( doSave ){
			Ext.each(stores, function(store){
				store.save();
			});
		}
	},

	/**
	 * Adds the given category to all given records. Saves the
	 * records if requested.
	 *
	 * @param {Zarafa.core.data.IPMRecord[]} records The records
	 * to which the category will be added.
	 * @param {String} category The category name that must be
	 * added to the record(s)
	 * @param {Boolean} doSave Set to true to save the records to the backend
	 * @param {Zarafa.core.data.IPMStore} store (optional) store holding
	 * records on which categories apply.
	 */
	addCategory : function(records, category, doSave, store)
	{
		// Make sure we have a boolean
		doSave = doSave === true;

		// Add the category to all records
		Ext.each(records, function(record){
			// when categories context menu is open and mean while
			// if grid gets reload in that case record.store is null.
			// to overcome this problem we again find that record from given store
			// in parameter.
			if(Ext.isEmpty(record.getStore()) && Ext.isDefined(store)) {
				record = store.getById(record.get('entryid'));
			}

			var categories = this.getCategories(record);
			if ( categories.indexOf(category) === -1 ){
				// If the record has a label, we will first remove that
				// (labels have been deprecated since the implementation
				// of the new categories)
				// Note: The getCategories function has already added the flag
				// to the categories
				if ( record.get('label') ){
					record.set('label', 0);
				}

				categories.push(category);
				this.setCategories(record, categories, false);

				if ( doSave ){
					record.save();
				}
			}
		}, this);
	},

	/**
	 * Returns an array with all categories that all the given records have in common.
	 *
	 * @param {Zarafa.core.data.IPMRecord[]} records
	 * @return {String[]} An array of strings, one for each category
	 */
	getCommonCategories : function(records)
	{
		if ( Ext.isEmpty(records) ){
			return [];
		}

		if ( !Ext.isArray(records) ){
			records = [records];
		}

		// We'll start with the categories of the first record, and will then remove
		// any category that isn't set on one of the other records
		var selectedCategories = Zarafa.common.categories.Util.getCategories(records[0]);
		Ext.each(records, function(record, index){
			if ( index === 0 ) {
				return;
			}
			var categories = Zarafa.common.categories.Util.getCategories(record);
			var categoriesToBeRemovedFromSelection = [];
			Ext.each(selectedCategories, function(category) {
				if ( categories.indexOf(category) === -1 ){
					categoriesToBeRemovedFromSelection.push(category);
				}
			}, this);
			Ext.each(categoriesToBeRemovedFromSelection, function(categoryToBeRemovedFromSelection){
				selectedCategories.splice(selectedCategories.indexOf(categoryToBeRemovedFromSelection), 1);
			});
		}, this);

		return selectedCategories;
	},

	/**
	 * Returns an array with all categories that are set on the given records.
	 *
	 * @param {Zarafa.core.data.IPMRecord[]} records
	 * @return {String[]} An array of strings, one for each category
	 */
	getAllCategories : function(records) {
		if ( !Ext.isArray(records) ){
			records = [records];
		}

		var categories = [];
		Ext.each(records, function(record){
			categories = categories.concat(this.getCategories(record));
		}, this);

		return Ext.unique(categories);
	},

	/**
	 * Removes a given category from the given records
	 *
	 * @param {Zarafa.core.data.IPMRecord[]} records The records for which the category
	 * will be removed
	 * @param {String} category The category that will be removed
	 * @param {Boolean} doSave Set to true to save the records to the backend
	 * @param {Zarafa.core.data.IPMStore} store (optional) holding
	 * records on which category going to remove.
	 */
	removeCategory : function(records, category, doSave, store)
	{
		if ( !Ext.isArray(records) ){
			records = [records];
		}

		// Make sure we have a boolean
		doSave = doSave === true;

		Ext.each(records, function(record){
			// when categories context menu is open and mean while
			// if grid gets reload in that case record.store is null.
			// to overcome this problem we again find that record from given store
			// in parameter.
			if(Ext.isEmpty(record.getStore()) && Ext.isDefined(store)) {
				record = store.getById(record.get('entryid'));
			}
			var categories = this.getCategories(record);
			var index = categories.indexOf(category);
			var label = record.get('label') ? Zarafa.core.mapi.AppointmentLabels.getDisplayName(record.get('label')) : '';
			if ( index > -1 ){
				categories.splice(index, 1);
				this.setCategories(record, categories, false);
			}

			// Since the new implementation of categories, flags will be
			// displayed as a category. This means that the category that
			// is being removed could also be a flag!
			// Note that the getCategories method has already added it.
			if ( record.get('flag_status') === Zarafa.core.mapi.FlagStatus.flagged && record.get('flag_request')!=='Follow up' ){
				var flagColor = record.get('flag_icon');
				var flagCategoryName = this.getCategoryNameByFlagColor(flagColor);
				if ( flagCategoryName === category ){
					var flagProperties = Zarafa.common.flags.Util.getFlagBaseProperties();
					Ext.apply(flagProperties, Zarafa.common.flags.Util.getFlagPropertiesNoDate());
					record.beginEdit();
					for ( var property in flagProperties ){
						record.set(property, flagProperties[property]);
					}
					record.endEdit();
				}
			}

			// Since the new implementation of categories, labels will be
			// displayed as a category. This means that the category that
			// is removed could also be a label
			// Note that the getCategories method has already added it!
			if ( label === category ){
				record.set('label', 0);
			}

			var recordModified = record.isModified('categories') || record.isModified('label') || record.isModified('flag_request');
			if ( recordModified && doSave ){
				record.save();
			}
		}, this);
	},

	/**
	 * Matches a flag color to a category name and returns this category name.
	 *
	 * @param {Zarafa.core.mapi.FlagIcon} flagColorIndex The flag color
	 * @return {String} The matching category name
	 */
	getCategoryNameByFlagColor : function(flagColorIndex)
	{
		var settingsModel = container.getPersistentSettingsModel();
		var categories = settingsModel.get('kopano/main/categories', true);
		var retVal = '';
		Ext.iterate(categories, function(category){
			if ( category.standardIndex === flagColorIndex ){
				retVal = category.name;
				return true;
			}
		});

		if (!Ext.isEmpty(flagColorIndex)) {
			var mergedCategory = settingsModel.get('kopano/main/merged_categories/'+flagColorIndex, true);
			if(mergedCategory) {
				retVal = mergedCategory;
			}
		}
		return retVal;
	},

	/**
	 * Returns the color (css) for the given category
	 *
	 * @param {String} category The category name
	 * @return {String} The color of the category (hex code)
	 */
	getCategoryColor : function(category)
	{
		// Instantiate the category store only once. If any changes are done to the
		// categories, the code that did the change must call {#loadCategoriesStore}!
		if ( !this.categoriesStore ){
			this.loadCategoriesStore();
		}

		var catIndex = this.categoriesStore.findExactCaseInsensitive('category', category);
		if ( catIndex > -1 ){
			return this.categoriesStore.getAt(catIndex).get('color');
		}

		return Zarafa.common.categories.Util.defaultCategoryColor;
	},

	/**
	 * Finds the unencoded category name of a record from the
	 * {@link Ext.util.Format.htmlEncode htmlEncoded} category name
	 *
	 * @param {String} encodedCategory The html encoded version of the
	 * category name
	 * @param {Zarafa.core.data.IPMRecord/Zarafa.core.data.IPMRecord[]} records The record(s)
	 * on which the category is set.
	 * @return {String} The unencoded category name
	 */
	getCategoryFromHtmlEncoded : function(encodedCategory, records)
	{
		var categories = this.getAllCategories(records);
		var unencoded = encodedCategory;
		Ext.each(categories, function(category){
			if ( Ext.util.Format.htmlEncode(category) === encodedCategory ){
				unencoded = category;
				return true;
			}
		}, this);

		return unencoded;
	},

	/**
	 * Returns the html of the categories as blocks (as displayed in the grid
	 * and item header)
	 *
	 * @param {String} categories The category name
	 * @return {String} The html of the categories as colored blocks
	 */
	getCategoriesHtml : function(categories)
	{
		// Compile the template string if not done yet
		if (Ext.isString(this.categoriesHtmlTemplate)) {
			this.categoriesHtmlTemplate = new Ext.XTemplate(this.categoriesHtmlTemplate, {
				compiled: true
			});
		}

		var data = categories.map(function(category){
			var dataEntry = {
				name : Ext.util.Format.htmlEncode(category),
				backgroundColor : this.getCategoryColor(category)
			};
			if ( dataEntry.backgroundColor ){
				dataEntry.colorClass = Zarafa.core.ColorSchemes.getLuma(dataEntry.backgroundColor) < 200 ? 'zarafa-dark' : '';
			}

			return dataEntry;
		}, this);

		return this.categoriesHtmlTemplate.apply(data);
	},

	/**
	 * Returns the SVG icon for a category of the given color
	 * @param {String} color The CSS color value of the category
	 * @return {String} The string with the SVG element tag
	 */
	getCategoryIconSVG : function(color)
	{
		return '<svg width="13" height="13">' +
					'<g transform="translate(-333.71338,-339.93452)">' +
						'<path ' +
							'style="color:'+color+';fill:currentColor;fill-opacity:1;stroke:none;stroke-width:1;marker:none;visibility:visible;display:inline;overflow:visible;enable-background:accumulate" ' +
							'd="m 333.71339,346.76581 6.16871,6.16871 6.83128,-6.83128 -0.0914,-6.07732 -6.07732,-0.0914 -6.83128,6.83128 z m 8.86467,-5.02636 c 0.64351,-0.64352 1.68689,-0.64352 2.3304,0 0.64352,0.64351 0.64352,1.68689 0,2.3304 -0.64351,0.64352 -1.68689,0.64352 -2.3304,0 -0.64352,-0.64351 -0.64352,-1.68689 0,-2.3304 z" />' +
					'</g>' +
				'</svg>';
	},

	/**
	 * Will check all registered {@link Zarafa.core.data.IPMStore IPMStores} and send 'fake' update events
	 * to all records that have categories set. This will make sure that the views are updated.
	 */
	updateStoresAfterCategoryUpdate : function()
	{
		var IPMStores = Zarafa.core.data.IPMStoreMgr.IPMStores;

		IPMStores.each(function(store){
			store.each(function(record){
				// If record has categories as well as flag_status is to flagged and
				// flag_request is not equal to 'Follow up' then update that record
				// in store.
				if ( !Ext.isEmpty(record.get('categories')) ||
					(record.get('flag_status') === Zarafa.core.mapi.FlagStatus.flagged &&
						record.get('flag_request') !== 'Follow up')){
					store.fireEvent('update', store, record, Ext.data.Record.COMMIT);
				}
			}, this);

		}, this);
	}
};
