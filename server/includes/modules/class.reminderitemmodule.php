<?php

/**
 * Reminder ItemModule
 * Module which saves an item and it
 * extends the CreateMailItemModule class.
 */
class ReminderItemModule extends ItemModule
{
    /**
     * Constructor
     * @param int $id unique id.
     * @param array $data list of all actions.
     */
    function __construct($id, $data)
    {
        parent::__construct($id, $data);
    }

    /**
     * Function is use to set message flags for flagged mail item.
     * @param object $store MAPI Message Store Object
     * @param string $parententryid parent entryid of the message
     * @param string $entryid entryid of the message
     * @param array $action the action data, sent by the client
     * @return boolean true on success or false on failure
     */
    function save($store, $parententryid, $entryid, $action)
    {
        $this->properties = $GLOBALS['properties']->getMailProperties();
        $result = false;

        if (!$store) {
            $store = $GLOBALS['mapisession']->getDefaultMessageStore();
        }

        if ($store) {
            // Reference to an array which will be filled with PR_ENTRYID, PR_STORE_ENTRYID and PR_PARENT_ENTRYID of the message
            $messageProps = array();

            // Set message flags
            if (isset($action['props']) && isset($action['props']['message_flags']) && $entryid) {
                $msg_action = isset($action['message_action']) ? $action['message_action'] : false;
                $result = $GLOBALS['operations']->setMessageFlag($store, $entryid, $action['props']['message_flags'], $msg_action, $messageProps);
            }

            // Feedback for successful save
            if ($result) {
                $GLOBALS['bus']->notify(bin2hex($messageProps[PR_PARENT_ENTRYID]), TABLE_SAVE, $messageProps);
            }

            $this->sendFeedback($result ? true : false, array(), true);
        }
    }

    /**
     * Function which is use to dismiss or snooze the reminder item.
     * @param object $store MAPI Message Store Object
     * @param string $parententryid parent entryid of the message
     * @param string $entryid entryid of the message
     * @param array $action the action data, sent by the client
     * @return boolean true on success or false on failure
     */
    function delete($store, $parententryid, $entryid, $action)
    {
        $this->properties = $GLOBALS["properties"]->getReminderProperties();

        if(!$store) {
            $store = $GLOBALS["mapisession"]->getDefaultMessageStore();
        }

        $subActionType = false;
        if (isset($action["message_action"]) && isset($action["message_action"]["action_type"])) {
            $subActionType = $action["message_action"]["action_type"];
        }

        switch ($subActionType) {
            case "snooze":
                $entryid = $this->getActionEntryID($action);
                $this->snoozeItem($store, $entryid, $action);
                break;
            case "dismiss":
                $entryid = $this->getActionEntryID($action);
                $this->dismissItem($store, $entryid);
                break;
            default:
                $this->handleUnknownActionType($subActionType);
        }
    }

    /**
     * Function which is use to snooze the reminder for given time
     * @param object $store MAPI Message Store Object
     * @param string $entryid entryid of the message
     * @param array $action the action data, sent by the client
     */
    function snoozeItem($store, $entryid, $action)
    {
        $result = false;
        $message = mapi_msgstore_openentry($store, $entryid);
        if ($message) {
            $newProps = array(PR_ENTRYID => $entryid);
            $props = mapi_getprops($message, $this->properties);

            $snoozeTime = $GLOBALS["settings"]->get('zarafa/v1/main/reminder/default_snooze_time', 5);
            if (isset($action["message_action"]["snoozeTime"]) && is_numeric($action["message_action"]["snoozeTime"])) {
                $snoozeTime = $action["message_action"]["snoozeTime"];
            }

            $reminderTime = time() + ($snoozeTime * 60);
            if (stripos($props[$this->properties["message_class"]], "IPM.Appointment") === 0) {
                if (isset($props[$this->properties["appointment_recurring"]]) && $props[$this->properties["appointment_recurring"]]) {

                    $recurrence = new Recurrence($store, $message);
                    $nextReminder = $recurrence->getNextReminderTime(time());

                    // flagdueby must be the snooze time or the time of the next instance, whichever is earlier
                    if ($reminderTime < $nextReminder)
                        $newProps[$this->properties["flagdueby"]] = $reminderTime;
                    else
                        $newProps[$this->properties["flagdueby"]] = $nextReminder;
                } else {
                    $newProps[$this->properties["flagdueby"]] = $reminderTime;
                }
            } else {
                $newProps[$this->properties["flagdueby"]] = $reminderTime;
            }

            // save props
            mapi_setprops($message, $newProps);
            mapi_savechanges($message);

            $result = true;
        }

        if ($result) {
            /**
             * @FIXME: Fix notifications for reminders.
             * Notifications are currently disabled, because deleting multiple items will notify
             * hierarchy multiple time but no data is changed with folder item in hierarchy.
             * so it will push same data again which will lead to an error.
             */
            //$props = mapi_getprops($message, array(PR_ENTRYID, PR_PARENT_ENTRYID, PR_STORE_ENTRYID));
            //$GLOBALS["bus"]->notify(bin2hex($props[PR_PARENT_ENTRYID]), TABLE_SAVE, $props);
        }
        $this->sendFeedback($result);
    }

