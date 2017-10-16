<?php
include(BASE_PATH . 'server/includes/loader.php');

$loader = new FileLoader();

$version = trim(file_get_contents('version'));
$versionInfo = array(
	'webapp'	=> $version,
	'zcp'		=> phpversion('mapi'),
	'git'		=> DEBUG_LOADER === LOAD_SOURCE ? gitversion() : '',
);

$serverConfig = array(
	'enable_plugins'				=> ENABLE_PLUGINS ? true : false,
	'enable_advanced_settings'		=> ENABLE_ADVANCED_SETTINGS ? true : false,
	'max_attachment_size'			=> getMaxUploadSize(),
	'freebusy_load_start_offset'	=> FREEBUSY_LOAD_START_OFFSET,
	'freebusy_load_end_offset' 		=> FREEBUSY_LOAD_END_OFFSET,
	'client_timeout' 				=> defined('CLIENT_TIMEOUT') && is_numeric(CLIENT_TIMEOUT) && CLIENT_TIMEOUT>0 ? CLIENT_TIMEOUT : false,
	'active_theme'					=> Theming::getActiveTheme(),
);
?>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>

	<head>
		<meta name="Generator" content="Kopano WebApp v<?php echo $version?>">
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge" />
		<title><?php echo $webappTitle; ?></title>
		<link rel="icon" href="<?php echo $favicon ?>" type="image/x-icon">
		<link rel="shortcut icon" href="<?php echo $favicon ?>" type="image/x-icon">

		<!-- load the login css first as we need it immediately! -->
		<link rel="stylesheet" href="client/resources/css/external/login.css" >

		<script type="text/javascript"><?php require(BASE_PATH . 'client/fingerprint.js'); ?></script>
		<?php $loader->cssOrder(); ?>
	</head>

	<body class="zarafa-welcome">
		<div id="loading-mask">
			<div id="form-container" class="loading" style="visibility: hidden;">
				<div id="bg"></div>
				<div id="content">
					<div class="left">
						<div id="logo"></div>
						<h2>WebApp <?php echo $version; ?></h2>
					</div>
					<div class="right">
					</div>
				</div>
			</div>
		</div>

		<script type="text/javascript"><?php require(BASE_PATH . 'client/resize.js'); ?></script>

		<!-- Translations -->
		<script type="text/javascript" src="index.php?version=<?php echo $version?>&load=translations.js&lang=<?php echo $Language->getSelected()?>"></script>
		<!-- JS Files -->
		<?php $loader->jsOrder(); ?>

		<script type="text/javascript">
			settings 		= <?php echo $GLOBALS["settings"]->getJSON(); ?>;
			languages 		= <?php echo $Language->getJSON(); ?>;
			user 			= <?php echo json_encode($GLOBALS['mapisession']->getUserInfo()); ?>;
			version 		= <?php echo json_encode($versionInfo); ?>;
			serverconfig 		= <?php echo json_encode($serverConfig); ?>;

			Ext.onReady(Zarafa.loadWelcome, Zarafa);
		</script>
	</body>
</html>
