<?php

require_once __DIR__ . "/../Files/Core/class.accountstore.php";
require_once __DIR__ . "/../Files/Backend/class.backendstore.php";

require_once __DIR__ . "/../Files/Core/class.exception.php";
require_once __DIR__ . "/../Files/Backend/class.exception.php";

require_once __DIR__ . "/../Files/Core/Util/class.logger.php";
require_once __DIR__ . "/../Files/Core/Util/class.stringutil.php";

require_once __DIR__ . "/../vendor/autoload.php";

use Files\Core\Util\Logger;
use Files\Core\Util\StringUtil;
use Phpfastcache\CacheManager;
use Phpfastcache\Drivers\Redis\Config as RedisConfig;

/**
 * This module handles all list and change requests for the files browser.
 *
 * @class FilesListModule
 * @extends ListModule
 */
class FilesListModule extends ListModule {
	public const LOG_CONTEXT = "FilesListModule"; // Context for the Logger

	// Unauthorized errors of different backends.
	public const SMB_ERR_UNAUTHORIZED = 13;
	public const SMB_ERR_FORBIDDEN = 1;
	public const FTP_WD_OWNCLOUD_ERR_UNAUTHORIZED = 401;
	public const FTP_WD_OWNCLOUD_ERR_FORBIDDEN = 403;
	public const ALL_BACKEND_ERR_NOTFOUND = 404;

	/**
	 * @var \phpFastCache cache handler
	 */
	public $cache;

	/**
	 * @var string User id of the currently logged in user. Used to generate unique cache id's.
	 */
	public $uid;

	/**
	 * @var {Object} The account store holding all available accounts
	 */
	public $accountStore;

	/**
	 * @var {Object} The backend store holding all available backends
	 */
	public $backendStore;

	/**
	 * @constructor
	 *
	 * @param $id
	 * @param $data
	 */
	public function __construct($id, $data) {
		parent::__construct($id, $data);

		// Initialize the account and backendstore
		$this->accountStore = new \Files\Core\AccountStore();
		$this->backendStore = \Files\Backend\BackendStore::getInstance();

		// Setup the cache
		$config = new RedisConfig();
		$config->setHost(PLUGIN_FILES_REDIS_HOST);
		$config->setPort(PLUGIN_FILES_REDIS_PORT);
		$config->setPassword(PLUGIN_FILES_REDIS_AUTH);

		$this->cache = CacheManager::getInstance('Redis', $config);

		// For backward compatibility we will check if the Encryption store exists. If not,
		// we will fall back to the old way of retrieving the password from the session.
		if (class_exists('EncryptionStore')) {
			// Get the username from the Encryption store
			$encryptionStore = \EncryptionStore::getInstance();
			$this->uid = $encryptionStore->get('username');
		}
		else {
			$this->uid = $_SESSION["username"];
		}
		// As of the V6, the following characters can not longer being a part of the key identifier: {}()/\@:
		// If you try to do so, an \phpFastCache\Exceptions\phpFastCacheInvalidArgumentException will be raised.
		// You must replace them with a safe delimiter such as .|-_
		// @see https://github.com/PHPSocialNetwork/phpfastcache/blob/8.1.2/docs/migration/MigratingFromV5ToV6.md
		$this->uid = str_replace(['{', '}', '(', ')', '/', '\\', '@'], '_', $this->uid);

		Logger::debug(self::LOG_CONTEXT, "[constructor]: executing the module as uid: " . $this->uid);
	}

