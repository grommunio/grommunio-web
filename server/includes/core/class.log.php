<?php

	class Log {
		/**
		 * @var Log
		 */
		private static $logger = null;

		/**
		 * Returns the logger object. If no logger has been initialized,
		 * FileLog will be initialized and returned.
		 *
		 * @throws Exception thrown if the logger class cannot be instantiated
		 *
		 * @return Log
		 */
		private static function getLogger() {
			if (!Log::$logger) {
				Log::$logger = new FileLog();
				Log::$logger->SetUser($GLOBALS["mapisession"]->getUserName());
				Log::$logger->SetSpecialLogUsers(explode(";", LOG_USERS));
			}

			return Log::$logger;
		}

		/**
		 * Writes a log line.
		 *
		 * @param {Number}        $loglevel       one of the defined LOGLEVELS
		 * @param {string}        $message        The log message which we want to log in user specific log file
		 * @param {boolean|array} $detailMessage  (optional) The detailed log message. it can be Error/Exception array.
		 * @param {boolean|array} $request        (optional) The request log the the request data which sent by the user
		 * @param mixed $exception
		 * @param mixed $requestData
		 */
		public static function Write($loglevel, $message, $exception = false, $requestData = false) {
			try {
				Log::getLogger()->Log($loglevel, $message, $exception, $requestData);
			}
			catch (Exception $e) {
				error_log("There is problem to log user action. Exceptions:: " . $e);
			}
		}
	}
