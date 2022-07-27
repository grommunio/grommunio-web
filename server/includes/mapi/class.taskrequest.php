<?php
/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * SPDX-FileCopyrightText: Copyright 2005-2016 Zarafa Deutschland GmbH
 * SPDX-FileCopyrightText: Copyright 2020-2022 grommunio GmbH
 */

/*
* In general
*
* This class never actually modifies a task item unless we receive a task request update. This means
* that setting all the properties to make the task item itself behave like a task request is up to the
* caller.
*
* The only exception to this is the generation of the TaskGlobalObjId, the unique identifier identifying
* this task request to both the organizer and the assignee. The globalobjectid is generated when the
* task request is sent via sendTaskRequest.
*/

/* The TaskMode value is only used for the IPM.TaskRequest items.
 * It must 0 (tdmtNothing) on IPM.Task items.
 *
 * It is used to indicate the type of change that is being
 * carried in the IPM.TaskRequest item (although this information seems
 * redundant due to that information already being available in PR_MESSAGE_CLASS).
 */
define('tdmtNothing', 0);			// Value in IPM.Task items
define('tdmtTaskReq', 1);			// Assigner -> Assignee
define('tdmtTaskAcc', 2);			// Assignee -> Assigner
define('tdmtTaskDec', 3);			// Assignee -> Assigner
define('tdmtTaskUpd', 4);			// Assignee -> Assigner
define('tdmtTaskSELF', 5);			// Assigner -> Assigner (?)

/* The TaskHistory is used to show the last action on the task
 * on both the assigner and the assignee's side.
 *
 * It is used in combination with 'task_assigned_time' and 'tasklastdelegate'
 * or 'tasklastuser' to show the information at the top of the task request in
 * the format 'Accepted by <user> on 01-01-2010 11:00'.
 */
define('thNone', 0);
define('thAccepted', 1);			// Set by assignee
define('thDeclined', 2);			// Set by assignee
define('thUpdated', 3);				// Set by assignee
define('thDueDateChanged', 4);
define('thAssigned', 5);			// Set by assigner

/* The TaskState value is used to differentiate the version of a task
 * in the assigner's folder and the version in the
 * assignee's folder. The buttons shown depend on this and
 * the 'taskaccepted' boolean (for the assignee)
 */
define('tdsNOM', 0);		// Got a response to a deleted task, and re-created the task for the assigner
define('tdsOWNNEW', 1);		// Not assigned
define('tdsOWN', 2);		// Assignee version
define('tdsACC', 3);		// Assigner version
define('tdsDEC', 4);		// Assigner version, but assignee declined

/* The TaskAcceptanceState is used for the assigner to indicate state */
define('olTaskNotDelegated', 0);
define('olTaskDelegationUnknown', 1); // After sending req
define('olTaskDelegationAccepted', 2); // After receiving accept
define('olTaskDelegationDeclined', 3); // After receiving decline

/* The task ownership indicates the role of the current user relative to the task. */
define('olNewTask', 0);
define('olDelegatedTask', 1);	// Task has been assigned
define('olOwnTask', 2);			// Task owned

/* taskmultrecips indicates whether the task request sent or received has multiple assignees or not. */
define('tmrNone', 0);
define('tmrSent', 1);		// Task has been sent to multiple assignee
define('tmrReceived', 2);	// Task Request received has multiple assignee

// Task icon index.
define('ICON_TASK_ASSIGNEE', 0x00000502);
define('ICON_TASK_DECLINE', 0x00000506);
define('ICON_TASK_ASSIGNER', 0x00000503);

class TaskRequest {
	private $props;
	private $store;
	private $message;
	private $session;
	private $taskCommentsInfo;

	// All recipient properties
	public $recipProps = [
		PR_ENTRYID,
		PR_DISPLAY_NAME,
		PR_EMAIL_ADDRESS,
		PR_RECIPIENT_ENTRYID,
		PR_RECIPIENT_TYPE,
		PR_SEND_INTERNET_ENCODING,
		PR_SEND_RICH_INFO,
		PR_RECIPIENT_DISPLAY_NAME,
		PR_ADDRTYPE,
		PR_DISPLAY_TYPE,
		PR_RECIPIENT_TRACKSTATUS,
		PR_RECIPIENT_TRACKSTATUS_TIME,
		PR_RECIPIENT_FLAGS,
		PR_ROWID,
		PR_SEARCH_KEY,
	];

	/**
	 * Constructor.
	 *
	 * Constructs a TaskRequest object for the specified message. This can be either the task request
	 * message itself (in the inbox) or the task in the tasks folder, depending on the action to be performed.
	 *
	 * As a general rule, the object message passed is the object 'in view' when the user performs one of the
	 * actions in this class.
	 *
	 * @param resource $store   MAPI Store in which $message resides. This is also the store where the tasks folder is assumed to be in
	 * @param resource $message MAPI Message to which the task request refers (can be an email or a task)
	 * @param resource $session MAPI Session which is used to open tasks folders for delegated task requests or responses
	 */
	public function __construct($store, $message, $session) {
		$this->store = $store;
		$this->message = $message;
		$this->session = $session;
		$this->taskCommentsInfo = '';

		$properties = [];
		$properties["owner"] = "PT_STRING8:PSETID_Task:0x811f";
		$properties["updatecount"] = "PT_LONG:PSETID_Task:0x8112";
		$properties["taskstate"] = "PT_LONG:PSETID_Task:0x8113";
		$properties["taskmultrecips"] = "PT_LONG:PSETID_Task:0x8120";
		$properties["taskupdates"] = "PT_BOOLEAN:PSETID_Task:0x811b";
		$properties["tasksoc"] = "PT_BOOLEAN:PSETID_Task:0x8119";
		$properties["taskhistory"] = "PT_LONG:PSETID_Task:0x811a";
		$properties["taskmode"] = "PT_LONG:PSETID_Common:0x8518";
		$properties["task_goid"] = "PT_BINARY:PSETID_Common:0x8519";
		$properties["complete"] = "PT_BOOLEAN:PSETID_Common:" . PidLidTaskComplete;
		$properties["task_assigned_time"] = "PT_SYSTIME:PSETID_Task:0x8115";
		$properties["taskfcreator"] = "PT_BOOLEAN:PSETID_Task:0x0x811e";
		$properties["tasklastuser"] = "PT_STRING8:PSETID_Task:0x8122";
		$properties["tasklastdelegate"] = "PT_STRING8:PSETID_Task:0x8125";
		$properties["taskaccepted"] = "PT_BOOLEAN:PSETID_Task:0x8108";
		$properties["task_acceptance_state"] = "PT_LONG:PSETID_Task:0x812a";
		$properties["ownership"] = "PT_LONG:PSETID_Task:0x8129";

		$properties["complete"] = "PT_BOOLEAN:PSETID_Task:" . PidLidTaskComplete;
		$properties["datecompleted"] = "PT_SYSTIME:PSETID_Task:" . PidLidTaskDateCompleted;
		$properties["recurring"] = "PT_BOOLEAN:PSETID_Task:0x8126";
		$properties["startdate"] = "PT_SYSTIME:PSETID_Task:" . PidLidTaskStartDate;
		$properties["duedate"] = "PT_SYSTIME:PSETID_Task:" . PidLidTaskDueDate;
		$properties["status"] = "PT_LONG:PSETID_Task:" . PidLidTaskStatus;
		$properties["percent_complete"] = "PT_DOUBLE:PSETID_Task:" . PidLidPercentComplete;
		$properties["totalwork"] = "PT_LONG:PSETID_Task:0x8111";
		$properties["actualwork"] = "PT_LONG:PSETID_Task:0x8110";
		$properties["categories"] = "PT_MV_STRING8:PS_PUBLIC_STRINGS:Keywords";
		$properties["companies"] = "PT_MV_STRING8:PSETID_Common:0x8539";
		$properties["mileage"] = "PT_STRING8:PSETID_Common:0x8534";
		$properties["billinginformation"] = "PT_STRING8:PSETID_Common:0x8535";

		$this->props = getPropIdsFromStrings($store, $properties);
	}

