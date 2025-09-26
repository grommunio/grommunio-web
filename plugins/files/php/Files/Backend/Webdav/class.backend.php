<?php

namespace Files\Backend\Webdav;

require_once __DIR__ . "/sabredav/FilesWebDavClient.php";
require_once __DIR__ . "/../class.abstract_backend.php";
require_once __DIR__ . "/../class.exception.php";

use Files\Backend\AbstractBackend;
use Files\Backend\Exception as BackendException;
use Files\Backend\iFeatureQuota;
use Files\Backend\iFeatureVersionInfo;
use Files\Backend\Webdav\sabredav\FilesWebDavClient;
use Sabre\DAV\Client;
use Sabre\DAV\Exception;
use Sabre\HTTP\ClientException;

/**
 * This is a file backend for webdav servers.
 *
 * @class   Backend
 *
 * @extends AbstractBackend
 */
class Backend extends AbstractBackend implements iFeatureQuota, iFeatureVersionInfo {
	/**
	 * Error codes
	 * see @parseErrorCodeToMessage for description.
	 */
	public const WD_ERR_UNAUTHORIZED = 401;
	public const WD_ERR_FORBIDDEN = 403;
	public const WD_ERR_NOTFOUND = 404;
	public const WD_ERR_NOTALLOWED = 405;
	public const WD_ERR_TIMEOUT = 408;
	public const WD_ERR_LOCKED = 423;
	public const WD_ERR_FAILED_DEPENDENCY = 423;
	public const WD_ERR_INTERNAL = 500;
	public const WD_ERR_UNREACHABLE = 800;
	public const WD_ERR_TMP = 801;
	public const WD_ERR_FEATURES = 802;
	public const WD_ERR_NO_CURL = 803;

	/**
	 * Configuration data for the extjs metaform.
	 */
	protected $formConfig;
	protected $formFields;
	protected $metaConfig;

	/**
	 * @var bool debugging flag, if true, debugging is enabled
	 */
	public $debug = false;

	/**
	 * @var int webdav server port
	 */
	public $port = 80;

	/**
	 * @var string hostname or ip
	 */
	public $server = "localhost";

	/**
	 * @var string global path prefix for all requests
	 */
	public $path = "/webdav.php";

	/**
	 * @var bool if true, ssl is used
	 */
	public $ssl = false;

	/**
	 * @var bool allow self signed certificates
	 */
	public $allowselfsigned = true;

	/**
	 * @var string the username
	 */
	public $user = "";

	/**
	 * @var string the password
	 */
	public $pass = "";

	/**
	 * @var FilesWebDavClient the SabreDAV client object
	 */
	public $sabre_client;

	/**
	 * @var string Backend name used in translations
	 */
	public $backendTransName;

	/**
	 * @constructor
	 */
	public function __construct() {
		// initialization
		$this->debug = PLUGIN_FILESBROWSER_LOGLEVEL === "DEBUG" ? true : false;

		$this->init_form();

		// set backend description
		$this->backendDescription = _("With this backend, you can connect to any WebDAV server.");

		// set backend display name
		$this->backendDisplayName = "Webdav";

		// set backend version
		// TODO: this should be changed on every release
		$this->backendVersion = "3.0";

		// Backend name used in translations
		$this->backendTransName = _('Files WebDAV Backend: ');
	}

