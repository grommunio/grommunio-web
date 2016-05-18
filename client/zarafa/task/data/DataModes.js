Ext.namespace('Zarafa.task.data');

/**
 * @class Zarafa.task.data.DataModes
 * @extends Zarafa.core.Enum
 *
 * Enum containing the different data modes of the task context. 
 * 
 * @singleton
 */
Zarafa.task.data.DataModes = Zarafa.core.Enum.create({
	/**
	 * List all task items from the selected folder(s).
	 *
	 * @property
	 * @type Number
	 */
	ALL : 0,
	/**
	 * List all task items from the selected folder(s) which are not completed.
	 * @property
	 * @type Number
	 */
	ACTIVE : 1,
	/**
	 * List all task items from the selected folder(s) from next seven days.
	 *
	 * @property
	 * @type Number
	 */
	NEXT_7_DAYS : 2,
	/**
	 * List all task items from the selected folder(s) which are overdue.
	 *
	 * @property
	 * @type Number
	 */
	OVERDUE : 3,
	/**
	 * List all task items from the selected folder(s) which are completed.
	 *
	 * @property
	 * @type Number
	 */
	COMPLETED : 4,
	/**
	 * List all found task items from the selected folder(s).
	 *
	 * @property
	 * @type Number
	 */
	SEARCH : 5
});
