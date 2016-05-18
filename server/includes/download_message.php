<?php
/**
 * DownloadMessage
 *
 * A class to manage downloading of message as a file,
 * it will generate the message as RFC822-formatted e-mail stream.
  */
class DownloadMessage
{
	/**
	 * Resource of the MAPIStore which holds the message which we need to save as file.
	 */
	private $store;

	/**
	 * Entryid of the MAPIStore which holds the message which we need to save as file.
	 */
	private $storeId;

	/**
	 * Entryid of the MAPIMessage which we need to save as file.
	 */
	private $entryId;

	/**
	 * Array of entryids of all the MAPIMessages which we need to include in ZIP.
	 */
	private $entryIds;

	/**
	 * Resource of MAPIMessage which we need to save as file.
	 */
	private $message;

	/**
	 * A boolean value, set to false by default, to define if all the attachments are requested to be downloaded in a zip or not.
	 */
	private $allAsZip;

	/**
	 * Array to hold file names added into the ZIP which is used to avoid similar file names to be added in ZIP.
	 */
	private $fileNameTracker;

	/**
	 * Constructor
	 */
	public function DownloadMessage()
	{
		$this->storeId = false;
		$this->entryId = false;
		$this->allAsZip = false;
		$this->fileNameTracker = array();
		$this->entryIds = array();
	}

	/**
	 * Function will initialize data for this class object. it will also sanitize data
	 * for possible XSS attack because data is received in $_GET
	 * @param Array $data parameters received with the request.
	 */
	public function init($data)
	{
		if(isset($data['storeid'])) {
			$this->storeId = sanitizeValue($data['storeid'], '', ID_REGEX);
		}

		if(isset($data['AllAsZip'])) {
			$this->allAsZip = sanitizeValue($data['AllAsZip'], '', STRING_REGEX);
		}

		if($this->storeId){
			$this->store = $GLOBALS['mapisession']->openMessageStore(hex2bin($this->storeId));
		}

		if($this->allAsZip){
			if($_POST && array_key_exists('entryids', $_POST) && isset($_POST['entryids'])) {
				$this->entryIds = $_POST['entryids'];
			}
		} else {
			if(isset($data['entryid'])) {
				$this->entryId = sanitizeValue($data['entryid'], '', ID_REGEX);
				$this->message = mapi_msgstore_openentry($this->store, hex2bin($this->entryId));

				// Decode smime signed messages on this message
				parse_smime($this->store, $this->message);
			}
		}
	}

	/**
	 * Offers the functionality to postfixed the file name with number derived from
	 * the appearance of other file with same name.
	 * We need to keep track of the file names used so far to prevent duplicates.
	 * @param String $filename name of the file to be added in ZIP.
	 * @return String $filename changed name of the file to be added in ZIP to avoid same file names.
	 */
	function handleDuplicateFileNames($filename)
	{
		// A local name is optional.
		if(!empty($filename)) {

			// Check and add if file name is not there in tracker array
			if(!array_key_exists($filename, $this->fileNameTracker)) {
				$this->fileNameTracker[$filename] = 0;
			}

			// We have to make sure that there aren't two of the same file names.
			// Otherwise, one file will override the other and we will be missing the file.
			while( $this->fileNameTracker[ $filename ] > 0 ) {
				$fileNameInfo = pathinfo( $filename );
				$intNext = $this->fileNameTracker[ $filename ]++;
				$filename = "$fileNameInfo[filename] ($intNext).$fileNameInfo[extension]";

				// Check and add if newly prepared file name is not there in tracker array
				if(!array_key_exists($filename, $this->fileNameTracker)){
					$this->fileNameTracker[$filename] = 0;
				}
			}

			// Add to the count.
			$this->fileNameTracker[ $filename ]++;
		}
		return $filename;
	}