	/**
	 * Initialise form fields.
	 */
	private function init_form() {
		$this->formConfig = [
			"labelAlign" => "left",
			"columnCount" => 1,
			"labelWidth" => 80,
			"defaults" => [
				"width" => 292,
			],
		];

		$this->formFields = [
			[
				"name" => "server_address",
				"fieldLabel" => _('Server address'),
				"editor" => [
					"allowBlank" => false,
				],
			],
			[
				"name" => "server_port",
				"fieldLabel" => _('Server port'),
				"editor" => [
					"ref" => "../../portField",
					"allowBlank" => false,
				],
			],
			[
				"name" => "server_ssl",
				"fieldLabel" => _('Use TLS'),
				"editor" => [
					"xtype" => "checkbox",
					"listeners" => [
						"check" => "Zarafa.plugins.files.data.Actions.onCheckSSL", // this javascript function will be called!
					],
				],
			],
			[
				"name" => "server_path",
				"fieldLabel" => _('Webdav base path'),
				"editor" => [
				],
			],
			[
				"name" => "user",
				"fieldLabel" => _('Username'),
				"editor" => [
					"ref" => "../../usernameField",
				],
			],
			[
				"name" => "password",
				"fieldLabel" => _('Password'),
				"editor" => [
					"ref" => "../../passwordField",
					"inputType" => "password",
				],
			],
			[
				"name" => "use_grommunio_credentials",
				"fieldLabel" => _('Use grommunio credentials'),
				"editor" => [
					"xtype" => "checkbox",
					"listeners" => [
						"check" => "Zarafa.plugins.files.data.Actions.onCheckCredentials", // this javascript function will be called!
					],
				],
			],
		];

		$this->metaConfig = [
			"success" => true,
			"metaData" => [
				"fields" => $this->formFields,
				"formConfig" => $this->formConfig,
			],
			"data" => [
				"server_address" => "files.demo.com",
				"server_port" => "80",
				"server_path" => "/remote.php/webdav",
			],
		];
	}

	/**
	 * Initialize backend from $backend_config array.
	 *
	 * @param mixed $backend_config
	 */
	public function init_backend($backend_config) {
		$this->set_server($backend_config["server_address"]);
		$this->set_port($backend_config["server_port"]);
		$this->set_base($backend_config["server_path"]);
		$this->set_ssl($backend_config["server_ssl"]);

		// set user and password
		if ($backend_config["use_grommunio_credentials"] === false) {
			$this->set_user($backend_config["user"]);
			$this->set_pass($backend_config["password"]);
		}
		else {
			// For backward compatibility we will check if the Encryption store exists. If not,
			// we will fall back to the old way of retrieving the password from the session.
			if (class_exists('EncryptionStore')) {
				// Get the username and password from the Encryption store
				$encryptionStore = \EncryptionStore::getInstance();
				$this->set_user($encryptionStore->get('username'));
				$this->set_pass($encryptionStore->get('password'));
			}
			else {
				$this->set_user($GLOBALS['mapisession']->getUserName());
				$password = $_SESSION['password'];
				if (function_exists('openssl_decrypt')) {
					$this->set_pass(openssl_decrypt($password, "des-ede3-cbc", PASSWORD_KEY, 0, PASSWORD_IV));
				}
			}
		}
	}

	/**
	 * Set webdav server. FQN or IP address.
	 *
	 * @param string $server hostname or ip of the ftp server
	 */
	public function set_server($server) {
		$this->server = $server;
	}

	/**
	 * Set base path.
	 *
	 * @param string $pp the global path prefix
	 */
	public function set_base($pp) {
		$this->path = $pp;
		$this->log('Base path set to ' . $this->path);
	}

	/**
	 * Set ssl.
	 *
	 * @param mixed $ssl (1 = true, 0 = false)
	 */
	public function set_ssl($ssl) {
		$this->ssl = $ssl ? true : false;
		$this->log('SSL extension was set to ' . $this->ssl);
	}

	/**
	 * Allow self signed certificates - unimplemented.
	 *
	 * @param bool $allowselfsigned Allow self signed certificates. Not yet implemented.
	 */
	public function set_selfsigned($allowselfsigned) {
		$this->allowselfsigned = $allowselfsigned;
	}

	/**
	 * Set tcp port of webdav server. Default is 80.
	 *
	 * @param int $port the port of the ftp server
	 */
	public function set_port($port) {
		$this->port = $port;
	}

	/**
	 * set user name for authentication.
	 *
	 * @param string $user username
	 */
	public function set_user($user) {
		$this->user = $user;
	}

	/**
	 * Set password for authentication.
	 *
	 * @param string $pass password
	 */
	public function set_pass($pass) {
		$this->pass = $pass;
	}

