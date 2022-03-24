<?php
namespace OCSAPI;

require_once __DIR__ . "/class.ocsshare.php";
require_once __DIR__ . "/Exception/class.ConnectionException.php";
require_once __DIR__ . "/Exception/class.FileNotFoundException.php";
require_once __DIR__ . "/Exception/class.InvalidArgumentException.php";
require_once __DIR__ . "/Exception/class.PermissionDeniedException.php";
require_once __DIR__ . "/Exception/class.InvalidResponseException.php";
require_once __DIR__ . "/Exception/class.InvalidRequestException.php";
require_once __DIR__ . "/class.ocsshare.php";

use OCSAPI\Exception\ConnectionException;
use OCSAPI\Exception\InvalidRequestException;
use OCSAPI\Exception\InvalidResponseException;
use OCSAPI\Exception\FileNotFoundException;
use OCSAPI\Exception\InvalidArgumentException;
use OCSAPI\Exception\PermissionDeniedException;

/**
 * This class provides basic functionality to interact with the owncloud sharing api (OCS).
 * For mor details read here: https://doc.owncloud.org/server/8.0/developer_manual/core/ocs-share-api.html
 *
 * ATTENTION: currently there is a bug in the owncloud API implementation:
 * https://github.com/owncloud/core/issues/10671
 * https://github.com/owncloud/core/issues/14826
 * Updating the password will change the share ID.
 *
 *
 * @class   ocsclient
 */
class ocsclient {
	/**
	 * OCS Sharing API
	 */
	const OCS_PATH = "/ocs/v1.php/apps/files_sharing/api/v1";
	const OCS_TIMEOUT = 10;

	/**
	 * @var string Server base URL
	 */
	private $baseurl = "";
	/**
	 * @var string Username
	 */
	private $user = "";
	/**
	 * @var string Password
	 */
	private $pass = "";
	/**
	 * @var bool Allow self signed certs
	 */
	private $allowSelfSignedCerts = false;

	/**
	 * @var bool Defines if the store has been loaded
	 */
	private $loaded = false;

	/**
	 * @var ocsshare[] This will hold an array of ocsshares - index is the share ID.
	 */
	private $shares;

	/**
	 * @var array default curl options used for all requests 
	 */
	private $curlDefaultOptions = array(
		CURLOPT_AUTOREFERER => TRUE,
		CURLOPT_TIMEOUT => self::OCS_TIMEOUT,
		CURLOPT_RETURNTRANSFER => 1,
		CURLOPT_FOLLOWLOCATION  => TRUE,
		CURLOPT_HTTPHEADER => array('OCS-APIREQUEST: true')
	);

	/**
	 * @var array curl SSL verify options for self signed certificates 
	 */
	private $curlSSLVerifyOptions = array(
		CURLOPT_SSL_VERIFYHOST => 0,
		CURLOPT_SSL_VERIFYPEER => 0
	);
	/**
	 * Constructor.
	 *
	 * @param $baseurl
	 * @param $user
	 * @param $pass
	 * @param $allowSelfSignedCerts
	 * @throws ConnectionException
	 */
	function __construct($baseurl, $user, $pass, $allowSelfSignedCerts = false) {
		// check if curl is available
		$serverHasCurl = function_exists('curl_version');
		if (!$serverHasCurl) {
			throw new ConnectionException("Curl not found!");
		}

		$this->baseurl = $baseurl;
		$this->user = $user;
		$this->pass = $pass;
		$this->allowSelfSignedCerts = $allowSelfSignedCerts;

		$this->shares = array();
		$this->sharesByPath = array();
	}

	/**
	 * Get the base URL for OCS.
	 *
	 * @return string
	 */
	private function getOCSUrl() {
		return $this->baseurl . self::OCS_PATH . "/shares";
	}

