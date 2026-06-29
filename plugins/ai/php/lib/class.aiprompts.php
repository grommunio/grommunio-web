<?php

/**
 * AIPrompts — builds the chat message arrays for each feature.
 *
 * Each builder returns a list of ['role' => ..., 'content' => ...] messages
 * ready for AIProvider::chat(). Keeping the prompts here makes the wording easy
 * to tune and keeps the module and the streaming endpoint in sync.
 */
class AIPrompts {
	/**
	 * Summarize a single message or a thread.
	 *
	 * @param array $opts length: brief|standard|detailed, language: target language name
	 */
	public static function summarize(string $mailText, array $opts = []): array {
		$length = $opts['length'] ?? 'standard';
		$language = trim((string) ($opts['language'] ?? ''));

		$lengthInstruction = match ($length) {
			'brief' => 'Write a very short summary of one or two sentences capturing only the essence.',
			'detailed' => 'Write a thorough summary covering all important points, decisions, dates and requests.',
			default => 'Write a concise summary of a few sentences capturing the key points.',
		};

		$system = 'You are an assistant integrated into a webmail client. '
			. 'Summarize the email or email thread the user provides. '
			. $lengthInstruction . ' '
			. 'Lead with the single most important point. If there are action items, requests, deadlines or questions directed at the reader, list them as "-" bullet points under a short "Action items" heading. '
			. 'Be faithful to the content and never invent facts. '
			. 'Respond with plain text using simple Markdown (paragraphs and "-" bullets); do not add a preamble like "Here is the summary".';
		if ($language !== '') {
			$system .= ' Write the summary in ' . $language . '.';
		}

		return [
			['role' => 'system', 'content' => $system],
			['role' => 'user', 'content' => "Summarize the following:\n\n" . $mailText],
		];
	}

	/**
	 * Translate a message into a target language.
	 *
	 * @param array $opts target: target language name (required, defaults to English)
	 */
	public static function translate(string $mailText, array $opts = []): array {
		$target = trim((string) ($opts['target'] ?? '')) ?: 'English';

		$system = 'You are a professional translator integrated into a webmail client. '
			. 'Translate the email the user provides into ' . $target . '. '
			. 'Preserve the meaning, tone, paragraph structure, names and any quoted text. '
			. 'If a "Subject:" line is present, translate its value too and keep the "Subject:" label. '
			. 'Translate only — do not summarize, explain or add anything. Output only the translation.';

		return [
			['role' => 'system', 'content' => $system],
			['role' => 'user', 'content' => $mailText],
		];
	}

	/**
	 * Transform draft text in the composer.
	 *
	 * @param array $opts operation (improve|shorten|expand|grammar|tone|translate),
	 *                    tone (for 'tone'), target (for 'translate')
	 */
	public static function compose(string $text, array $opts = []): array {
		$operation = (string) ($opts['operation'] ?? 'improve');
		$instruction = self::composeInstruction($operation, $opts);

		$system = 'You are a writing assistant integrated into an email composer. '
			. $instruction . ' '
			. 'Return only the resulting email text — no preamble, explanation, surrounding quotes or code fences. '
			. 'Preserve any greeting and sign-off unless asked to change them, and keep the original language unless asked to translate.';

		return [
			['role' => 'system', 'content' => $system],
			['role' => 'user', 'content' => $text],
		];
	}

	/**
	 * Draft a reply to a message.
	 *
	 * @param array $opts intent (what the reply should accomplish), language
	 */
	public static function draftReply(string $mailText, array $opts = []): array {
		$intent = trim((string) ($opts['intent'] ?? ''));
		$language = trim((string) ($opts['language'] ?? ''));

		$system = 'You draft an email reply on behalf of the user. Write a reply to the email the user provides. '
			. ($intent !== '' ? 'The reply should: ' . $intent . '. ' : 'Write an appropriate, helpful reply. ')
			. 'Use a professional, friendly tone. Do not invent facts, figures or commitments that the email does not support. '
			. 'Output only the reply body text — no subject line, no "Re:", no quoted original and no preamble.';
		if ($language !== '') {
			$system .= ' Write the reply in ' . $language . '.';
		}

		return [
			['role' => 'system', 'content' => $system],
			['role' => 'user', 'content' => $mailText],
		];
	}

	/**
	 * Extract suggested follow-up actions from a message as strict JSON.
	 *
	 * @param array $opts allowed (action types), today (date string), language
	 */
	public static function suggestActions(string $mailText, array $opts = []): array {
		$allowed = $opts['allowed'] ?? ['meeting', 'task', 'contact', 'reply'];
		$today = (string) ($opts['today'] ?? date('Y-m-d (l)'));
		$language = trim((string) ($opts['language'] ?? ''));

		$schema = 'Return ONLY a JSON object of this exact shape, with no surrounding text or code fences: '
			. '{"actions":[ ... ]}. Each action is one of: '
			. '{"type":"meeting","title":string,"attendees":[string],"date":"YYYY-MM-DD"|"","time":"HH:MM"|"","duration_minutes":number,"location":string,"notes":string}; '
			. '{"type":"task","title":string,"due":"YYYY-MM-DD"|"","notes":string}; '
			. '{"type":"contact","name":string,"email":string}; '
			. '{"type":"reply","intent":string}.';

		$system = 'You analyze an email and propose concrete follow-up actions the recipient may want to take. '
			. 'Only propose actions of these types: ' . implode(', ', $allowed) . '. '
			. 'Propose between 0 and 4 actions, and only when clearly supported by the email; if nothing is warranted, return an empty list. '
			. 'For meetings, list attendee names or email addresses exactly as they appear in the email. '
			. 'Resolve relative dates against today. Today is ' . $today . '. '
			. 'For a "reply" action, the intent is a short description of what the reply should accomplish'
			. ($language !== '' ? ', written in ' . $language : '') . '. '
			. $schema;

		return [
			['role' => 'system', 'content' => $system],
			['role' => 'user', 'content' => $mailText],
		];
	}

	/**
	 * The per-operation instruction for the compose system prompt.
	 */
	private static function composeInstruction(string $operation, array $opts): string {
		switch ($operation) {
			case 'shorten':
				return 'Make the email more concise and noticeably shorter while keeping all essential information.';

			case 'expand':
				return 'Expand the email with appropriate detail, politeness and clarity, without inventing facts.';

			case 'grammar':
				return 'Correct only the grammar, spelling and punctuation; do not otherwise change the wording, length or tone.';

			case 'tone':
				$tone = trim((string) ($opts['tone'] ?? '')) ?: 'professional';

				return 'Rewrite the email in a ' . $tone . ' tone, keeping the meaning intact.';

			case 'translate':
				$target = trim((string) ($opts['target'] ?? '')) ?: 'English';

				return 'Translate the email into ' . $target . ', preserving meaning, tone and structure.';

			case 'improve':
			default:
				return 'Improve the writing — clarity, flow, grammar and professionalism — keeping the meaning and roughly the same length.';
		}
	}
}
