<?php

define('PRIVATE_FID_ROOT', 0x1);

define('PR_FOLDER_ID', 0x67480014);
define('PR_MID', 0x674A0014);
define('PR_CHANGE_NUMBER', 0x67A40014);

class IndexSqlite extends SQLite3 {
	private $username;
	private $stmt;
	private $count;
	private $store;
	private $session;
	private $hide_attachments_proptag;

	private static function get_gc_value($eid) {
		$r0 = ($eid >> 56) & 0xFF;
		$r1 = ($eid >> 48) & 0xFF;
		$r2 = ($eid >> 40) & 0xFF;
		$r3 = ($eid >> 32) & 0xFF;
		$r4 = ($eid >> 24) & 0xFF;
		$r5 = ($eid >> 16) & 0xFF;
		$value = $r0 | ($r1 << 8) | ($r2 << 16) | ($r3 << 24) | ($r4 << 32) | ($r5 << 40);

		return $value;
	}

	public function __construct() {
		$this->username = $GLOBALS["mapisession"]->getUserName();
		$this->session = $GLOBALS["mapisession"]->getSession();
		$this->store = $GLOBALS["mapisession"]->getDefaultMessageStore();
	}

	private function try_insert_content(
		$search_entryid,
		$row,
		$folder_id,
		$recursive,
		$message_classes,
		$date_start,
		$date_end,
		$unread,
		$has_attachments
	) {
		// if match condition contains '@', $row['entryid'] will disappear. it seems a bug for php-sqlite
		if (strlen($row['entryid']) == 0) {
			$results = $this->query("SELECT entryid FROM messages WHERE message_id=" . $row['message_id']);
			$row1 = $results->fetchArray(SQLITE3_NUM);
			if ($row1) {
				$row['entryid'] = $row1[0];
			}
		}
		if (isset($folder_id)) {
			try {
				if ($folder_id != $row['folder_id']) {
					if (!$recursive) {
						return;
					}
					$message = mapi_msgstore_openentry($this->store, $row['entryid']);
					$tmp_props = mapi_getprops($message, [PR_PARENT_ENTRYID]);
					$folder_entryid = $tmp_props[PR_PARENT_ENTRYID];
					while (true) {
						$folder = mapi_msgstore_openentry($this->store, $folder_entryid);
						if (!$folder) {
							return;
						}
						$tmp_props = mapi_getprops($folder, [PR_PARENT_ENTRYID, PR_FOLDER_ID]);
						$folder_entryid = $tmp_props[PR_PARENT_ENTRYID];
						$tmp_fid = IndexSqlite::get_gc_value($tmp_props[PR_FOLDER_ID]);
						if ($tmp_fid == $folder_id) {
							break;
						}
						if ($tmp_fid == PRIVATE_FID_ROOT) {
							return;
						}
					}
				}
			}
			catch (Exception $e) {
				return;
			}
		}
		if (isset($message_classes)) {
			$found = false;
			foreach ($message_classes as $message_class) {
				if (strncasecmp($row['message_class'], $message_class, strlen($message_class)) == 0) {
					$found = true;
					break;
				}
			}
			if (!$found) {
				return;
			}
		}
		if (isset($date_start) && $row['date'] < $date_start) {
			return;
		}
		if (isset($date_end) && $row['date'] > $date_end) {
			return;
		}
		if (isset($unread) || isset($has_attachments)) {
			if (!isset($this->hide_attachments_proptag)) {
				$mapping = ["hide_attachments" => "PT_BOOLEAN:PSETID_Common:" . PidLidSmartNoAttach];
				$properties = getPropIdsFromStrings($this->store, $mapping);
				$this->hide_attachments_proptag = $properties['hide_attachments'];
			}
			$message = mapi_msgstore_openentry($this->store, $row['entryid']);
			$propvals = mapi_getprops($message, [PR_MESSAGE_FLAGS, $this->hide_attachments_proptag]);
			if (isset($unread)) {
				if (($unread && ($propvals[PR_MESSAGE_FLAGS] & MSGFLAG_READ)) ||
					(!$unread && !($propvals[PR_MESSAGE_FLAGS] & MSGFLAG_READ))) {
					return;
				}
			}
			if (isset($has_attachments)) {
				if ($propvals[PR_MESSAGE_FLAGS] & MSGFLAG_HASATTACH) {
					if (isset($propvals[$properties['hide_attachments']]) &&
						$propvals[$properties['hide_attachments']]) {
						$has_attachments1 = false;
					}
					else {
						$has_attachments1 = true;
					}
				}
				else {
					$has_attachments1 = false;
				}
				if ($has_attachments !== $has_attachments1) {
					return;
				}
			}
		}

		try {
			mapi_linkmessage($this->session, $search_entryid, $row['entryid']);
		}
		catch (Exception $e) {
			return;
		}
		++$this->count;
	}

