<?php

class FileLog extends Logger {
	/**
	 * @var string
	 */
	private $logToUserFile = "";

	/**
	 * Writes a log message to the general log.
	 *
	 * @param int    $logLevel      one of the defined LOGLEVELS
	 * @param string $message       The log message which we want to log in user specific log file
	 * @param mixed  $detailMessage (optional) The detailed log message. it can be Error/Exception array.
	 * @param mixed  $request       (optional) The request log the the request data which sent by the user
	 */
	protected function Write($logLevel, $message, $detailMessage = false, $request = false) {
		$dir = LOG_FILE_DIR;
		if (!str_ends_with(LOG_FILE_DIR, "/")) {
			$dir .= "/";
		}

		// If users directory not created then create it first.
		if (!is_dir($dir)) {
			if (empty($dir)) {
				error_log("Log directory has not configured. provide valid directory path.");

				return;
			}
			if (mkdir($dir, 0777, true) === false) {
				error_log("Problem in creating log folder " . $dir);

				return;
			}
		}
		$data = $this->BuildLogString($logLevel, $message, $detailMessage, $request) . PHP_EOL;
		file_put_contents($dir . $this->getLogToUserFile(), $data, FILE_APPEND);
	}

	/**
	 * Get the log user file.
	 *
	 * @return string
	 */
	private function getLogToUserFile() {
		if (strlen($this->logToUserFile) == 0) {
			$this->setLogToUserFile($this->getUser() . ".log");
		}

		return $this->logToUserFile;
	}

	/**
	 * Set user log-file relative to log directory.
	 *
	 * @param string $value
	 */
	private function setLogToUserFile($value) {
		$this->logToUserFile = $value;
	}

	/**
	 * Returns the string to be logged.
	 *
	 * @param int    $loglevel      one of the defined LOGLEVELS
	 * @param string $message       The log message which we want to log in user specific log file
	 * @param mixed  $detailMessage (optional) The detailed log message. it can be Error/Exception array.
	 * @param mixed  $request       (optional) The request log the the request data which sent by the user
	 *
	 * @return string
	 */
	public function BuildLogString($loglevel, $message, $detailMessage = false, $request = false) {
		$dateTime = date("d-M-Y H:i:s");
		$log = "[" . $dateTime . "] ";
		$log .= $this->GetLogLevelString($loglevel);
		$log .= ' ' . $message;

		if ($detailMessage) {
			$log .= ' :' . var_export($detailMessage, true) . "\r\n";
		}

		if ($request) {
			$log .= ' Request:' . var_export($request, true) . "\r\n";
		}

		return $log;
	}
}
