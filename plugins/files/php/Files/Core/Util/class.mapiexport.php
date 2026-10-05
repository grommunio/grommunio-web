<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace Files\Core\Util;

require_once __DIR__ . "/class.logger.php";
require_once __DIR__ . "/class.pathutil.php";

/**
 * Writes MAPI attachments and messages to temporary files.
 */
class MapiExport {
	private const LOG_CONTEXT = "FilesBrowserModule";

	/**
	 * Stores an attachment in the TMP folder.
	 *
	 * @param array $item store, entryid and attachNum of the attachment
	 *
	 * @return array|false temporary path and filename, or false on error
	 */
	public static function attachmentToTempFile($item) {
		$storeid = $item["store"] ?? false;
		$entryid = $item["entryid"] ?? false;
		$attachNum = $item["attachNum"] ?? false;

		if (!$storeid || !$entryid) {
			Logger::error(self::LOG_CONTEXT, "wrong call, store and entryid have to be set");

			return false;
		}

		$store = $GLOBALS["mapisession"]->openMessageStore(hex2bin((string) $storeid));
		if (!$store) {
			Logger::error(self::LOG_CONTEXT, "store could not be opened");

			return false;
		}

		$message = mapi_msgstore_openentry($store, hex2bin((string) $entryid));
		if (!$message || !$attachNum) {
			return false;
		}

		// message in message in message ...
		for ($i = 0; $i < (count($attachNum) - 1); ++$i) {
			$tempattach = mapi_message_openattach($message, (int) $attachNum[$i]);
			if ($tempattach) {
				$message = mapi_attach_openobj($tempattach);
			}
		}

		$attachment = mapi_message_openattach($message, (int) $attachNum[count($attachNum) - 1]);
		if (!$attachment) {
			return false;
		}

		$props = mapi_attach_getprops($attachment, [PR_ATTACH_LONG_FILENAME, PR_ATTACH_FILENAME, PR_DISPLAY_NAME]);
		$name = $props[PR_ATTACH_LONG_FILENAME] ?? $props[PR_ATTACH_FILENAME] ?? $props[PR_DISPLAY_NAME] ?? null;
		$filename = $name === null ? "ERROR" : PathUtil::sanitizeFilename($name);

		$tmpname = tempnam(TMP_PATH, stripslashes($filename));

		$stream = mapi_openproperty($attachment, PR_ATTACH_DATA_BIN, IID_IStream, 0, 0);
		$stat = mapi_stream_stat($stream);

		Logger::debug(self::LOG_CONTEXT, "filesize: " . $stat["cb"]);

		if (!self::streamToFile($stream, $stat["cb"], $tmpname, "attachment stream could not be read")) {
			return false;
		}

		Logger::debug(self::LOG_CONTEXT, "temp attachment written to " . $tmpname);

		return [$tmpname, $filename];
	}

	/**
	 * Stores a message as eml in the TMP folder.
	 *
	 * @param array $item store and entryid of the message
	 *
	 * @return array|false temporary path and filename, or false on error
	 */
	public static function messageToTempFile($item) {
		$storeid = $item["store"] ?? false;
		$entryid = $item["entryid"] ?? false;

		$store = $GLOBALS['mapisession']->openMessageStore(hex2bin($storeid));
		$message = mapi_msgstore_openentry($store, hex2bin($entryid));

		parse_smime($store, $message);

		if (!$message || !$store) {
			return false;
		}

		$messageProps = mapi_getprops($message, [PR_SUBJECT, PR_MESSAGE_CLASS]);
		$cls = $messageProps[PR_MESSAGE_CLASS];
		$isSupportedMessage = class_match_prefix($cls, "IPM.Note") ||
							  class_match_prefix($cls, "Report.IPM.Note") ||
							  class_match_prefix($cls, "IPM.Schedule");
		if (!$isSupportedMessage) {
			return false;
		}

		$addrBook = $GLOBALS['mapisession']->getAddressbook();
		$stream = mapi_inetmapi_imtoinet($GLOBALS['mapisession']->getSession(), $addrBook, $message, []);

		$filename = empty($messageProps[PR_SUBJECT]) ? _('Untitled') . '.eml' : PathUtil::sanitizeFilename($messageProps[PR_SUBJECT]) . '.eml';

		$tmpname = tempnam(TMP_PATH, "email2filez");
		$stat = mapi_stream_stat($stream);

		if (!self::streamToFile($stream, $stat["cb"], $tmpname, "message stream could not be read")) {
			return false;
		}

		return [$tmpname, $filename];
	}

	/**
	 * Copies $size bytes of a MAPI stream into $tmpname; removes the file on a read error.
	 *
	 * @param mixed  $stream
	 * @param int    $size
	 * @param string $tmpname
	 * @param string $errorMessage
	 *
	 * @return bool
	 */
	private static function streamToFile($stream, $size, $tmpname, $errorMessage) {
		$fhandle = fopen($tmpname, 'w');
		for ($i = 0; $i < $size; $i += BLOCK_SIZE) {
			$buffer = mapi_stream_read($stream, BLOCK_SIZE);
			if ($buffer === false) {
				fclose($fhandle);
				unlink($tmpname);
				Logger::error(self::LOG_CONTEXT, $errorMessage);

				return false;
			}
			fwrite($fhandle, $buffer, strlen($buffer));
		}
		fclose($fhandle);

		return true;
	}
}
