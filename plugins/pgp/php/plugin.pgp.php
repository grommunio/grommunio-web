<?php

require_once __DIR__ . '/class.pgpkeystore.php';
require_once __DIR__ . '/class.pgpmime.php';

/** OpenPGP.js performs cryptography. PHP handles MAPI and exact opaque MIME only. */
class Pluginpgp extends Plugin {
	private const GUID = '{9ae1e2cd-14c9-4d51-a235-3a19ccff9d34}';
	private const GPGOL_GUID = '{31805ab8-3e92-11dc-879c-00061b031004}';
	private const BODY_ANSI = 0x1000001e;
	private array $status = [];
	private array $statusMessages = [];
	private ?array $preparedSend = null;

	public function init() {
		foreach (['server.core.settings.init.before', 'server.core.properties.mailproperties',
			'server.util.parse_secure.before', 'server.module.itemmodule.open.after',
			'server.module.createmailitemmodule.beforesend', 'server.core.operations.submitmessage'] as $hook) {
			$this->registerHook($hook);
		}
	}

	public static function propertyNames(): array {
		return [
			'pgp_sign' => 'PT_BOOLEAN:' . self::GUID . ':sign',
			'pgp_encrypt' => 'PT_BOOLEAN:' . self::GUID . ':encrypt',
			'pgp_key' => 'PT_STRING8:' . self::GUID . ':key',
			'pgp_message_class' => 'PT_STRING8:' . self::GPGOL_GUID . ':GpgOL Msg Class',
		];
	}

	public function execute($eventID, &$data) {
		try {
			switch ($eventID) {
				case 'server.core.settings.init.before':
					$data['settingsObj']->addSysAdminDefaults(['zarafa' => ['v1' => ['plugins' => ['pgp' => [
						'enable' => PLUGIN_PGP_ENABLE && PLUGIN_PGP_USER_DEFAULT_ENABLE,
						'default_key' => '', 'default_sign' => false, 'default_encrypt' => false,
					]]]]]);
					break;
				case 'server.core.properties.mailproperties':
					$data['properties'] += self::propertyNames();
					break;
				case 'server.module.createmailitemmodule.beforesend':
					$this->acceptPrepared($data);
					break;
				case 'server.core.operations.submitmessage':
					$this->protect($data['store'], $data['message']);
					break;
				case 'server.util.parse_secure.before':
					if (PLUGIN_PGP_ENABLE) { $this->open($data); }
					break;
				case 'server.module.itemmodule.open.after':
					$id = $this->messageId($data['message']);
					if (isset($this->status[$id])) {
						$data['data']['item']['props']['pgp'] = $this->status[$id];
						unset($data['data']['item']['props']['smime']);
						$data['data']['item']['props']['pgp_signed'] = $this->status[$id]['signed'];
						$data['data']['item']['props']['pgp_encrypted'] = $this->status[$id]['encrypted'];
						$data['data']['item']['props']['pgp_sign'] = false;
						$data['data']['item']['props']['pgp_encrypt'] = false;
						// The browser supplies local decrypted attachment records, not MAPI numbers.
						if (!$this->status[$id]['inline']) { $data['data']['item']['attachments'] = ['item' => []]; }
					}
					break;
			}
		}
		catch (Throwable $error) {
			if (in_array($eventID, ['server.module.createmailitemmodule.beforesend', 'server.core.operations.submitmessage'], true) && !($error instanceof MAPIException)) {
				$failure = new MAPIException('OpenPGP message protection failed', MAPI_E_CALL_FAILED);
				$failure->setTitle(_('OpenPGP: message was not sent'));
				$failure->setDisplayMessage($error instanceof RuntimeException || $error instanceof InvalidArgumentException ? $error->getMessage() : _('The OpenPGP operation could not be completed.'));
				throw $failure;
			}
			throw $error;
		}
	}

	private function assertExclusive(string $class, bool $smime = false): void {
		if ($smime || stripos($class, 'SMIME') !== false) {
			throw new RuntimeException('Use either S/MIME or OpenPGP for this message, not both.');
		}
	}

	private static function entryId($value): string {
		if (!is_string($value) || strlen($value) > 8192 || !preg_match('/^(?:[a-f0-9]{2})+$/iD', $value)) {
			throw new InvalidArgumentException('A valid MAPI entry ID is required.');
		}
		return hex2bin($value);
	}

