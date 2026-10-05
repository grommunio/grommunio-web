<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * File cache in a directory that only the web server user may modify.
 * Entries are never read through links, and writes replace them atomically.
 */
final class PrivateFileCache {
	/**
	 * Create the cache directory or tighten an existing one to 0700.
	 *
	 * @param string $dir cache directory
	 *
	 * @return bool true when the directory is safe and writable
	 */
	public static function ensureDir($dir) {
		if (is_link($dir)) {
			return false;
		}
		if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
			return false;
		}
		// If the process does not own the directory, never trust entries from it.
		if (!@chmod($dir, 0700)) {
			return false;
		}
		clearstatcache(true, $dir);
		$stat = @lstat($dir);
		if ($stat === false || ($stat['mode'] & 0170000) !== 0040000 || ($stat['mode'] & 0077) !== 0 ||
			(function_exists('posix_geteuid') && $stat['uid'] !== posix_geteuid())) {
			return false;
		}

		return is_writable($dir);
	}

	/**
	 * Read a cache entry without following a pre-created link.
	 *
	 * @param string   $file    cache filename
	 * @param null|int $maxAge  maximum age in seconds, null for no limit
	 * @param null|int $maxSize maximum size in bytes, null for no limit
	 *
	 * @return null|string cached data, or null for an unsafe, stale or unreadable entry
	 */
	public static function read($file, $maxAge = null, $maxSize = null) {
		if (!is_file($file) || is_link($file)) {
			return null;
		}
		$stat = @lstat($file);
		$dirStat = @lstat(dirname($file));
		if ($stat === false || $dirStat === false ||
			($stat['mode'] & 0170000) !== 0100000 ||
			($dirStat['mode'] & 0170000) !== 0040000 ||
			($stat['mode'] & 0077) !== 0 || ($dirStat['mode'] & 0077) !== 0 ||
			$stat['uid'] !== $dirStat['uid'] ||
			($maxSize !== null && $stat['size'] > $maxSize) ||
			($maxAge !== null && time() - $stat['mtime'] >= $maxAge)) {
			return null;
		}

		$data = @file_get_contents($file);

		return is_string($data) && ($maxSize === null || strlen($data) <= $maxSize) ? $data : null;
	}

	/**
	 * Re-check the cache directory, then atomically replace a 0600 entry in it.
	 *
	 * @param string $dir        cache directory
	 * @param string $file       cache filename
	 * @param string $data       cache contents
	 * @param string $tmpPrefix  temporary file prefix
	 * @param string $cleanupLog error_log prefix when the temporary file cannot be removed
	 *
	 * @return bool true when the cache entry was written
	 */
	public static function write($dir, $file, $data, $tmpPrefix, $cleanupLog) {
		if (!self::ensureDir($dir)) {
			return false;
		}

		return self::writeAtomic($dir, $file, $data, $tmpPrefix, 0600, $cleanupLog);
	}

	/**
	 * Atomically replace a file without following a pre-created link.
	 *
	 * @param string $dir        directory for the temporary file
	 * @param string $file       target filename
	 * @param string $data       file contents
	 * @param string $tmpPrefix  temporary file prefix
	 * @param int    $mode       permissions of the new file
	 * @param string $cleanupLog error_log prefix when the temporary file cannot be removed
	 *
	 * @return bool true when the file was replaced
	 */
	public static function writeAtomic($dir, $file, $data, $tmpPrefix, $mode, $cleanupLog) {
		$tmpFile = tempnam($dir, $tmpPrefix);
		if ($tmpFile === false) {
			return false;
		}

		try {
			$written = file_put_contents($tmpFile, $data, LOCK_EX);
			if ($written !== strlen($data) || !@chmod($tmpFile, $mode)) {
				return false;
			}

			return @rename($tmpFile, $file);
		}
		finally {
			if ((is_file($tmpFile) || is_link($tmpFile)) && !@unlink($tmpFile)) {
				error_log("{$cleanupLog}: {$tmpFile}");
			}
		}
	}
}
