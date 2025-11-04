<?php

/** @noinspection PhpMultipleClassDeclarationsInspection */

declare(strict_types=1);

namespace Files\Backend\Seafile;

require_once __DIR__ . '/../../files/php/Files/Backend/class.abstract_backend.php';
require_once __DIR__ . '/../../files/php/Files/Backend/class.exception.php';
require_once __DIR__ . '/../../files/php/Files/Backend/interface.quota.php';
require_once __DIR__ . '/../../files/php/Files/Backend/interface.version.php';
require_once __DIR__ . '/lib/seafapi/autoload.php';

require_once __DIR__ . '/Model/Timer.php';
require_once __DIR__ . '/Model/Config.php';
require_once __DIR__ . '/Model/ConfigUtil.php';
require_once __DIR__ . '/Model/SsoBackend.php';

use Datamate\SeafileApi\Exception;
use Datamate\SeafileApi\SeafileApi;
use Files\Backend\AbstractBackend;
use Files\Backend\Exception as BackendException;
use Files\Backend\iFeatureVersionInfo;
use Files\Backend\Seafile\Model\Config;
use Files\Backend\Seafile\Model\ConfigUtil;
use Files\Backend\Seafile\Model\SsoBackend;
use Files\Backend\Seafile\Model\Timer;
use Files\Core\Util\Logger;
use Throwable;

/**
 * Seafile Backend.
 *
 * Seafile backend for the Grommunio files plugin; bound against the Seafile
 * REST API {@link https://download.seafile.com/published/web-api}.
 */
final class Backend extends AbstractBackend implements iFeatureVersionInfo {
	public const LOG_CONTEXT = "SeafileBackend"; // Context for the Logger

	/**
	 * @var string gettext domain
	 */
	private const GT_DOMAIN = 'plugin_filesbackendSeafile';

	/**
	 * Seafile "usage" number ("bytes") to Grommunio usage display number ("bytes") multiplier.
	 *
	 * 1 megabyte in bytes within Seafile represents 1 mebibyte in bytes for Grommunio
	 *
	 * (Seafile Usage "Bytes" U) / 1000 / 1000 * 1024 * 1024 (1.048576)
	 */
	private const QUOTA_MULTIPLIER_SEAFILE_TO_GROMMUNIO = 1.048576;

	/**
	 * Error codes.
	 *
	 * @see parseErrorCodeToMessage for description
	 * @see Backend::backendException() for Seafile API handling
	 */
	private const SFA_ERR_UNAUTHORIZED = 401;
	private const SFA_ERR_FORBIDDEN = 403;
	private const SFA_ERR_NOTFOUND = 404;
	private const SFA_ERR_NOTALLOWED = 405;
	private const SFA_ERR_TIMEOUT = 408;
	private const SFA_ERR_LOCKED = 423;
	private const SFA_ERR_FAILED_DEPENDENCY = 423;
	private const SFA_ERR_INTERNAL = 500;
	private const SFA_ERR_UNREACHABLE = 800;
	private const SFA_ERR_TMP = 801;
	private const SFA_ERR_FEATURES = 802;
	private const SFA_ERR_NO_CURL = 803;
	private const SFA_ERR_UNIMPLEMENTED = 804;

	/**
	 * @var ?SeafileApi the Seafile API client
	 */
	private ?SeafileApi $seafapi = null;

	/**
	 * Configuration data for the Ext JS metaform.
	 */
	private array $metaConfig = [];

	/**
	 * Debug flag that mirrors `PLUGIN_FILESBROWSER_LOGLEVEL`.
	 */
	private bool $debug = false;

	private readonly Config $config;

	private ?SsoBackend $sso = null;

	/**
	 * Backend name used in translations.
	 */
	private string $backendTransName = '';

	/**
	 * Seafile backend constructor.
	 */
	public function __construct() {
		// initialization
		$this->debug = PLUGIN_FILESBROWSER_LOGLEVEL === 'DEBUG';

		$this->config = new Config();

		$this->init_form();

		// set backend description
		$this->backendDescription = dgettext(self::GT_DOMAIN, "With this backend, you can connect to any Seafile server.");

		// set backend display name
		$this->backendDisplayName = "Seafile";

		// set backend version
		$this->backendVersion = "2.0.69";

		// set backend name used in translations
		$this->backendTransName = dgettext(self::GT_DOMAIN, 'Files ' . $this->backendDisplayName . ' Backend: ');
	}