	/** Snapshot a saved draft, after its ordinary recipient/attachment upload checks. */
	public function prepare(array $data): array {
		$keys = PgpKeyStore::current();
		$store = $GLOBALS['mapisession']->openMessageStore(self::entryId($data['store_entryid'] ?? null));
		$message = $store ? mapi_msgstore_openentry($store, self::entryId($data['entryid'] ?? null)) : false;
		if (!$message) { throw new RuntimeException('The OpenPGP draft is not available.'); }
		$map = getPropIdsFromStrings($store, self::propertyNames());
		$props = mapi_getprops($message, array_merge([PR_MESSAGE_CLASS, PR_MESSAGE_FLAGS, PR_CHANGE_KEY], array_values($map)));
		if (!is_array($props) || empty($props[PR_CHANGE_KEY]) || !(($props[PR_MESSAGE_FLAGS] ?? 0) & MSGFLAG_UNSENT)) {
			throw new RuntimeException('Save the current draft before preparing OpenPGP protection.');
		}
		$this->assertExclusive($props[PR_MESSAGE_CLASS] ?? '');
		$sign = !empty($props[$map['pgp_sign']]);
		$encrypt = !empty($props[$map['pgp_encrypt']]);
		if (!$sign && !$encrypt) { throw new RuntimeException('No OpenPGP protection was selected.'); }
		$key = $keys->key($props[$map['pgp_key']] ?? '', true);
		$sender = $this->effectiveSender($message);
		if (empty($key['secret']) || !PgpKeyStore::hasUid($key, $sender)) {
			throw new RuntimeException('Choose a private OpenPGP key matching the From address.');
		}
		$recipientDetails = $this->recipientDetails($message);
		$emails = array_values(array_unique(array_column($recipientDetails, 'email')));
		sort($emails);
		$recipients = [];
		if ($encrypt) {
			foreach (array_unique(array_merge($emails, [$sender])) as $email) {
				$fingerprint = $email === $sender ? $key['fingerprint'] : $keys->recipientKey($email);
				$recipient = $keys->key($fingerprint, true);
				$recipients[] = ['email' => $email, 'fingerprint' => $fingerprint, 'public_key' => $recipient['public_key']];
			}
		}
		$entity = PgpMime::entity($this->readStream(mapi_inetmapi_imtoinet(
			$GLOBALS['mapisession']->getSession(), $GLOBALS['mapisession']->getAddressbook(), $message, [])));
		$token = bin2hex(random_bytes(24));
		$state = [
			'token' => $token, 'store_entryid' => strtolower($data['store_entryid']),
			'entryid' => strtolower($data['entryid']), 'change' => hash('sha256', $props[PR_CHANGE_KEY]),
			'sign' => $sign, 'encrypt' => $encrypt, 'key' => $key['fingerprint'],
			'sender' => $sender, 'recipients' => $emails, 'recipient_details' => $recipientDetails,
			'entity_hash' => hash('sha256', $entity), 'content_hash' => $this->contentDigest($message),
		];
		// Only a short receipt is kept here. No MIME, passphrase, or unlocked key.
		EncryptionStore::getInstance()->add('pgp:prepare:' . $token, json_encode($state, JSON_THROW_ON_ERROR), time() + 300);
		return ['token' => $token, 'mime' => base64_encode($entity), 'sender' => $sender,
			'recipients' => $recipients, 'sign' => $sign, 'encrypt' => $encrypt,
			'key' => $key, 'expires' => time() + 300];
	}

