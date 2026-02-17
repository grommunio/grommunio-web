<?php

/**
 * Utility functions.
 */
require_once BASE_PATH . 'server/includes/exceptions/class.JSONException.php';

/**
 * Function which reads the data stream. This data is send by the WebClient.
 *
 * @return string data
 */
function readData() {
	$data = "";
	$putData = fopen("php://input", "r");

	while ($block = fread($putData, 1024)) {
		$data .= $block;
	}

	fclose($putData);

	return $data;
}

/*
 * Add in config specified default domain to email if no domain is set in form.
 * If no default domain is set in config, the input string will be return without changes.
 *
 * @param string user the user to append domain to
 * @return string email
 */
function appendDefaultDomain($user) {
	if (empty($user)) {
		return '';
	}
	if (!defined('DEFAULT_DOMAIN') || empty(DEFAULT_DOMAIN) || str_contains((string) $user, '@')) {
		return $user;
	}

	return $user . "@" . DEFAULT_DOMAIN;
}

/**
 * Function which is called every time the "session_start" method is called.
 * It unserializes the objects in the session. This function called by PHP.
 *
 * @param string @className the className of the object in the session
 * @param mixed $className
 */
function sessionNotifierLoader($className) {
	$className = strtolower((string) $className); // for PHP5 set className to lower case to find the file (see ticket #839 for more information)

	switch ($className) {
		case "bus":
			require_once BASE_PATH . 'server/includes/core/class.bus.php';
			break;

		default:
			$path = BASE_PATH . 'server/includes/notifiers/class.' . $className . '.php';
			if (is_file($path)) {
				require_once $path;
			}
			else {
				$path = $GLOBALS['PluginManager']->getNotifierFilePath($className);
				if (is_file($path)) {
					require_once $path;
				}
			}
			break;
	}
	if (!class_exists($className)) {
		trigger_error("Can't load " . $className . " while unserializing the session.", E_USER_WARNING);
	}
}

/**
 * Function which checks if an array is an associative array.
 *
 * @param array $data array which should be verified
 *
 * @return bool true if the given array is an associative array, false if not
 */
function is_assoc_array($data) {
	return is_array($data) && !empty($data) && !preg_match('/^\d+$/', implode('', array_keys($data)));
}

/**
 * gets maximum upload size of attachment from php ini settings
 * important settings are upload_max_filesize and post_max_size
 * upload_max_filesize specifies maximum upload size for attachments
 * post_max_size must be larger then upload_max_filesize.
 * these values are overwritten in .htaccess file of WA.
 *
 * @param mixed $as_string
 *
 * @return string return max value either upload max filesize or post max size
 */
function getMaxUploadSize($as_string = false) {
	$upload_max_value = strtoupper(ini_get('upload_max_filesize'));
	$post_max_value = getMaxPostRequestSize();

	/*
	 * if POST_MAX_SIZE is lower then UPLOAD_MAX_FILESIZE, then we have to check based on that value
	 * as we will not be able to upload attachment larger then POST_MAX_SIZE (file size + header data)
	 * so set POST_MAX_SIZE value to higher then UPLOAD_MAX_FILESIZE
	 */

	// calculate upload_max_value value to bytes
	if (str_contains($upload_max_value, "K")) {
		$upload_max_value = ((int) $upload_max_value) * 1024;
	}
	elseif (str_contains($upload_max_value, "M")) {
		$upload_max_value = ((int) $upload_max_value) * 1024 * 1024;
	}
	elseif (str_contains($upload_max_value, "G")) {
		$upload_max_value = ((int) $upload_max_value) * 1024 * 1024 * 1024;
	}

	// check which one is larger
	$value = $upload_max_value;
	if ($upload_max_value > $post_max_value) {
		$value = $post_max_value;
	}

	if ($as_string) {
		// make user readable string
		if ($value > (1024 * 1024 * 1024)) {
			$value = round($value / (1024 * 1024 * 1024), 1) . " " . _("GB");
		}
		elseif ($value > (1024 * 1024)) {
			$value = round($value / (1024 * 1024), 1) . " " . _("MB");
		}
		elseif ($value > 1024) {
			$value = round($value / 1024, 1) . " " . _("KB");
		}
		else {
			$value = $value . " " . _("B");
		}
	}

	return $value;
}

/**
 * Gets maximum post request size of attachment from php ini settings.
 * post_max_size specifies maximum size of a post request,
 * we are uploading attachment using post method.
 *
 * @return string returns the post request size with proper unit(MB, GB, KB etc.).
 */
