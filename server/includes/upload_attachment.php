<?php
// required to handle php errors
require_once(__DIR__ . '/exceptions/class.ZarafaErrorException.php');

/**
* Upload Attachment
* This file is used to upload.
*/
class UploadAttachment
{
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
	 * Constructor
	 */
	public function __construct()
	{
		$this->dialogAttachments = false;
		$this->storeId = false;
		$this->destinationFolder = false;
		$this->destinationFolderId = false;
		$this->store = false;
		$this->import = false;
		$this->attachment_state = false;
	}

	/**
	 * Function will initialize data for this class object. it will also sanitize data
	 * for possible XSS attack because data is received in $_REQUEST
	 * @param Array $data parameters received with the request.
	 */
	public function init($data)
	{
		if(isset($data['dialog_attachments'])) {
			$this->dialogAttachments = sanitizeValue($data['dialog_attachments'], '', ID_REGEX);
		}

		if(isset($data['store'])) {
			$this->storeId = sanitizeValue($data['store'], '', STRING_REGEX);
		}

		if(isset($data['destination_folder'])) {
			$this->destinationFolderId = sanitizeValue($data['destination_folder'], '', STRING_REGEX);
		}

		if($this->storeId){
			$this->store = $GLOBALS['mapisession']->openMessageStore(hex2bin($this->storeId));
		}

		if(isset($data['import'])) {
			$this->import = sanitizeValue($data['import'], '', STRING_REGEX);
		}

		if ($this->attachment_state === false) {
			$this->attachment_state = new AttachmentState();
		}
	}

	/**
	 * Function get Files received in request, extract necessary information
	 * and holds the same using an instance of AttachmentState class.
	 */
	function processFiles()
	{
		if(isset($_FILES['attachments']['name']) && is_array($_FILES['attachments']['name'])) {
			$importStatus = false;
			$returnfiles = array();

			// Parse all information from the updated files,
			// validate the contents and add it to the $FILES array.
			foreach($_FILES['attachments']['name'] as $key => $name) {
				// validate the FILE object to see if the size doesn't exceed
				// the configured MAX_FILE_SIZE
				$fileSize = $_FILES['attachments']['size'][$key];
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
					if(!isIE11() && !isEdge()) {
						$attachID = substr($filename, -8);
						$filename = substr($filename, 0, -8);
					} else {
						$attachID = uniqid();
					}

					// Move the uploaded file into the attachment state
					$attachTempName = $this->attachment_state->addUploadedAttachmentFile($_REQUEST['dialog_attachments'], $filename, $_FILES['attachments']['tmp_name'][$key], array(
						'name'       => $filename,
						'size'       => $fileSize,
						'type'       => $fileType,
						'sourcetype' => $sourcetype,
						'attach_id'  => $attachID
					));

					// Allow hooking in to handle import in plugins
					$GLOBALS['PluginManager']->triggerHook('server.upload_attachment.upload', array(
						'tmpname'  => $this->attachment_state->getAttachmentPath($attachTempName),
						'name' => $filename,
						'size' => $fileSize,
						'sourcetype' => $sourcetype,
						'returnfiles' =>& $returnfiles,
						'attach_id'   => $attachID
					));

					if ($this->import) { // import given files
						$importStatus = $this->importFiles($attachTempName, $filename);
					} else if($sourcetype === 'contactphoto' || $sourcetype === 'default') {
						$fileData = Array(
							'props' => Array(
								'attach_num' => -1,
								'tmpname' => $attachTempName,
								'attach_id' => $attachID,
								'name' => $filename,
								'size' => $fileSize
							)
						);

						if ($sourcetype === 'contactphoto') {
							$fileData['props']['attachment_contactphoto'] = true;
						}

						$returnfiles[] = $fileData;
					} else {
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
				} else {
					throw new ZarafaException(_("File is not imported successfully"));
				}
			} else {
				$return = Array(
					'success' => true,
					'zarafa' => Array(
						sanitizeGetValue('module', '', STRING_REGEX) => Array(
							sanitizeGetValue('moduleid', '', STRING_REGEX) => Array(
								'update' => Array(
									'item'=> $returnfiles
								)
							)
						)
					)
				);

				echo json_encode($return);
			}
		}
	}

