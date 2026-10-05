<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace Files\Core\Util;

// Namespaced stand-ins take precedence over the MAPI extension.
const PR_ATTACH_LONG_FILENAME = 1;
const PR_ATTACH_FILENAME = 2;
const PR_DISPLAY_NAME = 3;
const PR_ATTACH_DATA_BIN = 4;
const IID_IStream = 'stream';
const BLOCK_SIZE = 4;

function mapi_msgstore_openentry($store, $entryid) {
	return ['message' => $entryid];
}

function mapi_message_openattach($message, $num) {
	return ['attach' => $num];
}

function mapi_attach_openobj($attach) {
	return ['message' => 'embedded'];
}

function mapi_attach_getprops($attachment, $tags) {
	return $GLOBALS['testProps'];
}

function mapi_openproperty($attachment, $tag, $iid, $a, $b) {
	return $GLOBALS['testStream'];
}

function mapi_stream_stat($stream) {
	return ['cb' => strlen((string) $stream->data)];
}

function mapi_stream_read($stream, $len) {
	if ($stream->fail) {
		return false;
	}
	$chunk = substr((string) $stream->data, $stream->pos, $len);
	$stream->pos += $len;

	return $chunk;
}

$temporaryDirectory = sys_get_temp_dir() . '/grommunio-mapi-export-' . bin2hex(random_bytes(8));
mkdir($temporaryDirectory, 0700);
\define('TMP_PATH', $temporaryDirectory);
\define('PLUGIN_FILESBROWSER_LOGLEVEL', 'NONE');

require_once \dirname(__DIR__) . '/php/Files/Core/Util/class.mapiexport.php';

$GLOBALS['mapisession'] = new class {
	public function openMessageStore($id) {
		return $id === 'store' ? 'storeobj' : false;
	}
};

function check($cond, $msg) {
	if (!$cond) {
		throw new \RuntimeException($msg);
	}
}

$item = ['store' => bin2hex('store'), 'entryid' => bin2hex('msg'), 'attachNum' => [0, 2]];

$GLOBALS['testStream'] = (object) ['data' => 'hello attachment data', 'pos' => 0, 'fail' => false];
$GLOBALS['testProps'] = [PR_ATTACH_FILENAME => 'sh:ort.txt', PR_DISPLAY_NAME => 'display'];
$res = MapiExport::attachmentToTempFile($item);
check(\is_array($res) && $res[1] === 'short.txt', 'filename fallback');
check(file_get_contents($res[0]) === 'hello attachment data', 'stream copy');
unlink($res[0]);

$GLOBALS['testStream'] = (object) ['data' => 'x', 'pos' => 0, 'fail' => false];
$GLOBALS['testProps'] = [];
$res = MapiExport::attachmentToTempFile($item);
check($res[1] === 'ERROR', 'default filename');
unlink($res[0]);

$GLOBALS['testStream'] = (object) ['data' => 'abc', 'pos' => 0, 'fail' => true];
check(MapiExport::attachmentToTempFile($item) === false, 'read error');
check(glob($temporaryDirectory . '/*') === [], 'temp file removed on read error');

check(MapiExport::attachmentToTempFile(['store' => bin2hex('store')]) === false, 'missing entryid');
check(MapiExport::attachmentToTempFile(['store' => bin2hex('other'), 'entryid' => 'aa']) === false, 'store not opened');
check(MapiExport::attachmentToTempFile(['store' => bin2hex('store'), 'entryid' => 'aa']) === false, 'missing attachNum');

rmdir($temporaryDirectory);
echo "mapiExportTest: OK\n";
