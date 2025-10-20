<?php

use Kendox\Client;

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . "/kendox-client/class.kendox-client.php";
require_once __DIR__ . "/class.attachment-info.php";
require_once __DIR__ . "/class.uploadfile.php";
require_once __DIR__ . '/../config.php';

class KendoxModule extends Module {
	// Certificate paths/passwords for prod and test environments
	public $pfxFile = '';
	public $pfxPw = '';
	public $pfxFileTest = '';
	public $pfxPwTest = '';

	public $dialogUrl;
	public $mapiMessage;

	public $kendoxClient;

	/**
	 * @constructor
	 *
	 * @param mixed $id
	 * @param mixed $data
	 */
	public function __construct($id, $data) {
		parent::__construct($id, $data);
		$this->store = $GLOBALS['mapisession']->getDefaultMessageStore();
		$this->pfxFile = $this->resolvePfxPath($this->getConfigValue('PLUGIN_KENDOX_PFX_FILE'));
		$this->pfxPw = $this->getConfigValue('PLUGIN_KENDOX_PFX_PASSWORD');
		$this->pfxFileTest = $this->resolvePfxPath($this->getConfigValue('PLUGIN_KENDOX_PFX_FILE_TEST'));
		$this->pfxPwTest = $this->getConfigValue('PLUGIN_KENDOX_PFX_PASSWORD_TEST');

		if ($this->pfxFileTest === '') {
			$this->pfxFileTest = $this->pfxFile;
		}
		if ($this->pfxPwTest === '') {
			$this->pfxPwTest = $this->pfxPw;
		}
	}

	/**
	 * Executes all the actions in the $data variable.
	 * Exception part is used for authentication errors also.
	 *
	 * @return bool true on success or false on failure
	 */
	#[Override]
	public function execute() {
		foreach ($this->data as $actionType => $actionData) {
			if (isset($actionType)) {
				try {
					switch ($actionType) {
						case "attachmentinfo":
							$response = $this->getAttachmentInfo($actionData["storeId"], $actionData["mailEntryId"]);
							$this->addActionData($actionType, $response);
							$GLOBALS['bus']->addData($this->getResponseData());
							break;

						case "upload":
							$response = $this->upload($actionData["storeId"], $actionData["mailEntryId"], $actionData["uploadType"], $actionData["selectedAttachments"], $actionData["environment"], $actionData["apiUrl"], $actionData["userEMail"]);
							$this->addActionData($actionType, $response);
							$GLOBALS['bus']->addData($this->getResponseData());
							break;
					}
				}
				catch (Exception $e) {
					$response = [];
					$response["Successful"] = false;
					$response["errorMessage"] = $e->getMessage();
					$this->addActionData($actionType, $response);
					$GLOBALS['bus']->addData($this->getResponseData());
				}
			}
		}
	}

	/**
	 * Get attachment information (meta data) of mail.
	 *
	 * @param mixed $storeId
	 * @param mixed $mailEntryId
	 */
	private function getAttachmentInfo($storeId, $mailEntryId) {
		$this->loadMapiMessage($storeId, $mailEntryId);
		$items = [];
		$attachmentTable = mapi_message_getattachmenttable($this->mapiMessage);
		$messageAttachments = mapi_table_queryallrows($attachmentTable, [PR_ATTACH_NUM, PR_ATTACH_SIZE, PR_ATTACH_LONG_FILENAME]);
		foreach ($messageAttachments as $att) {
			$item = new AttachmentInfo();
			$item->id = $att[PR_ATTACH_NUM];
			$item->name = $att[PR_ATTACH_LONG_FILENAME];
			$item->size = $att[PR_ATTACH_SIZE];
			$items[] = $item;
		}
		$response = [];
		$response["Successful"] = true;
		$response["attachments"] = $items;

		return $response;
	}

