Ext.namespace('Zarafa.advancesearch.data');

/**
 * @class Zarafa.advancesearch.data.SearchComboBoxFieldsFlags
 * @extends Zarafa.core.Enum
 *
 * Enum containing the different folder flag, whether it is current selected folder in
 * hierarchy, IPM_SUBTREE or folder added explicitly in search ComboBox.
 *
 * @singleton
 */
Zarafa.advancesearch.data.SearchComboBoxFieldsFlags = Zarafa.core.Enum.create({
	/**
	 * Indicate that folder is IPM_SUBTREE
	 *
	 * @property
	 * @type Number
	 */
	ALL_FOLDERS : 0,

	/**
	 * Indicate that folder is currently selected in hierarchy.
	 *
	 * @property
	 * @type Number
	 */
	CURRENT_SELECTED_FOLDER : 1,

	/**
	 * Indicate that folder is added in search combo box using 'Other...' option in search combo box.
	 *
	 * @property
	 * @type Number
	 */
	IMPORTED_FOLDER : 2
});
