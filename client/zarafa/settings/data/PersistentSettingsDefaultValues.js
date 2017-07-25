Ext.namespace('Zarafa.settings.data');

/**
 * @class Zarafa.settings.data.PersistentSettingsDefaultValue
 * Singleton holding the default settings array for the entire client
 * @singleton
 */
Zarafa.settings.data.PersistentSettingsDefaultValue = function(){
	return {
		/**
		 * Gets the array of default values for the persistent settings
		 * @public
		 * @return {Array} The array of default values for the persistent settings
		 */
		getDefaultValues : function() {
			// Default categories are defined in the config.php/defaults.php. After the first change they will be
			// stored in the persistent settings of the user.
			var defaultCategories = container.getServerConfig().getDefaultCategories();
			var additionalDefaultCategories = container.getServerConfig().getAdditionalDefaultCategories();
			if ( Array.isArray(additionalDefaultCategories) ){
				defaultCategories = defaultCategories.concat(additionalDefaultCategories);
			}

			return {
				'kopano' : {
					'main' : {
						/**
						 * kopano/main/merged_categories
						 * merged_categories object holds new name of standard category
						 * followed by standard category index.
						 * e.g. {6:VIP,..} where 6 is standard_index of Red category.
						 * @property
						 * @type Object
						 */
						'merged_categories' : {},

						/**
						 * kopano/main/categories
						 * @property
						 * @type String[]
						 */
						'categories' : defaultCategories
					}
				}
			};
		}
	};
}();