	// //////////////////////////////////////////////////////////////////////////
	// / seafapi backend methods                                              ///
	// //////////////////////////////////////////////////////////////////////////

	/**
	 * Opens the connection to the Seafile server.
	 *
	 * @return bool true if action succeeded
	 *
	 * @throws BackendException if connection is not successful
	 */
	public function open() {
		$url = $this->config->getApiUrl();

		try {
			$this->sso->open();
		}
		catch (\Throwable $throwable) {
			$this->backendException($throwable);
		}

		try {
			$this->seafapi = new SeafileApi($url, $this->config->user, $this->config->pass);
		}
		catch (\Throwable $throwable) {
			$this->backendException($throwable);
		}

		return true;
	}

	/**
	 * This function will read a list of files and folders from the server.
	 *
	 * @param string $dir       to get listing from
	 * @param bool   $hidefirst skip the first entry (we ignore this for the Seafile backend)
	 *
	 * @return array
	 *
	 * @throws BackendException
	 */
	public function ls($dir, $hidefirst = true) {
		$timer = new Timer();
		$this->log("[LS] '{$dir}'");

		if (trim($dir, '/') === '') {
			try {
				$listing = $this->seafapi->listLibraries();
			}
			catch (\Throwable $throwable) {
				$this->backendException($throwable);
			}

			goto result;
		}

		$lsDir = $this->splitGrommunioPath($dir);
		if ($lsDir->lib === null) {
			// the library does not exist, the listing is short.
			$listing = [];

			goto result;
		}

		try {
			$listing = $this->seafapi->listItemsInDirectory($lsDir->lib, $lsDir->path ?? '');
		}
		catch (\Throwable $throwable) {
			$this->backendException($throwable);
		}

		result:

		$result = [];
		$baseDir = rtrim($dir, '/') . '/';
		foreach ($listing as $node) {
			if (!isset($this->seafapi::TYPES[$node->type])) {
				$this->backendException(
					new \UnexpectedValueException(sprintf('Unhandled Seafile node-type "%s" (for "%s")', $node->type, $node->name))
				);
			}
			$isDir = isset($this->seafapi::TYPES_DIR_LIKE[$node->type]);
			$name = rtrim($baseDir . $node->name, '/') . '/';
			$isDir || $name = rtrim($name, '/');
			$result[$name] = [
				'resourcetype' => $isDir ? 'collection' : 'file',
				'getcontentlength' => $isDir ? null : $node->size,
				'getlastmodified' => date('r', $node->mtime),
				'getcontenttype' => null,
				'quota-used-bytes' => null,
				'quota-available-bytes' => null,
			];
		}

		$this->log("[LS] done in {$timer} seconds.");

		return $result;
	}

	/**
	 * Creates a new directory on the server.
	 *
	 * @param string $dir
	 *
	 * @return bool
	 *
	 * @throws BackendException
	 */
	public function mkcol($dir) {
		$timer = new Timer();
		$this->log("[MKCOL] '{$dir}'");

		if ($this->isLibrary($dir)) {
			// create library
			try {
				$result = $this->seafapi->createLibrary($dir);
				unset($result);
			}
			catch (\Throwable $throwable) {
				$this->backendException($throwable);
			}
			$success = true;
		}
		else {
			// create directory within library
			$lib = $this->seafapi->getLibraryFromPath($dir)->id;
			[, $path] = explode('/', trim($dir, '/'), 2);

			try {
				$result = $this->seafapi->createNewDirectory($lib, $path);
			}
			catch (\Throwable $throwable) {
				$this->backendException($throwable);
			}
			$success = $result === 'success';
		}

		$this->log("[MKCOL] done in {$timer} seconds.");

		return $success;
	}

