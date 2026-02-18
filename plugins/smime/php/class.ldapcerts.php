<?php

/**
 * LDAP certificate lookup.
 *
 * Queries LDAP directories for user certificates stored in the
 * `userCertificate` attribute (binary, DER-encoded).
 */
class LdapCertLookup {
	/** @var string LDAP URI */
	private string $ldapUri;

	/** @var string Base DN for searches */
	private string $baseDn;

	/** @var string Bind DN (empty for anonymous) */
	private string $bindDn;

	/** @var string Bind password */
	private string $bindPassword;

	/**
	 * @param string $ldapUri     LDAP server URI (e.g., "ldap://ldap.example.com")
	 * @param string $baseDn      base DN for user searches
	 * @param string $bindDn      bind DN (optional)
	 * @param string $bindPassword bind password (optional)
	 */
	public function __construct(
		string $ldapUri,
		string $baseDn,
		string $bindDn = '',
		string $bindPassword = ''
	) {
		$this->ldapUri = $ldapUri;
		$this->baseDn = $baseDn;
		$this->bindDn = $bindDn;
		$this->bindPassword = $bindPassword;
	}

	/**
	 * Look up certificates for an email address.
	 *
	 * @param string $email email address to search for
	 *
	 * @return array list of PEM-encoded certificates
	 */
	public function lookup(string $email): array {
		if (!extension_loaded('ldap')) {
			error_log("[smime] LDAP extension not available");

			return [];
		}

		$conn = @ldap_connect($this->ldapUri);
		if ($conn === false) {
			error_log("[smime] Cannot connect to LDAP server: {$this->ldapUri}");

			return [];
		}

		ldap_set_option($conn, LDAP_OPT_PROTOCOL_VERSION, 3);
		ldap_set_option($conn, LDAP_OPT_REFERRALS, 0);
		ldap_set_option($conn, LDAP_OPT_NETWORK_TIMEOUT, 10);

		// Bind
		if (!empty($this->bindDn)) {
			$bound = @ldap_bind($conn, $this->bindDn, $this->bindPassword);
		}
		else {
			$bound = @ldap_bind($conn);
		}

		if (!$bound) {
			error_log(sprintf("[smime] LDAP bind failed: %s", ldap_error($conn)));
			ldap_close($conn);

			return [];
		}

		// Search for the user by email
		$filter = sprintf('(mail=%s)', ldap_escape($email, '', LDAP_ESCAPE_FILTER));
		$search = @ldap_search($conn, $this->baseDn, $filter, ['userCertificate;binary', 'userCertificate', 'userSMIMECertificate;binary']);

		if ($search === false) {
			error_log(sprintf("[smime] LDAP search failed: %s", ldap_error($conn)));
			ldap_close($conn);

			return [];
		}

		$entries = ldap_get_entries($conn, $search);
		ldap_close($conn);

		$certs = [];
		if ($entries === false || $entries['count'] === 0) {
			return [];
		}

		for ($i = 0; $i < $entries['count']; ++$i) {
			$entry = $entries[$i];

			// Try userCertificate;binary first, then userSMIMECertificate;binary
			foreach (['usercertificate;binary', 'usercertificate', 'usersmimecertificate;binary'] as $attr) {
				if (isset($entry[$attr])) {
					for ($j = 0; $j < $entry[$attr]['count']; ++$j) {
						$derCert = $entry[$attr][$j];
						if (!empty($derCert)) {
							$certs[] = $this->der2pem($derCert);
						}
					}
				}
			}
		}

		return $certs;
	}

	/**
	 * Convert DER to PEM.
	 */
	private function der2pem(string $der): string {
		return "-----BEGIN CERTIFICATE-----\n" .
			chunk_split(base64_encode($der), 64, "\n") .
			"-----END CERTIFICATE-----\n";
	}
}
