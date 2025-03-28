<?php
include BASE_PATH . 'server/includes/loader.php';
include BASE_PATH . 'server/includes/templates/serverinfo.php';

$loader = new FileLoader();

$versionInfo['webapp'] = $loader->getVersion();
$serverConfig = [
	'enable_plugins' => ENABLE_PLUGINS ? true : false,
	'enable_advanced_settings' => ENABLE_ADVANCED_SETTINGS ? true : false,
	'max_attachment_size' => getMaxUploadSize(),
	'freebusy_load_start_offset' => FREEBUSY_LOAD_START_OFFSET,
	'freebusy_load_end_offset' => FREEBUSY_LOAD_END_OFFSET,
	'client_timeout' => defined('CLIENT_TIMEOUT') && is_numeric(CLIENT_TIMEOUT) && CLIENT_TIMEOUT > 0 ? CLIENT_TIMEOUT : false,
	'json_themes' => Theming::getJsonThemes(),
	'active_theme' => Theming::getActiveTheme(),
	'iconsets' => Iconsets::getIconsets(),
	'active_iconset' => Iconsets::getActiveIconset(),
	'enable_themes' => ENABLE_THEMES,
	'enable_iconsets' => ENABLE_ICONSETS,
	'enable_widgets' => ENABLE_WIDGETS,
];
?>
<!DOCTYPE html>
<html>

	<head>
                <meta name="Generator" content="grommunio-web v<?php echo $loader->getVersion(); ?>">
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge" />
		<title><?php echo $webappTitle; ?></title>
		<link rel="icon" href="<?php echo $favicon; ?>" type="image/x-icon">
		<link rel="shortcut icon" href="<?php echo $favicon; ?>" type="image/x-icon">

		<!-- load the login css first as we need it immediately! -->
		<link rel="stylesheet" href="client/resources/css/external/login.css" >

		<script><?php require BASE_PATH . 'client/fingerprint.js'; ?></script>
		<?php
			$loader->cssOrder();
echo Theming::getStyles($theme);
?>
	</head>

	<body class="zarafa-welcome theme-<?php echo strtolower((string) $theme ?: 'basic'); ?>">
		<div id="loading-mask">
			<div id="form-container" class="loading" style="visibility: hidden;">
				<div id="bg"></div>
				<div id="content">
					<div class="left">
						<div id="logo"></div>
					</div>
					<div class="right">
					</div>
				</div>
			</div>
		</div>

		<script><?php require BASE_PATH . 'client/resize.js'; ?></script>

		<!-- Translations -->
		<script src="index.php?version=<?php echo getWebappVersion(); ?>&load=translations.js&lang=<?php echo $Language->getSelected(); ?>"></script>
		<!-- JS Files -->
		<?php $loader->jsOrder(); ?>

		<script>
			settings 		= <?php echo $GLOBALS["settings"]->getJSON(); ?>;
			languages 		= <?php echo $Language->getJSON(); ?>;
			user 			= <?php echo json_encode($GLOBALS['mapisession']->getUserInfo()); ?>;
			version 		= <?php echo json_encode($versionInfo); ?>;
			serverconfig 		= <?php echo json_encode($serverConfig); ?>;

			Ext.onReady(Zarafa.loadWelcome, Zarafa);
		</script>
	</body>
</html>