	// General functions

	/**
	 * Returns TRUE if the message pointed to is an incoming task request and should
	 * therefore be replied to with doAccept or doDecline().
	 *
	 * @param mixed $messageClass message class to use for checking
	 *
	 * @return bool true if this is a task request else false
	 */
	public function isTaskRequest($messageClass = false) {
		if ($messageClass === false) {
			$props = mapi_getprops($this->message, [PR_MESSAGE_CLASS]);
			$messageClass = isset($props[PR_MESSAGE_CLASS]) ? $props[PR_MESSAGE_CLASS] : false;
		}

		if ($messageClass !== false && $messageClass === "IPM.TaskRequest") {
			return true;
		}

		return false;
	}

	/**
	 * Returns TRUE if the message pointed to is a returning task request response.
	 *
	 * @param mixed $messageClass message class to use for checking
	 *
	 * @return bool true if this is a task request else false
	 */
	public function isTaskRequestResponse($messageClass = false) {
		if ($messageClass === false) {
			$props = mapi_getprops($this->message, [PR_MESSAGE_CLASS]);
			$messageClass = isset($props[PR_MESSAGE_CLASS]) ? $props[PR_MESSAGE_CLASS] : false;
		}

		if ($messageClass !== false && strpos($messageClass, "IPM.TaskRequest.") === 0) {
			return true;
		}

		return false;
	}

	/**
	 * Returns TRUE if the message pointed to is an incoming task request/response.
	 *
	 * @param array $props The MAPI properties to check message is an incoming task request/response
	 *
	 * @return bool true if this is an incoming task request/response else false
	 */
	public function isReceivedItem($props) {
		return isset($props[PR_MESSAGE_TO_ME]) ? $props[PR_MESSAGE_TO_ME] : false;
	}

	/**
	 * Gets the task associated with an IPM.TaskRequest message.
	 *
	 * If the task does not exist yet, it is created, using the attachment object in the
	 * task request item.
	 *
	 * @param bool $create true - try create task in user's task folder if task does not exist
	 *                     false - find the associated task in user's task folder
	 *
	 * @return bool|resource associated task of task request else false
	 */
	public function getAssociatedTask($create) {
		$props = mapi_getprops($this->message, [PR_MESSAGE_CLASS, $this->props['task_goid']]);

		if ($props[PR_MESSAGE_CLASS] == "IPM.Task") {
			// Message itself is task, so return that
			return $this->message;
		}

		$taskFolder = $this->getDefaultTasksFolder();
		$goid = $props[$this->props['task_goid']];

		// Find the task by looking for the task_goid
		$restriction = [
			RES_PROPERTY,
			[
				RELOP => RELOP_EQ,
				ULPROPTAG => $this->props['task_goid'],
				VALUE => $goid,
			],
		];

		$contents = mapi_folder_getcontentstable($taskFolder);

		$rows = mapi_table_queryallrows($contents, [PR_ENTRYID], $restriction);

		if (empty($rows)) {
			// None found, create one if possible
			if (!$create) {
				return false;
			}

			$task = mapi_folder_createmessage($taskFolder);

			$sub = $this->getEmbeddedTask();
			mapi_copyto($sub, [], [$this->props['categories']], $task);

			$senderProps = [
				PR_SENT_REPRESENTING_NAME,
				PR_SENT_REPRESENTING_EMAIL_ADDRESS,
				PR_SENT_REPRESENTING_ENTRYID,
				PR_SENT_REPRESENTING_ADDRTYPE,
				PR_SENT_REPRESENTING_SEARCH_KEY,
				PR_SENDER_NAME,
				PR_SENDER_EMAIL_ADDRESS,
				PR_SENDER_ENTRYID,
				PR_SENDER_ADDRTYPE,
				PR_SENDER_SEARCH_KEY, ];

			// Copy sender information from the e-mail
			$props = mapi_getprops($this->message, $senderProps);
			$props[PR_MESSAGE_CLASS] = 'IPM.Task';
			mapi_setprops($task, $props);
		}
		else {
			// If there are multiple, just use the first
			$entryid = $rows[0][PR_ENTRYID];

			$store = $this->getTaskFolderStore();
			$task = mapi_msgstore_openentry($store, $entryid);
		}

		return $task;
	}

	/**
	 * Function which checks that if we have received a task request/response
	 * for an already updated task in task folder.
	 *
	 * @return bool true if task request is updated later
	 */
	public function isTaskRequestUpdated() {
		$props = mapi_getprops($this->message, [PR_MESSAGE_CLASS, $this->props['task_goid'], $this->props['updatecount']]);
		$result = false;
		$associatedTask = $this->getAssociatedTask(false);
		if ($this->isTaskRequest($props[PR_MESSAGE_CLASS])) {
			if ($associatedTask) {
				return true;
			}
			$folder = $this->getDefaultTasksFolder();
			$goid = $props[$this->props['task_goid']];

			// Find the task by looking for the task_goid
			$restriction = [
				RES_PROPERTY,
				[
					RELOP => RELOP_EQ,
					ULPROPTAG => $this->props['task_goid'],
					VALUE => $goid,
				],
			];

			$table = mapi_folder_getcontentstable($folder, MAPI_DEFERRED_ERRORS | SHOW_SOFT_DELETES);
			$softDeletedItems = mapi_table_queryallrows($table, [PR_ENTRYID], $restriction);
			if (!empty($softDeletedItems)) {
				return true;
			}
		}

		if ($associatedTask !== false) {
			$taskItemProps = mapi_getprops($associatedTask, [$this->props['updatecount']]);
			/*
			 * if(message_counter < task_counter) task object is newer then task response (task is updated)
			 * if(message_counter >= task_counter) task is not updated, do normal processing
			 */
			if (isset($taskItemProps[$this->props['updatecount']], $props[$this->props['updatecount']])) {
				if ($props[$this->props['updatecount']] < $taskItemProps[$this->props['updatecount']]) {
					$result = true;
				}
			}
		}

		return $result;
	}