	/** Receipt binds the browser result to this session, saved draft, and protection intent. */
	private function acceptPrepared(array $data): void {
		$action = $data['action'] ?? [];
		$props = $action['props'] ?? [];
		if (empty($props['pgp_sign']) && empty($props['pgp_encrypt'])) { return; }
		PgpKeyStore::current();
		$this->assertExclusive($props['message_class'] ?? '', !empty($props['smime']));
		$payload = $action['message_action']['pgp'] ?? null;
		if (!is_array($payload) || !is_string($payload['token'] ?? null) || !preg_match('/^[a-f0-9]{48}$/D', $payload['token'])) {
			throw new RuntimeException('Prepare OpenPGP protection in your browser before sending.');
		}
		$encoded = EncryptionStore::getInstance()->get('pgp:prepare:' . $payload['token']);
		$state = is_string($encoded) && $encoded !== '' ? json_decode($encoded, true, 16, JSON_THROW_ON_ERROR) : null;
		if (!is_array($state) || !hash_equals($state['token'], $payload['token']) ||
			$state['entryid'] !== bin2hex($data['entryid'] ?: '') ||
			$state['store_entryid'] !== bin2hex(self::entryId($action['store_entryid'] ?? null)) ||
			$state['sign'] !== !empty($props['pgp_sign']) || $state['encrypt'] !== !empty($props['pgp_encrypt']) ||
			$state['key'] !== ($props['pgp_key'] ?? '')) {
			throw new RuntimeException('The OpenPGP preparation expired or changed. Please send again.');
		}
		// A payload made before another draft save must never silently send old content.
		$store = $GLOBALS['mapisession']->openMessageStore(self::entryId($state['store_entryid']));
		$draft = $store ? mapi_msgstore_openentry($store, self::entryId($state['entryid'])) : false;
		$revision = $draft ? mapi_getprops($draft, [PR_CHANGE_KEY]) : [];
		if (empty($revision[PR_CHANGE_KEY]) || !hash_equals($state['change'], hash('sha256', $revision[PR_CHANGE_KEY]))) {
			throw new RuntimeException('The draft changed while OpenPGP protection was prepared. Please send again.');
		}
		foreach (['body', 'html_body', 'subject', 'isHTML', 'rtf_compressed'] as $field) {
			if (array_key_exists($field, $props)) {
				throw new RuntimeException('The draft content changed after OpenPGP preparation. Please send again.');
			}
		}
		foreach (['recipients', 'attachments'] as $collection) {
			if (isset($action[$collection]) && !is_array($action[$collection])) {
				throw new RuntimeException('Invalid post-preparation message changes.');
			}
			foreach ($action[$collection] ?? [] as $name => $value) {
				// The attachment writer always emits this upload-dir ID unchanged; the content digest catches real additions.
				if ($collection === 'attachments' && $name === 'dialog_attachments' && is_string($value)) { continue; }
				if (!empty($value)) { throw new RuntimeException('Recipients or attachments changed after OpenPGP preparation. Please send again.'); }
			}
		}
		$envelope = $payload['envelope'] ?? null;
		if (!is_string($envelope) || strlen($envelope) > (int) (PLUGIN_PGP_MAX_MESSAGE_BYTES * 4 / 3 + 4)) {
			throw new RuntimeException('The protected message exceeds the administrator size limit.');
		}
		$envelope = base64_decode($envelope, true);
		if (!is_string($envelope)) { throw new RuntimeException('Invalid OpenPGP MIME encoding.'); }
		$parsed = PgpMime::unwrap($envelope);
		if ($parsed['kind'] !== ($state['encrypt'] ? 'encrypted' : 'signed') ||
			(!$state['encrypt'] && !hash_equals($state['entity_hash'], hash('sha256', $parsed['entity'])))) {
			throw new RuntimeException('The browser returned a different OpenPGP message or protection mode.');
		}
		// Claim atomically only after validation, so an already-accepted receipt cannot be replayed.
		$claimed = EncryptionStore::getInstance()->take('pgp:prepare:' . $payload['token']);
		if (!is_string($claimed) || !hash_equals($encoded, $claimed)) {
			throw new RuntimeException('This OpenPGP preparation has already been used. Please send again.');
		}
		$this->preparedSend = $state + ['envelope' => $envelope];
	}

