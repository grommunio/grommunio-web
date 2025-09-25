<?php

namespace Files\Backend\Default;

require_once __DIR__ . "/../../files/php/Files/Backend/Webdav/sabredav/FilesWebDavClient.php";
require_once __DIR__ . "/../../files/php/Files/Backend/class.abstract_backend.php";
require_once __DIR__ . "/../../files/php/Files/Backend/class.exception.php";
require_once __DIR__ . "/../../files/php/Files/Backend/interface.quota.php";
require_once __DIR__ . "/../../files/php/Files/Backend/interface.version.php";
require_once __DIR__ . "/../../files/php/Files/Backend/interface.sharing.php";
require_once __DIR__ . "/lib/ocsapi/class.ocsclient.php";

use Files\Backend\AbstractBackend;
use Files\Backend\Exception as BackendException;
use Files\Backend\iFeatureSharing;
use Files\Backend\Webdav\sabredav\FilesWebDavClient;
use OCSAPI\Exception\ConnectionException;
use OCSAPI\Exception\FileNotFoundException;
use OCSAPI\ocsclient;
use OCSAPI\ocsshare;
use Sabre\DAV\Client;
use Sabre\DAV\Exception;
use Sabre\HTTP\ClientException;

/**
 * This is a file backend for owncloud servers.
 * It requires the Webdav File Backend!
 *
 * @class   Backend
 *
 * @extends AbstractBackend
 */
class Backend extends \Files\Backend\Webdav\Backend implements iFeatureSharing {
	/**
	 * @var ocsclient the OCS Api client
	 */
	public $ocs_client;

