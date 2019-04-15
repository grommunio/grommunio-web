<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<!-- Always force latest IE rendering engine (even in intranet) & Chrome Frame
		Remove this if you use the .htaccess -->
		<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">

		<title><?php echo $webappTitle; ?></title>
		<meta name="description" content="Kopano WebApp is the ultimate frontend client for Kopano server. A rich collaboration platform utilizing e-mail, calendars, webmeetings, file sharing and more.">
		<meta name="author" content="Kopano.io">

		<meta name="viewport" content="width=device-width, initial-scale=1.0">

		<link rel="icon" href="<?php echo $favicon ?>" type="image/x-icon">
		<link rel="shortcut icon" href="<?php echo $favicon ?>" type="image/x-icon">

		<link rel="stylesheet" type="text/css" href="client/resources/css/external/login.css">

		<?php
			/* Add the styling of the theme */
			echo Theming::getStyles($theme);

			$oidcSettings = Array(
				'authority' => OIDC_ISS,
				'client_id' => OIDC_CLIENT_ID,
				'response_type' => 'id_token token',
				'scope' => OIDC_SCOPE,
			);
		?>
		<meta name="oidc-settings" id="oidc-settings" content="<?php echo htmlspecialchars(json_encode($oidcSettings)); ?>" logon>

		<script type="text/javascript"><?php require(BASE_PATH . 'client/fingerprint.js'); ?></script>
		<script type="text/javascript"><?php require(BASE_PATH . 'client/oidc/oidc-client.js'); ?></script>
		<script type="text/javascript"><?php require(BASE_PATH . 'client/oidc-kopano.js'); ?></script>
	</head>
	<body class="login theme-<?php echo strtolower($theme ? $theme : 'basic') ?>">
	</body>
</html>
