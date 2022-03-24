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

require_once __DIR__ . "/lib/phpfastcache/src/autoload.php";

use \Files\Core\Util\ArrayUtil;
use \Files\Core\Util\Logger;
use \Files\Core\Util\StringUtil;
use \Files\Core\Util\PathUtil;

use \Files\Core\Exception as AccountException;
use \Files\Backend\Exception as BackendException;

/**
 * This module handles all list and change requests for the files browser.
 *
 * @class FilesBrowserModule
 * @extends ListModule
 */
class FilesBrowserModule extends FilesListModule
{
	const LOG_CONTEXT = "FilesBrowserModule"; // Context for the Logger

	/**
	 * Creates the notifiers for this module,
	 * and register them to the Bus.
	 */
	function createNotifiers()
	{
		$GLOBALS["bus"]->registerNotifier('fileshierarchynotifier', REQUEST_ENTRYID);
	}

	/**
	 * Executes all the actions in the $data variable.
	 * Exception part is used for authentication errors also
	 * @return boolean true on success or false on failure.
	 */
	public function execute()
	{
		$result = false;

		foreach ($this->data as $actionType => $actionData) {
			if (isset($actionType)) {
				try {
					switch ($actionType) {
						case "checkifexists":
							$records = $actionData["records"];
							$destination = isset($actionData["destination"]) ? $actionData["destination"] : false;
							$result = $this->checkIfExists($records, $destination);
							$response = array();
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
								$folder = array();
								$folder[$actionData['entryid']] = array(
									'props' => $actionData["props"],
									'entryid' => $actionData['entryid'],
									'store_entryid' => 'files',
									'parent_entryid' => $actionData['parent_entryid']
								);

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
							if (isset($actionData["message_action"]) && isset($actionData["message_action"]["action_type"])) {
								switch ($actionData["message_action"]["action_type"]) {
									case "move" :
										$result = $this->move($actionType, $actionData);
										break;
									default:
										// check if we should create something new or edit an existing file/folder
										if (isset($actionData["entryid"])) {
											$result = $this->rename($actionType, $actionData);
										} else {
											$result = $this->save($actionData);
										}
										break;
								}
							} else {
								// check if we should create something new or edit an existing file/folder
								if (isset($actionData["entryid"])) {
									$result = $this->rename($actionType, $actionData);
								} else {
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

				} catch (MAPIException $e) {
					$this->sendFeedback(false, $this->errorDetailsFromException($e));
				} catch (AccountException $e) {
					$this->sendFeedback(false, array(
						'type' => ERROR_GENERAL,
						'info' => array(
							'title' => $e->getTitle(),
							'original_message' => $e->getMessage(),
							'display_message' => $e->getMessage()
						)
					));
				} catch (BackendException $e) {
					$this->sendFeedback(false, array(
						'type' => ERROR_GENERAL,
						'info' => array(
							'title' => $e->getTitle(),
							'original_message' => $e->getMessage(),
							'display_message' => $e->getMessage(),
							'code' => $e->getCode()
						)
					));
				}
			}
		}

		return $result;
	}

	/**
	 * loads content of current folder - list of folders and files from Files
	 *
	 * @param string $actionType name of the current action
	 * @param array $actionData all parameters contained in this request
	 * @throws BackendException if the backend request fails
	 *
	 * @return bool
	 */
	public function loadFiles($actionType, $actionData)
	{
		$nodeId = $actionData['id'];
		$onlyFiles = isset($actionData['only_files']) ? $actionData['only_files'] : false;
		$response = array();
		$nodes = array();

		$accountID = $this->accountIDFromNode($nodeId);

		// check if we are in the ROOT (#R#). If so, display some kind of device/account view.
		if (empty($accountID) || !$this->accountStore->getAccount($accountID)) {
			$accounts = $this->accountStore->getAllAccounts();
			foreach ($accounts as $account) { // we have to load all accounts and their folders
				// skip accounts that are not valid
				if ($account->getStatus() != \Files\Core\Account::STATUS_OK) {
					continue;
				}
				// build the real node id for this folder
				$realNodeId = $nodeId . $account->getId() . "/";

				$nodes[$realNodeId] = array('props' =>
					array(
						'id' => rawurldecode($realNodeId),
						'folder_id' => rawurldecode($realNodeId),
						'path' => $realNodeId,
						'filename' => $account->getName(),
						'message_size' => -1,
						'lastmodified' => -1,
						'message_class' => "IPM.Files",
						'type' => 0
					),
					'entryid' => $this->createId($realNodeId),
					'store_entryid' => $this->createId($realNodeId),
					'parent_entryid' => $this->createId($realNodeId)
				);
			}
		} else {
			$account = $this->accountStore->getAccount($accountID);

			// initialize the backend
			$initializedBackend = $this->initializeBackend($account, true);

			$starttime = microtime(true);
			$nodes = $this->getFolderContent($nodeId, $initializedBackend, $onlyFiles);
			Logger::debug(self::LOG_CONTEXT, "[loadfiles]: getFolderContent took: " . (microtime(true) - $starttime) . " seconds");

			$nodes = $this->sortFolderContent($nodes, $actionData, false);
		}

		$response["item"] = array_values($nodes);

		$response['page'] = array("start" => 0, "rowcount" => 50, "totalrowcount" => count($response["item"]));
		$response['folder'] = array("content_count" => count($response["item"]), "content_unread" => 0);

		$this->addActionData($actionType, $response);
		$GLOBALS["bus"]->addData($this->getResponseData());

		return true;
	}

	/**
	 * Forms the structure needed for frontend
	 * for the list of folders and files
	 *
	 * @param string $nodeId the name of the current root directory
	 * @param Files\Backend\AbstractBackend $backendInstance
	 * @param boolean $onlyFiles if true, get only files.
	 *
	 * @throws BackendException if the backend request fails
	 * @return array of nodes for current path folder
	 */
	public function getFolderContent($nodeId, $backendInstance, $onlyFiles = false)
	{
		$nodes = array();

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
		if ($backendInstance->supports(\Files\Backend\BackendStore::FEATURE_SHARING)) {
			Logger::debug(self::LOG_CONTEXT, "Checking for shared folders! ($relNodeId)");

			$time_start = microtime(true);
			/** @var \Files\Backend\iFeatureSharing $backendInstance */
			$sharingInfo = $backendInstance->getShares($relNodeId);
			$time_end = microtime(true);
			$time = $time_end - $time_start;

			Logger::debug(self::LOG_CONTEXT, "Checking for shared took $time s!");
		}

		if ($dir) {
			$updateCache = false;
			foreach ($dir as $id => $node) {
				$type = FILES_FILE;

				if (strcmp($node['resourcetype'], "collection") == 0) { // we have a folder
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

				$filename = stringToUTF8Encode(basename($id));

				$size = $node['getcontentlength'] === null ? -1 : intval($node['getcontentlength']);
				$size = $type == FILES_FOLDER ? -1 : $size; // folder's dont have a size

				$shared = false;
				$sharedid = array();
				if (isset($sharingInfo) && count($sharingInfo[$relNodeId]) > 0) {
					foreach ($sharingInfo[$relNodeId] as $sid => $sdetails) {
						if ($sdetails["path"] == rtrim($id, "/")) {
							$shared = true;
							$sharedid[] = $sid;
						}
					}
				}

				$nodeId = stringToUTF8Encode($id);
				$dirName = dirname($nodeId, 1);
				if ($dirName === '/') {
					$path = stringToUTF8Encode($nodeIdPrefix . $dirName);
				} else {
					$path = stringToUTF8Encode($nodeIdPrefix . $dirName . '/');
				}

				if (!isset($node['entryid']) || !isset($node['parent_entryid']) || !isset($node['store_entryid'])) {
					$entryid = $this->createId($realID);
					$parentEntryid = $this->createId($path);
					$storeEntryid = $this->createId($nodeIdPrefix .'/');

					$dir[$id]['entryid'] = $entryid;
					$dir[$id]['parent_entryid'] = $parentEntryid;
					$dir[$id]['store_entryid'] = $storeEntryid;

					$updateCache = true;
				} else {
					$entryid = $node['entryid'];
					$parentEntryid = $node['parent_entryid'];
					$storeEntryid = $node['store_entryid'];
				}

				$nodes[$nodeId] = array('props' =>
					array(
						'folder_id' => stringToUTF8Encode($realID),
						'path' => $path,
						'filename' => $filename,
						'message_size' => $size,
						'lastmodified' => strtotime($node['getlastmodified']) * 1000,
						'message_class' => "IPM.Files",
						'isshared' => $shared,
						'sharedid' => $sharedid,
						'object_type' => $type,
						'type' => $type
					),
					'entryid' => $entryid,
					'parent_entryid' => $parentEntryid,
					'store_entryid' => $storeEntryid
				);
			}

			// Update the cache.
			if ($updateCache) {
				$this->setCache($accountID, $cachePath, $dir);
			}
		} else {
			Logger::debug(self::LOG_CONTEXT, "dir was empty");
		}

		return $nodes;
	}

	/**
	 * This functions sorts an array of nodes.
	 *
	 * @param array $nodes array of nodes to sort
	 * @param array $data all parameters contained in the request
	 * @param boolean $navtree parse for navtree or browser
	 *
	 * @return array of sorted nodes
	 */
	public function sortFolderContent($nodes, $data, $navtree = false)
	{
		$sortednodes = array();

		$sortkey = "filename";
		$sortdir = "ASC";

		if (isset($data['sort'])) {
			$sortkey = $data['sort'][0]['field'];
			$sortdir = $data['sort'][0]['direction'];
		}

		Logger::debug(self::LOG_CONTEXT, "sorting by " . $sortkey . " in direction: " . $sortdir);

		if ($navtree) {
			$sortednodes = ArrayUtil::sort_by_key($nodes, $sortkey, $sortdir);
		} else {
			$sortednodes = ArrayUtil::sort_props_by_key($nodes, $sortkey, $sortdir);
		}

		return $sortednodes;
	}

	/**
	 * Deletes the selected files on the backend server
	 *
	 * @access private
	 * @param string $actionType name of the current action
	 * @param array $actionData all parameters contained in this request
	 * @return bool
	 * @throws BackendException if the backend request fails
	 */
	private function delete($actionType, $actionData)
	{
		// TODO: function is duplicate of class.hierarchylistmodule.php of delete function.
		$result = false;
		if (isset($actionData['records']) && is_array($actionData['records'])) {
			foreach ($actionData['records'] as $record) {
				$nodeId = $record['folder_id'];
				$relNodeId = substr($nodeId, strpos($nodeId, '/'));

				$account = $this->accountFromNode($nodeId);

				// initialize the backend
				$initializedBackend = $this->initializeBackend($account);

				$result = $initializedBackend->delete($relNodeId);
				Logger::debug(self::LOG_CONTEXT, "deleted: " . $nodeId . ", worked: " . $result);

				// clear the cache
				$this->deleteCache($account->getId(), dirname($relNodeId));
				$GLOBALS["bus"]->notify(REQUEST_ENTRYID, OBJECT_DELETE, array(
					"id"=> $nodeId,
					"folder_id"=> $nodeId,
					"entryid"=> $record['entryid'],
					"parent_entryid"=> $record["parent_entryid"],
					"store_entryid"=> $record["store_entryid"]
				));
			}

			$response['status'] = true;
			$this->addActionData($actionType, $response);
			$GLOBALS["bus"]->addData($this->getResponseData());

		} else {
			$nodeId = $actionData['folder_id'];

			$relNodeId = substr($nodeId, strpos($nodeId, '/'));
			$response = array();

			$account = $this->accountFromNode($nodeId);
			$accountId = $account->getId();
			// initialize the backend
			$initializedBackend = $this->initializeBackend($account);

			try {
				$result = $initializedBackend->delete($relNodeId);
			} catch (\Files\Backend\Exception $e) {
				// TODO: this might fails because the file was already deleted.
				// fire error message if any other error occured.
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

			$GLOBALS["bus"]->notify(REQUEST_ENTRYID, OBJECT_DELETE, array(
				"entryid"=> $actionData["entryid"],
				"parent_entryid"=> $actionData["parent_entryid"],
				"store_entryid"=> $actionData["store_entryid"]
			));
		}

		return true;
	}

	/**
	 * Moves the selected files on the backend server
	 *
	 * @access private
	 * @param string $actionType name of the current action
	 * @param array $actionData all parameters contained in this request
	 * @return bool if the backend request failed
	 */
	private function move($actionType, $actionData)
	{
		$dst = rtrim($actionData['message_action']["destination_folder_id"], '/');

		$overwrite = isset($actionData['message_action']["overwrite"]) ? $actionData['message_action']["overwrite"] : true;
		$isFolder = isset($actionData['message_action']["isFolder"]) ? $actionData['message_action']["isFolder"] : false;

		$pathPostfix = "";
		if (substr($actionData['folder_id'], -1) == '/') {
			$pathPostfix = "/"; // we have a folder...
		}

		$source = rtrim($actionData['folder_id'], '/');
		$fileName = basename($source);
		$destination = $dst . '/' . basename($source);

		// get dst and source account ids
		// currently only moving within one account is supported
		$srcAccountID = substr($actionData['folder_id'], 3, (strpos($actionData['folder_id'], '/') - 3)); // parse account id from node id
		$dstAccountID = substr($actionData['message_action']["destination_folder_id"], 3, (strpos($actionData['message_action']["destination_folder_id"], '/') - 3)); // parse account id from node id

		if ($srcAccountID !== $dstAccountID) {
			$this->sendFeedback(false, array(
				'type' => ERROR_GENERAL,
				'info' => array(
					'title' => dgettext('plugin_files', "Files Plugin"),
					'original_message' => dgettext('plugin_files', "Moving between accounts is not implemented"),
					'display_message' => dgettext('plugin_files', "Moving between accounts is not implemented")
				)
			));

			return false;
		} else {
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
			$folder = array(
				'props' =>
					array(
						'folder_id' => ($destination . $pathPostfix),
						'path' => $actionData['message_action']["destination_folder_id"],
						'filename' => $fileName,
						'display_name' => $fileName,
						'object_type' => $isFolder ? FILES_FOLDER : FILES_FILE,
						'deleted' => !$result ? false : true
					),
				'entryid' => $this->createId($destination . $pathPostfix),
				'store_entryid' => $actionData['store_entryid'],
				'parent_entryid' => $actionData['message_action']['parent_entryid']
			);

			$response['item'] = $folder;

			$this->addActionData("update", $response);
			$GLOBALS["bus"]->addData($this->getResponseData());

			// Notify hierarchy only when folder was moved.
			if ($isFolder) {
				// Send notification to delete folder node in hierarchy.
				$GLOBALS["bus"]->notify(REQUEST_ENTRYID, OBJECT_DELETE, array(
					"entryid"=> $actionData["entryid"],
					"parent_entryid"=> $actionData["parent_entryid"],
					"store_entryid"=> $actionData["store_entryid"]
				));

				// Send notification to create new folder node in hierarchy.
				$GLOBALS["bus"]->notify(REQUEST_ENTRYID, OBJECT_SAVE, $folder);
			}
		}

		return true;
	}

	/**
	 * Renames the selected file on the backend server
	 *
	 * @access private
	 * @param string $actionType name of the current action
	 * @param array $actionData all parameters contained in this request
	 * @return bool
	 * @throws BackendException if the backend request fails
	 */
	function rename($actionType, $actionData)
	{
		$messageProps = $this->save($actionData);
		$notifySubFolders = isset($actionData['message_action']['isFolder']) ? $actionData['message_action']['isFolder'] : true;
		if(!empty($messageProps)) {
			$GLOBALS["bus"]->notify(REQUEST_ENTRYID, OBJECT_SAVE, $messageProps);
			if ($notifySubFolders) {
				$this->notifySubFolders($messageProps["props"]["folder_id"]);
			}
		}
	}

	/**
	 * Check if given filename or folder already exists on server
	 *
	 * @access private
	 * @param array $records which needs to be check for existence.
	 * @param array $destination where the given records needs to be moved, uploaded, or renamed.
	 * @throws BackendException if the backend request fails
	 *
	 * @return boolean True if duplicate found, false otherwise
	 */
	private function checkIfExists($records, $destination)
	{
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

			$relDirname = substr($destination, strpos($destination, '/'));
			Logger::debug(self::LOG_CONTEXT, "Getting content for: " . $relDirname);
			try {
				$lsdata = $initializedBackend->ls($relDirname); // we can only check files in the same folder, so one request will be enough
			} catch (Exception $e) {
				// ignore - if file not found -> does not exist :)
			}
			if (isset($lsdata) && is_array($lsdata)) {
				foreach ($records as $record) {
					$relRecId = substr($record["id"], strpos($record["id"], '/'));
					Logger::debug(self::LOG_CONTEXT, "Checking rec: " . $relRecId, "Core");
					foreach ($lsdata as $argsid => $args) {
						if (strcmp($args['resourcetype'], "collection") == 0 && $record["isFolder"] && strcmp(basename($argsid), basename($relRecId)) == 0) { // we have a folder
							Logger::debug(self::LOG_CONTEXT, "Duplicate folder found: " . $argsid, "Core");
							$duplicate = true;
							break;
						} else {
							if (strcmp($args['resourcetype'], "collection") != 0 && !$record["isFolder"] && strcmp(basename($argsid), basename($relRecId)) == 0) {
								Logger::debug(self::LOG_CONTEXT, "Duplicate file found: " . $argsid, "Core");
								$duplicate = true;
								break;
							} else {
								$duplicate = false;
							}
						}
					}

					if ($duplicate) {
						Logger::debug(self::LOG_CONTEXT, "Duplicate entry: " . $relRecId, "Core");
						break;
					}
				}
			}
		}

		return $duplicate;
	}

	/**
	 * Downloads file from the Files service and saves it in tmp
	 * folder with unique name
	 *
	 * @access private
	 * @param array $actionData
	 * @throws BackendException if the backend request fails
	 *
	 * @return void
	 */
	private function downloadSelectedFilesToTmp($actionType, $actionData)
	{
		$ids = $actionData['ids'];
		$dialogAttachmentId = $actionData['dialog_attachments'];
		$response = array();

		$attachment_state = new AttachmentState();
		$attachment_state->open();

		$account = $this->accountFromNode($ids[0]);

		// initialize the backend
		$initializedBackend = $this->initializeBackend($account);

		foreach ($ids as $file) {
			$filename = basename($file);
			$tmpname = $attachment_state->getAttachmentTmpPath($filename);

			// download file from the backend
			$relRecId = substr($file, strpos($file, '/'));
		    $http_status = $initializedBackend->get_file($relRecId, $tmpname);

			$filesize = filesize($tmpname);

			Logger::debug(self::LOG_CONTEXT, "Downloading: " . $filename . " to: " . $tmpname);

			$attach_id = uniqid();
			$response['items'][] = array(
				'name' => $filename,
				'size' => $filesize,
				"attach_id" => $attach_id,
				'tmpname' => PathUtil::getFilenameFromPath($tmpname)
			);

			$attachment_state->addAttachmentFile($dialogAttachmentId, PathUtil::getFilenameFromPath($tmpname), Array(
				"name" => $filename,
				"size" => $filesize,
				"type" => PathUtil::get_mime($tmpname),
				"attach_id" => $attach_id,
				"sourcetype" => 'default'
			));

			Logger::debug(self::LOG_CONTEXT, "filesize: " . $filesize);
		}

		$attachment_state->close();
		$response['status'] = true;
		$this->addActionData($actionType, $response);
		$GLOBALS["bus"]->addData($this->getResponseData());
	}

	/**
	 * upload the tempfile to files
	 *
	 * @access private
	 * @param array $actionData
	 * @throws BackendException if the backend request fails
	 *
	 * @return void
	 */
	private function uploadToBackend($actionType, $actionData)
	{
		Logger::debug(self::LOG_CONTEXT, "preparing attachment");

		$account = $this->accountFromNode($actionData["destdir"]);

		// initialize the backend
		$initializedBackend = $this->initializeBackend($account);

		$result = true;

		if ($actionData["type"] === "attachment") {
			foreach ($actionData["items"] as $item) {
				list($tmpname, $filename) = $this->prepareAttachmentForUpload($item);

				$dirName = substr($actionData["destdir"], strpos($actionData["destdir"], '/'));
				$filePath = $dirName . $filename;

				Logger::debug(self::LOG_CONTEXT, "Uploading to: " . $filePath . " tmpfile: " . $tmpname);

				$result = $result && $initializedBackend->put_file($filePath, $tmpname);
				unlink($tmpname);

				$this->updateDirCache($initializedBackend, $dirName, $filePath, $actionData);
			}
		} elseif ($actionData["type"] === "mail") {
			foreach ($actionData["items"] as $item) {
				list($tmpname, $filename) = $this->prepareEmailForUpload($item);

				$dirName = substr($actionData["destdir"], strpos($actionData["destdir"], '/'));
				$filePath = $dirName . $filename;

				Logger::debug(self::LOG_CONTEXT, "Uploading to: " . $filePath . " tmpfile: " . $tmpname);

				$result = $result && $initializedBackend->put_file($filePath, $tmpname);
				unlink($tmpname);

				$this->updateDirCache($initializedBackend, $dirName, $filePath, $actionData);
			}
		} else {
			$this->sendFeedback(false, array(
				'type' => ERROR_GENERAL,
				'info' => array(
					'title' => dgettext('plugin_files', "Files plugin"),
					'original_message' => dgettext('plugin_files', "Unknown type - cannot save this file to the Files backend!"),
					'display_message' => dgettext('plugin_files', "Unknown type - cannot save this file to the Files backend!")
				)
			));
		}

		$response = array();
		$response['status'] = $result;
		$this->addActionData($actionType, $response);
		$GLOBALS["bus"]->addData($this->getResponseData());
	}

	/**
	 * Update the cache of selected directory
	 *
	 * @param Files\Backend\AbstractBackend $backendInstance
	 * @param string $dirName The directory name
	 * @param $filePath The file path.
	 * @param $actionData The action data.
	 * @throws BackendException
	 */
	function updateDirCache($backendInstance, $dirName, $filePath, $actionData)
	{
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
	 * @param $items
	 * @return array (tmpname, filename) or false on error
	 * @access private
	 */
	private function prepareAttachmentForUpload($item)
	{
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
			$store = $GLOBALS["mapisession"]->openMessageStore(hex2bin($storeid));

			if ($store) {
				// Open the message
				$message = mapi_msgstore_openentry($store, hex2bin($entryid));

				if ($message) {
					$attachment = false;

					// Check if attachNum isset
					if ($attachNum) {
						// Loop through the attachNums, message in message in message ...
						for ($i = 0; $i < (count($attachNum) - 1); $i++) {
							// Open the attachment
							$tempattach = mapi_message_openattach($message, (int)$attachNum[$i]);
							if ($tempattach) {
								// Open the object in the attachment
								$message = mapi_attach_openobj($tempattach);
							}
						}

						// Open the attachment
						$attachment = mapi_message_openattach($message, (int)$attachNum[(count($attachNum) - 1)]);
					}

					// Check if the attachment is opened
					if ($attachment) {

						// Get the props of the attachment
						$props = mapi_attach_getprops($attachment, array(PR_ATTACH_LONG_FILENAME, PR_ATTACH_MIME_TAG, PR_DISPLAY_NAME, PR_ATTACH_METHOD));
						// Content Type
						$contentType = "application/octet-stream";
						// Filename
						$filename = "ERROR";

						// Set filename
						if (isset($props[PR_ATTACH_LONG_FILENAME])) {
							$filename = PathUtil::sanitizeFilename($props[PR_ATTACH_LONG_FILENAME]);
						} else {
							if (isset($props[PR_ATTACH_FILENAME])) {
								$filename = PathUtil::sanitizeFilename($props[PR_ATTACH_FILENAME]);
							} else {
								if (isset($props[PR_DISPLAY_NAME])) {
									$filename = PathUtil::sanitizeFilename($props[PR_DISPLAY_NAME]);
								}
							}
						}

						// Set content type
						if (isset($props[PR_ATTACH_MIME_TAG])) {
							$contentType = $props[PR_ATTACH_MIME_TAG];
						} else {
							// Parse the extension of the filename to get the content type
							if (strrpos($filename, ".") !== false) {
								$extension = strtolower(substr($filename, strrpos($filename, ".")));
								$contentType = "application/octet-stream";
								if (is_readable("mimetypes.dat")) {
									$fh = fopen("mimetypes.dat", "r");
									$ext_found = false;
									while (!feof($fh) && !$ext_found) {
										$line = fgets($fh);
										preg_match("/(\.[a-z0-9]+)[ \t]+([^ \t\n\r]*)/i", $line, $result);
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

						return array($tmpname, $filename);
					}
				}
			} else {
				Logger::error(self::LOG_CONTEXT, "store could not be opened");
			}
		} else {
			Logger::error(self::LOG_CONTEXT, "wrong call, store and entryid have to be set");
		}

		return false;
	}

	/**
	 * Store the email as eml to a temporary directory and return its temporary filename.
	 *
	 * @param {string} $actionType
	 * @param {array} $actionData
	 * @return array (tmpname, filename) or false on error
	 * @access private
	 */
	private function prepareEmailForUpload($item)
	{
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
			$messageProps = mapi_getprops($message, array(PR_SUBJECT, PR_EC_IMAP_EMAIL, PR_MESSAGE_CLASS));

			$isSupportedMessage = (
				(stripos($messageProps[PR_MESSAGE_CLASS], 'IPM.Note') === 0)
				|| (stripos($messageProps[PR_MESSAGE_CLASS], 'Report.IPM.Note') === 0)
				|| (stripos($messageProps[PR_MESSAGE_CLASS], 'IPM.Schedule') === 0)
			);

			if ($isSupportedMessage) {
				// If RFC822-formatted stream is already available in PR_EC_IMAP_EMAIL property
				// than directly use it, generate otherwise.
				if (isset($messageProps[PR_EC_IMAP_EMAIL]) || propIsError(PR_EC_IMAP_EMAIL, $messageProps) == MAPI_E_NOT_ENOUGH_MEMORY) {
					// Stream the message to properly get the PR_EC_IMAP_EMAIL property
					$stream = mapi_openproperty($message, PR_EC_IMAP_EMAIL, IID_IStream, 0, 0);
				} else {
					// Get addressbook for current session
					$addrBook = $GLOBALS['mapisession']->getAddressbook();

					// Read the message as RFC822-formatted e-mail stream.
					$stream = mapi_inetmapi_imtoinet($GLOBALS['mapisession']->getSession(), $addrBook, $message, array());
				}

				if (!empty($messageProps[PR_SUBJECT])) {
					$filename = PathUtil::sanitizeFilename($messageProps[PR_SUBJECT]) . '.eml';
				} else {
					$filename = dgettext('plugin_files', 'Untitled') . '.eml';
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

				return array($tmpname, $filename);
			}
		}

		return false;
	}

	/**
	 * Get sharing information from the backend.
	 *
	 * @param $actionType
	 * @param $actionData
	 * @return bool
	 */
	private function getSharingInformation($actionType, $actionData)
	{
		$response = array();
		$records = $actionData["records"];

		if (count($records) < 1) {
			$this->sendFeedback(false, array(
				'type' => ERROR_GENERAL,
				'info' => array(
					'title' => dgettext('plugin_files', "Files Plugin"),
					'original_message' => dgettext('plugin_files', "No record given!"),
					'display_message' => dgettext('plugin_files', "No record given!")
				)
			));
		}

		$account = $this->accountFromNode($records[0]);

		// initialize the backend
		$initializedBackend = $this->initializeBackend($account);

		$relRecords = array();
		foreach ($records as $record) {
			$relRecords[] = substr($record, strpos($record, '/')); // remove account id
		}

		try {
			$sInfo = $initializedBackend->sharingDetails($relRecords);
		} catch (Exception $e) {
			$response['status'] = false;
			$response['header'] = dgettext('plugin_files', 'Fetching sharing information failed');
			$response['message'] = $e->getMessage();
			$this->addActionData("error", $response);
			$GLOBALS["bus"]->addData($this->getResponseData());

			return false;
		}

		$sharingInfo = array();
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
	 * @param $actionType
	 * @param $actionData
	 * @return bool
	 */
	private function createNewShare($actionType, $actionData)
	{
		$records = $actionData["records"];
		$shareOptions = $actionData["options"];

		if (count($records) < 1) {
			$this->sendFeedback(false, array(
				'type' => ERROR_GENERAL,
				'info' => array(
					'title' => dgettext('plugin_files', "Files Plugin"),
					'original_message' => dgettext('plugin_files', "No record given!"),
					'display_message' => dgettext('plugin_files', "No record given!")
				)
			));
		}

		$account = $this->accountFromNode($records[0]);

		// initialize the backend
		$initializedBackend = $this->initializeBackend($account);

		$sharingRecords = array();
		foreach ($records as $record) {
			$path = substr($record, strpos($record, '/')); // remove account id
			$sharingRecords[$path] = $shareOptions; // add options
		}

		try {
			$sInfo = $initializedBackend->share($sharingRecords);
		} catch (Exception $e) {
			$response['status'] = false;
			$response['header'] = dgettext('plugin_files', 'Sharing failed');
			$response['message'] = $e->getMessage();
			$this->addActionData("error", $response);
			$GLOBALS["bus"]->addData($this->getResponseData());

			return false;
		}

		$sharingInfo = array();
		foreach ($sInfo as $path => $details) {
			$realPath = "#R#" . $account->getId() . $path;
			$sharingInfo[$realPath] = $details; // add account id again
		}

		$response = array();
		$response['status'] = true;
		$response['shares'] = $sharingInfo;
		$this->addActionData($actionType, $response);
		$GLOBALS["bus"]->addData($this->getResponseData());

		return true;
	}

	/**
	 * Update a existing share.
	 * @param $actionType
	 * @param $actionData
	 * @return bool
	 */
	private function updateExistingShare($actionType, $actionData)
	{
		$records = $actionData["records"];
		$accountID = $actionData["accountid"];
		$shareOptions = $actionData["options"];

		if (count($records) < 1) {
			$this->sendFeedback(false, array(
				'type' => ERROR_GENERAL,
				'info' => array(
					'title' => dgettext('plugin_files', "Files Plugin"),
					'original_message' => dgettext('plugin_files', "No record given!"),
					'display_message' => dgettext('plugin_files', "No record given!")
				)
			));
		}

		$account = $this->accountStore->getAccount($accountID);

		// initialize the backend
		$initializedBackend = $this->initializeBackend($account);

		$sharingRecords = array();
		foreach ($records as $record) {
			$sharingRecords[$record] = $shareOptions; // add options
		}

		try {
			$sInfo = $initializedBackend->share($sharingRecords, true);
		} catch (Exception $e) {
			$response['status'] = false;
			$response['header'] = dgettext('plugin_files', 'Updating share failed');
			$response['message'] = $e->getMessage();
			$this->addActionData("error", $response);
			$GLOBALS["bus"]->addData($this->getResponseData());

			return false;
		}

		$response = array();
		$response['status'] = true;
		$response['shares'] = $sInfo;
		$this->addActionData($actionType, $response);
		$GLOBALS["bus"]->addData($this->getResponseData());

		return true;
	}

	/**
	 * Delete one or more shares.
	 * @param $actionType
	 * @param $actionData
	 * @return bool
	 */
	private function deleteExistingShare($actionType, $actionData)
	{
		$records = $actionData["records"];
		$accountID = $actionData["accountid"];

		if (count($records) < 1) {
			$this->sendFeedback(false, array(
				'type' => ERROR_GENERAL,
				'info' => array(
					'title' => dgettext('plugin_files', "Files Plugin"),
					'original_message' => dgettext('plugin_files', "No record given!"),
					'display_message' => dgettext('plugin_files', "No record given!")
				)
			));
		}

		$account = $this->accountStore->getAccount($accountID);

		// initialize the backend
		$initializedBackend = $this->initializeBackend($account);

		try {
			$sInfo = $initializedBackend->unshare($records);
		} catch (Exception $e) {
			$response['status'] = false;
			$response['header'] = dgettext('plugin_files', 'Deleting share failed');
			$response['message'] = $e->getMessage();
			$this->addActionData("error", $response);
			$GLOBALS["bus"]->addData($this->getResponseData());

			return false;
		}

		$response = array();
		$response['status'] = true;
		$this->addActionData($actionType, $response);
		$GLOBALS["bus"]->addData($this->getResponseData());

		return true;
	}

	/**
	 * Function will use to update the cache
	 *
	 * @param string $actionType name of the current action
	 * @param array $actionData all parameters contained in this request
	 *
	 * @return boolean true on success or false on failure.
	 */
	function updateCache($actionType, $actionData)
	{
		$nodeId = $actionData['id'];
		$accountID = $this->accountIDFromNode($nodeId);
		$account = $this->accountStore->getAccount($accountID);
		// initialize the backend
		$initializedBackend = $this->initializeBackend($account, true);
		$relNodeId = substr($nodeId, strpos($nodeId, '/'));

		// remove the trailing slash for the cache key
		$cachePath = rtrim($relNodeId, '/');
		if ($cachePath === "") {
			$cachePath = "/";
		}
		$dir = $initializedBackend->ls($relNodeId);
		$this->setCache($accountID, $cachePath, $dir);

		$response = array();
		$response['status'] = true;
		$this->addActionData($actionType, $response);
		$GLOBALS["bus"]->addData($this->getResponseData());

		return true;
	}
}
