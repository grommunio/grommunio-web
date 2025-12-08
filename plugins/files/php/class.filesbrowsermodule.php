<?php

require_once "plugins/files/php/modules/class.fileslistmodule.php";

require_once __DIR__ . "/Files/Core/class.exception.php";
require_once __DIR__ . "/Files/Backend/class.exception.php";

require_once __DIR__ . "/Files/Core/class.accountstore.php";
require_once __DIR__ . "/Files/Backend/class.backendstore.php";

require_once __DIR__ . "/Files/Core/Util/class.arrayutil.php";
require_once __DIR__ . "/Files/Core/Util/class.logger.php";
require_once __DIR__ . "/Files/Core/Util/class.stringutil.php";
require_once __DIR__ . "/Files/Core/Util/class.pathutil.php";

require_once __DIR__ . "/vendor/autoload.php";

use Files\Backend\AbstractBackend;
use Files\Backend\BackendStore;
use Files\Backend\Exception as BackendException;
use Files\Backend\iFeatureSharing;
use Files\Core\Account;
use Files\Core\Exception as AccountException;
use Files\Core\Util\ArrayUtil;
use Files\Core\Util\Logger;
use Files\Core\Util\PathUtil;
use Files\Core\Util\StringUtil;

/**
 * This module handles all list and change requests for the files browser.
 *
 * @class FilesBrowserModule
 *
 * @extends ListModule
 */
class FilesBrowserModule extends FilesListModule {
	public const LOG_CONTEXT = "FilesBrowserModule"; // Context for the Logger

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
			if (isset($actionType)) {
				try {
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

						case "downloadtotmp":
							$result = $this->downloadSelectedFilesToTmp($actionType, $actionData);
							break;

						case "createdir":
							$this->save($actionData);
							$result = true;
							break;

						case "rename":
							$result = $this->rename($actionType, $actionData);
							break;

						case "uploadtobackend":
							$result = $this->uploadToBackend($actionType, $actionData);
							break;

						case "save":
							if ((isset($actionData["props"]["sharedid"]) || isset($actionData["props"]["isshared"])) && (!isset($actionData["props"]["deleted"]) || !isset($actionData["props"]["message_size"]))) {
								// JUST IGNORE THIS REQUEST - we don't need to interact with the backend if a share was changed
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

								break;
							}

							/*
							 * The "message_action" object has been set, check the action_type field for
							 * the exact action which must be taken.
							 * Supported actions:
							 *   - move: move record to new folder
							 */
							if (isset($actionData["message_action"], $actionData["message_action"]["action_type"])) {
								switch ($actionData["message_action"]["action_type"]) {
									case "move" :
										$result = $this->move($actionType, $actionData);
										break;

									default:
										// check if we should create something new or edit an existing file/folder
										if (isset($actionData["entryid"])) {
											$result = $this->rename($actionType, $actionData);
										}
										else {
											$result = $this->save($actionData);
										}
										break;
								}
							}
							else {
								// check if we should create something new or edit an existing file/folder
								if (isset($actionData["entryid"])) {
									$result = $this->rename($actionType, $actionData);
								}
								else {
									$result = $this->save($actionData);
								}
							}
							break;

						case "delete":
							$result = $this->delete($actionType, $actionData);
							break;

						case "list":
							$result = $this->loadFiles($actionType, $actionData);
							break;

						case "loadsharingdetails":
							$result = $this->getSharingInformation($actionType, $actionData);
							break;

						case "createnewshare":
							$result = $this->createNewShare($actionType, $actionData);
							break;

						case "updateexistingshare":
							$result = $this->updateExistingShare($actionType, $actionData);
							break;

						case "deleteexistingshare":
							$result = $this->deleteExistingShare($actionType, $actionData);
							break;

						case "updatecache":
							$result = $this->updateCache($actionType, $actionData);
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
			}
		}

		return $result;
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
			Logger::debug(self::LOG_CONTEXT, "[loadfiles]: getFolderContent took: " . (microtime(true) - $starttime) . " seconds");

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

