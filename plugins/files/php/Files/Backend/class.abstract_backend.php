<?php

/**
 * A abstract file backend. Offers basic functions that are needed by the frontend modules.
 *
 * @class file_backend
 */

namespace Files\Backend;

require_once __DIR__ . "/interface.quota.php";
require_once __DIR__ . "/interface.version.php";
require_once __DIR__ . "/interface.streaming.php";
require_once __DIR__ . "/interface.sharing.php";
require_once __DIR__ . "/interface.oauth.php";

abstract class AbstractBackend {
	/**
	 * @var string This is a small description for the backend. It will be shown in the settings UI.
	 */
	public $backendDescription = "This is a generic file backend.";

	/**
	 * @var string this is the name of backend that is visible to the user
	 */
	public $backendDisplayName = "AbstractBackend";

	/**
	 * @var string version code of the backend implementation
	 */
	public $backendVersion = "1.0";

	/**
	 * @var string accountID of the account that is using this backend
	 */
	protected $accountID;

	/**
	 * This function will initialize internal variables of the backend. It will receive the values in the
	 * $backend_config array.
	 *
	 * Example for the $backend_config array:
	 * $backend_config["server_address"]
	 * $backend_config["user"]
	 * ...
	 *
	 * @param array $backend_config
	 */
	abstract public function init_backend($backend_config);

	/**
	 * This function will set the backend internal debug flag. Each backend will handle debugging by itself.
	 *
	 * @param bool $debug
	 */
	abstract public function set_debug($debug);

	/**
	 * This function opens the backend connection. For instance it will open a new ftp connection.
	 *
	 * @return bool
	 *
	 * @throws Exception
	 */
	abstract public function open();

	/**
	 * This function will read a list of files and folders from the server.
	 * The return value must look like this:
	 * Array => (
	 *  "path 1" => array(
	 *      "resourcetype" => "collection" or "file",
	 *      "getcontentlength" => size in bytes,
	 *      "getlastmodified" => date/time string,
	 *      "getcontenttype" => mime type (optional),
	 *      "quota-used-bytes" => size in bytes (optional),
	 *      "quota-available-bytes" => size in bytes (optional),
	 *  ),
	 *  "path 2" => array(
	 *      ...
	 *  ),
	 * ):.
	 *
	 * @param string $dir
	 * @param bool   $hidefirst
	 *
	 * @return array
	 *
	 * @throws Exception
	 */
	abstract public function ls($dir, $hidefirst = true);

	/**
	 * Creates a new directory on the server.
	 *
	 * @param string $dir
	 *
	 * @return bool
	 *
	 * @throws Exception
	 */
	abstract public function mkcol($dir);

	/**
	 * Deletes a files or folder from the backend.
	 *
	 * @param string $path
	 *
	 * @return bool
	 *
	 * @throws Exception
	 */
	abstract public function delete($path);

	/**
	 * Move a file or collection on the backend server (serverside).
	 * If you set param $overwrite as true, the target will be overwritten.
	 *
	 * @param string $src_path  Source path
	 * @param bool   $overwrite Overwrite file if exists in $dest_path
	 * @param mixed  $dst_path
	 *
	 * @return bool
	 *
	 * @throws Exception
	 */
	abstract public function move($src_path, $dst_path, $overwrite = false);

	/**
	 * Uploads the given $data to a new file in the backend.
	 *
	 * @param string $path
	 * @param string $data
	 *
	 * @return bool
	 *
	 * @throws Exception
	 */
	abstract public function put($path, $data);

	/**
	 * Uploads a local file ($filename) to a new file in the backend.
	 *
	 * @param string $path
	 * @param string $filename
	 *
	 * @return bool
	 *
	 * @throws Exception
	 */
	abstract public function put_file($path, $filename);

	/**
	 * Download a remote file to a buffer variable.
	 *
	 * @param string $path
	 * @param string $buffer
	 *
	 * @throws Exception
	 */
	abstract public function get($path, &$buffer);

	/**
	 * Download a remote file to a local file.
	 *
	 * @param string $srcpath
	 * @param string $localpath
	 *
	 * @throws Exception
	 */
	abstract public function get_file($srcpath, $localpath);

	/**
	 * Duplicates a file on the backend server.
	 * If you set param overwrite as true, the target will be overwritten.
	 *
	 * @param string $src_path
	 * @param string $dst_path
	 * @param bool   $overwrite
	 *
	 * @return bool
	 *
	 * @throws Exception
	 */
	abstract public function copy_file($src_path, $dst_path, $overwrite = false);

