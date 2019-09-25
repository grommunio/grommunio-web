Ext.namespace('Zarafa.note.data');

/**
 * @class Zarafa.note.data.Views
 * @extends Zarafa.core.Enum
 *
 * Enum containing the different views of the note context. 
 * 
 * @singleton
 */
Zarafa.note.data.Views = Zarafa.core.Enum.create({
	/**
	 * View all note items from the selected folder(s) in the 'list' view.
	 *
	 * @property
	 * @type Number
	 */
	LIST : 0,
	/**
	 * View all note items from the selected folder(s) in the 'icon' view.
	 *
	 * @property
	 * @type Number
	 */
	ICON : 1,
	/**
	 * View all found note items from the selected folder(s) in the 'list' view.
	 *
	 * @property
	 * @type Number
	 */
	SEARCH : 2
});
