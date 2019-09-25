Ext.namespace('Zarafa.calendar.data');

/**
 * @class Zarafa.calendar.data.ViewModes
 * @extends Zarafa.core.Enum
 *
 * Enum containing the different viewing modes of the calendar context. 
 * 
 * @singleton
 */
Zarafa.calendar.data.ViewModes = Zarafa.core.Enum.create({
	/**
	 * View all appointments for a given day(s) from the selected folder(s)
	 * inside the Days view (every day has its own column).
	 *
	 * @property
	 * @type Number
	 */
	DAYS : 0,
	/**
	 * View all appointments for a given day(s) from the selected folder(s)
	 * inside the Box view (every day is a Box within a table).
	 *
	 * @property
	 * @type Number
	 */
	BOX : 1,
	/**
	 * View all appointments for a given period in a simple list.
	 * @property
	 * @type Number
	 */
	LIST : 2,
	/**
	 * View the search results for the appointments in a simple list.
	 * @property
	 * @type Number
	 */
	SEARCH : 3
});
