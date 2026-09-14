<?php

// The mail list must carry PR_ACCESS: the client refuses a delete it believes the
// store would not accept, and the record default cannot stand in for the real value.
if (extension_loaded('mapi')) {
	echo "Mail list property checks skipped with php-mapi loaded\n";

	return;
}

$source = file_get_contents(dirname(__DIR__) . '/includes/core/class.properties.php');
preg_match_all('/\b(PR_[A-Z0-9_]+|PS_[A-Z0-9_]+|PT_[A-Z0-9_]+|MAPI_[A-Z0-9_]+|PidLid[A-Za-z0-9]+|PidName[A-Za-z0-9]+|PidTag[A-Za-z0-9]+)\b/', $source, $matches);
foreach (array_unique($matches[1]) as $index => $constant) {
	defined($constant) || define($constant, $index + 1);
}

function mapi_getprops($object, $tags = null) {
	return [PR_MAPPING_SIGNATURE => 'signature'];
}

function getPropIdsFromStrings($store, $names) {
	$ids = [];
	foreach (array_keys($names) as $index => $name) {
		$ids[$name] = 0x80000000 + $index;
	}

	return $ids;
}

class MailListSession {
	public function getDefaultMessageStore() {
		return 'store';
	}
}
$GLOBALS['mapisession'] = new MailListSession();

class MailListPluginManager {
	public function triggerHook($name, $data = []) {}
}
$GLOBALS['PluginManager'] = new MailListPluginManager();

require_once dirname(__DIR__) . '/includes/core/class.properties.php';

$properties = new Properties();
$list = $properties->getMailListProperties();
$open = $properties->getMailProperties();

if (!isset($list['access'])) {
	throw new RuntimeException('The mail list no longer asks for PR_ACCESS.');
}
if ($list['access'] !== $open['access']) {
	throw new RuntimeException('The mail list asks for a different access property than an opened mail.');
}

// The list is still meant to stay lean; the body is the expensive one.
if (isset($list['body']) || isset($list['html_body'])) {
	throw new RuntimeException('The mail list asks for a message body again.');
}

echo "Mail list property checks passed\n";