	/**
	 * set debug on (1) or off (0).
	 * produces a lot of debug messages in webservers error log if set to on (1).
	 *
	 * @param bool $debug enable or disable debugging
	 */
	public function set_debug($debug) {
		$this->debug = $debug;
	}

	/**
	 * Opens the connection to the webdav server.
	 *
	 * @return bool true if action succeeded
	 *
	 * @throws BackendException if connection is not successful
	 */
	public function open() {
		// check if curl is available
		$serverHasCurl = function_exists('curl_version');
		if (!$serverHasCurl) {
			$e = new BackendException($this->parseErrorCodeToMessage(self::WD_ERR_NO_CURL), 500);
			$e->setTitle($this->backendTransName . _('PHP-CURL is not installed'));

			throw $e;
		}

		$davsettings = [
			'baseUri' => $this->webdavUrl(),
			'userName' => $this->user,
			'password' => $this->pass,
			'authType' => Client::AUTH_BASIC,
		];

		try {
			$this->sabre_client = new FilesWebDavClient($davsettings);
			$this->sabre_client->addCurlSetting(CURLOPT_SSL_VERIFYPEER, !$this->allowselfsigned);

			return true;
		}
		catch (Exception $e) {
			$this->log('Failed to open: ' . $e->getMessage());
			if (intval($e->getHTTPCode()) == 401) {
				$e = new BackendException($this->parseErrorCodeToMessage(self::WD_ERR_UNAUTHORIZED), $e->getHTTPCode());
				$e->setTitle($this->backendTransName . _('Access denied'));

				throw $e;
			}
			$e = new BackendException($this->parseErrorCodeToMessage(self::WD_ERR_UNREACHABLE), $e->getHTTPCode());
			$e->setTitle($this->backendTransName . _('Connection failed'));

			throw $e;
		}
	}

	/**
	 * show content of a directory.
	 *
	 * @param bool  $hidefirst Optional parameter to hide the root entry. Default true
	 * @param mixed $dir
	 *
	 * @return mixed array with directory content
	 *
	 * @throws BackendException if request is not successful
	 */
	public function ls($dir, $hidefirst = true) {
		$time_start = microtime(true);
		$dir = $this->removeSlash($dir);
		$lsdata = [];
		$this->log("[LS] start for dir: {$dir}");

		try {
			$response = $this->sabre_client->propFind($dir, [
				'{http://owncloud.org/ns}fileid',
				'{DAV:}resourcetype',
				'{DAV:}getcontentlength',
				'{DAV:}getlastmodified',
				'{DAV:}getcontenttype',
				'{DAV:}quota-used-bytes',
				'{DAV:}quota-available-bytes',
			], 1);
			$this->log("[LS] backend fetched in: " . (microtime(true) - $time_start) . " seconds.");

			foreach ($response as $name => $fields) {
				if ($hidefirst) {
					$hidefirst = false; // skip the first line - its the requested dir itself

					continue;
				}

				$name = substr($name, strlen($this->path)); // skip the webdav path
				$name = urldecode($name);

				// Always fallback to a file resourceType
				$type = "file";
				if (isset($fields['{DAV:}resourcetype'])) {
					$value = $fields['{DAV:}resourcetype']->getValue();
					if (!empty($value) && $value[0] === "{DAV:}collection") {
						$type = "collection";
					}
				}

				$lsdata[$name] = [
					"fileid" => $fields["{http://owncloud.org/ns}fileid"] ?? '-1',
					"resourcetype" => $type,
					"getcontentlength" => $fields["{DAV:}getcontentlength"] ?? null,
					"getlastmodified" => $fields["{DAV:}getlastmodified"] ?? null,
					"getcontenttype" => $fields["{DAV:}getcontenttype"] ?? null,
					"quota-used-bytes" => $fields["{DAV:}quota-used-bytes"] ?? null,
					"quota-available-bytes" => $fields["{DAV:}quota-available-bytes"] ?? null,
				];
			}
			$time_end = microtime(true);
			$time = $time_end - $time_start;
			$this->log("[LS] done in {$time} seconds");

			return $lsdata;
		}
		catch (ClientException $e) {
			$this->log('ls sabre ClientException: ' . $e->getMessage());
			$e = new BackendException($this->parseErrorCodeToMessage($e->getCode()), $e->getCode());
			$e->setTitle($this->backendTransName . _('Sabre error'));

			throw $e;
		}
		catch (Exception $e) {
			$this->log('ls general exception: ' . $e->getMessage() . " [" . $e->getHTTPCode() . "]");
			// THIS IS A FIX FOR OWNCLOUD - It does return 500 instead of 401...
			$err_code = $e->getHTTPCode();
			// check if code is 500 - then we should try to parse the error message
			if ($err_code === 500) {
				// message example: HTTP-Code: 401
				$regx = '/[0-9]{3}/';
				if (preg_match($regx, $e->getMessage(), $found)) {
					$err_code = $found[0];
				}
			}
			$e = new BackendException($this->parseErrorCodeToMessage($err_code), $err_code);
			$e->setTitle($this->backendTransName . _('Connection failed'));

			throw $e;
		}
	}

