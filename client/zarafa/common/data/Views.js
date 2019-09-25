Ext.namespace('Zarafa.common.data');

/**
 * @class Zarafa.common.data
 * @extends Zarafa.core.Enum
 *
 * Enum containing the different views of the context. 
 * 
 * @singleton
 */
Zarafa.common.data.Views = Zarafa.core.Enum.create({
	/**
	 * View all context items from the selected folder(s) in the 'list' view.
	 *
	 * @property
	 * @type Number
	 */
	LIST : 0,

	/**
	 * View all found search items from the folder(s) in the 'list' view.
	 *
	 * @property
	 * @type Number
	 */
	SEARCH : 1,

	/**
	 * View all updated batch of context items from the selected folder(s) in the 'list' view.
	 * 
	 * @property
	 * @type Number
	 */
	LIVESCROLL : 2
});
