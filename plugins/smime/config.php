<?php

define('PLUGIN_SMIME_USER_DEFAULT_ENABLE_SMIME', true);
// CA Certificates used to verify client certificates, for custom CA's copy your CA to /etc/ssl/certs/ and call update-ca-certificates.
// Multiple CA locations can be defined by separating them with a semicolon
//
define('PLUGIN_SMIME_CACERTS', '/etc/ssl/certs');

// Set preferred encryption cipher, check http://www.php.net/manual/en/openssl.ciphers.php for the available ciphers.
// Recommended is OPENSSL_CIPHER_AES_128_CBC or higher
define('PLUGIN_SMIME_CIPHER', OPENSSL_CIPHER_AES_256_CBC);

// Allow the browser to remember the passphrase
define('PLUGIN_SMIME_PASSPHRASE_REMEMBER_BROWSER', true);

// Enable OCSP verification
define('PLUGIN_SMIME_ENABLE_OCSP', false);

// OCSP HTTP Proxy settings
define('PLUGIN_SMIME_PROXY', '');
define('PLUGIN_SMIME_PROXY_PORT', '');
define('PLUGIN_SMIME_PROXY_USERPWD', '');
