<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * AIConfig — resolves the admin-central plugin configuration (the PLUGIN_AI_*
 * constants from config.php) into a single immutable object.
 *
 * The API key lives ONLY in this object on the server and is never serialized
 * to the client. Use getPublicInfo() for anything that may reach the browser.
 */
class AIConfig {
	public const DIALECT_OPENAI = 'openai_compatible';
	public const DIALECT_ANTHROPIC = 'anthropic';

	public const API_CHAT = 'chat';
	public const API_RESPONSES = 'responses';

	/**
	 * Cloud providers that require an API key. Local dialects (ollama and the
	 * generic openai_compatible, which may point at a keyless LAN server) do not.
	 */
	private const CLOUD_PROVIDERS = ['openai', 'anthropic', 'gemini', 'groq', 'openrouter', 'ionos'];

	private function __construct(
		public readonly bool $enabled,
		public readonly string $provider,
		public readonly string $dialect,
		public readonly string $apiBase,
		public readonly string $apiKey,
		public readonly string $model,
		public readonly string $fastModel,
		public readonly int $maxInputChars,
		public readonly int $maxOutputTokens,
		public readonly float $temperature,
		public readonly int $timeout,
		public readonly bool $streaming,
		public readonly string $apiMode,
		public readonly string $reasoningEffort,
		public readonly string $fastReasoningEffort,
		public readonly ?bool $reasoningModel
	) {}

	/**
	 * Build the configuration from the plugin's config.php constants.
	 */
	public static function get(): self {
		$provider = (string) self::readConst('PLUGIN_AI_PROVIDER', 'ollama');
		$dialect = $provider === 'anthropic' ? self::DIALECT_ANTHROPIC : self::DIALECT_OPENAI;

		$apiBase = trim((string) self::readConst('PLUGIN_AI_API_BASE', ''));
		if ($apiBase === '') {
			$apiBase = self::defaultBaseFor($provider);
		}

		$model = trim((string) self::readConst('PLUGIN_AI_MODEL', ''));
		if ($model === '') {
			$model = self::defaultModelFor($provider);
		}

		return new self(
			enabled: (bool) self::readConst('PLUGIN_AI_ENABLE', false),
			provider: $provider,
			dialect: $dialect,
			apiBase: $apiBase,
			apiKey: trim((string) self::readConst('PLUGIN_AI_API_KEY', '')),
			model: $model,
			fastModel: trim((string) self::readConst('PLUGIN_AI_MODEL_FAST', '')),
			maxInputChars: max(500, (int) self::readConst('PLUGIN_AI_MAX_INPUT_CHARS', 24000)),
			maxOutputTokens: max(64, (int) self::readConst('PLUGIN_AI_MAX_OUTPUT_TOKENS', 4096)),
			temperature: (float) self::readConst('PLUGIN_AI_TEMPERATURE', 0.3),
			timeout: max(5, (int) self::readConst('PLUGIN_AI_TIMEOUT', 120)),
			streaming: (bool) self::readConst('PLUGIN_AI_STREAMING', true),
			apiMode: strtolower(trim((string) self::readConst('PLUGIN_AI_API_MODE', 'auto'))),
			reasoningEffort: strtolower(trim((string) self::readConst('PLUGIN_AI_REASONING_EFFORT', ''))),
			fastReasoningEffort: strtolower(trim((string) self::readConst('PLUGIN_AI_REASONING_EFFORT_FAST', ''))),
			reasoningModel: self::readTristate('PLUGIN_AI_REASONING_MODEL')
		);
	}

	/**
	 * The default API base URL for a provider when the admin left it empty.
	 */
	private static function defaultBaseFor(string $provider): string {
		return match ($provider) {
			'openai' => 'https://api.openai.com/v1',
			'anthropic' => 'https://api.anthropic.com',
			'gemini' => 'https://generativelanguage.googleapis.com/v1beta/openai',
			'groq' => 'https://api.groq.com/openai/v1',
			'openrouter' => 'https://openrouter.ai/api/v1',
			'ionos' => 'https://openai.inference.de-txl.ionos.com/v1',
			'ollama' => 'http://localhost:11434/v1',
			default => '',
		};
	}