	/** Replace only the final outbox copy; private operations have already finished in the browser. */
	public function protect($store, $message): void {
		$map = getPropIdsFromStrings($store, self::propertyNames());
		$props = mapi_getprops($message, array_merge([PR_MESSAGE_CLASS], array_values($map)));
		if (!is_array($props)) { throw new RuntimeException('Cannot read OpenPGP protection intent.'); }
		$sign = !empty($props[$map['pgp_sign']]);
		$encrypt = !empty($props[$map['pgp_encrypt']]);
		if (!$sign && !$encrypt) { return; }
		$this->assertExclusive($props[PR_MESSAGE_CLASS] ?? '');
		$state = $this->preparedSend;
		$recipientDetails = $this->recipientDetails($message);
		if (!$state || $state['sign'] !== $sign || $state['encrypt'] !== $encrypt ||
			$state['key'] !== ($props[$map['pgp_key']] ?? '') ||
			$state['sender'] !== $this->effectiveSender($message) || $state['recipient_details'] !== $recipientDetails) {
			throw new RuntimeException('The sender, recipients, or OpenPGP selection changed. Prepare the message again.');
		}
		if (!hash_equals($state['content_hash'], $this->contentDigest($message))) {
			throw new RuntimeException('The final message content changed after OpenPGP preparation. Please send again.');
		}
		$class = $encrypt ? 'IPM.Note.GpgOL.MultipartEncrypted' : 'IPM.Note.GpgOL.MultipartSigned';
		$mime = $encrypt ? 'multipart/encrypted' : 'multipart/signed';
		$folderProps = mapi_getprops($store, [PR_IPM_OUTBOX_ENTRYID]);
		$folder = mapi_msgstore_openentry($store, $folderProps[PR_IPM_OUTBOX_ENTRYID]);
		$probe = $folder ? mapi_folder_createmessage($folder) : false;
		if (!$probe) { throw new RuntimeException('Cannot prepare the OpenPGP transport envelope.'); }
		$this->writeEnvelope($probe, $state['envelope'], $class, $mime, $map);
		$wire = $this->readStream(mapi_inetmapi_imtoinet($GLOBALS['mapisession']->getSession(), $GLOBALS['mapisession']->getAddressbook(), $probe, []));
		if (PgpMime::unwrap($wire) !== PgpMime::unwrap($state['envelope'])) {
			throw new RuntimeException('Install the Gromox OpenPGP MIME transport update before sending.');
		}
		$this->writeEnvelope($message, $state['envelope'], $class, $mime, $map);
		if (mapi_savechanges($message) === false) { throw new RuntimeException('Cannot save the protected OpenPGP message.'); }
		$this->preparedSend = null;
	}
	/** Stable across MAPI copies/MIME boundary regeneration; never hashes truncated GetProps data. */
	private function contentDigest($message, int $depth = 0): string {
		$remaining = PLUGIN_PGP_MAX_MESSAGE_BYTES;
		$attachmentsRemaining = 1024;
		$read = function ($object, int $tag) use (&$remaining): ?string {
			$props = mapi_getprops($object, [$tag]);
			if (!is_array($props)) { throw new RuntimeException('Cannot inspect the prepared message content.'); }
			if (!array_key_exists($tag, $props)) {
				$error = $props[($tag & 0xffff0000) | PT_ERROR] ?? MAPI_E_NOT_FOUND;
				if (($error & 0xffffffff) === (MAPI_E_NOT_FOUND & 0xffffffff)) { return null; }
				if (($error & 0xffffffff) !== (MAPI_E_NOT_ENOUGH_MEMORY & 0xffffffff)) {
					throw new RuntimeException('Cannot read a prepared message property.');
				}
			}
			$stream = mapi_openproperty($object, $tag, IID_IStream, 0, 0);
			if (!$stream) { throw new RuntimeException('Cannot read the prepared message content stream.'); }
			$stat = mapi_stream_stat($stream);
			if (!is_array($stat) || !is_int($stat['cb'] ?? null) || $stat['cb'] < 0 || $stat['cb'] > $remaining) {
				throw new RuntimeException('The prepared message exceeds the administrator size limit.');
			}
			$remaining -= $stat['cb'];
			$hash = hash_init('sha256');
			for ($left = $stat['cb']; $left > 0; $left -= strlen($chunk)) {
				$chunk = mapi_stream_read($stream, min(65536, $left));
				if (!is_string($chunk) || $chunk === '' || strlen($chunk) > $left) {
					throw new RuntimeException('The prepared message content stream was truncated.');
				}
				hash_update($hash, $chunk);
			}
			return $stat['cb'] . ':' . hash_final($hash);
		};
		$walk = function ($item, int $level) use (&$walk, $read, &$attachmentsRemaining): string {
			if ($level > 8) { throw new RuntimeException('Embedded OpenPGP draft messages are nested too deeply.'); }
			$parts = [];
			foreach ([PR_SUBJECT, PR_BODY, PR_HTML, PR_RTF_COMPRESSED] as $tag) { $parts[$tag] = $read($item, $tag); }
			if ($level > 0) {
				// Attached messages carry their own envelope inside the protected
				// entity. Bind input headers, not generated MAPI IDs/change keys.
				foreach ([PR_MESSAGE_CLASS, PR_TRANSPORT_MESSAGE_HEADERS, PR_INTERNET_MESSAGE_ID, PR_INTERNET_REFERENCES,
					PR_IN_REPLY_TO_ID, PR_SENDER_NAME, PR_SENDER_ADDRTYPE, PR_SENDER_EMAIL_ADDRESS, PR_SENDER_SMTP_ADDRESS,
					PR_SENT_REPRESENTING_NAME, PR_SENT_REPRESENTING_ADDRTYPE, PR_SENT_REPRESENTING_EMAIL_ADDRESS,
					PR_SENT_REPRESENTING_SMTP_ADDRESS, PR_REPLY_RECIPIENT_NAMES, PR_REPLY_RECIPIENT_ENTRIES] as $tag) {
					$parts[$tag] = $read($item, $tag);
				}
				$recipientTable = mapi_message_getrecipienttable($item);
				$recipientTags = [PR_RECIPIENT_TYPE, PR_DISPLAY_NAME, PR_ADDRTYPE, PR_EMAIL_ADDRESS, PR_SMTP_ADDRESS, PR_ENTRYID, PR_OBJECT_TYPE];
				$recipientRows = $recipientTable ? mapi_table_queryallrows($recipientTable, $recipientTags) : false;
				if (!is_array($recipientRows) || count($recipientRows) > 1024) { throw new RuntimeException('Cannot inspect embedded message recipients.'); }
				$recipientDigests = [];
				foreach ($recipientRows as $row) {
					$fields = [];
					foreach ($recipientTags as $tag) {
						if (isset($row[($tag & 0xffff0000) | PT_ERROR]) &&
							($row[($tag & 0xffff0000) | PT_ERROR] & 0xffffffff) !== (MAPI_E_NOT_FOUND & 0xffffffff)) {
							throw new RuntimeException('Cannot read embedded message recipient properties.');
						}
						$value = $row[$tag] ?? null;
						$fields[$tag] = is_string($value) ? ['bytes' => strlen($value), 'sha256' => hash('sha256', $value)] : $value;
					}
					$recipientDigests[] = hash('sha256', json_encode($fields, JSON_THROW_ON_ERROR));
				}
				sort($recipientDigests, SORT_STRING);
				$parts['recipients'] = $recipientDigests;
			}
			$table = mapi_message_getattachmenttable($item);
			$rows = $table ? mapi_table_queryallrows($table, [PR_ATTACH_NUM]) : false;
			if (!is_array($rows) || count($rows) > $attachmentsRemaining) { throw new RuntimeException('Cannot inspect the prepared message attachments.'); }
			$attachmentsRemaining -= count($rows);
			$attachments = [];
			foreach ($rows as $row) {
				$attachment = isset($row[PR_ATTACH_NUM]) ? mapi_message_openattach($item, $row[PR_ATTACH_NUM]) : false;
				if (!$attachment) { throw new RuntimeException('Cannot open a prepared message attachment.'); }
				$scalarTags = [PR_ATTACH_METHOD, PR_ATTACHMENT_HIDDEN, PR_RENDERING_POSITION];
				$scalars = mapi_getprops($attachment, $scalarTags);
				if (!is_array($scalars)) { throw new RuntimeException('Cannot inspect a prepared message attachment.'); }
				$values = [];
				foreach ($scalarTags as $tag) {
					if (isset($scalars[($tag & 0xffff0000) | PT_ERROR]) &&
						($scalars[($tag & 0xffff0000) | PT_ERROR] & 0xffffffff) !== (MAPI_E_NOT_FOUND & 0xffffffff)) {
						throw new RuntimeException('Cannot read prepared message attachment properties.');
					}
					$values[$tag] = $scalars[$tag] ?? null;
				}
				foreach ([PR_ATTACH_LONG_FILENAME, PR_ATTACH_FILENAME, PR_DISPLAY_NAME, PR_ATTACH_MIME_TAG, PR_ATTACH_CONTENT_ID, PR_ATTACH_CONTENT_LOCATION] as $tag) {
					$values[$tag] = $read($attachment, $tag);
				}
				if (($scalars[PR_ATTACH_METHOD] ?? null) === ATTACH_BY_VALUE) {
					$values['content'] = $read($attachment, PR_ATTACH_DATA_BIN);
					if ($values['content'] === null) { throw new RuntimeException('A prepared message attachment has no content.'); }
				}
				elseif (($scalars[PR_ATTACH_METHOD] ?? null) === ATTACH_EMBEDDED_MSG) {
					$embedded = mapi_attach_openobj($attachment);
					if (!$embedded) { throw new RuntimeException('Cannot open an embedded prepared message.'); }
					$values['content'] = $walk($embedded, $level + 1);
				}
				else { throw new RuntimeException('This attachment type cannot be protected with OpenPGP.'); }
				$attachments[] = hash('sha256', json_encode($values, JSON_THROW_ON_ERROR));
			}
			sort($attachments, SORT_STRING);
			$parts['attachments'] = $attachments;
			return hash('sha256', json_encode($parts, JSON_THROW_ON_ERROR));
		};
		return $walk($message, $depth);
	}

