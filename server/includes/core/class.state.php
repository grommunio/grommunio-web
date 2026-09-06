<?php

/**
 * Secondary state handling.
 *
 * This class works exactly the same as standard PHP sessions files. We implement it here
 * so we can have improved granularity and don't have to put everything into the session
 * variables. Basically we have multiple session objects corresponding to multiple webclient
 * objects on the client. This class also locks the session files (in the same way as standard
 * PHP sessions), in order to serialize requests from the same client object.
 *
 * The main reason for creating this is to improve performance; normally PHP will lock the session
 * file for as long as your PHP request is running. However, we want to do multiple PHP requests at
 * once. For this reason, we only use the PHP session system for login information, and use this
 * class for other state information. This means that we can set a message as 'read' at the same time
 * as opening a dialog to view a message.
 *
 * Currently, there is one 'state' for each 'subsystem'. The 'subsystem' is simply a tag which is appended
 * to the request URL when the client does an XML request. Each 'subsystem' has its own state file.
 *
 * Currently the subsystem is equal to the module ID. This means that if you have two requests from the same
 * module, they will have to wait for each other. In practice this should hardly ever happen.
 *
 * It can also support to create global state which can be access by all PHP request.
 */
class State {
	/**
	 * The file pointer of the state file.
	 */
	private $fp = false;

	/**
	 * The basedir in which the statefiles are found.
	 */
	private $basedir;

	/**
	 * The filename which is opened by this state file.
	 */
	private $filename;

	/**
	 * Name of the subsystem, used in log messages.
	 */
	private $subsystem;

	/**
	 * Files without content only carry a lock and expire earlier.
	 */
	private const LOCK_FILE_MAX_LIFETIME = 3600;

	/**
	 * The directory in which the session files are created.
	 */
	private $sessiondir = "session";

	/**
	 * The unserialized data as it has been read from the file.
	 */
	public $sessioncache = [];

	/**
	 * The raw data as it has been read from the file.
	 */
	public $contents;

	/**
	 * @param string      $subsystem Name of the subsystem
	 * @param null|string $owner     File prefix, defaults to the session id
	 */
	public function __construct($subsystem, $owner = null) {
		$this->basedir = TMP_PATH . DIRECTORY_SEPARATOR . $this->sessiondir;
		$this->subsystem = $subsystem;
		$this->filename = $this->basedir . DIRECTORY_SEPARATOR . ($owner ?? session_id()) . "." . $subsystem;
	}

	/**
	 * State shared by every session of the store owner.
	 *
	 * @param string $subsystem Name of the subsystem
	 *
	 * @return State
	 */
	public static function forStore($subsystem) {
		return new self($subsystem, 'store_' . hash('sha256', $GLOBALS['mapisession']->getDefaultMessageStoreEntryId()));
	}

	/**
	 * Open the session file.
	 *
	 * The session file is opened and locked so that other processes can not access the state information
	 *
	 * @param int $retry Reopen attempts when clean() replaced the file while waiting for its lock
	 *
	 * @return bool true when the file is locked
	 */
	public function open($retry = 2) {
		if ($this->fp === false) {
			if (!is_dir($this->basedir)) {
				if (!@mkdir($this->basedir, 0755, true /* recursive */) && !is_dir($this->basedir)) {
					error_log('[STATE ERROR] State directory "' . $this->basedir . '" could not be created.');

					return false;
				}
			}
			$cleanupLock = @fopen($this->basedir . DIRECTORY_SEPARATOR . '.cleanup.lock', 'c');
			if ($cleanupLock === false || !flock($cleanupLock, LOCK_SH)) {
				if (is_resource($cleanupLock)) {
					fclose($cleanupLock);
				}
				error_log('[STATE ERROR] State cleanup lock could not be acquired.');

				return false;
			}
			$this->fp = @fopen($this->filename, "a+");
			if ($this->fp === false) {
				flock($cleanupLock, LOCK_UN);
				fclose($cleanupLock);
				error_log('[STATE ERROR] State file for "' . $this->subsystem . '" could not be opened.');

				return false;
			}
			$this->sessioncache = [];
			// Never wait for a busy state file while holding the cleanup lock
			$locked = flock($this->fp, LOCK_EX | LOCK_NB);
			flock($cleanupLock, LOCK_UN);
			fclose($cleanupLock);
			if (!$locked && !flock($this->fp, LOCK_EX)) {
				fclose($this->fp);
				$this->fp = false;
				error_log('[STATE ERROR] State file for "' . $this->subsystem . '" could not be locked.');

				return false;
			}
			if (!$locked && !$this->isLinked()) {
				$this->close();
				if ($retry <= 0) {
					error_log('[STATE ERROR] State file for "' . $this->subsystem . '" was replaced while locking.');

					return false;
				}

				return $this->open($retry - 1);
			}
			if (!@touch($this->filename)) {
				error_log('[STATE ERROR] State file for "' . $this->subsystem . '" could not be timestamped.');
			}
		}

		return true;
	}

	/**
	 * @return bool true when the locked handle still is the file at $this->filename
	 */
	private function isLinked() {
		clearstatcache(true, $this->filename);
		$open = fstat($this->fp);
		$disk = @stat($this->filename);

		return $open !== false && $disk !== false && $open['ino'] === $disk['ino'] && $open['dev'] === $disk['dev'];
	}

