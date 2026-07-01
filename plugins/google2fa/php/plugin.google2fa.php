<?php

require_once __DIR__ . "/vendor/autoload.php";
require_once __DIR__ . "/class.google2fadata.settings.php";

/**
 * PHP Class plugin Google2FA for two-factor authentication
 *
 * @class PluginGoogle2FA
 * @extends Plugin
 */
class PluginGoogle2FA extends Plugin
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
                    if (PLUGIN_GOOGLE2FA_ALWAYS_ENABLED) {
                        $GLOBALS["settings"]->set('zarafa/v1/plugins/google2fa/enable', true);
                        $GLOBALS["settings"]->saveSettings();
                    }

                    if (PLUGIN_GOOGLE2FA_ALWAYS_ACTIVATED)
                        Google2FAData::setActivate(true);

                    // Check, if user has enabled plugin and has activated 2FA
                    if (!$GLOBALS["settings"]->get('zarafa/v1/plugins/google2fa/enable')
                        || !Google2FAData::isActivated())
                        break;

                    // Check, if token authorisation is already done (example: attachment-upload)
                    if (array_key_exists('google2FALoggedOn', $_SESSION) && $_SESSION['google2FALoggedOn']) {

                        // Login successful - save or remove code
                        if (isset($_SESSION['google2FACode'])) {
                            unset($_SESSION['google2FACode']);
                        }
                        break;
                    }

                    // Save data in session for token authentication with login.php and logon.php
                    $encryptionStore = EncryptionStore::getInstance();
                    $encryptionStore->add('google2FASecret', Google2FAData::getSecret());
                    $_SESSION['google2FAEcho']['txtCodePlaceholder'] = dgettext('plugin_google2fa', 'Code');
                    $_SESSION['google2FAEcho']['rememberMe'] = dgettext('plugin_google2fa', 'Remember me for 30 days');
                    $_SESSION['google2FAEcho']['msgInvalidCode'] = dgettext('plugin_google2fa', 'Invalid code. Please check code.');
                    $_SESSION['google2FAEcho']['butOk'] = dgettext('plugin_google2fa', 'Ok');
                    $_SESSION['google2FAEcho']['butCancel'] = dgettext('plugin_google2fa', 'Cancel');

                    // Call token login page
                    header('Location: plugins/google2fa/php/login.php', true, 303); // delete GLOBALS, go to token page
                    exit; // don't execute header-function in index.php

                } catch (Exception $e) {
                    $mess = $e->getFile() . ":" . $e->getLine() . "<br />" . $e->getMessage();
                    error_log("[google2fa]: " . $mess);
                    die($mess);
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
                        'google2fa' => array(
                            'enable' => PLUGIN_GOOGLE2FA_ENABLE,
                            'user_disable_allowed' => !PLUGIN_GOOGLE2FA_ALWAYS_ENABLED,
                            'secret_key' => '',
                            'activate' => PLUGIN_GOOGLE2FA_ACTIVATE
                        )
                    )
                )
            )
        ));
    }
}
