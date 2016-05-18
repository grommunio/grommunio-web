Ext.namespace('Zarafa.note.data');

/**
 * @class Zarafa.note.data.DataModes
 * @extends Zarafa.core.Enum
 *
 * Enum containing the different data modes of the note context. 
 * 
 * @singleton
 */
Zarafa.note.data.DataModes = Zarafa.core.Enum.create({
	/**
	 * View all note items from the selected folder(s).
	 *
	 * @property
	 * @type Number
	 */
	ALL : 0,
	/**
	 * View all note items from the selected folder(s) from last seven days.
	 *
	 * @property
	 * @type Number
	 */
	LAST_7_DAYS : 1,
	/**
	 * View all found note items from the selected folder(s).
	 *
	 * @property
	 * @type Number
	 */
	SEARCH : 2
});
