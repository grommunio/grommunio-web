<?php

/**
 * TestGroup
 *
 * A wrapper around the KopanoUser which adds utility functions.
 * This wrapper allows us to use KOPANO group, e.g. mail to it
 */
class TestGroup {

	/**
	 * The KopanoUser object, this is the oject used to logon
	 * to the server with, and will access the group in the address book
	 */
	private $user;

	/**
	 * The groupname
	 */
	protected $groupname;

	/**
	 * Constructor
	 * @param String $name The name of the group
	 * @param KopanoUser $user The user to login with
	 */
	public function __construct($name, $user)
	{
		$this->groupname = $name;
		$this->user = $user;
		$this->initialize();
	}

	/**
	 * Initialize the TestUser.
	 * Should be overridden by subclasses
	 */
	protected function initialize()
	{
	}

	/**
	 * Obtain the Recipient object for this user from a PHP response message
	 * @param array $message The message from where the recipient
	 * should be obtained
	 * @return array The recipient
	 */
	public function getRecipientFromMessage($message)
	{
		$groupname = $this->groupname;

		if (isset($message['recipients']) && isset($message['recipients']['item'])) {
			$props = Util::pluckFromObject($message['recipients']['item'], 'props');
			$index = Util::indexInArray($props, 'email_address', $groupname);
			if ($index >= 0) {
				return $message['recipients']['item'][$index];
			}
		}

		return null;
	}

	/**
	 * Convert the current group into a recipient object which can
	 * be used to send messages to.
	 * @param Number $recipientType The recipient type (defaults to MAPI_TO)
	 * @return Array The recipient object
	 */
	public function getRecipient($recipientType = MAPI_TO)
	{
		$this->user->logon();

		$group = $this->getGroupProps();

		return array(
			'entryid' => bin2hex($group[PR_ENTRYID]),
			'object_type' => $group[PR_OBJECT_TYPE],
			'display_name' => $group[PR_DISPLAY_NAME],
			'email_address' => $group[PR_EMAIL_ADDRESS],
			'smtp_address' => isset($group[PR_SMTP_ADDRESS]) ? $group[PR_SMTP_ADDRESS] : '',
			'address_type' => $group[PR_ADDRTYPE],
			'recipient_type' => $recipientType,
			'recipient_flags' => recipSendable,
			'display_type' => isset($group[PR_DISPLAY_TYPE]) ? $group[PR_DISPLAY_TYPE] : DT_DISTLIST,
			'display_type_ex' => isset($group[PR_DISPLAY_TYPE_EX]) ? $group[PR_DISPLAY_TYPE_EX] : DTE_FLAG_ACL_CAPABLE,
			'search_key' => bin2hex($group[PR_SEARCH_KEY]),
		);
	}

	/**
	 * Returns properties of the group
	 * @param Array $tags properties of group that should be returned
	 * @return Array The properties of group
	 */
	public function getGroupProps($tags = array())
	{
		$this->user->logon();

		$props = array();
		$groupEntryId = $this->getGroupEntryID();

		if ($groupEntryId) {
			// open the group entry
			$group = mapi_ab_openentry($this->user->getAddressbook(), $groupEntryId);

			// receive groupdata
			if (!empty($tags)) {
				$props = mapi_getprops($group, $tags);
			} else {
				$props = mapi_getprops($group);
			}
		}

		return $props;
	}

	/**
	 * Returns entryid of the group
	 * @return BinString entryid
	 */
	public function getGroupEntryID()
	{
		$this->user->logon();

		$addressbook = $this->user->getAddressbook();

		$rows = mapi_ab_resolvename($addressbook, array ( array(PR_DISPLAY_NAME => $this->groupname) ) , 0 );
		if (count($rows) == 1 && isset($rows[0][PR_ENTRYID])) {
			return $rows[0][PR_ENTRYID];
		}
	}
}
?>