	/**
	 * @constructor
	 */
	public function __construct() {
		// initialization
		$this->debug = PLUGIN_FILESBROWSER_LOGLEVEL === "DEBUG" ? true : false;

		$this->init_form();

		// set backend description
		$this->backendDescription = _("This backend provides the default WebDAV integration for Files.");

		// set backend display name
		$this->backendDisplayName = "Default";

		// set backend version
		// TODO: this should be changed on every release
		$this->backendVersion = "3.0";

		// Backend name used in translations
		$this->backendTransName = _('Files Default Backend: ');
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
					"allowBlank" => false,
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
				"server_address" => $_SERVER['HTTP_HOST'],
				"server_ssl" => true,
				"server_port" => "443",
				"server_path" => "/files/remote.php/webdav",
				"use_grommunio_credentials" => true,
			],
		];
	}

	/**
	 * Opens the connection to the webdav server.
	 *
	 * @return bool true if action succeeded
	 *
	 * @throws BackendException if connection is not successful
	 */
	#[\Override]
	public function open() {
		// check if curl is available
		$serverHasCurl = function_exists('curl_version');
		if (!$serverHasCurl) {
			$e = new BackendException($this->parseErrorCodeToMessage(self::WD_ERR_NO_CURL), 500);
			$e->setTitle($this->backendTransName . _('php-curl is not available'));

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

			$this->ocs_client = new ocsclient($this->getOwncloudBaseURL(), $this->user, $this->pass, $this->allowselfsigned);

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
	 * /**
	 * Copy a collection on webdav server
	 * Duplicates a collection on the webdav server (serverside).
	 * All work is done on the webdav server. If you set param overwrite as true,
	 * the target will be overwritten.
	 *
	 * @param string $src_path  Source path
	 * @param string $dst_path  Destination path
	 * @param bool   $overwrite Overwrite if collection exists in $dst_path
	 * @param bool   $coll      set this to true if you want to copy a folder
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
		}

		$settings = ["Destination" => $dst_path, 'Overwrite' => $overwrite];
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
			$this->log('[COPY] fatal: ' . $e->getMessage());
			$e = new BackendException($this->parseErrorCodeToMessage($e->getHTTPCode()), $e->getHTTPCode());
			$e->setTitle($this->backendTransName . _('Copying failed'));

			throw $e;
		}
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
		$contactAdmin = _('Please contact your system administrator.');

		return match ($error) {
			CURLE_BAD_PASSWORD_ENTERED, self::WD_ERR_UNAUTHORIZED => _('Unauthorized. Wrong username or password.'),
			CURLE_SSL_CONNECT_ERROR, CURLE_COULDNT_RESOLVE_HOST, CURLE_COULDNT_CONNECT, CURLE_OPERATION_TIMEOUTED, self::WD_ERR_UNREACHABLE => _('File server is not reachable. Please verify the file server URL.'),
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

	/**
	 * a simple php error_log wrapper.
	 *
	 * @param string $err_string error message
	 */
	private function log($err_string) {
		if ($this->debug) {
			error_log("[BACKEND_OWNCLOUD]: " . $err_string);
		}
	}

	/**
	 * Get the base URL of Owncloud.
	 * For example: http://demo.owncloud.com/owncloud.
	 *
	 * @return string
	 */
	private function getOwncloudBaseURL() {
		$webdavurl = $this->webdavUrl();

		return substr($webdavurl, 0, strlen($webdavurl) - strlen("/remote.php/webdav/"));
	}

	/**
	 * ============================ FEATURE FUNCTIONS ========================.
	 */

	/**
	 * Return the version string of the server backend.
	 *
	 * @return string
	 */
	#[\Override]
	public function getServerVersion() {
		// check if curl is available
		$serverHasCurl = function_exists('curl_version');
		if (!$serverHasCurl) {
			throw new BackendException($this->parseErrorCodeToMessage(self::WD_ERR_NO_CURL), 500);
		}

		$url = $this->getOwncloudBaseURL() . "/status.php";

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
			$version = "Undetected (no ownCloud?)";
		}

		return $version;
	}

	/**
	 * Get all shares in the specified folder.
	 *
	 * The response array will look like:
	 *
	 * array(
	 *  path1 => array(
	 *      id1 => details1,
	 *      id2 => details2
	 *  ),
	 *  path2 => array(
	 *      id1 => ....
	 *  )
	 * )
	 *
	 * @return array
	 */
	public function getShares($path) {
		$result = [];

		$this->log('[GETSHARES]: loading shares for folder: ' . $path);

		try {
			$this->ocs_client->loadShares($path);
		}
		catch (ConnectionException $e) {
			$this->log('[GETSHARES]: connection exception while loading shares: ' . $e->getMessage() . " " . $e->getCode());
		}
		$shares = $this->ocs_client->getAllShares();

		$result[$path] = [];
		if ($shares !== false) {
			foreach ($shares as $id => $options) {
				$result[$path][$id] = [
					"shared" => true,
					"id" => $options->getId(),
					"path" => $options->getPath(),
					"shareType" => $options->getShareType(),
					"permissions" => $options->getPermissions(),
					"expiration" => $options->getExpiration(),
					"token" => $options->getToken(),
					"url" => $options->getUrl(),
					"shareWith" => $options->getShareWith(),
					"shareWithDisplayname" => $options->getShareWithDisplayname(),
				];
			}
		}

		return $result;
	}

	/**
	 * Get details about the shared files/folders.
	 *
	 * The response array will look like:
	 *
	 * array(
	 *  path1 => array(
	 *      id1 => details1,
	 *      id2 => details2
	 *  ),
	 *  path2 => array(
	 *      id1 => ....
	 *  )
	 * )
	 *
	 * @param $patharray Simple array with path's to files or folders
	 *
	 * @return array
	 */
	public function sharingDetails($patharray) {
		$result = [];

		// performance optimization
		// fetch all shares - so we only need one request
		if (count($patharray) > 1) {
			try {
				$this->ocs_client->loadShares();
			}
			catch (ConnectionException $e) {
				$this->log('[SHARINGDETAILS]: connection exception while loading shares: ' . $e->getMessage() . " " . $e->getCode());
			}

			/** @var ocsshare[] $shares */
			$shares = $this->ocs_client->getAllShares();
			foreach ($patharray as $path) {
				$result[$path] = [];
				foreach ($shares as $id => $details) {
					if ($details->getPath() == $path) {
						$result[$path][$id] = [
							"shared" => true,
							"id" => $details->getId(),
							"shareType" => $details->getShareType(),
							"permissions" => $details->getPermissions(),
							"expiration" => $details->getExpiration(),
							"token" => $details->getToken(),
							"url" => $details->getUrl(),
							"shareWith" => $details->getShareWith(),
							"shareWithDisplayname" => $details->getShareWithDisplayname(),
						];
					}
				}
			}
		}
		else {
			if (count($patharray) == 1) {
				try {
					$shares = $this->ocs_client->loadShareByPath($patharray[0]);
				}
				catch (FileNotFoundException) {
					$shares = false;
				}

				$result[$patharray[0]] = [];

				if ($shares !== false) {
					foreach ($shares as $id => $share) {
						$result[$patharray[0]][$id] = [
							"shared" => true,
							"id" => $share->getId(),
							"shareType" => $share->getShareType(),
							"permissions" => $share->getPermissions(),
							"expiration" => $share->getExpiration(),
							"token" => $share->getToken(),
							"url" => $share->getUrl(),
							"shareWith" => $share->getShareWith(),
							"shareWithDisplayname" => $share->getShareWithDisplayName(),
						];
					}
				}
			}
			else {
				return false; // $patharray was empty...
			}
		}

		return $result;
	}

	/**
	 * Share one or multiple files.
	 * As the sharing dialog might differ for different backends, it is implemented as
	 * MetaForm - meaning that the argumentnames/count might differ.
	 * That's the cause why this function uses an array as parameter.
	 *
	 * $shareparams should look somehow like this:
	 *
	 * array(
	 *      "path1" => options1,
	 *      "path2" => options2
	 *
	 *      or
	 *
	 *      "id1" => options1 (ONLY if $update = true)
	 * )
	 *
	 * @param bool $update
	 *
	 * @return bool
	 */
	public function share($shareparams, $update = false) {
		$result = [];
		if (count($shareparams) > 0) {
			/** @var string $path */
			foreach ($shareparams as $path => $options) {
				$path = rtrim($path, "/");
				$this->log('path: ' . $path);
				if (!$update) {
					$share = $this->ocs_client->createShare($path, $options);
					$result[$path] = [
						"shared" => true,
						"id" => $share->getId(),
						"token" => $share->getToken(),
						"url" => $share->getUrl(),
					];
				}
				else {
					foreach ($options as $key => $value) {
						$this->ocs_client->updateShare($path, $key, $value);
					}
					$result[$path] = [
						"shared" => true,
						"id" => $path,
					];
				}
			}
		}
		else {
			$this->log('No share params given');

			return false; // no shareparams...
		}

		return $result;
	}

	/**
	 * Disable sharing for the given files/folders.
	 *
	 * @return bool
	 *
	 * @throws ConnectionException
	 */
	public function unshare($idarray) {
		foreach ($idarray as $id) {
			$this->ocs_client->deleteShare($id);
		}

		return true;
	}

	/*
	 * Get Recipients that could be shared with, matching the search string
	 *
	 * @param $search Searchstring to use
	 * @return The response from the osc client API
	 */
	public function getRecipients($search) {
		return $this->ocs_client->getRecipients($search);
	}
}
