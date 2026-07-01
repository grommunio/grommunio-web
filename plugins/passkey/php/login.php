<?php
require_once("../../../init.php");
require_once(BASE_PATH . "server/includes/bootstrap.php");
require_once(BASE_PATH . "server/includes/core/class.webappsession.php");
require_once(BASE_PATH . "server/includes/core/class.webappauthentication.php");
require_once(BASE_PATH . "server/includes/core/class.theming.php");
require_once("../config.php");
$webappTitle = defined('WEBAPP_TITLE') && WEBAPP_TITLE ? WEBAPP_TITLE : 'WebApp';

// Make sure the php session is started
WebAppSession::getInstance();

$error = isset($_SESSION['passkeyLoggedOn']) && !$_SESSION['passkeyLoggedOn'];
$encryptionStore = EncryptionStore::getInstance();
$user = $encryptionStore->get('username');

/*
 * Get the favicon either from theme or use the default.
 *
 * @param string theme the users theme
 * @return string favicon
 */
function getFavicon($theme)
{
    if ($theme) {
        $favicon = Theming::getFavicon($theme);
    }

    if (!isset($favicon) || $favicon === false) {
        $favicon = 'client/resources/images/favicon.ico?kv2.2.0';
    }

    return $favicon;
}

$favicon = getFavicon(Theming::getActiveTheme());
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">

    <!-- Always force latest IE rendering engine (even in intranet) & Chrome Frame
    Remove this if you use the .htaccess -->
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">

    <title><?php echo $webappTitle; ?></title>
    <meta name="description"
          content="Grommunio WebApp is the ultimate frontend client for Grommunio server. A rich collaboration platform utilizing e-mail, calendars, web meetings, file sharing and more.">
    <meta name="author" content="grommunio.com">

    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!--link rel="apple-touch-icon" href="/apple-touch-icon.png"-->
    <link rel="icon" href="../../../<?php echo $favicon ?>" type="image/x-icon">
    <link rel="shortcut icon" href="../../../<?php echo $favicon ?>" type="image/x-icon">

    <?php
    if (file_exists("../../../client/resources/design2015/css/external/login.css")) // old version
        echo '                <link rel="stylesheet" type="text/css" href="../../../client/resources/design2015/css/external/login.css">';
    else
        echo '                <link rel="stylesheet" type="text/css" href="../../../client/resources/css/external/login.css">';

    $theme = Theming::getActiveTheme(); // Add the styling of the theme
    $css = Theming::getCss($theme);
    if (count($css)) {
        foreach ($css as $file) {
            echo '                <link rel="stylesheet" type="text/css" href="../../../' . $file . '">';
        }
    }
    ?>
    <script>
        navigator.sayswho = (function () {
            let ua = navigator.userAgent, tem,
                M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
            if (/trident/i.test(M[1])) {
                tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
                return 'MSIE ' + (tem[1] || '');
            }
            if (M[1] === 'Chrome') {
                tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
                if (tem != null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
            }
            M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
            if ((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1]);

            return M.join(' ');
        })();

        let bodyEl;
        let cntEl;
        let bgEl;

        // Our designer doesn't want the box in the center of the screen, instead
        // he wants the center of the box at 7/16 of the height of the window :-)
        let centerlinePos = 7 / 16;

        function onResize() {
            if (!bodyEl) return;

            let top = centerlinePos * bodyEl.clientHeight - cntEl.clientHeight / 2;

            cntEl.style.top = top + 'px';
            cntEl.style.left = (bodyEl.clientWidth - cntEl.clientWidth) / 2 + 'px';
            bgEl.style.width = bodyEl.clientWidth + 'px';
            bgEl.style.height = bodyEl.clientHeight + 'px';
            bgEl.style.top = (-top + (navigator.sayswho === 'MSIE 9' ? 200 : 0) / 2) + 'px';
            bgEl.style.left = -(bodyEl.clientWidth - cntEl.clientWidth + (navigator.sayswho === 'MSIE 9' ? 200 : 0)) / 2 + 'px';
        };
        window.addEventListener('resize', onResize);

        // WebAuthn functions
        function arrayBufferToBase64Url(buffer) {
            const bytes = new Uint8Array(buffer);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        }

        function base64UrlToArrayBuffer(base64url) {
            const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
            const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
            const binary = atob(padded);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            return bytes.buffer;
        }

        function authenticateWithPasskey() {
            if (!navigator.credentials || !navigator.credentials.get) {
                showError('<?php echo $_SESSION['passkeyEcho']['msgAuthenticationFailed']; ?>');
                return;
            }

            // Show loading state
            document.getElementById('authenticate-btn').disabled = true;
            document.getElementById('authenticate-btn').textContent = 'Authenticating...';

            // Generate challenge
            const challenge = new Uint8Array(32);
            crypto.getRandomValues(challenge);

            const requestOptions = {
                publicKey: {
                    challenge: challenge,
                    timeout: <?php echo PLUGIN_PASSKEY_TIMEOUT; ?>,
                    userVerification: '<?php echo PLUGIN_PASSKEY_USER_VERIFICATION; ?>',
                    rpId: '<?php echo PLUGIN_PASSKEY_RP_ID ?: $_SERVER['HTTP_HOST']; ?>'
                }
            };

            navigator.credentials.get(requestOptions)
                .then(credential => {
                    const assertionData = {
                        id: credential.id,
                        rawId: arrayBufferToBase64Url(credential.rawId),
                        type: credential.type,
                        response: {
                            authenticatorData: arrayBufferToBase64Url(credential.response.authenticatorData),
                            clientDataJSON: arrayBufferToBase64Url(credential.response.clientDataJSON),
                            signature: arrayBufferToBase64Url(credential.response.signature),
                            userHandle: credential.response.userHandle ? arrayBufferToBase64Url(credential.response.userHandle) : null
                        }
                    };

                    // Send to server for verification
                    const form = document.createElement('form');
                    form.method = 'POST';
                    form.action = 'logon.php';
                    
                    const assertionInput = document.createElement('input');
                    assertionInput.type = 'hidden';
                    assertionInput.name = 'assertion_data';
                    assertionInput.value = JSON.stringify(assertionData);
                    form.appendChild(assertionInput);

                    const challengeInput = document.createElement('input');
                    challengeInput.type = 'hidden';
                    challengeInput.name = 'challenge';
                    challengeInput.value = arrayBufferToBase64Url(challenge);
                    form.appendChild(challengeInput);

                    document.body.appendChild(form);
                    form.submit();
                })
                .catch(error => {
                    console.error('WebAuthn error:', error);
                    showError('<?php echo $_SESSION['passkeyEcho']['msgAuthenticationFailed']; ?>');
                    document.getElementById('authenticate-btn').disabled = false;
                    document.getElementById('authenticate-btn').textContent = '<?php echo $_SESSION['passkeyEcho']['butAuthenticate']; ?>';
                });
        }

        function showError(message) {
            const errorDiv = document.getElementById('error');
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }

        function onLoad() {
            // Auto-trigger passkey authentication if supported
            if (navigator.credentials && navigator.credentials.get) {
                // Small delay to ensure page is fully loaded
                setTimeout(() => {
                    authenticateWithPasskey();
                }, 500);
            } else {
                showError('WebAuthn not supported in this browser');
            }
        }

        window.onload = onLoad;
    </script>
    <style>
        .cancelbutton {
            background: firebrick;
            border:1px solid transparent;
            border-radius:25px;
            box-shadow:0 1px 1px 0 rgba(0,0,0,.35);
            color:#fff;
            height:28px;
            line-height:1.5;
            margin:12px 0 0;
            padding:0 9px;
            width:100%
        }

        .cancelbutton:hover {
            background-color: darkred;
            cursor:pointer
        }

        .cancelbutton:active {
            background-color: darkred;
        }

        .cancelbutton:focus {
            box-shadow:inset 0 0 0 1px #fff
        }

        .passkey-button {
            background: #007bff;
            border:1px solid transparent;
            border-radius:25px;
            box-shadow:0 1px 1px 0 rgba(0,0,0,.35);
            color:#fff;
            height:28px;
            line-height:1.5;
            margin:12px 0 0;
            padding:0 9px;
            width:100%
        }

        .passkey-button:hover {
            background-color: #0056b3;
            cursor:pointer
        }

        .passkey-button:disabled {
            background-color: #6c757d;
            cursor: not-allowed;
        }

        .login-font {
            font-family: Roboto,sans-serif;
        }

        #error {
            color: #d32f2f;
            margin: 10px 0;
            display: none;
        }

        .passkey-info {
            text-align: center;
            margin: 20px 0;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>

<body class="login">
<div id="form-container">
    <div id="bg"></div>
    <div id="content">
        <div class="left">
            <div id="logo"></div>
        </div>
        <div class="right">
            <div class="passkey-info">
                <?php echo $_SESSION['passkeyEcho']['msgAuthenticatePasskey']; ?>
            </div>
            
            <?php if (isset($error) && $error) { ?>
                <div id="error" style="display: block;"><?php echo $_SESSION['passkeyEcho']['msgAuthenticationFailed']; ?></div>
            <?php } else { ?>
                <div id="error"></div>
            <?php } ?>

            <button id="authenticate-btn" class="passkey-button" onclick="authenticateWithPasskey()">
                <?php echo $_SESSION['passkeyEcho']['butAuthenticate']; ?>
            </button>
            
            <a href="../../../index.php?logout">
                <button class="cancelbutton"><?php echo $_SESSION['passkeyEcho']['butCancel']; ?></button>
            </a>
        </div>
    </div>
</div>

<script type="text/javascript">
    bodyEl = document.getElementsByTagName('body')[0];
    cntEl = document.getElementById('form-container');
    bgEl = document.getElementById('bg');

    // Add some classes to the body tag, so we can change styles (for IE)
    bodyEl.className += (bodyEl.className.length > 0 ? ' ' : '') + navigator.sayswho.split(' ')[0];
    bodyEl.className += ' ' + navigator.sayswho.replace(' ', '');

    // Show the login box when the background image has loaded
    let img = document.createElement('img');
    img.onload = function () {
        cntEl.style.visibility = 'visible';
    }
    img.src = window.getComputedStyle(bodyEl, false).backgroundImage.slice(4, -1).replace(/"/g, "");

    // call it once to initialize the elements
    onResize();
</script>
</body>
</html>