	/**
	 * Deletes a files or folder from the backend.
	 *
	 * @param string $path
	 *
	 * @return bool
	 *
	 * @throws BackendException
	 */
	public function delete($path) {
		$timer = new Timer();
		$this->log("[DELETE] '{$path}'");

		if ($this->isLibrary($path)) {
			// delete library
			try {
				$this->seafapi->deleteLibraryByName($path);
				$result = 'success';
			}
			catch (\Throwable $throwable) {
				$this->backendException($throwable);
			}
		}
		else {
			// delete file or directory within library
			$deletePath = $this->splitGrommunioPath($path);

			try {
				$result = $this->seafapi->deleteFile($deletePath->lib, $deletePath->path);
			}
			catch (\Throwable $throwable) {
				$this->backendException($throwable);
			}
		}

		$this->log("[DELETE] done in {$timer} seconds.");

		return $result === 'success';
	}

	/**
	 * Move a file or collection on the backend server (serverside).
	 *
	 * @param string $src_path  Source path
	 * @param string $dst_path  Destination path
	 * @param bool   $overwrite Overwrite file if exists in $dest_path
	 *
	 * @return bool
	 *
	 * @throws BackendException
	 */
	public function move($src_path, $dst_path, $overwrite = false) {
		$timer = new Timer();
		$this->log("[MOVE] '{$src_path}' -> '{$dst_path}'");

		// check if the move operation would move src into itself - error condition
		if (str_starts_with($dst_path, $src_path . '/')) {
			$this->backendError(self::SFA_ERR_FORBIDDEN, 'Moving failed');
		}

		// move library/file/directory is one of in the following order:
		// 1/5: rename library
		// 2/5: noop - source and destination are the same
		// 3/5: rename file/directory
		// 4/5: move file/directory
		// 5/5: every other operation (e.g. move library into another library) is not implemented

		$src = $this->splitGrommunioPath($src_path);
		$dst = $this->splitGrommunioPath($dst_path);

		// 1/5: rename library
		if ($src->path === null && $dst->path === null) {
			if ($dst->lib !== null) {
				// rename to an existing library name (not allowed as not supported)
				$this->backendError(self::SFA_ERR_NOTALLOWED, 'Moving failed');
			}

			try {
				$this->seafapi->renameLibrary($src->libName, $dst->libName);
				$result = true;
			}
			catch (\Throwable $throwable) {
				$this->backendException($throwable);
			}

			goto done;
		}

		$isIntraLibTransaction = $src->libName === $dst->libName;

		// 2/5: noop - src and dst are the same
		if ($isIntraLibTransaction && $src->path === $dst->path) {
			// source and destination are the same path, nothing to do
			$result = 'success';

			goto done;
		}

		$dirNames = array_map('dirname', [$src->path, $dst->path]);
		$pathsHaveSameDirNames = $dirNames[0] === $dirNames[1];

		// 3/5: rename file/directory
		if ($isIntraLibTransaction && $pathsHaveSameDirNames) {
			try {
				$result = $this->seafapi->renameFile($src->lib, $src->path, basename($dst->path));
			}
			catch (\Throwable $throwable) {
				$this->backendException($throwable);
			}

			goto done;
		}

		// 4/5: move file/directory
		if (isset($src->path, $dst->lib)) {
			try {
				$result = $this->seafapi->moveFile($src->lib, $src->path, $dst->lib, $dirNames[1]);
			}
			catch (\Throwable $throwable) {
				$this->backendException($throwable);
			}
		}

		done:

		// 5/5: every other operation (move library into another library, not implemented)
		if (!isset($result)) {
			$this->backendError(self::SFA_ERR_UNIMPLEMENTED, 'Not implemented.');
		}

		$this->log("[MOVE] done in {$timer} seconds.");

		return $result === 'success';
	}

	/**
	 * Download a remote file to a buffer variable.
	 *
	 * @param string $path   The source path on the server
	 * @param mixed  $buffer Buffer for the received data
	 *
	 * @return bool true if action succeeded
	 *
	 * @throws BackendException if request is not successful
	 */
	public function get($path, &$buffer) {
		$timer = new Timer();
		$this->log("[GET] '{$path}'");

		$src = $this->splitGrommunioPath($path);

		try {
			$result = $this->seafapi->downloadFileAsBuffer($src->lib, $src->path);
		}
		catch (\Throwable $throwable) {
			$this->backendException($throwable);
		}

		$success = $result !== false;

		if ($success) {
			$buffer = $result;
		}

		$this->log("[GET] done in {$timer} seconds.");

		return $success;
	}