	/**
	 * Read a setting from the state file.
	 *
	 * @param string $name Name of the setting to retrieve
	 *
	 * @return mixed Value of the state value, or null if not found
	 */
	public function read($name) {
		if ($this->fp !== false) {
			// If the file has already been read, we only have to access
			// our cache to obtain the requeste data.
			if (empty($this->sessioncache)) {
				rewind($this->fp);
				$contents = stream_get_contents($this->fp);
				$this->contents = $contents === false ? '' : $contents;
				$this->sessioncache = $this->contents === '' ? [] : unserialize($this->contents);
				if (!is_array($this->sessioncache)) {
					$this->sessioncache = [];
				}
			}

			if (isset($this->sessioncache[$name])) {
				return $this->sessioncache[$name];
			}
		}
		else {
			dump('[STATE ERROR] State file "' . $this->filename . '" isn\'t opened, Please open state file before reading it."');
		}
		if (empty($this->sessioncache)) {
			$this->sessioncache = [];
		}

		return null;
	}

	/**
	 * Write a setting to the state file.
	 *
	 * @param string $name   Name of the setting to write
	 * @param mixed  $object Value of the object to be written to the setting
	 * @param bool   $flush  false to prevent the changes written to disk
	 *                       This requires a call to $flush() to write the changes to disk
	 */
	public function write($name, $object, $flush = true) {
		if ($this->fp !== false) {
			// If the file has already been read, then we don't
			// need to read the entire file again.
			if (empty($this->sessioncache)) {
				$this->read($name);
			}

			$this->sessioncache[$name] = $object;

			if ($flush === true) {
				$this->flush();
			}
		}
		else {
			dump('[STATE ERROR] State file "' . $this->filename . '" isn\'t opened, Please open state file before writing on it."');
		}
	}

	/**
	 * Flushes all changes to disk.
	 *
	 * This flushes all changed made to the $this->sessioncache to disk
	 */
	public function flush() {
		if ($this->fp !== false) {
			if (!empty($this->sessioncache)) {
				$contents = serialize($this->sessioncache);

				if ($contents !== $this->contents) {
					ftruncate($this->fp, 0);
					fseek($this->fp, 0);
					fwrite($this->fp, $contents);
					$this->contents = $contents;
				}
			}
		}
		else {
			dump('[STATE ERROR] State file "' . $this->filename . '" isn\'t opened, Please open state file before writing on it."');
		}
	}

	/**
	 * Close the state file.
	 *
	 * This closes and unlocks the state file so that other processes can access the state
	 */
	public function close() {
		if ($this->fp !== false) {
			// release write lock -- fclose does this automatically
			// but only in PHP <= 5.3.2
			flock($this->fp, LOCK_UN);
			fclose($this->fp);
			$this->fp = false;
		}
	}

	public function __destruct() {
		$this->close();
	}

	/**
	 * Cleans all old state information in the session directory.
	 *
	 * @param int $maxLifeTime the maximum allowed age of files in seconds
	 */
	public function clean($maxLifeTime = STATE_FILE_MAX_LIFETIME) {
		if (!is_dir($this->basedir)) {
			return;
		}

		$directory = @opendir($this->basedir);
		if ($directory === false) {
			return;
		}
		$stalePaths = [];
		while (($file = readdir($directory)) !== false) {
			if ($file === '.' || $file === '..' || $file === '.cleanup.lock') {
				continue;
			}
			$path = $this->basedir . DIRECTORY_SEPARATOR . $file;
			$fileInfo = @lstat($path);
			if ($fileInfo === false || ($fileInfo['mode'] & 0170000) !== 0100000) {
				continue;
			}
			if ($this->isStale($fileInfo, $maxLifeTime)) {
				$stalePaths[] = $path;
			}
		}
		closedir($directory);
		if (empty($stalePaths)) {
			return;
		}

		$cleanupLock = @fopen($this->basedir . DIRECTORY_SEPARATOR . '.cleanup.lock', 'c');
		if ($cleanupLock === false || !flock($cleanupLock, LOCK_EX)) {
			if (is_resource($cleanupLock)) {
				fclose($cleanupLock);
			}

			return;
		}
		foreach ($stalePaths as $path) {
			$fileInfo = @lstat($path);
			if ($fileInfo === false || ($fileInfo['mode'] & 0170000) !== 0100000 || !$this->isStale($fileInfo, $maxLifeTime)) {
				continue;
			}

			$handle = @fopen($path, 'r+');
			if ($handle === false) {
				continue;
			}
			if (flock($handle, LOCK_EX | LOCK_NB)) {
				clearstatcache(true, $path);
				$fileInfo = @stat($path);
				if ($fileInfo !== false && $this->isStale($fileInfo, $maxLifeTime) && !@unlink($path) && file_exists($path)) {
					error_log('[STATE ERROR] Stale state file "' . $path . '" could not be removed.');
				}
				flock($handle, LOCK_UN);
			}
			fclose($handle);
		}
		flock($cleanupLock, LOCK_UN);
		fclose($cleanupLock);
	}

	/**
	 * @param array $fileInfo    stat() result of a regular file
	 * @param int   $maxLifeTime the maximum allowed age of state files in seconds
	 *
	 * @return bool
	 */
	private function isStale($fileInfo, $maxLifeTime) {
		$lifeTime = $fileInfo['size'] === 0 ? min($maxLifeTime, self::LOCK_FILE_MAX_LIFETIME) : $maxLifeTime;

		return $fileInfo['atime'] < time() - $lifeTime;
	}
}
