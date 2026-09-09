<?php

require_once __DIR__ . '/class.pgpkeystore.php';
require_once __DIR__ . '/class.pgpkeyserver.php';

/** Authenticated persistence/opaque transport. No server-side private-key operations. */
class PluginPgpModule extends Module {
	public function execute() {
		foreach ($this->data as $action => $payload) {
			if ($action !== 'request') {
				$this->handleUnknownActionType($action);
				continue;
			}
			try {
				$result = $this->request(is_array($payload) ? $payload : []);
				$this->addActionData('request', ['success' => true] + $result);
			}
			catch (Throwable $error) {
				$this->addActionData('request', ['success' => false, 'message' => $error instanceof RuntimeException || $error instanceof InvalidArgumentException ? $error->getMessage() : _('The OpenPGP operation could not be completed.')]);
			}
			$GLOBALS['bus']->addData($this->getResponseData());
		}
	}

	public function request(array $data): array {
		// Old clients must not send unlock credentials to this endpoint.
		foreach (['passphrase', 'password', 'unlocked_key', 'private_key'] as $field) {
			if (array_key_exists($field, $data)) {
				throw new InvalidArgumentException('OpenPGP unlocking happens only in your browser. Reload the web client.');
			}
		}
		$store = PgpKeyStore::current();
		switch (self::string($data, 'operation')) {
			case 'list':
				return [
					'keys' => $store->listKeys(), 'keyservers' => $store->servers(),
					'allowed_keyservers' => PLUGIN_PGP_KEYSERVER_ALLOWLIST,
					'unlock_ttl' => max(30, min(3600, (int) PLUGIN_PGP_UNLOCK_TTL)),
					'max_envelope_bytes' => self::maxEnvelopeBytes(),
					'default_key' => $GLOBALS['settings']->get('zarafa/v1/plugins/pgp/default_key', ''),
					'default_sign' => $GLOBALS['settings']->get('zarafa/v1/plugins/pgp/default_sign', false),
					'default_encrypt' => $GLOBALS['settings']->get('zarafa/v1/plugins/pgp/default_encrypt', false),
				];
			case 'public':
				return ['keys' => $store->publicKeys()];
			case 'get':
				return ['key' => $store->key(self::string($data, 'fingerprint'), true)];
			case 'put':
				if (!is_array($data['key'] ?? null)) {
					throw new InvalidArgumentException('A browser-validated protected OpenPGP key is required.');
				}
				return ['key' => $store->importKey($data['key'])];
			case 'delete':
				$store->delete(self::string($data, 'fingerprint'), self::boolean($data, 'deleteSecret'));
				return [];
			case 'trust':
				$store->trust(self::string($data, 'fingerprint'), self::string($data, 'email'), self::boolean($data, 'trusted'));
				return [];
			case 'keyservers':
				if (!is_array($data['servers'] ?? null)) {
					throw new InvalidArgumentException('A list of keyservers is required.');
				}
				$store->setServers($data['servers']);
				return ['keyservers' => $store->servers()];
			case 'lookup':
				return PgpKeyserver::lookup($store, self::string($data, 'server'), self::string($data, 'fingerprint'));
			case 'prepare':
				$plugin = $GLOBALS['PluginManager']->plugins['pgp'] ?? null;
				if (!$plugin instanceof Pluginpgp) {
					throw new RuntimeException('OpenPGP is not available.');
				}
				return $plugin->prepare($data);
			default:
				throw new InvalidArgumentException('This OpenPGP operation is not supported. Key creation and unlocking run in your browser.');
		}
	}

	/** The largest base64 envelope a send request can carry through PHP's post_max_size. */
	public static function maxEnvelopeBytes(): int {
		$limit = (int) (PLUGIN_PGP_MAX_MESSAGE_BYTES * 4 / 3) + 4;
		$post = trim((string) ini_get('post_max_size'));
		if ($post !== '' && preg_match('/^(\d+)\s*([kmg]?)$/i', $post, $match) && (int) $match[1] > 0) {
			$bytes = (int) $match[1] * (1024 ** strpos('bkmg', strtolower($match[2] ?: 'b')));
			$limit = min($limit, max(0, $bytes - 262144));
		}
		return $limit;
	}

	private static function string(array $data, string $name, string $default = ''): string {
		$value = $data[$name] ?? $default;
		if (!is_string($value)) {
			throw new InvalidArgumentException('Invalid OpenPGP request field: ' . $name);
		}
		return $value;
	}

	private static function boolean(array $data, string $name): bool {
		$value = $data[$name] ?? false;
		if (!is_bool($value)) {
			throw new InvalidArgumentException('Invalid OpenPGP boolean: ' . $name);
		}
		return $value;
	}
}
