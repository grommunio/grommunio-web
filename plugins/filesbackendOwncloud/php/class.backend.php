<?php

namespace Files\Backend\Owncloud;

require_once __DIR__ . "/../../files/php/Files/Backend/Webdav/sabredav/FilesWebDavClient.php";
require_once __DIR__ . "/../../files/php/Files/Backend/class.abstract_backend.php";
require_once __DIR__ . "/../../files/php/Files/Backend/class.exception.php";
require_once __DIR__ . "/../../files/php/Files/Backend/interface.quota.php";
require_once __DIR__ . "/../../files/php/Files/Backend/interface.version.php";
require_once __DIR__ . "/../../files/php/Files/Backend/interface.sharing.php";
require_once __DIR__ . "/lib/ocsapi/class.ocsclient.php";

use Files\Backend\AbstractBackend;
use Files\Backend\iFeatureQuota;
use Files\Backend\iFeatureVersionInfo;
use Files\Backend\iFeatureSharing;
use Files\Backend\Webdav\sabredav\FilesWebDavClient;
use Files\Backend\Exception as BackendException;
use OCSAPI\Exception\ConnectionException;
use OCSAPI\Exception\FileNotFoundException;
use OCSAPI\ocsclient;
use OCSAPI\ocsshare;
use \Sabre\DAV\Exception as Exception;
use \Sabre\HTTP\ClientException;

/**
 * This is a file backend for owncloud servers.
 * It requires the Webdav File Backend!
 *
 * @class   Backend
 * @extends AbstractBackend
 */
class Backend extends \Files\Backend\Webdav\Backend implements iFeatureSharing
{
	/**
	 * @var ocsclient The OCS Api client.
	 */
	var $ocs_client;

	/**
	 * @constructor
	 */
	function __construct()
	{

		// initialization
		$this->debug = PLUGIN_FILESBROWSER_LOGLEVEL === "DEBUG" ? true : false;

		$this->init_form();

		// set backend description
		$this->backendDescription = _("With this backend, you can connect to any ownCloud server.");

		// set backend display name
		$this->backendDisplayName = "ownCloud";

		// set backend version
		// TODO: this should be changed on every release
		$this->backendVersion = "3.0";

		// Backend name used in translations
		$this->backendTransName = _('Files ownCloud Backend: ');
	}

	/**
	 * Initialise form fields
	 */
	private function init_form()
	{
		$this->formConfig = array(
			"labelAlign" => "left",
			"columnCount" => 1,
			"labelWidth" => 80,
			"defaults" => array(
				"width" => 292
			)
		);

		$this->formFields = array(
			array(
				"name" => "server_address",
				"fieldLabel" => _('Server address'),
				"editor" => array(
					"allowBlank" => false
				)
			),
			array(
				"name" => "server_port",
				"fieldLabel" => _('Server port'),
				"editor" => array(
					"ref" => "../../portField",
					"allowBlank" => false
				)
			),
			array(
				"name" => "server_ssl",
				"fieldLabel" => _('Use SSL'),
				"editor" => array(
					"xtype" => "checkbox",
					"listeners" => array(
						"check" => "Zarafa.plugins.files.data.Actions.onCheckSSL" // this javascript function will be called!
					)
				)
			),
			array(
				"name" => "server_path",
				"fieldLabel" => _('Webdav base path'),
				"editor" => array(
					"allowBlank" => false
				)
			),
			array(
				"name" => "user",
				"fieldLabel" => _('Username'),
				"editor" => array(
					"ref" => "../../usernameField"
				)
			),
			array(
				"name" => "password",
				"fieldLabel" => _('Password'),
				"editor" => array(
					"ref" => "../../passwordField",
					"inputType" => "password"
				)
			),
			array(
				"name" => "use_grommunio_credentials",
				"fieldLabel" => _('Use grommunio credentials'),
				"editor" => array(
					"xtype" => "checkbox",
					"listeners" => array(
						"check" => "Zarafa.plugins.files.data.Actions.onCheckCredentials" // this javascript function will be called!
					)
				)
			),
		);

		$this->metaConfig = array(
			"success" => true,
			"metaData" => array(
				"fields" => $this->formFields,
				"formConfig" => $this->formConfig
			),
			"data" => array( // here we can specify the default values.
				"server_address" => $_SERVER['HTTP_HOST'],
				"server_ssl" => true,
				"server_port" => "443",
				"server_path" => "/files/remote.php/webdav",
				"use_grommunio_credentials" => true,
			)
		);
	}

