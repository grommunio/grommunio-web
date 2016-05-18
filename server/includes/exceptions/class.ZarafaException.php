<?php

require_once(BASE_PATH . 'server/includes/mapi/class.baseexception.php');

/**
 * Defines a base exception class for custom zarafa generated exceptions, these exceptions
 * are generated and handled by our application only.
 */
class ZarafaException extends BaseException
{
}
?>