	/**
	 * Shortcut for curl get requests
	 * @param $url string URL for the request
	 * @return curl response data
	 */
	private function doCurlGetRequest($url) {
		return $this->doCurlRequest($url, array());
	}
	/**
	 * Execute curl request with paramters
	 *
	 * @param $url string URL for the request
	 * @return curl responsedata
	 * @throws ConnectionException
	 * @throws InvalidResponseException
	 */
	private function doCurlRequest($url, $curlOptions) {
		$ch = curl_init();

		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt_array($ch, $this->curlDefaultOptions);
		if ($this->allowSelfSignedCerts) {
			curl_setopt_array($ch, $this->curlSSLVerifyOptions);
		}
		curl_setopt($ch, CURLOPT_USERPWD, $this->user . ":" . $this->pass);
		if (!empty($curlOptions)) {
			curl_setopt_array($ch, $curlOptions);
		}

		$responsedata = curl_exec($ch);
		$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

		if($httpcode == 0) {
			$message = curl_errno($ch);
		} else {
			$message = $httpcode;
		}
		curl_close($ch);

		if ($httpcode && $httpcode == "200") {
			$this->loaded = true;
			return $responsedata;
		}
		$this->loaded = false;
		if ($httpcode == "0") {
			throw new ConnectionException($message, $httpcode);
		} else {
			throw new ConnectionException($httpcode);
		}
	}

	/**
	 * Loads the shares for a specific folder.
	 * If $path is empty all shares will loaded.
	 *
	 * @param string $path
	 * @throws ConnectionException
	 * @throws InvalidResponseException
	 */
	public function loadShares($path = "") {

		// reset all loaded shares first
		$this->reset();

		if(empty($path)) {
			$url = $this->getOCSUrl();
		} else {
			$url = $this->getOCSUrl() . "?path=" . urlencode($path) . "&subfiles=true";
		}
		$this->parseListingResponse($this->doCurlGetRequest($url));
		$this->loaded = true;
	}

	/**
	 * Loads only one specific share defined by ID.
	 *
	 * @param $id
	 * @return ocsshare or FALSE
	 * @throws ConnectionException
	 * @throws InvalidResponseException
	 */
	public function loadShareByID($id) {

		$url = $this->getOCSUrl() . "/" . $id;
		$this->parseListingResponse($this->doCurlGetRequest($url));
		$this->loaded = true;
		if(isset($this->shares[$id])) {
			return $this->shares[$id];
		} else {
			return false;
		}
	}

	/**
	 * Loads one or more shares defined by path.
	 *
	 * @param $path
	 * @return ocsshare[] or FALSE
	 * @throws ConnectionException
	 * @throws InvalidResponseException
	 */
	public function loadShareByPath($path) {
		$path = rtrim($path, "/");
		$url = $this->getOCSUrl() . "?path=" . urlencode($path);
		$this->parseListingResponse($this->doCurlGetRequest($url));
		$this->loaded = true;
		$shares = array();
		foreach ($this->shares as $id => $details) {
			if($details->getPath() == $path) {
				$shares[$id] = $details;
			}
		}
		if(count($shares) > 0) {
			return $shares;
		} else {
			return false;
		}
	}

	/**
	 * Gets all groups and users we can share with.
	 *
	 * @return [] or FALSE
	 * @throws ConnectionException
	 * @throws InvalidResponseException
	 */
	public function getRecipients($search) {
		$url = $this->baseurl . self::OCS_PATH . "/sharees?itemType=file&search=" . urlencode($search) ;

		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt_array($ch, $this->curlDefaultOptions);
		if ($this->allowSelfSignedCerts) {
			curl_setopt_array($ch, $this->curlSSLVerifyOptions);
		}
		curl_setopt($ch, CURLOPT_USERPWD, $this->user . ":" . $this->pass);
		$responsedata = curl_exec($ch);
		$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
		curl_close($ch);

		if ($httpcode === 200) {
			try {
				$xmldata = new \SimpleXMLElement($responsedata);
			} catch (\Exception $e) {
				throw new InvalidResponseException($responsedata);
			}

			if(!$xmldata || !isset($xmldata->meta) || !$this->parseResponseMeta($xmldata->meta) || !isset($xmldata->data)) {
				return false;
			}

			return $this->parseRecipientData($xmldata->data);
		} else {
			throw new ConnectionException($httpcode);
		}
	}

