Ext.namespace('Zarafa.task.data');

/**
 * @class Zarafa.task.data.ViewModes
 * @extends Zarafa.core.Enum
 *
 * Enum containing the different viewing modes of the task context. 
 * 
 * @singleton
 */
Zarafa.task.data.ViewModes = Zarafa.core.Enum.create({
	/**
	 * View all task items from the selected folder(s)) with some limited columns.
	 *
	 * @property
	 * @type Number
	 */
	SIMPLE : 0,
	/**
	 * View all found task items from the selected folder(s).
	 *
	 * @property
	 * @type Number
	 */
	SEARCH : 1,
	/**
	 * View all task items from the selected folder(s) with all default columns, user may
	 * show/hide columns, if required.
	 *
	 * @property
	 * @type Number
	 */
	DETAILED : 2
});