	// Organizer functions (called by the organizer)

	/**
	 * Processes a task request response, which can be any of the following:
	 * - Task accept (task history is marked as accepted)
	 * - Task decline (task history is marked as declined)
	 * - Task update (updates completion %, etc).
	 */
	public function processTaskResponse() {
		$messageProps = mapi_getprops($this->message, [PR_PROCESSED, $this->props["taskupdates"], PR_MESSAGE_TO_ME]);
		if (isset($messageProps[PR_PROCESSED]) && $messageProps[PR_PROCESSED]) {
			return true;
		}
		mapi_setprops($this->message, [PR_PROCESSED => true]);
		mapi_savechanges($this->message);

		// Get the embedded task information.
		$sub = $this->getEmbeddedTask();
		// OL saves the task related properties in the embedded message
		$subProps = mapi_getprops($sub, [$this->props["taskupdates"]]);

		// If task is updated in task folder then we don't need to process
		// old response
		if ($this->isTaskRequestUpdated()) {
			return true;
		}

		$isReceivedItem = $this->isReceivedItem($messageProps);

		$isCreateAssociatedTask = false;
		$isAllowUpdateAssociatedTask = $subProps[$this->props["taskupdates"]];
		$props = mapi_getprops($this->message, [PR_MESSAGE_CLASS]);
		// Set correct taskmode and taskhistory depending on response type
		switch ($props[PR_MESSAGE_CLASS]) {
			case 'IPM.TaskRequest.Accept':
				$taskHistory = thAccepted;
				$taskState = $isReceivedItem ? tdsACC : tdsOWN;
				$taskOwner = $isReceivedItem ? olDelegatedTask : olOwnTask;
				$taskAcceptanceState = $isReceivedItem ? olTaskDelegationAccepted : olTaskNotDelegated;
				break;

			case 'IPM.TaskRequest.Decline':
				$isCreateAssociatedTask = $isReceivedItem;
				$isAllowUpdateAssociatedTask = $isReceivedItem;
				$taskHistory = thDeclined;
				$taskState = $isReceivedItem ? tdsDEC : tdsACC;
				$taskOwner = $isReceivedItem ? olOwnTask : olDelegatedTask;
				$taskAcceptanceState = $isReceivedItem ? olTaskDelegationDeclined : olTaskDelegationUnknown;
				break;

			case 'IPM.TaskRequest.Update':
			case 'IPM.TaskRequest.Complete':
				$taskHistory = thUpdated;
				$taskState = $isReceivedItem ? tdsACC : tdsOWN;
				$taskAcceptanceState = olTaskNotDelegated;
				$taskOwner = $isReceivedItem ? olDelegatedTask : olOwnTask;
				break;
		}

		$props = [
			$this->props['taskhistory'] => $taskHistory,
			$this->props['taskstate'] => $taskState,
			$this->props['task_acceptance_state'] => $taskAcceptanceState,
			$this->props['ownership'] => $taskOwner,
		];

		// Get the task for this response
		$task = $this->getAssociatedTask($isCreateAssociatedTask);
		if ($task && $isAllowUpdateAssociatedTask) {
			// To avoid duplication of attachments in associated task. we simple remove the
			// all attachments from associated task.
			$taskAttachTable = mapi_message_getattachmenttable($task);
			$taskAttachments = mapi_table_queryallrows($taskAttachTable, [PR_ATTACH_NUM]);
			foreach ($taskAttachments as $taskAttach) {
				mapi_message_deleteattach($task, $taskAttach[PR_ATTACH_NUM]);
			}

			$ignoreProps = [
				$this->props['taskstate'],
				$this->props['taskhistory'],
				$this->props['taskmode'],
				$this->props['taskfcreator'],
			];
			// Ignore PR_ICON_INDEX when task request response
			// is not received item.
			if ($isReceivedItem === false) {
				$ignoreProps[] = PR_ICON_INDEX;
			}

			// We copy all properties except taskstate, taskhistory, taskmode and taskfcreator properties
			// from $sub message to $task even also we copy all attachments from $sub to $task message.
			mapi_copyto($sub, [], $ignoreProps, $task);
			$senderProps = mapi_getprops($this->message, [
				PR_SENDER_NAME,
				PR_SENDER_EMAIL_ADDRESS,
				PR_SENDER_ENTRYID,
				PR_SENDER_ADDRTYPE,
				PR_SENDER_SEARCH_KEY,
				PR_MESSAGE_DELIVERY_TIME,
				PR_SENT_REPRESENTING_NAME,
				PR_SENT_REPRESENTING_EMAIL_ADDRESS,
				PR_SENT_REPRESENTING_ADDRTYPE,
				PR_SENT_REPRESENTING_ENTRYID,
				PR_SENT_REPRESENTING_SEARCH_KEY, ]);

			mapi_setprops($task, $senderProps);

			// Update taskstate and task history (last action done by the assignee)
			mapi_setprops($task, $props);

			// Copy missing properties from embedded task
			$subProperties = $this->getSubProperties();
			$subprops = mapi_getprops($sub, $subProperties);
			mapi_setprops($task, $subprops);

			mapi_savechanges($task);
		}

		mapi_setprops($this->message, $props);
		mapi_savechanges($this->message);

		if ($isReceivedItem) {
			$this->updateSentTaskRequest();
		}

		return true;
	}

	/**
	 * Update the sent task request in sent items folder.
	 *
	 * @return bool
	 */
	public function updateSentTaskRequest() {
		$props = mapi_getprops($this->message, [
			$this->props['taskhistory'],
			$this->props["taskstate"],
			$this->props["ownership"],
			$this->props['task_goid'],
			$this->props['task_acceptance_state'],
			$this->props["tasklastuser"],
			$this->props["tasklastdelegate"], ]);

		$store = $this->getDefaultStore();
		$storeProps = mapi_getprops($store, [PR_IPM_SENTMAIL_ENTRYID]);

		$sentFolder = mapi_msgstore_openentry($store, $storeProps[PR_IPM_SENTMAIL_ENTRYID]);
		if (!$sentFolder) {
			return false;
		}

		// Find the task by looking for the task_goid
		$restriction = [
			RES_PROPERTY,
			[
				RELOP => RELOP_EQ,
				ULPROPTAG => $this->props['task_goid'],
				VALUE => $props[$this->props['task_goid']],
			],
		];

		$contentsTable = mapi_folder_getcontentstable($sentFolder);

		$rows = mapi_table_queryallrows($contentsTable, [PR_ENTRYID], $restriction);

		if (!empty($rows)) {
			foreach ($rows as $row) {
				$sentTaskRequest = mapi_msgstore_openentry($store, $row[PR_ENTRYID]);
				mapi_setprops($sentTaskRequest, $props);
				mapi_setprops($sentTaskRequest, [PR_PROCESSED => true]);
				mapi_savechanges($sentTaskRequest);
			}
		}

		return true;
	}

