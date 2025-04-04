<?php

/**
 * File plugin webdav client.
 * Overrides the request function to add support for downloading really large files with less memory.
 */

namespace Files\Backend\Webdav\sabredav;

use Sabre\DAV\Client;
use Sabre\DAV\Exception;
use Sabre\DAV\Exception\BadRequest;
use Sabre\DAV\Exception\Conflict;
use Sabre\DAV\Exception\Forbidden;
use Sabre\DAV\Exception\InsufficientStorage;
use Sabre\DAV\Exception\MethodNotAllowed;
use Sabre\DAV\Exception\NotAuthenticated;
use Sabre\DAV\Exception\NotFound;
use Sabre\DAV\Exception\NotImplemented;
use Sabre\DAV\Exception\PaymentRequired;
use Sabre\DAV\Exception\PreconditionFailed;
use Sabre\DAV\Exception\RequestedRangeNotSatisfiable;

include __DIR__ . "/vendor/autoload.php";

class FilesWebDavClient extends Client {
	/**
	 * @var string
	 */
	public $userName;

	/**
	 * @var string
	 */
	public $password;

	public function __construct(array $settings) {
		if (isset($settings['userName'])) {
			$this->userName = $settings['userName'];
		}
		if (isset($settings['password'])) {
			$this->password = $settings['password'];
		}
		parent::__construct($settings);
	}

	/**
	 * Performs an actual HTTP request, and returns the result.
	 *
	 * If the specified url is relative, it will be expanded based on the base
	 * url.
	 *
	 * The returned array contains 3 keys:
	 *   * body - the response body
	 *   * httpCode - a HTTP code (200, 404, etc)
	 *   * headers - a list of response http headers. The header names have
	 *     been lowercased.
	 *
	 * @param string $url
	 * @param string $dstpath
	 * @param array  $headers
	 *
	 * @return array
	 */
	public function getFile($url, $dstpath, $headers = []) {
		if (empty($url)) {
			throw new Exception('Empty path');
		}
		$url = $this->getAbsoluteUrl($url);
		$file_handle = fopen($dstpath, "w");

		if (!$file_handle) {
			throw new Exception('[CURL] Error writing to temporary file! (' . $dstpath . ')');
		}

		// straight up curl instead of sabredav here, sabredav put's the entire get result in memory
		$curl = curl_init($url);

		if ($this->verifyPeer !== null) {
			curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, $this->verifyPeer);
		}
		if ($this->trustedCertificates) {
			curl_setopt($curl, CURLOPT_CAINFO, $this->trustedCertificates);
		}

		curl_setopt($curl, CURLOPT_USERPWD, $this->userName . ":" . $this->password);
		curl_setopt($curl, CURLOPT_FILE, $file_handle);
		curl_setopt($curl, CURLOPT_FOLLOWLOCATION, true);
		curl_setopt($curl, CURLOPT_PROTOCOLS, CURLPROTO_HTTP | CURLPROTO_HTTPS);
		curl_setopt($curl, CURLOPT_REDIR_PROTOCOLS, CURLPROTO_HTTP | CURLPROTO_HTTPS);

		curl_exec($curl);

		$statusCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);

		curl_close($curl);

		$response = [
			'statusCode' => $statusCode,
		];

		if ($response['statusCode'] >= 400) {
			switch ($response['statusCode']) {
				case 400 :
					throw new BadRequest('Bad request');

				case 401 :
					throw new NotAuthenticated('Not authenticated');

				case 402 :
					throw new PaymentRequired('Payment required');

				case 403 :
					throw new Forbidden('Forbidden');

				case 404:
					throw new NotFound('Resource not found.');

				case 405 :
					throw new MethodNotAllowed('Method not allowed');

				case 409 :
					throw new Conflict('Conflict');

				case 412 :
					throw new PreconditionFailed('Precondition failed');

				case 416 :
					throw new RequestedRangeNotSatisfiable('Requested Range Not Satisfiable');

				case 500 :
					throw new Exception('Internal server error');

				case 501 :
					throw new NotImplemented('Not Implemented');

				case 507 :
					throw new InsufficientStorage('Insufficient storage');

				default:
					throw new Exception('HTTP error response. (errorcode ' . $response['statusCode'] . ')');
			}
		}

		return $response;
	}

	public function uploadChunkedFile($destination, $resource) {
		return $this->request("PUT", $destination, $resource);
	}
}