	/**
	 * Upload of e-mail to InfoShare.
	 *
	 * @param string $mailEntryId         Mail Entry ID
	 * @param mixed  $storeId
	 * @param mixed  $uploadType
	 * @param mixed  $selectedAttachments
	 * @param mixed  $environment
	 * @param mixed  $apiUrl
	 * @param mixed  $userEMail
	 *
	 * @return object
	 */
	private function upload($storeId, $mailEntryId, $uploadType, $selectedAttachments, $environment, $apiUrl, $userEMail) {
		$emlFile = null;
		$this->loadMapiMessage($storeId, $mailEntryId);
		// Write temporary message file (.EML)
		// Send to Kendox InfoShare
		$uploadFiles = [];
		if ($uploadType == "fullEmail") {
			$emlFile = $this->createTempEmlFileFromMapiMessage($mailEntryId);
			if (!file_exists($emlFile)) {
				throw new Exception("EML file " . $emlFile . " not available.");
			}
			$file = new UploadFile();
			$file->tempFile = $emlFile;
			$file->fileType = "email";
			$file->fileName = "email.eml";
			$file->fileLength = filesize($emlFile);
			$file->kendoxFileId = null;
			$uploadFiles[] = $file;
		}
		if ($uploadType == "attachmentsOnly") {
			$uploadFiles = $this->getUploadFilesFromSelectedAttachments($selectedAttachments);
		}

		try {
			$this->sendFiles($environment, $uploadFiles, $apiUrl, $userEMail);
		}
		catch (Exception $ex) {
			throw $ex;
		}
		finally {
			if ($emlFile != null) {
				@unlink($emlFile);
			}
			foreach ($uploadFiles as $uploadFile) {
				@unlink($uploadFile->tempFile);
			}
		}

		try {
			// Return response
			$response = [];
			$response["Successful"] = true;
			$response["apiUrl"] = $apiUrl;
			$response["userEMail"] = $userEMail;
			$response["messageId"] = $mailEntryId;
			$response["kendoxConnectionId"] = $this->kendoxClient->ConnectionId;
			$response["kendoxFiles"] = $uploadFiles;
		}
		catch (Exception $ex) {
			if ($emlFile != null) {
				@unlink($emlFile);
			}
			if ($uploadFiles != null) {
				foreach ($uploadFiles as $uploadFile) {
					@unlink($uploadFile->tempFile);
				}
			}
			$this->logErrorAndThrow("Error on building response message", $ex);
		}

		return $response;
	}

	private function loadMapiMessage($storeId, $mailEntryId) {
		try {
			// Read message store
			$store = $GLOBALS['mapisession']->openMessageStore(hex2bin((string) $storeId));
		}
		catch (Exception $ex) {
			$this->logErrorAndThrow("Error on open MAPI store", $ex);
		}

		try {
			$this->mapiMessage = mapi_msgstore_openentry($store, hex2bin((string) $mailEntryId));
		}
		catch (Exception $ex) {
			$this->logErrorAndThrow("Error on open MAPI message", $ex);
		}
	}

	private function createTempEmlFileFromMapiMessage($mailEntryId) {
		// Read message properties
		try {
			$messageProps = mapi_getprops($this->mapiMessage, [PR_SUBJECT, PR_MESSAGE_CLASS]);
		}
		catch (Exception $ex) {
			$this->logErrorAndThrow("Error on getting MAPI message properties", $ex);
		}

		// Get EML-Stream
		try {
			$fileName = $this->sanitizeValue($mailEntryId, '', ID_REGEX) . '.eml';
			$stream = $this->getEmlStream($messageProps);
			$stat = mapi_stream_stat($stream);
		}
		catch (Exception $ex) {
			$this->logErrorAndThrow("Error on reading EML stream from MAPI Message", $ex);
		}

		// Create temporary file
		try {
			// Set the file length
			$fileLength = $stat['cb'];
			$tempFile = $this->createTempFilename();
			// Read stream for whole message
			for ($i = 0; $i < $fileLength; $i += BLOCK_SIZE) {
				$appendData = mapi_stream_read($stream, BLOCK_SIZE);
				file_put_contents($tempFile, $appendData, FILE_APPEND);
			}

			return $tempFile;
		}
		catch (Exception $ex) {
			$this->logErrorAndThrow("Error on writing temporary EML file", $ex);
		}
	}

	private function createTempFilename() {
		$tempPath = TMP_PATH;

		return $tempPath . $this->getGUID() . ".tmp";
	}

	public function getGUID() {
		if (function_exists('com_create_guid')) {
			return com_create_guid();
		}
		mt_srand((float) microtime() * 10000); // optional for php 4.2.0 and up.
		$charid = strtoupper(md5(uniqid(random_int(0, mt_getrandmax()), true)));
		$hyphen = chr(45); // "-"

		return chr(123) . // "{"
			substr($charid, 0, 8) . $hyphen .
			substr($charid, 8, 4) . $hyphen .
			substr($charid, 12, 4) . $hyphen .
			substr($charid, 16, 4) . $hyphen .
			substr($charid, 20, 12) .
			chr(125); // "}"
	}

	private function getUploadFilesFromSelectedAttachments($selectedAttachments) {
		try {
			$uploadFiles = [];
			$attachmentTable = mapi_message_getattachmenttable($this->mapiMessage);
			$messageAttachments = mapi_table_queryallrows($attachmentTable, [PR_ATTACH_NUM, PR_ATTACH_SIZE, PR_ATTACH_LONG_FILENAME]);
			foreach ($selectedAttachments as $att) {
				$tmpFile = $this->createTempFilename();

				try {
					$this->saveAttachmentToTempFile($tmpFile, $att["attachmentNumber"]);
					$file = new UploadFile();
					$file->tempFile = $tmpFile;
					$file->fileType = "attachment";
					$file->fileName = $messageAttachments[$att["attachmentNumber"]][PR_ATTACH_LONG_FILENAME];
					$file->fileLength = filesize($tmpFile);
					$file->kendoxFileId = null;
					$uploadFiles[] = $file;
				}
				catch (Exception $exFile) {
					@unlink($tmpFile);

					throw $exFile;
				}
			}
			if (count($uploadFiles) == 0) {
				throw new Exception("No attachments selected.");
			}

			return $uploadFiles;
		}
		catch (Exception $ex) {
			$this->logErrorAndThrow("Error on creating upload files from attachment.", $ex);
		}
	}

