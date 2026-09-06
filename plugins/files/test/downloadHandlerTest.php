<?php

$temporaryDirectory = sys_get_temp_dir() . '/grommunio-download-handler-' . bin2hex(random_bytes(8));
if (!mkdir($temporaryDirectory, 0700)) {
	throw new RuntimeException('Unable to create the download handler test directory.');
}

define('BASE_PATH', $temporaryDirectory . '/');
define('TMP_PATH', $temporaryDirectory);
define('PLUGIN_FILESBROWSER_LOGLEVEL', 'ERROR');

require_once dirname(__DIR__) . '/php/Files/Core/class.downloadhandler.php';

use Files\Core\DownloadHandler;

$createTemporaryFile = new ReflectionMethod(DownloadHandler::class, 'createTemporaryFile');
$addFileToArchive = new ReflectionMethod(DownloadHandler::class, 'addFileToArchive');
$getFileSize = new ReflectionMethod(DownloadHandler::class, 'getFileSize');
$deleteTemporaryFile = new ReflectionMethod(DownloadHandler::class, 'deleteTemporaryFile');

$temporaryFiles = [];

try {
	$downloadFile = $createTemporaryFile->invoke(null, 'files_');
	$temporaryFiles[] = $downloadFile;
	if (dirname($downloadFile) !== $temporaryDirectory) {
		throw new RuntimeException('The temporary download file was created outside TMP_PATH.');
	}
	if (file_put_contents($downloadFile, 'download') !== 8 || $getFileSize->invoke(null, $downloadFile) !== 8) {
		throw new RuntimeException('The temporary download size was not determined correctly.');
	}

	$missingFile = $temporaryDirectory . '/missing';

	try {
		$getFileSize->invoke(null, $missingFile);

		throw new RuntimeException('A missing download file was accepted.');
	}
	catch (RuntimeException $e) {
		if (!str_contains($e->getMessage(), $missingFile)) {
			throw $e;
		}
	}

	if (class_exists(ZipArchive::class)) {
		$archiveFile = $createTemporaryFile->invoke(null, 'archive_');
		$temporaryFiles[] = $archiveFile;
		$zip = new ZipArchive();
		if ($zip->open($archiveFile, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
			throw new RuntimeException('Unable to open the test Zip archive.');
		}
		$addFileToArchive->invoke(null, $zip, $downloadFile, '/documents/download.txt');

		try {
			$addFileToArchive->invoke(null, $zip, $missingFile, '/documents/missing.txt');

			throw new RuntimeException('A missing Zip source file was accepted.');
		}
		catch (RuntimeException $e) {
			if (!str_contains($e->getMessage(), $missingFile) || !str_contains($e->getMessage(), '/documents/missing.txt')) {
				throw new RuntimeException('The Zip failure did not identify the file that actually failed.', 0, $e);
			}
		}

		if (!$zip->close()) {
			throw new RuntimeException('Unable to close the test Zip archive.');
		}
		$zip = new ZipArchive();
		if ($zip->open($archiveFile) !== true || $zip->getFromName('download.txt') !== 'download') {
			throw new RuntimeException('The downloaded file was not added to the Zip archive.');
		}
		if (!$zip->close()) {
			throw new RuntimeException('Unable to close the verified Zip archive.');
		}
	}

	$deleteTemporaryFile->invoke(null, $downloadFile);
	if (is_file($downloadFile)) {
		throw new RuntimeException('The temporary download file was not removed.');
	}
}
finally {
	foreach ($temporaryFiles as $temporaryFile) {
		if (is_file($temporaryFile)) {
			unlink($temporaryFile);
		}
	}
	rmdir($temporaryDirectory);
}

echo "Download handler checks passed\n";