function getMaxPostRequestSize() {
	$post_max_value = strtoupper(ini_get('post_max_size'));

	// calculate post_max_value value to bytes
	if (str_contains($post_max_value, "K")) {
		$post_max_value = ((int) $post_max_value) * 1024;
	}
	elseif (str_contains($post_max_value, "M")) {
		$post_max_value = ((int) $post_max_value) * 1024 * 1024;
	}
	elseif (str_contains($post_max_value, "G")) {
		$post_max_value = ((int) $post_max_value) * 1024 * 1024 * 1024;
	}

	return $post_max_value;
}

/**
 * Get maximum number of files that can be uploaded in single request from php ini settings.
 * max_file_uploads specifies maximum number of files allowed in post request.
 *
 * @return number maximum number of files can uploaded in single request
 */
function getMaxFileUploads() {
	return (int) ini_get('max_file_uploads');
}

/**
 * cleanTemp.
 *
 * Cleans up the temp directory.
 *
 * @param string $directory   the path to the temp dir or sessions dir
 * @param int    $maxLifeTime the maximum allowed age of files in seconds
 * @param bool   $recursive   False to prevent the folder to be cleaned up recursively
 * @param bool   $removeSubs  False to prevent empty subfolders from being deleted
 *
 * @return bool True if the folder is empty
 */
function cleanTemp($directory = TMP_PATH, $maxLifeTime = STATE_FILE_MAX_LIFETIME, $recursive = true, $removeSubs = true) {
	if (!is_dir($directory)) {
		return;
	}

	// PHP doesn't do this by itself, so before running through
	// the folder, we should flush the statcache, so the 'atime'
	// is current.
	clearstatcache();

	$dir = opendir($directory);
	$is_empty = true;

	while ($file = readdir($dir)) {
		// Skip special folders
		if ($file === '.' || $file === '..') {
			continue;
		}

		$path = $directory . DIRECTORY_SEPARATOR . $file;

		if (is_dir($path)) {
			// If it is a directory, check if we need to
			// recursively clean this subfolder.
			if ($recursive) {
				// If cleanTemp indicates the subfolder is empty,
				// and $removeSubs is true, we must delete the subfolder
				// otherwise the currently folder is not empty.
				if (cleanTemp($path, $maxLifeTime, $recursive) && $removeSubs) {
					rmdir($path);
				}
				else {
					$is_empty = false;
				}
			}
			else {
				// We are not cleaning recursively, the current
				// folder is not empty.
				$is_empty = false;
			}
		}
		else {
			$fileinfo = stat($path);

			if ($fileinfo && $fileinfo["atime"] < time() - $maxLifeTime) {
				unlink($path);
			}
			else {
				$is_empty = false;
			}
		}
	}

	return $is_empty;
}

function cleanSearchFolders() {
	$store = $GLOBALS["mapisession"]->getDefaultMessageStore();

	$storeProps = mapi_getprops($store, [PR_STORE_SUPPORT_MASK, PR_FINDER_ENTRYID]);
	if (($storeProps[PR_STORE_SUPPORT_MASK] & STORE_SEARCH_OK) !== STORE_SEARCH_OK) {
		return;
	}

	$finderfolder = mapi_msgstore_openentry($store, $storeProps[PR_FINDER_ENTRYID]);

	$hierarchytable = mapi_folder_gethierarchytable($finderfolder, MAPI_DEFERRED_ERRORS);
	mapi_table_restrict($hierarchytable, [RES_AND,
		[
			[RES_CONTENT,
				[
					FUZZYLEVEL => FL_PREFIX,
					ULPROPTAG => PR_DISPLAY_NAME,
					VALUE => [PR_DISPLAY_NAME => "grommunio Web Search Folder"],
				],
			],
			[RES_PROPERTY,
				[
					RELOP => RELOP_LT,
					ULPROPTAG => PR_LAST_MODIFICATION_TIME,
					VALUE => [PR_LAST_MODIFICATION_TIME => (time() - ini_get("session.gc_maxlifetime"))],
				],
			],
		],
	], TBL_BATCH);

	$folders = mapi_table_queryallrows($hierarchytable, [PR_ENTRYID]);
	foreach ($folders as $folder) {
		mapi_folder_deletefolder($finderfolder, $folder[PR_ENTRYID]);
	}
}

function dechex_32($dec) {
	// Because on 64bit systems PHP handles integers as 64bit,
	// we need to convert these 64bit integers to 32bit when we
	// want the hex value
	$result = unpack("H*", pack("N", $dec));

	return $result[1];
}

