<?php

require_once __DIR__ . "/vendor/autoload.php";

/**
 * PHP Class for handling database communication (settings)
 *
 * @class Google2FAData
 */
class Google2FAData
{
    /**
     * Get secret key
     *
     * @return string
     * @throws Exception
     */
    public static function getSecret(): string
    {
        return base64_decode($GLOBALS["settings"]->get("zarafa/v1/plugins/google2fa/secret_key"));
    }

    /**
     * Set secret key
     *
     * @param string $secret key
     * @throws Exception
     */
    public static function setSecret(string $secret)
    {
        $GLOBALS["settings"]->set("zarafa/v1/plugins/google2fa/secret_key", base64_encode($secret));
        $GLOBALS["settings"]->saveSettings();
    }

    /**
     * Two-factor authentication activated
     *
     * @return boolean
     */
    public static function isActivated(): bool
    {
        return $GLOBALS["settings"]->get("zarafa/v1/plugins/google2fa/activate");
    }

    /**
     * Activate or deactivate two-factor authentication
     *
     * @param boolean $activate activation true/false
     */
    public static function setActivate(bool $activate)
    {
        $GLOBALS["settings"]->set("zarafa/v1/plugins/google2fa/activate", $activate);
        $GLOBALS["settings"]->saveSettings();
    }
}
