Ext.namespace('Zarafa.core.mapi');

/**
 * @class Zarafa.core.mapi.TaskHistory
 * @extends Zarafa.core.Enum
 * @singleton
 *
 * The task history property indicates the type of change that was last made to the Task object.
 * When the value of this property is set, the task last update property MUST also be set to
 * the current time.
 */
Zarafa.core.mapi.TaskHistory = Zarafa.core.Enum.create({
	/**
	 * Denotes that No changes were made in task.
	 * @property
	 * @type Number
	 */
	'NONE' : 0,

	/**
	 * Denotes the task assignee accepted this Task object.
	 * @property
	 * @type Number
	 */
	'ACCEPTED' : 1,

	/**
	 * Denotes the task assignee rejected this Task object.
	 *  @property
	 * @type Number
	 */
	'DECLINED' : 2,

	/**
	 * Denotes that the another property was changed in task object.
	 * @property
	 * @type Number
	 */
	'UPDATED' : 3,

	/**
	 * Denotes that the task due date property changed.
	 * @property
	 * @type Number
	 */
	'DUEDATECHANGED' : 4,

	/**
	 * Denotes the Task object has been assigned to a task assignee.
	 * @property
	 * @type Number
	 */
	'ASSIGNED' : 5
});