	private function recipientDetails($message): array {
		$table = mapi_message_getrecipienttable($message);
		if ($table === false) {
			throw new RuntimeException('Cannot read the OpenPGP message recipients.');
		}
		$rows = mapi_table_queryallrows($table, [PR_SMTP_ADDRESS, PR_EMAIL_ADDRESS, PR_ADDRTYPE, PR_ENTRYID, PR_OBJECT_TYPE, PR_RECIPIENT_TYPE]);
		if (!is_array($rows) || !$rows) {
			throw new RuntimeException('OpenPGP encryption requires at least one recipient.');
		}
		$emails = [];
		foreach ($rows as $row) {
			if (($row[PR_OBJECT_TYPE] ?? null) === MAPI_DISTLIST) {
				throw new RuntimeException('Expand distribution lists to individual recipients before encrypting with OpenPGP.');
			}
			$email = $row[PR_SMTP_ADDRESS] ?? '';
			if ($email === '' && strcasecmp($row[PR_ADDRTYPE] ?? '', 'SMTP') === 0) {
				$email = $row[PR_EMAIL_ADDRESS] ?? '';
			}
			if ($email === '' && !empty($row[PR_ENTRYID])) {
				$entry = mapi_ab_openentry($GLOBALS['mapisession']->getAddressbook(), $row[PR_ENTRYID]);
				$props = $entry ? mapi_getprops($entry, [PR_SMTP_ADDRESS]) : [];
				$email = $props[PR_SMTP_ADDRESS] ?? '';
			}
			$type = $row[PR_RECIPIENT_TYPE] ?? null;
			if (!in_array($type, [MAPI_TO, MAPI_CC, MAPI_BCC], true)) {
				throw new RuntimeException('The message contains an invalid OpenPGP recipient type.');
			}
			$emails[] = ['email' => PgpKeyStore::email($email), 'type' => $type];
		}
		usort($emails, static fn ($left, $right) => [$left['email'], $left['type']] <=> [$right['email'], $right['type']]);
		return $emails;
	}

