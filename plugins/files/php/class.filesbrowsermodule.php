<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

require_once "plugins/files/php/modules/class.fileslistmodule.php";

require_once __DIR__ . "/Files/Core/class.exception.php";
require_once __DIR__ . "/Files/Backend/class.exception.php";

require_once __DIR__ . "/Files/Core/class.accountstore.php";
require_once __DIR__ . "/Files/Backend/class.backendstore.php";

require_once __DIR__ . "/Files/Core/Util/class.arrayutil.php";
require_once __DIR__ . "/Files/Core/Util/class.logger.php";
require_once __DIR__ . "/Files/Core/Util/class.mapiexport.php";
require_once __DIR__ . "/Files/Core/Util/class.stringutil.php";
require_once __DIR__ . "/Files/Core/Util/class.pathutil.php";

require_once __DIR__ . "/vendor/autoload.php";

use Files\Backend\AbstractBackend;
use Files\Backend\Exception as BackendException;
use Files\Backend\iFeatureSharing;
use Files\Core\Account;
use Files\Core\Exception as AccountException;
use Files\Core\Util\ArrayUtil;
use Files\Core\Util\Logger as FilesLogger;
use Files\Core\Util\MapiExport;
use Files\Core\Util\PathUtil;
use Files\Core\Util\StringUtil;

/**
 * This module handles all list and change requests for the files browser.
 */
class FilesBrowserModule extends FilesListModule {
	public const LOG_CONTEXT = "FilesBrowserModule"; // Context for the Logger

	private const ACTION_HANDLERS = [
		"downloadtotmp" => "downloadSelectedFilesToTmp",
		"rename" => "rename",
		"uploadtobackend" => "uploadToBackend",
		"delete" => "delete",
		"list" => "loadFiles",
		"loadsharingdetails" => "getSharingInformation",
		"createnewshare" => "createNewShare",
		"updateexistingshare" => "updateExistingShare",
		"deleteexistingshare" => "deleteExistingShare",
		"updatecache" => "updateCache",
	];

	/**
	 * Creates the notifiers for this module,
	 * and register them to the Bus.
	 */
	public function createNotifiers() {
		$GLOBALS["bus"]->registerNotifier('fileshierarchynotifier', REQUEST_ENTRYID);
	}

	/**
	 * Executes all the actions in the $data variable.
	 * Exception part is used for authentication errors also.
	 *
	 * @return bool true on success or false on failure
	 */
	#[Override]
	public function execute() {
		$result = false;

		foreach ($this->data as $actionType => $actionData) {
			try {
				if (isset(self::ACTION_HANDLERS[$actionType])) {
					$result = $this->{self::ACTION_HANDLERS[$actionType]}($actionType, $actionData);

					continue;
				}

				switch ($actionType) {
					case "checkifexists":
						$records = $actionData["records"];
						$destination = $actionData["destination"] ?? false;
						$result = $this->checkIfExists($records, $destination);
						$response = [];
						$response['status'] = true;
						$response['duplicate'] = $result;
						$this->addActionData($actionType, $response);
						$GLOBALS["bus"]->addData($this->getResponseData());
						break;

					case "createdir":
						$this->save($actionData);
						$result = true;
						break;

					case "save":
						$result = $this->saveRecord($actionType, $actionData) ?? $result;
						break;

					default:
						$this->handleUnknownActionType($actionType);
				}
			}
			catch (MAPIException $e) {
				$this->sendFeedback(false, $this->errorDetailsFromException($e));
			}
			catch (AccountException $e) {
				$this->sendFeedback(false, [
					'type' => ERROR_GENERAL,
					'info' => [
						'title' => $e->getTitle(),
						'original_message' => $e->getMessage(),
						'display_message' => $e->getMessage(),
					],
				]);
			}
			catch (BackendException $e) {
				$this->sendFeedback(false, [
					'type' => ERROR_GENERAL,
					'info' => [
						'title' => $e->getTitle(),
						'original_message' => $e->getMessage(),
						'display_message' => $e->getMessage(),
						'code' => $e->getCode(),
					],
				]);
			}
			catch (Exception $e) {
				$this->sendFeedback(false, [
					'type' => ERROR_GENERAL,
					'info' => [
						'title' => _('Unknown error'),
						'original_message' => $e->getMessage(),
						'display_message' => $e->getMessage(),
						'code' => $e->getCode(),
					],
				]);
			}
		}

		return $result;
	}

