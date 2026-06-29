<?php

require_once __DIR__ . '/lib/class.aiconfig.php';
require_once __DIR__ . '/lib/class.aiprovider.php';
require_once __DIR__ . '/lib/class.openaiprovider.php';
require_once __DIR__ . '/lib/class.anthropicprovider.php';
require_once __DIR__ . '/lib/class.aimailreader.php';
require_once __DIR__ . '/lib/class.aiprompts.php';
require_once __DIR__ . '/lib/class.airequest.php';

/**
 * PluginAIModule — server-side actions for the AI Assistant plugin.
 *
 * All LLM calls happen here (or in the streaming endpoint stream.php); the
 * client never sees the API key. The non-streaming actions implemented here
 * are also the fallback path when Server-Sent-Events streaming is unavailable.
 *
 * Note: the dispatcher instantiates `new pluginaimodule(...)`, and PHP class
 * names are case-insensitive, so this class name resolves the manifest's
 * module="pluginaimodule".
 */
class PluginAIModule extends Module {
	/**
	 * Dispatch incoming actions from the client.
	 */
	#[Override]
	public function execute() {
		foreach ($this->data as $actionType => $actionData) {
			if (!is_string($actionType) || $actionType === '') {
				continue;
			}

			try {
				match ($actionType) {
					'test_connection' => $this->testConnection(),
					'summarize' => $this->summarize($actionData),
					'translate' => $this->translate($actionData),
					'compose' => $this->compose($actionData),
					'draft_reply' => $this->runTextFeature('draft_reply', $actionData),
					'suggest_actions' => $this->suggestActions($actionData),
					default => $this->handleUnknownActionType($actionType),
				};
			}
			catch (AIException $e) {
				$this->sendFeedback(false, [
					'type' => ERROR_GENERAL,
					'info' => ['display_message' => $e->getMessage()],
				]);
			}
			catch (Exception $e) {
				// Log the real cause server-side; never leak internals (which could
				// include the endpoint/key) to the browser.
				error_log('grommunio AI plugin: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
				$this->sendFeedback(false, [
					'type' => ERROR_GENERAL,
					'info' => ['display_message' => _('The AI request failed unexpectedly.')],
				]);
			}
		}
	}

	/**
	 * Verify the configured provider is reachable and responding. Returns the
	 * provider name, model and round-trip latency — never the API key.
	 */
	private function testConnection() {
		$config = AIConfig::get();
		if (!$config->isConfigured()) {
			$this->sendFeedback(false, [
				'type' => ERROR_GENERAL,
				'info' => ['display_message' => $config->missingReason()],
			]);

			return;
		}

		$provider = AIProvider::create($config);
		$start = microtime(true);
		$reply = $provider->chat(
			[['role' => 'user', 'content' => 'Reply with the single word: OK']],
			['max_tokens' => 16, 'temperature' => 0.0]
		);
		$latencyMs = (int) round((microtime(true) - $start) * 1000);

		$this->sendFeedback(true, [
			'provider' => $config->provider,
			'model' => $config->model,
			'latency_ms' => $latencyMs,
			'reply' => mb_substr(trim($reply), 0, 80),
		]);
	}

	/**
	 * Summarize a single message or its whole thread.
	 *
	 * @param array $action store_entryid, entryid, scope (single|thread),
	 *                      length (brief|standard|detailed), language
	 */
	private function summarize(array $action): void {
		$this->runTextFeature('summarize', $action);
	}

	/**
	 * Translate a message into a target language.
	 *
	 * @param array $action store_entryid, entryid, target (language name)
	 */
	private function translate(array $action): void {
		$this->runTextFeature('translate', $action);
	}

	/**
	 * Transform the composer's draft text (improve, shorten, tone, translate,
	 * ...). The text is supplied by the client, so no message is read.
	 *
	 * @param array $action text, operation, tone, target
	 */
	private function compose(array $action): void {
		$resolved = $this->requireProvider('compose');
		if ($resolved === null) {
			return;
		}
		[$config, $provider] = $resolved;

		$built = AIRequest::build('compose', $config, false, '', $action);
		$text = $provider->chat($built['messages'], ['model' => $built['model']]);

		$this->sendFeedback(true, ['text' => $text, 'model' => $config->model]);
	}

	/**
	 * Analyze a message and return structured, confirm-first action proposals
	 * (meeting/task/contact/reply). The model is asked for strict JSON, which is
	 * parsed and sanitized defensively here.
	 *
	 * @param array $action store_entryid, entryid, language
	 */
	private function suggestActions(array $action): void {
		$resolved = $this->requireProvider('actions');
		if ($resolved === null) {
			return;
		}
		[$config, $provider] = $resolved;

		$message = $this->resolveMessage($action);
		if ($message === null) {
			return;
		}
		[$store, $entryidBin] = $message;

		$built = AIRequest::build('suggest_actions', $config, $store, $entryidBin, $action);
		if (empty($built['allowed'])) {
			$this->sendFeedback(true, ['actions' => []]);

			return;
		}

		$raw = $provider->chat($built['messages'], ['model' => $built['model'], 'temperature' => 0.1]);

		$this->sendFeedback(true, [
			'actions' => $this->parseActions($raw, $built['allowed']),
			'model' => $config->model,
		]);
	}

	/**
	 * Parse the model's JSON action list, keeping only allowed, well-formed
	 * actions (and at most six).
	 */
	private function parseActions(string $raw, array $allowed): array {
		$json = json_decode($raw, true);
		if (!is_array($json) && preg_match('/\{.*\}/s', $raw, $matches)) {
			$json = json_decode($matches[0], true);
		}

		$list = (is_array($json) && isset($json['actions']) && is_array($json['actions'])) ? $json['actions'] : [];
		$out = [];
		foreach ($list as $item) {
			if (!is_array($item)) {
				continue;
			}
			$type = (string) ($item['type'] ?? '');
			if (!in_array($type, $allowed, true)) {
				continue;
			}
			$clean = $this->sanitizeAction($type, $item);
			if ($clean !== null) {
				$out[] = $clean;
			}
			if (count($out) >= 6) {
				break;
			}
		}

		return $out;
	}

	/**
	 * Normalize and bound one action of a given type; return null if it lacks
	 * the fields needed to be useful.
	 */
	private function sanitizeAction(string $type, array $action): ?array {
		$str = static fn($value, int $max = 500): string => mb_substr(trim((string) ($value ?? '')), 0, $max);

		switch ($type) {
			case 'meeting':
				$title = $str($action['title'] ?? '', 256);
				if ($title === '') {
					return null;
				}
				$attendees = [];
				if (isset($action['attendees']) && is_array($action['attendees'])) {
					foreach ($action['attendees'] as $attendee) {
						$name = $str($attendee, 256);
						if ($name !== '') {
							$attendees[] = $name;
						}
						if (count($attendees) >= 25) {
							break;
						}
					}
				}

				return [
					'type' => 'meeting',
					'title' => $title,
					'attendees' => $attendees,
					'date' => $this->normalizeDate($action['date'] ?? ''),
					'time' => $this->normalizeTime($action['time'] ?? ''),
					// 0 (or missing) means "use the client default"; cap at 24h.
					'duration_minutes' => min(1440, max(0, (int) ($action['duration_minutes'] ?? 30))),
					'location' => $str($action['location'] ?? '', 256),
					'notes' => $str($action['notes'] ?? '', 2000),
				];

			case 'task':
				$title = $str($action['title'] ?? '', 256);
				if ($title === '') {
					return null;
				}

				return [
					'type' => 'task',
					'title' => $title,
					'due' => $this->normalizeDate($action['due'] ?? ''),
					'notes' => $str($action['notes'] ?? '', 2000),
				];

			case 'contact':
				$name = $str($action['name'] ?? '', 256);
				$email = $str($action['email'] ?? '', 256);
				if ($name === '' && $email === '') {
					return null;
				}

				return ['type' => 'contact', 'name' => $name, 'email' => $email];

			case 'reply':
				$intent = $str($action['intent'] ?? '', 1000);

				return ['type' => 'reply', 'intent' => $intent];
		}

		return null;
	}

	/**
	 * Normalize a model-supplied date to a strict YYYY-MM-DD, or '' when it is
	 * not a plausible calendar date. This keeps malformed values from reaching
	 * the client's Date parser.
	 */
	private function normalizeDate(mixed $value): string {
		$value = trim((string) $value);
		if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $value, $m)) {
			return '';
		}

