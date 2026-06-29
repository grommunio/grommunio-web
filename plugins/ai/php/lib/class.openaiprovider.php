<?php

/**
 * OpenAIProvider — speaks the OpenAI-compatible /chat/completions dialect.
 *
 * This single implementation covers OpenAI itself plus the many servers that
 * expose the same API: Ollama, LM Studio, vLLM, llama.cpp, LocalAI, Groq,
 * Mistral, Together, OpenRouter, Azure OpenAI, ... Authentication is a Bearer
 * token, omitted entirely when no key is configured (the local default).
 */
class OpenAIProvider extends AIProvider {
	protected function endpoint(): string {
		return rtrim($this->config->apiBase, '/') . '/chat/completions';
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

		$body = [
			'model' => $model,
			'messages' => $messages,
			'stream' => $stream,
		];

		// OpenAI's reasoning families (o1/o3/o4/..., gpt-5) reject the legacy
		// 'max_tokens' (they require 'max_completion_tokens') and only accept the
		// default temperature. Every other OpenAI-compatible server (Ollama, LM
		// Studio, vLLM, Groq, Gemini, ...) uses the classic shape.
		if ($this->isReasoningModel($model)) {
			$body['max_completion_tokens'] = $maxTokens;
		}
		else {
			$body['max_tokens'] = $maxTokens;
			$body['temperature'] = $opts['temperature'] ?? $this->config->temperature;
		}

		return $body;
	}

	/**
	 * Whether the model is an OpenAI reasoning model that needs the newer
	 * parameter shape. Tolerates a "provider/" prefix (OpenRouter, Azure).
	 */
	private function isReasoningModel(string $model): bool {
		$bare = strtolower((string) preg_replace('#^.*/#', '', trim($model)));

		return (bool) preg_match('/^(o[1-9]|gpt-5)/', $bare);
	}

	protected function extractContent(array $json): string {
		return (string) ($json['choices'][0]['message']['content'] ?? '');
	}

	protected function parseStreamEvent(string $data): ?string {
		$json = json_decode($data, true);
		if (!is_array($json)) {
			return null;
		}

		return $json['choices'][0]['delta']['content'] ?? null;
	}

	protected function parseStreamError(string $data): ?string {
		$json = json_decode($data, true);
		if (is_array($json) && isset($json['error'])) {
			return $this->httpError(200, $json);
		}

		return null;
	}
}