	/**
	 * Handles the "save" action: move, rename or create a file/folder.
	 *
	 * @param string $actionType name of the current action
	 * @param array  $actionData all parameters contained in this request
	 *
	 * @return null|array|bool null when a share change was acknowledged without backend access
	 *
	 * @throws BackendException if the backend request fails
	 */
	private function saveRecord($actionType, $actionData) {
		if ((isset($actionData["props"]["sharedid"]) || isset($actionData["props"]["isshared"])) && (!isset($actionData["props"]["deleted"]) || !isset($actionData["props"]["message_size"]))) {
			// share changes need no backend interaction
			$response = [];
			$response['status'] = true;
			$folder = [];
			$folder[$actionData['entryid']] = [
				'props' => $actionData["props"],
				'entryid' => $actionData['entryid'],
				'store_entryid' => 'files',
				'parent_entryid' => $actionData['parent_entryid'],
			];

			$response['item'] = array_values($folder);
			$this->addActionData("update", $response);
			$GLOBALS["bus"]->addData($this->getResponseData());

			return null;
		}

		if (($actionData["message_action"]["action_type"] ?? null) === "move") {
			return $this->move($actionType, $actionData);
		}
		if (isset($actionData["entryid"])) {
			return $this->rename($actionType, $actionData);
		}

		return $this->save($actionData);
	}

	/**
	 * loads content of current folder - list of folders and files from Files.
	 *
	 * @param string $actionType name of the current action
	 * @param array  $actionData all parameters contained in this request
	 *
	 * @return bool
	 *
	 * @throws BackendException if the backend request fails
	 */
	public function loadFiles($actionType, $actionData) {
		$nodeId = $actionData['id'];
		$onlyFiles = $actionData['only_files'] ?? false;
		$response = [];
		$nodes = [];

		$accountID = $this->accountIDFromNode($nodeId);

		// check if we are in the ROOT (#R#). If so, display some kind of device/account view.
		if (empty($accountID) || !$this->accountStore->getAccount($accountID)) {
			$accounts = $this->accountStore->getAllAccounts();
			foreach ($accounts as $account) { // we have to load all accounts and their folders
				// skip accounts that are not valid
				if ($account->getStatus() != Account::STATUS_OK) {
					continue;
				}
				// build the real node id for this folder
				$realNodeId = $nodeId . $account->getId() . "/";

				$nodes[$realNodeId] = ['props' => [
					'id' => rawurldecode($realNodeId),
					'folder_id' => rawurldecode($realNodeId),
					'path' => $realNodeId,
					'filename' => $account->getName(),
					'message_size' => -1,
					'lastmodified' => -1,
					'message_class' => "IPM.Files",
					'type' => 0,
				],
					'entryid' => $this->createId($realNodeId),
					'store_entryid' => $this->createId($realNodeId),
					'parent_entryid' => $this->createId($realNodeId),
				];
			}
		}
		else {
			$account = $this->accountStore->getAccount($accountID);

			// initialize the backend
			$initializedBackend = $this->initializeBackend($account, true);

			$starttime = microtime(true);
			$nodes = $this->getFolderContent($nodeId, $initializedBackend, $onlyFiles);
			FilesLogger::debug(self::LOG_CONTEXT, "[loadfiles]: getFolderContent took: " . (microtime(true) - $starttime) . " seconds");

			$nodes = $this->sortFolderContent($nodes, $actionData, false);
		}

		$response["item"] = array_values($nodes);

		$response['page'] = ["start" => 0, "rowcount" => 50, "totalrowcount" => count($response["item"])];
		$response['folder'] = ["content_count" => count($response["item"]), "content_unread" => 0];

		$this->addActionData($actionType, $response);
		$GLOBALS["bus"]->addData($this->getResponseData());

		return true;
	}