	/**
	 * Opens the connection to the webdav server.
	 *
	 * @throws BackendException if connection is not successful
	 * @return boolean true if action succeeded
	 */
	public function open()
	{

		// check if curl is available
		$serverHasCurl = function_exists('curl_version');
		if (!$serverHasCurl) {
			$e = new BackendException($this->parseErrorCodeToMessage(self::WD_ERR_NO_CURL), 500);
			$e->setTitle($this->backendTransName . _('php-curl is not available'));
			throw $e;
		}

		$davsettings = array(
			'baseUri' => $this->webdavUrl(),
			'userName' => $this->user,
			'password' => $this->pass,
			'authType' => \Sabre\DAV\Client::AUTH_BASIC,
		);

		try {
			$this->sabre_client = new FilesWebDavClient($davsettings);
			$this->sabre_client->addCurlSetting(CURLOPT_SSL_VERIFYPEER, !$this->allowselfsigned);

			$this->ocs_client = new ocsclient($this->getOwncloudBaseURL(), $this->user, $this->pass, $this->allowselfsigned);

			return true;
		} catch (\Exception $e) {
			$this->log('Failed to open: ' . $e->getMessage());
			if (intval($e->getHTTPCode()) == 401) {
				$e = new BackendException($this->parseErrorCodeToMessage(self::WD_ERR_UNAUTHORIZED), $e->getHTTPCode());
				$e->setTitle($this->backendTransName . _('Access denied'));
				throw $e;
			} else {
				$e = new BackendException($this->parseErrorCodeToMessage(self::WD_ERR_UNREACHABLE), $e->getHTTPCode());
				$e->setTitle($this->backendTransName . _('Connection failed'));
				throw $e;
			}
		}
	}

