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

                    $encryptionStore = EncryptionStore::getInstance();

                    // Check if WebAuthn authentication is already done
                    if (WebAppAuthentication::secondFactorSatisfied()) {
                        // Second factor satisfied - clean up any transient state
                        $encryptionStore->remove('passkeyAssertionChallenge');
                        break;
                    }

                    // Check if user has any registered passkeys
                    $credentials = PasskeyData::getCredentialsArray();

                    if (empty($credentials)) {
                        break; // No passkeys registered, use normal login
                    }

                    // From here on, this session genuinely requires the second
                    // factor. Record the requirement so the CORE gate
                    // (WebAppAuthentication::enforceSecondFactor) blocks every
                    // other entry point - grommunio.php, load.php - until the
                    // passkey assertion succeeds. This is the fix for the
                    // "gate only blocks the HTML shell" flaw.
                    $encryptionStore->add('secondFactorRequired', '1');

                    // Mint a SERVER-side, single-use challenge for the assertion
                    // ceremony. The browser must NOT generate its own challenge;
                    // logon.php reads and consumes exactly this value. Give it a
                    // TTL comfortably above the WebAuthn client timeout.
                    $timeoutMs = defined('PLUGIN_PASSKEY_TIMEOUT') ? PLUGIN_PASSKEY_TIMEOUT : 60000;
                    $challenge = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
                    $encryptionStore->add('passkeyAssertionChallenge', $challenge, time() + intval($timeoutMs / 1000) + 30);

                    // Cache the credentials for the (directly-hit) login/logon pages.
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
                    // Fail OPEN on plugin error: the factor is opt-in per user and
                    // a broken plugin must never lock a user out. Crucially, do NOT
                    // set 'secondFactorRequired' in this path - leaving it unset
                    // means the core gate stays a no-op for this session.
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
