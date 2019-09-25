<?php

/**
 * Secondary state handling
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
 * module, they will have to wait for eachother. In practice this should hardly ever happen.
 *
 * @package core
 */

class State {

	/**
	 * The file pointer of the state file
	 */
	private $fp = false;

	/**
	 * The basedir in which the statefiles are found
	 */
	private $basedir;

	/**
	 * The filename which is opened by this state file
	 */
	private $filename;

	/**
	 * The directory in which the session files are created
	 */
	private $sessiondir = "session";

	/**
	 * The unserialized data as it has been read from the file
	 */
	public $sessioncache;

	/**
	 * The raw data as it has been read from the file
	 */
	public $contents;

	/**
	 * @param string $subsystem Name of the subsystem
	 */
	function __construct($subsystem) {
		$this->basedir = TMP_PATH . DIRECTORY_SEPARATOR . $this->sessiondir;
		$this->filename = $this->basedir . DIRECTORY_SEPARATOR . session_id() . "." . $subsystem;
	}

	/**
	 * Open the session file
	 *
	 * The session file is opened and locked so that other processes can not access the state information
	 */
	function open() {
		if($this->fp === false) {
			if (!is_dir($this->basedir)) {
				mkdir($this->basedir, 0755, true /* recursive */);
			}
			$this->fp = fopen($this->filename, "a+");
			$this->sessioncache = false;
			flock($this->fp, LOCK_EX);
		}
	}

	/**
	 * Read a setting from the state file
	 *
	 * @param string $name Name of the setting to retrieve
	 * @return string Value of the state value, or null if not found
	 */
	function read($name) {
		if($this->fp !== false) {
			// If the file has already been read, we only have to access
			// our cache to obtain the requeste data.
			if ($this->sessioncache === false) {
				$this->contents = file_get_contents($this->filename);
				$this->sessioncache = unserialize($this->contents);
			}

			if (isset($this->sessioncache[$name])) {
				return $this->sessioncache[$name];
			}
		} else {
			dump('[STATE ERROR] State file "' . $this->filename . '" isn\'t opened, Please open state file before reading it."');
		}
		return false;
	}

	/**
	 * Write a setting to the state file
	 *
	 * @param string $name Name of the setting to write
	 * @param mixed $object Value of the object to be written to the setting
	 * @param bool $flush False to prevent the changes written to disk
	 * This requires a call to $flush() to write the changes to disk.
	 */
	function write($name, $object, $flush = true)
	{
		if($this->fp !== false) {
			// If the file has already been read, then we don't
			// need to read the entire file again.
			if ($this->sessioncache === false) {
				$this->read($name);
			}

			$this->sessioncache[$name] = $object;

			if ($flush === true) {
				$this->flush();
			}
		} else {
			dump('[STATE ERROR] State file "' . $this->filename . '" isn\'t opened, Please open state file before writing on it."');
		}
	}

	/**
	 * Flushes all changes to disk
	 *
	 * This flushes all changed made to the $this->sessioncache to disk
	 */
	function flush()
	{
		if($this->fp !== false) {
			if ($this->sessioncache) {
				$contents = serialize($this->sessioncache);

				if ($contents !== $this->contents) {
					ftruncate($this->fp, 0);
					fseek($this->fp, 0);
					fwrite($this->fp, $contents);
					$this->contents = $contents;
				}
			}
		} else {
			dump('[STATE ERROR] State file "' . $this->filename . '" isn\'t opened, Please open state file before writing on it."');
		}
	}

	/**
	 * Close the state file
	 *
	 * This closes and unlocks the state file so that other processes can access the state
	 */
	function close() {
		if (isset($this->fp)) {
			// release write lock -- fclose does this automatically
			// but only in PHP <= 5.3.2
			flock($this->fp, LOCK_UN);
			fclose($this->fp);
		}
	}

	/**
	 * Cleans all old state information in the session directory
	 * @param Integer $maxLifeTime The maximum allowed age of files in seconds.
	 */
	function clean($maxLifeTime = STATE_FILE_MAX_LIFETIME) {
		cleanTemp($this->basedir, $maxLifeTime);
	}
}
