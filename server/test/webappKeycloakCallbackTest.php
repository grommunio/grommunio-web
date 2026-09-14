<?php

// The base class is stubbed unless a caller has loaded mapi-header-php's KeyCloak already.
if (!class_exists('KeyCloak')) {
	class KeyCloak {
		public $redirect_url;
		protected $client_id;
		protected $realm_url;
		protected $secret;
		protected $is_public;

		public function __construct(mixed $keycloakConfig) {
			$this->client_id = $keycloakConfig['resource'] ?? 'gramm';
			$this->realm_url = ($keycloakConfig['auth-server-url'] ?? '') . 'realms/' . ($keycloakConfig['realm'] ?? 'grommunio');
		}
	}
}

require_once dirname(__DIR__) . '/includes/core/class.webappkeycloak.php';

$_SESSION = [];
$config = ['realm' => 'grommunio', 'resource' => 'grommunio-web', 'auth-server-url' => 'https://mail.example.com/auth/', 'credentials' => ['secret' => 'x']];

function callbackFor(array $server, array $config) {
	// the base class reads these two unconditionally; a foreign Host proves SERVER_NAME wins
	$_SERVER = $server + ['HTTP_HOST' => 'proxy.example.com', 'REQUEST_URI' => '/web/'];

	return (new WebAppKeyCloak($config))->redirect_url;
}

$cases = [
	// the registered redirect URI is the deployment directory, whatever script serves the request
	[['SERVER_NAME' => 'mail.example.com', 'SCRIPT_NAME' => '/web/index.php'], 'https://mail.example.com/web'],
	[['SERVER_NAME' => 'mail.example.com', 'SCRIPT_NAME' => '/web/grommunio.php'], 'https://mail.example.com/web'],
	[['SERVER_NAME' => 'mail.example.com', 'SCRIPT_NAME' => '/index.php'], 'https://mail.example.com'],
	[['SERVER_NAME' => 'mail.example.com', 'SCRIPT_NAME' => 'web/index.php'], 'https://mail.example.com/web'],
	// the catch-all server block hands over "_", so the Host header is used
	[['SERVER_NAME' => '_', 'HTTP_HOST' => 'mail.example.com', 'SCRIPT_NAME' => '/web/index.php'], 'https://mail.example.com/web'],
	[['SERVER_NAME' => '_', 'HTTP_HOST' => 'Mail.Example.com:8443', 'SCRIPT_NAME' => '/web/index.php'], 'https://mail.example.com:8443/web'],
	// SERVER_NAME has no port; the browser's port is taken from a Host header naming the same host
	[['SERVER_NAME' => 'mail.example.com', 'HTTP_HOST' => 'Mail.Example.com:8443', 'SCRIPT_NAME' => '/web/index.php'], 'https://mail.example.com:8443/web'],
	[['SERVER_NAME' => 'mail.example.com', 'HTTP_HOST' => 'other.example.com:8443', 'SCRIPT_NAME' => '/web/index.php'], 'https://mail.example.com/web'],
];
foreach ($cases as [$server, $expected]) {
	$actual = callbackFor($server, $config);
	if ($actual !== $expected) {
		throw new RuntimeException("Callback for " . json_encode($server) . " is {$actual}, expected {$expected}");
	}
}

// a configured callback is taken as is, Keycloak compares the string exactly
foreach (['https://mail.example.com/web', 'https://mail.example.com/web/', 'https://mail.example.com/web/index.php', 'https://mail.example.com'] as $pinned) {
	$actual = callbackFor(['SERVER_NAME' => 'other.example.com', 'SCRIPT_NAME' => '/index.php'], $config + ['redirect-url' => $pinned]);
	if ($actual !== $pinned) {
		throw new RuntimeException("Pinned callback {$pinned} became {$actual}");
	}
}

// the authorization request carries the same callback
$_SERVER = ['SERVER_NAME' => 'mail.example.com', 'SCRIPT_NAME' => '/web/index.php', 'HTTP_HOST' => 'mail.example.com', 'REQUEST_URI' => '/web/'];
$keycloak = new WebAppKeyCloak($config);
$loginUrl = $keycloak->login_url($keycloak->redirect_url);
if (!str_contains($loginUrl, 'redirect_uri=https%3A%2F%2Fmail.example.com%2Fweb&')) {
	throw new RuntimeException("Authorization URL does not carry the callback: {$loginUrl}");
}

// unusable authorities are rejected rather than guessed
foreach ([['SERVER_NAME' => '_', 'HTTP_HOST' => '', 'SCRIPT_NAME' => '/web/index.php'], ['SERVER_NAME' => 'mail.example.com/evil', 'HTTP_HOST' => 'bad host', 'SCRIPT_NAME' => '/web/index.php']] as $server) {
	try {
		callbackFor($server, $config);

		throw new RuntimeException('An unusable authority produced a callback: ' . json_encode($server));
	}
	catch (UnexpectedValueException) {
	}
}

echo "Keycloak callback checks passed\n";
