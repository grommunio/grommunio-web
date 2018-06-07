<?php
/**
 * Defines a base exception class for all custom exceptions, so every exceptions that
 * is thrown/caught by this application should extend this base class and make use of it.
 *
 * Some basic function of Exception class
 * getMessage()- message of exception
 * getCode() - code of exception
 * getFile() - source filename
 * getLine() - source line
 * getTrace() - n array of the backtrace()
 * getTraceAsString() - formated string of trace
 */
class BaseException extends Exception
{
	/**
	 * Base name of the file, so we don't have to use static path of the file
	 */
	private $baseFile = null;

	/**
	 * Flag to check if exception is already handled or not
	 */
	public $isHandled = false;

	/**
	 * The exception message to show at client side.
	 */
	public $displayMessage = null;


	/**
	 * Flag for allow to exception details message or not
	 */
	public $allowToShowDetailsMessage = false;

	/**
	 * Construct the exception
	 *
	 * @param  string $errorMessage
	 * @param  int $code
	 * @param  Exception $previous
	 * @param  string $displayMessage
	 * @return void
	 */
	public function __construct($errorMessage, $code = 0, Exception $previous = null, $displayMessage = null)
	{
		// assign display message
		$this->displayMessage = $displayMessage;

		parent::__construct($errorMessage, (int) $code, $previous);
	}

	/**
	 * @return string returns file name and line number combined where exception occurred.
	 */
	public function getFileLine()
	{
		return $this->getBaseFile() . ':' . $this->getLine();
	}

	/**
	 * @return string returns message that should be sent to client to display
	 */
	public function getDisplayMessage()
	{
		if(!is_null($this->displayMessage)) {
			return $this->displayMessage;
		}

		return $this->getMessage();
	}

	/**
	 * Function sets display message of an exception that will be sent to the client side
	 * to show it to user.
	 * @param string $message display message.
	 */
	public function setDisplayMessage($message)
	{
		$this->displayMessage = $message;
	}

	/**
	 * Function sets a flag in exception class to indicate that exception is already handled
	 * so if it is caught again in the top level of function stack then we have to silently
	 * ignore it.
	 */
	public function setHandled()
	{
		$this->isHandled = true;
	}

	/**
	 * @return string returns base path of the file where exception occurred.
	 */
	public function getBaseFile()
	{
		if(is_null($this->baseFile)) {
			$this->baseFile = basename(parent::getFile());
		}

		return $this->baseFile;
	}

	/**
	 * Name of the class of exception.
	 *
	 * @return string
	 */
	public function getName()
	{
		return get_class($this);
	}

	/**
	 * It will return details error message if allowToShowDetailsMessage is set.
	 *
	 * @return string returns details error message.
	 */
	public function getDetailsMessage()
	{
		return $this->allowToShowDetailsMessage ? $this->__toString() : '';
	}

	// @TODO getTrace and getTraceAsString
}
?>
