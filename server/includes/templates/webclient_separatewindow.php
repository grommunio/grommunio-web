<?php
include(BASE_PATH . 'server/includes/loader.php');

$loader = new FileLoader();

?><!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>

	<head>
		<meta name="Generator" content="Kopano WebApp v<?php echo $loader->getVersion()?>">
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge" />
		<title><?php echo $webappTitle; ?></title>
		<link rel="icon" href="client/resources/images/favicon.ico?v2.2.0" type="image/x-icon">
		<link rel="shortcut icon" href="client/resources/images/favicon.ico?v2.2.0" type="image/x-icon">

		<?php
			$loader->cssOrder();
			echo Theming::getStyles($theme);
			$iconsetStylesheet = Iconsets::getActiveStylesheet();
		?>
	</head>

	<body class="theme-<?php echo strtolower($theme ? $theme : 'basic') ?>">
		<?php
			$jsTemplate = "\t\t<script type=\"text/javascript\" src=\"{file}\"></script>";
            $selectedEditor = $GLOBALS["settings"]->get('zarafa/v1/contexts/mail/html_editor');

			if ($selectedEditor === 'quill') {
                $extjsFiles[] = "plugins/htmleditor-quill/lib/quill.js";
            } else {
                if (DEBUG_LOADER === LOAD_RELEASE) {
                    $extjsFiles[] = "client/tinymce/tinymce.min.js";
                } else {
                    $extjsFiles[] = "client/tinymce/tinymce.js";
                }
            }
			$loader->printFiles($extjsFiles, $jsTemplate);
		?>
		<link id="kopano-iconset-stylesheet" rel="stylesheet" href="<?php echo $iconsetStylesheet; ?>" >
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
