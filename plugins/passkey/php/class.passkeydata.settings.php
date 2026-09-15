<?php

/**
 * Class PasskeyData for managing passkey settings and credentials
 */
class PasskeyData
{
    /**
     * Check if passkey authentication is activated for the current user
     *
     * @return bool True if activated, false otherwise
     */
    public static function isActivated()
    {
        if (!isset($GLOBALS["settings"]) || $GLOBALS["settings"] === null) {
            return false; // Default to not activated when settings unavailable
        }
        return $GLOBALS["settings"]->get('zarafa/v1/plugins/passkey/activate');
    }

    /**
     * Set the activation status of passkey authentication
     *
     * @param bool $activate True to activate, false to deactivate
     */
    public static function setActivate($activate)
    {
        if (!isset($GLOBALS["settings"]) || $GLOBALS["settings"] === null) {
            return; // Cannot save settings when settings object unavailable
        }
        $GLOBALS["settings"]->set('zarafa/v1/plugins/passkey/activate', $activate);
        $GLOBALS["settings"]->saveSettings();
    }

    /**
     * Get stored passkey credentials for the current user
     *
     * @return string JSON encoded credentials or empty string
     */
    public static function getCredentials()
    {
        // Try EncryptionStore first (primary storage for grommunio webapp)
        if (class_exists('EncryptionStore')) {
            try {
                $encryptionStore = EncryptionStore::getInstance();
                $credentials = $encryptionStore->get('passkeyCredentials', '');
                if (!empty($credentials)) {
                    return $credentials;
                }
            } catch (Exception $e) {
                error_log("[passkey] Could not access EncryptionStore for reading: " . $e->getMessage());
            }
        }
        
        // Fallback to settings if available
        if (isset($GLOBALS["settings"]) && $GLOBALS["settings"] !== null) {
            return $GLOBALS["settings"]->get('zarafa/v1/plugins/passkey/credentials', '');
        }
        
        return ''; // Return empty string when no storage available
    }

    /**
     * Set passkey credentials for the current user
     *
     * @param string $credentials JSON encoded credentials
     */
    public static function setCredentials($credentials)
    {
        // Store in EncryptionStore (primary storage for grommunio webapp)
        if (class_exists('EncryptionStore')) {
            try {
                $encryptionStore = EncryptionStore::getInstance();
                $encryptionStore->add('passkeyCredentials', $credentials);
            } catch (Exception $e) {
                error_log("[passkey] Could not store in EncryptionStore: " . $e->getMessage());
            }
        }
        
        // Also store in settings as backup if available
        if (isset($GLOBALS["settings"]) && $GLOBALS["settings"] !== null) {
            $GLOBALS["settings"]->set('zarafa/v1/plugins/passkey/credentials', $credentials);
            $GLOBALS["settings"]->saveSettings();
        }
    }

    /**
     * Add a new passkey credential
     *
     * @param array $credential The credential data
     */
    public static function addCredential($credential)
    {
        $credentials = self::getCredentials();
        $credentialArray = $credentials ? json_decode($credentials, true) : [];
        
        if (!is_array($credentialArray)) {
            $credentialArray = [];
        }
        
        $credentialArray[] = $credential;
        self::setCredentials(json_encode($credentialArray));
    }

    /**
     * Remove a passkey credential by ID
     *
     * @param string $credentialId The credential ID to remove
     */
    public static function removeCredential($credentialId)
    {
        $credentials = self::getCredentials();
        $credentialArray = $credentials ? json_decode($credentials, true) : [];
        
        if (!is_array($credentialArray)) {
            return;
        }
        
        $credentialArray = array_filter($credentialArray, function($cred) use ($credentialId) {
            return $cred['id'] !== $credentialId;
        });
        
        self::setCredentials(json_encode(array_values($credentialArray)));
    }

    /**
     * Get all passkey credentials as array
     *
     * @return array Array of credentials
     */
    public static function getCredentialsArray()
    {
        $credentials = self::getCredentials();
        $credentialArray = $credentials ? json_decode($credentials, true) : [];
        
        return is_array($credentialArray) ? $credentialArray : [];
    }

    /**
     * Check if user has any registered passkeys
     *
     * @return bool True if user has passkeys, false otherwise
     */
    public static function hasCredentials()
    {
        $credentials = self::getCredentialsArray();
        return !empty($credentials);
    }

    /**
     * Get WebAuthn configuration settings.
     *
     * The Relying Party ID (rp_id) is SERVER-authoritative and is never derived
     * from client-controlled input (Host header / clientDataJSON.origin). It comes
     * only from the admin-configured PLUGIN_PASSKEY_RP_ID setting. When it is not
     * configured, rp_id is returned as an empty string and callers MUST fail closed
     * (deny the ceremony) rather than guess a host — otherwise an attacker-chosen
     * origin could be accepted.
     *
     * @return array Configuration array
     */
    public static function getWebAuthnConfig()
    {
        // Check if settings global is available
        if (!isset($GLOBALS["settings"]) || $GLOBALS["settings"] === null) {
            // Settings object is absent in the bare ceremony pages (login.php /
            // logon.php), which do not run the index.php/grommunio.php bootstrap.
            // Fall back to the server-authoritative PLUGIN_PASSKEY_* constants
            // from config.php. rp_id still comes ONLY from admin config, never
            // from the request host; if the constant is also empty we return ''
            // and callers fail closed.
            return [
                'rp_id' => defined('PLUGIN_PASSKEY_RP_ID') ? (string) PLUGIN_PASSKEY_RP_ID : '',
                'rp_name' => defined('PLUGIN_PASSKEY_RP_NAME') ? PLUGIN_PASSKEY_RP_NAME : 'Grommunio',
                'timeout' => defined('PLUGIN_PASSKEY_TIMEOUT') ? PLUGIN_PASSKEY_TIMEOUT : 60000,
                'user_verification' => defined('PLUGIN_PASSKEY_USER_VERIFICATION') ? PLUGIN_PASSKEY_USER_VERIFICATION : 'preferred',
                'authenticator_attachment' => defined('PLUGIN_PASSKEY_AUTHENTICATOR_ATTACHMENT') ? PLUGIN_PASSKEY_AUTHENTICATOR_ATTACHMENT : null
            ];
        }

        return [
            'rp_id' => (string) $GLOBALS["settings"]->get('zarafa/v1/plugins/passkey/rp_id', ''),
            'rp_name' => $GLOBALS["settings"]->get('zarafa/v1/plugins/passkey/rp_name', 'Grommunio'),
            'timeout' => $GLOBALS["settings"]->get('zarafa/v1/plugins/passkey/timeout', 60000),
            'user_verification' => $GLOBALS["settings"]->get('zarafa/v1/plugins/passkey/user_verification', 'preferred'),
            'authenticator_attachment' => $GLOBALS["settings"]->get('zarafa/v1/plugins/passkey/authenticator_attachment', null)
        ];
    }
}