	private function senderEmail($message, bool $allowEmpty = false): string {
		$props = mapi_getprops($message, [PR_SENT_REPRESENTING_SMTP_ADDRESS, PR_SENT_REPRESENTING_EMAIL_ADDRESS, PR_SENT_REPRESENTING_ADDRTYPE, PR_SENT_REPRESENTING_ENTRYID]);
		$email = $props[PR_SENT_REPRESENTING_SMTP_ADDRESS] ?? '';
		if ($email === '' && strcasecmp($props[PR_SENT_REPRESENTING_ADDRTYPE] ?? '', 'SMTP') === 0) {
			$email = $props[PR_SENT_REPRESENTING_EMAIL_ADDRESS] ?? '';
		}
		if ($email === '' && !empty($props[PR_SENT_REPRESENTING_ENTRYID])) {
			$entry = mapi_ab_openentry($GLOBALS['mapisession']->getAddressbook(), $props[PR_SENT_REPRESENTING_ENTRYID]);
			$sender = $entry ? mapi_getprops($entry, [PR_SMTP_ADDRESS]) : [];
			$email = $sender[PR_SMTP_ADDRESS] ?? '';
		}
		return $email === '' && $allowEmpty ? '' : PgpKeyStore::email($email);
	}

	/** The converter stamps the logon address on a message that names no From identity. */
	private function effectiveSender($message): string {
		return $this->senderEmail($message, true) ?: PgpKeyStore::email($GLOBALS['mapisession']->getSMTPAddress());
	}