	/**
	 * Sending file to Kendox InfoShare.
	 *
	 * @param UploadFile[] $uploadFiles Files to upload
	 * @param mixed        $environment
	 * @param mixed        $apiUrl
	 * @param mixed        $userEMail
	 */
	private function sendFiles($environment, $uploadFiles, $apiUrl, $userEMail) {
		try {
			$targetEnvironment = strtolower((string) $environment) === "prod" ? "prod" : "test";
			$pfx = $targetEnvironment === "prod" ? $this->pfxFile : $this->pfxFileTest;
			$pfxPw = $targetEnvironment === "prod" ? $this->pfxPw : $this->pfxPwTest;
			if ($pfx === '') {
				throw new Exception(_("Kendox certificate path is not configured."));
			}
			if ($pfxPw === '') {
				throw new Exception(_("Kendox certificate password is not configured."));
			}
			if (!file_exists($pfx)) {
				throw new Exception(_("Kendox certificate is not available."));
			}
			if (!is_readable($pfx)) {
				throw new Exception(_("Kendox certificate is not readable."));
			}
			$this->kendoxClient = new Client($apiUrl);
			$uid = $this->kendoxClient->loginWithToken($pfx, $pfxPw, "svc_grommunio");
			$query = [
				[
					"ColumnName" => "email",
					"RelationalOperator" => "Equals",
					"Value" => $userEMail],
			];
			$result = $this->kendoxClient->userTableQuery("grommunio", $query, false);
			if (count($result) == 0) {
				throw new Exception("User with e-mail address " . $userEMail . " not found in Kendox user table grommunio.");
			}
			$uid = $result[0][1];
			$this->kendoxClient->logout();
			// Login and upload
			$this->kendoxClient->loginWithToken($pfx, $pfxPw, $uid);
			foreach ($uploadFiles as $uploadFile) {
				try {
					$uploadFile->kendoxFileId = $this->kendoxClient->uploadFile($uploadFile->tempFile);
				}
				catch (Exception $exUpload) {
					$this->logErrorAndThrow("Upload of file " . $uploadFile->fileName . " failed.", $exUpload);
				}
			}
		}
		catch (Exception $ex) {
			$this->logErrorAndThrow("Sending files failed", $ex);
		}
	}

	private function getConfigValue($constantName) {
		if (!defined($constantName)) {
			return '';
		}

		$value = constant($constantName);

		return is_string($value) ? trim($value) : '';
	}

	private function resolvePfxPath($path) {
		if ($path === '') {
			return '';
		}

		if ($path[0] === '/' || preg_match('/^[A-Za-z]:[\\\\\\/]/', $path) === 1) {
			return $path;
		}

		return dirname(__DIR__) . '/' . ltrim(str_replace('\\', '/', $path), '/');
	}

	/**
	 * Logging an error and throw the exception.
	 *
	 * @param string    $displayMessage
	 * @param Exception $ex
	 */
	public function logErrorAndThrow($displayMessage, $ex): never {
		$errMsg = $displayMessage . ": " . $ex->getMessage();
		error_log($errMsg);
		error_log($ex->getTraceAsString());

		throw new Exception($errMsg);
	}

	/**
	 * Function will obtain stream from the message, For email messages it will open email as
	 * inet object and get the stream content as eml format.
	 *
	 * @param array $messageProps properties of this particular message
	 *
	 * @return Stream $stream the eml stream obtained from message
	 */
	public function getEmlStream($messageProps) {
		$addrBook = $GLOBALS['mapisession']->getAddressbook();

		return mapi_inetmapi_imtoinet($GLOBALS['mapisession']->getSession(), $addrBook, $this->mapiMessage, []);
	}

	/**
	 * Function to get binary content of an attachment
	 * PR_ATTACH_DATA_BIN.
	 *
	 * @param string $tempFile         Path and file of temporary attachment file
	 * @param int    $attachmentNumber Number of attachment
	 *
	 * @return string
	 */
	public function saveAttachmentToTempFile($tempFile, $attachmentNumber) {
		$attach = mapi_message_openattach($this->mapiMessage, $attachmentNumber);
		file_put_contents($tempFile, mapi_attach_openbin($attach, PR_ATTACH_DATA_BIN));
	}

	/**
	 * Function to sanitize user input values to prevent XSS attacks.
	 *
	 * @param mixed  $value   value that should be sanitized
	 * @param mixed  $default default value to return when value is not safe
	 * @param string $regex   regex to validate values based on type of value passed
	 */
	public function sanitizeValue($value, $default = '', $regex = false) {
		$result = addslashes((string) $value);
		if ($regex) {
			$match = preg_match_all($regex, $result);
			if (!$match) {
				$result = $default;
			}
		}

		return $result;
	}
}