/**
 * This function will encode the input string for the header based on the browser that makes the
 * HTTP request. MSIE and Edge has an issue with unicode filenames. All browsers do not seem to follow
 * the RFC specification. Firefox requires an unencoded string in the HTTP header. MSIE and Edge will
 * break on this and requires encoding.
 *
 * @param string $input Unencoded string
 *
 * @return string Encoded string
 */
function browserDependingHTTPHeaderEncode($input) {
	$input = preg_replace("/\r|\n/", "", $input);
	if (!isEdge()) {
		return $input;
	}

	return rawurlencode((string) $input);
}

/**
 * Helps to detect if the request came from Edge or not.
 *
 * @return bool true if Edge is the requester, position of the word otherwise
 */
function isEdge() {
	return str_contains((string) $_SERVER['HTTP_USER_AGENT'], 'Edge');
}

/**
 * This function will return base name of the file from the full path of the file.
 * PHP's basename() does not properly support streams or filenames beginning with a non-US-ASCII character.
 * The default implementation in php for basename is locale aware. So it will truncate umlauts which can not be
 * parsed by the current set locale.
 * This problem only occurs with PHP < 5.2.
 *
 * @see http://bugs.php.net/bug.php?id=37738, https://bugs.php.net/bug.php?id=37268
 *
 * @param string $filepath full path of the file
 * @param string $suffix   suffix that will be trimmed from file name
 *
 * @return string base name of the file
 */
function mb_basename($filepath, $suffix = '') {
	// Remove right-most slashes when $uri points to directory.
	$filepath = rtrim($filepath, DIRECTORY_SEPARATOR . ' ');

	// Returns the trailing part of the $uri starting after one of the directory
	// separators.
	$filename = preg_match('@[^' . preg_quote(DIRECTORY_SEPARATOR, '@') . ']+$@', $filepath, $matches) ? $matches[0] : '';

	// Cuts off a suffix from the filename.
	if ($suffix) {
		$filename = preg_replace('@' . preg_quote($suffix, '@') . '$@', '', $filename);
	}

	return $filename;
}

/**
 * Function is used to get data from query string and store it in session
 * for use when webapp is completely loaded.
 */
function storeURLDataToSession() {
	$data = [];

	$urlData = urldecode((string) $_SERVER['QUERY_STRING']);
	if (!empty($_GET['action']) && $_GET['action'] === 'mailto') {
		$data['mailto'] = $_GET['to'];

		// There may be some data after to field, like cc, subject, body
		// So add them in the urlData string as well
		$pos = stripos($urlData, (string) $_GET['to']) + strlen((string) $_GET['to']);
		$subString = substr($urlData, $pos);
		$data['mailto'] .= $subString;
	}

	if (!empty($data)) {
		// finally store all data to session
		$_SESSION['url_action'] = $data;
	}
}

// Constants for regular expressions which are used in get method to verify the input string
define("ID_REGEX", "/^[a-z0-9_]+$/im");
define("STRING_REGEX", "/^[a-z0-9_\\s()@]+$/im");
define("USERNAME_REGEX", "/^[a-z0-9\\-\\.\\'_@]+$/im");
define("ALLOWED_EMAIL_CHARS_REGEX", "/^[-a-z0-9_\\.@!#\$%&'\\*\\+\\/\\=\\?\\^_`\\{\\|\\}~]+$/im");
define("NUMERIC_REGEX", "/^[0-9]+$/im");
// Don't allow "\/:*?"<>|" characters in filename.
define("FILENAME_REGEX", "/^[^\\/\\:\\*\\?\"\\<\\>\\|]+$/im");

/**
 * Function to sanitize user input values to prevent XSS attacks.
 *
 * @param mixed  $value   value that should be sanitized
 * @param mixed  $default default value to return when value is not safe
 * @param string $regex   regex to validate values based on type of value passed
 */
function sanitizeValue($value, $default = '', $regex = false) {
	$result = addslashes((string) $value);
	if ($regex) {
		$match = preg_match_all($regex, $result);
		if (!$match) {
			$result = $default;
		}
	}

	return $result;
}

/**
 * Function to sanitize user input values to prevent XSS attacks.
 *
 * @param string $key     key that should be used to get value from $_GET to sanitize value
 * @param mixed  $default default value to return when value is not safe
 * @param string $regex   regex to validate values based on type of value passed
 */
