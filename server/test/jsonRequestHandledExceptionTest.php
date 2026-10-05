<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/* A handled exception leaving a module still produces the bus response. */
foreach (['REQUEST_ENTRYID', 'REQUEST_START', 'REQUEST_END', 'ERROR_GROMMUNIO', 'ERROR_GENERAL'] as $index => $constant) {
	defined($constant) || define($constant, $index + 600);
}
if (!class_exists('BaseException')) {
	class BaseException extends Exception {
		public $isHandled = false;

		public function __construct($message = '', $code = 0, $previous = null, $displayMessage = null) {
			parent::__construct($message, $code, $previous);
		}

		public function setHandled(): void {
			$this->isHandled = true;
		}

		public function getFileLine() {
			return '';
		}

		public function getDisplayMessage() {
			return $this->getMessage();
		}
	}
}
require_once dirname(__DIR__) . '/includes/exceptions/class.GrommunioException.php';
require_once dirname(__DIR__) . '/includes/exceptions/class.GrommunioErrorException.php';
require_once dirname(__DIR__) . '/includes/core/class.jsonrequest.php';

if (!function_exists('json_decode_data')) {
	function json_decode_data($jsonString, $toAssoc = false) {
		return json_decode($jsonString, $toAssoc, 512, JSON_THROW_ON_ERROR);
	}
}
if (!function_exists('dump')) {
	function dump($variable, $title = '') {}
}

$GLOBALS['bus'] = new class {
	public array $data = [];

	public function reset() {
		$this->data = [];
	}

	public function notify($entryid, $event, $data = null) {}

	public function synchronizePersistentState() {
		return true;
	}

	public function addData($data) {
		$this->data[] = $data;
	}

	public function getData() {
		return $this->data;
	}
};

class HandledExceptionModule {
	public function __construct(private string $exceptionClass) {}

	public function loadSessionData() {}

	public function saveSessionData() {}

	public function closeSessionData() {}

	public function execute() {
		$GLOBALS['bus']->addData(['testmodule' => ['1' => ['error' => ['info' => ['display_message' => 'shown']]]]]);
		$e = $this->exceptionClass === GrommunioErrorException::class ?
			new GrommunioErrorException('already reported', 0, __FILE__, __LINE__) :
			new GrommunioException('already reported');
		$e->setHandled();

		throw $e;
	}
}

$checks = 0;
foreach ([GrommunioException::class, GrommunioErrorException::class] as $exceptionClass) {
	$GLOBALS['dispatcher'] = new class($exceptionClass) {
		public function __construct(private string $exceptionClass) {}

		public function loadModule($moduleName, $moduleId, $moduleData) {
			return new HandledExceptionModule($this->exceptionClass);
		}
	};
	$response = (new JSONRequest())->execute('{"grommunio":{"testmodule":{"1":{}}}}');
	if (!is_string($response) ||
		(json_decode($response, true)['grommunio'][0]['testmodule']['1']['error']['info']['display_message'] ?? null) !== 'shown') {
		throw new RuntimeException("{$exceptionClass}: a handled exception produced no response");
	}
	++$checks;
}

echo "OK: {$checks} handled exception response assertions\n";