	/**
	 * Forms the structure needed for frontend
	 * for the list of folders and files.
	 *
	 * @param string          $nodeId          the name of the current root directory
	 * @param AbstractBackend $backendInstance
	 * @param bool            $onlyFiles       if true, get only files
	 *
	 * @return array of nodes for current path folder
	 *
	 * @throws BackendException if the backend request fails
	 */
	public function getFolderContent($nodeId, $backendInstance, $onlyFiles = false) {
		$nodes = [];

		// relative node ID. We need to trim off the #R# and account ID
		$relNodeId = substr($nodeId, strpos($nodeId, '/'));
		$nodeIdPrefix = substr($nodeId, 0, strpos($nodeId, '/'));

		$accountID = $backendInstance->getAccountID();

		// remove the trailing slash for the cache key
		$cachePath = rtrim($relNodeId, '/');
		if ($cachePath === "") {
			$cachePath = "/";
		}

		$dir = $this->getCache($accountID, $cachePath);
		if (is_null($dir)) {
			$dir = $backendInstance->ls($relNodeId);
			$this->setCache($accountID, $cachePath, $dir);
		}

		// FIXME: There is an issue with getting sharing information from ownCloud.
		// check if backend supports sharing and load the information
		if ($backendInstance instanceof iFeatureSharing) {
			FilesLogger::debug(self::LOG_CONTEXT, "Checking for shared folders! ({$relNodeId})");

			$time_start = microtime(true);

			$sharingInfo = $backendInstance->getShares($relNodeId);
			$time_end = microtime(true);
			$time = $time_end - $time_start;

			FilesLogger::debug(self::LOG_CONTEXT, "Checking for shared took {$time} s!");
		}

		$sharedIds = [];
		foreach ($sharingInfo[$relNodeId] ?? [] as $sid => $sdetails) {
			$sharedIds[$sdetails["path"]][] = $sid;
		}

		if ($dir !== []) {
			$updateCache = false;
			foreach ($dir as $id => $node) {
				$type = FILES_FILE;

				if (strcmp((string) $node['resourcetype'], "collection") == 0) { // we have a folder
					$type = FILES_FOLDER;
				}

				if ($type === FILES_FOLDER && $onlyFiles) {
					continue;
				}

				// Check if folder names have a trailing slash, if not, add one!
				if ($type === FILES_FOLDER && !StringUtil::endsWith($id, "/")) {
					$id .= "/";
				}

				$realID = $nodeIdPrefix . $id;

				FilesLogger::debug(self::LOG_CONTEXT, "parsing: " . $id . " in base: " . $nodeId);

				$filename = stringToUTF8Encode(basename((string) $id));

				$size = $node['getcontentlength'] === null ? -1 : intval($node['getcontentlength']);
				$size = $type == FILES_FOLDER ? -1 : $size; // Folders do not have a size

				$fileid = $node['fileid'] === "-1" ? -1 : intval($node['fileid']);

				$sharedid = $sharedIds[rtrim((string) $id, "/")] ?? [];
				$shared = $sharedid !== [];

				$nodeId = stringToUTF8Encode($id);
				$dirName = dirname($nodeId, 1);
				if ($dirName === '/') {
					$path = stringToUTF8Encode($nodeIdPrefix . $dirName);
				}
				else {
					$path = stringToUTF8Encode($nodeIdPrefix . $dirName . '/');
				}

				if (!isset($node['entryid'], $node['parent_entryid'], $node['store_entryid'])) {
					$entryid = $this->createId($realID);
					$parentEntryid = $this->createId($path);
					$storeEntryid = $this->createId($nodeIdPrefix . '/');

					$dir[$id]['entryid'] = $entryid;
					$dir[$id]['parent_entryid'] = $parentEntryid;
					$dir[$id]['store_entryid'] = $storeEntryid;

					$updateCache = true;
				}
				else {
					$entryid = $node['entryid'];
					$parentEntryid = $node['parent_entryid'];
					$storeEntryid = $node['store_entryid'];
				}

				$nodes[$nodeId] = ['props' => [
					'folder_id' => stringToUTF8Encode($realID),
					'fileid' => $fileid,
					'path' => $path,
					'filename' => $filename,
					'message_size' => $size,
					'lastmodified' => strtotime((string) $node['getlastmodified']) * 1000,
					'message_class' => "IPM.Files",
					'isshared' => $shared,
					'sharedid' => $sharedid,
					'object_type' => $type,
					'type' => $type,
				],
					'entryid' => $entryid,
					'parent_entryid' => $parentEntryid,
					'store_entryid' => $storeEntryid,
				];
			}

			// Update the cache.
			if ($updateCache) {
				$this->setCache($accountID, $cachePath, $dir);
			}
		}
		else {
			FilesLogger::debug(self::LOG_CONTEXT, "dir was empty");
		}

		return $nodes;
	}

	/**
	 * This functions sorts an array of nodes.
	 *
	 * @param array $nodes   array of nodes to sort
	 * @param array $data    all parameters contained in the request
	 * @param bool  $navtree parse for navtree or browser
	 *
	 * @return array of sorted nodes
	 */
	public function sortFolderContent($nodes, $data, $navtree = false) {
		$sortednodes = [];

		$sortkey = "filename";
		$sortdir = "ASC";

		if (isset($data['sort'])) {
			$sortkey = $data['sort'][0]['field'];
			$sortdir = $data['sort'][0]['direction'];
		}

		FilesLogger::debug(self::LOG_CONTEXT, "sorting by " . $sortkey . " in direction: " . $sortdir);

		if ($navtree) {
			$sortednodes = ArrayUtil::sort_by_key($nodes, $sortkey, $sortdir);
		}
		else {
			$sortednodes = ArrayUtil::sort_props_by_key($nodes, $sortkey, $sortdir);
		}

		return $sortednodes;
	}