	private function result_full() {
		return $this->count >= MAX_FTS_RESULT_ITEMS;
	}

	public function search(
		$search_entryid,
		$sender,
		$sending,
		$recipients,
		$subject,
		$content,
		$attachments,
		$others,
		$folder_entrid,
		$recursive,
		$message_classes,
		$date_start,
		$date_end,
		$unread,
		$has_attachments
	) {
		$search_folder = mapi_msgstore_openentry($this->store, $search_entryid);
		$tmp_props = mapi_getprops($search_folder, [PR_FOLDER_ID]);
		$search_id = IndexSqlite::get_gc_value($tmp_props[PR_FOLDER_ID]);
		if (isset($folder_entrid)) {
			try {
				$folder = mapi_msgstore_openentry($this->store, $folder_entrid);
				if (!$folder) {
					return false;
				}
				$tmp_props = mapi_getprops($folder, [PR_FOLDER_ID]);
				if (empty($tmp_props[PR_FOLDER_ID])) {
					return false;
				}
				$folder_id = IndexSqlite::get_gc_value($tmp_props[PR_FOLDER_ID]);
			}
			catch (Exception $e) {
				return false;
			}
		}
		$sql_string = "SELECT entryid, message_id, folder_id, sender, sending, " .
			"recipients, subject, content, attachments, message_class, date FROM" .
			" messages WHERE messages MATCH '";
		$this->count = 0;
		if (isset($sender) && $sender == $sending && $sending == $recipients && $recipients == $subject &&
			$subject == $content && $content == $attachments && $attachments == $others) {
			$sql_string .= SQLite3::escapeString($sender) . "*'";
		}
		else {
			$first = true;
			if (isset($sender)) {
				if ($first == true) {
					$first = false;
				}
				else {
					$sql_string .= " OR ";
				}
				$sql_string .= 'sender:' . SQLite3::escapeString($sender) . '*';
			}
			if (isset($sending)) {
				if ($first == true) {
					$first = false;
				}
				else {
					$sql_string .= " OR ";
				}
				$sql_string .= 'sending:' . SQLite3::escapeString($sending) . '*';
			}
			if (isset($recipients)) {
				if ($first == true) {
					$first = false;
				}
				else {
					$sql_string .= " OR ";
				}
				$sql_string .= 'recipients:' . SQLite3::escapeString($recipients) . '*';
			}
			if (isset($subject)) {
				if ($first == true) {
					$first = false;
				}
				else {
					$sql_string .= " OR ";
				}
				$sql_string .= 'subject:' . SQLite3::escapeString($subject) . '*';
			}
			if (isset($content)) {
				if ($first == true) {
					$first = false;
				}
				else {
					$sql_string .= " OR ";
				}
				$sql_string .= 'content:' . SQLite3::escapeString($content) . '*';
			}
			if (isset($attachments)) {
				if ($first == true) {
					$first = false;
				}
				else {
					$sql_string .= " OR ";
				}
				$sql_string .= 'attachments:' . SQLite3::escapeString($attachments) . '*';
			}
			if (isset($others)) {
				if ($first == true) {
					$first = false;
				}
				else {
					$sql_string .= " OR ";
				}
				$sql_string .= 'others:' . SQLite3::escapeString($others) . '*';
			}
			if ($first) {
				return false;
			}
			$sql_string .= "'";
		}
		$results = $this->query($sql_string);
		while (($row = $results->fetchArray(SQLITE3_ASSOC)) && !$this->result_full()) {
			$this->try_insert_content(
				$search_entryid,
				$row,
				$folder_id,
				$recursive,
				$message_classes,
				$date_start,
				$date_end,
				$unread,
				$has_attachments
			);
		}

		return true;
	}

	private function create() {
		mkdir(SQLITE_INDEX_PATH . '/' . $this->username);
		chmod(SQLITE_INDEX_PATH . '/' . $this->username, 0777);
		$this->open(SQLITE_INDEX_PATH . '/' . $this->username . '/index.sqlite3');
		chmod(SQLITE_INDEX_PATH . '/' . $this->username . '/index.sqlite3', 0666);

		return true;
	}

