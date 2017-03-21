Ext.namespace('Zarafa.core.mapi');

/**
 * @class Zarafa.core.mapi.TaskOwnership
 * @extends Zarafa.core.Enum
 * @singleton
 *
 * The TaskOwnership property indicates the role of the current user relative to the Task object.
 */
Zarafa.core.mapi.TaskOwnership = Zarafa.core.Enum.create({
	/**
	 * Denotes that the task object is not assigned.
	 * @property
	 * @type Number
	 */
	'NEWTASK' : 0,

	/**
	 * Denotes that the task object is the task assigner's copy of the Task object.
	 * @property
	 * @type Number
	 */
	'DELEGATEDTASK' : 1,

	/**
	 * Denotes that the task object is the task assignee's copy of the Task object.
	 * @property
	 * @type Number
	 */
	'OWNTASK' : 2
});