	/**
	 * Deletes the selected files on the backend server.
	 *
	 * @param string $actionType name of the current action
	 * @param array  $actionData all parameters contained in this request
	 *
	 * @return bool
	 *
	 * @throws BackendException if the backend request fails
	 */
	private function delete($actionType, $actionData) {
		// TODO: function is duplicate of class.hierarchylistmodule.php of delete function.
		$result = false;
		if (isset($actionData['records']) && is_array($actionData['records'])) {
			$response = [];
			foreach ($actionData['records'] as $record) {
				$nodeId = $record['folder_id'];
				$relNodeId = substr((string) $nodeId, strpos((string) $nodeId, '/'));

				$account = $this->accountFromNode($nodeId);

				// initialize the backend
				$initializedBackend = $this->initializeBackend($account);

				$result = $initializedBackend->delete($relNodeId);
				FilesLogger::debug(self::LOG_CONTEXT, "deleted: " . $nodeId . ", worked: " . $result);

				// clear the cache
				$this->deleteCache($account->getId(), dirname($relNodeId));
				$GLOBALS["bus"]->notify(REQUEST_ENTRYID, OBJECT_DELETE, [
					"id" => $nodeId,
					"folder_id" => $nodeId,
					"entryid" => $record['entryid'],
					"parent_entryid" => $record["parent_entryid"],
					"store_entryid" => $record["store_entryid"],
				]);
			}

			$response['status'] = true;
			$this->addActionData($actionType, $response);
			$GLOBALS["bus"]->addData($this->getResponseData());
		}
		else {
			$nodeId = $actionData['folder_id'];

			$relNodeId = substr((string) $nodeId, strpos((string) $nodeId, '/'));
			$response = [];

			$account = $this->accountFromNode($nodeId);
			$accountId = $account->getId();
			// initialize the backend
			$initializedBackend = $this->initializeBackend($account);

			$result = false;
			try {
				$result = $initializedBackend->delete($relNodeId);
			}
			catch (BackendException) {
				// TODO: this might fails because the file was already deleted.
				// fire error message if any other error occurred.
				FilesLogger::debug(self::LOG_CONTEXT, "deleted a directory that was no longer available");
			}
			FilesLogger::debug(self::LOG_CONTEXT, "deleted: " . $nodeId . ", worked: " . $result);

			// Get old cached data.
			$cachedDir = $this->getCache($accountId, dirname($relNodeId));
			if (isset($cachedDir[$relNodeId]) && !empty($cachedDir[$relNodeId])) {
				// Delete the folder from cached data.
				unset($cachedDir[$relNodeId]);
			}

			// clear the cache of parent directory.
			$this->deleteCache($accountId, dirname($relNodeId));
			// clear the cache of selected directory.
			$this->deleteCache($accountId, rtrim($relNodeId, '/'));

			// Set data in cache.
			$this->setCache($accountId, dirname($relNodeId), $cachedDir);

			$response['status'] = $result ? true : false;
			$this->addActionData($actionType, $response);
			$GLOBALS["bus"]->addData($this->getResponseData());

			$GLOBALS["bus"]->notify(REQUEST_ENTRYID, OBJECT_DELETE, [
				"entryid" => $actionData["entryid"],
				"parent_entryid" => $actionData["parent_entryid"],
				"store_entryid" => $actionData["store_entryid"],
			]);
		}

		return true;
	}