	/**
	 * Creates a new message in the current user's outbox and submits it.
	 *
	 * Takes the task passed in the constructor as the task to be sent; recipient should
	 * be pre-existing. The task request will be sent to all recipients.
	 *
	 * @param string $prefix
	 */
	public function sendTaskRequest($prefix) {
		// Generate a TaskGlobalObjectId
		$taskid = $this->createTGOID();
		$messageprops = mapi_getprops($this->message, [PR_SUBJECT]);

		// Set properties on Task Request
		mapi_setprops($this->message, [
			$this->props['task_goid'] => $taskid, // our new task_goid
			$this->props['taskstate'] => tdsACC, // state for our outgoing request
			$this->props['taskmode'] => tdmtNothing, // we're not sending a change
			$this->props['updatecount'] => 2, // version 2 (no idea)
			$this->props['task_acceptance_state'] => olTaskDelegationUnknown, // no reply yet
			$this->props['ownership'] => olDelegatedTask, // Task has been assigned
			$this->props['taskhistory'] => thAssigned, // Task has been assigned
			PR_CONVERSATION_TOPIC => $messageprops[PR_SUBJECT],
			PR_ICON_INDEX => ICON_TASK_ASSIGNER,
		]);
		$this->setLastUser();
		$this->setOwnerForAssignor();
		mapi_savechanges($this->message);

		// Create outgoing task request message
		$outgoing = $this->createOutgoingMessage();

		// No need to copy PR_ICON_INDEX and  PR_SENT_* information in to outgoing message.
		$ignoreProps = [PR_ICON_INDEX, PR_SENT_REPRESENTING_NAME, PR_SENT_REPRESENTING_EMAIL_ADDRESS, PR_SENT_REPRESENTING_ADDRTYPE, PR_SENT_REPRESENTING_ENTRYID, PR_SENT_REPRESENTING_SEARCH_KEY];
		mapi_copyto($this->message, [], $ignoreProps, $outgoing);

		// Make it a task request, and put it in sent items after it is sent
		mapi_setprops($outgoing, [
			PR_MESSAGE_CLASS => "IPM.TaskRequest", // class is task request
			$this->props['taskstate'] => tdsOWN, // for the recipient he is the task owner
			$this->props['taskmode'] => tdmtTaskReq, // for the recipient it's a request
			$this->props['updatecount'] => 1, // version 2 is in the attachment
			PR_SUBJECT_PREFIX => $prefix,
			PR_SUBJECT => $prefix . $messageprops[PR_SUBJECT],
		]);

		$attach = mapi_message_createattach($outgoing);
		mapi_setprops($attach, [
			PR_ATTACH_METHOD => ATTACH_EMBEDDED_MSG,
			PR_ATTACHMENT_HIDDEN => true,
			PR_DISPLAY_NAME => $messageprops[PR_SUBJECT], ]);

		$sub = mapi_attach_openproperty($attach, PR_ATTACH_DATA_OBJ, IID_IMessage, 0, MAPI_MODIFY | MAPI_CREATE);

		mapi_copyto($this->message, [], [], $sub);
		mapi_setprops($sub, [PR_MESSAGE_CLASS => 'IPM.Task']);

		mapi_savechanges($sub);

		mapi_savechanges($attach);

		mapi_savechanges($outgoing);
		mapi_message_submitmessage($outgoing);

		return true;
	}

	// Assignee functions (called by the assignee)

	/**
	 * Updates task version counter.
	 *
	 * Must be called before each update to increase counter.
	 */
	public function updateTaskRequest() {
		$messageprops = mapi_getprops($this->message, [$this->props['updatecount']]);

		if (isset($messageprops)) {
			++$messageprops[$this->props['updatecount']];
		}
		else {
			$messageprops[$this->props['updatecount']] = 1;
		}

		mapi_setprops($this->message, $messageprops);
	}

	/**
	 * Processes a task request.
	 *
	 * Message passed should be an IPM.TaskRequest message. The task request is then processed to create
	 * the task in the tasks folder if needed.
	 *
	 * @return bool
	 */
	public function processTaskRequest() {
		if (!$this->isTaskRequest()) {
			return false;
		}
		$messageProps = mapi_getprops($this->message, [PR_PROCESSED, $this->props["taskupdates"], PR_MESSAGE_TO_ME]);
		if (isset($messageProps[PR_PROCESSED]) && $messageProps[PR_PROCESSED]) {
			return true;
		}

		// if task is updated in task folder then we don't need to process
		// old request.
		if ($this->isTaskRequestUpdated()) {
			return true;
		}

		$isReceivedItem = $this->isReceivedItem($messageProps);

		$props = [];
		$props[PR_PROCESSED] = true;
		$props[$this->props["taskstate"]] = $isReceivedItem ? tdsOWN : tdsACC;
		$props[$this->props["ownership"]] = $isReceivedItem ? olOwnTask : olDelegatedTask;

		mapi_setprops($this->message, $props);
		mapi_savechanges($this->message);

		// Don't create associated task in task folder if "taskupdates" is not true.
		if (!$isReceivedItem && !$messageProps[$this->props["taskupdates"]]) {
			return true;
		}
		// create an associated task in task folder while
		// reading/loading task request on client side.
		$task = $this->getAssociatedTask(true);

		$taskProps = mapi_getprops($task, [$this->props['taskmultrecips']]);
		$taskProps[$this->props["taskstate"]] = $isReceivedItem ? tdsOWN : tdsACC;
		$taskProps[$this->props["taskhistory"]] = thAssigned;
		$taskProps[$this->props["taskmode"]] = tdmtNothing;
		$taskProps[$this->props["taskaccepted"]] = false;
		$taskProps[$this->props["taskfcreator"]] = false;
		$taskProps[$this->props["ownership"]] = $isReceivedItem ? olOwnTask : olDelegatedTask;
		$taskProps[$this->props["task_acceptance_state"]] = olTaskNotDelegated;
		$taskProps[PR_ICON_INDEX] = ICON_TASK_ASSIGNEE;

		mapi_setprops($task, $taskProps);
		$this->setAssignorInRecipients($task);

		mapi_savechanges($task);

		return true;
	}