function sanitizeGetValue($key, $default = '', $regex = false) {
	// check if value really exists
	if (isset($_GET[$key])) {
		return sanitizeValue($_GET[$key], $default, $regex);
	}

	return $default;
}

/**
 * Function to sanitize user input values to prevent XSS attacks.
 *
 * @param string $key     key that should be used to get value from $_POST to sanitize value
 * @param mixed  $default default value to return when value is not safe
 * @param string $regex   regex to validate values based on type of value passed
 */
function sanitizePostValue($key, $default = '', $regex = false) {
	// check if value really exists
	if (isset($_POST[$key])) {
		return sanitizeValue($_POST[$key], $default, $regex);
	}

	return $default;
}

function parse_smime__join_xph(&$prop, $msg) {
	$a = mapi_getprops($msg, [PR_TRANSPORT_MESSAGE_HEADERS]);
	$a = $a === false ? "" : ($a[PR_TRANSPORT_MESSAGE_HEADERS] ?? "");
	$prop[PR_TRANSPORT_MESSAGE_HEADERS] =
		"# Outer headers:\n" . ($prop[PR_TRANSPORT_MESSAGE_HEADERS] ?? "") .
		"# Inner headers:\n" . $a;
}

/**
 * Function will be used to decode smime messages and convert it to normal messages.
 *
 * @param MAPIStore   $store   user's store
 * @param MAPIMessage $message smime message
 */