	/**
	 * Function get the folder data from backend.
	 *
	 * @param mixed $isReload
	 *
	 * @return array return folders array
	 */
	public function getHierarchyList($isReload = false) {
		$data = [];
		$data["item"] = [];
		$versions = $GLOBALS['PluginManager']->getPluginsVersion();
		$filesVersion = $versions['files'];

		// Clear cache when version gets changed and update 'files' version in cache.
		if ($isReload || version_compare($this->getVersionFromCache('files'), $filesVersion) !== 0) {
			$this->clearCache();
			$this->setVersionInCache('files', $filesVersion);
		}

		$accounts = $this->accountStore->getAllAccounts();
		foreach ($accounts as $account) {
			// we have to load all accounts and their folders
			// skip accounts that are not valid
			if ($account->getStatus() !== \Files\Core\Account::STATUS_OK) {
				continue;
			}

			// build the real node id for this folder
			$realNodeId = "#R#" . $account->getId() . "/";
			$accountName = $account->getName();
			$rootId = $this->createId($realNodeId);
			$nodes = [
				"store_entryid" => $rootId,
				"props" => [
					'entryid' => $rootId,
					'subtree_id' => $rootId,
					'display_name' => $accountName,
					"object_type" => FILES_STORE,
					"status" => $account->getStatus(),
					"status_description" => $account->getStatusDescription(),
					"backend" => $account->getBackend(),
					"backend_config" => $account->getBackendConfig(),
					'backend_features' => $account->getFeatures(),
					'filename' => $accountName,
					'account_sequence' => $account->getSequence(),
					'cannot_change' => $account->getCannotChangeFlag(),
				],
			];

			$initializedBackend = $this->initializeBackend($account, true);

			// Get sub folder of root folder.
			$subFolders = $this->getSubFolders($realNodeId, $initializedBackend);

			array_push($subFolders, [
				'id' => $realNodeId,
				'folder_id' => $realNodeId,
				'entryid' => $rootId,
				'parent_entryid' => $rootId,
				'store_entryid' => $rootId,
				'props' => [
					'path' => $realNodeId,
					'icon_index' => ICON_FOLDER,
					// Fixme : remove text property. we have to use display_name property.
					'text' => $accountName,
					'has_subfolder' => empty($subFolders) === false,
					'object_type' => FILES_FOLDER,
					'filename' => $accountName,
					'display_name' => $accountName,
				],
			]);

			// TODO: dummy folder which used client side to show the account view when user
			//  switch to home folder using navigation bar.
			array_push($subFolders, [
				'id' => "#R#",
				'folder_id' => "#R#",
				'entryid' => "#R#",
				'parent_entryid' => $rootId,
				'store_entryid' => $rootId,
				'props' => [
					'path' => $realNodeId,
					'icon_index' => ICON_HOME_FOLDER,
					'text' => "Files",
					'has_subfolder' => false,
					'object_type' => FILES_FOLDER,
					'filename' => "Files",
					'display_name' => "Files",
				],
			]);
			$nodes["folders"] = ["item" => $subFolders];
			array_push($data["item"], $nodes);
		}

		return $data;
	}

