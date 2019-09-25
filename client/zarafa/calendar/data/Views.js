Ext.namespace('Zarafa.calendar.data');

/**
 * @class Zarafa.calendar.data.Views
 * @extends Zarafa.core.Enum
 *
 * Enum containing the different views of the calendar context. 
 * 
 * @singleton
 */
Zarafa.calendar.data.Views = Zarafa.core.Enum.create({
	/**
	 * View all appointments for a given day(s) from the selected folder(s)
	 * inside blocks view.
	 *
	 * @property
	 * @type Number
	 */
	BLOCKS : 0,
	/**
	 * View all appointments for a given day(s) from the selected folder(s)
	 * inside the grid view.
	 *
	 * @property
	 * @type Number
	 */
	LIST : 1,
	/**
	 * View all found appointments in the selected folder(s)
	 * inside the grid view.
	 *
	 * @property
	 * @type Number
	 */
	SEARCH : 2
});