	/**
	 * Moves the selected files on the backend server.
	 *
	 * @param string $actionType name of the current action
	 * @param array  $actionData all parameters contained in this request
	 *
	 * @return bool if the backend request failed
	 */
	private function move($actionType, $actionData) {
		$response = [];
		$dst = rtrim((string) $actionData['message_action']["destination_folder_id"], '/');

		$overwrite = $actionData['message_action']["overwrite"] ?? true;
		$isFolder = $actionData['message_action']["isFolder"] ?? false;

		$pathPostfix = "";
		if (str_ends_with((string) $actionData['folder_id'], '/')) {
			$pathPostfix = "/"; // we have a folder...
		}

		$source = rtrim((string) $actionData['folder_id'], '/');
		$fileName = basename($source);
		$destination = $dst . '/' . basename($source);

		// get dst and source account ids
		// currently only moving within one account is supported
		$srcAccountID = substr((string) $actionData['folder_id'], 3, strpos((string) $actionData['folder_id'], '/') - 3); // parse account id from node id
		$dstAccountID = substr((string) $actionData['message_action']["destination_folder_id"], 3, strpos((string) $actionData['message_action']["destination_folder_id"], '/') - 3); // parse account id from node id

		if ($srcAccountID !== $dstAccountID) {
			$this->sendFeedback(false, [
				'type' => ERROR_GENERAL,
				'info' => [
					'title' => _("Files Plugin"),
					'original_message' => _("Moving between accounts is not implemented"),
					'display_message' => _("Moving between accounts is not implemented"),
				],
			]);

			return false;
		}
		$relDst = substr($destination, strpos($destination, '/'));
		$relSrc = substr($source, strpos($source, '/'));

		$account = $this->accountFromNode($source);

		// initialize the backend
		$initializedBackend = $this->initializeBackend($account);

		$result = $initializedBackend->move($relSrc, $relDst, $overwrite);

		$actionId = $account->getId();
		// clear the cache
		$this->deleteCache($actionId, dirname($relDst));

		$cachedFolderName = $relSrc . $pathPostfix;
		$this->deleteCache($actionId, $cachedFolderName);

		$cached = $this->getCache($actionId, dirname($relSrc));
		$this->deleteCache($actionId, dirname($relSrc));

		if (isset($cached[$cachedFolderName]) && !empty($cached[$cachedFolderName])) {
			unset($cached[$cachedFolderName]);
			$this->setCache($actionId, dirname($relSrc), $cached);
		}

		$response['status'] = !$result ? false : true;

		/* create the response object */
		$folder = [
			'props' => [
				'folder_id' => ($destination . $pathPostfix),
				'path' => $actionData['message_action']["destination_folder_id"],
				'filename' => $fileName,
				'display_name' => $fileName,
				'object_type' => $isFolder ? FILES_FOLDER : FILES_FILE,
				'deleted' => !$result ? false : true,
			],
			'entryid' => $this->createId($destination . $pathPostfix),
			'store_entryid' => $actionData['store_entryid'],
			'parent_entryid' => $actionData['message_action']['parent_entryid'],
		];

		$response['item'] = $folder;

		$this->addActionData("update", $response);
		$GLOBALS["bus"]->addData($this->getResponseData());

		// Notify hierarchy only when folder was moved.
		if ($isFolder) {
			// Send notification to delete folder node in hierarchy.
			$GLOBALS["bus"]->notify(REQUEST_ENTRYID, OBJECT_DELETE, [
				"entryid" => $actionData["entryid"],
				"parent_entryid" => $actionData["parent_entryid"],
				"store_entryid" => $actionData["store_entryid"],
			]);

			// Send notification to create new folder node in hierarchy.
			$GLOBALS["bus"]->notify(REQUEST_ENTRYID, OBJECT_SAVE, $folder);
		}

		return true;
	}

	/**
	 * Renames the selected file on the backend server.
	 *
	 * @param string $actionType name of the current action
	 * @param array  $actionData all parameters contained in this request
	 *
	 * @return bool
	 *
	 * @throws BackendException if the backend request fails
	 */
	public function rename($actionType, $actionData) {
		$messageProps = $this->save($actionData);
		$notifySubFolders = $actionData['message_action']['isFolder'] ?? str_ends_with((string) ($actionData['message_action']['source_folder_id'] ?? ''), '/');
		if (!empty($messageProps)) {
			$GLOBALS["bus"]->notify(REQUEST_ENTRYID, OBJECT_SAVE, $messageProps);
			if ($notifySubFolders) {
				$this->notifySubFolders($messageProps["props"]["folder_id"]);
			}
		}

		return !empty($messageProps);
	}

