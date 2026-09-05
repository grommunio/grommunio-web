<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<!-- Always force latest IE rendering engine (even in intranet) & Chrome Frame
		Remove this if you use the .htaccess -->
		<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">

		<title><?php echo $webappTitle; ?></title>
		<meta name="description" content="grommunio-web is the ultimate frontend client for grommunio. A rich collaboration platform utilizing e-mail, calendars, webmeetings, file sharing and more.">
		<meta name="author" content="grommunio.com">

		<meta name="viewport" content="width=device-width, initial-scale=1.0">

		<link rel="icon" href="<?php echo $favicon; ?>" type="image/x-icon">
		<link rel="shortcut icon" href="<?php echo $favicon; ?>" type="image/x-icon">
		<link rel="manifest" href="<?php echo versionedUrl('manifest.webmanifest'); ?>">

		<link rel="stylesheet" type="text/css" href="client/resources/css/external/login.css?version=<?php echo getWebappVersion(); ?>">
		<link rel="stylesheet" type="text/css" href="client/resources/css/darkmode.css?version=<?php echo getWebappVersion(); ?>">

		<?php
			/* Add the styling of the theme */
			echo Theming::getStyles($theme);
		?>

		<script><?php require BASE_PATH . 'client/fingerprint.js'; ?></script>
	</head>

	<body class="login theme-<?php echo strtolower((string) $theme ?: 'basic'); ?>">

	<?php
		$keycloak = KeyCloak::getInstance();
		$oidcEnabled = !is_null($keycloak) && (!defined('DISABLE_KEYCLOAK') || !DISABLE_KEYCLOAK);
		// login_url() mints a fresh state on every call, so build it once and
		// reuse it for both the redirect and the button.
		$oidcLoginUrl = $oidcEnabled ? $keycloak->login_url($keycloak->redirect_url) : '';
		$oidcLabel = OIDC_BUTTON_LABEL !== '' ? OIDC_BUTTON_LABEL : _("Sign in with OpenID Connect");
		if ($oidcEnabled && OIDC_AUTO_REDIRECT) {
			?>
	<meta http-equiv='Refresh' content="1;URL='<?php echo $oidcLoginUrl; ?>'"/>
	<?php
					echo "<div id='form-container' class='loading' >";
		}
		else {
			echo "<div id='form-container'>";
		}
		?>
			<div id="bg"></div>
			<div id="content" role="main">
				<div class="left">
					<div id="logo" role="img" aria-label="grommunio"></div>
				</div>
				<div class="right">
					<form action="<?php echo $url; ?>" method="post" aria-label="<?php echo _("Sign in"); ?>">
						<label for="username" class="sr-only"><?php echo _("Username"); ?></label>
						<input type="text" name="username" id="username" value="<?php echo $user; ?>" placeholder="<?php echo _("Username"); ?>" autocomplete="username" required<?php if (isset($error)) {
							echo ' aria-describedby="error"';
						} ?>>
						<label for="password" class="sr-only"><?php echo _("Password"); ?></label>
						<input type="password" name="password" id="password" placeholder="<?php echo _("Password"); ?>" autocomplete="current-password" required<?php if (isset($error)) {
							echo ' aria-describedby="error"';
						} ?>>

						<?php if (isset($error)) { ?>
						<div id="error" role="alert"><?php echo $error; ?></div>
						<?php } ?>

						<input id="submitbutton" class="button" type="submit" value="<?php echo _("Sign in"); ?>">
					</form>
					<?php if ($oidcEnabled && !OIDC_AUTO_REDIRECT) { ?>
					<div id="oidc-login">
						<a id="oidcbutton" class="button" href="<?php echo htmlspecialchars($oidcLoginUrl, ENT_QUOTES); ?>"><?php echo htmlspecialchars((string) $oidcLabel, ENT_QUOTES); ?></a>
					</div>
					<?php } ?>
				</div>
			</div>
		</div>
		<script><?php require BASE_PATH . 'client/resize.js'; ?></script>
		<script>
			// Set focus on the correct form element
			function onLoad() {
				if (document.getElementById("username").value == "") {
					document.getElementById("username").focus();
				} else if (document.getElementById("password").value == "") {
					document.getElementById("password").focus();
							} else {
					document.getElementById("submitbutton").focus();
				}
			}
			window.onload = onLoad;

			// Show a spinner when submitting
			var form = document.getElementsByTagName('form')[0];
			// Some browsers need some time to draw the spinner (MS Edge!),
			// so we use this variable to delay the submit a little;
			var firstSubmit = true;
			form.onsubmit = function(){
				if ( !firstSubmit ){
					return true;
				}
				// Adding this class will show the loader
				const cntEl = document.getElementById('form-container');
				cntEl.className += ' loading';
				// Call resizeLoginBox, because an error message might have enlarged the login box,
				// so it is out of position.
				resizeLoginBox();
				firstSubmit = false;
				window.setTimeout(function(){ form.submit(); }, 10);
				return false;
			};
		</script>
		<?php if (file_exists('/etc/grommunio-web/disclaimer.html')) { ?>
		<div class="disclaimer">
			<?php include '/etc/grommunio-web/disclaimer.html'; ?>
		</div>
		<?php }
		elseif (file_exists('disclaimer.html')) { ?>
		<div class="disclaimer">
			<?php include 'disclaimer.html'; ?>
		</div>
		<?php } ?>
	</body>
</html>