	/**
	 * create a new directory.
	 *
	 * @param string $dir directory path
	 *
	 * @return bool true if action succeeded
	 *
	 * @throws BackendException if request is not successful
	 */
	public function mkcol($dir) {
		$time_start = microtime(true);
		$dir = $this->removeSlash($dir);
		$this->log("[MKCOL] start for dir: {$dir}");

		try {
			$response = $this->sabre_client->request("MKCOL", $dir, null);
			$time_end = microtime(true);
			$time = $time_end - $time_start;
			$this->log("[MKCOL] done in {$time} seconds: " . $response['statusCode']);

			return true;
		}
		catch (ClientException $e) {
			$e = new BackendException($this->parseErrorCodeToMessage($e->getCode()), $e->getCode());
			$e->setTitle($this->backendTransName . _('Sabre error'));

			throw $e;
		}
		catch (Exception $e) {
			$this->log('[MKCOL] fatal: ' . $e->getMessage());
			$e = new BackendException($this->parseErrorCodeToMessage($e->getHTTPCode()), $e->getHTTPCode());
			$e->setTitle($this->backendTransName . _('Directory creation failed'));

			throw $e;
		}
	}

	/**
	 * delete a file or directory.
	 *
	 * @param string $path file/directory path
	 *
	 * @return bool true if action succeeded
	 *
	 * @throws BackendException if request is not successful
	 */
	public function delete($path) {
		$time_start = microtime(true);
		$path = $this->removeSlash($path);
		$this->log("[DELETE] start for dir: {$path}");

		try {
			$response = $this->sabre_client->request("DELETE", $path, null);
			$time_end = microtime(true);
			$time = $time_end - $time_start;
			$this->log("[DELETE] done in {$time} seconds: " . $response['statusCode']);

			return true;
		}
		catch (ClientException $e) {
			$e = new BackendException($this->parseErrorCodeToMessage($e->getCode()), $e->getCode());
			$e->setTitle($this->backendTransName . _('Sabre error'));

			throw $e;
		}
		catch (Exception $e) {
			$this->log('[DELETE] fatal: ' . $e->getMessage());
			$e = new BackendException($this->parseErrorCodeToMessage($e->getHTTPCode()), $e->getHTTPCode());
			$e->setTitle($this->backendTransName . _('Deletion failed'));

			throw $e;
		}
	}

