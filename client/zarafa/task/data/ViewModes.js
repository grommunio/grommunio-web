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
	 * View all task items from the selected folder(s) without grouping.
	 *
	 * @property
	 * @type Number
	 */
	NORMAL : 0,
	/**
	 * View all found task items from the selected folder(s).
	 *
	 * @property
	 * @type Number
	 */
	SEARCH : 1
});
