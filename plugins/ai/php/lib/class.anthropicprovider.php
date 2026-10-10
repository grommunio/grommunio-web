<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

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

		$model = $opts['model'] ?? $this->config->model;
		$body = [
			'model' => $model,
			'max_tokens' => $opts['max_tokens'] ?? $this->config->maxOutputTokens,
			'messages' => $turns,
			'stream' => $stream,
		];
		if ($this->config->takesTemperature($model)) {
			$body['temperature'] = $opts['temperature'] ?? $this->config->temperature;
		}
		if ($system !== '') {
			$body['system'] = $system;
		}
		$effort = $this->effortFor($model);
		if ($effort !== null) {
			$body['output_config'] = ['effort' => $effort];
		}

		return $body;
	}

	/**
	 * The configured effort clamped to what the model accepts, null if it takes none.
	 */
	private function effortFor(string $model): ?string {
		$effort = $this->config->effortFor($model);
		if ($effort === '' || !preg_match('/^claude-(fable|mythos|opus-(4-[5-9]|[5-9])|sonnet-(4-[6-9]|[5-9])|haiku-[5-9])/', $model, $m)) {
			return null;
		}
		$effort = match ($effort) {
			'none', 'minimal' => 'low',
			default => $effort,
		};
		if (str_starts_with($m[1], 'opus-4-5') && in_array($effort, ['xhigh', 'max'], true)) {
			return 'high';
		}
		if (preg_match('/^(opus|sonnet)-4-6/', $m[1]) && $effort === 'xhigh') {
			return 'high';
		}

		return $effort;
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

	protected function parseFinishReason(array $json): ?string {
		return self::normalizeStop($json['stop_reason'] ?? null);
	}

	/** The Messages API says 'max_tokens' where the OpenAI dialect says 'length'. */
	private static function normalizeStop(?string $reason): ?string {
		return match ($reason) {
			'max_tokens' => 'length',
			'model_context_window_exceeded' => 'context_window',
			default => $reason,
		};
	}

	protected function parseStreamFinish(string $data): ?string {
		$json = json_decode($data, true);
		if (!is_array($json)) {
			return null;
		}

		// The stop reason arrives on the message_delta event near the end.
		return self::normalizeStop($json['delta']['stop_reason'] ?? ($json['message']['stop_reason'] ?? null));
	}

	protected function parseStreamError(string $data): ?string {
		$json = json_decode($data, true);
		if (is_array($json) && ($json['type'] ?? '') === 'error') {
			return $this->httpError(200, $json);
		}

		return null;
	}
}
