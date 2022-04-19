<?php
DEFINE('PLUGIN_SMIME_USER_DEFAULT_ENABLE_SMIME', true);
// CA Certificates used to verify client certificates, for custom CA's copy your CA to /etc/ssl/certs/ and call update-ca-certificates.
// Multiple CA locations can be defined by separating them with a semicolon
// 
DEFINE('PLUGIN_SMIME_CACERTS', '/etc/ssl/certs');

// Set preferred encryption cipher, check http://www.php.net/manual/en/openssl.ciphers.php for the avaliable ciphers.
// Recommended is OPENSSL_CIPHER_AES_128_CBC or higher
DEFINE('PLUGIN_SMIME_CIPHER', OPENSSL_CIPHER_3DES); 

// Allow the browser to remember the passphrase
DEFINE('PLUGIN_SMIME_PASSPHRASE_REMEMBER_BROWSER', true);

// Enable OCSP verification
DEFINE('PLUGIN_SMIME_ENABLE_OCSP', false);

// OCSP HTTP Proxy settings
DEFINE('PLUGIN_SMIME_PROXY', '');
DEFINE('PLUGIN_SMIME_PROXY_PORT', '');
DEFINE('PLUGIN_SMIME_PROXY_USERPWD', '');
?>