	/**
	 * Accepts a task request and sends the response.
	 *
	 * Message passed should be an IPM.Task (eg the task from getAssociatedTask())
	 *
	 * Copies the task to the user's task folder, sets it to accepted, and sends the acceptation
	 * message back to the organizer. The caller is responsible for removing the message.
	 *
	 * @return array|bool PR_ENTRYID, PR_STORE_ENTRYID and PR_PARENT_ENTRYID of the task
	 */
	public function doAccept() {
		$prefix = _("Task Accepted:") . " ";
		$messageProps = mapi_getprops($this->message, [PR_MESSAGE_CLASS, $this->props['taskstate']]);

		if (!isset($messageProps[$this->props['taskstate']]) || $messageProps[$this->props['taskstate']] != tdsOWN) {
			// Can only accept assignee task
			return false;
		}

		$this->setLastUser();
		$this->updateTaskRequest();

		$props = [
			$this->props['taskhistory'] => thAccepted,
			$this->props['task_assigned_time'] => time(),
			$this->props['taskaccepted'] => true,
			$this->props['task_acceptance_state'] => olTaskNotDelegated, ];

		// Message is TaskRequest then update the associated task as well.
		if ($this->isTaskRequest($messageProps[PR_MESSAGE_CLASS])) {
			$task = $this->getAssociatedTask(false);
			if ($task) {
				mapi_setprops($task, $props);
				mapi_savechanges($task);
			}
		}

		// Set as accepted
		mapi_setprops($this->message, $props);

		// As we copy the all properties from received message we need to remove following
		// properties from accept response.
		mapi_deleteprops($this->message, [PR_MESSAGE_RECIP_ME, PR_MESSAGE_TO_ME, PR_MESSAGE_CC_ME, PR_PROCESSED]);

		mapi_savechanges($this->message);

		$this->sendResponse(tdmtTaskAcc, $prefix);

		return $this->deleteReceivedTR();
	}

	/**
	 * Declines a task request and sends the response.
	 *
	 * Passed message must be a task request message, ie isTaskRequest() must return TRUE.
	 *
	 * Sends the decline message back to the organizer. The caller is responsible for removing the message.
	 *
	 * @return array|bool TRUE on success, FALSE on failure
	 */
	public function doDecline() {
		$prefix = _("Task Declined:") . " ";
		$messageProps = mapi_getprops($this->message, [$this->props['taskstate']]);

		if (!isset($messageProps[$this->props['taskstate']]) || $messageProps[$this->props['taskstate']] != tdsOWN) {
			return false; // Can only decline assignee task
		}

		$this->setLastUser();
		$this->updateTaskRequest();

		// Set as declined
		mapi_setprops($this->message, [
			$this->props['taskhistory'] => thDeclined,
			$this->props['task_acceptance_state'] => olTaskDelegationDeclined,
		]);
		mapi_deleteprops($this->message, [PR_MESSAGE_RECIP_ME, PR_MESSAGE_TO_ME, PR_MESSAGE_CC_ME, PR_PROCESSED]);
		mapi_savechanges($this->message);

		$this->sendResponse(tdmtTaskDec, $prefix);

		// Delete the associated task when task request is declined by the assignee.
		$task = $this->getAssociatedTask(false);
		if ($task) {
			$taskFolder = $this->getDefaultTasksFolder();
			$props = mapi_getprops($task, [PR_ENTRYID]);
			mapi_folder_deletemessages($taskFolder, [$props[PR_ENTRYID]]);
		}

		return $this->deleteReceivedTR();
	}

	/**
	 * Sends an update of the task if requested, and sends the Status-On-Completion report if complete and requested.
	 *
	 * If no updates were requested from the organizer, this function does nothing.
	 *
	 * @return bool TRUE if the update succeeded, FALSE otherwise
	 */
	public function doUpdate() {
		$messageProps = mapi_getprops($this->message, [$this->props['taskstate'], PR_SUBJECT]);

		if (!isset($messageProps[$this->props['taskstate']]) || $messageProps[$this->props['taskstate']] != tdsOWN) {
			return false; // Can only update assignee task
		}

		$this->setLastUser();
		$this->updateTaskRequest();

		// Set as updated
		mapi_setprops($this->message, [$this->props['taskhistory'] => thUpdated]);

		mapi_savechanges($this->message);

		$props = mapi_getprops($this->message, [$this->props['taskupdates'], $this->props['tasksoc'], $this->props['recurring'], $this->props['complete']]);
		if (!$props[$this->props['complete']] && $props[$this->props['taskupdates']] && !(isset($props[$this->props['recurring']]) && $props[$this->props['recurring']])) {
			$this->sendResponse(tdmtTaskUpd, _("Task Updated:") . " ");
		}
		elseif ($props[$this->props['complete']]) {
			$this->sendResponse(tdmtTaskUpd, _("Task Completed:") . " ");
		}

		return true;
	}

	/**
	 * Gets the store associated with the task.
	 *
	 * Normally this will just open the store that the processed message is in. However, if the message is opened
	 * by a delegate, this function opens the store that the message was delegated from.
	 */
	public function getTaskFolderStore() {
		$ownerentryid = false;

		$rcvdprops = mapi_getprops($this->message, [PR_RCVD_REPRESENTING_ENTRYID]);
		if (isset($rcvdprops[PR_RCVD_REPRESENTING_ENTRYID])) {
			$ownerentryid = $rcvdprops[PR_RCVD_REPRESENTING_ENTRYID];
		}

		if (!$ownerentryid) {
			$store = $this->store;
		}
		else {
			$ab = mapi_openaddressbook($this->session);
			if (!$ab) {
				return false;
			}

			$mailuser = mapi_ab_openentry($ab, $ownerentryid);
			if (!$mailuser) {
				return false;
			}

			$mailuserprops = mapi_getprops($mailuser, [PR_EMAIL_ADDRESS]);
			if (!isset($mailuserprops[PR_EMAIL_ADDRESS])) {
				return false;
			}

			$storeid = mapi_msgstore_createentryid($this->store, $mailuserprops[PR_EMAIL_ADDRESS]);

			$store = mapi_openmsgstore($this->session, $storeid);
		}

		return $store;
	}

	/**
	 * Opens the default task folder for the current user, or the specified user if passed.
	 */
	public function getDefaultTasksFolder() {
		$store = $this->getTaskFolderStore();

		$inbox = mapi_msgstore_getreceivefolder($store);
		$inboxprops = mapi_getprops($inbox, [PR_IPM_TASK_ENTRYID]);
		if (!isset($inboxprops[PR_IPM_TASK_ENTRYID])) {
			return false;
		}

		return mapi_msgstore_openentry($store, $inboxprops[PR_IPM_TASK_ENTRYID]);
	}

	/**
	 * Prepares the sent representing properties from given MAPI store.
	 *
	 * @param mixed $store MAPI store object
	 *
	 * @return array|bool if store is not mail box owner entryid then
	 *                    return false else prepare the sent representing props and return it
	 */
	public function getSentReprProps($store) {
		$storeprops = mapi_getprops($store, [PR_MAILBOX_OWNER_ENTRYID]);
		if (!isset($storeprops[PR_MAILBOX_OWNER_ENTRYID])) {
			return false;
		}

		$ab = mapi_openaddressbook($this->session);
		$mailuser = mapi_ab_openentry($ab, $storeprops[PR_MAILBOX_OWNER_ENTRYID]);
		$mailuserprops = mapi_getprops($mailuser, [PR_ADDRTYPE, PR_EMAIL_ADDRESS, PR_DISPLAY_NAME, PR_SEARCH_KEY, PR_ENTRYID]);

		$props = [];
		$props[PR_SENT_REPRESENTING_ADDRTYPE] = $mailuserprops[PR_ADDRTYPE];
		$props[PR_SENT_REPRESENTING_EMAIL_ADDRESS] = $mailuserprops[PR_EMAIL_ADDRESS];
		$props[PR_SENT_REPRESENTING_NAME] = $mailuserprops[PR_DISPLAY_NAME];
		$props[PR_SENT_REPRESENTING_SEARCH_KEY] = $mailuserprops[PR_SEARCH_KEY];
		$props[PR_SENT_REPRESENTING_ENTRYID] = $mailuserprops[PR_ENTRYID];

		return $props;
	}