    /**
     * Function which is use to dismiss the reminder
     * @param object $store MAPI Message Store Object
     * @param string $entryid entryid of the message
     */
    function dismissItem($store, $entryid)
    {
        $result = false;
        $message = mapi_msgstore_openentry($store, $entryid);
        if ($message) {
            $newProps = array();
            $props = mapi_getprops($message, $this->properties);

            if (stripos($props[$this->properties["message_class"]], "IPM.Appointment") === 0) {
                if (isset($props[$this->properties["appointment_recurring"]]) && $props[$this->properties["appointment_recurring"]]) {

                    $recurrence = new Recurrence($store, $message);
                    // check for next reminder after "now" for the next instance
                    $nextReminder = $recurrence->getNextReminderTime(time());
                    if ($nextReminder)
                        $newProps[$this->properties["flagdueby"]] = $nextReminder;
                    else
                        $newProps[$this->properties["reminder"]] = false;
                } else {
                    $newProps[$this->properties["reminder"]] = false;
                }
            } else if (stripos($props[$this->properties["message_class"]], "IPM.Task") === 0) {
                $newProps[$this->properties["reminder"]] = false;

                if (isset($props[$this->properties['task_recurring']]) && $props[$this->properties['task_recurring']] == 1) {
                    $newProps[$this->properties['task_resetreminder']] = true;
                }
            } else {
                $newProps[$this->properties["reminder"]] = false;
            }

            // save props
            mapi_setprops($message, $newProps);
            mapi_savechanges($message);

            $result = true;
        }

        if ($result) {
            /**
             * @FIXME: Fix notifications for reminders.
             * Notifications are currently disabled, because deleting multiple items will notify
             * hierarchy multiple time but no data is changed with folder item in hierarchy.
             * so it will push same data again which will lead to an error.
             */
            //$props = mapi_getprops($message, array(PR_ENTRYID, PR_PARENT_ENTRYID, PR_STORE_ENTRYID));
            //$GLOBALS["bus"]->notify(bin2hex($props[PR_PARENT_ENTRYID]), TABLE_SAVE, $props);
        }
        $this->sendFeedback($result);
    }

    /**
     * Function does customization of exception based on module data.
     * like, here it will generate display message based on actionType
     * for particular exception.
     *
     * @param object $e Exception object
     * @param string $actionType the action type, sent by the client
     * @param MAPIobject $store Store object of message.
     * @param string $parententryid parent entryid of the message.
     * @param string $entryid entryid of the message.
     * @param array $action the action data, sent by the client
     */
    function handleException(&$e, $actionType = null, $store = null, $parententryid = null, $entryid = null, $action = null)
    {
        if (is_null($e->displayMessage)) {
            switch ($actionType) {
                case 'delete':
                    if (!empty($action['message_action']['action_type'])) {
                        switch ($action['message_action']['action_type']) {
                            case 'snooze':
                                if ($e->getCode() == MAPI_E_STORE_FULL) {
                                    $e->setDisplayMessage(_('Cannot snooze the reminder. You may be reminded again.') . '<br />' . $this->getOverQuotaMessage($store));
                                } else {
                                    $e->setDisplayMessage(_('Cannot snooze the reminder. You may be reminded again.'));
                                }
                                break;
                            case 'dismiss':
                                if ($e->getCode() == MAPI_E_STORE_FULL) {
                                    $e->setDisplayMessage(_('Cannot dismiss the reminder. You may be reminded again.') . '<br />' . $this->getOverQuotaMessage($store));
                                } else {
                                    $e->setDisplayMessage(_('Cannot dismiss the reminder. You may be reminded again.'));
                                }
                                break;
                        }
                    }
                    break;
            }
        }

        parent::handleException($e, $actionType, $store, $parententryid, $entryid, $action);
    }
}

?>
