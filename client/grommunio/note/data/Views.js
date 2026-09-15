Ext.namespace('Grommunio.note.data');

/**
 * @class Grommunio.note.data.Views
 * @extends Grommunio.core.Enum
 *
 * Enum containing the different views of the note context.
 *
 * @singleton
 */
Grommunio.note.data.Views = Grommunio.core.Enum.create({
	/**
	 * View all note items from the selected folder(s) in the 'list' view.
	 *
	 * @property
	 * @type Number
	 */
	LIST: 0,
	/**
	 * View all note items from the selected folder(s) in the 'icon' view.
	 *
	 * @property
	 * @type Number
	 */
	ICON: 1,
	/**
	 * View all found note items from the selected folder(s) in the 'list' view.
	 *
	 * @property
	 * @type Number
	 */
	SEARCH: 2
});
