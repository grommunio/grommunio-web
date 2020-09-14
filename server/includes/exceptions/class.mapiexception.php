<?php
	/**
	 * MAPIException
	 * if enabled using mapi_enable_exceptions then php-ext can throw exceptions when
	 * any error occurs in mapi calls. this exception will only be thrown when severity bit is set in
	 * error code that means it will be thrown only for mapi errors not for mapi warnings.
	 */
	class MAPIException extends BaseException
	{
		/**
		 * Function will return display message of exception if its set by the calle.
		 * if it is not set then we are generating some default display messages based
		 * on mapi error code.
		 * @return string returns error-message that should be sent to client to display.
		 */
		public function getDisplayMessage()
		{
			if(!empty($this->displayMessage))
				return $this->displayMessage;

			switch($this->getCode()) 
			{
				case MAPI_E_NO_ACCESS:
					return dgettext("zarafa","You have insufficient privileges to open this object.");
				case MAPI_E_LOGON_FAILED:
				case MAPI_E_UNCONFIGURED:
					return dgettext("zarafa","Logon Failed. Please check your name/password.");
				case MAPI_E_NETWORK_ERROR:
					return dgettext("zarafa","Can not connect to Kopano Core.");
				case MAPI_E_UNKNOWN_ENTRYID:
					return dgettext("zarafa","Can not open object with provided id.");
				case MAPI_E_NO_RECIPIENTS:
					return dgettext("zarafa","There are no recipients in the message.");
				case MAPI_E_NOT_FOUND:
					return dgettext("zarafa","Can not find object.");
				case MAPI_E_NOT_ENOUGH_MEMORY:
					return dgettext("zarafa","Operation failed: Server does not have enough memory.");
				case MAPI_E_INTERFACE_NOT_SUPPORTED:
				case MAPI_E_INVALID_PARAMETER:
				case MAPI_E_INVALID_ENTRYID:
				case MAPI_E_INVALID_OBJECT:
				case MAPI_E_TOO_COMPLEX:
				case MAPI_E_CORRUPT_DATA:
				case MAPI_E_END_OF_SESSION:
				case MAPI_E_AMBIGUOUS_RECIP:
				case MAPI_E_COLLISION:
				case MAPI_E_UNCONFIGURED:
				default :
					return sprintf(dgettext("zarafa","Unknown MAPI Error: %s"), get_mapi_error_name($this->getCode()));
			}
		}
	}

	// Tell the PHP extension which exception class to instantiate
	if (function_exists('mapi_enable_exceptions')) {
		mapi_enable_exceptions("mapiexception");
	}
?>
