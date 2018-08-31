<?php

	class FileLog extends Logger
	{
		/**
		 * @var string
		 */
		private $logToUserFile = "";

		/**
		 * Writes a log message to the general log.
		 *
		 * @param {Number}        $loglevel       one of the defined LOGLEVELS
		 * @param {string}        $message        The log message which we want to log in user specific log file.
		 * @param {boolean|array} $detailMessage  (optional) The detailed log message. it can be Error/Exception array.
		 * @param {boolean|array} $request        (optional) The request log the the request data which sent by the user.
		 *
		 * @access protected
		 * @return void
		 */
		protected function Write($logLevel, $message, $detailMessage, $request)
		{
			$dir = LOG_FILE_DIR;
			if(substr(LOG_FILE_DIR,-1) != "/") {
				$dir .="/";
			}

			// If users directory not created then create it first.
			if (!is_dir($dir)) {
				if (empty($dir)) {
					error_log("Log directory has not configured. provide valid directory path.");
					return;
				}
				if (mkdir($dir, 0777, true) === false) {
					error_log("Problem in creating log folder ". $dir);
					return;
				}
			}
			$data = $this->BuildLogString($logLevel, $message, $detailMessage, $request) . PHP_EOL;
			file_put_contents($dir . $this->getLogToUserFile(), $data, FILE_APPEND);
		}

		/**
		 * Get the log user file.
		 *
		 * @access private
		 * @return string
		 */
		private function getLogToUserFile() {
			if (strlen($this->logToUserFile) == 0) {
				$this->setLogToUserFile($this->getUser().".log");
			}
			return $this->logToUserFile;
		}

		/**
		 * Set user log-file relative to log directory.
		 *
		 * @param string $value
		 *
		 * @access private
		 * @return void
		 */
		private function setLogToUserFile($value) {
			$this->logToUserFile = $value;
		}

		/**
		 * Returns the string to be logged.
		 *
		 * @param {Number}        $loglevel       one of the defined LOGLEVELS
		 * @param {string}        $message        The log message which we want to log in user specific log file.
		 * @param {boolean|array} $detailMessage  (optional) The detailed log message. it can be Error/Exception array.
		 * @param {boolean|array} $request        (optional) The request log the the request data which sent by the user.
		 *
		 * @access public
		 * @return string
		 */
		public function BuildLogString($loglevel, $message, $detailMessage = false, $request = false) {
			$dateTime = strftime("%d-%b-%Y %H:%M:%S");
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