	/**
	 * Check if given filename or folder already exists on server.
	 *
	 * @param array        $records     which needs to be check for existence
	 * @param false|string $destination destination node ID, or false to use the records' folder
	 *
	 * @return bool True if duplicate found, false otherwise
	 *
	 * @throws BackendException if the backend request fails
	 */
	private function checkIfExists($records, $destination) {
		$duplicate = false;

		if (is_array($records) && $records !== []) {
			if ($destination === false) {
				$destination = reset($records);
				$destination = $destination["id"]; // we can only check files in the same folder, so one request will be enough
				FilesLogger::debug(self::LOG_CONTEXT, "Resetting destination to check.");
			}
			FilesLogger::debug(self::LOG_CONTEXT, "Checking: " . $destination);
			$account = $this->accountFromNode($destination);

			// initialize the backend
			$initializedBackend = $this->initializeBackend($account);

			$relDirname = substr((string) $destination, strpos((string) $destination, '/'));
			FilesLogger::debug(self::LOG_CONTEXT, "Getting content for: " . $relDirname);

			try {
				$lsdata = $initializedBackend->ls($relDirname); // we can only check files in the same folder, so one request will be enough
			}
			catch (Exception) {
				// ignore - if file not found -> does not exist :)
			}
			if (isset($lsdata) && is_array($lsdata)) {
				$existing = [];
				foreach ($lsdata as $argsid => $args) {
					$existing[basename($argsid) . "\0" . (int) ((string) $args['resourcetype'] === "collection")] ??= $argsid;
				}
				foreach ($records as $record) {
					$relRecId = substr((string) $record["id"], strpos((string) $record["id"], '/'));
					FilesLogger::debug(self::LOG_CONTEXT, "Checking rec: " . $relRecId);
					$key = basename($relRecId) . "\0" . (int) (bool) $record["isFolder"];
					if (isset($existing[$key])) {
						FilesLogger::debug(self::LOG_CONTEXT, ($record["isFolder"] ? "Duplicate folder found: " : "Duplicate file found: ") . $existing[$key]);
						FilesLogger::debug(self::LOG_CONTEXT, "Duplicate entry: " . $relRecId);
						$duplicate = true;
						break;
					}
				}
			}
		}

		return $duplicate;
	}

	/**
	 * Downloads file from the Files service and saves it in tmp
	 * folder with unique name.
	 *
	 * @param array $actionData
	 * @param mixed $actionType
	 *
	 * @return bool true after the downloaded files have been registered
	 *
	 * @throws BackendException if the backend request fails
	 */
	private function downloadSelectedFilesToTmp($actionType, $actionData) {
		$ids = $actionData['ids'];
		$dialogAttachmentId = $actionData['dialog_attachments'];
		$response = [];

		$attachment_state = new AttachmentState();
		$downloaded = [];

		$account = $this->accountFromNode($ids[0]);

		// initialize the backend
		$initializedBackend = $this->initializeBackend($account);

		// Download without the attachment state lock: the backend transfer must not
		// stall attachment uploads and message saves elsewhere in the session.
		foreach ($ids as $file) {
			$filename = basename((string) $file);
			$tmpname = $attachment_state->getAttachmentTmpPath($filename);

			// download file from the backend
			$relRecId = substr((string) $file, strpos((string) $file, '/'));
			$initializedBackend->get_file($relRecId, $tmpname);

			$filesize = filesize($tmpname);

			FilesLogger::debug(self::LOG_CONTEXT, "Downloading: " . $filename . " to: " . $tmpname);

			$attach_id = uniqid();
			$response['items'][] = [
				'name' => $filename,
				'size' => $filesize,
				"attach_id" => $attach_id,
				'tmpname' => PathUtil::getFilenameFromPath($tmpname),
			];

			$downloaded[PathUtil::getFilenameFromPath($tmpname)] = [
				"name" => $filename,
				"size" => $filesize,
				"type" => PathUtil::get_mime($tmpname),
				"attach_id" => $attach_id,
				"sourcetype" => 'default',
			];

			FilesLogger::debug(self::LOG_CONTEXT, "filesize: " . $filesize);
		}

		$attachment_state->open();
		foreach ($downloaded as $tmpname => $fileinfo) {
			$attachment_state->addAttachmentFile($dialogAttachmentId, $tmpname, $fileinfo);
		}
		$attachment_state->close();
		$response['status'] = true;
		$this->addActionData($actionType, $response);
		$GLOBALS["bus"]->addData($this->getResponseData());

		return true;
	}

