/*
 * #dependsFile client/zarafa/core/data/RecordFactory.js
 * #dependsFile client/zarafa/core/data/MessageRecord.js
 */
Ext.namespace('Zarafa.task');

/**
 * @class Zarafa.task.TaskRecordFields
 * Array of {@link Ext.data.Field field} configurations for the
 * {@link Zarafa.core.data.IPMRecord IPMRecord} object.
 * These fields will be available in all 'IPM.Task' type messages.
 */
Zarafa.task.TaskRecordFields = [
	{name: 'importance', type: 'int', defaultValue: Zarafa.core.mapi.Importance.NORMAL},
	{name: 'message_flags', type: 'int', defaultValue: Zarafa.core.mapi.MessageFlags.MSGFLAG_READ},
	{name: 'last_modification_time', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'recurring', type: 'boolean'},
	{name: 'startdate', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'duedate', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'commonstart', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'commonend', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'taskstate', type: 'int', defaultValue: Zarafa.core.mapi.TaskState.NORMAL},
	{name: 'taskmode', type: 'int', defaultValue: Zarafa.core.mapi.TaskMode.NOTHING},
	{name: 'tasksoc',  type: 'boolean', defaultValue: true},
	{name: 'taskupdates',  type: 'boolean', defaultValue: true},
	{name: 'reminder', type: 'boolean', defaultValue: false},
	{name: 'reminderdate', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'owner'},
	{name: 'status', type: 'int', defaultValue: Zarafa.core.mapi.TaskStatus.NOT_STARTED},
	{name: 'percent_complete', type: 'float', defaultValue: 0},
	{name: 'complete', type: 'boolean', defaultValue: false},
	{name: 'sensitivity', type: 'int', defaultValue: Zarafa.core.mapi.Sensitivity.NONE},
	{name: 'private', type: 'boolean', defaultValue: false},
	{name: 'totalwork', type: 'int', defaultValue: 0},
	{name: 'actualwork', type: 'int', defaultValue: 0},
	{name: 'mileage'},
	{name: 'billing_information'},
	{name: 'companies'},
	{name: 'date_completed', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'reminder', type: 'boolean', defaultValue: false},
	{name: 'reminder_time', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'flagdueby', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'hide_attachments', type: 'boolean', defaultValue: false},
	{name: 'ownership', type: 'int', defaultValue:Zarafa.core.mapi.TaskOwnership.NEWTASK},
	{name: 'conversation_topic'},
	{name: 'task_assigner'},
	{name: 'task_assigned_time', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'taskhistory', type: 'int', defaultValue:Zarafa.core.mapi.TaskHistory.NONE},
	{name: 'task_goid'},
	{name: 'tasklastuser'},
	{name: 'flag_status'},
	{name: 'flag_icon'},
	{name: 'task_acceptance_state', type : 'int', defaultValue:Zarafa.core.mapi.TaskAcceptanceState.NOT_DELEGATED},
	{name: 'updatecount', type : 'int'},
	{name: 'task_not_found', type : 'boolean'}
];

Zarafa.core.data.RecordFactory.addFieldToMessageClass('IPM.Task', Zarafa.task.TaskRecordFields);
Zarafa.core.data.RecordFactory.setSubStoreToMessageClass('IPM.Task', 'reply-to', Zarafa.core.data.IPMRecipientStore);
Zarafa.core.data.RecordFactory.addListenerToMessageClass('IPM.Task', 'createphantom', function(record, data) {
	record.beginEdit();

	if (!data || !Ext.isDefined(data.reminder)) {
		var reminder = false;
		var store = container.getHierarchyStore().getById(record.get('store_entryid'));
		if (!store || !store.isPublicStore()) {
			reminder = container.getSettingsModel().get('zarafa/v1/contexts/task/default_reminder');
		}
		record.set('reminder', reminder);
	}

	if (record.get('reminder')) {
		var time = new Date().clearTime().add(Date.MINUTE, container.getSettingsModel().get('zarafa/v1/contexts/task/default_reminder_time'));
		record.set('reminder_time', time);
	}

	record.endEdit();
});

/**
 * @class Zarafa.task.TaskRecord
 * @extends Zarafa.core.data.MessageRecord
 *
 * An extension to the {@link Zarafa.core.data.MessageRecord MessageRecord} specific to Task Request/Response Messages.
 */
