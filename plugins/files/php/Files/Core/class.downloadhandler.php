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
require_once __DIR__ . "/Util/class.logger.php";

use Files\Backend\BackendStore;
use Files\Backend\Exception as BackendException;
use Files\Backend\iFeatureStreaming;
use Files\Core\Util\Logger;
use Files\Core\Util\PathUtil;

class DownloadHandler {
	public const LOG_CONTEXT = "DownloadHandler"; // Context for the Logger

	public static function doDownload() {
		// parse account id.
		// wo only need to parse one string because it is
		// only possible to download files from one backend at a time.
		if (isset($_GET["ids"])) {
			$tmpId = $_GET["ids"][0];
		}
		else {
			$tmpId = $_GET["id"];
		}
		$accountID = substr((string) $tmpId, 3, strpos((string) $tmpId, '/') - 3);

		// Initialize the account and backendstore
		$accountStore = new AccountStore();
		$backendStore = BackendStore::getInstance();

		$account = $accountStore->getAccount($accountID);
		if ($account === null) {
			Logger::error(self::LOG_CONTEXT, "Unknown account ID: " . $accountID);
			if ((isset($_GET["inline"]) && $_GET["inline"] == "false") || (isset($_GET["contentDispositionType"]) && $_GET["contentDispositionType"] == "attachment")) {
				echo "<script>alert('" . _('Unknown account ID') . "');</script>";
			}
			else {
				echo _('Unknown account ID');
			}

			exit;
		}

		// initialize the backend
		$initializedBackend = $backendStore->getInstanceOfBackend($account->getBackend());
		if ($initializedBackend === false) {
			Logger::error(self::LOG_CONTEXT, "Unknown backend: " . $account->getBackend());
			if ((isset($_GET["inline"]) && $_GET["inline"] == "false") || (isset($_GET["contentDispositionType"]) && $_GET["contentDispositionType"] == "attachment")) {
				echo "<script>alert('" . _('File backend not responding. Please try again later.') . "');</script>";
			}
			else {
				echo _('File backend not responding. Please try again later.');
			}

			exit;
		}
		$initializedBackend->init_backend($account->getBackendConfig());

		try {
			$initializedBackend->open();
		}
		catch (BackendException $e) {
			Logger::error(self::LOG_CONTEXT, "Could not open the backend: " . $e->getMessage());

			if ((isset($_GET["inline"]) && $_GET["inline"] == "false") || (isset($_GET["contentDispositionType"]) && $_GET["contentDispositionType"] == "attachment")) {
				// Javascript error message
				echo "<script>alert('" . _('File backend not responding. Please try again later.') . "');</script>";
			}
			else {
				// Text error message that is shown in the preview box
				echo _('File backend not responding. Please try again later.');
			}

			exit;
		}

		try {
			if (isset($_GET["ids"])) {
				$zip = new \ZipArchive();
				$tmpfiles = [];

				try {
					$zipname = self::createTemporaryFile('files_');
					$zipIsOpen = false;

					try {
						Logger::debug(self::LOG_CONTEXT, "Download file tmp path: " . $zipname);
						$res = $zip->open($zipname, \ZipArchive::CREATE | \ZipArchive::OVERWRITE);
						if ($res !== true) {
							throw new \RuntimeException('Zip creation failed with code: ' . self::formatZipError($res));
						}
						$zipIsOpen = true;

						foreach ($_GET["ids"] as $id) {
							// relative node ID. We need to trim off the #R# and account ID
							$relNodeId = substr((string) $id, strpos((string) $id, '/'));
							$tmpfile = self::createTemporaryFile('files_');
							$tmpfiles[] = $tmpfile;
							$initializedBackend->get_file($relNodeId, $tmpfile);
							self::addFileToArchive($zip, $tmpfile, $relNodeId);
						}

						if (!$zip->close()) {
							throw new \RuntimeException('Zip archive could not be finalized: ' . $zipname);
						}
						$zipIsOpen = false;

						// no caching
						sendDownloadSecurityHeaders();
						header('Content-Disposition: attachment; filename="files_' . date("dmY_Hi") . '.zip"');
						header("Expires: 0"); // set expiration time
						header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
						header('Content-Length: ' . self::getFileSize($zipname));
						header('Content-Type: application/zip');
						ignore_user_abort(true);
						if (readfile($zipname) === false) {
							Logger::error(self::LOG_CONTEXT, "Could not read generated Zip file: " . $zipname);
						}
					}
					finally {
						if ($zipIsOpen && !$zip->close()) {
							Logger::error(self::LOG_CONTEXT, "Could not close failed Zip archive: " . $zipname);
						}
						self::deleteTemporaryFile($zipname);
						foreach ($tmpfiles as $tmpfile) {
							self::deleteTemporaryFile($tmpfile);
						}
					}
				}
				catch (\RuntimeException $e) {
					Logger::error(self::LOG_CONTEXT, $e->getMessage());
					echo "<script>alert('" . _('Zip file generation failed. Please inform the administrator.') . "');</script>";
				}

				exit;
			}
			// relative node ID. We need to trim off the #R# and account ID
			$relNodeId = substr((string) $_GET["id"], strpos((string) $_GET["id"], '/'));
			$tmpfile = null;
			$fh = null;

			try {
				// Backends are loaded dynamically, so their optional interfaces cannot be inferred statically.
				if (!/** @scrutinizer ignore-type */ $initializedBackend instanceof iFeatureStreaming) {
					$tmpfile = self::createTemporaryFile('files_');
					$initializedBackend->get_file($relNodeId, $tmpfile);
					$filesize = self::getFileSize($tmpfile);
					$mime = PathUtil::get_mime($tmpfile);
				}
				else {
					$gpi = $initializedBackend->gpi($relNodeId);
					$filesize = filter_var($gpi["getcontentlength"] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]);
					if ($filesize === false) {
						throw new \RuntimeException('Backend returned an invalid file size for: ' . $relNodeId);
					}
					// The feature check above guarantees that the dynamic backend provides this method.

					/** @scrutinizer ignore-call */
					$fh = $initializedBackend->getStreamReader($relNodeId);
					if (!is_resource($fh) || get_resource_type($fh) !== 'stream') {
						throw new \RuntimeException('Backend did not return a readable stream for: ' . $relNodeId);
					}
					$mime = PathUtil::getMimeFromExtension($relNodeId);
				}

				$mime = normalizeHTTPContentType($mime);
				$requestedDisposition = (isset($_GET["inline"]) && $_GET["inline"] == "false") ||
					(isset($_GET["contentDispositionType"]) && $_GET["contentDispositionType"] == "attachment")
					? 'attachment'
					: 'inline';
				$contentDisposition = getDownloadContentDisposition($requestedDisposition, $mime);
				$filename = addslashes(browserDependingHTTPHeaderEncode(PathUtil::getFilenameFromPath($relNodeId)));

				// set headers here
				// no caching
				sendDownloadSecurityHeaders();
				header('Content-Disposition: ' . $contentDisposition . '; filename="' . $filename . '"');
				header("Expires: 0"); // set expiration time
				header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
				header('Content-Length: ' . $filesize);
				// normalizeHTTPContentType() rejects control characters and invalid media types.

				/** @scrutinizer ignore-call */
				header('Content-Type: ' . $mime);
				flush();
				ignore_user_abort(true);

				if (is_string($tmpfile)) {
					// print the downloaded file
					if (readfile($tmpfile) === false) {
						Logger::error(self::LOG_CONTEXT, "Could not read downloaded file: " . $tmpfile);
					}
				}
				else {
					// stream the file directly from the backend - much faster
					while (!feof($fh)) {
						set_time_limit(0);
						$buffer = fread($fh, 4096);
						if ($buffer === false) {
							Logger::error(self::LOG_CONTEXT, "Could not read backend stream for: " . $relNodeId);

							break;
						}
						echo $buffer;
						ob_flush();
						flush();
					}
				}
			}
			finally {
				if (is_resource($fh) && !fclose($fh)) {
					Logger::error(self::LOG_CONTEXT, "Could not close backend stream for: " . $relNodeId);
				}
				if (is_string($tmpfile)) {
					self::deleteTemporaryFile($tmpfile);
				}
			}

			exit;
		}
		catch (BackendException|\RuntimeException $e) {
			Logger::error(self::LOG_CONTEXT, "Downloading failed: " . $e->getMessage());

			if (isset($_GET["inline"]) && $_GET["inline"] == "false") {
				// Javascript error message
				echo "<script>alert('" . _('This file is no longer available. Please reload the folder.') . "');</script>";
			}
			else {
				// Text error message that is shown in the preview box
				echo _('This file is no longer available. Please reload the folder.');
			}

			exit;
		}
	}

	/**
	 * Create a uniquely named file in the download temporary directory.
	 *
	 * @throws \RuntimeException if the temporary file cannot be created
	 */
	private static function createTemporaryFile(string $prefix): string {
		$tmpfile = tempnam(TMP_PATH, $prefix);
		if (/* @scrutinizer ignore-type */ $tmpfile === false) {
			throw new \RuntimeException('Could not create a temporary download file.');
		}

		return $tmpfile;
	}

	/**
	 * Add a downloaded file to an open Zip archive.
	 *
	 * @throws \RuntimeException if ZipArchive rejects the file
	 */
	private static function addFileToArchive(\ZipArchive $zip, string $tmpfile, string $relNodeId): void {
		if (!is_file($tmpfile) || !$zip->addFile($tmpfile, PathUtil::getFilenameFromPath($relNodeId))) {
			throw new \RuntimeException("Zip addFile failed for file: " . $tmpfile . " id: " . $relNodeId);
		}
	}

	/**
	 * Get a local download's size.
	 *
	 * @throws \RuntimeException if the file size cannot be determined
	 */
	private static function getFileSize(string $filename): int {
		if (!is_file($filename)) {
			throw new \RuntimeException('Could not determine download size for: ' . $filename);
		}
		$filesize = filesize($filename);
		if (/* @scrutinizer ignore-type */ $filesize === false) {
			throw new \RuntimeException('Could not determine download size for: ' . $filename);
		}

		return $filesize;
	}

	/**
	 * Delete a temporary download file, logging cleanup failures.
	 */
	private static function deleteTemporaryFile(string $filename): void {
		if (is_file($filename) && !unlink($filename)) {
			Logger::error(self::LOG_CONTEXT, "Could not remove temporary download file: " . $filename);
		}
	}

	/**
	 * Format the error value returned by ZipArchive::open().
	 *
	 * @param bool|int $error
	 */
	private static function formatZipError($error): string {
		return $error === false ? 'false' : (string) $error;
	}
}