	/**
	 * A sensible default model for a provider when the admin left it empty, so a
	 * provider can be selected with just a key.
	 */
	private static function defaultModelFor(string $provider): string {
		return match ($provider) {
			'openai' => 'gpt-6-luna',
			'anthropic' => 'claude-haiku-5-5',
			'gemini' => 'gemini-3.6-flash',
			'groq' => 'openai/gpt-oss-120b',
			'openrouter' => 'openrouter/free',
			'ionos' => 'mistralai/Mistral-Small-24B-Instruct',
			'ollama' => 'llama3.1:8b',
			default => '',
		};
	}

	/**
	 * Whether the provider is usable: the administrator must have unlocked the
	 * plugin (PLUGIN_AI_ENABLE), a base URL and model are required, and cloud
	 * providers additionally require an API key.
	 */
	public function isConfigured(): bool {
		if (!$this->enabled) {
			return false;
		}
		if ($this->apiBase === '' || $this->model === '') {
			return false;
		}
		// Cloud providers require a key; local ones (ollama/custom) may not.
		if (in_array($this->provider, self::CLOUD_PROVIDERS, true) && $this->apiKey === '') {
			return false;
		}

		return true;
	}

	/**
	 * A specific, user-safe explanation of why the plugin is not usable, or ''
	 * when it is configured. Names the actual gap (master switch / endpoint /
	 * missing API key) so an administrator knows exactly what to fix. Never
	 * contains the key.
	 */
	public function missingReason(): string {
		if (!$this->enabled) {
			return _('The AI assistant is not enabled yet. Set PLUGIN_AI_ENABLE to true in the plugin config.php.');
		}
		if ($this->apiBase === '' || $this->model === '') {
			return _('No AI model or endpoint is configured in the plugin config.php.');
		}
		if (in_array($this->provider, self::CLOUD_PROVIDERS, true) && $this->apiKey === '') {
			return sprintf(
				_('No API key is set for the "%s" provider. Add your key to PLUGIN_AI_API_KEY in the plugin config.php.'),
				$this->provider
			);
		}

		return '';
	}

	/**
	 * Pick the model best suited to a feature. Short tasks may use the lighter
	 * fast model when the admin configured one.
	 */
	public function modelFor(string $feature): string {
		if ($this->fastModel !== '' && $feature === 'translate') {
			return $this->fastModel;
		}

		return $this->model;
	}

	/**
	 * Whether the model is an OpenAI reasoning model (o-series, GPT-5 and later).
	 */
	public function isReasoningModel(string $model): bool {
		if ($this->reasoningModel !== null) {
			return $this->reasoningModel;
		}

		// gpt-35-turbo is Azure's GPT-3.5
		return (bool) preg_match('/^(o[1-9]|gpt-(?![34])\d|chat-latest)/', self::bareModel($model));
	}

	/**
	 * Whether the model takes a custom temperature (not Gemini 3+, current Claude).
	 */
	public function takesTemperature(string $model): bool {
		return !preg_match('/^(gemini-([3-9]|\d{2,})|claude-(fable|mythos)|claude-opus-(4-[7-9]|[5-9])|claude-(sonnet|haiku)-[5-9])/', self::bareModel($model));
	}

	/**
	 * IONOS AI Model Hub, also when reached as openai_compatible.
	 */
	public function isIonos(): bool {
		$host = strtolower((string) parse_url($this->apiBase, PHP_URL_HOST));

		return $this->provider === 'ionos' || str_ends_with($host, '.ionos.com');
	}