	/**
	 * Move a file or collection on webdav server (serverside)
	 * If you set param overwrite as true, the target will be overwritten.
	 *
	 * @param string $src_path  Source path
	 * @param bool   $overwrite Overwrite file if exists in $dest_path
	 * @param mixed  $dst_path
	 *
	 * @return bool true if action succeeded
	 *
	 * @throws BackendException if request is not successful
	 */
	public function move($src_path, $dst_path, $overwrite = false) {
		$time_start = microtime(true);
		$src_path = $this->removeSlash($src_path);
		$dst_path = $this->webdavUrl() . $this->removeSlash($dst_path);
		$this->log("[MOVE] start for dir: {$src_path} -> {$dst_path}");
		if ($overwrite) {
			$overwrite = 'T';
		}
		else {
			$overwrite = 'F';
		}

		try {
			$response = $this->sabre_client->request("MOVE", $src_path, null, ["Destination" => $dst_path, 'Overwrite' => $overwrite]);
			$time_end = microtime(true);
			$time = $time_end - $time_start;
			$this->log("[MOVE] done in {$time} seconds: " . $response['statusCode']);

			return true;
		}
		catch (ClientException $e) {
			$e = new BackendException($this->parseErrorCodeToMessage($e->getCode()), $e->getCode());
			$e->setTitle($this->backendTransName . _('Sabre error'));

			throw $e;
		}
		catch (Exception $e) {
			$this->log('[MOVE] fatal: ' . $e->getMessage());
			$e = new BackendException($this->parseErrorCodeToMessage($e->getHTTPCode()), $e->getHTTPCode());
			$e->setTitle($this->backendTransName . _('Moving failed'));

			throw $e;
		}
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
		$time_start = microtime(true);
		$path = $this->removeSlash($path);
		$this->log("[PUT] start for dir: {$path} strlen: " . strlen((string) $data));

		try {
			$response = $this->sabre_client->request("PUT", $path, $data);
			$time_end = microtime(true);
			$time = $time_end - $time_start;
			$this->log("[PUT] done in {$time} seconds: " . $response['statusCode']);

			return true;
		}
		catch (ClientException $e) {
			$e = new BackendException($this->parseErrorCodeToMessage($e->getCode()), $e->getCode());
			$e->setTitle($this->backendTransName . _('Sabre error'));

			throw $e;
		}
		catch (Exception $e) {
			$this->log('[PUT] fatal: ' . $e->getMessage());
			$e = new BackendException($this->parseErrorCodeToMessage($e->getHTTPCode()), $e->getHTTPCode());
			$e->setTitle($this->backendTransName . _('Connection failed'));

			throw $e;
		}
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
		$buffer = file_get_contents($filename);

		if ($buffer !== false) {
			return $this->put($path, $buffer);
		}
		$e = new BackendException($this->parseErrorCodeToMessage(self::WD_ERR_TMP), self::WD_ERR_TMP);
		$e->setTitle($this->backendTransName . _('Temporary directory problems'));

		throw $e;
	}

	/**
	 * Gets a file from a webdav collection.
	 *
	 * @param string $path   The source path on the server
	 * @param mixed  $buffer Buffer for the received data
	 *
	 * @return bool true if action succeeded
	 *
	 * @throws BackendException if request is not successful
	 */
	public function get($path, &$buffer) {
		$tmpfile = tempnam(TMP_PATH, stripslashes(base64_encode($path)));

		$this->log("[GET] buffer path: {$tmpfile}");
		$this->get_file($path, $tmpfile);

		$buffer = file_get_contents($tmpfile);
		unlink($tmpfile);
	}

	/**
	 * Gets a file from a collection into local filesystem.
	 *
	 * @param string $srcpath   Source path on server
	 * @param string $localpath Destination path on local filesystem
	 *
	 * @return bool true if action succeeded
	 *
	 * @throws BackendException if request is not successful
	 */
	public function get_file($srcpath, $localpath) {
		$time_start = microtime(true);
		$path = $this->removeSlash($srcpath);
		$this->log("[GET_FILE] start for dir: {$path}");
		$this->log("[GET_FILE] local path (" . $localpath . ") writeable: " . is_writable($localpath));

		try {
			$response = $this->sabre_client->getFile($path, $localpath);
			$time_end = microtime(true);
			$time = $time_end - $time_start;
			$this->log("[GET_FILE] done in {$time} seconds: " . $response['statusCode']);
		}
		catch (ClientException $e) {
			$e = new BackendException($this->parseErrorCodeToMessage($e->getCode()), $e->getCode());
			$e->setTitle($this->backendTransName . _('Sabre error'));

			throw $e;
		}
		catch (Exception $e) {
			$this->log('[GET_FILE] - FATAL -' . $e->getMessage());
			$e = new BackendException($this->parseErrorCodeToMessage($e->getHTTPCode()), $e->getHTTPCode());
			$e->setTitle($this->backendTransName . _('File or folder not found'));

			throw $e;
		}
	}

