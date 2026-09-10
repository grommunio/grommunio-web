<?php

// Protected keys live in MAPI; OpenPGP.js unlocks only in browser memory.
defined('PLUGIN_PGP_ENABLE') || define('PLUGIN_PGP_ENABLE', false);
defined('PLUGIN_PGP_USER_DEFAULT_ENABLE') || define('PLUGIN_PGP_USER_DEFAULT_ENABLE', false);
defined('PLUGIN_PGP_MAX_MESSAGE_BYTES') || define('PLUGIN_PGP_MAX_MESSAGE_BYTES', 52428800);
defined('PLUGIN_PGP_MAX_KEY_BYTES') || define('PLUGIN_PGP_MAX_KEY_BYTES', 1048576);
defined('PLUGIN_PGP_UNLOCK_TTL') || define('PLUGIN_PGP_UNLOCK_TTL', 300);
defined('PLUGIN_PGP_KEYSERVER_ALLOWLIST') || define('PLUGIN_PGP_KEYSERVER_ALLOWLIST', [
	'https://keys.openpgp.org',
	'https://keyserver.ubuntu.com',
]);
