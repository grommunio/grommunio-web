<?php

declare(strict_types=1);

namespace Files\Backend\Seafile\Model;

class ConfigUtil {
	/**
	 * Get the users email-address (in Grommunio MAPI-Session).
	 */
	public static function loadSmtpAddress(): string {
		return $GLOBALS['mapisession']->getSMTPAddress();
	}
}
