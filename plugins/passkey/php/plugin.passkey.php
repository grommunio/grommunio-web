<?php

require_once __DIR__ . "/vendor/autoload.php";
require_once __DIR__ . "/class.passkeydata.settings.php";

/**
 * PHP Class plugin Passkey for WebAuthn authentication
 *
 * @class PluginPasskey
 * @extends Plugin
 */
class PluginPasskey extends Plugin
{
    /**
     * Function initializes the Plugin and registers all hooks
     */
    function init()
    {
        $this->registerHook('server.core.settings.init.before');
        $this->registerHook('server.index.load.main.before');
    }

    /**
     * Function is executed when a hook is triggered by the PluginManager
     *
     * @param string $eventID the id of the triggered hook
     * @param mixed $data object(s) related to the hook
     */
    public function execute($eventID, &$data)
    {
        switch ($eventID) {
            case 'server.core.settings.init.before' :
                $this->injectPluginSettings($data);
                break;

            case 'server.index.load.main.before' : // don't use the logon trigger because we need the settings
                try {
                    // Check if plugin is enabled and activated
                    $pluginEnabled = $GLOBALS["settings"]->get('zarafa/v1/plugins/passkey/enable', PLUGIN_PASSKEY_ENABLE);
                    $passkeyActivated = PasskeyData::isActivated();
                    
                    if (!$pluginEnabled || !$passkeyActivated) {
                        break;
                    }

                    // Check if WebAuthn authentication is already done
                    if (array_key_exists('passkeyLoggedOn', $_SESSION) && $_SESSION['passkeyLoggedOn']) {
                        // Login successful - clean up
                        if (isset($_SESSION['passkeyChallenge'])) {
                            unset($_SESSION['passkeyChallenge']);
                        }
                        break;
                    }

                    // Check if user has any registered passkeys
                    $credentials = PasskeyData::getCredentialsArray();

                    if (empty($credentials)) {
                        break; // No passkeys registered, use normal login
                    }

                    // Save data in session for WebAuthn authentication
                    $encryptionStore = EncryptionStore::getInstance();
                    $encryptionStore->add('passkeyCredentials', PasskeyData::getCredentials());
                    $_SESSION['passkeyEcho']['msgAuthenticatePasskey'] = dgettext('plugin_passkey', 'Authenticate with your passkey');
                    $_SESSION['passkeyEcho']['msgAuthenticationFailed'] = dgettext('plugin_passkey', 'Authentication failed. Please try again.');
                    $_SESSION['passkeyEcho']['butAuthenticate'] = dgettext('plugin_passkey', 'Authenticate');
                    $_SESSION['passkeyEcho']['butCancel'] = dgettext('plugin_passkey', 'Cancel');
                    $_SESSION['passkeyEcho']['butUsePassword'] = dgettext('plugin_passkey', 'Use password instead');

                    // Redirect to passkey login page
                    header('Location: plugins/passkey/php/login.php', true, 303);
                    exit;

                } catch (Exception $e) {
                    $mess = $e->getFile() . ":" . $e->getLine() . "<br />" . $e->getMessage();
                    error_log("[passkey]: Exception: " . $mess);
                    // Don't die on error, just continue with normal login
                }
        }
    }

    /**
     * Inject default plugin settings
     *
     * @param mixed $data Reference to the data of the triggered hook
     */
    function injectPluginSettings(&$data)
    {
        $data['settingsObj']->addSysAdminDefaults(array(
            'zarafa' => array(
                'v1' => array(
                    'plugins' => array(
                        'passkey' => array(
                            'enable' => PLUGIN_PASSKEY_ENABLE,
                            'credentials' => '',
                            'activate' => PLUGIN_PASSKEY_ACTIVATE,
                            'rp_id' => PLUGIN_PASSKEY_RP_ID,
                            'rp_name' => PLUGIN_PASSKEY_RP_NAME,
                            'timeout' => PLUGIN_PASSKEY_TIMEOUT,
                            'user_verification' => PLUGIN_PASSKEY_USER_VERIFICATION,
                            'authenticator_attachment' => PLUGIN_PASSKEY_AUTHENTICATOR_ATTACHMENT
                        )
                    )
                )
            )
        ));
    }
}
