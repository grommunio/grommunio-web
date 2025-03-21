<?php
include BASE_PATH . 'server/includes/loader.php';

$loader = new FileLoader();

$cssTemplate = "\t\t<link rel=\"stylesheet\" type=\"text/css\" href=\"{file}\">\n";

?><!DOCTYPE html>
<html>

	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge" />

		<?php
			$extjsCssFiles = $loader->getExtjsCSSFiles(DEBUG_LOADER);
$loader->printFiles($extjsCssFiles, $cssTemplate);

$webappFiles = $loader->getCSSFiles(DEBUG_LOADER);
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
	</body>
</html>
