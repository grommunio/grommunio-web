<?php

define('PLUGIN_SMIME_USER_DEFAULT_ENABLE_SMIME', true);
// CA Certificates used to verify client certificates, for custom CA's copy your CA to /etc/ssl/certs/ and call update-ca-certificates.
// Multiple CA locations can be defined by separating them with a semicolon
//
define('PLUGIN_SMIME_CACERTS', '/etc/ssl/certs');

// Legacy cipher constant (integer). Retained for backward compatibility.
// Use PLUGIN_SMIME_CIPHER_NAME (string) for new configurations.
define('PLUGIN_SMIME_CIPHER', OPENSSL_CIPHER_AES_256_CBC);

// Cipher name as string.  Supported: 'aes-256-gcm', 'aes-128-gcm', 'aes-256-cbc', 'aes-128-cbc'.
// AES-GCM produces AuthEnvelopedData (S/MIME 4.0, RFC 8551) — preferred when available.
// Falls back to AES-256-CBC transparently when GCM is not supported by the runtime.
define('PLUGIN_SMIME_CIPHER_NAME', 'aes-256-gcm');

// Signing digest algorithm: 'sha256', 'sha384', 'sha512'
define('PLUGIN_SMIME_DIGEST_ALG', 'sha256');

// Allow the browser to remember the passphrase
define('PLUGIN_SMIME_PASSPHRASE_REMEMBER_BROWSER', true);

// Enable OCSP verification (recommended for S/MIME 4.0 compliance)
define('PLUGIN_SMIME_ENABLE_OCSP', true);

// Enable CRL checking (RFC 8550 requirement). Requires network access to CRL distribution points.
define('PLUGIN_SMIME_ENABLE_CRL', false);

// Directory for CRL cache files
define('PLUGIN_SMIME_CRL_CACHE_DIR', '/tmp/grommunio-web-crl');

// Maximum age of cached CRLs in seconds (default: 24 hours)
define('PLUGIN_SMIME_CRL_MAX_AGE', 86400);

// Include RFC 5035 signingCertificateV2 in signed attributes
define('PLUGIN_SMIME_ENABLE_SIGNED_ATTRS', true);

// Include RFC 6211 CMSAlgorithmProtection in signed attributes
define('PLUGIN_SMIME_ENABLE_ALGO_PROTECTION', true);

// Warn when RSA key size is below the minimum
define('PLUGIN_SMIME_WARN_WEAK_RSA', true);

// Minimum RSA key size in bits
define('PLUGIN_SMIME_MIN_RSA_BITS', 2048);

// OCSP HTTP Proxy settings
define('PLUGIN_SMIME_PROXY', '');
define('PLUGIN_SMIME_PROXY_PORT', '');
define('PLUGIN_SMIME_PROXY_USERPWD', '');

// LDAP certificate lookup settings (for class.ldapcerts.php)
// define('PLUGIN_SMIME_LDAP_URI', 'ldap://ldap.example.com');
// define('PLUGIN_SMIME_LDAP_BASE_DN', 'dc=example,dc=com');
// define('PLUGIN_SMIME_LDAP_BIND_DN', '');
// define('PLUGIN_SMIME_LDAP_BIND_PASSWORD', '');
