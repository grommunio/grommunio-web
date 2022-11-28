<?php

// required to handle php errors
require_once __DIR__ . '/exceptions/class.ZarafaErrorException.php';
require_once __DIR__ . '/exceptions/class.ZarafaException.php';

/**
 * Upload Attachment
 * This file is used to upload.
 */
class UploadAttachment {
	/**
	 * A random string that will be generated with every MAPIMessage instance to uniquely identify attachments that
	 * belongs to this MAPIMessage, this is mainly used to get recently uploaded attachments for MAPIMessage.
	 */
	protected $dialogAttachments;

	/**
	 * Entryid of the MAPIStore which holds the message to which we need to import.
	 */
	protected $storeId;

	/**
	 * Resource of the MAPIStore which holds the message to which we need to import.
	 */
	protected $store;

	/**
	 * Entryid of the MAPIFolder which holds the message.
	 */
	protected $destinationFolderId;

	/**
	 * Resource of the MAPIFolder which holds the message which we need to import from file.
	 */
	protected $destinationFolder;

	/**
	 * A boolean value, set to false by default, to define if the attachment needs to be imported into folder as webapp item.
	 */
	protected $import;

	/**
	 * Object of AttachmentState class.
	 */
	protected $attachment_state;

	/**
	 * A boolean value, set to true by default which update the counter of the folder.
	 */
	protected $allowUpdateCounter;

	/**
	 * A boolean value, set to false by default which extract the attach id concatenated with attachment name
	 * from the client side.
	 */
	protected $ignoreExtractAttachid;