	/**


	/**
	 * Copy a collection on webdav server
	 * Duplicates a collection on the webdav server (serverside).
	 * All work is done on the webdav server. If you set param overwrite as true,
	 * the target will be overwritten.
	 *
	 * @access private
	 *
	 * @param string $src_path Source path
	 * @param string $dst_path Destination path
	 * @param bool $overwrite Overwrite if collection exists in $dst_path
	 * @param bool $coll Set this to true if you want to copy a folder.
	 *
	 * @throws BackendException if request is not successful
	 *
	 * @return boolean true if action succeeded
	 */
	private function copy($src_path, $dst_path, $overwrite, $coll)
	{
		$time_start = microtime(true);
		$src_path = $this->removeSlash($src_path);
		$dst_path = $this->webdavUrl() . $this->removeSlash($dst_path);
		$this->log("[COPY] start for dir: $src_path -> $dst_path");
		if ($overwrite) {
			$overwrite = 'T';
		} else {
			$overwrite = 'F';
		}

		$settings = array("Destination" => $dst_path, 'Overwrite' => $overwrite);
		if ($coll) {
			$settings = array("Destination" => $dst_path, 'Depth' => 'Infinity');
		}

		try {
			$response = $this->sabre_client->request("COPY", $src_path, null, $settings);
			$time_end = microtime(true);
			$time = $time_end - $time_start;
			$this->log("[COPY] done in $time seconds: " . $response['statusCode']);

			return true;
		} catch (ClientException $e) {
			$e = new BackendException($this->parseErrorCodeToMessage($e->getCode()), $e->getCode());
			$e->setTitle($this->backendTransName . _('Sabre error'));
			throw $e;
		} catch (Exception $e) {
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
	private function parseErrorCodeToMessage($error_code)
	{
		$error = intval($error_code);

		$msg = _('Unknown error');
		$contactAdmin = _('Please contact your system administrator.');

		switch ($error) {
			case CURLE_BAD_PASSWORD_ENTERED:
			case self::WD_ERR_UNAUTHORIZED:
				$msg = _('Unauthorized. Wrong username or password.');
				break;
			case CURLE_SSL_CONNECT_ERROR:
			case CURLE_COULDNT_RESOLVE_HOST:
			case CURLE_COULDNT_CONNECT:
			case CURLE_OPERATION_TIMEOUTED:
			case self::WD_ERR_UNREACHABLE:
				$msg = _('File server is not reachable. Please verify the file server URL.');
				break;
			case self::WD_ERR_FORBIDDEN:
				$msg = _('You don\'t have enough permissions to view this file or folder.');
				break;
			case self::WD_ERR_NOTFOUND:
				$msg = _('The file or folder is not available anymore.');
				break;
			case self::WD_ERR_TIMEOUT:
				$msg = _('Connection to the file server timed out. Please check again later.');
				break;
			case self::WD_ERR_LOCKED:
				$msg = _('This file is locked by another user. Please try again later.');
				break;
			case self::WD_ERR_FAILED_DEPENDENCY:
				$msg = _('The request failed.') . ' ' . $contactAdmin;
				break;
			case self::WD_ERR_INTERNAL:
				// This is a general error, might be thrown due to a wrong IP, but we don't know.
				$msg = _('The file server encountered an internal problem.') . ' ' . $contactAdmin;
				break;
			case self::WD_ERR_TMP:
				$msg = _('We could not write to temporary directory.') . ' ' . $contactAdmin;
				break;
			case self::WD_ERR_FEATURES:
				$msg = _('We could not retrieve list of server features.') . ' ' . $contactAdmin;
				break;
			case self::WD_ERR_NO_CURL:
				$msg = _('PHP-Curl is not available.') . ' ' . $contactAdmin;
				break;
		}

		return $msg;
	}


	/**
	 * a simple php error_log wrapper.
	 *
	 * @access private
	 *
	 * @param string $err_string error message
	 *
	 * @return void
	 */
	private function log($err_string)
	{
		if ($this->debug) {
			error_log("[BACKEND_OWNCLOUD]: " . $err_string);
		}
	}

	/**
	 * Get the base URL of Owncloud.
	 * For example: http://demo.owncloud.com/owncloud
	 *
	 * @return string
	 */
	private function getOwncloudBaseURL()
	{
		$webdavurl = $this->webdavUrl();
		$baseurl = substr($webdavurl, 0, strlen($webdavurl) - strlen("/remote.php/webdav/"));

		return $baseurl;
	}

	/**
	 * ============================ FEATURE FUNCTIONS ========================
	 */

	/**
	 * Return the version string of the server backend.
	 * @return String
	 */
	public function getServerVersion()
	{
		// check if curl is available
		$serverHasCurl = function_exists('curl_version');
		if (!$serverHasCurl) {
			throw new BackendException($this->parseErrorCodeToMessage(self::WD_ERR_NO_CURL), 500);
		}

		$url = $this->getOwncloudBaseURL() . "/status.php";

		// try to get the contents of the owncloud status page
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_AUTOREFERER, TRUE);
		curl_setopt($ch, CURLOPT_TIMEOUT, 3); // timeout of 3 seconds
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_FOLLOWLOCATION, TRUE);
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
		} else {
			$version = "Undetected (no ownCloud?)";
		}