		// FIXME: There is something issue with getting sharing information from owncloud.
		// check if backend supports sharing and load the information
		if ($backendInstance->supports(BackendStore::FEATURE_SHARING)) {
			Logger::debug(self::LOG_CONTEXT, "Checking for shared folders! ({$relNodeId})");

			$time_start = microtime(true);

			/** @var iFeatureSharing $backendInstance */
			$sharingInfo = $backendInstance->getShares($relNodeId);
			$time_end = microtime(true);
			$time = $time_end - $time_start;

			Logger::debug(self::LOG_CONTEXT, "Checking for shared took {$time} s!");
		}

		if ($dir) {
			$updateCache = false;
			foreach ($dir as $id => $node) {
				$type = FILES_FILE;

				if (strcmp((string) $node['resourcetype'], "collection") == 0) { // we have a folder
					$type = FILES_FOLDER;
				}

				if ($type === FILES_FOLDER && $onlyFiles) {
					continue;
				}

				// Check if foldernames have a trailing slash, if not, add one!
				if ($type === FILES_FOLDER && !StringUtil::endsWith($id, "/")) {
					$id .= "/";
				}

				$realID = $nodeIdPrefix . $id;

				Logger::debug(self::LOG_CONTEXT, "parsing: " . $id . " in base: " . $nodeId);

				$filename = stringToUTF8Encode(basename((string) $id));

				$size = $node['getcontentlength'] === null ? -1 : intval($node['getcontentlength']);
				$size = $type == FILES_FOLDER ? -1 : $size; // folder's dont have a size

				$fileid = $node['fileid'] === "-1" ? -1 : intval($node['fileid']);

				$shared = false;
				$sharedid = [];
				if (isset($sharingInfo) && count($sharingInfo[$relNodeId]) > 0) {
					foreach ($sharingInfo[$relNodeId] as $sid => $sdetails) {
						if ($sdetails["path"] == rtrim((string) $id, "/")) {
							$shared = true;
							$sharedid[] = $sid;
						}
					}
				}

				$nodeId = stringToUTF8Encode($id);
				$dirName = dirname($nodeId, 1);
				if ($dirName === '/') {
					$path = stringToUTF8Encode($nodeIdPrefix . $dirName);
				}
				else {
					$path = stringToUTF8Encode($nodeIdPrefix . $dirName . '/');
				}

				if (!isset($node['entryid']) || !isset($node['parent_entryid']) || !isset($node['store_entryid'])) {
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
			Logger::debug(self::LOG_CONTEXT, "dir was empty");
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

		Logger::debug(self::LOG_CONTEXT, "sorting by " . $sortkey . " in direction: " . $sortdir);

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
			foreach ($actionData['records'] as $record) {
				$nodeId = $record['folder_id'];
				$relNodeId = substr((string) $nodeId, strpos((string) $nodeId, '/'));

				$account = $this->accountFromNode($nodeId);

				// initialize the backend
				$initializedBackend = $this->initializeBackend($account);

				$result = $initializedBackend->delete($relNodeId);
				Logger::debug(self::LOG_CONTEXT, "deleted: " . $nodeId . ", worked: " . $result);

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

			try {
				$result = $initializedBackend->delete($relNodeId);
			}
			catch (BackendException) {
				// TODO: this might fails because the file was already deleted.
				// fire error message if any other error occurred.
				Logger::debug(self::LOG_CONTEXT, "deleted a directory that was no longer available");
			}
			Logger::debug(self::LOG_CONTEXT, "deleted: " . $nodeId . ", worked: " . $result);

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
		$notifySubFolders = $actionData['message_action']['isFolder'] ?? true;
		if (!empty($messageProps)) {
			$GLOBALS["bus"]->notify(REQUEST_ENTRYID, OBJECT_SAVE, $messageProps);
			if ($notifySubFolders) {
				$this->notifySubFolders($messageProps["props"]["folder_id"]);
			}
		}
	}

	/**
	 * Check if given filename or folder already exists on server.
	 *
	 * @param array $records     which needs to be check for existence
	 * @param array $destination where the given records needs to be moved, uploaded, or renamed
	 *
	 * @return bool True if duplicate found, false otherwise
	 *
	 * @throws BackendException if the backend request fails
	 */
	private function checkIfExists($records, $destination) {
		$duplicate = false;

		if (isset($records) && is_array($records)) {
			if (!isset($destination) || $destination == false) {
				$destination = reset($records);
				$destination = $destination["id"]; // we can only check files in the same folder, so one request will be enough
				Logger::debug(self::LOG_CONTEXT, "Resetting destination to check.");
			}
			Logger::debug(self::LOG_CONTEXT, "Checking: " . $destination);
			$account = $this->accountFromNode($destination);

			// initialize the backend
			$initializedBackend = $this->initializeBackend($account);

			$relDirname = substr((string) $destination, strpos((string) $destination, '/'));
			Logger::debug(self::LOG_CONTEXT, "Getting content for: " . $relDirname);

			try {
				$lsdata = $initializedBackend->ls($relDirname); // we can only check files in the same folder, so one request will be enough
			}
			catch (Exception) {
				// ignore - if file not found -> does not exist :)
			}
			if (isset($lsdata) && is_array($lsdata)) {
				foreach ($records as $record) {
					$relRecId = substr((string) $record["id"], strpos((string) $record["id"], '/'));
					Logger::debug(self::LOG_CONTEXT, "Checking rec: " . $relRecId);
					foreach ($lsdata as $argsid => $args) {
						if (strcmp((string) $args['resourcetype'], "collection") == 0 && $record["isFolder"] && strcmp(basename($argsid), basename($relRecId)) == 0) { // we have a folder
							Logger::debug(self::LOG_CONTEXT, "Duplicate folder found: " . $argsid);
							$duplicate = true;
							break;
						}
						if (strcmp((string) $args['resourcetype'], "collection") != 0 && !$record["isFolder"] && strcmp(basename($argsid), basename($relRecId)) == 0) {
							Logger::debug(self::LOG_CONTEXT, "Duplicate file found: " . $argsid);
							$duplicate = true;
							break;
						}
						$duplicate = false;
					}

					if ($duplicate) {
						Logger::debug(self::LOG_CONTEXT, "Duplicate entry: " . $relRecId);
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
	 * @throws BackendException if the backend request fails
	 */
	private function downloadSelectedFilesToTmp($actionType, $actionData) {
		$ids = $actionData['ids'];
		$dialogAttachmentId = $actionData['dialog_attachments'];
		$response = [];

		$attachment_state = new AttachmentState();
		$attachment_state->open();

		$account = $this->accountFromNode($ids[0]);

		// initialize the backend
		$initializedBackend = $this->initializeBackend($account);

		foreach ($ids as $file) {
			$filename = basename((string) $file);
			$tmpname = $attachment_state->getAttachmentTmpPath($filename);

			// download file from the backend
			$relRecId = substr((string) $file, strpos((string) $file, '/'));
			$http_status = $initializedBackend->get_file($relRecId, $tmpname);

			$filesize = filesize($tmpname);

			Logger::debug(self::LOG_CONTEXT, "Downloading: " . $filename . " to: " . $tmpname);

			$attach_id = uniqid();
			$response['items'][] = [
				'name' => $filename,
				'size' => $filesize,
				"attach_id" => $attach_id,
				'tmpname' => PathUtil::getFilenameFromPath($tmpname),
			];

			$attachment_state->addAttachmentFile($dialogAttachmentId, PathUtil::getFilenameFromPath($tmpname), [
				"name" => $filename,
				"size" => $filesize,
				"type" => PathUtil::get_mime($tmpname),
				"attach_id" => $attach_id,
				"sourcetype" => 'default',
			]);

			Logger::debug(self::LOG_CONTEXT, "filesize: " . $filesize);
		}

		$attachment_state->close();
		$response['status'] = true;
		$this->addActionData($actionType, $response);
		$GLOBALS["bus"]->addData($this->getResponseData());
	}

	/**
	 * upload the tempfile to files.
	 *
	 * @param array $actionData
	 * @param mixed $actionType
	 *
	 * @throws BackendException if the backend request fails
	 */
	private function uploadToBackend($actionType, $actionData) {
		Logger::debug(self::LOG_CONTEXT, "preparing attachment");

		$account = $this->accountFromNode($actionData["destdir"]);

		// initialize the backend
		$initializedBackend = $this->initializeBackend($account);

		$result = true;

		if ($actionData["type"] === "attachment") {
			foreach ($actionData["items"] as $item) {
				[$tmpname, $filename] = $this->prepareAttachmentForUpload($item);

				$dirName = substr((string) $actionData["destdir"], strpos((string) $actionData["destdir"], '/'));
				$filePath = $dirName . $filename;

				Logger::debug(self::LOG_CONTEXT, "Uploading to: " . $filePath . " tmpfile: " . $tmpname);

				$result = $result && $initializedBackend->put_file($filePath, $tmpname);
				unlink($tmpname);

				$this->updateDirCache($initializedBackend, $dirName, $filePath, $actionData);
			}
		}
		elseif ($actionData["type"] === "mail") {
			foreach ($actionData["items"] as $item) {
				[$tmpname, $filename] = $this->prepareEmailForUpload($item);

				$dirName = substr((string) $actionData["destdir"], strpos((string) $actionData["destdir"], '/'));
				$filePath = $dirName . $filename;

				Logger::debug(self::LOG_CONTEXT, "Uploading to: " . $filePath . " tmpfile: " . $tmpname);

				$result = $result && $initializedBackend->put_file($filePath, $tmpname);
				unlink($tmpname);

				$this->updateDirCache($initializedBackend, $dirName, $filePath, $actionData);
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
		}

		$response = [];
		$response['status'] = $result;
		$this->addActionData($actionType, $response);
		$GLOBALS["bus"]->addData($this->getResponseData());
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
	 * This function will prepare an attachment for the upload to the backend.
	 * It will store the attachment to the TMP folder and return its temporary
	 * path and filename as array.
	 *
	 * @param mixed $item
	 *
	 * @return array (tmpname, filename) or false on error
	 */
	private function prepareAttachmentForUpload($item) {
		// Check which type isset
		$openType = "attachment";

		// Get store id
		$storeid = false;
		if (isset($item["store"])) {
			$storeid = $item["store"];
		}

		// Get message entryid
		$entryid = false;
		if (isset($item["entryid"])) {
			$entryid = $item["entryid"];
		}

		// Get number of attachment which should be opened.
		$attachNum = false;
		if (isset($item["attachNum"])) {
			$attachNum = $item["attachNum"];
		}

		$tmpname = "";
		$filename = "";

		// Check if storeid and entryid isset
		if ($storeid && $entryid) {
			// Open the store
			$store = $GLOBALS["mapisession"]->openMessageStore(hex2bin((string) $storeid));

			if ($store) {
				// Open the message
				$message = mapi_msgstore_openentry($store, hex2bin((string) $entryid));

				if ($message) {
					$attachment = false;

					// Check if attachNum isset
					if ($attachNum) {
						// Loop through the attachNums, message in message in message ...
						for ($i = 0; $i < (count($attachNum) - 1); ++$i) {
							// Open the attachment
							$tempattach = mapi_message_openattach($message, (int) $attachNum[$i]);
							if ($tempattach) {
								// Open the object in the attachment
								$message = mapi_attach_openobj($tempattach);
							}
						}

						// Open the attachment
						$attachment = mapi_message_openattach($message, (int) $attachNum[count($attachNum) - 1]);
					}

					// Check if the attachment is opened
					if ($attachment) {
						// Get the props of the attachment
						$props = mapi_attach_getprops($attachment, [PR_ATTACH_LONG_FILENAME, PR_ATTACH_MIME_TAG, PR_DISPLAY_NAME, PR_ATTACH_METHOD]);
						// Content Type
						$contentType = "application/octet-stream";
						// Filename
						$filename = "ERROR";

						// Set filename
						if (isset($props[PR_ATTACH_LONG_FILENAME])) {
							$filename = PathUtil::sanitizeFilename($props[PR_ATTACH_LONG_FILENAME]);
						}
						else {
							if (isset($props[PR_ATTACH_FILENAME])) {
								$filename = PathUtil::sanitizeFilename($props[PR_ATTACH_FILENAME]);
							}
							else {
								if (isset($props[PR_DISPLAY_NAME])) {
									$filename = PathUtil::sanitizeFilename($props[PR_DISPLAY_NAME]);
								}
							}
						}

						// Set content type
						if (isset($props[PR_ATTACH_MIME_TAG])) {
							$contentType = $props[PR_ATTACH_MIME_TAG];
						}
						else {
							// Parse the extension of the filename to get the content type
							if (strrpos($filename, ".") !== false) {
								$extension = strtolower(substr($filename, strrpos($filename, ".")));
								$contentType = "application/octet-stream";
								if (is_readable("mimetypes.dat")) {
									$fh = fopen("mimetypes.dat", "r");
									$ext_found = false;
									while (!feof($fh) && !$ext_found) {
										$line = fgets($fh);
										preg_match("/(\\.[a-z0-9]+)[ \t]+([^ \t\n\r]*)/i", $line, $result);
										if ($extension == $result[1]) {
											$ext_found = true;
											$contentType = $result[2];
										}
									}
									fclose($fh);
								}
							}
						}

						$tmpname = tempnam(TMP_PATH, stripslashes($filename));

						// Open a stream to get the attachment data
						$stream = mapi_openproperty($attachment, PR_ATTACH_DATA_BIN, IID_IStream, 0, 0);
						$stat = mapi_stream_stat($stream);
						// File length =  $stat["cb"]

						Logger::debug(self::LOG_CONTEXT, "filesize: " . $stat["cb"]);

						$fhandle = fopen($tmpname, 'w');
						$buffer = null;
						for ($i = 0; $i < $stat["cb"]; $i += BLOCK_SIZE) {
							// Write stream
							$buffer = mapi_stream_read($stream, BLOCK_SIZE);
							fwrite($fhandle, $buffer, strlen($buffer));
						}
						fclose($fhandle);

						Logger::debug(self::LOG_CONTEXT, "temp attachment written to " . $tmpname);

						return [$tmpname, $filename];
					}
				}
			}
			else {
				Logger::error(self::LOG_CONTEXT, "store could not be opened");
			}
		}
		else {
			Logger::error(self::LOG_CONTEXT, "wrong call, store and entryid have to be set");
		}

		return false;
	}

	/**
	 * Store the email as eml to a temporary directory and return its temporary filename.
	 *
	 * @param mixed $item
	 *
	 * @return array (tmpname, filename) or false on error
	 */
	private function prepareEmailForUpload($item) {
		// Get store id
		$storeid = false;
		if (isset($item["store"])) {
			$storeid = $item["store"];
		}

		// Get message entryid
		$entryid = false;
		if (isset($item["entryid"])) {
			$entryid = $item["entryid"];
		}

		$tmpname = "";
		$filename = "";

		$store = $GLOBALS['mapisession']->openMessageStore(hex2bin($storeid));
		$message = mapi_msgstore_openentry($store, hex2bin($entryid));

		// Decode smime signed messages on this message
		parse_smime($store, $message);

		if ($message && $store) {
			// get message properties.
			$messageProps = mapi_getprops($message, [PR_SUBJECT, PR_MESSAGE_CLASS]);
			$cls = $messageProps[PR_MESSAGE_CLASS];
			$isSupportedMessage = class_match_prefix($cls, "IPM.Note") ||
			                      class_match_prefix($cls, "Report.IPM.Note") ||
			                      class_match_prefix($cls, "IPM.Schedule");

			if ($isSupportedMessage) {
				// Get addressbook for current session
				$addrBook = $GLOBALS['mapisession']->getAddressbook();

				// Read the message as RFC822-formatted e-mail stream.
				$stream = mapi_inetmapi_imtoinet($GLOBALS['mapisession']->getSession(), $addrBook, $message, []);

				if (!empty($messageProps[PR_SUBJECT])) {
					$filename = PathUtil::sanitizeFilename($messageProps[PR_SUBJECT]) . '.eml';
				}
				else {
					$filename = _('Untitled') . '.eml';
				}

				$tmpname = tempnam(TMP_PATH, "email2filez");

				// Set the file length
				$stat = mapi_stream_stat($stream);

				$fhandle = fopen($tmpname, 'w');
				$buffer = null;
				for ($i = 0; $i < $stat["cb"]; $i += BLOCK_SIZE) {
					// Write stream
					$buffer = mapi_stream_read($stream, BLOCK_SIZE);
					fwrite($fhandle, $buffer, strlen($buffer));
				}
				fclose($fhandle);

				return [$tmpname, $filename];
			}
		}

		return false;
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
		}

		$account = $this->accountStore->getAccount($accountID);

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
		}

		$account = $this->accountStore->getAccount($accountID);

		// initialize the backend
		$initializedBackend = $this->initializeBackend($account);

		try {
			$sInfo = $initializedBackend->unshare($records);
		}
		catch (Exception $e) {
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
		$account = $this->accountStore->getAccount($accountID);
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
