<?php
	/**
	 * Utility functions
	 *
	 * @package core
	 */
	 
	 require_once(BASE_PATH . 'server/includes/exceptions/class.JSONException.php');

	/**
	 * Function which reads the data stream. This data is send by the WebClient.
	 * @return string data
	 */
	function readData() {
		$data = "";
		$putData = fopen("php://input", "r");

		while($block = fread($putData, 1024))
		{
			$data .= $block;
		}

		fclose($putData);
		return $data;
	}

	/**
	 * Function which is called every time the "session_start" method is called.
	 * It unserializes the objects in the session. This function called by PHP.
	 * @param string @className the className of the object in the session
	 */
	function sessionNotifierLoader($className)
	{
		$className = strtolower($className); // for PHP5 set className to lower case to find the file (see ticket #839 for more information)

		switch($className)
		{
			case "bus":
				require_once(BASE_PATH . 'server/includes/core/class.bus.php');
				break;

			default:
				$path = BASE_PATH . 'server/includes/notifiers/class.' . $className . '.php';
				if (is_file($path)) {
					require_once($path);
				} else {
					$path = $GLOBALS['PluginManager']->getNotifierFilePath($className);
					if (is_file($path)) {
						require_once($path);
					}
				}
				break;
		}
		if (!class_exists($className)){
			trigger_error("Can't load ".$className." while unserializing the session.", E_USER_WARNING);
		}
	}

	/**
	 * Function which checks if an array is an associative array.
	 * @param array $data array which should be verified
	 * @return boolean true if the given array is an associative array, false if not
	 */
	function is_assoc_array($data) {
		return is_array($data) && !empty($data) && !preg_match('/^\d+$/', implode('', array_keys($data)));
	}

	/**
	 * gets maximum upload size of attachment from php ini settings
	 * important settings are upload_max_filesize and post_max_size
	 * upload_max_filesize specifies maximum upload size for attachments
	 * post_max_size must be larger then upload_max_filesize.
	 * these values are overwritten in .htaccess file of WA
	 * 
	 * @return string return max value either upload max filesize or post max size.
	 */
	function getMaxUploadSize($as_string = false)
	{
		$upload_max_value = strtoupper(ini_get('upload_max_filesize'));
		$post_max_value = getMaxPostRequestSize();

		/**
		 * if POST_MAX_SIZE is lower then UPLOAD_MAX_FILESIZE, then we have to check based on that value
		 * as we will not be able to upload attachment larger then POST_MAX_SIZE (file size + header data)
		 * so set POST_MAX_SIZE value to higher then UPLOAD_MAX_FILESIZE
		 */

		// calculate upload_max_value value to bytes
		if (strpos($upload_max_value, "K")!== false){
			$upload_max_value = ((int) $upload_max_value) * 1024;
		} else if (strpos($upload_max_value, "M")!== false){
			$upload_max_value = ((int) $upload_max_value) * 1024 * 1024;
		} else if (strpos($upload_max_value, "G")!== false){
			$upload_max_value = ((int) $upload_max_value) * 1024 * 1024 * 1024;
		}

		// check which one is larger
		$value = $upload_max_value;
		if($upload_max_value > $post_max_value) {
			$value = $post_max_value;
		}

		if ($as_string){
			// make user readable string
			if ($value > (1024 * 1024 * 1024)){
				$value = round($value / (1024 * 1024 * 1024), 1) ." ". _("GB");
			}else if ($value > (1024 * 1024)){
				$value = round($value / (1024 * 1024), 1) ." ". _("MB");
			}else if ($value > 1024){
				$value = round($value / 1024, 1) ." ". _("KB");
			}else{
				$value = $value ." ". _("B");
			}
		}

		return $value;
	}

	/**
	 * Gets maximum post request size of attachment from php ini settings.
	 * post_max_size specifies maximum size of a post request, 
	 * we are uploading attachment using post method
	 * 
	 * @return string returns the post request size with proper unit(MB, GB, KB etc.).
	 */
	function getMaxPostRequestSize()
	{
		$post_max_value = strtoupper(ini_get('post_max_size'));

		// calculate post_max_value value to bytes
		if (strpos($post_max_value, "K")!== false){
			$post_max_value = ((int) $post_max_value) * 1024;
		} else if (strpos($post_max_value, "M")!== false){
			$post_max_value = ((int) $post_max_value) * 1024 * 1024;
		} else if (strpos($post_max_value, "G")!== false){
			$post_max_value = ((int) $post_max_value) * 1024 * 1024 * 1024;
		}

		return $post_max_value;
	}

	/**
	 * Get maximum number of files that can be uploaded in single request from php ini settings.
	 * max_file_uploads specifies maximum number of files allowed in post request.
	 * 
	 * @return number maximum number of files can uploaded in single request.
	 */
	function getMaxFileUploads()
	{
		return (int)ini_get('max_file_uploads');
	}

	/**
	 * cleanTemp
	 *
	 * Cleans up the temp directory.
	 * @param String $directory The path to the temp dir or sessions dir.
	 * @param Integer $maxLifeTime The maximum allowed age of files in seconds.
	 * @param Boolean $recursive False to prevent the folder to be cleaned up recursively
	 * @param Boolean $removeSubs False to prevent empty subfolders from being deleted
	 * @return Boolean True if the folder is empty
	 */
	function cleanTemp($directory = TMP_PATH, $maxLifeTime = STATE_FILE_MAX_LIFETIME, $recursive = true, $removeSubs = true)
	{
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
					} else {
						$is_empty = false;
					}
				} else {
					// We are not cleaning recursively, the current
					// folder is not empty.
					$is_empty = false;
				}
			} else {
				$fileinfo = stat($path);

				if ($fileinfo && $fileinfo["atime"] < time() - $maxLifeTime) {
					unlink($path);
				} else {
					$is_empty = false;
				}
			}
		}

		return $is_empty;
	}

	function cleanSearchFolders()
	{
		$store = $GLOBALS["mapisession"]->getDefaultMessageStore();

		$storeProps = mapi_getprops($store, array(PR_STORE_SUPPORT_MASK, PR_FINDER_ENTRYID));
		if (($storeProps[PR_STORE_SUPPORT_MASK] & STORE_SEARCH_OK) !== STORE_SEARCH_OK) {
			return;
		}

		$finderfolder = mapi_msgstore_openentry($store, $storeProps[PR_FINDER_ENTRYID]);

		$hierarchytable = mapi_folder_gethierarchytable($finderfolder, MAPI_DEFERRED_ERRORS);
		mapi_table_restrict($hierarchytable, array(RES_AND,
				array(
					array(RES_CONTENT,
						array(
							FUZZYLEVEL	=> FL_PREFIX,
							ULPROPTAG	=> PR_DISPLAY_NAME,
							VALUE		=> array(PR_DISPLAY_NAME=>"WebApp Search Folder")
						)
					),
					array(RES_PROPERTY,
						array(
							RELOP		=> RELOP_LT,
							ULPROPTAG	=> PR_LAST_MODIFICATION_TIME,
							VALUE		=> array(PR_LAST_MODIFICATION_TIME=>(time()-ini_get("session.gc_maxlifetime")))
						)
					)
				)
		), TBL_BATCH);

		$folders = mapi_table_queryallrows($hierarchytable, array(PR_ENTRYID));
		foreach($folders as $folder){
			mapi_folder_deletefolder($finderfolder, $folder[PR_ENTRYID]);
		}
	}

	function dechex_32($dec){
		// Because on 64bit systems PHP handles integers as 64bit,
		// we need to convert these 64bit integers to 32bit when we
		// want the hex value
		$result = unpack("H*",pack("N", $dec));
		return $result[1];
	}

	/**
	 * This function will encode the input string for the header based on the browser that makes the
	 * HTTP request. MSIE has an issue with unicode filenames. All browsers do not seem to follow
	 * the RFC specification. Firefox requires an unencoded string in the HTTP header. MSIE will
	 * break on this and requires encoding.
	 * @param String $input Unencoded string
	 * @return String Encoded string
	 */
	function browserDependingHTTPHeaderEncode($input){
		if(strpos($_SERVER['HTTP_USER_AGENT'], 'MSIE') === false){
			return $input;
		}else{
			return rawurlencode($input);
		}
	}

	/**
	 * This function will return base name of the file from the full path of the file.
	 * PHP's basename() does not properly support streams or filenames beginning with a non-US-ASCII character.
	 * The default implementation in php for basename is locale aware. so it will truncate umlauts which can not be
	 * parsed by the current set locale.
	 * This problem only occurs with PHP < 5.2
	 * @see http://bugs.php.net/bug.php?id=37738, https://bugs.php.net/bug.php?id=37268
	 * @param String $filepath full path of the file
	 * @param String $suffix suffix that will be trimmed from file name
	 * @return String base name of the file
	 */
	function mb_basename($filepath, $suffix = '')
	{
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
	function storeURLDataToSession()
	{
		$data = array();

		$urlData = urldecode($_SERVER['QUERY_STRING']);
		if(!empty($_GET['action']) && $_GET['action'] === 'mailto') {
			$data['mailto'] = $_GET['to'];

			// There may be some data after to field, like cc, subject, body
			// So add them in the urlData string aswell
			$pos = stripos($urlData, $_GET['to']) + strlen($_GET['to']);
			$subString = substr($urlData, $pos);
			$data['mailto'] .= $subString;
		}

		if(!empty($data)) {
			// finally store all data to session
			$_SESSION['url_action'] = $data;
		}
	}

	// Constants for regular expressions which are used in get method to verify the input string
	define("ID_REGEX", "/^[a-z0-9_]+$/im");
	define("STRING_REGEX", "/^[a-z0-9_\s()@]+$/im");
	define("MAILTO_REGEX", "/^[a-z0-9_\s()@:.=&?!%]+$/im");
	define("USERNAME_REGEX", "/^[a-z0-9\-\.\'_@]+$/im");
	define("ALLOWED_EMAIL_CHARS_REGEX", "/^[-a-z0-9_\.@!#\$%&'\*\+\/\=\?\^_`\{\|\}~]+$/im");
	define("NUMERIC_REGEX", "/^[0-9]+$/im");
	// Don't allow "\/:*?"<>|" characters in filename.
	define("FILENAME_REGEX", "/^[^\/\:\*\?\"\<\>\|]+$/im");

	/**
	 * Function to sanitize user input values to prevent XSS attacks
	 *
	 * @param Mixed $value value that should be sanitized
	 * @param Mixed $default default value to return when value is not safe
	 * @param String $regex regex to validate values based on type of value passed
	 */
	function sanitizeValue($value, $default = '', $regex = false)
	{
		$result = addslashes($value);
		if($regex) {
			$match = preg_match_all($regex, $result);
			if(!$match) {
				$result = $default;
			}
		}

		return $result;
	}

	/**
	 * Function to sanitize user input values to prevent XSS attacks
	 *
	 * @param String $key key that should be used to get value from $_GET to sanitize value
	 * @param Mixed $default default value to return when value is not safe
	 * @param String $regex regex to validate values based on type of value passed
	 */
	function sanitizeGetValue($key, $default = '', $regex = false)
	{
		// check if value really exists
		if(isset($_GET[$key])) {
			return sanitizeValue($_GET[$key], $default, $regex);
		}

		return $default;
	}

	/**
	 * Function to sanitize user input values to prevent XSS attacks
	 *
	 * @param String $key key that should be used to get value from $_POST to sanitize value
	 * @param Mixed $default default value to return when value is not safe
	 * @param String $regex regex to validate values based on type of value passed
	 */
	function sanitizePostValue($key, $default = '', $regex = false)
	{
		// check if value really exists
		if(isset($_POST[$key])) {
			return sanitizeValue($_POST[$key], $default, $regex);
		}

		return $default;
	}

	/**
	 * Function will be used to decode smime messages and convert it to normal messages
	 * @param MAPIStore $store user's store
	 * @param MAPIMessage $message smime message
	 */
	function parse_smime($store, $message)
	{
		$props = mapi_getprops($message, array(PR_MESSAGE_CLASS));
		
		if(isset($props[PR_MESSAGE_CLASS]) && stripos($props[PR_MESSAGE_CLASS], 'IPM.Note.SMIME.MultipartSigned') !== false) {
			// this is a signed message. decode it.
			$atable = mapi_message_getattachmenttable($message);

			$rows = mapi_table_queryallrows($atable, Array(PR_ATTACH_MIME_TAG, PR_ATTACH_NUM));
			$attnum = false;

			foreach($rows as $row) {
				if(isset($row[PR_ATTACH_MIME_TAG]) && $row[PR_ATTACH_MIME_TAG] == 'multipart/signed') {
					$attnum = $row[PR_ATTACH_NUM];
				}
			}

			if($attnum !== false) {
				$att = mapi_message_openattach($message, $attnum);
				$data = mapi_openproperty($att, PR_ATTACH_DATA_BIN);

				// Allowing to hook in before the signed attachment is removed
				$GLOBALS['PluginManager']->triggerHook('server.util.parse_smime.signed', array(
					'moduleObject' =>& $this,
					'store' => $store,
					'props' => $props,
					'message' => &$message,
					'data' => &$data
					));

				mapi_message_deleteattach($message, $attnum);

				mapi_inetmapi_imtomapi($GLOBALS['mapisession']->getSession(), $store, $GLOBALS['mapisession']->getAddressbook(), $message, $data, Array("parse_smime_signed" => 1));
			}
		} else if(isset($props[PR_MESSAGE_CLASS]) && stripos($props[PR_MESSAGE_CLASS], 'IPM.Note.SMIME') !== false) {
			// this is a encrypted message. decode it.
			$attachTable = mapi_message_getattachmenttable($message);

			$rows = mapi_table_queryallrows($attachTable, Array(PR_ATTACH_MIME_TAG, PR_ATTACH_NUM));
			$attnum = false;

			foreach($rows as $row) {
				if(isset($row[PR_ATTACH_MIME_TAG]) && in_array($row[PR_ATTACH_MIME_TAG],array('application/x-pkcs7-mime','application/pkcs7-mime')) ) {
					$attnum = $row[PR_ATTACH_NUM];
				}
			}
			if($attnum !== false){
				$att = mapi_message_openattach($message, $attnum);
				$data = mapi_openproperty($att, PR_ATTACH_DATA_BIN);

				// Allowing to hook in before the encrypted attachment is removed
				$GLOBALS['PluginManager']->triggerHook('server.util.parse_smime.encrypted', array(
					'moduleObject' =>& $this,
					'store' => $store,
					'props' => $props,
					'message' => &$message,
					'data' => &$data
					));

				mapi_message_deleteattach($message, $attnum);
			}
		}
	}

	/**
	 * Helper to stream a MAPI property.
	 *
	 * @param MAPIObject $mapiobj mapi message or store
	 * @return String $datastring the streamed data
	 */
	function streamProperty($mapiobj, $proptag)
	{
		$stream = mapi_openproperty($mapiobj, $proptag, IID_IStream, 0, 0);
		$stat = mapi_stream_stat($stream);
		mapi_stream_seek($stream, 0, STREAM_SEEK_SET);

		$datastring = '';
		for($i = 0; $i < $stat['cb']; $i+= BLOCK_SIZE){
			$datastring .= mapi_stream_read($stream, BLOCK_SIZE);
		}

		return $datastring;
	}

	/**
	 * Function will decode JSON string into objects.
	 *
	 * @param {String} $jsonString JSON data that should be decoded.
	 * @param {Boolean} $toAssoc flag to indicate that associative arrays should be
	 * returned as objects or arrays, true means it will return associative array as arrays and
	 * false will return associative arrays as objects.
	 * @return {Object} decoded data.
	 */
	function json_decode_data($jsonString, $toAssoc = false)
	{
		$data = json_decode($jsonString, $toAssoc);
		$errorString = '';

		switch(json_last_error())
		{
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

		if(!empty($errorString)) {
			throw new JSONException(sprintf(_("JSON Error: - %s") , $errorString), json_last_error(), null, _("Some problem encountered when encoding/decoding JSON data."));
		}

		return $data;
	}

	/**
	 * Fetches the full hierarchy and returns an array with a cache of the state
	 * of the folders in the hierarchy.
	 *
	 * @return {Array} folderStatCache a cache of the hierarchy folders.
	 */
	function update_hierarchy_counters()
	{
		$props = array(PR_DISPLAY_NAME, PR_LOCAL_COMMIT_TIME_MAX, PR_CONTENT_COUNT, PR_CONTENT_UNREAD, PR_ENTRYID, PR_STORE_ENTRYID);

		$store = $GLOBALS["mapisession"]->getDefaultMessageStore();
		$storeProps = mapi_getprops($store, array(PR_IPM_SUBTREE_ENTRYID));
		$ipmsubtree = mapi_msgstore_openentry($store, $storeProps[PR_IPM_SUBTREE_ENTRYID]);
		$hierarchy =  mapi_folder_gethierarchytable($ipmsubtree, CONVENIENT_DEPTH);
		$rows = mapi_table_queryallrows($hierarchy, $props);

		$folderStatCache = array();
		foreach($rows as $folder) {
			$folderStatCache[$folder[PR_DISPLAY_NAME]] = array(
				'commit_time' => isset($folder[PR_LOCAL_COMMIT_TIME_MAX]) ? $folder[PR_LOCAL_COMMIT_TIME_MAX] : "0000000000",
				'entryid' => bin2hex($folder[PR_ENTRYID]),
				'store_entryid' => bin2hex($folder[PR_STORE_ENTRYID]),
				'content_count' => isset($folder[PR_CONTENT_COUNT]) ? $folder[PR_CONTENT_COUNT] : -1,
				'content_unread' => isset($folder[PR_CONTENT_UNREAD]) ? $folder[PR_CONTENT_UNREAD] : -1,
			);
		}

		return $folderStatCache;
	}
?>