	/**
	 * Get all loaded shares. Will return FALSE if the store is not loaded yet.
	 *
	 * @return ocsshare or FALSE
	 */
	public function getAllShares() {
		if(!$this->loaded) {
			return FALSE;
		}

		return $this->shares;
	}


	/**
	 * Returns one ocsshare specified by ID. Or FALSE if the ID was not found or store is not loaded yet.
	 *
	 * @param $id
	 * @return ocsshare or bool
	 */
	public function getShareByID($id) {
		if(!$this->loaded) {
			return FALSE;
		}

		if(isset($this->shares[$id])) {
			return $this->shares[$id];
		} else {
			return FALSE;
		}
	}

	/**
	 * Returns one or many ocsshare specified by Path. Or FALSE if path was not found or store is not loaded yet.
	 *
	 * @param $path
	 * @return ocsshare[] or bool
	 */
	public function getShareByPath($path) {
		if(!$this->loaded) {
			return FALSE;
		}

		$shares = array();

		foreach ($this->shares as $id => $details) {
			if($details->getPath() == $path) {
				$shares[$id] = $details;
			}
		}

		if(count($shares) > 0) {
			return $shares;
		} else {
			return FALSE;
		}
	}

	/**
	 * Create a new share on the server.
	 * Optionnames in $options should match Owncloud option names.
	 * See: https://doc.owncloud.org/server/8.0/developer_manual/core/ocs-share-api.html
	 *
	 * Options has to include shareType (int),  ‘0’ = user; ‘1’ = group; ‘3’ = public link;
	 * and shareWith for shareType 0 or 1.
	 *
	 * @param $path
	 * @param $options
	 * @return ocsshare
	 * @throws ConnectionException
	 * @throws InvalidResponseException
	 */
	public function createShare($path, $options) {
		$url = $this->getOCSUrl();

		// post variables
		$fields = array(
			'path' => urlencode($path)
		);

		foreach($options as $key => $value) {
			$fields[$key] = urlencode($value);
		}
		//url-ify the data for the POST
		$fields_string = "";
		foreach($fields as $key=>$value) {
			$fields_string .= $key.'='.$value.'&';
		}
		rtrim($fields_string, '&');
		$curlExtraOptions = array(
			CURLOPT_POST => 1,
			CURLOPT_POSTFIELDS => $fields_string
		);
		return $this->parseModificationResponse($this->doCurlRequest($url, $curlExtraOptions));
	}

	/**
	 * Update one value of the given share. ATTENTION: updating the password will change the share id.
	 *
	 * @param $id
	 * @param $key
	 * @param $value
	 * @return ocsshare Returns a empty share
	 * @throws ConnectionException
	 * @throws InvalidResponseException
	 */
	public function updateShare($id, $key, $value) {
		$url = $this->getOCSUrl() . "/" . $id;

		// post variables
		$fields_string = $key.'='.urlencode($value);
		$curlExtraOptions = array(
			CURLOPT_CUSTOMREQUEST => "PUT",
			CURLOPT_POSTFIELDS => $fields_string
		);
		return $this->parseModificationResponse($this->doCurlRequest($url, $curlExtraOptions));
	}

	/**
	 * Clear all loaded shares.
	 */
	public function reset() {
		unset($this->sharesByPath);
		$this->sharesByPath = array();

		unset($this->shares);
		$this->shares = array();
	}

	/**
	 * Delete the given share.
	 *
	 * @param $id
	 * @return ocsshare Returns a empty share
	 * @throws ConnectionException
	 * @throws InvalidResponseException
	 */
	public function deleteShare($id) {
		$url = $this->getOCSUrl() . "/" . $id;

		$curlExtraOptions = array(
			CURLOPT_CUSTOMREQUEST => "DELETE",
		);
		return $this->parseModificationResponse($this->doCurlRequest($url, $curlExtraOptions));
	}


