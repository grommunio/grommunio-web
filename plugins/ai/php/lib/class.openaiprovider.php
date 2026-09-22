<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * OpenAIProvider — speaks the OpenAI-compatible /chat/completions dialect.
 *
 * This single implementation covers OpenAI itself plus the many servers that
 * expose the same API: Ollama, LM Studio, vLLM, llama.cpp, LocalAI, Groq,
 * Mistral, Together, OpenRouter, Azure OpenAI, ... Authentication is a Bearer
 * token, omitted entirely when no key is configured (the local default).
 */
class OpenAIProvider extends AIProvider {
	/** Whether the request being built goes to the Responses API. */
	private bool $responses = false;

	protected function endpoint(): string {
		return rtrim($this->config->apiBase, '/') . ($this->responses ? '/responses' : '/chat/completions');
	}

	protected function headers(): array {
		$headers = ['Content-Type: application/json'];
		if ($this->config->apiKey !== '') {
			$headers[] = 'Authorization: Bearer ' . $this->config->apiKey;
		}

		return $headers;
	}

	protected function buildBody(array $messages, array $opts, bool $stream): array {
		$model = $opts['model'] ?? $this->config->model;
		$maxTokens = $opts['max_tokens'] ?? $this->config->maxOutputTokens;
		$this->responses = $this->config->apiFor($model) === AIConfig::API_RESPONSES;

		$body = $this->responses
			? $this->responsesBody($model, $messages, $maxTokens, $stream)
			: $this->chatBody($model, $messages, $maxTokens, $stream);

		$effort = $this->config->effortFor($model);
		$reasoning = $this->config->isReasoningModel($model);
		if (!$reasoning || $effort === 'none') {
			$body['temperature'] = $opts['temperature'] ?? $this->config->temperature;
		}
		// OpenAI rejects an effort for gpt-4.1/gpt-4o
		if ($effort !== '' && ($reasoning || $this->config->provider !== 'openai')) {
			if ($this->responses) {
				$body['reasoning'] = ['effort' => $effort];
			}
			else {
				$body['reasoning_effort'] = $effort;
			}
		}

		return $body;
	}

	private function chatBody(string $model, array $messages, int $maxTokens, bool $stream): array {
		$body = [
			'model' => $model,
			'messages' => $messages,
			'stream' => $stream,
		];

		// OpenAI deprecated max_tokens, its reasoning models reject it
		if ($this->config->provider === 'openai' || $this->config->isReasoningModel($model)) {
			$body['max_completion_tokens'] = $maxTokens;
		}
		else {
			$body['max_tokens'] = $maxTokens;
		}

		return $body;
	}

	/**
	 * The Responses API takes the system prompt as "instructions" and the
	 * conversation as "input".
	 */
	private function responsesBody(string $model, array $messages, int $maxTokens, bool $stream): array {
		$instructions = '';
		$input = [];
		foreach ($messages as $message) {
			$role = $message['role'] ?? 'user';
			$content = (string) ($message['content'] ?? '');
			if ($role === 'system') {
				$instructions .= ($instructions === '' ? '' : "\n\n") . $content;

				continue;
			}
			$input[] = ['role' => $role, 'content' => $content];
		}

		$body = [
			'model' => $model,
			'input' => $input,
			'max_output_tokens' => $maxTokens,
		];
		if ($instructions !== '') {
			$body['instructions'] = $instructions;
		}
		$body['store'] = false;
		if ($stream) {
			$body['stream'] = true;
		}

		return $body;
	}

	protected function extractContent(array $json): string {
		if (!$this->responses) {
			return (string) ($json['choices'][0]['message']['content'] ?? '');
		}

		// Reasoning items precede the message, so walk the whole output.
		$text = '';
		foreach (($json['output'] ?? []) as $item) {
			if (($item['type'] ?? '') !== 'message') {
				continue;
			}
			foreach (($item['content'] ?? []) as $part) {
				if (($part['type'] ?? '') === 'output_text') {
					$text .= (string) ($part['text'] ?? '');
				}
			}
		}

		return $text;
	}

	protected function parseStreamEvent(string $data): ?string {
		$json = json_decode($data, true);
		if (!is_array($json)) {
			return null;
		}
		if ($this->responses) {
			return ($json['type'] ?? '') === 'response.output_text.delta' ? ($json['delta'] ?? null) : null;
		}

		return $json['choices'][0]['delta']['content'] ?? null;
	}

	protected function parseFinishReason(array $json): ?string {
		if ($this->responses) {
			return $this->responseFinish($json);
		}

		return $json['choices'][0]['finish_reason'] ?? null;
	}

	protected function parseStreamFinish(string $data): ?string {
		$json = json_decode($data, true);
		if (!is_array($json)) {
			return null;
		}
		if ($this->responses) {
			$type = $json['type'] ?? '';

			return in_array($type, ['response.completed', 'response.incomplete'], true)
				? $this->responseFinish($json['response'] ?? [])
				: null;
		}

		return $json['choices'][0]['finish_reason'] ?? null;
	}

	/**
	 * A Responses API status as Chat Completions finish reason.
	 */
	private function responseFinish(array $response): ?string {
		$status = $response['status'] ?? null;
		if ($status === 'incomplete') {
			$reason = $response['incomplete_details']['reason'] ?? null;

			return $reason === 'max_output_tokens' ? 'length' : $reason;
		}

		return $status === 'completed' ? 'stop' : $status;
	}

	/**
	 * Point at PLUGIN_AI_API_MODE for a model OpenAI serves on /responses only.
	 */
	protected function httpError(int $code, ?array $json): string {
		$message = parent::httpError($code, $json);
		if (!$this->responses && str_contains((string) ($json['error']['message'] ?? ''), 'v1/chat/completions')) {
			$message .= ' ' . _("Set PLUGIN_AI_API_MODE to 'responses' in the plugin config.php.");
		}

		return $message;
	}

	protected function parseStreamError(string $data): ?string {
		$json = json_decode($data, true);
		if (!is_array($json)) {
			return null;
		}
		if ($this->responses) {
			$type = $json['type'] ?? '';
			if ($type === 'error') {
				return $this->httpError(200, ['message' => $json['message'] ?? '']);
			}
			if ($type === 'response.failed') {
				return $this->httpError(200, ['error' => $json['response']['error'] ?? []]);
			}

			return null;
		}
		if (isset($json['error'])) {
			return $this->httpError(200, $json);
		}

		return null;
	}
}
