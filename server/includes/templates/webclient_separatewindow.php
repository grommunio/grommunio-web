<?php
include BASE_PATH . 'server/includes/loader.php';

$loader = new FileLoader();

?><!DOCTYPE html>
<html>

	<head>
		<meta name="Generator" content="grommunio-web v<?php echo $loader->getVersion(); ?>">
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge" />
		<title><?php echo $webappTitle; ?></title>
		<link rel="icon" href="client/resources/images/favicon.ico?v2.2.0" type="image/x-icon">
		<link rel="shortcut icon" href="client/resources/images/favicon.ico?v2.2.0" type="image/x-icon">

		<script>
		// Resolve system dark mode preference before CSS renders
		(function() {
			document.addEventListener('DOMContentLoaded', function() {
				if (document.body.classList.contains('dark-mode-system') && window.matchMedia('(prefers-color-scheme: dark)').matches) {
					document.body.classList.add('dark-mode');
				}
			});
		})();
		</script>
		<link rel="stylesheet" href="client/resources/css/darkmode.css" >
		<?php
			$loader->cssOrder();
echo Theming::getStyles($theme);
$iconsetStylesheet = Iconsets::getActiveStylesheet();
?>
		<link id="grommunio-iconset-stylesheet" rel="stylesheet" href="<?php echo $iconsetStylesheet; ?>" >
	</head>

	<body class="zarafa-webclient theme-<?php echo strtolower((string) $theme ?: 'basic');
$darkMode = WebAppAuthentication::isAuthenticated() ? $GLOBALS['settings']->get('zarafa/v1/main/dark_mode') : 'light';
if ($darkMode === 'dark') {
	echo ' dark-mode';
} elseif ($darkMode === 'system') {
	echo ' dark-mode-system';
}
?>">
		<?php
	$jsTemplate = "\t\t<script src=\"{file}\"></script>";
if (DEBUG_LOADER === LOAD_RELEASE) {
	$extjsFiles[] = "client/tinymce/tinymce.min.js";
}
else {
	$extjsFiles[] = "client/tinymce/tinymce.js";
}
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
