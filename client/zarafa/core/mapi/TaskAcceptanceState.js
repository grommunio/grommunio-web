Ext.namespace('Zarafa.core.mapi');

/**
 * @class Zarafa.core.mapi.TaskAcceptanceState
 * @extends Zarafa.core.Enum
 * @singleton
 *
 * The TaskAcceptanceState property indicates the acceptance state of the task.
 */
Zarafa.core.mapi.TaskAcceptanceState = Zarafa.core.Enum.create({
	/**
	 * Denotes that the task object is not assigned.
	 * @property
	 * @type Number
	 */
	'NOT_DELEGATED' : 0 ,

	/**
	 * Denotes that the Task object's acceptance status is unknown.
	 * @property
	 * @type Number
	 */
	'DELEGATION_UNKNOWN' : 1,

	/**
	 * Denotes that the task assignee has accepted the Task object.
	 * This value is set when the client processes a task acceptance.
	 * @property
	 * @type Number
	 */
	'DELEGATION_ACCEPTED' : 2,

	/**
	 * Denotes that The task assignee has rejected the Task object.
	 * This value is set when the client processes a task rejection.
	 * @property
	 * @type Number
	 */
	'DELEGATION_DECLINED' : 3
});