		return $version;
	}

	/**
	 * Get all shares in the specified folder
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
	 * @param $path
	 * @return array
	 */
	public function getShares($path)
	{
		$result = array();

		$this->log('[GETSHARES]: loading shares for folder: ' . $path);
		try {
			$this->ocs_client->loadShares($path);
		} catch(ConnectionException $e) {
			$this->log('[GETSHARES]: connection exception while loading shares: ' . $e->getMessage() . " " . $e->getCode());
		}
		$shares = $this->ocs_client->getAllShares();

		$this->log('[GETSHARES]: found ' . count($shares) . ' shares for folder: ' . $path);

		$result[$path] = array();
		if ($shares !== false ) {
			foreach ($shares as $id => $options) {
				$result[$path][$id] = array(
					"shared" => true,
					"id" => $options->getId(),
					"path" => $options->getPath(),
					"shareType" => $options->getShareType(),
					"permissions" => $options->getPermissions(),
					"expiration" => $options->getExpiration(),
					"token" => $options->getToken(),
					"url" => $options->getUrl(),
					"shareWith" => $options->getShareWith(),
					"shareWithDisplayname" => $options->getShareWithDisplayname()
				);
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
	 * @param $patharray Simple array with path's to files or folders.
	 * @return array
	 */
	public function sharingDetails($patharray)
	{
		$result = array();

		// performance optimization
		// fetch all shares - so we only need one request
		if (count($patharray) > 1) {
			try {
				$this->ocs_client->loadShares();
			} catch(ConnectionException $e) {
				$this->log('[SHARINGDETAILS]: connection exception while loading shares: ' . $e->getMessage() . " " . $e->getCode());
			}

			/** @var ocsshare[] $shares */
			$shares = $this->ocs_client->getAllShares();
			foreach ($patharray as $path) {
				$result[$path] = array();
				foreach ($shares as $id => $details) {
					if ($details->getPath() == $path) {
						$result[$path][$id] = array(
							"shared" => true,
							"id" => $details->getId(),
							"shareType" => $details->getShareType(),
							"permissions" => $details->getPermissions(),
							"expiration" => $details->getExpiration(),
							"token" => $details->getToken(),
							"url" => $details->getUrl(),
							"shareWith" => $details->getShareWith(),
							"shareWithDisplayname" => $details->getShareWithDisplayname()
						);
					}
				}
			}
		} else {
			if (count($patharray) == 1) {
				try {
					$shares = $this->ocs_client->loadShareByPath($patharray[0]);
				} catch (FileNotFoundException $e) {
					$shares = false;
				}

				$result[$patharray[0]] = array();

				if ($shares !== false) {
					foreach ($shares as $id => $share) {
						$result[$patharray[0]][$id] = array(
							"shared" => true,
							"id" => $share->getId(),
							"shareType" => $share->getShareType(),
							"permissions" => $share->getPermissions(),
							"expiration" => $share->getExpiration(),
							"token" => $share->getToken(),
							"url" => $share->getUrl(),
							"shareWith" => $share->getShareWith(),
							"shareWithDisplayname" => $share->getShareWithDisplayName()
						);
					}
				}
			} else {
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
	 * @param $shareparams
	 * @param bool $update
	 * @return bool
	 */
	public function share($shareparams, $update = false)
	{
		$result = array();
		if (count($shareparams) > 0) {

			/** @var string $path */
			foreach ($shareparams as $path => $options) {
				$path = rtrim($path, "/");
				$this->log('path: ' . $path);
				if (!$update) {
					$share = $this->ocs_client->createShare($path, $options);
					$result[$path] = array(
						"shared" => true,
						"id" => $share->getId(),
						"token" => $share->getToken(),
						"url" => $share->getUrl()
					);
				} else {
					foreach ($options as $key => $value) {
						$this->ocs_client->updateShare($path, $key, $value);
					}
					$result[$path] = array(
						"shared" => true,
						"id" => $path
					);
				}
			}
		} else {
			$this->log('No share params given');
			return false; // no shareparams...
		}
		return $result;
	}

	/**
	 * Disable sharing for the given files/folders.
	 *
	 *
	 * @param $idarray
	 * @return bool
	 * @throws \OCSAPI\Exception\ConnectionException
	 */
	public function unshare($idarray)
	{

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

?>
