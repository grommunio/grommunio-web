Ext.namespace('Zarafa.plugins.files.data');

/**
 * @class Zarafa.plugins.files.data.Views
 * @extends Zarafa.core.Enum
 *
 * Enum containing the different views of the files context.
 *
 * @singleton
 */
Zarafa.plugins.files.data.Views = Zarafa.core.Enum.create({

	/**
	 * View all files items from the selected folder(s) in the 'list' view.
	 *
	 * @property
	 * @type Number
	 */
	LIST: 0,

	/**
	 * View all files items from the selected folder(s) in the 'icon' view.
	 *
	 * @property
	 * @type Number
	 */
	ICON: 1,

	/**
	 * View all store items in the 'account' view.
	 *
	 * @property
	 * @type Number
	 */
	ACCOUNT : 2
});