	/**
	 * Function reads content of the given file and convert the same into
	 * a webapp email into respective destination folder.
	 * @param String $attachTempName A temporary file name of server location where it actually saved/available.
	 * @param String $filename An actual file name.
	 * @return Boolean true if the import is successful, false otherwise.
	 */
	function importFiles($attachTempName, $filename)
	{
		$addrBook = $GLOBALS['mapisession']->getAddressbook();
		$filepath = $this->attachment_state->getAttachmentPath($attachTempName);
		$handle = fopen($filepath, "r");
		$attachmentStream = '';
		while (!feof($handle))
		{
			$attachmentStream .= fread($handle, BLOCK_SIZE);
		}

		fclose($handle);
		unlink($filepath);

		if (isBrokenEml($attachmentStream)) {
			throw new ZarafaException(sprintf(_("Unable to import '%s'"), $filename) . ". ". _("The EML is not valid"));
		}

		try {
			$this->destinationFolder = mapi_msgstore_openentry($this->store, hex2bin($this->destinationFolderId));
		} catch(Exception $e) {
			// Try to find the folder from shared stores in case if it is not found in current user's store
			$this->destinationFolder = mapi_msgstore_openentry($GLOBALS['operations']->getOtherStoreFromEntryid($this->destinationFolderId), hex2bin($this->destinationFolderId));
		}

		$newMessage = mapi_folder_createmessage($this->destinationFolder);
		// Convert an RFC822-formatted e-mail to a MAPI Message
		$ok = mapi_inetmapi_imtomapi($GLOBALS['mapisession']->getSession(), $this->store, $addrBook, $newMessage, $attachmentStream, array());

		if($ok === true) {
			mapi_message_savechanges($newMessage);
			return bin2hex(mapi_getprops($newMessage, array(PR_ENTRYID))[PR_ENTRYID]);
		}

		return false;
	}

	/**
	 * Function deletes uploaded attachment files and send
	 * proper response back to client.
	 */
	function deleteUploadedFiles()
	{
		$num = sanitizePostValue('attach_num', false, NUMERIC_REGEX);
		$attachID = sanitizePostValue('attach_id', false, STRING_REGEX);

		if($num === false) {
			// string is passed in attachNum so get it
			// Parse the filename, strip it from any illegal characters
			$num = mb_basename(stripslashes(sanitizePostValue('attach_num', '', FILENAME_REGEX)));

			// Delete the file instance and unregister the file
			$this->attachment_state->deleteUploadedAttachmentFile($_REQUEST['dialog_attachments'], $num, $attachID);
		} else {
			// Set the correct array structure
			$this->attachment_state->addDeletedAttachment($_REQUEST['dialog_attachments'], $num);
		}

		$return = Array(
			// 'success' property is needed for Extjs Ext.form.Action.Submit#success handler
			'success' => true,
			'zarafa' => Array(
				sanitizeGetValue('module', '', STRING_REGEX) => Array(
					sanitizeGetValue('moduleid', '', STRING_REGEX) => Array(
						'delete' => Array(
							'success'=> true
						)
					)
				)
			)
		);

		echo json_encode($return);
	}

	/**
	 * Function adds embedded attachment and send
	 * proper response back to client.
	 */
	function addingEmbeddedAttachments()
	{
		$attachID = $_POST['attach_id'];
		$attachTampName = $this->attachment_state->addEmbeddedAttachment($_REQUEST['dialog_attachments'], array(
			'entryid' => sanitizePostValue('entryid', '', ID_REGEX),
			'store_entryid' => sanitizePostValue('store_entryid', '', ID_REGEX),
			// indicate that this is actually an embedded attachment
			'sourcetype' => 'embedded',
			'attach_id' => $attachID,
		));

		$returnfiles[] = Array(
			'props' => Array(
				'attach_num' => -1,
				'tmpname' => $attachTampName,
				'attach_id' => $attachID,
				// we are not using this data here, so we can safely use $_POST directly without any sanitization
				// this is only needed to identify response for a particular attachment record on client side
				'name' => $_POST['name']
			)
		);

		$return = Array(
			// 'success' property is needed for Extjs Ext.form.Action.Submit#success handler
			'success' => true,
			'zarafa' => Array(
				sanitizeGetValue('module', '', STRING_REGEX) => Array(
					sanitizeGetValue('moduleid', '', STRING_REGEX) => Array(
						'update' => Array(
							'item'=> $returnfiles
						)
					)
				)
			)
		);

		echo json_encode($return);
	}

