<?php

use PHPUnit\Framework\TestCase;

if (class_exists(TestCase::class)) {
	class_alias(TestCase::class, '\PHPUnit_Framework_TestCase');
}

if (!defined('OPENSSL_CONF_PATH')) {
	define('OPENSSL_CONF_PATH', '/etc/ssl/openssl.cnf');
}

// Mock grommunio Web Log
define('LOGLEVEL_ERROR', 0);
define('LOGLEVEL_INFO', 0);

class Log {
	public static function Write($level, $message) {}
}

abstract class SMIMETest extends PHPUnit_Framework_TestCase {}
