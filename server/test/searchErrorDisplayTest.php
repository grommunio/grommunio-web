<?php

/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

if (function_exists('mapi_last_hresult')) {
	echo "Search error display check skipped with php-mapi loaded\n";

	return;
}

defined('NOERROR') || define('NOERROR', 0);
defined('MAPI_E_NO_ACCESS') || define('MAPI_E_NO_ACCESS', 0x80070005);

// declared conditionally so they are not hoisted ahead of the guard
if (!function_exists('mapi_last_hresult')) {
	function mapi_last_hresult() {
		return $GLOBALS['hresult'];
	}

	function mapi_strerror($code) {
		return $code == NOERROR ? 'The operation succeeded' : 'Access denied';
	}
}
if (!class_exists('BaseException')) {
	class BaseException extends Exception {
		public $displayMessage;

		public function __construct(string $errorMessage, int $code = 0, ?Throwable $previous = null, ?string $displayMessage = null) {
			parent::__construct($errorMessage, $code, $previous);
			$this->displayMessage = $displayMessage;
		}

		public function getDisplayMessage(): string {
			return $this->displayMessage ?? $this->getMessage();
		}

		public function setDisplayMessage(string $message): void {
			$this->displayMessage = $message . " (" . mapi_strerror($this->getCode()) . ")";
		}
	}
}

defined('BASE_PATH') || define('BASE_PATH', dirname(__DIR__, 2) . '/');
require_once dirname(__DIR__) . '/includes/exceptions/class.GrommunioException.php';
require_once dirname(__DIR__) . '/includes/exceptions/class.SearchException.php';
require_once dirname(__DIR__) . '/includes/modules/class.module.php';
require_once dirname(__DIR__) . '/includes/modules/class.listmodule.php';

$module = (new ReflectionClass('ListModule'))->newInstanceWithoutConstructor();

function searchDisplayMessage($module, $hresult) {
	$GLOBALS['hresult'] = $hresult;

	try {
		$module->sendSearchErrorToClient(null, null, [], ['error_message' => 'Search failed.', 'original_error_message' => 'backend']);
	}
	catch (SearchException $e) {
		return $e->getDisplayMessage();
	}

	throw new RuntimeException('No search exception was thrown.');
}

if (($message = searchDisplayMessage($module, NOERROR)) !== 'Search failed.') {
	throw new RuntimeException("A successful hresult was appended: {$message}");
}
if (($message = searchDisplayMessage($module, MAPI_E_NO_ACCESS)) !== 'Search failed. (Access denied)') {
	throw new RuntimeException("A failing hresult was not appended: {$message}");
}

echo "Search error display checks passed\n";