	/**
	 * Parse the response of a create or modify request.
	 *
	 * @param $response
	 * @return ocsshare
	 * @throws FileNotFoundException
	 * @throws InvalidArgumentException
	 * @throws InvalidRequestException
	 * @throws InvalidResponseException
	 * @throws PermissionDeniedException
	 */
	private function parseModificationResponse($response) {
		if($response) {
			try {
				$xmldata = new \SimpleXMLElement($response);
			} catch (\Exception $e) {
				throw new InvalidResponseException($response);
			}

			if($xmldata) {
				$ok = false;
				if(isset($xmldata->meta)) {
					$ok = $this->parseResponseMeta($xmldata->meta);
				}

				if ($ok) {
					// create a new ocsshare
					if(isset($xmldata->data)) {
						return new ocsshare($xmldata->data);
					} else {
						return FALSE;
					}
				}
			}
		} else {
			throw new InvalidResponseException($response);
		}

		return FALSE;
	}

	/**
	 * Parse the request response.
	 *
	 * @param $response
	 * @throws FileNotFoundException
	 * @throws InvalidArgumentException
	 * @throws InvalidRequestException
	 * @throws InvalidResponseException
	 * @throws PermissionDeniedException
	 */
	private function parseListingResponse($response) {
		if (!$response) {
			throw new InvalidResponseException($response);
		}

		try {
			$xmldata = new \SimpleXMLElement($response);
		} catch (\Exception $e) {
			throw new InvalidResponseException($response);
		}

		if ($xmldata) {
			$ok = false;
			if (isset($xmldata->meta)) {
				$ok = $this->parseResponseMeta($xmldata->meta);
			}

			if ($ok) {
				if (isset($xmldata->data)) {
					$this->parseResponseData($xmldata->data);
				}
			}
		}
	}

	/**
	 * Parse the response meta block and its error codes.
	 *
	 * @param $response
	 * @return bool
	 * @throws FileNotFoundException
	 * @throws InvalidArgumentException
	 * @throws InvalidRequestException
	 * @throws InvalidResponseException
	 * @throws PermissionDeniedException
	 */
	private function parseResponseMeta($response) {
		if($response) {
			$statuscode = intval($response->statuscode);
			$message = $response->message;

			// check status code - it must be 100, otherwise it failed
			if($statuscode == 100) {
				return true;
			} else {
				switch($statuscode) {
					case 400:
						throw new InvalidArgumentException($message);
						break;
					case 403:
						throw new PermissionDeniedException($message);
						break;
					case 404:
						throw new FileNotFoundException($message);
						break;
					case 999:
						throw new InvalidRequestException($message);
						break;
					default:
						throw new InvalidResponseException($message);
				}
			}
		} else {
			throw new InvalidResponseException("Response contains no meta block.");
		}
	}

	/**
	 * Parse the response data block.
	 *
	 * @param SimpleXMLElement $response from owncloud server
	 */
	private function parseResponseData($response) {
		// parse each element in the data section
		foreach($response->element as $element) {
			$parsedShare = new ocsshare($element);
			$parsedShare->generateShareURL($this->baseurl);

			$this->shares[$parsedShare->getId()] = $parsedShare;
		}
	}

	/**
	 * Parse the response data for recipients.
	 * Converts the xml response data to an array,
	 *  [[label, shareWith, shareType], ...]
	 * where 
	 *  - label is the display name
	 *  - shareWith is the user or group id
	 *  - shareType is type of the recipient: user or group 
	 *
	 * @param SimpleXMLElement $response the response data from the request
	 * @return Array array of recipients
	 */
	private function parseRecipientData($response) {
		$result = [];
		foreach ($response->exact->users->element as $user) {
			$result[] = [
				$user->label->__toString(),
				$user->value->shareWith->__toString(),
				$user->value->shareType->__toString()
			];
		}
		foreach ($response->users->element as $user) {
			$result[] = [
				$user->label->__toString(),
				$user->value->shareWith->__toString(),
				$user->value->shareType->__toString()
			];
		}
		foreach ($response->exact->groups->element as $group) {
			$result[] = [
				$group->label->__toString(),
				$group->value->shareWith->__toString(),
				$group->value->shareType->__toString()
			];
		}
		foreach ($response->groups->element as $group) {
			$result[] = [
				$group->label->__toString(),
				$group->value->shareWith->__toString(),
				$group->value->shareType->__toString()
			];
		}
		return $result;
	}
}