	/**
	 * Download a remote file to a local file.
	 *
	 * @param string $srcpath   Source path on server
	 * @param string $localpath Destination path on local filesystem
	 *
	 * @return bool true if action succeeded
	 *
	 * @throws BackendException if request is not successful
	 */
	public function get_file($srcpath, $localpath) {
		$timer = new Timer();
		$this->log("[GET_FILE] '{$srcpath}' -> '{$localpath}'");

		$src = $this->splitGrommunioPath($srcpath);

		try {
			$result = $this->seafapi->downloadFileToFile($src->lib, $src->path, $localpath);
		}
		catch (\Throwable $throwable) {
			$this->backendException($throwable);
		}

		$this->log("[GET_FILE] done in {$timer} seconds.");

		return $result;
	}

	/**
	 * Puts a file into a collection.
	 *
	 * @param string $path Destination path
	 * @param mixed  $data
	 *
	 * @string mixed $data Any kind of data
	 *
	 * @return bool true if action succeeded
	 *
	 * @throws BackendException if request is not successful
	 */
	public function put($path, $data) {
		$timer = new Timer();
		$this->log(sprintf("[PUT] start: path: %s (%d)", $path, strlen((string) $data)));

		$target = $this->splitGrommunioPath($path);

		try {
			/** @noinspection PhpUnusedLocalVariableInspection */
			$result = $this->seafapi->uploadBuffer($target->lib, $target->path, $data);
		}
		catch (\Throwable $throwable) {
			$this->backendException($throwable);
		}

		$this->log("[PUT] done in {$timer} seconds.");

		return true;
	}

	/**
	 * Upload a local file.
	 *
	 * @param string $path     Destination path on the server
	 * @param string $filename Local filename for the file that should be uploaded
	 *
	 * @return bool true if action succeeded
	 *
	 * @throws BackendException if request is not successful
	 */
	public function put_file($path, $filename) {
		$timer = new Timer();
		$this->log(sprintf("[PUT_FILE] %s -> %s", $filename, $path));

		// filename can be null if an attachment of draft-email that has not been saved
		if (empty($filename)) {
			return false;
		}

		$target = $this->splitGrommunioPath($path);

		// put file into users default library if no library given
		if ($target->path === null && $target->libName !== null) {
			try {
				$defaultLibrary = $this->seafapi->getDefaultLibrary();
			}
			catch (\Throwable $throwable) {
				$this->backendException($throwable);
			}
			if (isset($defaultLibrary->repo_id, $defaultLibrary->exists) && $defaultLibrary->exists === true) {
				$target->path = $target->libName;
				$target->libName = null;
				$target->lib = $defaultLibrary->repo_id;
			}
		}

		try {
			/** @noinspection PhpUnusedLocalVariableInspection */
			$result = $this->seafapi->uploadFile($target->lib, $target->path, $filename);
		}
		catch (\Throwable $throwable) {
			$this->backendException($throwable);
		}

		$this->log("[PUT_FILE] done in {$timer} seconds.");

		return true;
	}

	// //////////////////////////////////////////////////////////////////////////
	// / non-seafapi backend implementation                                   ///
	// //////////////////////////////////////////////////////////////////////////

	/**
	 * Initialize backend from $backend_config array.
	 *
	 * @param mixed $backend_config
	 */
	public function init_backend($backend_config) {
		$config = $backend_config;

		if (!empty($config["use_grommunio_credentials"])) {
			// For backward compatibility we will check if the Encryption store exists. If not,
			// we will fall back to the old way of retrieving the password from the session.
			if (class_exists('EncryptionStore')) {
				// Get the username and password from the Encryption store
				$encryptionStore = \EncryptionStore::getInstance();
				if ($encryptionStore instanceof \EncryptionStore) {
					$config['user'] = $encryptionStore->get('username');
					$config['password'] = $encryptionStore->get('password');
				}
			}
			else {
				$config['user'] = ConfigUtil::loadSmtpAddress();
				$password = $_SESSION['password'];
				// Prefer plugin-specific KEY/IV if defined, then legacy names; otherwise, fall back
				$key = null;
				$iv = null;
				if (\defined('FILES_PASSWORD_KEY')) {
					$key = \constant('FILES_PASSWORD_KEY');
				}
				elseif (\defined('PASSWORD_KEY')) {
					$key = \constant('PASSWORD_KEY');
				}
				if (\defined('FILES_PASSWORD_IV')) {
					$iv = \constant('FILES_PASSWORD_IV');
				}
				elseif (\defined('PASSWORD_IV')) {
					$iv = \constant('PASSWORD_IV');
				}

				if (\function_exists('openssl_decrypt') && is_string($key) && is_string($iv) && $key !== '' && $iv !== '') {
					$dec = \openssl_decrypt($password, 'des-ede3-cbc', $key, 0, $iv);
					$config['password'] = ($dec !== false) ? $dec : $password;
				}
				else {
					// If no KEY/IV configured, assume plaintext session password
					$config['password'] = $password;
				}
			}
		}

		$this->config->importConfigArray($config);

		SsoBackend::bind($this->sso)->initBackend($this->config);

		Logger::debug(self::LOG_CONTEXT, __FUNCTION__ . ' done.');
	}