	/**
	 * Duplicates a folder on the backend server.
	 * If you set param overwrite as true, the target will be overwritten.
	 *
	 * @param string $src_path
	 * @param string $dst_path
	 * @param bool   $overwrite
	 *
	 * @return bool
	 *
	 * @throws Exception
	 */
	abstract public function copy_coll($src_path, $dst_path, $overwrite = false);

	/**
	 * Gets path information from backend server for the first element
	 * in the given path.
	 *
	 * Returned value:
	 * array(
	 *      "resourcetype" => "collection" or "file",
	 *      "getcontentlength" => size in bytes,
	 *      "getlastmodified" => date/time string,
	 *      "getcontenttype" => mime type (optional),
	 *      "quota-used-bytes" => size in bytes (optional),
	 *      "quota-available-bytes" => size in bytes (optional),
	 * )
	 *
	 * @param string $path
	 *
	 * @return mixed
	 *
	 * @throws Exception
	 */
	abstract public function gpi($path);

	/**
	 * Checks if the given $path is a file. If so, this function returns true, otherwise it will
	 * return false.
	 *
	 * @param string $path
	 *
	 * @return bool
	 *
	 * @throws Exception
	 */
	abstract public function is_file($path);

	/**
	 * Checks if the given $path is a folder. If so, this function returns true, otherwise it will
	 * return false.
	 *
	 * @param string $path
	 *
	 * @return bool
	 *
	 * @throws Exception
	 */
	abstract public function is_dir($path);

	/**
	 * Checks if the given $path exists on the remote server. If so, this function returns true, otherwise it will
	 * return false.
	 *
	 * @param string $path
	 *
	 * @return bool
	 *
	 * @throws Exception
	 */
	abstract public function exists($path);

	/**
	 * This function will return an array with configuration values for the settings form.
	 *
	 * Example return value:
	 * array(
	 *      "success" => true,
	 *      "metaData" => array(
	 *          "fields" => $this->formFields,
	 *          "formConfig" => $this->formConfig
	 *      ),
	 *      "data" => array( // here we can specify the default values.
	 *          "server_address" => "files.demo.com",
	 *          "server_port" => "80",
	 *          "server_path" => "/remote.php/webdav"
	 *      ),
	 * )
	 *
	 * @return array
	 */
	abstract public function getFormConfig();

	/**
	 * This function will return an array with configuration values for the settings form.
	 * The returned value will also contain the data values for each form field.
	 *
	 * Example return value:
	 * array(
	 *      "success" => true,
	 *      "metaData" => array(
	 *          "fields" => $this->formFields,
	 *          "formConfig" => $this->formConfig
	 *      ),
	 *      "data" => array( // here we can specify the default values.
	 *          "server_address" => "files.demo.com",
	 *          "server_port" => "80",
	 *          "server_path" => "/remote.php/webdav"
	 *      ),
	 * )
	 *
	 * @return array
	 */
	abstract public function getFormConfigWithData();

	/**
	 * Returns a brief the description of the backend.
	 *
	 * @return string
	 */
	public function getDescription() {
		return $this->backendDescription;
	}

	/**
	 * @return string
	 */
	public function getDisplayName() {
		return $this->backendDisplayName;
	}

	/**
	 * Returns the version/revision of the backend.
	 *
	 * @return string
	 */
	public function getBackendVersion() {
		return $this->backendVersion;
	}

	/**
	 * Check if the given feature is supported by this backend.
	 *
	 * @param string $feature feature name. e.g. Quota or VersionInfo
	 *
	 * @return bool
	 */
	public function supports($feature) {
		$features = $this->getAvailableFeatures();

		return in_array($feature, $features);
	}

	/**
	 * Returns all available features and their values.
	 *
	 * @return array
	 */
	public function getAvailableFeatures() {
		$interfaces = class_implements(static::class);
		$features = [];

		// remove namespace and interface prefix
		foreach ($interfaces as $interface) {
			$features[] = str_replace("Files\\Backend\\iFeature", "", $interface);
		}

		return $features;
	}

	/**
	 * This function gets called before the backend-account is deleted.
	 *
	 * @param mixed $account
	 */
	public function beforeDeleteAccount($account) {
		// do nothing by default
	}

	/**
	 * @return string
	 */
	public function getAccountID() {
		return $this->accountID;
	}

	/**
	 * @param string $accountID
	 */
	public function setAccountID($accountID) {
		$this->accountID = $accountID;
	}
}
