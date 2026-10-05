<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * Removes stale state files and guards the state directory with the cleanup lock.
 *
 * Opening a state file holds the cleanup lock shared, sweeping holds it exclusively.
 */
class StateCleaner {
	/**
	 * Files without content only carry a lock and expire earlier.
	 */
	private const LOCK_FILE_MAX_LIFETIME = 3600;

	/**
	 * @param string $basedir   State directory
	 * @param int    $operation LOCK_SH or LOCK_EX
	 *
	 * @return false|resource the locked handle
	 */
	public static function lock($basedir, $operation) {
		$cleanupLock = @fopen($basedir . DIRECTORY_SEPARATOR . '.cleanup.lock', 'c');
		if ($cleanupLock === false || !flock($cleanupLock, $operation)) {
			if (is_resource($cleanupLock)) {
				fclose($cleanupLock);
			}

			return false;
		}

		return $cleanupLock;
	}

	/**
	 * @param resource $cleanupLock handle returned by lock()
	 */
	public static function unlock($cleanupLock) {
		flock($cleanupLock, LOCK_UN);
		fclose($cleanupLock);
	}

	/**
	 * Cleans all old state information in the state directory.
	 *
	 * @param string $basedir     State directory
	 * @param int    $maxLifeTime the maximum allowed age of files in seconds
	 */
	public static function clean($basedir, $maxLifeTime) {
		if (!is_dir($basedir)) {
			return;
		}
		$stalePaths = self::findStale($basedir, $maxLifeTime);
		if (empty($stalePaths)) {
			return;
		}
		$cleanupLock = self::lock($basedir, LOCK_EX);
		if ($cleanupLock === false) {
			return;
		}
		foreach ($stalePaths as $path) {
			self::remove($path, $maxLifeTime);
		}
		self::unlock($cleanupLock);
	}

	/**
	 * @param string $basedir     State directory
	 * @param int    $maxLifeTime the maximum allowed age of files in seconds
	 *
	 * @return string[]
	 */
	private static function findStale($basedir, $maxLifeTime) {
		$directory = @opendir($basedir);
		if ($directory === false) {
			return [];
		}
		$stalePaths = [];
		while (($file = readdir($directory)) !== false) {
			if ($file === '.' || $file === '..' || $file === '.cleanup.lock') {
				continue;
			}
			$path = $basedir . DIRECTORY_SEPARATOR . $file;
			if (self::isStaleRegularFile(@lstat($path), $maxLifeTime)) {
				$stalePaths[] = $path;
			}
		}
		closedir($directory);

		return $stalePaths;
	}

	/**
	 * Removes a state file unless it was used or locked since it was found.
	 *
	 * @param string $path        State file
	 * @param int    $maxLifeTime the maximum allowed age of files in seconds
	 */
	private static function remove($path, $maxLifeTime) {
		if (!self::isStaleRegularFile(@lstat($path), $maxLifeTime)) {
			return;
		}
		$handle = @fopen($path, 'r+');
		if ($handle === false) {
			return;
		}
		if (flock($handle, LOCK_EX | LOCK_NB)) {
			clearstatcache(true, $path);
			$fileInfo = @stat($path);
			if ($fileInfo !== false && self::isStale($fileInfo, $maxLifeTime) && !@unlink($path) && file_exists($path)) {
				error_log('[STATE ERROR] Stale state file "' . $path . '" could not be removed.');
			}
			flock($handle, LOCK_UN);
		}
		fclose($handle);
	}

	/**
	 * @param array|false $fileInfo    lstat() result
	 * @param int         $maxLifeTime the maximum allowed age of state files in seconds
	 *
	 * @return bool
	 */
	private static function isStaleRegularFile($fileInfo, $maxLifeTime) {
		return $fileInfo !== false && ($fileInfo['mode'] & 0170000) === 0100000 && self::isStale($fileInfo, $maxLifeTime);
	}

	/**
	 * @param array $fileInfo    stat() result of a regular file
	 * @param int   $maxLifeTime the maximum allowed age of state files in seconds
	 *
	 * @return bool
	 */
	private static function isStale($fileInfo, $maxLifeTime) {
		$lifeTime = $fileInfo['size'] === 0 ? min($maxLifeTime, self::LOCK_FILE_MAX_LIFETIME) : $maxLifeTime;

		return $fileInfo['atime'] < time() - $lifeTime;
	}
}