	/**
	 * @return false|string
	 *
	 * @noinspection PhpMultipleClassDeclarationsInspection Grommunio has a \JsonException shim
	 */
	public function getFormConfig() {
		try {
			$json = json_encode($this->metaConfig, JSON_THROW_ON_ERROR);
		}
		catch (\JsonException $e) {
			$this->log(sprintf('[%s]: %s', $e::class, $e->getMessage()));
			$json = false;
		}

		return $json;
	}

	public function getFormConfigWithData() {
		return $this->getFormConfig();
	}

	/**
	 * set debug on (1) or off (0).
	 * produces a lot of debug messages in webservers error log if set to on (1).
	 *
	 * @param bool $debug enable or disable debugging
	 */
	public function set_debug($debug) {
		$this->debug = (bool) $debug;
	}

	// //////////////////////////////////////////////////////////////////////////
	// / not_used_implemented()                                               ///
	// //////////////////////////////////////////////////////////////////////////

	/**
	 * Duplicates a folder on the backend server.
	 *
	 * @param string $src_path
	 * @param string $dst_path
	 * @param bool   $overwrite
	 *
	 * @return bool
	 *
	 * @throws BackendException
	 *
	 * @noinspection PhpReturnDocTypeMismatchInspection Upstream Interface Issue
	 */
	public function copy_coll($src_path, $dst_path, $overwrite = false) {
		$this->backendError(self::SFA_ERR_UNIMPLEMENTED, 'Not implemented');
	}

	/**
	 * Duplicates a file on the backend server.
	 *
	 * @param string $src_path
	 * @param string $dst_path
	 * @param bool   $overwrite
	 *
	 * @return bool
	 *
	 * @throws BackendException
	 *
	 * @noinspection PhpReturnDocTypeMismatchInspection Upstream Interface Issue
	 */
	public function copy_file($src_path, $dst_path, $overwrite = false) {
		$this->backendError(self::SFA_ERR_UNIMPLEMENTED, 'Not implemented');
	}

	/**
	 * Checks if the given $path exists on the remote server.
	 *
	 * @param string $path
	 *
	 * @return bool
	 *
	 * @throws BackendException
	 *
	 * @noinspection PhpReturnDocTypeMismatchInspection Upstream Interface Issue
	 */
	public function exists($path) {
		$this->backendError(self::SFA_ERR_UNIMPLEMENTED, 'Not implemented');
	}

	/**
	 * Gets path information from Seafile server.
	 *
	 * @param string $path
	 *
	 * @return array directory info
	 *
	 * @throws BackendException if request is not successful
	 */
	public function gpi($path) {
		$this->log("[GPI] '{$path}'");
		$list = $this->ls(dirname($path), false); // get contents of the parent dir

		if (isset($list[$path])) {
			return $list[$path];
		}

		$this->log('[GPI] wrong response from ls');
		$this->backendError(self::SFA_ERR_FAILED_DEPENDENCY, 'Connection failed');
	}

	/**
	 * Checks if the given $path is a folder.
	 *
	 * @param string $path
	 *
	 * @return bool
	 *
	 * @throws BackendException
	 *
	 * @noinspection PhpReturnDocTypeMismatchInspection Upstream Interface Issue
	 */
	public function is_dir($path) {
		$this->backendError(self::SFA_ERR_UNIMPLEMENTED, 'Not implemented');
	}

