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
	'base_url'						=> BASE_URL,
	'webapp_title'					=> WEBAPP_TITLE,
	'using_sso'						=> WebAppAuthentication::isUsingSingleSignOn() ? true : false,
	'disable_full_gab'				=> DISABLE_FULL_GAB,
	'enable_shared_rules'			=> ENABLE_SHARED_RULES,
	'enable_plugins'				=> ENABLE_PLUGINS ? true : false,
	'always_enabled_plugins'		=> $GLOBALS['PluginManager']->expandPluginList(ALWAYS_ENABLED_PLUGINS_LIST),
	'enable_advanced_settings'		=> ENABLE_ADVANCED_SETTINGS ? true : false,
	'max_attachment_size'			=> getMaxUploadSize(),
	'post_max_size'					=> getMaxPostRequestSize(),
	'max_file_uploads'				=> getMaxFileUploads(),
	'freebusy_load_start_offset'	=> FREEBUSY_LOAD_START_OFFSET,
	'freebusy_load_end_offset' 		=> FREEBUSY_LOAD_END_OFFSET,
	'client_timeout' 				=> defined('CLIENT_TIMEOUT') && is_numeric(CLIENT_TIMEOUT) && CLIENT_TIMEOUT>0 ? CLIENT_TIMEOUT : false,
	'active_theme'					=> Theming::getActiveTheme(),
	'version_info'					=> $GLOBALS['PluginManager']->getPluginsVersion(),
	'is_vcfimport_supported'		=> function_exists('mapi_vcftomapi'),
	'color_schemes'					=> json_decode(COLOR_SCHEMES),
	'default_categories'			=> json_decode(DEFAULT_CATEGORIES),
	'maximum_eml_files_in_zip'		=> MAX_EML_FILES_IN_ZIP,
	'powerpaste'					=> array(
											'powerpaste_word_import' => POWERPASTE_WORD_IMPORT,
											'powerpaste_html_import' => POWERPASTE_HTML_IMPORT,
											'powerpaste_allow_local_images' => POWERPASTE_ALLOW_LOCAL_IMAGES,
										)
);
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
		<meta name="Generator" content="Kopano WebApp v<?php echo $version?>">
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge" />
		<title><?php echo $webappTitle; ?></title>
		<link rel="icon" href="<?php echo $favicon ?>" type="image/x-icon">
		<link rel="shortcut icon" href="<?php echo $favicon ?>" type="image/x-icon">

		<script type="text/javascript"><?php require(BASE_PATH . 'client/fingerprint.js'); ?></script>

		<!-- load the login css first as we need it immediately! -->
		<link rel="stylesheet" href="client/resources/css/external/login.css" >
		<?php $loader->cssOrder(); ?>
	</head>

	<body class="zarafa-webclient theme-<?php echo strtolower($theme ? $theme : 'basic') ?>">
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
		<script type="text/javascript" src="index.php?version=<?php echo $version ?>&load=translations.js&lang=<?php echo $Language->getSelected() ?>"></script>
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
