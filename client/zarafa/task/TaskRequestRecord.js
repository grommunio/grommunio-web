/*
 * #dependsFile client/zarafa/core/data/RecordFactory.js
 * #dependsFile client/zarafa/core/data/MessageRecord.js
 */
Ext.namespace('Zarafa.task');

Zarafa.core.data.RecordFactory.addFieldToMessageClass('IPM.TaskRequest', Zarafa.task.TaskRecordFields);
Zarafa.core.data.RecordFactory.addFieldToMessageClass('IPM.TaskRequest', Zarafa.core.data.MessageRecordFields);
Zarafa.core.data.RecordFactory.addListenerToMessageClass('IPM.TaskRequest', 'createphantom', Zarafa.core.data.MessageRecordPhantomHandler);
Zarafa.core.data.RecordFactory.setSubStoreToMessageClass('IPM.TaskRequest', 'reply-to', Zarafa.core.data.IPMRecipientStore);

/**
 * @class Zarafa.task.TaskRequestRecord
 * @extends Zarafa.task.TaskRecord
 *
 * An extension to the {@link Zarafa.core.data.MessageRecord MessageRecord} specific to
 * Task Request/Response Messages.
 */
Zarafa.task.TaskRequestRecord = Ext.extend(Zarafa.task.TaskRecord, {

	/**
	 * Function is used to determine that {@link Zarafa.task.TaskRequestRecord TaskRequest}
	 * is received from assigner.
	 *
	 * @return {boolean} True to task request is assigned to user by the assigner else false.
	 */
	isReceivedTaskRequestFromAssigner : function ()
	{
		return (this.isTaskOwner() && this.isTaskAssigned() &&
		this.get('taskmode') === Zarafa.core.mapi.TaskMode.REQUEST &&
		this.get('task_acceptance_state') === Zarafa.core.mapi.TaskAcceptanceState.DELEGATION_UNKNOWN);
	}
});

Zarafa.core.data.RecordFactory.setBaseClassToMessageClass('IPM.TaskRequest', Zarafa.task.TaskRequestRecord);