	/**
	 * upload the tempfile to files.
	 *
	 * @param array $actionData
	 * @param mixed $actionType
	 *
	 * @return bool true when every file was prepared and uploaded
	 *
	 * @throws BackendException if the backend request fails
	 */
	private function uploadToBackend($actionType, $actionData) {
		FilesLogger::debug(self::LOG_CONTEXT, "preparing attachment");

		$account = $this->accountFromNode($actionData["destdir"]);

		// initialize the backend
		$initializedBackend = $this->initializeBackend($account);

		$result = true;
		$failure = null;

		$export = match ($actionData["type"]) {
			"attachment" => MapiExport::attachmentToTempFile(...),
			"mail" => MapiExport::messageToTempFile(...),
			default => null,
		};

		if ($export !== null) {
			foreach ($actionData["items"] as $item) {
				$prepared = $export($item);
				if ($prepared === false) {
					$result = false;

					continue;
				}
				[$tmpname, $filename] = $prepared;

				$dirName = substr((string) $actionData["destdir"], strpos((string) $actionData["destdir"], '/'));
				$filePath = $dirName . $filename;

				FilesLogger::debug(self::LOG_CONTEXT, "Uploading to: " . $filePath . " tmpfile: " . $tmpname);

				try {
					$uploaded = $initializedBackend->put_file($filePath, $tmpname);
				}
				catch (BackendException $e) {
					// reported after the remaining files
					$failure ??= $e;
					$uploaded = false;
				}
				finally {
					if (!@unlink($tmpname)) {
						FilesLogger::error(self::LOG_CONTEXT, "Unable to remove temporary file: " . $tmpname);
					}
				}
				if (!$uploaded) {
					$result = false;

					continue;
				}

				$this->updateDirCache($initializedBackend, $dirName, $filePath, $actionData);
			}
			if ($failure !== null) {
				throw $failure;
			}
		}
		else {
			$this->sendFeedback(false, [
				'type' => ERROR_GENERAL,
				'info' => [
					'title' => _("Files plugin"),
					'original_message' => _("Unknown type - cannot save this file to the Files backend!"),
					'display_message' => _("Unknown type - cannot save this file to the Files backend!"),
				],
			]);

			return false;
		}

		$response = [];
		$response['status'] = $result;
		$this->addActionData($actionType, $response);
		$GLOBALS["bus"]->addData($this->getResponseData());

		return $result;
	}

	/**
	 * Update the cache of selected directory.
	 *
	 * @param AbstractBackend $backendInstance
	 * @param string          $dirName         The directory name
	 * @param                 $filePath        The file path
	 * @param                 $actionData      The action data
	 *
	 * @throws BackendException
	 */
	public function updateDirCache($backendInstance, $dirName, $filePath, $actionData) {
		$cachePath = rtrim($dirName, '/');
		if ($cachePath === "") {
			$cachePath = "/";
		}

		$dir = $backendInstance->ls($cachePath);
		$accountID = $this->accountIDFromNode($actionData["destdir"]);
		$cacheDir = $this->getCache($accountID, $cachePath);
		$cacheDir[$filePath] = $dir[$filePath];
		$this->setCache($accountID, $cachePath, $cacheDir);
	}

	/**
	 * Get sharing information from the backend.
	 *
	 * @param mixed $actionType
	 * @param mixed $actionData
	 *
	 * @return bool
	 */
	private function getSharingInformation($actionType, $actionData) {
		$response = [];
		$records = $actionData["records"];

		if (count($records) < 1) {
			$this->sendFeedback(false, [
				'type' => ERROR_GENERAL,
				'info' => [
					'title' => _("Files Plugin"),
					'original_message' => _("No record given!"),
					'display_message' => _("No record given!"),
				],
			]);

			return false;
		}

		$account = $this->accountFromNode($records[0]);

		// initialize the backend
		$initializedBackend = $this->initializeBackend($account);

		$relRecords = [];
		foreach ($records as $record) {
			$relRecords[] = substr((string) $record, strpos((string) $record, '/')); // remove account id
		}

		try {
			$sInfo = $initializedBackend->sharingDetails($relRecords);
		}
		catch (Exception $e) {
			$response = [];
			$response['status'] = false;
			$response['header'] = _('Fetching sharing information failed');
			$response['message'] = $e->getMessage();
			$this->addActionData("error", $response);
			$GLOBALS["bus"]->addData($this->getResponseData());

			return false;
		}

		$sharingInfo = [];
		foreach ($sInfo as $path => $details) {
			$realPath = "#R#" . $account->getId() . $path;
			$sharingInfo[$realPath] = $details; // add account id again
		}

		$response['status'] = true;
		$response['shares'] = $sharingInfo;
		$this->addActionData($actionType, $response);
		$GLOBALS["bus"]->addData($this->getResponseData());

		return true;
	}