function parse_smime($store, $message) {
	$props = mapi_getprops($message, [PR_MESSAGE_CLASS, PR_MESSAGE_FLAGS,
		PR_SENT_REPRESENTING_NAME, PR_SENT_REPRESENTING_ENTRYID, PR_SENT_REPRESENTING_SEARCH_KEY,
		PR_SENT_REPRESENTING_EMAIL_ADDRESS, PR_SENT_REPRESENTING_SMTP_ADDRESS,
		PR_SENT_REPRESENTING_ADDRTYPE, PR_CLIENT_SUBMIT_TIME, PR_TRANSPORT_MESSAGE_HEADERS, PR_REPLY_RECIPIENT_ENTRIES]);
	$read = $props[PR_MESSAGE_FLAGS] & MSGFLAG_READ;
	$smimeMessage = false;

	if (class_match_prefix($props[PR_MESSAGE_CLASS], "IPM.Note.SMIME.MultipartSigned")) {
		// this is a signed message. decode it.
		$atable = mapi_message_getattachmenttable($message);

		$rows = mapi_table_queryallrows($atable, [PR_ATTACH_MIME_TAG, PR_ATTACH_NUM]);
		$attnum = false;

		foreach ($rows as $row) {
			if (isset($row[PR_ATTACH_MIME_TAG]) && $row[PR_ATTACH_MIME_TAG] == 'multipart/signed') {
				$attnum = $row[PR_ATTACH_NUM];
			}
		}

		if ($attnum !== false) {
			$att = mapi_message_openattach($message, $attnum);
			$data = mapi_openproperty($att, PR_ATTACH_DATA_BIN);

			// Allowing to hook in before the signed attachment is removed
			$GLOBALS['PluginManager']->triggerHook('server.util.parse_smime.signed', [
				'store' => $store,
				'props' => $props,
				'message' => &$message,
				'data' => &$data,
			]);

			// also copy recipients because they are lost after mapi_inetmapi_imtomapi
			$origRcptTable = mapi_message_getrecipienttable($message);
			if (!isset($GLOBALS["properties"])) {
				$GLOBALS["properties"] = new Properties();
			}
			$origRecipients = mapi_table_queryallrows($origRcptTable, $GLOBALS["properties"]->getRecipientProperties());

			mapi_inetmapi_imtomapi($GLOBALS['mapisession']->getSession(), $store, $GLOBALS['mapisession']->getAddressbook(), $message, $data, ["parse_smime_signed" => 1]);
			parse_smime__join_xph($props, $message);
			$decapRcptTable = mapi_message_getrecipienttable($message);
			$decapRecipients = mapi_table_queryallrows($decapRcptTable, $GLOBALS["properties"]->getRecipientProperties());
			if (empty($decapRecipients) && !empty($origRecipients)) {
				mapi_message_modifyrecipients($message, MODRECIP_ADD, $origRecipients);
			}

			$tmpprops = [
				PR_MESSAGE_CLASS => $props[PR_MESSAGE_CLASS],
				PR_SENT_REPRESENTING_NAME => $props[PR_SENT_REPRESENTING_NAME],
				PR_SENT_REPRESENTING_ENTRYID => $props[PR_SENT_REPRESENTING_ENTRYID],
				PR_SENT_REPRESENTING_SEARCH_KEY => $props[PR_SENT_REPRESENTING_SEARCH_KEY],
				PR_SENT_REPRESENTING_EMAIL_ADDRESS => $props[PR_SENT_REPRESENTING_EMAIL_ADDRESS] ?? '',
				PR_SENT_REPRESENTING_SMTP_ADDRESS => $props[PR_SENT_REPRESENTING_SMTP_ADDRESS] ?? '',
				PR_SENT_REPRESENTING_ADDRTYPE => $props[PR_SENT_REPRESENTING_ADDRTYPE] ?? 'SMTP',
				PR_CLIENT_SUBMIT_TIME => $props[PR_CLIENT_SUBMIT_TIME] ?? time(),
				PR_TRANSPORT_MESSAGE_HEADERS => ($props[PR_TRANSPORT_MESSAGE_HEADERS] ?? ""),
			];
			if (isset($props[PR_REPLY_RECIPIENT_ENTRIES])) {
				$tmpprops[PR_REPLY_RECIPIENT_ENTRIES] = $props[PR_REPLY_RECIPIENT_ENTRIES];
			}
			mapi_setprops($message, $tmpprops);
		}
		$smimeMessage = true;
	}
	elseif (class_match_prefix($props[PR_MESSAGE_CLASS], "IPM.Note.SMIME")) {
		// this is a encrypted message. decode it.
		$attachTable = mapi_message_getattachmenttable($message);

		$rows = mapi_table_queryallrows($attachTable, [PR_ATTACH_MIME_TAG, PR_ATTACH_NUM, PR_ATTACH_LONG_FILENAME]);
		$attnum = false;
		foreach ($rows as $row) {
			if (isset($row[PR_ATTACH_MIME_TAG]) && in_array($row[PR_ATTACH_MIME_TAG], ['application/x-pkcs7-mime', 'application/pkcs7-mime'])) {
				$attnum = $row[PR_ATTACH_NUM];
			}
		}

		if ($attnum !== false) {
			$att = mapi_message_openattach($message, $attnum);
			$data = mapi_openproperty($att, PR_ATTACH_DATA_BIN);

			// also copy recipients because they are lost after decrypting
			$origRcptTable = mapi_message_getrecipienttable($message);
			if (!isset($GLOBALS["properties"])) {
				$GLOBALS["properties"] = new Properties();
			}
			$origRecipients = mapi_table_queryallrows($origRcptTable, $GLOBALS["properties"]->getRecipientProperties());

			// Allowing to hook in before the encrypted attachment is removed
			$GLOBALS['PluginManager']->triggerHook('server.util.parse_smime.encrypted', [
				'store' => $store,
				'props' => $props,
				'message' => &$message,
				'data' => &$data,
			]);

			// after decrypting $message is a IPM.Note message,
			// deleting an attachment removes an actual attachment of the message
			$mprops = mapi_getprops($message, [PR_MESSAGE_CLASS]);
			if (isSmimePluginEnabled() &&
			    class_match_prefix($mprops[PR_MESSAGE_CLASS], "IPM.Note.SMIME"))
				mapi_message_deleteattach($message, $attnum);

			$decapRcptTable = mapi_message_getrecipienttable($message);
			$decapRecipients = mapi_table_queryallrows($decapRcptTable, $GLOBALS["properties"]->getRecipientProperties());
			if (empty($decapRecipients) && !empty($origRecipients)) {
				mapi_message_modifyrecipients($message, MODRECIP_ADD, $origRecipients);
			}
		}
		$smimeMessage = true;
	}
	// mark the message as read if the main message has read flag
	if ($smimeMessage && $read) {
		$mprops = mapi_getprops($message, [PR_MESSAGE_FLAGS]);
		mapi_setprops($message, [PR_MESSAGE_FLAGS => $mprops[PR_MESSAGE_FLAGS] | MSGFLAG_READ]);
	}
}

/**
 * Helper function which used to check smime plugin is enabled.
 *
 * @return bool true if smime plugin is enabled else false
 */
function isSmimePluginEnabled() {
	return $GLOBALS['settings']->get("zarafa/v1/plugins/smime/enable", false);
}

/**
 * Helper to stream a MAPI property.
 *
 * @param MAPIObject $mapiobj mapi message or store
 * @param mixed      $proptag
 *
 * @return string $datastring the streamed data
 */