	public function load() {
		if (!is_file(SQLITE_INDEX_PATH . '/' . $this->username . '/index.sqlite3')) {
			if ($this->create() == false) {
				return false;
			}
		}
		else {
			$this->open(SQLITE_INDEX_PATH . '/' . $this->username . '/index.sqlite3');
		}
		$sql_string = "CREATE TABLE IF NOT EXISTS hierarchy(" .
				"folder_id INTEGER PRIMARY KEY," .
				"commit_max INTEGER NOT NULL," .
				"max_cn INTEGER NOT NULL);\n" .
				"CREATE VIRTUAL TABLE IF NOT EXISTS messages USING " .
				SQLITE_FTS_ENGINE .
				"(sender, sending, recipients, " .
				"subject, content, attachments," .
				"others, message_id," .
				"attach_indexed UNINDEXED," .
				"entryid UNINDEXED," .
				"change_num UNINDEXED," .
				"folder_id UNINDEXED," .
				"message_class UNINDEXED," .
				"date UNINDEXED, " .
				"tokenize=" . SQLITE_FTS_TOKENIZER . ");";
		if ($this->exec($sql_string) == false) {
			error_log("fail to execute sqlite create table statemente, " . $this->lastErrorMsg());

			return false;
		}
		// refresh the index sqlite database
		return $this->refresh();
	}

	private function refresh() {
		$mapping = [
			"categories" => "PT_MV_STRING8:PS_PUBLIC_STRINGS:Keywords",
			"fileas" => "PT_STRING8:PSETID_Address:0x8005",
			"location" => "PT_STRING8:PSETID_Appointment:" . PidLidLocation,
			"email1" => "PT_STRING8:PSETID_Address:" . PidLidEmail1EmailAddress,
			"emai1_name" => "PT_STRING8:PSETID_Address:" . PidLidEmail1DisplayName,
			"email2" => "PT_STRING8:PSETID_Address:" . PidLidEmail2EmailAddress,
			"email2_name" => "PT_STRING8:PSETID_Address:" . PidLidEmail2DisplayName,
			"email3" => "PT_STRING8:PSETID_Address:" . PidLidEmail3EmailAddress,
			"email3_name" => "PT_STRING8:PSETID_Address:" . PidLidEmail3DisplayName,
			"home_address" => "PT_STRING8:PSETID_Address:0x801a",
			"other_address" => "PT_STRING8:PSETID_Address:0x801c",
			"work_address" => "PT_STRING8:PSETID_Address:0x801b",
			"task_owner" => "PT_STRING8:PSETID_Task:0x811f",
			"companies" => "PT_MV_STRING8:PSETID_Common:0x8539",
		];
		$properties = getPropIdsFromStrings($this->store, $mapping);
		$store_props = mapi_getprops($this->store, [PR_IPM_SUBTREE_ENTRYID]);
		$entryid = $store_props[PR_IPM_SUBTREE_ENTRYID];

		try {
			$ipm_subtree = mapi_msgstore_openentry($this->store, $entryid);
			$table = mapi_folder_gethierarchytable($ipm_subtree, CONVENIENT_DEPTH);
		}
		catch (Exception  $e) {
			error_log("fail to refresh indexing sqlite, cannot open ipmsubstree hierarchy table in " . $this->username . "'s store");

			return false;
		}
		$stmt = $this->prepare("SELECT commit_max, max_cn FROM hierarchy WHERE folder_id=:folder_id");
		$items = mapi_table_queryallrows($table, [PR_ENTRYID,
			PR_FOLDER_ID, PR_FOLDER_TYPE, PR_LOCAL_COMMIT_TIME_MAX, ]);
		$hierarchy = [];
		$messages = [];
		foreach ($items as $item) {
			if ($item[PR_FOLDER_TYPE] != FOLDER_GENERIC) {
				continue;
			}
			$max_cn = 0;
			$last_cn = 0;
			$folder_id = IndexSqlite::get_gc_value((int) $item[PR_FOLDER_ID]);
			$stmt->reset();
			$stmt->bindValue(":folder_id", $folder_id, SQLITE3_INTEGER);
			$ret = $stmt->execute();
			$row = $ret->fetchArray(SQLITE3_ASSOC);
			if ($row) {
				$max_cn = $row['max_cn'];
				$last_cn = $max_cn;
				if ($row['commit_max'] == $item[PR_LOCAL_COMMIT_TIME_MAX]) {
					continue;
				}
			}

			try {
				$folder = mapi_msgstore_openentry($this->store, $item[PR_ENTRYID]);
				$table = mapi_folder_getcontentstable($folder);
				$contents = mapi_table_queryallrows($table, [PR_MID, PR_CHANGE_NUMBER, PR_ENTRYID]);
				foreach ($contents as $content) {
					$change_num = IndexSqlite::get_gc_value((int) $content[PR_CHANGE_NUMBER]);
					if ($change_num > $last_cn) {
						if ($change_num > $max_cn) {
							$max_cn = $change_num;
						}
						$messages[] = [IndexSqlite::get_gc_value((int) $content[PR_MID]), $content[PR_ENTRYID]];
					}
				}
			}
			catch (Exception $e) {
				error_log("fail to refresh indexing sqlite, cannot load contents for folder " . $folder_id . " in " . $this->username . "'s store");

				return false;
			}
			$hierarchy[] = [$folder_id, $item[PR_LOCAL_COMMIT_TIME_MAX], $max_cn];
		}
		$stmt->close();

		$this->remove($messages);
		$this->precompile_insert();
		$count = count($messages);
		for ($i = 0; $i < $count; ++$i) {
			try {
				$message = mapi_msgstore_openentry($this->store, $messages[$i][1]);
				$this->insert_message($messages[$i][0], $message, $properties);
			}
			catch (Exception $e) {
				error_log("fail to insert message " . $messages[$i][0] . " into index sqlite for " . $this->username);

				continue;
			}
		}
		$this->finalize();
		$this->refresh_hierarchy($hierarchy);

		return true;
	}