	/**
	 * The reasoning effort configured for the main or the fast model.
	 */
	public function effortFor(string $model): string {
		return $this->fastModel !== '' && $model === $this->fastModel && $model !== $this->model
			? $this->fastReasoningEffort
			: $this->reasoningEffort;
	}

	/**
	 * Chat Completions or Responses API; auto picks the latter for OpenAI's pro and codex models.
	 */
	public function apiFor(string $model): string {
		if ($this->apiMode === self::API_CHAT || $this->apiMode === self::API_RESPONSES) {
			return $this->apiMode;
		}
		$host = strtolower((string) parse_url($this->apiBase, PHP_URL_HOST));
		$openai = $host === 'api.openai.com' || preg_match('/\.(openai\.azure|cognitiveservices\.azure|services\.ai\.azure)\.com$/', $host);
		if ($openai && preg_match('/(^|-)(pro|codex)(-|$)/', self::bareModel($model))) {
			return self::API_RESPONSES;
		}

		return self::API_CHAT;
	}

	/**
	 * The model id without a gateway prefix such as "openai/".
	 */
	private static function bareModel(string $model): string {
		return strtolower((string) preg_replace('#^.*/#', '', trim($model)));
	}

	/**
	 * Whether a top-level feature is enabled by the administrator.
	 */
	public function featureEnabled(string $feature): bool {
		return match ($feature) {
			'summarize' => (bool) self::readConst('PLUGIN_AI_ENABLE_SUMMARIZE', true),
			'translate' => (bool) self::readConst('PLUGIN_AI_ENABLE_TRANSLATE', true),
			'compose' => (bool) self::readConst('PLUGIN_AI_ENABLE_COMPOSE', true),
			'actions', 'suggest_actions' => (bool) self::readConst('PLUGIN_AI_ENABLE_ACTIONS', true),
			'draft_reply' => (bool) self::readConst('PLUGIN_AI_ENABLE_ACTIONS', true) && $this->actionEnabled('reply'),
			default => false,
		};
	}

	/**
	 * Whether a specific smart action is enabled by the administrator.
	 */
	public function actionEnabled(string $action): bool {
		return match ($action) {
			'meeting' => (bool) self::readConst('PLUGIN_AI_ACTION_MEETING', true),
			'task' => (bool) self::readConst('PLUGIN_AI_ACTION_TASK', true),
			'contact' => (bool) self::readConst('PLUGIN_AI_ACTION_CONTACT', true),
			'reply' => (bool) self::readConst('PLUGIN_AI_ACTION_REPLY', true),
			default => false,
		};
	}

	/**
	 * Information that is safe to expose to the browser. NEVER contains the key.
	 */
	public function getPublicInfo(): array {
		return [
			'configured' => $this->isConfigured(),
			'reason' => $this->missingReason(),
			'provider' => $this->provider,
			'model' => $this->model,
			'streaming' => $this->streaming,
			'features' => [
				'summarize' => $this->featureEnabled('summarize'),
				'translate' => $this->featureEnabled('translate'),
				'compose' => $this->featureEnabled('compose'),
				'actions' => $this->featureEnabled('actions'),
			],
			'actions' => [
				'meeting' => $this->actionEnabled('meeting'),
				'task' => $this->actionEnabled('task'),
				'contact' => $this->actionEnabled('contact'),
				'reply' => $this->actionEnabled('reply'),
			],
		];
	}

	/**
	 * Read a constant that is true, false or 'auto' (null).
	 */
	private static function readTristate(string $name): ?bool {
		$value = self::readConst($name, 'auto');
		if (is_bool($value)) {
			return $value;
		}

		return match (strtolower(trim((string) $value))) {
			'1', 'true', 'yes', 'on' => true,
			'0', 'false', 'no', 'off' => false,
			default => null,
		};
	}

	/**
	 * Read a constant with a fallback default.
	 */
	private static function readConst(string $name, mixed $default): mixed {
		return defined($name) ? constant($name) : $default;
	}
}
