<?php

/**
 * MAPIException
 * if enabled using mapi_enable_exceptions then php-ext can throw exceptions when
 * any error occurs in mapi calls. this exception will only be thrown when severity bit is set in
 * error code that means it will be thrown only for mapi errors not for mapi warnings.
 */
class MAPIException extends BaseException {
	/**
	 * Function will return display message of exception if its set by the callee.
	 * if it is not set then we are generating some default display messages based
	 * on mapi error code.
	 *
	 * @return string returns error-message that should be sent to client to display
	 */
	#[Override]
	public function getDisplayMessage() {
		if (!empty($this->displayMessage)) {
			return $this->displayMessage;
		}

		return match ($this->getCode()) {
			MAPI_E_NO_ACCESS => dgettext("zarafa", "You have insufficient privileges to open this object."),
			MAPI_E_LOGON_FAILED, MAPI_E_UNCONFIGURED => dgettext("zarafa", "Logon Failed. Please check your name/password."),
			MAPI_E_NETWORK_ERROR => dgettext("zarafa", "Can not connect to Gromox."),
			MAPI_E_UNKNOWN_ENTRYID => dgettext("zarafa", "Can not open object with provided id."),
			MAPI_E_NO_RECIPIENTS => dgettext("zarafa", "There are no recipients in the message."),
			MAPI_E_NOT_FOUND => dgettext("zarafa", "Can not find object."),
			MAPI_E_NOT_ENOUGH_MEMORY => dgettext("zarafa", "Operation failed: Server does not have enough memory."),
			default => sprintf(dgettext("zarafa", "Unknown MAPI Error: %s"), get_mapi_error_name($this->getCode())),
		};
	}
}

// Tell the PHP extension which exception class to instantiate
if (function_exists('mapi_enable_exceptions')) {
	mapi_enable_exceptions("mapiexception");
}
