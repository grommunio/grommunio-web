Ext.namespace('Zarafa.note.data');

/**
 * @class Zarafa.note.data.ViewModes
 * @extends Zarafa.core.Enum
 *
 * Enum containing the different viewing modes of the note context. 
 * 
 * @singleton
 */
Zarafa.note.data.ViewModes = Zarafa.core.Enum.create({
	/**
	 * View all note items from the selected folder(s) without grouping.
	 *
	 * @property
	 * @type Number
	 */
	NORMAL : 0,
	/**
	 * View all note items from the selected folder(s) grouped by category.
	 *
	 * @property
	 * @type Number
	 */
	GROUP_CATEGORY : 1,
	/**
	 * View all note items from the selected folder(s) grouped by color.
	 * in the 'grid' view.
	 *
	 * @property
	 * @type Number
	 */
	GROUP_COLOR : 2,
	/**
	 * View all found note items from the selected folder(s).
	 *
	 * @property
	 * @type Number
	 */
	SEARCH : 3
});
