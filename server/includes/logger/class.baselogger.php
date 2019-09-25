<?php

	abstract class Logger
	{
		/**
		 * @var string
		 */
		protected $user = '';

		/**
		 * @var array
		 */
		protected $specialLogUsers = array();

		/**
		 * Only used as a cache value for IsUserInSpecialLogUsers.
		 * @var array
		 */
		private $isUserInSpecialLogUsers = array();

		/**
		 * Only used as a cache value for IsAuthUserInSpecialLogUsers function
		 * @var bool
		 */
		private $isAuthUserInSpecialLogUsers = false;

		/**
		 * Returns the current user.
		 *
		 * @access public
		 * @return string
		 */
		public function GetUser() {
			return $this->user;
		}

		/**
		 * Sets the current user.
		 *
		 * @param array $value user information which is currently login.
		 *
		 * @access public
		 * @return void
		 */
		public function SetUser($value) {
			$this->user = $value;
		}

		/**
		 * Indicates if special log users are known.
		 *
		 * @access public
		 * @return bool True if we do have to log some specific user. False otherwise.
		 */
		public function HasSpecialLogUsers() {
			return !empty($this->specialLogUsers);
		}

		/**
		 * Indicates if the user is in the special log users.
		 *
		 * @param string $user
		 *
		 * @access public
		 * @return bool
		 */
		public function IsUserInSpecialLogUsers($user) {
			if (isset($this->isUserInSpecialLogUsers[$user])) {
				return true;
			}
			if ($this->HasSpecialLogUsers()) {
				$specialLogUsers = $this->GetSpecialLogUsers();
				if (array_search($user, $specialLogUsers, true) !== false) {
					$this->isUserInSpecialLogUsers[$user] = true;
					return true;
				}
			}
			return false;
		}

		/**
		 * Returns the current special log users array.
		 *
		 * @access public
		 * @return array
		 */
		public function GetSpecialLogUsers() {
			return $this->specialLogUsers;
		}

		/**
		 * Sets the current special log users array.
		 *
		 * @param array $value
		 *
		 * @access public
		 * @return void
		 */
		public function SetSpecialLogUsers(array $value) {
			$this->isUserInSpecialLogUsers = array(); // reset cache
			$this->specialLogUsers = $value;
		}

		/**
		 * Check that the current login user is in the special log user array.
		 * This call is equivalent to `$this->IsUserInSpecialLogUsers($this->GetUser())` at the exception that this
		 * call uses cache so there won't be more than one check to the specialLogUser for the login user.
		 *
		 * @access public
		 * @return bool true if user exist in special log user array else false.
		 */
		public function IsAuthUserInSpecialLogUsers() {
			if ($this->isAuthUserInSpecialLogUsers) {
				return true;
			}
			if($this->IsUserInSpecialLogUsers($this->GetUser())){
				$this->isAuthUserInSpecialLogUsers = true;
				return true;
			}
			return false;
		}

		/**
		 * Logs a message with a given log level.
		 *
		 * @param {int} $logLevel The log level which will be configured in config file.
		 * @param {string} $message The log message which we want to log in user specific log file.
		 * @param {boolean|array} $detailMessage (optional) The detailed log message. it can be Error/Exception array.
		 * @param {boolean|array} $request (optional) The request log the the request data which sent by the user.
		 *
		 * @access public
		 * @return void
		 * 
		 */
		public function Log($logLevel, $message, $detailMessage = false, $request = false) {
			if ($logLevel <= LOG_USER_LEVEL) {
				if ($this->IsAuthUserInSpecialLogUsers()) {
					$this->Write($logLevel, $message, $detailMessage, $request);
				}
			}
		}

		/**
		 * Returns the string representation of the given $loglevel.
		 *
		 * @param {int} $loglevel one of the LOGLEVELs
		 *
		 * @access protected
		 * @return string
		 */
		protected function GetLogLevelString($loglevel) {
			switch($loglevel) {
				case LOGLEVEL_OFF:          return ""; break;
				case LOGLEVEL_FATAL:        return "[FATAL]"; break;
				case LOGLEVEL_ERROR:        return "[ERROR]"; break;
				case LOGLEVEL_WARN:         return "[WARN]"; break;
				case LOGLEVEL_INFO:         return "[INFO]"; break;
				case LOGLEVEL_DEBUG:        return "[DEBUG]"; break;
			}
		}

		/**
		 * Writes a log message to the general log.
		 *
		 * @param {int} $logLevel The log level which will be configured in config file.
		 * @param {string} $message The log message which we want to log in user specific log file.
		 * @param {boolean|array} $detailMessage (optional) The detailed log message. it can be Error/Exception array.
		 * @param {boolean|array} $request (optional) The request log the the request data which sent by the user.
		 *
		 * @access protected
		 * @return void
		 */
		abstract protected function Write($logLevel, $message, $detailMessage, $request);
	}