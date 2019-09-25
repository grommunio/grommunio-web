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
	ALL : 0
});
