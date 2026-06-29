<?php

/**
 * AIMailReader — reads message content from MAPI and renders it as plain text
 * suitable for an LLM prompt.
 *
 * Bodies are read through IStream (the proven pattern from the S/MIME plugin)
 * so large messages do not exhaust memory, and everything is truncated to a
 * character budget before it is handed to a model. Thread reading is
 * best-effort: it groups by conversation topic and degrades to the single
 * message if grouping is unavailable.
 */
class AIMailReader {
	private const STREAM_BLOCK = 8192;
	private const MAX_THREAD_MESSAGES = 25;

	public function __construct(private readonly int $maxChars) {}

	/**
	 * Open a message and return its normalized fields.
	 *
	 * @return array{subject:string, from:string, to:string, date:string, body:string}
	 *
	 * @throws AIException if the message cannot be opened
	 */
	public function read($store, string $entryidBin): array {
		$message = mapi_msgstore_openentry($store, $entryidBin);
		if ($message === false) {
			throw new AIException(_('The selected message could not be opened.'));
		}

		return $this->messageToArray($message);
	}

	/**
	 * Render a single message as a text block (header + body), within budget.
	 */
	public function readAsText($store, string $entryidBin): string {
		return $this->formatBlock($this->read($store, $entryidBin), $this->maxChars);
	}

	/**
	 * Return only the subject and body of a message — used for translation,
	 * where the From/To/Date metadata is noise.
	 */
	public function readBodyWithSubject($store, string $entryidBin): string {
		$message = $this->read($store, $entryidBin);
		$text = '';
		if ($message['subject'] !== '') {
			$text .= 'Subject: ' . $message['subject'] . "\n\n";
		}
		$text .= $message['body'];

		return $this->truncate($text, $this->maxChars);
	}

	/**
	 * Render the whole conversation thread as text. Falls back to the single
	 * message when the thread cannot be determined.
	 */
	public function readThreadAsText($store, string $entryidBin): string {
		$message = mapi_msgstore_openentry($store, $entryidBin);
		if ($message === false) {
			throw new AIException(_('The selected message could not be opened.'));
		}

		$topicTag = $this->conversationTag();
		$wanted = array_filter([PR_PARENT_ENTRYID, $topicTag]);
		$props = mapi_getprops($message, $wanted);

		$topic = ($topicTag && isset($props[$topicTag]) && is_string($props[$topicTag])) ? $props[$topicTag] : '';
		$parent = $props[PR_PARENT_ENTRYID] ?? false;

		if ($topic === '' || $parent === false) {
			return $this->formatBlock($this->messageToArray($message), $this->maxChars);
		}

		$rows = $this->queryThreadRows($store, $parent, $topicTag, $topic);
		if (count($rows) <= 1) {
			return $this->formatBlock($this->messageToArray($message), $this->maxChars);
		}

		$blocks = [];
		$used = 0;
		foreach ($rows as $i => $row) {
			if ($i >= self::MAX_THREAD_MESSAGES) {
				break;
			}
			$remaining = $this->maxChars - $used;
			if ($remaining <= 200) {
				break;
			}
			$entryid = $row[PR_ENTRYID] ?? null;
			if ($entryid === null) {
				continue;
			}
			$threadMessage = mapi_msgstore_openentry($store, $entryid);
			if ($threadMessage === false) {
				continue;
			}
			$block = $this->formatBlock($this->messageToArray($threadMessage), $remaining);
			$blocks[] = $block;
			$used += mb_strlen($block);
		}

		return implode("\n\n========================================\n\n", $blocks);
	}

	/**
	 * Query the sibling messages of a conversation, oldest first. Returns [] on
	 * any MAPI failure so the caller can degrade gracefully.
	 */
	private function queryThreadRows($store, string $parentEntryid, int $topicTag, string $topic): array {
		try {
			$folder = mapi_msgstore_openentry($store, $parentEntryid);
			if ($folder === false) {
				return [];
			}
			$table = mapi_folder_getcontentstable($folder, MAPI_DEFERRED_ERRORS);
			$restriction = [RES_PROPERTY, [
				RELOP => RELOP_EQ,
				ULPROPTAG => $topicTag,
				VALUE => [$topicTag => $topic],
			]];
			mapi_table_sort($table, [PR_MESSAGE_DELIVERY_TIME => TABLE_SORT_ASCEND]);
			$rows = mapi_table_queryallrows($table, [PR_ENTRYID], $restriction);

			return is_array($rows) ? $rows : [];
		}
		catch (Throwable) {
			return [];
		}
	}

	/**
	 * Resolve the property tag used to group a conversation, preferring the
	 * conversation topic and degrading to the normalized subject.
	 */
	private function conversationTag(): int {
		if (defined('PR_CONVERSATION_TOPIC')) {
			return PR_CONVERSATION_TOPIC;
		}
		if (defined('PR_NORMALIZED_SUBJECT')) {
			return PR_NORMALIZED_SUBJECT;
		}

		return 0;
	}