	/**
	 * Creates an outgoing message based on the passed message - will set delegate information
	 * and sent mail folder.
	 */
	public function createOutgoingMessage() {
		// Open our default store for this user (that's the only store we can submit in)
		$store = $this->getDefaultStore();
		$storeprops = mapi_getprops($store, [PR_IPM_OUTBOX_ENTRYID, PR_IPM_SENTMAIL_ENTRYID]);

		$outbox = mapi_msgstore_openentry($store, $storeprops[PR_IPM_OUTBOX_ENTRYID]);
		if (!$outbox) {
			return false;
		}

		$outgoing = mapi_folder_createmessage($outbox);
		if (!$outgoing) {
			return false;
		}

		// Set SENT_REPRESENTING in case we're sending as a delegate
		$ownerstore = $this->getTaskFolderStore();
		$sentreprprops = $this->getSentReprProps($ownerstore);
		mapi_setprops($outgoing, $sentreprprops);

		mapi_setprops($outgoing, [PR_SENTMAIL_ENTRYID => $storeprops[PR_IPM_SENTMAIL_ENTRYID]]);

		return $outgoing;
	}

	/**
	 * Sends a response message (from assignee back to organizer).
	 *
	 * @param int   $type   Type of response (tdmtTaskAcc, tdmtTaskDec, tdmtTaskUpd)
	 * @param mixed $prefix
	 *
	 * @return bool TRUE on success
	 */
	public function sendResponse($type, $prefix) {
		// Create a message in our outbox
		$outgoing = $this->createOutgoingMessage();
		$messageprops = mapi_getprops($this->message, [PR_CONVERSATION_TOPIC, PR_MESSAGE_CLASS, $this->props['complete']]);

		$attach = mapi_message_createattach($outgoing);
		mapi_setprops($attach, [PR_ATTACH_METHOD => ATTACH_EMBEDDED_MSG, PR_DISPLAY_NAME => $messageprops[PR_CONVERSATION_TOPIC], PR_ATTACHMENT_HIDDEN => true]);
		$sub = mapi_attach_openproperty($attach, PR_ATTACH_DATA_OBJ, IID_IMessage, 0, MAPI_CREATE | MAPI_MODIFY);

		$message = !$this->isTaskRequest() ? $this->message : $this->getAssociatedTask(false);

		$ignoreProps = [PR_ICON_INDEX, $this->props["categories"], PR_SENT_REPRESENTING_NAME, PR_SENT_REPRESENTING_EMAIL_ADDRESS, PR_SENT_REPRESENTING_ADDRTYPE, PR_SENT_REPRESENTING_ENTRYID, PR_SENT_REPRESENTING_SEARCH_KEY];

		mapi_copyto($message, [], $ignoreProps, $outgoing);
		mapi_copyto($message, [], [], $sub);

		if (!$this->setRecipientsForResponse($outgoing, $type)) {
			return false;
		}

		$props = [];

		switch ($type) {
			case tdmtTaskAcc:
				$props[PR_MESSAGE_CLASS] = "IPM.TaskRequest.Accept";
				mapi_setprops($sub, [PR_ICON_INDEX => ICON_TASK_ASSIGNER]);
				break;

			case tdmtTaskDec:
				$props[PR_MESSAGE_CLASS] = "IPM.TaskRequest.Decline";
				mapi_setprops($sub, [PR_ICON_INDEX => ICON_TASK_DECLINE]);
				break;

			case tdmtTaskUpd:
				mapi_setprops($sub, [PR_ICON_INDEX => ICON_TASK_ASSIGNER]);
				if ($messageprops[$this->props['complete']]) {
					$props[PR_MESSAGE_CLASS] = "IPM.TaskRequest.Complete";
				}
				else {
					$props[PR_MESSAGE_CLASS] = "IPM.TaskRequest.Update";
				}

				break;
		}

		mapi_savechanges($sub);
		mapi_savechanges($attach);

		$props[PR_SUBJECT] = $prefix . $messageprops[PR_CONVERSATION_TOPIC];
		$props[$this->props['taskmode']] = $type;
		$props[$this->props['task_assigned_time']] = time();

		mapi_setprops($outgoing, $props);

		// taskCommentsInfo contains some comments which added by assignee while
		// edit response before sending task response.
		if ($this->taskCommentsInfo != '') {
			$comments = $this->getTaskCommentsInfo();
			$stream = mapi_openproperty($outgoing, PR_BODY, IID_IStream, STGM_TRANSACTED, MAPI_CREATE | MAPI_MODIFY);
			mapi_stream_setsize($stream, strlen($comments));
			mapi_stream_write($stream, $comments);
			mapi_stream_commit($stream);
		}

		mapi_savechanges($outgoing);
		mapi_message_submitmessage($outgoing);

		return true;
	}

	public function getDefaultStore() {
		$table = mapi_getmsgstorestable($this->session);
		$rows = mapi_table_queryallrows($table, [PR_DEFAULT_STORE, PR_ENTRYID]);

		foreach ($rows as $row) {
			if ($row[PR_DEFAULT_STORE]) {
				return mapi_openmsgstore($this->session, $row[PR_ENTRYID]);
			}
		}

		return false;
	}

	/**
	 * Creates a new TaskGlobalObjId.
	 *
	 * Just 16 bytes of random data
	 */
	public function createTGOID() {
		$goid = "";
		for ($i = 0; $i < 16; ++$i) {
			$goid .= chr(rand(0, 255));
		}

		return $goid;
	}

	/**
	 * Gets the embedded task of task request. Further used to
	 * create/update associated task of assigner/assignee.
	 *
	 * @return bool|resource embedded task if found else false
	 */
	public function getEmbeddedTask() {
		$task = false;
		$goid = mapi_getprops($this->message, [$this->props["task_goid"]]);
		$attachmentTable = mapi_message_getattachmenttable($this->message);
		$restriction = [RES_PROPERTY,
			[RELOP => RELOP_EQ,
				ULPROPTAG => PR_ATTACH_METHOD,
				VALUE => ATTACH_EMBEDDED_MSG, ],
		];
		$rows = mapi_table_queryallrows($attachmentTable, [PR_ATTACH_NUM], $restriction);

		if (empty($rows)) {
			return $task;
		}

		foreach ($rows as $row) {
			try {
				$attach = mapi_message_openattach($this->message, $row[PR_ATTACH_NUM]);
				$task = mapi_attach_openobj($attach);
			}
			catch (MAPIException $e) {
				continue;
			}

			$taskGoid = mapi_getprops($task, [$this->props["task_goid"]]);
			if ($goid[$this->props["task_goid"]] === $taskGoid[$this->props["task_goid"]]) {
				mapi_setprops($attach, [PR_ATTACHMENT_HIDDEN => true]);
				mapi_savechanges($attach);
				mapi_savechanges($this->message);
				break;
			}
		}

		return $task;
	}

