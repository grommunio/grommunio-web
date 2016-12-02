<?php
include(BASE_PATH . 'server/includes/loader.php');

$loader = new FileLoader();

$cssTemplate = "\t\t<link rel=\"stylesheet\" type=\"text/css\" href=\"{file}\">\n";
$jsTemplate = "\t\t<script type=\"text/javascript\" src=\"{file}\"></script>\n";

$version = trim(file_get_contents('version'));

$versionInfo = array(
	'webapp'	=> $version,
	'zcp'		=> phpversion('mapi'),
	'server'	=> DEBUG_SHOW_SERVER ? DEBUG_SERVER_ADDRESS : '',
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

		<script type="text/javascript"><?php require('template.js'); ?></script>
		<script type="text/javascript"><?php require(BASE_PATH . 'client/fingerprint.js'); ?></script>
		<?php
			$extjsFiles = $loader->getExtjsCSSFiles(DEBUG_LOADER);
			$loader->printFiles($extjsFiles, $cssTemplate);

			$webappFiles = $loader->getZarafaCSSFiles(DEBUG_LOADER);
			$loader->printFiles($webappFiles, $cssTemplate);

			$pluginFiles = $loader->getPluginCSSFiles(DEBUG_LOADER);
			$loader->printFiles($pluginFiles, $cssTemplate);

			$remoteFiles = $loader->getRemoteCSSFiles(DEBUG_LOADER);
			$loader->printFiles($remoteFiles, $cssTemplate);

			/* Add the styling of the theme */
			$css = Theming::getCss($theme);
			if ( count($css) ){
				foreach ( $css as $file ){
					echo '<link rel="stylesheet" type="text/css" href="'.$file.'">';
				}
			}
		?>
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

		<script type="text/javascript">			
			bodyEl = document.getElementsByTagName('body')[0];
			maskEl = document.getElementById('loading-mask');
			cntEl = document.getElementById('form-container');
			bgEl = document.getElementById('bg');
			logoEl = document.getElementById('logo');

			// Add some classes to the body tag, so we can change styles (for IE)
			bodyEl.className += (bodyEl.className.length>0 ? ' ' : '') + navigator.sayswho.split(' ')[0];
			bodyEl.className += ' ' + navigator.sayswho.replace(' ','');

			var img = document.createElement('img');
			img.onload = function(){
				cntEl.style.visibility = 'visible';
			}
			img.src = window.getComputedStyle(maskEl, false).backgroundImage.slice(4, -1).replace(/"/g, "");

			// call it once to initialize the elements
			onResize();
		</script>

		<!-- Translations -->
		<script type="text/javascript" src="index.php?version=<?php echo $version?>&load=translations.js&lang=<?php echo $Language->getSelected()?>"></script>

		<!-- ExtJS & Thirdparty extensions-->
		<?php
			$extjsFiles = $loader->getExtjsJavascriptFiles(DEBUG_LOADER);
			$loader->printFiles($extjsFiles, $jsTemplate);
		?>

		<!-- Zarafa client stuff -->
		<?php
			$webappFiles = $loader->getZarafaJavascriptFiles(DEBUG_LOADER, $extjsFiles);
			$loader->printFiles($webappFiles, $jsTemplate);

			$pluginFiles = $loader->getPluginJavascriptFiles(DEBUG_LOADER, array_merge($extjsFiles, $webappFiles));
			$loader->printFiles($pluginFiles, $jsTemplate);

			$remoteFiles = $loader->getRemoteJavascriptFiles(DEBUG_LOADER);
			$loader->printFiles($remoteFiles, $jsTemplate);
		?>

		<script type="text/javascript">
			settings 		= <?php echo json_encode($GLOBALS["settings"]->getJSON()); ?>;
			languages 		= <?php echo json_encode($Language->getJSON()); ?>;
			user 			= <?php echo json_encode($GLOBALS['mapisession']->getUserInfo()); ?>;
			version 		= <?php echo json_encode($versionInfo); ?>;
			serverconfig 	= <?php echo json_encode($serverConfig); ?>;
		</script>

		<script type="text/javascript">
			Ext.onReady(Zarafa.loadWelcome, Zarafa);
		</script>
	</body>
</html>