	/**
	 * Checks if the given $path is a file.
	 *
	 * @param string $path
	 *
	 * @return bool
	 *
	 * @throws BackendException
	 *
	 * @noinspection PhpReturnDocTypeMismatchInspection Upstream Interface Issue
	 */
	public function is_file($path) {
		$this->backendError(self::SFA_ERR_UNIMPLEMENTED, 'Not implemented');
	}

	// ///////////////////////////////////////////////////////////
	// @see iFeatureVersionInfo implementation                 //
	// ///////////////////////////////////////////////////////////

	/**
	 * Return the version string of the server backend.
	 *
	 * @return string
	 *
	 * @throws BackendException
	 */
	public function getServerVersion() {
		try {
			return $this->seafapi->getServerVersion();
		}
		catch (\Throwable $throwable) {
			$this->backendException($throwable);
		}
	}

	// ///////////////////////////////////////////////////////////
	// @see iFeatureQuota implementation                       //
	// ///////////////////////////////////////////////////////////

	/**
	 * @param string $dir
	 *
	 * @return float
	 *
	 * @noinspection PhpMissingParamTypeInspection
	 * @noinspection PhpUnusedParameterInspection
	 */
	public function getQuotaBytesUsed($dir) {
		$return = $this->seafapi->checkAccountInfo();

		return ($return->usage ?? 0) * self::QUOTA_MULTIPLIER_SEAFILE_TO_GROMMUNIO;
	}

	/**
	 * @param string $dir
	 *
	 * @return float|int
	 *
	 * @noinspection PhpUnusedParameterInspection
	 * @noinspection PhpMissingParamTypeInspection
	 */
	public function getQuotaBytesAvailable($dir) {
		$return = $this->seafapi->checkAccountInfo();
		$avail = $return->total - $return->usage;
		if ((int) $return->total === -2) {
			return -1;
		}

		return $avail * self::QUOTA_MULTIPLIER_SEAFILE_TO_GROMMUNIO;
	}

	// ///////////////////////////////////////////////////////////
	// @internal private helper methods                        //
	// ///////////////////////////////////////////////////////////

	/**
	 * Initialise form fields.
	 */
	private function init_form() {
		$this->metaConfig = [
			"success" => true,
			"metaData" => [
				"fields" => [
					[
						"name" => "server_address",
						"fieldLabel" => dgettext(self::GT_DOMAIN, 'Server address'),
						"editor" => [
							"allowBlank" => false,
						],
					],
					[
						"name" => "server_port",
						"fieldLabel" => dgettext(self::GT_DOMAIN, 'Server port'),
						"editor" => [
							"ref" => "../../portField",
							"allowBlank" => false,
						],
					],
					[
						"name" => "server_ssl",
						"fieldLabel" => dgettext(self::GT_DOMAIN, 'Use SSL'),
						"editor" => [
							"xtype" => "checkbox",
							"listeners" => [
								"check" => "Zarafa.plugins.files.data.Actions.onCheckSSL", // this javascript function will be called!
							],
						],
					],
					[
						"name" => "user",
						"fieldLabel" => dgettext(self::GT_DOMAIN, 'Username'),
						"editor" => [
							"ref" => "../../usernameField",
						],
					],
					[
						"name" => "password",
						"fieldLabel" => dgettext(self::GT_DOMAIN, 'Password'),
						"editor" => [
							"ref" => "../../passwordField",
							"inputType" => "password",
						],
					],
					[
						"name" => "use_grommunio_credentials",
						"fieldLabel" => dgettext(self::GT_DOMAIN, 'Use grommunio credentials'),
						"editor" => [
							"xtype" => "checkbox",
							"listeners" => [
								"check" => "Zarafa.plugins.files.data.Actions.onCheckCredentials", // this javascript function will be called!
							],
						],
					],
				],
				"formConfig" => [
					"labelAlign" => "left",
					"columnCount" => 1,
					"labelWidth" => 80,
					"defaults" => [
						"width" => 292,
					],
				],
			],

			// here we can specify the default values.
			"data" => [
				"server_address" => "seafile.example.com",
				"server_port" => "443",
				"server_ssl" => "1",
				"server_path" => "",
				"use_grommunio_credentials" => "0",
				"user" => "",
				"password" => "",
			],
		];
	}