	public function insert_message($message_id, $message, $properties) {
		$others_tags = [
			PR_DISPLAY_NAME,
			PR_DISPLAY_NAME_PREFIX,
			PR_HOME_TELEPHONE_NUMBER,
			PR_MOBILE_TELEPHONE_NUMBER,
			PR_BUSINESS_TELEPHONE_NUMBER,
			PR_BUSINESS_FAX_NUMBER,
			PR_ASSISTANT_TELEPHONE_NUMBER,
			PR_BUSINESS2_TELEPHONE_NUMBER,
			PR_CALLBACK_TELEPHONE_NUMBER,
			PR_CAR_TELEPHONE_NUMBER,
			PR_COMPANY_MAIN_PHONE_NUMBER,
			PR_HOME2_TELEPHONE_NUMBER,
			PR_HOME_FAX_NUMBER,
			PR_OTHER_TELEPHONE_NUMBER,
			PR_PAGER_TELEPHONE_NUMBER,
			PR_PRIMARY_FAX_NUMBER,
			PR_PRIMARY_TELEPHONE_NUMBER,
			PR_RADIO_TELEPHONE_NUMBER,
			PR_TELEX_NUMBER,
			PR_TTYTDD_PHONE_NUMBER, ];
		$proptags = array_merge(
			[PR_ENTRYID,
				PR_SENT_REPRESENTING_NAME,
				PR_SENT_REPRESENTING_SMTP_ADDRESS,
				PR_SUBJECT,
				PR_BODY,
				PR_HTML,
				PR_SENDER_NAME,
				PR_SENDER_SMTP_ADDRESS,
				PR_INTERNET_CPID,
				PR_RTF_COMPRESSED,
				PR_CHANGE_NUMBER,
				PR_FOLDER_ID,
				PR_MESSAGE_CLASS,
				PR_MESSAGE_DELIVERY_TIME,
				PR_LAST_MODIFICATION_TIME, ],
			array_values($properties)
		);
		$proptags = array_merge($proptags, $others_tags);
		$propvals = mapi_getprops($message, $proptags);
		$entryid = $propvals[PR_ENTRYID];
		$table = mapi_message_getrecipienttable($message);
		$recips = mapi_table_queryallrows($table, [PR_DISPLAY_NAME, PR_SMTP_ADDRESS]);
		$recipients_string = '';
		$first = true;
		foreach ($recips as $recip) {
			if (!$first) {
				$recipients_string .= "\n";
			}
			$first = false;
			if (isset($recip[PR_DISPLAY_NAME])) {
				$recipients_string .= $recip[PR_DISPLAY_NAME];
			}
			if (isset($recip[PR_SMTP_ADDRESS])) {
				$recipients_string .= "\n" . $recip[PR_SMTP_ADDRESS];
			}
		}
		$table = mapi_message_getattachmenttable($message);
		$attachments = mapi_table_queryallrows($table, [PR_ATTACH_LONG_FILENAME]);
		$attachments_string = '';
		$first = true;
		foreach ($attachments as $attach) {
			if (!$first) {
				$attachments_string .= "\n";
			}
			if (isset($attach[PR_ATTACH_LONG_FILENAME])) {
				$first = false;
				$attachments_string .= $attach[PR_ATTACH_LONG_FILENAME];
			}
		}
		$sending = null;
		if (isset($propvals[PR_SENT_REPRESENTING_NAME], $propvals[PR_SENT_REPRESENTING_SMTP_ADDRESS])) {
			$sending = $propvals[PR_SENT_REPRESENTING_NAME] . "\n" . $propvals[PR_SENT_REPRESENTING_SMTP_ADDRESS];
		}
		elseif (isset($propvals[PR_SENT_REPRESENTING_NAME])) {
			$sending = $propvals[PR_SENT_REPRESENTING_NAME];
		}
		elseif (isset($propvals[PR_SENT_REPRESENTING_SMTP_ADDRESS])) {
			$sending = "\n" . $propvals[PR_SENT_REPRESENTING_SMTP_ADDRESS];
		}
		$sender = null;
		if (isset($propvals[PR_SENDER_NAME], $propvals[PR_SENDER_SMTP_ADDRESS])) {
			$sender = $propvals[PR_SENDER_NAME] . "\n" . $propvals[PR_SENDER_SMTP_ADDRESS];
		}
		elseif (isset($propvals[PR_SENDER_NAME])) {
			$sender = $propvals[PR_SENDER_NAME];
		}
		elseif (isset($propvals[PR_SENDER_SMTP_ADDRESS])) {
			$sender = "\n" . $propvals[PR_SENDER_SMTP_ADDRESS];
		}
		$subject = null;
		if (isset($propvals[PR_SUBJECT])) {
			$subject = $propvals[PR_SUBJECT];
		}
		$html = null;
		if (isset($propvals[PR_HTML])) {
			$cpid = $propvals[PR_INTERNET_CPID];
			if (empty($cpid)) {
				$cpid = 1252;
			}
			$html = Conversion::convertCodepageStringToUtf8($cpid, $propvals[PR_HTML]);
		}
		if (!$html && isset($propvals[PR_RTF_COMPRESSED])) {
			$html = mapi_decompressrtf($propvals[PR_RTF_COMPRESSED]);
		}
		if ($html) {
			$body = strip_tags($html);
		}
		else {
			if (isset($propvals[PR_BODY])) {
				$body = $propvals[PR_BODY];
			}
		}
		$others = '';
		foreach ($properties as $name => $proptag) {
			if (isset($propvals[$proptag])) {
				if ($name == 'companies' || $name == 'categories') {
					$others .= implode("\n", $propvals[$proptag]) . "\n";
				}
				else {
					$others .= $propvals[$proptag] . "\n";
				}
			}
		}
		foreach ($others_tags as $proptag) {
			if (isset($propvals[$proptag])) {
				$others .= $propvals[$proptag] . "\n";
			}
		}
		if (empty($propvals[PR_MESSAGE_DELIVERY_TIME])) {
			$last_time = $propvals[PR_LAST_MODIFICATION_TIME];
		}
		else {
			$last_time = $propvals[PR_MESSAGE_DELIVERY_TIME];
		}
		if (empty($propvals[PR_FOLDER_ID]) ||
			empty($propvals[PR_CHANGE_NUMBER]) ||
			empty($propvals[PR_MESSAGE_CLASS])) {
			return;
		}
		$this->bind_insert(
			$sender,
			$sending,
			$recipients_string,
			$subject,
			$body,
			$attachments_string,
			$others,
			$message_id,
			$entryid,
			IndexSqlite::get_gc_value((int) $propvals[PR_CHANGE_NUMBER]),
			IndexSqlite::get_gc_value((int) $propvals[PR_FOLDER_ID]),
			$propvals[PR_MESSAGE_CLASS],
			$last_time
		);
	}

