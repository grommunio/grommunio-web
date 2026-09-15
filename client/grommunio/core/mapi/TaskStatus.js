Ext.namespace('Grommunio.core.mapi');

/**
 * @class Grommunio.core.mapi.TaskStatus
 * @extends Grommunio.core.Enum
 *
 * @singleton
 */
Grommunio.core.mapi.TaskStatus = Grommunio.core.Enum.create({
	/**
	 * Denotes that the user has not started work on the task.
	 * @property
	 * @type Number
	 */
	'NOT_STARTED': 0,

	/**
	 * Denotes that the user work on this task is in progress.
	 * @property
	 * @type Number
	 */
	'IN_PROGRESS': 1,

	/**
	 * Denotes that the user work on this task is complete.
	 * @property
	 * @type Number
	 */
	'COMPLETE': 2,

	/**
	 * Denotes that user is waiting for somebody else.
	 * @property
	 * @type Number
	 */
	'WAIT_FOR_OTHER_PERSON': 3,

	/**
	 * Denotes that the user has deferred work on this task.
	 * @property
	 * @type Number
	 */
	'DEFERRED': 4,

	/**
	 * Return the display name for the given task Status
	 * @param {Grommunio.core.mapi.TaskStatus} tasktatus The given task status
	 * @return {String} The display name for the task status
	 */
	getDisplayName: function(taskstatus)
	{
		switch (taskstatus) {
			case Grommunio.core.mapi.TaskStatus.NOT_STARTED:
				return _('Not Started');
			case Grommunio.core.mapi.TaskStatus.IN_PROGRESS:
				return _('In Progress');
			case Grommunio.core.mapi.TaskStatus.COMPLETE:
				return _('Complete');
			case Grommunio.core.mapi.TaskStatus.WAIT_FOR_OTHER_PERSON:
				return _('Wait for other person');
			case Grommunio.core.mapi.TaskStatus.DEFERRED:
				return _('Deferred');
		}
		return '';
	}
});

