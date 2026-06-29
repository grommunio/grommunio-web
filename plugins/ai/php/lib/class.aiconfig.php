<?php

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

	/**
	 * Cloud providers that require an API key. Local dialects (ollama and the
	 * generic openai_compatible, which may point at a keyless LAN server) do not.
	 */
	private const CLOUD_PROVIDERS = ['openai', 'anthropic', 'gemini', 'groq', 'openrouter'];

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
		public readonly bool $streaming
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
			maxOutputTokens: max(64, (int) self::readConst('PLUGIN_AI_MAX_OUTPUT_TOKENS', 1024)),
			temperature: (float) self::readConst('PLUGIN_AI_TEMPERATURE', 0.3),
			timeout: max(5, (int) self::readConst('PLUGIN_AI_TIMEOUT', 120)),
			streaming: (bool) self::readConst('PLUGIN_AI_STREAMING', true)
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
			'openai' => 'gpt-4o-mini',
			'anthropic' => 'claude-3-5-haiku-latest',
			'gemini' => 'gemini-2.0-flash',
			'groq' => 'llama-3.3-70b-versatile',
			'openrouter' => 'meta-llama/llama-3.3-70b-instruct:free',
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
	 *
	 * @return array
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
	 * Read a constant with a fallback default.
	 */
	private static function readConst(string $name, mixed $default): mixed {
		return defined($name) ? constant($name) : $default;
	}
}