	/**
	 * A string value which stores the module name of the notifier according to the file type.
	 */
	protected $notifierModule;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->dialogAttachments = false;
		$this->storeId = false;
		$this->destinationFolder = false;
		$this->destinationFolderId = false;
		$this->store = false;
		$this->import = false;
		$this->attachment_state = false;
		$this->allowUpdateCounter = true;
		$this->ignoreExtractAttachid = false;
	}

	/**
	 * Function will initialize data for this class object. It will also sanitize data
	 * for possible XSS attack because data is received in $_REQUEST.
	 *
	 * @param array $data parameters received with the request
	 */
	public function init($data) {
		if (isset($data['dialog_attachments'])) {
			$this->dialogAttachments = sanitizeValue($data['dialog_attachments'], '', ID_REGEX);
		}

		if (isset($data['store'])) {
			$this->storeId = sanitizeValue($data['store'], '', STRING_REGEX);
		}

		if (isset($data['destination_folder'])) {
			$this->destinationFolderId = sanitizeValue($data['destination_folder'], '', STRING_REGEX);
		}

		if ($this->storeId) {
			$this->store = $GLOBALS['mapisession']->openMessageStore(hex2bin($this->storeId));
		}

		if (isset($data['import'])) {
			$this->import = sanitizeValue($data['import'], '', STRING_REGEX);
		}

		if (isset($data['ignore_extract_attachid'])) {
			$this->ignoreExtractAttachid = sanitizeValue($data['ignore_extract_attachid'], '', STRING_REGEX);
		}

		if ($this->attachment_state === false) {
			$this->attachment_state = new AttachmentState();
		}
	}

	/**
	 * Function get Files received in request, extract necessary information
	 * and holds the same using an instance of AttachmentState class.
	 */
	public function processFiles() {
		if (isset($_FILES['attachments']['name']) && is_array($_FILES['attachments']['name'])) {
			$importStatus = false;
			$returnfiles = [];

			// Parse all information from the updated files,
			// validate the contents and add it to the $FILES array.
			foreach ($_FILES['attachments']['name'] as $key => $name) {
				// validate the FILE object to see if the size doesn't exceed
				// the configured MAX_FILE_SIZE
				$fileSize = $_FILES['attachments']['size'][$key];
				if (isset($_FILES['attachments']['error'][$key]) && $_FILES['attachments']['error'][$key] > 0) {
					$errorTitle = _("File is not imported successfully");

					switch ($_FILES['attachments']['error'][$key]) {
						case UPLOAD_ERR_INI_SIZE:
							$errorTitle = _('The uploaded file exceeds the upload_max_filesize directive in php.ini.');
							break;

						case UPLOAD_ERR_FORM_SIZE:
							$errorTitle = _('The uploaded file exceeds the MAX_FILE_SIZE directive that was specified in the HTML form.');
							break;

						case UPLOAD_ERR_PARTIAL:
							$errorTitle = _('The uploaded file was only partially uploaded.');
							break;

						case UPLOAD_ERR_NO_FILE:
							$errorTitle = _('No file was uploaded. .');
							break;

						case UPLOAD_ERR_NO_TMP_DIR:
							$errorTitle = _('Missing a temporary folder.');
							break;

						case UPLOAD_ERR_CANT_WRITE:
							$errorTitle = _('Failed to write file to disk.');
							break;

						case UPLOAD_ERR_EXTENSION:
							$errorTitle = _('A PHP extension stopped the file upload. PHP does not provide a way to ascertain which extension caused the file upload to stop; examining the list of loaded extensions with phpinfo() may help.');
							break;
					}

					throw new ZarafaException($errorTitle);
				}
				if (isset($fileSize) && !(isset($_POST['MAX_FILE_SIZE']) && $fileSize > $_POST['MAX_FILE_SIZE'])) {
					// Parse the filename, strip it from
					// any illegal characters.
					$filename = mb_basename(stripslashes($_FILES['attachments']['name'][$key]));

					// set sourcetype as default if sourcetype is unset.
					$sourcetype = isset($_POST['sourcetype']) ? $_POST['sourcetype'] : 'default';

					/**
					 * content-type sent by browser for eml and ics attachments will be
					 * message/rfc822 and text/calendar respectively, but these content types are
					 * used for message-in-message embedded objects, so we have to send it as
					 * application/octet-stream.
					 */
					$fileType = $_FILES['attachments']['type'][$key];
					if ($fileType == 'message/rfc822' || $fileType == 'text/calendar') {
						$fileType = 'application/octet-stream';
					}

					// Don't go to extract attachID as passing it from client end is not
					// possible with IE/Edge.
					if (!isIE11() && !isEdge() && $this->ignoreExtractAttachid === false) {
						$attachID = substr($filename, -8);
						$filename = substr($filename, 0, -8);
					}
					else {
						$attachID = uniqid();
					}

					// Move the uploaded file into the attachment state
					$attachTempName = $this->attachment_state->addUploadedAttachmentFile($_REQUEST['dialog_attachments'], $filename, $_FILES['attachments']['tmp_name'][$key], [
						'name' => $filename,
						'size' => $fileSize,
						'type' => $fileType,
						'sourcetype' => $sourcetype,
						'attach_id' => $attachID,
					]);

					// Allow hooking in to handle import in plugins
					$GLOBALS['PluginManager']->triggerHook('server.upload_attachment.upload', [
						'tmpname' => $this->attachment_state->getAttachmentPath($attachTempName),
						'name' => $filename,
						'size' => $fileSize,
						'sourcetype' => $sourcetype,
						'returnfiles' => &$returnfiles,
						'attach_id' => $attachID,
					]);

					// import given files
					if ($this->import) {
						$importStatus = $this->importFiles($attachTempName, $filename, isset($_POST['has_icsvcs_file']) ? $_POST['has_icsvcs_file'] : false);
					}
					elseif ($sourcetype === 'contactphoto' || $sourcetype === 'default') {
						$fileData = [
							'props' => [
								'attach_num' => -1,
								'tmpname' => $attachTempName,
								'attach_id' => $attachID,
								'name' => $filename,
								'size' => $fileSize,
							],
						];

						if ($sourcetype === 'contactphoto') {
							$fileData['props']['attachment_contactphoto'] = true;
						}

						$returnfiles[] = $fileData;
					}
					else {
						// Backwards compatibility for Plugins (S/MIME)
						$lastKey = count($returnfiles) - 1;
						if ($lastKey >= 0) {
							$returnfiles[$lastKey]['props']['attach_id'] = $attachID;
						}
					}
				}
			}

			if ($this->import) {
				if ($importStatus !== false) {
					$this->sendImportResponse($importStatus);
				}
				else {
					throw new ZarafaException(_("File is not imported successfully"));
				}
			}
			else {
				$return = [
					'success' => true,
					'zarafa' => [
						sanitizeGetValue('module', '', STRING_REGEX) => [
							sanitizeGetValue('moduleid', '', STRING_REGEX) => [
								'update' => [
									'item' => $returnfiles,
								],
							],
						],
					],
				];

				echo json_encode($return);
			}
		}
	}

	/**
	 * Function reads content of the given file and call either importICSFile or importEMLFile
	 * function based on the file type.
	 *
	 * @param string $attachTempName a temporary file name of server location where it actually saved/available
	 * @param string $filename       an actual file name
	 *
	 * @return bool true if the import is successful, false otherwise
	 */
	public function importFiles($attachTempName, $filename) {
		$filepath = $this->attachment_state->getAttachmentPath($attachTempName);
		$handle = fopen($filepath, "r");
		$attachmentStream = '';
		while (!feof($handle)) {
			$attachmentStream .= fread($handle, BLOCK_SIZE);
		}

		fclose($handle);
		unlink($filepath);

		$extension = pathinfo($filename, PATHINFO_EXTENSION);

		// Set the module id of the notifier according to the file type
		switch (strtoupper($extension)) {
			case 'EML':
				$this->notifierModule = 'maillistnotifier';

				return $this->importEMLFile($attachmentStream, $filename);
				break;

			case 'ICS':
			case 'VCS':
				$this->notifierModule = 'appointmentlistnotifier';

				return $this->importICSFile($attachmentStream, $filename);
				break;

			case 'VCF':
				$this->notifierModule = 'contactlistnotifier';

				return $this->importVCFFile($attachmentStream, $filename);
				break;
		}
	}

	/**
	 * Function reads content of the given file and convert the same into
	 * a webapp contact or multiple contacts into respective destination folder.
	 *
	 * @param string $attachmentStream the attachment as a stream
	 * @param string $filename         an actual file name
	 *
	 * @return array the new contact to be imported
	 */
	public function importVCFFile($attachmentStream, $filename) {
		$this->destinationFolder = $this->getDestinationFolder();

		try {
			processVCFStream($attachmentStream);
			// Convert vCard 1.0 to a MAPI contact.
			$contacts = $this->convertVCFContactsToMapi($this->destinationFolder, $attachmentStream);
		}
		catch (ZarafaException $e) {
			$e->setTitle(_("Import error"));

			throw $e;
		}
		catch (Exception $e) {
			$destinationFolderProps = mapi_getprops($this->destinationFolder, [PR_DISPLAY_NAME, PR_MDB_PROVIDER]);
			$fullyQualifiedFolderName = $destinationFolderProps[PR_DISPLAY_NAME];
			if ($destinationFolderProps[PR_MDB_PROVIDER] === ZARAFA_STORE_PUBLIC_GUID) {
				$publicStore = $GLOBALS["mapisession"]->getPublicMessageStore();
				$publicStoreName = mapi_getprops($publicStore, [PR_DISPLAY_NAME]);
				$fullyQualifiedFolderName .= " - " . $publicStoreName[PR_DISPLAY_NAME];
			}
			elseif ($destinationFolderProps[PR_MDB_PROVIDER] === ZARAFA_STORE_DELEGATE_GUID) {
				$otherStore = $GLOBALS['operations']->getOtherStoreFromEntryid($this->destinationFolderId);
				$sharedStoreOwnerName = mapi_getprops($otherStore, [PR_MAILBOX_OWNER_NAME]);
				$fullyQualifiedFolderName .= " - " . $sharedStoreOwnerName[PR_MAILBOX_OWNER_NAME];
			}

			$message = sprintf(_("Unable to import '%s' to '%s'. "), $filename, $fullyQualifiedFolderName);
			if ($e->getCode() === MAPI_E_TABLE_EMPTY) {
				$message .= _("There is no contact found in this file.");
			}
			elseif ($e->getCode() === MAPI_E_CORRUPT_DATA) {
				$message .= _("The file is corrupt.");
			}
			elseif ($e->getCode() === MAPI_E_INVALID_PARAMETER) {
				$message .= _("The file is invalid.");
			}
			else {
				$message = sprintf(_("Unable to import '%s'. "), $filename) . _("Please contact your system administrator if the problem persists.");
			}

			$e = new ZarafaException($message);
			$e->setTitle(_("Import error"));

			throw $e;
		}

		if (is_array($contacts) && !empty($contacts)) {
			$newcontact = [];
			foreach ($contacts as $contact) {
				// As vcf file does not contains fileas, business_address etc properties, we need to set it manually.
				// something similar is mentioned in this ticket KC-1509.
				$this->processContactData($GLOBALS["mapisession"]->getDefaultMessageStore(), $contact);
				mapi_message_savechanges($contact);
				$vcf = bin2hex(mapi_getprops($contact, [PR_ENTRYID])[PR_ENTRYID]);
				array_push($newcontact, $vcf);
			}

			return $newcontact;
		}

		return false;
	}

	/**
	 * Function checks whether the file to be converted contains a single vCard
	 * or multiple vCard entries. It calls the appropriate method and converts the vcf.
	 *
	 * @param object $destinationFolder the folder which holds the message which we need to import from file
	 * @param string $attachmentStream  the attachment as a stream
	 *
	 * @return array $contacts the array of contact(s) to be imported
	 */
	public function convertVCFContactsToMapi($destinationFolder, $attachmentStream) {
		$contacts = [];

		// If function 'mapi_vcftomapi2' exists, we can use that for both single and multiple vcf files,
		// but if it doesn't exist, we use the old function 'mapi_vcftomapi' for single vcf file.
		if (function_exists('mapi_vcftomapi2')) {
			$contacts = mapi_vcftomapi2($destinationFolder, $attachmentStream);
		}
		elseif ($_POST['is_single_import']) {
			$newMessage = mapi_folder_createmessage($this->destinationFolder);
			$store = $GLOBALS["mapisession"]->getDefaultMessageStore();
			$ok = mapi_vcftomapi($GLOBALS['mapisession']->getSession(), $store, $newMessage, $attachmentStream);
			if ($ok !== false) {
				$contacts = is_array($newMessage) ? $newMessage : [$newMessage];
			}
		}
		else {
			// Throw error related to multiple vcf as the function is not available for importing multiple vcf file.
			throw new ZarafaException(_("grommunio Web does not support importing multiple VCF with this version."));
		}

		return $contacts;
	}

	/**
	 * Helper function which generate the information like 'fileAs','display name' and
	 * 'business address' using existing information.
	 *
	 * @param object $store      Message Store Object
	 * @param object $newMessage The newly imported contact from .vcf file.
	 */
	public function processContactData($store, $newMessage) {
		$properties = [];
		$properties["subject"] = PR_SUBJECT;
		$properties["fileas"] = "PT_STRING8:PSETID_Address:0x8005";
		$properties["display_name"] = PR_DISPLAY_NAME;
		$properties["address_book_mv"] = "PT_MV_LONG:PSETID_Address:0x8028";
		$properties["address_book_long"] = "PT_LONG:PSETID_Address:0x8029";
		$properties["business_address"] = "PT_STRING8:PSETID_Address:0x801b";
		$properties["email_address_entryid_1"] = "PT_BINARY:PSETID_Address:0x8085";
		$properties["email_address_display_name_1"] = "PT_STRING8:PSETID_Address:" . PidLidEmail1DisplayName;
		$properties["business_address_street"] = "PT_STRING8:PSETID_Address:" . PidLidWorkAddressStreet;
		$properties["business_address_city"] = "PT_STRING8:PSETID_Address:" . PidLidWorkAddressCity;
		$properties["business_address_state"] = "PT_STRING8:PSETID_Address:" . PidLidWorkAddressState;
		$properties["business_address_postal_code"] = "PT_STRING8:PSETID_Address:" . PidLidWorkAddressPostalCode;
		$properties["business_address_country"] = "PT_STRING8:PSETID_Address:" . PidLidWorkAddressCountry;

		$properties = getPropIdsFromStrings($store, $properties);

		$contactProps = mapi_getprops($newMessage, $properties);

		$props = [];

		// Addresses field value.
		if (isset($contactProps[$properties["business_address_city"]]) && !empty($contactProps[$properties["business_address_city"]])) {
			$businessAddressCity = utf8_decode($contactProps[$properties["business_address_city"]]);

			$businessAddress = $contactProps[$properties["business_address_street"]] . "\n";
			$businessAddress .= $businessAddressCity . " ";
			$businessAddress .= $contactProps[$properties["business_address_state"]] . " " . $contactProps[$properties["business_address_postal_code"]] . "\n";
			$businessAddress .= $contactProps[$properties["business_address_country"]] . "\n";

			$props[$properties["business_address_city"]] = $businessAddressCity;
			$props[$properties["business_address"]] = $businessAddress;
		}

		// File as field value generator.
		if (isset($contactProps[PR_DISPLAY_NAME])) {
			$displayName = isset($contactProps[PR_DISPLAY_NAME]) ? utf8_decode($contactProps[PR_DISPLAY_NAME]) : " ";
			$displayName = str_replace("\xA0", " ", $displayName);
			$str = explode(" ", $displayName);
			$prefix = [_('Dr.'), _('Miss'), _('Mr.'), _('Mrs.'), _('Ms.'), _('Prof.')];
			$suffix = ['I', 'II', 'III', _('Jr.'), _('Sr.')];

			foreach ($str as $index => $value) {
				$value = preg_replace('/[^.A-Za-z0-9\-]/', '', $value);
				if (array_search($value, $prefix, true) !== false) {
					$props[PR_DISPLAY_NAME_PREFIX] = $value;
					unset($str[$index]);
				}
				elseif (array_search($value, $suffix, true) !== false) {
					$props[PR_GENERATION] = $value;
					unset($str[$index]);
				}
			}

			$surname = array_slice($str, count($str) - 1);
			$remainder = array_slice($str, 0, count($str) - 1);
			$fileAs = $surname[0] . ', ';
			if (!empty($remainder)) {
				$fileAs .= join(" ", $remainder);
				if (count($remainder) > 1) {
					$middleName = $remainder[count($remainder) - 1];
					$props[PR_MIDDLE_NAME] = $middleName;
				}
			}

			// Email fieldset information.
			if (isset($contactProps[$properties["email_address_display_name_1"]])) {
				$emailAddressDisplayNameOne = $fileAs . " ";
				$emailAddressDisplayNameOne .= $contactProps[$properties["email_address_display_name_1"]];
				$props[$properties["email_address_display_name_1"]] = $emailAddressDisplayNameOne;
				$props[$properties["address_book_long"]] = 1;
				$props[$properties["address_book_mv"]] = [0 => 0];
			}

			$props[$properties["fileas"]] = $fileAs;
			$props[PR_DISPLAY_NAME] = $displayName;
			mapi_setprops($newMessage, $props);
		}
	}

	/**
	 * Function reads content of the given file and convert the same into
	 * a webapp appointment into respective destination folder.
	 *
	 * @param string $attachmentStream the attachment as a stream
	 * @param string $filename         an actual file name
	 *
	 * @return bool true if the import is successful, false otherwise
	 */
	public function importICSFile($attachmentStream, $filename) {
		$this->destinationFolder = $this->getDestinationFolder();

		try {
			$events = $this->convertICSToMapi($attachmentStream);
		}
		catch (ZarafaException $e) {
			$e->setTitle(_("Import error"));

			throw $e;
		}
		catch (Exception $e) {
			$destinationFolderProps = mapi_getprops($this->destinationFolder, [PR_DISPLAY_NAME, PR_MDB_PROVIDER]);
			$fullyQualifiedFolderName = $destinationFolderProps[PR_DISPLAY_NAME];
			// Condition true if folder is belongs to Public store.
			if ($destinationFolderProps[PR_MDB_PROVIDER] === ZARAFA_STORE_PUBLIC_GUID) {
				$publicStore = $GLOBALS["mapisession"]->getPublicMessageStore();
				$publicStoreName = mapi_getprops($publicStore, [PR_DISPLAY_NAME]);
				$fullyQualifiedFolderName .= " - " . $publicStoreName[PR_DISPLAY_NAME];
			}
			elseif ($destinationFolderProps[PR_MDB_PROVIDER] === ZARAFA_STORE_DELEGATE_GUID) {
				// Condition true if folder is belongs to delegate store.
				$otherStore = $GLOBALS['operations']->getOtherStoreFromEntryid($this->destinationFolderId);
				$sharedStoreOwnerName = mapi_getprops($otherStore, [PR_MAILBOX_OWNER_NAME]);
				$fullyQualifiedFolderName .= " - " . $sharedStoreOwnerName[PR_MAILBOX_OWNER_NAME];
			}

			$message = sprintf(_("Unable to import '%s' to '%s'. "), $filename, $fullyQualifiedFolderName);
			if ($e->getCode() === MAPI_E_TABLE_EMPTY) {
				$message .= _("There is no appointment found in this file.");
			}
			elseif ($e->getCode() === MAPI_E_CORRUPT_DATA) {
				$message .= _("The file is corrupt.");
			}
			elseif ($e->getCode() === MAPI_E_INVALID_PARAMETER) {
				$message .= _("The file is invalid.");
			}
			else {
				$message = sprintf(_("Unable to import '%s'. "), $filename) . _("Please contact your system administrator if the problem persists.");
			}

			$e = new ZarafaException($message);
			$e->setTitle(_("Import error"));

			throw $e;
		}

		if (is_array($events) && !empty($events)) {
			$newEvents = [];
			$store = $GLOBALS["mapisession"]->getDefaultMessageStore();
			$propTags = array(
				"commonstart" => "PT_SYSTIME:PSETID_Common:0x8516",
				"commonend" => "PT_SYSTIME:PSETID_Common:0x8517",
				"message_class" => PR_MESSAGE_CLASS,
				"startdate" => "PT_SYSTIME:PSETID_Appointment:0x820d",
				"duedate" => "PT_SYSTIME:PSETID_Appointment:0x820e"
			);
			$properties = getPropIdsFromStrings($store, $propTags);
			foreach ($events as $event) {
				$newMessageProps = mapi_getprops($event, $properties);
				// Need to set the common start and end date if it is not set because
				// common start and end dates are required fields.

				if (!isset($newMessageProps[$properties["commonstart"]], $newMessageProps[$properties["commonend"]])) {
					mapi_setprops($event, array(
						$properties["commonstart"] => $newMessageProps[$properties["startdate"]],
						$properties["commonend"] => $newMessageProps[$properties["duedate"]]
					));
				}

				// Save newly imported event
				mapi_message_savechanges($event);

				$newMessageProps = mapi_getprops($event, [PR_MESSAGE_CLASS]);
				if (isset($newMessageProps[PR_MESSAGE_CLASS]) && $newMessageProps[PR_MESSAGE_CLASS] !== 'IPM.Appointment') {
					// Convert the Meeting request record to proper appointment record so we can
					// properly show the appointment in calendar.
					$req = new Meetingrequest($store, $event, $GLOBALS['mapisession']->getSession(), ENABLE_DIRECT_BOOKING);
					$req->doAccept(true, false, false, false, false, false, false, false, false, true);
				}

				$this->allowUpdateCounter = false;
				$entryid = bin2hex(mapi_getprops($event, [PR_ENTRYID])[PR_ENTRYID]);
				array_push($newEvents, $entryid);
			}

			return $newEvents;
		}

		return false;
	}

	/**
	 * Function checks whether the file to be converted contains a single event ics
	 * or multiple ics event entries.
	 *
	 * @param string $attachmentStream the attachment as a stream
	 *
	 * @return array $events the array of calendar items to be imported
	 */
	public function convertICSToMapi($attachmentStream) {
		$events = [];
		$addrBook = $GLOBALS['mapisession']->getAddressbook();

		// If function 'mapi_icaltomapi2' exists, we can use that for both single and multiple ics files,
		// but if it doesn't exist, we use the old function 'mapi_icaltomapi' for single ics file.
		if (function_exists('mapi_icaltomapi2')) {
			$events = mapi_icaltomapi2($addrBook, $this->destinationFolder, $attachmentStream);
		}
		elseif ($_POST['is_single_import']) {
			$newMessage = mapi_folder_createmessage($this->destinationFolder);
			$store = $GLOBALS["mapisession"]->getDefaultMessageStore();
			$ok = mapi_icaltomapi($GLOBALS['mapisession']->getSession(), $store, $addrBook, $newMessage, $attachmentStream, false);

			if ($ok !== false) {
				array_push($events, $newMessage);
			}
		}
		else {
			// Throw error related to multiple ics as the function is not available for importing multiple ics file.
			throw new ZarafaException(_("grommunio Web does not support importing multiple ICS with this version."));
		}

		return $events;
	}

	/**
	 * Function reads content of the given file and convert the same into
	 * a webapp email into respective destination folder.
	 *
	 * @param string $attachTempName   a temporary file name of server location where it actually saved/available
	 * @param string $filename         an actual file name
	 * @param mixed  $attachmentStream
	 *
	 * @return bool true if the import is successful, false otherwise
	 */
	public function importEMLFile($attachmentStream, $filename) {
		if (isBrokenEml($attachmentStream)) {
			throw new ZarafaException(sprintf(_("Unable to import '%s'"), $filename) . ". " . _("The EML is not valid"));
		}

		$this->destinationFolder = $this->getDestinationFolder();

		$newMessage = mapi_folder_createmessage($this->destinationFolder);
		$addrBook = $GLOBALS['mapisession']->getAddressbook();
		// Convert an RFC822-formatted e-mail to a MAPI Message
		$ok = mapi_inetmapi_imtomapi($GLOBALS['mapisession']->getSession(), $this->store, $addrBook, $newMessage, $attachmentStream, []);

		if ($ok === true) {
			mapi_message_savechanges($newMessage);

			return bin2hex(mapi_getprops($newMessage, [PR_ENTRYID])[PR_ENTRYID]);
		}

		return false;
	}

	/**
	 * Function used get the destination folder in which
	 * item gets imported.
	 *
	 * @return object folder object in which item gets imported
	 */
	public function getDestinationFolder() {
		$destinationFolder = null;

		try {
			$destinationFolder = mapi_msgstore_openentry($this->store, hex2bin($this->destinationFolderId));
		}
		catch (Exception $e) {
			// Try to find the folder from shared stores in case if it is not found in current user's store
			$destinationFolder = mapi_msgstore_openentry($GLOBALS['operations']->getOtherStoreFromEntryid($this->destinationFolderId), hex2bin($this->destinationFolderId));
		}

		return $destinationFolder;
	}

	/**
	 * Function deletes uploaded attachment files and send
	 * proper response back to client.
	 */
	public function deleteUploadedFiles() {
		$num = sanitizePostValue('attach_num', false, NUMERIC_REGEX);
		$attachID = sanitizePostValue('attach_id', false, STRING_REGEX);

		if ($num === false) {
			// string is passed in attachNum so get it
			// Parse the filename, strip it from any illegal characters
			$num = mb_basename(stripslashes(sanitizePostValue('attach_num', '', FILENAME_REGEX)));

			// Delete the file instance and unregister the file
			$this->attachment_state->deleteUploadedAttachmentFile($_REQUEST['dialog_attachments'], $num, $attachID);
		}
		else {
			// Set the correct array structure
			$this->attachment_state->addDeletedAttachment($_REQUEST['dialog_attachments'], $num);
		}

		$return = [
			// 'success' property is needed for Extjs Ext.form.Action.Submit#success handler
			'success' => true,
			'zarafa' => [
				sanitizeGetValue('module', '', STRING_REGEX) => [
					sanitizeGetValue('moduleid', '', STRING_REGEX) => [
						'delete' => [
							'success' => true,
						],
					],
				],
			],
		];

		echo json_encode($return);
	}

	/**
	 * Function adds embedded/icsfile attachment and send
	 * proper response back to client.
	 */
	public function addingEmbeddedAttachments() {
		$attachID = $_POST['attach_id'];
		$attachTampName = $this->attachment_state->addEmbeddedAttachment($_REQUEST['dialog_attachments'], [
			'entryid' => sanitizePostValue('entryid', '', ID_REGEX),
			'store_entryid' => sanitizePostValue('store_entryid', '', ID_REGEX),
			'sourcetype' => intval($_POST['attach_method'], 10) === ATTACH_EMBEDDED_MSG ? 'embedded' : 'icsfile',
			'attach_id' => $attachID,
		]);

		$returnfiles[] = [
			'props' => [
				'attach_num' => -1,
				'tmpname' => $attachTampName,
				'attach_id' => $attachID,
				// we are not using this data here, so we can safely use $_POST directly without any sanitization
				// this is only needed to identify response for a particular attachment record on client side
				'name' => $_POST['name'],
			],
		];

		$return = [
			// 'success' property is needed for Extjs Ext.form.Action.Submit#success handler
			'success' => true,
			'zarafa' => [
				sanitizeGetValue('module', '', STRING_REGEX) => [
					sanitizeGetValue('moduleid', '', STRING_REGEX) => [
						'update' => [
							'item' => $returnfiles,
						],
					],
				],
			],
		];

		echo json_encode($return);
	}

	/**
	 * Function adds attachment in case of OOo.
	 */
	public function uploadWhenWendViaOOO() {
		$providedFile = sys_get_temp_dir() . DIRECTORY_SEPARATOR . $_GET['attachment_id'];

		// check whether the doc is already moved
		if (file_exists($providedFile)) {
			$filename = mb_basename(stripslashes($_GET['name']));

			// Move the uploaded file to the session
			$this->attachment_state->addProvidedAttachmentFile($_REQUEST['attachment_id'], $filename, $providedFile, [
				'name' => $filename,
				'size' => filesize($tmpname),
				'type' => mime_content_type($tmpname),
				'sourcetype' => 'default',
			]);
		}
		else {
			// Check if no files are uploaded with this attachmentid
			$this->attachment_state->clearAttachmentFiles($_GET['attachment_id']);
		}
	}

	/**
	 * Helper function to send proper response for import request only. It sets the appropriate
	 * notifier to be sent in the response according to the type of the file to be imported.
	 *
	 * @param mixed $importStatus
	 */
	public function sendImportResponse($importStatus) {
		$storeProps = mapi_getprops($this->store, [PR_ENTRYID]);
		$destinationFolderProps = mapi_getprops($this->destinationFolder, [PR_PARENT_ENTRYID, PR_CONTENT_UNREAD]);
		$notifierModuleId = $this->notifierModule . '1';

		$return = [
			'success' => true,
			'zarafa' => [
				sanitizeGetValue('module', '', STRING_REGEX) => [
					sanitizeGetValue('moduleid', '', STRING_REGEX) => [
						'import' => [
							'success' => true,
							'items' => $importStatus,
						],
					],
				],
				'hierarchynotifier' => [
					'hierarchynotifier1' => [
						'folders' => [
							'item' => [
								0 => [
									'entryid' => $this->destinationFolderId,
									'parent_entryid' => bin2hex($destinationFolderProps[PR_PARENT_ENTRYID]),
									'store_entryid' => bin2hex($storeProps[PR_ENTRYID]),
									'props' => [
										'content_unread' => $this->allowUpdateCounter ? $destinationFolderProps[PR_CONTENT_UNREAD] + 1 : 0,
									],
								],
							],
						],
					],
				],
				$this->notifierModule => [
					$notifierModuleId => [
						'newobject' => [
							'item' => [
								0 => [
									'content_count' => 2,
									'content_unread' => 0,
									'display_name' => 'subsubin',
									'entryid' => $this->destinationFolderId,
									'parent_entryid' => bin2hex($destinationFolderProps[PR_PARENT_ENTRYID]),
									'store_entryid' => bin2hex($storeProps[PR_ENTRYID]),
								],
							],
						],
					],
				],
			],
		];
		echo json_encode($return);
	}

	/**
	 * Function will encode all the necessary information about the exception
	 * into JSON format and send the response back to client.
	 *
	 * @param object $exception exception object
	 * @param string $title     title which used to show as title of exception dialog
	 */
	public function handleUploadException($exception, $title = null) {
		$return = [];

		// MAPI_E_NOT_FOUND exception contains generalize exception message.
		// Set proper exception message as display message should be user understandable.
		if ($exception->getCode() == MAPI_E_NOT_FOUND) {
			$exception->setDisplayMessage(_('Could not find message, either it has been moved or deleted.'));
		}

		// Set the headers
		header('Expires: 0'); // set expiration time
		header('Cache-Control: must-revalidate, post-check=0, pre-check=0');

		// Set Content Disposition header
		header('Content-Disposition: inline');
		// Set content type header
		header('Content-Type: text/plain');

		$return = [
			// 'success' property is needed for Extjs Ext.form.Action.Submit#success handler
			'success' => false,
			'zarafa' => [
				'error' => [
					'type' => ERROR_GENERAL,
					'info' => [
						'file' => $exception->getFileLine(),
						'title' => $title,
						'display_message' => $exception->getDisplayMessage(),
						'original_message' => $exception->getMessage(),
					],
				],
			],
		];

		echo json_encode($return);
	}

	/**
	 * Generic function to check received data and take necessary action.
	 */
	public function upload() {
		$this->attachment_state->open();

		// Check if dialog_attachments is set
		if (isset($_REQUEST['dialog_attachments'])) {
			// Check if attachments have been uploaded
			if (isset($_FILES['attachments']) && is_array($_FILES['attachments'])) {
				// import given files into respective webapp folder
				$this->processFiles();
			}
			elseif (isset($_POST['deleteattachment'])) {
				$this->deleteUploadedFiles();
			}
			elseif (isset($_POST['entryid'])) {	// Check for adding of embedded attachments
				$this->addingEmbeddedAttachments();
			}
		}
		elseif ($_GET && isset($_GET['attachment_id'])) { // this is to upload the file to server when the doc is send via OOo
			$this->uploadWhenWendViaOOO();
		}

		$this->attachment_state->close();
	}
}

// create instance of class
$uploadInstance = new UploadAttachment();

try {
	// initialize variables
	$uploadInstance->init($_REQUEST);

	// upload files
	$uploadInstance->upload();
}
catch (ZarafaException $e) {
	$uploadInstance->handleUploadException($e, $e->getTitle());
}
catch (Exception $e) {
	$uploadInstance->handleUploadException($e);
}