	private function precompile_insert() {
		$this->stmt = $this->prepare("INSERT INTO messages (sender, sending, recipients, subject, " .
			"content, attachments, others, message_id, attach_indexed, entryid, change_num, folder_id," .
			" message_class, date) VALUES (:sender, :sending, :recipients, :subject, :content, " .
			":attachments, :others, :message_id, :attach_indexed, :entryid, :change_num, :folder_id, " .
			":message_class, :date)");
		if (!$this->stmt) {
			error_log("fail to precompile the insert statement for messages table, " . $this->lastErrorMsg());

			return false;
		}
		$this->exec("BEGIN TRANSACTION");

		return true;
	}

	private function bind_insert(
		$sender,
		$sending,
		$recipients,
		$subject,
		$content,
		$attachments,
		$others,
		$message_id,
		$entryid,
		$change_num,
		$folder_id,
		$message_class,
		$date
	) {
		$this->stmt->clear();
		if (isset($sender)) {
			$this->stmt->bindValue(":sender", $sender, SQLITE3_TEXT);
		}
		else {
			$this->stmt->bindValue(":sender", $sender, SQLITE3_NULL);
		}
		if (isset($sending)) {
			$this->stmt->bindValue(":sending", $sending, SQLITE3_TEXT);
		}
		else {
			$this->stmt->bindValue(":sending", $sending, SQLITE3_NULL);
		}
		if (isset($recipients)) {
			$this->stmt->bindValue(":recipients", $recipients, SQLITE3_TEXT);
		}
		else {
			$this->stmt->bindValue(":recipients", $recipients, SQLITE3_NULL);
		}
		if (isset($subject)) {
			$this->stmt->bindValue(":subject", $subject, SQLITE3_TEXT);
		}
		else {
			$this->stmt->bindValue(":subject", $subject, SQLITE3_NULL);
		}
		if (isset($content)) {
			$this->stmt->bindValue(":content", $content, SQLITE3_TEXT);
		}
		else {
			$this->stmt->bindValue(":content", $content, SQLITE3_NULL);
		}
		if (isset($attachments)) {
			$this->stmt->bindValue(":attachments", $attachments, SQLITE3_TEXT);
		}
		else {
			$this->stmt->bindValue(":attachments", $attachments, SQLITE3_NULL);
		}
		if (isset($others)) {
			$this->stmt->bindValue(":others", $others, SQLITE3_TEXT);
		}
		else {
			$this->stmt->bindValue(":others", $others, SQLITE3_NULL);
		}
		$this->stmt->bindValue(":message_id", $message_id, SQLITE3_INTEGER);
		if (isset($attachments)) {
			$this->stmt->bindValue(":attach_indexed", 0, SQLITE3_INTEGER);
		}
		else {
			$this->stmt->bindValue(":attach_indexed", 1, SQLITE3_INTEGER);
		}
		$this->stmt->bindValue(":entryid", $entryid, SQLITE3_BLOB);
		$this->stmt->bindValue(":change_num", $change_num, SQLITE3_INTEGER);
		$this->stmt->bindValue(":folder_id", $folder_id, SQLITE3_INTEGER);
		$this->stmt->bindValue(":message_class", $message_class, SQLITE3_TEXT);
		$this->stmt->bindValue(":date", $date, SQLITE3_INTEGER);
		$this->stmt->execute();
	}

