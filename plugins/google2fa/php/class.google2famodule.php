<?php

use OTPHP\TOTP;
use ParagonIE\ConstantTime\Base32;

/**
 * WebApp plugin module for interaction with JS-GUI
 *
 * @class Google2FAModule
 * @extends Module
 */
class Google2FAModule extends Module
{
    /**
     * @var TOTP $otp
     */
    var $otp;

    /**
     * @constructor
     * @access public
     * @param int $id unique id of the class
     * @param array $data list of all actions, which is received from the client
     */
    public function __construct($id, $data)
    {
        parent::__construct($id, $data);
    }

    /**
     * Reset configuration
     *
     * @access private
     * @return boolean
     * @throws Exception
     */
    private function resetConfiguration(): bool
    {
        Google2FAData::setActivate(false);
        Google2FAData::setSecret("");
        $response['isActivated'] = false;
        $this->addActionData("resetconfiguration", $response);
        $GLOBALS["bus"]->addData($this->getResponseData());
        return true;
    }

    /**
     * Toggle activate/deactivate two-factor authentication
     *
     * @access private
     * @return boolean
     * @throws Exception
     */
    private function activate(): bool
    {
        $isActivated = Google2FAData::isActivated();
        Google2FAData::setActivate(!$isActivated);
        $response = array();
        $response['isActivated'] = !$isActivated;
        $this->addActionData("activate", $response);
        $GLOBALS["bus"]->addData($this->getResponseData());
        return true;
    }

    /**
     * Send if two-factor authentication is activated
     *
     * @access private
     * @return boolean
     * @throws Exception
     */
    private function isActivated(): bool
    {
        $isActivated = Google2FAData::isActivated();
        $response = array();
        $response['isActivated'] = $isActivated;
        $this->addActionData("isactivated", $response);
        $GLOBALS["bus"]->addData($this->getResponseData());
        return true;
    }

    /**
     * Verify code
     *
     * @access private
     * @param array $actionData
     * @return boolean
     * @throws Exception
     */
    private function verifyCode(array $actionData): bool
    {
        $code = $actionData['code'];
        $encryptionStore = EncryptionStore::getInstance();
        $user = $encryptionStore->get('username');
        $this->otp = TOTP::createFromSecret(Google2FAData::getSecret());
        $this->otp->setLabel($user);
        $isCodeOK = $this->otp->verify($code);
        if ($isCodeOK) {
            Google2FAData::setActivate(true);
        }
        $response['isCodeOK'] = $isCodeOK;
        $this->addActionData("verifycode", $response);
        $GLOBALS["bus"]->addData($this->getResponseData());
        return true;
    }

    /**
     * Send secret key
     *
     * @access private
     * @return boolean
     * @throws Exception
     */
    private function getSecret(): bool
    {
        $secret = Google2FAData::getSecret();
        $encryptionStore = EncryptionStore::getInstance();
        $user = $encryptionStore->get('username');
        $this->otp = TOTP::createFromSecret($secret);
        $this->otp->setLabel($user);
        $response = array();
        if ($secret === "") {
            $secret = $this->createSecret();
        }
        $response['qRCodeGoogleUrl'] = base64_encode($this->otp->getQrCodeUri(
            'https://api.qrserver.com/v1/create-qr-code/?color=5330FF&bgcolor=70FF7E&data=[DATA]&qzone=2&margin=0&size=300x300&ecc=M',
            '[DATA]')
        );
        $response['secret'] = base64_encode($secret);
        $response['username'] = $user;
        $this->addActionData("getsecret", $response);
        $GLOBALS["bus"]->addData($this->getResponseData());
        return true;
    }

    /**
     * Create and save new secret key
     *
     * @access private
     * @return string
     * @throws Exception
     */
    private function createSecret(): string
    {
        $secret = trim(Base32::encodeUpper(random_bytes(128)), '=');
        Google2FAData::setSecret($secret);
        return $secret;
    }

    /**
     * Executes all the actions in the $data variable.
     *
     * @access public
     * @return boolean true on success or false on failure.
     */
    public function execute(): bool
    {
        $result = false;
        foreach ($this->data as $actionType => $actionData) {
            if (isset($actionType)) {
                try {
                    switch ($actionType) {
                        case "resetconfiguration":
                            $result = $this->resetConfiguration();
                            break;
                        case "getsecret":
                            $result = $this->getSecret();
                            break;
                        case "activate":
                            $result = $this->activate();
                            break;
                        case "isactivated":
                            $result = $this->isActivated();
                            break;
                        case "verifycode":
                            $result = $this->verifyCode($actionData);
                            break;
                        default:
                            $this->handleUnknownActionType($actionType);
                    }
                } catch (Exception $e) {
                    $mess = $e->getFile() . ":" . $e->getLine() . "<br />" . $e->getMessage();
                    error_log("[google2fa]: " . $mess);
                    $this->sendFeedback(false, array(
                        'type' => ERROR_GENERAL,
                        'info' => array('original_message' => $mess, 'display_message' => $mess)
                    ));
                }
            }
        }
        return $result;
    }
}
