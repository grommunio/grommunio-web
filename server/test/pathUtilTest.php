<?php

require_once dirname(__DIR__, 2) . '/plugins/files/php/Files/Core/Util/class.pathutil.php';

use Files\Core\Util\PathUtil;

$extensionTypes = [
	'/remote/reports/summary.PDF' => 'application/pdf',
	'/remote/archive.tar.zip' => 'application/zip',
	'/remote/no-known-extension' => 'application/octet-stream',
	__FILE__ => 'text/html',
];

foreach ($extensionTypes as $filename => $expectedType) {
	$actualType = PathUtil::getMimeFromExtension($filename);
	if ($actualType !== $expectedType) {
		throw new RuntimeException(sprintf('Expected MIME type %s for %s, got %s.', $expectedType, $filename, $actualType));
	}
}

if (PathUtil::get_mime('/remote/reports/summary.PDF', 1) !== 'application/pdf') {
	throw new RuntimeException('Legacy extension-only MIME detection changed unexpectedly.');
}

echo "Path extension MIME checks passed\n";
