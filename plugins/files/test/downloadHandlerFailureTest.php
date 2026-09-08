<?php

namespace Files\Core {
	function tempnam(/* @scrutinizer ignore-unused */ $directory, /* @scrutinizer ignore-unused */ $prefix) {
		return false;
	}

	function is_file(/* @scrutinizer ignore-unused */ $filename) {
		return true;
	}

	function filesize(/* @scrutinizer ignore-unused */ $filename) {
		return false;
	}
}

namespace {
	define('BASE_PATH', sys_get_temp_dir() . '/');
	define('TMP_PATH', sys_get_temp_dir());
	define('PLUGIN_FILESBROWSER_LOGLEVEL', 'ERROR');

	require_once dirname(__DIR__) . '/php/Files/Core/class.downloadhandler.php';

	use Files\Core\DownloadHandler;

	$createTemporaryFile = new ReflectionMethod(DownloadHandler::class, 'createTemporaryFile');
	$getFileSize = new ReflectionMethod(DownloadHandler::class, 'getFileSize');

	try {
		$createTemporaryFile->invoke(null, 'files_');

		throw new RuntimeException('A failed temporary-file creation was accepted.');
	}
	catch (RuntimeException $e) {
		if (!str_contains($e->getMessage(), 'temporary download file')) {
			throw $e;
		}
	}

	try {
		$getFileSize->invoke(null, '/unreadable-download');

		throw new RuntimeException('A failed file-size lookup was accepted.');
	}
	catch (RuntimeException $e) {
		if (!str_contains($e->getMessage(), '/unreadable-download')) {
			throw $e;
		}
	}

	echo "Download handler failure checks passed\n";
}
