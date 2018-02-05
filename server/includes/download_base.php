<?php
/**
 * DownloadBase
 *
 * An abstract class which serve as base to manage downloading
 */
abstract class DownloadBase
{
	/**
	 * Resource of the MAPIStore which holds the message which we need to save as file.
	 */
	protected $store;

	/**
	 * Entryid of the MAPIStore which holds the message which we need to save as file.
	 */
	protected $storeId;

	/**
	 * Entryid of the MAPIMessage which we need to save as file.
	 */
	protected $entryId;

	/**
	 * Array of entryids of all the MAPIMessages which we need to include in ZIP.
	 */
	protected $entryIds;

	/**
	 * Resource of MAPIMessage which we need to save as file.
	 */
	protected $message;

	/**
	 * A boolean value, set to false by default, to define if all the attachments are requested to be downloaded in a zip or not.
	 */
	protected $allAsZip;

	/**
	 * Array to hold file names added into the ZIP which is used to avoid similar file names to be added in ZIP.
	 */
	protected $fileNameTracker;

	/**
	 * Constructor
	 */
	public function __construct()
	{
		$this->storeId = false;
		$this->entryId = false;
		$this->allAsZip = false;
		$this->fileNameTracker = array();
		$this->entryIds = array();
		$this->message = false;
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
	 * Helper function to set necessary headers.
	 * @param String $filename Proper name for the file to be downloaded.
	 * @param Number $contentLength Total size of file content.
	 */
	function setNecessaryHeaders($filename, $contentLength)
	{
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
		header('Content-Length: ' . $contentLength);
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

		// Convert message class into human readable format, so user can easily understand the display message.
		switch ($this->getTrimmedMessageClass($mapiMessageClass)) {
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
	 * Returns message-class removing technical prefix/postfix from
	 * original/technical message class.
	 *
	 * @param string $mapiMessageClass message type as defined in MAPI.
	 * @return string $messageClass message class without any prefix/postfix.
	 */
	function getTrimmedMessageClass($mapiMessageClass)
	{
		// Here, we have technical message class, so we need to remove technical prefix/postfix, if any.
		// Creates an array of strings by splitting the message class from dot(.)
		$explodedMessageClass = explode(".", $mapiMessageClass);
		$ipmIndex = array_search('IPM', $explodedMessageClass);

		return $explodedMessageClass[$ipmIndex + 1];
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

	/**
	 * Abstract Generic function to check received data and decide either the eml/vcf file or
	 * ZIP file is requested to be downloaded.
	 */
	abstract protected function download();
}
?>
