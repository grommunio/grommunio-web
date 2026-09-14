<?php
include BASE_PATH . 'server/includes/loader.php';

$loader = new FileLoader();

?><!DOCTYPE html>
<html>

	<head>
		<meta name="Generator" content="grommunio-web v<?php echo $loader->getVersion(); ?>">
<?php
// The canvas is dark before any stylesheet arrives, so a reload does not flash white
$darkMode = WebAppAuthentication::isAuthenticated() ? $GLOBALS['settings']->get('zarafa/v1/main/dark_mode') : 'light';
if ($darkMode === 'dark') {
	echo "\t\t<style>html { background: #121212; }</style>\n";
}
elseif ($darkMode === 'system') {
	echo "\t\t<style>@media (prefers-color-scheme: dark) { html { background: #121212; } }</style>\n";
}
?>
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge" />
		<title><?php echo $webappTitle; ?></title>
		<link rel="icon" href="<?php echo $favicon; ?>" type="image/x-icon">
		<link rel="shortcut icon" href="<?php echo $favicon; ?>" type="image/x-icon">
		<link rel="manifest" href="<?php echo versionedUrl('manifest.webmanifest'); ?>">

		<link rel="stylesheet" href="client/resources/css/darkmode.css?version=<?php echo getWebappVersion(); ?>" >
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
}
elseif ($darkMode === 'system') {
	echo ' dark-mode-system';
}
?>">
		<script>
		// Resolve the system dark mode before anything renders; waiting for
		// DOMContentLoaded showed the light loading screen until the scripts ran
		if (document.body.classList.contains('dark-mode-system') && window.matchMedia('(prefers-color-scheme: dark)').matches) {
			document.body.classList.add('dark-mode');
		}
		</script>
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
