Ext.namespace('Grommunio.task.data');

/**
 * @class Grommunio.task.data.ViewModes
 * @extends Grommunio.core.Enum
 *
 * Enum containing the different viewing modes of the task context.
 *
 * @singleton
 */
Grommunio.task.data.ViewModes = Grommunio.core.Enum.create({
	/**
	 * View all task items from the selected folder(s)) with some limited columns.
	 *
	 * @property
	 * @type Number
	 */
	SIMPLE: 0,
	/**
	 * View all found task items from the selected folder(s).
	 *
	 * @property
	 * @type Number
	 */
	SEARCH: 1,
	/**
	 * View all task items from the selected folder(s) with all default columns, user may
	 * show/hide columns, if required.
	 *
	 * @property
	 * @type Number
	 */
	DETAILED: 2
});
