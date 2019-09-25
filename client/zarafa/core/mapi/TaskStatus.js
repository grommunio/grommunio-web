Ext.namespace('Zarafa.core.mapi');

/**
 * @class Zarafa.core.mapi.TaskStatus
 * @extends Zarafa.core.Enum
 * 
 * @singleton
 */
Zarafa.core.mapi.TaskStatus = Zarafa.core.Enum.create({
	/**
	 * Denotes that the user has not started work on the task.
	 * @property
	 * @type Number
	 */
	'NOT_STARTED' : 0,
	
	/**
	 * Denotes that the user work on this task is in progress.
	 * @property
	 * @type Number
	 */
	'IN_PROGRESS' : 1,
	
	/**
	 * Denotes that the user work on this task is complete.
	 * @property
	 * @type Number
	 */
	'COMPLETE' : 2,
	
	/**
	 * Denotes that user is waiting for somebody else.
	 * @property
	 * @type Number
	 */
	'WAIT_FOR_OTHER_PERSON' : 3,
	
	/**
	 * Denotes that the user has deferred work on this task.
	 * @property
	 * @type Number
	 */
	'DEFERRED' : 4,

	/**
	 * Return the display name for the given task Status
	 * @param {Zarafa.core.mapi.TaskStatus} tasktatus The given task status
	 * @return {String} The display name for the task status
	 */
	getDisplayName : function(taskstatus)
	{
		switch (taskstatus) {
			case Zarafa.core.mapi.TaskStatus.NOT_STARTED:
				return _('Not Started');
			case Zarafa.core.mapi.TaskStatus.IN_PROGRESS:
				return _('In Progress');
			case Zarafa.core.mapi.TaskStatus.COMPLETE:
				return _('Complete');
			case Zarafa.core.mapi.TaskStatus.WAIT_FOR_OTHER_PERSON:
				return _('Wait for other person');
			case Zarafa.core.mapi.TaskStatus.DEFERRED:
				return _('Deferred');
		}
		return '';
	}
});