Zarafa.task.TaskRecord = Ext.extend(Zarafa.core.data.MessageRecord, {
	/**
	 * @return {Boolean} true if the {@link Zarafa.core.data.TaskRecord TaskRecord} is task request or
	 * task is not normal task else false.
	 */
	isTaskRequest : function()
	{
		return (this.get('taskmode') !== Zarafa.core.mapi.TaskMode.NOTHING) || this.isMessageClass('IPM.TaskRequest');
	},

	/**
	 * Function is used to determine that task has been assigner copy.
	 *
	 * @returns {boolean} true if task is assigner copy else false.
	 */
	isTaskOrganized : function ()
	{
		return this.get('taskstate') === Zarafa.core.mapi.TaskState.ACCEPT ||
			this.get('taskstate') === Zarafa.core.mapi.TaskState.DECLINE;
	},

	/**
	 * Function is used to determine that task has been delegated/assigned by the user. Here user
	 * rol has task assigner
	 *
	 * @returns {boolean} true if user has assigned task to assignee else false.
	 */
	isTaskDelegated : function()
	{
		return this.get('ownership')  === Zarafa.core.mapi.TaskOwnership.DELEGATEDTASK;
	},

	/**
	 * Function is used to determine user is task owner.
	 *
	 * @returns {boolean} true if user is task owner/assignee of this task else false
	 */
	isTaskOwner : function ()
	{
		return this.get('ownership')  === Zarafa.core.mapi.TaskOwnership.OWNTASK;
	},

	/**
	 * Function is used to determine task is received task from assigner.
	 *
	 * @returns {boolean} true if task is received task from assignor else false.
	 */
	isTaskReceived : function()
	{
		return this.get('taskstate') === Zarafa.core.mapi.TaskState.OWNER;
	},

	/**
	 * Function is used to determine that task is assigned task to assignee by user(assigner).
	 *
	 * @returns {boolean} true if task is assigned by assigner else false.
	 */
	isTaskAssigned : function ()
	{
		return this.get('taskhistory') === Zarafa.core.mapi.TaskHistory.ASSIGNED;
	},

	/**
	 * Function is used to determine that task is accepted by user(assignee).
	 *
	 * @returns {boolean} true if task is accepted by assignee else false.
	 */
	isTaskAccepted : function ()
	{
		return this.get('taskhistory') === Zarafa.core.mapi.TaskHistory.ACCEPTED;
	},

	/**
	 * Function is used to determine that task is updated by user(assignee).
	 *
	 * @returns {boolean} true if task is updated by assignee else false.
	 */
	isTaskUpdated : function ()
	{
		return this.get('taskhistory') === Zarafa.core.mapi.TaskHistory.UPDATED;
	},

	/**
	 * Function is used to identify the task is normal task.
	 *
	 * @returns {boolean} true if task is not assigned task else false.
	 */
	isNormalTask : function ()
	{
		var taskState = this.get('taskstate');

		return (taskState === Zarafa.core.mapi.TaskState.NORMAL ||
		taskState === Zarafa.core.mapi.TaskState.OWNER_NEW);
	},

	/**
	 * Function is used to identify the task was declined by the user(assignee).
	 *
	 * @returns {boolean} true if task is declined task else false.
	 */
	isTaskDeclined : function ()
	{
		return (this.get('taskstate') === Zarafa.core.mapi.TaskState.ACCEPT &&
			this.get('taskhistory') === Zarafa.core.mapi.TaskHistory.DECLINED);
	},

	/**
	 * Function is used to determine that is assigned but not
	 * sent to assignee by assigner.
	 *
	 * @returns {boolean} true if task is draft assigned task else false.
	 */
	isDraftAssignedTask : function()
	{
		return (this.get('taskstate') === Zarafa.core.mapi.TaskState.OWNER_NEW &&
				this.get('taskmode') === Zarafa.core.mapi.TaskMode.REQUEST);
	},

	/**
	 * Generates task request response comment information which will be added to task request response body.
	 * @return {String} generated body message.
	 */
	generateTaskCommentsInfo : function (commentText)
	{
		var taskCommentsInfo = commentText || '';
		if (Ext.isEmpty(this.get('body'))) {
			return taskCommentsInfo;
		}

		taskCommentsInfo += '\n---------\n' + this.get('body');
		return taskCommentsInfo;
	},

	/**
	 * Respond to a task request with the correct {@link Zarafa.core.mapi.TaskMode}.
	 *
	 * @param {Zarafa.core.mapi.ResponseStatus} responseType accept/decline
	 */
	respondToTaskRequest : function(responseType, comments, editResponse)
	{
		this.sendTaskRequestResponse(responseType, this.generateTaskCommentsInfo(comments), editResponse);
	},

	/**
	 * Sends a requests to accept/decline a incoming task request.
	 *
	 * @param {Zarafa.core.mapi.ResponseStatus} responseType accept/decline/propose new time
	 * @param {Boolean} editResponse true if no response should be send to organizer else false
	 * @private
	 */
	sendTaskRequestResponse : function(responseType, comments, editResponse)
	{
		if (Ext.isDefined(responseType)) {
			switch(responseType)
			{
				case Zarafa.core.mapi.TaskMode.ACCEPT:
					this.addMessageAction('action_type', 'acceptTaskRequest');
					this.set('taskhistory', Zarafa.core.mapi.TaskHistory.ACCEPTED, true);
					break;
				case Zarafa.core.mapi.TaskMode.DECLINE:
					this.addMessageAction('action_type', 'declineTaskRequest');
					this.set('taskhistory', Zarafa.core.mapi.TaskHistory.DECLINED, true);
					break;
			}

			this.addMessageAction('response_type', responseType);
			if (editResponse) {
				this.addMessageAction('task_comments_info', comments);
			}
			this.getStore().save(this);
		}
	},

	/**
	 * Function will set the message action either 'declineAndDelete' when assignee
	 * wants to delete task from task folder and send decline task response to assigner,
	 * 'completeAndDelete' when assignee wants to delete task and send complete task response
	 * to assigner or silently delete selected task/task request record from grid.
	 *
	 * @param {String} action which is either 'declineAndDelete', 'completeAndDelete' or 'delete'.
	 */
	deleteIncompleteTask : function (action)
	{
		if (action !== 'delete') {
			this.addMessageAction('action_type', action);
		}

		var store = this.getStore();
		store.remove(this);
		store.save(this);
	},

	/**
	 * Update the current task to a task request.
	 */
	convertToTaskRequest : function()
	{
		this.beginEdit();
		this.set('taskstate', Zarafa.core.mapi.TaskState.OWNER_NEW);
		this.set('taskmode', Zarafa.core.mapi.TaskMode.REQUEST);
		this.endEdit();
	}
});
Zarafa.core.data.RecordFactory.setBaseClassToMessageClass('IPM.Task', Zarafa.task.TaskRecord);

