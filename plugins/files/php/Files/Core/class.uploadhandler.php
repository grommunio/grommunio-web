<?php

/**
 * Created by PhpStorm.
 * User: zdev
 * Date: 12.01.15
 * Time: 23:49.
 */

namespace Files\Core;

require_once __DIR__ . "/class.accountstore.php";

require_once __DIR__ . "/Util/class.pathutil.php";
require_once __DIR__ . "/Util/util.php";
require_once __DIR__ . "/Util/class.logger.php";

use Files\Backend\BackendStore;
use Files\Backend\Exception;
use Files\Core\Util\Logger;

class UploadHandler {
	public const LOG_CONTEXT = "UploadHandler"; // Context for the Logger

	public static function doUpload() {
		// parse account id.
		if (isset($_POST["parentID"])) { // will be set if a standard upload is used.
			$dstID = $_POST["parentID"];
		}
		else {
			if (isset($_SERVER['HTTP_X_FILE_DESTINATION'])) { // will be set if the upload is a ajax upload.
				$dstID = $_SERVER['HTTP_X_FILE_DESTINATION'];
			}
			else {
				Logger::error(self::LOG_CONTEXT, "upload failed: No destination given");
				echo json_encode(['success' => false, 'response' => 'No destination given', 'message' => 'No destination given']);

				exit;
			}
		}

		$accountID = substr((string) $dstID, 3, strpos((string) $dstID, '/') - 3);

		// relative node ID. We need to trim off the #R# and account ID
		$relNodeId = substr((string) $dstID, strpos((string) $dstID, '/'));

		// Initialize the account and backendstore
		$accountStore = new AccountStore();
		$backendStore = BackendStore::getInstance();

		$account = $accountStore->getAccount($accountID);

		// initialize the backend
		$initializedBackend = $backendStore->getInstanceOfBackend($account->getBackend());
		$initializedBackend->init_backend($account->getBackendConfig());

		try {
			$initializedBackend->open();
		}
		catch (Exception $e) {
			Logger::error(self::LOG_CONTEXT, "backend initialization failed: " . $e->getMessage());
			echo json_encode(['success' => false, 'response' => $e->getCode(), 'message' => $e->getMessage()]);

			exit;
		}

		// check if we are getting the file via the "new" method (ajax - XMLHttpRequest) or the standard way
		if (isset($_SERVER['HTTP_X_FILE_NAME'], $_SERVER['HTTP_X_FILE_SIZE'])) { // use the ajax method
			$targetPath = stringToUTF8Encode($relNodeId . $_SERVER['HTTP_X_FILE_NAME']);
			// check if backend supports streaming - this is the preferred way to upload files!
			if ($initializedBackend->supports(BackendStore::FEATURE_STREAMING)) {
				$fileReader = fopen('php://input', "r");
				$targetPath = UploadHandler::checkFilesNameConflict($targetPath, $initializedBackend, $relNodeId);
				$fileWriter = $initializedBackend->getStreamwriter($targetPath);

				while (true) {
					set_time_limit(0);
					$buffer = fgets($fileReader, 4096);
					if (strlen($buffer) == 0) {
						fclose($fileReader);
						fclose($fileWriter);
						break;
					}

					fwrite($fileWriter, $buffer);
				}
			}
			else { // fallback to tmp files
				$targetPath = UploadHandler::checkFilesNameConflict($targetPath, $initializedBackend, $relNodeId);
				$targetPath = rawurldecode($targetPath);
				$temp_file = tempnam(TMP_PATH, "{$targetPath}");
				$fileReader = fopen('php://input', "r");
				$fileWriter = fopen($temp_file, "w");

				// store post data to tmp file
				while (true) {
					set_time_limit(0);
					$buffer = fgets($fileReader, 4096);
					if (strlen($buffer) == 0) {
						fclose($fileReader);
						fclose($fileWriter);
						break;
					}

					fwrite($fileWriter, $buffer);
				}

				// upload tmp file to backend
				$initializedBackend->put_file($targetPath, $temp_file);
				// clean up tmp file
				unlink($temp_file);
			}
			echo json_encode(['success' => true, 'parent' => $dstID, 'item' => $targetPath]);

			exit;
		}   // upload the standard way with $_FILES
		$items = [];

		try {
			$attachmentsCount = count($_FILES['attachments']['name']);
			for ($i = 0; $i < $attachmentsCount; ++$i) {
				$targetPath = stringToUTF8Encode($relNodeId . $_FILES['attachments']['name'][$i]);

				// upload the file
				// check if backend supports streaming - this is the preferred way to upload files!
				if ($initializedBackend->supports(BackendStore::FEATURE_STREAMING)) {
					$fileReader = fopen($_FILES['attachments']['tmp_name'][$i], "r");
					$fileWriter = $initializedBackend->getStreamwriter($targetPath);

					while (true) {
						set_time_limit(0);
						$buffer = fgets($fileReader, 4096);
						if (strlen($buffer) == 0) {
							fclose($fileReader);
							fclose($fileWriter);
							break;
						}

						fwrite($fileWriter, $buffer);
					}
				}
				else { // use the normal way - might have a high memory footprint
					$initializedBackend->put_file($targetPath, $_FILES['attachments']['tmp_name'][$i]);
				}

				$items[] = ['tmp_name' => $_FILES['attachments']['tmp_name'][$i], 'name' => $_FILES['attachments']['name'][$i]];
			}
			echo json_encode(['success' => true, 'parent' => $dstID, 'items' => $items]);

			exit;
		}
		catch (Exception $e) {
			Logger::error(self::LOG_CONTEXT, "upload failed: " . $e->getMessage());
			echo json_encode(['success' => false, 'response' => $e->getCode(), 'message' => $e->getMessage()]);

			exit;
		}
	}

	/**
	 * Create a unique file name if file is already exist in backend and user
	 * wants to keep both on server.
	 *
	 * @param string $targetPath         targeted files path
	 * @param object $initializedBackend Supported abstract backend object (i.e ftp,smb,owncloud etc.. )
	 * @param string $relNodeId          relay node id
	 *
	 * @return string target file path
	 */
	public static function checkFilesNameConflict($targetPath, $initializedBackend, $relNodeId) {
		$keepBoth = $_REQUEST["keep_both"] ?? false;
		// Check if file was already exist in directory and $keepBoth is true
		// then append the counter in files name.
		if (strtolower((string) $keepBoth) === 'true') {
			$lsNodes = $initializedBackend->ls($relNodeId);
			$nodeExist = array_key_exists(rawurldecode($targetPath), $lsNodes);
			if ($nodeExist) {
				$i = 1;
				$targetPathInfo = pathinfo($targetPath);
				do {
					$targetPath = $targetPathInfo["dirname"] . "/" . $targetPathInfo["filename"] . " (" . $i . ")." . $targetPathInfo["extension"];
					$targetPath = str_replace('//', '/', $targetPath);
					++$i;
				}
				while (array_key_exists(rawurldecode($targetPath), $lsNodes));
			}
		}

		return $targetPath;
	}
}