		return checkdate((int) $m[2], (int) $m[3], (int) $m[1]) ? $value : '';
	}

	/**
	 * Normalize a model-supplied time to a strict, zero-padded HH:MM, or '' when
	 * it is not a valid 24-hour time. A bad time must never discard a good date,
	 * so the client treats '' as "use the default time".
	 */
	private function normalizeTime(mixed $value): string {
		$value = trim((string) $value);
		if (!preg_match('/^(\d{1,2}):(\d{2})$/', $value, $m)) {
			return '';
		}
		$hours = (int) $m[1];
		$minutes = (int) $m[2];
		if ($hours > 23 || $minutes > 59) {
			return '';
		}

		return sprintf('%02d:%02d', $hours, $minutes);
	}

	/**
	 * Shared path for message-based text features: resolve provider + message,
	 * build the prompt (shared with the streaming endpoint) and return the
	 * buffered result.
	 */
	private function runTextFeature(string $feature, array $action): void {
		$resolved = $this->requireProvider($feature);
		if ($resolved === null) {
			return;
		}
		[$config, $provider] = $resolved;

		$message = $this->resolveMessage($action);
		if ($message === null) {
			return;
		}
		[$store, $entryidBin] = $message;

		$built = AIRequest::build($feature, $config, $store, $entryidBin, $action);
		$text = $provider->chat($built['messages'], ['model' => $built['model']]);

		$this->sendFeedback(true, ['text' => $text, 'model' => $config->model]);
	}

	/**
	 * Resolve the configuration and provider, sending an error and returning
	 * null when AI is unconfigured or the feature is disabled by the admin.
	 *
	 * @return null|array{0: AIConfig, 1: AIProvider}
	 */
	private function requireProvider(string $feature): ?array {
		$config = AIConfig::get();
		if (!$config->isConfigured()) {
			$this->sendFeedback(false, [
				'type' => ERROR_GENERAL,
				'info' => ['display_message' => $config->missingReason()],
			]);

			return null;
		}
		if (!$config->featureEnabled($feature)) {
			$this->sendFeedback(false, [
				'type' => ERROR_GENERAL,
				'info' => ['display_message' => _('This AI feature has been disabled by your administrator.')],
			]);

			return null;
		}

		return [$config, AIProvider::create($config)];
	}

	/**
	 * Resolve the MAPI store and binary entryid from action data, sending an
	 * error and returning null when they are missing or malformed.
	 *
	 * @return null|array{0: mixed, 1: string}
	 */
	private function resolveMessage(array $action): ?array {
		$store = $this->getActionStore($action);
		$entryid = $action['entryid'] ?? '';
		if ($store === false || is_array($store) || !is_string($entryid) || !ctype_xdigit($entryid)) {
			$this->sendFeedback(false, [
				'type' => ERROR_GENERAL,
				'info' => ['display_message' => _('No message was selected for the AI request.')],
			]);

			return null;
		}

		return [$store, hex2bin($entryid)];
	}
}