	/**
	 * split grommunio path into library and library path.
	 *
	 * obtains the seafile library ID (if available, otherwise NULL)
	 *
	 * return protocol: object{
	 *   lib: ?string     # library ID e.g. "ccc60923-8cdf-4cc8-8f71-df86aba3a085"
	 *   path: ?string    # path inside library, always prefixed with "/" if set
	 *   libName: ?string # name of the library
	 * }
	 *
	 * @throws Exception
	 */
	private function splitGrommunioPath(string $grommunioPath): object {
		static $libraries;
		$libraries ??= array_column($this->seafapi->listLibraries(), null, 'name');

		[, $libName, $path] = explode('/', $grommunioPath, 3) + [null, null, null];
		if ($path !== null) {
			$path = "/{$path}";
		}
		$lib = $libraries[$libName]->id ?? null;

		return (object) ['lib' => $lib, 'path' => $path, 'libName' => $libName];
	}

	/**
	 * test if a grommunio path is a library only.
	 */
	private function isLibrary(string $grommunioPath): bool {
		return substr_count(trim($grommunioPath, '/'), '/') === 0;
	}

	/**
	 * Turn a Backend error code into a Backend exception.
	 *
	 * @param int     $errorCode one of the Backend::SFA_ERR_* codes, e.g. {@see Backend::SFA_ERR_INTERNAL}
	 * @param ?string $title     msg-id from the plugin_files domain, e.g. 'PHP-CURL not installed'
	 *
	 * @return never
	 *
	 * @throws BackendException
	 */
	private function backendError(int $errorCode, ?string $title = null) {
		$message = $this->parseErrorCodeToMessage($errorCode);
		$title = $this->backendTransName;
		$this->backendErrorThrow($title, $message, $errorCode);
	}

	/**
	 * Throw a BackendException w/ title, message and code.
	 *
	 * @throws BackendException
	 */
	private function backendErrorThrow(string $title, string $message, int $code = 0): never {
		/** {@see BackendException} */
		$exception = new BackendException($message, $code);
		$exception->setTitle($title);

		throw $exception;
	}

	/**
	 * Turn a throwable/exception with the Seafile API into a Backend exception.
	 *
	 * @return never
	 *
	 * @throws BackendException
	 */
	private function backendException(\Throwable $t) {
		// if it is already a backend exception, throw it.
		if ($t instanceof BackendException) {
			throw $t;
		}

		[$callSite, $inFunc] = debug_backtrace();
		$logLabel = "{$inFunc['function']}:{$callSite['line']}";

		$class = $t::class;
		$message = $t->getMessage();
		$this->log(sprintf('%s: [%s] #%s: %s', $logLabel, $class, $t->getCode(), $message));

		// All SeafileApi exceptions are handled by this
		if ($t instanceof Exception) {
			$this->backendExceptionSeafapi($t);
		}

		$this->backendErrorThrow('Error', "[SEAFILE {$logLabel}] {$class}: {$message}", 500);
	}

	/**
	 * Turn an Exception into a BackendException.
	 *
	 * Enriches message information for grommunio with API error messages
	 * if a Seafile ConnectionException.
	 *
	 * helper for {@see Backend::backendException()}
	 *
	 * @throws BackendException
	 */
	private function backendExceptionSeafapi(Exception $exception) {
		$code = $exception->getCode();
		$message = $exception->getMessage();

		$apiErrorMessagesHtml = null;
		if ($exception instanceof Exception\ConnectionException) {
			$messages = $exception->tryApiErrorMessages();
			$messages === null || $apiErrorMessagesHtml = implode(
				"<br/>\n",
				array_map(static fn (string $subject) => htmlspecialchars($subject, ENT_QUOTES | ENT_HTML5), $messages)
			) . "<br/>\n";
		}

		if ($apiErrorMessagesHtml !== null) {
			$message .= " - {$apiErrorMessagesHtml}";
		}

		$this->backendErrorThrow($this->backendDisplayName . ' Error', $message, $code);
	}

	/**
	 * a simple php error_log wrapper.
	 *
	 * @param string $err_string error message
	 */
	private function log(string $err_string) {
		if ($this->debug) {
			Logger::debug(self::LOG_CONTEXT, $err_string);
			$this->debugLog($err_string, 2);
		}
	}

