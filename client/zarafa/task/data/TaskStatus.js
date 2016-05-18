/*
 * #dependsFile client/zarafa/core/mapi/TaskStatus.js
 */
Ext.namespace('Zarafa.task.data');

/**
 * @class Zarafa.task.data.TaskStatus
 * @singleton
 */
Zarafa.task.data.TaskStatus = {
	status : [{
		value: Zarafa.core.mapi.TaskStatus['NOT_STARTED'],
		name: Zarafa.core.mapi.TaskStatus.getDisplayName(Zarafa.core.mapi.TaskStatus['NOT_STARTED'])
	},{
		value: Zarafa.core.mapi.TaskStatus['IN_PROGRESS'],
		name: Zarafa.core.mapi.TaskStatus.getDisplayName(Zarafa.core.mapi.TaskStatus['IN_PROGRESS'])
	},{
		value: Zarafa.core.mapi.TaskStatus['COMPLETE'],
		name: Zarafa.core.mapi.TaskStatus.getDisplayName(Zarafa.core.mapi.TaskStatus['COMPLETE'])
	},{
		value: Zarafa.core.mapi.TaskStatus['WAIT_FOR_OTHER_PERSON'],
		name: Zarafa.core.mapi.TaskStatus.getDisplayName(Zarafa.core.mapi.TaskStatus['WAIT_FOR_OTHER_PERSON'])
	},{
		value: Zarafa.core.mapi.TaskStatus['DEFERRED'],
		name: Zarafa.core.mapi.TaskStatus.getDisplayName(Zarafa.core.mapi.TaskStatus['DEFERRED'])
	}]
};
