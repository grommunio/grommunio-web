<?php

require_once __DIR__ . "/vendor/autoload.php";

use OTPHP\TOTP;

/**
 * PHP file check code from two-factor authentication login page (login.php)
 */
require_once("../../../init.php");
require_once(BASE_PATH . "server/includes/bootstrap.php");
require_once(BASE_PATH . "server/includes/core/class.encryptionstore.php");

// Make sure the php session is started
WebAppSession::getInstance();

$code = ($_POST && array_key_exists('token', $_POST)) ? $_POST['token'] : '';
$remember = $_POST && array_key_exists('remember', $_POST) && $_POST['remember'] == 'on';

$encryptionStore = EncryptionStore::getInstance();
$secret = $encryptionStore->get('google2FASecret');
$user = $encryptionStore->get('username');
$verification = false;

$cookieValue = $user; // @todo: generate random value
$cookieName = str_replace(['@', '.'], '-', $user) . "-grommunio-web-google2fa-remember";

if(!isset($_COOKIE[$cookieName])) {
    $otp = TOTP::createFromSecret($secret);
    $otp->setLabel($user);

    if ($otp->verify($code)) {
        $verification = true;
        if ($remember) {
            setcookie($cookieName, $cookieValue, ['expires' => time() + (86400 * 30), 'path' => "/", 'secure' => true, 'httponly' => true]);
        }
    }
} else {
    if ($_COOKIE[$cookieName] == $user) {
        $verification = true;
    }
}

if ($verification) {
    $_SESSION['google2FACode'] = $code; // to disable code
    $_SESSION['google2FALoggedOn'] = TRUE; // 2FA successful
    header('Location: ../../../index.php', true, 303);
} else {
    $_SESSION['google2FALoggedOn'] = FALSE; // login not successful
    header('Location: login.php', true, 303);
}
