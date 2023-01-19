<?php

/**
 * Defines an exception class for all php Errors.
 * ErrorException properties and methods http://php.net/manual/en/class.errorexception.php
 * Exception properties and methods http://www.php.net/manual/en/class.exception.php.
 */
class ZarafaErrorException extends BaseException {
	/**
	 * errcontext is an array that points to the active symbol table at the point the error occurred.
	 * In other words, errcontext will contain an array of every variable that existed in the scope
	 * the error was triggered in. User error handler must not modify error context.
	 */
	protected $errorContext;

	/**
	 * Constructs the Exception.
	 *
	 * @param string     $errorMessage   The exception message
	 * @param int        $code           The Exception code
	 * @param string     $filename       the filename where the exception is thrown
	 * @param string     $lineno         the line number where the exception is thrown
	 * @param string     $displayMessage the exception message to show at client side
	 * @param null|mixed $errorContext
	 */
	public function __construct($errorMessage, $code, $filename, $lineno, $errorContext = null, $displayMessage = null) {
		$this->errorContext = $errorContext;

		if (!$displayMessage) {
			$displayMessage = _('Action is not performed correctly.');
		}

		parent::__construct($errorMessage, $code, null, $displayMessage);
		$this->setFile($filename);
		$this->setLineNo($lineno);
	}

	/**
	 * Function sets the filename where the exception was thrown.
	 *
	 * @param string filename name of the file where exception was thrown
	 * @param mixed $filename
	 */
	protected function setFile($filename = '') {
		$this->file = $filename;
	}

	/**
	 * Function sets the line where the exception was thrown.
	 *
	 * @param string lineno no of the line in file where exception was thrown
	 * @param mixed $lineno
	 */
	protected function setLineNo($lineno = '') {
		$this->line = $lineno;
	}
}
