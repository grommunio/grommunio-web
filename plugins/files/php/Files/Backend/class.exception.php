<?php
/**
 * A custom exception class for webdav exceptions
 *
 * @class   BackendException
 * @extends Exception
 */

namespace Files\Backend;

class Exception extends \Exception
{	
	/**
	 * The exception title to show as a message box title at client side.
	 */
	public $title = null;

	/**
	 * @constructor
	 *
	 * @param string $message The error message
	 * @param int $code The error code
	 */
	public function __construct($message, $code = 0)
	{
		parent::__construct($message, $code);
	}

	/**
	 * Overrides the toString method.
	 *
	 * @return string Error code and message
	 */
	public function __toString()
	{
		return __CLASS__ . ": [{$this->code}]: {$this->message}\n";
	}
	
	/**
	 * Function sets title of an exception that will be sent to the client side
	 * to show it to user.
	 * @param string $title title of an exception.
	 */
	public function setTitle($title)
	{
		$this->title = $title;
	}
	
	/**
	 * @return string returns title that should be sent to client to display as a message box
	 * title.
	 */
	public function getTitle()
	{
		return $this->title;
	}
}