	/**
	 * Public method copy_file.
	 *
	 * Copy a file on webdav server
	 * Duplicates a file on the webdav server (serverside).
	 * All work is done on the webdav server. If you set param overwrite as true,
	 * the target will be overwritten.
	 *
	 * @param string $src_path  Source path
	 * @param bool   $overwrite Overwrite if file exists in $dst_path
	 * @param mixed  $dst_path
	 *
	 * @return bool true if action succeeded
	 *
	 * @throws BackendException if request is not successful
	 */
	public function copy_file($src_path, $dst_path, $overwrite = false) {
		return $this->copy($src_path, $dst_path, $overwrite, false);
	}

	/**
	 * Public method copy_coll.
	 *
	 * Copy a collection on webdav server
	 * Duplicates a collection on the webdav server (serverside).
	 * All work is done on the webdav server. If you set param overwrite as true,
	 * the target will be overwritten.
	 *
	 * @param string $src_path  Source path
	 * @param bool   $overwrite Overwrite if collection exists in $dst_path
	 * @param mixed  $dst_path
	 *
	 * @return bool true if action succeeded
	 *
	 * @throws BackendException if request is not successful
	 */
	public function copy_coll($src_path, $dst_path, $overwrite = false) {
		return $this->copy($src_path, $dst_path, $overwrite, true);
	}

	/**
	 * Gets path information from webdav server for one element.
	 *
	 * @param string $path Path to file or folder
	 *
	 * @return array directory info
	 *
	 * @throws BackendException if request is not successful
	 */
	public function gpi($path) {
		$path = $this->removeSlash($path);
		$response = $this->sabre_client->propFind($path, [
			'{http://owncloud.org/ns}fileid',
			'{DAV:}resourcetype',
			'{DAV:}getcontentlength',
			'{DAV:}getlastmodified',
			'{DAV:}getcontenttype',
			'{DAV:}quota-used-bytes',
			'{DAV:}quota-available-bytes',
		]);

		$type = $response["{DAV:}resourcetype"]->resourceType;
		if (is_array($type) && !empty($type)) {
			$type = $type[0] == "{DAV:}collection" ? "collection" : "file";
		}
		else {
			$type = "file"; // fall back to file if detection fails... less harmful
		}

		return [
			"fileid" => $response["{http://owncloud.org/ns}fileid"] ?? '-1',
			"resourcetype" => $type,
			"getcontentlength" => $response["{DAV:}getcontentlength"] ?? null,
			"getlastmodified" => $response["{DAV:}getlastmodified"] ?? null,
			"getcontenttype" => $response["{DAV:}getcontenttype"] ?? null,
			"quota-used-bytes" => $response["{DAV:}quota-used-bytes"] ?? null,
			"quota-available-bytes" => $response["{DAV:}quota-available-bytes"] ?? null,
		];
	}

	/**
	 * Gets server information.
	 *
	 * @return array with all header fields returned from webdav server
	 *
	 * @throws BackendException if request is not successful
	 */
	public function options() {
		$features = $this->sabre_client->options();

		// be sure it is an array
		if (is_array($features)) {
			return $features;
		}

		$this->log('[OPTIONS] - ERROR - Error getting server features');
		$e = new BackendException($this->parseErrorCodeToMessage(self::WD_ERR_FEATURES), self::WD_ERR_FEATURES);
		$e->setTitle($this->backendTransName . _('Not implemented'));

		throw $e;
	}

	/**
	 * Gather whether a path points to a file or not.
	 *
	 * @param string $path Path to file or folder
	 *
	 * @return bool true if path points to a file, false otherwise
	 */
	public function is_file($path) {
		$item = $this->gpi($path);

		return $item === false ? false : ($item['resourcetype'] != 'collection');
	}

