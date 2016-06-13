<?php
	/**
	 * NewMailNotifier
	 *
	 * Generates notifications for receiving new mail.
	 * This frequently checks the unread count of the
	 * default inbox, and will generate newMail events
	 * accordingly.
	 */
	class NewMailNotifier extends Notifier
	{
		/**
		 * The inbox folder which will be polled for unread messages
		 */
		private $inbox;

		/**
		 * The number of unread items since the last request,
		 * this value is persistent and will not be cleared during
		 * reset.
		 */
		private $lastUnread;

		public function __construct()
		{
			parent::__construct();
			$this->lastUnread = false;
		}

		/**
		 * @return Number Return the bitmask of events which are handled
		 * by this notifier. The bitmask can consist of the 
		 * OBJECT_SAVE, OBJECT_DELETE, TABLE_SAVE, TABLE_DELETE, REQUEST_START and REQUEST_END flags
		 */
		public function getEvents()
		{
			return REQUEST_START | REQUEST_END;
		}

		/**
		 * Function which resets the data and the response data class variable.
		 */
		public function reset()
		{
			parent::reset();
			$this->inbox = false;
		}

		/**
		 * If an event elsewhere has occurred, it enters in this methode. This method
		 * executes one ore more actions, depends on the event.
		 * @param int $event Event.
		 * @param string $entryid Entryid.
		 * @param array $data array of data.
		 */
		public function update($event, $entryid, $props)
		{
			switch ($event) {
				case REQUEST_START:
					$this->inbox = mapi_msgstore_getreceivefolder($GLOBALS["mapisession"]->getDefaultMessageStore());

					$newmail = $this->checkNewMail($this->inbox);
					if ($newmail != false) {
						$inboxProps = mapi_getprops($this->inbox, array(PR_ENTRYID, PR_STORE_ENTRYID, PR_CONTENT_COUNT, PR_CONTENT_UNREAD, PR_DISPLAY_NAME));

						$data = array(
							"item" => array(
								// Currenly only the inbox is checked, but in the future this will be expanded to multiple folders.
								array(
									"content_count" => $inboxProps[PR_CONTENT_COUNT],
									"content_unread" => $inboxProps[PR_CONTENT_UNREAD],
									// Add store_entryid,entryid of folder and display_name of folder 
									// to JSON data in order to refresh the list.
									"store_entryid" => bin2hex($inboxProps[PR_STORE_ENTRYID]),
									"entryid" => bin2hex($inboxProps[PR_ENTRYID]),
									"display_name" => $inboxProps[PR_DISPLAY_NAME]
								)
							)
						);

						$this->addNotificationActionData("newmail", $data);
						$GLOBALS["bus"]->addData($this->createNotificationResponseData());
					}
					break;
				case REQUEST_END:
					// The inbox is only initialized when we have run the REQUEST_START handler, if we haven't
					// then there is no point to run the REQUEST_END handler either. Note that the only scenario
					// where this might occur is the request in which the notifier was registered, and we don't
					// expect to generate new mail notifications during that request anyway.
					if ($this->inbox) {
						// Update unread counter now, so that any changes that we have done ourselved (for example
						// moving an unread e-mail into the inbox) will not be detected by the newMail detection in
						// REQUEST_START. We're not interested in the return value though.
						$this->checkNewMail($this->inbox);

						//TODO add update for the counters of the quota.
					}
					break;
			}
		}

		/**
		 * Function will check 'inbox' folder for new mails.
		 * initially we store PR_CONTENT_UNREAD count property of inbox folder to module
		 * then every time we compare that property with new value and if its changed then
		 * we can assume that new mail has arrived
		 * @param MAPIFolder $inbox inbox folder
		 * @return boolean true if count is change else false.
		 */
		private function checkNewMail($inbox)
		{
			$result = false;

			$inboxprops = mapi_getprops($inbox, array(PR_CONTENT_UNREAD));
			if ($this->lastUnread !== false) {
				$result = !!($this->lastUnread < $inboxprops[PR_CONTENT_UNREAD]);
			}

			$this->lastUnread = $inboxprops[PR_CONTENT_UNREAD];
			return $result;
		}
	}
?>
