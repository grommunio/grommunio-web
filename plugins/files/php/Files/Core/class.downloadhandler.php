<?php
/**
 * Created by PhpStorm.
 * User: zdev
 * Date: 12.01.15
 * Time: 23:49
 */

namespace Files\Core;

require_once __DIR__ . "/class.accountstore.php";

require_once __DIR__ . "/Util/class.pathutil.php";
require_once __DIR__ . "/Util/class.logger.php";

use \Files\Core\Util\PathUtil;
use \Files\Core\Util\Logger;


class DownloadHandler
{
	const LOG_CONTEXT = "DownloadHandler"; // Context for the Logger

	public static function doDownload()
	{
		// parse account id.
		// wo only need to parse one string because it is
		// only possible to download files from one backend at a time.
		if (isset($_GET["ids"])) {
			$tmpId = $_GET["ids"][0];
		} else {
			$tmpId = $_GET["id"];
		}
		$accountID = substr($tmpId, 3, (strpos($tmpId, '/') - 3));

		// Initialize the account and backendstore
		$accountStore = new \Files\Core\AccountStore();
		$backendStore = \Files\Backend\BackendStore::getInstance();

		$account = $accountStore->getAccount($accountID);

		// initialize the backend
		$initializedBackend = $backendStore->getInstanceOfBackend($account->getBackend());
		$initializedBackend->init_backend($account->getBackendConfig());

		try {
			$initializedBackend->open();
		} catch (\Files\Backend\Exception $e) {
			Logger::error(self::LOG_CONTEXT, "Could not open the backend: " . $e->getMessage());

			if ((isset($_GET["inline"]) && $_GET["inline"] == "false") || (isset($_GET["contentDispositionType"]) && $_GET["contentDispositionType"] == "attachment")) {
				// Javascript error message
				echo "<script>alert('" . dgettext('plugin_files', 'File backend not responding. Please try again later.') . "');</script>";
			} else {
				// Text error message that is shown in the preview box
				echo dgettext('plugin_files', 'File backend not responding. Please try again later.');
			}
			die();
		}

		try {
			if (isset($_GET["ids"])) {
				$zip = new \ZipArchive;
				$zipname = TMP_PATH . '/files_' . date("dmY_Hi") . '.zip';
				Logger::debug(self::LOG_CONTEXT, "Download file tmp path: " . $zipname);
				$res = $zip->open($zipname, \ZipArchive::CREATE);
				if ($res !== true) {
					Logger::error(self::LOG_CONTEXT, "Zip creation failed: " . $res);
					echo "<script>alert('" . dgettext('plugin_files', 'Zip file generation failed. Please inform the administrator.') . "');</script>";

					die();
				}
				$i = 0;
				$tmpfiles = array();
				foreach ($_GET["ids"] as $id) {
					// relative node ID. We need to trim off the #R# and account ID
					$relNodeId = substr($id, strpos($id, '/'));

					$tmpfiles[$i] = tempnam(TMP_PATH, stripslashes(base64_encode($relNodeId)));
					$initializedBackend->get_file($relNodeId, $tmpfiles[$i]);

					$res = $zip->addFile($tmpfiles[$i], PathUtil::getFilenameFromPath($relNodeId));
					$i++;
					if ($res !== true) {
						Logger::error(self::LOG_CONTEXT, "Zip addFile failed: " . $res . " file: " . $tmpfiles[$i] . " id: " . $relNodeId);
						echo "<script>alert('" . dgettext('plugin_files', 'Zip file generation failed. Please inform the administrator.') . "');</script>";

						die();
					}
				}
				$zip->close();

				// no caching
				header('Content-Disposition: attachment; filename="' . basename($zipname) . '"');
				header("Expires: 0"); // set expiration time
				header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
				header('Content-Length: ' . filesize($zipname));
				header('Content-Type: application/zip');
				readfile($zipname);
				unlink($zipname);
				foreach ($tmpfiles as $tmpfile) {
					unlink($tmpfile);
				}
				die();
			} else {
				// relative node ID. We need to trim off the #R# and account ID
				$relNodeId = substr($_GET["id"], strpos($_GET["id"], '/'));
				$stream = false;

				$tmpfile;
				if (!$initializedBackend->supports(\Files\Backend\BackendStore::FEATURE_STREAMING)) {
					$tmpfile = tempnam(TMP_PATH, stripslashes(base64_encode($relNodeId)));
					$initializedBackend->get_file($relNodeId, $tmpfile);
					$filesize = filesize($tmpfile);
				} else {
					$gpi = $initializedBackend->gpi($relNodeId);
					$stream = true;
					$filesize = $gpi["getcontentlength"];
				}

				$mime = PathUtil::get_mime($relNodeId);

				// set headers here
				if ((isset($_GET["inline"]) && $_GET["inline"] == "false") || (isset($_GET["contentDispositionType"]) && $_GET["contentDispositionType"] == "attachment")) {
					header('Content-Disposition: attachment; filename="' . PathUtil::getFilenameFromPath($relNodeId) . '"');
				}

				// no caching
				header("Expires: 0"); // set expiration time
				header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
				header('Content-Length: ' . $filesize);
				header('Content-Type: ' . $mime);
				flush();

				if (!$stream) {
					// print the downloaded file
					readfile($tmpfile);
					ignore_user_abort(true);
					unlink($tmpfile);
				} else {
					// stream the file directly from the backend - much faster
					$fh = $initializedBackend->getStreamReader($relNodeId);
					while (!feof($fh)) {
						set_time_limit(0);
						print fread($fh, 4096);
						ob_flush();
						flush();
					}
					fclose($fh);
				}
				die();
			}
		} catch (\Files\Backend\Exception $e) {
			Logger::error(self::LOG_CONTEXT, "Downloading failed: " . $e->getMessage());

			if (isset($_GET["inline"]) && $_GET["inline"] == "false") {
				// Javascript error message
				echo "<script>alert('" . dgettext('plugin_files', 'This file is no longer available. Please reload the folder.') . "');</script>";
			} else {
				// Text error message that is shown in the preview box
				echo dgettext('plugin_files', 'This file is no longer available. Please reload the folder.');
			}
			die();
		}
	}
}
