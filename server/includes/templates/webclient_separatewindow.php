<?php
include(BASE_PATH . 'server/includes/loader.php');

$loader = new FileLoader();

$cssTemplate = "\t\t<link rel=\"stylesheet\" type=\"text/css\" href=\"{file}\">\n";
$jsTemplate = "\t\t<script type=\"text/javascript\" src=\"{file}\"></script>\n";

$version = trim(file_get_contents('version'));

?><!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>

	<head>
		<meta name="Generator" content="Kopano WebApp v<?php echo $version?>">
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge" />
		<title><?php echo $webappTitle; ?></title>
		<link rel="icon" href="client/resources/images/favicon.ico?v2.2.0" type="image/x-icon">
		<link rel="shortcut icon" href="client/resources/images/favicon.ico?v2.2.0" type="image/x-icon">

		<?php
			$extjsCssFiles = $loader->getExtjsCSSFiles(DEBUG_LOADER);
			$loader->printFiles($extjsCssFiles, $cssTemplate);

			$webappFiles = $loader->getZarafaCSSFiles(DEBUG_LOADER);
			$loader->printFiles($webappFiles, $cssTemplate);

			$pluginFiles = $loader->getPluginCSSFiles(DEBUG_LOADER);
			$loader->printFiles($pluginFiles, $cssTemplate);

			$remoteFiles = $loader->getRemoteCSSFiles(DEBUG_LOADER);
			$loader->printFiles($remoteFiles, $cssTemplate);

			/* Add the styling of the theme */
			$css = Theming::getCss($theme);
			foreach ($css as $file) {
				echo '<link rel="stylesheet" type="text/css" href="' . $file . '">';
			}
		?>
	</head>

	<body>
		<?php
			$extjsFiles[] = "client/tinymce/tinymce.js";
			$loader->printFiles($extjsFiles, $jsTemplate);
		?>
		<script>

			/**
			 * Function which is use to set focus on main browser window
			 */
			setFocusOnMainWindow = function ()
			{
				var browserWindowMgr = window.opener.Zarafa.core.BrowserWindowMgr;
				var mainWindowObject = browserWindowMgr.browserWindows.get('mainBrowserWindow');
				var mainWindow = mainWindowObject.open('', 'mainBrowserWindow');
				mainWindow.focus();
				browserWindowMgr.setActive('mainBrowserWindow');
			}

			window.onload = function ()
			{
				// On separate window load creates main container into the separate window and load the required component within it.
				var browserWindowManager = window.opener.Zarafa.core.BrowserWindowMgr;
				browserWindowManager.createUI(window);
			};
			
		</script>
	</body>
</html>