	/**
	 * Sets the user name who has last used this task. Update the
	 * tasklastdelegate and task_assigned_time.
	 */
	public function setLastUser() {
		$delegatestore = $this->getDefaultStore();
		$taskstore = $this->getTaskFolderStore();

		$delegateprops = mapi_getprops($delegatestore, [PR_MAILBOX_OWNER_NAME]);
		$taskprops = mapi_getprops($taskstore, [PR_MAILBOX_OWNER_NAME]);

		// The owner of the task
		$username = $delegateprops[PR_MAILBOX_OWNER_NAME];
		// This is me (the one calling the script)
		$delegate = $taskprops[PR_MAILBOX_OWNER_NAME];

		if ($this->isTaskRequest()) {
			$task = $this->getAssociatedTask(false);
			mapi_setprops($task, [
				$this->props["tasklastuser"] => $username,
				$this->props["tasklastdelegate"] => $delegate,
				$this->props['task_assigned_time'] => time(),
			]);
			mapi_savechanges($task);
		}
		mapi_setprops($this->message, [
			$this->props["tasklastuser"] => $username,
			$this->props["tasklastdelegate"] => $delegate,
			$this->props['task_assigned_time'] => time(),
		]);
	}

	/**
	 * Sets assignee as owner in the assignor's copy of task.
	 * Assignee becomes the owner when a user/assignor assigns any task to someone.
	 * There can be more than one assignee.
	 */
	public function setOwnerForAssignor() {
		$recipTable = mapi_message_getrecipienttable($this->message);
		$recips = mapi_table_queryallrows($recipTable, [PR_DISPLAY_NAME]);

		if (!empty($recips)) {
			$owner = [];
			foreach ($recips as $value) {
				$owner[] = $value[PR_DISPLAY_NAME];
			}

			$props = [$this->props['owner'] => implode("; ", $owner)];
			mapi_setprops($this->message, $props);
		}
	}

	/**
	 * Sets assignor as recipients in assignee's copy of task.
	 *
	 * If assignor has requested task updates then the assignor is added as recipient type MAPI_CC.
	 *
	 * Also if assignor has request SOC then the assignor is also add as recipient type MAPI_BCC
	 *
	 * @param mixed $task assignee's copy of task
	 */
	public function setAssignorInRecipients($task) {
		$recipTable = mapi_message_getrecipienttable($task);

		// Delete all MAPI_TO recipients
		$recips = mapi_table_queryallrows($recipTable, [PR_ROWID], [
			RES_PROPERTY,
			[
				RELOP => RELOP_EQ,
				ULPROPTAG => PR_RECIPIENT_TYPE,
				VALUE => MAPI_TO,
			],
		]);
		foreach ($recips as $recip) {
			mapi_message_modifyrecipients($task, MODRECIP_REMOVE, [$recip]);
		}

		$recips = [];
		$taskReqProps = mapi_getprops($this->message, [
			PR_SENT_REPRESENTING_NAME,
			PR_SENT_REPRESENTING_EMAIL_ADDRESS,
			PR_SENT_REPRESENTING_ENTRYID,
			PR_SENT_REPRESENTING_ADDRTYPE,
			PR_SENT_REPRESENTING_SEARCH_KEY,
		]);
		$associatedTaskProps = mapi_getprops($task, [
			$this->props['taskupdates'],
			$this->props['tasksoc'],
			$this->props['taskmultrecips'],
		]);

		// Build assignor info
		$assignor = [
			PR_ENTRYID => $taskReqProps[PR_SENT_REPRESENTING_ENTRYID],
			PR_DISPLAY_NAME => $taskReqProps[PR_SENT_REPRESENTING_NAME],
			PR_EMAIL_ADDRESS => $taskReqProps[PR_SENT_REPRESENTING_EMAIL_ADDRESS],
			PR_RECIPIENT_DISPLAY_NAME => $taskReqProps[PR_SENT_REPRESENTING_NAME],
			PR_ADDRTYPE => empty($taskReqProps[PR_SENT_REPRESENTING_ADDRTYPE]) ? 'SMTP' : $taskReqProps[PR_SENT_REPRESENTING_ADDRTYPE],
			PR_RECIPIENT_FLAGS => recipSendable,
			PR_SEARCH_KEY => $taskReqProps[PR_SENT_REPRESENTING_SEARCH_KEY],
		];

		// Assignor has requested task updates, so set him/her as MAPI_CC in recipienttable.
		if ((isset($associatedTaskProps[$this->props['taskupdates']]) && $associatedTaskProps[$this->props['taskupdates']]) &&
			!(isset($associatedTaskProps[$this->props['taskmultrecips']]) && $associatedTaskProps[$this->props['taskmultrecips']] == tmrReceived)) {
			$assignor[PR_RECIPIENT_TYPE] = MAPI_CC;
			$recips[] = $assignor;
		}

		// Assignor wants to receive an email report when task is mark as 'Complete', so in recipients as MAPI_BCC
		if ($associatedTaskProps[$this->props['tasksoc']]) {
			$assignor[PR_RECIPIENT_TYPE] = MAPI_BCC;
			$recips[] = $assignor;
		}

		if (!empty($recips)) {
			mapi_message_modifyrecipients($task, MODRECIP_ADD, $recips);
		}
	}

	/**
	 * Deletes incoming task request from Inbox.
	 *
	 * @returns array|bool PR_ENTRYID, PR_STORE_ENTRYID and PR_PARENT_ENTRYID of the deleted task request
	 */
	public function deleteReceivedTR() {
		$store = $this->getTaskFolderStore();
		$storeType = mapi_getprops($store, [PR_MDB_PROVIDER]);
		if ($storeType[PR_MDB_PROVIDER] === ZARAFA_STORE_PUBLIC_GUID) {
			$store = $this->getDefaultStore();
		}
		$inbox = mapi_msgstore_getreceivefolder($store);

		$storeProps = mapi_getprops($store, [PR_IPM_WASTEBASKET_ENTRYID]);
		$props = mapi_getprops($this->message, [$this->props['task_goid']]);
		$goid = $props[$this->props['task_goid']];

		// Find the task by looking for the task_goid
		$restriction = [
			RES_PROPERTY,
			[
				RELOP => RELOP_EQ,
				ULPROPTAG => $this->props['task_goid'],
				VALUE => $goid,
			],
		];

		$contents = mapi_folder_getcontentstable($inbox);

		$rows = mapi_table_queryallrows($contents, [PR_ENTRYID, PR_PARENT_ENTRYID, PR_STORE_ENTRYID], $restriction);

		if (!empty($rows)) {
			// If there are multiple, just use the first
			$entryid = $rows[0][PR_ENTRYID];
			$wastebasket = mapi_msgstore_openentry($store, $storeProps[PR_IPM_WASTEBASKET_ENTRYID]);
			mapi_folder_copymessages($inbox, [$entryid], $wastebasket, MESSAGE_MOVE);

			return [PR_ENTRYID => $entryid, PR_PARENT_ENTRYID => $rows[0][PR_PARENT_ENTRYID], PR_STORE_ENTRYID => $rows[0][PR_STORE_ENTRYID]];
		}

		return false;
	}