	/**
	 * Gather whether a path points to a directory.
	 *
	 * @param string $path Path to file or folder
	 *
	 * @return bool true if path points to a directory, false otherwise
	 */
	public function is_dir($path) {
		$item = $this->gpi($path);

		return $item === false ? false : ($item['resourcetype'] == 'collection');
	}

	/**
	 * check if file/directory exists.
	 *
	 * @param string $path Path to file or folder
	 *
	 * @return bool true if path exists, false otherwise
	 */
	public function exists($path) {
		return $this->is_dir($path) || $this->is_file($path);
	}

	/**
	 * Copy a collection on webdav server
	 * Duplicates a collection on the webdav server (serverside).
	 * All work is done on the webdav server. If you set param overwrite as true,
	 * the target will be overwritten.
	 *
	 * @param string $src_path  Source path
	 * @param bool   $overwrite Overwrite if collection exists in $dst_path
	 * @param bool   $coll      set this to true if you want to copy a folder
	 * @param mixed  $dst_path
	 *
	 * @return bool true if action succeeded
	 *
	 * @throws BackendException if request is not successful
	 */
	private function copy($src_path, $dst_path, $overwrite, $coll) {
		$time_start = microtime(true);
		$src_path = $this->removeSlash($src_path);
		$dst_path = $this->webdavUrl() . $this->removeSlash($dst_path);
		$this->log("[COPY] start for dir: {$src_path} -> {$dst_path}");
		if ($overwrite) {
			$overwrite = 'T';
		}
		else {
			$overwrite = 'F';
		}["Destination" => $dst_path, 'Overwrite' => $overwrite];
		if ($coll) {
			$settings = ["Destination" => $dst_path, 'Depth' => 'Infinity'];
		}

		try {
			$response = $this->sabre_client->request("COPY", $src_path, null, $settings);
			$time_end = microtime(true);
			$time = $time_end - $time_start;
			$this->log("[COPY] done in {$time} seconds: " . $response['statusCode']);

			return true;
		}
		catch (ClientException $e) {
			$e = new BackendException($this->parseErrorCodeToMessage($e->getCode()), $e->getCode());
			$e->setTitle($this->backendTransName . _('Sabre error'));

			throw $e;
		}
		catch (Exception $e) {
			$this->log('[COPY] - FATAL - ' . $e->getMessage());
			$e = new BackendException($this->parseErrorCodeToMessage($e->getHTTPCode()), $e->getHTTPCode());
			$e->setTitle($this->backendTransName . _('Copying failed'));

			throw $e;
		}
	}

	/**
	 * Create the base webdav url.
	 *
	 * @return string baseURL
	 */
	protected function webdavUrl() {
		if ($this->ssl) {
			$url = "https://";
		}
		else {
			$url = "http://";
		}

		// make sure that we do not have any trailing / in our url
		$server = rtrim($this->server, '/');
		$path = rtrim($this->path, '/');

		$url .= $server . ":" . $this->port . $path . "/";

		return $url;
	}

	/**
	 * Removes the leading slash from the folder path.
	 *
	 * @param string $dir directory path
	 *
	 * @return string trimmed directory path
	 */
	public function removeSlash($dir) {
		if (str_starts_with($dir, '/')) {
			$dir = substr($dir, 1);
		}

		// remove all html entities and urlencode the path...
		$nohtml = html_entity_decode($dir);

		return implode("/", array_map("rawurlencode", explode("/", $nohtml)));
	}

