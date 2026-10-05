<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

require_once __DIR__ . '/lib/class.aiactionparser.php';
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
	#[Override]
	protected function getExecutionLockName() {
		return null;
	}

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
				switch ($actionType) {
					case 'test_connection':
						$this->testConnection();
						break;

					case 'summarize':
						$this->summarize($actionData);
						break;

					case 'translate':
						$this->translate($actionData);
						break;

					case 'compose':
						$this->compose($actionData);
						break;

					case 'draft_reply':
						$this->runTextFeature('draft_reply', $actionData);
						break;

					case 'suggest_actions':
						$this->suggestActions($actionData);
						break;

					default:
						$this->handleUnknownActionType($actionType);
				}
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
		// Not 16: a reasoning model spends its first tokens on thinking and would
		// answer with an empty string, making a working provider look broken.
		$reply = $provider->chat(
			[['role' => 'user', 'content' => 'Reply with the single word: OK']],
			['max_tokens' => 256, 'temperature' => 0.0]
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
		$result = $provider->chatFull($built['messages'], ['model' => $built['model']]);

		$this->sendFeedback(true, [
			'text' => $result['text'],
			'truncated' => $result['truncated'],
			'model' => $config->model,
		]);
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

		$raw = $provider->chatFull($built['messages'], ['model' => $built['model'], 'temperature' => 0.1])['text'];

		$this->sendFeedback(true, [
			'actions' => AIActionParser::parse($raw, $built['allowed']),
			'model' => $config->model,
		]);
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
		$result = $provider->chatFull($built['messages'], ['model' => $built['model']]);

		$this->sendFeedback(true, [
			'text' => $result['text'],
			'truncated' => $result['truncated'],
			'model' => $config->model,
		]);
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
