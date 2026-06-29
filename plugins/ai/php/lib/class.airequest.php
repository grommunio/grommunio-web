<?php

/**
 * AIRequest — turns a feature plus a message reference into the chat messages
 * and model for a provider call.
 *
 * This is the single source of truth for prompt construction, shared by the
 * non-streaming module (PluginAIModule) and the streaming endpoint
 * (stream.php), so both paths produce identical prompts.
 */
class AIRequest {
	/**
	 * Whether a feature reads a stored message (vs. operating on text the
	 * client supplies, like compose).
	 */
	public static function needsMessage(string $feature): bool {
		return in_array($feature, ['summarize', 'translate', 'draft_reply', 'suggest_actions'], true);
	}

	/**
	 * @return array{messages: array, model: string}
	 *
	 * @throws AIException when the message is empty or the feature is unknown
	 */
	public static function build(string $feature, AIConfig $config, $store, string $entryidBin, array $opts): array {
		$reader = new AIMailReader($config->maxInputChars);

		switch ($feature) {
			case 'summarize':
				$scope = ($opts['scope'] ?? 'single') === 'thread' ? 'thread' : 'single';
				$mailText = $scope === 'thread'
					? $reader->readThreadAsText($store, $entryidBin)
					: $reader->readAsText($store, $entryidBin);
				self::assertNotEmpty($mailText);

				return [
					'messages' => AIPrompts::summarize($mailText, [
						'length' => (string) ($opts['length'] ?? 'standard'),
						'language' => (string) ($opts['language'] ?? ''),
					]),
					'model' => $config->modelFor('summarize'),
				];

			case 'translate':
				$mailText = $reader->readBodyWithSubject($store, $entryidBin);
				self::assertNotEmpty($mailText);

				return [
					'messages' => AIPrompts::translate($mailText, [
						'target' => (string) ($opts['target'] ?? 'English'),
					]),
					'model' => $config->modelFor('translate'),
				];

			case 'compose':
				$text = trim((string) ($opts['text'] ?? ''));
				if ($text === '') {
					throw new AIException(_('There is no text to work with.'));
				}
				if (mb_strlen($text) > $config->maxInputChars) {
					$text = mb_substr($text, 0, $config->maxInputChars);
				}

				return [
					'messages' => AIPrompts::compose($text, $opts),
					'model' => $config->modelFor('compose'),
				];

			case 'draft_reply':
				$mailText = $reader->readAsText($store, $entryidBin);
				self::assertNotEmpty($mailText);

				return [
					'messages' => AIPrompts::draftReply($mailText, [
						'intent' => (string) ($opts['intent'] ?? ''),
						'language' => (string) ($opts['language'] ?? ''),
					]),
					'model' => $config->modelFor('compose'),
				];

			case 'suggest_actions':
				$mailText = $reader->readAsText($store, $entryidBin);
				self::assertNotEmpty($mailText);
				$allowed = array_values(array_filter(
					['meeting', 'task', 'contact', 'reply'],
					static fn(string $type): bool => $config->actionEnabled($type)
				));

				return [
					'messages' => AIPrompts::suggestActions($mailText, [
						'allowed' => $allowed,
						'today' => date('Y-m-d (l)'),
						'language' => (string) ($opts['language'] ?? ''),
					]),
					'model' => $config->modelFor('actions'),
					'allowed' => $allowed,
				];

			default:
				throw new AIException(_('Unknown AI feature.'));
		}
	}

	/**
	 * @throws AIException when the rendered mail text is blank
	 */
	private static function assertNotEmpty(string $mailText): void {
		if (trim($mailText) === '') {
			throw new AIException(_('The message appears to be empty.'));
		}
	}
}