	private function writeEnvelope($message, string $envelope, string $class, string $mime, array $map): void {
		$rows = mapi_table_queryallrows(mapi_message_getattachmenttable($message), [PR_ATTACH_NUM]);
		if (!is_array($rows)) {
			throw new RuntimeException('Cannot enumerate the original message attachments.');
		}
		foreach ($rows as $row) {
			if (mapi_message_deleteattach($message, $row[PR_ATTACH_NUM]) === false) {
				throw new RuntimeException('Cannot replace the original message attachments with OpenPGP.');
			}
		}
		$attachment = mapi_message_createattach($message);
		if (!$attachment || mapi_setprops($attachment, [PR_ATTACH_METHOD => ATTACH_BY_VALUE, PR_ATTACH_MIME_TAG => $mime,
			PR_ATTACH_LONG_FILENAME => 'GpgOL_MIME_structure.mime', PR_DISPLAY_NAME => 'OpenPGP/MIME', PR_ATTACHMENT_HIDDEN => true]) === false) {
			throw new RuntimeException('Cannot create the OpenPGP MIME attachment.');
		}
		$stream = mapi_openproperty($attachment, PR_ATTACH_DATA_BIN, IID_IStream, 0, MAPI_CREATE | MAPI_MODIFY);
		if (!$stream || mapi_stream_write($stream, $envelope) !== strlen($envelope) || mapi_stream_commit($stream) === false || mapi_savechanges($attachment) === false) {
			throw new RuntimeException('Cannot store the OpenPGP MIME attachment.');
		}
		// Erase all cleartext body representations from the stored outgoing copy.
		if (mapi_deleteprops($message, [PR_BODY, self::BODY_ANSI, PR_HTML, PR_RTF_COMPRESSED]) === false ||
			mapi_setprops($message, [PR_MESSAGE_CLASS => $class, $map['pgp_message_class'] => $class,
				$map['pgp_sign'] => false, $map['pgp_encrypt'] => false]) === false) {
			throw new RuntimeException('Cannot finalize the OpenPGP message properties.');
		}
	}

	private function readStream($stream): string {
		if (!$stream) {
			throw new RuntimeException('Cannot read the OpenPGP message stream.');
		}
		$stat = mapi_stream_stat($stream);
		if (!is_array($stat) || !is_int($stat['cb'] ?? null) || $stat['cb'] < 0 || $stat['cb'] > PLUGIN_PGP_MAX_MESSAGE_BYTES) {
			throw new RuntimeException('The OpenPGP message exceeds the administrator size limit.');
		}
		$result = '';
		while (strlen($result) < $stat['cb']) {
			$chunk = mapi_stream_read($stream, min(65536, $stat['cb'] - strlen($result)));
			if (!is_string($chunk) || $chunk === '' || strlen($chunk) > $stat['cb'] - strlen($result)) {
				throw new RuntimeException('The OpenPGP message stream was truncated.');
			}
			$result .= $chunk;
		}
		return $result;
	}

	private function attachmentData($message, int $number): string {
		$attachment = mapi_message_openattach($message, $number);
		if (!$attachment) {
			throw new RuntimeException('Cannot open the OpenPGP MIME attachment.');
		}
		return $this->readStream(mapi_openproperty($attachment, PR_ATTACH_DATA_BIN, IID_IStream, 0, 0));
	}

	private function messageId($message): string {
		return is_object($message) ? 'o' . spl_object_id($message) : 'r' . (int) $message;
	}


