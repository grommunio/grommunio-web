/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * #dependsFile client/grommunio/core/data/RecordFactory.js
 * #dependsFile client/grommunio/core/data/MessageRecord.js
 */
Ext.namespace('Grommunio.task');

Grommunio.core.data.RecordFactory.addFieldToMessageClass('IPM.TaskRequest', Grommunio.task.TaskRecordFields);
Grommunio.core.data.RecordFactory.addFieldToMessageClass('IPM.TaskRequest', Grommunio.core.data.MessageRecordFields);
Grommunio.core.data.RecordFactory.addListenerToMessageClass('IPM.TaskRequest', 'createphantom', Grommunio.core.data.MessageRecordPhantomHandler);
Grommunio.core.data.RecordFactory.setSubStoreToMessageClass('IPM.TaskRequest', 'reply-to', Grommunio.core.data.IPMRecipientStore);

/**
 * @class Grommunio.task.TaskRequestRecord
 * @extends Grommunio.task.TaskRecord
 *
 * An extension to the {@link Grommunio.core.data.MessageRecord MessageRecord} specific to
 * Task Request/Response Messages.
 */
Grommunio.task.TaskRequestRecord = Ext.extend(Grommunio.task.TaskRecord, {

	/**
	 * Function is used to determine that {@link Grommunio.task.TaskRequestRecord TaskRequest}
	 * is received from assigner.
	 *
	 * @return {boolean} True to task request is assigned to user by the assigner else false.
	 */
	isReceivedTaskRequestFromAssigner: function ()
	{
		return (this.isTaskOwner() && this.isTaskAssigned() &&
		this.get('taskmode') === Grommunio.core.mapi.TaskMode.REQUEST &&
		this.get('task_acceptance_state') === Grommunio.core.mapi.TaskAcceptanceState.DELEGATION_UNKNOWN);
	}
});

Grommunio.core.data.RecordFactory.setBaseClassToMessageClass('IPM.TaskRequest', Grommunio.task.TaskRequestRecord);
