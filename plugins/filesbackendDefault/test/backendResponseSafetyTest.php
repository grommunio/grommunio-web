<?php

namespace Files\Backend\Webdav\sabredav {
	function curl_init($url) {
		return (object) ['url' => $url];
	}

	function curl_setopt($curl, $option, $value) {
		if (!$curl instanceof \stdClass) {
			return false;
		}

		$GLOBALS['webdavTestCurlOptions'][$option] = $value;
		if ($option === CURLOPT_FILE) {
			$GLOBALS['webdavTestFileHandle'] = $value;
		}

		return true;
	}

	function curl_exec($curl) {
		if (!$curl instanceof \stdClass) {
			throw new \RuntimeException('Unexpected WebDAV cURL handle.');
		}

		return $GLOBALS['webdavTestCurlResult'];
	}

	function curl_error($curl) {
		return $curl instanceof \stdClass ? 'transport failed' : 'invalid handle';
	}

	function curl_getinfo($curl, $option) {
		return $curl instanceof \stdClass && $option === CURLINFO_HTTP_CODE ? $GLOBALS['webdavTestHttpStatus'] : null;
	}
}

namespace OCSAPI {
	function curl_init() {
		return new \stdClass();
	}

	function curl_setopt($curl, $option, $value) {
		$GLOBALS['ocsTestCurlOptions'][$option] = $value;

		return $curl instanceof \stdClass;
	}

	function curl_setopt_array($curl, $options) {
		$GLOBALS['ocsTestCurlOptions'] += $options;

		return $curl instanceof \stdClass;
	}

	function curl_exec($curl) {
		if (!$curl instanceof \stdClass) {
			throw new \RuntimeException('Unexpected OCS cURL handle.');
		}

		return $GLOBALS['ocsTestCurlResponse'];
	}

	function curl_getinfo($curl, $option) {
		return $curl instanceof \stdClass && $option === CURLINFO_HTTP_CODE ? $GLOBALS['ocsTestHttpStatus'] : null;
	}

	function curl_errno($curl) {
		return $curl instanceof \stdClass ? 0 : CURLE_FAILED_INIT;
	}
}

namespace {
	if (!extension_loaded('curl') || !class_exists(SimpleXMLElement::class)) {
		return;
	}

	require_once dirname(__DIR__, 2) . '/files/php/Files/Backend/Webdav/class.backend.php';
	require_once dirname(__DIR__) . '/php/lib/ocsapi/class.ocsclient.php';

	use Files\Backend\Webdav\Backend;
	use Files\Backend\Webdav\sabredav\FilesWebDavClient;
	use OCSAPI\Exception\InvalidResponseException;
	use OCSAPI\ocsclient;
	use Sabre\DAV\Exception as DavException;

	class TestableWebdavBackend extends Backend {
		public function parseServerVersion($response) {
			return $this->parseServerVersionResponse($response);
		}
	}

	function assertBackendResponse($condition, $message) {
		if (!$condition) {
			throw new RuntimeException($message);
		}
	}

	$backendReflection = new ReflectionClass(TestableWebdavBackend::class);
	$backend = $backendReflection->newInstanceWithoutConstructor();
	assertBackendResponse($backend->parseServerVersion('{"versionstring":"10.15.7"}') === '10.15.7', 'A valid version response was rejected.');
	assertBackendResponse($backend->parseServerVersion('{invalid') === null, 'Malformed version JSON was accepted.');
	assertBackendResponse($backend->parseServerVersion('{"versionstring":10}') === null, 'A non-string version was accepted.');
	assertBackendResponse($backend->parseServerVersion(true) === null, 'A boolean cURL response was accepted as version JSON.');

	$GLOBALS['ocsTestHttpStatus'] = 200;
	$GLOBALS['ocsTestCurlResponse'] = '<ocs><meta><statuscode>100</statuscode><message>OK</message></meta><data/></ocs>';
	$GLOBALS['ocsTestCurlOptions'] = [];
	$ocsClient = new ocsclient('https://cloud.example.test', 'user', 'password');
	$ocsClient->loadShares();
	assertBackendResponse($ocsClient->getAllShares() === [], 'A valid empty OCS response was not parsed.');

	$GLOBALS['ocsTestCurlResponse'] = true;

	try {
		$ocsClient->loadShares();

		throw new RuntimeException('A boolean OCS response was accepted.');
	}
	catch (InvalidResponseException $e) {
		assertBackendResponse($e->getMessage() === 'Invalid response body', 'The OCS response error was not preserved.');
	}

	try {
		$ocsClient->getRecipients('user');

		throw new RuntimeException('A boolean recipient response was accepted.');
	}
	catch (InvalidResponseException $e) {
		assertBackendResponse($e->getMessage() === 'Invalid response body', 'The recipient response error was not preserved.');
	}

	$destination = tempnam(sys_get_temp_dir(), 'webdav-response-test-');
	if ($destination === false) {
		throw new RuntimeException('Unable to create the WebDAV test file.');
	}

	try {
		$webdavClient = new FilesWebDavClient([
			'baseUri' => 'https://cloud.example.test/',
			'userName' => 'user',
			'password' => 'password',
		]);
		$webdavClient->addCurlSetting(CURLOPT_SSL_VERIFYPEER, false);
		$webdavClient->addCurlSetting(CURLOPT_CAINFO, '/test/ca.pem');
		$GLOBALS['webdavTestCurlOptions'] = [];
		$GLOBALS['webdavTestCurlResult'] = false;
		$GLOBALS['webdavTestHttpStatus'] = 0;

		try {
			$webdavClient->getFile('document.txt', $destination);

			throw new RuntimeException('A failed WebDAV transfer was accepted.');
		}
		catch (DavException $e) {
			assertBackendResponse($e->getMessage() === '[CURL] transport failed', 'The WebDAV transport error was not reported.');
		}
		assertBackendResponse(!is_resource($GLOBALS['webdavTestFileHandle']), 'The WebDAV destination handle was left open.');
		assertBackendResponse($GLOBALS['webdavTestCurlOptions'][CURLOPT_SSL_VERIFYPEER] === false, 'The configured TLS verification mode was ignored.');
		assertBackendResponse($GLOBALS['webdavTestCurlOptions'][CURLOPT_CAINFO] === '/test/ca.pem', 'The configured CA file was ignored.');

		$GLOBALS['webdavTestCurlResult'] = true;
		$GLOBALS['webdavTestHttpStatus'] = 200;
		$response = $webdavClient->getFile('document.txt', $destination);
		assertBackendResponse($response === ['statusCode' => 200], 'A successful WebDAV transfer was not reported.');
		assertBackendResponse(!is_resource($GLOBALS['webdavTestFileHandle']), 'The successful WebDAV destination handle was left open.');
	}
	finally {
		if (is_file($destination)) {
			unlink($destination);
		}
	}
}