	/**
	 * Function used to get the sub folders of the given folder id.
	 *
	 * @param string $nodeId    the folder id which used to get sub folders
	 * @param array  $backend   The backend which used to retrieve the folders
	 * @param bool   $recursive the recursive true which get the sub folder recursively
	 * @param array  $nodes     the nodes contains the array of nodes
	 *
	 * @return array return the array folders
	 */
	public function getSubFolders($nodeId, $backend, $recursive = false, $nodes = []) {
		// relative node ID. We need to trim off the #R# and account ID
		$relNodeId = substr($nodeId, strpos($nodeId, '/'));
		$nodeIdPrefix = substr($nodeId, 0, strpos($nodeId, '/'));

		$accountID = $backend->getAccountID();

		// remove the trailing slash for the cache key
		$cachePath = rtrim($relNodeId, '/');
		if ($cachePath === "") {
			$cachePath = "/";
		}

		$backendDisplayName = $backend->backendDisplayName;
		$backendVersion = $backend->backendVersion;
		$cacheVersion = $this->getVersionFromCache($backendDisplayName, $accountID);
		$dir = $this->getCache($accountID, $cachePath);

		// Get new data from backend when cache is empty or the version of backend got changed.
		if (is_null($dir) || version_compare($backendVersion, $cacheVersion) !== 0) {
			$this->setVersionInCache($backendDisplayName, $backendVersion, $accountID);
			$dir = $backend->ls($relNodeId);
		}

		if ($dir) {
			$updateCache = false;
			foreach ($dir as $id => $node) {
				$objectType = strcmp($node['resourcetype'], "collection") !== 0 ? FILES_FILE : FILES_FOLDER;

				// Only get the Folder item.
				if ($objectType !== FILES_FOLDER) {
					continue;
				}

				// Check if foldernames have a trailing slash, if not, add one!
				if (!StringUtil::endsWith($id, "/")) {
					unset($dir[$id]);
					$id .= "/";
					$dir[$id] = $node;
				}

				$size = $node['getcontentlength'] === null ? -1 : intval($node['getcontentlength']);
				// folder's dont have a size
				$size = $objectType == FILES_FILE ? $size : -1;

				$realID = $nodeIdPrefix . $id;
				$filename = stringToUTF8Encode(basename($id));

				if (!isset($node['entryid']) || !isset($node['parent_entryid']) || !isset($node['store_entryid'])) {
					$parentNode = $this->getParentNode($cachePath, $accountID);

					$entryid = $this->createId($realID);
					$parentEntryid = $parentNode !== false && isset($parentNode['entryid']) ? $parentNode['entryid'] : $this->createId($nodeId);
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

				$nodeHasSubFolder = $this->hasSubFolder($id, $accountID, $backend);
				// Skip displaying folder whose data is unaccesable.
				// Also update the cache.
				if (is_null($nodeHasSubFolder)) {
					unset($dir[$id]);
					$updateCache = true;
				}
				else {
					array_push($nodes, [
						'id' => $realID,
						'folder_id' => $realID,
						'entryid' => $entryid,
						'parent_entryid' => $parentEntryid,
						'store_entryid' => $storeEntryid,
						'props' => [
							'path' => $nodeId,
							'message_size' => $size,
							'text' => $filename,
							'object_type' => $objectType,
							'icon_index' => ICON_FOLDER,
							'filename' => $filename,
							'display_name' => $filename,
							'lastmodified' => strtotime($node['getlastmodified']) * 1000,
							'has_subfolder' => $nodeHasSubFolder,
						],
					]);
				}

				// We need to call this function recursively when user rename the folder.
				// we have to send all sub folder as server side notification so grommunio Web
				// can update the sub folder as per it's parent folder is renamed.
				if ($objectType === FILES_FOLDER && $recursive) {
					$nodes = $this->getSubFolders($realID, $backend, true, $nodes);
				}
			}

			if ($updateCache) {
				$this->setCache($accountID, $cachePath, $dir);
			}
		}

		return $nodes;
	}

	/**
	 * Function which used to get the parent folder of selected folder.
	 *
	 * @param string $cachePath the cache path of selected folder
	 * @param string $accountID the account ID in which folder is belongs
	 *
	 * @return array|bool return the parent folder data else false
	 */
	public function getParentNode($cachePath, $accountID) {
		$parentNode = dirname($cachePath, 1);

		// remove the trailing slash for the cache key
		$parentNode = rtrim($parentNode, '/');
		if ($parentNode === "") {
			$parentNode = "/";
		}
		$dir = $this->getCache($accountID, $parentNode);

		if (!is_null($dir) && isset($dir[$cachePath . '/'])) {
			return $dir[$cachePath . '/'];
		}

		return false;
	}

	/**
	 * Function create the unique id.
	 *
	 * @param {string} $id The folder id
	 *
	 * @return return generated a hash value
	 */
	public function createId($id) {
		return hash("tiger192,3", $id);
	}

	/**
	 * Function will check that given folder has sub folder or not.
	 * This will retrurn null when there's an exception retrieving folder data.
	 *
	 * @param {String} $id The $id is id of selected folder
	 * @param $accountID
	 * @param $backend
	 *
	 * @return bool or null when unable to access folder data
	 */
	public function hasSubFolder($id, $accountID, $backend) {
		$cachePath = rtrim($id, '/');
		if ($cachePath === "") {
			$cachePath = "/";
		}

		$dir = $this->getCache($accountID, $cachePath);
		if (is_null($dir)) {
			try {
				$dir = $backend->ls($id);
				$this->setCache($accountID, $cachePath, $dir);
			}
			catch (Exception $e) {
				$errorCode = $e->getCode();

				// If folder not found or folder doesn't have enough access then don't display that folder.
				if ($errorCode === self::SMB_ERR_UNAUTHORIZED ||
				$errorCode === self::SMB_ERR_FORBIDDEN ||
				$errorCode === self::FTP_WD_OWNCLOUD_ERR_UNAUTHORIZED ||
				$errorCode === self::FTP_WD_OWNCLOUD_ERR_FORBIDDEN ||
				$errorCode === self::ALL_BACKEND_ERR_NOTFOUND) {
					if ($errorCode === self::ALL_BACKEND_ERR_NOTFOUND) {
						Logger::error(self::LOG_CONTEXT, '[hasSubFolder]: folder ' . $id . ' not found');
					}
					else {
						Logger::error(self::LOG_CONTEXT, '[hasSubFolder]: Access denied for folder ' . $id);
					}

					return null;
				}
				// rethrow exception if its not related to access permission.
				throw $e;
			}
		}

		if ($dir) {
			foreach ($dir as $id => $node) {
				if (strcmp($node['resourcetype'], "collection") === 0) {
					// we have a folder
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * @param $actionType
	 * @param $actionData
	 *
	 * @throws \Files\Backend\Exception
	 */
	public function save($actionData) {
		$response = [];
		$props = $actionData["props"];
		$messageProps = [];
		if (isset($actionData["entryid"]) && empty($actionData["entryid"])) {
			$path = isset($props['path']) && !empty($props['path']) ? $props['path'] : "/";

			$relDirname = substr($path, strpos($path, '/'));
			$relDirname = $relDirname . $props["display_name"] . '/';
			$account = $this->accountFromNode($path);

			// initialize the backend
			$initializedBackend = $this->initializeBackend($account, true);
			$relDirname = stringToUTF8Encode($relDirname);
			$result = $initializedBackend->mkcol($relDirname); // create it !

			$filesPath = substr($path, strpos($path, '/'));
			$dir = $initializedBackend->ls($filesPath);

			$id = $path . $props["display_name"] . '/';

			$actionId = $account->getId();

			$entryid = $this->createId($id);
			$parentEntryid = $actionData["parent_entryid"];
			$storeEntryid = $this->createId('#R#' . $actionId . '/');

			$cachePath = rtrim($relDirname, '/');
			if ($cachePath === "") {
				$cachePath = "/";
			}

			if (isset($dir[$relDirname]) && !empty($dir[$relDirname])) {
				$newDir = $dir[$relDirname];
				$newDir['entryid'] = $entryid;
				$newDir['parent_entryid'] = $parentEntryid;
				$newDir['store_entryid'] = $storeEntryid;

				// Get old cached data.
				$cachedDir = $this->getCache($actionId, dirname($cachePath, 1));

				// Insert newly created folder info with entryid, parentEntryid and storeEntryid
				// in already cached data.
				$cachedDir[$relDirname] = $newDir;
				$dir = $cachedDir;
			}

			// Delete old cache.
			$this->deleteCache($actionId, dirname($relDirname));

			// Set data in cache.
			$this->setCache($actionId, dirname($relDirname), $dir);

			if ($result) {
				$folder = [
					'props' => [
						'path' => $path,
						'filename' => $props["display_name"],
						'display_name' => $props["display_name"],
						'text' => $props["display_name"],
						'object_type' => $props['object_type'],
						'has_subfolder' => false,
					],
					'id' => rawurldecode($id),
					'folder_id' => rawurldecode($id),
					'entryid' => $entryid,
					'parent_entryid' => $parentEntryid,
					'store_entryid' => $storeEntryid,
				];
				$response = $folder;
			}
		}
		else {
			// Rename/update the folder/file name
			$folderId = $actionData['message_action']["source_folder_id"];
			// rename/update the folder or files name.
			$parentEntryid = $actionData["parent_entryid"];

			$isfolder = "";
			if (substr($folderId, -1) == '/') {
				$isfolder = "/"; // we have a folder...
			}

			$src = rtrim($folderId, '/');
			$dstdir = dirname($src) == "/" ? "" : dirname($src);
			$dst = $dstdir . "/" . rtrim($props['filename'], '/');

			$relDst = substr($dst, strpos($dst, '/'));
			$relSrc = substr($src, strpos($src, '/'));

			$account = $this->accountFromNode($src);

			// initialize the backend
			$initializedBackend = $this->initializeBackend($account);

			$result = $initializedBackend->move($relSrc, $relDst, false);

			// get the cache data of parent directory.
			$dir = $this->getCache($account->getId(), dirname($relSrc));
			if (isset($dir[$relSrc . "/"]) && !empty($dir[$relSrc . "/"])) {
				$srcDir = $dir[$relSrc . "/"];
				unset($dir[$relSrc . "/"]);
				$dir[$relDst . "/"] = $srcDir;

				// Update only rename folder info in php cache.
				$this->setCache($account->getId(), dirname($relSrc), $dir);

				$this->updateCacheAfterRename($relSrc, $relDst, $account->getId());
			}
			else {
				// clear the cache
				$this->deleteCache($account->getId(), dirname($relSrc));
			}

			if ($result) {
				/* create the response object */
				$folder = [];

				// some requests might not contain a new filename... so dont update the store
				if (isset($props['filename'])) {
					$folder = [
						'props' => [
							'folder_id' => rawurldecode($dst . $isfolder),
							'path' => rawurldecode($dstdir),
							'filename' => $props['filename'],
							'display_name' => $props['filename'],
						],
						'entryid' => $actionData["entryid"],
						'parent_entryid' => $parentEntryid,
						'store_entryid' => $actionData["store_entryid"],
					];
				}
				$response['item'] = $folder;
				$messageProps = $folder;
			}
		}

		$this->addActionData("update", $response);
		$GLOBALS["bus"]->addData($this->getResponseData());

		return $messageProps;
	}

	/**
	 * Update the cache of renamed folder and it's sub folders.
	 *
	 * @param {String} $oldPath The $oldPath is path of folder before rename
	 * @param {String} $newPath The $newPath is path of folder after rename
	 * @param {String} $accountId The id of an account in which renamed folder is belongs
	 */
	public function updateCacheAfterRename($oldPath, $newPath, $accountId) {
		// remove the trailing slash for the cache key
		$cachePath = rtrim($oldPath, '/');
		if ($cachePath === "") {
			$cachePath = "/";
		}

		$dir = $this->getCache($accountId, $cachePath);
		if ($dir) {
			foreach ($dir as $id => $node) {
				$newId = str_replace(dirname($id), $newPath, $id);
				unset($dir[$id]);
				$dir[$newId] = $node;

				$type = FILES_FILE;

				if (strcmp($node['resourcetype'], "collection") == 0) { // we have a folder
					$type = FILES_FOLDER;
				}

				if ($type === FILES_FOLDER) {
					$this->updateCacheAfterRename($id, rtrim($newId, '/'), $accountId);
				}
			}
			$this->deleteCache($accountId, $cachePath);
			$this->setCache($accountId, $newPath, $dir);
		}
	}

	/**
	 * Function used to notify the sub folder of selected/modified folder.
	 *
	 * @param {String} $folderID The $folderID of a folder which is modified
	 */
	public function notifySubFolders($folderID) {
		$account = $this->accountFromNode($folderID);
		$initializedBackend = $this->initializeBackend($account, true);
		$folderData = $this->getSubFolders($folderID, $initializedBackend, true);

		if (!empty($folderData)) {
			$GLOBALS["bus"]->notify(REQUEST_ENTRYID, OBJECT_SAVE, $folderData);
		}
	}

	/**
	 * Get the account id from a node id.
	 *
	 * @param {String} $nodeID Id of the file or folder to operate on
	 *
	 * @return {String} The account id extracted from $nodeId
	 */
	public function accountIDFromNode($nodeID) {
		return substr($nodeID, 3, (strpos($nodeID, '/') - 3)); // parse account id from node id
	}

	/**
	 * Get the account from a node id.
	 *
	 * @param {String} $nodeId ID of the file or folder to operate on
	 * @param mixed $nodeID
	 *
	 * @return {String} The account for $nodeId
	 */
	public function accountFromNode($nodeID) {
		return $this->accountStore->getAccount($this->accountIDFromNode($nodeID));
	}

	/**
	 * Create a key used to store data in the cache.
	 *
	 * @param {String} $accountID Id of the account of the data to cache
	 * @param {String} $path Path of the file or folder to create the cache element for
	 *
	 * @return {String} The created key
	 */
	public function makeCacheKey($accountID, $path) {
		return $this->uid . md5($accountID . $path);
	}

	/**
	 * Get version data form the cache.
	 *
	 * @param {String} $displayName display name of the backend or file plugin
	 * @param {String} $accountID Id of the account of the data to cache
	 *
	 * @return {String} version data or null if nothing was found
	 */
	public function getVersionFromCache($displayName, $accountID = '') {
		$key = $this->uid . $accountID . $displayName;

		return $this->cache->getItem($key)->get();
	}

	/**
	 * Set version data in the cache only when version data has been changed.
	 *
	 * @param {String} $displayName display name of the backend or file plugin
	 * @param {String} $version version info of backend or file plugin which needs to be cached
	 * @param {String} $accountID Id of the account of the data to cache
	 */
	public function setVersionInCache($displayName, $version, $accountID = '') {
		$olderVersionFromCache = $this->getVersionFromCache($displayName, $accountID);
		// If version of files/backend is same then return.
		if (version_compare($olderVersionFromCache, $version) === 0) {
			return;
		}

		$key = $this->uid . $accountID . $displayName;
		$this->cache->save($this->cache->getItem($key)->set($version));
	}

	/**
	 * Initialize the backend for the given account.
	 *
	 * @param {Object} $account The account object the backend should be initialized for
	 * @param {Bool} $setID Should the accountID be set in the backend object, or not. Defaults to false.
	 *
	 * @return {Object} The initialized backend
	 */
	public function initializeBackend($account, $setID = false) {
		$backend = $this->backendStore->getInstanceOfBackend($account->getBackend());
		$backend->init_backend($account->getBackendConfig());
		if ($setID) {
			$backend->setAccountID($account->getId());
		}
		$backend->open();

		return $backend;
	}

	/**
	 * Save directory data in the cache.
	 *
	 * @param {String} $accountID Id of the account of the data to cache
	 * @param {String} $path Path of the file or folder to create the cache element for
	 * @param {String} $data Data to be cached
	 */
	public function setCache($accountID, $path, $data) {
		$key = $this->makeCacheKey($accountID, $path);
		Logger::debug(self::LOG_CONTEXT, "Setting cache for node: " . $accountID . $path . " ## " . $key);
		$this->cache->save($this->cache->getItem($key)->set($data));
	}

	/**
	 * Get directotry data form the cache.
	 *
	 * @param {String} $accountID Id of the account of the data to get
	 * @param {String} $path Path of the file or folder to retrieve the cache element for
	 *
	 * @return {String} The directory data or null if nothing was found
	 */
	public function getCache($accountID, $path) {
		$key = $this->makeCacheKey($accountID, $path);
		Logger::debug(self::LOG_CONTEXT, "Getting cache for node: " . $accountID . $path . " ## " . $key);

		return $this->cache->getItem($key)->get();
	}

	/**
	 * Remove data from the cache.
	 *
	 * @param {String} $accountID Id of the account to delete the cache for
	 * @param {String} $path Path of the file or folder to delete the cache element
	 */
	public function deleteCache($accountID, $path) {
		$key = $this->makeCacheKey($accountID, $path);
		Logger::debug(self::LOG_CONTEXT, "Removing cache for node: " . $accountID . $path . " ## " . $key);
		$this->cache->deleteItem($key);
	}

	/**
	 * Function clear the cache.
	 */
	public function clearCache() {
		$this->cache->clear();
	}

	/**
	 * Function which returns MAPI Message Store Object. It
	 * searches in the variable $action for a storeid.
	 *
	 * @param array $action the XML data retrieved from the client
	 *
	 * @return object MAPI Message Store Object, false if storeid is not found in the $action variable
	 */
	public function getActionStore($action) {
		$store = false;

		if (isset($action["store_entryid"]) && !empty($action["store_entryid"])) {
			if (is_array($action["store_entryid"])) {
				$store = [];
				foreach ($action["store_entryid"] as $store_id) {
					array_push($store, $store_id);
				}
			}
			else {
				$store = $action["store_entryid"];
			}
		}

		return $store;
	}
}