	/**
	 * Function will obtain stream from the message, For email messages it will open email as
	 * inet object and get the stream content as eml format, when user has IMAP enabled.
	 * The below mentioned properties are configured with the whole message as a stream in it, while IMAP is enabled :
	 * PR_EC_IMAP_EMAIL
	 * PR_EC_IMAP_EMAIL_SIZE
	 * PR_EC_IMAP_BODY
	 * PR_EC_IMAP_BODYSTRUCTURE
	 * @param Array $messageProps Properties of this particular message.
	 * @return Stream $stream The eml stream obtained from message.
	 */
	function getEmlStream($messageProps)
	{
		$isSupportedMessage = (
			(stripos($messageProps[PR_MESSAGE_CLASS], 'IPM.Note') === 0)
			|| (stripos($messageProps[PR_MESSAGE_CLASS], 'Report.IPM.Note') === 0)
			|| (stripos($messageProps[PR_MESSAGE_CLASS], 'IPM.Schedule') === 0)
		);

		if ($isSupportedMessage) {
			// If RFC822-formatted stream is already available in PR_EC_IMAP_EMAIL property
			// than directly use it, generate otherwise.
			if(isset($messageProps[PR_EC_IMAP_EMAIL]) || propIsError(PR_EC_IMAP_EMAIL, $messageProps) == MAPI_E_NOT_ENOUGH_MEMORY) {
				// Stream the message to properly get the PR_EC_IMAP_EMAIL property
				$stream = mapi_openproperty($this->message, PR_EC_IMAP_EMAIL, IID_IStream, 0, 0);
			} else {
				// Get addressbook for current session
				$addrBook = $GLOBALS['mapisession']->getAddressbook();

				// Read the message as RFC822-formatted e-mail stream.
				$stream = mapi_inetmapi_imtoinet($GLOBALS['mapisession']->getSession(), $addrBook, $this->message, array());
			}

			return $stream;
		} else {
			throw new ZarafaException(sprintf(_("Eml creation of '%s' is not supported"), $this->getMessageType($messageProps[PR_MESSAGE_CLASS])));
		}
	}

	/**
	 * Function configures necessary header information which required to send the eml file to client.
	 * It also sends the eml file to the client.
	 */
	function downloadMessageAsFile()
	{
		if($this->message && $this->store) {
			// get message properties.
			$messageProps = mapi_getprops($this->message, array(PR_SUBJECT, PR_EC_IMAP_EMAIL, PR_MESSAGE_CLASS));

			$stream = $this->getEmlStream($messageProps);

			$filename = (!empty($messageProps[PR_SUBJECT])) ? $messageProps[PR_SUBJECT] : _('Untitled');
			$filename .= '.eml';

			// Set the headers
			header('Pragma: public');
			header('Expires: 0'); // set expiration time
			header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
			header('Content-Transfer-Encoding: binary');

			// Set Content Disposition header
			header('Content-Disposition: attachment; filename="' . addslashes(browserDependingHTTPHeaderEncode($filename)) . '"');
			// Set content type header
			header('Content-Type: application/octet-stream');

			// Set the file length
			$stat = mapi_stream_stat($stream);
			header('Content-Length: ' . $stat['cb']);

			// Read whole message and echo it.
			for($i = 0; $i < $stat['cb']; $i += BLOCK_SIZE) {
				// Print stream
				echo mapi_stream_read($stream, BLOCK_SIZE);

				// Need to discard the buffer contents to prevent memory
				// exhaustion while echoing large content.
				ob_flush();
			}
		}
	}

	/**
	 * Function will create a ZIP archive and add eml files into the same.
	 * It also configures necessary header information which required to send the ZIP file to client.
	 * Send ZIP to the client if all the requested eml files included successfully into the same.
	 */
	function downloadMessageAsZipFile()
	{
		if($this->store) {
			// Generate random ZIP file name at default temporary path of PHP
			$randomZipName = tempnam(sys_get_temp_dir(), 'zip');

			// Create an open zip archive.
			$zip = new ZipArchive();
			$result = $zip->open($randomZipName, ZipArchive::CREATE);

			if ($result === TRUE) {
				for($index = 0, $count = count($this->entryIds); $index < $count; $index++) {

					$this->message = mapi_msgstore_openentry($this->store, hex2bin($this->entryIds[$index]));

					// get message properties.
					$messageProps = mapi_getprops($this->message, array(PR_SUBJECT, PR_EC_IMAP_EMAIL, PR_MESSAGE_CLASS));

					$stream = $this->getEmlStream($messageProps);
					$stat = mapi_stream_stat($stream);

					// Get the stream
					$datastring = '';
					for($i = 0; $i < $stat['cb']; $i += BLOCK_SIZE) {
						$datastring .=  mapi_stream_read($stream, BLOCK_SIZE);
						// Need to discard the buffer contents to prevent memory
						// exhaustion.
						ob_flush();
					}

					$filename = (!empty($messageProps[PR_SUBJECT])) ? $messageProps[PR_SUBJECT] : _('Untitled');
					$filename .= '.eml';

					$filename = $this->handleDuplicateFileNames($filename);

					// Add file into zip by stream
					$zip->addFromString($filename, $datastring);
				}
			} else {
				$zip->close();
				// Remove the zip file to avoid unnecessary disk-space consumption
				unlink($randomZipName);

				// Throw exception if ZIP is not created successfully
				throw new ZarafaException(_("ZIP is not created successfully"));
			}

			$zip->close();

			// Set the headers
			header('Pragma: public');
			header('Expires: 0'); // set expiration time
			header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
			header('Content-Disposition: attachment; filename="' . addslashes(browserDependingHTTPHeaderEncode(_("Messages").date(" d-m-Y").".zip")) . '"');
			header('Content-Transfer-Encoding: binary');
			header('Content-Type:  application/zip');
			header('Content-Length: ' . filesize($randomZipName));

			// Send the actual response as ZIP file
			readfile($randomZipName);

			// Remove the zip file to avoid unnecessary disk-space consumption
			unlink($randomZipName);
		}
	}