	/**
	 * This function will return a user friendly error string.
	 *
	 * @param number $error_code A error code
	 *
	 * @return string userfriendly error message
	 */
	private function parseErrorCodeToMessage($error_code) {
		$error = intval($error_code);

		$msg = _('Unknown error');
		$contactAdmin = _('Please contact your system administrator');

		return match ($error) {
			CURLE_BAD_PASSWORD_ENTERED, self::WD_ERR_UNAUTHORIZED => _('Unauthorized. Wrong username or password.'),
			CURLE_SSL_CONNECT_ERROR, CURLE_COULDNT_RESOLVE_HOST, CURLE_COULDNT_CONNECT, CURLE_OPERATION_TIMEOUTED, self::WD_ERR_UNREACHABLE => _('File server is not reachable. Please verify the connection.'),
			self::WD_ERR_NOTALLOWED => _('File server is not reachable. Please verify the file server URL.'),
			self::WD_ERR_FORBIDDEN => _('You don\'t have enough permissions to view this file or folder.'),
			self::WD_ERR_NOTFOUND => _('The file or folder is not available anymore.'),
			self::WD_ERR_TIMEOUT => _('Connection to the file server timed out. Please check again later.'),
			self::WD_ERR_LOCKED => _('This file is locked by another user. Please try again later.'),
			self::WD_ERR_FAILED_DEPENDENCY => _('The request failed.') . ' ' . $contactAdmin,
			// This is a general error, might be thrown due to a wrong IP, but we don't know.
			self::WD_ERR_INTERNAL => _('The file server encountered an internal problem.') . ' ' . $contactAdmin,
			self::WD_ERR_TMP => _('We could not write to temporary directory.') . ' ' . $contactAdmin,
			self::WD_ERR_FEATURES => _('We could not retrieve list of server features.') . ' ' . $contactAdmin,
			self::WD_ERR_NO_CURL => _('PHP-Curl is not available.') . ' ' . $contactAdmin,
			default => $msg,
		};
	}

	public function getFormConfig() {
		$json = json_encode($this->metaConfig);

		if ($json === false) {
			error_log(json_last_error());
		}

		return $json;
	}

	public function getFormConfigWithData() {
		return json_encode($this->metaConfig);
	}

	/**
	 * a simple php error_log wrapper.
	 *
	 * @param string $err_string error message
	 */
	private function log($err_string) {
		if ($this->debug) {
			error_log("[BACKEND_WEBDAV]: " . $err_string);
		}
	}

	/**
	 * ============================ FEATURE FUNCTIONS ========================.
	 *
	 * @param mixed $dir
	 */

	/**
	 * Returns the bytes that are currently used.
	 *
	 * @param string $dir directory to check
	 *
	 * @return int bytes that are used or -1 on error
	 */
	public function getQuotaBytesUsed($dir) {
		$lsdata = $this->ls($dir, false);

		if (isset($lsdata) && is_array($lsdata)) {
			return $lsdata[$dir]["quota-used-bytes"];
		}

		return -1;
	}

	/**
	 * Returns the bytes that are currently available.
	 *
	 * @param string $dir directory to check
	 *
	 * @return int bytes that are available or -1 on error
	 */
	public function getQuotaBytesAvailable($dir) {
		$lsdata = $this->ls($dir, false);

		if (isset($lsdata) && is_array($lsdata)) {
			return $lsdata[$dir]["quota-available-bytes"];
		}

		return -1;
	}

	/**
	 * Return the version string of the server backend.
	 *
	 * @return string
	 *
	 * @throws BackendException
	 */
	public function getServerVersion() {
		// check if curl is available
		$serverHasCurl = function_exists('curl_version');
		if (!$serverHasCurl) {
			$e = new BackendException($this->parseErrorCodeToMessage(self::WD_ERR_NO_CURL), 500);
			$e->setTitle($this->backendTransName . _('PHP-CURL not installed'));

			throw $e;
		}

		$webdavurl = $this->webdavUrl();

		$url = substr($webdavurl, 0, strlen($webdavurl) - strlen("remote.php/webdav/")) . "status.php";

		// try to get the contents of the owncloud status page
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_AUTOREFERER, true);
		curl_setopt($ch, CURLOPT_TIMEOUT, 3); // timeout of 3 seconds
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
		if ($this->allowselfsigned) {
			curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
			curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
		}
		$versiondata = curl_exec($ch);
		$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
		curl_close($ch);

		if ($httpcode && $httpcode == "200" && $versiondata) {
			$versions = json_decode($versiondata);
			$version = $versions->versionstring;
		}
		else {
			$version = "Undetected (no Owncloud?)";
		}

		return $version;
	}
}