	/**
	 * Sets recipients for the outgoing message according to type of the response.
	 *
	 * If it is a task update, then only recipient type MAPI_CC are taken from the task message.
	 *
	 * If it is accept/decline response, then PR_SENT_REPRESENTATING_XXXX are taken as recipient.
	 *
	 * @param mixed $outgoing     outgoing mapi message
	 * @param int   $responseType response type (tdmtTaskAcc, tdmtTaskDec, tdmtTaskUpd)
	 */
	public function setRecipientsForResponse($outgoing, $responseType) {
		// Clear recipients from outgoing msg
		$this->deleteAllRecipients($outgoing);

		// If it is a task update then get MAPI_CC recipients which are assignors who has asked for task update.
		if ($responseType == tdmtTaskUpd) {
			$props = mapi_getprops($this->message, [$this->props['complete']]);
			$isComplete = $props[$this->props['complete']];

			$recipTable = mapi_message_getrecipienttable($this->message);
			$recips = mapi_table_queryallrows($recipTable, $this->recipProps, [
				RES_PROPERTY,
				[
					RELOP => RELOP_EQ,
					ULPROPTAG => PR_RECIPIENT_TYPE,
					VALUE => ($isComplete ? MAPI_BCC : MAPI_CC),
				],
			]);

			// No recipients found, return error
			if (empty($recips)) {
				return false;
			}

			foreach ($recips as $recip) {
				$recip[PR_RECIPIENT_TYPE] = MAPI_TO;	// Change recipient type to MAPI_TO
				mapi_message_modifyrecipients($outgoing, MODRECIP_ADD, [$recip]);
			}

			return true;
		}

		$orgprops = mapi_getprops($this->message, [
			PR_SENT_REPRESENTING_NAME,
			PR_SENT_REPRESENTING_EMAIL_ADDRESS,
			PR_SENT_REPRESENTING_ADDRTYPE,
			PR_SENT_REPRESENTING_ENTRYID,
			PR_SUBJECT,
		]);

		$recip = [
			PR_DISPLAY_NAME => $orgprops[PR_SENT_REPRESENTING_NAME],
			PR_EMAIL_ADDRESS => $orgprops[PR_SENT_REPRESENTING_EMAIL_ADDRESS],
			PR_ADDRTYPE => $orgprops[PR_SENT_REPRESENTING_ADDRTYPE],
			PR_ENTRYID => $orgprops[PR_SENT_REPRESENTING_ENTRYID],
			PR_RECIPIENT_TYPE => MAPI_TO, ];

		mapi_message_modifyrecipients($outgoing, MODRECIP_ADD, [$recip]);

		return true;
	}

	/**
	 * Deletes all recipients from given message object.
	 *
	 * @param mixed $message MAPI message from which recipients are to be removed
	 */
	public function deleteAllRecipients($message) {
		$recipTable = mapi_message_getrecipienttable($message);
		$recipRows = mapi_table_queryallrows($recipTable, [PR_ROWID]);

		foreach ($recipRows as $recipient) {
			mapi_message_modifyrecipients($message, MODRECIP_REMOVE, [$recipient]);
		}
	}

	/**
	 * Marks the record to complete and send complete update
	 * notification to assigner.
	 *
	 * @return bool TRUE if the update succeeded, FALSE otherwise
	 */
	public function sendCompleteUpdate() {
		$messageprops = mapi_getprops($this->message, [$this->props['taskstate']]);

		if (!isset($messageprops[$this->props['taskstate']]) || $messageprops[$this->props['taskstate']] != tdsOWN) {
			return false; // Can only decline assignee task
		}

		mapi_setprops($this->message, [
			$this->props['complete'] => true,
			$this->props['datecompleted'] => time(),
			$this->props['status'] => 2,
			$this->props['percent_complete'] => 1,
		]);

		return $this->doUpdate();
	}

	/**
	 * Returns extra info about task request comments along with message body
	 * which will be included in body while sending task request/response.
	 *
	 * @return string info about task request comments along with message body
	 */
	public function getTaskCommentsInfo() {
		return $this->taskCommentsInfo;
	}

	/**
	 * Sets an extra info about task request comments along with message body
	 * which will be included in body while sending task request/response.
	 *
	 * @param string $taskCommentsInfo info about task request comments along with message body
	 */
	public function setTaskCommentsInfo($taskCommentsInfo) {
		$this->taskCommentsInfo = $taskCommentsInfo;
	}

	public function getSubProperties() {
		$subProperties = [];
		$subProperties["subject"] = PR_SUBJECT;
		$subProperties["convtopic"] = PR_CONVERSATION_TOPIC;
		$subProperties["complete"] = "PT_BOOLEAN:PSETID_Task:" . PidLidTaskComplete;
		$subProperties["datecompleted"] = "PT_SYSTIME:PSETID_Task:" . PidLidTaskDateCompleted;
		$subProperties["recurring"] = "PT_BOOLEAN:PSETID_Task:0x8126";
		$subProperties["startdate"] = "PT_SYSTIME:PSETID_Task:" . PidLidTaskStartDate;
		$subProperties["duedate"] = "PT_SYSTIME:PSETID_Task:" . PidLidTaskDueDate;
		$subProperties["status"] = "PT_LONG:PSETID_Task:" . PidLidTaskStatus;
		$subProperties["percent_complete"] = "PT_DOUBLE:PSETID_Task:" . PidLidPercentComplete;
		$subProperties["totalwork"] = "PT_LONG:PSETID_Task:0x8111";
		$subProperties["actualwork"] = "PT_LONG:PSETID_Task:0x8110";
		$subProperties["categories"] = "PT_MV_STRING8:PS_PUBLIC_STRINGS:Keywords";
		$subProperties["companies"] = "PT_MV_STRING8:PSETID_Common:0x8539";
		$subProperties["mileage"] = "PT_STRING8:PSETID_Common:0x8534";
		$subProperties["billinginformation"] = "PT_STRING8:PSETID_Common:0x8535";

		return getPropIdsFromStrings($this->store, $subProperties);
	}
}