	/**
	 * This function will return a user-friendly error string.
	 *
	 * Error codes were migrated from WebDav backend.
	 *
	 * @param int $error_code An error code
	 *
	 * @return string user friendly error message
	 */
	private function parseErrorCodeToMessage(int $error_code) {
		$error = $error_code;

		return match ($error) {
			CURLE_BAD_PASSWORD_ENTERED, self::SFA_ERR_UNAUTHORIZED => dgettext(self::GT_DOMAIN, 'Unauthorized. Wrong username or password.'),
			CURLE_SSL_CONNECT_ERROR, CURLE_COULDNT_RESOLVE_HOST, CURLE_COULDNT_CONNECT, CURLE_OPERATION_TIMEOUTED, self::SFA_ERR_UNREACHABLE => dgettext(self::GT_DOMAIN, 'Seafile is not reachable. Correct backend address entered?'),
			self::SFA_ERR_FORBIDDEN => dgettext(self::GT_DOMAIN, 'You don\'t have enough permissions for this operation.'),
			self::SFA_ERR_NOTFOUND => dgettext(self::GT_DOMAIN, 'File is not available any more.'),
			self::SFA_ERR_TIMEOUT => dgettext(self::GT_DOMAIN, 'Connection to server timed out. Retry later.'),
			self::SFA_ERR_LOCKED => dgettext(self::GT_DOMAIN, 'This file is locked by another user.'),
			self::SFA_ERR_FAILED_DEPENDENCY => dgettext(self::GT_DOMAIN, 'The request failed due to failure of a previous request.'),
			self::SFA_ERR_INTERNAL => dgettext(self::GT_DOMAIN, 'Seafile-server encountered a problem.'),
			self::SFA_ERR_TMP => dgettext(self::GT_DOMAIN, 'Could not write to temporary directory. Contact the server administrator.'),
			self::SFA_ERR_FEATURES => dgettext(self::GT_DOMAIN, 'Could not retrieve list of server features. Contact the server administrator.'),
			self::SFA_ERR_NO_CURL => dgettext(self::GT_DOMAIN, 'PHP-Curl is not available. Contact your system administrator.'),
			self::SFA_ERR_UNIMPLEMENTED => dgettext(self::GT_DOMAIN, 'This function is not yet implemented.'),
			default => dgettext(self::GT_DOMAIN, 'Unknown error'),
		};
	}

	// ///////////////////////////////////////////////////////////
	// @debug development helper method                        //
	// ///////////////////////////////////////////////////////////

	/**
	 * Log debug message while developing the plugin in dedicated DEBUG.log file.
	 *
	 * TODO(tk): remove debugLog, we shall not use it in production.
	 *
	 * @param mixed $message
	 * @param int   $backSteps [optional] offset of call point in stacktrace
	 *
	 * @see \Files\Backend\Seafile\Backend::log()
	 */
	public function debugLog($message, int $backSteps = 0): void {
		$baseDir = dirname(__DIR__);
		$debugLogFile = $baseDir . '/DEBUG.log';
		$backtrace = debug_backtrace();
		$callPoint = $backtrace[$backSteps];
		$path = $callPoint['file'];
		$shortPath = $path;
		if (str_starts_with($path, $baseDir)) {
			$shortPath = substr($path, strlen($baseDir));
		}
		// TODO(tk): track if the parent function is log() or not, not only the number of back-steps (or check all call points)
		$callInfoExtra = '';
		if ($backSteps !== 1) { // this is not a log() call with debug switched on
			$callInfoExtra = " ({$backSteps}) " . $backtrace[$backSteps + 1]['type'] . $backtrace[$backSteps + 1]['function'] . '()';
		}
		$callInfo = sprintf(' [ %s:%s ]%s', $shortPath, $callPoint['line'], $callInfoExtra);

		if (!is_string($message)) {
			/** @noinspection JsonEncodingApiUsageInspection */
			$type = gettype($message);
			if ($type === 'object' && is_callable([$message, '__debugInfo'])) {
				$message = $message->__debugInfo();
			}
			$message = $type . ': ' . json_encode($message, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
		}

		$message = substr(sprintf('%.3f', $_SERVER['REQUEST_TIME_FLOAT']), -7) . " {$message}";

		error_log(str_pad($message, 48) . $callInfo . "\n", 3, $debugLogFile);
	}
}
