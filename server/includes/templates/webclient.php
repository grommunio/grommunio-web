<?php
include(BASE_PATH . 'server/includes/loader.php');
include(BASE_PATH . 'server/includes/templates/serverinfo.php');

$loader = new FileLoader();

$versionInfo['webapp'] = $loader->getVersion();
$serverConfig = array_merge($serverConfig, array(
	'base_url'						=> BASE_URL,
	'webapp_title'					=> WEBAPP_TITLE,
	'using_sso'						=> WebAppAuthentication::isUsingSingleSignOn() ? true : false,
	'disable_full_gab'				=> DISABLE_FULL_GAB,
	'enable_shared_rules'			=> ENABLE_SHARED_RULES,
	'always_enabled_plugins'		=> $GLOBALS['PluginManager']->expandPluginList(ALWAYS_ENABLED_PLUGINS_LIST),
	'disable_whats_new_dialog'		=> DISABLE_WHATS_NEW_DIALOG,
	'enable_advanced_settings'		=> ENABLE_ADVANCED_SETTINGS ? true : false,
	'post_max_size'					=> getMaxPostRequestSize(),
	'max_file_uploads'				=> getMaxFileUploads(),
	'client_timeout' 				=> defined('CLIENT_TIMEOUT') && is_numeric(CLIENT_TIMEOUT) && CLIENT_TIMEOUT>0 ? CLIENT_TIMEOUT : false,
	'active_theme'					=> Theming::getActiveTheme(),
	'icons_primary_color'			=> Theming::getPrimaryIconColor(),
	'icons_secondary_color'			=> Theming::getSecondaryIconColor(),
	'json_themes'					=> Theming::getJsonThemes(),
	'iconsets'						=> Iconsets::getIconsets(),
	'active_iconset'				=> Iconsets::getActiveIconset(),
	'iconsets_about'				=> Iconsets::getAboutTexts(),
	'version_info'					=> $GLOBALS['PluginManager']->getPluginsVersion(),
	'is_vcfimport_supported'		=> function_exists('mapi_vcftomapi'),
	'is_icsimport_supported'		=> function_exists('mapi_mapitoical'),
	'color_schemes'					=> json_decode(COLOR_SCHEMES),
	'default_categories'			=> json_decode(DEFAULT_CATEGORIES),
	'maximum_eml_files_in_zip'		=> MAX_EML_FILES_IN_ZIP,
	'powerpaste'					=> array(
											'powerpaste_word_import' => POWERPASTE_WORD_IMPORT,
											'powerpaste_html_import' => POWERPASTE_HTML_IMPORT,
											'powerpaste_allow_local_images' => POWERPASTE_ALLOW_LOCAL_IMAGES,
										),
	'shared_store_polling_interval' => SHARED_STORE_POLLING_INTERVAL,
	'prefetch_email_count' => PREFETCH_EMAIL_COUNT,
	'prefetch_email_interval' => PREFETCH_EMAIL_INTERVAL,
	'oidc_enabled' => OIDC_ISS,
));
if ( CONTACT_PREFIX ){
	$serverConfig['contact_prefix'] = json_decode(CONTACT_PREFIX);
}
if ( CONTACT_SUFFIX ){
	$serverConfig['contact_suffix'] = json_decode(CONTACT_SUFFIX);
}
if ( defined('ADDITIONAL_COLOR_SCHEMES') ){
	$serverConfig['additional_color_schemes'] = json_decode(ADDITIONAL_COLOR_SCHEMES);
}
if ( defined('ADDITIONAL_CATEGORIES') ){
	$serverConfig['additional_default_categories'] = json_decode(ADDITIONAL_CATEGORIES);
}
?>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>

	<head>
		<meta name="Generator" content="Kopano WebApp v<?php echo $loader->getVersion()?>">
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge" />
		<title><?php echo $webappTitle; ?></title>
		<link rel="icon" href="<?php echo $favicon ?>" type="image/x-icon">
		<link rel="shortcut icon" href="<?php echo $favicon ?>" type="image/x-icon">

		<script type="text/javascript"><?php require(BASE_PATH . 'client/fingerprint.js'); ?></script>

		<!-- load the login css first as we need it immediately! -->
		<link rel="stylesheet" href="client/resources/css/external/login.css" >
		<?php
			$loader->cssOrder();
			echo Theming::getStyles($theme);
			$iconsetStylesheet = Iconsets::getActiveStylesheet();
		?>
		<link id="kopano-iconset-stylesheet" rel="stylesheet" href="<?php echo $iconsetStylesheet; ?>" >
	</head>

	<body class="zarafa-webclient theme-<?php echo strtolower($theme ? $theme : 'basic'); echo ' '. $hideFavorites; echo ' '. $scrollFavorites ?>">
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

		<!-- Translations -->
		<script type="text/javascript" src="index.php?version=<?php echo $loader->getVersion() ?>&load=translations.js&lang=<?php echo $Language->getSelected() ?>"></script>
		<!-- JS Files -->
		<?php
			$loader->jsOrder();
			// get URL data from session and dump it for client to use
			$urlActionData = array();
			if(!empty($_SESSION['url_action'])) {
				$urlActionData = $_SESSION['url_action'];

				// remove data from session so if user reloads webapp then we will again not execute url action
				unset($_SESSION['url_action']);
			}
		?>

		<script type="text/javascript"><?php require(BASE_PATH . 'client/resize.js'); ?></script>
		<script type="text/javascript">
			settings 		= <?php echo $GLOBALS["settings"]->getJSON(); ?>;
			persistentsettings      = <?php echo $GLOBALS["settings"]->getPersistentSettingsJSON(); ?>;
			languages 		= <?php echo $Language->getJSON(); ?>;
			user 			= <?php echo json_encode($GLOBALS['mapisession']->getUserInfo()); ?>;
			version 		= <?php echo json_encode($versionInfo); ?>;
			serverconfig 		= <?php echo json_encode($serverConfig); ?>;
			urlActionData 		= <?php echo json_encode($urlActionData); ?>;

			Ext.onReady(Zarafa.loadWebclient, Zarafa);
		</script>
	</body>
</html>
