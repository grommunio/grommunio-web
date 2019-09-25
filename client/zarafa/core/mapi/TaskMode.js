Ext.namespace('Zarafa.core.mapi');

/**
 * @class Zarafa.core.mapi.TaskMode
 * @extends Zarafa.core.Enum
 * 
 * @singleton
 */
Zarafa.core.mapi.TaskMode = Zarafa.core.Enum.create({

	/**
	 * Denotes that the task is not assigned.
	 * @property
	 * @type Number
	 */
	'NOTHING' : 0,
	/**
	 * Denotes that the task is embedded in a message.
	 * @property
	 * @type Number
	 */
	'REQUEST' : 1,
	/**
	 * Denotes that the task has been accepted by assignee.
	 * @property
	 * @type Number
	 */
	'ACCEPT' : 2,
	/**
	 * Denotes that the task has been rejected by assignee
	 * @property
	 * @type Number
	 */
	'DECLINE' : 3,
	/**
	 * Denotes that the task is embedded in task update.
	 * @property
	 * @type Number
	 */
	'UPDATE' : 4,
	/**
	 * Denotes that the task has been assigned to self
	 * @property
	 * @type Number
	 */
	'SELF' : 5
});