	/** Preserve raw signed/ciphertext bytes for browser verification and decryption. */
	public function open(array &$data): void {
		$message = $data['message'];
		$id = $this->messageId($message);
		if (isset($this->status[$id])) { $data['handled'] = true; return; }
		$props = mapi_getprops($message, [PR_MESSAGE_CLASS, PR_TRANSPORT_MESSAGE_HEADERS]);
		if (!is_array($props)) { return; }
		$class = $props[PR_MESSAGE_CLASS] ?? '';
		$hint = preg_match('/^IPM\.Note\.GpgOL\.(MultipartEncrypted|MultipartSigned|PGPMessage|ClearSigned)(?:\.|$)/i', $class, $match) === 1;
		$kind = $hint ? (in_array(strtolower($match[1]), ['multipartencrypted', 'pgpmessage'], true) ? 'encrypted' : 'signed') : null;
		try { $kind = PgpMime::kind(rtrim($props[PR_TRANSPORT_MESSAGE_HEADERS] ?? '')) ?: $kind; }
		catch (RuntimeException $error) { /* Unrelated transport headers are not a MIME entity. */ }
		$mime = null;
		$inline = false;
		$error = null;
		try {
			if ($kind || stripos($class, 'SMIME.MultipartSigned') !== false) {
				$rows = mapi_table_queryallrows(mapi_message_getattachmenttable($message), [PR_ATTACH_NUM, PR_ATTACH_MIME_TAG]);
				if (!is_array($rows)) { throw new RuntimeException('Cannot read the protected MIME attachment table.'); }
				foreach ($rows as $row) {
					if (in_array(strtolower($row[PR_ATTACH_MIME_TAG] ?? ''), ['multipart/signed', 'multipart/encrypted'], true)) {
						$raw = $this->attachmentData($message, $row[PR_ATTACH_NUM]);
						[$headers] = PgpMime::split($raw);
						$rawKind = PgpMime::kind($headers);
						if ($rawKind) {
							$kind = $rawKind;
							if (count($rows) !== 1) { throw new RuntimeException('Attachments exist outside the protected OpenPGP envelope.'); }
							PgpMime::unwrap($raw);
							$mime = $raw;
							break;
						}
					}
				}
				if (!$mime && $kind === 'encrypted') {
					$candidates = array_values(array_filter($rows, static fn ($row) => strtolower($row[PR_ATTACH_MIME_TAG] ?? '') === 'application/octet-stream'));
					if (count($candidates) === 1) { $mime = PgpMime::encrypted($this->attachmentData($message, $candidates[0][PR_ATTACH_NUM])); }
				}
			}
			if (!$mime && stripos($class, 'SMIME') === false) {
				$bodyProps = mapi_getprops($message, [PR_BODY]);
				if (!is_array($bodyProps)) { throw new RuntimeException('Cannot inspect the inline OpenPGP body.'); }
				$body = $bodyProps[PR_BODY] ?? '';
				$bodyError = $bodyProps[(PR_BODY & 0xffff0000) | PT_ERROR] ?? null;
				if ($bodyError !== null && ($bodyError & 0xffffffff) === (MAPI_E_NOT_ENOUGH_MEMORY & 0xffffffff)) {
					// GetProps omits large values; the string-property stream preserves inline armor bytes exactly.
					$body = $this->readStream(mapi_openproperty($message, PR_BODY, IID_IStream, 0, 0));
				}
				if (preg_match('/\A-----BEGIN PGP (MESSAGE|SIGNED MESSAGE)-----\r?\n/', $body, $match)) {
					$kind = $match[1] === 'MESSAGE' ? 'encrypted' : 'signed';
					$mime = $body;
					$inline = true;
				}
			}
			if ($kind && !$mime) {
				throw new RuntimeException('The original OpenPGP MIME bytes were not preserved. Reimport the original email after updating Gromox.');
			}
			if ($mime !== null && strlen($mime) > PLUGIN_PGP_MAX_MESSAGE_BYTES) {
				throw new RuntimeException('The OpenPGP message exceeds the administrator size limit.');
			}
		}
		catch (Throwable $failure) { $error = $failure; }
		if (!$kind) { return; }
		$data['handled'] = true;
		$status = ['encrypted' => $kind === 'encrypted', 'signed' => $kind === 'signed',
			'pending' => $error === null, 'decrypted' => false, 'signature_valid' => false,
			'signer_trusted' => false, 'sender_match' => false, 'locked' => $kind === 'encrypted',
			'error' => $error !== null, 'format' => $inline ? 'inline' : 'mime', 'inline' => $inline,
			'mime' => $error === null ? base64_encode($mime) : '',
			'message' => $error instanceof RuntimeException ? $error->getMessage() : ($error ? _('The OpenPGP message could not be read.') : ''),
			'sender' => $this->senderEmail($message, true)];
		// Never present a forged clear preview alongside ciphertext. These edits
		// remain request-local; marking read must not persist different content.
		if (mapi_deleteprops($message, [PR_BODY, self::BODY_ANSI, PR_HTML, PR_RTF_COMPRESSED]) === false) {
			throw new RuntimeException('Cannot clear the protected message preview.');
		}
		$this->status[$id] = $status;
		$this->statusMessages[$id] = $message;
	}
}
