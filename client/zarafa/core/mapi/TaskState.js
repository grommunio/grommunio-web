Ext.namespace('Zarafa.core.mapi');

/**
 * @class Zarafa.core.mapi.TaskState
 * @extends Zarafa.core.Enum
 * 
 * @singleton
 */
Zarafa.core.mapi.TaskState = Zarafa.core.Enum.create({

	/**
	 * Denotes that the task is normal.
	 * @property
	 * @type Number
	 */
	'NORMAL' : 0,
	/**
	 * Denotes that a new task is not assigned.
	 * @property
	 * @type Number
	 */
	'OWNER_NEW' : 1,
	/**
	 * Denotes that the task is the assignee copy of an assigned task.
	 * @property
	 * @type Number
	 */
	'OWNER' : 2,
	/**
	 * Denotes that the task is the assigner copy of an assigned task.
	 * @property
	 * @type Number
	 */
	'ACCEPT' : 3,
	/**
	 * Denotes that the task is Assigner version, but assignee has declined.
	 * @property
	 * @type Number
	 */
	'DECLINE' : 4
});

