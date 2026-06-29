<?php

/*
 * Server-Sent-Events endpoint for the AI Assistant plugin.
 *
 * Streams the model's output token-by-token so summaries and translations
 * appear as they are generated. It bootstraps the grommunio-web environment,
 * authenticates the existing session, reads the requested message via MAPI, and
 * relays provider deltas as SSE events. It is strictly read-only (no MAPI
 * writes) and the API key — held server-side in config.php — never leaves here.
 *
 * Reached at: <webroot>/plugins/ai/php/stream.php (POST, JSON body).
 * Events: `delta` {text}, `done` {text, model}, `error` {message}.
 *
 * The client tries this endpoint first and falls back to the pluginaimodule
 * (buffered) path on any transport failure.
 */

$root = dirname(__DIR__, 3);
require_once $root . '/server/includes/bootstrap.php';

// The plugin's own config.php (PLUGIN_AI_* constants) is normally loaded by the
// PluginManager; this standalone entry point loads it and the libs directly.
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/lib/class.aiconfig.php';
require_once __DIR__ . '/lib/class.aiprovider.php';
require_once __DIR__ . '/lib/class.openaiprovider.php';
require_once __DIR__ . '/lib/class.anthropicprovider.php';
require_once __DIR__ . '/lib/class.aimailreader.php';
require_once __DIR__ . '/lib/class.aiprompts.php';
require_once __DIR__ . '/lib/class.airequest.php';

// Authenticate using the existing session. A transport-level failure here makes
// the client fall back to the buffered module path.
WebAppAuthentication::authenticate();
if (!WebAppAuthentication::isAuthenticated()) {
	http_response_code(401);
	header('Content-Type: text/plain; charset=utf-8');
	echo 'Unauthorized';

	exit;
}
$mapisession = WebAppAuthentication::getMAPISession();
$GLOBALS['mapisession'] = $mapisession;

// Read the JSON request body (fall back to form fields).
$input = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($input)) {
	$input = $_POST;
}
// NOTE: this script runs in the global scope, so local names must not collide
// with grommunio's globals. In particular `$entryid` would clobber the global
// EntryId helper ($GLOBALS['entryid']) that MAPISession::openMessageStore() uses.
$feature = (string) ($input['feature'] ?? '');
$storeEntryidHex = (string) ($input['store_entryid'] ?? '');
$entryidHex = (string) ($input['entryid'] ?? '');

// Release the session lock so other requests are not blocked while we stream.
session_write_close();

// Drop the output buffer started by bootstrap.php and switch to streaming.
while (ob_get_level() > 0) {
	ob_end_clean();
}
@ini_set('zlib.output_compression', '0');
ob_implicit_flush(true);

header('Content-Type: text/event-stream; charset=utf-8');
header('Cache-Control: no-cache, no-transform');
header('Connection: keep-alive');
header('X-Accel-Buffering: no');

/**
 * Emit one SSE event and push it to the client.
 */
$emit = static function (string $event, array $data): void {
	echo 'event: ' . $event . "\n";
	echo 'data: ' . json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n\n";
	flush();
};

try {
	$config = AIConfig::get();
	if (!$config->isConfigured()) {
		$emit('error', ['message' => $config->missingReason()]);

		exit;
	}
	if (!$config->featureEnabled($feature)) {
		$emit('error', ['message' => _('This AI feature has been disabled by your administrator.')]);

		exit;
	}

	$store = false;
	$entryidBin = '';
	if (AIRequest::needsMessage($feature)) {
		$store = ($storeEntryidHex !== '' && ctype_xdigit($storeEntryidHex))
			? $mapisession->openMessageStore(hex2bin($storeEntryidHex))
			: false;
		if ($store === false || $entryidHex === '' || !ctype_xdigit($entryidHex)) {
			$emit('error', ['message' => _('No message was selected for the AI request.')]);

			exit;
		}
		$entryidBin = hex2bin($entryidHex);
	}

	@set_time_limit($config->timeout + 30);

	$built = AIRequest::build($feature, $config, $store, $entryidBin, $input);
	$provider = AIProvider::create($config);

	$full = $provider->chat(
		$built['messages'],
		['model' => $built['model']],
		static function (string $piece) use ($emit): void {
			$emit('delta', ['text' => $piece]);
		}
	);

	$emit('done', ['text' => $full, 'model' => $config->model]);
}
catch (AIException $e) {
	$emit('error', ['message' => $e->getMessage()]);
}
catch (Throwable $e) {
	// Log the real cause server-side for the administrator; never leak internals
	// (which could include the endpoint) to the browser.
	error_log('grommunio AI plugin (stream.php): ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
	$emit('error', ['message' => _('The AI request failed.')]);
}

exit;