	private function finalize() {
		$this->exec("COMMIT TRANSACTION");
		$this->stmt->close();
		unset($this->stmt);
	}

	private function remove($deletion) {
		$stmt = $this->prepare("DELETE FROM messages WHERE message_id=:message_id");
		if (!$stmt) {
			error_log("fail to precompile the delete statement for messages table, " . $this->lastErrorMsg());

			return false;
		}
		$this->exec("BEGIN TRANSACTION");
		$count = count($deletion);
		for ($i = 0; $i < $count; ++$i) {
			$stmt->clear();
			$stmt->bindValue(":message_id", $deletion[$i][0], SQLITE3_INTEGER);
			$stmt->execute();
		}
		$this->exec("COMMIT TRANSACTION");

		return true;
	}

	private function refresh_hierarchy($hierarchy) {
		$stmt = $this->prepare("REPLACE INTO hierarchy (folder_id, commit_max, max_cn) VALUES (:folder_id, :commit_max, :max_cn)");
		$this->exec("BEGIN TRANSACTION");
		$count = count($hierarchy);
		for ($i = 0; $i < $count; ++$i) {
			$stmt->clear();
			$stmt->bindValue(":folder_id", $hierarchy[$i][0], SQLITE3_INTEGER);
			$stmt->bindValue(":commit_max", $hierarchy[$i][1], SQLITE3_INTEGER);
			$stmt->bindValue(":max_cn", $hierarchy[$i][2], SQLITE3_INTEGER);
			$stmt->execute();
		}
		$this->exec("COMMIT TRANSACTION");

		return true;
	}
}