function streamProperty($mapiobj, $proptag) {
	$stream = mapi_openproperty($mapiobj, $proptag, IID_IStream, 0, 0);
	$stat = mapi_stream_stat($stream);
	mapi_stream_seek($stream, 0, STREAM_SEEK_SET);

	$datastring = '';
	for ($i = 0; $i < $stat['cb']; $i += BLOCK_SIZE) {
		$datastring .= mapi_stream_read($stream, BLOCK_SIZE);
	}

	return $datastring;
}

/**
 * Function will decode JSON string into objects.
 *
 * @param string $jsonString JSON data that should be decoded
 * @param bool   $toAssoc    flag to indicate that associative arrays should be
 *                           returned as objects or arrays, true means it will return associative array as arrays and
 *                           false will return associative arrays as objects
 *
 * @return object decoded data
 */
function json_decode_data($jsonString, $toAssoc = false) {
	$data = json_decode($jsonString, $toAssoc);
	$errorString = '';

	switch (json_last_error()) {
		case JSON_ERROR_DEPTH:
			$errorString = _("The maximum stack depth has been exceeded");
			break;

		case JSON_ERROR_CTRL_CHAR:
			$errorString = _("Control character error, possibly incorrectly encoded");
			break;

		case JSON_ERROR_STATE_MISMATCH:
			$errorString = _("Invalid or malformed JSON");
			break;

		case JSON_ERROR_SYNTAX:
			$errorString = _("Syntax error");
			break;

		case JSON_ERROR_UTF8:
			$errorString = _("Malformed UTF-8 characters, possibly incorrectly encoded");
			break;
	}

	if (!empty($errorString)) {
		throw new JsonException(sprintf(_("Some problem encountered when encoding/decoding JSON data: - %s"), $errorString), json_last_error(), null);
	}

	return $data;
}

/**
 * Tries to open the IPM subtree. If opening fails, it will try to fix it by
 * trying to find the correct entryid of the IPM subtree in the hierarchy.
 *
 * @param resource $store the store to retrieve IPM subtree from
 *
 * @return mixed false if the subtree is broken beyond quick repair,
 *               the IPM subtree resource otherwise
 */
function getSubTree($store) {
	$storeProps = mapi_getprops($store, [PR_IPM_SUBTREE_ENTRYID]);

	try {
		$ipmsubtree = mapi_msgstore_openentry($store, $storeProps[PR_IPM_SUBTREE_ENTRYID]);
	}
	catch (MAPIException $e) {
		if ($e->getCode() == MAPI_E_NOT_FOUND || $e->getCode() == MAPI_E_INVALID_ENTRYID) {
			$username = $GLOBALS["mapisession"]->getUserName();
			error_log(sprintf('Unable to open IPM_SUBTREE for %s, trying to correct PR_IPM_SUBTREE_ENTRYID', $username));
		}
	}

	return $ipmsubtree;
}

/**
 * Fetches the full hierarchy and returns an array with a cache of the stat
 * of the folders in the hierarchy. Passing the folderType is required for cases where
 * the user has permission on the inbox folder, but no folder visible
 * rights on the rest of the store.
 *
 * @param string $username   the user who's store to retrieve hierarchy counters from.
 *                           If no username is given, the currently logged in user's store will be used.
 * @param string $folderType if inbox use the inbox as root folder
 *
 * @return array folderStatCache a cache of the hierarchy folders
 */
function updateHierarchyCounters($username = '', $folderType = '') {
	// Open the correct store
	if ($username) {
		$userEntryid = $GLOBALS["mapisession"]->getStoreEntryIdOfUser($username);
		$store = $userEntryid ? $GLOBALS["mapisession"]->openMessageStore($userEntryid) : false;
	}
	else {
		$store = $GLOBALS["mapisession"]->getDefaultMessageStore();
	}

	if (!$store) {
		return [];
	}

	$props = [PR_DISPLAY_NAME, PR_LOCAL_COMMIT_TIME_MAX, PR_CONTENT_COUNT, PR_CONTENT_UNREAD, PR_ENTRYID, PR_STORE_ENTRYID];

	if ($folderType === 'inbox') {
		try {
			$rootFolder = mapi_msgstore_getreceivefolder($store);
		}
		catch (MAPIException $e) {
			$username = $GLOBALS["mapisession"]->getUserName();
			error_log(sprintf("Unable to open Inbox for %s. MAPI Error '%s'", $username, get_mapi_error_name($e->getCode())));

			return [];
		}
	}
	else {
		$rootFolder = getSubTree($store);
	}

	$hierarchy = mapi_folder_gethierarchytable($rootFolder, CONVENIENT_DEPTH | MAPI_DEFERRED_ERRORS);
	$rows = mapi_table_queryallrows($hierarchy, $props);

	// Append the Inbox folder itself.
	if ($folderType === 'inbox') {
		array_push($rows, mapi_getprops($rootFolder, $props));
	}

	$folderStatCache = [];
	foreach ($rows as $folder) {
		$folderStatCache[$folder[PR_DISPLAY_NAME]] = [
			'commit_time' => $folder[PR_LOCAL_COMMIT_TIME_MAX] ?? "0000000000",
			'entryid' => bin2hex((string) $folder[PR_ENTRYID]),
			'store_entryid' => bin2hex((string) $folder[PR_STORE_ENTRYID]),
			'content_count' => $folder[PR_CONTENT_COUNT] ?? -1,
			'content_unread' => $folder[PR_CONTENT_UNREAD] ?? -1,
		];
	}

	return $folderStatCache;
}