	/**
	 * Function will return message type according to the MAPI message class
	 * to display exception. so, user can easily understand the exception message.
	 *
	 * @param string $mapiMessageClass message type as defined in MAPI.
	 * @return string $messageClass message type to prepare exception message.
	 */
	function getMessageType($mapiMessageClass)
	{
		$messageClass = '';

		// Here, we have technical message class, so we need to remove technical prefix/postfix, if any.
		// Creates an array of strings by splitting the message class from dot(.)
		$explodedMessageClass = explode(".", $mapiMessageClass);
		$ipmIndex = array_search('IPM', $explodedMessageClass);

		// Convert message class into human readable format, so user can easily understand the display message.
		switch ($explodedMessageClass[$ipmIndex + 1]) {
			case 'Appointment':
				$messageClass = _('Appointment');
				break;
			case 'StickyNote':
				$messageClass = _('Sticky Note');
				break;
			case 'Contact':
				$messageClass = _('Contact');
				break;
			case 'DistList':
				$messageClass = _('Distribution list');
				break;
			case 'Task':
				$messageClass = _('Task');
				break;
			case 'TaskRequest':
				$messageClass = _('Task Request');
				break;
			default:
				$messageClass = $mapiMessageClass;
		}

		return $messageClass;
	}

	/**
	 * Generic function to check passed data and decide either the eml file or ZIP file is requested to be downloaded.
	 */
	public function download()
	{
		if($this->allAsZip){
			// download multiple eml messages in a ZIP file
			$this->downloadMessageAsZipFile();
		} else {
			// download message as file
			$this->downloadMessageAsFile();
		}
	}

	/**
	 * Function will encode all the necessary information about the exception
	 * into JSON format and send the response back to client.
	 *
	 * @param object $exception Exception object.
	 */
	function handleSaveMessageException($exception)
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

		//prepare exception response according to exception class
		if($exception instanceof MAPIException) {
			$return = array(
				'success' => false,
				'zarafa' => array(
					'error' => array(
						'type' => ERROR_MAPI,
						'info' => array(
							'hresult' => $exception->getCode(),
							'hresult_name' => get_mapi_error_name($exception->getCode()),
							'file' => $exception->getFileLine(),
							'display_message' => $exception->getDisplayMessage()
						)
					)
				)
			);
		} else if($exception instanceof ZarafaException) {
			$return = array(
				'success' => false,
				'zarafa' => array(
					'error' => array(
						'type' => ERROR_ZARAFA,
						'info' => array(
							'file' => $exception->getFileLine(),
							'display_message' => $exception->getDisplayMessage(),
							'original_message' => $exception->getMessage()
						)
					)
				)
			);
		} else if($exception instanceof BaseException) {
			$return = array(
				'success' => false,
				'zarafa' => array(
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
		} else {
			$return = array(
				'success' => false,
				'zarafa' => array(
					'error' => array(
						'type' => ERROR_GENERAL,
						'info' => array(
							'display_message' => _('Operation failed'),
							'original_message' => $exception->getMessage()
						)
					)
				)
			);
		}
		echo json_encode($return);
	}
}

// create instance of class to download message as file
$messageInstance = new DownloadMessage();

try {
	// initialize variables
	$messageInstance->init($_GET);

	// download message
	$messageInstance->download();
} catch (Exception $e) {
	$messageInstance->handleSaveMessageException($e);
}
?>