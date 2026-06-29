<?php

/**
 * Exception carrying a user-safe message about an AI request failure.
 * The message must NEVER contain the API key or raw credentials.
 */
class AIException extends Exception {}

/**
 * AIProvider — abstract base for an LLM backend.
 *
 * A provider turns a list of chat messages into generated text via the
 * configured HTTP endpoint. Subclasses implement the provider-specific request
 * shape and response parsing; this base owns the cURL transport, the
 * Server-Sent-Events line buffering used for streaming, and error mapping.
 *
 * Usage:
 *   $provider = AIProvider::create(AIConfig::get());
 *   $text = $provider->chat($messages, $opts);             // buffered
 *   $text = $provider->chat($messages, $opts, $onDelta);   // streamed
 *
 * When $onDelta is supplied it is invoked with each text fragment as it
 * arrives; the full concatenated text is also returned.
 */
abstract class AIProvider {
	public function __construct(protected readonly AIConfig $config) {}

	/**
	 * Construct the provider matching the configured dialect.
	 */
	public static function create(AIConfig $config): self {
		return match ($config->dialect) {
			AIConfig::DIALECT_ANTHROPIC => new AnthropicProvider($config),
			default => new OpenAIProvider($config),
		};
	}

	/** Full URL of the chat/completions endpoint. */
	abstract protected function endpoint(): string;

	/** HTTP headers, including authentication. */
	abstract protected function headers(): array;

	/** Provider-specific request body. */
	abstract protected function buildBody(array $messages, array $opts, bool $stream): array;

	/** Extract the generated text from a complete (non-streamed) response. */
	abstract protected function extractContent(array $json): string;

	/**
	 * Parse one SSE "data:" payload and return the incremental text it carries,
	 * or null if the event carries no text (metadata, ping, etc.).
	 */
	abstract protected function parseStreamEvent(string $data): ?string;

	/**
	 * Inspect one SSE "data:" payload for a provider error delivered mid-stream
	 * over an HTTP-200 connection (e.g. Anthropic overloaded_error). Returns a
	 * user-safe message when the payload is an error, otherwise null.
	 */
	protected function parseStreamError(string $data): ?string {
		return null;
	}

	/**
	 * Send a chat request and return the generated text.
	 *
	 * @param array         $messages list of ['role' => ..., 'content' => ...]
	 * @param array         $opts     overrides: model, temperature, max_tokens
	 * @param null|callable $onDelta  fn(string $fragment): void — enables streaming
	 *
	 * @throws AIException on transport or HTTP error
	 */
	public function chat(array $messages, array $opts = [], ?callable $onDelta = null): string {
		$stream = $onDelta !== null;
		$body = $this->buildBody($messages, $opts, $stream);

		$ch = curl_init();
		curl_setopt_array($ch, [
			CURLOPT_URL => $this->endpoint(),
			CURLOPT_POST => true,
			CURLOPT_POSTFIELDS => json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
			CURLOPT_HTTPHEADER => $this->headers(),
			CURLOPT_TIMEOUT => $this->config->timeout,
			CURLOPT_CONNECTTIMEOUT => 15,
			CURLOPT_RETURNTRANSFER => true,
		]);

		if ($stream) {
			return $this->execStreaming($ch, $onDelta);
		}

		return $this->execBuffered($ch);
	}

	/**
	 * Execute a buffered (non-streaming) request.
	 */
	private function execBuffered($ch): string {
		$resp = curl_exec($ch);
		$errno = curl_errno($ch);
		$err = curl_error($ch);
		$code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
		curl_close($ch);

		if ($errno !== 0 || $resp === false) {
			throw new AIException($this->transportError($err));
		}

		$json = json_decode((string) $resp, true);
		if ($code >= 400 || !is_array($json)) {
			throw new AIException($this->httpError($code, is_array($json) ? $json : null));
		}

		return $this->extractContent($json);
	}

	/**
	 * Execute a streaming request, dispatching each text fragment to $onDelta.
	 */
	private function execStreaming($ch, callable $onDelta): string {
		$buffer = '';
		$collected = '';
		// Capture a bounded copy of the body so a non-200 error can be reported.
		$raw = '';
		// A provider error delivered as an SSE event over an HTTP-200 stream.
		$streamError = null;

		curl_setopt($ch, CURLOPT_WRITEFUNCTION, function ($ch, string $chunk) use (&$buffer, &$collected, &$raw, &$streamError, $onDelta): int {
			if (strlen($raw) < 8192) {
				$raw .= $chunk;
			}
			$buffer .= $chunk;

			// Process complete lines; SSE separates events with blank lines and
			// carries the payload on "data:" lines (both OpenAI and Anthropic).
			while (($pos = strpos($buffer, "\n")) !== false) {
				$line = rtrim(substr($buffer, 0, $pos), "\r");
				$buffer = substr($buffer, $pos + 1);

				if ($line === '' || $line[0] === ':' || !str_starts_with($line, 'data:')) {
					continue;
				}
				$payload = trim(substr($line, 5));
				if ($payload === '' || $payload === '[DONE]') {
					continue;
				}
				// A typed error event (overloaded, rate limit, ...) arrives over a
				// 200 connection; record it and stop emitting text.
				$error = $this->parseStreamError($payload);
				if ($error !== null) {
					$streamError = $error;

					continue;
				}
				$delta = $this->parseStreamEvent($payload);
				if ($delta !== null && $delta !== '') {
					$collected .= $delta;
					$onDelta($delta);
				}
			}

			return strlen($chunk);
		});

		$ok = curl_exec($ch);
		$errno = curl_errno($ch);
		$err = curl_error($ch);
		$code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
		curl_close($ch);

		if ($code >= 400) {
			$json = json_decode($raw, true);
			throw new AIException($this->httpError($code, is_array($json) ? $json : null));
		}
		// Surface a mid-stream provider error rather than presenting a blank or
		// silently truncated response as success.
		if ($streamError !== null) {
			throw new AIException($streamError);
		}
		if ($ok === false || $errno !== 0) {
			// A premature disconnect after some content still yields partial text.
			if ($collected === '') {
				throw new AIException($this->transportError($err));
			}
		}

		return $collected;
	}

	/**
	 * Map a cURL transport error to a user-safe message.
	 */
	protected function transportError(string $err): string {
		$detail = $err !== '' ? $err : _('connection error');

		return sprintf(_('Could not reach the AI service (%s). Check the endpoint configuration.'), $detail);
	}

	/**
	 * Map an HTTP status (and optional decoded error body) to a user-safe
	 * message. Never includes credentials.
	 */
	protected function httpError(int $code, ?array $json): string {
		$providerMsg = '';
		if ($json !== null) {
			// OpenAI: {error:{message}}; Anthropic: {error:{message}} or {message}
			$providerMsg = (string) ($json['error']['message'] ?? $json['message'] ?? '');
			$providerMsg = mb_substr(trim($providerMsg), 0, 200);
		}

		$base = match (true) {
			$code === 401, $code === 403 => _('The AI service rejected the credentials. Check the API key and endpoint.'),
			$code === 404 => _('The AI model or endpoint was not found. Check the model name and base URL.'),
			$code === 429 => _('The AI service is rate-limited or out of quota. Try again later.'),
			$code >= 500 => _('The AI service reported an internal error. Try again later.'),
			default => sprintf(_('The AI service returned an error (HTTP %d).'), $code),
		};

		return $providerMsg !== '' ? $base . ' — ' . $providerMsg : $base;
	}
}