/**
 * Helper function which provide protocol used by current request.
 *
 * @return string it can be either https or http
 */
function getRequestProtocol() {
	if (!empty($_SERVER['HTTP_X_FORWARDED_PROTO'])) {
		return $_SERVER['HTTP_X_FORWARDED_PROTO'];
	}

	return !empty($_SERVER['HTTPS']) ? "https" : "http";
}

/**
 * Helper function which defines that webapp has to use secure cookies
 * or not. by default webapp always use secure cookies whether or not
 * 'SECURE_COOKIES' defined. webapp only use insecure cookies
 * where a user has explicitly set 'SECURE_COOKIES' to false.
 *
 * @return bool return false only when a user has explicitly set
 *              'SECURE_COOKIES' to false else returns true
 */
function useSecureCookies() {
	return !defined('SECURE_COOKIES') || SECURE_COOKIES !== false;
}

/**
 * Check if the eml stream is corrupted or not.
 *
 * @param string $attachment content fetched from PR_ATTACH_DATA_BIN property of an attachment
 *
 * @return true if eml is broken, false otherwise
 */
function isBrokenEml($attachment) {
	// Get header part to process further
	$splittedContent = preg_split("/\r?\n\r?\n/", $attachment);

	// Fetch raw header
	if (preg_match_all('/([^\n^:]+:)/', $splittedContent[0], $matches)) {
		$rawHeaders = $matches[1];
	}

	// Compare if necessary headers are present or not
	if (isset($rawHeaders) && in_array('From:', $rawHeaders) && in_array('Date:', $rawHeaders)) {
		return false;
	}

	return true;
}

/**
 * Helper function which return the webapp version.
 *
 * @return string webapp version
 */
function getWebappVersion() {
	return trim(file_get_contents('version'));
}

/**
 * function which remove double quotes or PREF from vcf stream
 * if it has.
 *
 * @param string $attachmentStream The attachment stream
 */
function processVCFStream(&$attachmentStream) {
	/*
	 * https://github.com/libical/libical/issues/488
	 * https://github.com/libical/libical/issues/490
	 *
	 * Because of above issues we need to remove
	 * double quotes or PREF from vcf stream if
	 * it exists in vcf stream.
	 */
	if (preg_match('/"/', $attachmentStream) > 0) {
		$attachmentStream = str_replace('"', '', $attachmentStream);
	}

	if (preg_match('/EMAIL;PREF=/', $attachmentStream) > 0) {
		$rows = explode("\n", $attachmentStream);
		foreach ($rows as $key => $row) {
			if (preg_match("/EMAIL;PREF=/", $row)) {
				unset($rows[$key]);
			}
		}

		$attachmentStream = join("\n", $rows);
	}
}

/**
 * Formats time string for DateTime object, e.g.
 * last Sunday of March 2022 02:00.
 *
 * @param mixed $relDayofWeek
 * @param mixed $dayOfWeek
 * @param mixed $month
 * @param mixed $year
 * @param mixed $hour
 * @param mixed $minute
 */
function formatDateTimeString($relDayofWeek, $dayOfWeek, $month, $year, $hour, $minute) {
	return sprintf("%s %s of %s %04d %02d:%02d", $relDayofWeek, $dayOfWeek, $month, $year, $hour, $minute);
}

/**
 * Converts offset minutes to PHP TimeZone offset (+0200/-0530).
 *
 * Note: it is necessary to invert the bias sign in order to receive
 * the correct offset (-60 => +0100).
 *
 * @param int $minutes
 *
 * @return string PHP TimeZone offset
 */