	/**
	 * Function adds attachment in case of OOo.
	 */
	function uploadWhenWendViaOOO()
	{
		$providedFile = sys_get_temp_dir() . DIRECTORY_SEPARATOR . $_GET['attachment_id'];

		// check wheather the doc is already moved
		if (file_exists($providedFile)) {
			$filename = mb_basename(stripslashes($_GET['name']));

			// Move the uploaded file to the session
			$this->attachment_state->addProvidedAttachmentFile($_REQUEST['attachment_id'], $filename, $providedFile, array(
				'name'       => $filename,
				'size'       => filesize($tmpname),
				'type'       => mime_content_type($tmpname),
				'sourcetype' => 'default'
			));
		}else{
			// Check if no files are uploaded with this attachmentid
			$this->attachment_state->clearAttachmentFiles($_GET['attachment_id']);
		}
	}

	/**
	 * Helper function to send proper response for import request only.
	 */
	function sendImportResponse($importStatus)
	{
		$storeProps = mapi_getprops($this->store, array(PR_ENTRYID));
		$destinationFolderProps = mapi_getprops($this->destinationFolder, array(PR_PARENT_ENTRYID, PR_CONTENT_UNREAD));

		$return = Array(
			'success' => true,
			'zarafa' => Array(
				sanitizeGetValue('module', '', STRING_REGEX) => Array(
					sanitizeGetValue('moduleid', '', STRING_REGEX) => Array(
						'import' => Array(
							'success'=> true,
							'items' => $importStatus
						)
					)
				),
				'hierarchynotifier' => Array(
					'hierarchynotifier1' => Array(
						'folders' => Array(
							'item' => Array(
								0 => Array(
									'entryid' => $this->destinationFolderId,
									'parent_entryid' => bin2hex($destinationFolderProps[PR_PARENT_ENTRYID]),
									'store_entryid' => bin2hex($storeProps[PR_ENTRYID]),
									'props' => Array(
										'content_unread' => $destinationFolderProps[PR_CONTENT_UNREAD] + 1
									)
								)
							)
						)
					)
				),
				'maillistnotifier' => Array(
					'maillistnotifier1' => Array(
						'newobject' => Array(
							'item' => Array(
								0 => Array(
									'content_count' => 2,
									'content_unread' => 0,
									'display_name' => 'subsubin',
									'entryid' => $this->destinationFolderId,
									'parent_entryid' => bin2hex($destinationFolderProps[PR_PARENT_ENTRYID]),
									'store_entryid' => bin2hex($storeProps[PR_ENTRYID])
								)
							)
						)
					)
				)
			)
		);
		echo json_encode($return);
	}

	/**
	 * Function will encode all the necessary information about the exception
	 * into JSON format and send the response back to client.
	 *
	 * @param object $exception Exception object.
	 */
	function handleUploadException($exception)
	{
		$return = array();

		// MAPI_E_NOT_FOUND exception contains generalize exception message.
		// Set proper exception message as display message should be user understandable.
		if($exception->getCode() == MAPI_E_NOT_FOUND) {
			$exception->setDisplayMessage(_('Could not find message, either it has been moved or deleted.'));
		}

		// Set the headers
		header('Expires: 0'); // set expiration time
		header('Cache-Control: must-revalidate, post-check=0, pre-check=0');

		// Set Content Disposition header
		header('Content-Disposition: inline');
		// Set content type header
		header('Content-Type: text/plain');

		$return = Array(
			// 'success' property is needed for Extjs Ext.form.Action.Submit#success handler
			'success' => false,
			'zarafa' => Array(
				'error' => array(
					'type' => ERROR_GENERAL,
					'info' => array(
						'file' => $exception->getFileLine(),
						'display_message' => $exception->getDisplayMessage(),
						'original_message' => $exception->getMessage()
					)
				)
			)
		);

		echo json_encode($return);
	}

	/**
	 * Generic function to check received data and take necessary action.
	 */
	public function upload()
	{
		$this->attachment_state->open();

		// Check if dialog_attachments is set
		if(isset($_REQUEST['dialog_attachments'])) {
			// Check if attachments have been uploaded
			if(isset($_FILES['attachments']) && is_array($_FILES['attachments'])) {
				// import given files into respective webapp folder
				$this->processFiles();
			} else if (isset($_POST['deleteattachment'])) {
				$this->deleteUploadedFiles();
			} else if (isset($_POST['entryid'])) {	// Check for adding of embedded attachments
				$this->addingEmbeddedAttachments();
			}
		} else if($_GET && isset($_GET['attachment_id'])) { // this is to upload the file to server when the doc is send via OOo
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
} catch (Exception $e) {
	$uploadInstance->handleUploadException($e);
}
?>