	/**
	 * Create a new share.
	 *
	 * @param mixed $actionType
	 * @param mixed $actionData
	 *
	 * @return bool
	 */
	private function createNewShare($actionType, $actionData) {
		$records = $actionData["records"];
		$shareOptions = $actionData["options"];

		if (count($records) < 1) {
			$this->sendFeedback(false, [
				'type' => ERROR_GENERAL,
				'info' => [
					'title' => _("Files Plugin"),
					'original_message' => _("No record given!"),
					'display_message' => _("No record given!"),
				],
			]);

			return false;
		}

		$account = $this->accountFromNode($records[0]);

		// initialize the backend
		$initializedBackend = $this->initializeBackend($account);

		$sharingRecords = [];
		foreach ($records as $record) {
			$path = substr((string) $record, strpos((string) $record, '/')); // remove account id
			$sharingRecords[$path] = $shareOptions; // add options
		}

		try {
			$sInfo = $initializedBackend->share($sharingRecords);
		}
		catch (Exception $e) {
			$response = [];
			$response['status'] = false;
			$response['header'] = _('Sharing failed');
			$response['message'] = $e->getMessage();
			$this->addActionData("error", $response);
			$GLOBALS["bus"]->addData($this->getResponseData());

			return false;
		}

		$sharingInfo = [];
		foreach ($sInfo as $path => $details) {
			$realPath = "#R#" . $account->getId() . $path;
			$sharingInfo[$realPath] = $details; // add account id again
		}

		$response = [];
		$response['status'] = true;
		$response['shares'] = $sharingInfo;
		$this->addActionData($actionType, $response);
		$GLOBALS["bus"]->addData($this->getResponseData());

		return true;
	}

	/**
	 * Update a existing share.
	 *
	 * @param mixed $actionType
	 * @param mixed $actionData
	 *
	 * @return bool
	 */
	private function updateExistingShare($actionType, $actionData) {
		$records = $actionData["records"];
		$accountID = $actionData["accountid"];
		$shareOptions = $actionData["options"];

		if (count($records) < 1) {
			$this->sendFeedback(false, [
				'type' => ERROR_GENERAL,
				'info' => [
					'title' => _("Files Plugin"),
					'original_message' => _("No record given!"),
					'display_message' => _("No record given!"),
				],
			]);

			return false;
		}

		$account = $this->accountFromId($accountID);

		// initialize the backend
		$initializedBackend = $this->initializeBackend($account);

		$sharingRecords = [];
		foreach ($records as $record) {
			$sharingRecords[$record] = $shareOptions; // add options
		}

		try {
			$sInfo = $initializedBackend->share($sharingRecords, true);
		}
		catch (Exception $e) {
			$response = [];
			$response['status'] = false;
			$response['header'] = _('Updating share failed');
			$response['message'] = $e->getMessage();
			$this->addActionData("error", $response);
			$GLOBALS["bus"]->addData($this->getResponseData());

			return false;
		}

		$response = [];
		$response['status'] = true;
		$response['shares'] = $sInfo;
		$this->addActionData($actionType, $response);
		$GLOBALS["bus"]->addData($this->getResponseData());

		return true;
	}

	/**
	 * Delete one or more shares.
	 *
	 * @param mixed $actionType
	 * @param mixed $actionData
	 *
	 * @return bool
	 */
	private function deleteExistingShare($actionType, $actionData) {
		$records = $actionData["records"];
		$accountID = $actionData["accountid"];

		if (count($records) < 1) {
			$this->sendFeedback(false, [
				'type' => ERROR_GENERAL,
				'info' => [
					'title' => _("Files Plugin"),
					'original_message' => _("No record given!"),
					'display_message' => _("No record given!"),
				],
			]);

			return false;
		}

		$account = $this->accountFromId($accountID);

		// initialize the backend
		$initializedBackend = $this->initializeBackend($account);

		try {
			$initializedBackend->unshare($records);
		}
		catch (Exception $e) {
			$response = [];
			$response['status'] = false;
			$response['header'] = _('Deleting share failed');
			$response['message'] = $e->getMessage();
			$this->addActionData("error", $response);
			$GLOBALS["bus"]->addData($this->getResponseData());

			return false;
		}

		$response = [];
		$response['status'] = true;
		$this->addActionData($actionType, $response);
		$GLOBALS["bus"]->addData($this->getResponseData());

		return true;
	}

	/**
	 * Function will use to update the cache.
	 *
	 * @param string $actionType name of the current action
	 * @param array  $actionData all parameters contained in this request
	 *
	 * @return bool true on success or false on failure
	 */
	public function updateCache($actionType, $actionData) {
		$nodeId = $actionData['id'];
		$accountID = $this->accountIDFromNode($nodeId);
		$account = $this->accountFromId($accountID);
		// initialize the backend
		$initializedBackend = $this->initializeBackend($account, true);
		$relNodeId = substr((string) $nodeId, strpos((string) $nodeId, '/'));

		// remove the trailing slash for the cache key
		$cachePath = rtrim($relNodeId, '/');
		if ($cachePath === "") {
			$cachePath = "/";
		}
		$dir = $initializedBackend->ls($relNodeId);
		$this->setCache($accountID, $cachePath, $dir);

		$response = [];
		$response['status'] = true;
		$this->addActionData($actionType, $response);
		$GLOBALS["bus"]->addData($this->getResponseData());

		return true;
	}
}