function convertOffset($minutes) {
	$m = abs($minutes);

	return sprintf("%s%02d%02d", $minutes > 0 ? '-' : '+', intdiv($m, 60), $m % 60);
}

/**
 * Returns the index of effective rule (TZRULE_FLAG_EFFECTIVE_TZREG).
 *
 * @param array $tzrules
 *
 * @return null|int
 */
function getEffectiveTzreg($tzrules) {
	foreach ($tzrules as $idx => $tzDefRule) {
		if ($tzDefRule['tzruleflags'] & TZRULE_FLAG_EFFECTIVE_TZREG) {
			return $idx;
		}
	}

	return null;
}

/**
 * Returns the timestamp of std or dst start.
 *
 * @param array  $tzrule
 * @param int    $year
 * @param string $fOffset
 *
 * @return int
 */
function getRuleStart($tzrule, $year, $fOffset) {
	$daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	$monthNames = [1 => "January", "February", "March", "April", "May", "June",
		"July", "August", "September", "October", "November", "December", ];
	$relDaysOfWeek = [
		1 => 'first',
		2 => 'second',
		3 => 'third',
		4 => 'fourth',
		5 => 'last',
	];

	$f = formatDateTimeString(
		$relDaysOfWeek[$tzrule['day']],
		$daysOfWeek[$tzrule['dayofweek']],
		$monthNames[$tzrule['month']],
		$year,
		$tzrule['hour'],
		$tzrule['minute'],
	);
	$dt = new DateTime($f, new DateTimeZone($fOffset));

	return $dt->getTimestamp();
}

/**
 * Returns TRUE if DST is in effect.
 *
 * 1. Check if the timezone defines std and dst times
 * 2. Get the std and dst start in UTC
 * 3. Check if the appointment is in dst:
 *    - dst start > std start and not (std start < app time < dst start)
 *    - dst start < std start and std start > app time > dst start
 *
 * @param array $tzrules
 * @param int   $startdate
 *
 * @return bool
 */
function isDst($tzrules, $startdate) {
	if (array_sum($tzrules['stStandardDate']) == 0 || array_sum($tzrules['stDaylightDate']) == 0) {
		return false;
	}
	$appStartDate = getdate($startdate);
	$fOffset = convertOffset($tzrules['bias']);

	$tzStdStart = getRuleStart($tzrules['stStandardDate'], $appStartDate['year'], $fOffset);
	$tzDstStart = getRuleStart($tzrules['stDaylightDate'], $appStartDate['year'], $fOffset);

	return
		(($tzDstStart > $tzStdStart) && !($startdate > $tzStdStart && $startdate < $tzDstStart)) ||
		(($tzDstStart < $tzStdStart) && ($startdate < $tzStdStart && $startdate > $tzDstStart));
}

/**
 * Calculates the local startime for a timezone from a timestamp.
 *
 * @param int    $ts
 * @param string $tz
 *
 * @return int
 */
function getLocalStart($ts, $tz) {
	$calItemStart = new DateTime();
	$calItemStart->setTimestamp($ts);
	$clientDate = DateTime::createFromInterface($calItemStart);
	$clientDate->setTimezone(new DateTimeZone($tz));
	// It's only necessary to calculate new start and end times
	// if the appointment does not start at midnight
	if ((int) $clientDate->format("His") != 0) {
		$clientMidnight = DateTimeImmutable::createFromFormat(
			"Y-m-d H:i:s",
			$clientDate->format("Y-m-d ") . "00:00:00",
			$clientDate->getTimezone()
		);
		$interval = $clientDate->getTimestamp() - $clientMidnight->getTimestamp();
		// The code here is based on assumption that if the interval
		// is greater than 12 hours then the appointment takes place
		// on the day before or after. This should be fine for all the
		// timezones which do not exceed 12 hour difference to UTC.
		$ts = $interval > 0 ?
			$ts - ($interval < 43200 ? $interval : $interval - 86400) :
			$ts + ($interval > -43200 ? $interval : $interval - 86400);
	}

	return $ts;
}

/**
 * @h:	PR_MESSAGE_CLASS value
 * @n:	prefix to test for
 */
function class_match_prefix($h, $n)
{
	if (!isset($h))
		return false;
	$z = strlen($n);
	$r = strncasecmp($h, $n, $z);
	if ($r != 0)
		return false;
	return strlen($h) == $z || $h[$z] == '.' ? true : false;
}
