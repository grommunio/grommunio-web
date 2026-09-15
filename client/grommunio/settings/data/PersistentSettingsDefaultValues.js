/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.settings.data');

/**
 * @class Grommunio.settings.data.PersistentSettingsDefaultValue
 * Singleton holding the default settings array for the entire client
 * @singleton
 */
Grommunio.settings.data.PersistentSettingsDefaultValue = function(){
	return {
		/**
		 * Gets the array of default values for the persistent settings
		 * @public
		 * @return {Array} The array of default values for the persistent settings
		 */
		getDefaultValues: function() {
			// Default categories are defined in the config.php/defaults.php. After the first change they will be
			// stored in the persistent settings of the user.
			var defaultCategories = container.getServerConfig().getDefaultCategories();
			var additionalDefaultCategories = container.getServerConfig().getAdditionalDefaultCategories();
			if ( Array.isArray(additionalDefaultCategories) ){
				defaultCategories = defaultCategories.concat(additionalDefaultCategories);
			}

			return {
				'grommunio': {
					'main': {
						/**
						 * grommunio/main/merged_categories
						 * merged_categories object holds new name of standard category
						 * followed by standard category index.
						 * e.g. {6:VIP,..} where 6 is standard_index of Red category.
						 * @property
						 * @type Object
						 */
						'merged_categories': {},

						/**
						 * grommunio/main/categories
						 * @property
						 * @type String[]
						 */
						'categories': defaultCategories
					}
				}
			};
		}
	};
}();