	/**
	 * Extract the fields of interest from an opened message.
	 */
	private function messageToArray($message): array {
		$tags = [
			PR_SUBJECT,
			PR_SENDER_NAME,
			PR_SENDER_EMAIL_ADDRESS,
			PR_SENT_REPRESENTING_NAME,
			PR_SENT_REPRESENTING_EMAIL_ADDRESS,
			PR_DISPLAY_TO,
			PR_MESSAGE_DELIVERY_TIME,
			PR_CLIENT_SUBMIT_TIME,
		];
		$props = mapi_getprops($message, $tags);

		$fromName = $props[PR_SENT_REPRESENTING_NAME] ?? $props[PR_SENDER_NAME] ?? '';
		$fromMail = $props[PR_SENT_REPRESENTING_EMAIL_ADDRESS] ?? $props[PR_SENDER_EMAIL_ADDRESS] ?? '';
		$from = trim((string) $fromName);
		if (is_string($fromMail) && $fromMail !== '' && $fromMail !== $from) {
			$from = $from === '' ? $fromMail : $from . ' <' . $fromMail . '>';
		}

		$timestamp = $props[PR_MESSAGE_DELIVERY_TIME] ?? $props[PR_CLIENT_SUBMIT_TIME] ?? 0;

		return [
			'subject' => (string) ($props[PR_SUBJECT] ?? ''),
			'from' => $from,
			'to' => (string) ($props[PR_DISPLAY_TO] ?? ''),
			'date' => is_int($timestamp) && $timestamp > 0 ? date('Y-m-d H:i', $timestamp) : '',
			'body' => $this->readBody($message),
		];
	}

	/**
	 * Read the best available body: plain text, else HTML converted to text.
	 */
	private function readBody($message): string {
		$body = $this->streamProperty($message, PR_BODY);
		if (trim($body) !== '') {
			return $this->normalizeText($body);
		}

		if (defined('PR_HTML')) {
			$html = $this->streamProperty($message, PR_HTML);
			if (trim($html) !== '') {
				return $this->htmlToText($html);
			}
		}

		return '';
	}

	/**
	 * Read a property as a stream and return its contents (bounded).
	 */
	private function streamProperty($message, int $tag): string {
		try {
			$stream = mapi_openproperty($message, $tag, IID_IStream, 0, 0);
		}
		catch (Throwable) {
			return '';
		}
		if (!$stream) {
			return '';
		}

		$stat = mapi_stream_stat($stream);
		$size = $stat['cb'] ?? 0;
		mapi_stream_seek($stream, 0, STREAM_SEEK_SET);

		$data = '';
		// HTML may be several times larger than its text rendering, so allow
		// some headroom over the character budget before hard-stopping.
		$hardCap = $this->maxChars * 4;
		for ($read = 0; $read < $size; $read += self::STREAM_BLOCK) {
			$chunk = mapi_stream_read($stream, self::STREAM_BLOCK);
			if ($chunk === false || $chunk === '') {
				break;
			}
			$data .= $chunk;
			if (strlen($data) > $hardCap) {
				break;
			}
		}

		return $data;
	}

	/**
	 * Convert HTML to readable plain text.
	 */
	private function htmlToText(string $html): string {
		// Remove script/style blocks entirely.
		$html = preg_replace('#<(script|style)\b[^>]*>.*?</\1>#is', ' ', $html) ?? $html;
		// Bullets.
		$html = preg_replace('#<li\b[^>]*>#i', "\n- ", $html) ?? $html;
		// Block boundaries become line breaks.
		$html = preg_replace('#<(br|/p|/div|/li|/tr|/h[1-6])\s*/?>#i', "\n", $html) ?? $html;
		$text = strip_tags($html);
		$text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');

		return $this->normalizeText($text);
	}

	/**
	 * Collapse excessive whitespace.
	 */
	private function normalizeText(string $text): string {
		$text = str_replace(["\r\n", "\r"], "\n", $text);
		$text = preg_replace('/[ \t]+\n/', "\n", $text) ?? $text;
		$text = preg_replace('/\n{3,}/', "\n\n", $text) ?? $text;
		// Non-breaking spaces and zero-width artifacts from HTML mail.
		$text = str_replace(["\xC2\xA0", "\xE2\x80\x8B"], [' ', ''], $text);

		return trim($text);
	}

	/**
	 * Render one message as a header block followed by its (budgeted) body.
	 */
	private function formatBlock(array $message, int $maxChars): string {
		$header = '';
		foreach (['Subject' => 'subject', 'From' => 'from', 'To' => 'to', 'Date' => 'date'] as $label => $key) {
			if ($message[$key] !== '') {
				$header .= $label . ': ' . $message[$key] . "\n";
			}
		}

		$budget = $maxChars - mb_strlen($header) - 2;
		$body = $budget > 0 ? $this->truncate($message['body'], $budget) : '';

		return $header . "\n" . $body;
	}

	/**
	 * Truncate text to a character budget, marking where it was cut.
	 */
	private function truncate(string $text, int $maxChars): string {
		if (mb_strlen($text) <= $maxChars) {
			return $text;
		}

		return mb_substr($text, 0, max(0, $maxChars - 20)) . "\n[\u{2026} truncated \u{2026}]";
	}
}
