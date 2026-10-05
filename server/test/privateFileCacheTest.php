<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

require_once dirname(__DIR__) . '/includes/core/class.privatefilecache.php';

function checkCache(bool $condition, string $message): void {
	if (!$condition) {
		throw new RuntimeException($message);
	}
}

$base = sys_get_temp_dir() . '/privatefilecache-' . bin2hex(random_bytes(8));
$dir = $base . '/cache';
$target = $base . '/target';
checkCache(mkdir($base, 0700), 'Unable to create the test directory.');

try {
	checkCache(file_put_contents($target, 'target') === 6, 'Unable to write the link target.');
	checkCache(symlink($base, $base . '/link'), 'Unable to create a directory link.');
	checkCache(!PrivateFileCache::ensureDir($base . '/link'), 'A linked cache directory was accepted.');

	checkCache(mkdir($dir, 0770), 'Unable to create the cache directory.');
	checkCache(PrivateFileCache::ensureDir($dir), 'A group-writable cache directory owned by us was not tightened.');
	clearstatcache(true, $dir);
	checkCache((fileperms($dir) & 0777) === 0700, 'The cache directory was not tightened to 0700.');

	$file = $dir . '/entry';
	checkCache(symlink($target, $file), 'Unable to create a file link.');
	checkCache(PrivateFileCache::read($file) === null, 'A linked cache entry was read.');
	checkCache(PrivateFileCache::write($dir, $file, 'cached', '.test-', 'cleanup'), 'Writing over a link failed.');
	clearstatcache(true, $file);
	checkCache(!is_link($file) && file_get_contents($file) === 'cached', 'The link was not replaced by the entry.');
	checkCache(file_get_contents($target) === 'target', 'The link target was modified.');
	checkCache((fileperms($file) & 0777) === 0600, 'The entry is not 0600.');
	checkCache(glob($dir . '/.test-*') === [], 'A temporary file was left behind.');

	checkCache(PrivateFileCache::read($file) === 'cached', 'A safe entry was not read.');
	checkCache(PrivateFileCache::read($file, 3600, 6) === 'cached', 'An entry within the limits was not read.');
	checkCache(PrivateFileCache::read($file, 3600, 5) === null, 'An oversize entry was read.');
	checkCache(touch($file, time() - 7200), 'Unable to age the entry.');
	clearstatcache(true, $file);
	checkCache(PrivateFileCache::read($file, 3600) === null, 'A stale entry was read.');
	checkCache(PrivateFileCache::read($file) === 'cached', 'An entry without an age limit was refused.');

	checkCache(chmod($file, 0640), 'Unable to loosen the entry.');
	clearstatcache(true, $file);
	checkCache(PrivateFileCache::read($file) === null, 'A group-readable entry was read.');

	checkCache(PrivateFileCache::writeAtomic($dir, $file, 'crl', '.test-', 0640, 'cleanup'), 'An atomic write failed.');
	clearstatcache(true, $file);
	checkCache((fileperms($file) & 0777) === 0640 && file_get_contents($file) === 'crl', 'The atomic write mode or data is wrong.');

	checkCache(chmod($dir, 0750), 'Unable to loosen the cache directory.');
	checkCache(chmod($file, 0600), 'Unable to tighten the entry.');
	clearstatcache();
	checkCache(PrivateFileCache::read($file) === null, 'An entry in a group-readable directory was read.');
}
finally {
	foreach ([$dir . '/entry', $base . '/link', $target] as $path) {
		if (is_file($path) || is_link($path)) {
			unlink($path);
		}
	}
	foreach ([$dir, $base] as $path) {
		if (is_dir($path) && !is_link($path)) {
			rmdir($path);
		}
	}
}

echo "Private file cache checks passed\n";
