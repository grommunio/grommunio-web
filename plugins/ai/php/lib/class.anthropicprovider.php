<?php

/**
 * AnthropicProvider — speaks the native Anthropic Messages API (Claude).
 *
 * Differs from the OpenAI dialect in three ways handled here: authentication
 * uses the x-api-key header plus an anthropic-version, the system prompt is a
 * top-level field rather than a message, and max_tokens is mandatory. Streaming
 * is SSE with typed events; only content_block_delta carries text.
 */
class AnthropicProvider extends AIProvider {
	private const API_VERSION = '2023-06-01';

	protected function endpoint(): string {
		// Accept a base with or without a trailing /v1.
		$base = rtrim($this->config->apiBase, '/');
		if (str_ends_with($base, '/v1')) {
			$base = substr($base, 0, -3);
		}

		return $base . '/v1/messages';
	}

	protected function headers(): array {
		$headers = [
			'Content-Type: application/json',
			'anthropic-version: ' . self::API_VERSION,
		];
		// Mirror the OpenAI provider: never send an empty credential header.
		if ($this->config->apiKey !== '') {
			$headers[] = 'x-api-key: ' . $this->config->apiKey;
		}

		return $headers;
	}

	protected function buildBody(array $messages, array $opts, bool $stream): array {
		// Hoist any system messages into the top-level "system" field; the
		// Messages API only accepts user/assistant turns in "messages".
		$system = '';
		$turns = [];
		foreach ($messages as $message) {
			$role = $message['role'] ?? 'user';
			$content = (string) ($message['content'] ?? '');
			if ($role === 'system') {
				$system .= ($system === '' ? '' : "\n\n") . $content;

				continue;
			}
			$turns[] = ['role' => $role, 'content' => $content];
		}

		$body = [
			'model' => $opts['model'] ?? $this->config->model,
			'max_tokens' => $opts['max_tokens'] ?? $this->config->maxOutputTokens,
			'temperature' => $opts['temperature'] ?? $this->config->temperature,
			'messages' => $turns,
			'stream' => $stream,
		];
		if ($system !== '') {
			$body['system'] = $system;
		}

		return $body;
	}

	protected function extractContent(array $json): string {
		$text = '';
		foreach (($json['content'] ?? []) as $block) {
			if (($block['type'] ?? '') === 'text') {
				$text .= (string) ($block['text'] ?? '');
			}
		}

		return $text;
	}

	protected function parseStreamEvent(string $data): ?string {
		$json = json_decode($data, true);
		if (!is_array($json)) {
			return null;
		}
		if (($json['type'] ?? '') === 'content_block_delta') {
			return $json['delta']['text'] ?? null;
		}

		return null;
	}

	protected function parseStreamError(string $data): ?string {
		$json = json_decode($data, true);
		if (is_array($json) && ($json['type'] ?? '') === 'error') {
			return $this->httpError(200, $json);
		}

		return null;
	}
}
