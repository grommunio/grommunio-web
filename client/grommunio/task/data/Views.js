Ext.namespace('Grommunio.task.data');

/**
 * @class Grommunio.task.data.Views
 * @extends Grommunio.core.Enum
 *
 * Enum containing the different views of the task context.
 *
 * @singleton
 */
Grommunio.task.data.Views = Grommunio.core.Enum.create({
	/**
	 * View all task items from the selected folder(s) in the 'list' view.
	 *
	 * @property
	 * @type Number
	 */
	LIST: 0,
	/**
	 * View all found task items from the selected folder(s).
	 *
	 * @property
	 * @type Number
	 */
	SEARCH: 1
});
