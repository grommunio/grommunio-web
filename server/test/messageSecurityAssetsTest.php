<?php

/** Shared controls must retain icons when neither plugin supplies stylesheets. */
define('DEBUG_LOADER', 1);
require_once dirname(__DIR__) . '/includes/loader.php';

class MessageSecurityAssetLoader extends FileLoader {
	public array $files = [];
	public function getExtjsCSSFiles($load) { return []; }
	public function getPluginCSSFiles($load) { return []; }
	public function getRemoteCSSFiles($load) { return []; }
	public function printFiles($files, $template = '{file}', $base = false, $concatVersion = true) { $this->files = array_merge($this->files, $files); }
}

$loader = new MessageSecurityAssetLoader();
$loader->cssOrder();
if (!in_array('client/resources/css/message-security.css', $loader->files, true)) {
	throw new RuntimeException('Shared message-security styles are not loaded without plugin styles.');
}
$root = dirname(__DIR__, 2);
$css = file_get_contents($root . '/client/resources/css/message-security.css');
foreach (['icon_security_sign', 'icon_security_encrypt', 'body.dark-mode', 'mask: var(--security-icon)'] as $marker) {
	if (!str_contains($css, $marker)) { throw new RuntimeException('Shared security stylesheet is missing ' . $marker); }
}
echo "Shared message-security asset checks passed\n";
