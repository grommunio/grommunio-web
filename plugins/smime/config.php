<?php

define('PLUGIN_SMIME_USER_DEFAULT_ENABLE_SMIME', true);
// CA certificates used to verify S/MIME certificate chains.
// Multiple CA locations (bundle files or hashed directories) can be defined
// by separating them with a semicolon.
// On Debian based systems /etc/ssl/certs contains the full trust store.
// On SUSE based systems /etc/ssl/certs only contains TLS (server-auth) CAs;
// the unfiltered store /var/lib/ca-certificates/openssl, which also holds
// email-only roots, is picked up automatically in addition.
// On RHEL based systems /etc/ssl/certs is not a hashed directory; the
// email-purpose bundle /etc/pki/ca-trust/extracted/pem/email-ca-bundle.pem
// is picked up automatically in addition.
// To add a custom CA, copy it to /usr/local/share/ca-certificates (Debian),
// /etc/pki/ca-trust/source/anchors (RHEL) or /etc/pki/trust/anchors (SUSE)
// and run update-ca-certificates (Debian/SUSE) or update-ca-trust (RHEL).
define('PLUGIN_SMIME_CACERTS', '/etc/ssl/certs');

// Allow AIA "CA Issuers", OCSP and CRL downloads from private, loopback or
// link-local addresses. Enable when an internal PKI publishes these endpoints
// on the intranet; leave disabled otherwise (SSRF hardening).
define('PLUGIN_SMIME_AIA_ALLOW_PRIVATE', false);

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

// Reject OCSP status data older than this when the responder gives no nextUpdate.
define('PLUGIN_SMIME_OCSP_MAX_AGE', 86400);

// Fail a verified signature when the revocation status of a certificate in
// its chain cannot be determined (no OCSP URL, unreachable responder, no
// CRL). Disabled by default: an inconclusive check is logged and the
// signature keeps its verification result.
define('PLUGIN_SMIME_REVOCATION_FAIL_CLOSED', false);

// Clock tolerance for OCSP response timestamps.
define('PLUGIN_SMIME_OCSP_CLOCK_SKEW', 300);

// Enable CRL checking (RFC 8550 requirement). Requires network access to CRL distribution points.
define('PLUGIN_SMIME_ENABLE_CRL', false);

// Directory for CRL cache files
define('PLUGIN_SMIME_CRL_CACHE_DIR', (defined('TMP_PATH') ? TMP_PATH : sys_get_temp_dir()) . '/smime/crl');

// Maximum age of cached CRLs in seconds (default: 24 hours)
define('PLUGIN_SMIME_CRL_MAX_AGE', 86400);

// Maximum CRL download size (default: 8 MiB)
define('PLUGIN_SMIME_CRL_MAX_BYTES', 8388608);

// Clock tolerance for CRL update timestamps.
define('PLUGIN_SMIME_CRL_CLOCK_SKEW', 300);

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

// LDAP certificate lookup settings (for class.ldapcerts.php). The URI and
// search base are fixed here and cannot be overridden by a client request, so
// configured bind credentials are only sent to this administrator-selected
// directory. Prefer ldaps:// when credentials are configured.
// define('PLUGIN_SMIME_LDAP_URI', 'ldap://ldap.example.com');
// define('PLUGIN_SMIME_LDAP_BASE_DN', 'dc=example,dc=com');
// define('PLUGIN_SMIME_LDAP_BIND_DN', '');
// define('PLUGIN_SMIME_LDAP_BIND_PASSWORD', '');
