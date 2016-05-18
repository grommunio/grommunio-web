Ext.namespace('Zarafa.task.data');

/**
 * @class Zarafa.task.data.Views
 * @extends Zarafa.core.Enum
 *
 * Enum containing the different views of the task context. 
 * 
 * @singleton
 */
Zarafa.task.data.Views = Zarafa.core.Enum.create({
	/**
	 * View all task items from the selected folder(s) in the 'list' view.
	 *
	 * @property
	 * @type Number
	 */
	LIST : 0,
	/**
	 * View all found task items from the selected folder(s).
	 *
	 * @property
	 * @type Number
	 */
	SEARCH : 1
});
